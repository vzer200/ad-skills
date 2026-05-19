# AD 设备总览快照 + 感知分析 设计文档

> 日期: 2026-05-19 | 状态: 草稿 v2（4 agent 并行评审后修订）| 对应需求: 需求1 + 需求2 (P0)

## 1. 概述

### 1.1 目标

- **需求 1**：一条命令拉出单台 AD 设备总览（配置 / 状态 / 流量 / 证书），Markdown 直出，可选 JSON。
- **需求 2**：对单台 AD 设备做异常感知，覆盖流量趋势 / 设备状态 / 日志线索 / 地址冲突，所有判定规则固化在脚本中。

### 1.2 架构原则（不可妥协）

| 角色 | 职责 |
|---|---|
| **脚本 (Python)** | 数据获取、判断、分析、阈值、模板渲染、最终输出 |
| **LLM** | 仅做两件事：① 选对脚本和参数 ② 把脚本输出原样展示给用户 |

- LLM 不做分析或推断
- LLM 不拼装最终输出
- 脚本输出双形态：默认 Markdown，`--format json`
- 错误由脚本返回明确文案与非零退出码（含部分失败），LLM 不"善意补救"

---

## 2. 关键决策（已确认）

| 决策项 | 结论 |
|---|---|
| Python 环境 | uv + Python 3.14.5，stdlib only（unittest + unittest.mock / urllib / json / sqlite3 / ssl）|
| 载体拆分 | 总览快照 → `ad-ops/scripts/overview.py`；感知分析 → 新建 `ad-perception` skill |
| ADClient 共享 | `overview.py` 与 `ad_api.py` 同目录 import；`perception.py` / `collector.py` 用 `__file__` 锚定的 `sys.path.insert` |
| 凭据传递 | 所有脚本复用 `ad_api.py` 规范：`--host` / `--user` (默认 `admin`) / `--password`。**优先使用环境变量 `AD_PASS`**（不在进程列表中暴露），`--password` 仅用于临时覆盖。**明文密码不出现在 SKILL.md、日志、stderr、代码注释中** |
| SSL 风险 | `ADClient` 禁用 TLS 验证（`CERT_NONE`），适用于内网自签名环境。**对外暴露时凭据可被 MITM 窃取**，SKILL.md 须说明 |
| 7 天颗粒度 | P0 同时交付采集器 daemon + 感知脚本 |
| 数据不足策略 | SQLite 数据充足 → 3σ 分析；SQLite 数据不足 → 仅展示原始趋势，不跑 3σ（脚本明说"数据不足"） |
| 流量异常算法 | 滑动窗口 mean ± 3σ（6h 窗口 / ≥30 样本 / abs(z)>3 且偏离>5%）**仅对 60s 粒度 SQLite 数据执行**；全零 VS 跳过 |
| CPU/内存阈值 | ≥80% 警告，≥90% 严重 |
| 证书到期阈值 | ≤30d 严重，≤60d 警告，≤90d 提示（以设备本地时间为准） |
| 证书时间解析 | AD 返回 `"YYYY/MM/DD HH:MM:SS"` 无时区标识，脚本按**设备本地时间**解析，不做时区转换 |
| 日志根因 | 只用 `get_service_log`，不走黑盒导出 |
| 多设备 | P0 单设备，`--host` 接一个地址 |
| 输出形态 | 默认 Markdown（脚本 `render_markdown()` 直出），`--format json` 可选 |
| 部分失败 exit code | **exit 5**（非零，区分于完全成功 0 和完全失败 1），stderr 列出失败项 |
| VIP:VPort 配对 | **笛卡尔积**：VS 的 VIP 列表 × VPort 列表 = 所有 (vip, vport) 组合 |

---

## 3. 目录结构

```
.claude/skills/
├── ad-ops/scripts/
│   ├── ad_api.py              ← 已有，不动（ADClient + CLI）
│   └── overview.py            ← 新增：设备总览快照
│
├── ad-perception/              ← 新建 skill
│   ├── SKILL.md
│   └── scripts/
│       ├── db_schema.py       ← 共享 SQL schema
│       ├── collector.py       ← 守护进程：60s 采样 → SQLite
│       └── perception.py      ← 感知分析入口 CLI
│
test/
├── test_overview.py
├── test_collector.py
└── test_perception.py
```

### 3.1 ADClient import 规范

```python
# overview.py — 与 ad_api.py 同目录，直接 import
from ad_api import ADClient

# perception.py / collector.py — 跨 skill
import sys, os
sys.path.insert(0, os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "ad-ops", "scripts"
))
from ad_api import ADClient
```

**失败处理**：`ModuleNotFoundError` → stderr `错误: 无法导入 ad_api.py，请确认文件路径未变更`，exit **9**。

### 3.2 共享 SQL Schema

`collector.py` 和 `perception.py` 共享同一张 `vs_samples` 表的 SQL schema，两脚本通过硬编码的列名隐式耦合。为降低未来变更风险：

```python
# ad-perception/scripts/db_schema.py（两脚本共享）
VS_SAMPLES_DDL = """
CREATE TABLE IF NOT EXISTS vs_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    vs_name TEXT NOT NULL,
    metric TEXT NOT NULL,
    value REAL NOT NULL,
    UNIQUE(ts, vs_name, metric)
);
"""
COLUMNS = ["ts", "vs_name", "metric", "value"]
```

