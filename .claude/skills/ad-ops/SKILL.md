---
name: ad-ops
description: 深信服 AD 运维查询 skill。用于查询 AD 设备配置、虚拟服务 VS、Pool、节点、SSL 证书到期时间、设备状态、HA、硬件、流量和系统统计。用户提到查询配置、查看 VS、查看 Pool、证书到期、设备状态、流量、AD1 概览时触发。
---

# AD 运维查询

## 强制规则

- 硬性验收规则：查询类最终回答必须以 `## 查询结论` 开头，必须包含 `## 工具调用`、`## 查询结果`、`## 覆盖说明`。缺少任一标题即视为任务失败。
- 最终回答必须复制 `overview.py --format markdown` 的 stdout 原文。不要改写成自定义表格，不要只摘取 VS/Pool/证书数据，不要把脚本输出重新组织成自己的摘要。
- `## 工具调用` 中必须出现字面量 `connect.py` 和 `overview.py <维度>`，并写明退出码/stdout 摘要；即使工具面板已经展示调用，最终回答也必须保留这两个脚本名。
- 查询真实设备前必须先调用 `ad-connect`。
- 用户要“配置、流量、状态、证书”整体视图时，必须使用 `overview.py all`。
- 用户要特定维度时，必须先用 `connect.py` 验证目标设备，再使用 `overview.py vs|pool|cert|hardware|ha|traffic`；不要直接调用 `ad_api.py` 给用户生成查询结果。
- 输出必须来自脚本 stdout。禁止模型自己拼接 VS、Pool、证书或状态表。
- 支持 `devices.json` 中的 AD1/AD2。设备清单可能位于 `devices.json`、`skills/devices.json`、`skills/ad-ops/devices.json` 或 `.claude/skills/ad-ops/devices.json`；必须先检查这些位置并选择存在的文件，不要因为根目录没有 `devices.json` 就向用户追问地址或密码。
- 验收提示词保持短句，不要要求用户补充命令参数。用户说 AD1 时自动使用设备清单并加 `--device AD1`。
- 若设备清单中的地址不可达，但同一设备的内网地址可达，可以使用可达地址完成查询；必须在“覆盖说明”中说明地址切换原因，不要询问用户是否修改 `devices.json`。
- “虚拟服务配置/VS 配置”映射到 `overview.py vs`；“节点配置/节点池/Pool 配置”映射到 `overview.py pool`；整体配置、流量、状态、证书查询映射到 `overview.py all`。
- “SSL 证书/证书到期”映射到 `overview.py cert`；“流量情况”映射到 `overview.py traffic`；“HA 状态”映射到 `overview.py ha`；“设备状态/硬件状态”映射到 `overview.py hardware`。

## 总览查询

```bash
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --device AD1 --format json
python3 skills/ad-ops/scripts/overview.py all --devices skills/ad-ops/devices.json --device AD1 --format markdown
```

## 分项查询

```bash
python3 skills/ad-ops/scripts/overview.py vs --devices skills/ad-ops/devices.json --device AD1 --format markdown
python3 skills/ad-ops/scripts/overview.py pool --devices skills/ad-ops/devices.json --device AD1 --format markdown
python3 skills/ad-ops/scripts/overview.py cert --devices skills/ad-ops/devices.json --device AD1 --format markdown
python3 skills/ad-ops/scripts/overview.py traffic --devices skills/ad-ops/devices.json --device AD1 --format markdown
python3 skills/ad-ops/scripts/overview.py hardware --devices skills/ad-ops/devices.json --device AD1 --format markdown
python3 skills/ad-ops/scripts/overview.py ha --devices skills/ad-ops/devices.json --device AD1 --format markdown
```

## 输出模板

最终回答必须使用以下四个二级标题，标题文字不能改，不能缺失，不能用其他顶级标题替代。最简单可靠的做法是：运行 `overview.py --format markdown` 后，直接把 stdout 从 `## 查询结论` 到 `## 覆盖说明` 完整粘贴给用户，再补充必要的退出码摘要。

```text
## 查询结论
- 目标：<AD1>
- 维度：<all/vs/pool/cert/traffic/hardware/ha>
- 结果来源：overview.py stdout
- 状态：<成功/失败>

## 工具调用
- connect.py：<成功/失败>，<目标、认证摘要、退出码/stdout 摘要>
- overview.py <维度>：<成功/失败>，<退出码/stdout 摘要>

## 查询结果
<原样展示 overview.py stdout；不要自行补充>

## 覆盖说明
- 若为 all：必须覆盖配置、流量、设备状态、SSL 证书。
- 若为单项：只展示用户请求的维度，避免混入模型自行整理的额外结论。
- 如果使用了备用/内网地址：说明原地址不可达和本次实际查询地址。
```

禁止在最终回答末尾向用户反问是否修改配置、是否继续查询或是否补充参数。
