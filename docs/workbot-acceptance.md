# WorkBot Acceptance Prompts

This document records the WorkBot upload, automation, and short-prompt acceptance flow for AD requirements 1-4. The flow intentionally starts with realistic short prompts, then uses interactive follow-ups only when WorkBot asks for parameters or fails to call tools. Cleanup is only used when reusing an existing digital employee.

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
.\tools\run_workbot_acceptance.ps1 -CommitAndPush -VerifyAD
```

The automation runs tests, validates skills, runs an SLB bundle smoke test, commits and pushes, packages `dist/ad-skills-workbot.zip`, uploads it to WorkBot, sends the fixed acceptance prompts, and writes a JSON evidence report under `workbot-results/`. The source `devices.json` is the WorkBot-facing authority and must use the intranet management addresses `https://192.168.8.30` and `https://192.168.8.31`; local Codex-side AD verification can still use the public gateway through `-ADBaseUrl`.

Default WorkBot pacing waits 2 seconds after the stop button disappears before sending the next prompt.

By default the one-click runner creates a temporary digital employee named `AD验收临时-*` and switches the conversation to that employee before upload/install. This keeps acceptance runs out of the polluted default employee history. The runner deletes older `AD验收临时-*` employees first and refuses to create a new one if the account would still exceed the 5-employee limit. Pass `-NoFreshAgent` only when intentionally debugging the current default employee conversation.

Every temporary employee is created through the same WorkBot API used by the web UI (`/workbot/api/v1/agents`): `description` is the UI's 身份设定 field and `profile` is the UI's 行为准则 field. The runner reads the employee back after creation and verifies both fields before switching to it. After switching, it sends the required initialization prompt and verifies tool-call evidence before uploading AD skills:

```text
你是一个通用智能体，现在需要你进行初始化。你需要阅读技能 “Self-Improving + Proactive Agent” 与技能 “Proactivity (Proactive Agent)”，并执行初始化流程。
```

Fresh-agent runs skip cleanup because the employee has empty AD-skill context. Cleanup is not part of the main orchestration and runs only when the `cleanup` case is explicitly requested for debugging an existing employee. Install is always a hard gate: if it needs a no-tool follow-up, misses required tool commands, or leaks tool/command text in the visible answer, the automation stops before requirement cases.

The default `fixed` suite is the mainline gate. It uses only the agreed fixed prompts and covers the complete requirements flow in one WorkBot run: R1 standard/full/security on one device and all devices, R2 full/single-dimension/multi-device queries, R3 full/single-dimension perception analysis, and R4 script-only plus real delivery/rollback. HA is not part of the default run.

Exploratory prompt variants are kept in a separate suite and must not be mixed into the mainline stability gate:

```powershell
.\tools\run_workbot_acceptance.ps1 -VerifyAD -CaseSuite extended
```

R4 delivery and R2 query interaction is kept in a dedicated suite. It deploys the R4 SLB fixture to AD1, verifies the resources from outside the WorkBot runtime, runs R2 queries while the resources exist, rolls back, verifies absence, and runs R2 queries again:

```powershell
.\tools\run_workbot_acceptance.ps1 -VerifyAD -CaseSuite r2r4
```

Use `-Cases "case1,case2"` only for temporary debugging of a specific failure.

Nightly automation runs the requested closure loop: R2/R4 interaction, then the fixed mainline gate, then three fixed stability runs. Extended prompts stay separate and should be enabled only when mainline coverage is already stable. Pass `-Prepare` when source changes should be tested, committed, pushed, and packaged before uploading:

```powershell
.\tools\run_workbot_nightly.ps1 -Prepare -VerifyAD
```

Run extended prompt variants explicitly when needed:

```powershell
.\tools\run_workbot_nightly.ps1 -RunExtended -VerifyAD
```

Build the upload-only package from source `devices.json`. Use host overrides only when the WorkBot-side device addresses need to be changed for a specific environment:

