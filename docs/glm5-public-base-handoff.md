# GLM5 public-base handoff rules

Use these rules when GLM5 or another AI agent interprets `ad-build` output.

## Required facts

Before recommending module verification, collect:

```bash
ad-build public-base status
ad-build public-base check --bundle <public-base.tar>
ad-build diff
ad-build map
```

If `ad-build diff --source-only` is being used after a restore, read `.ad-build/inventory/current.json` as well.

## Decision rules

If only `apps/**` changed:

- `public-base status` must be `restored`
- `public-base check` must be `matched`
- then recommend the mapped module verification, for example `ad-build verify appd`

If any public input changed:

```text
compile.sh
Makefile
app.mk
**/*.mk
libs/**
include/**
proto/**
sinfor/**
```

then public-base is stale. Do not recommend app-local verification as sufficient. Require a full build or a rebuilt public-base bundle.

If `public-base pack` reports missing restore paths:

- do not publish the bundle
- rerun the full build or pass `--allow-partial` only for deliberate diagnostics

If `status` is `missing`:

- next command should be `ad-build public-base restore --bundle <public-base.tar>`
- if restore reports conflicts, stop and report them; do not add `--force` unless the workspace is disposable or backed up

If `status` is `partial` or `changed`:

- do not trust local verification
- restore again from the intended bundle, or rebuild public-base if public inputs changed

If `check` is `mismatch`:

- public inputs differ from the bundle
- require public-base rebuild or full build

If `ad-build public-base check` outputs `status: invalid`:

- do not restore
- do not continue verify
- require downloading `public-base.tar` again, or rebuilding it in a trusted full-build workspace with `ad-build public-base pack`

## What public-base does not prove

Do not say public-base means:

- full build passed
- packaging passed
- `.ssu` or `.ssi` output is valid
- device-side behavior is correct

It only means the reusable dependency layer was restored and matches the bundle manifest.

## Recommended final fields

Keep final recommendations structured:

```text
risk_level: low | medium | high
evidence: <CLI outputs, diff files, module-map output, public-base outputs, Makefiles, logs used>
required_verification: <modules and/or full build that must run>
optional_verification: <extra modules or checks that improve confidence>
public_base_status: not_used | restored | missing | partial | changed | mismatch | invalid | rebuild_required
full_build_status: not_required | required | passed | queued
next_command: <single next ad-build command or local fallback command>
```
