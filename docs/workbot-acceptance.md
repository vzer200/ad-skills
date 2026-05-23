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

The automation runs tests, validates skills, runs an SLB bundle smoke test, commits and pushes, packages `dist/ad-skills-workbot.zip`, uploads it to WorkBot, sends the fixed acceptance prompts, and writes a JSON evidence report under `workbot-results/`.

Default WorkBot pacing waits 2 seconds after the stop button disappears before sending the next prompt.

The default `fixed` suite is the mainline gate. It uses only the agreed fixed prompts and covers the complete requirements flow in one WorkBot run: R1 standard/full/security on one device and all devices, R2 full/single-dimension/multi-device VS queries, R3 full/single-dimension perception analysis, and R4 script-only plus real delivery/rollback. HA is not part of the default run.

Exploratory prompt variants are kept in a separate suite and must not be mixed into the mainline stability gate:

```powershell
.\tools\run_workbot_acceptance.ps1 -VerifyAD -CaseSuite extended
```

Use `-Cases "case1,case2"` only for temporary debugging of a specific failure.

If WorkBot cannot see local environment variables such as `AD1_PASS`, build the upload-only package with runtime credential injection:

```powershell
$env:AD1_PASS = "<operator-provided AD1 password>"
$env:AD1_HOST = "https://192.168.8.30"
.\tools\run_workbot_acceptance.ps1 -CommitAndPush -VerifyAD -InjectDevicePasswords -InjectDeviceOverrides
```

This replaces `password_from` with `password` and applies `AD1_HOST`/`AD1_USER` style overrides only inside the ignored zip artifact; source `devices.json` and the package manifest do not store password values. The packager writes the rendered device file to `devices.json`, `skills/devices.json`, and each `skills/<skill>/devices.json` so WorkBot can still find it when the installer copies only skill directories.

Before every upload, clear old AD skills and memory with this short prompt:

```text
请实际调用工具清理旧的 AD skills 和相关记忆。必须用 shell 检查并删除 skills/ad-*，用 cron_list 检查定时任务，用 memory_export/memory_purge 清理记忆；最终正文只回答清理完成，不要列工具、命令、退出码或 stdout/stderr。
```

Pass criteria:

- WorkBot uses tool calls to inspect/delete old AD skill directories and clear available memory stores.
- Tool-call panels show deleted skill paths or say none existed, and include the memory cleanup result.
- The final visible answer stays short and does not train later requirement answers to expose tool-call details.
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
我没有看到工具调用记录。为什么没有调用工具？请说明原因，然后不要凭记忆回答，立即实际调用工具完成刚才的任务。最终正文只输出任务结果，不要列工具、命令、退出码或 stdout/stderr。
```

The automation records `toolFollowupUsed=true` and marks the case as failed for stability, even if the follow-up eventually triggers tools.

If a real-device case has tool calls but no AD 外网设备资源验证, send this follow-up:

```text
我没有看到 AD1 外网设备资源验证。请通过 devices.json 中的 AD1 实际运行 ad-connect 和对应脚本。最终正文只输出任务结果，不要列工具、命令、退出码或 stdout/stderr。
```

## Output Template Gate

Every requirement run must use the corresponding skill output template. Missing template headings fail the run even if the script tokens are present.

```text
R1: 巡检结论 / 巡检过程 / 分类统计 / 重点异常 / 原始报告
R2: 查询结论 / 查询范围 / 查询结果 / 覆盖说明
R3: 感知结论 / 分析结果 / 结论边界
R4: 配置结论 / 执行摘要 / 生成产物 / 安全确认
```

User-facing answers must not expose `工具调用` as a heading, nor list command exit codes/stdout/stderr, script names, or command strings. Tool names and command strings are verified from WorkBot's tool-call panels by the automation, not shown as the main answer to the operator.

## Requirement 1: Inspection

Single-device prompt:

```text
请对 AD1 做一次巡检。
```

Expected human replies:

```text
标准巡检
强制
```

Additional single-device scene replies:

```text
全量巡检
强制

安全巡检
强制
```

All-device prompt:

```text
请对 AD 所有设备做一次巡检。
```

Expected human replies:

```text
标准巡检 / 全量巡检 / 安全巡检
强制
```

If the first user prompt already includes a scene such as `请对 AD1 做一次标准巡检。`, WorkBot must not ask for the scene again. It should only ask for force/continue if needed.


Expected tool calls:

```text
connect.py
check.py history
check.py run
check.py progress
check.py wait --timeout 55
```

Pass criteria:

- Tool calls include the expected scripts in order.
- `connect.py` validates the AD1 target from `devices.json` before inspection, including AD 外网设备资源 reachability/auth evidence.
- All-device inspection uses `devices.json` without `--device AD1` and produces multi-device evidence.
- All-device inspection follows the same human interaction as single-device inspection: ask scene, ask force/continue, then run `history -> run -> progress -> wait`.
- `check.py run --wait` must not be used in WorkBot acceptance; it can exceed the platform's 60-second tool timeout.
- The final report comes from `check.py wait` / downloaded report stdout, after `progress` confirms completion.
- The final answer does not add model-written inspection findings.
- The final visible answer starts at `## 巡检结论` and must not append a second execution table or any phrase such as `工具调用`, `退出码`, `stdout`, `上方 stdout`, `connect.py`, or `check.py`.
- WorkBot commands must not use `2>&1` for the final `wait` command. If stderr is needed for debugging, it stays inside tool evidence and is not copied into the user-visible answer.
- Check items in final answers use Chinese labels, not internal IDs such as `DEVICE_SAFE_CHECK`.
- Single-device reports may list all check items. Multi-device reports use the same top-level headings but only expand abnormal items per device to avoid oversized output.
- Acceptance prompts must stay short. Do not use detailed parameter-fill prompts for R1.
- Scoring rule: pass = 1, warn = 0.5, fail = 0. Empty dimensions must not pull down the overall score; the overall score averages only dimensions that appear in the current report.