```powershell
$env:AD1_HOST = "https://192.168.8.30"
$env:AD2_HOST = "https://192.168.8.31"
.\tools\run_workbot_acceptance.ps1 -CommitAndPush -VerifyAD -InjectDeviceOverrides
```

The source `devices.json` stores direct `user` and `password` fields for each device. When requested, the packager applies `AD1_HOST`/`AD1_USER` style overrides only inside the ignored zip artifact; reports and manifests must not print password values. The packager writes the rendered device file to `devices.json`, `skills/devices.json`, and each `skills/<skill>/devices.json` so WorkBot can still find it when the installer copies only skill directories.

After attaching the AD skills zip, use this short install prompt:

```text
请安装我刚上传的 AD skills 包，并确认 5 个 skill 都可用。
```

Pass criteria:

- WorkBot uses tool calls to unzip/install the uploaded package and inspect the installed files.
- The final answer confirms `ad-check-analysis`, `ad-connect`, `ad-ops`, and `ad-perception`.
- Each installed skill is verified by a tool call that checks `SKILL.md`; scripts directories are verified where expected.

## Interactive Follow-Up Rule

Start each case with the short prompt. If WorkBot asks for missing parameters, answer only the requested values. If the first response has no visible tool-call panels, send this follow-up and mark the previous attempt failed:

```text
我没有看到工具调用记录。为什么没有调用工具？请说明原因，然后不要凭记忆回答，立即实际调用工具完成刚才的任务。最终正文只输出任务结果，不要列工具、命令、退出码或 stdout/stderr。
```

The automation records `toolFollowupUsed=true` and marks the case as failed for stability, even if the follow-up eventually triggers tools.

If a real-device case has tool calls but no AD 内网设备资源验证, send this follow-up:

```text
我没有看到 AD1 内网设备资源验证。请通过 devices.json 中的 AD1 实际运行 ad-connect 和对应脚本，并确认使用 192.168.8.30。最终正文只输出任务结果，不要列工具、命令、退出码或 stdout/stderr。
```

## Output Template Gate

Every requirement run must use the corresponding skill output template. Missing template headings fail the run even if the script tokens are present.

```text
R1 单设备: 巡检结论 / 分类统计 / 设备基本信息 / 检查项明细 / 优化建议 / 健康评分
R1 多设备: 巡检结论 / 设备概览 / 全局共性问题
R2: 查询结论 / 查询范围 / 查询结果
R3: 感知结论 / 分析结果 / 结论边界
R4: 配置结论 / 产出物 / 下一步
```

User-facing answers must not expose `工具调用` as a heading, nor list command exit codes/stdout/stderr or command strings. Tool names and command strings are verified from WorkBot's tool-call panels by the automation, not shown as the main answer to the operator. R4 is the exception for script filenames: `apply.py` and `rollback_apply.py` must be listed as user deliverables under `产出物`.

## Requirement 1: Inspection

Single-device prompt:

```text
请对 AD1 做一次巡检。
```

Expected human replies:

```text
标准巡检
（如果 history 的 limit_reached=false，WorkBot 直接巡检；如果 limit_reached=true，再回复“强制”）
```

Additional single-device scene replies:

```text
全量巡检
（同上，只有 limit_reached=true 才回复“强制”）

安全巡检
（同上，只有 limit_reached=true 才回复“强制”）
```

All-device prompt:

```text
请对 AD 所有设备做一次巡检。
```

Expected human replies:

```text
标准巡检 / 全量巡检 / 安全巡检
（如果任一设备 limit_reached=true，再回复“强制”）
```

If the first user prompt already includes a scene such as `请对 AD1 做一次标准巡检。`, WorkBot must not ask for the scene again. It must still run `connect.py` and `check.py history`; it asks for force/continue only when `limit_reached=true`.


Expected tool calls:

```text
connect.py
check.py history
check.py run
check.py progress
check.py progress --delay-seconds 30
check.py wait --timeout 55
```

