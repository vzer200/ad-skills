# ad-build

`ad-build` is the AD artifact overlay CLI for the current `appd` MVP.

The supported path is no longer a small public dependency restore. A trusted full-build workspace publishes an artifact overlay, and a clean developer workspace restores that overlay before building `appd` locally.

The CLI is deterministic and never calls a model. AI agents should use the bundled `skills/ad-build/SKILL.md`, which keeps the workflow on the overlay commands only.

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
ad-build overlay pack --branch release-AD7.0.29R2
ad-build overlay publish --branch release-AD7.0.29R2
```

`overlay pack` records the build artifact inventory, manifest, checksum, source root at pack time, branch, commit, and pack policy version.

`overlay publish` writes the immutable overlay payload and latest pointer to the fixed artifact repository through the CLI-managed flow.

## Developer Path

Run this path in a clean AD source workspace:

```bash
ad-build login
ad-build overlay use --branch release-AD7.0.29R2
ad-build overlay build appd
```

`overlay use` fetches the published overlay through the managed artifact repository, validates checksums, restores only manifest inventory entries, protects local changes, relocates paths, repairs managed symlink targets, and writes `$HOME/.ad-build/overlay/use-summary.json`.

Only continue to `overlay build appd` when the overlay use summary reports `status: ready`.

`overlay build appd` injects the required AD root environment, builds `appd`, preserves logs, and reports the first real build error when the build fails.

CLI-managed overlay state, cache, logs, and default pack output are stored under `$HOME/.ad-build/` by default. The AD source workspace is used only as the restore/build target.

## Diagnostics

Use these commands only after `overlay use` or `overlay build appd` fails, or when the CLI explicitly suggests one of them:

```bash
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
```

`overlay doctor` and `overlay repair` are the supported way to diagnose old source-root references, dangling symlinks, and DPDK cache issues. Do not replace them with manual `git`, `tar`, `sed`, `ln`, `make`, or `export PREFIX_SOURCE` steps.

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
