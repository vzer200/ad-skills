---
name: ad-config-ops
description: >
  Use when 用户要基于深信服 AD/ADC/SLB API 生成负载均衡配置脚本、创建全字段配置模板、刷新版本化 AD API 文档、生成 batch JSON、执行真实设备下发验证、回查比对或精确回滚。适用于整套 Sangfor AD API，不限于 SLB。默认只生成产物；真实设备验证和回滚按用户明确意图执行。
---

# ad-config-ops

## Core Rules

- Work from this project-local skill source: `skills/ad-config-ops/`.
- Do not sync, install, write to, or overwrite any global Codex skill directory unless the user explicitly asks to sync AD-OPS (用户明确触发同步).
- Ignore any existing global skill with a similar purpose; it is not the implementation source for this project.
- Default mode is generation only. Do not connect to real devices unless the user accepts real-device validation.
- After generating a script and batch JSON, always ask whether to enter real-device validation.
- If validation is requested, collect only device address plus username/password or token. Use HTTPS, `verify=False`, and Basic Auth by default.
- If the user says to use `devices.json`, gives a device alias such as `AD1`, or asks to reuse the packaged device list, pass `--devices devices.json --device <alias>` to the device script instead of opening, printing, or manually copying secrets from `devices.json`. If the file contains multiple devices and the user did not choose one, ask for the device alias.
- Device-capable scripts in this skill are `execute_plan.py`, `rollback.py`, `prepare_edit_template.py`, and `interface_adapter.py`; each accepts `--devices <path> --device <name>`. `--host` may be either `192.168.8.30` or `https://192.168.8.30`.
- This `verify=False` default is intentional for the approved AD appliance integration workflow.
- Current `scripts/execute_plan.py` preview mode is offline plan preview only; it returns without connecting, prompting for credentials, running precheck GETs, or mutating a device.
- Do not claim a separate read-only device precheck mode exists unless it is implemented.
- Every new AD-OPS create, modify/patch/replace, or delete workflow must begin by initializing the runtime file environment with `scripts/init_env.py`; this is the skill's first operation, before lookup, template generation, planning, rendering, validation, apply, or rollback.
    - In WorkBot, keep `AD_OPS_WORKDIR` as an internal runtime directory such as `/tmp/ad-ops-workdir`; use `/opt/agent/data/outputs` only for user-downloadable outputs.
    - In WorkBot, initialization must clean `/opt/agent/data/outputs` before starting the workflow so stale files from earlier prompts cannot remain downloadable.
    - During the template-only stage in WorkBot, `/opt/agent/data/outputs` must contain only the downloadable `adops-bundle.yml`; do not leave lookup JSON, artifact JSON, env files, scripts, or other AD-OPS internals there.
    - Outside WorkBot, set `AD_OPS_WORKDIR` before running any AD-OPS script. If no host-managed directory is provided, use `./ad_ops_workdir`.
- Run `init_env.py` once per workflow start. Do not rerun it after the user uploads or finishes a YAML for the same workflow, because that would erase current workflow artifacts.
- Always pass `--workdir "$AD_OPS_WORKDIR"` to AD-OPS scripts.
- User-facing files, generated plans, scripts, results, and rollback files are created under `AD_OPS_WORKDIR`; in WorkBot copy only the requested user-facing deliverable into `/opt/agent/data/outputs`.
- Do not create any nested work directory inside `AD_OPS_WORKDIR`.
- By default, scripts that can write large outputs should write files and print only short JSON summaries. Use explicit `--json`, `--summary`, `--out`, `--result-out`, or `--workdir` flags rather than routing large stdout back through the model.
- For 修改场景 edit-template preparation and real-device snapshot/verification GETs, fetch only the selected resource path and include `all_properties=true` so the device returns all configuration fields.
- Before changing a device, show the operation plan, prechecks, verification fields, and rollback plan.
- Do not ask for a second apply confirmation. A user message that explicitly requests real-device validation or下发 and provides the required device credentials is sufficient approval to run the apply workflow, including planned POST, PATCH, PUT, DELETE, or downstream mutations.
- After self-verification succeeds, ask the user to verify on the device or business side.
- After the user confirms the result, ask whether to keep or roll back this configuration. Do not ask for a second rollback confirmation; if the user requests rollback, run the rollback workflow.
- In the final user-facing completion summary, only present `apply.py` as the reusable deliverable: state that it is a self-contained apply script and show the exact command pattern to run it. Do not present rollback artifacts such as `adops-rollback.json` as final user-facing deliverables unless the user explicitly asks about rollback internals.