`collector.py` 和 `perception.py` 均 `from db_schema import VS_SAMPLES_DDL, COLUMNS`。不重复写 SQL 字面量。

---

## 4. 组件详细设计

### 4.1 `overview.py` — 设备总览快照

**CLI 签名**：
```bash
# 全部（默认）
python overview.py all      --host https://x.x.x.x --user admin --password xxx [--format json]

# 单个维度
python overview.py vs       --host ... --user ... --password ... [--format json]
python overview.py pool     --host ... --user ... --password ... [--format json]
python overview.py cert     --host ... --user ... --password ... [--format json]
python overview.py hardware --host ... --user ... --password ... [--format json]
python overview.py ha       --host ... --user ... --password ... [--format json]
python overview.py traffic  --host ... --user ... --password ... [--format json]
```

| 子命令 | 调用的 API | 对应 Markdown 段落 |
|---|---|---|
| `all` | 全部 6 个 | 完整报告 |
| `vs` | `get_virtual_services` + `get_vs_stat` | VS 总览表（含瞬时流量） |
| `pool` | `get_pools` | Pool 及节点列表 |
| `cert` | `get_ssl_certificates` | 证书表（到期时间 + 等级） |
| `hardware` | `get_sys_system` | CPU/内存/温度/风扇/电源/接口 |
| `ha` | `get_ha_status` | HA 角色与状态 |
| `traffic` | `get_vs_stat` | 纯流量数值表（数值为主，12 指标完整展开），不含 VS 配置字段。与 `vs` 的区别：`vs` 侧重配置（VIP/Pool/节点），流量只是附属列；`traffic` 侧重流量值本身 |

**数据获取**（按子命令按需拉取，`all` 拉全部 6 个 API）：
1. `get_virtual_services()` — VS 配置列表
2. `get_pools()` — Pool 及节点列表
3. `get_ssl_certificates()` — 证书列表（`validity_not_after`）
4. `get_ha_status()` — HA 状态
5. `get_sys_system()` — CPU/内存/温度/风扇/电源/接口
6. `get_vs_stat()` — 各 VS 瞬时流量值

**Markdown 渲染** (`render_markdown()` → 字符串)：
- **设备信息区**：版本 / 运行时间 / HA 角色
- **VS 总览表**：名称、VIP:Port（笛卡尔积展开）、Pool、状态、节点健康、瞬时流量
- **证书表**：名称、到期时间、剩余天数、等级（严重/警告/提示）
- **硬件状态区**：CPU%、内存%、温度、风扇、电源、接口插拔
- **异常高亮**：到期≤30d **红色**，硬件 ≥80% **黄色**，≥90% **红色**

**JSON 输出** (`--format json`)：
```json
{
  "device": {"host": "...", "ha_role": "...", "cpu": 7, "memory": 37, ...},
  "virtual_services": [{"name": "...", "vip": "...", "pool": "...", ...}],
  "certificates": [{"name": "...", "expiry": "...", "days_left": N, "level": "critical"}],
  "hardware": {"cpu": 7, "memory": 37, "fans": [...], ...}
}
```

**错误处理**：
- 连接失败 → stderr `错误: 连接失败: {reason}`，exit **1**
- 认证失败 → stderr `错误: 认证失败`，exit **2**
- 单个 API 失败 → 对应区段标注"获取失败: {reason}"，其余继续，exit **5**
- 全部 API 失败 → stderr `错误: 所有数据源获取失败`，exit **1**

> **注**：overview.py 与 perception.py state 子命令均使用 `get_sys_system()` 和相同的 80%/90% 阈值。这是**有意重复**（非抽象泄漏）：overview 是即时快照呈现，perception 是异常判定分析 — 两类输出场景的上下文不同，合并为一个共享模块会增加耦合而收益甚微。两端各自独立实现阈值检查。

### 4.2 `collector.py` — VS 流量采集守护进程

**CLI 签名**：
```bash
python collector.py --host https://x.x.x.x --user admin --password xxx [--db vs_samples.db] [--interval 60]
```

`--db` 参数解析为**绝对路径**（基于 CWD 或 `os.path.abspath()`）。若未指定，默认 `./vs_samples.db`（相对 CWD）。启动时打印 `数据库路径: {absolute_path}`。

**行为**：
- PID 文件：启动时用 `os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)` 原子创建 PID 文件（避免 TOCTOU 竞态），写入 PID。若文件已存在 → 读取其中 PID，检查进程是否存活：存活则 `错误: 采集器已在运行 (PID=N)` exit 6；已死则删除旧 PID 文件后重新创建
- 每 `--interval` 秒拉一次 `get_vs_stat()`（瞬时值，12 个指标）
- 存入 SQLite：
```sql
CREATE TABLE IF NOT EXISTS vs_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,          -- unix timestamp (UTC)
    vs_name TEXT NOT NULL,
    metric TEXT NOT NULL,          -- connection, connection_rate, ...
    value REAL NOT NULL,
    UNIQUE(ts, vs_name, metric)
);
```
- 信号处理：Windows 不支持 `SIGTERM`，使用 `signal.SIGINT` (Ctrl+C) + `signal.SIGBREAK` 优雅退出，或轮询 PID 文件被删除 → 关闭 DB 连接，打印 `采集器已停止`，删除 PID 文件。集成测试中通过 `subprocess.Popen` 启停采集器进程，Windows 上用 `os.kill(pid, signal.CTRL_BREAK_EVENT)` 发关闭信号（需要同一进程组，`Popen(creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)`）
- 日志：每分钟一行 `[2026-05-19 18:00:00] 采样 N 个 VS，M 条记录`
- 去重：`INSERT OR REPLACE`，同秒同 VS 同指标只保留一条
- 清理：启动时 + 运行时每小时 `DELETE FROM vs_samples WHERE ts < (now - 30d)`，**包装在显式事务中**（`BEGIN; DELETE ...; COMMIT`）以降低同步开销；30 天 DB 约 500 万行，启动清理耗时 < 5s

