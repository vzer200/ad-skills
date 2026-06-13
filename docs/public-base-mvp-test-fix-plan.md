# public-base MVP 手测问题修复说明

## 目标

本次修复把 public-base 从“人工拼路径、人工 clone 产物仓库”的试验流程，收敛为固定 CLI 流程：

- 固定产物仓库：`https://git.sangfor.com/69765/ad-build-public-base.git`
- 全量编译设备只负责 `pack`、`check --integrity-only` 和 `publish --push`
- 干净设备只负责 `use --branch`
- AI 和用户不得手工 clone public-base 仓库，不得手工读取 `latest.json`，不得手工拼 bundle 路径
- token 只能从 stdin 进入 `auth login --token-stdin --json`
- 固定步骤尽量脚本化，降低内网 AI 幻觉空间

## 本次手测发现的问题

### 1. public-base 少包含 rdma-core 生成头文件

干净设备恢复 public-base 后，`appd` 编译仍失败：

```text
drivers/meson.build:39:0: ERROR: Include dir /libs/rdma-core-2404mlnx51/build/include does not exist.
```

全量编译设备上该目录存在：

```text
libs/rdma-core-2404mlnx51/build/include
```

修复：

- 默认 `restore_dirs` 增加 `libs/rdma-core-2404mlnx51/build/include`
- `public-base pack` 将该目录纳入 bundle
- `public-base use` 后干净设备应能看到该目录

### 2. public-base key 被 `libs/` 和 `sinfor/` 编译副作用污染

原默认 key 粗暴包含：

```text
libs/**
sinfor/**
```

全量编译环境中大量 `build/`、`tmp/`、`.o`、`.so`、`.a`、`.pyc` 等生成文件会参与 key，导致干净设备即使恢复成功也容易 `check mismatch`。

修复：

- 默认 `public_inputs` 保持覆盖 `libs/**` 和 `sinfor/**`，避免漏掉 `configure`、`CMakeLists.txt`、`.S`、`.in`、脚本和模板类公共输入
- 新增 `public_input_excludes`
- 排除 `**/build/**`、`**/tmp/**`、`**/.deps/**`、`**/.libs/**`、`*.o`、`*.so`、`*.a`、`*.pyc`、`*.md5`、`*.map` 等生成副作用
- `public_input_excludes` 只影响 key，不影响显式 `restore_dirs` / `restore_files`
- `key --json` 输出 `top_level_counts` 和 `extension_counts`，用于发现 key 是否再次被生成文件污染

### 3. restore 冲突策略太保守且不完整

旧逻辑只要目标文件 sha 与 bundle 不同就拒绝，导致干净 checkout 中 `OS_PLATFORM.file`、`include/log_utils.h` 这类 Git clean 文件也冲突。

同时，旧逻辑没有覆盖 tracked deleted / staged deletion 这种“文件不存在但 Git 状态已变更”的情况，可能静默恢复用户删除。

修复后的默认策略：

| 状态 | 默认行为 |
| --- | --- |
| 目标文件不存在且 Git clean | 允许恢复 |
| 目标文件存在且 Git clean 但内容不同，且不是 public input | 允许覆盖 |
| 目标文件存在且 Git clean 但内容不同，且属于 public input | 拒绝 |
| tracked unstaged modified | 拒绝 |
| tracked staged modified | 拒绝 |
| tracked deleted | 拒绝 |
| tracked staged deletion | 拒绝 |
| untracked / ignored untracked | 拒绝 |
| target symlink / directory / path escape | 拒绝 |

`--force` 只允许绕过内容冲突，不允许绕过 path escape、symlink、directory、parent symlink 等路径安全冲突。正常用户和 AI 不应直接调用低层 restore；正常入口是 `public-base use`。

### 4. restore 前 full check 语义不对

干净设备恢复前不应执行 full check，因为 full check 会比较当前工作区 public input key 与 bundle key。恢复前干净工作区可能缺少公共生成物，结果容易误判。

修复：

- 增加 `check --integrity-only --json`
- `integrity-only` 只校验 bundle、manifest、inventory、sha256 sidecar 和内部文件 sha
- `public-base use` 内部顺序固定为：
  1. clone/update 固定产物仓库缓存
  2. CLI 内部读取 `<release-dir>/latest.json`
  3. integrity check
  4. restore
  5. status
  6. full check
  7. 写 `.ad-build/public-base/use-summary.json`

如果 integrity check 输出 `status: invalid`，禁止 restore，禁止继续 verify。

### 5. 固定仓库和 token 处理

正常 CLI 固定使用：

```text
https://git.sangfor.com/69765/ad-build-public-base.git
```

