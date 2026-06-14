# ad-build Next Steps

## User-Facing Chinese Output

### Human-readable feedback and errors should use Chinese

Current behavior:

- Many CLI messages, failure messages, progress messages, and command summaries are still English.
- Some Chinese output is not reliably encoded or displayed, which can produce unreadable text in terminals.
- Raw Node/Git/tar errors leak directly into user-facing output without a clear Chinese explanation.

Expected behavior:

- All human-readable CLI output should use Chinese by default:
  - normal success messages
  - progress messages
  - validation warnings
  - recoverable errors
  - fatal errors
  - next-step instructions
  - conflict reports printed to terminal
- `--json` output should keep stable machine-readable field names in English, but human-readable string values such as `message`, `hint`, and `error` should be Chinese.
- When a low-level command fails, show:
  - Chinese summary of what failed
  - concrete command or operation name
  - important path or branch involved
  - next action the user should take
- Preserve the raw underlying error in structured diagnostics, for example:

```json
{
  "status": "error",
  "error": "恢复失败：目标符号链接已存在",
  "operation": "restore_symlink",
  "path": "shell/arch/aarch64/app/usr/ad/bin/swcsmmgmt_ukey",
  "raw_error": "EEXIST: file already exists, symlink ..."
}
```

Encoding requirements:

- Source files that contain Chinese user-facing text must be saved as UTF-8.
- Tests should assert representative Chinese messages so accidental mojibake is caught.
- Documentation examples should avoid mixing corrupted terminal output into the stable user guide.

Scope:

- This applies to all stable commands, including `login`, `pack`, `publish`, `restore`, `status`, `doctor`, `verify`, and compatibility `overlay ...` aliases.
- Internal variable names, JSON keys, manifest fields, and test names can remain English.
- Third-party tool output may remain English when streamed verbatim, but ad-build must print a Chinese summary before or after it.

Implementation note:

- Add a small message helper instead of scattering ad hoc strings through command handlers.
- The helper should make it easy to keep terminal output, JSON output, and tests consistent.

## Login UX

### Authenticated login output should be concise

Current behavior:

- When `ad-build login` has already authenticated successfully, the CLI still prints the public key path and the full public key.
- This is useful before authentication, but noisy after authentication has passed.

Expected behavior:

- `ad-build login` should behave like a login-status command on every run.
- Every run should probe SSH and report the current status:
  - authenticated
  - pending key install
  - missing key
  - probe failed
- If SSH authentication fails for the first time or a new key was generated, print:
  - auth file path
  - artifact repository
  - public key path
  - full public key to add to GitLab
  - short retry instruction
- If SSH authentication is still pending on a later run with the same key, do not print the full public key again. Print only:
  - current status
  - auth file path
  - public key path
  - short instruction to add that key if it has not been added
- If SSH authentication succeeds, print only a short success message, for example:

```text
overlay SSH 登录已通过
认证文件: /root/.ad-build/overlay/auth.json
产物仓库: git@git.sangfor.com:69765/ad-build-public-base.git
下一步: ad-build overlay use --branch <release>
```

Notes:

- Do not print the full public key when authentication has passed.
- Do not print the full public key repeatedly after the first pending-key response for the same key.
- Store enough state in `$HOME/.ad-build/overlay/auth.json` to know whether the key instruction has already been shown.
- Keep `--json` output unchanged so scripts can still read `public_key`, `public_key_path`, and probe details.

## Progress Output

### Long-running commands should show progress

Current behavior:

- Commands such as `ad-build overlay pack --branch <release> --json` can run for a long time with no visible output.
- Users cannot tell whether the command is scanning files, archiving, blocked, or already failed internally.

Expected behavior:

- For human-readable output, print lightweight progress stages for long-running commands.
- For `--json`, do not mix progress text into stdout because callers may parse JSON. Use stderr for progress events, or add an explicit `--progress` / `--no-progress` policy.

Coverage requirement:

- All commands that may take more than a few seconds must emit progress or heartbeat output.
- This is not limited to archive creation. It also applies to Git clone/pull/push, checksum verification, restore, relocation, repair, and build execution.

Current CLI commands that need coverage:

