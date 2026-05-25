---
name: ad-perception
description: 深信服 AD 感知分析 skill。用于分析 VS 流量异常、CPU/内存/磁盘/连接状态变化、IP:Port 冲突、Pool 节点重复、服务日志线索和异常增减趋势。用户提到感知分析、异常检测、流量突增、流量下降、地址冲突、状态告警、日志关联时触发。
---

# AD 感知分析

## 强制规则

- 路由硬隔离：只要用户文本或当前任务包含 `巡检`、`标准巡检`、`全量巡检`、`安全巡检`、`健康检查`、`巡检报告`，必须交给 `ad-check-analysis`。本 skill 禁止执行 `perception.py`、`connect.py` 或输出 `感知结论` 来回答巡检任务。
- 路由硬隔离：用户只问“AD1 现在啥情况 / 当前情况 / 设备概况 / 看一下 AD1 情况 / 设备状态 / 硬件状态 / 资源状态查一下”这类查询，且没有明确说“感知、异常、分析、趋势、冲突、日志”时，必须交给 `ad-ops`；本 skill 禁止用 `perception.py analyze` 或 `perception.py state` 抢答查询任务。
- 分析真实设备前必须先调用 `ad-connect`。
- 所有分析必须由 `skills/ad-perception/scripts/perception.py` 或 `collector.py` 生成。
- 脚本输出是唯一事实来源。禁止模型自行推断根因、编造异常、补充未由脚本返回的设备状态。
- 面向用户的正文不要展示“工具调用”、脚本名、退出码或 stdout/stderr 摘要；这些只供验收侧后台核验。
- 所有 shell 命令禁止使用 `2>&1` 合并 stderr/stdout；工具平台会单独保留 stderr，验收会拒绝包含 `2>&1` 的工具命令。
- 最终正文的 `markdown-body` 只能从 `## 感知结论` 开始，到 `## 结论边界` 结束。禁止出现 `工具调用`、`执行过程`、`命令摘要`、`connect.py`、`perception.py`、`collector.py`、`退出码`、`stdout`、`stderr`。
- 最终正文必须直接保留 `perception.py` 输出中从 `## 感知结论` 到 `## 结论边界` 的完整内容，不要二次改写、压缩、改标题、改表头、合并表格或新增结论边界条目。
- 逐字复制规则：如果脚本输出包含 `## 感知结论`，最终回答必须复制该区间内的脚本文字。不要把 `下降 82.1%` 改成 `↓ 82.1%`，不要给数字加千分位，不要把 `目标设备：192.168.8.31` 改成 `目标：AD2 (192.168.8.31)`。
- 禁止在脚本块之外新增 `小结`、`总结`、`建议`、`下一步`、`三项核心指标`、`显著下降`、`降至 0`、`当前值为 0` 等模型自行概括内容。
- 用户要求全量感知分析时，必须使用 `perception.py analyze`。
- 用户要求虚拟服务流量趋势分析时，必须先运行 `collector.py collect --collect-only` 写入 SQLite 历史库，再运行 `perception.py traffic --require-db` 查询数据库；禁止只用实时 API 或模型记忆回答趋势。
- 用户指定 AD1/AD2 时，连接预检和分析命令都必须用 `--device` 限定单台设备。设备清单可能位于 `devices.json`、`skills/devices.json`、`skills/ad-perception/devices.json` 或 `.claude/skills/ad-perception/devices.json`；必须先检查这些位置并选择存在的文件，不要因为根目录没有 `devices.json` 就向用户追问地址或密码。
- 如果 `perception.py traffic --require-db` 返回历史样本不足，最终结论只能说明数据库样本不足；禁止回退到实时 API 编造趋势结论。
- 验收提示词保持短句，不要要求用户补充命令参数。用户说 AD1 时自动先用设备清单加 `--device AD1` 做连接预检。
- 每一条新的感知分析都必须重新执行一次 `connect.py`，包括 traffic/state/conflict/logs 分项分析。禁止复用上一轮查询或感知里的连接结果。
- “流量趋势分析/流量分析/流量走势”映射到 `collector.py collect --collect-only` + `perception.py traffic --require-db`。如果用户明确指定某个虚拟服务名称（例如 `test 虚拟服务`），必须加 `--vs test`，不要扩大到全部虚拟服务。8.31 设备上的 `test` 虚拟服务是主线验收样例。
- “设备资源分析/资源状态异常/状态趋势/状态告警”映射到 `perception.py state`；只说“设备状态/硬件状态/资源状态查一下”仍属于 `ad-ops` 查询。
- “地址冲突/地址端口冲突/冲突分析”映射到 `perception.py conflict`；冲突结论只能复述脚本返回的 `vs_overlaps` / `pool_overlaps`，没有冲突时明确说未发现冲突，不要编造正例。
- “日志分析/服务日志/日志线索”映射到 `perception.py logs`。默认查最近 24 小时的告警日志，必须加 `--levels ALERT,ERROR --modules ALARM --limit 20`；用户明确说近 5 天/7 天等范围时加 `--days N`，用户指定其他日志类型时改用对应 `--modules`。输出只展示按时间倒序的最新 20 条，避免上下文过长。

## 全量感知分析

```bash
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py analyze --devices skills/ad-perception/devices.json --device AD1 --format markdown
```

## 分项分析

```bash
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD2 --format json
python3 skills/ad-perception/scripts/collector.py collect --devices skills/ad-perception/devices.json --device AD2 --collect-only
python3 skills/ad-perception/scripts/perception.py traffic --devices skills/ad-perception/devices.json --device AD2 --vs test --days 7 --require-db --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py state --devices skills/ad-perception/devices.json --device AD1 --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py conflict --devices skills/ad-perception/devices.json --device AD1 --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py logs --devices skills/ad-perception/devices.json --device AD1 --levels ALERT,ERROR --modules ALARM --limit 20 --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py logs --devices skills/ad-perception/devices.json --device AD1 --days 5 --levels ALERT,ERROR --modules ALARM --limit 20 --format markdown
```

## 最终回答复制规范

```text
## 感知结论
- 目标设备：<脚本输出原文>
- 分析范围：<脚本输出原文>
- 数据来源：<脚本输出原文>
- 状态：<脚本输出原文>

## 分析结果
<原样复制脚本输出；不要自行补充、不要格式化数值、不要新增小结>

## 结论边界
- 本结论只基于设备实时数据、历史基线和日志记录中能够确认的现象。
- 未返回证据的根因、趋势或处置建议不会展开。
```
