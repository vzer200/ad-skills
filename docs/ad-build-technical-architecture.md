# ad-build 编译状态复用与局部验证技术架构文档

版本：v0.1 草案
日期：2026-06-12

## 1. 背景

AD 工程当前存在三个核心痛点：

1. 开发新需求前经常需要重新跑全量编译，成本高。
2. 全量编译后工作区会出现大量 `Modified` 和 `Untracked` 文件，AI 很难区分哪些是开发者真实改动，哪些是编译副作用。
3. 修改 C/C++ 模块后，AI 需要基于 Makefile、模块映射和真实编译日志，给出局部编译命令、编译结果和产物位置，而不是靠猜。

当前已知情况：

- 已存在一个刚刚全量编译成功的 Docker 容器。
- 当前容器内仓库路径示例为 `/root/AD`，但不同人或不同流水线的路径可能不同。
- 全量编译前的流程可以保证是 clean commit，然后执行全量编译。
- 编译平台可以监听 git 事件，可以保存很大的流水线产物。
- Node 环境稳定可用。
- 当前第一阶段不依赖共享目录，也不强依赖 Docker registry。

因此第一阶段优先实现：

```text
从已全量编译成功的工作区提取完整编译状态包
        ↓
由打包平台保存该状态包
        ↓
后续流水线或开发环境恢复该状态包
        ↓
过滤编译副作用，只识别开发者真实改动
        ↓
基于 diff/map/verify/report 做局部编译验证
```

## 2. 目标

### 2.1 一阶段目标

一阶段目标是交付一个可在内网直接落地的 `compiled-state bundle` 能力：

```text
ad-build bundle pack
ad-build bundle inspect
ad-build bundle restore
ad-build diff --source-only
ad-build map --source-only
ad-build verify <module>
ad-build report <run-id>
```

该能力要求：

- 能从已经全量编译成功的工作区中打包编译后状态。
- 能保存 tracked modified 文件的最终内容。
- 能保存 untracked/generated 编译产物。
- 能保存文件权限、sha256、git commit、基础环境等元数据。
- 能在另一个同 commit 的工作区恢复该状态。
- 能在恢复后通过 inventory 过滤编译副作用。
- 能让内网 GLM5.0 基于确定性 JSON/Markdown 输出进行判断。

### 2.2 二阶段目标

二阶段再考虑更小粒度的公共基础镜像：

```text
libs/
sinfor/
include/
linux/
app_bin/
```

二阶段不是当前验收的前置条件。当前优先确保完整编译状态包能跑通。

## 3. 非目标

第一阶段明确不做以下事情：

- 不承诺固定 5 分钟恢复。
- 不要求业务仓库改造 Makefile。
- 不要求第一版接入 Docker registry。
- 不要求第一版拆分公共基础镜像。
- 不把编译产物提交到 git。
- 不让 AI 直接猜测哪些文件是编译产物。
- 不把局部编译成功等价为全量编译成功。

## 4. 总体架构

```text
┌──────────────────────────────────────────┐
│ 已全量编译成功的 Docker 容器              │
│ repo: /root/AD 或其他路径                 │
│ 状态: clean commit + full compile outputs │
└─────────────────────┬────────────────────┘
                      │
                      │ ad-build bundle pack
                      ▼
┌──────────────────────────────────────────┐
│ compiled-state bundle                     │
│ - bundle.tar / bundle.tar.zst             │
│ - manifest.json                           │
│ - inventory.json                          │
│ - pack log                                │
└─────────────────────┬────────────────────┘
                      │
                      │ 打包平台保存为流水线产物
                      ▼
┌──────────────────────────────────────────┐
│ 后续流水线 / 开发环境                      │
│ git checkout 同一个 commit                │
└─────────────────────┬────────────────────┘
                      │
                      │ ad-build bundle restore
                      ▼
┌──────────────────────────────────────────┐
│ 已恢复的编译后状态                         │
│ git status 可能仍然是 dirty，这是正常现象  │
└─────────────────────┬────────────────────┘
                      │
                      │ ad-build diff --source-only
                      ▼
┌──────────────────────────────────────────┐
│ 只包含开发者真实改动的 source-only diff    │
└─────────────────────┬────────────────────┘
                      │
                      │ ad-build map --source-only / verify / report
                      ▼
┌──────────────────────────────────────────┐
│ GLM5.0 基于 CLI 输出解释风险、命令和产物    │
└──────────────────────────────────────────┘
```

