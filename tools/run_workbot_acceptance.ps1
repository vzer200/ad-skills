param(
    [string]$Python = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe",
    [string]$Node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe",
    [string]$Git = "C:\Program Files\Git\cmd\git.exe",
    [string]$Gh = "C:\Program Files\GitHub CLI\gh.exe",
    [string]$Package = "dist\ad-skills-workbot.zip",
    [string]$CommitMessage = "feat(ad-config-ops): add SLB bundle workflow and WorkBot automation",
    [switch]$CommitAndPush,
    [switch]$SkipWorkBot,
    [switch]$VerifyAD,
    [switch]$InjectDevicePasswords,
    [switch]$InjectDeviceOverrides,
    [string]$ADBaseUrl = "https://14.18.243.211:21044",
    [string]$ADUser = "admin",
    [ValidateSet("fixed", "extended", "r4", "r2r4", "all")]
    [string]$CaseSuite = "fixed",
    [string]$Cases = "",
    [string]$R4Yaml = "test\fixtures\workbot\r4-slb-full.yml",
    [int]$IdleAfterStopMs = 2000,
    [switch]$NoFreshAgent
)

$ErrorActionPreference = "Stop"
$Repo = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Repo

if (!(Test-Path $Python)) {
    $Python = "python"
}
if (!(Test-Path $Node)) {
    $Node = "node"
}
if (!(Test-Path $Git)) {
    $Git = "git"
}

$env:PYTHONUTF8 = "1"
$env:PYTHONPATH = ".claude\skills\ad-config-ops\scripts\_vendor"

Write-Host "[1/7] Running unit tests"
& $Python -m unittest discover -s test -p "test_*.py" -v

Write-Host "[2/7] Validating skills"
$skills = @("ad-connect", "ad-ops", "ad-check-analysis", "ad-perception", "ad-blackbox-analysis", "ad-config-ops")
foreach ($skill in $skills) {
    & $Python "C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\quick_validate.py" ".claude\skills\$skill"
}

Write-Host "[3/7] Running ad-config-ops smoke"
& $Python ".claude\skills\ad-config-ops\scripts\render_slb_bundle.py" --vs-name wb_vs_combo_test_01 --vip 10.250.250.30 --vport 8082 --pool wb_pool_combo_test_01 --node 192.0.2.30:80 --create-http-profile-xff wb_xff_profile_02 --create-pre-rule-http wb_pre_rule_02 --pre-rule-uri-pattern "/" --pre-rule-uri-mode WILDCARD --workdir "adops_smoke\automation"
& $Python ".claude\skills\ad-config-ops\scripts\ad_ops_flow.py" plan-and-render --skill-root ".claude\skills\ad-config-ops" --bundle "adops_smoke\automation\adops-bundle.yml" --workdir "adops_smoke\automation"
& $Python ".claude\skills\ad-config-ops\scripts\ad_ops_flow.py" summarize-plan --plan "adops_smoke\automation\adops-plan.json" --workdir "adops_smoke\automation"

if ($CommitAndPush) {
    Write-Host "[4/7] Committing and pushing"
    & $Git add .gitignore CLAUDE.md docs tools test .claude/skills
    $staged = & $Git diff --cached --name-only
    if ($staged) {
        & $Git commit -m $CommitMessage
    } else {
        Write-Host "No staged changes to commit"
    }
    $branch = (& $Git branch --show-current).Trim()
    $pushed = $false
    if (Test-Path $Gh) {
        $token = (& $Gh auth token 2>$null)
        if ($LASTEXITCODE -eq 0 -and $token) {
            $pair = "x-access-token:" + $token.Trim()
            $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
            & $Git -c "http.https://github.com/.extraheader=AUTHORIZATION: Basic $basic" push origin $branch
            $pushExit = $LASTEXITCODE
            if ($pushExit -ne 0) {
                $remoteUrl = (& $Git remote get-url origin).Trim()
                if ($remoteUrl -like "https://github.com/*") {
                    $proxyUrl = "https://gh-proxy.com/$remoteUrl"
                    & $Git -c "http.https://gh-proxy.com/.extraheader=AUTHORIZATION: Basic $basic" push $proxyUrl $branch
                    $pushExit = $LASTEXITCODE
                }
            }
            Remove-Variable token,pair,basic -ErrorAction SilentlyContinue
            $pushed = ($pushExit -eq 0)
        }
    }
    if (!$pushed) {
        & $Git push origin $branch
    }
} else {
    Write-Host "[4/7] Skipping commit/push; pass -CommitAndPush before upload in release runs"
}

Write-Host "[5/7] Packaging AD skills"
$packageArgs = @("tools\package_ad_skills.py", "--out", $Package)
if ($InjectDevicePasswords) {
    $packageArgs += "--inject-device-passwords"
}
if ($InjectDeviceOverrides) {
    $packageArgs += "--inject-device-overrides"
}
& $Python @packageArgs

Write-Host "[5/7] Verifying packaged device hosts"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = Resolve-Path $Package
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $entry = $zip.GetEntry("devices.json")
    if ($null -eq $entry) {
        throw "devices.json missing from WorkBot package"
    }
    $reader = New-Object System.IO.StreamReader($entry.Open(), [Text.Encoding]::UTF8)
    try {
        $deviceText = $reader.ReadToEnd()
    } finally {
        $reader.Dispose()
    }
    if ($deviceText -match "14\.18\.243\.211:210(44|39)") {
        throw "WorkBot package still contains public AD gateway hosts; expected intranet hosts 192.168.8.30/31"
    }
    if ($deviceText -notmatch "192\.168\.8\.30" -or $deviceText -notmatch "192\.168\.8\.31") {
        throw "WorkBot package does not contain both intranet AD hosts 192.168.8.30 and 192.168.8.31"
    }
} finally {
    $zip.Dispose()
}

if ($SkipWorkBot) {
    Write-Host "[6/7] Skipping WorkBot"
    Write-Host "[7/7] Done"
    exit 0
}

if (!$env:WORKBOT_PASSWORD) {
    throw "WORKBOT_PASSWORD is required for WorkBot automation"
}

Write-Host "[6/7] Running WorkBot acceptance"
$workbotArgs = @("tools\workbot_acceptance.mjs", "--zip", $Package, "--python", $Python, "--r4-yaml", $R4Yaml, "--idle-after-stop-ms", "$IdleAfterStopMs")
if (!$NoFreshAgent) {
    $workbotArgs += "--fresh-agent"
}
if ($Cases) {
    $workbotArgs += @("--cases", $Cases)
} else {
    $workbotArgs += @("--case-suite", $CaseSuite)
}
if ($VerifyAD) {
    $workbotArgs += @("--verify-ad", "--ad-base-url", $ADBaseUrl, "--ad-user", $ADUser)
}
& $Node @workbotArgs

Write-Host "[7/7] Done"
