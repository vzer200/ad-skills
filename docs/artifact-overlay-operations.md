# ad-build Artifact Overlay Operations

This document describes the supported `appd` artifact overlay MVP.

The overlay stores build artifacts produced by a trusted full-build AD workspace. A clean AD workspace restores that overlay and then builds `appd` without manual archive, path, symlink, or build-environment repair steps.

## Scope

Supported:

- `ad-build login`
- `ad-build logout`
- `ad-build overlay pack --branch <release>`
- `ad-build overlay publish --branch <release>`
- `ad-build overlay use --branch <release>`
- `ad-build overlay status`
- `ad-build overlay doctor`
- `ad-build overlay repair paths`
- `ad-build overlay repair dpdk`
- `ad-build overlay build appd`
- `ad-build skill status`

Not supported in this MVP:

- claiming all AD modules are restored
- packaging or full product image verification
- manual Git/tar/sed/symlink/make replacement of the CLI flow
- legacy image, bundle, public-base, baseline, verify, report, diff, map, module-map, or completion workflows

## Publisher Flow

Run only in a trusted AD workspace after a full build has completed.

```bash
ad-build overlay pack --branch release-AD7.0.29R2
ad-build overlay publish --branch release-AD7.0.29R2
```

`pack` validates appd-required artifact paths before writing an overlay. The minimum required paths are:

- `libs/rdma-core-2404mlnx51/build/include`
- `libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h`
- `apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build`
- `obj/lib64`
- `obj/bin`
- `app_bin`
- `include`

`publish` writes an immutable payload and latest pointer to the configured artifact repository. The default repository is:

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
ad-build overlay use --branch release-AD7.0.29R2
ad-build overlay build appd
```

`login` configures SSH access. It does not configure HTTPS token credentials. The SSH probe forces the selected private key with `-i <key> -o IdentitiesOnly=yes`, so adding the exact printed public key to GitLab SSH Keys is required.

`use` validates the latest pointer, manifest, inventory, artifact checksum, archive members, and restore conflicts before writing managed files. It also relocates old source-root paths and managed symlink targets.

Only run `overlay build appd` after `overlay use` reports `status: ready`.

## Diagnostics

Use diagnostics only when a supported command fails or suggests one of them.

```bash
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
```

`overlay build appd` captures the top-level build log and child logs such as DPDK, meson, ninja, and `log3party.log` outputs when available. Diagnose from `first_real_error`, not from a top-level `Error 2` alone.

## Agent Rules

AI agents must not execute legacy commands or replace the CLI with manual shell steps. If an old document or command output suggests a legacy flow, translate the intent to the overlay command whitelist or stop and report that the requested flow is unsupported.
