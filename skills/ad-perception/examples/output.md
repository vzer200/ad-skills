<!-- 锚定: perception.py:734-890 render_markdown(), 708-731 render_logs_markdown() -->
<!-- 生成自 commit: 6db88a46942b0fdf9b48fde70d94ef5e944b72ae -->

# 期望输出示例

## 正常情况（有异常）

```markdown
# AD 感知分析报告
**设备**: https://192.168.8.30

## 流量分析
| VS | 指标 | 时间 | 当前值 | 正常范围 | 偏离幅度 | 方向 | 严重程度 |
|---|---|---|---|---|---|---|---|
| web_app | connections | 05-21 14:25 | 3500.0 | 1200.0 | +191.7% | up | 🔴 严重 |
| api_gw | connection_rate | 05-21 13:10 | 85.0 | 42.0 | +102.4% | up | 🟡 明显 |

## 设备状态
CPU: 15%, 内存: 42%

**3σ 异常检测:**

| 指标 | 时间 | 当前值 | 正常范围 | 偏离幅度 | 方向 | 严重程度 |
|---|---|---|---|---|---|---|
| cpu_usage | 05-21 14:30 | 78.0 | 25.0 | +212.0% | up | 🔴 严重 |

| 指标 | 当前值 | 级别 | 描述 |
|---|---|---|---|---|
| memory | 85% | ⚠️ warn | 内存使用率超过 80% 阈值 |

磁盘: 未提供巡检数据

## 日志关联
| 时间 | 级别 | 模块 | 详情 |
|---|---|---|---|
| 2026-05-21 14:25 | WARN | connection | Connection limit approaching threshold |

## 地址冲突
✅ 未发现 VS IP:Port 重叠或 Pool 节点重复。
```

### 有冲突时

```markdown
## 地址冲突
**VS IP:Port 重叠:**
| VS A | VS B | 重叠地址 |
|---|---|---|
| web_app | web_app_backup | 10.0.0.1:443 |

**Pool 节点重复:**
| 节点地址 | 所属 Pool |
|---|---|
| 192.168.1.10:8080 | pool_a, pool_b |
```

## 服务日志查询（render_logs_markdown）

`perception.py logs` 子命令独立输出：

```markdown
## 服务日志 (https://192.168.8.30)
| 时间 | 级别 | 模块 | 详情 |
|---|---|---|---|
| 2026-05-21 14:25:30 | WARN | connection | Connection limit approaching threshold |
| 2026-05-21 14:20:15 | ERROR | auth | Authentication failed for user operator |
| 2026-05-21 14:15:00 | INFO | system | Configuration updated successfully |
```

## 数据不足回退

```markdown
## 流量分析
⚠️ 数据库数据不足，回退到 API 实时趋势查询。

**API 原始趋势数据:**
| VS | 指标 | 趋势周期 | 均值 | 最大值 |
|---|---|---|---|---|
| web_app | connections | last-hour | 1200.0 | 3500.0 |

⚠️ 数据不足，无法进行 3σ 异常检测。
```

## 错误和边界情况

```markdown
## 流量分析
❌ 流量分析失败: Connection timed out

## 设备状态
❌ 设备状态获取失败: 401 Unauthorized

## 地址冲突
❌ 冲突检测失败: Failed to get virtual services
```

### 磁盘状态变体

| disk_source | 输出 |
|-------------|------|
| `none`（未提供 --disk-source） | `磁盘: 未提供巡检数据` |
| `error`（ad.json 损坏） | `磁盘: 巡检报告损坏` |
| `ad.json` 且 available=false | `磁盘: 巡检报告不可用` |
| `ad.json` 且 available=true | `磁盘: {value}` |

## 结构说明

| Section | 触发条件 | 表格列数 |
|---------|---------|---------|
| `# AD 感知分析报告` | 始终 | - |
| `## 流量分析` | 始终 | 8 列（有异常）/ 5 列（回退）/ 无表格（无异常） |
| `## 设备状态` | 始终 | 7 列（3σ 表）/ 4 列（阈值告警表） |
| `## 日志关联` | 有异常时（analyze 命令内） | 4 列 |
| `## 服务日志 ({host})` | `logs` 子命令独立输出 | 4 列 |
| `## 地址冲突` | 始终 | 3 列（VS 重叠）/ 2 列（Pool 重复） |

### 严重程度判定规则

`render_markdown()` 中的判定逻辑（z ≤ 3 的数据已在 `detect_anomaly_3sigma()` 中被过滤，不会到达渲染函数）：

| Z-Score 范围 | 严重程度 |
|-------------|---------|
| z > 10 | 🔴 严重 |
| z > 5 | 🟡 明显 |
| z ≤ 5 | 🟠 轻微 |