Pass criteria:

- Tool calls include the expected scripts in order.
- WorkBot commands must not use manual waiting. `sleep`, `Start-Sleep`, or `sleep && check.py progress` is a failed run; after `run`, call `progress` once, then while progress is still `RUNNING` use `progress --delay-seconds 30` to poll the device progress API. `wait --timeout 55` is only allowed after progress returns `state=FINISHED` or `finished>=total`.
- A normal R1 run must not leave `CheckTimeoutError` or `未检测到本次巡检的完成报告` in the WorkBot tool evidence. A later successful report does not mask this, because the user has already seen an unfriendly failed step.
- The interactive steps are gated independently: the first prompt must only ask for scenes returned by GET `/sys/offline-check/`; the scene reply must run `connect.py` and normalized `check.py history`. If `limit_reached=false`, WorkBot must directly run `run -> progress 30s polling -> wait`; if `limit_reached=true`, it must only ask whether to force/continue and no report may appear before the final `强制` reply.
- History record-limit decisions must be based on `items` only. `check.py history` exposes `record_count` and `limit_reached`; WorkBot must not use `total_items`, `total`, or pagination metadata to decide force. A response with `total_items: 5` and `items: []` means `record_count: 0`, `limit_reached: false`, so WorkBot must not ask the user to force.
- A later successful report does not mask a bad earlier step. If the first step executes `perception.py`/`overview.py`, outputs `感知结论`/`查询结论`/`巡检结论`, asks for force when `limit_reached=false`, or runs `check.py run/progress/wait` while `limit_reached=true` before force confirmation, the case fails immediately. Reading another skill's `SKILL.md` while choosing the route is not a failure by itself.
- `connect.py` validates the AD1 target from `devices.json` before inspection, including AD 内网设备资源 reachability/auth evidence.
- All-device inspection uses `devices.json` without `--device AD1` and produces multi-device evidence.
- All-device inspection follows the same human interaction as single-device inspection: ask scene, run `connect.py` and normalized `history`, ask force/continue only if any device `limit_reached=true`, then run `run -> progress 30s polling -> wait`.
- `check.py run --wait` must not be used in WorkBot acceptance; it can exceed the platform's 60-second tool timeout.
- The final report comes from `check.py wait` / downloaded report stdout, after `progress` confirms completion via device progress data.
- The final visible answer must start with exactly one latest progress line returned by `progress_text`, such as `目前巡检进度：23/35`, followed by the `check.py wait` report from `## 巡检结论`. If multiple `progress` calls returned different values, the newer value replaces the older one; concatenated progress text such as `目前巡检进度：13/35目前巡检进度：26/35` or the old `目前巡检 23/35` format is a failed run.
- The final answer does not add model-written inspection findings, wrapper phrases, or skill-policy explanations.
- Apart from the single progress line, the final visible answer starts at `## 巡检结论` and must not append a second execution table or any phrase such as `工具调用`, `退出码`, `stdout`, `上方 stdout`, `connect.py`, or `check.py`.
- The final visible answer must not include phrases such as `根据技能`, `技能规则`, `根据 ad-check-analysis`, `下面汇总展示`, or `报告均已获取成功`.
- The final visible answer must not include raw device field syntax such as `security_check_state=`, `remote_mt=`, `ssh_authority=`, `algorithm=`, `protocol=`, or `enable_iplimit=`; these must be rendered as Chinese operator-facing descriptions. It must also not mention internal report file names such as `ad.json`.
- The final visible answer must not include `## 重点异常`, `## 巡检过程`, or `## 原始报告`. Single-device target line should look like `AD1 (192.168.8.30)`, not `AD1 (https://192.168.8.30)`. Single-device check item status cells must only use `✅ 正常`, `❌ 异常`, or `➖ 不适用`.
- Single-device `## 检查项明细` must use exactly `检查项 / 具体说明 / 状态`; `具体说明` uses the native report/API `description` when present and the script's check description fallback otherwise. The old `当前发现` column is forbidden.
- Acceptance artifacts are redacted before saving; credential fields, tokens, cookies, and known runtime passwords must not be persisted in WorkBot result files.
- WorkBot commands must not use `2>&1` for the final `wait` command. If stderr is needed for debugging, it stays inside tool evidence and is not copied into the user-visible answer.
- Check items in final answers use Chinese labels, not internal IDs such as `DEVICE_SAFE_CHECK`.
- Single-device reports may list all check items under `## 检查项明细`. Multi-device reports must stay summary-only: `巡检结论 / 设备概览 / 全局共性问题`; do not expand per-device abnormal details.
- Acceptance prompts must stay short. Do not use detailed parameter-fill prompts for R1.
- R1 scene selection must be generated by `check.py prompt --stage scene` with device context so the available scenes come from GET `/sys/offline-check/`; do not hard-code the three scene names in WorkBot output.
- Scoring rule: pass = 1, warn = 0.5, fail = 0; `not_applicable` is displayed as `➖ 不适用` and excluded from score denominators, anomaly counts, and optimization suggestions. Empty dimensions must not pull down the overall score; the overall score averages only dimensions that appear in the current report.

