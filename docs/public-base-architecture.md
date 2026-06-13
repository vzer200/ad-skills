# ad-build public-base architecture

## Purpose

`ad-build public-base` is the primary lightweight dependency-reuse workflow for AD app development.

It does not snapshot a whole compiled workspace. It stores only the public dependency layer needed by local app/module verification:

- `obj/lib64/`
- `include/`
- `obj/bin/`
- `libs/rdma-core-2404mlnx51/build/include/`
- `KERNEL_VER`
- `OS_PLATFORM.file`

The full compiled-state bundle command remains available for diagnostics, but it is not the recommended AD workflow because a full build tree can contain very large package outputs and generated directories.

## Why Public-Base Exists

The normal AD loop is:

```text
checkout branch -> edit code -> compile if needed -> replace on device -> test -> edit again
```

For C/C++ app/module work, a new workspace usually needs common libraries, generated headers, tool outputs, and public dependency headers before app-local verification can run. Rebuilding everything only to get those shared dependencies is slow and produces large unrelated artifacts.

`public-base` keeps that common layer as a validated tar bundle. Developers and CI can restore it into a clean checkout, then run `ad-build map` and `ad-build verify <module>` for the actual app change.

## Fixed Artifact Repository

The production artifact repository is fixed:

```text
https://git.sangfor.com/69765/ad-build-public-base.git
```

Normal users should not manually clone it and should not manually derive latest artifact paths. The CLI manages a cache at:

```text
.ad-build/cache/public-base-repo/
```

The only normal commands are:

```bash
ad-build public-base publish --branch <release-dir> --bundle <public-base.tar> --push --json
ad-build public-base use --branch <release-dir> --json
```

The shipped CLI always uses the fixed repository URL. Runtime environment variables must not override it. Tests may inject a local repository only through internal module options, not through normal user-facing CLI environment variables.

## Authentication

Tokens are stored through Git's credential helper. Do not put credentials in repository URLs or command arguments.

Normal setup:

```bash
ad-build login
```

Scripted setup:

```bash
printf '%s' "$TOKEN" | ad-build login --token-stdin --json
```

Reset:

```bash
ad-build logout
```

The lower-level `ad-build public-base auth ...` commands remain available for CI compatibility and diagnostics, but normal user documentation should prefer `ad-build login` and `ad-build logout`.

## Bundle Contents

Default included restore paths:

```text
obj/lib64/
include/
obj/bin/
libs/rdma-core-2404mlnx51/build/include/
KERNEL_VER
OS_PLATFORM.file
```

Default excluded package and transient paths:

