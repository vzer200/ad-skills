# 采集器改造：从常驻守护进程改为定时任务 v2

> 日期: 2026-05-20 | 状态: 3-agent 审核修订

## 1. 方案

**一个脚本，一件事：拉趋势 API `last-hour` → 写入 SQLite → 跑 3σ → 输出报告。定时由平台调度（cron/任务计划），不在脚本内实现。**

```bash
# 单次执行（平台每 55 分钟调度一次）
python scripts/collector.py collect --hosts "AD1,AD2" --password xxx
```

脚本执行流程：
```
1. _fetch_vs_names()       → 获取设备上所有 VS 名
2. get_vs_trend_by_name()  → 每个 VS 调 trend API last-hour (~60 点/指标)
3. _inject_trend_into_db() → 推算时间戳，INSERT OR REPLACE 写入 SQLite
4. query_traffic_db()      → 重新查询（此时有 ≥60 行/指标）
5. _run_3sigma_on_vs_group → 3σ 异常检测
6. render_markdown()       → 输出报告
```

耗时 < 5s，无平台超时问题。

## 2. 为什么 last-hour

实测 `get_vs_trend_by_name('test', trend='last-hour')` 返回：
```json
{"items": [
  {"name": "connection_rate", "values": [1340, 1327, 1379, ...], "unit": "REQUEST-PER-SECOND"},
  {"name": "connection", "values": [13425, 13306, ...], "unit": "COUNT"}
]}
```
- `values` 数组长度 ~60，每个值对应一分钟的聚合数据
- `values[0]` = 最旧（60 分钟前），`values[-1]` = 最新（1 分钟前），步长 60s
- 60 个点 > 3σ 的 `min_window=30`，冷启动立即可用

## 3. 时间戳合成

趋势 API 不返回时间戳。合成规则：
```python
ts = int(time.time()) - (n - i) * 60
# i=0 → ts = now - n*60    (最旧：60 分钟前)
# i=n-1 → ts = now - 60     (最新：1 分钟前)
```

所有 ts 在同一时钟域（本地 `time.time()`），3σ 滑动窗口只关心相对排序，不受影响。

## 4. 函数放置

`_inject_trend_into_db` 放在 `collector.py` 中（数据库写入是采集器职责）。`perception.py` 保持只读。

```
collector.py:
  _inject_trend_into_db(db_path, vs_name, trend_data) → int  # 新增
  collect_once(client, db_path) → int                        # 新增
  collect_and_analyze(client, db_path) → dict                # 新增

perception.py:
  traffic_analysis() → 增加灌入分支（SQLite 空时先灌入再查）  # 修改
```

## 5. 数据缺口处理

**short downtime（< 5h）**：下次运行时，`last-hour` 覆盖最近 60 分钟，产生最多 4 小时缺口。但在 6 小时 3σ 窗口内仍有足够数据点进行检测，不会影响当前报告的准确性。

**long downtime（> 5h）**：大部分历史数据超出 6h 窗口，对当前 3σ 无影响。冷启动效应——需累积一次运行后才恢复完整基线。

不做补采。缺口数据对实时异常检测无影响。

## 6. CLI 设计

```bash
# 采集+分析（替代原守护进程，供平台定时调度）
python scripts/collector.py collect --hosts "AD1,AD2" --password xxx [--db vs_samples.db]

# 单设备
python scripts/collector.py collect --host AD1 --password xxx

# 保留原守护进程模式（标记 deprecated）
python scripts/collector.py daemon --host AD1 --password xxx
```

不实现 `--interval` 参数在 `collect` 子命令中——调度间隔由平台控制。

## 7. 改动清单

| # | 文件 | 改动 | 行数 |
|---|------|------|------|
| 1 | `collector.py` | 新增 `_inject_trend_into_db()` | ~35 |
| 2 | `collector.py` | 新增 `collect_once()` | ~20 |
| 3 | `collector.py` | 新增 `collect_and_analyze()` | ~15 |
| 4 | `collector.py` | CLI 改为子命令模式 (`collect`/`daemon`) | ~50 |
| 5 | `perception.py` | `traffic_analysis()` 增加灌入分支 | ~25 |
| 6 | `test/test_perception.py` | 新增测试 | ~50 |
| 7 | `ad-perception/SKILL.md` | 更新文档 | ~10 |

## 8. 不变约束

- `daemon` 子命令保留完整原守护进程功能（PID 文件、信号处理、stop_event）
- 数据库格式完全不变
- `perception.py analyze` 不受影响
- 多设备 `--hosts` 复用现有 `run_multi` 机制
- 不引入新的外部依赖
