---
name: ad-check-analysis
description: 深信服 AD 设备系统巡检技能，支持标准巡检和全量巡检，自动执行巡检任务、下载巡检报告并分析巡检结果，生成健康评估报告。当用户提到"巡检"、"系统巡检"、"AD巡检"、"健康检查"、"巡检分析"、"全量巡检"、"标准巡检"时触发。
version: "2.0.0"
updated_at: "2026-05-21"
---

# AD 巡检分析

深信服 AD 设备系统巡检技能。

## 适用场景

- 需要对 AD 设备进行系统性健康检查（CPU/内存/磁盘/风扇/电源/网口）
- 需要在升级前验证设备环境是否满足要求
- 需要定期执行合规性检查并生成报告
- 需要排查硬件或软件相关故障
- 需要生成标准格式的巡检分析报告

## 不适用场景

- 需要实时异常检测和流量趋势分析 → 使用 **ad-perception**
- 需要导出审计日志和系统日志进行深度回溯 → 使用 **ad-blackbox-analysis**
- 需要查看设备总览快照（VS 列表、证书、硬件信息） → 使用 **ad-ops** overview
- 需要 LLM 直接调用 AD API → 必须使用本技能脚本，禁止直调 API

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

# 多设备巡检（并行启动，逐台轮询）
python scripts/check.py run --hosts "https://192.168.8.30,https://192.168.8.31" --scene "标准巡检" --password xxx --force

# 多设备巡检（同步等待，需平台超时充足）
python scripts/check.py run --hosts "https://192.168.8.30,https://192.168.8.31" --scene "标准巡检" --password xxx --force --wait

# 轮询进度（单设备）
python scripts/check.py progress --host https://192.168.8.30

# 轮询进度（多设备并行查询）
python scripts/check.py progress --hosts "https://192.168.8.30,https://192.168.8.31" --password xxx

# 等待完成+下载+分析
python scripts/check.py wait --host https://192.168.8.30 --work-dir /tmp/ad_check_xxx

# 查看历史（单设备）
python scripts/check.py history --host https://192.168.8.30

# 查看历史（多设备）
python scripts/check.py history --hosts "https://192.168.8.30,https://192.168.8.31" --password xxx

# 分析本地报告
python scripts/check.py analyze --path /tmp/ad_check_xxx
```

## 脚本强制规则

| 操作 | 必须使用 | 禁止使用 |
|------|----------|----------|
| 查看场景 | `python scripts/check.py scenes` | ❌ 直接调 API |
| 启动巡检 | `python scripts/check.py run` | ❌ 直接调 POST |
| 多设备巡检 | `python scripts/check.py run --hosts "..."` | ❌ 循环调用单设备 |
| 轮询进度 | `python scripts/check.py progress` | ❌ 直接调 `type=progress` |
| 轮询+下载 | `python scripts/check.py wait` | ❌ 手动查 history + download |
| 查询历史 | `python scripts/check.py history` | ❌ 直接调 `type=history` |
| 多设备历史 | `python scripts/check.py history --hosts "..."` | ❌ 循环调用单设备 |
| 分析报告 | `python scripts/check.py analyze` | ❌ 手动解析 |

## 已知设备

> 权威来源: 项目根目录 `devices.json`。密码通过 `password_from` 引用环境变量，禁止明文存储。

| 设备名 | IP 地址 | 用户名 |
|--------|---------|--------|
| AD1 | 192.168.8.30 | admin |
| AD2 | 192.168.8.31 | admin |

### 多设备子命令支持

| 子命令 | 多设备 | 说明 |
|--------|--------|------|
| `run` | ✅ | `--hosts` 并行启动多台，默认异步（需 `--wait` 同步） |
| `scenes` | ❌ | 无意义（场景列表是设备相关的） |
| `progress` | ✅ | `--hosts` 并行查询多台进度 |
| `history` | ✅ | 并行查询多台历史 |
| `analyze` | ❌ | 用 `--path` 不连设备 |

## 子命令选择决策

### 任务 → 命令映射

| 任务 | 命令 | 关键参数 |
|------|------|----------|
| 查看可用巡检场景 | `check.py scenes` | `--host`（不支持 `--hosts`） |
| 启动巡检（单设备） | `check.py run --host ...` | `--scene`, `--force` |
| 启动巡检（多设备异步） | `check.py run --hosts "..."` | `--scene`, `--force` |
| 启动巡检（多设备同步等待） | `check.py run --hosts "..." --wait` | `--scene`, `--force` |
| 查询巡检进度（单设备） | `check.py progress --host ...` | — |
| 查询巡检进度（多设备） | `check.py progress --hosts "..."` | `--password` |
| 下载分析巡检报告 | `check.py wait --host ...` | `--work-dir` |
| 查看历史记录（单设备） | `check.py history --host ...` | — |
| 查看历史记录（多设备） | `check.py history --hosts "..."` | `--password` |
| 分析本地巡检报告 | `check.py analyze --path ...` | `--host`, `--scene`（可选覆盖） |

### 多设备触发

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`（单台设备行为与 `--host` 等价）
4. 密码不同时 → 必须用 `--devices` JSON 文件

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

