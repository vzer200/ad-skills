---
name: ad-build
description: Use when Codex needs to decide whether AD project changes can reuse a public-base dependency bundle, whether pre-change full build verification is available, inspect ad-build CLI outputs, select module verification, or explain ad-build verify/report logs. The CLI is deterministic and never calls a model; this skill teaches AI agents how to use it safely.
---

# ad-build

`ad-build` is a deterministic npm CLI. It never calls a model. Use AI judgment only to interpret its outputs together with the diff, module map, Makefiles, public-base status, and real build logs.

Prefer the installed command:

```bash
ad-build ...
```

If the package is not installed, run the local entrypoint from the repository root:

```bash
node bin/ad-build.js ...
```

## Core Workflow

1. Run `ad-build public-base status` when the team uses public-base dependency bundles.
2. Run `ad-build public-base check --bundle <public-base.tar>` before trusting a restored bundle.
3. If public-base is missing, restore the intended bundle before module verification.
4. Run `ad-build precheck`.
5. Recommend skipping pre-change full build only when `precheck` reports all of:
   - `baseline_status: matched`
   - `worktree_clean: true`
   - `errors: []`
   - no blocking warnings
6. Run `ad-build diff` and `ad-build map`.
7. Read the generated diff files and mapping outputs, especially `diff-files.txt` and `module-map-result.json`.
8. Read relevant Makefiles and build config before deciding scope:
   - Makefiles in matched module directories
   - parent directory Makefiles
   - repository root Makefile
   - discoverable `include *.mk` files
   - shared build configuration referenced by those files
9. Decide risk level from CLI output, changed paths, Makefile evidence, public-base status/check, module mapping, and compile logs.
10. Select verification:
   - list required modules
   - list optional modules
   - list modules not selected this round
   - do not claim a module is definitely safe to skip unless dependency evidence supports it
11. Run `ad-build verify <module...>` for selected modules.
12. Run `ad-build report <run-id>` or inspect report outputs after verification.
13. If verification fails, read the corresponding module logs and recommend the smallest concrete next step.

## Public-base File Bundle Workflow

Use this workflow when common AD build dependencies have already been produced by a trusted full build and app/module developers only need the public dependency layer restored.

Trusted full-build node or CI:

```bash
ad-build full-build -- ./compile.sh
ad-build public-base key
ad-build public-base pack --out public-base.tar
ad-build public-base check --bundle public-base.tar
```

`public-base pack` fails if any required restore path is missing. `--allow-partial` is only for deliberate diagnostics, not normal delivery.

Developer or app verification workspace:

```bash
ad-build public-base restore --bundle public-base.tar
ad-build public-base status
ad-build public-base check --bundle public-base.tar
ad-build diff
ad-build map
ad-build verify <module...>
```

Read these outputs before recommending reuse:

- `.ad-build/public-base/status.json`
- `.ad-build/public-base/check.json`
- `.ad-build/public-base/current.json`
- `.ad-build/inventory/current.json` when using source-only diff after restore

`public-base` stores only:

- `obj/lib64/`
- `include/`
- `obj/bin/`
- `KERNEL_VER`
- `OS_PLATFORM.file`

Do not treat public-base restore as proof that the current change is correct or that a full build passed. It only proves the reusable dependency layer was restored and still matches the bundle manifest/key.

## Public-base Reuse Rules

- If only `apps/**` changed, public-base can be reused only when `status` is `restored` and `check` is `matched`.
- If `libs/**`, `include/**`, `proto/**`, `sinfor/**`, `compile.sh`, `Makefile`, `app.mk`, or shared `*.mk` changed, public-base is stale and a full build or rebuilt public-base is required.
- If `status` is `missing`, the next command should be `ad-build public-base restore --bundle <public-base.tar>`.
- If `status` is `partial` or `changed`, do not trust module verification until the intended bundle is restored again or public-base is rebuilt.
- If `check` is `mismatch`, public inputs differ from the bundle. Do not recommend app-local verification as sufficient.
- If restore reports conflicts, do not use `--force` unless the workspace is disposable or explicitly backed up.
- If `verify` fails due to missing libraries or headers, inspect `public-base status` and `public-base check` before changing source code.

## Risk And Safety Rules

- AI decisions must be grounded in CLI output, diff details, module-map data, Makefiles, public-base output, and compile logs. Do not assume safety from path names alone.
- If required CLI output, diff files, Makefiles, module-map output, public-base status/check, or logs are missing, stale, contradictory, or unreadable, require broader verification or ask the developer.
- If `mapping_trusted: false`, mark the change high risk. Do not directly run verify commands from the unreviewed module map. First show the user the module, command, cwd, and env that would run.
- Treat `module-map.yaml` as an initial filter only, not the final dependency truth.
- Treat `tools/public-base.yaml` as high risk. If restore paths, public inputs, or exclude rules change, require public-base review and usually a CI rebuild.
- Real compile results override AI judgment.
- If high-risk files are touched, final status must keep `full_build_status: required` until a full build has passed or is explicitly queued with an owner or pipeline record.

High-risk changes include:

- public build configuration
- toolchain files
- package, signing, release, or install scripts
- Docker or build environment files
- public-base config
- proto files
- common headers or shared libraries
- repository-wide Makefiles or shared `*.mk` includes
- `tools/module-map.yaml` or other module-map changes

Unmapped files are not safe by default. Inspect Makefiles and shared includes, then either choose broader verification or ask the developer for ownership and build impact.

## Module Selection

- Single business-module changes with no public/shared files: prioritize that module's verification.
- Shared headers, proto, toolchain, package, signing, Docker, root Makefile, shared `*.mk`, public-base config, or public input changes: require full build or clearly justified broad module verification plus `full_build_status: required`.
- Module-map changes: treat mapping as untrusted for this run and review commands before execution.
- Binary, generated, renamed, copied, deleted, or unmapped files require extra caution because dependency impact may not be visible from the module map.

## Commands

Use the installed command first:

```bash
ad-build public-base status
ad-build public-base check --bundle <public-base.tar>
ad-build precheck
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
```

CI or trusted build-node commands:

```bash
ad-build full-build -- ./compile.sh
ad-build public-base key
ad-build public-base pack --out public-base.tar
ad-build public-base check --bundle public-base.tar
ad-build baseline-save --from-run latest
```

Fallback local form:

```bash
node bin/ad-build.js public-base status
node bin/ad-build.js public-base check --bundle <public-base.tar>
node bin/ad-build.js precheck
node bin/ad-build.js diff
node bin/ad-build.js map
node bin/ad-build.js modules
node bin/ad-build.js verify <module...>
node bin/ad-build.js report <run-id>
```

## Full Bundle And Docker Image Notes

`ad-build bundle pack --profile full` is a diagnostic capability, not the recommended AD public-base workflow. Full compiled trees can be very large and may include package outputs unrelated to app-local verification.

The Docker base-image commands remain available for teams that explicitly use image recovery:

```bash
ad-build image status
ad-build image pull
ad-build image restore --delete
```

Do not switch to Docker base-image logic unless the user or project config explicitly requires it.

## Final Recommendation Format

Always end with these exact structured fields:

```text
risk_level: low | medium | high
evidence: <CLI outputs, diff files, module-map output, public-base output, Makefiles, logs used>
required_verification: <modules and/or full build that must run>
optional_verification: <extra modules or checks that improve confidence>
public_base_status: not_used | restored | missing | partial | changed | mismatch | rebuild_required
full_build_status: not_required | required | passed | queued
next_command: <single next ad-build command or local fallback command>
```
