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

用户已选择场景后，必须先执行连接预检和历史巡检查询，再输出确认问题。单设备只输出：

```text
已检查历史巡检记录，是否确认对 AD1 强制继续标准巡检？
```

用户已选择场景后，必须先执行连接预检和历史巡检查询，再输出确认问题。全部设备只输出：

```text
已检查历史巡检记录，是否确认对全部 AD 设备强制继续标准巡检？
```

上面的 `AD1` 可替换为 AD2，`标准巡检` 可替换为全量巡检或安全巡检。交互阶段如果平台要求每次对话必须调用工具，初次询问场景时调用 `check.py prompt --stage scene` 输出固定问题；用户选择场景后调用 `connect.py` 和 `check.py history` 查询真实设备历史，再调用 `check.py prompt --stage confirm` 输出固定确认问题。工具结果不能进入用户可见正文。

## 强制规则

- 路由优先级：只要用户文本或当前任务包含 `巡检`、`标准巡检`、`全量巡检`、`安全巡检`、`健康检查`、`巡检报告`，必须使用本 skill。禁止改用 `ad-ops`、`overview.py` 或“查询结论”模板回答巡检任务。
- 场景未确定前必须调用 `check.py prompt --stage scene` 生成场景选择问题，禁止手写或凭记忆复述该问题；除此之外只允许读取技能说明或设备清单，禁止提前连接设备、执行 `overview.py` 或产出查询结果。用户补充场景后，必须先执行 `connect.py -> check.py history`，然后询问是否强制继续；用户确认强制继续后，才执行 `run -> progress -> wait`。
- 交互硬停规则：用户只说“请对 AD1 做一次巡检”或“请对 AD 所有设备做一次巡检”时，最终正文只能询问巡检场景并列出 `标准巡检 / 全量巡检 / 安全巡检`，禁止执行 `connect.py`、`check.py`、`perception.py`、`overview.py`，禁止输出巡检/感知/查询报告。
- 交互硬停规则：首轮询问场景必须先真实调用 `check.py prompt --stage scene`，单设备 target 使用 `AD1/AD2`，多设备 target 使用 `全部 AD 设备`。用户只回复 `标准巡检`、`全量巡检` 或 `安全巡检` 时，必须先执行 `connect.py` 和 `check.py history` 查询真实设备历史，然后最终正文只能询问是否强制继续；禁止执行 `check.py run`、`check.py progress`、`check.py wait`，禁止输出报告。只有用户随后明确回复 `强制`、`继续` 或 `强制继续` 后，才允许启动巡检。
- 用户可见正文不能解释“根据技能规则/根据技能的交互硬停规则/根据 ad-check-analysis/我需要遵守规则”，也不能写“下面汇总展示/报告均已获取成功”这类过程说明。交互阶段只给用户需要回答的问题；报告阶段只给报告本身；任何规则解释前缀都算失败。
- 第一次询问场景时，正文必须完全匹配“用户可见交互模板”，第一句必须是 `请问你要对 <目标> 执行哪种巡检？`，只能列出 `标准巡检 / 全量巡检 / 安全巡检`。第二次确认时，正文必须完全匹配“用户可见交互模板”，第一句必须是 `已检查历史巡检记录，是否确认对 <目标> 强制继续<场景>？`。
- 巡检前必须先调用 `ad-connect` 做连接预检。
- 所有业务逻辑必须由 `skills/ad-check-analysis/scripts/check.py` 执行。
- 用户选择场景后必须先查 `history`，并在用户确认强制继续后再分步执行 `run -> progress -> wait`。WorkBot 工具调用约 60 秒会超时，禁止使用 `run --wait` 这类长阻塞命令。
- `run` 只负责启动巡检，必须显式传 `--work-dir`；随后调用一次 `progress` 获取状态，再调用 `wait --timeout 55 --poll-interval 5` 下载和分析报告。若 `wait` 因超时失败，再重复一次 `progress -> wait --timeout 55`。
- 工具命令中绝对禁止出现 `sleep`、`Start-Sleep` 或 `sleep && python3 ... progress`。不要手动等待；`wait --poll-interval 5 --timeout 55` 自带短轮询，且不会超过平台 60 秒工具超时。
- 脚本输出是唯一事实来源。禁止模型自行生成巡检结论、风险项、分数或报告内容。
- 如果用户指定 AD1/AD2，优先使用设备清单中的主机和密码。设备清单可能位于 `devices.json`、`skills/devices.json`、`skills/ad-check-analysis/devices.json` 或 `.claude/skills/ad-check-analysis/devices.json`；必须先检查这些位置并选择存在的文件，不要因为根目录没有 `devices.json` 就向用户追问地址或密码。
- 验收交互必须像真实人工：不要要求用户补充命令参数。用户只说“请对 AD1 做一次巡检”时，先用短问题让用户选择场景；用户回答“标准巡检/全量巡检/安全巡检”后，先查连接和历史，再确认是否继续/强制；用户回答“强制”后执行脚本并加 `--force`。
- 如果用户首句已经明确“标准巡检/全量巡检/安全巡检”，不要再次追问场景，直接先查连接和历史，再追问“是否强制继续”。
- 用户说“AD 所有设备/全部 AD 设备”时，使用设备清单批量巡检，不要加 `--device AD1`。
- 评分准则：pass 按 1 分，warn 按 0.5 分，fail 按 0 分；综合评分只平均当前报告中实际出现的维度，不能让空的健康/安全/功能维度拉低分数。
- 用户要求标准巡检、全量巡检、安全巡检时，分别使用用户确认的场景名传给 `--scene`。
- 面向用户的最终答案只展示巡检模板和脚本报告内容，不展示“工具调用”、脚本名、命令、退出码、stdout/stderr。工具调用证据只供后台验收查看。
- 检查项必须显示中文名称，例如“设备安全状态检查”，不要在用户答案中显示 `DEVICE_SAFE_CHECK` 这类内部 ID。
- 最终答复必须从脚本输出的 `## 巡检结论` 开始，到脚本报告结束为止原样展示；不要在报告前后追加执行表、工具调用摘要、命令摘要、`上方 stdout 已展示` 这类说明。
- 最终答复必须直接复制 `check.py wait` 最后一次成功输出的报告，不要自己重写、合并或改写分数、异常数量、设备汇总和建议。如果前一次 `wait` 因工作目录错误显示失败，不能把失败报告混入最终答案；应使用 `run` 返回的实际 `work_dir=` 再执行一次 `wait`，只输出成功报告。
- 最终正文的 `markdown-body` 是用户可见报告区，禁止出现 `## 工具调用`、`执行过程`、`命令摘要`、`connect.py`、`check.py`、`退出码`、`stdout`、`stderr`、`ad.json`。单设备巡检最终正文也禁止出现 `## 巡检过程` 和 `## 原始报告`。
- 不要把工具面板内容重新整理成用户正文。正确做法是直接粘贴 `check.py wait` 输出中从 `## 巡检结论` 到报告结束的内容。
- shell 命令不要加 `2>&1`，不要把 stderr 合并到 stdout；`wait` 默认只输出最终报告，需要排障时才加 `--verbose`，但排障日志也不能进入用户最终答案。

