---
name: ad-perception
description: 深信服 AD 感知分析 skill。用于分析 VS 流量异常、CPU/内存/磁盘/连接状态变化、IP:Port 冲突、Pool 节点重复、服务日志线索和异常增减趋势。用户提到感知分析、异常检测、流量突增、流量下降、地址冲突、状态告警、日志关联时触发。
---

# AD 感知分析

## 强制规则

- 路由硬隔离：只要用户文本或当前任务包含 `巡检`、`标准巡检`、`全量巡检`、`安全巡检`、`健康检查`、`巡检报告`，必须交给 `ad-check-analysis`。本 skill 禁止执行 `perception.py`、`connect.py` 或输出 `感知结论` 来回答巡检任务。
- 路由硬隔离：用户只问“AD1 现在啥情况 / 当前情况 / 设备概况 / 看一下 AD1 情况 / 设备状态 / 硬件状态 / 资源状态查一下”这类查询，且没有明确说“感知、异常、分析、趋势、冲突、日志”时，必须交给 `ad-ops`；本 skill 禁止用 `perception.py analyze` 或 `perception.py state` 抢答查询任务。
- 分析真实设备前必须先调用 `ad-connect`。
- 所有默认分析必须由 `skills/ad-perception/scripts/perception.py` 生成。`collector.py` 仅作为历史兼容工具保留，WorkBot 默认流程禁止启动采集器或依赖 SQLite 历史库。
- 脚本输出是唯一事实来源。禁止模型自行推断根因、编造异常、补充未由脚本返回的设备状态。
- 面向用户的正文不要展示“工具调用”、脚本名、退出码或 stdout/stderr 摘要；这些只供验收侧后台核验。
- 所有 shell 命令禁止使用 `2>&1` 合并 stderr/stdout；工具平台会单独保留 stderr，验收会拒绝包含 `2>&1` 的工具命令。
- 命令写法必须保持 stdout/stderr 分离：正确写法是 `python3 ... --format markdown`；错误写法是 `python3 ... --format markdown 2>&1`。执行 `connect.py`、`perception.py`、`collector.py` 时都不要追加任何 `2>&1` 重定向。
- 最终正文的 `markdown-body` 只能从 `## 感知结论` 开始，到 `## 结论边界` 结束。禁止出现 `工具调用`、`执行过程`、`命令摘要`、`connect.py`、`perception.py`、`collector.py`、`退出码`、`stdout`、`stderr`。
- 最终正文必须直接保留 `perception.py` 输出中从 `## 感知结论` 到 `## 结论边界` 的完整内容，不要二次改写、压缩、改标题、改表头、合并表格或新增结论边界条目。
- 逐字复制规则：如果脚本输出包含 `## 感知结论`，最终回答必须复制该区间内的脚本文字。不要把 `下降 82.1%` 改成 `↓ 82.1%`，不要给数字加千分位，不要把 `目标设备：192.168.8.31` 改成 `目标：AD2 (192.168.8.31)`。
- 即使命令使用 `--html-out` 生成 HTML 趋势产物，最终正文仍只能复制脚本输出的 `## 感知结论` 到 `## 结论边界` 区间；不要额外说明 HTML 路径、文件大小、包含内容或脚本命令。产物生成证据只保留在工具调用面板。
- 生成资源状态或虚拟服务流量 HTML 趋势产物后，必须继续用工具检查该 HTML 内容，确认包含 `<svg`、`class="data-point"`、`class="point-time-label"` 和低密度窗口的 `class="point-value-label"`；不要直接把 `HTML_CHECK ...` 当 shell 命令执行，必须用真实检查命令打印短证据行，例如 `python3 -c 'from pathlib import Path; p=Path("/opt/agent/data/outputs/ad-state-trend-AD1-20260602-1020-1200.html"); h=p.read_text(encoding="utf-8"); print("HTML_CHECK file=%s svg=%d polyline=%d data-point=%d value-label=%d time-label=%d" % (p, h.count("<svg"), h.count("<polyline"), h.count("class=\"data-point\""), h.count("class=\"point-value-label\""), h.count("class=\"point-time-label\"")))'`。证据行不要进入最终正文。`data-point` 必须大于 0，表示每个采样点已经画到图中；`time-label` 必须大于 0，表示图上每个采样时间有可见对应；`value-label` 在最近一天/最近一个月这类低密度固定时间段中必须大于 0，表示图上能直接看到具体数值；当某个窗口内每个指标只有 1 个采样点时，`polyline=0` 可以接受，因为图中会以圆点、时间和数值展示单点。
- 虚拟服务流量 HTML 的连接数、新建速率、总吞吐量属于不同量纲，验收时必须确认它们视觉可区分：不能只统计 `data-point`、`polyline` 数量，还要检查不同指标的折线坐标没有完全重叠，或确认页面使用独立 Y 轴/分面图展示。固定时间段低密度样本中，每个指标都应有可见圆点、对应时间标签和数值标签。虚拟服务流量 HTML 的检查证据必须打印分面数量、指标标题数量和每条折线的纵向范围，例如 `python3 -c 'from pathlib import Path; import re; p=Path("/opt/agent/data/outputs/ad-traffic-trend-AD2-test-20260605-1020-1200.html"); h=p.read_text(encoding="utf-8"); spans=[]; [spans.append(round(max([float(x.split(",")[1]) for x in pts.split()])-min([float(x.split(",")[1]) for x in pts.split()]),1)) for pts in re.findall(r"<polyline[^>]*class=\"data-line\"[^>]*points=\"([^\"]+)\"", h)]; print("TRAFFIC_HTML_CHECK file=%s facets=%d metric_titles=%d polyline=%d data_point=%d value_label=%d time_label=%d y_spans=%s" % (p, h.count("class=\"plot-bg\""), h.count("class=\"metric-title\""), h.count("<polyline"), h.count("class=\"data-point\""), h.count("class=\"point-value-label\""), h.count("class=\"point-time-label\""), spans))'`。证据行不要进入最终正文。
- 禁止在脚本块之外新增 `小结`、`总结`、`建议`、`下一步`、`三项核心指标`、`显著下降`、`降至 0`、`当前值为 0` 等模型自行概括内容。
- 用户要求全量感知分析时，必须使用 `perception.py analyze`。
- 用户要求设备资源/状态趋势分析时，必须使用 `perception.py state` 直接查询设备趋势 API；禁止启动 `collector.py` 或依赖 SQLite 历史库。状态趋势支持 `last-hour`、`last-day`、`last-month`，分别对应页面上的最近 1 小时、最近 1 天、最近 1 个月。用户给出固定起止时间段时，必须先按“结束时间离当前时间有多远”选择能覆盖该时间段的最小滚动窗口：固定区间整体仍在最近 1 小时内时必须用 `--trend last-hour`，不能因为日期是今天就改成 `last-day`；固定区间超出最近 1 小时但整体在最近 24 小时内用 `--trend last-day`；固定区间超出最近 24 小时但整体在最近 1 个月内用 `--trend last-month`。例如当前为 2026-06-02 21:10 时，`2026年6月2日20点32分到21点02分` 必须用 `last-hour`；`2026年6月2日10点20分到12点00分` 用 `last-day`；两天前的一小时也必须用 `last-month`。同时加 `--from-time "YYYY-MM-DD HH:MM:SS" --to-time "YYYY-MM-DD HH:MM:SS"` 由脚本裁剪该窗口内的点。在 WorkBot 中，只要固定时间段状态趋势提示出现，就必须同时加 `--html-out` 生成 HTML 趋势产物，即使用户没有显式要求生成 HTML；同日文件名使用 `/opt/agent/data/outputs/ad-state-trend-{设备名}-{YYYYMMDD}-{HHMM}-{HHMM}.html`，跨日期文件名使用 `/opt/agent/data/outputs/ad-state-trend-{设备名}-{起始YYYYMMDD}-{起始HHMM}-{结束YYYYMMDD}-{结束HHMM}.html`。
- 固定时间段资源状态趋势属于强制工具任务：如果用户文本同时包含设备名、起止时间和“资源状态趋势/状态趋势/趋势分析”，第一轮回答不得纯文字解释、不得要求用户补充命令参数，必须依次调用 `connect.py`、`perception.py state --trend ... --from-time ... --to-time ... --html-out ... --format markdown`，然后用真实检查命令验证 HTML 中 `<svg`、`data-point`、`point-time-label`。没有工具调用证据时该轮视为失败。
- 用户要求虚拟服务流量趋势分析时，必须使用 `perception.py traffic` 直接查询设备 VS 趋势 API；禁止启动 `collector.py`、禁止依赖 SQLite 历史库、禁止加 `--require-db`。如果用户明确指定某个虚拟服务名称（例如 `test 虚拟服务`），必须加 `--vs test`，不要扩大到全部虚拟服务。8.31 设备上的 `test` 虚拟服务是扩展验收样例。
- 流量趋势必须设置趋势窗口：默认使用 `--trend last-hour`；用户明确给出起止时间时，按与资源状态趋势相同的规则选择 `last-hour`、`last-day` 或 `last-month` 中能覆盖固定时间段的最小窗口，并加 `--from-time "YYYY-MM-DD HH:MM:SS" --to-time "YYYY-MM-DD HH:MM:SS"` 由脚本裁剪采样点。
- 在 WorkBot 中，只要出现虚拟服务流量趋势提示，就必须同时加 `--html-out` 生成 HTML 趋势产物；默认文件名使用 `/opt/agent/data/outputs/ad-traffic-trend-{设备名}-{虚拟服务名}-{窗口}.html`，固定时间段同日文件名使用 `/opt/agent/data/outputs/ad-traffic-trend-{设备名}-{虚拟服务名}-{YYYYMMDD}-{HHMM}-{HHMM}.html`，跨日期文件名使用 `/opt/agent/data/outputs/ad-traffic-trend-{设备名}-{虚拟服务名}-{起始YYYYMMDD}-{起始HHMM}-{结束YYYYMMDD}-{结束HHMM}.html`。
- 用户指定 AD1/AD2 时，连接预检和分析命令都必须用 `--device` 限定单台设备。设备清单可能位于 `devices.json`、`skills/devices.json`、`skills/ad-perception/devices.json` 或 `.claude/skills/ad-perception/devices.json`；必须先检查这些位置并选择存在的文件，不要因为根目录没有 `devices.json` 就向用户追问地址或密码。
- 如果 `perception.py traffic` 返回样本不足，最终结论只能说明设备趋势 API 在该时间段有效样本不足；禁止回退到采集器或模型自行补点。
- 验收提示词保持短句，不要要求用户补充命令参数。用户说 AD1 时自动先用设备清单加 `--device AD1` 做连接预检。
- 每一条新的感知分析都必须重新执行一次 `connect.py`，包括 traffic/state/conflict/logs 分项分析。禁止复用上一轮查询或感知里的连接结果。
- “流量趋势分析/流量分析/流量走势”映射到 `perception.py traffic --trend last-hour`，并在 WorkBot 中加 `--html-out` 生成 HTML 趋势产物。如果用户明确指定某个虚拟服务名称（例如 `test 虚拟服务`），必须加 `--vs test`，不要扩大到全部虚拟服务。8.31 设备上的 `test` 虚拟服务是扩展验收样例。
- “设备资源分析/资源状态异常/状态趋势/状态告警”映射到 `perception.py state --trend last-hour`；用户指定“最近一天/一天/24 小时”时改用 `--trend last-day`，指定“最近一个月/一个月”时改用 `--trend last-month`。用户指定固定时间段时按覆盖窗口选窗：最近 1 小时内的短区间用 `--trend last-hour --from-time "2026-06-02 20:32:00" --to-time "2026-06-02 21:02:00"`；超出最近 1 小时但仍在最近 24 小时内的区间用 `--trend last-day --from-time "2026-06-02 10:20:00" --to-time "2026-06-02 12:00:00"`；两天前的一小时段要用 `--trend last-month`。在 WorkBot 中加 `--html-out /opt/agent/data/outputs/ad-state-trend-AD1-20260602-1020-1200.html` 生成 HTML 趋势产物。只说“设备状态/硬件状态/资源状态查一下”仍属于 `ad-ops` 查询。
- “地址冲突/地址端口冲突/冲突分析”映射到 `perception.py conflict`；冲突结论只能复述脚本返回的 `vs_overlaps` / `pool_overlaps`，没有冲突时明确说未发现冲突，不要编造正例。
- “日志分析/服务日志/日志线索”短范围查询映射到 `perception.py logs`。默认查最近 24 小时所有模块的告警/错误日志，必须加 `--levels ALERT,ERROR --limit 20`，不要默认加 `--modules ALARM`。用户明确说“地址冲突类型日志/地址端口冲突日志/IP 冲突日志”时，必须加 `--log-type address-conflict`，这是脚本本地语义过滤，不是设备模块过滤，禁止为这个需求加 `--modules`。只有用户明确指定 APPD、SYS、ALARM 这类设备日志模块时才加 `--modules`。输出只展示按时间倒序的最新 20 条，避免上下文过长。
- 日志长范围或语义过滤查询必须走进度式流程，禁止直接调用同步 `perception.py logs`：当用户明确说近 5 天、7 天、30 天、最近一个月，或任何 `--days N` 且 `N > 1` 的日志查询，尤其是 `--log-type address-conflict`，必须先执行 `logs-start` 创建任务，再用 `logs-wait --timeout 55` 推进；若返回状态仍为“进行中”，继续调用 `logs-progress` 或 `logs-wait`，直到脚本输出完成状态后再复制最终结果。不要因为同步 `logs` 超时就下结论说设备日志接口异常。

