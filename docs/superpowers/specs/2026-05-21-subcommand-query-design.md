# AD Skills 子命令查询设计

## 目标

所有 AD skill 的查询操作通过子命令区分"查单个资源"和"查全部资源"，AI 能通过决策表明确选择正确的命令和参数组合。

## 现状

| 脚本 | --host | --hosts | 子命令 |
|------|--------|---------|--------|
| ad_api.py | ✅ | ❌ | users/slb/pool/stat/cert/log/ha × list/get |
| overview.py | ✅ | ✅ | all/vs/pool/cert/hardware/ha/traffic（仅全查） |
| perception.py | ✅ | ✅ | analyze/traffic/state/conflict/logs |
| collector.py | ✅ | ✅ | collect/daemon |
| check.py | ✅ | ✅ | scenes/run/progress/wait/history/analyze |
| blackbox.py | ✅ | ✅ | progress/download |

**核心缺口**：ad_api.py 缺少 `--hosts`，导致同一资源"查单个"用 ad_api.py，"查全部多设备"用 overview.py，AI 需要记忆两套入口。

## 设计

### 1. ad_api.py 改造

参照 perception.py / check.py 的 `--host` / `--hosts` 模式：

- 新增 `--hosts` 和 `--devices` 参数到所有**查询类**子命令
- 引入同目录 `multi_device.py`（已存在，使用延迟 import，不会循环依赖）做多设备分发
- 多设备时输出 `{host: result}` map（与 perception.py / check.py 一致）
- 单设备路径完全不变，向后兼容
- `--hosts` 和 `--host` 同时指定时：警告并忽略 `--host`（与 perception.py 一致）

**`login` 子命令不支持 `--hosts`**：`login` 是单设备连接测试，多设备语义无意义。当 `--hosts` 与 `login` 同时使用时，输出错误并退出。

**worker 函数模式**：

```python
def _query_one(client, **kwargs):
    """Single-device query, compatible with run_multi(devices, func, **kwargs)."""
    # ... existing logic ...
    return result
```

**分发逻辑**：

```
if args.hosts or args.devices:
    if args.command == "login":
        print("错误: login 不支持多设备模式", file=sys.stderr); sys.exit(4)
    devices = parse_hosts_arg(...) or load_devices_json(...)
    results = run_multi(devices, _query_one, **kwargs)
    print(json.dumps(results, indent=2, ensure_ascii=False))
    sys.exit(compute_multi_exit_code(results))
# else: 原有 --host 单设备路径
```

**输出格式**：多设备模式输出 JSON `{host: result}`，单设备模式保持现有行为（`--json` / `--pretty` 控制格式）。不引入新的 `--format` 参数，保持 ad_api.py 简洁。

**不改动**：overview.py 保持现状，作为"格式化快照"专用工具。

### 2. SKILL.md 文档改造

每个 skill 新增 **"子命令选择决策"** 章节。根据 skill 类型使用不同模板：

#### 资源查询型（ad-ops）— 完整 4 行决策表

| 用户意图 | 命令 | 说明 |
|----------|------|------|
| `<查全部 X + 单设备>` | `<脚本> <subcmd> --host ...` | 全量 |
| `<查单个 X + 单设备>` | `<脚本> <subcmd> <name> --host ...` | 单个 |
| `<查全部 X + 多设备>` | `<脚本> <subcmd> --hosts "..."` | 多设备聚合 |
| `<查单个 X + 多设备>` | `<脚本> <subcmd> <name> --hosts "..."` | 多设备同名查询 |

额外补充 **overview.py vs ad_api.py 触发词规则**：

| 用户说 | 使用 |
|--------|------|
| "总览" / "概览" / "快照" / "overview" / "设备概况" | `overview.py`（格式化输出，含健康标签/颜色标记） |
| "查询" / "列表" / "获取" / "具体某个" / "原始数据" | `ad_api.py`（原始 JSON 输出） |