**错误处理**：
- API 一次失败 → stderr `[WARN] 采样失败: {reason}`，不清空 DB，继续轮询
- 连续 5 次失败 → stderr `[STALLED] 连续 5 次采样失败，请检查设备和网络`，进程**保持运行继续重试**（不退出），日志标记 `STALLED`。恢复成功采样后失败计数归零，日志 `[RECOVERED] 采样已恢复`
- SQLite 写入失败 → stderr `错误: 数据库写入失败: {reason}`，exit **3**
- 首次启动时表不存在 → 自动建表
- 启动时 DB 已存在（重启场景）→ `CREATE TABLE IF NOT EXISTS` 确保 schema，不清除已有数据
- 重复启动 → exit **6**

### 4.3 `perception.py` — 感知分析入口

**CLI 签名**：
```bash
# 全维度分析（流量 + 状态 + 日志 + 地址冲突）
python perception.py analyze --host https://x.x.x.x --user admin --password xxx [--db vs_samples.db] [--format json]

# 单维度分析
python perception.py traffic --host ... --user ... --password ... --vs <name> [--db ...] [--format json]
python perception.py state --host ... --user ... --password ... [--disk-source check_report_dir] [--format json]
python perception.py conflict --host ... --user ... --password ... [--format json]
```

**子命令**：

| 子命令 | 功能 | 数据源 |
|---|---|---|
| `analyze` | 全维度（默认），4 个维度合并输出 | 全部 |
| `traffic` | 流量趋势异常 | SQLite（优先）；API 兜底仅展示原始趋势不跑 3σ |
| `state` | 设备状态异常 | `get_sys_system` + 可选 `--disk-source` |
| `conflict` | 地址冲突检测 | `get_virtual_services` + `get_pools` |

#### 4.3.1 流量异常判定逻辑 (`perception.py traffic`)

**数据获取（两级策略）**：

```
1. SQLite: SELECT * FROM vs_samples WHERE ts > now - 7d ORDER BY ts
   ↓
   if len(全 VS 总点数) >= 100:
       → 对 60s 粒度点跑 3σ（见下方算法）
   else:
       → API 兜底: get_vs_trend_by_name(last-hour/day/month)
       → 输出原始趋势数据表格，标注
         "⚠ 数据不足: SQLite 中仅 {N} 个采样点，无法做 3σ 判定。
          请启动采集器 (python collector.py) 累积至少 2 小时后重试。
          以下为 API 原始趋势数据，仅供参考。"
       → **不跑 3σ**
```

**设计理由**：`last-hour`(60s)、`last-day`(24min)、`last-month`(12.4h) 三个窗口的采样间隔差异巨大，混合后无法做有意义的滑动窗口统计。3σ 严格限定在采集器产出的均匀 60s 粒度数据。

**3σ 异常算法**（仅对 SQLite 数据执行）：
```
对每个 (VS, 指标):
  values = 最近 7 天的所有点 [ts, value]

  # 过滤 NaN/Inf（数据污染）
  values = [v for v in values if math.isfinite(v.value)]
  if len(values) == 0: skip

  # 跳过已下线的 VS（全零流量）
  if all(v.value == 0 for v in values): skip

  for each point in values:
    window = 该点之前 6h 内的所有点
    window = [w for w in window if math.isfinite(w.value)]
    if len(window) < 30: skip      # 样本不足
    mean = statistics.mean(window); std = statistics.stdev(window)
    if std == 0: skip              # 平坦基线，无波动
    z = abs(point.value - mean) / std
    if z > 3 AND abs(point.value - mean) / max(mean, 1e-6) > 0.05:
      flag 异常
      记录: vs_name, metric, ts, value, baseline_mean, z, direction

  direction = "上升" if value > mean else "下降"
```

**输出**（Markdown）：

情况 A — 有异常：
```markdown
### 流量趋势异常

| VS | 指标 | 时间 | 当前值 | 基线均值 | Z 值 | 方向 |
|---|---|---|---|---|---|---|
| VS-A | connection | 05-19 03:15 | 12000 | 4100 | +5.2 | 上升 |
| VS-B | throughput | 05-18 14:00 | 50 | 850 | -4.1 | 下降 |
```

情况 B — 无异常：
```markdown
### 流量趋势异常
✅ 过去 7 天内未检测到流量异常。
```