## Deterministic Guardrails

- Use scripts and files as the source of truth. Do not use values from chat history, previous turns, old artifacts, or memory as device state, API output, payload content, schema fields, enum values, verification results, or rollback state.
- Treat every new create, modify/patch/replace, or delete request as a new ambiguity scope. Do not carry resource-type clarification answers from earlier workflows into the current workflow unless the user explicitly repeats that type in the current request.
- Do not rewrite an ambiguous current request into a typed query before lookup. For example, if the current request says `创建虚拟服务，节点池，前置策略和http优化策略`, the `http` only determines the HTTP optimization profile; it does not determine the virtual service type or pre-rule type. Run lookup on the current raw intent and ask the returned virtual-service/pre-rule clarification questions.
- Generated artifacts are opaque machine files. Never open, cat, sed, grep, summarize, parse, or paste generated bundle/plan/batch/apply/result/rollback artifacts for model-side analysis unless debugging the AD-OPS implementation itself.
- Use script JSON summaries and `AD_OPS_WORKDIR/adops-artifacts.json` to pass file paths between steps. Do not read, paste, or summarize generated bundle, plan, batch, apply, result, or rollback files unless debugging AD-OPS itself.
- Never ask another model, tool, or agent to parse AD-OPS intermediate files. If information is needed, run `scripts/ad_ops_flow.py status`, `scripts/ad_ops_flow.py summarize-plan`, `scripts/execute_plan.py`, or `scripts/rollback.py` and use only their short JSON stdout summaries.
- Do not reuse an existing adops-plan.json, adops-batch.json, apply.py, adops-execute-result.json, or adops-rollback.json across user requests. After a new template is filled or a new device read is approved, regenerate downstream artifacts from the current bundle file under `AD_OPS_WORKDIR`.
- All internal generated files must use the `adops-` prefix. `apply.py` is the only reusable user-facing exception; cleanup still treats it as an AD-OPS generated file.
- In WorkBot create/modify/delete workflows, clean stale generated files automatically by running `init_env.py` with `--confirm-clean --clean-output-dir`. Outside WorkBot, if `init_env.py` reports residual AD-OPS generated artifacts at task start, ask the user whether to delete them. If the user agrees, rerun `init_env.py` with `--confirm-clean`; if the user refuses, stop the task and tell the user the workdir must be cleaned before continuing.
- Do not reuse a previous device address, username, password, or token unless the user explicitly provides it again or explicitly says to reuse it for the current run.
- Do not guess API paths, schemas, request methods, path parameters, enum values, or required fields. Run `lookup_api.py`, `resolve_schema.py`, `render_template.py`, `render_bundle_template.py`, `prepare_edit_template.py`, and `plan_operations.py` as appropriate.
- `lookup_api.py` has a deterministic exact-match layer before scoring: if `exact_terms` from `references/search/search-map-effective.json` match the user request, returned matches carry `match_source: exact` and must be trusted over scored fallback matches. Do not override exact hits with model judgment. Add or remove exact terms only through `references/search/search-map-overrides.json`; use `references/search/exact-match-review.yml` as the generated audit file.
- If `lookup_api.py` returns `needs_clarification`, stop and ask the returned question and options. If the result contains `clarifications`, ask every question and option block in `clarifications` 一次性 in one user message; do not ask only the first ambiguity. Treat `reason: multiple_ambiguities` as a multi-family or multi-variant clarification response. Do not generate templates until the user chooses a precise resource or variant for every returned clarification. Treat `reason: ambiguous_resource_family` as a resource-family clarification, for example 网口 or 监视器; treat `reason: ambiguous_variant_family` as a variant-family clarification, for example 虚拟服务 service 类型.
- A clarification answer is valid only for the workflow that asked it. If a later user message starts a new workflow and omits the type, ask again. Never say "the type was confirmed earlier" as the reason to skip clarification.
- If `lookup_api.py` returns a selected match with `preset_fields`, pass each preset to template generation as `--preset key=value`, for example `--preset service=HTTP`; do not ask the user to fill an already determined variant field.
- If the user answers a clarification with a concrete resource type such as `HTTP`, select the matching split document for every affected operation, for example `slb/virtual-service/http.js` and `slb/pre-rule/http.js`. These documents must render `service: HTTP` in their payloads.
- Template rendering automatically prefills top-level single-value `service` or `type` discriminator fields from the selected schema/document, so users do not have to fill a type that was already determined by lookup or clarification.
- For network resources whose template contains `interface` or `interfaces` fields, do not guess usable physical/Bond/VLAN/Bridge interface names. If the user wants device assistance, run `scripts/interface_adapter.py` and use only its short JSON summary to present candidate `interface.type` and `interface.interface` fill hints.
- Multi-operation bundles must be dependency-sorted by scripts, not by model judgment. `render_bundle_template.py`, `plan_operations.py`, and `ad_ops_flow.py` use `scripts/dependency_order.py` plus `references/recipes/slb-basic.json`, covering all current SLB writable resource prefixes in `references/api-index.json`: create/patch/replace place unranked external resources first in user order, then SLB resources in dependency order; delete places SLB resources first in reverse dependency order, then unranked external resources in reverse user order. If a script reports mixed delete and non-delete operations, stop and report the error.
- If a script fails, stop and report the short error. Do not handcraft a payload, plan, batch, result, rollback manifest, or verification conclusion to work around the failure.
- When a script prints a JSON summary, rely on that summary and `adops-artifacts.json` for paths. Do not paste or inspect large files unless validation/debugging specifically requires it.
- When unsure what step comes next, run `scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"` and follow the `workflow_contract`; do not infer the next step from file contents.
- For real devices, only treat data returned by the current approved script run as current device state. For modify flows, current state must come from `prepare_edit_template.py` or from the precheck GET inside `execute_plan.py`; both use `all_properties=true`.

