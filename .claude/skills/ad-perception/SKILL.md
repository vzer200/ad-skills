---
name: ad-perception
description: 深信服 AD 设备感知分析技能，支持流量3σ异常检测、设备状态阈值告警、IP:Port地址冲突检测和日志线索关联。当用户提到"感知分析"、"异常检测"、"流量分析"、"状态告警"、"冲突检测"、"日志关联"时触发。
---

# AD 感知分析

AD 设备感知分析技能，提供 VS 流量趋势异常检测、设备状态阈值判定、地址冲突检测和日志线索关联。

## 功能概述

| 功能 | 说明 |
|------|------|
| 采集器定时任务 | 一次性拉取 trend API `last-hour` 数据注入 SQLite，由外部调度器定时执行 |
| 流量趋势分析 | 3σ 异常检测（注入后立即可用，无冷启动） |
| 设备状态分析 | CPU/内存/风扇/电源/接口阈值判定 |
| 地址冲突检测 | VS IP:Port 重叠 + Pool 节点重复 |
| 日志线索 | 异常事件 ± 5min 服务日志关联 |

## CLI 命令参考

```bash
# === 采集器（推荐：一次性定时任务）===
# 单设备
python scripts/collector.py collect --host https://x.x.x.x --user admin --password xxx [--db vs_samples.db]

# 多设备
python scripts/collector.py collect --hosts "https://IP1,https://IP2" --password xxx
python scripts/collector.py collect --devices devices.json

# === 采集器（已废弃：常驻守护进程）===
python scripts/collector.py daemon --host https://x.x.x.x --password xxx [--interval 30]

# === 感知分析 ===
# 全维度（单设备）
python scripts/perception.py analyze --host https://x.x.x.x --password xxx [--db vs_samples.db] [--format json]

# 多设备
python scripts/perception.py analyze --hosts "https://IP1,https://IP2" --password xxx [--db ...]
python scripts/perception.py analyze --devices devices.json [--db ...]

# 单维度
python scripts/perception.py traffic --host ... --vs <name> [--db ...] [--format json]
python scripts/perception.py state --host ... [--disk-source check_report_dir] [--format json]
python scripts/perception.py conflict --host ... [--format json]
```

## 执行工作流

```
┌─ 采集（一次性，平台每 55-60 分钟调度一次）────────┐
│ python scripts/collector.py collect --host ...       │
│  1. _fetch_vs_names() → 获取所有 VS 名              │
│  2. get_vs_trend_by_name(last-hour) → ~60 点/指标   │
│  3. _inject_trend_into_db() → INSERT OR REPLACE     │
│  4. query_traffic_db() → 重新查询                   │
│  5. _run_3sigma_on_vs_group() → 3σ 异常检测         │
│  6. render_markdown() → 输出报告                    │
│  → 耗时 < 5s，无冷启动                              │
└────────────────────────────────────────────────────┘

┌─ 感知分析 ───────────────────────────────────────┐
│ python scripts/perception.py analyze --host ...    │
│  1. 流量: SQLite → 3σ（若 DB 不足 100 行，自动注入 │
│     trend API last-hour 数据后再跑 3σ）            │
│  2. 状态: get_sys_system + --disk-source          │
│  3. 日志: get_service_log (如有异常)               │
│  4. 冲突: get_vs × get_pools                      │
│  → render_markdown() → stdout                     │
└──────────────────────────────────────────────────┘
```

## 脚本强制规则

| 操作 | 必须使用 | 禁止使用 |
|------|----------|----------|
| 总览快照 | `python ../ad-ops/scripts/overview.py` | ❌ ad-ops 直调 API |
| 定时采集 | `python scripts/collector.py collect --host ...` | ❌ 手动 HTTP 请求 |
| 启动守护进程 | `python scripts/collector.py daemon --host ...` (deprecated) | ❌ 手动 HTTP 请求 |
| 单设备感知分析 | `python scripts/perception.py analyze --host ...` | ❌ LLM 直调 API |
| 多设备感知分析 | `python scripts/perception.py analyze --hosts "..."` | ❌ LLM 直调 API |
| 展示报告 | 脚本 stdout 原样贴入对话 | ❌ LLM 修改/总结/补全 |

## 已知设备

