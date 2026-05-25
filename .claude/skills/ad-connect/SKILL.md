---
name: ad-connect
description: 深信服 AD 设备连接预检 skill。用于在巡检、查询、感知分析、配置生成或真实设备验证前，验证 AD 设备 TCP/TLS 可达性和 Basic Auth 认证状态。用户提到连接测试、连通性、认证预检、设备可达、AD1/AD2 预检时触发。
---

# AD 连接预检

## 强制规则

- 连接状态必须由脚本判断，禁止模型凭经验判断设备是否可达。
- 其他 AD skill 在连接真实设备前必须先运行本 skill。
- 如果连接或认证失败，停止后续设备操作，并原样展示脚本 stdout/stderr。
- 本 skill 只能作为连接预检或其他 skill 的前置步骤。用户说“AD1 现在啥情况 / 当前情况 / 设备概况 / 查询 / 查看 / 配置 / VS / Pool / 证书 / 流量 / 状态”等运维查询意图时，禁止只执行 `connect.py` 后反问；连接成功后必须继续按 `ad-ops` 规则运行 `overview.py`。没有明确维度时默认 `overview.py config`。
- 支持 `devices.json`。在 WorkBot 上传包中，设备清单可能位于 `devices.json`、`skills/devices.json`、`skills/ad-connect/devices.json` 或 `.claude/skills/ad-connect/devices.json`；必须先检查这些位置并选择存在的文件，不要因为根目录没有 `devices.json` 就向用户追问地址或密码。
- shell 命令禁止使用 `2>&1` 合并 stderr/stdout；工具平台会单独保留 stderr，其他 skill 的验收会拒绝包含 `2>&1` 的工具命令。

## 命令

单设备：

```bash
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-connect/devices.json --device AD1 --format json
```

多设备或设备清单：

```bash
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-connect/devices.json --format json
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-connect/devices.json --format json
```

## 退出码

| code | 含义 |
| --- | --- |
| 0 | 全部通过 |
| 1 | 连接失败 |
| 2 | 认证失败 |
| 4 | 参数错误 |
| 7 | 多设备部分失败 |
| 9 | 脚本依赖导入失败 |

## 输出要求

用户可见结果必须来自 `connect.py` stdout。不要改写为“应该没问题”之类的模型判断。
