---
name: ad-check-analysis
description: 深信服 AD 巡检 skill。用于对 AD1/AD2 或批量设备执行标准巡检、全量巡检、历史巡检查询、进度轮询、报告下载与分析。用户提到巡检、标准巡检、批量巡检、健康检查、巡检报告、AD1 巡检时触发。
---

# AD 巡检

## 用户可见交互模板（最高优先级）

交互阶段的最终正文必须逐字使用下面模板；除了替换目标和场景，不允许添加任何前缀、后缀、原因、规则解释、工具说明或“根据技能...”之类的话。即使刚读取了本 skill，也不要把规则复述给用户。

场景未给出时，单设备只输出：

```text
请问你要对 AD1 执行哪种巡检？
标准巡检
全量巡检
安全巡检
```

场景未给出时，全部设备只输出：

```text
请问你要对全部 AD 设备执行哪种巡检？
标准巡检
全量巡检
安全巡检
```

用户已选择场景后，必须先执行连接预检和历史巡检查询。只有 `history` 输出的 `limit_reached: true`（即 `items` 实际达到 5 条）时，才输出确认问题。单设备确认问题只输出：

```text
已检查历史巡检记录，是否确认对 AD1 强制继续标准巡检？
```

用户已选择场景后，必须先执行连接预检和历史巡检查询。只有至少一台设备 `limit_reached: true` 时，才输出确认问题。全部设备确认问题只输出：

```text
已检查历史巡检记录，是否确认对全部 AD 设备强制继续标准巡检？
```

上面的 `AD1` 可替换为 AD2，场景选项必须来自设备 GET `/sys/offline-check/` 返回的列表。交互阶段如果平台要求每次对话必须调用工具，初次询问场景时调用 `check.py prompt --stage scene --devices ... --device AD1/AD2` 输出设备真实场景列表；用户选择场景后调用 `connect.py` 和 `check.py history` 查询真实设备历史。若 `limit_reached` 为 `false`，直接执行 `run -> progress -> wait`，不要追问强制；若 `limit_reached` 为 `true`，再调用 `check.py prompt --stage confirm` 输出固定确认问题。工具结果不能进入用户可见正文。

场景确认后的工具调用必须至少使用“连接预检 + 历史查询”固定组合，不能只执行 `check.py history`。单设备必须包含 `skills/ad-connect/scripts/connect.py --device AD1/AD2`；全部设备必须包含 `skills/ad-connect/scripts/connect.py --devices skills/ad-check-analysis/devices.json --format json`。如果连接预检失败，不要进入强制确认或巡检，直接返回连接失败信息让用户处理。

## 强制规则

