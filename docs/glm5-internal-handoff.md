# GLM5 内网接入说明：ad-build compiled-state bundle

本文给内网 AI/流水线维护者使用。不要凭经验猜测编译状态，必须读取 `ad-build` 生成的 JSON、manifest、inventory、verify 日志。

## 一次性前提

- 当前 AD 编译容器已经从 clean commit 完成一次全量编译。
- Node 可用。
- 打包平台可以保存较大的流水线产物。
- 第一阶段不要求共享目录，也不要求 Docker registry。

## 生成编译状态包

在已全量编译成功的容器里执行：

```bash
cd /root/AD
ad-build bundle pack --profile full --out ad-build-compiled-state.tar
```

如果仓库不在 `/root/AD`，先进入实际仓库根目录，或使用：

```bash
ad-build bundle pack --workdir <repo-root> --profile full --out ad-build-compiled-state.tar
```

打包平台需要保存：

```text
ad-build-compiled-state.tar
.ad-build/bundle/latest/manifest.json
.ad-build/bundle/latest/inventory.json   # 打包时 inventory，仅用于产物记录
.ad-build/bundle/latest/pack-summary.json
```

## 恢复编译状态

在后续流水线或开发环境中：

```bash
cd <repo-root>
git checkout <bundle 对应的 commit>
ad-build bundle restore --bundle ad-build-compiled-state.tar
ad-build inventory status
ad-build diff --source-only
ad-build map --source-only
```

恢复后用于过滤编译副作用的 canonical inventory 是：

```text
.ad-build/inventory/current.json
```

恢复后 `git status` 变脏是正常现象。不能直接把普通 `git status` 里的文件当成开发者改动。必须使用：

```bash
ad-build diff --source-only
```

判断真实改动。

## 局部编译验证

读取 `.ad-build/module-map-result.json` 后选择模块：

```bash
ad-build verify <module>
ad-build report <run-id>
```

如果 `source-only` diff 为空，说明当前工作区只包含恢复出的全量编译副作用，没有新增开发者改动。

## profile 选择

默认验收使用：

```bash
--profile full
```

`full` 尽量还原全量编译后的完整工作区，包括 `mkpacket/`、`ssipacket/`、`ad_packet/` 等打包目录。

后续优化可使用：

```bash
--profile dev
```

`dev` 保存所有 tracked modified 文件，但只保存开发局部编译常用 generated 目录，例如 `apps/`、`libs/`、`linux/`、`access_layer/`、`include/`、`sinfor/`、`app_bin/`、`obj/`。

## AI 安全规则

- 不能把 bundle restore 当成当前代码全量编译通过的证明。
- 只能说“已恢复某个 clean commit 全量编译后的状态”。
- 真实开发改动必须来自 `.ad-build/diff-source-only.json`。
- 局部编译结论必须来自 `.ad-build/runs/<run-id>/verify-summary.json` 和日志。
- 如果 bundle commit 与当前 commit 不一致，必须提示风险并要求重新确认。
