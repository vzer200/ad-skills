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
| AD1 | devices.json / AD1_HOST | admin | AD1_PASS |
| AD2 | devices.json / AD2_HOST | admin | AD2_PASS |

## 巡检场景

| 场景 | 功能检查 | 健康检查 | 安全检查 | 总计 |
|------|----------|----------|----------|------|
| 标准巡检 | 4 项 | 21 项 | 7 项 | 32 项 |
| 安全巡检 | — | — | 7 项 | 7 项 |
| 全量巡检 | 35 项 | 25 项 | 7 项 | 67 项 |

## 工作流

| 维度 | 单设备 | 多设备 |
|------|--------|--------|
| 设备来源 | 用户指定 / 询问用户 | 用户指定 / devices.json 全部 |
| 场景选择 | 指定→直接用；未指定→告知默认+确认 | 指定→直接用；未指定→默认标准 |
| 历史检查 | 查 history，满 5 条询问确认 | 不查，直接 --force |

详细流程见 [SKILL.md](SKILL.md) 工作流决策树。

## 输出示例

```markdown
# AD 巡检分析报告

## 📊 设备基本信息

| 项目 | 值 |
|------|-----|
| AD 版本 | SANGFOR-MSDN-AD-7.0.28 |
| 网关 ID | 8F4CDD45 |
| 运行时间 | 218天23小时33分钟 |

## 🔍 巡检结果详情

### ✅ 正常项

| 检查项 | 状态 | 说明 |
|--------|------|------|
| cpu_check | ✅ 正常 | 17% |
| memory_check | ✅ 正常 | 42% |

### ⚠️ 异常项

| 检查项 | 状态 | 详情 |
|--------|------|------|
| ssh_check | ⚠️ 异常 | SSH 已禁用 |

## ✅ 健康评估

| 项目 | 状态 |
|------|------|
| 总检查项 | 32 项 |
| 通过项 | 30 项 |
| 异常项 | 2 项 |
| 通过率 | 93.8% |
```