核心原则：

```text
CLI 负责事实采集、执行、校验和结构化输出。
AI 负责解释、决策建议和错误定位。
流水线负责触发、保存和传递 bundle。
```

## 5. 组件设计

### 5.1 ad-build CLI

`ad-build` 是确定性 CLI，不调用模型。

它负责：

- 打包编译后状态。
- 恢复编译后状态。
- 记录 manifest 和 inventory。
- 过滤编译副作用。
- 映射源码改动到模块。
- 执行局部编译命令。
- 汇总日志、产物和验证结果。

### 5.2 Bundle 模块

Bundle 模块是一阶段新增核心模块。

命令：

```bash
ad-build bundle pack --profile full --out ad-build-compiled-state.tar
ad-build bundle inspect --bundle ad-build-compiled-state.tar
ad-build bundle restore --bundle ad-build-compiled-state.tar
```

它负责从当前仓库根目录生成可恢复的编译状态包。

### 5.3 Inventory 模块

Inventory 用于记录“哪些 dirty 文件来自 bundle 恢复”。

恢复后写入：

```text
.ad-build/inventory/current.json
```

该文件用于后续 `ad-build diff --source-only` 判断：

```text
路径在 inventory 中且 hash 没变      => 编译恢复物，过滤
路径在 inventory 中但 hash 变了      => 开发者恢复后又改了，保留
路径不在 inventory 中但 git dirty    => 开发者真实改动，保留
inventory 中的文件被删除             => 开发者真实改动，保留
```

### 5.4 Source-only Diff

`ad-build diff --source-only` 是给 AI 使用的关键入口。

它不直接等价于 `git status`。

它会输出：

```text
.ad-build/diff-source-only.json
.ad-build/diff-source-only.txt
```

其中只保留开发者真实改动，不包含从 bundle 恢复出来且未再次改变的编译副作用。

### 5.5 Skill 文档

`skills/ad-build/SKILL.md` 用来约束 GLM5.0：

- 不直接根据普通 `git status` 下结论。
- 必须优先读取 `ad-build diff --source-only`。
- 必须基于 `manifest.json`、`inventory.json`、`module-map-result.json`、`verify-summary.json` 和真实日志判断。
- 如果输出缺失、过期、矛盾或不可读，必须要求重新运行 CLI，而不是猜。

### 5.6 GLM5.0 Handoff 文档

新增：

```text
docs/glm5-internal-handoff.md
```

该文档面向内网 AI，内容应非常直接：

- 当前工具要解决什么问题。
- 第一次如何打包 bundle。
- 后续如何恢复 bundle。
- 哪几个变量需要根据内网环境修改。
- 失败时先看哪些 JSON 和日志。
- 哪些结论不能说。

## 6. Profile 设计

第一阶段提供两个 profile：

```text
full：默认，尽量还原完整全量编译后状态。
dev：后续优化，用于日常局部开发，排除最终打包工作目录。
```

因为当前打包平台可以保存很大的产物，所以第一阶段默认使用 `full`。

### 6.1 full profile

定位：

```text
尽量还原刚刚全量编译成功后的完整工作区状态。
```

包含：

```text
所有 tracked modified 文件
所有 tracked added/renamed/copied 文件
所有需要记录的 deleted 文件
所有 untracked/generated 文件
关键产物目录
最终包目录
打包工作目录
```

默认覆盖目录包括：

```text
apps/
libs/
linux/
access_layer/
include/
sinfor/
app_bin/
obj/
shell/
ui/
cfg/
mkpacket/
ssipacket/
ad_packet/
```

也包括：