## Executable Workflow

Run from the repository root. Each step below names the script that owns the behavior; do not replace script calls with model-side parsing, handcrafted payloads, or values remembered from earlier turns.

Before any AD-OPS command, set the runtime directory. In WorkBot, keep runtime internals outside the downloadable outputs directory:

```bash
export AD_OPS_WORKDIR="${AD_OPS_WORKDIR:-/tmp/ad-ops-workdir}"
export AD_OPS_OUTPUT_DIR=/opt/agent/data/outputs
```

If another host product provides a work directory, set `AD_OPS_WORKDIR` to that path; otherwise use the local default:

```bash
export AD_OPS_WORKDIR="${AD_OPS_WORKDIR:-./ad_ops_workdir}"
```

### Step 0. Initialize Runtime

Purpose: create the current workflow's artifact contract and remove stale AD-OPS files before any lookup, template, plan, apply, or rollback work. This step is mandatory for every create, modify/patch/replace, and delete workflow.

Run once at the start of each new WorkBot create/modify/delete workflow:

```bash
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR" --confirm-clean --clean-output-dir
python3 skills/ad-config-ops/scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"
```

`init_env.py` cleans `AD_OPS_WORKDIR` generated artifacts and the WorkBot downloadable output directory. After Step 0, `/opt/agent/data/outputs` must be empty until the current workflow publishes its requested deliverable.

Outside WorkBot, run once at the start of each new workflow:

```bash
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"
```

If the non-WorkBot command reports residual generated artifacts, ask the user whether to delete them. If the user agrees, rerun it with `--confirm-clean`; if the user refuses cleanup, stop the task. Do not rerun `init_env.py` later in the same workflow to switch files; use the paths in `AD_OPS_WORKDIR/adops-artifacts.json`.

### Step 1. Resolve API

Purpose: map the user's intent to API document paths and schemas. Do not guess API paths, schema names, enum values, or writable fields.

Run lookup and use only the short JSON summary plus selected file paths:

```bash
python3 skills/ad-config-ops/scripts/lookup_api.py --skill-root skills/ad-config-ops --query "<intent>" --module <module> --out "$AD_OPS_WORKDIR/adops-lookup.json" --summary
```

If lookup returns matches with `match_source: exact`, use those exact matches first; do not substitute a scored fallback candidate. Examples: `HTTP虚拟服务` maps directly to `slb/virtual-service/http.js`, `ICMP监视器` maps directly to `slb/service-monitor/icmp.js`, and `节点池` maps directly to `slb/pool.js`.

