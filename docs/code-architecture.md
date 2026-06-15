# Code Architecture

## Repository Shape

```text
bin/ad-build.js                 top-level CLI entrypoint
lib/overlay.js                  artifact overlay pack/publish/restore/status/doctor/repair/verify
lib/login.js                    SSH login/logout and auth state
lib/skill.js                    bundled Skill install/status helpers
lib/completion.js               bash/zsh completion rendering and best-effort install
lib/core.js                     canonical JSON, sha256 JSON digests, JSON read/write helpers
lib/file-utils.js               large-file sha256 hashing with progress callback
skills/ad-build/SKILL.md        AI-facing operational rules
docs/*.md                       project, operation, and handoff documentation
test/*.test.js                  Node test suite
```

`package.json` exposes `bin/ad-build.js` as the `ad-build` command and intentionally ships only the overlay MVP runtime files through the `files` whitelist.

## Command Dispatch

`bin/ad-build.js` is intentionally thin:

- `help` renders top-level help.
- `overlay ...` remains a compatibility alias and calls `overlay.runOverlayCli()`.
- Stable top-level aliases translate to overlay subcommands:
  - `pack` -> `overlay pack`
  - `publish` -> `overlay publish`
  - `restore` -> `overlay use`
  - `status` -> `overlay status`
  - `doctor` -> `overlay doctor`
  - `repair` -> `overlay repair`
  - `verify` -> `overlay build`
- `login` and `logout` call `lib/login.js`.
- `skill` calls `lib/skill.js`.
- legacy commands are rejected with migration text instead of executing old flows.

## Overlay Lifecycle

The core overlay lifecycle lives in `lib/overlay.js`.

Publisher:

1. `packOverlay()` resolves the AD Git root, requires `--branch`, records source Git metadata, scans generated artifacts with progress, classifies external symlinks, records allowed external dependencies in the manifest, expands AD-internal symlink targets, validates appd-required paths, stages files under a temp `files/` tree, writes manifest/inventory, creates `ad-artifact-overlay.tar.gz`, computes sha256, and writes `pack-summary.json`.
2. `publishOverlay()` validates the local packed overlay, verifies sha256, prepares the artifact repository branch, writes `latest-artifact-overlay.json`, stores payload data under `artifact-overlay/sha256-<12>/`, removes old payload directories for that release, and commits a single branch snapshot.

Consumer:

Remote metadata fetch goes through the managed cache repo. `ensureArtifactRepo()` repairs the `origin` URL and `fetchArtifactMetadata()` configures partial clone before running `--filter=blob:none`; unsupported Git/cache combinations fallback to ordinary shallow fetch with a progress warning.

1. `useOverlay()` first validates the current AD Git workspace, requires authenticated SSH state, reads lightweight latest pointer and manifest metadata, checks source branch/commit drift before full artifact checkout, then validates inventory and archive safety, hashes/extracts into temp staging, checks restore conflicts, restores inventory entries, relocates old source-root references, checks manifest external dependencies through doctor, repairs DPDK/RDMA cache when possible, writes current/summary state including `duration_ms`, and runs doctor checks.
2. `buildModule()` currently supports only `appd`. It requires a ready restore summary unless an internal option bypasses it, injects `PREFIX_SOURCE=<repoRoot>`, runs the module build command, copies child logs, extracts the first real error, writes `last-build-summary.json`, and suggests a single allowed next command.

Diagnostics:

- `runStatus()` summarizes auth/current/use-summary state.
- `runDoctor()` builds readiness checks and writes `doctor.json`.
- `repairPaths()` reruns path and symlink relocation against the current inventory.
- `repairDpdk()` deletes known DPDK cache paths safely and rebuilds from `apps/ad_appd_new/libs/dpdk` with `PREFIX_SOURCE`.

## State And Cache Paths

Default state root:

```text
$HOME/.ad-build/
```

Important overlay paths:

```text
$HOME/.ad-build/overlay/auth.json
$HOME/.ad-build/overlay/latest/
$HOME/.ad-build/overlay/current.json
$HOME/.ad-build/overlay/use-summary.json
$HOME/.ad-build/overlay/doctor.json
$HOME/.ad-build/overlay/runs/
$HOME/.ad-build/cache/artifact-overlay-repo/
```

`AD_BUILD_STATE_DIR` can override the state root. `AD_BUILD_OVERLAY_REPO_PATH` can point tests or diagnostics at a local artifact repository. `AD_BUILD_OVERLAY_REPO_SSH` can override the remote SSH repository.

## Test Ownership

- `test/cli-surface.test.js`: public help, legacy rejection, structured JSON errors, branch requirement.
- `test/completion.test.js`: completion command whitelist and no legacy tokens.
- `test/login.test.js`: SSH probe args, login output, pending public key behavior.
- `test/overlay.test.js`: pack/publish/restore lifecycle, source drift, branch checks, path relocation, symlink behavior, appd DPDK repair, archive safety, status/doctor/build behavior.
- `test/package-shape.test.js`: npm package whitelist and dry-run package contents.
- `test/skill-install.test.js`: bundled Skill install/status/uninstall and completion best-effort install.

Run:

```bash
npm test
```

The Windows suite skips symlink-only cases when the OS lacks symlink privileges.
