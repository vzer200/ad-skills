---
name: ad-connect
description: 深信服 AD 设备连接测试技能，在所有 AD 操作前验证设备连通性和认证状态。当用户提到"连接测试"、"测试连接"、"检查连通性"、"设备可达"、或作为其他 AD 技能的前置步骤时触发。
version: "1.0.0"
updated_at: "2026-05-21"
---

# AD 连接测试

测试 AD 设备的 TCP/TLS 可达性和 Basic Auth 认证，作为所有 AD 操作的前置步骤。

## 适用场景

- 其他 AD 技能执行前，验证目标设备连通性和认证
- 排查设备不可达或认证失败问题
- 批量验证多台设备的连接状态

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

## 外部依赖

| 依赖 | 说明 |
|------|------|
| `../ad-ops/scripts/ad_api.py` | 提供 `ADClient`、`ADConnectionError`、`ADAuthError` |
| `../ad-ops/scripts/multi_device.py` | 提供 `run_multi`、`parse_hosts_arg`、`host_slug` |
