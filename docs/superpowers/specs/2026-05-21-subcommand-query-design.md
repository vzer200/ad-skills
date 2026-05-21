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

- 新增 `--hosts` 和 `--devices` 参数到所有子命令
- 引入同目录 `multi_device.py`（已存在）做多设备分发
- 多设备时输出 `{host: result}` map
- 单设备路径完全不变，向后兼容

**worker 函数模式**：

```python
def _query_one(client, **kwargs):
    """Single-device query, compatible with run_multi."""
    # ... existing logic ...
    return result
```

**分发逻辑**：

```
if args.hosts or args.devices:
    devices = parse_hosts_arg(...) or load_devices_json(...)
    results = run_multi(devices, _query_one, **kwargs)
    print(json.dumps(results, indent=2, ensure_ascii=False))
    sys.exit(compute_multi_exit_code(results))
# else: 原有 --host 单设备路径
```

**不改动**：overview.py 保持现状，作为"格式化快照"专用工具。

### 2. SKILL.md 文档改造

每个 skill 新增 **"子命令选择决策"** 章节，包含：

- **完整命令矩阵**：列出所有子命令及其参数
- **决策表**：用户意图 → 命令 + 参数（三列）

#### 决策表模板

| 用户意图 | 命令 | 说明 |
|----------|------|------|
| `<查全部 X + 单设备>` | `<脚本> <subcmd> --host ...` | 全量 |
| `<查单个 X + 单设备>` | `<脚本> <subcmd> <name> --host ...` | 单个 |
| `<查全部 X + 多设备>` | `<脚本> <subcmd> --hosts "..."` | 多设备聚合 |
| `<查单个 X + 多设备>` | `<脚本> <subcmd> <name> --hosts "..."` | 多设备同名查询 |

#### 各 skill 补充内容

**ad-ops**：
- 完整子命令矩阵：users/slb/pool/stat/cert/log/ha × list/get × --host/--hosts
- overview 与 ad_api 分工说明：overview 用于格式化快照，ad_api 用于原始数据查询

**ad-check-analysis**：
- scenes/run/progress/wait/history/analyze 的单设备/多设备示例
- 异步轮询流程中 `progress` 的多设备用法

**ad-perception**：
- `analyze`（全维度）vs `traffic --vs <name>`（单VS）的选择逻辑
- `logs` 的多设备查询

**ad-blackbox-analysis**：
- 导出启动 + progress + download 的单设备/多设备示例

### 3. 不改动的脚本

- overview.py — 保持为格式化快照工具
- perception.py / collector.py — 已有完整 --host/--hosts 支持
- check.py — 已有完整 --host/--hosts 支持
- blackbox.py — 已有完整 --host/--hosts 支持

## 实施顺序

1. 改造 ad_api.py：加 `--hosts`/`--devices` 支持
2. 更新 ad-ops SKILL.md：补充完整子命令矩阵 + 决策表
3. 更新其余 3 个 SKILL.md：补充子命令选择决策章节

## 验收标准

- ad_api.py 所有子命令支持 `--hosts` 和 `--host`，行为一致
- 4 个 SKILL.md 均有"子命令选择决策"章节
- AI 能通过决策表正确选择命令：不出现"用 overview.py 查单个VS"或"用 ad_api.py 只查单设备却想聚合多设备"的情况
