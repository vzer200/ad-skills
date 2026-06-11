---
name: ad-build
description: Use when Codex needs to decide whether AD project changes need pre-change full build verification, inspect ad-build CLI outputs, select module verification, or explain ad-build verify/report logs. The CLI is deterministic and never calls a model; this skill teaches AI agents how to use it safely.
---

# ad-build

`ad-build` is a deterministic npm CLI. It never calls a model. Use AI judgment only to interpret its outputs together with the diff, module map, Makefiles, and real build logs.

Prefer the installed command:

```bash
ad-build ...
```

If the package is not installed, run the local entrypoint from the repository root:

```bash
node bin/ad-build.js ...
```

## Core Workflow

1. Run `ad-build precheck`.
2. Recommend skipping pre-change full build only when `precheck` reports all of:
   - `baseline_status: matched`
   - `worktree_clean: true`
   - `errors: []`
   - no blocking warnings
3. Run `ad-build diff` and `ad-build map`.
4. Read the generated diff files and mapping outputs, especially `diff-files.txt` and `module-map-result.json`.
5. Read relevant Makefiles and build config before deciding scope:
   - Makefiles in matched module directories
   - parent directory Makefiles
   - repository root Makefile
   - discoverable `include *.mk` files
   - shared build configuration referenced by those files
6. Decide risk level from CLI output, changed paths, Makefile evidence, and module mapping.
7. Select verification:
   - list required modules
   - list optional modules
   - list modules not selected this round
   - do not claim a module is definitely safe to skip unless dependency evidence supports it
8. Run `ad-build verify <module...>` for selected modules.
9. Run `ad-build report <run-id>` or inspect report outputs after verification.
10. If verification fails, read the corresponding module logs and recommend the smallest concrete next step.

## Risk And Safety Rules

- AI decisions must be grounded in CLI output, diff details, Makefiles, module-map data, and compile logs. Do not assume safety from path names alone.
- If required CLI output, diff files, Makefiles, module-map output, or logs are missing, stale, contradictory, or unreadable, require broader verification or ask the developer.
- If `mapping_trusted: false`, mark the change high risk. Do not directly run verify commands from the unreviewed module map. First show the user the module, command, cwd, and env that would run.
- Treat `module-map.yaml` as an initial filter only, not the final dependency truth.
- Real compile results override AI judgment.
- If high-risk files are touched, final status must keep `full_build_status: required` until a full build has passed or is explicitly queued with an owner or pipeline record.

High-risk changes include:

- public build configuration
- toolchain files
- package, signing, release, or install scripts
- Docker or build environment files
- proto files
- common headers or shared libraries
- repository-wide Makefiles or shared `*.mk` includes
- `tools/module-map.yaml` or other module-map changes

Unmapped files are not safe by default. Inspect Makefiles and shared includes, then either choose broader verification or ask the developer for ownership and build impact.

## Module Selection

- Single business-module changes with no public/shared files: prioritize that module's verification.
- Shared headers, proto, toolchain, package, signing, Docker, root Makefile, or shared `*.mk` changes: require full build or clearly justified broad module verification plus `full_build_status: required`.
- Module-map changes: treat mapping as untrusted for this run and review commands before execution.
- Binary, generated, renamed, copied, deleted, or unmapped files require extra caution because dependency impact may not be visible from the module map.

## Commands

Use the installed command first:

```bash
ad-build precheck
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
```

Fallback local form:

```bash
node bin/ad-build.js precheck
node bin/ad-build.js diff
node bin/ad-build.js map
node bin/ad-build.js modules
node bin/ad-build.js verify <module...>
node bin/ad-build.js report <run-id>
```

## Final Recommendation Format

Always end with these exact structured fields:

```text
risk_level: low | medium | high
evidence: <CLI outputs, diff files, module-map output, Makefiles, logs used>
required_verification: <modules and/or full build that must run>
optional_verification: <extra modules or checks that improve confidence>
full_build_status: not_required | required | passed | queued
next_command: <single next ad-build command or local fallback command>
```
