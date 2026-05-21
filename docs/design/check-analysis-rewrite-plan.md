# 巡检分析重写计划 v3：双文件融合分析（经 2 轮 Agent 审核）

## Context

### 问题根源

当前 `analyze()` 有 3 层问题：

1. **数据源残缺**：只读 `ad.json`，忽略 `acheck_offline_check_info.json`（ZIP 中存在但从未被使用）
2. **判定逻辑错误**：通过检查 ad.json 字段"是否存在"推断 pass/fail，而非分析字段"值是否正常"
3. **范围不准确**：硬编码约 65 项检查但不知道当前场景实际包含多少项

### 关键发现（实测验证）

- `checked: "true"` **≠ 通过**。实测设备 35 条规则全部 `checked: "true"`，但 ad.json 中 `ssh_authority=False`、`security_check_state=False`、`unsafe_algorithm=True` 等明显异常。`checked` 只表示"规则已执行"
- 设备标准巡检固定 **35 条规则**（含 `nic_health_check`、`snat_sport_exhaustion_check`）
- 真正的 pass/fail 判定逻辑来自 MCP 的 `AD_FIELD_RULES`（38 条类型化规则）

### 正确架构（经审核修正）

```
acheck_offline_check_info.json  →  定义检查范围（35 条 rule IDs）
ad.json                          →  提供字段值
CORRECTED_FIELD_RULES            →  对 ad.json 实际字段做类型化判定 → pass/fail/warn
                                  （基于 MCP 38 条规则，修正 5 条方向错误 + 6 条缺失字段）
```

### 审核发现：MCP AD_FIELD_RULES 的问题

MCP 的 38 条规则按 ad.json **字段名**索引，但其中多个在真实 ad.json 中不存在：
- `base_cpu_use_rate` — 不存在，实际是 `base_cpu_usage: []`
- `base_disk_read_only` — 不存在
- `base_disk_high_usage` — 不存在
- `base_ssd_life` — 不存在（VM 无 SSD）
- `base_net_state` — 不存在
- `admin_account` — 不存在，实际是 `admin: "true"`

另有 4 条判定方向与真实设备行为矛盾：
- `fan_state: abnormal=1` — 实际 value=1 表示正常
- `acceleration: abnormal=2` — 实际 value=2 表示加速卡正常
- `power_state: abnormal=-1` — -1 表示无传感器（VM），非故障
- `online: abnormal='false'` — "false" 表示未注册云平台，非断网

**结论：不能直接照搬 MCP AD_FIELD_RULES，必须用真实 ad.json 字段名 + 修正后的判定逻辑。**

### 审核发现的关键风险及缓解

| # | 风险 | 严重性 | 缓解 |
|---|------|--------|------|
| 1 | `nic_health_check`/`snat_sport_exhaustion_check` 缺 AD_FIELD_RULES 条目 → 主路径 KeyError | 确定崩溃 | 为 35 条规则逐一验证覆盖，缺失的显式补充；nic_health_check 需复合规则（双字段） |
| 2 | 判定函数二元输出（is_abnormal）无法区分 fail vs warn → 大量非关键配置项被误标 | 高 | AD_FIELD_RULES 每条增加 `severity` 字段（`"fail"` / `"warn"`） |
| 3 | `str_equal` 方向错误 — 很多检查是"不等于正常值 = fail"而非"等于异常值 = fail" | 高 | 增加 `str_not_equal` 类型：`is_abnormal = (str(value) != normal)` |
| 4 | RULE_FIELD_MAP 字段映射错误 → 静默假阴性 | 高 | 对真实 ad.json 做双重校验；添加 `--debug` 模式 |
| 5 | VIP_POOL_CHECK 嵌套 dict 遍历无法用类型规则表达 | 高 | 特殊 handler 函数，不通过 AD_FIELD_RULES |
| 6 | None/空字符串/类型不匹配导致 TypeError 或静默 pass | 高 | `_check_field_rule` 入口守卫：None → 跳过；str 值在 threshold 中 try float() |
| 7 | check_info 畸形数据（空 dict/空 rules）→ AttributeError | 中 | `.get("rules")` + falsy 守卫，触发降级路径 |
| 8 | `_render_cross_device_comparison` 展示名修复方案不完整 | 中 | 从第一个可用 host 的 check_result 采样 `name` 字段 |
| 9 | 无回滚机制 | 中 | 保留 `analyze_v1()`，`AD_CHECK_ENGINE` 环境变量切换 |
| 10 | `_SUGGESTION_MAP` 仅 16 个键，需覆盖全部 35 条 rule_id | 中 | 填充全部 35 条映射 |

