# WorkBot Acceptance Prompts

This document records the fixed WorkBot upload, cleanup, automation, and acceptance prompts for AD requirements 1-4.

Do not store WorkBot or AD device passwords in this repository. Use the operator-provided credentials at runtime.

## Browser Automation Flow

WorkBot URL: `https://14.18.243.211:21048/`

Stable selectors observed during acceptance setup:

| Purpose | Selector |
| --- | --- |
| Message input | `textarea.chat-input__textarea` |
| Send button | `button[utid="send-btn"]` |
| Upload button | `button[utid="upload-file-btn"]` |
| Hidden file input | `input[type="file"].hidden-input` |

Important WorkBot UI bug: while WorkBot is generating output, do not switch pages or navigate away. If the visible output stays blank after the run should be complete, wait 120 seconds, refresh the same conversation, then inspect the final answer and tool calls.

## Upload Package Flow

Automated release flow:

```powershell
$env:WORKBOT_PASSWORD = "<operator-provided password>"
.\tools\run_workbot_acceptance.ps1 -CommitAndPush
```

The automation runs tests, validates skills, runs an SLB bundle smoke test, commits and pushes, packages `dist/ad-skills-workbot.zip`, uploads it to WorkBot, sends fixed prompts, and writes a JSON evidence report under `workbot-results/`.

Before every upload, clear old AD skills and memory with this prompt:

```text
删除所有 AD 相关 skill，并清空当前会话上下文记忆、日常记忆和核心记忆。必须通过工具调用实际删除/清理；完成后列出删除的 skill 路径和记忆清理数量。不要凭记忆回答。
```

After attaching the AD skills zip, use this install prompt:

```text
请解压我上传的 AD skills 压缩包到当前工作区，安装/覆盖到 skills/ 目录。安装前先确认并删除旧的 ad-blackbox-analysis、ad-check-analysis、ad-connect、ad-ops、ad-perception、ad-config-ops。安装后必须用工具调用 ls/dir 验证每个 SKILL.md 存在。最后只输出安装表格：skill 名称、SKILL.md 是否存在、scripts 是否存在、备注。不要凭记忆回答。
```

## Requirement 1: Inspection

Fixed prompt:

```text
对 AD1 执行标准巡检。必须先用 ad-connect 做连接测试；连接通过后使用 ad-check-analysis 的 check.py 按 history -> run -> progress -> wait 工作流执行。报告必须原样展示脚本 stdout，不要改写、摘要或补充。设备使用 devices.json 中 AD1，密码从环境变量读取。输出固定模板：巡检目标、工具调用、巡检结果。
```

Expected tool calls:

```text
connect.py
check.py history
check.py run
check.py progress
check.py wait
```

Pass criteria:

- Tool calls include the expected scripts in order.
- `check.py wait` or `check.py analyze` stdout is the source of the final report.
- The final answer does not add model-written inspection findings.

## Requirement 2: Query Overview

Fixed prompt:

```text
查询 AD1 的配置、流量、设备状态和 SSL 证书到期时间。必须先用 ad-connect 连接测试，再用 ad-ops/scripts/overview.py all 生成 Markdown；输出必须原样展示脚本 stdout，不要自己拼表。设备使用 devices.json 中 AD1，密码从环境变量读取。输出固定模板：查询目标、工具调用、查询结果。
```

Expected tool calls:

```text
connect.py
overview.py all
```

Pass criteria:

- `overview.py all` is called, not separate model-written summaries.
- The answer includes VS, Pool/config, traffic/status, and certificate sections only if returned by the script.

## Requirement 3: Perception Analysis

Fixed prompt:

```text
对 AD1 进行感知分析，覆盖 VS 流量异常、CPU/内存/磁盘/连接状态、IP:Port 冲突和服务日志线索。必须先用 ad-connect 连接测试，再运行 ad-perception/scripts/perception.py analyze。分析结论必须完全来自脚本 stdout，不允许模型自行推断根因。设备使用 devices.json 中 AD1，密码从环境变量读取。输出固定模板：分析目标、工具调用、分析结果。
```

Expected tool calls:

```text
connect.py
perception.py analyze
```

