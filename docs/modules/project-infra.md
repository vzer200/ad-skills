# 项目基础设施

## 概述

项目根目录和全局基础设施，包括设备配置、测试、环境设置等。

## 根目录结构

```
D:\workSpace\
├── CLAUDE.md                    # Claude Code 项目指令（Git/Python/Skill引用）
├── devices.json                 # 设备配置（权威来源）
├── .gitignore
├── .claude/
│   ├── skills/                  # 4 个 AD skill（见 skills.md）
│   ├── worktrees/               # 临时 git worktree
│   ├── success/                 # 成功记录缓存
│   └── scheduled_tasks.json    # 持久化定时任务
├── test/                        # 顶层测试（skill 脚本的单元测试）
├── docs/
│   └── modules/                 # 模块文档（本目录）
└── AD-agent/                    # AD Agent 子系统（见 ad-agent.md）
```

## 设备配置

`devices.json` 是项目内所有设备信息的权威来源：

```json
{
  "devices": [
    {"name": "AD1", "host": "https://192.168.8.30", "user": "admin", "password_from": "AD1_PASS"},
    {"name": "AD2", "host": "https://192.168.8.31", "user": "admin", "password_from": "AD2_PASS"}
  ]
}
```

密码通过 `password_from` 引用环境变量，禁止明文存储。

## 测试

### Skill 脚本测试（`test/`）

| 文件 | 覆盖 |
|------|------|
| `test_ad_api.py` | ad_api.py 的 ADClient |
| `test_overview.py` | overview.py 设备总览 |
| `test_check.py` | check.py 巡检流程 |
| `test_perception.py` | perception.py 感知分析 |
| `test_collector.py` | collector.py 采集器 |
| `test_blackbox.py` | blackbox.py 黑盒导出 |
| `test_multi_device.py` | 多设备模式 |
| `run_all.py` | 一键运行全部测试 |

运行方式：
```powershell
& "$env:USERPROFILE\.local\bin\python3.14.exe" -m unittest discover -s test -p "test_*.py" -v
```

### AD Agent 测试（`AD-agent/tests/`）

使用 pytest，覆盖设备管理、会话管理、加密、API、E2E 等。

## 开发环境

### Git

| 项目 | 值 |
|------|-----|
| 仓库 | https://github.com/vzer200/ad-skills |
| 主分支 | `feature/architecture-consolidation` |
| Remote | `origin` |
| 代理 | `gh-proxy.com`（git 全局 insteadOf `https://github.com/`） |
| 凭据 | Windows Credential Manager（`credential.helper = manager`） |

### Python

Python 3.14.5 via uv，路径：`%USERPROFILE%\.local\bin\python3.14.exe`

## 模块文档索引

| 文档 | 说明 |
|------|------|
| [skills.md](skills.md) | 4 个 AD skill 的完整说明 |
| [ad-agent.md](ad-agent.md) | AD Agent 前后端系统 |
| [project-infra.md](project-infra.md) | 本文件（基础设施） |
