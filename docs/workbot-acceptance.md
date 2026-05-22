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

Requirement 4 is always staged. Prompt-to-YAML is a mandatory first flow and must not be replaced by parameter follow-up questions. If the prompt is incomplete or ambiguous, WorkBot generates a YAML template with blanks and stops for manual completion. A completed YAML then enters the second flow: plan/script generation, same-name resource GET preflight, and a user choice between script-only output or delivery verification.

Stage A prompt, basic VS + Pool + nodes:

```text
请把这个需求转成 AD 配置 YAML：在 AD1 创建 HTTP VS wb_vs_basic_01，VIP 10.250.250.10:8080，Pool wb_pool_basic_01，节点 192.0.2.10:80、192.0.2.11:80。
```

Stage A prompt, VS + HTTP Pre Rule:

```text
请把这个需求转成 AD 配置 YAML：在 AD1 创建 HTTP VS wb_vs_prerule_01，VIP 10.250.250.20:8081，Pool wb_pool_prerule_01，节点 192.0.2.20:80，HTTP Pre Rule wb_pre_rule_01 匹配 URI 包含 /api 后调度到 Pool。
```

Stage A prompt, VS + XFF HTTP Profile:

```text
请把这个需求转成 AD 配置 YAML：在 AD1 创建 HTTP VS wb_vs_xff_01，VIP 10.250.250.30:8082，Pool wb_pool_xff_01，节点 192.0.2.30:80，新 HTTP Profile wb_xff_profile_01 插入 X-Forwarded-For。
```

Stage A ambiguous prompt:

```text
请把这个 SLB 创建需求转成 YAML，我还没想好具体字段。
```

Stage B script-only prompt after YAML exists:

```text
使用刚才的 YAML 生成计划，先查 AD1 同名资源；我只要正向脚本和回滚脚本，不下发。
```

Stage C delivery prompt after YAML exists:

```text
使用刚才的 YAML 下发到 AD1 并验证结果；下发后暂停，等我检查完成再回滚。
```

Stage D rollback prompt after the operator confirms manual device inspection:

```text
我已经检查完成，请执行回滚并确认回滚后的 GET 结果和下发前一致。
```

YAML pass criteria:

- WorkBot does not invent missing fields.
- For common matrix cases, WorkBot calls `render_slb_bundle.py` and stops after producing `adops-bundle.yml`.
- For ambiguous or unsupported cases, WorkBot calls `lookup_api.py`/`render_bundle_template.py`, outputs a YAML template, and stops for manual completion.
- WorkBot must not ask parameter questions in chat for R4; manual completion happens in YAML.
- If completed YAML is invalid, WorkBot reports script validation errors and stops before any mutating call.

Expected tool calls:

```text
init_env.py --confirm-clean
ad_ops_flow.py status
render_slb_bundle.py
ad_ops_flow.py plan-and-render
ad_ops_flow.py summarize-plan
ad_ops_flow.py preflight-slb-plan
ad_ops_flow.py apply-slb-plan
ad_ops_flow.py rollback-and-verify
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
- Stage A ends with YAML only; no plan/apply happens before the user confirms YAML is complete.
- Stage B always runs `preflight-slb-plan` before script output or delivery. Same-name create targets found by GET are reused and omitted from the effective plan.
- Stage B treats non-404 GET failures as blockers. WorkBot must stop before any mutating call if preflight cannot prove whether a same-name resource exists.
- Same-name reuse is a name-based reuse policy, not an overwrite. If `reuse_compatibility_warning_count` is greater than zero, WorkBot must report the warning and include it in the manual inspection checklist.
- Script-only mode lists `apply.py`, `rollback_apply.py`, `adops-effective-plan.json`, and `adops-preflight.json`, then ends with no mutating call.
- Delivery mode runs `apply-slb-plan`, writes `adops-execute-result.json`, `adops-rollback.json`, `adops-post-apply.json`, and then pauses for manual inspection.
- Rollback runs only after explicit user confirmation. `rollback-and-verify` must write `adops-post-rollback.json` and `adops-rollback-compare.json`.
- Rollback must use the baseline and rollback manifest from the same AD host and plan. A mismatch is a hard failure.
- The run passes only if post-rollback GET state matches the preflight baseline. If not, WorkBot must report the diff and must not claim rollback success.

## Tool-Call Verification Checklist

For every acceptance run:

- Do not accept the final text alone; evidence must include visible tool-call panels.
- Open each tool-call panel in WorkBot.
- Verify the command string matches the expected script path.
- Verify the command actually ran and has an exit code/stdout/stderr.
- Verify stdout contains the expected script JSON/Markdown, not a model-only answer.
- For real-device cases, verify AD 外网设备资源 validation: `connect.py` uses `devices.json` AD1, reaches the target, authenticates, and the follow-on script output is real device data.
- For Requirement 4, verify the staged sequence: YAML generation, `plan-and-render`, `summarize-plan`, `preflight-slb-plan`, optional `apply-slb-plan`, and optional `rollback-and-verify`.

Stability target:

- Development gate: each short-prompt case passes 3 consecutive runs.
- Release gate: each short-prompt case passes 10 consecutive runs with the same tool sequence and output template.
