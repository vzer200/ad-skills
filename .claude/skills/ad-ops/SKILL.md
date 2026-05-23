---
name: ad-ops
description: 深信服 AD 运维查询 skill。用于查询 AD 设备配置、虚拟服务 VS、Pool、节点、SSL 证书到期时间、设备状态、HA、硬件、流量和系统统计。用户提到查询配置、查看 VS、查看 Pool、证书到期、设备状态、流量、AD1 概览时触发。
---

# AD 运维查询

## 强制规则

- 路由硬隔离：只要用户文本或当前任务包含 `巡检`、`标准巡检`、`全量巡检`、`安全巡检`、`健康检查`、`巡检报告`，必须交给 `ad-check-analysis`，本 skill 禁止执行 `overview.py`、`connect.py` 或生成查询模板。
- 如果用户第一句是“请对 AD1 做一次巡检”这类未指定场景的巡检请求，不要按“概览查询”处理；应进入巡检交互：先询问场景，再询问是否强制继续，然后由 `ad-check-analysis` 执行。
- 硬性验收规则：查询类最终回答必须以 `## 查询结论` 开头，必须包含 `## 查询范围`、`## 查询结果`、`## 覆盖说明`。缺少任一标题即视为任务失败。
- 最终回答必须复制 `overview.py --format markdown` 的正文输出。不要改写成自定义表格，不要只摘取 VS/Pool/证书数据，不要把脚本输出重新组织成自己的摘要。
- 面向用户的正文不要展示“工具调用”、脚本名、退出码或 stdout/stderr 摘要；这些只供验收侧后台核验。
- 最终正文的 `markdown-body` 只能从 `## 查询结论` 开始，到 `## 覆盖说明` 结束。禁止出现 `工具调用`、`执行过程`、`命令摘要`、`connect.py`、`overview.py`、`退出码`、`stdout`、`stderr`。
- shell 命令不要加 `2>&1`，不要把 stderr 合并到 stdout；需要排障时可以查看工具面板里的 stderr，但排障日志不能进入用户最终答案。
- 工具面板里的真实命令必须先单独执行 `skills/ad-connect/scripts/connect.py`，再执行 `skills/ad-ops/scripts/overview.py`。不能把 `overview.py` stdout 中提到的 `connect.py` 当作连接预检。
- 每一条新的用户查询都必须重新执行一次 `connect.py`。禁止复用上一轮 VS/Pool/证书查询里的连接预检结果。
- 查询真实设备前必须先调用 `ad-connect`。
- 用户要“配置、流量、状态、证书”整体视图时，必须使用 `overview.py all`。
- 用户要特定维度时，必须先用 `connect.py` 验证目标设备，再使用 `overview.py vs|pool|cert|hardware|ha|traffic`；不要直接调用 `ad_api.py` 给用户生成查询结果。
- 输出必须来自脚本结果。禁止模型自己拼接 VS、Pool、证书或状态表。
- 支持 `devices.json` 中的 AD1/AD2。设备清单可能位于 `devices.json`、`skills/devices.json`、`skills/ad-ops/devices.json` 或 `.claude/skills/ad-ops/devices.json`；必须先检查这些位置并选择存在的文件，不要因为根目录没有 `devices.json` 就向用户追问地址或密码。
- 验收提示词保持短句，不要要求用户补充命令参数。用户说 AD1 时自动使用设备清单并加 `--device AD1`。
- 用户说“所有 AD 设备 / 全部 AD / 多台设备”时，必须使用 `--devices skills/ad-ops/devices.json`，不要加 `--device AD1` 或 `--device AD2`，让脚本按设备清单查询全部设备。
- 若设备清单中的地址不可达，但同一设备的内网地址可达，可以使用可达地址完成查询；必须在“覆盖说明”中说明地址切换原因，不要询问用户是否修改 `devices.json`。
- “虚拟服务配置/VS 配置”映射到 `overview.py vs`；“节点配置/节点池/Pool 配置”映射到 `overview.py pool`；整体配置、流量、状态、证书查询映射到 `overview.py all`。
- “SSL 证书/证书到期”映射到 `overview.py cert`；“流量情况”映射到 `overview.py traffic`；“HA 状态”映射到 `overview.py ha`；“设备状态/硬件状态”映射到 `overview.py hardware`。

## 总览查询

```bash
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --device AD1 --format json && python3 skills/ad-ops/scripts/overview.py all --devices skills/ad-ops/devices.json --device AD1 --format markdown
```

## 多设备查询

```bash
# 所有 AD 设备的 VS / 虚拟服务
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --format json && python3 skills/ad-ops/scripts/overview.py vs --devices skills/ad-ops/devices.json --format markdown
```

## 分项查询

分项查询必须复制对应的一整条命令：先 `connect.py`，再 `overview.py`。禁止只执行 `overview.py` 后半段。

```bash
# VS / 虚拟服务
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --device AD1 --format json && python3 skills/ad-ops/scripts/overview.py vs --devices skills/ad-ops/devices.json --device AD1 --format markdown

# Pool / 节点池 / 节点配置
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --device AD1 --format json && python3 skills/ad-ops/scripts/overview.py pool --devices skills/ad-ops/devices.json --device AD1 --format markdown

# SSL 证书
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --device AD1 --format json && python3 skills/ad-ops/scripts/overview.py cert --devices skills/ad-ops/devices.json --device AD1 --format markdown

# 流量
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --device AD1 --format json && python3 skills/ad-ops/scripts/overview.py traffic --devices skills/ad-ops/devices.json --device AD1 --format markdown

# 设备/硬件状态
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --device AD1 --format json && python3 skills/ad-ops/scripts/overview.py hardware --devices skills/ad-ops/devices.json --device AD1 --format markdown

# HA 状态
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-ops/devices.json --device AD1 --format json && python3 skills/ad-ops/scripts/overview.py ha --devices skills/ad-ops/devices.json --device AD1 --format markdown
```

## 输出模板

最终回答必须使用以下四个二级标题，标题文字不能改，不能缺失，不能用其他顶级标题替代。最简单可靠的做法是：运行 `overview.py --format markdown` 后，直接把 stdout 从 `## 查询结论` 到 `## 覆盖说明` 完整粘贴给用户。

```text
## 查询结论
- 目标：<AD1>
- 维度：<all/vs/pool/cert/traffic/hardware/ha>
- 数据来源：设备实时查询
- 状态：<成功/失败>

## 查询范围
- <整体查询/单项查询/多设备查询说明>
- 连接校验和设备读取已完成。

## 查询结果
<原样展示查询结果；不要自行补充>

## 覆盖说明
- 若为 all：必须覆盖配置、流量、设备状态、SSL 证书。
- 若为单项：只展示用户请求的维度，避免混入模型自行整理的额外结论。
- 如果使用了备用/内网地址：说明原地址不可达和本次实际查询地址。
```

禁止在最终回答末尾向用户反问是否修改配置、是否继续查询或是否补充参数。
