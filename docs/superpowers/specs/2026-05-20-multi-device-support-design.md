# AD Skills 多设备支持 设计文档

> 日期: 2026-05-20 | 状态: v2 (4-agent 并行审核后修订) | 实现方式: ThreadPoolExecutor + threading.Event

## 1. 背景

当前所有 4 个 Skill 只接受单个 `--host`，不支持多设备批量操作。

## 2. 设计决策

### 2.1 整体方案

**ThreadPoolExecutor 并行 + `--hosts` 逗号分隔为主，`--devices` JSON 为辅。**

```bash
# 同密码多设备（推荐，覆盖 90% 场景）
python overview.py all --hosts "https://192.168.8.30,https://192.168.8.31" --password xxx

# 异密码多设备（高级选项）
python overview.py all --devices devices.json
```

- **`--hosts` 为主推**：LLM 一次调用完成，无需创建文件
- **`--devices` 为备选**：仅当设备密码不同时使用
- `--host` 单设备模式完全保留

### 2.2 并行模型

```python
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FutureTimeout

MAX_WORKERS = 10  # 硬上限，防止 API 限流

def run_multi(devices, func, **kwargs):
    """
    devices: list of dicts [{host, user, password, name}, ...]
    func: callable(client, **kwargs) -> result dict
    kwargs: 公共参数传给 func（如 subcommand, scene, work_dir_base 等）
    """
    results = {}
    total_timeout = kwargs.pop("_timeout", 900)  # 最长 15 分钟
    with ThreadPoolExecutor(max_workers=min(len(devices), MAX_WORKERS)) as ex:
        futures = {}
        for d in devices:
            client = ADClient(
                host=d["host"],
                username=d.get("user", "admin"),
                password=d.get("password", kwargs.get("password", ""))
            )
            # 只传 func 需要的参数，不是 **d
            futures[ex.submit(func, client, **kwargs)] = d

        deadline = time.monotonic() + total_timeout
        for f in as_completed(futures, timeout=total_timeout):
            d = futures[f]
            remaining = deadline - time.monotonic()
            try:
                if remaining <= 0:
                    raise FutureTimeout("全局超时")
                results[d["host"]] = f.result(timeout=max(remaining, 1))
            except FutureTimeout:
                results[d["host"]] = {"error": "超时（仍在执行）"}
            except Exception as e:
                results[d["host"]] = {"error": f"{type(e).__name__}: {e}"}
    return results
```

**关键设计约束**：
- `func` 签名统一为 `func(client, **kwargs)` — 不接受设备字典展开
- 被 submit 的函数**不得调用 `sys.exit()`**，必须通过异常或返回值报告错误
- `as_completed(timeout=...)` 防止单设备永久挂起阻塞全部
- `max_workers` 硬上限 10，防止 API 限流
- 线程超时后不强制终止（Python 限制），标注"仍在执行"

### 2.3 各脚本改动

#### overview.py

- 新增 `--hosts` 参数（逗号分隔）
- 提交给线程的函数：`_overview_one(client, subcommand)`  → 调用 `build_overview()` + `render_markdown()`
- 输出：每设备 `## {name or host}` 分块
- 退出码：全部成功 → 0，部分失败 → 6，全部失败 → 1

#### perception.py

- 新增 `--hosts` 参数
- 提交函数：`_analyze_one(client, db_path, disk_source)` → 调用 `analyze_full()`
- 采集器改造见 2.4
- 退出码同上

#### check.py

- 巡检流程必须合并为原子操作（不能拆 run + wait 两步）
- 新增内部函数 `_check_one(client, scene, force, work_dir)`：
  1. `start_check(client, scene, force, work_dir)` — 启动
  2. `wait_and_download(client, work_dir, _sleeper=time.sleep)` — 轮询+下载
  3. `analyze(ad_json)` — 分析
  4. `render_markdown(analysis, meta)` — 渲染
  5. 返回结果 dict
- work_dir 自动派生：`{tmp}/ad_check_{host_slug}/`（slug = host 去特殊字符）
- 退出码同上
- **子命令支持矩阵**：

| 子命令 | 多设备 | 说明 |
|--------|--------|------|
| `run` | ✅ | `--hosts` 并行启动多台巡检 |
| `scenes` | ❌ | 无意义（场景列表是设备相关的） |
| `progress` | ❌ | 单设备查询 |
| `history` | ✅ | 并行查询多台历史 |
| `analyze` | ❌ | 用 `--path` 不连设备 |

#### blackbox.py

- 新增 `--hosts` 参数
- 提交函数：`_blackbox_one(client, from_date, to_date, archive_password, output_dir)` → 完整导出流程
- 每设备独立 `output_dir`：`{output_base}/{host_slug}/`
- 退出码同上

### 2.4 采集器多线程

采集器不用 `ThreadPoolExecutor`（长期运行不适合线程池），改用裸 `threading.Thread` + `threading.Event`。

