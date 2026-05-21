# AD Skills Project

## Git

| 项目 | 值 |
|------|-----|
| 仓库 | https://github.com/vzer200/ad-skills |
| 主分支 | `feature/architecture-consolidation` |
| Remote | `origin` |
| 代理 | `gh-proxy.com`（全局 insteadOf `https://github.com/`） |
| 凭据 | Windows Credential Manager（`credential.helper = manager`） |

```powershell
# 推送
git push origin feature/architecture-consolidation

# 查看状态
git status
```

## Python

Python 3.14.5 is installed via uv at: `%USERPROFILE%\.local\bin\python3.14.exe`

```powershell
& "$env:USERPROFILE\.local\bin\python3.14.exe" -m unittest discover -s test -p "test_*.py" -v
```
