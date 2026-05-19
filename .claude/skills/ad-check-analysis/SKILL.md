---
name: ad-check-analysis
description: 深信服 AD 设备系统巡检技能，支持标准巡检和全量巡检，自动执行巡检任务、下载巡检报告并分析巡检结果，生成健康评估报告。当用户提到"巡检"、"系统巡检"、"AD巡检"、"健康检查"、"巡检分析"、"全量巡检"、"标准巡检"时触发。
---

# AD 巡检分析

深信服 AD 设备系统巡检技能。

## 功能概述

| 功能 | 说明 |
|------|------|
| 巡检场景查询 | 获取可用的巡检场景列表 |
| 执行巡检 | 触发标准巡检或全量巡检 |
| 进度查询 | 查询巡检任务执行进度 |
| 报告下载 | 下载巡检结果报告 |
| 结果分析 | 解析巡检报告并生成分析结论 |

## 已知设备

| 设备名 | IP 地址 | 用户名 | 密码 |
|--------|---------|--------|------|
| AD1 | 192.168.8.30 | admin | root1234+ |
| AD2 | 192.168.8.31 | admin | root1234++ |

## ⚠️ 巡检场景选择规则

**必须严格遵循以下流程：**

1. **用户明确指定场景** → 直接执行对应巡检
2. **用户未指定场景** → 调用 API 获取可用巡检场景列表，展示给用户选择后再执行

**获取巡检场景 API：**
```
GET /api/lb/current-version/sys/offline-check
```
返回 `items` 列表中的 `name` 字段即为可用场景。

**示例响应：**
```json
{
  "items": [
    {"name": "标准巡检", ...},
    {"name": "全量巡检", ...},
    {"name": "安全巡检", ...}
  ]
}
```

**示例：**

| 用户请求 | 处理方式 |
|----------|----------|
| "对AD728进行标准巡检" | 直接执行标准巡检 |
| "对AD728进行巡检" | 调用 API 获取场景列表，等待用户选择 |
| "对AD728进行全量巡检" | 直接执行全量巡检 |

---

## 🔄 巡检记录限制

- **最大保存数**: 5 条
- **超过限制**: 必须使用 `force=true` URL 参数强制巡检（会删除最早的报告）
- **强制巡检前**: 必须先征得用户同意
- ⚠️ **`total_items` 字段说明**：查询巡检历史记录时，返回的 `total_items` 字段代表的是巡检记录的上限值（固定为 5），而非当前已有记录数。判断记录数量应使用 `items` 数组的长度 `len(items)`

---

## ⚠️ 巡检数据来源规则

- **必须使用实时 API 数据**，禁止使用历史缓存数据
- 每次巡检都要重新调用 API 获取最新结果

---

## 🔄 巡检异步任务机制

### API 端点

`/api/lb/current-version/debug/sys/offline-check`

### 巡检参数说明

| 参数 | 位置 | 说明 |
|------|------|------|
| `scene` | 请求体 JSON | 巡检场景名称（从 API 获取） |
| `force=true` | **URL 参数** | 强制巡检（超过5条记录时使用） |

| type 参数 | 说明 |
|-----------|------|
| `type=progress` | 查询巡检进度，返回 state, finished, total |
| `type=history` | 查询历史巡检记录，返回记录列表，含 name, start_time |
| `type=download&key={name}&encrypt=false` | 下载巡检报告，key 为记录的 name 字段值 |

---

### 巡检执行步骤

**必须严格遵循以下步骤：**

#### 第 1 步：确认巡检场景

- 用户明确指定场景 → 直接使用
- 用户未指定 → 调用 `scenes` 获取可用场景列表，展示给用户选择

#### 第 2 步：检查巡检记录上限

- 调用 `python scripts/check.py run` 时，脚本内部自动完成上限检查并输出结论
- 脚本输出格式：`[步骤 2] 巡检记录: N/5 (未达上限，可直接执行)` 或 `[步骤 2] 巡检记录: 5/5 (已达上限，需 --force)`
- **判断数量用 `len(items)`**，`total_items` 字段代表上限值（固定5），不是当前记录数
- **< 5 条** → 直接进入第 3 步
- **= 5 条** → 询问用户是否执行强制巡检（`--force`，会删除最早的一条记录），用户确认后再进入第 3 步
- ⚠️ **信任脚本输出的结论，不要自行解读 API 原始数据反复验证**