## 改动范围

| 文件 | 改动 |
|------|------|
| `check.py` | 新增常量 + 重写 `analyze()` + 保留 `analyze_v1()` + 更新 `wait_and_download()` + 更新 3 调用点 |
| `render.py` | 展示名 `k` → `r.get('name', k)` |
| `test/test_check.py` | 新增含真实结构的测试用例 |

**不动**：`devices.json`、`ad_api.py`、`multi_device.py`、其他 skill

## 实施步骤

### Step 0: 前置验证（实施前必做）

0.1 列出 35 条 rule_id 与 RULE_FIELD_MAP 的覆盖矩阵，确认无遗漏
0.2 列出 35 条 rule_id 对应 AD_FIELD_RULES 的覆盖矩阵，补充缺失的 `nic_health_check` 和 `snat_sport_exhaustion_check`
0.3 用真实 ad.json（从已有报告目录提取）跑一遍 `tmp_extract.py`，确认每个 rule_id 的字段值都能正确读取

### Step 1: 新增模块级常量 (check.py)

基于 3 轮审核反馈，修正后的配置：

**`CHECK_NAMES`** — 35 条 rule_id → 中文名（MCP 33 条 + `nic_health_check`、`snat_sport_exhaustion_check`）

**`CHECK_CATEGORY_MAP`** — rule_id → feature/health/secure

**`RULE_FIELD_MAP`** — rule_id → ad.json **实际**字段名列表（经真实 ad.json 验证）

**`CORRECTED_FIELD_RULES`** — 按 ad.json **实际字段名**索引的检测规则（41 条，含 severity）

**`_SUGGESTION_MAP`** — 更新键名为 rule_id，覆盖全部 35 条

`_check_field_rule(value, rule)` 支持 14 种类型：
`threshold` / `bool_false` / `bool_true` / `str_equal` / `str_not_equal` / `non_empty` / `not_normal` / `not_zero` / `zero` / `has_value` / `missing` / `empty_dict` / `nested_list` / `eth_parse`

#### CORRECTED_FIELD_RULES（按 ad.json 实际字段名，含 severity）

