# AD Skills 代码审查问题清单

> 审查日期：2026-05-21 | 范围：ad-blackbox-analysis / ad-check-analysis / ad-ops / ad-perception（排除 ad-agent）
> 方法：6 个并行 agent 第一轮审查 → 2 个 agent 第二轮复审确认

---

## 一、ad-check-analysis（巡检技能）— 14 个问题

### Critical

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| C1 | `scripts/check.py:570,602,643` | **保护条件与数据字段不匹配** | KERNEL_LOG_CHECK / CRASH_LOG_CHECK / WARN_LOG_CHECK 三个检查项的 guard 都是 `has("base_log_error_exist")`，但实际读取的字段分别是 `base_kernel_log`、`base_crash_time`、`alarms_enabled`。如果 `base_log_error_exist` 缺失但实际字段存在，这些检查会被静默跳过。 |
| C2 | `scripts/check.py:1056-1060` | **`_is_new_report` 跨午夜失效** | 使用 YYYYMMDDHHMMSS 整数做时间差比较，无法处理跨天场景。23:59:55 启动、00:00:05 完成的巡检（实际间隔 10 秒）会被判定为非新报告。 |

### High

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| H1 | `scripts/check.py:307` | **HEARTBEAT_ERROR_CHECK 始终 pass** | 硬编码 `check("HEARTBEAT_ERROR_CHECK", "pass", "无异常")`，无任何数据字段验证，永远显示通过。 |
| H2 | `scripts/check.py:610-613` | **MEMORY_CHECK 值为 0 时误报 fail** | 逻辑 `"pass" if 0 < mr < 95 else ("warn" if mr > 0 else "fail")`，当 `snmp_mem_rate` 为 0 时报告 fail，但 0 可能是数据缺失而非故障。 |
| H3 | `scripts/check.py:316-321,349-353` | **DNS_DETECT_CHECK 和 DNS_PROXY_CHECK 重复** | 两个检查使用相同字段 `dns_proxy_enabled`、相同逻辑，仅名称不同，导致统计双计。 |
| H4 | `scripts/check.py:923-930` | **硬编码设备映射，忽略 devices.json** | `known_devices` 字典硬编码 AD1/AD2 两个 IP，其他设备显示异常。SKILL.md 声明 devices.json 为权威来源但代码未使用。 |
| H5 | `scripts/check.py:1244-1252,1280-1288` | **无法到达的异常处理程序** | `run` 和 `wait` 命令中的 `except ADConnectionError/ADAuthError/ADAPIError` 永远不会触发，因为 `start_check()` 和 `wait_and_download()` 内部已将所有 AD 异常转为 `RuntimeError`。 |
| H6 | `scripts/check.py:1149,1156` | **--output 与 --work-dir 不一致** | `run` 用 `--output`，默认值带时间戳；`wait` 用 `--work-dir`，默认值为硬编码 `/tmp/ad_check`。两个命令不传参数时路径不匹配。 |
| H7 | `SKILL.md / README.md:76` | **检查项计数过时** | README 写 34功能+23健康+7安全=64项，代码实际为 35+25+7=67项。 |

### Medium

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| M1 | `scripts/check.py:8,11,39-41` | **死导入** | `base64`、`ssl`、`urllib.error`、`urllib.parse`、`urllib.request` 导入但从未使用，HTTP/SSL 逻辑全在 ADClient 内部。 |
| M2 | `scripts/check.py:1086,1101` | **函数体内 import tempfile** | 应在模块顶部导入。 |
| M3 | `scripts/check.py:1079` | **过宽异常吞没** | `_progress_one` 中 `except Exception: pass` 静默丢弃所有错误。 |
| M4 | `scripts/check.py:272-838` | **`analyze()` 函数过大** | 约 450 行，包含 65+ 项检查，建议按类别拆分。 |

---

## 二、ad-perception（感知分析技能）— 12 个问题

### Critical

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| C3 | `scripts/perception.py:921-926` | **状态异常被排除在日志关联之外** | `analyze_full()` 中 `state_issues` 仅用于判断是否触发日志关联，但传给 `log_correlation()` 的只有 `all_anomalies`（流量异常）。如果只有状态异常没有流量异常，日志关联收到空列表立即返回 `no_anomaly`，不拉取任何日志。 |
| C4 | `scripts/perception.py:353-360,789-790` | **状态分析错误始终显示"未知错误"** | `state_analysis` 异常时返回 dict 中缺少顶级 `error` 键，而 `render_markdown` 用 `state.get("error", "未知错误")` 取值，真实错误信息埋藏在 `items[0].message` 中永不被展示。 |