- `ad-build overlay pack`
- `ad-build overlay publish`
- `ad-build overlay use`
- `ad-build overlay build appd`
- `ad-build overlay doctor`
- `ad-build overlay repair paths`
- `ad-build overlay repair dpdk`
- `ad-build login` when SSH key generation or SSH probe is slow
- `ad-build skill install` when postinstall copies files or installs completion

Suggested progress stages:

```text
[1/5] scanning overlay files...
[2/5] validating required paths...
[3/5] staging files...
[4/5] creating archive...
[5/5] writing manifest and checksum...
```

Notes:

- Progress should be deterministic and low-noise.
- Avoid printing one line per file by default.
- For large archive operations, emit periodic counts or elapsed-time heartbeats, for example every 10,000 entries or every 10 seconds.

## Artifact Retention

### Keep only one overlay per release

Current behavior:

- `ad-build overlay publish --branch <release>` writes each artifact under `artifact-overlay/sha256-<hash>/`.
- If a release is published multiple times, old `sha256-*` directories remain in the artifact repository.
- `latest-artifact-overlay.json` points to the newest one, but old payloads still consume repository space.

Expected behavior:

- For each release directory, keep only the overlay currently referenced by `latest-artifact-overlay.json`.
- When publishing a new overlay for the same release:
  - write the new `artifact-overlay/sha256-<hash>/`
  - update `latest-artifact-overlay.json`
  - delete all older `artifact-overlay/sha256-*` directories for that release
  - commit the new latest pointer, new payload, and cleanup in the same Git commit

Safety rules:

- Never delete directories outside `<release>/artifact-overlay/`.
- Never delete the newly published `sha256-<hash>` directory.
- If cleanup fails, fail the publish before pushing so the repository does not enter a partially updated state.

## SSH Propagation

### Internal Git commands must reuse the login key

Current behavior:

- `ad-build login` probes GitLab SSH with the selected key, for example `/root/.ssh/id_ed25519`.
- `ad-build overlay publish` may still prompt for `git@git.sangfor.com's password:` during internal `git pull` or `git push`.
- This means login authentication and Git operations are not using the same SSH configuration.

Expected behavior:

- After `ad-build login` succeeds, all internal Git operations must reuse the key recorded in `$HOME/.ad-build/overlay/auth.json`.
- Commands affected:
  - `git clone`
  - `git pull --ff-only`
  - `git push`
  - any future Git fetch or remote operation used by overlay commands
- The CLI should set an equivalent of:

```bash
GIT_SSH_COMMAND="ssh -i <key_path> -o IdentitiesOnly=yes -o BatchMode=yes"
```

Safety and UX rules:

- Never allow internal Git commands to fall back to password prompts.
- Use `BatchMode=yes` so authentication failures return immediately.
- If SSH authentication fails, report a clear Chinese error explaining:
  - which key path was used
  - which public key file should be added to GitLab
  - that the user should rerun `ad-build login`
- Do not require users to manually export `GIT_SSH_COMMAND`.

## Command Semantics

### Replace overlay use/build with restore/verify

Current behavior:

- The main developer workflow is `ad-build overlay use --branch <release>` followed by `ad-build overlay build appd`.
- This makes `overlay build appd` look like part of the required restore path.
- In reality, `build appd` is only a verification step. A successful restore should leave the AD workspace ready for native build commands.

Expected behavior:

- Recommended publisher commands:
  - `ad-build pack --branch <branch>`
  - `ad-build publish --branch <branch>`
- Recommended developer command:
  - `ad-build restore --branch <branch>`
- Optional version alias:
  - `ad-build restore --version <version>` if a product version alias is later introduced
- Optional verification:
  - `ad-build verify appd`

Branch selection behavior:

- `--branch` is required for `pack`, `publish`, and `restore`.
- Do not implement a global "latest across all branches" default. It is too easy to restore the wrong AD branch's compiled artifacts.
- `ad-build restore` without `--branch` should fail fast with a Chinese message explaining that the branch must be specified.
- The artifact repository branch should match the AD source branch:
  - AD branch `release-AD7.0.29R2` publishes to artifact repo branch `release-AD7.0.29R2`.
  - `ad-build restore --branch release-AD7.0.29R2` restores from artifact repo branch `release-AD7.0.29R2`.
