# AD Skills 模块

## 概述

`.claude/skills/` 包含 4 个深信服 AD 设备的运维分析技能，版本统一为 `v2.0.0`。所有技能共享统一的模板结构（SKILL.md + examples/ + checks/ + scripts/），通过 `ad-ops` 提供的 `ADClient` 作为公共 API 客户端。

## 统一三层模板结构

```
<skill-name>/
├── SKILL.md              # 技能定义（metadata、命令参考、执行流程、行为准则）
├── scripts/              # Python 脚本，LLM 禁止替代
├── examples/
│   ├── input.md          # 6 个典型使用场景
│   └── output.md         # 期望输出格式
└── checks/
    └── checklist.md      # 回归检查清单（10-12 项）
```

## 统一行为约束

- LLM 永不直调 AD API，所有操作必须通过 `scripts/` 下的脚本
- LLM 只做调度+展示，不做分析判断
- 报告内容由脚本 `render_markdown()` 产出，LLM 原样展示在对话正文中
- 多设备统一用 `--hosts` 参数
- 统一错误码：0=成功, 1=连接失败, 2=认证失败, 4=参数错误, 5=部分失败, 7=多设备部分失败, 9=import 失败

## 技能列表

### ad-ops — 智能运维（基础层）

| 项目 | 内容 |
|------|------|
| 路径 | `.claude/skills/ad-ops/` |
| 脚本 | `ad_api.py`, `overview.py`, `multi_device.py` |
| 职责 | 设备总览快照、VS/Pool/证书/HA/SSH/系统统计查询 |
| 典型命令 | `overview.py all --hosts "..."`, `ad_api.py --host ... users list` |
| 回归清单 | 11 项 |

**提供 `ADClient`**，被其他三个 skill 通过 import 复用。

### ad-check-analysis — 系统巡检

| 项目 | 内容 |
|------|------|
| 路径 | `.claude/skills/ad-check-analysis/` |
| 脚本 | `check.py` |
| 职责 | 标准/全量巡检，异步执行：启动→轮询→下载 ad.json → 分析输出 |
| 典型命令 | `check.py run --hosts "..." --scene "标准巡检"` |
| 回归清单 | 12 项 |

巡检结果分三类：功能巡检（版本/角色/心跳/安全）、健康巡检（CPU/内存/磁盘/网口/风扇/电源/内核日志）、安全巡检（SSH/弱密码/SSL策略/IP限制/开放端口）。

### ad-perception — 感知分析

| 项目 | 内容 |
|------|------|
| 路径 | `.claude/skills/ad-perception/` |
| 脚本 | `collector.py`, `perception.py`, `db_schema.py` |
| 职责 | 流量 3σ 异常检测、设备状态阈值告警、IP:Port 地址冲突检测、服务日志关联 |
| 典型命令 | `perception.py analyze --host ...`, `collector.py collect --hosts "..."` |
| 回归清单 | 10 项 |

采集器设计为一次性脚本（`collect` 子命令），由外部调度器每 55-60 分钟执行一次。感知分析支持数据不足时自动注入 trend API last-hour 数据。

### ad-blackbox-analysis — 黑盒日志分析

| 项目 | 内容 |
|------|------|
| 路径 | `.claude/skills/ad-blackbox-analysis/` |
| 脚本 | `blackbox.py` |
| 职责 | 导出黑盒 tar.gz（最大 7 天），解析 audit.csv + 系统日志 |
| 典型命令 | `blackbox.py --hosts "..." --from-date ... --to-date ...` |
| 回归清单 | 11 项 |

异步模式：export → progress（每 10s 轮询）→ download（SUCCESS 后）。audit.csv 含时间/用户/来源IP/方法/模块/状态等 10 个字段。

## 技能依赖关系

```
ad-ops (ADClient)
  ↑ import
  ├── ad-check-analysis/scripts/check.py
  ├── ad-perception/scripts/perception.py, collector.py
  └── ad-blackbox-analysis/scripts/blackbox.py
```

## 技能互斥边界

| 场景 | 使用 | 不使用 |
|------|------|--------|
| 巡检报告 | ad-check-analysis | ad-perception |
| 实时异常检测 | ad-perception | ad-check-analysis |
| 审计日志导出 | ad-blackbox-analysis | ad-perception logs |
| 实时服务日志 | ad-perception logs | ad-blackbox-analysis |
| 设备总览快照 | ad-ops overview | 其他三个 |

## 已知设备

> 权威来源: 项目根目录 `devices.json`

| 设备 | IP | 用户 |
|------|-----|------|
| AD1 | 192.168.8.30 | admin |
| AD2 | 192.168.8.31 | admin |
