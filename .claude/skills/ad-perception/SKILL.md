---
name: ad-perception
description: 深信服 AD 感知分析 skill。用于分析 VS 流量异常、CPU/内存/磁盘/连接状态变化、IP:Port 冲突、Pool 节点重复、服务日志线索和异常增减趋势。用户提到感知分析、异常检测、流量突增、流量下降、地址冲突、状态告警、日志关联时触发。
---

# AD 感知分析

## 强制规则

- 分析真实设备前必须先调用 `ad-connect`。
- 所有分析必须由 `skills/ad-perception/scripts/perception.py` 或 `collector.py` 生成。
- 脚本 stdout 是唯一事实来源。禁止模型自行推断根因、编造异常、补充未由脚本返回的设备状态。
- 用户要求全量感知分析时，必须使用 `perception.py analyze`。
- 用户要求趋势基线采集时，才运行 `collector.py collect`。
- 用户指定 AD1/AD2 时，连接预检必须用 `--device` 限定单台设备；分析命令使用对应设备地址和环境变量密码。
- 如果历史基线数据不足，脚本会输出实时/降级分析；最终结论只能照脚本 stdout 表达，不能补充 3σ、日志根因或趋势结论。

## 全量感知分析

```bash
python3 skills/ad-connect/scripts/connect.py --devices devices.json --device AD1 --format json
python3 skills/ad-perception/scripts/perception.py analyze --host "${AD1_HOST:-https://14.18.243.211:21044}" --user admin --password "$AD1_PASS" --format markdown
```

## 分项分析

```bash
python3 skills/ad-perception/scripts/perception.py traffic --host "${AD1_HOST:-https://14.18.243.211:21044}" --user admin --password "$AD1_PASS" --format markdown
python3 skills/ad-perception/scripts/perception.py state --host "${AD1_HOST:-https://14.18.243.211:21044}" --user admin --password "$AD1_PASS" --format markdown
python3 skills/ad-perception/scripts/perception.py conflict --host "${AD1_HOST:-https://14.18.243.211:21044}" --user admin --password "$AD1_PASS" --format markdown
python3 skills/ad-perception/scripts/perception.py logs --host "${AD1_HOST:-https://14.18.243.211:21044}" --user admin --password "$AD1_PASS" --format markdown
```

## 输出模板

```text
## 分析目标
<设备和分析维度>

## 工具调用
- connect.py: <exit code/摘要>
- perception.py: <exit code/摘要>

## 分析结果
<原样展示 perception.py stdout；不要自行补充>
```