### High

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| H8 | `scripts/perception.py:601-603` | **3 方及以上 VS 冲突被丢弃** | VS IP:Port 冲突检测只取 `names[0]` 和 `names[1]`，第 3 个及之后的 VS 被静默丢弃。 |
| H9 | `scripts/perception.py:1137-1139` | **Exit code 2（认证失败）从未产生** | 顶级 `except Exception` 全部以 exit 1 退出，即使发生 `ADAuthError` 也是如此。文档标注的 exit code 2 不可达。 |
| H10 | `scripts/collector.py:181,194-195` | **VS 趋势注入使用错误的时钟** | `_inject_trend_into_db` 用 `now - (n-i)*60` 合成时间戳，完全忽略 API 返回的 `start_time` 和 `step_time`。对比 `_inject_system_trend_into_db` 正确使用了 API 时间元数据。 |
| H11 | `scripts/collector.py:254-271` | **注入成功后误报"无虚拟服务"** | `query_traffic_db` 返回 None/空列表时，代码直接判断为"设备无虚拟服务"，即使 `collect_once()` 已成功注入数据。且返回的 `rows_injected: 0` 与实际不符。 |

### Medium

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| M5 | `scripts/perception.py:283,504` | **静默吞掉 ImportError** | `from collector import collect_once` 在 `except ImportError: pass` 中静默失败，用户无法感知注入回退被跳过。 |
| M6 | `scripts/perception.py:729-883` | **Markdown 表格未转义竖线** | `detail`、`message`、`name` 等 API 返回值直接拼入 markdown 表格，若含 `|` 字符会破坏表格结构。 |
| M7 | `scripts/perception.py:755,805` | **函数体内重复 import** | 两个 `from datetime import datetime` 写在 `render_markdown` 函数体内，应移到模块顶部。 |
| M8 | `scripts/perception.py:761-766,816-821` | **严重程度计算逻辑重复** | z-score 阈值判断逻辑在流量异常和状态异常两处完全重复，应提取为公共函数。 |

---

## 三、ad-ops（运维基础层）— 6 个问题

### High

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| H12 | `scripts/overview.py:44` | **`calc_days_left` 空值崩溃** | `datetime.strptime(validity_not_after, ...)` 无 None/空字符串保护，API 返回 null 或 "" 时 TypeError/ValueError 崩溃。 |
| H13 | `scripts/overview.py:294-295,342-343` | **`_process_hardware` float(None) 崩溃** | `_extract_value([])` 返回 None，`_level_numeric(None)` 中 `float(None)` 引发 TypeError。 |
| H14 | `scripts/overview.py:250` | **`_process_vs` 空列表推导崩溃** | `vs.get("vips", [])` 只在键缺失时返回 `[]`，如果 `"vips": null`（JSON null）则返回 None，后续列表推导 TypeError。 |
| H15 | `scripts/multi_device.py:75` | **--password 在 --devices 路径中被忽略** | `run_multi` 从 kwargs 中取 `password`，但 check.py 的 `run --devices` 路径只传 `scene` 和 `force`，CLI 的 `--password` 不会被传递。 |

### Medium

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| M9 | `scripts/multi_device.py:101` | **`run_multi` 过宽异常捕获** | `except Exception as e` 捕获 `KeyboardInterrupt` 和 `SystemExit`，Ctrl+C 被转为错误字典而非干净退出。 |
| M10 | `scripts/overview.py:130-132` | **`_try_call` 没有方法名验证** | `getattr(client, method_name)()` 如果 API 映射字符串有拼写错误，运行时 AttributeError 难以排查。 |

---

## 四、ad-blackbox-analysis（黑盒日志技能）— 5 个问题

### High

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| H16 | `scripts/blackbox.py:119` | **CSV 解析使用简单 split** | `parts = line.split(",")` 不处理引号内的逗号。中文审计日志描述常含逗号（如 `"操作,失败"`），会导致字段错位和静默数据损坏。 |
| H17 | `scripts/blackbox.py:434-438` | **日期范围检查差一错误** | `span > 7` 允许 8 个日历天（如 5/14~5/21，span=7 但实为 8 天）。应为 `span >= 7`。 |
| H18 | `scripts/blackbox.py:145-168` | **`analyze_system_logs` 从未调用** | 方法已实现但没有任何执行路径调用它。SKILL.md 列出的"系统日志分析"功能实际不生效。 |
| H19 | `scripts/blackbox.py:304-358` | **`_blackbox_one` 死代码** | 54 行完整导出+分析流程，已废弃但仍保留，无任何调用方。 |

