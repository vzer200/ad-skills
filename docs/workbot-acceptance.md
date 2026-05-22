# WorkBot Acceptance Prompts

This document records the WorkBot upload, cleanup, automation, and short-prompt acceptance flow for AD requirements 1-4. The flow intentionally starts with realistic short prompts, then uses interactive follow-ups only when WorkBot asks for parameters or fails to call tools.

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
$env:AD1_PASS = "<operator-provided AD1 password>"
.\tools\run_workbot_acceptance.ps1 -CommitAndPush -VerifyAD
```

The automation runs tests, validates skills, runs an SLB bundle smoke test, commits and pushes, packages `dist/ad-skills-workbot.zip`, uploads it to WorkBot, sends the acceptance prompts, and writes a JSON evidence report under `workbot-results/`.

Before every upload, clear old AD skills and memory with this short prompt:

```text
请清理旧的 AD skills 和相关记忆。
```

Pass criteria:

- WorkBot uses tool calls to inspect/delete old AD skill directories and clear available memory stores.
- The final answer lists deleted skill paths or says none existed, and includes the memory cleanup result.
- A model-only answer without tool-call panels is a failed run.

After attaching the AD skills zip, use this short install prompt:

```text
请安装我刚上传的 AD skills 包，并确认 6 个 skill 都可用。
```

Pass criteria:

- WorkBot uses tool calls to unzip/install the uploaded package and inspect the installed files.
- The final answer confirms `ad-blackbox-analysis`, `ad-check-analysis`, `ad-connect`, `ad-ops`, `ad-perception`, and `ad-config-ops`.
- Each installed skill is verified by a tool call that checks `SKILL.md`; scripts directories are verified where expected.

## Interactive Follow-Up Rule

Start each case with the short prompt. If WorkBot asks for missing parameters, answer only the requested values. If the first response has no visible tool-call panels, send this follow-up and mark the previous attempt failed:

```text
我没有看到工具调用记录。请不要凭记忆回答；请实际调用工具完成刚才的任务，并在结果里列出调用过的工具、命令、退出码和 stdout/stderr 摘要。
```

If a real-device case has tool calls but no AD 外网设备资源验证, send this follow-up:

```text
我没有看到 AD1 外网设备资源验证。请通过 devices.json 中的 AD1 实际运行 ad-connect 和对应脚本，并展示连接目标、退出码和脚本 stdout。
```

## Requirement 1: Inspection

Short prompt:

```text
请对 AD1 做一次标准巡检。
```

Parameter follow-up if WorkBot asks:

```text
使用 devices.json 里的 AD1，必须带 --device AD1，密码从环境变量读取。请先 history，再用 check.py run --wait 完成巡检，结果以工具 stdout 为准。
```

Expected tool calls:

```text
connect.py
check.py history
check.py run --wait
```

Pass criteria:

- Tool calls include the expected scripts in order.
- `connect.py` validates the AD1 target from `devices.json` before inspection, including AD 外网设备资源 reachability/auth evidence.
- `check.py run --wait` or `check.py analyze` stdout is the source of the final report.
- The final answer does not add model-written inspection findings.

## Requirement 2: Query Overview

Short prompt:

```text
帮我查一下 AD1 的配置、流量、设备状态和 SSL 证书到期时间。
```

Parameter follow-up if WorkBot asks:

```text
使用 devices.json 里的 AD1，必须带 --device AD1，密码从环境变量读取。请实际调用查询 skill，最终结果展示脚本 stdout。
```

Expected tool calls:

```text
connect.py
overview.py all
```

Pass criteria:

- `overview.py all` is called, not separate model-written summaries.
- `connect.py` validates the AD1 target from `devices.json`, including AD 外网设备资源 reachability/auth evidence.
- The answer includes VS, Pool/config, traffic/status, and certificate sections only if returned by the script.

## Requirement 3: Perception Analysis

Short prompt:

```text
请对 AD1 做一次感知分析，重点看流量、资源、冲突和日志线索。
```

Parameter follow-up if WorkBot asks:

```text
使用 devices.json 里的 AD1，必须带 --device AD1 做连接预检，密码从环境变量读取。请实际调用感知分析 skill，分析结论以脚本 stdout 为准。
```

Expected tool calls:

```text
connect.py
perception.py analyze
```

Pass criteria:

- `connect.py` validates the AD1 target from `devices.json`, including AD 外网设备资源 reachability/auth evidence.
- The final conclusion is backed by `perception.py` output.
- No root cause, anomaly, or trend is invented outside script stdout.

## Requirement 4: Config Generation

Requirement 4 is a general configuration-generation workflow. The minimum supported SLB matrix is VS + existing Pool, VS + Pool + nodes, VS + existing/new HTTP Profile, VS + existing/new HTTP Pre Rule, and combinations of those dependencies. XFF is only one example, not the only workflow.

Common matrix cases should be generated from parameters with `render_slb_bundle.py`. The YAML template path must remain available as a fallback: if the user's prompt is ambiguous, fields are missing after one follow-up, or the resource combination is outside the supported matrix, WorkBot should generate a YAML/edit template, ask the user to complete it, and only then continue to plan/apply.

Short prompt A, basic VS + Pool + nodes:

```text
请在 AD1 创建一个 HTTP 虚拟服务，带新 Pool 和两个节点。
```

Parameter follow-up if WorkBot asks:

```text
参数：VS 名称 wb_vs_basic_01，VIP 10.250.250.10，端口 8080，Pool wb_pool_basic_01，后端节点 192.0.2.10:80 和 192.0.2.11:80。账号 admin，密码从环境变量读取。需要下发，并输出下发脚本、回滚脚本和设备验证结果。
```

Short prompt B, VS + HTTP Pre Rule:

```text
请在 AD1 创建一个 HTTP 虚拟服务，带新 Pool、节点和 HTTP Pre Rule。
```

Parameter follow-up if WorkBot asks:

```text
参数：VS 名称 wb_vs_prerule_01，VIP 10.250.250.20，端口 8081，Pool wb_pool_prerule_01，后端节点 192.0.2.20:80，HTTP Pre Rule 名称 wb_pre_rule_01，URI 匹配包含 /api，动作调度到 Pool。账号 admin，密码从环境变量读取。需要下发，并输出下发脚本、回滚脚本和设备验证结果。
```

Short prompt C, VS + XFF HTTP Profile:

```text
请在 AD1 创建一个 HTTP 虚拟服务，带新 Pool、节点和插入 XFF 的 HTTP Profile。
```

Parameter follow-up if WorkBot asks:

```text
参数：VS 名称 wb_vs_xff_01，VIP 10.250.250.30，端口 8082，Pool wb_pool_xff_01，后端节点 192.0.2.30:80，HTTP Profile wb_xff_profile_01，Header X-Forwarded-For。账号 admin，密码从环境变量读取。需要下发，并输出下发脚本、回滚脚本和设备验证结果。
```

YAML fallback prompt for ambiguous or unsupported combinations:

```text
这个 SLB 配置我描述不清楚，请给我一个 YAML 模板，我补完后你再下发。
```

YAML fallback pass criteria:

- WorkBot does not invent missing fields.
- WorkBot calls `lookup_api.py` and `render_bundle_template.py` when the combination is outside the supported shortcut matrix.
- WorkBot asks the user to complete the YAML template, then runs `plan-and-render`, `summarize-plan`, and `apply-slb-plan` only after the completed YAML is available.
- If the completed YAML is still invalid, WorkBot reports script validation errors and stops before any mutating call.
```