- "Latest" is allowed only inside the specified artifact branch. That means latest for `release-AD7.0.29R2`, not latest among all branches.
- Before publish, the CLI should print the current AD branch, selected artifact branch, source commit, and artifact repo URL.
- Before restore, the CLI should print the selected artifact branch, latest artifact hash, source branch, and source commit recorded in the manifest.
- If the current AD source branch differs from `--branch`, fail by default and require an explicit override such as `--allow-branch-mismatch`.
- Avoid `--release` as the primary flag for this workflow. The user-facing concept here is the Git branch that produced the compiled artifacts, not a product release label.

Restore responsibility:

- `restore` must perform the full environment preparation:
  - fetch or update the artifact repository
  - select latest or requested release
  - validate manifest, inventory, archive members, and checksum
  - restore compiled artifacts
  - rewrite fixed source-root paths
  - repair managed symlinks
  - handle known DPDK/RDMA cache issues
  - run readiness checks
- After `ad-build restore` reports ready, users should be able to run native build commands directly, for example:

```bash
cd /root/workspace/AD/apps/ad_appd_new
make
```

### Restore must handle existing symlink targets under force

Observed bug:

- Command:

```bash
ad-build overlay use --branch release-AD7.0.29R2 --force
```

- Failure:

```text
ad-build overlay use failed: EEXIST: file already exists, symlink '/app/usr/ad/bin/swcsmmgmt' -> '/root/workspace/AD/shell/arch/aarch64/app/usr/ad/bin/swcsmmgmt_ukey'
```

Root cause hypothesis:

- `--force` already allows overwriting regular restored files.
- Symlink restore entries still call `fs.symlinkSync(source, target)` directly.
- If `target` already exists, Node throws `EEXIST`.
- This interrupts the whole restore even though the user explicitly requested `--force`.

Expected behavior:

- For inventory entries whose type is `symlink`, restore must be idempotent.
- If target does not exist, create the symlink.
- If target exists and is already the expected symlink, treat it as success.
- If target exists and is a different file or symlink:
  - without `--force`, fail with a clear Chinese conflict message
  - with `--force`, remove only that exact target path and recreate the symlink
- If target exists and is a directory, fail by default. Directory deletion must not happen through this symlink path unless a future explicit and narrowly scoped flag is added.

Safety rules:

- Only operate on symlink targets declared in the overlay inventory.
- Only operate on paths inside the current AD repository root.
- Never follow a symlink and delete its resolved destination.
- Never delete arbitrary parent directories.
- Write symlink conflicts to a structured report, for example:

```text
$HOME/.ad-build/overlay/last-restore/symlink-conflicts.json
```

Test coverage required:

- Restoring a missing symlink creates it.
- Restoring the same symlink twice succeeds.
- Restoring with an existing wrong symlink fails without `--force`.
- Restoring with an existing wrong symlink succeeds with `--force`.
- Restoring with an existing regular file fails without `--force`.
- Restoring with an existing regular file succeeds with `--force`.
- Existing directories are not removed by symlink restore.
- Symlink targets outside repo root are rejected.

Confirmed force behavior:

- `--force` may replace an existing regular file with the expected symlink when both conditions hold:
  - the path is declared by the overlay inventory as a symlink target
  - the path is inside the current AD repository root
- This does not allow deleting directories, following symlinks, or deleting paths outside the repository.

### Restore doctor must validate relocated symlinks correctly

MVP policy:

- Do not make full-repository symlink health a default restore blocker.
- The first goal is to reproduce the manually validated appd flow:
  - restore overlay payload
  - rewrite old `/root/AD` paths to the current AD root
  - repair required symlink/file issues encountered by the appd build path
  - run readiness checks for known required paths
  - let users run native `make`
- Treat broad symlink inspection as diagnostics unless it affects required readiness paths.

Observed bug:

- After running restore/use, `doctor.json` can report:

```text
dangling_symlinks : 959 dangling overlay-managed symlinks were found
required_path:libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h : ... is missing; overlay is not ready for appd
```

- Example reported symlink:

```json
{
  "path": "apps/ad_appd_new/libs/dpdk/tmp_install/lib64/librte_*.so*",
  "target": "dpdk/pmds-21.0/librte_*.so*"
}
```

Why this matters:

- A restore can write tens of thousands of files successfully but still be unusable if managed symlinks point to the wrong root, wrong relative target, or unresolved build-cache paths.
- The current report is too broad: it shows a large dangling count but does not clearly separate true broken symlinks, relative symlink validation issues, wildcard-like symlink entries, and known build-system links.

