# ad-build public-base architecture

## Purpose

`ad-build public-base` is the primary lightweight dependency-reuse workflow for AD app development.

It does not snapshot a whole compiled workspace. It stores only the public dependency layer needed by local app/module verification:

- `obj/lib64/`
- `include/`
- `obj/bin/`
- `KERNEL_VER`
- `OS_PLATFORM.file`

The full compiled-state bundle command remains available for diagnostics, but it is not the recommended AD workflow because a full build tree can contain very large package outputs and generated directories.

## Why public-base exists

The normal AD loop is:

```text
checkout branch -> edit code -> compile if needed -> replace on device -> test -> edit again
```

For C/C++ app/module work, a new workspace usually needs common libraries, headers, and generated build tools before app-local verification can run. Rebuilding everything only to get those shared dependencies is slow and produces large unrelated artifacts.

`public-base` keeps that common layer as a validated tar bundle. Developers and CI can restore it into a clean checkout, then run `ad-build map` and `ad-build verify <module>` for the actual app change.

## Bundle contents

Default included restore paths:

```text
obj/lib64/
include/
obj/bin/
KERNEL_VER
OS_PLATFORM.file
```

Default excluded paths:

```text
apps/
libs/ intermediate outputs
linux/ad_kernel/
access_layer/build/
access_layer/dist/
mkpacket/
ssipacket/
ad_packet/
gcov_result/
gtest_result/
.pytest_cache/
*.ssu
*.ssi
*.tar
*.tar.gz
*.tar.zst
*.img
*.iso
*.log
```

The default configuration is available in `templates/public-base.yaml`. Copy it to `tools/public-base.yaml` only when a repository needs to override the defaults.

## Public-base key

The bundle is keyed by public inputs, not by branch name alone.

Default key inputs:

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

The key also includes selected toolchain environment variables by default:

```text
CC
CXX
AR
LD
CFLAGS
CXXFLAGS
LDFLAGS
AD_BUILD_TOOLCHAIN
AD_BUILD_TARGET
AD_BUILD_PLATFORM
AD_BUILD_PUBLIC_BASE_TOOLCHAIN
```

Default non-key inputs:

```text
apps/**
mkpacket/**
ssipacket/**
ad_packet/**
test output
coverage output
release packages
```

Rules:

- `apps/**` changes can reuse an existing public-base when `check` is matched.
- `libs/**`, `include/**`, `proto/**`, `sinfor/**`, root Makefile, `app.mk`, `compile.sh`, or shared `*.mk` changes invalidate the public-base and require a rebuild.
- `public-base` restore is not proof that the current code passes a full build. It only proves the dependency layer was restored.

## Commands

Trusted full-build workspace:

```bash
ad-build full-build -- ./compile.sh
ad-build public-base key
ad-build public-base pack --out public-base.tar
ad-build public-base check --bundle public-base.tar
```

Developer or app verification workspace:

```bash
ad-build public-base restore --bundle public-base.tar
ad-build public-base status
ad-build public-base check --bundle public-base.tar
ad-build map
ad-build verify <module>
```

`pack` fails by default if any required restore path is missing. Use `--allow-partial` only for deliberate diagnostics.

`restore` refuses to overwrite existing files whose current sha256 differs from the bundle. Use `--force` only when the workspace is known to be disposable or already backed up.

## Outputs

Pack writes:

```text
public-base.tar
public-base.manifest.json
public-base.inventory.json
public-base.tar.sha256
.ad-build/public-base/latest/manifest.json
.ad-build/public-base/latest/inventory.json
.ad-build/public-base/latest/pack-summary.json
.ad-build/public-base/latest/latest.json
```

Restore writes:

```text
.ad-build/public-base/current.json
.ad-build/inventory/current.json
.ad-build/public-base/restore/<run-id>/restore-summary.json
.ad-build/public-base/restore/<run-id>/restore.log
```

Status/check write:

```text
.ad-build/public-base/status.json
.ad-build/public-base/status.md
.ad-build/public-base/check.json
.ad-build/public-base/check.md
```

## Separate artifact repository

Do not commit `public-base.tar` into the AD source repository.

Recommended storage:

```text
ad-build-public-base/
  release-AD7.0.29R2/
    latest.json
    sha256-<public_base_key_12>/
      public-base.tar
      manifest.json
      inventory.json
      public-base.tar.sha256
```

The AD source repository should contain the CLI, skill, config, and scripts. The public-base repository or artifact system should contain generated bundles.

## Reliability guarantees

`restore` validates:

- archive entries stay under `manifest.json`, `inventory.json`, and `files/`
- archive entries are regular files or directories only
- manifest kind is `public-base-bundle`
- every file has a `sha256:<hex>` digest
- every bundled file exists before restore
- bundled file content matches manifest sha256 before restore
- destination parents are not symlinks
- existing changed files are not overwritten unless `--force` is supplied

`status` verifies restored files against `.ad-build/public-base/current.json`.

`check` validates the archive payload, inventory consistency, and bundle sha256 sidecar when present, then compares the current public input key with the bundle key.

All file hashing uses streaming reads, so large files do not hit Node's single-buffer 2 GiB limit.