```text
mkpacket/*.ssu
ssipacket/*.ssi
```

排除：

```text
.git/
.ad-build/bundle 输出目录本身
当前正在生成的 bundle 文件
node_modules/，除非显式配置包含
临时日志目录，除非显式配置包含
```

### 6.2 dev profile

定位：

```text
用于日常开发和局部编译恢复，不保证复现最终 .ssu/.ssi 打包产物。
```

包含：

```text
所有 tracked modified 文件，全局包含。
apps/
libs/
linux/
access_layer/
include/
sinfor/
app_bin/
obj/
shell/
ui/
cfg/
```

不包含以下目录的大量 untracked 打包工作产物：

```text
mkpacket/
ssipacket/
ad_packet/
```

但注意：

```text
如果 mkpacket/、ssipacket/、ad_packet/ 内存在 tracked modified 文件，dev profile 仍然保存。
```

例如：

```text
M mkpacket/appversion
M mkpacket/package.conf
M ssipacket/make_ssi.sh
```

即使是 dev profile，也会保存这些文件的当前内容。

## 7. 文件采集策略

### 7.1 tracked modified 文件

无论 `full` 还是 `dev`，所有 tracked dirty 文件都保存实际内容。

示例：

```text
M shell/Makefile
M cfg/appversion
M ui/rep_ui/report.php
M app_bin/x86_64/xxx.so
```

Bundle 保存的是文件当前内容，不是保存 diff。

Manifest 记录：

```json
{
  "path": "shell/Makefile",
  "git_status": "modified",
  "kind": "file",
  "sha256": "sha256:...",
  "size": 12345,
  "mode": "0755"
}
```

### 7.2 untracked 文件

untracked 文件由 profile 决定是否保存。

`full` 默认尽量保存全部 untracked/generated 文件。
`dev` 默认只保存局部编译和开发恢复所需目录下的 untracked/generated 文件。

示例：

```text
?? apps/foo/foo.o
?? libs/libfoo.so
?? linux/build/foo.ko
?? access_layer/foo/build/
?? obj/lib64/libfoo.a
```

### 7.3 deleted 文件

如果全量编译后出现 tracked deleted 文件，manifest 记录 deletion：

```json
{
  "path": "some/file",
  "git_status": "deleted",
  "kind": "deleted"
}
```

恢复时会删除对应路径。

### 7.4 权限和换行符变化

权限变化、`dos2unix` 换行符变化、版本号替换都视为编译后状态的一部分。

处理方式：

```text
不让 AI 判断是否保存。
不保存 patch。
直接保存文件当前内容和权限。
```

## 8. Bundle Manifest 设计

Manifest 文件示例：

```json
{
  "schema_version": 1,
  "type": "ad-build.compiled-state-bundle",
  "created_at": "2026-06-12T00:00:00.000Z",
  "producer": "ad-build",
  "profile": "full",
  "repo": {
    "root_at_pack_time": "/root/AD",
    "commit": "<commit_sha>",
    "branch": "release-AD7.0.29R2",
    "remote": "<remote_url>",
    "worktree_clean_before_full_build_assumed": true
  },
  "environment": {
    "container_id": "3d0e912e28d3",
    "base_image": "registry.me/ad_codescan/cpp_zqg",
    "os": "PlatoS 1.3",
    "node_version": "vXX.YY.ZZ"
  },
  "bundle": {
    "format": "tar",
    "compression": "none",
    "file_count": 12345,
    "total_size": 123456789,
    "sha256": "sha256:..."
  },
  "entries": [
    {
      "path": "shell/Makefile",
      "git_status": "modified",
      "source": "git-status",
      "kind": "file",
      "sha256": "sha256:...",
      "size": 1000,
      "mode": "0755"
    },
    {
      "path": "libs/libfoo.so",
      "git_status": "untracked",
      "source": "profile-generated-dir",
      "kind": "file",
      "sha256": "sha256:...",
      "size": 888888,
      "mode": "0644"
    }
  ]
}
```

## 9. Restore 设计

### 9.1 前置校验

恢复时默认要求：

