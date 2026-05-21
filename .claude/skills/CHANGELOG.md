# Skills Changelog

本文件记录所有技能模板的变更历史。每次修改必须记录五要素：技能、改了什么、为什么改、影响谁、怎么回滚。

## v2.1.0 (2026-05-21)

### 代码质量修复 (44项审计 → 22项修复)

| 类型 | 变更 |
|------|------|
| 安全 | check.py 添加 AD_PASS 环境变量支持，统一密码传递机制 |
| 安全 | perception.py 修复密码优先级反转 (CLI arg 优先于 env var) |
| 稳定性 | ad_api.py `_request()` 添加指数退避重试 (3次, 1s/2s) |
| 稳定性 | check.py `wait_and_download()` 添加 ad.json 缺失守卫, 防止 FileNotFoundError |
| 稳定性 | check.py 单设备 progress 路径添加 try/except 异常处理 |
| 正确性 | perception.py `conflict_analysis()` vport→vports, 匹配 overview.py Cartesian product |
| 正确性 | perception.py API fallback 移除无效的 'last-month' trend period |
| 可维护性 | check.py 5个自定义异常类替代中文字符串匹配的错误分类 |
| 可维护性 | collector.py 清理 ~145行废弃 daemon 代码 |
| 防御性 | overview.py `api_method_map` 改用 `.get()` 防御 KeyError |
| 防御性 | check.py `analyze()` 添加 `isinstance(data, dict)` 守卫 |
| 防御性 | overview.py `_level_numeric()` 添加 ValueError/TypeError 防御 |
| 基础设施 | .gitignore 添加 `*.db`, `*.pid` 排除 |
| 基础设施 | db_schema.py 添加 SCHEMA_VERSION + schema_version 表 |
| 规范 | connect.py `import json` 移至文件顶部 |
| 规范 | multi_device.py, db_schema.py, render.py 添加 `__name__` guard |
| 规范 | ad_api.py 缺子命令时输出引导信息 |
| 规范 | check.py wait help text `--output` → `--work-dir` |
| 规范 | connect.py ADAPIError 状态 `ok` → `api_error` |
| 规范 | render.py 移除未使用的 `name` 变量 |

详细审计报告: `docs/review/code-quality-audit-2026-05-21.md`

---

## v2.0.0 (2026-05-21)

| 要素 | 内容 |
|------|------|
| 技能 | ad-perception |
| 改了什么 | 新增 examples/input.md (6 场景), examples/output.md (正常+回退), checks/checklist.md (10 项回归检查)；SKILL.md 增加适用/不适用场景、模板文件引用、frontmatter version+updated_at |
| 为什么改 | 技能模板化改造：从两层结构升级为三层结构（SKILL.md + examples/ + checks/），提升可维护性和团队复用性 |
| 影响谁 | ad-perception 技能使用者、维护者。非 breaking change：纯文档增量，不改脚本和测试 |
| 怎么回滚 | `git revert <this commit>` 回到模板化前状态；旧 SKILL.md 结构完整保留不受影响 |

---

| 要素 | 内容 |
|------|------|
| 技能 | ad-check-analysis |
| 改了什么 | 新增 examples/input.md (6 场景), examples/output.md (正常+有异常+结构说明), checks/checklist.md (12 项回归检查)；SKILL.md 增加适用/不适用场景、模板文件引用、frontmatter version+updated_at |
| 为什么改 | 技能模板化改造：从两层结构升级为三层结构（SKILL.md + examples/ + checks/），提升可维护性和团队复用性 |
| 影响谁 | ad-check-analysis 技能使用者、维护者。非 breaking change：纯文档增量，不改脚本和测试 |
| 怎么回滚 | `git revert <this commit>` 回到模板化前状态；旧 SKILL.md 结构完整保留不受影响 |

---

| 要素 | 内容 |
|------|------|
| 技能 | ad-ops |
| 改了什么 | 新增 examples/input.md (6 场景), examples/output.md (正常+单维度+失败), checks/checklist.md (11 项回归检查)；SKILL.md 增加适用/不适用场景、模板文件引用、frontmatter version+updated_at |
| 为什么改 | 技能模板化改造：从两层结构升级为三层结构（SKILL.md + examples/ + checks/），与 ad-perception/ad-check-analysis 保持一致，提升可维护性和团队复用性 |
| 影响谁 | ad-ops 技能使用者、维护者。非 breaking change：纯文档增量，不改脚本和测试 |
| 怎么回滚 | `git revert <this commit>` 回到模板化前状态；旧 SKILL.md 结构完整保留不受影响 |

---

| 要素 | 内容 |
|------|------|
| 技能 | ad-blackbox-analysis |
| 改了什么 | 新增 examples/input.md (6 场景), examples/output.md (正常+异常), checks/checklist.md (11 项回归检查)；SKILL.md 增加适用/不适用场景、模板文件引用、frontmatter version+updated_at；output.md 锚定 generate_report() 而非 render_markdown()，因 ad-blackbox-analysis 不使用 render_markdown 模式 |
| 为什么改 | 技能模板化改造：从两层结构升级为三层结构（SKILL.md + examples/ + checks/），与 ad-perception/ad-check-analysis/ad-ops 保持一致，提升可维护性和团队复用性 |
| 影响谁 | ad-blackbox-analysis 技能使用者、维护者。非 breaking change：纯文档增量，不改脚本和测试 |
| 怎么回滚 | `git revert <this commit>` 回到模板化前状态；旧 SKILL.md 结构完整保留不受影响 |