### Medium

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| M11 | `scripts/blackbox.py:462,578` | **硬编码 `/tmp/` 默认路径** | 项目开发环境为 Windows，`/tmp/blackbox_analysis` 默认路径不可用。 |

---

## 五、共享基础设施 / 跨技能问题 — 3 个

### Critical

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| C5 | `ad-ops/scripts/multi_device.py:189-601` | **巡检报告渲染代码错放在 ad-ops** | ~400 行巡检专用渲染函数（`render_multi_device_report` 等）存在于 ad-ops 中，但只被 ad-check-analysis 使用。违反关注点分离原则，应归属到 ad-check-analysis。 |

### High

| # | 文件:行号 | 问题 | 描述 |
|---|----------|------|------|
| H20 | 多个 `scripts/*.py` | **跨技能导入路径脆弱** | 四个技能都通过 `os.path.join(..., "..", "..", "ad-ops", "scripts")` 相对路径导入，目录结构变化即全部崩溃。且每个技能重复 ~20 行相同的路径解析样板代码。 |
| H21 | `check.py/README.md`、`blackbox.py` | **文档和代码中硬编码密码** | `root1234+` 等多处明文密码出现在 README、源码默认参数中，已提交版本控制。 |

---

## 六、优先级排序（建议修复顺序）

### 第一优先级：功能性 bug（会导致错误结果或崩溃）

| 顺序 | 编号 | 技能 | 问题摘要 |
|------|------|------|----------|
| 1 | C1 | check | 三个检查项 guard 条件错误 → 巡检结果可能漏报 |
| 2 | C3 | perception | 状态异常未传给日志关联 → 日志关联功能残缺 |
| 3 | C4 | perception | 状态错误信息永远显示"未知错误" → 排障困难 |
| 4 | H16 | blackbox | CSV 解析 split 破环引号内逗号 → 审计数据错误 |
| 5 | H17 | blackbox | 日期范围差一 → 可请求 8 天数据超出限制 |
| 6 | H12 | ops | calc_days_left None 崩溃 → overview 功能不可用 |
| 7 | H13 | ops | _process_hardware float(None) 崩溃 → 同上 |
| 8 | H14 | ops | _process_vs None 迭代崩溃 → 同上 |

### 第二优先级：架构缺陷（影响可维护性和正确性）

| 顺序 | 编号 | 技能 | 问题摘要 |
|------|------|------|----------|
| 9 | C2 | check | `_is_new_report` 跨午夜失效 |
| 10 | C5 | 跨技能 | 巡检渲染代码错放在 ad-ops |
| 11 | H4 | check | 硬编码设备映射忽略 devices.json |
| 12 | H15 | ops | --password 在 --devices 路径被忽略 |
| 13 | H20 | 跨技能 | 导入路径脆弱 / 样板代码重复 |

### 第三优先级：清理与规范化

| 顺序 | 编号 | 技能 | 问题摘要 |
|------|------|------|----------|
| 14 | H1 | check | HEARTBEAT_ERROR_CHECK 虚假 pass |
| 15 | H3 | check | DNS 检查重复 |
| 16 | H8 | perception | 3 方 VS 冲突丢弃 |
| 17 | H9 | perception | Exit code 2 不可达 |
| 18 | H10 | perception | VS 趋势时间戳用错时钟 |
| 19 | H18 | blackbox | analyze_system_logs 死代码 |
| 20 | H19 | blackbox | _blackbox_one 死代码 |
| 21 | H2 | check | MEMORY_CHECK 0 值误报 |
| 22 | H5 | check | 无法到达的异常处理程序 |
| 23 | H6 | check | --output 与 --work-dir 不一致 |
| 24 | H7 | check | 文档检查计数过时 |
| 25 | H11 | perception | 注入成功误报无 VS |
| 26 | H21 | 跨技能 | 硬编码密码 |

---

## 七、需要讨论的架构问题

以下问题涉及跨技能重构或安全策略决策，修复前需确认方向：

| # | 问题 | 影响范围 |
|---|------|----------|
| A | **巡检渲染代码从 ad-ops 迁回 ad-check-analysis**（C5）| 跨技能导入变更，约 400 行代码移动，两个技能的 import 路径需调整 |
| B | **统一跨技能导入机制**（H20）| 所有 4 个技能的 sys.path 样板代码需替换，可能引入 pyproject.toml 或统一入口脚本 |
| C | **SSL 证书验证策略** | ad_api.py 全局禁用 SSL 验证（`CERT_NONE`），在内部网络安全和 MITM 风险之间需要明确策略 |
