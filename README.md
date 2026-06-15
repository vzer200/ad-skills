# ad-build

`ad-build` is the AD artifact overlay CLI for the current `appd` MVP.

The supported path is no longer a small public dependency restore. A trusted full-build workspace publishes an artifact overlay, and a clean developer workspace restores that overlay before building `appd` locally.

The CLI is deterministic and never calls a model. AI agents should use the bundled `skills/ad-build/SKILL.md`, which keeps the workflow on the stable `pack` / `publish` / `restore` / `verify` commands.

## Install

```bash
npm install -g ad-build
```

Local development fallback:

```bash
node bin/ad-build.js <command>
```

## Current Scope

This release is an `appd` overlay MVP:

- It validates the artifact overlay flow for `appd`.
- It does not prove that every AD module can build from the overlay.
- It does not ask users or AI agents to manually clone artifact repositories, unpack archives, rewrite paths, fix symlinks, export build variables, or run `make` directly.

## Publisher Path

Run this path only in a trusted AD workspace where the full build has already produced the required build artifacts.

```bash
ad-build pack --branch release-AD7.0.29R2
ad-build publish --branch release-AD7.0.29R2
```

`pack` records the build artifact inventory, manifest, checksum, source root at pack time, source branch, source commit, source Git remote URL, and pack policy version. The current AD branch must match `--branch` unless `--allow-branch-mismatch` is explicitly supplied for diagnostics.

`publish` writes the overlay payload, source metadata, and latest pointer to the fixed artifact repository branch with the same name as `--branch`. Each publish force-updates that artifact branch to a single latest snapshot so clean devices do not pull old overlay history.

## Developer Path

Run this path in a clean AD source workspace:

```bash
ad-build login
ad-build restore --branch release-AD7.0.29R2
ad-build verify appd
```

`restore` fetches the published manifest, first checks the current AD source branch and commit against the published source metadata, and exits fast with a GitLab compare link when they differ. Only `--force` continues past that source mismatch. After the source check passes or is forced, `restore` validates checksums, restores only manifest inventory entries, protects local changes, relocates paths, repairs managed symlink targets, rebuilds the appd DPDK/RDMA cache with `PREFIX_SOURCE=<current AD root>` when `make` is available, and writes `$HOME/.ad-build/overlay/use-summary.json`. Run `ad-build repair dpdk` to retry that fixed repair step when `doctor` or `verify appd` reports DPDK/RDMA cache symptoms.

Only continue to `verify appd` when the restore summary reports `status: ready`.

`verify appd` injects the required AD root environment, builds `appd`, preserves logs, and reports the first real build error when the build fails.

CLI-managed overlay state, cache, logs, and default pack output are stored under `$HOME/.ad-build/` by default. The AD source workspace is used only as the restore/build target.

## Diagnostics

Use these commands only after `restore` or `verify appd` fails, or when the CLI explicitly suggests one of them:

```bash
ad-build status
ad-build doctor
ad-build repair paths
ad-build repair dpdk
```

`doctor` and `repair` are the supported way to diagnose old source-root references, dangling symlinks, and DPDK cache issues. Do not replace them with manual `git`, `tar`, `sed`, `ln`, `make`, or `export PREFIX_SOURCE` steps.

The older `ad-build overlay ...` command family remains as a compatibility alias, but new documentation and AI workflows should use the stable top-level commands above.

## Skill Delivery

The npm `postinstall` step installs or updates the bundled `ad-build` Skill:

```text
node bin/ad-build.js skill install --force
```

Normal users should not run shell-completion or legacy setup commands manually. Package installation owns Skill delivery.

## Design Notes

The packaged overlay operation guide is in:

```text
docs/artifact-overlay-operations.md
```
