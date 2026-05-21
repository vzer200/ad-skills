---
name: ad-blackbox-analysis
description: 深信服 AD 设备黑盒日志分析技能，支持导出黑盒日志、解析审计日志和系统日志、生成分析报告。当用户提到"黑盒"、"黑盒日志"、"日志导出"、"审计日志"、"blackbox"时触发。
version: "2.0.0"
updated_at: "2026-05-21"
---

# AD 黑盒日志分析

深信服 AD 设备黑盒日志导出与分析。

## 适用场景

- 需要导出并分析 AD 设备审计日志（audit.csv）
- 需要进行深度审计回溯调查
- 需要查看历史操作记录（时间、用户、方法、状态）
- 需要从黑盒中提取系统日志进行排查
- 需要进行安全事件取证分析

## 不适用场景

- 需要实时服务日志查询 → 使用 **ad-perception** logs 子命令
- 需要查看设备概览（VS 列表、证书、硬件） → 使用 **ad-ops** overview
- 需要系统巡检报告 → 使用 **ad-check-analysis**
- 需要直接 API 调用或设备配置修改 → 使用 **ad-ops** ad_api.py

## 功能概述

| 功能 | 说明 |
|------|------|
| 导出黑盒 | 按时间范围导出黑盒日志（最大 7 天） |
| 任务状态查询 | 查询异步导出任务进度 |
| 下载解压 | 下载 tar.gz 并解压 |
| 审计日志分析 | 解析 audit.csv，分析操作记录 |
| 系统日志分析 | 解析系统日志 CSV，排查异常 |

## CLI 命令参考

```bash
# === 异步模式（推荐，需 LLM 每 10s 轮询进度）===

# 步骤 1: 启动导出（多设备，推荐）
python scripts/blackbox.py --hosts "https://192.168.8.30,https://192.168.8.31" \
  --password xxx --from-date 2026-05-14 --to-date 2026-05-20
# 返回: [IP1] event_id=xxx output_dir=/tmp/blackbox_analysis/IP1
#       [IP2] event_id=yyy output_dir=/tmp/blackbox_analysis/IP2
# LLM 必须原样保存 output_dir 值，后续 progress/download 直接传入

# 步骤 2: 查询进度（LLM 每 10s 对每台设备调用一次）
# 单设备
python scripts/blackbox.py progress --host https://192.168.8.30 --password xxx \
  --output /tmp/blackbox_analysis/https___192.168.8.30
# 多设备（一次查询所有）
python scripts/blackbox.py progress --hosts "https://192.168.8.30,https://192.168.8.31" \
  --password xxx --output /tmp/blackbox_analysis
# 返回: {"status": "RUNNING"|"SUCCESS"|"FAILED"|"NOT_FOUND", ...}

# 步骤 3: 下载+分析（仅当 progress 返回 SUCCESS 后）
python scripts/blackbox.py download --host https://192.168.8.30 --password xxx \
  --output /tmp/blackbox_analysis/https___192.168.8.30

# 单设备（异步启动，与多设备一致）
python scripts/blackbox.py --host https://10.146.10.254 --user admin --password admin \
  --from-date 2026-05-03 --to-date 2026-05-09 --archive-password admin
# 返回: event_id=xxx output_dir=/tmp/blackbox_analysis/...

# 多设备（异密码）
python scripts/blackbox.py --devices devices.json \
  --from-date 2026-05-03 --to-date 2026-05-09

# === 已废弃（向后兼容保留，请迁移到 download 子命令）===
# 警告: 以下命令仍可用但会输出 deprecation warning
python scripts/blackbox.py --host https://192.168.8.30 --password xxx \
  --complete /tmp/blackbox_analysis/https___192.168.8.30
```

## Workflow

```
异步模式:
  export (--hosts) → progress (每10s轮询) → download (仅SUCCESS后)
```

### 异步轮询流程（LLM 执行指南）

参照 check.py 的 progress + wait 模式：

1. **启动导出**: `python scripts/blackbox.py --hosts "..." --password xxx --from-date ... --to-date ...`
   - 脚本返回每台设备的 `output_dir` 和 `event_id`，LLM 必须原样保存
   - 不要修改或自行拼接 output_dir 路径

2. **轮询进度**: 等待 60-90s 后，每 10s 调用一次 `progress`
   ```bash
   # 多设备一次性查询
   python scripts/blackbox.py progress --hosts "..." --password xxx --output /tmp/blackbox_analysis
   ```
   - `NOT_FOUND`: 任务尚未来得及进入 `/last-event` 列表，继续等待
   - `RUNNING`: 仍在处理中，继续等待
   - `SUCCESS`: 可以进行下一步 download
   - `FAILED`: 导出失败，输出错误信息给用户

3. **下载分析**: 仅当 progress 返回 `SUCCESS` 后
   ```bash
   python scripts/blackbox.py download --host IP --password xxx --output <output_dir>
   ```

4. **输出展示**: 将 download 的 stdout 内容直接展示在对话消息正文中

