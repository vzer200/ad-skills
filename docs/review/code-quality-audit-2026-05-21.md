# AD Skills 代码质量审计报告

**审计日期**: 2026-05-21 | **范围**: `.claude/skills/` (10 个 Python 脚本 + 5 SKILL.md + 4 checklist) + 根目录配置
**44 条发现 → 28 已修复 / 16 未修复**

---

## 未修复 (16 项)

### CRITICAL (3) — 全部排除

| 编号 | 问题 | 排除原因 |
|------|------|----------|
| C1 | blackbox.py 硬编码默认密码 `"root1234+"` (4处) | 黑盒相关 |
| C2 | ad_api.py SSL 证书验证完全禁用 `CERT_NONE` | SSL 相关 |
| C3 | 密码通过命令行参数传递，进程列表可见 | 架构统一设计 |

### HIGH (4)

| 编号 | 问题 | 排除原因 |
|------|------|----------|
| H1 | 所有脚本缺乏操作审计日志 | 需统一日志模块设计 |
| H2 | check.py 硬编码 `/tmp/ad_check` (4处) | Windows 特定，实际可工作(C:\tmp\...) |
| H5 | collector.py PID Win32 API `OpenProcess` 无 try/except/GetLastError | Windows 特定 |
| H6 | blackbox.py 异步导出无超时/重试，依赖 LLM 轮询 | 黑盒相关 |

### MEDIUM (7)

| 编号 | 问题 | 排除原因 |
|------|------|----------|
| M1 | 5 个脚本各 ~20 行完全相同的跨技能导入代码 | 暂不抽象(需零依赖) |
| M2 | check.py `_SUGGESTION_MAP` 仅 16/67 检查项有建议 | 需补全 51 条 |
| M8 | perception.py `analyze_full()` 子函数无 `sys.exit()` 禁止契约 | 需文档约定 |
| M12 | overview.py `calc_days_left` 使用 naive datetime，跨时区差±1天 | — |
| M13 | blackbox.py audit CSV 路径硬编码 `zh_CN/0.audit.csv` | 黑盒相关 |
| M14 | check.py MEMORY_LEAK_CHECK 逻辑疑似反转 (`"pass" if leak`) | 需确认 AD 字段语义 |
| M16 | blackbox.py 解压仅 catch `BadZipFile`，漏 `tarfile.ReadError` 等 | 黑盒相关 |

### LOW (2)

| 编号 | 问题 |
|------|------|
| L3 | checklist.md 使用 TEST_IP/TEST_PASS 占位符，无自动化 |
| L8 | shebang `python3` 对 Windows 无意义 |

---

## 已修复 (28 项，已从源文件中修复)

### 第一轮
H4(密码AD_PASS) H7(.gitignore) M3(schema版本) M4(isinstance守卫) M5(__name__) M9(.get防御) M10(import归位) M11(hasattr移除) L7(__MACOSX__)

### 第二轮
H8(ad.json崩溃) H9(密码优先级) M15(progress异常) M17(last-month移除) L10(子命令引导) L11(help文案) L12(api_error) L13(死代码) L14(防御转换)

### 第三轮
H3(API重试) H10(vport/vports统一) M6(daemon清理145行) M7(异常类替代字符串匹配)

### 第四轮
L4(ad_bench文档) L5(JSON Schema) L6(CHANGELOG) L9(encoding声明)

### 第五轮
L1(全量类型注解) L2(docstring中文化)

---

## 缺陷预防建议

### 短期
1. **M14**: 确认 `shm_sem_state` 语义，修复 MEMORY_LEAK_CHECK 逻辑
2. **M2**: 补全 _SUGGESTION_MAP 剩余 51 项
3. **M12**: overview.py 证书到期计算使用 timezone-aware datetime

### 中期
4. **H1**: 统一审计日志模块
5. **M8**: 添加子分析函数契约文档

### 长期
6. 自动化回归测试、JSON Schema 验证、CI 集成

---

## 报告历史

| 轮次 | 内容 |
|------|------|
| R1 | 4 agent 并行分析(超时) → 逐文件阅读 220KB |
| R2 | 产出 30 条发现 |
| R3 | 逐条复验 + 补充 3 条 |
| R4 | 深度审查 + 补充 14 条 |
| R5-9 | 五轮并行修复 28 项 + 多 agent 交叉验证 |
| **合计** | **44 发现 → 28 已修复 + 16 未修复** |