情况 C — 数据不足：
```markdown
### 流量趋势异常
⚠ 数据不足: SQLite 中仅 42 个采样点（含 3 个 VS），无法做 3σ 判定。
请启动采集器 (python collector.py --host ...) 累积至少 2 小时后重试。

#### API 原始趋势（仅供参考，仅展示 max/mean ≥ 2 的指标，其余已省略）
| 窗口 | VS | 指标 | 最小值 | 最大值 | 均值 | 点数 | 波动比 |
|---|---|---|---|---|---|---|---|
| last-hour | VS-A | connection | 0 | 150 | 45.2 | 59 | 3.3x |
| ...
```

#### 4.3.2 状态异常判定逻辑 (`perception.py state`)

**数据获取**：
- `get_sys_system()` → CPU/内存/温度/风扇/电源/接口
- `--disk-source <dir>` 可选：指向巡检报告目录（内有 `ad.json`），路径下存在则读 `check_results.disk_check`

**异常规则**：

| 指标 | 警告 (WARN) | 严重 (CRITICAL) |
|---|---|---|
| CPU | ≥80% | ≥90% |
| 内存 | ≥80% | ≥90% |
| 风扇 | 任一状态 != normal | 任一状态 == fail |
| 电源 | UNSUPPORTED 或 abnormal | fail |
| 接口 | out（拔出） | — |

**磁盘处理**：
- `--disk-source` 提供且 `<dir>/ad.json` 存在且可解析 → 从 `check_results.disk_check` 读取
- `--disk-source` 提供但 `ad.json` 不存在 → stderr `[WARN] --disk-source 指定的目录中未找到 ad.json`，输出标注 "磁盘: 巡检报告不可用 (ad.json 缺失)"
- `--disk-source` 提供但 `ad.json` 解析失败 → stderr `[WARN] ad.json 解析失败: {reason}`，输出标注 "磁盘: 巡检报告损坏"
- `--disk-source` 未提供 → 输出标注 "磁盘: 未提供巡检数据 (使用 --disk-source 指定巡检报告目录)"，不参与判定

**输出**（Markdown）：

情况 A — 有异常：
```markdown
### 设备状态异常

| 指标 | 当前值 | 等级 | 说明 |
|---|---|---|---|
| CPU | 92% | 🔴 严重 | 超过 90% |
| eth2 | out | 🟡 警告 | 接口拔出 |
```

情况 B — 无异常：
```markdown
### 设备状态异常
✅ CPU: 7%, 内存: 37%, 风扇: 正常, 电源: UNSUPPORTED, 接口: 1/5 拔出 (eth2,eth3,eth4,eth5)
磁盘: 未提供巡检数据
```

#### 4.3.3 日志线索 (`perception.py analyze` 自动整合)

- 调用 `get_service_log(limit=20)`
- 仅当**检测到异常事件**时，检索异常时间点 ± 5 分钟的日志条目

**输出规则**：

情况 A — 有匹配日志：
```markdown
### 关联日志线索

| 时间 | 用户 | 操作 | 状态 |
|---|---|---|---|
| 05-19 03:14 | admin | 修改 VS-A 配置 | SUCCESS |
```

情况 B — 无匹配日志：
```markdown
### 关联日志线索
未在异常时间点附近找到关联日志条目。
```

情况 C — 无异常事件 → 整段跳过，不显示"关联日志线索"段落。

#### 4.3.4 地址冲突检测 (`perception.py conflict`)

**检测规则**：

1. **VS IP:Port 重叠**：
   - 对每个 VS，展开 `vips × vports` 笛卡尔积得到完整 `(vip, vport)` 集合
   - 两个不同 VS 存在相同的 `(vip, vport)` → 冲突

2. **Pool 节点重复**：
   - 两个不同 Pool 存在相同 `ip:port` 的节点成员 → 重叠（警告）

**输出**（Markdown）：

情况 A — 有冲突：
```markdown
### 地址冲突检测

#### VS IP:Port 重叠
| IP:Port | VS-A | VS-B |
|---|---|---|
| 10.0.0.1:443 | VS-ssl-1 | VS-ssl-2 |

#### Pool 节点重叠
| 节点 | 所属 Pool |
|---|---|
| 10.0.0.1:8080 | pool-A, pool-B |
```

情况 B — 无冲突：
```markdown
### 地址冲突检测
✅ 未发现 VS IP:Port 重叠或 Pool 节点重复。
```

### 4.4 默认 analyze 输出总览

`perception.py analyze` 的输出顺序：
1. 流量趋势异常
2. 设备状态异常
3. 关联日志线索（如有异常事件）
4. 地址冲突检测

每个维度独立渲染，按顺序拼接成最终 Markdown。任何维度获取失败 → 对应段落输出 "获取失败: {reason}"，exit **5**（部分失败），其余维度正常输出。

### 4.5 perception.py JSON 输出 Schema

`--format json` 时输出以下结构（`analyze` 全维度；单维度子命令仅含对应 key）：

```json
{
  "device": "https://x.x.x.x",
  "traffic": {
    "status": "ok" | "insufficient_data" | "error",
    "anomalies": [
      {"vs": "...", "metric": "...", "ts": N, "value": N, "baseline_mean": N, "z": N, "direction": "上升"|"下降"}
    ],
    "error": null | "错误描述"
  },
  "state": {
    "status": "ok" | "warning" | "critical" | "error",
    "items": [
      {"metric": "cpu", "value": N, "level": "ok"|"warn"|"critical", "message": "..."}
    ],
    "disk": {"available": true|false, "value": null|"...", "source": "ad.json"|"none"|"error"}
  },
  "logs": {
    "status": "ok" | "no_anomaly" | "no_match" | "error",
    "entries": [
      {"time": "...", "user": "...", "action": "...", "status": "..."}
    ]
  },
  "conflicts": {
    "status": "ok" | "conflict_found" | "error",
    "vs_overlaps": [["vs_a", "vs_b", "ip:port"]],
    "pool_overlaps": [["ip:port", ["pool_a", "pool_b"]]]
  }
}
```