#### 第 3 步：后台启动巡检

- 调用 `python scripts/check.py run`（步骤 1 + 2 + 3 合一）
- `run` 会检查场景、上限，然后 POST 启动巡检
- 启动后**立即退出**，返回 `event_id` 和 `work_dir`
- 巡检在设备后台运行，不阻塞

#### 第 4 步：轮询进度（每 10s 反馈）

- 调用 `python scripts/check.py progress --host ...` 轮询进度
- 每次查询后向用户反馈当前状态和进度（如 `RUNNING 22/35` 等）
- **注意**：`type=progress` 在某些设备上始终返回 `NO_RUNNING`（不可靠）
- 备用方案：通过 `python scripts/check.py history` 查看历史记录判断新报告是否生成

#### 第 5 步：下载报告

- 调用 `python scripts/check.py wait --host ... --work-dir /tmp/ad_check_xxx`
- `wait` 会轮询直到检测到新报告出现（通过 `start_time` + `end_time` 判断）
- 自动完成：下载 ZIP → 解压 → 保存元数据 `_meta.json`
- 完成后输出 Markdown 分析报告

---

## 📋 巡检进度状态

| 状态 | 说明 |
|------|------|
| `NO_RUNNING` | 无巡检任务运行 |
| `WAITING` | 巡检任务等待执行 |
| `RUNNING` | 巡检任务执行中 |
| `FINISHED` | 巡检任务完成 |

---

## 📁 巡检报告结构

巡检报告下载后是一个 ZIP 文件，解压后包含 `ad.json` 文件：

```json
{
  "check_time": "2026-05-09 10:26:16",
  "device_info": {
    "ad_version": "SANGFOR-MSDN-AD-7.0.28",
    "gateway_id": "8F4CDD45",
    "run_time": "218天23小时33分钟"
  },
  "feature_scene": {
    "rule": ["APP_VERSION_CHECK", "ADMIN_ROLE_CHECK", ...]
  },
  "health_scene": {
    "rule": ["CPU_CHECK", "MEMORY_CHECK", ...]
  },
  "secure_scene": {
    "rule": ["SSH_CHECK", "WEAK_PASSWORD_CHECK", ...]
  },
  "check_results": {
    "cpu_check": { "status": "pass", "value": "17%" },
    "memory_check": { "status": "pass", "value": "42%" },
    ...
  }
}
```

---

## 🔍 巡检结果分析

### 功能巡检项

| 检查项 | 说明 |
|--------|------|
| APP_VERSION_CHECK | APP 版本检查 |
| ADMIN_ROLE_CHECK | 管理员角色检查 |
| HEARTBEAT_ERROR_CHECK | 心跳错误检查 |
| DEVICE_SAFE_CHECK | 设备安全检查 |

### 健康巡检项

| 检查项 | 说明 |
|--------|------|
| CPU_CHECK | CPU 检查 |
| MEMORY_CHECK | 内存检查 |
| DISK_CHECK | 磁盘检查 |
| NIC_STATE_CHECK | 网卡状态检查 |
| FAN_STATE_CHECK | 风扇状态检查 |
| POWER_STATE_CHECK | 电源状态检查 |
| KERNEL_LOG_CHECK | 内核日志检查 |

### 安全巡检项

| 检查项 | 说明 |
|--------|------|
| SSH_CHECK | SSH 检查 |
| WEAK_PASSWORD_CHECK | 弱密码检查 |
| SSL_POLICY_CHECK | SSL 策略检查 |
| IP_LIMIT_CHECK | IP 限制检查 |
| OPEN_PORT_CHECK | 开放端口检查 |

---

## ⚠️ 重要行为准则

### 脚本强制使用规则

**所有巡检操作必须通过本技能下的 `scripts/check.py` 脚本完成，严禁直接调用 AD API。**

| 操作 | 必须使用 | 禁止使用 |
|------|----------|----------|
| 查看场景 | `python scripts/check.py scenes` | ❌ `http_request` 直接调 API |
| 启动巡检 | `python scripts/check.py run` | ❌ 直接调 POST |
| 轮询进度 | `python scripts/check.py progress` | ❌ 直接调 `type=progress` |
| 轮询+下载 | `python scripts/check.py wait` | ❌ 手动查 history + download |
| 查询历史 | `python scripts/check.py history` | ❌ 直接调 `type=history` |
| 分析报告 | `python scripts/check.py analyze` | ❌ 手动解析 |

