---
name: ad-check-analysis
description: 深信服 AD 设备系统巡检技能，支持标准巡检和全量巡检，自动执行巡检任务、下载巡检报告并分析巡检结果，生成健康评估报告。当用户提到"巡检"、"系统巡检"、"AD巡检"、"健康检查"、"巡检分析"、"全量巡检"、"标准巡检"时触发。
---

# AD 巡检分析

深信服 AD 设备系统巡检技能。

## 功能概述

| 功能 | 说明 |
|------|------|
| 巡检场景查询 | 获取可用巡检场景列表 |
| 执行巡检 | 触发标准巡检或全量巡检 |
| 进度查询 | 查询巡检任务执行进度 |
| 报告下载 | 下载并解压巡检报告 |
| 结果分析 | 解析 ad.json 并产出 Markdown 报告 |

## CLI 命令参考

```bash
# 查看巡检场景
python scripts/check.py scenes --host https://192.168.8.30

# 启动巡检（步骤 1-3 合一）
python scripts/check.py run --host https://192.168.8.30 --scene "标准巡检" --force

# 轮询进度
python scripts/check.py progress --host https://192.168.8.30

# 等待完成+下载+分析
python scripts/check.py wait --host https://192.168.8.30 --work-dir /tmp/ad_check_xxx

# 查看历史
python scripts/check.py history --host https://192.168.8.30

# 分析本地报告
python scripts/check.py analyze --path /tmp/ad_check_xxx
```

## 脚本强制规则

| 操作 | 必须使用 | 禁止使用 |
|------|----------|----------|
| 查看场景 | `python scripts/check.py scenes` | ❌ 直接调 API |
| 启动巡检 | `python scripts/check.py run` | ❌ 直接调 POST |
| 轮询进度 | `python scripts/check.py progress` | ❌ 直接调 `type=progress` |
| 轮询+下载 | `python scripts/check.py wait` | ❌ 手动查 history + download |
| 查询历史 | `python scripts/check.py history` | ❌ 直接调 `type=history` |
| 分析报告 | `python scripts/check.py analyze` | ❌ 手动解析 |

## 已知设备

| 设备名 | IP 地址 | 用户名 | 密码 |
|--------|---------|--------|------|
| AD1 | 192.168.8.30 | admin | root1234+ |
| AD2 | 192.168.8.31 | admin | root1234++ |

## 行为准则

### 必须行为
- ✅ 所有操作通过 `scripts/check.py` 子命令
- ✅ 巡检分析仅使用巡检报告返回的数据
- ✅ 报告内容直接展示在对话消息正文中

### 禁止行为
- ❌ LLM 直调 AD API（包括 http_request、curl 等）
- ❌ 混合其他 API 调用结果（用户列表、虚拟服务等）
- ❌ 基于场景定义推断检查项状态
- ❌ 填充未从巡检报告中获取的数据
- ❌ 使用 ad-ops 的 `ad_api.py` 来完成巡检操作

---

## 巡检场景选择规则

1. **用户明确指定场景** → 直接执行对应巡检
2. **用户未指定场景** → 调用 `scenes` 获取可用场景列表，展示给用户选择后再执行

获取场景 API: `GET /api/lb/current-version/sys/offline-check`，返回 `items[].name`。

---

## 巡检记录限制

- **最大保存数**: 5 条
- **超过限制**: 使用 `--force` 强制巡检（会删除最早的报告），需先征得用户同意
- ⚠️ `total_items` 是上限值（固定为 5），判断记录数量用 `len(items)`

---

## 巡检异步任务机制

### API 端点

`/api/lb/current-version/debug/sys/offline-check`

### 参数说明

| 参数 | 位置 | 说明 |
|------|------|------|
| `scene` | 请求体 JSON | 巡检场景名称 |
| `force=true` | URL 参数 | 强制巡检 |
| `type=progress` | URL 参数 | 查询进度 |
| `type=history` | URL 参数 | 查询历史 |
| `type=download&key={name}&encrypt=false` | URL 参数 | 下载报告 |

### 执行步骤

1. **确认场景**: 用户指定 → 直接使用；未指定 → 展示列表
2. **检查上限**: `run` 命令自动检查并输出结论，=5 条时询问用户
3. **启动巡检**: `run` 后台启动，返回 `event_id` 和 `work_dir`
4. **轮询进度**: `progress` 每 10s 轮询（某些设备 `type=progress` 不可靠时用 `history` 备用）
5. **下载分析**: `wait` 自动轮询 → 下载 ZIP → 解压 → 输出 Markdown 报告

### 进度状态

| 状态 | 说明 |
|------|------|
| `NO_RUNNING` | 无巡检任务运行 |
| `WAITING` | 巡检任务等待执行 |
| `RUNNING` | 巡检任务执行中 |
| `FINISHED` | 巡检任务完成 |

---

## 巡检报告结构

```json
{
  "check_time": "2026-05-09 10:26:16",
  "device_info": { "ad_version": "...", "gateway_id": "...", "run_time": "..." },
  "feature_scene": { "rule": [...] },
  "health_scene": { "rule": [...] },
  "secure_scene": { "rule": [...] },
  "check_results": { "cpu_check": {"status": "pass", "value": "17%"}, ... }
}
```

## 巡检结果分析

### 功能巡检项

APP_VERSION_CHECK, ADMIN_ROLE_CHECK, HEARTBEAT_ERROR_CHECK, DEVICE_SAFE_CHECK

### 健康巡检项

CPU_CHECK, MEMORY_CHECK, DISK_CHECK, NIC_STATE_CHECK, FAN_STATE_CHECK, POWER_STATE_CHECK, KERNEL_LOG_CHECK

### 安全巡检项

SSH_CHECK, WEAK_PASSWORD_CHECK, SSL_POLICY_CHECK, IP_LIMIT_CHECK, OPEN_PORT_CHECK

---

## 报告展示规则

**巡检完成后，必须将 Markdown 报告内容直接展示在对话消息正文中**，不要放在 shell 执行结果的折叠区域中。

## 外部依赖

| 依赖 | 说明 |
|------|------|
| `scripts/ad_api.py` | 提供 `ADClient`（API 调用） |
| 巡检报告 ZIP | 包含 `ad.json`，由 `wait` 自动下载解压 |

## 错误码

| 场景 | exit code |
|------|----------|
| 完全成功 | 0 |
| 连接失败 | 1 |
| 全部 API 失败 | 1 |
| 认证失败 | 2 |
| SQLite 写入失败 | 3 |
| 参数错误 | 4 |
| 部分失败 | 5 |
| 采集器重复启动 | 6 |
| ADClient import 失败 | 9 |

## 相关技能

- **ad-ops**: AD 智能运维（用户管理、虚拟服务、SSH配置等）
- **ad-blackbox-analysis**: AD 黑盒日志分析
- **ad-perception**: AD 感知分析
