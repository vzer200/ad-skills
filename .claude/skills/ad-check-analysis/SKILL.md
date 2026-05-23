---
name: ad-check-analysis
description: 深信服 AD 巡检 skill。用于对 AD1/AD2 或批量设备执行标准巡检、全量巡检、历史巡检查询、进度轮询、报告下载与分析。用户提到巡检、标准巡检、批量巡检、健康检查、巡检报告、AD1 巡检时触发。
---

# AD 巡检

## 强制规则

- 巡检前必须先调用 `ad-connect` 做连接预检。
- 所有业务逻辑必须由 `skills/ad-check-analysis/scripts/check.py` 执行。
- 必须先查 `history`，再用 `run --wait` 原子入口完成启动、等待、下载和分析；只有用户明确要求分步观察进度时才拆成 `run -> progress -> wait`。
- 脚本 stdout 是唯一事实来源。禁止模型自行生成巡检结论、风险项、分数或报告内容。
- 如果用户指定 AD1/AD2，优先使用 `devices.json` 中的主机和环境变量密码。
- 验收交互必须像真实人工：不要要求用户补充命令参数。用户说“请对 AD1 做一次标准巡检”时，只用短问题确认场景；用户回答“标准巡检”后，再确认是否继续/强制；用户回答“继续”后执行脚本。
- 用户说“AD 所有设备/全部 AD 设备”时，使用 `devices.json` 批量巡检，不要加 `--device AD1`。
- 评分准则：pass 按 1 分，warn 按 0.5 分，fail 按 0 分；综合评分只平均当前报告中实际出现的维度，不能让空的健康/安全/功能维度拉低分数。
- 用户要求标准巡检、全量巡检、安全巡检时，分别使用用户确认的场景名传给 `--scene`。

## 标准巡检工作流

```bash
python3 skills/ad-connect/scripts/connect.py --devices devices.json --device AD1 --format json
python3 skills/ad-check-analysis/scripts/check.py history --devices devices.json --device AD1
python3 skills/ad-check-analysis/scripts/check.py run --devices devices.json --device AD1 --scene "标准巡检" --wait --work-dir "$AD_CHECK_WORKDIR"
```

全量巡检和安全巡检使用相同命令，只替换 `--scene "全量巡检"` 或 `--scene "安全巡检"`。

如果用户要求分步进度，`run` 返回了工作目录或任务 ID 后，后续 `progress/wait` 命令必须使用脚本返回值，不要凭记忆拼接。

## 批量巡检

```bash
python3 skills/ad-connect/scripts/connect.py --devices devices.json --format json
python3 skills/ad-check-analysis/scripts/check.py run --devices devices.json --scene "标准巡检" --wait --work-dir "$AD_CHECK_WORKDIR"
```

## 输出模板

```text
## 巡检结论
- 目标：<AD1/全部设备>
- 场景：<标准巡检/全量巡检/安全巡检>
- 结果来源：check.py stdout
- 综合评分：<score>/100
- 异常数量：<fail+warn>

## 工具调用
- connect.py：<成功/失败>，<目标和认证摘要>
- check.py history：<成功/失败>，<历史记录摘要>
- check.py run --wait：<成功/失败>，<报告下载/分析摘要>

## 分类统计
| 类别 | 检查项 | 通过 | 异常 | 得分 |
| --- | ---: | ---: | ---: | ---: |
| 功能 | <n> | <n> | <n> | <score> |
| 健康 | <n> | <n> | <n> | <score> |
| 安全 | <n> | <n> | <n> | <score> |

## 重点异常
<只摘录 check.py stdout 中的 fail/warn；没有则写“无”。>

## 原始报告
<原样展示 check.py run --wait 或 analyze 的 stdout；不要自行补充>
```
