$ErrorActionPreference = "Stop"
$SkillDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Python = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if (-not (Test-Path $Python)) {
  $Python = "python"
}
& $Python (Join-Path $SkillDir "scripts\sangfor_cli.py") @args
