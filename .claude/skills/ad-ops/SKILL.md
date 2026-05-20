---
name: ad-ops
description: 深信服 AD 设备运维管理技能，支持用户/虚拟服务/Pool/SSL证书/HA状态/SSH配置/系统统计、设备总览快照等操作。当用户提到"运维"、"设备管理"、"查询VS"、"查看证书"、"设备状态"、"系统统计"、"设备总览"、"AD操作"时触发。
---

# AD 智能运维

深信服 AD (应用交付) 设备 REST API 集成管理。

## 功能概述

| 功能 | 说明 |
|------|------|
| 用户管理 | 用户的增删改查 |
| 虚拟服务 | 虚拟服务的增删改查 |
| 池管理 | 池的增删改查 |
| SSL 证书 | 证书列表及有效期查询 |
| HA 状态 | 高可用状态和集群信息查询 |
| SSH 配置 | SSH 启用/禁用/状态查询 |
| 系统统计 | VS 指标、吞吐趋势、节点状态 |

## CLI 命令参考

```bash
python scripts/ad_api.py --host https://10.146.10.254 --password admin users list
python scripts/ad_api.py --host https://10.146.10.254 --password admin slb list
python scripts/ad_api.py --host https://10.146.10.254 --password admin pool list
python scripts/ad_api.py --host https://10.146.10.254 --password admin stat sys
python scripts/ad_api.py --host https://10.146.10.254 --password admin ha status
python scripts/ad_api.py --host https://10.146.10.254 --password admin cert list
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
| 所有操作 | `python scripts/ad_api.py` | ❌ 直接调 API |

## 已知设备

| 设备 | IP | 用户名 | 密码 |
|------|-----|------|------|
| AD1 | 10.146.10.254 | admin | admin |

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

## 外部依赖

| 依赖 | 说明 |
|------|------|
| Python 标准库 | `http.client`, `json`, `ssl`, `sys` |
| 网络 | HTTPS only, self-signed certs ignored by default, timeout 30s |
| API Base Path | `/api/lb/current-version/` |

## 错误码

| 场景 | exit code |
|------|----------|
| 完全成功 | 0 |
| 连接失败 | 1 |
| 全部 API 失败 | 1 |
| 认证失败 | 2 |
| SQLite 写入失败 | 3 |
| 参数错误 | 4 |
| 部分失败 | 5 |
| 采集器重复启动 | 6 |
| ADClient import 失败 | 9 |

## 相关技能

- **ad-perception**: AD 感知分析（流量异常/状态告警/地址冲突/日志线索）
- **ad-check-analysis**: AD 系统巡检
- **ad-blackbox-analysis**: AD 黑盒日志分析
