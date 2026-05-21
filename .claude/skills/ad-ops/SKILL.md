---
name: ad-ops
description: 深信服 AD 设备运维管理技能，支持用户/虚拟服务/Pool/SSL证书/HA状态/SSH配置/系统统计、设备总览快照等操作。当用户提到"运维"、"设备管理"、"查询VS"、"查看证书"、"设备状态"、"系统统计"、"设备总览"、"AD操作"时触发。
version: "2.0.0"
updated_at: "2026-05-21"
---

# AD 智能运维

深信服 AD (应用交付) 设备 REST API 集成管理。

## 适用场景

- 需要获取设备总览快照（设备信息、VS、证书、硬件、HA、流量）
- 需要查询虚拟服务/Pool/SSL 证书/硬件状态等特定维度
- 需要多设备并行查询（同密码或异密码）
- 需要使用 ad_api.py 进行 API 级别的设备配置和管理
- 需要查询系统统计、用户管理、SSH 配置等运维操作

## 不适用场景

- 需要巡检报告格式的综合健康检查 → 使用 **ad-check-analysis**
- 需要流量异常检测或状态告警 → 使用 **ad-perception**
- 需要导出黑盒审计日志或系统日志 → 使用 **ad-blackbox-analysis**
- LLM 直调 AD API（必须通过 scripts 调用） → 见下方脚本强制规则

## 功能概述

| 功能 | 说明 |
|------|------|
| 用户管理 | 用户的查询 |
| 虚拟服务 | 虚拟服务的查询 |
| 池管理 | 池的查询 |
| SSL 证书 | 证书列表及有效期查询 |
| HA 状态 | 高可用状态和集群信息查询 |
| SSH 配置 | SSH 状态查询 |
| 系统统计 | VS 指标、吞吐趋势、节点状态 |
| 设备总览 | 设备概览快照（overview.py） |

## CLI 命令参考

### ad_api.py（单设备）

```bash
python scripts/ad_api.py --host https://10.146.10.254 --password admin users list
python scripts/ad_api.py --host https://10.146.10.254 --password admin slb list
python scripts/ad_api.py --host https://10.146.10.254 --password admin pool list
python scripts/ad_api.py --host https://10.146.10.254 --password admin stat sys
python scripts/ad_api.py --host https://10.146.10.254 --password admin ha status
python scripts/ad_api.py --host https://10.146.10.254 --password admin cert list
```

### overview.py（设备总览）

```bash
# 单设备
python scripts/overview.py all --host https://192.168.8.30 --password xxx [--format json]
python scripts/overview.py vs --host ... [--format json]
python scripts/overview.py pool --host ... [--format json]
python scripts/overview.py cert --host ... [--format json]
python scripts/overview.py hardware --host ... [--format json]
python scripts/overview.py ha --host ... [--format json]
python scripts/overview.py traffic --host ... [--format json]

# 多设备（同密码）
python scripts/overview.py all --hosts "https://192.168.8.30,https://192.168.8.31" --password xxx

# 多设备（异密码）
python scripts/overview.py all --devices devices.json
```

## API Reference

| Resource | Methods |
|----------|---------|
| Users | `get_users()`, `get_user(name)`, `create_user(data)`, `update_user(name, data)`, `delete_user(name)` |
| Virtual Services | `get_virtual_services()`, `get_virtual_service(name)`, create/update/delete |
| Pools | `get_pools()`, `get_pool(name)`, create/update/delete |
| SSL Certs | `get_ssl_certificates()` - returns `validity_not_after` for expiry |
| HA | `get_ha_status()`, `get_ha_cluster()` - may return 409 in non-cluster mode |
| SSH | `get_ssh_config()`, `enable_ssh()`, `disable_ssh()` |
| Stats | `get_sys_system()`, `get_vs_stat()`, `get_vs_trend(name, item, trend)`, `get_pool_node_stat(pool)` |

## Stat Items

| item | Description |
|------|-------------|
| `connection-rate` | 新建连接 |
| `connection` | 并发连接 |
| `upstream-throughput` | 上行吞吐 |
| `downstream-throughput` | 下行吞吐 |
| `general-throughput` | 总吞吐 |

## 脚本强制规则

| 操作 | 必须使用 | 禁止使用 |
|------|----------|----------|
| API 操作 | `python scripts/ad_api.py` | ❌ 直接调 API |
| 单设备总览 | `python scripts/overview.py all --host ...` | ❌ 直接调 API |
| 多设备总览 | `python scripts/overview.py all --hosts "..."` | ❌ 直接调 API |

## 已知设备

> 权威来源: 项目根目录 `devices.json`。密码通过 `password_from` 引用环境变量，禁止明文存储。

| 设备 | IP | 用户名 | 密码来源 |
|------|-----|------|----------|
| AD1 | 192.168.8.30 | admin | $env:AD1_PASS |
| AD2 | 192.168.8.31 | admin | $env:AD2_PASS |

## 行为准则

### 必须行为
- ✅ 所有操作通过 `scripts/ad_api.py` 脚本
- ✅ 输出由脚本直接产出

### 禁止行为
- ❌ LLM 直调 AD API
- ❌ LLM 分析、推断、判断结果
- ❌ LLM 修改脚本输出内容

## 报告展示规则

**必须将脚本 stdout 内容直接展示在对话消息正文中**，不要放在 shell 执行结果的折叠区域中。

- 多设备输出含汇总表 + 每设备分块，可能较长
- LLM 全文展示，不截断、不折叠、不选择性展示
- 超过单条消息限制时分多条展示（保持设备分块完整）

## 多设备触发决策

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`（单台设备行为与 `--host` 等价）
4. 密码不同时 → 必须用 `--devices` JSON 文件

## 外部依赖

| 依赖 | 说明 |
|------|------|
| Python 标准库 | `json`, `ssl`, `sys`, `urllib.request` |
| 网络 | HTTPS only, self-signed certs ignored by default, timeout 30s |
| API Base Path | `/api/lb/current-version/` |

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

- **ad-perception**: AD 感知分析（流量异常/状态告警/地址冲突/日志线索）
- **ad-check-analysis**: AD 系统巡检
- **ad-blackbox-analysis**: AD 黑盒日志分析
