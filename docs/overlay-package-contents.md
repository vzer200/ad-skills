# Overlay Package Contents

This document describes the big AD overlay package produced by:

```bash
ad-build pack --branch <AD-branch>
```

It is different from the npm/zip CLI delivery package. The CLI package contains only JavaScript runtime files. The AD overlay package contains generated build artifacts and build state from a trusted full-build AD workspace.

## Archive Shape

The compressed archive is:

```text
ad-artifact-overlay.tar.gz
```

Archive members:

```text
manifest.json
inventory.json
files/
```

`manifest.json` identifies the release, source Git state, artifact sha256, inventory sha256, pack rules version, and payload metadata.

`inventory.json` records every managed file or symlink. Restore only writes entries listed in this inventory.

`files/` contains the actual file and symlink payloads under their AD-relative paths.

Important nuance: the `manifest.json` inside the tar is written before the tar's final sha256 and size are known. The canonical manifest for restore and publish decisions is the unpacked `manifest.json` beside the tar in `$HOME/.ad-build/overlay/latest/` or in the published artifact repository.

## Published Repository Shape

`publish` stores the overlay in the artifact repository branch with the same name as the AD branch:

```text
<release>/
  latest-artifact-overlay.json
  artifact-overlay/
    sha256-<first-12-sha256-chars>/
      ad-artifact-overlay.tar.gz
      ad-artifact-overlay.tar.gz.sha256
      manifest.json
      inventory.json
      README.md
```

Only the newest `artifact-overlay/sha256-*` directory is kept for a release branch. The branch is committed as one latest snapshot so clean devices do not pull old multi-GB overlay history.

## Collection Roots

`collectScanStarts()` starts from these roots when they exist:

```text
obj/
app_bin/
include/
cfg/
shell/
ui/
ui_new/
linux/
libs/
sinfor/
access_layer/
apps/
apps2/
gtest/
test/
```

It also considers these top-level files when they exist:

```text
KERNEL_VER
OS_PLATFORM.file
compile.sh
version_change.sh
php_encode_x86_64
Makefile*
app*.mk
```

These are scan starts, not unconditional includes. A top-level file still enters the inventory only when it satisfies `shouldIncludePackEntry()`, for example because it is build metadata, an artifact-like file, or a dirty tracked build side effect. A clean tracked top-level source-only file is not packed merely because it appears in this list.

## Exclusions

The pack scanner excludes:

```text
.git/
.ad-build/cache/
mkpacket/
ssipacket/
ad_packet/
node_modules/
```

Root-level `.git`, `mkpacket`, `ssipacket`, and `ad_packet` are also treated as excluded roots.

`.ad-build/` is not currently a scan root, so normal CLI state is not collected. Only `.ad-build/cache/` is explicitly listed in `EXCLUDED_PREFIXES`; if future work expands scanning to arbitrary roots, `.ad-build/` must be excluded explicitly before that change ships.

The overlay is not a full AD source archive and should not include Git history, CLI cache, package output history, or large image/package directories that are unrelated to restoring the `appd` build path.

## Inclusion Rules

`shouldIncludePackEntry()` and the pack symlink policy decide whether a scanned path becomes an inventory entry:

