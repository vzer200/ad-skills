# AD 巡检分析

深信服 AD 设备系统巡检技能。

## 功能

- 巡检场景查询
- 执行巡检任务
- 查询巡检进度
- 下载巡检报告
- 分析巡检结果

## 快速开始

### 查看巡检场景

```bash
cd ~/manager-workspace/workspace/skills/ad-check-analysis

python scripts/check.py scenes \
  --host https://10.74.27.42 \
  --user admin \
  --password "$AD_PASS"
```

### 执行标准巡检

```bash
python scripts/check.py run \
  --host https://10.74.27.42 \
  --user admin \
  --password "$AD_PASS" \
  --scene "标准巡检"
```

### 执行安全巡检

```bash
python scripts/check.py run \
  --host https://10.74.27.42 \
  --user admin \
  --password "$AD_PASS" \
  --scene "安全巡检"
```

### 执行全量巡检

```bash
python scripts/check.py run \
  --host https://10.74.27.42 \
  --user admin \
  --password "$AD_PASS" \
  --scene "全量巡检"
```

### 查询巡检进度

```bash
python scripts/check.py progress \
  --host https://10.74.27.42 \
  --user admin \
  --password "$AD_PASS"
```

### 查看历史巡检记录

```bash
python scripts/check.py history \
  --host https://10.74.27.42 \
  --user admin \
  --password "$AD_PASS"
```

## 已知设备

| 设备名 | 管理地址来源 | 用户名 | 密码来源 |
|--------|--------------|--------|----------|
| AD1 | devices.json / AD1_HOST | admin | Stored in devices.json |
| AD2 | devices.json / AD2_HOST | admin | Stored in devices.json |

## 巡检场景

| 场景 | 功能检查 | 健康检查 | 安全检查 | 总计 |
|------|----------|----------|----------|------|
| 标准巡检 | 3 项 | 25 项 | 7 项 | 35 项 |
| 安全巡检 | — | — | 7 项 | 7 项 |
| 全量巡检 | 34 项 | 26 项 | 7 项 | 67 项 |

## 工作流

| 维度 | 单设备 | 多设备 |
|------|--------|--------|
| 设备来源 | 用户指定 / 询问用户 | 用户指定 / devices.json 全部 |
| 场景选择 | 未指定→先让用户选择 | 未指定→先让用户选择 |
| 历史检查 | 用户选场景后查 history，仅 `limit_reached=true` 时询问强制 | 用户选场景后查 history，仅任一设备 `limit_reached=true` 时询问强制 |

详细流程见 [SKILL.md](SKILL.md) 工作流决策树。

## 输出示例

```markdown
## 巡检结论
- 目标：AD1 (192.168.8.30)
- 场景：标准巡检
- 数据来源：设备巡检报告
- 综合评分：93/100
- 异常数量：1

## 分类统计
| 类别 | 检查项 | 通过 | 异常 | 得分 |
| --- | ---: | ---: | ---: | ---: |
| 功能 | 3 | 3 | 0 | 🟢 100/100 |
| 健康 | 25 | 24 | 1 | 🟢 96/100 |
| 安全 | 6 | 6 | 0 | 🟢 100/100 |

## 设备基本信息
| 项目 | 状态 |
|------|------|
| AD 版本 | SANGFOR-MSDN-AD-7.0.28 |
| 网关 ID | 8F4CDD45 |
| 运行时间 | 218天23小时33分钟 |
```