---

## 5. 数据流

```
┌─────────────────────────────────────────────────────┐
│ overview.py                                         │
│                                                     │
│  invoke: get_vs / get_pools / get_certs / ha / sys  │
│         ↓                                           │
│  build_overview() → render_markdown() / json.dumps  │
│         ↓                                           │
│  stdout → LLM 原样贴入对话                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ collector.py (后台 daemon)                          │
│                                                     │
│  loop every 60s:                                    │
│    get_vs_stat()                                    │
│    → INSERT OR REPLACE INTO vs_samples              │
│    → sleep 60                                       │
│    → log "[timestamp] 采样 N 个 VS，M 条记录"        │
└──────────────┬──────────────────────────────────────┘
               │ writes
               ▼
       ┌───────────────┐
       │ vs_samples.db │  (绝对路径，启动时打印)
       └───────┬───────┘
               │ reads (if >= 100 points)
┌──────────────▼──────────────────────────────────────┐
│ perception.py                                       │
│                                                     │
│  analyze / traffic / state / conflict               │
│                                                     │
│  traffic:                                           │
│    1. SQLite → 3σ (NaN/Inf filtered)                │
│    2. API 兜底 → filtered raw trend table           │
│    → render_markdown() / render_json()              │
│                                                     │
│  state:                                             │
│    get_sys_system() → threshold check               │
│    --disk-source → ad.json disk_check (optional)    │
│    → render_markdown() / render_json()              │
│                                                     │
│  logs (analyze only, if anomalies detected):        │
│    get_service_log(limit=20) → ±5min match          │
│    → render_markdown() / render_json()              │
│                                                     │
│  conflict:                                          │
│    get_vs + get_pools                                │
│    → Cartesian product overlap check                │
│    → render_markdown() / render_json()              │
│                                                     │
│  stdout → LLM 原样贴入对话                           │
└─────────────────────────────────────────────────────┘
```

---

## 6. 测试策略（TDD）

### 6.1 Mock 策略

使用 **`unittest.mock`**（Python 3.3+ stdlib）：
- `unittest.mock.patch` 作用于 **类级别方法**（`patch('ad_api.ADClient.get_vs_stat')`），不 patch 模块名。因 `ADClient` 通过 `from ad_api import ADClient` 导入，类方法 patch 对所有引用生效
- `unittest.mock.MagicMock` 构造受控返回值
- SQLite：优先 `sqlite3.connect(':memory:')` 隔离；**唯一例外** — 测试"重启后 DB 已存在"场景使用 `tempfile.NamedTemporaryFile` 创建文件 DB

### 6.2 测试文件 sys.path

测试文件与被测脚本不在同一目录，各测试文件头部需 `sys.path.insert`：

```python
# test/test_overview.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".claude", "skills", "ad-ops", "scripts"))

# test/test_collector.py 和 test/test_perception.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".claude", "skills", "ad-perception", "scripts"))
```

### 6.3 测试文件结构

```
test/
├── test_overview.py     — overview build_overview() / render 逻辑
├── test_collector.py    — collector 的 SQLite 写入/去重/清理
└── test_perception.py   — 3σ / 阈值 / 冲突 / 日志匹配
```

### 6.4 运行方式

```bash
uv run --python 3.14 python -m unittest test/test_overview.py
uv run --python 3.14 python -m unittest test/test_collector.py
uv run --python 3.14 python -m unittest test/test_perception.py
uv run --python 3.14 python -m unittest discover -s test -p "test_*.py"
```

### 6.5 TDD 流程与隔离规则

1. 写 test → red（失败）
2. 写实现 → green（通过）
3. 重构 → green 保持

**两层测试架构**：

| 层级 | 文件 | 依赖 | 运行条件 |
|---|---|---|---|
| **单元测试** | `test_overview.py` / `test_collector.py` / `test_perception.py` | 纯 mock，不连设备 | 始终可跑 |
| **集成测试** | `test_integration.py` | **真实 AD 设备** | 需设置 `AD_INTEGRATION=1` 环境变量 |

**单元测试隔离规则**：
- 所有测试**不依赖真实 AD 设备**
- 每个测试用 `setUp()` 创建**新的** DB 连接 / mock 实例
- `tearDown()` 关闭连接 / 清理临时文件
- 测试间**无隐式依赖**，可任意单独运行或乱序运行
- SQLite 隔离策略：除 `test_resume_with_existing_db`（用 `tempfile` 文件 DB）外，其余均用 `:memory:`

**集成测试运行方式**：
```bash
# 指定目标设备（二选一）
$env:AD_INTEGRATION=1
$env:AD_HOST="https://14.18.243.211:21039"
$env:AD_PASS="<设备密码>"

uv run --python 3.14 python -m unittest test/test_integration.py
```

