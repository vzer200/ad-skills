---
name: ad-blackbox-analysis
description: 深信服 AD 设备黑盒日志分析技能，支持导出黑盒日志、解析审计日志和系统日志、生成分析报告。当用户提到"黑盒"、"黑盒日志"、"日志导出"、"审计日志"、"blackbox"时触发。
---

# AD 黑盒日志分析

深信服 AD 设备黑盒日志导出与分析。

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
# 单设备（阻塞等待完成）
python scripts/blackbox.py --host https://10.146.10.254 --user admin --password admin \
  --from-date 2026-05-03 --to-date 2026-05-09 --archive-password admin

# 多设备（异步启动，推荐）
python scripts/blackbox.py --hosts "https://192.168.8.30,https://192.168.8.31" \
  --password xxx --from-date 2026-05-14 --to-date 2026-05-20
# 返回 event_id + output_dir，LLM 等待 60-90s 后调用 --complete

# 完成异步导出（下载+分析）
python scripts/blackbox.py --host https://192.168.8.30 --password xxx \
  --complete /tmp/blackbox_analysis/https___192.168.8.30

# 多设备同步等待（需平台超时充足）
python scripts/blackbox.py --hosts "..." --password xxx --from-date ... --to-date ... --wait

# 多设备（异密码）
python scripts/blackbox.py --devices devices.json \
  --from-date 2026-05-03 --to-date 2026-05-09
```

## Workflow

```
导出黑盒 → 查询任务状态 → 下载文件 → 解压分析
```

## Key Rules

### Time Range Limit
**最大 7 天**。超过时 LLM 必须调整为最近 7 天并告知用户。脚本本身不执行此校验。

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
- ✅ 所有操作通过 `scripts/blackbox.py` 脚本
- ✅ 报告由脚本直接产出
- ✅ 分析结果严格从黑盒日志文件获取

### 禁止行为
- ❌ LLM 直调 AD API
- ❌ LLM 分析、推断、判断结果
- ❌ LLM 修改脚本输出内容
- ❌ 混合其他 API 调用结果

## 报告展示规则

**必须将脚本 stdout 内容直接展示在对话消息正文中**，不要放在 shell 执行结果的折叠区域中。

- 多设备输出含汇总表 + 每设备分块，可能较长
- LLM 全文展示，不截断、不折叠、不选择性展示
- 超过单条消息限制时分多条展示（保持设备分块完整）

## 多设备触发决策

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`（单台设备行为与 `--host` 等价）
4. 密码不同时 → 必须用 `--devices` JSON 文件

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

## 相关技能

- **ad-ops**: AD 智能运维
- **ad-check-analysis**: AD 系统巡检
- **ad-perception**: AD 感知分析（流量异常/状态告警/地址冲突/日志线索）
