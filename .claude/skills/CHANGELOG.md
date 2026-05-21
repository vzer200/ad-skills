# Skills Changelog

本文件记录所有技能模板的变更历史。每次修改必须记录五要素：技能、改了什么、为什么改、影响谁、怎么回滚。

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