shipped CLI 不接受运行时环境变量覆盖 public-base 远程仓库。自动化测试如需本地 bare repo，只能通过内部模块选项注入，不得写入 README、SKILL 或内网 AI 流程。

禁止：

- token 作为命令行参数
- token 拼进 Git URL
- token 写入 `.ad-build`
- token 写入日志
- AI 手工 clone public-base 仓库
- AI 手工读取 `latest.json`
- AI 手工拼 bundle 路径

认证固定命令：

```bash
printf '%s' "$TOKEN" | ad-build public-base auth login --token-stdin --json
ad-build public-base auth status --json
```

人工输入 token 时使用脚本隐藏输入：

```bash
templates/public-base-auth.sh
```

### 6. Tab 补全

新增：

```bash
ad-build completion bash
ad-build completion zsh
ad-build completion install --shell bash
ad-build completion install --shell zsh
```

补全覆盖顶层命令、`public-base` 子命令和常用选项。补全脚本是静态生成，不扫描 AD 仓库，也不依赖 npm 额外包。

## 正常使用流程

### 全量编译设备发布 public-base

```bash
cd /root/AD
templates/public-base-auth.sh
ad-build public-base pack --out /root/public-base.tar --json
ad-build public-base check --bundle /root/public-base.tar --integrity-only --json
ad-build public-base publish --branch release-AD7.0.29R2 --bundle /root/public-base.tar --push --json
```

预期：

- `pack.status == "packed"`
- `check.status == "valid"`
- `publish.status == "published"` 或 `publish.status == "no_changes"`
- `.ad-build/public-base/publish-summary.json` 存在
- 产物仓库的 `<release-dir>/latest.json` 指向新 bundle

### 干净设备恢复 public-base 并验证模块

```bash
cd /root/workspace/AD
templates/public-base-auth.sh
ad-build public-base use --branch release-AD7.0.29R2 --json
ad-build public-base status --json
ad-build map
ad-build verify appd
```

预期：

- `.ad-build/public-base/use-summary.json` 存在
- `use-summary.json.status == "ready"`
- `use-summary.json.integrity_status == "valid"`
- `use-summary.json.status_status == "restored"`
- `use-summary.json.check_status == "matched"`
- `libs/rdma-core-2404mlnx51/build/include` 存在

## AI 执行规则

AI 只能使用以下 happy path：

```bash
printf '%s' "$TOKEN" | ad-build public-base auth login --token-stdin --json
ad-build public-base use --branch <release-dir> --json
ad-build verify <module>
```

AI 必须读取 JSON 判断状态：

- `use-summary.json.status == "ready"`：可以继续 verify
- `use-summary.json.integrity_status == "invalid"`：停止，重新下载或重新 pack
- `use-summary.json.check_status == "mismatch"`：停止，要求重新发布匹配的 public-base
- `status.json.status != "restored"`：停止，不继续 verify
- `restore-conflicts.json` 存在：停止，汇报冲突文件

AI 禁止建议或执行：

- 手工 clone public-base 产物仓库
- 手工读取 `latest.json`
- 手工拼 bundle 路径
- token 作为参数或 URL 片段
- 绕过 `public-base use` 直接执行低层 restore
- 在 `use` 失败后自动加 `--force`

## 测试矩阵

必须覆盖：

1. `restore_dirs` 包含 `libs/rdma-core-2404mlnx51/build/include`
2. `public_input_excludes` 不影响显式 restore 内容
3. `libs/**/build/**`、`libs/**/tmp/**`、`sinfor/**/build/**`、`sinfor/**/tmp/**` 不参与 key
4. 修改真实源码输入会改变 key
5. restore 允许覆盖 Git clean tracked 文件
6. restore 拒绝 tracked modified
7. restore 拒绝 tracked staged modified
8. restore 拒绝 tracked deleted
9. restore 拒绝 tracked staged deletion
10. restore 拒绝 untracked / ignored untracked
11. restore 拒绝 symlink、directory、path escape
12. `check --integrity-only --json` 返回 `valid` / `invalid`
13. `public-base use --json` 完成固定仓库、latest、integrity、restore、status、full check 链路
14. `auth login --token-stdin --json` 不把 token 写入 `.ad-build`、remote URL、stdout/stderr
15. shipped CLI 拒绝 `AD_BUILD_PUBLIC_BASE_REPO_URL`
16. `publish --push --json` 只在 `.ad-build/cache/public-base-repo` 内 add/commit/push
17. `ad-build completion bash|zsh` 输出补全脚本
18. `ad-build completion install --shell bash|zsh` 安装用户级补全脚本