```text
当前工作区 commit 与 bundle manifest 里的 commit 一致。
```

如果不一致，默认拒绝恢复，并提示：

```bash
ad-build bundle restore --bundle xxx.tar --allow-commit-mismatch
```

只有显式加参数才允许跨 commit 恢复。

### 9.2 路径处理

Bundle 内只保存仓库相对路径。

因此以下路径都可以恢复同一个 bundle：

```text
/root/AD
/workspace/AD
/builds/group/project
```

恢复依据不是绝对路径，而是当前执行目录对应的 git root。

### 9.3 恢复流程

恢复流程：

```text
1. 定位当前 git root。
2. 读取 bundle manifest。
3. 校验 commit。
4. 校验 bundle 内路径都是安全相对路径，禁止 ../ 和绝对路径。
5. 解包到临时 staging 目录。
6. 按 manifest 覆盖文件、恢复权限、处理 deletion。
7. 逐个校验 sha256。
8. 写入 .ad-build/inventory/current.json。
9. 输出 restore summary。
```

### 9.4 恢复后的状态

恢复后 `git status` 很可能仍然显示大量 dirty 文件。

这是正常状态。

正确判断方式是：

```bash
ad-build diff --source-only
```

而不是直接让 AI 读取普通 `git status`。

## 10. Inventory 设计

Inventory 示例：

```json
{
  "schema_version": 1,
  "created_at": "2026-06-12T00:00:00.000Z",
  "source_bundle": "ad-build-compiled-state.tar",
  "source_commit": "<commit_sha>",
  "restore_commit": "<commit_sha>",
  "restored_entries": [
    {
      "path": "shell/Makefile",
      "git_status_at_pack": "modified",
      "sha256_at_restore": "sha256:...",
      "mode": "0755"
    },
    {
      "path": "libs/libfoo.so",
      "git_status_at_pack": "untracked",
      "sha256_at_restore": "sha256:...",
      "mode": "0644"
    }
  ]
}
```

Inventory 是 `source-only diff` 的事实依据。

## 11. Source-only Diff 规则

`ad-build diff --source-only` 的核心规则如下：

| 当前状态 | 是否在 inventory | hash 是否等于 restore hash | 结论 |
|---|---:|---:|---|
| modified | 是 | 是 | 编译恢复物，过滤 |
| modified | 是 | 否 | 开发者恢复后修改，保留 |
| deleted | 是 | 不适用 | 开发者恢复后删除，保留 |
| untracked | 是 | 是 | 编译恢复物，过滤 |
| untracked | 是 | 否 | 开发者恢复后修改，保留 |
| modified/untracked | 否 | 不适用 | 开发者真实改动，保留 |

输出示例：

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-12T00:00:00.000Z",
  "mode": "source-only",
  "inventory_path": ".ad-build/inventory/current.json",
  "files": [
    {
      "path": "apps/foo/foo.c",
      "status": "modified",
      "reason": "not_in_restore_inventory"
    }
  ],
  "filtered_restore_files": 8560,
  "warnings": []
}
```

## 12. 流水线集成

你们的打包平台能监听 git 事件，并能保存大产物。因此第一阶段按通用流水线接入，不绑定 GitLab CI。

### 12.1 生成 bundle 的流水线步骤

在全量编译成功后执行：

```bash
cd "$AD_BUILD_WORK_DIR"
ad-build bundle pack \
  --profile full \
  --out "$AD_BUILD_BUNDLE_OUT"
