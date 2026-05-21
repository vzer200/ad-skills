---
name: ad-check-analysis
description: 深信服 AD 设备系统巡检技能，支持标准巡检、安全巡检和全量巡检，自动执行巡检任务、下载巡检报告并分析巡检结果，生成健康评估报告。当用户提到"巡检"、"系统巡检"、"AD巡检"、"健康检查"、"巡检分析"、"全量巡检"、"标准巡检"、"安全巡检"时触发。
version: "2.1.0"
updated_at: "2026-05-21"
---

# AD 巡检分析

深信服 AD 设备系统巡检技能。

---

## 工作流决策树

> **LLM 必须严格按以下决策树执行，禁止跳过任何步骤。**

### 步骤 0：判断单设备 / 多设备

| 用户输入特征 | 判定 | 执行流程 |
|-------------|------|---------|
| 提到单个 IP / 单个设备名（如 "AD1"、"192.168.8.30"） | **单设备** | → [流程 A](#流程-a单设备巡检) |
| 未提及任何设备 | **单设备** | → [流程 A](#流程-a单设备巡检)，需额外询问设备 |
| 提到多个 IP / 多个设备名 / "所有" / "全部" / "批量" / "都" | **多设备** | → [流程 B](#流程-b多设备巡检) |

---

### 流程 A：单设备巡检

#### A1. 确定设备 【必须】

- 用户指定了设备（IP 或设备名如 "AD1"）→ 直接使用，从 [已知设备](#已知设备) 查完整 URL
- 用户未指定 → **【询问用户】** 要巡检哪台设备，列出已知设备供选择

#### A2. 确定场景 【必须】

- 用户消息中包含场景关键词（"标准"、"安全"、"全量"）→ 直接使用
- 用户未指定 → **【询问用户】**：
  > "将对 {设备名} 执行**标准巡检**。可选场景：标准巡检 / 安全巡检 / 全量巡检。是否继续？"
  - 确认 → 使用标准巡检，进入 A3
  - 修改 → 让用户选择其他场景，进入 A3
  - 取消 → 终止流程

#### A3. 检查历史记录 【必须】

调用 `check.py history` 查询历史记录：

```bash
python scripts/check.py history --host https://IP --password xxx
```

- `len(items) < 5` → 直接进入 A4（**不带 `--force`**）
- `len(items) == 5` → **【询问用户】**：
  > "巡检记录已达 5 条上限，强制巡检会删除最早一条记录。是否继续？"
  - 同意 → 带 `--force` 进入 A4
  - 拒绝 → 终止流程

#### A4. 启动巡检 【必须】

```bash
python scripts/check.py run --host https://IP --password xxx --scene "场景名" [--force]
```

记录返回的 `work_dir` 路径。

#### A5. 轮询进度 【必须】

每 10s 调用，直到 `state` 变为 `FINISHED`：

```bash
python scripts/check.py progress --host https://IP --password xxx
```

#### A6. 下载分析 【必须】

```bash
python scripts/check.py wait --host https://IP --work-dir <A4返回的路径>
```

#### A7. 展示报告 【必须】

脚本输出的 Markdown **全文展示**在对话中，不截断、不折叠。

---

### 流程 B：多设备巡检

#### B1. 确定设备列表 【必须】

- 用户指定了设备（IP/设备名列表、"所有"、"全部"等）→ 从 [已知设备](#已知设备) 解析
- 用户未指定 → **自动从 `devices.json` 读取所有已知设备**
- 只有 1 台设备 → **降级为 [流程 A](#流程-a单设备巡检)**

#### B2. 确定场景 【必须】

- 用户指定了场景 → 直接使用
- 用户未指定 → **默认标准巡检，直接执行**（不需要确认）
- 所有设备**统一使用同一种场景**，不支持混用

#### B3. 启动巡检 【必须】

多设备不查历史记录，直接带 `--force`：

```bash
python scripts/check.py run --hosts "https://IP1,https://IP2" --password xxx --scene "场景名" --force
```

记录每台设备返回的 `work_dir`。

#### B4. 轮询进度 【必须】

每 10s 并行查询所有设备：

```bash
python scripts/check.py progress --hosts "https://IP1,https://IP2" --password xxx
```

轮询直到每台设备 `state` 变为 `FINISHED`。

#### B5. 下载分析 【必须】

每台设备分别调用：

```bash
python scripts/check.py wait --host https://IP1 --work-dir <B3返回的work_dir1>
python scripts/check.py wait --host https://IP2 --work-dir <B3返回的work_dir2>
```

#### B6. 展示报告 【必须】

多设备报告含汇总表 + 每设备详细报告，**全文展示**在对话中，不截断、不折叠。

---

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
| 巡检场景查询 | 获取可用巡检场景列表（标准巡检 / 安全巡检 / 全量巡检） |
| 执行巡检 | 触发标准巡检、安全巡检或全量巡检 |
| 进度查询 | 查询巡检任务执行进度 |
| 报告下载 | 下载并解压巡检报告 |
| 结果分析 | 解析 ad.json 并产出 Markdown 报告 |

## CLI 命令参考

> 以下为命令参考。LLM 执行时必须遵循上方 [工作流决策树](#工作流决策树)，不得跳过交互步骤直接调命令。

```bash
# 查看巡检场景
python scripts/check.py scenes --host https://192.168.8.30

# 启动巡检（单设备）
python scripts/check.py run --host https://192.168.8.30 --scene "标准巡检" --force

# 多设备巡检（并行启动）
python scripts/check.py run --hosts "https://192.168.8.30,https://192.168.8.31" --scene "标准巡检" --password xxx --force

# 多设备巡检（同步等待，需平台超时充足）
python scripts/check.py run --hosts "https://192.168.8.30,https://192.168.8.31" --scene "标准巡检" --password xxx --force --wait

# 轮询进度（单设备）
python scripts/check.py progress --host https://192.168.8.30

# 轮询进度（多设备并行查询）
python scripts/check.py progress --hosts "https://192.168.8.30,https://192.168.8.31" --password xxx

# 下载分析
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

## 行为准则

### 必须行为
- ✅ 必须按 [工作流决策树](#工作流决策树) 逐步执行，禁止跳过交互步骤
- ✅ 所有操作通过 `scripts/check.py` 子命令
- ✅ 巡检分析仅使用巡检报告返回的数据
- ✅ 报告内容直接展示在对话消息正文中

### 禁止行为
- ❌ LLM 直调 AD API（包括 http_request、curl 等）
- ❌ 混合其他 API 调用结果（用户列表、虚拟服务等）
- ❌ 基于场景定义推断检查项状态
- ❌ 填充未从巡检报告中获取的数据
- ❌ 使用 ad-ops 的 `ad_api.py` 来完成巡检操作
- ❌ 脚本返回异常/报错时，LLM 不得尝试绕过脚本、换用其他方式、或自行补救。必须原样将错误信息报告给用户，由用户决定下一步操作

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
- 期望输出（多设备）：[examples/output-multi.md](examples/output-multi.md)
- 回归清单：[checks/checklist.md](checks/checklist.md)

## 相关技能

- **ad-ops**: AD 智能运维（用户管理、虚拟服务、SSH配置等）
- **ad-blackbox-analysis**: AD 黑盒日志分析
- **ad-perception**: AD 感知分析
