# CLI Input And Output Contract

## Public Commands

Stable public commands:

```text
ad-build login [--json] [--no-generate]
ad-build logout [--json] [--remove-cache]
ad-build pack --branch <release> [--out <dir>] [--json]
ad-build publish --branch <release> [--overlay <tar.gz>] [--no-push] [--json]
ad-build restore --branch <release> [--force] [--json]
ad-build status [--json]
ad-build doctor [--strict] [--json]
ad-build repair paths [--json]
ad-build repair dpdk [--json]
ad-build verify appd [--json]
ad-build skill status [--skills-dir <dir>]
```

Compatibility:

- `ad-build overlay ...` still dispatches to the same overlay implementation.
- New documentation and AI workflows must use the top-level commands.

Rejected legacy commands include `public-base`, `bundle`, `image`, `inventory`, `completion`, `precheck`, `full-build`, `baseline-save`, `diff`, `map`, `modules`, and `report`.

## Internal And Diagnostic Options

The overlay parser also recognizes maintenance/test options such as `--repo`, `--repo-url`, `--source-root`, `--ad-root`, `--workdir`, `--manifest`, `--inventory`, and `--allow-branch-mismatch`.

These are not the normal user workflow. Do not add them to AI runbooks unless a test, diagnostic session, or maintainer explicitly needs them. The parser recognizes `--allow-branch-mismatch` broadly, but the intended use is pack/publish diagnostics; it must not be presented as the way to bypass restore source drift. Use explicit `restore --force` only when the human accepts that risk.

## Shared Output Rules

- Human-readable output is written to stdout.
- Errors are written to stderr unless `--json` is active.
- With `--json`, stdout contains one parseable JSON object and stderr is reserved for progress.
- Long-running progress uses stderr so JSON consumers can continue to parse stdout.
- Exit code `0` indicates success.
- Thrown CLI errors use human stderr, or a JSON error object with `status: "error"` and `exit_code` when `--json` is active.
- Some normal diagnostic or verification results intentionally return non-zero without using the error wrapper. Examples include `restore` returning a `not_ready` summary, `status` returning a non-ready state, `doctor` returning failed checks, and `verify appd` returning a failed build summary.

## Command Inputs And Outputs

### `login`

Inputs:

- Optional `--no-generate`.
- Uses `$HOME` or `$USERPROFILE` to find or create SSH keys.

Output state:

```text
$HOME/.ad-build/overlay/auth.json
```

Key behavior:

- SSH only.
- Probe command forces the selected key with `-i`, `IdentitiesOnly=yes`, `BatchMode=yes`, and `ConnectTimeout=10`.
- If authentication is pending, the full public key is printed only once for the same generated key.

### `pack`

Required input:

```bash
ad-build pack --branch <release>
```

Default output:

```text
$HOME/.ad-build/overlay/latest/ad-artifact-overlay.tar.gz
$HOME/.ad-build/overlay/latest/ad-artifact-overlay.tar.gz.sha256
$HOME/.ad-build/overlay/latest/manifest.json
$HOME/.ad-build/overlay/latest/inventory.json
$HOME/.ad-build/overlay/latest/pack-summary.json
```

Important summary fields:

- `status: "packed"`
- `release`
- `artifact_path`
- `artifact_sha256`
- `artifact_size_bytes`
- `manifest_path`
- `inventory_path`
- `entries_count`
- `source_branch`
- `source_commit`
- `source_repo_url`
- `source_root_at_pack_time`
- `pack_rules_version`
- `external_dependencies`
- `excluded_external_symlinks`
- `warnings`

Behavior:

- Current AD branch must match `--branch` unless diagnostic-only `--allow-branch-mismatch` is used through the overlay parser.
- Source branch, commit, and remote URL are required.
- Appd-required paths must exist and be represented in the collected entries.
- Known external symlinks are classified before inventory creation. Allowed dependencies enter `manifest.external_dependencies`; deployment/test/aarch64 package links are excluded from the appd MVP overlay; unknown external symlinks fail once with all violating `path`, `link_target`, and `resolved_path` values.

### `publish`

Required input:

```bash
ad-build publish --branch <release>
```

Optional input:

- `--overlay <tar.gz>` to publish a specific local packed overlay.
- `--no-push` for tests/local diagnostics.

Artifact repository layout:

```text
<release>/
  latest-artifact-overlay.json
  artifact-overlay/
    sha256-<12>/
      ad-artifact-overlay.tar.gz
      ad-artifact-overlay.tar.gz.sha256
      manifest.json
      inventory.json
      README.md
```

Behavior:

- Validates manifest source metadata.
- Verifies overlay sha256 before publishing.
- Writes source metadata into the published manifest.
- Keeps only the newest payload directory for the branch.
- Commits the branch as a single latest snapshot and force-pushes unless `--no-push` is set.

### `restore`

Required input:

```bash
ad-build restore --branch <release>
```

Output state:

```text
$HOME/.ad-build/overlay/current.json
$HOME/.ad-build/overlay/use-summary.json
$HOME/.ad-build/overlay/doctor.json
$HOME/.ad-build/overlay/use-conflicts.json      # only on conflict
```

Important summary fields:

- `status: "ready" | "not_ready"`
- `release`
- `artifact_sha256`
- `restored_count`
- `skipped_count`
- `text_files_relocated`
- `symlinks_relocated`
- `dpdk_repair_status`
- `dpdk_repair_log`
- `doctor_status`
- `duration_ms`
- `warnings`

Behavior:

- Requires SSH auth state.
- Validates the current AD Git workspace before artifact repository fetch or checkout.
- Fetches only the requested artifact branch.
- Checks manifest `external_dependencies` through `doctor` after restore; missing system dependencies make the summary `not_ready`.
- Reads lightweight latest/manifest source metadata before materializing the large overlay payload.
- Checks current AD source branch/commit against manifest before full artifact checkout, sha256, or extraction.
- Missing manifest source metadata or unverifiable current Git state is non-forceable.
- Branch/commit drift is forceable only with explicit `--force`.
- Validates inventory digest and archive member safety before extraction.
- Restores only inventory entries.
- Blocks local overwrite conflicts unless `--force` is supplied.
- Relocates old source-root text references and managed symlink targets.
- Attempts appd DPDK/RDMA repair after restore.

### `status`

Reads auth, current overlay, and restore summary state. It returns a suggested next command:

- `ad-build verify appd` when restore summary is ready.
- `ad-build restore --branch <release>` otherwise.

Non-ready status exits with code `3`. Treat that as a normal diagnostic state, not as a CLI crash.

### `doctor`

Checks:

- SSH auth status.
- Current overlay presence.
- Use summary readiness.
- Old source-root references.
- Dangling managed symlinks.
- Required appd overlay paths.

Default doctor reports non-required dangling symlinks as warnings. `--strict` can fail on them.

### `repair paths`

Reruns relocation of old source-root text references and managed symlink targets for the current inventory. It writes:

```text
$HOME/.ad-build/overlay/repair-paths.json
```

### `repair dpdk`

Safely removes known DPDK cache paths under the AD repository and runs:

```bash
make V=1 VERBOSE=1
```

from:

```text
apps/ad_appd_new/libs/dpdk
```

with:

```text
PREFIX_SOURCE=<current AD repo root>
```

It writes a run log and `repair-dpdk-summary.json` under `$HOME/.ad-build/overlay/runs/`.

### `verify appd`

Builds only `apps/ad_appd_new` through the configured module entry. It injects `PREFIX_SOURCE=<current AD repo root>`, captures `build.log`, collects child logs such as DPDK, meson, ninja, and `log3party.log`, and writes:

```text
$HOME/.ad-build/overlay/last-build-summary.json
$HOME/.ad-build/overlay/runs/build-appd-<run-id>/build-summary.json
```

When failed, `first_real_error` and `suggested_next_command` should drive diagnostics. Do not diagnose from a top-level `Error 2` alone.

## Hidden Skill Maintenance Commands

`lib/skill.js` implements `skill install` and `skill uninstall` for package scripts and tests, but public help exposes only `skill status`. Normal installation is owned by npm `postinstall`.