Root cause hypotheses:

- Symlink relocation may only rewrite absolute old-root paths such as `/root/AD/...`, while relative symlink targets are not normalized against the symlink's parent directory.
- `doctor` may be checking relative symlink targets from the repository root instead of from the directory containing the symlink.
- Symlink targets containing wildcard characters such as `*` may be treated as literal paths, causing false dangling reports.
- Some symlinks may not have been replaced correctly because earlier restore logic failed on existing symlink targets.
- Required appd paths such as `libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h` may depend on the symlink repair step and must be checked after repair, not before.

Expected behavior:

- Restore should repair managed symlinks needed by the validated appd restore path as part of the main `restore` flow, before final readiness checks.
- Symlink validation should resolve targets according to their type:
  - absolute old-root targets are rewritten to the current AD root
  - repo-relative targets are resolved from the current AD root only when the inventory explicitly marks them that way
  - normal relative symlink targets are resolved from the symlink's parent directory
  - targets outside the AD root are reported separately and do not block restore unless required by the selected readiness check
  - targets with wildcard characters are classified separately and do not block restore by default
- `doctor` output should group symlink issues into actionable categories:
  - true dangling symlink
  - invalid outside-repo symlink
  - wildcard-pattern symlink
  - old-root symlink not relocated
  - permission or replacement failure
- Default `restore` should fail only when a required readiness path is missing after repair.
- Full strict symlink validation should be opt-in, for example:

```bash
ad-build doctor --branch <branch> --strict
```

- Terminal output should show a concise Chinese summary and only a small sample. Full details should be written to a report file such as:

```text
$HOME/.ad-build/overlay/last-restore/symlink-report.json
```

Repair behavior:

- `ad-build restore --branch <branch>` should run symlink repair automatically.
- A separate repair command can remain for diagnostics, for example:

```bash
ad-build doctor --branch <branch>
ad-build repair symlinks --branch <branch>
```

- If required paths are still missing after repair, report the exact missing path, the related symlink if known, and the next command to inspect or repair it.

Test coverage required:

- Relative symlink targets are validated relative to the symlink's parent directory.
- Absolute old-root symlink targets are rewritten to the current root.
- Wildcard-like symlink targets are classified separately.
- Required appd paths are checked after symlink repair.
- Default doctor/restore fails on true dangling required symlinks but does not fail on broad non-required symlink issues.
- Strict doctor fails on full-repository symlink issues.
- The symlink report contains enough detail to debug without printing hundreds of entries to the terminal.

### Restore summary and doctor execution order must be consistent

Observed bug:

- `/root/.ad-build/overlay/use-summary.json` exists after `overlay use`.
- The same run's `doctor.json` still reports:

```text
use_summary_ready : overlay use-summary is missing
```

Why this matters:

- The final status becomes misleading:
  - `use-summary.json` says restore completed enough to write a summary
  - `doctor.json` says the summary is missing
- This makes users and inner AI agents spend time debugging a state file that actually exists.

Root cause hypothesis:

- `overlay use` likely runs doctor before writing the final use summary.
- Doctor reads the summary from disk instead of receiving the in-memory restore result.
- The warning then gets copied into the final summary, leaving stale diagnostic state.

Expected behavior:

- Restore should write a minimal in-progress summary before running doctor, then overwrite it with the final summary after doctor completes.
- Or doctor should accept the restore result directly when called from restore/use, and standalone doctor can still read state from disk.
- The final `use-summary.json` must not contain stale warnings produced only because the summary had not been written yet.
- If doctor is run after a failed restore, it should report the actual failed phase rather than `use-summary missing`.

Suggested state model:

```text
started -> files_restored -> symlinks_repaired -> paths_relocated -> doctor_checked -> ready/not_ready
```

Test coverage required:

- Successful restore writes `use-summary.json` before final doctor result is persisted.
- Doctor run inside restore does not warn that the summary is missing.
- Standalone doctor still warns if no restore summary exists.
- Failed restore writes a partial summary with the failed phase and error details.

Compatibility:

- Existing `ad-build overlay ...` commands may remain temporarily as compatibility aliases.
- They should print migration hints toward the shorter commands.
- Future stable documentation should prefer `pack`, `publish`, `restore`, `status`, `doctor`, and `verify`.
