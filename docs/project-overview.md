# ad-build Project Overview

## What This Project Solves

`ad-build` is a deterministic npm CLI for the AD artifact overlay `appd` MVP.

The original pain point was that a clean AD source workspace could not reliably compile `appd` unless a developer manually copied full-build artifacts, restored generated build state, rewrote absolute paths, fixed symlinks, exported `PREFIX_SOURCE`, and rebuilt DPDK/RDMA caches. Those manual steps were repeatable enough to automate, but brittle enough that AI agents and humans kept missing details.

The current design turns that manual success path into a small public command set:

```bash
ad-build login
ad-build pack --branch <AD-branch>
ad-build publish --branch <AD-branch>
ad-build restore --branch <AD-branch>
ad-build verify appd
```

Diagnostics and retries stay inside the same workflow:

```bash
ad-build status
ad-build doctor
ad-build repair paths
ad-build repair dpdk
```

## Supported Roles

Publisher:

- Runs in a trusted AD workspace where a full build has already completed.
- Executes `pack` to create an artifact overlay from generated build outputs.
- Executes `publish` to update the artifact repository branch matching the AD branch.

Developer or clean device:

- Runs in a clean AD source workspace.
- Executes `login`, then `restore --branch <AD-branch>`.
- Runs `verify appd` only after restore reports `status: ready`.

Diagnostic operator:

- Uses `status`, `doctor`, `repair paths`, and `repair dpdk` only after a supported command fails or suggests one of them.

## Current Scope

Supported:

- `appd` overlay MVP.
- SSH-based artifact repository access.
- Overlay branch/source commit preflight before restore hashes or extracts the payload.
- Manifest and inventory based restore of generated files and symlinks.
- Path relocation from the publisher AD root to the current AD root.
- DPDK/RDMA cache rebuild with `PREFIX_SOURCE=<current AD root>` when `make` is available.
- Build verification for `appd` with child log collection and first-real-error extraction.

Not proven:

- All AD modules.
- Product image packaging.
- Full environment restoration.
- Old public-base, bundle, image, baseline, diff, map, report, or module-map flows.
- Root-level historical files such as `README-BUNDLE-USAGE.md` if they appear in a local workspace; those describe a deprecated compiled-state bundle idea and are not part of the current public workflow.

## Design Principles

- The CLI is deterministic and never calls a model.
- Source branch and commit alignment is checked before expensive artifact work.
- The artifact repository branch is kept as one latest snapshot to avoid repeatedly pulling old multi-GB payload history.
- `$HOME/.ad-build/` owns CLI state, cache, logs, and default pack output.
- The AD source repository is only the restore and build target.
- JSON output must remain parseable; progress goes to stderr.
- Safety checks block path traversal, unsafe archive members, unintended overwrites, stale source metadata, and unverifiable current Git state.

## Primary User Experience

Publisher path:

```bash
cd /root/AD
ad-build login
ad-build pack --branch release-AD7.0.29R2
ad-build publish --branch release-AD7.0.29R2
```

Developer path:

```bash
cd /root/workspace/AD
ad-build login
ad-build restore --branch release-AD7.0.29R2
ad-build verify appd
```

If `restore` reports source drift, inspect the GitLab compare link. Continue with `--force` only when a human explicitly accepts the mismatch or overwrite risk.

## Documentation Contract

Every development change must update the matching handoff document:

- Product boundary or solved pain point: this file.
- Command behavior or output contract: `docs/cli-io-contract.md`.
- Code organization or test ownership: `docs/code-architecture.md`.
- Big overlay package collection rules: `docs/overlay-package-contents.md`.
- Critical implementation details and traps: `docs/implementation-notes.md`.
- Follow-up work: `docs/next-steps.md`.
