param(
    [string]$Python = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe",
    [string]$Node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe",
    [string]$NodeModules = "",
    [string]$Package = "dist\ad-skills-workbot.zip",
    [string]$Url = "https://14.18.243.211:21048/",
    [string]$User = $env:WORKBOT_USER,
    [string]$Password = $env:WORKBOT_PASSWORD,
    [string]$FreshAgentPrefix = "",
    [int]$MaxDigitalEmployees = 5,
    [string]$OutDir = "workbot-results",
    [int]$IdleAfterStopMs = 3000,
    [switch]$Headless,
    [switch]$SkipPackage
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

if ([string]::IsNullOrWhiteSpace($User)) {
    throw "WORKBOT_USER is required. Set `$env:WORKBOT_USER or pass -User."
}
if ([string]::IsNullOrWhiteSpace($Password)) {
    throw "WORKBOT_PASSWORD is required. Set `$env:WORKBOT_PASSWORD or pass -Password."
}

if ([string]::IsNullOrWhiteSpace($NodeModules)) {
    $candidates = @(
        "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules",
        (Join-Path $Repo "node_modules"),
        (Join-Path $Repo ".codex-node\node_modules")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            $NodeModules = $candidate
            break
        }
    }
}
if ([string]::IsNullOrWhiteSpace($NodeModules) -or !(Test-Path $NodeModules)) {
    throw "playwright-core node_modules not found. Pass -NodeModules with the bundled node_modules path."
}

if (!$SkipPackage) {
    Write-Host "[1/2] Packaging AD skills"
    & $Python "tools\package_ad_skills.py" --out $Package
}

if (!(Test-Path $Package)) {
    throw "WorkBot package not found: $Package"
}

Write-Host "[2/2] Creating/initializing WorkBot employee and uploading package"
$env:WORKBOT_USER = $User
$env:WORKBOT_PASSWORD = $Password
$env:WORKBOT_URL = $Url

$workbotArgs = @(
    "tools\workbot_acceptance.mjs",
    "--node-modules", $NodeModules,
    "--zip", $Package,
    "--python", $Python,
    "--out-dir", $OutDir,
    "--idle-after-stop-ms", "$IdleAfterStopMs",
    "--cases", "install",
    "--max-digital-employees", "$MaxDigitalEmployees",
    "--fresh-agent"
)
if (![string]::IsNullOrWhiteSpace($FreshAgentPrefix)) {
    $workbotArgs += @("--fresh-agent-prefix", $FreshAgentPrefix)
}
if ($Headless) {
    $workbotArgs += "--headless"
}

& $Node @workbotArgs
if ($LASTEXITCODE -ne 0) {
    throw "WorkBot initialization failed. Check the JSON report under $OutDir."
}

Write-Host "Done. The latest WorkBot report is under $OutDir."
