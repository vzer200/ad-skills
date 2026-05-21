# 异步轮询修复：服务日志查询 + 黑盒超时拆分

> 日期: 2026-05-21 | 状态: v2（2-agent 审核修订）

## 背景

从 `Untitled-1.txt` 日志发现两个问题导致 LLM 违规（直调 API）或操作失败（超时）：

| 问题 | 现象 | 根因 |
|------|------|------|
| AI 直调 `ADClient.get_service_log()` | 用户想看服务日志，AI 无脚本可用，被迫写 Python 调 API | perception.py 无独立的 `logs` 子命令 |
| 黑盒 `--complete` 超时 | 下载+解压 > 60s，平台 kill | blackbox 异步流程粒度太粗，下载+分析未分离 |

两个问题的本质相同：**脚本覆盖的使用场景不全，AI 在场景缺口处被迫绕过规则。**

## 1. perception.py：新增 `logs` 子命令

### 1.1 设计

参照 `check.py` 的独立子命令模式，新增 `logs` 子命令，直接输出 `get_service_log` API 的告警列表。

```bash
# 查询最近 N 条服务日志
python scripts/perception.py logs --host https://x.x.x.x --user admin --password xxx [--limit 50] [--format json]

# 多设备
python scripts/perception.py logs --hosts "IP1,IP2" --user admin --password xxx [--limit 50]
```

### 1.2 输出格式

**markdown（默认）**：
```
## 服务日志 (https://x.x.x.x)
| 时间 | 级别 | 模块 | 详情 |
|---|---|---|---|
| 2026-05-20 23:50:15 | ALERT | APPD | 虚拟服务 [test] 恢复 |
| 2026-05-20 23:48:04 | ALERT | RS_DETECT | 节点 172.16.1.3:80 服务故障 |
```

**json**：原始 API 响应 `{"total_items": N, "items": [...]}`

### 1.3 实现

| # | 文件 | 改动 |
|---|------|------|
| 1 | `perception.py` | 新增 `fetch_service_logs(client, limit)` 函数 (~10行) |
| 2 | `perception.py` | 新增 `render_logs_markdown(entries, host)` 独立渲染函数 (~12行) |
| 3 | `perception.py` | 新增 `_logs_one(client, ...)` ThreadPoolExecutor 适配 (~8行) |
| 4 | `perception.py` | CLI 新增 `logs` 子命令 (~30行) |
| 5 | `test/test_perception.py` | 新增测试 (~25行) |

> **设计决策**: `render_logs_markdown()` 是独立函数，不复用 `render_markdown()`。后者依赖完整分析结果 dict（device/traffic/state/logs/conflicts），logs 子命令的输出结构不同，强行复用会引入脆弱性。

### 1.4 API 字段说明

`get_service_log()` 返回 `{"items": [{"date", "time", "level", "module", "detail", "log_id"}]}`。`logs` 子命令输出四列：时间 (`date time`)、级别 (`level`)、模块 (`module`)、详情 (`detail`)。与 `perception.py` 之前的 `log_correlation` 修复（`92df2f7`）使用相同的字段映射。

> **注意**: `get_service_log()` 从 API 拉取全部 items 后客户端排序截取。默认 `limit=50`，不建议超过 200（数据传输量增大）。

### 1.4 与现有 `analyze` 中日志关联的关系

| 维度 | `analyze` 中的日志关联 | 新的 `logs` 子命令 |
|------|----------------------|-------------------|
| 触发条件 | 仅在检测到流量异常时 | 始终可用 |
| 数据范围 | ±5min 异常时间窗口 | 最近 N 条（默认 50） |
| 用途 | 自动关联异常根因 | 独立查询服务告警 |
| 输出 | 内嵌在分析报告中 | 独立输出 |

两者互补，不冲突。

## 2. blackbox.py：异步流程拆分为三段

### 2.1 参照 check.py 模式

check.py 的异步流程：

```
run --no-wait    → _start_only()   → 启动巡检，返回 work_dir + event_id
progress         → _progress_one() → 查询进度（RUNNING/FINISHED）
wait             → wait_and_download(max_attempts=1) → 轮询一次，已完成则下载+分析
run --wait       → _check_one(max_attempts=60)       → 同步阻塞，LLM 不参与轮询
```

blackbox 改造后：

```
export --no-wait → _blackbox_start()    → 启动导出，返回 output_dir + event_id
progress         → _blackbox_progress() → 查询任务状态（RUNNING/SUCCESS/FAILED）
download         → _blackbox_download() → 下载+解压+分析（仅当 SUCCESS 时）
export --wait    → _blackbox_one()      → 同步阻塞（保留现有行为）
```

