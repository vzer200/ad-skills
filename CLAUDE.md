# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

深信服 AD（应用交付）设备的运维分析工具集，核心是以 `.claude/skills/` 下的 5 个 skill 脚本，覆盖设备巡检、感知分析、黑盒日志、运维操作和连通性测试。

## 开发规范

**每次开发必须在隔离的 git worktree 中进行**，禁止直接在 master/main 分支上修改代码。使用 `superpowers:using-git-worktrees` skill 创建 worktree，开发完成后通过 `superpowers:finishing-a-development-branch` 合并回主分支并清理 worktree。

## 架构核心

**三层结构**：Skill 定义层 (SKILL.md) → 脚本执行层 (Python) → AD 设备 API 层

```
ad-ops/scripts/ad_api.py          # ADClient — 公共 API 客户端（被其他 skill import）
  ↑ import
  ├── ad-check-analysis/scripts/check.py
  ├── ad-perception/scripts/perception.py, collector.py
  ├── ad-blackbox-analysis/scripts/blackbox.py
  └── ad-connect/scripts/connect.py
```

**关键约束**：LLM 永不自写代码调用 AD API，只调度 `scripts/` 下的脚本并展示其输出。报告内容由脚本 `render_markdown()` 产出，LLM 原样展示，不做分析判断。统一错误码：0=成功, 1=连接失败, 2=认证失败, 4=参数错误, 5=部分失败, 7=多设备部分失败, 9=import 失败。

## Python 环境

Python 3.14.5 via uv，路径：`%USERPROFILE%\.local\bin\python3.14.exe`。包管理通过 uv，无 pyproject.toml（脚本直接 import 同目录模块）。

## 运行测试

```powershell
# 运行全部 skill 测试
& "$env:USERPROFILE\.local\bin\python3.14.exe" -m unittest discover -s test -p "test_*.py" -v

# 运行单个测试模块
& "$env:USERPROFILE\.local\bin\python3.14.exe" -m unittest test.test_ad_api -v

# 一键运行（Python 3.14+）
& "$env:USERPROFILE\.local\bin\python3.14.exe" test/run_all.py
```

## 设备配置

`devices.json` 是设备信息的权威来源。密码通过 `password_from` 字段引用环境变量，禁止明文存储密码。

## Skill 概览

| Skill | 脚本 | 职责 |
|-------|------|------|
| ad-ops | `ad_api.py`, `overview.py`, `multi_device.py` | 设备总览、VS/Pool/证书/HA/SSH/系统统计查询，提供公共 ADClient |
| ad-check-analysis | `check.py` | 标准/全量巡检，异步：启动→轮询→下载→分析 |
| ad-perception | `collector.py`, `perception.py`, `db_schema.py` | 流量 3σ 异常、状态阈值告警、IP:Port 冲突、日志关联 |
| ad-blackbox-analysis | `blackbox.py` | 黑盒日志导出（tar.gz）、audit.csv + 系统日志解析 |
| ad-connect | `connect.py` | 设备连通性和认证预检（其他 AD 操作的前置步骤） |

多设备统一用 `--hosts "host1 host2"` 参数。

## Git 提交规范

采用 Conventional Commits 1.0.0：`type(scope): subject`。类型：feat/fix/docs/refactor/test/chore/ci/perf/build/revert。Scope 为 skill 名（如 `ad-perception`、`ad-ops`）。Subject 祈使语气、中文、≤72 字符、不加句号。禁止 `git add -A` 全量暂存，禁止 `--no-verify`，禁止 AI 署名。

## 详细文档

| 模块 | 文档 |
|------|------|
| Skills 完整说明 | [docs/modules/skills.md](docs/modules/skills.md) |
| 项目基础设施 | [docs/modules/project-infra.md](docs/modules/project-infra.md) |
| Git 提交规范 | [docs/modules/git-commit-standard.md](docs/modules/git-commit-standard.md) |
| AD Agent（Web 运维代理） | [docs/modules/ad-agent.md](docs/modules/ad-agent.md) |
