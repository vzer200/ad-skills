# ad-build Next Steps

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