**LLM 必须严格遵循以下步骤，全程使用脚本，禁止直接调 API。**

#### 第 1 步：确认巡检场景

- 用户明确指定场景 → 直接使用
- 用户未指定 → 调用 `scenes` 获取可用场景列表，展示给用户选择

#### 第 2 步：检查巡检记录上限

- `run` 命令自动检查并输出结论，`=5 条` 时询问用户是否强制巡检（`--force`）

#### 第 3 步：启动巡检（立即退出）

```bash
# 多设备（推荐），AD1_ADDR/AD2_ADDR 从已知设备表查完整 URL
python scripts/check.py run --hosts "https://AD1_ADDR,https://AD2_ADDR" --password xxx --scene "标准巡检" [--force]
# 返回 work_dir 列表，LLM 记录每台设备对应的 work_dir

# 单设备
python scripts/check.py run --host https://AD_ADDR --password xxx --scene "标准巡检" [--force]
```

**启动后立即退出**，巡检在设备后台执行。脚本输出 `work_dir` 路径（如 `/tmp/ad_check_https___192.168.8.30`）。**`--host`/`--hosts` 必须传完整 URL，脚本不解析设备名。**

#### 第 4 步：轮询进度（每 10s）

```bash
# 所有设备一起查（推荐）
python scripts/check.py progress --hosts "https://AD1_ADDR,https://AD2_ADDR" --password xxx

# 或逐台查
python scripts/check.py progress --host https://AD_ADDR --password xxx
```

轮询直到每台设备的 `state` 变为 `"FINISHED"`。如果 `state=="NO_RUNNING"`，查看返回的 `history_latest.finished` 字段判断是否已完成。

#### 第 5 步：下载分析

```bash
# 每台设备用其对应的 work_dir（第 3 步返回的）
python scripts/check.py wait --host https://AD1_ADDR --work-dir /tmp/ad_check_xxx
python scripts/check.py wait --host https://AD2_ADDR --work-dir /tmp/ad_check_yyy
```

`wait` 检查一次即返回（默认 `max_attempts=1`）。如果 `_is_new_report` 未通过（报告尚未生成或被其他会话的报告覆盖），会报错提示重试。LLM 应先通过 `progress` 确认完成后再调 `wait`。

#### 第 6 步：展示报告

脚本输出完整 Markdown，LLM 原样展示在对话中，不截断、不折叠。

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

- 多设备输出含汇总表 + 每设备分块，可能较长
- LLM 全文展示，不截断、不折叠、不选择性展示
- 超过单条消息限制时分多条展示（保持设备分块完整）

## 外部依赖

| 依赖 | 说明 |
|------|------|
| `scripts/ad_api.py` | 提供 `ADClient`（API 调用） |
| 巡检报告 ZIP | 包含 `ad.json`，由 `wait` 自动下载解压 |

## 错误码

| 场景 | exit code |
|------|----------|
| 完全成功 | 0 |
| 连接/API 失败 | 1 |
| 认证失败 | 2 |
| 参数错误 | 4 |
| 部分失败 | 5 |
| **多设备部分失败** | **7** |
| ADClient import 失败 | 9 |

## 模板文件

- 示例输入：[examples/input.md](examples/input.md)
- 期望输出：[examples/output.md](examples/output.md)
- 回归清单：[checks/checklist.md](checks/checklist.md)

## 相关技能

- **ad-ops**: AD 智能运维（用户管理、虚拟服务、SSH配置等）
- **ad-blackbox-analysis**: AD 黑盒日志分析
- **ad-perception**: AD 感知分析