## 标准巡检工作流

```bash
export AD_CHECK_WORKDIR="${AD_CHECK_WORKDIR:-/tmp/ad_check_ad1}"
python3 skills/ad-check-analysis/scripts/check.py prompt --stage scene --target AD1
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-check-analysis/devices.json --device AD1 --format json
python3 skills/ad-check-analysis/scripts/check.py history --devices skills/ad-check-analysis/devices.json --device AD1
python3 skills/ad-check-analysis/scripts/check.py prompt --stage confirm --target AD1 --scene "标准巡检"
python3 skills/ad-check-analysis/scripts/check.py run --devices skills/ad-check-analysis/devices.json --device AD1 --scene "标准巡检" --force --work-dir "$AD_CHECK_WORKDIR"
python3 skills/ad-check-analysis/scripts/check.py progress --devices skills/ad-check-analysis/devices.json --device AD1
python3 skills/ad-check-analysis/scripts/check.py wait --devices skills/ad-check-analysis/devices.json --device AD1 --work-dir "$AD_CHECK_WORKDIR" --poll-interval 5 --timeout 55
# 若 wait 超时未拿到报告，再重复 progress -> wait；不要使用 sleep。
```

全量巡检和安全巡检使用相同命令，只替换 `--scene "全量巡检"` 或 `--scene "安全巡检"`。

如果用户要求分步进度，`run` 返回了工作目录或任务 ID 后，后续 `progress/wait` 命令必须使用脚本返回值，不要凭记忆拼接。

## 批量巡检

```bash
export AD_CHECK_WORKDIR="${AD_CHECK_WORKDIR:-/tmp/ad_check_all}"
python3 skills/ad-check-analysis/scripts/check.py prompt --stage scene --target "全部 AD 设备"
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-check-analysis/devices.json --format json
python3 skills/ad-check-analysis/scripts/check.py history --devices skills/ad-check-analysis/devices.json
python3 skills/ad-check-analysis/scripts/check.py prompt --stage confirm --target "全部 AD 设备" --scene "标准巡检"
python3 skills/ad-check-analysis/scripts/check.py run --devices skills/ad-check-analysis/devices.json --scene "标准巡检" --force
python3 skills/ad-check-analysis/scripts/check.py progress --devices skills/ad-check-analysis/devices.json
python3 skills/ad-check-analysis/scripts/check.py wait --devices skills/ad-check-analysis/devices.json --poll-interval 5 --timeout 55
# 若 wait 超时未拿到报告，再重复 progress -> wait；不要使用 sleep。
```

批量巡检交互流程与单设备一致：先问场景，再问是否强制继续；用户回复“强制”后执行。不要为多设备设计额外复杂分支。

## 输出模板

```text
## 巡检结论
- 目标：<设备名> (<设备IP>)；多设备为“全部设备”
- 场景：<标准巡检/全量巡检/安全巡检>
- 数据来源：设备巡检报告
- 综合评分：<score>/100
- 异常数量：<fail+warn>

## 分类统计
| 类别 | 检查项 | 通过 | 异常 | 得分 |
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
- 多设备巡检：保持同样的 `巡检结论 / 巡检过程 / 分类统计 / 原始报告` 顶层结构，但设备详情只列异常项；全部正常时写“所有检查项通过，无异常”，不要展开所有正常检查项。
- 检查项明细中的状态只能是 `正常` 或 `异常` 两种；`warn` 和 `fail` 都对用户显示为 `异常`，不要展示警告/失败图标。
- 不要在最终答案中写 `connect.py`、`check.py`、命令、退出码、stdout/stderr 或工具调用面板内容。
- 不要把工具面板内容重新整理成“工具调用”“执行过程”“命令摘要”表格；用户只需要巡检报告本身。