> 权威来源: 项目根目录 `devices.json`。密码通过 `password_from` 引用环境变量，禁止明文存储。

| 设备 | IP | 用户 |
|------|-----|------|
| AD1 | 192.168.8.30 | admin |
| AD2 | 192.168.8.31 | admin |
| AD1 (21039) | 14.18.243.211:21039 | admin |
| AD2 (21044) | 14.18.243.211:21044 | admin |

> 密码通过 `--password` 或环境变量 `AD_PASS` 传入，不写入文件。

## 行为准则

### 必须行为
- ✅ 所有分析通过 `scripts/perception.py` / `scripts/collector.py` 脚本
- ✅ 报告内容由脚本 `render_markdown()` 直接产出，LLM 原样展示
- ✅ 采集器未启动或数据不足 → 脚本在输出中明确告知，LLM 转述

### 禁止行为
- ❌ LLM 直调 AD API
- ❌ LLM 分析、推断、判断异常
- ❌ LLM 修改脚本输出内容
- ❌ 混合其他 API 结果补充报告
- ❌ LLM "善意补救" 部分失败（exit 5 表示部分失败，应如实告知用户）
- ❌ 在会话中途运行 `ad-check-analysis` 来补充磁盘数据（应提示用户先跑巡检，然后用 `--disk-source` 传入）

## 报告展示规则

**必须将脚本 stdout 内容直接展示在对话消息正文中**，不要放在 shell 执行结果的折叠区域中。

- 多设备输出含汇总表 + 每设备分块，可能较长
- LLM 全文展示，不截断、不折叠、不选择性展示
- 超过单条消息限制时分多条展示（保持设备分块完整）

## 定时调度指南

**采集器设计为一次性脚本，由外部调度器定时执行。脚本本身不含调度逻辑。**

LLM 在以下场景应主动告知用户设置定时调度：

1. 用户首次使用采集器 → 建议设置每 55-60 分钟的定时任务
2. 用户询问"怎么自动采集" → 告知平台调度器方案
3. 用户询问"为什么没数据" → 检查是否已设置定时调度

**用户需要调度的命令（示例）：**

```bash
# Windows 任务计划 / Linux cron / 其他调度平台，每 55 分钟执行:
python scripts/collector.py collect --hosts "IP1,IP2" --password xxx

# 或使用 devices.json（密码从环境变量读取）:
python scripts/collector.py collect --devices devices.json
```

**调度间隔说明：** trend API `last-hour` 返回最近 60 分钟数据，调度间隔 ≤ 60 分钟即可保证数据连续性。建议 55 分钟（留 5 分钟余量）。

## 多设备触发决策

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`（单台设备行为与 `--host` 等价）
4. 密码不同时 → 必须用 `--devices` JSON 文件

## 外部依赖

| 依赖 | 说明 |
|------|------|
| `../ad-ops/scripts/ad_api.py` | 提供 `ADClient`（API 调用），import 失败 exit 9 |
| `ad-check-analysis` 巡检报告 | `perception.py state --disk-source` 需要 ad.json 中的 `disk_check`。**未提供时脚本标注缺失，不阻止其余分析** |
| SSL 证书 | `ADClient` 禁用 TLS 验证（`CERT_NONE`），仅适用于内网自签名环境 |
| 采集器定时调度 | LLM 应告知用户：用平台调度器（cron/Windows 任务计划）每 55-60 分钟执行一次 `collector.py collect` |

## 错误码

| 场景 | exit code |
|------|----------|
| 完全成功 | 0 |
| 连接失败 | 1 |
| 全部 API 失败 | 1 |
| 认证失败 | 2 |
| SQLite 写入失败 | 3 |
| 参数错误 | 4 |
| 部分失败（其余正常） | 5 |
| 采集器重复启动 | 6 |
| **多设备部分失败** | **7** |
| ADClient import 失败 | 9 |

## 相关技能

- **ad-ops**: AD 智能运维（API 调用、设备管理），本技能通过 import 复用其 `ADClient`
- **ad-check-analysis**: AD 系统巡检，本技能 `--disk-source` 可摄入其巡检报告中的磁盘数据
- **ad-blackbox-analysis**: AD 黑盒日志分析，P0 不使用，P1 可用于深度根因