## Requirement 2: Query Overview

Full overview prompt:

```text
帮我查一下 AD1 的配置、流量、设备状态和 SSL 证书到期时间。
```

Fixed single-device prompts:

```text
帮我查一下 AD1 的配置。
```

```text
帮我查一下 AD1 的虚拟服务配置。
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

Fixed multi-device prompts:

```text
帮我查一下所有 AD 设备的配置。
```

```text
帮我查一下所有 AD 设备的虚拟服务配置。
```

```text
帮我查一下所有 AD 设备的节点池配置。
```

```text
帮我查一下所有 AD 设备的 SSL 证书到期时间。
```

```text
帮我查一下所有 AD 设备的流量情况。
```

```text
帮我查一下所有 AD 设备的设备状态。
```

```text
帮我查一下所有 AD 设备的硬件状态。
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
- Prompt wording controls the visible dimensions: prompts containing `配置` show configuration only; prompts containing `状态` / `硬件` / `资源` / `HA` show status only; prompts containing `流量` show traffic only; prompts with no explicit dimension default to configuration and must call `overview.py config`.
- Configuration/default queries must not show device status, hardware status, traffic status, connection count, new-connection rate, throughput, CPU, or memory data.
- Status queries must not show VS/Pool/certificate/traffic sections unless those dimensions are explicitly requested in the same prompt.
- Single-dimension VS query calls `overview.py vs`.
- Single-dimension node/pool query calls `overview.py pool`.
- SSL certificate query calls `overview.py cert`.
- Traffic query calls `overview.py traffic`.
- Device/hardware status query calls `overview.py hardware`.
- Multi-device VS/Pool/cert/traffic/status/hardware prompts must call `overview.py <dimension> --devices ...` and must not fall back to `--device AD1` or `--device AD2`.
- Tool commands must not use `2>&1`; stderr must stay separate from stdout so the visible report remains script-controlled.
- Visible R2 answers must not include `覆盖说明`; target lines should use `目标设备：AD1（192.168.8.30）` rather than exposing URL schemes such as `https://192.168.8.30`.
- Visible R2 answers must not append configuration-workflow context such as `回滚已生效`, `之前下发`, or `已不在列表中`; R2 only reports the current `overview.py` query result.
- Visible R2 answers must use Chinese section titles and table headers. English template leftovers such as `AD Device Overview`, `Device Info`, `Virtual Services`, `SSL Certificates`, `Hardware Status`, `Connections`, and `Rate` fail acceptance.
- VS configuration queries must not show traffic/status metrics such as connection count, new connection rate, or throughput. Those fields belong only to `overview.py traffic` / traffic prompts.
- HA can be tested manually when needed, but is intentionally skipped in the default acceptance batch.
- `connect.py` validates the requested target from `devices.json`, including AD 内网设备资源 reachability/auth evidence.
- The answer includes VS, Pool/config, traffic/status, and certificate sections only if returned by the script.
- Acceptance prompts must not include parameter-fill follow-ups for R2.

