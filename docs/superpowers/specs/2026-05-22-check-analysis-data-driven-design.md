# AD 巡检分析引擎：数据驱动重构设计

**日期**: 2026-05-22
**状态**: 已批准

---

## 背景

当前 v2 引擎 `_analyze_v2()` 存在**场景绑定问题**：分析范围由 `check_info.json` 中的 `rules` 列表控制，而该列表因巡检场景（标准/安全/全量）不同而变化。当设备运行标准巡检时，功能巡检的 ~30 项检查虽然有数据却不会被分析。

同时，映射表分散在 5 个数据结构中（`CHECK_NAMES`, `CHECK_DESCRIPTIONS`, `CHECK_CATEGORY_MAP`, `RULE_FIELD_MAP`, `CORRECTED_FIELD_RULES`），覆盖不全（仅 35 条），维护困难。

另有 `analyze_v1()` 作为旧引擎保留，通过 `AD_CHECK_ENGINE` 环境变量切换，增加了复杂度。

## 目标

- **数据驱动**：ad.json 有什么字段就分析什么，不受场景限制
- **映射完整**：参考 Download 版本的 67 条 CHECK_RULES，覆盖全部巡检项
- **声明式规则**：保留 v2 的 14 种类型化判定，新增字段只需加声明
- **单引擎**：删除 v1，删除双引擎切换，只保留一个 `analyze()`

## 设计

### 数据结构

#### 1. FIELD_RULES — ad.json 字段 → 判定规则 + 元数据

每个 ad.json 字段一条记录，包含判定规则和显示信息：

```python
FIELD_RULES = {
    "field_name": {
        "name": "中文显示名",
        "description": "预期状态的用户友好描述",
        "category": "feature|health|secure",
        "check_key": "CHECK_ITEM_KEY",    # 关联 CHECK_RULES，用于多字段聚合
        "type": "threshold",              # 判定类型
        # 以下为 type-specific 参数
        "abnormal": 0,                    # 阈值
        "compare": "==",                  # 比较符
        "severity": "fail",               # 异常时的状态
    },
}
```

覆盖范围：约 60-70 条（ad.json 中所有巡检相关字段），包含当前缺失的功能巡检字段（DNS、集群、静态路由等 ~30 项）。

支持的判定类型（14 种，从 `CORRECTED_FIELD_RULES` 继承）：
`threshold`, `bool_false`, `bool_true`, `str_equal`, `str_not_equal`, `non_empty`, `empty_dict`, `not_normal`, `not_zero`, `zero`, `has_value`, `missing`, `nested_list`, `eth_parse`

#### 2. CHECK_RULES — 检查项聚合定义

67 条检查项，对应参考文件的 CHECK_RULES 加上关联字段信息：

```python
CHECK_RULES = {
    "APP_VERSION_CHECK": {
        "name": "推荐软件版本检测",
        "desc": "检查当前版本和推荐版本的差距...",
        "category": "feature",
        "fields": ["ad_appversion"],
    },
    "SSL_POLICY_CHECK": {
        "name": "SSL策略检测",
        "desc": "检测当前设备的SSL加密/卸载是否启用不安全的协议/不安全算法",
        "category": "secure",
        "fields": ["unsafe_algorithm", "unsafe_protocol"],
    },
    # ... 67 条
}
```

`fields` 列出该检查项关联的 ad.json 字段名，用于多字段聚合和覆盖验证。

#### 3. 删除的旧表

| 旧表 | 去向 |
|------|------|
| `CHECK_NAMES` | 合并到 `CHECK_RULES.name` |
| `CHECK_DESCRIPTIONS` | 合并到 `CHECK_RULES.desc` + `FIELD_RULES.description` |
| `CHECK_CATEGORY_MAP` | 合并到 `CHECK_RULES.category` |
| `RULE_FIELD_MAP` | 合并到 `CHECK_RULES.fields`（反向映射） |
| `CORRECTED_FIELD_RULES` | 合并到 `FIELD_RULES` |
| `_SUGGESTION_MAP` | 保留，独立存在 |

### 分析引擎

```python
def analyze(data: dict) -> dict:
    """
    数据驱动分析：遍历 ad.json 所有字段，匹配 FIELD_RULES，
    对每个有规则的字段做类型化判定，然后按 CHECK_RULES.fields 聚合。
    不依赖 check_info 控制分析范围。
    """
```

执行流程：

1. `data.items()` 遍历 ad.json 所有字段
2. 查 `FIELD_RULES`，无规则跳过（即元数据字段自动忽略）
3. `_evaluate_field(value, rule)` 做类型化判定，返回 (status, value_str, detail)
4. 暂存为 `{field_name: {status, name, value, detail, check_key}}`
5. 按 `check_key` 聚合：遍历 CHECK_RULES，将其 `fields` 列表中的多个字段结果合并为一项（取最差 status），得到最终 `check_results`
6. 孤字段处理：FIELD_RULES 中 `check_key` 不在 CHECK_RULES 中的字段，直接以 field_name 为 key 进入 check_results
7. 按 `category` 分类，计算各维度评分
8. 生成优化建议

### FIELD_RULES 与 CHECK_RULES 的关系

- `FIELD_RULES` 是**字段级**规则表：key 是 ad.json 字段名
- `CHECK_RULES` 是**检查项级**定义表：key 是检查项 ID，`fields` 列出该检查项关联的字段
- 大多数是 1:1 映射（一个字段对应一个检查项）
- 少量是 N:1 映射（如 `unsafe_algorithm` + `unsafe_protocol` → `SSL_POLICY_CHECK`）
- 聚合规则：N 个字段取最差 status（fail > pass）

### check_info.json 的角色

- `wait_and_download()` 继续从 ZIP 中提取该文件，写入 meta
- `analyze()` **不使用** check_info 来控制分析范围
- 保留目的：调试追溯（知道设备端声明了哪些规则）

### 文件变化

| 文件 | 性质 | 变化 |
|------|------|------|
| `check.py` | 重构 | 删除 `analyze_v1()` (~560行)，删除 `_analyze_v2()` (~200行)，删除 `_print_compare_diff()`，删除 `AD_CHECK_ENGINE` 逻辑；新增 `FIELD_RULES` (~70条) + `CHECK_RULES` (67条) + 新 `analyze()` (~80行)；`_check_field_rule()` 改名 `_evaluate_field()`，逻辑不变；`_check_vip_pool()` 保留 |
| `render.py` | 不变 | — |
| `test/test_check.py` | 更新 | 删除 v1/v2/compare 测试；新增字段覆盖率测试、聚合逻辑测试；保留字段判定单元测试（适配新接口） |
| `SKILL.md` | 微调 | 更新"巡检结果分析"章节（移除 v1/v2 切换说明） |
| `examples/output.md` | 更新 | 检查项数从 35 更新为实际覆盖数 |

### 预期效果

- ad.json 中的所有巡检字段都会被分析，不再受场景限制
- 映射表从 35 条扩展到 67 条，覆盖参考文件全部检查项
- 新增字段只需在 `FIELD_RULES` 加一条声明
- 代码量减少约 600 行（删 v1 + 双引擎逻辑，增统一映射表）
- 单引擎，无环境变量切换