集成测试文件头部使用 `unittest.skipUnless` 守卫：
```python
import os, unittest
@unittest.skipUnless(os.environ.get("AD_INTEGRATION") == "1", "设置 AD_INTEGRATION=1 以启用集成测试")
```

所有集成测试用例在此守卫下定义（或作为类装饰器 `@unittest.skipUnless(...)` 作用于 `setUpClass`）。`unittest discover` 未设 `AD_INTEGRATION` 时自动跳过，输出 `sss...`。

集成测试通过 `ADClient` 直连真实设备，验证：
- API 连通性
- 返回结构符合预期（不验证具体数值，只验证字段存在和类型）
- `overview.py all` 端到端输出 Markdown
- `perception.py analyze` 端到端输出 Markdown
- `collector.py` 启动采样 1 分钟、写 SQLite、优雅退出
- `--format json` 输出可被 `json.loads` 解析
- 错误码：错误密码 → exit 2，不可达主机 → exit 1

**运行策略**：
- 日常开发（TDD 红绿重构）：只跑单元测试（秒级）
- 提交前 / 设备变更后：跑集成测试（分钟级）

### 6.6 测试用例清单

**test_overview.py** (共 17 个):

| # | 用例 | 覆盖点 |
|---|---|---|
| 1 | `test_build_overview_merges_all_sources` | 6 API 拼装正确 |
| 2 | `test_cert_days_left_calculation` | 日期差 |
| 3 | `test_cert_level_boundary_critical` | 到期 ≤30d |
| 4 | `test_cert_level_boundary_warn` | 到期 ≤60d |
| 5 | `test_cert_level_boundary_info` | 到期 ≤90d |
| 6 | `test_cert_level_exact_30_60_90_boundaries` | 恰好 30/60/90 天 → 各归对应等级 |
| 7 | `test_hardware_cpu_warn_at_80` | CPU = 80% → 警告 |
| 8 | `test_hardware_cpu_critical_at_90` | CPU = 90% → 严重 |
| 9 | `test_render_markdown_contains_highlighted_rows` | 🔴/🟡 标记 |
| 10 | `test_render_json_matches_schema` | JSON schema |
| 11 | `test_single_api_failure_does_not_block_others` | 部分失败隔离 |
| 12 | `test_auth_failure_exit_code` | exit 2 |
| 13 | `test_empty_vs_and_certs` | 0 VS / 0 证书退化 |
| 14 | `test_multi_vip_vs_cartesian_expansion` | 多 VIP × 多 Port → 笛卡尔积展开 |
| 15 | `test_param_error_exit_4` | 参数错误 → exit 4 |
| 16 | `test_full_success_exit_0` | 全部成功 → exit 0 |
| 17 | `test_all_api_failure_exit_1` | 全部 API 失败 → exit 1 |

**test_collector.py** (共 13 个):

| # | 用例 | 覆盖点 |
|---|---|---|
| 1 | `test_create_table_on_first_run` | `:memory:` schema |
| 2 | `test_resume_with_existing_db` | 重启后 `IF NOT EXISTS` |
| 3 | `test_insert_sample` | 单条写入 |
| 4 | `test_insert_or_replace_dedup` | 同 ts/vs/metric 覆盖 |
| 5 | `test_cleanup_old_data` | 超过 30d 的行被删 |
| 6 | `test_parse_vs_stat_response` | API 响应 → INSERT rows |
| 7 | `test_consecutive_failures_logged` | 5 次连续失败 → STALLED 日志 |
| 8 | `test_single_failure_logs_warn_not_stalled` | 1 次失败 → WARN，非 STALLED |
| 9 | `test_db_path_printed_absolute` | 启动时输出绝对路径 |
| 10 | `test_duplicate_start_blocked_exit_6` | 重复启动 → exit 6 |
| 11 | `test_sigint_graceful_shutdown` | SIGINT → 关闭 DB、删除 PID 文件、exit 0 |
| 12 | `test_stale_pid_cleaned_on_start` | 僵死 PID 文件 → 自动清理后正常启动 |
| 13 | `test_stalled_recovery_resets_counter` | STALLED 后恢复采样 → 失败计数归零 |

**test_perception.py** (共 35 个):