```python
CORRECTED_FIELD_RULES = {
    # === 阈值（threshold）===
    'power_state':       {'type': 'threshold', 'abnormal': -1, 'compare': '==', 'severity': 'warn',  'name': '电源状态'},  # -1=无传感器(VM正常), 非故障
    'fan_state':         {'type': 'threshold', 'abnormal': 0,  'compare': '==', 'severity': 'fail',  'name': '风扇状态'},  # 修正: 1=正常, 0=故障
    'acceleration':      {'type': 'threshold', 'abnormal': 0,  'compare': '==', 'severity': 'warn',  'name': '加速引擎'},  # 修正: 1/2=正常, 0=无卡
    'base_file_ds':      {'type': 'threshold', 'abnormal': 0,  'compare': '>',  'severity': 'fail',  'name': '文件描述符泄漏'},
    'base_log_error_exist':{'type': 'threshold','abnormal': 100,'compare': '>', 'severity': 'fail',  'name': '错误日志数量'},  # 修正: >100 fail, 0-100 warn
    'conntrack_count':   {'type': 'threshold', 'abnormal': 100000, 'compare': '>', 'severity': 'warn', 'name': '连接跟踪数'},
    'conntrack_new_count':{'type':'threshold', 'abnormal': 10000,  'compare': '>', 'severity': 'warn', 'name': '新建连接数'},
    'snmp_mem_rate':     {'type': 'threshold', 'abnormal': 90,  'compare': '>', 'severity': 'fail',  'name': '内存使用率'},  # 修正: >90 fail, 80-90 warn(分层)
    'base_cpu_usage':    {'type': 'threshold', 'abnormal': 90,  'compare': '>', 'severity': 'fail',  'name': 'CPU使用率'},  # 修正: 实际字段是base_cpu_usage, 非base_cpu_use_rate
    # === 布尔 False 异常 ===
    'ADAPI_authority':   {'type': 'bool_false', 'severity': 'warn',  'name': 'ADAPI授权'},
    'ssh_authority':     {'type': 'bool_false', 'severity': 'warn',  'name': 'SSH授权'},       # 修正: SSH禁用是安全加固, warn非fail
    'security_check_state':{'type':'bool_false', 'severity': 'fail',  'name': '安全检查状态'},
    'shm_sem_state':     {'type': 'bool_false', 'severity': 'fail',  'name': '共享内存状态'},
    'base_report_stab':  {'type': 'bool_false', 'severity': 'fail',  'name': '报表稳定性'},
    # === 字符串 ===
    'enable_iplimit':    {'type': 'str_equal', 'abnormal': 'false', 'severity': 'warn',  'name': 'IP限制'},
    'remote_mt':         {'type': 'str_equal', 'abnormal': 'true',  'severity': 'fail',  'name': '远程维护'},
    'online':            {'type': 'str_equal', 'abnormal': 'false', 'severity': 'warn',  'name': '设备在线状态'},  # 修正: 未注册云平台是warn非fail
    'auto_update':       {'type': 'str_not_equal', 'normal': 'true','severity':'warn',  'name': '自动更新'},     # 新增
    # === 非空（non_empty）===  空列表/空dict=pass, 非空=fail
    'weak_pwd':          {'type': 'non_empty', 'severity': 'fail',  'name': '弱密码'},
    'dangerous_port':    {'type': 'non_empty', 'severity': 'fail',  'name': '危险端口'},
    'base_core_process_lack':{'type':'non_empty','severity':'fail', 'name': '缺失核心进程'},
    'base_eth_abnormal': {'type': 'non_empty', 'severity': 'fail',  'name': '网卡异常'},
    'base_eth_mtu':      {'type': 'non_empty', 'severity': 'warn',  'name': '网卡MTU'},
    'base_drop_err_packet_rate':{'type':'non_empty','severity':'fail','name': '丢包率'},
    'id_conflict_list':  {'type': 'non_empty', 'severity': 'fail',  'name': '配置ID冲突'},
    'cluster_brain_split_check':{'type':'non_empty','severity':'fail','name': '集群脑裂检查'},
    'base_disk_high_usage':{'type':'non_empty', 'severity':'fail',  'name': '磁盘高使用率'},  # 部分设备存在
    'base_crash_time':   {'type': 'non_empty', 'severity': 'fail',  'name': '崩溃时间'},
    'base_blackbox_dmesg':{'type':'non_empty', 'severity':'warn',   'name': '黑盒dmesg数据'},  # 新增
    # === 布尔 True 异常 ===
    'unsafe_algorithm':  {'type': 'bool_true',  'severity': 'fail',  'name': '不安全算法'},
    'unsafe_protocol':   {'type': 'bool_true',  'severity': 'fail',  'name': '不安全协议'},
    # === 状态检查 ===
    'base_kernel_log':   {'type': 'not_zero',   'severity': 'fail',  'name': '内核日志'},
    'base_blackbox_state':{'type':'not_zero',   'severity': 'warn',  'name': '黑盒状态'},
    'alarms_enabled':    {'type': 'zero',        'severity': 'warn',  'name': '告警启用'},       # 修正: fail→warn
    'bios_update_state': {'type': 'has_value',   'severity': 'warn',  'name': 'BIOS更新状态'},
    'I350_nic_state':    {'type': 'not_normal',  'severity': 'fail',  'name': 'I350网卡状态'},   # 新增: nic_health_check用
    '82599_nic_state':   {'type': 'not_normal',  'severity': 'fail',  'name': '82599网卡状态'},  # 新增: nic_health_check用
    # === 特殊 ===
    'base_eth_info':     {'type': 'eth_parse',   'severity': 'fail',  'name': '网卡信息'},
    'snat_sport_exhaustion_log_num': {'type': 'threshold', 'abnormal': 0, 'compare': '>', 'severity': 'warn', 'name': 'SNAT端口耗尽'},
    'disk_info':         {'type': 'empty_dict',  'severity': 'warn',  'name': '磁盘信息'},
    'patch_info':        {'type': 'nested_list', 'key': 'patched_list', 'severity': 'warn', 'name': '补丁信息'},
    'admin':             {'type': 'str_not_equal','normal': 'true', 'severity': 'warn',  'name': '管理员账户'},  # 新增: check_admin_account 用
    'ad_appversion':     {'type': 'missing',      'severity': 'warn',  'name': 'AD版本'},        # 空值→warn
    'base_running_time': {'type': 'missing',      'severity': 'warn',  'name': '运行时间'},       # 空值→warn
}
```

