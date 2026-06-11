# AD Build CLI + Skill Design

Encoding: UTF-8.

## Purpose

AD 项目当前已经能在修改后做模块级增量编译。剩余痛点不是“改完之后怎么增量编译”，而是开发开始前经常需要先跑一次 Docker 全量编译来确认基线是否干净。

本设计的目标是把这一步改成可查询、可复用、可由 AI 辅助判断的流程：

```text
进入 Docker
  -> ad-build precheck 查询当前 commit 是否已有成功全量编译基线
  -> AI 根据 precheck 的事实结果判断是否可跳过修改前全量编译
  -> 修改代码
  -> AI 根据 ad-build 输出、diff、Makefile 和 Skill 规则判断验证范围
  -> ad-build verify 执行明确的模块验证命令
```

## Core Decision

采用“确定性 CLI + AI Skill”的组合。

`ad-build` CLI 只做事实采集、基础路径匹配、日志保存和命令执行。它不调用内网 GLM5.1，不做复杂推理，不输出“可以安全跳过全量编译”这类决策。

`ad-build` Skill 教 AI 如何使用 CLI 输出，如何结合 `git diff`、`module-map.yaml`、Makefile 和项目规则判断影响面，如何决定要验证哪些模块，以及什么时候必须建议全量编译兜底。

这样可以避免把模型能力硬编码进工具，也能让不同 AI 客户端和不同内网模型复用同一套确定性数据。

## Delivery Format

CLI 交付为 npm package，便于内网 npm registry、`npm pack` 产物或本地 tarball 分发。

安装后命令名：

```bash
ad-build <command>
```

本地开发时等价命令：

```bash
node bin/ad-build.js <command>
```

package 约束：

- `package.json` 必须声明 `bin.ad-build = "bin/ad-build.js"`。
- `bin/ad-build.js` 必须以 `#!/usr/bin/env node` 开头，支持 npm 全局安装后直接执行。
- 第一版不依赖第三方 npm 包，降低 Docker 编译容器和内网 registry 的安装风险。
- 第一版禁止 `dependencies`、`optionalDependencies`、`bundledDependencies`。
- 第一版禁止 npm lifecycle scripts，包括 `preinstall`、`install`、`postinstall`、`prepare`、`prepack`、`postpack`。`scripts.test` 和 `scripts.pack:check` 允许存在，但不得在安装时执行。
- `package.json.files` 必须是 allowlist，只允许发布 `bin/`、`lib/`、`templates/`、`skills/`、`README.md`、`LICENSE` 和 `package.json`。
- 必须用 `npm pack --dry-run` 验证发布文件列表。
- package 可通过 `npm pack` 生成 `.tgz`，也可发布到内网 npm registry 后通过 `npm install -g <package>` 安装。
- CLI 运行逻辑仍以当前 git 仓库为工作目录；安装位置不影响 `.ad-build/` 输出位置。
- 完成实现后必须生成 npm tarball 和项目 zip。npm tarball 用于 npm 安装验证，项目 zip 用于整体交付归档。

配置文件约束：

- npm 包可以附带 `templates/module-map.yaml` 作为 starter 模板。
- CLI 运行时默认读取当前 AD 仓库内的 `tools/module-map.yaml`，不是 npm 包内模板。
- 如果当前仓库没有 `tools/module-map.yaml`，CLI 可以提示从模板复制，但不能静默使用包内模板作为项目事实。
- 为避免第三方依赖，`tools/module-map.yaml` 只支持本设计示例使用的 YAML 子集：对象、缩进嵌套、字符串数组、字符串标量、空对象 `{}`。不支持锚点、别名、多行字符串、复杂类型或任意 YAML tag。

## Non-Goals

- 不替代现有 `compile.sh`。
- 不重写所有 Makefile。
- 不在第一版实现完整 DAG 调度器。
- 不让 CLI 直接调用模型 API。
- 不让 AI 的判断替代真实编译结果。
- 不保证所有改动都可以跳过全量编译；高风险改动仍需后台或 CI 全量兜底。

## User Workflow

### Before Editing

开发者进入现有 Docker 编译容器后执行：

```bash
ad-build precheck
```

如果当前 commit 已有成功全量编译基线，工具输出：

```text
Result: baseline found
Environment: matched
```

AI 读取该事实后，如果没有其他未知项或高风险状态，可以建议开发者跳过修改前全量编译。

如果没有基线，工具输出最近成功基线信息；AI 再根据 Skill 判断是否必须先全量，还是可以继续开发并让后台/CI 补全量。

### After Editing

开发者让 AI 使用 Skill 进行验证判断。AI 执行：

```bash
ad-build diff
ad-build map
```

AI 读取输出后给出建议，例如：

```text
本次只修改 apps/snmp/**，路径匹配 snmp 模块，未触及公共构建配置。
建议验证 snmp 模块，并在需要时验证 packet 阶段。
```