### 2.2 新增函数

```python
def _blackbox_progress(client, output_dir):
    """Query blackbox export progress without downloading.

    Reads _export_meta.json for event_id, then queries get_last_event().
    Returns one of four states:
      - NOT_FOUND: event_id not yet in /last-event list (task just submitted)
      - RUNNING:   event found but state is not terminal (still processing)
      - SUCCESS:   task complete, ready for download
      - FAILED:    task failed
    Also includes file_size_mb if the API returns it in task data.
    Does NOT download anything. < 2s execution time.

    JSONDecodeError in _export_meta.json → returns {error: "元数据文件损坏"}.
    Missing _export_meta.json → returns {error: "找不到元数据文件"}.
    """
```

### 2.3 CLI 设计

```bash
# === 异步模式（推荐，需 LLM 每 10s 轮询）===

# 步骤 1: 启动导出（多设备）
python scripts/blackbox.py --hosts "IP1,IP2" --password xxx --from-date ... --to-date ...
# 返回: [IP1] event_id=xxx output_dir=/tmp/blackbox_analysis/IP1
#       [IP2] event_id=yyy output_dir=/tmp/blackbox_analysis/IP2
# ⚠️ LLM 必须原样保存 output_dir 值，后续 progress/download 直接传入，不要自行拼接

# 步骤 2: 查询进度（LLM 每 10s 对每台设备调用一次，也支持 --hosts 多设备）
python scripts/blackbox.py progress --host IP1 --password xxx --output /tmp/blackbox_analysis/IP1
# 返回: {"status": "RUNNING", "event_id": "xxx"}
python scripts/blackbox.py progress --hosts "IP1,IP2" --password xxx --output /tmp/blackbox_analysis
# 多设备: 每个设备的 output_dir = --output/{host_slug}

# 步骤 3: 下载+分析（仅当 progress 返回 SUCCESS 后）
python scripts/blackbox.py download --host IP1 --password xxx --output /tmp/blackbox_analysis/IP1
# 返回: 报告 markdown

# === 已废弃（向后兼容保留）===
python scripts/blackbox.py --host IP1 --complete /tmp/blackbox_analysis/IP1
# 等价于 download --host IP1 --output /tmp/blackbox_analysis/IP1，标记 deprecated

# === 同步模式（需平台超时 > 5min）===
python scripts/blackbox.py --hosts "IP1,IP2" --password xxx --from-date ... --to-date ... --wait
```

### 2.4 与 check.py 的对应关系

| check.py | blackbox.py | 说明 |
|----------|-------------|------|
| `_start_only()` | `_blackbox_start()` | 启动任务，保存元数据到磁盘 |
| `_progress_one()` | `_blackbox_progress()` | 查询进度，不下载 |
| `wait_and_download(max_attempts=1)` | `_blackbox_download()` | 单次尝试下载，未完成则报错 |
| `_check_one(max_attempts=60)` | `_blackbox_one()` | 同步模式，内部轮询 |
| `run` | `--hosts`（默认异步） | 启动导出 |
| `progress` | `progress` | 查询进度 |
| `wait` | `download` | 下载+分析 |

### 2.5 `_blackbox_download` 超时风险评估

拆分后 `_blackbox_download` 仍然包含下载+解压+分析三个步骤。对于大型黑盒日志（7天数据），下载和解压可能仍超过 60s。

**缓解措施**：
- `progress` 命令执行时打印文件大小信息（如 API 返回），让 LLM 预判是否会超时
- 如果单设备仍超时，LLM 可缩小时间范围（`--from-date` / `--to-date` 收紧到 1-3 天）
- SKILL.md 中增加超时处理指南

### 2.6 实现

| # | 文件 | 改动 |
|---|------|------|
| 1 | `blackbox.py` | 新增 `_blackbox_progress()` (~30行)：读取 meta → 匹配 event_id → 返回四态 + file_size_mb |
| 2 | `blackbox.py` | CLI 新增 `progress` 子命令（支持 `--host`/`--hosts`）(~30行) |
| 3 | `blackbox.py` | CLI 新增 `download` 子命令（支持 `--host`/`--hosts`）(~30行) |
| 4 | `blackbox.py` | `--complete` 保留为 `download` 的 deprecated 别名 (~5行) |
| 5 | `blackbox.py` | 新增日期范围校验（> 7天时 stderr warn + exit 4）(~8行) |
| 6 | `blackbox.py` | `_blackbox_download` 增加归档密码错误友好提示 (~5行) |
| 7 | `ad-blackbox-analysis/SKILL.md` | 更新异步工作流文档 (~30行) |
| 8 | `test/test_blackbox.py` | 新增测试 (~40行) |

