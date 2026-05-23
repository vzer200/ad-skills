---
name: ad-check-analysis
description: 深信服 AD 巡检 skill。用于对 AD1/AD2 或批量设备执行标准巡检、全量巡检、历史巡检查询、进度轮询、报告下载与分析。用户提到巡检、标准巡检、批量巡检、健康检查、巡检报告、AD1 巡检时触发。
---

# AD 巡检

## 强制规则

- 巡检前必须先调用 `ad-connect` 做连接预检。
- 所有业务逻辑必须由 `skills/ad-check-analysis/scripts/check.py` 执行。
- 必须先查 `history`，再分步执行 `run -> progress -> wait`。WorkBot 工具调用约 60 秒会超时，禁止使用 `run --wait` 这类长阻塞命令。
- `run` 只负责启动巡检，必须显式传 `--work-dir`；`progress` 每次只轮询一次，可重复调用；确认完成后再用 `wait --timeout 55 --poll-interval 5` 下载和分析报告。
- 脚本输出是唯一事实来源。禁止模型自行生成巡检结论、风险项、分数或报告内容。
- 如果用户指定 AD1/AD2，优先使用设备清单中的主机和密码。设备清单可能位于 `devices.json`、`skills/devices.json`、`skills/ad-check-analysis/devices.json` 或 `.claude/skills/ad-check-analysis/devices.json`；必须先检查这些位置并选择存在的文件，不要因为根目录没有 `devices.json` 就向用户追问地址或密码。
- 验收交互必须像真实人工：不要要求用户补充命令参数。用户只说“请对 AD1 做一次巡检”时，先用短问题让用户选择场景；用户回答“标准巡检/全量巡检/安全巡检”后，再确认是否继续/强制；用户回答“强制”后执行脚本并加 `--force`。
- 如果用户首句已经明确“标准巡检/全量巡检/安全巡检”，不要再次追问场景，只在需要覆盖历史上限或需要确认时追问“是否强制继续”。
- 用户说“AD 所有设备/全部 AD 设备”时，使用设备清单批量巡检，不要加 `--device AD1`。
- 评分准则：pass 按 1 分，warn 按 0.5 分，fail 按 0 分；综合评分只平均当前报告中实际出现的维度，不能让空的健康/安全/功能维度拉低分数。
- 用户要求标准巡检、全量巡检、安全巡检时，分别使用用户确认的场景名传给 `--scene`。

## 标准巡检工作流

```bash
export AD_CHECK_WORKDIR="${AD_CHECK_WORKDIR:-/tmp/ad_check_ad1}"
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-check-analysis/devices.json --device AD1 --format json
python3 skills/ad-check-analysis/scripts/check.py history --devices skills/ad-check-analysis/devices.json --device AD1
python3 skills/ad-check-analysis/scripts/check.py run --devices skills/ad-check-analysis/devices.json --device AD1 --scene "标准巡检" --force --work-dir "$AD_CHECK_WORKDIR"
python3 skills/ad-check-analysis/scripts/check.py progress --devices skills/ad-check-analysis/devices.json --device AD1
# 若 progress 仍是 WAITING/RUNNING，间隔 10-15 秒后再次调用 progress。不要用一个长命令阻塞等待。
python3 skills/ad-check-analysis/scripts/check.py wait --devices skills/ad-check-analysis/devices.json --device AD1 --work-dir "$AD_CHECK_WORKDIR" --poll-interval 5 --timeout 55
```

全量巡检和安全巡检使用相同命令，只替换 `--scene "全量巡检"` 或 `--scene "安全巡检"`。

如果用户要求分步进度，`run` 返回了工作目录或任务 ID 后，后续 `progress/wait` 命令必须使用脚本返回值，不要凭记忆拼接。

## 批量巡检

```bash
export AD_CHECK_WORKDIR="${AD_CHECK_WORKDIR:-/tmp/ad_check_all}"
python3 skills/ad-connect/scripts/connect.py --devices skills/ad-check-analysis/devices.json --format json
python3 skills/ad-check-analysis/scripts/check.py history --devices skills/ad-check-analysis/devices.json
python3 skills/ad-check-analysis/scripts/check.py run --devices skills/ad-check-analysis/devices.json --scene "标准巡检" --force
python3 skills/ad-check-analysis/scripts/check.py progress --devices skills/ad-check-analysis/devices.json
# 若任一设备仍是 WAITING/RUNNING，间隔 10-15 秒后再次调用 progress。
python3 skills/ad-check-analysis/scripts/check.py wait --devices skills/ad-check-analysis/devices.json --poll-interval 5 --timeout 55
```

## 输出模板

```text
## 巡检结论
- 目标：<AD1/全部设备>
- 场景：<标准巡检/全量巡检/安全巡检>
- 数据来源：设备巡检报告
- 综合评分：<score>/100
- 异常数量：<fail+warn>

## 巡检过程
- 连接校验：<通过/失败>
- 历史记录：<可巡检/达到上限后已强制继续>
- 进度轮询：<完成/超时/失败>
- 报告获取：<成功/失败>

## 分类统计
| 类别 | 检查项 | 通过 | 异常 | 得分 |
| --- | ---: | ---: | ---: | ---: |
| 功能 | <n> | <n> | <n> | <score> |
| 健康 | <n> | <n> | <n> | <score> |
| 安全 | <n> | <n> | <n> | <score> |

## 重点异常
<只摘录脚本输出中的 fail/warn；没有则写“无”。>

## 原始报告
<原样展示巡检报告输出；不要自行补充>
```