- ✅ 一律通过 `scripts/check.py` 子命令完成
- ❌ 禁止使用 `http_request`、`shell` curl 或其他方式直接调 AD API
- ❌ 禁止使用 ad-ops 的 `ad_api.py` 来完成巡检操作

### 巡检场景匹配

**当用户请求执行巡检时，必须先调用 `scenes` 子命令获取巡检场景列表进行匹配。**

### 巡检分析原则

**巡检分析必须严格从巡检执行后获取的巡检结果文件分析得来，不得掺杂其他 API 调用或推断内容。**

正确流程：
```
1. 启动巡检 → python scripts/check.py run --host ... --scene ... --force
2. 轮询进度 → python scripts/check.py progress --host ...  （可多次调用）
3. 等待完成 → python scripts/check.py wait --host ... --work-dir /tmp/ad_check_xxx
              （自动检测完成 → 下载报告 → 解压 → 输出 Markdown 报告）
```

禁止行为：
- ❌ 混合其他 API 调用结果（用户列表、虚拟服务等）
- ❌ 基于场景定义推断检查项状态
- ❌ 填充未从巡检报告中获取的数据

必须行为：
- ✅ 仅使用巡检报告返回的数据
- ✅ 明确标注数据来源
- ✅ 如报告缺少某些信息，如实说明

### 报告展示规则

**巡检完成后，必须将 Markdown 报告内容直接展示在对话消息正文中，不要放在 shell 执行结果的折叠区域中。**

- ✅ 正确：执行脚本获取结果后，将 Markdown 内容写在对话消息中直接展示
- ❌ 错误：把报告内容留在 shell 执行结果中，仅在对话中写"巡检完成"

---

## 🛠️ CLI 命令

```bash
# 查看巡检场景
python scripts/check.py scenes --host https://192.168.8.30

# 启动巡检（步骤 1-3 合一，立即退出）
python scripts/check.py run --host https://192.168.8.30 --scene "标准巡检" --force

# 轮询进度（由 skill 层每 10s 调用一次）
python scripts/check.py progress --host https://192.168.8.30

# 等待完成并下载+分析（步骤 4-6 合一）
# --work-dir 必须与 run 的 --output 一致
python scripts/check.py wait --host https://192.168.8.30 --work-dir /tmp/ad_check_xxx

# 查看历史巡检记录
python scripts/check.py history --host https://192.168.8.30

# 分析本地报告（可单独使用）
python scripts/check.py analyze --path /tmp/ad_check_xxx
```

---

## 📝 分析报告模板

```markdown
## ✅ AD 巡检分析报告

**设备**: {设备名} ({IP地址})
**巡检时间**: {巡检时间}
**巡检场景**: {场景名称}
**检查项**: {总数} 项

---

### 📊 设备基本信息

| 项目 | 值 |
|------|-----|
| AD 版本 | {版本号} |
| 网关 ID | {ID} |
| 运行时间 | {运行时间} |

---

### 🔍 巡检结果详情

#### ✅ 正常项

| 检查项 | 状态 | 说明 |
|--------|------|------|
| ... | ✅ 正常 | ... |

#### ⚠️ 异常项

| 检查项 | 状态 | 详情 |
|--------|------|------|
| ... | ⚠️ 异常 | ... |

---

### 📈 统计汇总

| 类别 | 检查项数 | 通过 | 异常 | 通过率 |
|------|----------|------|------|--------|
| 功能巡检 | N | N | N | N% |
| 健康巡检 | N | N | N | N% |
| 安全巡检 | N | N | N | N% |

---

### 💡 优化建议

| 优先级 | 建议 |
|--------|------|
| 🔴 高 | ... |
| 🟡 中 | ... |
| 🟢 低 | ... |

---

### ✅ 健康评分

| 项目 | 评分 |
|------|------|
| 系统稳定性 | N/100 |
| 硬件健康 | N/100 |
| 安全配置 | N/100 |
| **综合评分** | **N/100** |

---

**说明**: 以上结果全部来自巡检报告文件 `ad.json`，严格按照巡检返回数据进行分析。
```

---

## 🔗 相关技能

- **ad-ops**: AD 智能运维（用户管理、虚拟服务、SSH配置等）
- **ad-blackbox-analysis**: AD 黑盒日志分析