| # | 用例 | 覆盖点 |
|---|---|---|
| 1 | `test_detect_anomaly_z_greater_than_3` | 3σ 命中 |
| 2 | `test_detect_no_anomaly_normal_data` | 正常数据无告警 |
| 3 | `test_detect_anomaly_sudden_drop` | 突降检测 |
| 4 | `test_high_z_but_low_deviation_not_flagged` | z>3 但偏离<5% → 不告警 |
| 5 | `test_skip_small_window_lt_30` | 窗口 <30 跳过 |
| 6 | `test_skip_zero_std` | 平坦基线跳过 |
| 7 | `test_skip_all_zero_vs` | 全零 VS 跳过 |
| 8 | `test_skip_single_point` | 单点跳过 |
| 9 | `test_db_fallback_insufficient_points` | <100 点 → API 兜底 |
| 10 | `test_db_enough_points_no_api_call` | ≥100 点 → 不调 API |
| 11 | `test_render_raw_trend_when_db_insufficient` | 兜底输出表格 |
| 12 | `test_cpu_warn_at_80` | 阈值边界 |
| 13 | `test_cpu_critical_at_90` | 阈值边界 |
| 14 | `test_memory_warn_at_80` | 阈值边界 |
| 15 | `test_memory_critical_at_90` | 阈值边界 |
| 16 | `test_disk_missing_without_flag` | 无 `--disk-source` → 标注缺失 |
| 17 | `test_disk_with_valid_source` | `--disk-source` 指向有效 ad.json → 解析并渲染磁盘数据 |
| 18 | `test_vs_ip_port_cartesian_overlap` | 笛卡尔积展开后冲突检测 |
| 19 | `test_vs_ip_port_no_overlap` | 无冲突情况 |
| 20 | `test_pool_node_duplicate_detected` | Pool 节点重复 |
| 21 | `test_pool_empty_nodes` | 空池退化 |
| 22 | `test_log_time_window_match` | 异常时间 ± 5min 匹配 |
| 23 | `test_log_no_entries_fallback` | 无匹配日志 → 明说 |
| 24 | `test_log_skipped_when_no_anomaly` | 无异常 → 不输出日志段 |
| 25 | `test_render_markdown_all_sections` | 全维度输出 |
| 26 | `test_render_json_matches_schema` | JSON schema |
| 27 | `test_partial_failure_exit_code_5` | 部分失败 exit 5 |
| 28 | `test_nan_inf_filtered_from_window` | NaN/Inf 值被过滤 |
| 29 | `test_disk_source_ad_json_missing` | --disk-source 目录无 ad.json → WARN |
| 30 | `test_disk_source_ad_json_malformed` | ad.json 解析失败 → WARN |
| 31 | `test_analyze_partial_failure_continues` | 一个维度失败，其余继续输出 |
| 32 | `test_traffic_db_empty_api_fails` | SQLite 空 + API 失败 → 错误输出 |
| 33 | `test_traffic_subcommand_with_vs_flag` | `traffic --vs X` 独立 CLI 路径 |
| 34 | `test_state_subcommand_standalone` | `state` 独立 CLI 路径 |
| 35 | `test_conflict_subcommand_standalone` | `conflict` 独立 CLI 路径 |

**test_integration.py** (共 10 个，需 `AD_INTEGRATION=1`)：

`setUpClass`：验证 `AD_HOST`/`AD_PASS` 已设，缺则 `unittest.skipTest`；注册 `atexit` 清理 PID 文件和临时 DB。`tearDownClass`：清理采集器残留 PID 文件和临时 SQLite DB。各测试方法无额外 `setUp`/`tearDown`。

| # | 用例 | 覆盖点 |
|---|---|---|
| 1 | `test_overview_all_markdown` | `overview.py all` → stdout 含 Markdown 表格 |
| 2 | `test_overview_all_json` | `overview.py all --format json` → stdout 可 `json.loads` |
| 3 | `test_overview_vs_subcommand` | `overview.py vs` → 只含 VS 表，不含证书表 |
| 4 | `test_overview_cert_subcommand` | `overview.py cert` → 含到期时间 |
| 5 | `test_perception_analyze_markdown` | `perception.py analyze` → stdout 含 4 段落 |
| 6 | `test_perception_conflict_markdown` | `perception.py conflict` → 含重叠检测 |
| 7 | `test_collector_sample_one_minute` | 启动采集器 → 跑 60s → 至少 1 条记录写入 SQLite → 优雅退出 |
| 8 | `test_auth_failure_exit_2` | 错误密码 → exit 2 |
| 9 | `test_connection_failure_exit_1` | 不可达主机 → exit 1 |
| 10 | `test_param_error_exit_4` | 缺 `--host` → exit 4 |

---

## 7. SKILL.md 设计

`ad-perception/SKILL.md` 参照 `ad-check-analysis/SKILL.md` 骨架，包含以下完整章节：

### 7.1 YAML 头部

```yaml
name: ad-perception
description: AD 设备感知分析 — 流量异常 / 状态告警 / 地址冲突 / 日志线索
```

### 7.2 功能概述

| 功能 | 说明 |
|---|---|
| 采集器守护进程 | 60s 采样 VS 指标落 SQLite |
| 流量趋势分析 | 3σ 异常检测（需采集器累积数据） |
| 设备状态分析 | CPU/内存/风扇/电源/接口阈值判定 |
| 地址冲突检测 | VS IP:Port 重叠 + Pool 节点重复 |
| 日志线索 | 异常事件 ± 5min 服务日志关联 |

### 7.3 CLI 命令参考

```bash
# 采集器（常驻后台）
python collector.py --host https://x.x.x.x --user admin --password xxx [--db vs_samples.db] [--interval 60]

# 全维度感知分析
python perception.py analyze --host https://x.x.x.x [--db vs_samples.db] [--format json]

# 单维度
python perception.py traffic --host ... --vs <name> [--db ...] [--format json]
python perception.py state --host ... [--disk-source check_report_dir] [--format json]
python perception.py conflict --host ... [--format json]
```

### 7.4 执行工作流

```
┌─ 采集器 ─────────────────────────────────────────┐
│ python collector.py --host ...                    │
│  → 首次启动: 建表                                 │
│  → 每 60s: get_vs_stat → INSERT                  │
│  → 保持运行（建议 Windows 任务计划 / systemd）     │
└──────────────────────────────────────────────────┘

┌─ 感知分析 ───────────────────────────────────────┐
│ python perception.py analyze --host ...           │
│  1. 流量: SQLite → 3σ 或 API 兜底                 │
│  2. 状态: get_sys_system + --disk-source          │
│  3. 日志: get_service_log (如有异常)               │
│  4. 冲突: get_vs × get_pools                      │
│  → render_markdown() → stdout                     │
└──────────────────────────────────────────────────┘
```