- 路由优先级：只要用户文本或当前任务包含 `巡检`、`标准巡检`、`全量巡检`、`安全巡检`、`健康检查`、`巡检报告`，必须使用本 skill。禁止改用 `ad-ops`、`overview.py` 或“查询结论”模板回答巡检任务。
- 场景未确定前必须调用 `check.py prompt --stage scene --devices <设备清单> --device <AD1/AD2>` 生成场景选择问题，禁止手写或凭记忆复述该问题；这个命令会读取设备 GET `/sys/offline-check/` 的真实场景列表。除此之外只允许读取技能说明或设备清单，禁止提前执行 `overview.py` 或产出查询结果。用户补充场景后，必须先执行 `connect.py -> check.py history`。只有 `history` 输出 `limit_reached: true` 时才询问是否强制继续；否则直接执行 `run -> progress -> wait`。
- 交互硬停规则：用户只说“请对 AD1 做一次巡检”或“请对 AD 所有设备做一次巡检”时，最终正文只能询问巡检场景并列出设备 GET `/sys/offline-check/` 返回的场景，禁止执行 `check.py run`、`check.py progress`、`check.py wait`、`perception.py`、`overview.py`，禁止输出巡检/感知/查询报告。
- 交互硬停规则：首轮询问场景必须先真实调用 `check.py prompt --stage scene --devices <设备清单>`，单设备同时加 `--device AD1/AD2`，多设备 target 使用 `全部 AD 设备` 并用设备清单中第一台设备的真实场景列表。用户只回复某个场景名时，必须先执行 `connect.py` 和 `check.py history` 查询真实设备历史；当 `limit_reached: false` 时，直接启动巡检并输出报告；当 `limit_reached: true` 时，最终正文只能询问是否强制继续，禁止提前执行 `check.py run/progress/wait` 或输出报告。
- 用户可见正文不能解释“根据技能规则/根据技能的交互硬停规则/根据 ad-check-analysis/我需要遵守规则”，也不能写“下面汇总展示/报告均已获取成功”这类过程说明。交互阶段只给用户需要回答的问题；报告阶段只给报告本身；任何规则解释前缀都算失败。
- 第一次询问场景时，正文必须完全匹配 `check.py prompt --stage scene` 的输出，第一句必须是 `请问你要对 <目标> 执行哪种巡检？`，其余行只能列出设备 API 返回的场景。只有历史 `items` 实际达到 5 条时，第二次确认才必须完全匹配“用户可见交互模板”，第一句必须是 `已检查历史巡检记录，是否确认对 <目标> 强制继续<场景>？`。
- 巡检前必须先调用 `ad-connect` 做连接预检。
- 多设备巡检和单设备巡检一样必须先调用 `ad-connect`；全部设备场景不能因为后续会执行 `check.py history` 就省略连接预检。
- 所有业务逻辑必须由 `skills/ad-check-analysis/scripts/check.py` 执行。
- 用户选择场景后必须先查 `history`。历史上限只看脚本输出的 `record_count`/`limit_reached`，它们由 API `items` 数量计算；禁止用 `total_items`、`total` 或其它分页元数据判断是否需要强制。`limit_reached: false` 时不要询问强制，也不要给 `run` 加 `--force`。
- `run` 只负责启动巡检，必须显式传 `--work-dir`；随后调用一次 `progress` 获取状态，再调用 `wait --timeout 55 --poll-interval 5` 下载和分析报告。若 `wait` 因超时失败，再重复一次 `progress -> wait --timeout 55`。
- `progress` 输出中的 `progress_text` 必须展示给用户，例如 `目前巡检 23/35`；这个进度来自设备 progress API 的 `finished`/`total` 字段。
- 工具命令中绝对禁止出现 `sleep`、`Start-Sleep` 或 `sleep && python3 ... progress`。不要手动等待；`wait --poll-interval 5 --timeout 55` 自带短轮询，且不会超过平台 60 秒工具超时。
- 脚本输出是唯一事实来源。禁止模型自行生成巡检结论、风险项、分数或报告内容。
- 如果用户指定 AD1/AD2，优先使用设备清单中的主机和密码。设备清单可能位于 `devices.json`、`skills/devices.json`、`skills/ad-check-analysis/devices.json` 或 `.claude/skills/ad-check-analysis/devices.json`；必须先检查这些位置并选择存在的文件，不要因为根目录没有 `devices.json` 就向用户追问地址或密码。
- 验收交互必须像真实人工：不要要求用户补充命令参数。用户只说“请对 AD1 做一次巡检”时，先用短问题让用户选择设备 API 返回的场景；用户回答某个场景名后，先查连接和历史。只有 `limit_reached: true` 时再确认是否继续/强制，用户回答“强制”后执行脚本并加 `--force`；否则直接执行脚本，不加 `--force`。
- 如果用户首句已经明确“标准巡检/全量巡检/安全巡检”，不要再次追问场景，直接先查连接和历史；只有 `limit_reached: true` 时才追问“是否强制继续”。
- 用户说“AD 所有设备/全部 AD 设备”时，使用设备清单批量巡检，不要加 `--device AD1`。
- 评分准则：pass 按 1 分，warn 按 0.5 分，fail 按 0 分；综合评分只平均当前报告中实际出现的维度，不能让空的健康/安全/功能维度拉低分数。
- 用户要求标准巡检、全量巡检、安全巡检时，分别使用用户确认的场景名传给 `--scene`。
- 面向用户的最终答案只展示巡检模板和脚本报告内容，不展示“工具调用”、脚本名、命令、退出码、stdout/stderr。工具调用证据只供后台验收查看。
- 检查项必须显示中文名称，例如“设备安全状态检查”，不要在用户答案中显示 `DEVICE_SAFE_CHECK` 这类内部 ID。
- 最终答复必须展示 `progress` 返回的 `progress_text`，然后从脚本输出的 `## 巡检结论` 开始，到脚本报告结束为止原样展示；不要在报告前后追加执行表、工具调用摘要、命令摘要、`上方 stdout 已展示` 这类说明。
- 最终答复必须直接复制 `check.py wait` 最后一次成功输出的报告，不要自己重写、合并或改写分数、异常数量、设备汇总和建议。如果前一次 `wait` 因工作目录错误显示失败，不能把失败报告混入最终答案；应使用 `run` 返回的实际 `work_dir=` 再执行一次 `wait`，只输出成功报告。
- 最终正文的 `markdown-body` 是用户可见报告区，禁止出现 `## 工具调用`、`执行过程`、`命令摘要`、`connect.py`、`check.py`、`退出码`、`stdout`、`stderr`、`ad.json`。单设备巡检最终正文也禁止出现 `## 巡检过程` 和 `## 原始报告`。
- 不要把工具面板内容重新整理成用户正文。正确做法是直接粘贴 `check.py wait` 输出中从 `## 巡检结论` 到报告结束的内容。
- shell 命令不要加 `2>&1`，不要把 stderr 合并到 stdout；`wait` 默认只输出最终报告，需要排障时才加 `--verbose`，但排障日志也不能进入用户最终答案。

