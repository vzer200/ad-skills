---
name: ad-ops
description: 深信服 AD 运维查询 skill。用于查询 AD 设备配置、虚拟服务 VS、Pool、节点、SSL 证书到期时间、设备状态、HA、硬件、流量和系统统计。用户提到查询配置、查看 VS、查看 Pool、证书到期、设备状态、流量、AD1 概览时触发。
---

# AD 运维查询

## 强制规则

- 查询真实设备前必须先调用 `ad-connect`。
- 用户要“配置、流量、状态、证书”整体视图时，必须使用 `overview.py all`。
- 用户要特定维度时，使用 `overview.py vs|pool|cert|hardware|ha|traffic` 或 `ad_api.py` 对应子命令。
- 输出必须来自脚本 stdout。禁止模型自己拼接 VS、Pool、证书或状态表。
- 支持 `devices.json` 中的 AD1/AD2；密码从 `AD1_PASS`、`AD2_PASS` 环境变量读取。用户指定 AD1/AD2 时必须用 `--device` 限定单台设备。

## 总览查询

```bash
python3 skills/ad-connect/scripts/connect.py --devices devices.json --device AD1 --format json
python3 skills/ad-ops/scripts/overview.py all --devices devices.json --device AD1 --format markdown
```

## 分项查询

```bash
python3 skills/ad-ops/scripts/overview.py vs --devices devices.json --device AD1 --format markdown
python3 skills/ad-ops/scripts/overview.py pool --devices devices.json --device AD1 --format markdown
python3 skills/ad-ops/scripts/overview.py cert --devices devices.json --device AD1 --format markdown
python3 skills/ad-ops/scripts/overview.py traffic --devices devices.json --device AD1 --format markdown
```

## 输出模板

```text
## 查询目标
<设备和维度>

## 工具调用
- connect.py: <exit code/摘要>
- overview.py: <exit code/摘要>

## 查询结果
<原样展示 overview.py stdout；不要自行补充>
```