### 2.7 错误处理规范

| 场景 | 返回值 | 退出码 |
|------|--------|--------|
| `_export_meta.json` 不存在 | `{"error": "找不到元数据文件..."}` | 5 |
| `_export_meta.json` 损坏（非 JSON） | `{"error": "元数据文件损坏"}` | 5 |
| event_id 不在 `/last-event` 列表 | `{"status": "NOT_FOUND"}` | 0 (LLM 继续轮询) |
| 任务仍在运行 | `{"status": "RUNNING"}` | 0 |
| 任务成功 | `{"status": "SUCCESS", "file_size_mb": N}` | 0 |
| 任务失败 | `{"status": "FAILED", "error": "导出任务失败: event_id=xxx"}` | 5 |
| 归档密码错误 | `{"error": "归档密码错误，请检查 --archive-password"}` | 4 |
| 日期范围 > 7 天 | stderr warn + 脚本拒绝执行 | 4 |

## 3. SKILL.md 更新

### 3.1 ad-perception/SKILL.md

- 功能概述：新增"服务日志查询"
- CLI 命令参考：新增 `logs` 子命令
- 脚本强制规则：新增"查询服务日志 → `perception.py logs`"
- 执行工作流：新增日志查询分支

### 3.2 ad-blackbox-analysis/SKILL.md

- CLI 命令参考：新增 `progress` 和 `download` 子命令
- Workflow 更新：从"导出→查询→下载→解压"改为"export → progress(轮询) → download"
- 新增 LLM 轮询指南（10s 间隔，参考 check.py）
- 超时处理：大文件时缩窄时间范围

## 4. 改动清单汇总

| # | 文件 | 改动 | 行数 |
|---|------|------|------|
| 1 | `perception.py` | 新增 `fetch_service_logs()` | ~10 |
| 2 | `perception.py` | 新增 `render_logs_markdown()` | ~12 |
| 3 | `perception.py` | 新增 `_logs_one()` | ~8 |
| 4 | `perception.py` | CLI 新增 `logs` 子命令 | ~30 |
| 5 | `test/test_perception.py` | 新增测试 | ~25 |
| 6 | `ad-perception/SKILL.md` | 更新文档 | ~15 |
| 7 | `blackbox.py` | 新增 `_blackbox_progress()` (四态 + 错误处理) | ~30 |
| 8 | `blackbox.py` | CLI 新增 `progress` 子命令（--host/--hosts） | ~30 |
| 9 | `blackbox.py` | CLI 新增 `download` 子命令（--host/--hosts） | ~30 |
| 10 | `blackbox.py` | `--complete` deprecated 别名 + 日期校验 + 密码错误处理 | ~18 |
| 11 | `test/test_blackbox.py` | 新增测试 | ~40 |
| 12 | `ad-blackbox-analysis/SKILL.md` | 更新异步工作流 + LLM 轮询指南 | ~30 |

## 5. 不变约束

- 不修改 `ad_api.py`（用户确认不需要 CLI 入口）
- 不改动 `multi_device.py`
- 不改动 `overview.py`、`check.py`、`collector.py`
- 不新增外部依赖
- 所有现有测试保持通过
- blackbox `--wait` 同步模式保留不变
- blackbox `--complete` 保留为 `download` 的 deprecated 别名（向后兼容）
- perception `analyze` 日志关联行为不变

## 6. 预期效果

**修复前**（日志中的情况）：
```
用户: "分析一下服务日志"
  → AI 无从下手 → 写 Python 直接调 API → 违反规则
用户: 导出黑盒日志
  → --complete 超时 → sleep 75s → 被杀 → 重试 → 又超时
```

**修复后**：
```
用户: "看一下服务日志"
  → python scripts/perception.py logs --host IP --password xxx
  → 输出时间/级别/模块/详情表格 → AI 原样展示 ✅

用户: 导出黑盒日志
  → python scripts/blackbox.py --hosts "IP1,IP2" ...  (启动)
  → 等待 60-90s 后 python scripts/blackbox.py progress ... (查进度)
  → SUCCESS 后 python scripts/blackbox.py download ... (下载分析)
  → 输出报告 → AI 原样展示 ✅
```