#### 35 条 rule_id 完整映射表

```
rule_id                         → ad.json 字段                    → CORRECTED_FIELD_RULES 条目     → 判定方向
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
ssh_or_adapi_authority          → ssh_authority, ADAPI_authority → bool_false(warn) × 2          → 任一False→warn
patch_info                      → patch_info                    → nested_list(warn)              → patched_list为空→warn
base_report_stability           → base_report_stab              → bool_false(fail)               → False→fail
weak_password                   → weak_pwd                      → non_empty(fail)                → 非空→fail
ssl_strategy_check              → unsafe_algorithm,unsafe_protocol→bool_true(fail) × 2           → 任一True→fail
enable_iplimit                  → enable_iplimit                → str_equal(warn)                → ="false"→warn
dangerous_port                  → dangerous_port                → non_empty(fail)                → 非空→fail
security_check                  → security_check_state          → bool_false(fail)               → False→fail
cluster_brain_split_check       → cluster_brain_split_check     → non_empty(fail)                → 非空→fail
check_admin_account             → admin                         → str_not_equal(warn)            → !="true"→warn
base_app_version                → ad_appversion                 → missing(warn)                  → 空值→warn
bios_version_check              → bios_update_state             → has_value(warn)                → 有值→warn
shm_sem_check                   → shm_sem_state                 → bool_false(fail)               → False→fail
base_conntrack                  → conntrack_count, conntrack_new → threshold × 2                 → 超阈值→warn
power_state                     → power_state                   → threshold(warn)                → ==-1→warn
fan_state                       → fan_state                     → threshold(fail)                → ==0→fail
acceleration_check              → acceleration                  → threshold(warn)                → ==0→warn
base_memory                     → snmp_mem_rate                 → threshold(fail)                → >90→fail
base_crash_time                 → base_crash_time               → non_empty(fail)                → 非空→fail
base_disk                       → disk_info                     → empty_dict(warn)               → 空dict→warn
remote_maintenance              → remote_mt                     → str_equal(fail)                → ="true"→fail
base_kernel_log                 → base_kernel_log               → not_zero(fail)                 → !=0→fail
base_core_process               → base_core_process_lack        → non_empty(fail)                → 非空→fail
base_net_state                  → base_eth_abnormal,base_eth_mtu,base_drop_err_packet_rate,base_eth_info → 多字段 → worst状态胜出
base_file_leak                  → base_file_ds                  → threshold(fail)                → >0→fail
base_cpu_info                   → base_cpu_usage                → threshold(fail)                → >90→fail
base_err_log                    → base_log_error_exist          → threshold(fail)                → >100→fail
base_running_time               → base_running_time             → missing(warn)                  → 空值→warn
check_dev_online                → online                        → str_equal(warn)                → ="false"→warn
base_blackbox_data              → base_blackbox_dmesg           → non_empty(warn)                → 非空→warn
base_blackbox_state             → base_blackbox_state           → not_zero(warn)                 → !=0→warn
alarms_enabled                  → alarms_enabled                → zero(warn)                     → ==0→warn
config_id_conflict_check        → id_conflict_list              → non_empty(fail)                → 非空→fail
nic_health_check                → I350_nic_state, 82599_nic_state → not_normal(fail) × 2        → 任一!=normal→fail
snat_sport_exhaustion_check     → snat_sport_exhaustion_log_num → threshold(warn)                → >0→warn
```

### Step 2: 更新 `wait_and_download()` (line ~241)

- 解压 ZIP 后通过 `zf.namelist()` 搜索包含 `check_info` 的文件名（非硬编码，防御大小写变体）
- 路径写入 `meta["check_info_path"]`
- 文件不存在时置 `None`（非致命）

### Step 3: 重写 `analyze()` (替换 line 299-898)

新签名：`analyze(data: dict, check_info: dict | None = None) -> dict`

#### 3a. 入口守卫

```python
rules = None
if check_info and isinstance(check_info, dict):
    rules = check_info.get("rules")
    if not rules:  # None 或空列表
        rules = None
```

`rules` 为 None → 降级路径。保证不因畸形 check_info 崩溃。

#### 3b. 主路径（有 rules）

