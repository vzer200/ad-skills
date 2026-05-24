param(
    [string]$Python = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe",
    [string]$Node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe",
    [string]$Package = "dist\ad-skills-workbot.zip",
    [string]$R4Yaml = "test\fixtures\workbot\r4-slb-full.yml",
    [string]$ADBaseUrl = "https://14.18.243.211:21044",
    [string]$ADUser = "admin",
    [int]$IdleAfterStopMs = 2000,
    [int]$StabilityRuns = 3,
    [switch]$VerifyAD,
    [switch]$InjectDevicePasswords,
    [switch]$Prepare,
    [switch]$RunExtended,
    [switch]$SkipExtended,
    [switch]$SkipR2R4,
    [switch]$SkipStability
)

$ErrorActionPreference = "Stop"
$Repo = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Repo

if (!(Test-Path $Python)) { $Python = "python" }
if (!(Test-Path $Node)) { $Node = "node" }

if (!$env:WORKBOT_PASSWORD) {
    throw "WORKBOT_PASSWORD is required for WorkBot automation"
}

if ($Prepare) {
    $prepareArgs = @("-Python", $Python, "-Node", $Node, "-Package", $Package, "-CommitAndPush", "-SkipWorkBot")
    if ($VerifyAD) { $prepareArgs += "-VerifyAD" }
    if ($InjectDevicePasswords) { $prepareArgs += "-InjectDevicePasswords" }
    & "$PSScriptRoot\run_workbot_acceptance.ps1" @prepareArgs
}

function Invoke-WorkBotSuite {
    param(
        [string]$Name,
        [string]$Suite
    )
    Write-Host ""
    Write-Host "===== $Name ($Suite) ====="
    $args = @(
        "tools\workbot_acceptance.mjs",
        "--zip", $Package,
        "--python", $Python,
        "--r4-yaml", $R4Yaml,
        "--fresh-agent",
        "--idle-after-stop-ms", "$IdleAfterStopMs",
        "--case-suite", $Suite
    )
    if ($VerifyAD) {
        $args += @("--verify-ad", "--ad-base-url", $ADBaseUrl, "--ad-user", $ADUser)
    }
    & $Node @args
}

if ($RunExtended -and !$SkipExtended) {
    Invoke-WorkBotSuite -Name "Task 1: extended prompt variants" -Suite "extended"
}

if (!$SkipR2R4) {
    Invoke-WorkBotSuite -Name "Task 2: R4 delivery plus R2 queries" -Suite "r2r4"
}

if (!$SkipStability) {
    Invoke-WorkBotSuite -Name "Task 3: fixed mainline gate" -Suite "fixed"
    for ($i = 1; $i -le $StabilityRuns; $i += 1) {
        Invoke-WorkBotSuite -Name "Task 3: fixed stability run $i/$StabilityRuns" -Suite "fixed"
    }
}

Write-Host ""
Write-Host "Nightly WorkBot automation completed."