## Requirement 3: Perception Analysis

R3 is perception/trend/log analysis, not a plain current-state query. R2 already covers current device status and hardware/resource values through `overview.py hardware`. To avoid routing ambiguity, the fixed R3 mainline only keeps the two clearest user tasks: log analysis and specified-VS traffic trend analysis.

Fixed mainline prompts:

| Case | Prompt | Expected command |
| --- | --- | --- |
| `r3-traffic-vs` | `对 AD2 设备的 test 虚拟服务进行流量趋势分析。` | `collector.py collect --collect-only` then `perception.py traffic --vs test --require-db` |
| `r3-logs` | `对 AD2 设备的日志进行分析。` | `perception.py logs --levels ALERT,ERROR --limit 20` |
| `r3-logs-5d` | `对 AD2 设备近 5 天的日志进行分析。` | `perception.py logs --days 5 --levels ALERT,ERROR --limit 20` |
| `r3-logs-address-conflict` | `对 AD2 设备近 24 小时的地址冲突类型日志进行分析。` | `perception.py logs --levels ALERT,ERROR --limit 20 --log-type address-conflict` |

Avoid vague R3 prompts such as `AD1 做个感知分析` or `AD1 有没有异常`. They are too broad for a stable mainline gate and can collide with R2 query routing.

Optional single-dimension prompts, not part of the fixed mainline gate:

```text
对 AD1 设备的流量趋势进行分析。
```

```text
帮我分析一下 AD1 有没有地址冲突。
```

```text
帮我看一下 AD1 的服务日志线索。
```

Extended suite single-dimension prompts:

```text
AD1 有没有地址端口冲突？
```

Expected tool calls:

```text
connect.py
collector.py collect --collect-only
perception.py traffic --vs test --days 7 --require-db
perception.py logs --levels ALERT,ERROR --limit 20
perception.py logs --levels ALERT,ERROR --limit 20 --log-type address-conflict
```

Pass criteria:

- `connect.py` validates the requested target from `devices.json`, including AD 内网设备资源 reachability/auth evidence.
- The final conclusion is backed by `perception.py` output.
- The VS traffic trend prompt uses AD2/192.168.8.31 `test`, must run `collector.py collect --collect-only` first, then call `perception.py traffic --vs test --days 7 --require-db`. It must prove a database query path and must not answer from realtime API fallback or model memory.
- VS traffic trend output must not include a `风险` column, arrows such as `↓`, or subjective severity words such as `轻微/明显/严重/显著`; show the change as a direct ratio such as `下降 79.9%` or `上升 12.3%`.
- R3 visible output must preserve the `perception.py` markdown block instead of rewriting conclusions; do not add phrases such as `小结`, `三项核心指标`, `大幅偏离`, `连接数约为基线`, `当前值为 0`, or `降至 0` unless they are emitted by the script itself.
- The log prompt must call `perception.py logs`, default to recent 24 hours, query both `ALERT` and `ERROR` across all modules, and cap visible output to the newest 20 rows sorted by time descending. Do not add `--modules` unless the user explicitly names an AD log module such as APPD/SYS/ALARM.
- A semantic log type is not a module. The address-conflict log prompt must use `--log-type address-conflict`, must not use `--modules`, and the script filters the returned service-log rows by address/IP/VIP/port + conflict semantics.
- The log prompt has an external API truth check: the acceptance runner independently calls `ad_api.py log service` with the same `levels/time window`, any explicit module filter, and a wider page when semantic filtering is requested; it then applies the same semantic filter and compares those API rows with WorkBot's tool-call command and visible `perception.py logs` output. A run fails if the command lacks the expected API filter or the visible output contradicts the direct API sample.
- If the user gives a log window such as recent 5 days or 7 days, WorkBot must pass that range through with `--days N`.
- R3 visible status must match the evidence: if the output lists traffic anomalies or `ALERT`/`ERROR` logs, the conclusion status must be `需关注`, not `未发现明显异常`.
- R3 final answers use `感知结论 / 分析结果 / 结论边界`; subcommand outputs must not bypass the perception template.
- R2/R3 boundary: `设备状态/硬件状态/资源状态查询` belongs to R2; R3 only owns prompts that explicitly ask for analysis, trend, log, conflict, or perception.
- No root cause, anomaly, or trend is invented outside script stdout.
- Acceptance prompts must not include parameter-fill follow-ups for R3.
- Address conflict is a specialty/optional R3 case, not a fixed mainline case. Its acceptance checks are: real `connect.py` call first, real `perception.py conflict` call second, visible output uses the R3 template, the conclusion mirrors script fields `vs_overlaps` and `pool_overlaps`, and if the device has no conflict the answer must say no conflict found rather than inventing one. A positive conflict finding requires controlled device data or a fixture; the live mainline should not require a conflict to exist.