## Requirement 2: Query Overview

Full overview prompt:

```text
帮我查一下 AD1 的配置、流量、设备状态和 SSL 证书到期时间。
```

Fixed single-dimension prompts:

```text
帮我查一下 AD1 的虚拟服务配置。
```

```text
帮我查一下所有 AD 设备的虚拟服务配置。
```

```text
帮我查一下 AD1 的节点配置。
```

```text
帮我查一下 AD1 的节点池配置。
```

```text
帮我查一下 AD1 的 SSL 证书到期时间。
```

```text
帮我查一下 AD1 的流量情况。
```

```text
帮我查一下 AD1 的设备状态。
```

```text
帮我查一下 AD1 的硬件状态。
```

Extended suite prompts, not part of the fixed mainline gate:

```text
AD1 现在啥情况？
```

```text
看下 AD1 上有哪些 VS。
```

```text
所有 AD 的虚拟服务配置看下。
```

```text
AD1 节点池和节点发我。
```

```text
AD1 证书有没有快过期？
```

```text
AD1 设备资源状态查一下。
```

Expected tool calls:

```text
connect.py
overview.py all
```

Pass criteria:

- `overview.py all` is called, not separate model-written summaries.
- Single-dimension VS query calls `overview.py vs`.
- Single-dimension node/pool query calls `overview.py pool`.
- SSL certificate query calls `overview.py cert`.
- Traffic query calls `overview.py traffic`.
- Device/hardware status query calls `overview.py hardware`.
- Multi-device VS prompts must call `overview.py vs --devices ...` and must not fall back to `--device AD1` or `--device AD2`.
- HA can be tested manually when needed, but is intentionally skipped in the default acceptance batch.
- `connect.py` validates the AD1 target from `devices.json`, including AD 外网设备资源 reachability/auth evidence.
- The answer includes VS, Pool/config, traffic/status, and certificate sections only if returned by the script.
- Acceptance prompts must not include parameter-fill follow-ups for R2.

## Requirement 3: Perception Analysis

Full analysis prompt:

```text
请对 AD1 做一次感知分析，重点看流量、资源、冲突和日志线索。
```

Extended suite short prompts, not part of the fixed mainline gate:

```text
AD1 做个感知分析。
```

```text
AD1 有没有异常？
```

Fixed single-dimension prompts:

```text
帮我分析一下 AD1 的流量异常。
```

```text
帮我分析一下 AD1 的设备资源状态异常。
```

```text
帮我分析一下 AD1 有没有地址冲突。
```

```text
帮我看一下 AD1 的服务日志线索。
```

Extended suite single-dimension prompts:

```text
AD1 CPU/内存/磁盘看下。
```

```text
AD1 有没有地址端口冲突？
```

Expected tool calls:

```text
connect.py
perception.py analyze
```

Pass criteria:

- `connect.py` validates the AD1 target from `devices.json`, including AD 外网设备资源 reachability/auth evidence.
- The final conclusion is backed by `perception.py` output.
- Single-dimension prompts call `perception.py traffic|state|conflict|logs` respectively.
- No root cause, anomaly, or trend is invented outside script stdout.
- Acceptance prompts must not include parameter-fill follow-ups for R3.

## Requirement 4: Config Generation

Requirement 4 is a general configuration-generation workflow. The minimum supported SLB matrix is VS + existing Pool, VS + Pool + nodes, VS + existing/new HTTP Profile, VS + existing/new HTTP Pre Rule, and combinations of those dependencies. XFF is only one example, not the only workflow.

Requirement 4 is always staged. Prompt-to-YAML is a mandatory first flow and must not be replaced by parameter follow-up questions. If the prompt is incomplete or ambiguous, WorkBot generates a YAML template with blanks and stops for manual completion. A completed YAML then enters the second flow: plan/script generation, same-name resource GET preflight, and a user choice between script-only output or delivery verification.

Stage A prompt:

```text
帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。
```

Extended suite Stage A prompts, not part of the fixed mainline gate:

```text
帮我建个 VS，挂已有 Pool。
```

```text
这份 VS 配置会不会撞现网？
```

Human uploads a filled YAML, then replies:

```text
我写完了 YAML。
```

Script-only choice:

```text
直接给出脚本。
```

Delivery choice:

```text
真实下发。
```

Rollback choice:

```text
需要回滚。
```

YAML pass criteria:

- WorkBot does not invent missing fields and does not ask detailed parameter questions in chat.
- The first answer produces or requests completion of a YAML template, then stops.
- Manual completion happens by uploading a YAML file; the follow-up prompt is only `我写完了 YAML。`.
- After YAML completion, WorkBot generates the plan, runs same-name preflight, and asks whether to `真实下发` or `直接给出脚本`.
- After delivery, WorkBot asks whether rollback is needed; the human reply is only `需要回滚。`.
- If completed YAML is invalid, WorkBot reports script validation errors and stops before any mutating call.

Expected tool calls:

```text
init_env.py --confirm-clean
ad_ops_flow.py status
render_bundle_template.py or uploaded adops-bundle.yml
ad_ops_flow.py plan-and-render
ad_ops_flow.py summarize-plan
ad_ops_flow.py preflight-slb-plan
ad_ops_flow.py apply-slb-plan
ad_ops_flow.py rollback-and-verify
```

Expected plan summaries by case:

```text
POST /api/ad/v3/slb/http-profile/
POST /api/ad/v3/slb/pool/
POST /api/ad/v3/slb/pre-rule/http/
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
