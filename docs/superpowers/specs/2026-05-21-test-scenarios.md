# 异步轮询修复 — 测试场景清单

> 日期: 2026-05-21 | 测试设备: 14.18.243.211:21039, 14.18.243.211:21044

## perception.py logs (21 场景)

### N: 正常 (7)
| # | 场景 | 预期 |
|---|------|------|
| N1 | 单设备 markdown | 表格, exit 0 |
| N2 | 单设备 JSON | JSON含host/entries/total, exit 0 |
| N3 | limit=10 | 10行, exit 0 |
| N4 | 无VS设备 | 正常表格, exit 0 |
| N5 | 多设备 markdown | 摘要+两台表格, exit 0 |
| N6 | 多设备 JSON | JSON multi模式, exit 0 |
| N7 | 密码来自环境变量 | 同N1, exit 0 |

### B: 边界 (8)
| # | 场景 | 预期 |
|---|------|------|
| B1 | limit=1 | 1行, exit 0 |
| B2 | limit=0 | 空表格, exit 0 |
| B3 | limit超大 | 全部日志, exit 0 |
| B4 | 多设备部分失败 | exit 7 |
| B5 | 多设备全失败 | exit 1 |
| B6 | 多设备认证失败 | exit 2 |
| B7 | --devices JSON | 同N5, exit 0 |
| B8 | 日志缺字段 | 不崩溃 |

### E: 错误 (6)
| # | 场景 | 预期 |
|---|------|------|
| E1 | 无--host | exit 4 |
| E2 | 无密码 | exit 4 |
| E3 | 无效IP | exit 1 |
| E4 | 错误端口 | exit 1 |
| E5 | --host+--hosts同时 | warning, exit 0 |
| E6 | --hosts空串 | exit 4 |

## blackbox.py (40 场景, 7 组)

### G1: 正常流程 (9)
### G2: progress 状态分支 (6)
### G3: download 状态分支 (5)
### G4: --complete 废弃别名 (4)
### G5: 日期校验 (5)
### G6: 错误处理 (10)
### G7: --devices JSON (5)
