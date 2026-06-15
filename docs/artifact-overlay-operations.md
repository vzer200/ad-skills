# ad-build Artifact Overlay Operations

This document describes the supported `appd` artifact overlay MVP.

The overlay stores build artifacts produced by a trusted full-build AD workspace. A clean AD workspace restores that overlay and then builds `appd` without manual archive, path, symlink, or build-environment repair steps.

## Scope

Supported:

- `ad-build login`
- `ad-build logout`
- `ad-build pack --branch <release>`
- `ad-build publish --branch <release>`
- `ad-build restore --branch <release>`
- `ad-build status`
- `ad-build doctor`
- `ad-build repair paths`
- `ad-build repair dpdk`
- `ad-build verify appd`
- `ad-build skill status`

Not supported in this MVP:

- claiming all AD modules are restored
- packaging or full product image verification
- manual Git/tar/sed/symlink/make replacement of the CLI flow
- legacy image, bundle, public-base, baseline, report, diff, map, module-map, or completion workflows

## Publisher Flow

Run only in a trusted AD workspace after a full build has completed.

```bash
ad-build pack --branch release-AD7.0.29R2
ad-build publish --branch release-AD7.0.29R2
```

`pack` validates appd-required artifact paths before writing an overlay. The minimum required paths are:

- `libs/rdma-core-2404mlnx51/build/include`
- `libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h`
- `apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build`
- `obj/lib64`
- `obj/bin`
- `app_bin`
- `include`

`publish` writes the latest payload, source branch, source commit, source Git remote URL, and pointer to the configured artifact repository branch matching `--branch`. Each publish keeps that artifact branch as a single latest snapshot so clean devices do not fetch old overlay payload history. The default repository is:

```text
git@git.sangfor.com:69765/ad-build-public-base.git
```

The repository name is historical; the current content is artifact overlay data, not the old public-base workflow.

CLI-managed state, cache, logs, and default pack output are stored under `$HOME/.ad-build/` by default:

- `$HOME/.ad-build/overlay/latest/`
- `$HOME/.ad-build/overlay/auth.json`
- `$HOME/.ad-build/overlay/current.json`
- `$HOME/.ad-build/overlay/use-summary.json`
- `$HOME/.ad-build/overlay/runs/`
- `$HOME/.ad-build/cache/artifact-overlay-repo/`

The AD repository path is only the restore and build target.

## Developer Flow

Run in a clean AD source workspace.

```bash
ad-build login
ad-build restore --branch release-AD7.0.29R2
ad-build verify appd
```

`login` configures SSH access. It does not configure HTTPS token credentials. The SSH probe forces the selected private key with `-i <key> -o IdentitiesOnly=yes`, so adding the exact printed public key to GitLab SSH Keys is required.

`restore` first verifies the current AD Git workspace, then reads the lightweight latest pointer and manifest before materializing the large overlay payload. If the source differs, it prints the overlay/current `branch` and `commit` values and exits without restoring; `--force` is required to continue. After that source check passes or is forced, `restore` validates inventory, artifact checksum, archive members, and restore conflicts before writing managed files. It also relocates old source-root paths and managed symlink targets, then rebuilds the appd DPDK/RDMA cache with `PREFIX_SOURCE=<current AD root>` when `make` is available. Use `ad-build repair dpdk` to retry that fixed repair step when `doctor` or `verify appd` reports DPDK/RDMA cache symptoms.

Only run `ad-build verify appd` after `ad-build restore` reports `status: ready`.

## Diagnostics

Use diagnostics only when a supported command fails or suggests one of them.

```bash
ad-build status
ad-build doctor
ad-build repair paths
ad-build repair dpdk
```

`verify appd` captures the top-level build log and child logs such as DPDK, meson, ninja, and `log3party.log` outputs when available. Diagnose from `first_real_error`, not from a top-level `Error 2` alone.

## Agent Rules

AI agents must not execute legacy commands or replace the CLI with manual shell steps. If an old document or command output suggests a legacy flow, translate the intent to the stable command whitelist or stop and report that the requested flow is unsupported. `ad-build overlay ...` remains a compatibility alias, but new workflows should use `pack`, `publish`, `restore`, `status`, `doctor`, `repair`, and `verify`.