然后执行：

```bash
ad-build verify snmp
```

如果修改了高风险文件，例如 `app.mk`、`compile.sh`、公共 Makefile、公共头文件、Dockerfile、工具链配置或 proto 文件，AI 必须标记为高风险，并建议全量编译兜底。

### After Successful Full Build

如果某人或 CI 已经跑完全量编译：

```bash
ad-build full-build -- ./compile.sh
ad-build baseline-save --from-run latest
```

工具把成功结果保存到共享目录，供其他开发者查询。

## CLI Surface

第一版提供 9 个命令。

```bash
ad-build doctor
ad-build precheck
ad-build full-build -- ./compile.sh
ad-build baseline-save --from-run latest
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
```

通用退出码：

```text
0: 命令成功，输出文件已生成
1: 编译或验证命令执行失败
2: 参数、配置或模块名错误
3: 命令要求的基线记录或运行记录缺失
4: 安全检查失败，例如 baseline-save 遇到脏工作区或未成功的 full-build run
```

### doctor

检查 Docker 内运行环境是否满足工具要求。

检查项：

- 当前目录是否在 git 仓库内。
- 是否能执行 `git`、`sh`、`make`。
- 是否能执行 `node`。
- 如果需要打包验证，是否能执行 `npm`。
- `AD_BUILD_BASELINE_DIR` 是否配置。
- 基线目录是否存在且可读。
- 当前进程是否处于基线发布模式。
- `tools/module-map.yaml` 是否存在且可解析。

输出：

```text
.ad-build/doctor.json
.ad-build/doctor.md
```

`doctor` 在检查完成时退出 0，即使某些检查失败；只有工具自身无法执行检查时退出 2。调用方必须读取 `overall_status`。