Pass criteria:

- The final conclusion is backed by `perception.py` output.
- No root cause, anomaly, or trend is invented outside script stdout.

## Requirement 4: Config Generation

Requirement 4 is a general configuration-generation workflow. The minimum supported SLB matrix is VS + existing Pool, VS + Pool + nodes, VS + existing/new HTTP Profile, VS + existing/new HTTP Pre Rule, and combinations of those dependencies. XFF is only one example, not the only workflow.

Fixed prompt A, basic VS + Pool + nodes:

```text
为 AD1 生成“新增 HTTP 虚拟服务 + Pool + 节点”的配置脚本，只生成和预检，不下发。参数：VS 名称 wb_vs_basic_01，VIP 10.250.250.10，端口 8080，Pool wb_pool_basic_01，后端节点 192.0.2.10:80 和 192.0.2.11:80。必须使用 ad-config-ops 的通用 SLB 组合生成流程：init_env.py -> render_slb_bundle.py -> ad_ops_flow.py plan-and-render -> ad_ops_flow.py summarize-plan。不要手写 payload；不要执行 --execute。输出固定模板：目标、工具调用、生成产物、操作计划、下发状态。
```

Fixed prompt B, VS + HTTP Pre Rule:

```text
为 AD1 生成“新增 HTTP 虚拟服务 + Pool + 节点 + HTTP Pre Rule”的配置脚本，只生成和预检，不下发。参数：VS 名称 wb_vs_prerule_01，VIP 10.250.250.20，端口 8081，Pool wb_pool_prerule_01，后端节点 192.0.2.20:80，HTTP Pre Rule 名称 wb_pre_rule_01，URI 匹配包含 /api，动作调度到 Pool。必须使用 ad-config-ops 的通用 SLB 组合生成流程和 render_slb_bundle.py；不要手写 payload；不要执行 --execute。输出固定模板：目标、工具调用、生成产物、操作计划、下发状态。
```

Fixed prompt C, VS + XFF HTTP Profile:

```text
为 AD1 生成“新增 HTTP 虚拟服务 + Pool + 节点 + 插入 XFF”的配置脚本，只生成和预检，不下发。参数：VS 名称 wb_vs_xff_01，VIP 10.250.250.30，端口 8082，Pool wb_pool_xff_01，后端节点 192.0.2.30:80，HTTP Profile wb_xff_profile_01，Header X-Forwarded-For。必须使用 ad-config-ops 的通用 SLB 组合生成流程和 render_slb_bundle.py；不要手写 payload；不要执行 --execute。输出固定模板：目标、工具调用、生成产物、操作计划、下发状态。
```

Expected tool calls:

```text
init_env.py --confirm-clean
ad_ops_flow.py status
render_slb_bundle.py
ad_ops_flow.py plan-and-render
ad_ops_flow.py summarize-plan
```

Expected plan summaries by case:

```text
basic:
POST /api/ad/v3/slb/pool/
POST /api/ad/v3/slb/virtual-service/

pre-rule:
POST /api/ad/v3/slb/pool/
POST /api/ad/v3/slb/pre-rule/http/
POST /api/ad/v3/slb/virtual-service/

xff:
POST /api/ad/v3/slb/http-profile/
POST /api/ad/v3/slb/pool/
POST /api/ad/v3/slb/virtual-service/
```

Pass criteria:

- No mutating real-device command runs.
- No command includes `--execute`.
- The final answer explicitly says configuration was not delivered. If only offline generation is requested, it must also say no real device was connected.

## Tool-Call Verification Checklist

For every acceptance run:

- Open each tool-call panel in WorkBot.
- Verify the command string matches the expected script path.
- Verify the command actually ran and has an exit code/stdout/stderr.
- Verify stdout contains the expected script JSON/Markdown, not a model-only answer.
- For Requirement 4, verify `render_slb_bundle.py`, `plan-and-render`, and `summarize-plan` ran, and verify no `--execute` was used.

Stability target:

- Development gate: each fixed prompt passes 3 consecutive runs.
- Release gate: each fixed prompt passes 10 consecutive runs with the same tool sequence and output template.