```
1. 遍历 rules[] → 获取 35 个 rule_id
2. 对每个 rule_id：
   a. 通过 RULE_FIELD_MAP 找 ad.json 字段，提取 value 字符串
   b. 对每个关联字段，查 CORRECTED_FIELD_RULES 做类型化判定 → (is_abnormal, severity, issue)
      - 如果 CORRECTED_FIELD_RULES 中没有该字段 → skip（诊断日志记录到 stderr）
   c. **复合字段聚合**：多字段取 worst 状态（fail > warn > pass）
   d. 通过 CHECK_NAMES 取中文名（找不到则用 rule_id 本身）
   e. 通过 CHECK_CATEGORY_MAP 归入 feature/health/secure
3. 汇总 + 评分
4. 生成优化建议
5. 打印未覆盖 rule_ids 的诊断日志到 stderr
```

#### 3c. 降级路径（无 rules）

遍历 `AD_FIELD_RULES`，对 ad.json 中存在的字段逐个判定。输出结构与主路径一致。报告底部标注 `(降级模式：未找到 acheck_offline_check_info.json)`

#### 3d. 判定函数 `_check_field_rule(value, rule) -> (is_abnormal: bool, severity: str, issue: str)`

移植自 MCP，增加 `severity` 和 `str_not_equal`，None 守卫：

```python
def _check_field_rule(value, rule):
    if value is None:
        return False, "warn", "数据不可用"
    rule_type = rule['type']
    name = rule['name']
    severity = rule.get('severity', 'fail')

    if rule_type == 'threshold':
        try:
            v = float(value)
        except (ValueError, TypeError):
            return False, "warn", f"{name}值无法解析: {value}"
        abnormal = rule['abnormal']
        compare = rule.get('compare', '==')
        if compare == '>': is_ab = v > abnormal
        elif compare == '<': is_ab = v < abnormal
        else: is_ab = v == abnormal
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'bool_false':
        is_ab = (value is False or str(value).lower() in ("false", "0", "no"))
        issue = f"{name}关闭" if is_ab else ""
    elif rule_type == 'bool_true':
        is_ab = (value is True or str(value).lower() == "true")
        issue = f"存在{name}" if is_ab else ""
    elif rule_type == 'str_equal':
        is_ab = (str(value) == str(rule['abnormal']))
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'str_not_equal':
        is_ab = (str(value) != str(rule['normal']))
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'non_empty':
        is_ab = bool(value)
        issue = f"存在异常: {str(value)[:100]}" if is_ab else ""
    elif rule_type == 'not_normal':
        is_ab = (value != 'normal')
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'not_zero':
        try: is_ab = (int(value) != 0)
        except: is_ab = False
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'zero':
        try: is_ab = (int(value) == 0)
        except: is_ab = False
        issue = f"{name}关闭" if is_ab else ""
    elif rule_type == 'has_value':
        is_ab = bool(value)
        issue = f"{name}: {value}" if is_ab else ""
    elif rule_type == 'missing':
        is_ab = not bool(value)           # 值缺失(空字符串/None/空列表)→warn
        issue = f"{name}数据缺失" if is_ab else ""
    elif rule_type == 'empty_dict':
        is_ab = isinstance(value, dict) and len(value) == 0  # 空dict→warn
        issue = f"{name}无数据" if is_ab else ""
    elif rule_type == 'nested_list':
        key = rule.get('key')
        if key and isinstance(value, dict):
            inner = value.get(key, [])
        else:
            inner = value if isinstance(value, list) else []
        is_ab = not bool(inner)           # 嵌套列表为空→warn
        issue = f"{name}为空" if is_ab else ""
    elif rule_type == 'eth_parse':
        value_str = str(value)
        if 'Link detected: no' in value_str:
            is_ab, issue = True, '存在网卡链路断开'
        elif 'Speed: 10Mb/s' in value_str:
            is_ab, issue = True, '存在网卡速率过低(10Mb/s)'
        else:
            is_ab, issue = False, ''
    else:
        return False, "warn", f"未知规则类型: {rule_type}"

    return is_ab, severity if is_ab else "pass", issue
```

#### 3e. 特殊规则（无法用类型规则表达）

**VIP_POOL_CHECK**（嵌套 dict 遍历）— 独立 handler：
```python
def _check_vip_pool(data):
    vip = data.get("virtual_ip_pool_check", {})
    failures = []
    for region in ("local", "global"):
        region_data = vip.get(region, {})
        failures.extend(region_data.get("failure", []))
        failures.extend(region_data.get("disable", []))
    if not failures:
        return "pass", "正常", ""
    return "fail", f"{len(failures)} 个异常", f"VIP Pool 存在 {len(failures)} 个异常"
```

