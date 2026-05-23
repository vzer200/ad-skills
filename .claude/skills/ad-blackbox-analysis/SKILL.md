---
name: ad-blackbox-analysis
description: 深信服 AD 黑盒日志分析 skill。用于导出、解压和分析 AD 设备黑盒日志、审计日志和系统日志。用户提到黑盒、黑盒日志、审计日志、日志导出、blackbox、取证分析时触发。
---

# AD 黑盒日志分析

## 强制规则

- 连接真实设备前必须先调用 `ad-connect`。
- 日志导出、解压和分析必须由 `skills/ad-blackbox-analysis/scripts/blackbox.py` 执行。
- 脚本 stdout 是唯一事实来源。禁止模型自行编造审计结论或日志条目。
- 如果用户提供已下载的黑盒文件，只分析该文件；如果要从设备下载，必须先完成连接预检。
- 面向用户的正文不要展示“工具调用”、脚本名、命令、退出码或 stdout/stderr 摘要；这些只供验收侧后台核验。

## 命令

```bash
python3 skills/ad-connect/scripts/connect.py --devices devices.json --format json
python3 skills/ad-blackbox-analysis/scripts/blackbox.py --host https://192.168.8.30 --user admin --password "$AD1_PASS" --from-date <YYYY-MM-DD> --to-date <YYYY-MM-DD> --output "$AD_BLACKBOX_WORKDIR"
```

## 输出模板

```text
## 日志目标
<设备和时间范围>

## 处理进度
- 连接校验：<通过/失败>
- 日志获取：<完成/失败/使用已上传文件>
- 分析状态：<完成/失败>

## 分析结果
<原样展示 blackbox.py stdout；不要自行补充>
```