Expected tool calls:

```text
init_env.py --confirm-clean
ad_ops_flow.py status
render_slb_bundle.py
ad_ops_flow.py plan-and-render
ad_ops_flow.py summarize-plan
ad_ops_flow.py apply-slb-plan
verify_slb_resource.py
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

- Tool calls include the expected generation and plan scripts; generated payloads and summaries come from tool stdout/artifacts.
- Default R4 cases are delivery runs: `apply-slb-plan` executes the plan, writes `adops-execute-result.json`, writes `adops-rollback.json`, and verifies the created resources with `--expect present`.
- The final answer lists `apply.py`, `rollback_apply.py`, `adops-rollback.json`, `adops-execute-result.json`, and the device verification summary.
- Rollback is generated but not executed unless the user explicitly asks for rollback.
- If the user explicitly says "只生成/不下发/预览", WorkBot must stay in offline mode, skip `apply-slb-plan`, and use `verify_slb_resource.py --expect absent` when device credentials are available.
- If WorkBot claims it checked existing AD resources, verify a corresponding tool-call panel and AD 外网设备资源 evidence.

## Tool-Call Verification Checklist

For every acceptance run:

- Do not accept the final text alone; evidence must include visible tool-call panels.
- Open each tool-call panel in WorkBot.
- Verify the command string matches the expected script path.
- Verify the command actually ran and has an exit code/stdout/stderr.
- Verify stdout contains the expected script JSON/Markdown, not a model-only answer.
- For real-device cases, verify AD 外网设备资源 validation: `connect.py` uses `devices.json` AD1, reaches the target, authenticates, and the follow-on script output is real device data.
- For config-generation cases, verify post-run resource state with `verify_slb_resource.py`; use `--expect present` for default delivery runs and `--expect absent` only for explicitly requested offline runs.
- For Requirement 4, verify `render_slb_bundle.py`, `plan-and-render`, `summarize-plan`, and `apply-slb-plan` ran for default delivery cases.

Stability target:

- Development gate: each short-prompt case passes 3 consecutive runs.
- Release gate: each short-prompt case passes 10 consecutive runs with the same tool sequence and output template.
