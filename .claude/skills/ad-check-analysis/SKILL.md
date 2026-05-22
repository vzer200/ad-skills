---
name: ad-check-analysis
description: 深信服 AD 巡检 skill。用于对 AD1/AD2 或批量设备执行标准巡检、全量巡检、历史巡检查询、进度轮询、报告下载与分析。用户提到巡检、标准巡检、批量巡检、健康检查、巡检报告、AD1 巡检时触发。
---

# AD 巡检

## 强制规则

- 巡检前必须先调用 `ad-connect` 做连接预检。
- 所有业务逻辑必须由 `skills/ad-check-analysis/scripts/check.py` 执行。
- 必须按 `history -> run -> progress -> wait` 顺序执行标准巡检。
- 脚本 stdout 是唯一事实来源。禁止模型自行生成巡检结论、风险项、分数或报告内容。
- 如果用户指定 AD1/AD2，优先使用 `devices.json` 中的主机和环境变量密码。

## 标准巡检工作流

```bash
python3 skills/ad-connect/scripts/connect.py --devices devices.json --format json
python3 skills/ad-check-analysis/scripts/check.py history --host https://192.168.8.30 --username admin --password "$AD1_PASS"
python3 skills/ad-check-analysis/scripts/check.py run --host https://192.168.8.30 --username admin --password "$AD1_PASS" --scene "标准巡检" --work-dir "$AD_CHECK_WORKDIR"
python3 skills/ad-check-analysis/scripts/check.py progress --host https://192.168.8.30 --username admin --password "$AD1_PASS"
python3 skills/ad-check-analysis/scripts/check.py wait --host https://192.168.8.30 --username admin --password "$AD1_PASS" --work-dir "$AD_CHECK_WORKDIR"
```

如果 `run` 返回了工作目录或任务 ID，后续命令必须使用脚本返回值，不要凭记忆拼接。

## 批量巡检

```bash
python3 skills/ad-connect/scripts/connect.py --devices devices.json --format json
python3 skills/ad-check-analysis/scripts/check.py run --devices devices.json --scene "标准巡检" --wait --work-dir "$AD_CHECK_WORKDIR"
```

## 输出模板

```text
## 巡检目标
<设备或设备组>

## 工具调用
- connect.py: <exit code/摘要>
- check.py history: <摘要>
- check.py run: <摘要>
- check.py progress: <摘要>
- check.py wait: <摘要>

## 巡检结果
<原样展示 check.py wait 或 analyze 的 stdout；不要自行补充>
```
