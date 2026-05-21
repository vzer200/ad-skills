# 设备状态动态基线：系统指标趋势 API 注入 + 3σ

> 日期: 2026-05-21 | 状态: v2（2-agent 审核修订）

## 1. 背景

当前 `state_analysis` 使用静态阈值（CPU ≥ 80% warn, ≥ 90% critical）。实际调研发现 AD 设备提供了系统指标的趋势 API，格式与 VS 流量趋势 API 类似，可以零冷启动注入 SQLite 后用 3σ 做动态异常检测。

## 2. API 调研结论

### 2.1 可用的 trend=last-hour API

**CPU** (`/stat/sys/system/cpu_usage?trend=last-hour&all_properties=true`)：
```json
{
  "model": "TREND-LAST-HOUR",
  "start_time": 1779328140, "timestamp": 1779331740, "step_time": 60, "unit": "PERCENT",
  "series": [
    {"name": "TotalCpu", "values": [10, 10, 10, 9, ...]},
    {"name": "CPU0[0]", "values": [8, 10, 10, ...]},
    {"name": "CPU0[1]", "values": [13, 8, 9, ...]}
  ]
}
```
- ~59 个值，步长 60s
- `series[]` 结构：每个核一个 series + TotalCpu

**内存** (`/stat/sys/system/memory_usage?trend=last-hour&all_properties=true`)：
```json
{
  "model": "TREND-LAST-HOUR",
  "start_time": 1779328140, "timestamp": 1779331740, "step_time": 60, "unit": "PERCENT",
  "values": [36, 36, 36, 36, ...]
}
```
- ~59 个值，步长 60s
- 扁平 `values` 数组（不是 series）

**连接率** (`/stat/sys/system/connection_rate?trend=last-hour&all_properties=true`)：
```json
{
  "model": "TREND-LAST-HOUR",
  "values": [0, 0, 0, ...], "unit": "REQUEST-PER-SECOND"
}
```
- 与内存格式相同

### 2.2 不支持的指标

| 指标 | 尝试 | 结果 |
|------|------|------|
| disk_usage | `?trend=last-hour` | HTTP 500 |
| fan | `?trend=last-hour` | HTTP 500 |
| power_supply | 无独立趋势端点 | — |
| interface | 状态量，非时序 | — |

这些指标继续保持静态阈值判定。

### 2.3 API 格式差异

| 维度 | VS 趋势 API | 系统趋势 API |
|------|------------|------------|
| 端点 | `/stat/slb/virtual-service/{name}?trend=last-hour` | `/stat/sys/system/{metric}?trend=last-hour` |
| 数据结构 | `items: [{name, values}]` | `series: [{name, values}]` (CPU) 或 `values: [...]` (内存) |
| 时间元数据 | 无（需自己合成） | `start_time`, `step_time=60` — 可直接计算 ts |

系统趋势 API **有** `start_time` 和 `step_time`，不需要像 VS 趋势那样合成时间戳。

## 3. 方案

### 3.1 指标命名映射

API 端点名 → 内部 metric 名：

| API 端点 | 内部 metric | 说明 |
|----------|-----------|------|
| `cpu_usage` | `cpu` | 与 `state_analysis` 现有 metric 名一致 |
| `memory_usage` | `memory` | 与 `state_analysis` 现有 metric 名一致 |
| `connection_rate` | `connection_rate` | 系统级连接率，区别于 VS 级别 |

> 注入时做映射（`cpu_usage` → `cpu`），查询和展示统一用内部名。

### 3.2 新增数据库表

```sql
CREATE TABLE IF NOT EXISTS device_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    metric TEXT NOT NULL,
    value REAL NOT NULL,
    UNIQUE(ts, metric)
);
```

- 与 `vs_samples` 的区别：没有 `vs_name`（系统指标是设备级别）
- 清理策略：每次注入前 `DELETE FROM device_state WHERE ts < now - 7*86400`（与 `vs_samples` 一致）
- 当前每设备独立 DB，如果未来共享 DB 需增加 `host` 列

### 3.3 新增函数

**`_fetch_system_trend(client, api_metric)`** — 调用 `client._request("GET", "/stat/sys/system/{api_metric}", params={"trend": "last-hour", "all_properties": "true"})`。ADClient 不需要新增方法，直接用 `_request`。

