---
name: ad-ops
description: Use when managing Sangfor AD devices - users, virtual services, pools, SSL certs, HA status, SSH config, or system stats
---

# AD Ops

Sangfor AD (应用交付) 设备 REST API 集成。零依赖，使用 Python 内置库。

## Quick Start

```python
from .claude.skills.ad_ops.scripts.ad_api import ADClient

client = ADClient(host="https://10.146.10.254", username="admin", password="admin")
users = client.get_users()
```

## CLI

```bash
python .claude/skills/ad-ops/scripts/ad_api.py --host https://10.146.10.254 --password admin users list
python .claude/skills/ad-ops/scripts/ad_api.py --host https://10.146.10.254 --password admin slb list
python .claude/skills/ad-ops/scripts/ad_api.py --host https://10.146.10.254 --password admin pool list
python .claude/skills/ad-ops/scripts/ad_api.py --host https://10.146.10.254 --password admin stat sys
python .claude/skills/ad-ops/scripts/ad_api.py --host https://10.146.10.254 --password admin ha status
python .claude/skills/ad-ops/scripts/ad_api.py --host https://10.146.10.254 --password admin cert list
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

## Known Devices

| Name | IP | User | Password |
|------|-----|------|----------|
| AD1 | 10.146.10.254 | admin | admin |

## Notes

- HTTPS only, self-signed certs ignored by default
- Default timeout: 30s
- Base path: `/api/lb/current-version/`
