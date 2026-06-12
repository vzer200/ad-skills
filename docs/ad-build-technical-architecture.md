# ad-build 编译状态复用与局部验证技术架构

版本：v0.1

## 1. 目标

第一阶段不再优先做公共基础镜像，而是先实现 compiled-state bundle（完整编译状态包）：

```text
已全量编译成功的 Docker 容器
  -> ad-build bundle pack
  -> 打包平台保存 bundle 产物
  -> 后续流水线 ad-build bundle restore
  -> ad-build diff --source-only 过滤编译副作用
  -> ad-build map --source-only / verify / report 做局部验证
```

这条链路满足内网隔离场景，不强依赖共享目录，也不强依赖 Docker registry。

## 2. 为什么第一阶段用 bundle

当前已经存在刚刚完成全量编译的 Docker 容器。全量编译后工作区会出现大量 tracked modified 文件和 untracked 编译产物。第一阶段最稳的做法不是猜哪些目录属于公共基础层，而是把全量编译后形成的状态记录下来。

`bundle pack` 保存：

- 所有 tracked modified 文件的当前内容、权限、大小和 sha256。
- profile 允许范围内的 untracked / generated 文件。
- 删除文件清单。
- git commit、分支、容器/基础镜像相关运行时信息。
- manifest 和 inventory。

`bundle restore` 恢复：

- tracked modified 文件内容。
- untracked/generated 编译产物。
- 删除文件状态。
- `.ad-build/bundle/latest/inventory.json`，供后续 source-only diff 过滤。

## 3. profile 定义

### full

验收阶段默认使用 `full`。它尽量还原全量编译后的完整工作区状态。

包含：

- 所有 tracked modified 文件。
- 所有 untracked 文件。
- `apps/`, `libs/`, `linux/`, `access_layer/`, `include/`, `sinfor/`, `app_bin/`, `obj/`。
- `mkpacket/`, `ssipacket/`, `ad_packet/`。

### dev

后续优化时使用。它保存所有 tracked modified 文件，但只保存开发局部编译需要的 generated 目录。

包含：

- 所有 tracked modified 文件。
- `apps/`, `libs/`, `linux/`, `access_layer/`, `include/`, `sinfor/`, `app_bin/`, `obj/` 下的 generated/untracked 内容。

不默认包含：

- `mkpacket/`, `ssipacket/`, `ad_packet/` 的大打包工作目录。

## 4. modified 文件处理规则

modified 文件不是问题，也不需要 AI 判断是否保存。工具直接保存文件当前内容，并在 manifest 中记录：

```json
{
  "path": "shell/Makefile",
  "git_status": "modified",
  "sha256": "...",
  "mode": "0755",
  "size": 12345
}
```

恢复时覆盖回工作区。恢复后普通 `git status` 变脏是正常现象。

## 5. inventory 与 source-only diff

`bundle restore` 后，AI 不能直接使用普通 `git status` 判断开发者改动。必须运行：

```bash
ad-build diff --source-only
```

判断规则：

- 文件在 inventory 中，且当前 sha256 与 inventory 相同：过滤为编译恢复物。
- 文件在 inventory 中，但当前 sha256 不同：视为恢复后开发者又修改过。
- 文件不在 inventory 中，但出现在 git diff/untracked：视为开发者真实改动。
- `.ad-build/` 内部文件始终不作为开发者源代码改动。

输出：

```text
.ad-build/source-diff.json
.ad-build/source-diff-files.txt
.ad-build/source-diff.md
```

## 6. 局部验证链路

恢复 bundle 后推荐执行：

```bash
ad-build inventory status
ad-build diff --source-only
ad-build map --source-only
ad-build verify <module>
ad-build report <run-id>
```

`map --source-only` 基于 `.ad-build/source-diff.json` 做模块映射，避免被编译副作用文件干扰。

## 7. 通用流水线模板

打包阶段：

```bash
cd /root/AD
ad-build bundle pack --profile full --out ad-build-compiled-state.tar
# 由打包平台保存 ad-build-compiled-state.tar 和 .ad-build/bundle/latest/*.json
```

恢复验证阶段：

```bash
cd <repo-root>
git checkout <bundle 对应 commit>
# 由打包平台下载 ad-build-compiled-state.tar
ad-build bundle restore --bundle ad-build-compiled-state.tar
ad-build diff --source-only
ad-build map --source-only
ad-build verify <module>
```

## 8. CLI 与 skill 分工

- CLI 负责确定性采集、打包、恢复、过滤和执行。
- skill 负责约束内网 AI 如何解释 CLI 输出。
- AI 不能猜测普通 git status 中的文件是否为开发者改动，必须读取 source-only diff。
- AI 不能把 bundle restore 当成当前修改全量编译通过的证明。

## 9. 后续演进

bundle 跑通后，再拆第二阶段能力：公共基础镜像。

公共基础镜像用于更小粒度地复用 `libs/`, `sinfor/`, `include/`, `linux/`, `app_bin/` 等低频公共层。它不替代 bundle 的第一阶段验收目标。