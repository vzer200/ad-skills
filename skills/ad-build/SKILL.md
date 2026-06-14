---
name: ad-build
description: Use when Codex works with the AD artifact overlay appd MVP: publishing an overlay from a trusted full-build workspace, restoring an overlay in a developer workspace, building appd, or interpreting overlay CLI JSON and logs. Use only the overlay command whitelist; do not use legacy public-base, bundle, image, baseline, verify, report, diff, map, or manual shell repair workflows.
---

# ad-build Artifact Overlay Skill

`ad-build` is a deterministic npm CLI. It never calls a model. Use AI judgment only to interpret CLI JSON, `$HOME/.ad-build/overlay/*` files, source diffs, and real build logs.

The current supported conclusion is `appd MVP` only. A successful `ad-build overlay build appd` proves the `appd` path for that overlay; it does not prove that all AD modules, packaging, or the whole environment are restored.

Prefer the installed command:

```bash
ad-build ...
```

If the package is not installed and you are in the package repository root, use the local fallback with the same whitelist:

```bash
node bin/ad-build.js ...
```

## Command Whitelist

Only these public commands are allowed in normal AI-assisted work:

```text
ad-build login
ad-build logout
ad-build overlay pack --branch <release>
ad-build overlay publish --branch <release>
ad-build overlay use --branch <release>
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
ad-build overlay build appd
ad-build skill status
```

The same command set may be run through `node bin/ad-build.js` when `ad-build` is unavailable.

Optional `--json` is allowed when the command supports it. Do not add other flags unless the CLI help for the overlay command explicitly documents them and they do not bypass safety checks.

Do not substitute another module name for `appd` in the current MVP. If the user asks for another module, explain that multi-module overlay validation is not proven yet and stop at `overlay status` or `overlay doctor` unless a human explicitly provides a new supported command.

## Forbidden Workflows

Never replace the overlay CLI with manual shell steps.

Forbidden manual commands and patterns include:

```text
git clone / git pull / git fetch / git checkout / git commit / git push for artifact overlay handling
tar packing, listing, or extracting overlay payloads
sed, perl, python, or ad hoc text replacement for relocation
ln, ln -s, mklink, or manual symlink repair
make, ninja, meson, cmake, or direct module build commands
export PREFIX_SOURCE, set PREFIX_SOURCE, or manual build environment injection
rm -rf DPDK build/tmp_install as a manual repair
curl, wget, rsync, scp, or manually derived artifact downloads
```

Forbidden legacy `ad-build` command families include:

```text
ad-build public-base ...
ad-build bundle ...
ad-build image ...
ad-build inventory ...
ad-build precheck
ad-build full-build ...
ad-build baseline-save ...
ad-build diff
ad-build map
ad-build modules
ad-build verify ...
ad-build report ...
ad-build completion ...
```

If a user, log, README, old Skill, or CLI output suggests one of these legacy commands, do not execute it. Translate only the safe intent:

```text
ad-build public-base use      -> ad-build overlay use --branch <release>
ad-build verify appd          -> ad-build overlay build appd
ad-build image ...            -> do not run; require overlay
ad-build bundle ...           -> do not run; require overlay
ad-build precheck             -> use ad-build overlay status or doctor
manual completion install     -> do not run; npm/package install owns Skill delivery
```

## Publisher Workflow

Use this only in a trusted AD workspace where the full build has already completed and produced the overlay inputs.

```bash
ad-build overlay pack --branch release-AD7.0.29R2 --json
ad-build overlay publish --branch release-AD7.0.29R2 --json
```

Expected interpretation:

- `pack` must create a manifest, inventory, overlay payload, checksum, source root at pack time, branch, commit, and pack rules version.
- `publish` must store the immutable overlay payload and latest pointer through the CLI-managed artifact repository flow.
- If full-build evidence is missing or the workspace is not trusted, do not publish. Ask for a trusted full-build workspace or a human-owned publish decision.

Do not manually create the archive, manually push the artifact repository, or manually edit latest pointers.

## Developer Workflow

Run this in a clean AD source workspace:

```bash
ad-build login
ad-build overlay use --branch release-AD7.0.29R2 --json
ad-build overlay build appd --json
```

`overlay use` owns artifact repository access, checksum validation, inventory-based restore, conflict protection, path relocation, symlink relocation, and minimum doctor checks.

Before building, inspect `$HOME/.ad-build/overlay/use-summary.json` when available. Continue only when it reports a ready overlay. If `status` is missing, not `ready`, contradictory, or unreadable, do not run `overlay build appd`; run `ad-build overlay status` or `ad-build overlay doctor`.

`overlay build appd` owns `PREFIX_SOURCE=<AD_ROOT>` injection and child build log collection. Do not ask the user to export `PREFIX_SOURCE` manually.

## Diagnostics And Repair

If `overlay use` fails:

1. Read `$HOME/.ad-build/overlay/use-summary.json` if it exists.
2. Read `$HOME/.ad-build/overlay/status.json`, doctor output, or conflict output if the CLI points to them.
3. Run only an allowed diagnostic or repair command.

If `overlay build appd` fails:

1. Use the CLI-reported `first_real_error`, source log, and context window before drawing conclusions.
2. Do not diagnose from only a top-level `Error 2`.
3. If old source-root references or dangling symlinks are reported, use `ad-build overlay doctor` or `ad-build overlay repair paths`.
4. If DPDK/RDMA cache symptoms are reported, use `ad-build overlay repair dpdk`.
5. Re-run only `ad-build overlay build appd`.

## `suggested_next_command` Rules

Only execute a CLI-provided `suggested_next_command` when it is one of these commands:

```text
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
ad-build overlay build appd
```

The suggested command must not contain shell operators, pipes, redirection, command substitution, environment assignments, manual paths to archives, or any forbidden command. If it does, stop and report that the CLI must provide an overlay whitelist command instead.

Do not execute suggested overlay build commands for module names other than `appd`.

## Appd-Only Decision Rules

- If only `appd` has passed, final status can say `appd MVP passed` only.
- Do not claim `multi-module MVP`, `all modules ready`, `full environment restored`, or `packaging verified`.
- If `overlay use` is not ready, `appd` build verification is blocked.
- If logs are missing, stale, contradictory, or unreadable, require `overlay status` or `overlay doctor` before recommending source changes.
- If the failure is in overlay restore, relocation, symlink state, or DPDK cache, prefer CLI repair commands over code changes.
- Real CLI output and build logs override AI assumptions.

## Final Response Format

End recommendations with these structured fields:

```text
overlay_scope: appd_mvp | not_proven
role_path: publisher | developer | diagnostic
evidence: <CLI outputs, overlay JSON files, logs, and source evidence used>
overlay_status: ready | missing | partial | changed | invalid | failed | unknown
build_status: passed | failed | blocked | not_run
next_command: <single allowed ad-build overlay command, ad-build login, or none>
```