**`_inject_system_trend_into_db(db_path, metric_name, trend_data)`** — 解析三类格式：
- `series` 格式（CPU）：遍历 series，找 `TotalCpu`（备选 key：`"TotalCpu"`, `"total_cpu"`, `"totalcpu"`），找到第一个匹配的取 values 注入
- `values` 格式（内存、连接率）：直接取根级 values 数组注入
- 未知格式：`raise ValueError`，不静默跳过
- 时间戳：`ts = start_time + i * step_time`（API 返回值，比合成更准确）
- 7 天清理：注入前 `DELETE FROM device_state WHERE ts < now - 7*86400`

**`collect_system_once(client, db_path)`** — 遍历 `["cpu_usage", "memory_usage", "connection_rate"]`，逐个调 `_fetch_system_trend` + `_inject_system_trend_into_db`。单个指标失败不影响其他。

> **性能注**：增加 3 次 API 调用。实测每次 200-500ms，合计 < 2s。collect_once 总耗时从 ~3s 变为 ~5s，仍在可接受范围。

### 3.4 修改已有函数

**`collect_once`** — 流量采集后追加调用 `collect_system_once`，失败不影响主流程。

**`state_analysis(client, disk_source=None, db_path=None)`** — 新增 `db_path` 可选参数：

```
1. get_sys_system() → 获取当前瞬时值（CPU/内存/风扇/电源/接口）——始终调用
2. 如果 db_path 存在且有 device_state 表：
   a. query_device_state_db(db_path) → 获取历史数据
   b. 如果 >= 30 个点（任一 metric）→ 3σ 异常检测
   c. 数据不足 → 触发注入分支：collect_system_once() → 重新查询 → 3σ
3. 静态阈值检查始终运行（CPU≥90% critical 等永远兜底）
4. 输出 items 中，3σ 异常的指标附加 baseline_mean/z/direction/deviation_pct 字段
5. 磁盘/风扇/电源/接口：无趋势数据，仅静态阈值
```

> **瞬时值来源**：始终从 `get_sys_system()` API 取当前值。SQLite 只用于 3σ 基线计算。API 失败时才从 SQLite 最新一条取作为 fallback。

**`analyze_full`** — 将 `db_path` 传给 `state_analysis(client, disk_source, db_path)`（当前已接收 db_path 但未传递）。

### 3.5 输出格式

**设备状态部分**分三个区域：

**区域 1：数值类指标（CPU/内存/连接率）— 有 3σ 异常时**：
```
| 指标 | 时间 | 当前值 | 正常范围 | 偏离幅度 | 方向 | 严重程度 |
| CPU | 05-21 09:30 | 45% | 12.0 | +275.0% | ↑ 上升 | 🔴 严重 |
| 内存 | 05-21 09:30 | 55% | 36.5 | +50.7% | ↑ 上升 | 🟡 明显 |
```
（格式与流量异常表一致，严重程度分级相同：🔴 Z>10 / 🟡 Z>5 / 🟠 Z>3）

**区域 2：非数值类指标（风扇/电源/接口）— 沿用现有静态表格**：
```
| 指标 | 当前值 | 级别 | 描述 |
| interface | eth2 | ⚠️ warn | 接口 eth2 状态: out |
```

**区域 3：无异常时的摘要行**（保持不变）：
```
CPU: 12%, 内存: 38%
```

### 3.6 不修改

- 磁盘/风扇/电源/接口 → 保持静态阈值（无历史趋势 API）
- `render_json` 不变（始终保留原始数据，含 z/baseline_mean 等）
- `collect_once` 的流量采集部分不变

## 4. 改动清单

| # | 文件 | 改动 | 行数 |
|---|------|------|------|
| 1 | `db_schema.py` | 新增 `DEVICE_STATE_DDL` | ~8 |
| 2 | `collector.py` | 新增 `_fetch_system_trend()` | ~12 |
| 3 | `collector.py` | 新增 `_inject_system_trend_into_db()` | ~45 |
| 4 | `collector.py` | 新增 `collect_system_once()` | ~25 |
| 5 | `collector.py` | `collect_once` 追加系统采集 | ~3 |
| 6 | `perception.py` | 新增 `query_device_state_db()` | ~20 |
| 7 | `perception.py` | `state_analysis` 增加 db_path + 3σ + 注入分支 | ~40 |
| 8 | `perception.py` | `analyze_full` 传递 db_path | ~2 |
| 9 | `perception.py` | `render_markdown` 状态 section 分表展示 | ~20 |
| 10 | `test/test_collector.py` | 新增测试 | ~35 |
| 11 | `test/test_perception.py` | 新增测试 | ~30 |

## 5. 不变约束

- 不新增外部依赖
- `state_analysis` 签名增加可选参数，向后兼容
- 静态阈值兜底逻辑保留且始终执行
- `render_json` 不变
- 已有测试全部保持通过
