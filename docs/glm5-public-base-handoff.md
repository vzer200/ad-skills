# GLM5 public-base handoff rules

Use these rules when GLM5 or another AI agent interprets `ad-build` output.

## Fixed Commands

The public-base artifact repository is fixed:

```text
https://git.sangfor.com/69765/ad-build-public-base.git
```

Do not manually clone this repository in normal use. Do not manually derive latest artifact paths. Do not put a Git personal token in a URL or command argument.

Authentication:

```bash
ad-build login
```

For CI, use `printf '%s' "$TOKEN" | ad-build login --token-stdin --json`. Do not recommend `public-base auth status` as the normal user login check.

Trusted full-build publish:

```bash
ad-build full-build -- ./compile.sh
ad-build public-base pack --out /root/public-base.tar --json
ad-build public-base check --bundle /root/public-base.tar --integrity-only --json
ad-build public-base publish --branch release-AD7.0.29R2 --bundle /root/public-base.tar --push --json
```

Developer/app verification restore:

```bash
ad-build public-base use --branch release-AD7.0.29R2 --json
ad-build diff
ad-build map
ad-build verify <module...>
```

`public-base use` is the only normal restore entrypoint. It clones or updates the fixed artifact repository under `.ad-build/cache/public-base-repo`, internally reads `<release-dir>/latest.json`, validates the bundle, restores files, runs status, runs full check, and writes `.ad-build/public-base/use-summary.json`. AI agents and users must not manually read `latest.json` or derive bundle paths.

## Required Facts

Before recommending module verification, collect:

```bash
ad-build public-base use --branch <release-dir> --json
ad-build diff
ad-build map
```

If `ad-build diff --source-only` is being used after a restore, read `.ad-build/inventory/current.json` as well.

Read these public-base outputs when available:

- `.ad-build/public-base/use-summary.json`
- `.ad-build/public-base/status.json`
- `.ad-build/public-base/check.json`
- `.ad-build/public-base/restore-conflicts.json`

## Decision Rules

If only `apps/**` changed:

- `use-summary.json.status` must be `ready`
- `use-summary.json.integrity_status` must be `valid`
- `use-summary.json.status_status` must be `restored`
- `use-summary.json.check_status` must be `matched`
- then recommend the mapped module verification, for example `ad-build verify appd`

If source/config public inputs changed:

```text
compile.sh
Makefile
app.mk
**/*.mk
include/**
proto/**
libs/** source/config files
sinfor/** source/config files
```

then public-base is stale. Do not recommend app-local verification as sufficient. Require a full build or a rebuilt public-base bundle.

Generated build side effects under `libs/**/build/**`, `libs/**/tmp/**`, `sinfor/**/build/**`, `sinfor/**/tmp/**`, `**/dist/**`, object files, archives, shared libraries, `.so.*`, `.ko`, `.Po`, `.pyc`, `.md5`, `.map`, and `*.egg-info` are excluded from the default public-base key. Do not classify these generated files as source input changes unless the repository-specific `tools/public-base.yaml` says otherwise.

The default public-base key mode is `git-head`. The key represents tracked public inputs in Git HEAD, not dirty files left by the full build. If `tools/public-base.yaml` sets `public_input_mode: worktree`, treat that as a diagnostic override and do not use it as the normal publish baseline without explicit human approval. In `worktree` mode, dirty public inputs are included in the key, so a matching check can still be `matched` while warning about dirty inputs.

If full `public-base check` reports `tracked_dirty_public_inputs_count > 0`, read `tracked_dirty_public_inputs_sample`. Restored files that still match `.ad-build/public-base/current.json` are ignored by the CLI; any reported tracked dirty public input means Git-tracked or staged public source/config inputs differ from HEAD.

If full `public-base check` reports only `generated_public_inputs_count > 0`, do not treat that as public-base failure. Generated public inputs are untracked full-build outputs such as installed headers; they do not block reuse in default `git-head` mode.

If `public-base pack` reports missing restore paths:

- do not publish the bundle
- rerun the full build or pass `--allow-partial` only for deliberate diagnostics

If `public-base publish` fails because `full_build.status` is missing or not `passed`:

- do not use `--allow-unproven` for a shared team baseline
- rerun `ad-build full-build -- <command>` in the trusted full-build workspace
- only use `--allow-unproven` for a clearly labelled diagnostic publish

If `public-base publish` fails because tracked dirty public inputs exist:

- read `tracked_dirty_public_inputs_after_full_build`
- require commit/revert or rebuild from a clean trusted full-build workspace
- do not treat `generated_public_inputs_after_full_build` as a publish blocker

If `public-base use` reports `status: not_ready`:

- read `use-summary.json`
- read `status.json` and `check.json`
- do not continue verify until the reason is understood

If `public-base use` fails because authentication is unavailable:

- the next command must be `ad-build login`
- do not suggest manual Git Username/Password input
- do not tell the user to put a token in the repository URL
- do not use `public-base auth status` as the normal recovery step

If restore reports conflicts:

- stop and report `.ad-build/public-base/restore-conflicts.json`
- do not enable forced overwrite unless the workspace is disposable or backed up

If full `check` is `mismatch`:

- inspect `tracked_dirty_public_inputs_count`, `generated_public_inputs_count`, `current_key`, and `bundle_key`
- require public-base rebuild or full build when tracked public inputs changed or keys differ

If any public-base check outputs `status: invalid`:

- do not restore
- do not continue verify
- require downloading the artifact again, or rebuilding it in a trusted full-build workspace with `ad-build public-base pack`

## What Public-Base Does Not Prove

Do not say public-base means:

- full build passed for the current change
- packaging passed
- `.ssu` or `.ssi` output is valid
- device-side behavior is correct

It only means the reusable dependency layer was restored and matches the bundle manifest/key for the current public inputs.

## Recommended Final Fields

Keep final recommendations structured:

```text
risk_level: low | medium | high
evidence: <CLI outputs, diff files, module-map output, public-base outputs, Makefiles, logs used>
required_verification: <modules and/or full build that must run>
optional_verification: <extra modules or checks that improve confidence>
public_base_status: not_used | ready | restored | missing | partial | changed | mismatch | invalid | rebuild_required
full_build_status: not_required | required | passed | queued
next_command: <single next ad-build command or local fallback command>
```