## Requirement 4: Config Generation

Requirement 4 is a general configuration-generation workflow. The minimum supported SLB matrix is VS + existing Pool, VS + Pool + nodes, VS + existing/new HTTP Profile, VS + existing/new HTTP Pre Rule, and combinations of those dependencies. XFF is only one example, not the only workflow.

R4 acceptance covers create, patch/update, delete, rollback, and real-device API verification for the SLB resources in the supported WorkBot prompt matrix. This is not an exhaustive test of every SLB object exposed by the device API documentation. If a new SLB resource type is added to WorkBot prompts, it must be added to the YAML fixture, plan/script generation path, real-device verifier, and R2/R4 interaction checks.

Requirement 4 is always staged. Prompt-to-YAML is a mandatory first flow and must not be replaced by parameter follow-up questions. Stage A prompts must name the target AD device. If the prompt is incomplete or ambiguous, WorkBot generates a YAML template with blanks and stops for manual completion. A completed YAML then enters the second flow: plan/script generation, same-name resource GET preflight against the target device, and a user choice between script-only output or delivery verification.

Fixed Stage A mainline prompts:

```text
在 AD1 上帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。
```

```text
在 AD1 上帮我创建虚拟服务，创建节点池并添加节点。
```

```text
在 AD1 上帮我创建一个 HTTP 虚拟服务，引用节点池和 http 优化策略。
```

```text
在 AD1 上帮我创建虚拟服务，引用节点池和前置策略。
```

Extended suite Stage A prompts, not part of the fixed R4 gate:

```text
在 AD1 上帮我建个 VS，挂已有 Pool。
```

```text
在 AD1 上检查这份 VS 配置会不会撞现网。
```

The collision/audit prompt is treated as a read-only YAML preflight, not as a create Stage A prompt. The operator uploads the completed YAML, then asks the collision question. WorkBot must run `plan-and-render`, `summarize-plan`, and `preflight-slb-plan`, must not run `apply-slb-plan`, and must still answer with the compact `配置结论 / 产出物 / 下一步` template.

Human downloads WorkBot's YAML artifact, fills the required fields, uploads the completed YAML, then replies:

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

Update and delete mainline choices:

```text
在 AD1 上帮我修改这套 SLB 配置的说明字段。
在 AD1 上帮我删除这套 SLB 配置。
```

YAML pass criteria:

- WorkBot does not invent missing fields and does not ask detailed parameter questions in chat.
- The first answer uses the target device from the prompt, produces or requests completion of a YAML template, then stops.
- Stage A must be backed by a real tool call that creates `adops-bundle.yml`; a text-only parameter request is a failure.
- Manual completion happens by uploading a YAML file; the follow-up prompt is only `我写完了 YAML。`.
- After YAML completion, WorkBot generates the plan, runs GET preflight on every create target and every referenced-existing SLB resource, and asks whether to `真实下发` or `直接给出脚本`.
- For resources that have a create operation in YAML, HTTP 404 is normal and means the resource will be created. For resources that are only referenced as existing objects, HTTP 404 is a blocker and requires a corrected YAML.
- If same-name resources exist, WorkBot reuses the existing device resources, omits those create operations from the effective plan, and tells the user which resources were reused.
- For audit-only prompts such as `检查这份 VS 配置会不会撞现网`, WorkBot must use the YAML plan preflight flow and must not replace it with `verify_slb_resource.py`.
- If the user replies `不需要下发`, `先不下发`, or similar wording, WorkBot treats it as script-only mode: produce forward and rollback scripts, explain how to use them, and stop.
- After delivery, WorkBot asks the user to inspect the device result and confirm rollback; the human reply is only `需要回滚。` or `是`.
- Update delivery uses a completed YAML with `patch` operations and must run the same staged plan/preflight/apply flow as create. The independent AD verifier must confirm the updated `description` fields on VS, Pool, HTTP Profile, and HTTP Pre Rule before rollback.
- Delete delivery uses a completed YAML with `delete` operations and explicit rollback metadata. The independent AD verifier must confirm the VS, Pool, node, HTTP Profile, and HTTP Pre Rule are absent after delete. Delete rollback requires `rollback_method` and `rollback_path` so the rollback manifest can recreate the previous snapshot.
- If the user says `不符合预期` or similar wording after delivery, WorkBot must tell the user to rollback the current delivery and submit a corrected YAML. It must not patch the previous YAML in chat or continue mutating the device.
- If completed YAML is invalid, WorkBot reports script validation errors and stops before any mutating call.

Visible-output template criteria:

- Every R4 answer uses the compact headings `配置结论 / 产出物 / 下一步`; delivery and rollback answers may include the verification sentence inside `配置结论`.
- Audit-only answers use the same compact headings, explain the collision/preflight result in `配置结论`, list at least the YAML under `产出物`, and state that no device mutation was performed.
- Stage A `产出物` lists only the YAML template artifact.
- Stage A must not expand YAML fields in the visible answer. The answer should not list field tables, placeholders, examples, or optional-field explanations; the downloadable YAML carries those details.
- After YAML completion, script-only, delivery, and rollback answers must list `adops-bundle.yml`, `apply.py`, and `rollback_apply.py` prominently under `产出物`; a run fails if any of the three deliverables is missing from the visible answer.
- Tool evidence must prove the artifacts were actually generated. Stage A must show evidence for `adops-bundle.yml`; after YAML completion and every later R4 answer must show evidence for `adops-bundle.yml`, `apply.py`, and `rollback_apply.py` through tool stdout/artifact output or visible file links. The script workflow mirrors these three user deliverables into WorkBot outputs when `/opt/agent/data/outputs` is available; a run fails if the visible answer lists paths but WorkBot has no generation/output evidence for the files.
- User-visible R4 output must not include long internal sections such as `操作计划`, `计划摘要`, `执行摘要`, or `安全确认`.
- User-visible R4 output must not list internal files such as `adops-batch.json`, `adops-effective-plan.json`, `adops-post-apply.json`, `adops-post-rollback.json`, or `adops-rollback-compare.json` unless the user explicitly asks for troubleshooting details.

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
PATCH /api/ad/v3/slb/http-profile/{name}
PATCH /api/ad/v3/slb/pool/{name}
PATCH /api/ad/v3/slb/pre-rule/http/{name}
PATCH /api/ad/v3/slb/virtual-service/{name}
DELETE /api/ad/v3/slb/virtual-service/{name}
DELETE /api/ad/v3/slb/pre-rule/http/{name}
DELETE /api/ad/v3/slb/pool/{name}
DELETE /api/ad/v3/slb/http-profile/{name}
```

Pass criteria:

- Tool calls include the expected generation and plan scripts; generated payloads and summaries come from tool stdout/artifacts.
- Stage A ends with YAML only; no plan/apply happens before the user confirms YAML is complete.
- Stage B always runs `preflight-slb-plan` before script output or delivery. Same-name create targets found by GET are reused and omitted from the effective plan. Referenced-existing resources must also be confirmed by GET before delivery.
- Stage B treats non-404 GET failures as blockers. WorkBot must stop before any mutating call if preflight cannot prove whether a same-name resource exists. For referenced-existing resources, HTTP 404 is also a blocker; for create targets, HTTP 404 is expected.
- Same-name reuse is a name-based reuse policy, not an overwrite. If `reuse_compatibility_warning_count` is greater than zero, WorkBot must report the warning and include it in the manual inspection checklist.
- Script-only mode lists `adops-bundle.yml`, `apply.py`, and `rollback_apply.py`, gives a short usage note, then ends with no mutating call.
- Delivery mode runs `apply-slb-plan`, writes `adops-execute-result.json`, `adops-rollback.json`, `adops-post-apply.json`, and then pauses for manual inspection.
- Delivery acceptance independently verifies the real AD device through API after `apply-slb-plan`: the VS, Pool, node, HTTP Profile, and Pre Rule from the YAML must be present before the rollback prompt is sent.
- Update acceptance independently verifies the real AD device through API after `apply-slb-plan`: the description fields from the update YAML must be present on the VS, Pool, HTTP Profile, and Pre Rule before rollback is accepted.
- Delete acceptance independently verifies the real AD device through API after `apply-slb-plan`: the acceptance VS/Pool/node/Profile/Pre Rule must be absent after delete.
- Rollback runs only after explicit user confirmation. `rollback-and-verify` must write `adops-post-rollback.json` and `adops-rollback-compare.json`.
- Rollback must use the baseline and rollback manifest from the same AD host and plan. A mismatch is a hard failure.
- The run passes only if post-rollback GET state matches the preflight baseline and the same external API verification confirms the acceptance VS/Pool/node/Profile/Pre Rule are absent again. If not, WorkBot must report the diff and must not claim rollback success.

## Tool-Call Verification Checklist

For every acceptance run:

- Do not accept the final text alone; evidence must include visible tool-call panels.
- Open each tool-call panel in WorkBot.
- Verify the command string matches the expected script path.
- Verify the command actually ran and has an exit code/stdout/stderr.
- Verify stdout contains the expected script JSON/Markdown, not a model-only answer.
- For real-device cases, verify AD 内网设备资源 validation: `connect.py` uses `devices.json` AD1, reaches the target, authenticates, and the follow-on script output is real device data.
- For API-backed cases, run the independent external API verifier and compare it to WorkBot output; logs are verified against `ad_api.py log service`, including `ALERT,ERROR`, output limit, and time range. Module filters are verified only when the user explicitly requests an AD log module. Semantic log types, currently `address-conflict`, are verified by querying a wider service-log page and filtering rows locally by the same semantic matcher used by `perception.py`.
- In WorkBot tool calls, `devices.json` must resolve AD1/AD2 to the intranet management addresses `192.168.8.30/192.168.8.31`. Seeing `14.18.243.211:21044` or `14.18.243.211:21039` inside WorkBot tool evidence is a failed package/run and the automation stops.
- For Requirement 4, verify the staged sequence: YAML generation, `plan-and-render`, `summarize-plan`, `preflight-slb-plan`, optional `apply-slb-plan`, and optional `rollback-and-verify`.

Stability target:

- Development gate: each short-prompt case passes 3 consecutive runs.
- Release gate: each short-prompt case passes 10 consecutive runs with the same tool sequence and output template.