### 超时处理指南

- `progress` 命令执行 < 2s，不会超时
- `download` 命令包含下载+解压+分析，大文件（7天数据）可能 > 60s
- 如果 `download` 超时：缩小时间范围（`--from-date` / `--to-date` 收紧到 1-3 天）后重新导出
- `progress` 返回的 `file_size_mb` 字段可供 LLM 预判文件大小

## Key Rules

### Time Range Limit
**最大 7 天**。超过时脚本会拒绝执行（stderr 警告 + 退出码 4）。LLM 检测到退出码 4 且 stderr 包含"超过 7 天"时应建议用户缩小日期范围。

### Password
使用 `password` 参数（明文），不用 `pk_password`。

### File Structure

```
blackbox.tar.gz (ZIP加密)
└── hislog/adlog1.tgz
    ├── hislog/           # 审计日志
    │   └── YYYYMMDD.audit/zh_CN/0.audit.csv
    └── log/              # 系统日志
        └── YYYYMMDD/zh_CN/0/*.csv
```

### Audit Log Fields

| Position | Field |
|----------|-------|
| 1 | 时间 |
| 2 | 用户 |
| 3 | 来源IP |
| 4 | 方法 (POST/GET/PUT/DELETE) |
| 5 | 模块 |
| 6 | 子模块 |
| 7 | 状态 (SUCCESS/FAILED) |
| 8 | 路径 |
| 9 | 错误码 |
| 10 | 描述 |

## 子命令选择决策

### 任务 → 命令映射

| 任务 | 命令 | 关键参数 |
|------|------|----------|
| 启动导出（单设备） | `blackbox.py --host ...` | `--from-date`, `--to-date` |
| 启动导出（多设备） | `blackbox.py --hosts "..."` | `--from-date`, `--to-date` |
| 查询导出进度（单设备） | `blackbox.py progress --host ...` | `--output` |
| 查询导出进度（多设备） | `blackbox.py progress --hosts "..."` | `--output` |
| 下载分析结果 | `blackbox.py download --host ...` | `--output`, `--archive-password` |

### 异步轮询流程

```
export (--hosts) → 等待 60-90s → progress (每10s轮询) → download (仅SUCCESS后)
```

### 多设备触发

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`
4. 密码不同时 → 必须用 `--devices` JSON 文件

## 脚本强制规则

| 操作 | 必须使用 | 禁止使用 |
|------|----------|----------|
| 单设备黑盒 | `python scripts/blackbox.py --host ...` | ❌ 直接调 API |
| 多设备黑盒 | `python scripts/blackbox.py --hosts "..."` | ❌ 直接调 API |
| 分析日志 | 脚本输出 | ❌ LLM 直读 CSV |

## 已知设备

> 权威来源: 项目根目录 `devices.json`。密码通过 `password_from` 引用环境变量，禁止明文存储。

| 设备 | IP | 用户名 |
|------|-----|------|
| AD1 | 192.168.8.30 | admin |
| AD2 | 192.168.8.31 | admin |

## 行为准则

### 必须行为
- ✅ 必须每次查询都要通过脚本调用获取实时数据，绝对不允许使用历史缓存数据或者捏造数据
- ✅ 所有操作通过 `scripts/blackbox.py` 脚本
- ✅ 报告由脚本直接产出
- ✅ 分析结果严格从黑盒日志文件获取

### 禁止行为
- ❌ LLM 直调 AD API
- ❌ LLM 分析、推断、判断结果
- ❌ LLM 修改脚本输出内容
- ❌ 混合其他 API 调用结果
- ❌ 脚本返回异常/报错时，LLM 不得尝试绕过脚本、换用其他方式、或自行补救。必须原样将错误信息报告给用户，由用户决定下一步操作

## 报告展示规则

**必须将脚本 stdout 内容直接展示在对话消息正文中**，不要放在 shell 执行结果的折叠区域中。

- 多设备输出含汇总表 + 每设备分块，可能较长
- LLM 全文展示，不截断、不折叠、不选择性展示
- 超过单条消息限制时分多条展示（保持设备分块完整）

## 外部依赖

| 依赖 | 说明 |
|------|------|
| `scripts/ad_api.py` | 提供 `ADClient`，API Base Path: `/api/lb/current-version/` |

## 错误码

| 场景 | exit code |
|------|----------|
| 完全成功 | 0 |
| 连接/API 失败 | 1 |
| 认证失败 | 2 |
| 参数错误 | 4 |
| 部分失败 | 5 |
| **多设备部分失败** | **7** |
| ADClient import 失败 | 9 |

## 模板文件

- 示例输入：[examples/input.md](examples/input.md)
- 期望输出：[examples/output.md](examples/output.md)
- 回归清单：[checks/checklist.md](checks/checklist.md)

## 相关技能

- **ad-ops**: AD 智能运维
- **ad-check-analysis**: AD 系统巡检
- **ad-perception**: AD 感知分析（流量异常/状态告警/地址冲突/日志线索）