### 7.5 脚本强制规则

| 操作 | 必须使用 | 禁止使用 |
|---|---|---|
| 总览快照 | `python overview.py` | ❌ ad-ops 直调 API |
| 启动采集器 | `python collector.py` | ❌ 手动 HTTP 请求 |
| 感知分析 | `python perception.py analyze/traffic/state/conflict` | ❌ LLM 直调 API |
| 展示报告 | 脚本 stdout 原样贴入对话 | ❌ LLM 修改/总结/补全 |

### 7.6 已知设备

| 设备 | IP | 用户 |
|---|---|---|
| AD1 (21039) | 14.18.243.211:21039 | admin |
| AD2 (21044) | 14.18.243.211:21044 | admin |
| AD1 (旧) | 10.146.10.254 | admin |

> 密码通过 `--password` 或环境变量 `AD_PASS` 传入，不写入文件。

### 7.7 行为准则

**必须行为**：
- ✅ 所有分析通过 `perception.py` / `collector.py` 脚本
- ✅ 报告内容由脚本 `render_markdown()` 直接产出，LLM 原样展示
- ✅ 采集器未启动或数据不足 → 脚本在输出中明确告知，LLM 转述

**禁止行为**：
- ❌ LLM 直调 AD API
- ❌ LLM 分析、推断、判断异常
- ❌ LLM 修改脚本输出内容
- ❌ 混合其他 API 结果补充报告
- ❌ LLM "善意补救" 部分失败（exit 5 表示部分失败，应如实告知用户）
- ❌ 在会话中途运行 `ad-check-analysis` 来补充磁盘数据（应提示用户先跑巡检，然后用 `--disk-source` 传入）

### 7.8 报告展示规则

**必须将脚本 stdout 内容直接展示在对话消息正文中**，不要放在 shell 执行结果的折叠区域中。

- ✅ 正确：执行脚本获取结果后，将 Markdown/JSON 内容写在对话消息中直接展示
- ❌ 错误：把报告内容留在 shell 执行结果中，仅在对话中写"分析完成"

### 7.9 外部依赖

| 依赖 | 说明 |
|---|---|
| `ad-ops/scripts/ad_api.py` | 提供 `ADClient`（API 调用），import 失败 exit 9 |
| `ad-check-analysis` 巡检报告 | `perception.py state --disk-source` 需要 ad.json 中的 `disk_check`。**未提供时脚本标注缺失，不阻止其余分析** |
| SSL 证书 | `ADClient` 禁用 TLS 验证（`CERT_NONE`），仅适用于内网自签名环境。对外暴露时凭据可被 MITM 窃取 |
| 采集器累积时间 | 首次启动后需累积 ≥ 100 个采样点（约 2h）才能跑 3σ |

### 7.10 相关技能

- **ad-ops**: AD 智能运维（API 调用、设备管理），本技能通过 import 复用其 `ADClient`
- **ad-check-analysis**: AD 系统巡检，本技能 `--disk-source` 可摄入其巡检报告中的磁盘数据
- **ad-blackbox-analysis**: AD 黑盒日志分析，P0 不使用，P1 可用于深度根因

---

## 8. 错误处理矩阵

| 场景 | 脚本行为 | exit code |
|---|---|---|
| 完全成功 | stdout Markdown/JSON | **0** |
| 连接失败 | stderr `错误: 连接失败: {reason}` | **1** |
| 连接超时（>30s 无响应） | stderr `错误: 连接超时`（`ADClient` 默认 timeout=30s） | **1** |
| 全部 API 失败 | stderr `错误: 所有数据源获取失败` | **1** |
| 认证失败 | stderr `错误: 认证失败` | **2** |
| SQLite 写入失败 (collector) | stderr `错误: 数据库写入失败: {reason}` | **3** |
| 参数错误 | stderr `用法: ...` + help text | **4** |
| 单个 API 失败（其余正常） | 对应段落"获取失败: {reason}"，stderr 列出失败项，其余继续 | **5**（部分失败） |
| 采集器重复启动 | stderr `错误: 采集器已在运行 (PID=N)` | **6** |
| ADClient import 失败 | stderr `错误: 无法导入 ad_api.py` | **9** |

**关键**：exit code 0 仅当**所有数据源全部成功**。任何维度/API 失败 → exit 5，但成功部分仍输出。

---

## 9. 待确认 / 未来扩展

| 项 | 状态 |
|---|---|
| 行里平台 JSON Schema 对齐 | P1，Schema 留 TODO |
| 磁盘使用率 | `perception.py state --disk-source` 从巡检 `ad.json` 补充；未提供时标注缺失 |
| 多设备批量 | P0.5 |
| 黑盒日志深度根因 | P1 |
| Windows 任务计划注册（采集器自启动） | P0 交付文档说明 |
| perception.py 内部分模块化 | 当前 P0 单文件，若未来子模块独立维护可拆为 `traffic.py` / `state.py` / `conflict.py` |