If lookup returns `needs_clarification`, stop the workflow and ask the returned question and options from the lookup summary. When the summary or saved lookup result contains `clarifications`, present all blocks in `clarifications` 一次性 as a compact selection template and require the user to choose one precise option for each block. `multiple_ambiguities` means the user request contains more than one ambiguous resource family or field variant. Do not generate templates until every returned clarification has a precise user choice; rerun lookup or template generation only after the precise resource or variant is known. `ambiguous_resource_family` covers resource families such as 网口 or 监视器. `ambiguous_variant_family` covers variant families such as 虚拟服务 service 类型.

If lookup returns `preset_fields` on the selected match, convert every pair into a template preset. For split documents such as HTTP virtual service, use the selected document directly; the template renderer prefills its single-value `service` field:

```bash
python3 skills/ad-config-ops/scripts/render_template.py --skill-root skills/ad-config-ops --schema config.virtual_service --document slb/virtual-service/http.js --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

After Step 1, branch by intent. If the request is modify, patch, replace, or edit, run Step 2 and skip Step 3. If the request is create, run Step 3 and skip Step 2.

### Step 2. Modify Existing Config

Purpose: for any 修改场景, patch, replace, or edit request, the workflow must fetch the current object first and generate the edit template from real device state.

Ask whether to connect to the real device to read the selected object. Collect only device address plus username/password or token. Do not render a blank template for a modify request.

After the user approves the read, run:

```bash
python3 skills/ad-config-ops/scripts/prepare_edit_template.py --skill-root skills/ad-config-ops --schema <schema> --document <document> --name <object-name> --host <ad-host:port> --username <user> --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

When the user selects a device from `devices.json`, use `--devices devices.json --device <alias>` instead of `--host/--username/--password`. Use `--token <token>` instead of `--username <user>` when the user provides a token. The script performs one GET for the selected resource with `all_properties=true`, then writes a full-field bundle YAML in API schema order with `action: patch` by default. Tell the user to edit `"$AD_OPS_WORKDIR/adops-bundle.yml"` and stop until they say it is filled.

### Step 3. Generate Create Template

Purpose: produce the customer-facing full-field YAML template in API document order for create requests only.

For a single resource:

```bash
python3 skills/ad-config-ops/scripts/render_template.py --skill-root skills/ad-config-ops --schema <schema> --document <document> --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

For a multi-resource change, generate one bundle file with repeated `--operation <id> <action> <schema> <document>` arguments:

```bash
python3 skills/ad-config-ops/scripts/render_bundle_template.py --skill-root skills/ad-config-ops --operation <id> <action> <schema> <document> --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

When the user has already clarified a type, append `KEY=VALUE` presets to each affected operation. Example for creating an HTTP pool, HTTP pre-rule, and HTTP virtual service:

