<!-- 锚定: overview.py:368-478 render_markdown() -->
<!-- 生成自 commit: 6db88a46942b0fdf9b48fde70d94ef5e944b72ae -->

# 期望输出示例

## 正常情况（全量总览单设备）

```markdown
# AD Device Overview

## Device Info
- **Host**: https://192.168.8.30
- **Version**: AD-7.6.2-20231010
- **Uptime**: 185d 12h 30m
- **HA Role**: master (normal)
- **CPU**: 15%
- **Memory**: 42%

## Virtual Services
| Name | VIP:Port | Pool | Status | Nodes (Up/Total) | Connections | Rate |
|------|----------|------|--------|-------------------|-------------|------|
| web_app | 192.168.1.100:443 | pool_web | running | 3/4 | 1200 | 85/s |
| api_gw | 192.168.1.101:8080 | pool_api | running | 2/2 | 340 | 22/s |

## SSL Certificates
| Name | Expiry | Days Left | Status |
|------|--------|-----------|--------|
| *.example.com | 2026/08/15 | 86 | 提示 |
| api.example.com | 2026/06/30 | 40 | 警告 |
| internal.example.com | 2026/05/10 | -10 | 严重 |

## Hardware Status
| Component | Value | Status |
|-----------|-------|--------|
| CPU | 15% | 正常 |
| Memory | 42% | 正常 |
| Temperature | 45C | 正常 |
| Fan: FAN1 | normal | 正常 |
| Fan: FAN2 | normal | 正常 |
| Power: PWR1 | normal | 正常 |
| Power: PWR2 | abnormal | 警告 |
| Interface: eth0 | up | 正常 |
| Interface: eth1 | up | 正常 |
```

## 单维度查询（仅虚拟服务）

```markdown
# AD Device Overview

## Device Info
- **Host**: https://192.168.8.30

## Virtual Services
| Name | VIP:Port | Pool | Status | Nodes (Up/Total) | Connections | Rate |
|------|----------|------|--------|-------------------|-------------|------|
| web_app | 192.168.1.100:443 | pool_web | running | 3/4 | 1200 | 85/s |

## SSL Certificates
(无证书)

## Hardware Status
(无硬件信息)
```

## 数据源失败情况

```markdown
## Virtual Services
> 获取失败: Connection timed out

## SSL Certificates
> 获取失败: 401 Unauthorized
```

## 结构说明

| Section | 触发条件 | 格式 |
|---------|---------|------|
| `# AD Device Overview` | 始终 | 标题 |
| `## Device Info` | 始终 | key-value 列表 (Host, Version, Uptime, HA Role, CPU, Memory) |
| `## Virtual Services` | subcommand 为 all 或 vs | 7 列表格 / 失败时显示错误 |
| `## SSL Certificates` | subcommand 为 all 或 cert | 4 列表格 (含到期状态) / 失败时显示错误 |
| `## Hardware Status` | subcommand 为 all 或 hardware | 3 列表格 (Component, Value, Status) / 失败时显示错误 |

### 证书到期状态判定

| 剩余天数 | 状态 |
|---------|------|
| > 90 天 | 正常 |
| 61-90 天 | 提示 |
| 31-60 天 | 警告 |
| ≤ 30 天 | 严重 |

### 硬件状态判定

| 级别 | 中文标签 |
|------|---------|
| ok | 正常 |
| info | 提示 |
| warning | 警告 |
| critical | 严重 |
