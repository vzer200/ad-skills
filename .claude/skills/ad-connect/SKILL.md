---
name: ad-connect
description: 深信服 AD 设备连接测试技能，在所有 AD 操作前验证设备连通性和认证状态。当用户提到"连接测试"、"测试连接"、"检查连通性"、"设备可达"、或作为其他 AD 技能的前置步骤时触发。
version: "2.0.0"
updated_at: "2026-05-21"
---

# AD 连接测试

测试 AD 设备的 TCP/TLS 可达性和 Basic Auth 认证，作为所有 AD 操作的前置步骤。

## 功能概述

| 功能 | 说明 |
|------|------|
| 连接测试 | TCP/TLS 可达性 + Basic Auth 认证 |

## 适用场景

- 其他 AD 技能执行前，验证目标设备连通性和认证
- 排查设备不可达或认证失败问题
- 批量验证多台设备的连接状态

## 不适用场景

- 需要巡检报告格式的综合健康检查 → 使用 **ad-check-analysis**
- 需要流量异常检测或状态告警 → 使用 **ad-perception**
- 需要导出黑盒审计日志或系统日志 → 使用 **ad-blackbox-analysis**
- 需要设备运维操作（VS/Pool/证书/HA等） → 使用 **ad-ops**

## CLI 命令参考

```bash
# 单设备
python scripts/connect.py --host https://192.168.8.30 --password xxx

# 多设备
python scripts/connect.py --hosts "https://192.168.8.30,https://192.168.8.31" --password xxx

# 设备清单
python scripts/connect.py --devices devices.json

# JSON 输出
python scripts/connect.py --hosts "IP1,IP2" --password xxx --format json
```

## 输出格式

汇总表，区分三种状态：

| 状态 | 图标 | 含义 |
|------|------|------|
| 正常 | ✅ | TCP/TLS 可达 + Basic Auth 通过 |
| 连接失败 | 🔌 | 设备不可达、端口不通、超时 |
| 认证失败 | 🔑 | 用户名或密码错误 (401/403) |

## 退出码

| 场景 | exit code |
|------|----------|
| 全部通过 | 0 |
| 全部连接失败 | 1 |
| 全部认证失败 | 2 |
| 参数错误 | 4 |
| 部分失败 | 7 |
| ADClient import 失败 | 9 |

## 子命令选择决策

| 用户意图 | 命令 | 参数 |
|----------|------|------|
| 单设备连接测试 | `connect.py` | `--host` |
| 多设备连接测试 | `connect.py` | `--hosts` 或 `--devices` |

### 多设备触发

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`（单台设备行为与 `--host` 等价）
4. 密码不同时 → 必须用 `--devices` JSON 文件

## 脚本强制规则

| 操作 | 必须使用 | 禁止使用 |
|------|----------|----------|
| 连接测试 | `python scripts/connect.py --host[s] ...` | ❌ 直调 API |

## 行为准则

### 必须行为
- ✅ 必须在其他 AD 技能执行前运行，作为前置步骤
- ✅ 全部 OK → 自动继续后续流程，不打断用户
- ✅ 部分失败 → 告知用户失败设备列表，自动对连通设备继续
- ✅ 全部失败 → 终止流程，报告具体错误原因

### 禁止行为
- ❌ LLM 跳过连接测试直接执行 AD 操作
- ❌ 连接失败后 LLM 尝试绕过或自行补救

## 报告展示规则

**必须将脚本 stdout 内容直接展示在对话消息正文中**，不要放在 shell 执行结果的折叠区域中。

- 连接测试结果表格直接展示在聊天中
- LLM 全文展示，不截断、不折叠
- 多设备时展示汇总表，逐设备列出状态

## 外部依赖

| 依赖 | 说明 |
|------|------|
| `../ad-ops/scripts/ad_api.py` | 提供 `ADClient`、`ADConnectionError`、`ADAuthError` |
| `../ad-ops/scripts/multi_device.py` | 提供 `run_multi`、`parse_hosts_arg`、`host_slug` |

## 模板文件

- 示例输入：[examples/input.md](examples/input.md)
- 期望输出：[examples/output.md](examples/output.md)
- 回归清单：[checks/checklist.md](checks/checklist.md)

## 相关技能

- **ad-perception**: AD 感知分析（流量异常/状态告警/地址冲突/日志线索）
- **ad-check-analysis**: AD 系统巡检
- **ad-blackbox-analysis**: AD 黑盒日志分析
- **ad-ops**: AD 智能运维