- AD-internal symlinks are included.
- Internal AD symlink targets are included when the symlink target exists inside the publishing workspace. Absolute targets under `source_root_at_pack_time`, such as `/root/AD/...`, are mapped back to AD-relative inventory paths before packaging.
- Known external symlinks are not written to inventory. They are either recorded as `external_dependencies` in `manifest.json`, or skipped as non-appd-MVP deployment/test/aarch64 shell links.
- Unknown external symlinks inside pack scope fail once after scanning with a summary of every violating `path`, `link_target`, and `resolved_path`. Excluded directories such as `mkpacket/`, `ssipacket/`, and `ad_packet/` are outside this decision because they are not scanned.
- Everything under `obj/` and `app_bin/` is included.
- Under `include/`, headers and build metadata are included.
- Header targets under `libs/rdma-core-2404mlnx51/` are included. This preserves the hand-tested 3.1G overlay behavior where `build/include/infiniband/*.h` symlinks need provider and libibverbs header targets such as `libs/rdma-core-2404mlnx51/providers/mlx5/mlx5dv.h`.
- Build output directories are included, such as `build`, `tmp_install`, `meson-private`, `meson-logs`, `CMakeFiles`, `.deps`, and `.libs`.
- Build metadata is included, such as `CMakeCache.txt`, `build.ninja`, `compile_commands.json`, `install_manifest.txt`, `meson-info.json`, `meson-log.txt`, `.ninja_log`, and files ending in `.pc`, `.cmake`, `.ninja`, `.deps`, `.mk`, `.mak`, `.d`, `.cmd`, or `.json`.
- Artifact-like files are included, such as `.o`, `.lo`, `.a`, `.so`, `.so.*`, `.ko`, `.mod`, `.mod.c`, `.symvers`, `.order`, `.map`, `.bin`, `.elf`, `.img`, and `.dat`.
- Tracked Git changes are included if they are not obvious source-only files.
- Untracked files are included only when they look like artifacts or build metadata.

Obvious source-only extensions are not treated as build side effects by default:

```text
.c .cc .cpp .cxx .py .pl .pm .java .go .rs .ts .tsx .js .jsx .vue .md .rst
```

## Entry Classification

Inventory entry types:

- `generated_artifact`: `obj/`, `app_bin/`, and artifact extensions.
- `generated_header`: header-like entries.
- `build_metadata`: build metadata or build output paths.
- `tracked_build_side_effect`: tracked Git changes that are not source-only.
- `unknown_artifact`: fallback for included entries.
- `symlink`: symlink entries.

Each file entry records path, sha256, size, mode, git status, and entry type. Each symlink entry records path, mode, target, git status, and `relocatable: true`.

`manifest.external_dependencies` records required system paths discovered from allowed external symlinks. The current appd MVP policy records:

```text
include/lua -> /usr/local/include/luajit-2.1/
```

This dependency is checked by `restore`/`doctor`, but the external symlink itself is not restored from the overlay.

## Appd Required Paths

`validatePackReadiness()` rejects a package that cannot support the current appd MVP. These paths must exist and be represented by entries:

```text
libs/rdma-core-2404mlnx51/build/include
libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h
apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build
obj/lib64
obj/bin
app_bin
include
```

If these are missing, `pack` fails instead of publishing a misleading overlay. When a required path is an internal symlink, the symlink target must also be present in inventory; otherwise `pack` fails before a clean device spends time downloading and restoring an unusable package.

## Restore Safety

Restore validates before writing:

- Current AD Git workspace readability before artifact repository fetch or checkout.
- Lightweight latest/manifest source metadata before full artifact checkout, sha256, or extraction.
- AD source branch/commit alignment using overlay/current `branch` and `commit`; GitLab compare URLs are not required for the decision.
- Inventory digest from manifest.
- Overlay archive sha256.
- Archive members are inside the allowed inventory-derived path set.
- No unsafe absolute paths, Windows absolute paths, or `..` segments.
- No file nested under an archive symlink prefix.
- No non-directory archive prefix.
- No unintended overwrite of local changes unless `--force` is explicit.

Restore writes only inventory entries and then relocates managed text files and symlink targets from `source_root_at_pack_time` to the current AD root. Inventory symlink targets must resolve inside the current AD root after this relocation; external absolute targets and targets that escape the repo boundary are rejected before extraction. Manifest `external_dependencies` are checked as system prerequisites and are never restored as overlay symlinks.

The archive safety model validates restore destination paths, tar member structure, and inventory symlink target boundaries. The artifact repository and published manifest are still trusted publisher inputs, but they must stay within the declared AD-relative overlay boundary.
