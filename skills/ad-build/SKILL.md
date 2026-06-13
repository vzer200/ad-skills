---
name: ad-build
description: Use when Codex needs to decide whether AD project changes can reuse a public-base dependency bundle, restore the fixed public-base artifact repository, publish a trusted full-build public-base bundle, inspect ad-build CLI outputs, select module verification, or explain ad-build verify/report logs. The CLI is deterministic and never calls a model; this skill teaches AI agents how to use it safely.
---

# ad-build

`ad-build` is a deterministic npm CLI. It never calls a model. Use AI judgment only to interpret its JSON outputs together with the diff, module map, Makefiles, public-base status, and real build logs.

Prefer the installed command:

```bash
ad-build ...
```

If the package is not installed, run the local entrypoint from the repository root:

```bash
node bin/ad-build.js ...
```

## Shell Completion

If the user asks for Tab completion, use the built-in command:

```bash
ad-build completion install --shell bash
```

This installs the completion script and updates the user's shell startup file. Use a new shell, or source the startup file, before expecting Tab to complete `ad-build`.

For zsh:

```bash
ad-build completion install --shell zsh
```

To inspect the generated script without installing:

```bash
ad-build completion bash
ad-build completion zsh
```

## Non-Negotiable Public-Base Rules

- The public-base artifact repository is fixed: `https://git.sangfor.com/69765/ad-build-public-base.git`.
- Do not manually clone `ad-build-public-base` in normal use.
- Do not manually derive latest artifact paths in normal use.
- Do not pass a personal token in a URL or CLI argument.
- Use `ad-build public-base auth login --token-stdin --json` for token setup.
- Use `ad-build public-base publish --branch <release-dir> --bundle <public-base.tar> --push --json` to publish from a trusted full-build workspace.
- Use `ad-build public-base use --branch <release-dir> --json` to restore and validate in a developer/app verification workspace.
- If `status: invalid` appears in any public-base check output, stop. Do not restore and do not continue verify. Download the artifact again or rebuild it in a trusted full-build workspace with `ad-build public-base pack`.

## Fixed Repository Authentication

Use this scripted form when the user can paste a Git personal token:

```bash
read -r -s -p "Git token: " TOKEN
printf '\n'
printf '%s' "$TOKEN" | ad-build public-base auth login --token-stdin --json
unset TOKEN
ad-build public-base auth status --json
```

If authentication is broken:

```bash
ad-build public-base auth logout --remove-cache --json
```

Then run the login sequence again. Never print or save the token in logs, docs, shell history, URLs, or issue comments.

## Trusted Full-Build Publish Workflow

Run only in a trusted workspace where the full AD build has already completed, or where the command below is allowed to run the full build.

```bash
ad-build full-build -- ./compile.sh
ad-build public-base pack --out /root/public-base.tar --json
ad-build public-base check --bundle /root/public-base.tar --integrity-only --json
ad-build public-base publish --branch release-AD7.0.29R2 --bundle /root/public-base.tar --push --json
```

Expected meaning:

- `pack.status: packed` means the configured public dependency layer was archived.
- `check.status: valid` with `--integrity-only` means the tar, manifest, inventory, bundled file hashes, and `.sha256` sidecar are internally valid.
- `publish.status: published` means the CLI committed and pushed to the fixed artifact repository.
- `publish.status: no_changes` means the same artifact already exists in the fixed repository and no new commit was needed.

`public-base pack` fails if any required restore path is missing. `--allow-partial` is only for deliberate diagnostics, not normal delivery.

## Developer/App Verification Workflow

Run in the AD source workspace:

```bash
ad-build public-base auth status --json
ad-build public-base use --branch release-AD7.0.29R2 --json
ad-build diff
ad-build map
ad-build verify <module...>
```

`public-base use` performs these fixed steps:

1. Clone or update the fixed artifact repository under `.ad-build/cache/public-base-repo`.
2. Internally read `<release-dir>/latest.json`.
3. Validate the referenced `public-base.tar` with `check --integrity-only`.
4. Restore the bundle into the AD workspace.
5. Run `public-base status`.
6. Run full `public-base check`.
7. Write `.ad-build/public-base/use-summary.json`.

Only treat the public-base as usable when `use-summary.json` has:

```json
{
  "status": "ready",
  "integrity_status": "valid",
  "restore_status": "restored",
  "status_status": "restored",
  "check_status": "matched"
}
```

If `public-base use` fails, inspect these files before recommending code changes:

- `.ad-build/public-base/use-summary.json`
- `.ad-build/public-base/check.json`
- `.ad-build/public-base/status.json`
- `.ad-build/public-base/restore-conflicts.json`

## Public-Base Contents

The default public-base restore layer stores:

- `obj/lib64/`
- `include/`
- `obj/bin/`
- `libs/rdma-core-2404mlnx51/build/include/`
- `KERNEL_VER`
- `OS_PLATFORM.file`

This layer is intentionally smaller than a full compiled workspace. It is meant to make app/module verification possible in a clean checkout, not to reproduce package outputs such as `mkpacket`, `ssipacket`, or `ad_packet`.

## Public-Base Reuse Rules

- If only `apps/**` changed, public-base can be reused only when `public-base use` reports `status: ready`.
- If source/config inputs under `libs/`, `sinfor/`, `include/`, `proto/`, root Makefile, shared `*.mk`, `app.mk`, or `compile.sh` changed, public-base is stale and a full build or rebuilt public-base is required.
- Generated side effects under `libs/**/build/**`, `libs/**/tmp/**`, `sinfor/**/build/**`, `sinfor/**/tmp/**`, object files, archives, shared libraries, `.Po`, `.pyc`, `.md5`, and `.map` are not public-base key inputs by default.
- If `status` is `missing`, run `ad-build public-base use --branch <release-dir> --json`.
- If `status` is `partial` or `changed`, do not trust module verification until `public-base use` succeeds again or public-base is rebuilt.
- If full `check` is `mismatch`, public inputs differ from the bundle. Do not recommend app-local verification as sufficient.
- If integrity `check` is `invalid`, do not restore and do not continue verify.
- If restore reports conflicts, do not enable forced overwrite unless the workspace is disposable or explicitly backed up.
- If `verify` fails due to missing libraries or headers, inspect `public-base status`, `public-base check`, and `use-summary.json` before changing source code.

## Core Workflow After Public-Base Is Ready

1. Run `ad-build precheck`.
2. Recommend skipping pre-change full build only when `precheck` reports all of:
   - `baseline_status: matched`
   - `worktree_clean: true`
   - `errors: []`
   - no blocking warnings
3. Run `ad-build diff` and `ad-build map`.
4. Read generated diff and mapping outputs, especially `diff-files.txt` and `module-map-result.json`.
5. Read relevant Makefiles and build config before deciding scope:
   - Makefiles in matched module directories
   - parent directory Makefiles
   - repository root Makefile
   - discoverable `include *.mk` files
   - shared build configuration referenced by those files
6. Decide risk level from CLI output, changed paths, Makefile evidence, public-base status/check, module mapping, and compile logs.
7. Select verification:
   - list required modules
   - list optional modules
   - list modules not selected this round
   - do not claim a module is definitely safe to skip unless dependency evidence supports it
8. Run `ad-build verify <module...>` for selected modules.
9. Run `ad-build report <run-id>` or inspect report outputs after verification.
10. If verification fails, read the corresponding module logs and recommend the smallest concrete next step.

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

## Commands

Normal fixed commands:

```bash
printf '%s' "$TOKEN" | ad-build public-base auth login --token-stdin --json
ad-build public-base auth status --json
ad-build public-base pack --out /root/public-base.tar --json
ad-build public-base check --bundle /root/public-base.tar --integrity-only --json
ad-build public-base publish --branch release-AD7.0.29R2 --bundle /root/public-base.tar --push --json
ad-build public-base use --branch release-AD7.0.29R2 --json
ad-build public-base status --json
ad-build precheck
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
```

Fallback local form:

```bash
node bin/ad-build.js public-base use --branch release-AD7.0.29R2 --json
node bin/ad-build.js precheck
node bin/ad-build.js diff
node bin/ad-build.js map
node bin/ad-build.js verify <module...>
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
public_base_status: not_used | ready | missing | restored | partial | changed | mismatch | invalid | rebuild_required
full_build_status: not_required | required | passed | queued
next_command: <single next ad-build command or local fallback command>
```
