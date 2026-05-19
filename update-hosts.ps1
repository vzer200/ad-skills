$ErrorActionPreference = 'Stop'
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$appendFile = 'D:\workSpace\github-hosts-append.txt'
$logPath = 'D:\workSpace\update-hosts.log'
$backupPath = "$hostsPath.bak.$(Get-Date -Format 'yyyyMMdd-HHmmss')"

function Log($msg) {
    "[$(Get-Date -Format 'HH:mm:ss')] $msg" | Add-Content -Path $logPath -Encoding UTF8
}

if (Test-Path $logPath) { Remove-Item $logPath -Force }
"=== update-hosts started ===" | Out-File $logPath -Encoding UTF8

try {
    Log "Backup hosts -> $backupPath"
    Copy-Item -Path $hostsPath -Destination $backupPath -Force

    Log "Read current hosts content"
    $current = ''
    for ($i = 0; $i -lt 10; $i++) {
        try {
            $fs = [System.IO.File]::Open($hostsPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
            $sr = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8)
            $current = $sr.ReadToEnd()
            $sr.Close(); $fs.Close()
            break
        } catch {
            Log "Read retry $i : $($_.Exception.Message)"
            Start-Sleep -Milliseconds 300
        }
    }

    if ($current -match '# === GitHub Hosts Start') {
        Log "Existing GitHub block detected; aborting to avoid duplicate. Edit hosts manually if needed."
        Log "SUCCESS (no-op: already configured)"
        exit 0
    }

    $appendContent = Get-Content -Path $appendFile -Raw -Encoding UTF8
    $newContent = $current
    if (-not $newContent.EndsWith("`n")) { $newContent += "`r`n" }
    $newContent += $appendContent
    if (-not $newContent.EndsWith("`n")) { $newContent += "`r`n" }

    Log "Write merged hosts (with retry, FileShare.ReadWrite)"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($newContent)
    $written = $false
    for ($i = 0; $i -lt 15; $i++) {
        try {
            $fs = [System.IO.File]::Open($hostsPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
            $fs.Write($bytes, 0, $bytes.Length)
            $fs.Flush()
            $fs.Close()
            $written = $true
            Log "Write OK on attempt $($i+1)"
            break
        } catch {
            Log "Write retry $i : $($_.Exception.Message)"
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $written) { throw "Failed to write hosts after retries" }

    Log "Flush DNS cache"
    ipconfig /flushdns | Out-Null

    Log "Verify github.com resolution"
    $resolved = Resolve-DnsName -Name github.com -Type A -ErrorAction SilentlyContinue | Where-Object Type -eq 'A'
    foreach ($r in $resolved) { Log "  github.com -> $($r.IPAddress)" }

    Log "SUCCESS"
} catch {
    Log "FAILED: $($_.Exception.Message)"
    exit 1
}
