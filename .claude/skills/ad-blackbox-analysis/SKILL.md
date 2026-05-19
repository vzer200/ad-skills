---
name: ad-blackbox-analysis
description: Use when exporting or analyzing AD blackbox logs for troubleshooting, security audit, or performance analysis
---

# AD Blackbox Analysis

深信服 AD 设备黑盒日志导出与分析。

## Workflow

```
导出黑盒 → 查询任务状态 → 下载文件 → 解压分析
```

## CLI

```bash
python .claude/skills/ad-blackbox-analysis/scripts/blackbox.py --host https://10.146.10.254 --user admin --password admin \
  --from-date 2026-05-03 --to-date 2026-05-09 --archive-password admin
```

## Key Rules

### Time Range Limit
**最大 7 天**。超过时自动调整为最近 7 天并告知用户。

### Password
使用 `password` 参数（明文），不用 `pk_password`。

### File Structure

```
blackbox.tar.gz (ZIP加密)
└── hislog/adlog1.tgz
    ├── hislog/           # 审计日志
    │   └── YYYYMMDD.audit/zh_CN/0.audit.csv
    └── log/              # 系统日志
        └── YYYYMMDD/zh_CN/0/*.csv
```

### Audit Log Fields

| Position | Field |
|----------|-------|
| 1 | 时间 |
| 2 | 用户 |
| 3 | 来源IP |
| 4 | 方法 (POST/GET/PUT/DELETE) |
| 5 | 模块 |
| 6 | 子模块 |
| 7 | 状态 (SUCCESS/FAILED) |
| 8 | 路径 |
| 9 | 错误码 |
| 10 | 描述 |

## Analysis Principle

**结果必须严格从黑盒日志文件中获取**，不得掺杂其他 API 调用或推断内容。

## Known Devices

| Name | IP | User | Password |
|------|-----|------|----------|
| AD1 | 10.146.10.254 | admin | admin |