```python
import threading

def run_collector_multi(devices, db_paths, interval=30):
    stop_event = threading.Event()
    threads = []
    collectors = []
    for d in devices:
        c = VSCollector(d["host"], d.get("password", ""), d.get("user", "admin"),
                        db_path=db_paths[d["host"]], interval=interval)
        c.stop_event = stop_event  # 注入停止信号
        t = threading.Thread(target=_collect_loop, args=(c,), daemon=True)
        t.start()
        threads.append(t)
        collectors.append(c)

    # 主线程等待信号
    signal.signal(signal.SIGINT, lambda s, f: stop_event.set())
    if hasattr(signal, 'SIGBREAK'):
        signal.signal(signal.SIGBREAK, lambda s, f: stop_event.set())

    for t in threads:
        t.join()  # 等待所有线程因 stop_event 退出

    for c in collectors:
        c.close_db()

def _collect_loop(collector):
    collector.open_db()
    collector.cleanup_old_data()
    while not collector.stop_event.is_set():
        collector.run_once()
        collector.stop_event.wait(timeout=collector.interval)
    collector.close_db()
```

**关键**：
- 信号处理器只 set event，不做 `sys.exit()`
- 每设备独立 DB（已支持，host 派生文件名）
- 每线程独立 SQLite 连接
- `run_once()` 中 `sys.exit(3)` 改为抛异常（线程中不能 exit）

### 2.5 输出格式

#### Markdown

每台设备分块前加汇总表：

```markdown
# AD Device Overview — 多设备

| 设备 | 状态 | CPU | 内存 |
|------|------|-----|------|
| AD1 (192.168.8.30) | ✅ 正常 | 17% | 42% |
| AD2 (192.168.8.31) | ⚠️ 警告 | 85% | 37% |

---

## AD1 (https://192.168.8.30)
... 正常单设备输出 ...

## AD2 (https://192.168.8.31)
... 正常单设备输出 ...

---

> 1/2 台正常，1/2 台异常。部分失败 (exit 6)
```

#### JSON

```json
{
  "mode": "multi",
  "summary": {"total": 2, "success": 1, "failed": 1},
  "results": {
    "192.168.8.30": { ... },
    "192.168.8.31": { "error": "ADConnectionError: 连接失败" }
  }
}
```

### 2.6 错误处理 + 退出码

| 场景 | 退出码 |
|------|--------|
| 全部设备成功 | 0 |
| 全部设备失败 | 1 |
| 认证失败（全部） | 2 |
| 部分成功部分失败 | **6**（区别于单设备超时 exit 5） |
| 参数错误 | 4 |

### 2.7 线程安全约束

- **ADClient**：无共享可变状态，每设备独立实例，天然线程安全
- **SQLite**：每设备独立文件 + 独立连接，`check_same_thread=False` 显式设置
- **多线程 print**：结果输出在主线程（收集完再输出）；进度日志加 `[{host_slug}]` 前缀
- **sys.exit() 禁令**：被 submit 的函数禁止调用 `sys.exit()`，通过异常上报错误

### 2.8 向后兼容

- `--host` 单设备模式行为完全不变
- `--hosts` 和 `--host` 不互斥：同时传入时 `--hosts` 优先，`--host` 忽略（带 stderr warning）
- `AD_HOST` 环境变量仅在单设备模式生效，`--hosts` 模式下忽略

### 2.9 SKILL.md 更新

4 个 SKILL.md 各增加：

1. **CLI 命令参考**：新增 `--hosts` 示例
2. **多设备触发条件**：告知 LLM 何时用 `--hosts` 而非 `--host`
3. **多设备输出说明**：LLM 原样展示，不做修改

示例（ad-ops SKILL.md）：
```markdown
### 多设备模式

当用户提到 2 台及以上设备、"所有设备"、"批量"、"同时" 时，使用 `--hosts`：

```bash
python scripts/overview.py all --hosts "https://IP1,https://IP2" --password xxx
```

- 多设备输出包含汇总表 + 每设备分块
- LLM 原样展示，不修改输出内容
```

## 3. 改动范围

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `ad-ops/scripts/overview.py` | 修改 | 加 `--hosts` + `run_multi()` + ThreadPoolExecutor |
| 2 | `ad-perception/scripts/perception.py` | 修改 | 同上 |
| 3 | `ad-perception/scripts/collector.py` | 修改 | 多线程采集 + threading.Event + sys.exit(3)→异常 |
| 4 | `ad-check-analysis/scripts/check.py` | 修改 | `_check_one()` 原子化 + 子命令矩阵 |
| 5 | `ad-blackbox-analysis/scripts/blackbox.py` | 修改 | `--hosts` + 独立输出目录 |
| 6 | `ad-ops/SKILL.md` | 修改 | 加多设备 CLI 示例 + 触发条件 |
| 7 | `ad-perception/SKILL.md` | 修改 | 同上 |
| 8 | `ad-check-analysis/SKILL.md` | 修改 | 同上 |
| 9 | `ad-blackbox-analysis/SKILL.md` | 修改 | 同上 |
| 10 | `test/test_multi_device.py` | 新建 | Mock 多设备并行测试 |

## 4. 风险

- 线程数上限 10，设备数 > 10 时分批执行（自动排队）
- 采集器长期运行需要系统守护（systemd / 任务计划）
- 多线程 `print()` 进度日志可能交错（带 host_slug 前缀可区分）
- `concurrent.futures` 无法强制终止超时线程（Python 限制）

## 5. 不变约束

- 零外部依赖（concurrent.futures + threading 均为 stdlib）
- 脚本固化所有逻辑，LLM 只调度+展示
- Markdown/JSON 双输出
- 单设备模式行为不变
- 被 submit 的函数不得调用 `sys.exit()`，通过异常或返回值报告错误