```bash
python3 skills/ad-config-ops/scripts/render_bundle_template.py --skill-root skills/ad-config-ops \
  --operation pool1 create config.pool slb/pool.js \
  --operation policy1 create config.pre_rule_http slb/pre-rule/http.js \
  --operation vs1 create config.virtual_service slb/virtual-service/http.js \
  --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

In WorkBot template-only stages, publish only the bundle YAML to the downloadable outputs directory:

```bash
mkdir -p "$AD_OPS_OUTPUT_DIR"
find "$AD_OPS_OUTPUT_DIR" -maxdepth 1 -type f \( -name 'adops-*' -o -name 'apply.py' -o -name 'rollback_apply.py' -o -name 'apply.sfcli' \) -delete
cp "$AD_OPS_WORKDIR/adops-bundle.yml" "$AD_OPS_OUTPUT_DIR/adops-bundle.yml"
```

Tell the user to fill `"$AD_OPS_OUTPUT_DIR/adops-bundle.yml"` in WorkBot, or `"$AD_OPS_WORKDIR/adops-bundle.yml"` outside WorkBot, and stop until they say it is filled. Do not read or summarize the YAML file contents.

For network interface/link resources, offer optional device-side interface assistance before the user fills the template. This is read-only but still connects to a real device, so ask whether to query available interfaces and collect only device address plus username/password or token. If approved, run:

```bash
python3 skills/ad-config-ops/scripts/interface_adapter.py --document <document> --host <ad-host:port> --username <user> --workdir "$AD_OPS_WORKDIR"
```

When the user selects a device from `devices.json`, use `--devices devices.json --device <alias>` instead of `--host/--username/--password`. Use `--token <token>` instead of `--username <user>` when applicable. The script maps known documents to adapter modules, including `net/link/lan.js -> net/link/lan/interface`, `net/link/wan.js -> net/link/wan/interface`, `net/link/pppoe.js -> net/link/pppoe/interface`, `net/bond.js -> net/bond/interfaces`, `net/vlan.js -> net/vlan/interface`, and `net/bridge.js -> net/bridge/interfaces`. It writes `"$AD_OPS_WORKDIR/adops-interface-adapter.json"` and prints a short summary with `fill_hints`; use those hints to tell the user how to fill `interface.type` and `interface.interface`. Do not open or parse `adops-interface-adapter.json` unless debugging AD-OPS itself.

### Step 4. Plan And Render

Purpose: validate the filled bundle, prune unfilled template placeholders, dependency-sort operations, and render the reusable outputs without loading large files into the conversation.

After the user says the bundle is filled, run:

```bash
python3 skills/ad-config-ops/scripts/ad_ops_flow.py plan-and-render --skill-root skills/ad-config-ops --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py summarize-plan --plan "$AD_OPS_WORKDIR/adops-plan.json" --workdir "$AD_OPS_WORKDIR"
```

`plan-and-render` writes `adops-plan.json`, `adops-batch.json`, `apply.py`, and updates `adops-artifacts.json`. The generated apply.py must embed the operation plan directly so users can apply with the script alone. If the script fails, stop and report the short error; do not patch the payload by hand.

### Step 5. Ask Real-Device Validation

Purpose: keep generation-only as the default while offering real-device validation and precheck planning after artifacts exist.

After Step 4, ask whether to enter real-device validation and precheck planning. If the user does not approve, skip to Step 9. If the user approves, collect only device address plus username/password or token, then continue to Step 6. Do not ask for a second apply confirmation after the user has requested real-device validation and provided credentials.

If a short offline preview is useful before device work, run:

```bash
python3 skills/ad-config-ops/scripts/execute_plan.py --plan "$AD_OPS_WORKDIR/adops-plan.json" --result-out "$AD_OPS_WORKDIR/adops-execute-preview.json" --workdir "$AD_OPS_WORKDIR"
```

This preview is offline only. It does not connect, prompt for credentials, run device GETs, or mutate the device.

### Step 6. Real-Device Apply

Purpose: after the user approves validation, run the approved apply workflow against the current device and use script summaries for verification state.

Collect only device address plus username/password or token if not already available for the current run. Show the short operation summary, precheck paths, verification counts, and rollback plan from script stdout summaries; do not paste full payloads. Because the user already requested real-device validation, run the apply workflow without a second confirmation:

```bash
python3 skills/ad-config-ops/scripts/execute_plan.py --plan "$AD_OPS_WORKDIR/adops-plan.json" --host <ad-host:port> --username <user> --execute --result-out "$AD_OPS_WORKDIR/adops-execute-result.json" --rollback-out "$AD_OPS_WORKDIR/adops-rollback.json" --workdir "$AD_OPS_WORKDIR"
```

When the user selects a device from `devices.json`, use `--devices devices.json --device <alias>` instead of `--host/--username/--password`. Use `--token <token>` instead of `--username <user>` when applicable. The script performs real-device precheck GETs with `all_properties=true`, applies the plan, performs verification GETs with `all_properties=true`, compares results, creates the rollback manifest, and prints a short JSON summary.

### Step 7. User Verification

Purpose: separate script self-verification from the user's device or business-side confirmation.

If Step 6 reports success, ask the user to verify on the device or business side. If the user says it is correct, ask whether to keep the configuration or roll it back. If the user reports a problem, do not guess; use script summaries and current task artifacts to decide the next command.

### Step 8. Rollback On Request

Purpose: roll back when the user asks to roll back after user-side verification.

If the user requests rollback, run the rollback workflow without asking for a second rollback confirmation:

```bash
python3 skills/ad-config-ops/scripts/rollback.py --manifest "$AD_OPS_WORKDIR/adops-rollback.json" --host <ad-host:port> --username <user> --execute --result-out "$AD_OPS_WORKDIR/adops-rollback-result.json" --workdir "$AD_OPS_WORKDIR"
```

When the user selects a device from `devices.json`, use `--devices devices.json --device <alias>` instead of `--host/--username/--password`. Use `--token <token>` instead of `--username <user>` when applicable. Rollback verification GETs also include `all_properties=true`.

### Step 9. Finish With Final Deliverable

Purpose: close the task by telling the user only the reusable apply script and its usage.

Tell the user the reusable script path is `"$AD_OPS_WORKDIR/apply.py"` and show:

```bash
python3 "$AD_OPS_WORKDIR/apply.py" --host <ad-host:port> --username <user> --execute
```

State that the script prompts for the password unless `AD_PASSWORD` or `--token` is provided. Do not present rollback artifacts in the final completion message unless the user explicitly asks about rollback internals.

## Maintenance Commands

Refresh versioned API docs and regenerate API-derived artifacts only when the user provides replacement docs or asks for a refresh:

```bash
python3 skills/ad-config-ops/scripts/refresh_api_docs.py --source <api-docs-json-dir> --version <fallback-version> --skill-root skills/ad-config-ops
```

`--source` must point to the Swagger JS docs directory that contains `toc.js`, `{common}.js`, and `token.js`; for the packaged Web documentation this is usually the `json/` directory. When the parent Web package contains `index.html` or `js/app.js`, refresh uses the Web display version, for example `API 7.0.28`, as the canonical version and records the CLI `--version` value only as `requested_version` fallback metadata. `references/api-version.json` records `version_source`, `web_version`, `swagger_version`, and warnings when these sources differ.

After refresh, check `references/api-version.json` and `references/generated/api-patch-report.json` before relying on generated outputs. Version-bound fixes live in `references/api-patches/`, and refresh preserves that directory while applying only patches matching the detected API version.

Sync is user-triggered only. Writing the global target requires both a user sync request and `--confirm`:

```bash
python3 skills/ad-config-ops/scripts/sync_to_codex_skill.py --source skills/ad-config-ops --target /Users/fangpb/.codex/skills/ad-config-ops --confirm
```

## Template Rules

- Templates must include every writable field from the selected schema.
- Edit templates generated from a real-device GET must keep API document field order, fill values from the current object where present, omit unknown/read-only response fields, and leave missing writable fields as normal template placeholders.
- Every generated YAML template must start with Chinese comments explaining how to fill the template, how empty values are pruned, and how to use `empty_reserve`.
- Unfilled fields are omitted from payloads by recursively pruning empty strings, nulls, empty arrays, empty objects, and unfilled array sample elements.
- If the user intentionally needs to send an empty value, the template must provide a machine-readable `empty_reserve` list. Paths are relative to `payload`; use `[]` for array elements when preserving an empty array item, for example `nodes[]`.
- `enum` and `optionalEnum` values must be listed completely in comments.
- Array fields must render as YAML lists with one blank sample element.
- Object-array fields must render one blank sample object and expand every writable field of that object, including nested arrays.
- Blank sample elements are instructional only; if the user leaves them empty, planning must prune them from the final payload unless the matching path is listed in `empty_reserve`.
- Templates must not quote non-string placeholder values. Leave integer, number, boolean, object, and unknown typed fields blank so users are not misled into writing strings.
- Read-only fields must not be user-fillable.
- If a required field is blank, stop and ask the user to fill it.
- `adops-plan.json` may still be generated for audit/debug, but generated `apply.py` must embed the operation plan directly so users do not need to carry a separate plan file for apply.

## API Version Refresh

Use `scripts/refresh_api_docs.py` to replace versioned API docs and regenerate API-derived artifacts. Refresh logic may automatically rewrite only `references/generated/`, `scripts/generated/`, `references/api-docs/`, `references/api-index.json`, `references/api-version.json`, `references/search/generated-search-map.json`, `references/search/search-map-effective.json`, `references/search/search-map-review.yml`, and `references/search/exact-match-review.yml`. It must not overwrite `references/search/search-map-overrides.json` or `references/api-patches/`.

API document defects that are specific to a known API version should be fixed through version-bound patch files in `references/api-patches/`, not by editing raw files under `references/api-docs/`. `build_index.py` applies matching patches before writing `references/api-index.json` and writes the audit report to `references/generated/api-patch-report.json`. Patch authoring examples are in `references/api-patches/README.md` and `references/api-patches/examples/`.
