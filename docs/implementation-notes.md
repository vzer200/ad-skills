# Implementation Notes And Pitfalls

## Critical Constants

In `lib/overlay.js`:

- `DEFAULT_ARTIFACT_REPO_SSH`: `git@git.sangfor.com:69765/ad-build-public-base.git`.
- `DEFAULT_SOURCE_ROOT`: `/root/AD`.
- `PACK_RULES_VERSION`: bump only when pack collection semantics change incompatibly.
- `SCAN_ROOTS`, `SCAN_FILES`, `EXCLUDED_PREFIXES`, and `APPD_REQUIRED_PATHS`: define the overlay package boundary.
- `MODULES.appd`: maps `verify appd` to `apps/ad_appd_new` and `make V=1 VERBOSE=1`.

In `lib/completion.js`:

- `TOP_COMMANDS`, `SUBCOMMANDS`, and `OPTIONS` must stay aligned with the public command contract.

In `package.json`:

- The `files` whitelist intentionally ships only the overlay runtime. Do not replace it with `"lib"` or add legacy templates.

## Source Drift Preflight

`useOverlay()` first validates that the current directory is a readable AD Git workspace, then reads lightweight latest/manifest source metadata before reading inventory, hashing the overlay payload, or extracting the archive. This order is deliberate.

Why it matters:

- A clean device should fail fast when the AD branch/commit does not match the published overlay.
- Users should see the exact overlay/current `branch` and `commit` before paying the cost of full artifact checkout, sha256, or extraction.
- A wrong current directory should fail before any artifact repository fetch or checkout.
- Missing manifest source metadata and unverifiable current Git state are not safely forceable.

Force rules:

- Branch or commit mismatch can continue only with explicit `--force`.
- Missing source metadata or current Git identity must stop and require a new valid publish or a verifiable AD Git workspace.

Remote artifact repositories use a lightweight metadata fetch first: `git fetch --depth=1 --filter=blob:none` followed by reading `latest-artifact-overlay.json` and manifest through `git show`. Only after the source check passes, or the user explicitly uses `--force` for branch/commit drift, does restore perform the normal branch checkout that materializes the large overlay payload.

## Pack Collection Rules

`PACK_RULES_VERSION` is `2` because package selection now includes hand-tested appd symlink dependencies that version 1 could miss.

Important details:

- `collectPackEntries()` emits scan progress every fixed number of scanned paths so large AD workspaces do not look stuck during full artifact discovery.
- `libs/rdma-core-2404mlnx51/` header files are included even when they look source-like. The appd DPDK/RDMA cache uses `build/include/infiniband/*.h` symlinks that point back to provider/libibverbs headers.
- Included symlinks are followed for one AD-internal closure: if a managed symlink target exists inside the publishing AD workspace, that target is added to inventory too. Absolute targets under `/root/AD` or `source_root_at_pack_time` are POSIX-normalized first, then mapped back to AD-relative paths only when the normalized target still stays under that source root.
- External symlinks in pack scope are classified before inventory creation. `include/lua -> /usr/local/include/luajit-2.1/` is a whitelisted system header dependency and enters `manifest.external_dependencies`, not inventory. Deployment/test links under `shell/etc/...` and `test/.../mock_S04NicFactory`, plus `shell/arch/aarch64/...` package links, are skipped for the appd x86 MVP. Any other external symlink causes one aggregated `pack` failure listing every `path`, `link_target`, and `resolved_path`.
- `validatePackReadiness()` checks not only required symlink paths, but also their AD-internal targets. This catches a bad package on the publishing device instead of producing a restore-time `not_ready` state on a clean device.

## Publish Branch Strategy

`publishOverlay()` uses the artifact repository branch matching `--branch`.

The branch is kept as a single latest snapshot:

- Old payload directories are removed.
- A fresh tree is committed.
- The branch ref is moved to that one commit.

This avoids clean devices pulling historical 3GB overlay blobs. Do not change this back to append-only Git history without an explicit storage redesign.

## Restore Conflict Rules

`findRestoreConflicts()` protects local changes before restore writes files.

Allowed without `--force`:

- Existing target already matches the incoming entry.
- Existing target was previously managed by an older overlay and matches that previous entry.

Blocked without `--force`:

- Local file/symlink conflicts with an incoming inventory entry.
- Git status reports local changes for an incoming path.

Allowed with `--force`:

- Replacing a normal file or old symlink with an inventory symlink.

Still not allowed:

- Unsafe paths.
- Deleting arbitrary directories outside the managed inventory.

## Relocation Rules

`relocateInventoryEntries()` repairs old publisher-root references after restore.

It handles:

- Symlink targets containing `manifest.source_root_at_pack_time`.
- Text files that are safe to relocate, including build metadata and small non-binary files.

It intentionally skips:

- Large files over 50MB.
- Files that look binary.
- Entries that are not managed by the overlay inventory.

