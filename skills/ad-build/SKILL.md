---
name: ad-build
description: Use when Codex needs to decide whether AD project changes can reuse a public base build image, whether pre-change full build verification is available, inspect ad-build CLI outputs, select module verification, or explain ad-build verify/report logs. The CLI is deterministic and never calls a model; this skill teaches AI agents how to use it safely.
---

# ad-build

`ad-build` is a deterministic npm CLI. It never calls a model. Use AI judgment only to interpret its outputs together with the diff, module map, Makefiles, base image status, and real build logs.

Prefer the installed command:

```bash
ad-build ...
```

If the package is not installed, run the local entrypoint from the repository root:

```bash
node bin/ad-build.js ...
```

## Core Workflow

1. Run `ad-build image status` when the team uses public base images.
2. Recommend restoring a public base image only when `image status` reports a deterministic `image_ref` for the current public inputs and either the image is present locally or the user/CI can pull that exact image.
3. Run `ad-build precheck`.
4. Recommend skipping pre-change full build only when `precheck` reports all of:
   - `baseline_status: matched`
   - `worktree_clean: true`
   - `errors: []`
   - no blocking warnings
5. Run `ad-build diff` and `ad-build map`.
6. Read the generated diff files and mapping outputs, especially `diff-files.txt` and `module-map-result.json`.
7. Read relevant Makefiles and build config before deciding scope:
   - Makefiles in matched module directories
   - parent directory Makefiles
   - repository root Makefile
   - discoverable `include *.mk` files
   - shared build configuration referenced by those files
8. Decide risk level from CLI output, changed paths, Makefile evidence, public-base-image status, module mapping, and compile logs.
9. Select verification:
   - list required modules
   - list optional modules
   - list modules not selected this round
   - do not claim a module is definitely safe to skip unless dependency evidence supports it
10. Run `ad-build verify <module...>` for selected modules.
11. Run `ad-build report <run-id>` or inspect report outputs after verification.
12. If verification fails, read the corresponding module logs and recommend the smallest concrete next step.

## Public Base Image Workflow

Use this workflow when public/base libraries such as `libs/`, `sinfor/`, `include/`, `linux/`, or `app_bin/` are rarely changed and can be prepared in CI or a trusted AD build node.

Trusted build node or CI:

```bash
ad-build image status
ad-build full-build -- ./compile.sh
ad-build image save --push
```

Developer restore flow:

```bash
ad-build image status
ad-build image pull
ad-build image restore --delete
```

Read these outputs before recommending reuse:

- `.ad-build/base-image/status.json`
- `.ad-build/base-image/save.json`
- `.ad-build/base-image/restore.json`

`image status` computes a public key from configured public inputs and the base image identity. If a public input changes, the computed image tag changes and CI should publish a new public base image.

Do not treat public base image restore as proof that the current business-module change is correct. It only restores a reusable public build layer. Continue with `diff`, `map`, and `verify` for the actual change.

## Risk And Safety Rules

- AI decisions must be grounded in CLI output, diff details, module-map data, Makefiles, base-image config, and compile logs. Do not assume safety from path names alone.
- If required CLI output, diff files, Makefiles, module-map output, base-image status, or logs are missing, stale, contradictory, or unreadable, require broader verification or ask the developer.
- If `mapping_trusted: false`, mark the change high risk. Do not directly run verify commands from the unreviewed module map. First show the user the module, command, cwd, and env that would run.
- Treat `module-map.yaml` as an initial filter only, not the final dependency truth.
- Treat `tools/base-image.yaml` as high risk. If public inputs, artifact dirs, restore dirs, registry, or base image identity change, require public-base-image review and usually a CI rebuild.
- Real compile results override AI judgment.
- If high-risk files are touched, final status must keep `full_build_status: required` until a full build has passed or is explicitly queued with an owner or pipeline record.

High-risk changes include:

- public build configuration
- toolchain files
- package, signing, release, or install scripts
- Docker or build environment files
- public base image config
- proto files
- common headers or shared libraries
- repository-wide Makefiles or shared `*.mk` includes
- `tools/module-map.yaml` or other module-map changes

Unmapped files are not safe by default. Inspect Makefiles and shared includes, then either choose broader verification or ask the developer for ownership and build impact.

## Module Selection

- Single business-module changes with no public/shared files: prioritize that module's verification.
- Shared headers, proto, toolchain, package, signing, Docker, root Makefile, shared `*.mk`, public base image config, or public input changes: require full build or clearly justified broad module verification plus `full_build_status: required`.
- Module-map changes: treat mapping as untrusted for this run and review commands before execution.
- Binary, generated, renamed, copied, deleted, or unmapped files require extra caution because dependency impact may not be visible from the module map.

## Commands

Use the installed command first:

```bash
ad-build image status
ad-build image pull
ad-build image restore --delete
ad-build precheck
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
```

CI or trusted build-node commands:

```bash
ad-build image status
ad-build full-build -- ./compile.sh
ad-build image save --push
ad-build baseline-save --from-run latest
```

Fallback local form:

```bash
node bin/ad-build.js image status
node bin/ad-build.js image pull
node bin/ad-build.js image restore --delete
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
evidence: <CLI outputs, diff files, module-map output, base-image output, Makefiles, logs used>
required_verification: <modules and/or full build that must run>
optional_verification: <extra modules or checks that improve confidence>
public_base_image_status: not_used | reusable | restored | missing | rebuild_required
full_build_status: not_required | required | passed | queued
next_command: <single next ad-build command or local fallback command>
```
