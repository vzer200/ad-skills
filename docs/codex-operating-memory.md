# Codex Operating Memory

This file is the project-local long-term memory for Codex operations. Read it before modifying, testing, packaging, or uploading this repository.

## Workspace

- Repository: `C:\Users\Administrator\Documents\Codex\2026-05-22\new-chat\repo\ad-skills`
- Branch: `feature/architecture-consolidation`
- Git: `C:\Program Files\Git\cmd\git.exe`
- Python: `C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`
- Node: `C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
- WorkBot upload package: `dist\ad-skills-workbot.zip`

Do not store WorkBot passwords, AD passwords, cookies, GitHub tokens, or generated credential-bearing artifacts in git.

## Git Connection

GitHub CLI is already logged in as `vzer200` and can provide a short-lived token:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth status
& "C:\Program Files\GitHub CLI\gh.exe" auth token
```

Direct `github.com:443` access can fail from this machine. If normal push fails, push through `gh-proxy.com` with a one-command auth header. Do not print or persist the token.

```powershell
$gh = "C:\Program Files\GitHub CLI\gh.exe"
$git = "C:\Program Files\Git\cmd\git.exe"
$token = & $gh auth token
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
& $git -c "http.https://gh-proxy.com/.extraheader=AUTHORIZATION: Basic $basic" push https://gh-proxy.com/https://github.com/vzer200/ad-skills.git feature/architecture-consolidation
Remove-Variable token,basic -ErrorAction SilentlyContinue
```

When pushing with an explicit proxy URL, remote tracking may still show `ahead` until refreshed. Confirm the real remote state with:

```powershell
$token = & "C:\Program Files\GitHub CLI\gh.exe" auth token
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
& "C:\Program Files\Git\cmd\git.exe" -c "http.https://gh-proxy.com/.extraheader=AUTHORIZATION: Basic $basic" ls-remote https://gh-proxy.com/https://github.com/vzer200/ad-skills.git refs/heads/feature/architecture-consolidation
Remove-Variable token,basic -ErrorAction SilentlyContinue
```

The one-click runner has a proxy fallback in `tools\run_workbot_acceptance.ps1`; prefer that path for release runs.

## Code Modification Rules

- Read existing code and tests first; keep changes scoped to the requested requirement.
- Use `apply_patch` for manual edits.
- Preserve user changes; never reset or checkout files unless explicitly asked.
- User-facing WorkBot output must come from skill scripts or generated script summaries, not model-written facts.
- For R2 query output, do not include `覆盖说明`; target lines should look like `目标设备：AD1（192.168.8.30）`.
- For WorkBot, every requirement run must have real tool-call evidence. Open/inspect tool-call panels in the saved artifacts or UI.

## Commit Flow

Before WorkBot upload, commit and push first.

```powershell
& "C:\Program Files\Git\cmd\git.exe" status --short
& "C:\Program Files\Git\cmd\git.exe" diff -- <changed-files>
& "C:\Program Files\Git\cmd\git.exe" add <changed-files>
& "C:\Program Files\Git\cmd\git.exe" commit -m "<type(scope): concise summary>"
& "C:\Program Files\Git\cmd\git.exe" push origin feature/architecture-consolidation
```

If direct push fails, use the proxy push command in `Git Connection`.

## Local Test Flow

Fast focused tests:

```powershell
$env:PYTHONUTF8 = "1"
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m unittest test.test_overview test.test_package_ad_skills
```

Full pre-upload verification and package rebuild:

```powershell
$env:PYTHONUTF8 = "1"
.\tools\run_workbot_acceptance.ps1 -SkipWorkBot
```

Expected local gate: all unit tests pass, all 5 skills validate, `ad-config-ops` smoke passes, and `dist\ad-skills-workbot.zip` is regenerated.

## WorkBot Test Flow

Use a fresh temporary digital employee for each run. The automation enforces the 5-employee limit, creates `AD验收临时-*`, writes the fixed identity/profile, initializes skills, uploads the package, sends fixed prompts, expands tool calls, and saves evidence under `workbot-results\`.

Main command shape:

```powershell
$env:PYTHONUTF8 = "1"
.\tools\run_workbot_acceptance.ps1 -CommitAndPush -VerifyAD -Cases "<comma-separated-cases>"
```

Use passed-case skipping:

- R1 mainline: passed; rerun only in final stability regression.
- R2 mainline fixed prompts: passed before the latest template change; rerun R2 coverage after template edits.
- Extended prompts are separate from fixed mainline and should not be mixed until the mainline is stable.

After each WorkBot run, parse the JSON report and verify:

- `ok: true`
- required commands found
- no forbidden command such as `2>&1`
- visible answer has required template headings
- visible answer hides tool names, stdout/stderr, exit codes, and command strings
- AD-side verification status is `ok`

## Current Next Steps

1. Rerun R2 all fixed and coverage prompts after the R2 template change.
2. If R2 passes, mark R2 as passed and skip it until final stability regression.
3. Prepare R4 fixed prompts for user review before running R4 coverage.
4. After R4 fixed prompts pass, add the linked query -> create -> query scenario as the next test set.