```

建议变量：

```bash
AD_BUILD_WORK_DIR=/root/AD
AD_BUILD_BUNDLE_OUT=ad-build-compiled-state-${BRANCH}-${COMMIT}.tar
AD_BUILD_PROFILE=full
```

平台保存产物：

```text
ad-build-compiled-state-<branch>-<commit>.tar
ad-build-compiled-state-<branch>-<commit>.manifest.json
ad-build-compiled-state-<branch>-<commit>.inventory.json
```

### 12.2 恢复 bundle 的流水线步骤

后续局部编译流水线执行：

```bash
cd "$AD_BUILD_WORK_DIR"
git checkout "$COMMIT"
ad-build bundle restore --bundle "$AD_BUILD_BUNDLE"
ad-build diff --source-only
ad-build map --source-only
ad-build verify "$AD_BUILD_MODULE"
```

### 12.3 产物命名建议

```text
ad-build-compiled-state-<branch>-<commit>.tar
ad-build-compiled-state-<branch>-<commit>.manifest.json
ad-build-compiled-state-<branch>-<commit>.restore.json
```

例如：

```text
ad-build-compiled-state-release-AD7.0.29R2-abcdef123456.tar
```

## 13. 与现有 map/verify/report 的关系

Bundle 解决的是：

```text
恢复到一个已全量编译成功后的工作区状态。
```

`map/verify/report` 解决的是：

```text
开发者在该状态基础上修改源码后，应该局部验证哪些模块，执行什么命令，结果如何，产物在哪里。
```

推荐顺序：

```bash
ad-build bundle restore --bundle xxx.tar
ad-build diff --source-only
ad-build map --source-only
ad-build verify <module>
ad-build report <run-id>
```

## 14. GLM5.0 使用规则

内网 GLM5.0 必须遵守以下规则：

1. 不能直接基于普通 `git status` 判断开发者真实改动。
2. 恢复 bundle 后，必须使用 `ad-build diff --source-only`。
3. 如果 `inventory/current.json` 不存在，不能声称已过滤编译副作用。
4. 如果 `bundle restore` 的 commit 校验失败，不能继续给出局部编译安全结论。
5. 如果 `map` 输出存在 unmapped 文件，必须提示人工确认或扩大验证范围。
6. 如果修改涉及 Makefile、compile.sh、公共头文件、libs、sinfor、linux、打包脚本，应保持高风险判断。
7. 局部 verify 成功只能说明选定模块局部编译通过，不能说明全量编译通过。
8. 编译日志和 CLI JSON 输出优先级高于 AI 推测。

## 15. 配置文件设计

默认配置文件：

```text
tools/ad-build-bundle.yaml
```

也支持环境变量指定：

```bash
export AD_BUILD_BUNDLE_CONFIG=/etc/ad-build/ad-build-bundle.yaml
```

示例：

```yaml
default_profile: full

profiles:
  full:
    include_tracked_dirty: true
    include_untracked: true
    include_dirs:
      - apps
      - libs
      - linux
      - access_layer
      - include
      - sinfor
      - app_bin
      - obj
      - shell
      - ui
      - cfg
      - mkpacket
      - ssipacket
      - ad_packet
    exclude_dirs:
      - .git
      - .ad-build/bundle
      - node_modules

  dev:
    include_tracked_dirty: true
    include_untracked: false
    include_untracked_dirs:
      - apps
      - libs
      - linux
      - access_layer
      - include
      - sinfor
      - app_bin
      - obj
      - shell
      - ui
      - cfg
    exclude_dirs:
      - .git
      - .ad-build/bundle
      - mkpacket
      - ssipacket
      - ad_packet
      - node_modules