**nic_health_check**（复合双字段）— 对 `I350_nic_state` 和 `82599_nic_state` 分别判定，任一异常则 fail。

主循环中对这些特殊 rule_id 直接调用 handler，不走 `_check_field_rule` 通用路径。

#### 3f. 缺失字段处理

如果 rule_id 在 RULE_FIELD_MAP 中的所有字段在 ad.json 中都不存在：
- status = "pass"（规则已执行，无可判定字段）
- value = "（无可读取字段）"
- 诊断日志输出到 stderr

#### 3f. 输出结构（不变）

```python
{
    "device_info": {"version", "app_version", "gateway_id", "runtime", "ip"},
    "check_results": {rule_id: {"status": "pass"|"fail"|"warn", "name": str, "value": str, "detail": str}},
    "categories": {"feature": [...], "health": [...], "secure": [...]},
    "summary": {"total": int, "pass": int, "fail": int, "warn": int, "score": int},
    "health_scores": {"feature": {...}, "health": {...}, "secure": {...}, "overall": int},
    "suggestions": [{"check": str, "priority": str, "suggestion": str}],
}
```

#### 3g. 保留旧版分析器

旧代码重命名为 `analyze_v1(data)` 保持不变，新代码为 `analyze(data, check_info=None)`。`analyze()` 通过环境变量 `AD_CHECK_ENGINE` 选择引擎：
- 未设置或 `v2` → 新引擎
- `v1` → 旧引擎（回滚用）
- `compare` → 同时运行两个引擎并打印差异矩阵到 stderr

### Step 4: 更新 3 个调用点

- `_check_one()` — 读取 `meta["check_info_path"]`，用 try/except 包裹 JSON 加载
- `wait` 命令 — 同上
- `analyze` 命令 — 用与 ad.json 相同的 `os.walk` 递归搜索逻辑查找 check_info 文件

### Step 5: 更新渲染层

- check.py `all_check_rows()` (line ~948) — `k` → `r.get('name', k)`
- check.py `_SUGGESTION_MAP` 查找 (line ~866) — 键名已同步更新为 rule_id
- render.py `_render_device_detail_block()` (line ~128) — 同上
- render.py `_render_cross_device_comparison()` (line ~229) — 特殊处理：从任一可用 host 的 check_result 采样 `name` 字段（该行构建表头时只有 key 字符串）
- 报告底部说明文字更新

### Step 6: 清理死代码

- 删除旧的 67 项 `has()` + `check()` 逻辑（已保留在 `analyze_v1()` 中）
- 删除旧的 prefix-based 分类元组
- 删除旧的 `_checked_fields` 诊断集合

### Step 7: 更新测试

- `TestAnalyze` 改用包含真实 ad.json 字段的 sample_data（至少覆盖 10 个关键字段）
- 新增 `test_analyze_with_check_info` — 验证 rules 驱动的主路径
- 新增 `test_analyze_fallback_no_check_info` — 验证降级路径
- 新增 `test_field_rule_*` 系列 — 验证各类型判定函数

## 验证计划

1. **35 条规则全覆盖验证**：运行 `tmp_extract.py` 检查每条的字段读取和判定逻辑
2. **真实设备端到端测试**：对 AD1 (14.18.243.211:21044) 跑 `run --force` + `wait`：
   - check 项数 = 35
   - 诊断日志无遗漏 rule_id
   - `AD_CHECK_ENGINE=compare` 对比新旧引擎结果
3. **降级兼容测试**：移除 `acheck_offline_check_info.json` 后 `analyze`，确认不崩溃
4. **畸形数据处理**：构造空 check_info / 空 rules 测试崩溃防御
5. **多设备测试**：2 台设备 `run --hosts "..." --wait`
6. **回归测试**：全量 37 个 check 测试通过
7. **还原 devices.json**：改回 192.168.8.x

## 灰度上线策略

1. AD1 上以 `AD_CHECK_ENGINE=compare` 模式跑 3 次，确认新旧引擎无明显差异
2. 差异项逐个分析确认是新引擎修正了旧引擎的误判
3. 默认切换 v2，v1 保留至少 2 个发布周期