## 标准巡检工作流

```bash
export AD_CHECK_WORKDIR="${AD_CHECK_WORKDIR:-/tmp/ad_check_ad1}"
python3 skills/ad-check-analysis/scripts/check.py prompt --stage scene --target AD1 --devices skills/ad-check-analysis/devices.json --device AD1
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-check-analysis/devices.json --device AD1 --format json
python3 skills/ad-check-analysis/scripts/check.py history --devices skills/ad-check-analysis/devices.json --device AD1
# 仅当 history 中 limit_reached=true 时，才执行 confirm 并在 run 中加 --force。
python3 skills/ad-check-analysis/scripts/check.py run --devices skills/ad-check-analysis/devices.json --device AD1 --scene "标准巡检" --work-dir "$AD_CHECK_WORKDIR"
python3 skills/ad-check-analysis/scripts/check.py progress --devices skills/ad-check-analysis/devices.json --device AD1
python3 skills/ad-check-analysis/scripts/check.py wait --devices skills/ad-check-analysis/devices.json --device AD1 --work-dir "$AD_CHECK_WORKDIR" --poll-interval 5 --timeout 55
# 若 wait 超时未拿到报告，再重复 progress -> wait；不要使用 sleep。
```

全量巡检和安全巡检使用相同命令，只替换 `--scene "全量巡检"` 或 `--scene "安全巡检"`。

如果用户要求分步进度，`run` 返回了工作目录或任务 ID 后，后续 `progress/wait` 命令必须使用脚本返回值，不要凭记忆拼接。

## 批量巡检

```bash
export AD_CHECK_WORKDIR="${AD_CHECK_WORKDIR:-/tmp/ad_check_all}"
python3 skills/ad-check-analysis/scripts/check.py prompt --stage scene --target "全部 AD 设备" --devices skills/ad-check-analysis/devices.json
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-check-analysis/devices.json --format json
python3 skills/ad-check-analysis/scripts/check.py history --devices skills/ad-check-analysis/devices.json
# 仅当任一设备 history 中 limit_reached=true 时，才执行 confirm 并在 run 中加 --force。
python3 skills/ad-check-analysis/scripts/check.py run --devices skills/ad-check-analysis/devices.json --scene "标准巡检"
python3 skills/ad-check-analysis/scripts/check.py progress --devices skills/ad-check-analysis/devices.json
python3 skills/ad-check-analysis/scripts/check.py wait --devices skills/ad-check-analysis/devices.json --poll-interval 5 --timeout 55
# 若 wait 超时未拿到报告，再重复 progress -> wait；不要使用 sleep。
```