```

第一阶段可以允许没有配置文件，使用内置默认值。

## 16. 安全与可靠性设计

### 16.1 路径安全

Bundle 内所有路径必须是仓库相对路径。

禁止：

```text
/path/to/file
../file
../../file
```

恢复时必须校验路径不能逃逸仓库根目录。

### 16.2 校验

打包时记录每个文件的 sha256。

恢复后重新计算 sha256。

如果校验失败：

```text
restore status = failed
不得写入 successful inventory
不得继续 source-only diff
```

### 16.3 原子性

恢复时先解包到 staging 目录，再逐步覆盖。

恢复日志写入：

```text
.ad-build/bundle/restore/<run-id>/restore.log
.ad-build/bundle/restore/<run-id>/restore-summary.json
```

### 16.4 commit 校验

默认要求 restore commit 等于 pack commit。

跨 commit 恢复必须显式：

```bash
--allow-commit-mismatch
```

并且输出 warning。

### 16.5 bundle 自身排除

打包时必须排除当前正在生成的 bundle 文件，避免自包含。

## 17. 命令规格草案

### 17.1 bundle pack

```bash
ad-build bundle pack [--profile full|dev] [--out <file>] [--config <file>]
```

输出：

```text
.ad-build/bundle/latest/manifest.json
.ad-build/bundle/latest/inventory.json
.ad-build/bundle/latest/pack-summary.json
<out>.tar
<out>.manifest.json
```

### 17.2 bundle inspect

```bash
ad-build bundle inspect --bundle <file>
```

输出：

```text
bundle profile
pack commit
file count
total size
top directories
modified/untracked/deleted counts
warnings
```

### 17.3 bundle restore

```bash
ad-build bundle restore --bundle <file> [--allow-commit-mismatch]
```

输出：

```text
.ad-build/inventory/current.json
.ad-build/bundle/restore/<run-id>/restore-summary.json
.ad-build/bundle/restore/<run-id>/restore.log
```

### 17.4 diff --source-only

```bash
ad-build diff --source-only
```

输出：

```text
.ad-build/diff-source-only.json
.ad-build/diff-source-only.txt
```

## 18. 验收标准

第一阶段最小验收标准：

1. 在全量编译成功的 `/root/AD` 中执行：

   ```bash
   ad-build bundle pack --profile full --out ad-build-compiled-state.tar
   ```

   能生成 bundle、manifest、pack summary。

2. Manifest 中能看到：

   ```text
   modified 文件数量
   untracked 文件数量
   top-level 目录分布
   commit
   profile
   bundle sha256
   ```

3. 在同 commit 的新工作区中执行：

   ```bash
   ad-build bundle restore --bundle ad-build-compiled-state.tar
   ```

   能恢复文件并写入 inventory。

4. 恢复后执行：

   ```bash
   ad-build diff --source-only
   ```

   在没有开发者额外修改时，source-only diff 应为空或只包含明确未被 inventory 覆盖的文件。

5. 开发者修改一个文件：

   ```text
   apps/foo/foo.c
   ```

   再执行：

   ```bash
   ad-build diff --source-only
   ```

   应只显示 `apps/foo/foo.c`，不显示恢复出的 8000+ 编译副作用。

6. 如果开发者修改了一个恢复出的 modified 文件，例如：

   ```text
   shell/Makefile
   ```

   `diff --source-only` 必须把它识别为开发者恢复后修改。

7. GLM5.0 根据 `diff-source-only.json`、`module-map-result.json`、`verify-summary.json` 和日志给出局部验证建议。

## 19. 后续演进

### 19.1 Docker image 模式

当确认 registry 权限后，可以在 bundle 基础上增加：

```bash
ad-build image build --from-bundle ad-build-compiled-state.tar --image registry.me/ad_codescan/ad-build-compiled-state:<tag>
ad-build image push
ad-build image pull
ad-build image restore
```

该能力用于替代或补充流水线 artifacts。

### 19.2 公共基础镜像

当 full bundle 跑通后，再拆分公共基础层：

```text
libs/
sinfor/
include/
linux/
app_bin/
```

公共基础镜像用于减少 bundle 体积和重复恢复成本。

### 19.3 Makefile 自动感知

在现有 module-map 基础上进一步增强：

```text
根据 Makefile 自动发现 target、cwd、产物路径。
```

但第一阶段仍以确定性配置和真实日志为准。

## 20. 当前无需再确认的默认决策

当前按以下默认决策开发：

```text
默认 profile: full
默认不依赖共享目录
默认不依赖 registry
默认使用当前 git root，不写死 /root/AD
默认所有 tracked modified 文件都保存
默认恢复后使用 inventory 过滤编译副作用
默认给通用流水线 shell 模板，不绑定 GitLab CI
默认面向 GLM5.0 提供 handoff 文档
```

后续只需要补充：

```text
打包平台上传和下载流水线产物的具体命令
```

该信息不影响 CLI 架构，只影响流水线模板落地细节。
