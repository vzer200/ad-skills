# Git 提交规范

项目采用 **约定式提交（Conventional Commits 1.0.0）**，以 `type(scope): subject` 格式组织所有提交信息。

## 格式

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 必填

| 字段 | 规则 |
|------|------|
| type | 变更类型，见下方类型表 |
| scope | 变更范围，用括号包裹，如 `(ad-perception)`、`(docs)`。无明确范围可省略括号 |
| subject | 一行描述，祈使语气、中文、不超过 72 字符、不加句号 |

### 选填

| 字段 | 规则 |
|------|------|
| body | 变更原因和上下文，解释 **为什么** 改（不是改了什么——diff 已经说明了）。换行分段，每行不超过 72 字符。body 与 subject 之间空一行 |
| footer | 关联 issue、BREAKING CHANGE 声明等，与 body 之间空一行 |

## 类型（type）

| type | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(ad-perception): 新增 VS 流量 3σ 异常检测` |
| `fix` | Bug 修复 | `fix(ad_api): 修复多设备模式 None 命令导致的崩溃` |
| `docs` | 文档变更 | `docs(ad-ops): 补充多设备触发决策规则` |
| `refactor` | 重构（不改功能，不改 bug） | `refactor(ad_api): 提取 _execute_command 为多设备复用` |
| `test` | 测试用例 | `test(perception): 补充 collector 数据注入单测` |
| `chore` | 杂项（依赖更新、构建配置、工具脚本） | `chore: 升级 Python 依赖到最新稳定版` |
| `ci` | CI/CD 管道 | `ci: 新增 GitHub Actions 自动化测试` |
| `perf` | 性能优化 | `perf(collector): 减少 SQLite 写入事务开销` |
| `build` | 构建系统或外部依赖变更 | `build: 锁定 uv.lock 依赖版本` |
| `revert` | 回滚 | `revert: 回退 feat(ad-perception): 新增 VS 流量 3σ 异常检测` |

## 范围（scope）

scope 标识变更影响的模块。本项目常用 scope：

| scope | 对应模块 |
|-------|----------|
| `ad-ops` | AD 智能运维 |
| `ad-check-analysis` | AD 系统巡检 |
| `ad-perception` | AD 感知分析 |
| `ad_api` | AD API 客户端（ad-ops 共用） |
| `docs` | 项目文档 |
| `test` | 测试体系 |
| `devices` | 设备配置 |

多模块同时修改时，取主要影响的模块。

## 描述（subject）

**祈使语气**，像给代码下命令一样：`新增` 而不是 `新增了`，`修复` 而不是 `修复了`。

```bash
# ✅ 正确
feat(ad-perception): 新增 VS 流量 3σ 异常检测
fix(ad_api): 修复多设备模式 None 命令导致的崩溃
refactor(ad_api): 提取 _execute_command 为多设备复用
docs: 补充项目模块文档索引

# ❌ 错误
feat(ad-perception): 新增了 VS 流量 3σ 异常检测功能。     # 拖尾句号、多余"了"、"功能"
fix: 改了个 bug                                            # 无 scope、语义不清
Update code                                                 # 英文、无 type
feat(ad-perception): 这个PR很长包含了VS流量3σ异常检测、       # 太长（超过72字符）
    设备状态阈值告警、地址冲突检测                           # 一次提交太多不相关变更
```

## 正文（body）

与 subject 之间空一行。解释变更 **动机** 和 **上下文**，不是复述 diff。

```bash
# ✅ 正确
fix(ad_api): 修复多设备模式 None 命令导致的崩溃

多设备模式下没有子命令时 command 变量为 None，原先未做判空即进入
分派逻辑。生产环境已出现 3 次相关崩溃。

修复：在 _dispatch 入口增加 None 守卫，未提供子命令时直接
返回 usage 并退出码 4（参数错误）。

# ❌ 错误
fix(ad_api): 修复多设备模式 None 命令导致的崩溃

在 ad_api.py 第 245 行增加了 if command is None 判断，
然后调用 _print_usage() 并 sys.exit(4)。       # 复述 diff，无意义
```

## 破坏性变更（BREAKING CHANGE）

破坏性变更必须显式标注，二选一：

**方式 1** — type 后加 `!`：
```
feat(ad_api)!: 重构 ADClient 初始化接口，去除 host 参数
```

**方式 2** — footer 中声明：
```
feat(ad_api): 重构 ADClient 初始化接口

BREAKING CHANGE: ADClient 构造函数不再接受 host 参数，
改用 connect(host) 方法建立连接。影响所有调用方。
```

## 提交粒度

- 一个提交只做一件事（原子提交）
- 不把不相关的变更塞进同一个提交
- 有意义的变更才单独提交，纯粹的空格/格式化独立提交

## 分支与合并

| 规则 | 说明 |
|------|------|
| 禁止直接提交到 `main` | 所有变更通过功能分支合入 |
| 合并使用 squash | `gh pr merge --squash --delete-branch`，保持 main 干净 |
| 分支命名 | `type/description`，如 `feat/add-3sigma-detection`、`fix/none-crash` |
| 合并后删除分支 | 避免积累废弃分支 |
| 不手动写 issue 编号 | GitHub squash merge 会自动关联 |

## CLAUDE.md 配合

Claude Code 会话中，上述规则由 CLAUDE.md 中的 Git 提交规范章节读取。LLM 执行提交时：

1. 先 `git diff --cached`（已暂存）或 `git diff`（未暂存）确认变更范围
2. 根据 diff 内容判断 type 和 scope
3. 生成符合本规范的提交信息
4. 提交前展示确认

禁止行为：
- `git add -A` / `git add .` 不加区分地暂存所有文件
- 在提交信息中写 `Co-Authored-By: Claude` 等 AI 署名
- 跳过 hook（`--no-verify`）