Do not replace this with broad repository-wide `sed` or ad hoc scripts. The inventory boundary is part of the safety model.

## DPDK/RDMA Repair

The manual success flow showed that appd failures commonly come from stale DPDK/RDMA build caches, not missing source code.

`repairDpdk()`:

- Runs under `apps/ad_appd_new/libs/dpdk`.
- Safely removes known generated DPDK cache paths under the AD repo.
- Injects `PREFIX_SOURCE=<current AD root>`.
- Runs `make V=1 VERBOSE=1`.
- Checks for `libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h`.
- Writes a log and summary under `$HOME/.ad-build/overlay/runs/`.

`maybeRepairDpdkAfterRestore()` runs the same repair after restore when the DPDK root exists. `ad-build repair dpdk` is the explicit retry command.

Pitfall: do not manually copy `mlx5dv.h` over a symlink target. That can introduce duplicate definition errors. Fix the symlink path or rebuild the DPDK cache.

## Build Verification

`buildModule()` currently supports only `appd`.

It:

- Requires `use-summary.json` with `status: ready` unless an internal option bypasses readiness.
- Injects `PREFIX_SOURCE`.
- Runs the configured module command.
- Captures top-level `build.log`.
- Copies child logs found under the module tree, including DPDK, meson, ninja, and `log3party.log`.
- Extracts the first real error using `ERROR_PATTERNS`.
- Suggests exactly one allowed next command.

Pitfall: top-level `Error 2` is usually not the root cause. Prefer `first_real_error`, child log context, and `suggested_next_command`.

## Archive Safety

`validateOverlayArchive()` compares tar members to the inventory-derived allowed path set before extraction.

It rejects:

- Members outside `manifest.json`, `inventory.json`, and `files/<inventory path>`.
- Unsafe relative paths.
- Children under symlink members.
- Non-directory archive prefixes and type mismatches between archive members and inventory entry types.

This validation protects restore from malicious or corrupt overlay archives. Keep tests for unsafe archive members when changing tar behavior.

The validation protects archive member paths, restore destinations, and inventory symlink targets. Symlink targets are allowed only when they resolve inside the current AD root after `source_root_at_pack_time` relocation. Source-root absolute targets that contain `..`, such as rdma-core generated links under `/root/AD/.../../...`, are accepted only after POSIX normalization proves they still stay inside the recorded source root. External absolute targets, empty targets, and paths that escape the AD boundary are rejected before restore extracts the payload. External system dependencies are represented only in `manifest.external_dependencies`; `doctor` checks their `check_path`.

## Progress And JSON

Progress goes to stderr through `emitProgress()`, `hashProgress()`, `gitProgress()`, tar checkpoint support, and build command streaming.

Do not write progress to stdout when `--json` is active. JSON consumers rely on stdout containing one parseable object.

`collectPackEntries()` emits fixed-interval scan counters so users can see full-tree scan progress before compression starts.

## Packaging Pitfalls

There are two different package concepts:

- CLI delivery package: `dist/ad-build-<version>.zip` and `.tgz`, containing only runtime JS/docs/Skill files.
- Repository source handoff package: `dist/ad-build-<version>-source.zip`, generated from tracked source/docs when explicitly requested and force-added only as a handoff artifact.
- AD overlay package: `ad-artifact-overlay.tar.gz`, containing generated AD build artifacts and metadata.

Do not confuse the two in docs or release notes.

The tar contains a `manifest.json`, but that embedded copy is created before the tar's final sha256 and size are available. The canonical manifest is the one written beside the tar after pack, and the one copied into the published artifact repository.

`package.json.files` is intentionally narrow. Tests assert that legacy directories and old template flows are not shipped.

The repository may contain ignored historical archives or logs in a developer workspace. Do not use root-level old `*.tgz`, `ad-skills-*.zip`, or stale `dist/ad-build-overlay-mvp-*.zip` files as release artifacts. Confirm the versioned `dist/ad-build-<version>.tgz`/`.zip` runtime package or the explicitly requested `dist/ad-build-<version>-source.zip` handoff package contents before handoff.

Most maintenance documents are repository handoff material and are not currently included in the npm package. The package whitelist ships the user README, `docs/artifact-overlay-operations.md`, runtime code, and Skill. If a maintenance document becomes user-facing, update `package.json.files` and `test/package-shape.test.js` deliberately.

## Documentation Maintenance

Every code change should update one or more handoff documents:

- Command behavior: `docs/cli-io-contract.md`.
- Code ownership or module flow: `docs/code-architecture.md`.
- Overlay package boundary: `docs/overlay-package-contents.md`.
- Safety checks, repair behavior, or pitfalls: this file.
- Scope and product rationale: `docs/project-overview.md`.
- Follow-up work: `docs/next-steps.md`.

If a document describes behavior not covered by tests, either add a test or label it as an operational convention rather than verified behavior.