#### 工作流型（ad-check-analysis, ad-blackbox-analysis）— 任务→命令 映射表

不使用 4 行资源模板，改用 **"任务 → 命令 + 关键参数"** 映射：

| 任务 | 命令 | 关键参数 |
|------|------|----------|
| `<启动巡检>` | `check.py run` | `--host[s]`, `--scene` |
| `<查询进度>` | `check.py progress` | `--host[s]` |
| `<下载分析>` | `check.py wait` | `--host`, `--work-dir` |

#### 混合型（ad-perception）— 资源型模板 + 参数过滤列

| 用户意图 | 命令 | 关键参数 |
|----------|------|----------|
| 全维度分析（所有VS） | `perception.py analyze --host ...` | — |
| 单VS流量分析 | `perception.py traffic --host ... --vs <name>` | `--vs` |
| 多设备全维度 | `perception.py analyze --hosts "..."` | — |
| 设备状态分析 | `perception.py state --host ...` | `--disk-source`（可选） |
| 地址冲突检测 | `perception.py conflict --host ...` | — |
| 服务日志查询 | `perception.py logs --host ...` | `--limit` |

#### blackbox 子命令补充

当前 blackbox.py 主导出操作使用位置参数（非子命令），需要在 SKILL.md 中将其作为隐式子命令 `export` 记录：

| 任务 | 命令 | 关键参数 |
|------|------|----------|
| 启动导出 | `blackbox.py --host[s] ...` (隐式 export) | `--from-date`, `--to-date` |
| 查询进度 | `blackbox.py progress --host[s] ...` | `--output` |
| 下载分析 | `blackbox.py download --host ...` | `--output` |

#### 与现有"多设备触发决策"的关系

**合并，不重复。** 将现有的"多设备触发决策" 4 条规则整合进"子命令选择决策"章节，不再单独存在。避免两套规则不一致。

#### 各 skill 补充内容

**ad-ops**：
- 完整子命令矩阵：users/slb/pool/stat/cert/log/ha × list/get × --host/--hosts
- overview vs ad_api 触发词规则（见上）
- **更新"脚本强制规则"表**：新增一行 "多设备 API 查询 → `ad_api.py --hosts`"

**ad-check-analysis**：
- 任务→命令映射表，保留已有的 `scenes` / `run` / `progress` / `wait` / `history` / `analyze`
- 异步轮询流程中 `progress` 的多设备用法

**ad-perception**：
- 混合型决策表（资源型 + 参数过滤列）
- `analyze`（全维度）vs `traffic --vs <name>`（单VS）的选择逻辑
- `logs` 的多设备查询

**ad-blackbox-analysis**：
- 任务→命令映射表（export/progress/download）
- 单设备/多设备导出选择

### 3. 不改动的脚本

- overview.py — 保持为格式化快照工具
- perception.py / collector.py — 已有完整 --host/--hosts 支持
- check.py — 已有完整 --host/--hosts 支持
- blackbox.py — 已有完整 --host/--hosts 支持

## 实施顺序

1. 改造 ad_api.py：加 `--hosts`/`--devices` 支持（login 除外）
2. 更新 ad-ops SKILL.md：完整子命令矩阵 + 决策表 + 触发词规则 + 更新强制规则表
3. 更新其余 3 个 SKILL.md：按各自模板补充决策章节

## 验收标准

- ad_api.py 所有查询子命令支持 `--hosts` 和 `--host`，`login` 拒绝 `--hosts`
- `--hosts` + `--host` 同时指定时警告并忽略 `--host`
- 4 个 SKILL.md 均有"子命令选择决策"章节，按 skill 类型使用对应模板
- 现有"多设备触发决策"章节合并入新章节，无重复
- AI 能通过决策表 + 触发词规则正确选择命令
- 不出现"用 overview.py 查单个VS"或"用 ad_api.py 做总览快照"的混淆