```text
apps/
mkpacket/
ssipacket/
ad_packet/
gcov_result/
gtest_result/
.pytest_cache/
**/build/** as public input only
**/tmp/** as public input only
**/.deps/**
**/.libs/**
*.o
*.lo
*.so
*.a
*.Po
*.pyc
*.pyo
*.md5
*.map
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

Important distinction:

- `restore_dirs` and `restore_files` decide what goes into `public-base.tar`.
- `public_inputs` and `public_input_excludes` decide what contributes to the public-base key.
- Excluding generated files from `public_inputs` does not prevent explicitly configured restore paths from being packaged.
- `public_input_mode` defaults to `git-head`, so the key is based on tracked public inputs in Git HEAD instead of dirty full-build worktree files.

## Public-Base Key

The bundle is keyed by public inputs, not by branch name alone.

Default key inputs:

```text
compile.sh
Makefile
app.mk
**/*.mk
include/**
proto/**
libs/**
sinfor/**
```

The broad `libs/**` and `sinfor/**` inputs intentionally catch repository-specific build drivers such as `configure`, `CMakeLists.txt`, `.S`, `.in`, shell scripts, generated-source templates, and other dependency-layer inputs that are easy to miss with an extension whitelist.

Default key mode is `git-head`:

```text
public_input_mode: git-head
```

In this mode the key payload records public input paths and HEAD blob ids. Untracked build outputs and tracked files modified by the full-build process do not change the key. The diagnostic `worktree` mode is still available in `tools/public-base.yaml`, but it should not be used for team public-base publishing unless the repository has a specific reason.

In `worktree` mode, dirty public inputs are part of the key by design. Full `check` may warn about them, but it does not mark a matching worktree-mode bundle as `mismatch` solely because those dirty inputs exist.

Default public input excludes then remove common generated side effects:

```text
**/build/**
**/tmp/**
**/.deps/**
**/.libs/**
**/dist/**
**/*.o
**/*.lo
**/*.so
**/*.so.*
**/*.ko
**/*.a
**/*.egg-info/**
**/*.Po
**/*.pyc
**/*.pyo
**/*.md5
**/*.map
```

The key output includes diagnostics to make bad defaults visible:

```json
{
  "status": "computed",
  "public_base_key_short": "e27e3a5f30e3",
  "input_files_count": 3254,
  "top_level_counts": {
    "include": 1229,
    "libs": 1494,
    "sinfor": 512
  },
  "extension_counts": {
    ".h": 1956,
    ".c": 1875
  }
}
```

If `libs` or `sinfor` counts explode after a build because generated outputs are being keyed, fix `tools/public-base.yaml` before trusting the key.

Full `check` splits dirty public inputs into tracked source/config changes and untracked generated outputs:

```json
{
  "status": "mismatch",
  "tracked_dirty_public_inputs_count": 1,
  "tracked_dirty_public_inputs_sample": ["libs/input.c"],
  "generated_public_inputs_count": 15032,
  "generated_public_inputs_sample": ["include/adconf/ad_common.pb.h"],
  "dirty_public_inputs_count": 1,
  "dirty_public_inputs_sample": ["libs/input.c"]
}
```

`tracked_dirty_public_inputs_*` means Git-tracked or staged public source/config inputs differ from HEAD. In default `git-head` mode this blocks `matched` check status and formal publish until the inputs are committed or reverted.

`generated_public_inputs_*` means untracked files match public input paths, usually because the full build installed headers needed by app-local verification. These files can enter `public-base.tar`, but they do not participate in the Git HEAD key and do not block reuse or publish.

The legacy `dirty_public_inputs_*` fields are compatibility aliases for tracked dirty inputs. Restored files that still match `.ad-build/public-base/current.json` are not counted as dirty; if they are edited after restore, they are counted again.

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

Rules:

- `apps/**` changes can reuse an existing public-base when `public-base use` reports `status: ready`.
- Source/config changes in `libs/`, `sinfor/`, `include/`, `proto/`, root Makefile, shared `*.mk`, `app.mk`, or `compile.sh` invalidate the public-base and require a rebuild.
- Generated outputs under default exclude patterns should not invalidate public-base.
- `public-base` restore is not proof that the current code passes a full build. It only proves the dependency layer was restored.

## Commands

Trusted full-build workspace:

```bash
ad-build login
ad-build full-build -- ./compile.sh
ad-build public-base pack --out /root/public-base.tar --json
ad-build public-base check --bundle /root/public-base.tar --integrity-only --json
ad-build public-base publish --branch release-AD7.0.29R2 --bundle /root/public-base.tar --push --json
```

Developer or app verification workspace:

```bash
ad-build login
ad-build public-base use --branch release-AD7.0.29R2 --json
ad-build map
ad-build verify <module>
```

`public-base use` runs the full fixed sequence:

1. Clone or update `.ad-build/cache/public-base-repo` from the fixed repository.
2. Internally read `<release-dir>/latest.json`.
3. Validate bundle integrity with `check --integrity-only`.
4. Restore the bundle.
5. Run `public-base status`.
6. Run full `public-base check`.
7. Write `.ad-build/public-base/use-summary.json`.

`pack` fails by default if any required restore path is missing. Use `--allow-partial` only for deliberate diagnostics.

`publish` requires the bundle manifest to come from a passed `ad-build full-build` record and to have no tracked dirty public inputs. If `.ad-build/full-build/latest/full-build-result.json` is missing or not `passed`, or if `tracked_dirty_public_inputs_count > 0`, publish fails by default. Generated public inputs do not block publish. `--allow-unproven` is only for diagnostics and must not be treated as a trusted team baseline.

The low-level restore stage refuses to overwrite locally changed files in the normal workflow. It may overwrite git-clean tracked files when the clean checkout version differs from the trusted full-build bundle, because this is how generated public-base outputs such as `OS_PLATFORM.file` are restored.

If `check` outputs `status: invalid`, do not restore and do not continue verify. Download the artifact again, or rebuild it in a trusted full-build workspace with `ad-build public-base pack`.

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

Publish writes to the fixed artifact repository:

```text
release-AD7.0.29R2/
  latest.json
  sha256-<public_base_key_12>/
    public-base.tar
    manifest.json
    inventory.json
    public-base.tar.sha256
    publish-summary.json
```

Use/restore writes:

```text
.ad-build/public-base/use-summary.json
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

## JSON Status Contract

Important statuses:

```text
login/auth login: authenticated
auth status: authenticated | unauthenticated
pack: packed
check --integrity-only: valid | invalid
full check: matched | mismatch | invalid
restore/status: restored | partial | changed | missing
use: ready | not_ready | invalid
publish --push: published | no_changes
```

Exit code conventions:

```text
0: success / ready / valid / matched
2: usage error
3: missing local file/path
4: authentication unavailable
5: invalid artifact or restore conflict
6: mismatch / not_ready / missing status
```

## Reliability Guarantees

`restore` validates:

- archive entries stay under `manifest.json`, `inventory.json`, and `files/`
- archive entries are regular files or directories only
- manifest kind is `public-base-bundle`
- every file has a `sha256:<hex>` digest
- every bundled file exists before restore
- bundled file content matches manifest sha256 before restore
- destination parents are not symlinks
- existing locally changed files are not overwritten in the normal workflow

`status` verifies restored files against `.ad-build/public-base/current.json`.

`check` validates the archive payload, inventory consistency, and bundle sha256 sidecar when present. Full check also compares the current public input key with the bundle key.

All file hashing uses streaming reads, so large files do not hit Node's single-buffer 2 GiB limit.