## 全量感知分析

```bash
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py analyze --devices skills/ad-perception/devices.json --device AD1 --format markdown
```

## 分项分析

```bash
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD2 --format json
python3 skills/ad-perception/scripts/perception.py traffic --devices skills/ad-perception/devices.json --device AD2 --vs test --trend last-hour --html-out /opt/agent/data/outputs/ad-traffic-trend-AD2-test-last-hour.html --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py state --devices skills/ad-perception/devices.json --device AD1 --trend last-hour --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py state --devices skills/ad-perception/devices.json --device AD1 --trend last-day --from-time "2026-06-02 10:20:00" --to-time "2026-06-02 12:00:00" --html-out /opt/agent/data/outputs/ad-state-trend-AD1-20260602-1020-1200.html --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py conflict --devices skills/ad-perception/devices.json --device AD1 --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py logs --devices skills/ad-perception/devices.json --device AD2 --levels ALERT,ERROR --limit 20 --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD2 --format json
python3 skills/ad-perception/scripts/perception.py logs-start --devices skills/ad-perception/devices.json --device AD2 --days 5 --levels ALERT,ERROR --limit 20 --format markdown
python3 skills/ad-perception/scripts/perception.py logs-wait --devices skills/ad-perception/devices.json --device AD2 --job-id <上一步返回的任务ID> --timeout 55 --format markdown

python3 skills/ad-connect/scripts/connect.py --devices skills/ad-perception/devices.json --device AD2 --format json
python3 skills/ad-perception/scripts/perception.py logs-start --devices skills/ad-perception/devices.json --device AD2 --days 30 --levels ALERT,ERROR --limit 20 --log-type address-conflict --format markdown
python3 skills/ad-perception/scripts/perception.py logs-wait --devices skills/ad-perception/devices.json --device AD2 --job-id <上一步返回的任务ID> --timeout 55 --format markdown
python3 skills/ad-perception/scripts/perception.py logs-progress --devices skills/ad-perception/devices.json --device AD2 --job-id <任务ID> --format markdown
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