批量巡检交互流程与单设备一致：先问场景，再查连接和历史；只有任一设备 `limit_reached: true` 时才问是否强制继续。不要为多设备设计额外复杂分支。

## 单设备输出模板

```text
## 巡检结论
- 目标：<设备名> (<设备IP>)；多设备为“全部设备”
- 场景：<标准巡检/全量巡检/安全巡检>
- 总体状态：<✅ 正常/❌ 发现异常>
- 综合评分：<🟢/🟡/🔴 score/100（低风险/中风险/高风险）>
- 异常数量：<fail+warn> 项
- 数据来源：设备巡检报告

## 分类统计
| 类别 | 覆盖项 | ✅ 正常 | ❌ 异常 | 得分 |
| --- | ---: | ---: | ---: | ---: |
| 功能 | <n> | <n> | <n> | <score> |
| 健康 | <n> | <n> | <n> | <score> |
| 安全 | <n> | <n> | <n> | <score> |

## 设备基本信息

## 检查项明细

## 优化建议

## 健康评分
<展示脚本报告中用户需要看的内容；不要自行补充>
```

模板要求：

- 单设备巡检：目标必须显示为 `AD1 (192.168.8.30)` 这类“设备名（设备IP）”格式；不要显示 `AD1 (https://192.168.8.30)` 或重复 URL。
- 单设备巡检：不要展示 `## 巡检过程` 和 `## 原始报告`；`## 检查项明细` 可以列出全部检查项，包含正常项和异常项。
- 检查项明细中的状态只能是 `✅ 正常`、`❌ 异常`、`➖ 不适用` 三种；`warn` 和 `fail` 都对用户显示为 `❌ 异常`，功能未启用或设备形态不支持导致的无数据项显示为 `➖ 不适用`，且不计入评分分母、异常数量和优化建议。
- `## 检查项明细` 必须使用三列：`检查项 / 具体说明 / 状态`。`具体说明` 优先使用原生 API/report 的 `description`，没有原生值时使用脚本内置检查项说明；禁止出现 `当前发现` 列，禁止用 `-` 填空说明。
- `## 优化建议` 只列异常检查项（`warn`/`fail`），每个异常项都应给出可执行的排查或处理方向，不要使用空泛的“状态异常，建议进一步排查”。
- 不要在最终答案中写 `connect.py`、`check.py`、命令、退出码、stdout/stderr 或工具调用面板内容。
- 不要把工具面板内容重新整理成“工具调用”“执行过程”“命令摘要”表格；用户只需要巡检报告本身。

## 多设备输出模板

多设备巡检必须使用摘要模板，避免逐设备展开所有异常项导致上下文过长。禁止出现 `## 巡检过程`、`## 原始报告`、逐设备详情块和跨设备对比块。

```text
## 巡检结论
- 目标：全部 AD 设备
- 场景：<标准巡检/全量巡检/安全巡检>
- 设备数量：<n> 台
- 异常设备：<n> 台
- 总体风险：<🟢 低/🟡 中/🔴 高>

## 设备概览
| 设备 | IP | 状态 | 综合评分 | 异常项 |
| --- | --- | --- | ---: | ---: |
| AD1 | 192.168.8.30 | ❌ 异常 | 🔴 59/100 | 10 |

## 全局共性问题
| 问题 | 建议 |
| --- | --- |
```

多设备模板要求：

- 全局共性问题只展示所有成功巡检设备都存在的异常项；如果没有，写“未发现所有设备共同存在的异常项。”
- 不输出“高频异常”“重点关注设备”或逐台异常明细。
- 总体风险按成功巡检设备中的最低综合评分判断：`>=90` 为低，`70-89` 为中，`<70` 为高；如果存在连接/认证失败设备，总体风险为高。