`doctor.json` 必需字段：

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-11T15:30:00+08:00",
  "overall_status": "failed",
  "checks": [
    {
      "name": "baseline_dir_writable",
      "status": "failed",
      "message": "AD_BUILD_BASELINE_DIR is not set"
    }
  ],
  "errors": [],
  "warnings": []
}
```

`overall_status` 枚举：`passed`、`warning`、`failed`。

`checks[].status` 枚举：`passed`、`warning`、`failed`、`skipped`。

生产信任模型：

- 共享基线目录应由 CI 或编译服务账号写入，开发容器默认只读。
- `baseline-save` 只有在 `AD_BUILD_BASELINE_PUBLISH=1` 时允许写入共享目录；否则退出码 4。
- `precheck` 只信任 `baseline.json` 中 `producer: "ad-build"`、`publisher` 在 `AD_BUILD_TRUSTED_PUBLISHERS` 内、且 manifest 校验通过的基线。
- `precheck` 还必须校验基线中的 `ad_build_version` 和 `ad_build_source_digest` 与当前 CLI 兼容；主版本不一致或 source digest 缺失时不能判为 `matched`。
- 如果共享目录对当前非发布进程可写，`doctor` 必须给出 warning；如果 `AD_BUILD_STRICT_BASELINE_PERMS=1`，该检查失败。

### precheck

采集当前环境：

- 当前 git commit。
- 当前分支。
- Docker 镜像或容器环境标识。
- 编译配置摘要。
- 当前 commit 是否存在成功全量编译基线。

输出：

```text
.ad-build/precheck.json
.ad-build/precheck.md
```

`baseline_status` 枚举：

```text
matched: 当前 commit 存在成功基线，且环境摘要匹配
missing: 基线目录可用，但当前 commit 没有基线
dir_unconfigured: 未配置 AD_BUILD_BASELINE_DIR
dir_unavailable: 基线目录不存在或不可读
env_mismatch: 找到基线，但 Docker/build config/toolchain 摘要不匹配
schema_mismatch: 找到基线，但 schema_version 不兼容
invalid_metadata: 找到基线，但缺少必需字段或校验失败
```

基线只有在以下字段全部匹配时才算 `matched`：

- `commit`
- `repo_id`
- `docker_identity`
- `build_config_digest`
- `toolchain_digest`
- `submodule_digest`
- `schema_version`

摘要计算规则必须字节稳定。所有摘要输入先构造成 UTF-8 JSON，使用 key 排序、无多余空格的 canonical JSON，再计算 `sha256`。

- `commit`：必须使用 `git rev-parse HEAD` 的完整 40 位 SHA，不允许保存缩写 SHA。
- `repo_id`：优先使用 `git config --get remote.origin.url`；去掉用户名密码、去掉结尾 `.git`、host 转小写、路径保留大小写。没有 remote 时使用 git 仓库根目录 basename，并记录 warning。
- `repo_key`：`repo_id` 的 `sha256:<hex>`，用于目录分区，避免 repo 名称和 URL 中的特殊字符进入路径。
- `docker_identity`：稳定镜像身份。优先使用 `AD_BUILD_DOCKER_IMAGE@AD_BUILD_DOCKER_DIGEST`；没有 digest 时使用 `AD_BUILD_DOCKER_IMAGE`；两者都没有时使用 `/etc/os-release` 内容和 `uname -m` 生成 `unknown-image:<sha256>` 并记录 warning。不得使用 `/etc/hostname` 参与匹配；hostname 只能作为诊断 metadata。
- `build_config_digest`：对存在的 `compile.sh`、`app.mk`、根 `Makefile`、`tools/module-map.yaml` 和 `AD_BUILD_CONFIG_FILES` 中列出的文件计算。`AD_BUILD_CONFIG_FILES` 使用 `:` 分隔。文件路径规范化为仓库相对 POSIX 路径、排序；每项包含 path、exists、sha256。缺失文件记录 warning 且以 `exists:false` 纳入 canonical JSON。
- `toolchain_digest`：对 `gcc --version`、`g++ --version`、`make --version`、`ld --version`、`python3 --version` 分别采集 `exit_code`、`stdout`、`stderr`；命令缺失时记录 `missing:true`。每项按工具名排序后纳入 canonical JSON。
- `submodule_digest`：使用 `git submodule status --recursive` 的原始输出、退出码和 stderr 构造 canonical JSON；没有 submodule 时使用空输出和退出码 0。
- 所有 digest 使用小写十六进制 `sha256:<hex>` 格式。
- `env_key`：对 `docker_identity`、`build_config_digest`、`toolchain_digest`、`submodule_digest` 的 canonical JSON 计算 `sha256:<hex>`，用于同一 commit 下多环境共存。
- `ref_key`：优先使用 `git symbolic-ref -q HEAD` 的完整 ref，例如 `refs/heads/develop`；detached HEAD 使用 `DETACHED:<full_commit_sha>`。对该字符串计算 sha256 hex，用于 ref 目录分区。
- `ad_build_source_digest`：对 npm package 中 `package.json`、`bin/**`、`lib/**`、`templates/**`、`skills/**` 的文件路径和内容 sha256 组成 canonical JSON，再计算 `sha256:<hex>`。
- `ad_build_version`：读取 npm package `package.json.version`。

`precheck` 在所有 baseline 状态下都退出 0，只在自身参数或运行错误时退出 2。`dir_unconfigured`、`dir_unavailable`、`missing`、`env_mismatch` 是事实状态，不是 CLI 失败。

示例：

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-11T15:30:00+08:00",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "branch": "develop",
  "repo_id": "ad",
  "repo_key": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "env_key": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "docker_identity": "ad-compile:20260611@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "ad_build_version": "0.1.0",
  "ad_build_source_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "build_config_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "toolchain_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "submodule_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "baseline_status": "matched",
  "worktree_clean": true,
  "baseline_dir_configured": true,
  "baseline_path": "/shared/ad-build-baselines/repos/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/commits/0123456789abcdef0123456789abcdef01234567/env/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/baseline.json",
  "nearest_baseline": null,
  "errors": [],
  "warnings": []
}
```

CLI 不输出 `recommendation` 字段。是否跳过修改前全量编译由 AI Skill 基于 `baseline_status` 和证据判断。

`nearest_baseline` 契约：

- 仅在同一 `repo_key`、当前 ref 对应的 `ref_key`、同一 `env_key` 下查找。
- 来源为 `/shared/ad-build-baselines/repos/<repo_key>/refs/<ref_key>/env/<env_key>/latest-success.json`。
- 如果 latest 指向的 baseline 不存在、schema 不兼容、publisher 不可信或 manifest 校验失败，`nearest_baseline` 必须为 `null`，并在 `warnings` 中说明。
- 不搜索所有分支，不做 git 祖先遍历；v1 只返回当前 ref 的 latest-success。
- 只有 `baseline_status` 为 `missing` 或 `env_mismatch` 时才返回非 null；`matched` 时为 `null`。
- 必需字段：`commit`、`baseline_path`、`ref`、`created_at`、`env_key`。`created_at` 来自 `latest-success.json.created_at`，不是 `updated_at`。

### full-build

包装现有全量编译命令，捕获退出码、日志和运行元数据，但不替代 `compile.sh`。

```bash
ad-build full-build -- ./compile.sh
```

输出：

```text
.ad-build/full-build/latest/full-build-result.json
.ad-build/full-build/latest/compile.log
```

`full-build-result.json` 必需字段：

```json
{
  "schema_version": 1,
  "run_id": "20260611T153000+0800-1234abcd",
  "generated_at": "2026-06-11T15:30:00+08:00",
  "command": "./compile.sh",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "branch": "develop",
  "repo_id": "ad",
  "repo_key": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "env_key": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "docker_identity": "ad-compile:20260611@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "ad_build_version": "0.1.0",
  "ad_build_source_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "build_config_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "toolchain_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "submodule_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "worktree_clean": true,
  "exit_code": 0,
  "started_at": "2026-06-11T14:30:00+08:00",
  "ended_at": "2026-06-11T15:30:00+08:00",
  "duration_seconds": 3600,
  "log_path": ".ad-build/full-build/latest/compile.log"
}
```

### baseline-save

仅从成功的 `full-build` 运行记录生成基线。

```bash
ad-build baseline-save --from-run latest
```

安全规则：

- 如果 `full-build-result.json.exit_code != 0`，拒绝保存，退出码 4。
- 如果 `full-build-result.json` 中记录的 `commit`、`repo_id`、`docker_identity`、`build_config_digest`、`toolchain_digest` 或 `submodule_digest` 与当前环境重新计算结果不一致，拒绝保存，退出码 4。
- 默认要求 git 工作区干净，包含 staged、unstaged、untracked；否则拒绝保存，退出码 4。
- 必须在发布模式下运行：`AD_BUILD_BASELINE_PUBLISH=1` 且 `AD_BUILD_BASELINE_PUBLISHER` 非空。
- `--allow-dirty` 只允许人工调试使用，生成的基线必须标记 `"dirty_worktree": true`，`precheck` 不得把这类基线判为 `matched`。
- 如果目标 commit 已有基线，默认拒绝覆盖；需要显式 `--replace`。
- 写入共享目录必须先通过 `mkdir <target>.lock` 获取锁；拿不到锁时退出码 4。
- 写入基线必须先写临时目录，再原子 rename 到目标目录。
- 如果目标目录已存在且未传 `--replace`，释放锁并退出码 4。
- `--replace` 只能在发布模式下覆盖同一 commit/env_key 的基线。
- 更新 `latest-success.json` 必须先写临时文件，再原子 rename。
- 更新 `latest-success.json` 前必须通过 `mkdir <ref>/<env>.latest.lock` 获取 ref/env-level 锁。
- 持有 ref/env-level 锁期间执行 read/compare/write：只允许 `created_at` 更新的基线覆盖 `latest-success.json`；更旧的运行不得覆盖较新的 latest。
- 写完 latest 后释放 ref/env-level 锁。

保存：

- `baseline.json`
- `compile.log`
- `docker-info.txt`
- `artifact-manifest.txt`
- `module-times.csv`，如果已有模块耗时数据

共享目录结构：

```text
/shared/ad-build-baselines/
  repos/
    <repo_key_safe>/
      refs/
        <ref_key_safe>/
          env/
            <env_key_safe>/
              latest-success.json
      commits/
        <full_commit_sha>/
          env/
            <env_key_safe>/
              baseline.json
              compile.log
              docker-info.txt
              artifact-manifest.txt
              module-times.csv
```

`repo_key_safe`、`env_key_safe` 和 `ref_key_safe` 为去掉 `sha256:` 前缀后的 hex 字符串，避免分支名或 URL 中的特殊字符进入路径。

`baseline.json` 必需字段：

```json
{
  "schema_version": 1,
  "created_at": "2026-06-11T15:30:00+08:00",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "branch": "develop",
  "repo_id": "ad",
  "repo_key": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "env_key": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "docker_identity": "ad-compile:20260611@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "ad_build_version": "0.1.0",
  "ad_build_source_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "build_config_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "toolchain_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "submodule_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "dirty_worktree": false,
  "producer": "ad-build",
  "publisher": "ci",
  "manifest_sha256": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "full_build": {
    "run_id": "20260611T153000+0800-1234abcd",
    "command": "./compile.sh",
    "exit_code": 0,
    "duration_seconds": 3600,
    "log_path": "compile.log"
  },
  "artifacts": {
    "manifest_path": "artifact-manifest.txt"
  }
}
```

`latest-success.json` 必需字段：

```json
{
  "schema_version": 1,
  "updated_at": "2026-06-11T15:30:00+08:00",
  "created_at": "2026-06-11T15:30:00+08:00",
  "ref": "develop",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "repo_key": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "env_key": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "baseline_path": "/shared/ad-build-baselines/repos/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/commits/0123456789abcdef0123456789abcdef01234567/env/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/baseline.json"
}
```

### diff

输出当前改动文件列表：

```text
.ad-build/diff-files.txt
.ad-build/diff-summary.json
```

默认比较工作区相对 `HEAD` 的改动。

第一版必须支持：

```bash
ad-build diff
ad-build diff --base <ref>
```

`diff` 包含 staged、unstaged、untracked、deleted、renamed 文件；忽略 `.gitignore` 排除的 ignored 文件。路径统一为仓库相对路径，使用 `/` 分隔。

`diff --base <ref>` 语义：

- tracked 文件使用 `git diff --name-status --find-renames=50% --find-copies=50% <ref> --` 对比 `<ref>` 和当前工作区内容。
- staged 和 unstaged 修改都包含在结果中。
- untracked 文件通过 `git ls-files --others --exclude-standard` 追加，状态为 `untracked`。
- deleted、renamed、copied 文件保留对应状态；renamed/copied 记录 `old_path`。
- ignored 文件不包含。
- `is_binary` 类型为 `boolean | null`。使用 `git diff --numstat <ref> -- <path>` 判断；numstat 两列均为 `-` 时为 true。untracked 文件无法可靠通过该命令判断时使用 `null`，表示 unknown。

`diff-summary.json` 必需字段：

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-11T15:30:00+08:00",
  "base_ref": "HEAD",
  "head_ref": "WORKTREE",
  "files": [
    {
      "path": "apps/snmp/main.c",
      "status": "modified",
      "old_path": null,
      "is_untracked": false,
      "is_binary": false
    }
  ],
  "errors": [],
  "warnings": []
}
```

`status` 枚举：`added`、`modified`、`deleted`、`renamed`、`copied`、`untracked`、`type_changed`、`unknown`。

### map

读取 `tools/module-map.yaml`，根据路径规则做基础匹配。

它只回答“这些改动落在哪些模块目录或高风险路径上”，不做最终风险判断。

`map` 默认先执行一次 `diff` 并消费新生成的 `.ad-build/diff-summary.json`，避免读取过期 diff。后续可以增加 `--from-diff <path>`，但 v1 默认行为必须重新采集。

如果 diff 结果包含 `tools/module-map.yaml`，`map` 必须：

- 标记 high risk。
- 设置 `mapping_trusted: false`。
- 继续输出当前映射结果，但 AI 不得仅依赖当前映射降低验证范围。
- 在 `warnings` 中说明 module map 已修改。

输出：

```text
.ad-build/module-map-result.json
.ad-build/module-map-result.md
```

路径匹配规则：

- 所有路径必须是仓库相对路径。
- 路径分隔符统一为 `/`。
- 匹配大小写敏感。
- `foo/**` 表示 `foo/` 下任意深度文件。
- pattern 不含 `/` 时匹配任意目录下的 basename。
- 风险规则优先于模块规则；同一文件可以同时出现在 `risk_matches` 和 `module_matches`。
- 一个文件匹配多个模块时全部保留，由 AI 判断验证范围。

示例配置：

```yaml
modules:
  snmp:
    display_name: SNMP
    paths:
      - apps/snmp/**
    cwd: .
    build:
      - make -C apps/snmp
    timeout_seconds: 3600
    env: {}
    log_name: snmp

  src_3e:
    paths:
      - apps/src.3e/**
    build:
      - make -C apps/src.3e

  access_layer:
    paths:
      - access_layer/**
    build:
      - make -C access_layer

risk_rules:
  high:
    - compile.sh
    - app.mk
    - Dockerfile
    - .github/**
    - ci/**
    - tools/module-map.yaml
    - package.json
    - package-lock.json
    - bin/**
    - lib/**
    - "**/*.mk"
    - Makefile*
    - "**/Makefile"
    - include/common/**
    - proto/**
    - shell/**
    - packet/**
    - mkpacket*
    - mkpacket/**
    - ssipacket*
    - ssipacket/**
    - sign*
    - sign/**
    - release/**
    - upgrade_framework/**
```

`module-map.yaml` schema：

- `modules` 必需是对象，key 为 verify 模块名，只能包含 `[A-Za-z0-9_.-]`。
- `display_name` 可选，默认等于模块名。
- `paths` 必需是非空字符串数组。
- `build` 必需是非空字符串数组，按顺序执行。
- `cwd` 可选，默认 `"."`，必须是仓库内相对路径。
- `timeout_seconds` 可选，默认 3600，必须大于 0。
- `env` 可选，默认 `{}`，值必须是字符串。
- `log_name` 可选，默认等于模块名，必须能安全转成日志文件名。
- `risk_rules.high` 可选。CLI 必须始终内建并应用 Phase 1 默认高风险规则；配置文件中的 `risk_rules.high` 只能追加，不能替换内建规则。条目可以是字符串，也可以是对象 `{ pattern, reason }`；字符串 reason 默认为 `"matched high-risk pattern"`。
- 配置无效时 `map`、`modules`、`verify` 退出码 2，并写入 `errors`。

Phase 1 内建 high-risk 规则必须至少包含：

```yaml
built_in_high_risk:
  - compile.sh
  - app.mk
  - Dockerfile
  - .github/**
  - ci/**
  - tools/module-map.yaml
  - package.json
  - package-lock.json
  - bin/**
  - lib/**
  - "**/*.mk"
  - Makefile*
  - "**/Makefile"
  - include/common/**
  - proto/**
  - shell/**
  - packet/**
  - mkpacket*
  - mkpacket/**
  - ssipacket*
  - ssipacket/**
  - sign*
  - sign/**
  - release/**
  - upgrade_framework/**
```

内建 high-risk 规则的默认 reason 必须稳定生成，格式为 `built-in high-risk rule: <pattern>`。配置文件追加的字符串规则使用 `matched high-risk pattern`，对象规则使用对象内的 `reason`。

Glob 语义：

- pattern 不以 `/` 开头，始终按仓库相对路径匹配。
- pattern 不含 `/` 时只匹配 basename，例如 `Makefile*` 匹配任意目录下 basename 以 `Makefile` 开头的文件。
- `**/name` 匹配任意深度下 basename 为 `name` 的路径。
- `**/*.ext` 匹配任意深度下以 `.ext` 结尾的文件，包括仓库根目录下的文件。
- `dir/**` 匹配 `dir/` 下任意深度文件。
- 单个 `*` 永远不跨 `/`；只有 `**` 可以跨目录层级。
- 其他 pattern 使用 POSIX `/` 路径和大小写敏感的全路径匹配。

输出：

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-11T15:30:00+08:00",
  "changed_files": ["apps/snmp/main.c"],
  "module_matches": [
    {
      "module": "snmp",
      "file": "apps/snmp/main.c",
      "pattern": "apps/snmp/**"
    }
  ],
  "risk_matches": [],
  "unmapped_files": [],
  "valid_verify_modules": ["snmp"],
  "mapping_trusted": true,
  "errors": [],
  "warnings": []
}
```

`risk_matches` 条目格式：

```json
{
  "file": "compile.sh",
  "risk_level": "high",
  "pattern": "compile.sh",
  "reason": "build orchestration changed"
}
```

### modules

列出 `tools/module-map.yaml` 中可验证模块，帮助开发者和 AI 发现合法的 `verify` 参数。

```bash
ad-build modules
```

输出：

```text
.ad-build/modules.json
.ad-build/modules.md
```

`modules.json` 必需字段：

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-11T15:30:00+08:00",
  "modules": [
    {
      "name": "snmp",
      "display_name": "SNMP",
      "paths": ["apps/snmp/**"],
      "cwd": ".",
      "build": ["make -C apps/snmp"],
      "timeout_seconds": 3600,
      "log_name": "snmp"
    }
  ]
}
```

### verify

执行指定模块的验证命令：

```bash
ad-build verify snmp
```

CLI 不自动选择模块，模块由 AI 或开发者明确传入。这样可以避免工具内部做隐式推理。

执行规则：

- 模块必须存在于 `tools/module-map.yaml`。
- 多模块按命令行传入顺序串行执行。
- 默认遇到第一个失败即停止。
- 停止后，尚未执行的请求模块必须出现在 `verify-summary.json` 中，状态为 `not_run`。
- 每个 build 命令在模块配置的 `cwd` 下通过 `sh -lc` 执行。
- `timeout_seconds` 作用于单条 build 命令，不是整个模块。
- 同一模块的所有命令追加写入同一个模块日志。
- 一个模块内某条命令失败后，该模块后续命令记录为 `not_run`。
- 命令继承当前环境，并追加模块配置中的 `env`。
- `timeout_seconds` 默认 3600。
- 日志文件名来自 `log_name`，只能包含 `[A-Za-z0-9_.-]`，否则 CLI 必须安全转义。
- 未知模块退出码 2。
- 验证命令失败或超时退出码 1。

输出：

```text
.ad-build/runs/20260611T153000+0800-1234abcd/
  verify-summary.json
  verify-summary.md
  snmp.log
```

`verify-summary.json` 必需字段：

```json
{
  "schema_version": 1,
  "run_id": "20260611T153000+0800-1234abcd",
  "generated_at": "2026-06-11T15:30:00+08:00",
  "requested_modules": ["snmp"],
  "results": [
    {
      "module": "snmp",
      "status": "passed",
      "commands": [
        {
          "command": "make -C apps/snmp",
          "status": "passed",
          "cwd": ".",
          "exit_code": 0,
          "started_at": "2026-06-11T15:30:00+08:00",
          "ended_at": "2026-06-11T15:31:00+08:00",
          "duration_seconds": 60,
          "log_path": ".ad-build/runs/20260611T153000+0800-1234abcd/snmp.log"
        }
      ]
    }
  ],
  "overall_status": "passed",
  "errors": [],
  "warnings": []
}
```

`status` 枚举：`passed`、`failed`、`timeout`、`not_run`、`unknown_module`。

模块级 `status` 和每条 command 的 `status` 使用同一枚举。模块内某条命令失败后，后续未执行命令必须以 `status: "not_run"` 出现在 `commands` 中，`exit_code` 为 null。

如果模块内先出现 `failed` 或 `timeout`，后续命令为 `not_run`，模块级 `status` 保持第一个失败命令的状态；只有 `overall_status` 因存在 `not_run` 变为 `partial`。

`overall_status` 枚举：`passed`、`failed`、`partial`。

`overall_status` 规则：

- 所有请求模块和命令都 passed 时为 `passed`。
- 至少一个命令 failed 或 timeout，且没有后续模块/命令因为早停而 `not_run` 时为 `failed`。
- 出现任何 `not_run` 时为 `partial`。

### report

把某次运行的 JSON 和日志摘要成人可读报告，方便粘贴到评审或问题单。

```bash
ad-build report 20260611T153000+0800-1234abcd
```

输入：

- `.ad-build/runs/<run-id>/verify-summary.json`
- 对应模块日志，若存在

输出：

```text
.ad-build/runs/<run-id>/report.md
```

如果 run 不存在，退出码 3。如果 summary 不完整，报告必须标记 `partial`，并退出码 1。

`summary` 不完整的定义：

- `verify-summary.json` 缺少必需字段。
- `overall_status` 和 `results` 无法对应。
- `results` 中声明的日志文件不存在。
- run 目录缺失。

## Skill Design

Skill 名称建议为 `ad-build`。

触发场景：

- 用户要求判断 AD 项目本次改动是否需要全量编译。
- 用户要求用 `ad-build` 工具做修改前检查。
- 用户要求分析修改后应该验证哪些模块。
- 用户要求解释 AD 编译失败日志。

Skill 的核心工作流：

1. 先运行 `ad-build precheck`。
2. 只有当 `precheck` 输出 `baseline_status: matched`、`worktree_clean: true`、`errors: []` 且没有阻塞性 warning 时，才允许建议跳过修改前全量编译。
3. 运行 `ad-build diff` 和 `ad-build map`。
4. 读取 `diff-files.txt`、`module-map-result.json`、相关 Makefile。相关 Makefile 包括匹配模块目录内的 Makefile、父目录 Makefile、仓库根 Makefile、可发现的 `include *.mk` 文件和共享构建配置。
5. 判断风险等级。
6. 明确列出必须验证模块、建议验证模块、以及本轮未选择验证的模块；除非有依赖证据，不得称模块“确定可跳过”。
7. 调用 `ad-build verify <module...>` 执行验证。
8. 如果验证失败，读取对应模块日志并给出最小下一步建议。
9. 如果触及高风险文件，最终状态必须保持 `full_build_status: required`，直到全量编译已经运行成功，或已经明确排队且有负责人/流水线记录。

Skill 规则：

- AI 判断必须基于 CLI 输出、diff、Makefile 和模块映射，不能凭空假设。
- 如果必需的 CLI 输出、diff、Makefile 或模块映射缺失、过期、互相冲突或无法读取，AI 不得推断安全，必须要求更广验证或询问开发者。
- 如果 `mapping_trusted: false`，AI 必须把本次判断标记为高风险，不得直接运行来自未审查 module map 的 `verify` 命令；必须先向用户展示将执行的 module、command、cwd、env。
- `module-map.yaml` 是初筛，不是最终依赖真相。
- 修改公共构建配置、工具链、公共头文件、proto、Docker 环境、打包脚本时，默认高风险。
- 只修改单个业务模块目录且未触及公共文件时，优先验证该模块。
- 如果路径未映射，AI 必须检查 Makefile 或询问开发者，不得强行跳过验证。
- 真实编译结果优先于 AI 判断。

Skill 的最终建议必须使用结构化字段：

```text
risk_level: low | medium | high
evidence: 使用了哪些 CLI 输出、diff、Makefile
required_verification: 必须执行的模块或全量验证
optional_verification: 可选增强验证
not_selected_for_this_pass: 本轮未选择验证的模块
full_build_status: not_required | required | queued | passed
unknowns: 仍未确认的信息
cannot_claim_safe_until: 需要满足的完成条件
```

## Data Contracts

CLI 优先输出机器可读 JSON；面向人的 Markdown 在交互型命令中提供。命令特例：

- `full-build` 输出 `full-build-result.json` 和 `compile.log`，不要求 Markdown。
- `baseline-save` 输出共享目录中的 `baseline.json`、`latest-success.json` 和复制的日志/manifest，默认不写本地 Markdown。
- `report` 输出 Markdown 报告，依赖已有 JSON summary，不要求另写 JSON。

稳定 JSON 文件包括：

```text
.ad-build/doctor.json
.ad-build/precheck.json
.ad-build/full-build/latest/full-build-result.json
.ad-build/diff-summary.json
.ad-build/module-map-result.json
.ad-build/modules.json
.ad-build/runs/<run-id>/verify-summary.json
/shared/ad-build-baselines/repos/<repo_key>/commits/<commit>/env/<env_key>/baseline.json
/shared/ad-build-baselines/repos/<repo_key>/refs/<ref_key>/env/<env_key>/latest-success.json
```

所有 JSON 字段必须向后兼容。新增字段允许，删除或改名字段需要版本号升级。

## Docker Integration

工具运行在现有 Docker 编译容器内。

需要挂载一个共享目录：

```text
/shared/ad-build-baselines
```

如果没有共享目录，`precheck` 仍然可以运行，但 `baseline_status` 必须是 `dir_unconfigured` 或 `dir_unavailable`，不能判断是否已有成功全量基线。

推荐环境变量：

```bash
export AD_BUILD_BASELINE_DIR=/shared/ad-build-baselines
export AD_BUILD_WORK_DIR=/path/to/ad/repo
```

`AD_BUILD_BASELINE_DIR` 是启用基线查询和保存的必需变量。`AD_BUILD_WORK_DIR` 可选；未设置时使用当前 git 仓库根目录。

## Risk Handling

风险等级分三档：

```text
low: 单模块路径改动，未触及公共文件
medium: 多模块改动，或存在未映射文件
high: 构建配置、公共头文件、proto、Docker、工具链、打包签名相关改动
```

处理策略：

- `low`：验证匹配模块即可。
- `medium`：验证匹配模块，并检查未映射文件影响；如果影响仍未知，不能宣称安全。
- `high`：验证直接模块，同时要求全量编译或 CI 后台全量兜底；模块验证通过也只能说明局部验证通过。

## Implementation Phases

### Phase 1: Minimal Useful CLI

交付：

- `package.json`
- `bin/ad-build.js`
- `lib/`
- `tools/module-map.yaml`，项目本地默认配置，随项目 zip 交付，不进入 npm tarball
- `templates/module-map.yaml`
- `doctor`
- `precheck`
- `full-build`
- `baseline-save`
- `diff`
- `map`
- `modules`
- `verify`
- `report`

验收：

- 能在 Docker 内查询当前 commit 是否已有基线。
- 能保存成功全量编译记录。
- 能列出改动文件。
- 能按路径匹配模块。
- 能列出合法 verify 模块。
- 能执行指定模块验证并保存日志。
- `npm pack --dry-run` 只列出 allowlist 文件。
- `npm pack` 能生成 `.tgz`，且可用 `npm install -g <tgz>` 安装后执行 `ad-build doctor`。

### Phase 2: Skill

交付：

- `ad-build/SKILL.md`
- 可选 `references/risk-rules.md`
- 可选 `references/examples.md`

验收：

- AI 能按 Skill 使用 CLI。
- AI 不再建议把模型调用塞进 CLI。
- AI 能解释 `module-map.yaml` 只是初筛。
- AI 能在高风险改动时建议全量兜底。

### Phase 3: Baseline Adoption

交付：

- CI 全量编译成功后自动执行 `baseline-save`。
- 开发者文档或 Skill 中固化推荐流程。

验收：

- 多个开发者拉到同一 commit 时，不再重复手动前置全量编译。
- 能追溯某个 commit 的 Docker 环境、日志和产物摘要。

### Phase 4: Optional Enhancements

后续可做：

- 模块耗时画像。
- 失败日志聚类。
- 自动生成 `module-map.yaml` 初稿。
- 和 CI 系统联动展示最近成功基线。

## Acceptance Criteria

第一版完成后，以下场景必须成立：

1. 当前 commit 有成功全量编译基线且环境摘要匹配时，`precheck` 输出 `baseline_status: matched`，但不输出跳过全量的决策。
2. 当前 commit 没有基线时，`precheck` 输出 `baseline_status: missing`，不伪造安全结论。
3. 只修改 `apps/snmp/**` 时，`map` 能匹配 `snmp`。
4. 修改 `compile.sh` 或 `app.mk` 时，`map` 能标记高风险。
5. `verify snmp` 能执行配置中的 snmp 编译命令并保存日志。
6. `baseline-save` 遇到失败 full-build run、脏工作区或已有基线且未传 `--replace` 时必须拒绝。
7. `doctor` 能报告缺失的共享基线目录和 module map。
8. AI 使用 Skill 时，最终建议包含结构化字段、证据、验证模块和是否需要全量兜底。
9. npm package 不包含安装期 lifecycle scripts、第三方依赖或 allowlist 外文件。
10. 最终 zip 必须从当前工作树生成，排除 `.git/`、`.ad-build/`、`node_modules/`、npm `.tgz` 以外的临时输出，并包含 `artifact-manifest.json`。manifest 必须记录 git commit、分支、npm tarball 路径、npm tarball sha256、zip sha256、生成时间和文件清单。

## Assumptions

- 现有 Docker 容器内可以访问 git、shell、Makefile 和编译命令。
- 团队可以提供一个 Docker 可挂载的共享目录用于保存基线。
- 第一版 `module-map.yaml` 可以先人工维护关键模块，不要求覆盖全部 260 个模块。
- 全量编译是否成功仍以现有 `compile.sh` 退出码和产物检查为准。

