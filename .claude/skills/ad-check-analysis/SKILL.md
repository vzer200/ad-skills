---
name: ad-check-analysis
description: 深信服 AD 设备系统巡检技能，支持标准巡检、安全巡检和全量巡检，自动执行巡检任务、下载巡检报告并分析巡检结果，生成健康评估报告。当用户提到"巡检"、"系统巡检"、"AD巡检"、"健康检查"、"巡检分析"、"全量巡检"、"标准巡检"、"安全巡检"时触发。
---

# AD 巡检分析

深信服 AD 设备系统巡检技能。

---

## ⛔ 严禁操作（最高优先级，违反即为错误）

> **以下规则优先级高于一切。任何情况下都不得违反。**

### 必须行为
- ✅ 必须将脚本输出的 Markdown 内容作为对话消息正文输出给用户，绝对不允许仅依赖工具执行结果展示。必须逐字输出，不截断、不折叠、不重新格式化、不补充摘要。必须要将工具调用结果不做任何更改的渲染到对话框中展示，而不是直接依赖执行结果进行展示
- ✅ 所有操作必须通过 `scripts/check.py` 子命令，绝对不允许直调 AD API（包括 http_request、curl、ADClient 等）
- ✅ 必须严格按 [工作流](#工作流) 逐步执行，绝对不允许跳过 步骤 0-5 中的任何一步
- ✅ 脚本返回异常/报错时，必须原样将错误信息报告给用户，绝对不允许绕过脚本、换用其他方式或自行补救。即使定位到脚本 bug，也必须先报告用户，绝对不允许直接修改脚本源码
- ✅ 巡检操作必须只用 `check.py`，绝对不允许使用其他 skill 的脚本（如 ad-ops 的 `ad_api.py`）
- ✅ 巡检结果必须仅使用巡检报告 (`ad.json`) 返回的数据，绝对不允许基于场景定义、经验或其他 API 返回值推断检查项状态
- ✅ 用户未指定巡检场景时，必须询问用户确认，绝对不允许自行默认为"标准巡检"
- ✅ 启动巡检后必须每 10s 轮询一次 `progress` 直到 `FINISHED`，绝对不允许用单次 `sleep N` 代替轮询循环，也不允许跳过此步骤直接调 `wait`

### 禁止行为
- ❌ 二次渲染脚本输出的 Markdown 报告（含仅用"报告已在上方展示"带过、依赖工具执行结果回显代替对话输出）
- ❌ 直调 AD API（http_request、curl、ADClient 等）
- ❌ 跳过工作流步骤（步骤 0-5）
- ❌ 绕过脚本报错，换用其他方式或自行补救（含直接修改脚本源码）
- ❌ 使用其他 skill 的脚本完成巡检（如 ad-ops 的 `ad_api.py`）
- ❌ 推断检查项状态，填充非巡检报告来源的数据
- ❌ 步骤 1：用户未指定场景时自行默认为"标准巡检"
- ❌ 步骤 4：用单次 `sleep N` 代替每 10s 循环轮询，或调一次 `progress` 就继续下一步，或跳过轮询直接调 `wait`

---

## 工作流

> **LLM 必须严格按以下步骤逐步执行，禁止跳过任何步骤。**

### 步骤 -1：连接测试 【必须】

> **在执行任何巡检操作之前，必须先通过 ad-connect 验证设备连通性。**

```bash
python ../ad-connect/scripts/connect.py --hosts "https://IP1,https://IP2" --password xxx
```

- 全部通过 → 继续后续流程
- 部分设备连接/认证失败 → 告知用户失败设备，自动对连通设备继续
- 全部失败 → 终止流程，报告用户

---

### 步骤 0：确定设备列表 【必须】

| 设备数 | 用户输入 | 行为 |
|--------|---------|------|
| **单设备** | 指定了 IP 或设备名（如 "AD1"） | 直接使用，从 [已知设备](#已知设备) 查完整 URL |
| **单设备** | 未指定任何设备 | **【询问用户】** 要巡检哪台设备，列出已知设备供选择 |
| **多设备** | 指定了多个 IP/设备名 / "所有" / "全部" / "批量" / "都" | 从 [已知设备](#已知设备) 解析设备列表 |
| **多设备** | 未指定任何设备 | **自动从 `devices.json` 读取所有已知设备** |
| **多设备** | 解析后只有 1 台 | **降级为单设备** |

---

### 步骤 1：确定巡检场景 【必须】

| 设备数 | 用户指定了场景 | 用户未指定场景 |
|--------|--------------|--------------|
| **单设备** | 直接使用 | **【询问用户】**："将对 {设备名} 执行**标准巡检**。可选：标准巡检 / 安全巡检 / 全量巡检。是否继续？" |
| **多设备** | 直接使用（所有设备统一场景） | **默认标准巡检，直接执行**（不需要确认） |

---

### 步骤 2：检查历史记录

| 设备数 | 行为 |
|--------|------|
| **单设备** | 【必须】调用 `check.py history --host` 查询。`len(items) < 5` → 直接进入步骤 3；`len(items) == 5` → **【询问用户】**"巡检记录已达 5 条上限，强制巡检会删除最早一条。是否继续？"，同意 → 带 `--force`；拒绝 → 终止 |
| **多设备** | 跳过历史记录检查，直接带 `--force` |

```bash
# 单设备
python scripts/check.py history --host https://IP --password xxx

# 多设备
python scripts/check.py history --hosts "https://IP1,https://IP2" --password xxx
```

---

### 步骤 3：启动巡检 【必须】

```bash
# 单设备
python scripts/check.py run --host https://IP --password xxx --scene "场景名" [--force]

# 多设备
python scripts/check.py run --hosts "https://IP1,https://IP2" --password xxx --scene "场景名" --force
```

记录返回的 `work_dir`（多设备时每台设备一个）。

---

### 步骤 4：轮询进度 【必须】

> ⛔ **禁止跳过此步骤直接调 `wait`**。工具执行平台有 60s 默认超时，`wait` 需阻塞等待巡检完成（脚本内部超时 600s），可能被平台提前终止。必须先通过 `progress` 循环轮询确认巡检 `FINISHED`，再调 `wait` 下载报告（此时几乎瞬间返回）。

**必须循环调用 `progress`**，每次间隔 10s，直到所有设备 `state` 变为 `FINISHED`。禁止只调一次就继续下一步，禁止用单次 `sleep N` 代替轮询循环。

轮询模式：调 progress → 检查 state → FINISHED 则继续步骤 5，否则 sleep 10s → 再调 progress → 重复。

```bash
# 单设备：循环直到 FINISHED
while true; do
  result=$(python scripts/check.py progress --host https://IP --password xxx 2>&1)
  echo "$result"
  if echo "$result" | grep -q "FINISHED"; then
    break
  fi
  sleep 10
done

# 多设备：循环直到全部 FINISHED（progress --hosts 自动并行查询）
while true; do
  result=$(python scripts/check.py progress --hosts "https://IP1,https://IP2" --password xxx 2>&1)
  echo "$result"
  if echo "$result" | grep -q '"state": "NO_RUNNING"'; then
    break
  fi
  sleep 10
done
```

---

### 步骤 5：下载分析并展示报告 【必须】

`wait` 命令自动完成下载 → 分析 → 渲染，直接输出最终 Markdown 报告：

```bash
# 单设备
python scripts/check.py wait --host https://IP --password xxx --work-dir <步骤3返回的路径>

# 多设备（一键下载合并，输出多设备汇总报告）
python scripts/check.py wait --hosts "https://IP1,https://IP2" --password xxx --work-dirs "<work_dir1>,<work_dir2>"
```

多设备使用 `wait --hosts`，内部自动完成逐台下载 → 合并 → 输出多设备汇总报告（含设备对比表 + 未检查项汇总 + 异常项分设备列 + 每设备独立完整报告）。禁止逐台调 `wait --host` 再手动拼接结果。

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

> 以下为命令参考。LLM 执行时必须遵循上方 [工作流](#工作流)，不得跳过交互步骤直接调命令。

```bash
# 查看巡检场景
python scripts/check.py scenes --host https://192.168.8.30 --password xxx

# 启动巡检（单设备）
python scripts/check.py run --host https://192.168.8.30 --password xxx --scene "标准巡检" --force

# 多设备巡检（并行启动）
python scripts/check.py run --hosts "https://192.168.8.30,https://192.168.8.31" --scene "标准巡检" --password xxx --force

# 多设备巡检（同步等待，需平台超时充足）
python scripts/check.py run --hosts "https://192.168.8.30,https://192.168.8.31" --scene "标准巡检" --password xxx --force --wait

# 轮询进度（单设备）
python scripts/check.py progress --host https://192.168.8.30 --password xxx

# 轮询进度（多设备并行查询）
python scripts/check.py progress --hosts "https://192.168.8.30,https://192.168.8.31" --password xxx

# 下载分析（自动完成下载→分析→渲染，输出最终 Markdown 报告）
python scripts/check.py wait --host https://192.168.8.30 --password xxx --work-dir /tmp/ad_check_xxx

# 查看历史（单设备）
python scripts/check.py history --host https://192.168.8.30 --password xxx

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
| 合并多设备报告 | `python scripts/check.py merge` | ❌ 手动合并多设备结果 |

## 已知设备

> 权威来源: 项目根目录 `devices.json`。密码通过 `password` 字段直接明文存储。

| 设备名 | IP 地址 | 用户名 |
|--------|---------|--------|
| AD1 | https://192.168.8.30 | admin |
| AD2 | https://192.168.8.31 | admin |

### 多设备子命令支持

| 子命令 | 多设备 | 说明 |
|--------|--------|------|
| `run` | ✅ | `--hosts` 并行启动多台，默认异步（需 `--wait` 同步） |
| `scenes` | ❌ | 无意义（场景列表是设备相关的） |
| `progress` | ✅ | `--hosts` 并行查询多台进度 |
| `history` | ✅ | 并行查询多台历史 |
| `analyze` | ❌ | 用 `--path` 不连设备 |
| `wait` | ✅ | `--hosts` 一键下载合并多台，输出多设备汇总报告 |

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
| 合并多设备报告 | `check.py merge --work-dirs "..."` | `--hosts`, `--scene` |

## 行为准则

### 必须行为
- ✅ 必须按 [工作流](#工作流) 逐步执行，禁止跳过交互步骤
- ✅ 所有操作通过 `scripts/check.py` 子命令
- ✅ 巡检分析仅使用巡检报告返回的数据
- ✅ 报告内容直接展示在对话消息正文中

### 禁止行为
- ❌ 绝对不允许直接使用工具调用的结果作为对话输出，必须在对话框把工具调用的结果进行原样输出展示出来!!!
- ❌ 绝对禁止多设备巡检逐台调 `wait --host` 再手动拼接结果。必须使用 `check.py wait --hosts "IP1,IP2" --work-dirs "dir1,dir2"` 一次性获取合并报告!!!
- ❌ 绝对不允许用单次 `sleep N` 代替每 10s 循环轮询；绝对不允许调一次 `progress` 就继续下一步；绝对不允许或跳过轮询直接调 `wait`
- ❌ LLM 直调 AD API（包括 http_request、curl 等）
- ❌ 绝对不允许跳过工作流步骤（步骤 0-5）
- ❌ 绝对不允许使用其他 skill 的脚本完成巡检（如 ad-ops 的 `ad_api.py`）
- ❌ 绝对不允许推断检查项状态，填充非巡检报告来源的数据
- ❌ 如果是单设备巡检且用户未指定巡检场景，默认使用标准巡检。必须询问用户的巡检场景，绝对不允许默认使用标准巡检
- ❌ 绝对不允许用单次 `sleep N` 代替每 10s 轮询，或跳过轮询直接调 `wait`
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
  "meta": { "start_time": "20260509102616" },
  "device_info": { "version": "...", "gateway_id": "...", "runtime": "..." },
  "check_results": { "base_cpu_usage": {"status": "pass", "name": "CPU使用率", "value": "17%"}, ... },
  "categories": { "feature": [...], "health": [...], "secure": [...] }
}
```

> **字段说明**：`meta.start_time` 格式为 `YYYYMMDDHHMMSS`，脚本渲染时转为 `YYYY-MM-DD HH:MM:SS`；
> `device_info.version` 对应 `ad.json` 中的 `version` 字段；
> `device_info.runtime` 对应 `ad.json` 中的 `base_running_time` 字段；
> `check_results` 以 v2 引擎的内部 rule_id 为 key（如 `base_cpu_usage`），展示时使用 `name` 字段中的中文显示名。


## 报告展示规则

`check.py wait` 和 `check.py analyze` 已通过 `render_markdown()` 输出最终格式的 Markdown 报告。**LLM 禁止对脚本输出做任何重新格式化、截断、改写或补充。**

- 脚本输出的 Markdown 内容必须**原样展示**在对话消息正文中
- 不截断、不折叠、不选择性展示、不二次渲染
- 多设备输出含汇总表 + 每设备分块，可能较长
- 超过单条消息限制时分多条展示（保持设备分块完整）
- 必须每次展示巡检结果都要把工具调用结果重新完整复制到展示对话框中，绝对不允许直接使用工具调用结果充当输出

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
