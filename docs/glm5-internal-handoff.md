# GLM5 内网接入说明

第一阶段使用 compiled-state bundle，不依赖共享目录和 Docker registry。

生成阶段：在已经全量编译成功的 AD 容器里进入仓库根目录，执行 ad-build bundle pack，profile 建议使用 full，输出文件建议命名为 ad-build-compiled-state.tar。打包平台保存该 tar 文件，同时保存 .ad-build/bundle/latest/manifest.json 和 inventory.json。

恢复阶段：在后续流水线或开发环境中，先切到 bundle 对应的 commit，然后执行 ad-build bundle restore。恢复后 git status 变脏是正常现象，必须执行 ad-build diff --source-only，再执行 ad-build map --source-only。

AI 规则：不能把 bundle restore 当成当前修改已全量编译通过的证明；只能说明恢复了某个 clean commit 全量编译后的状态。开发者真实改动必须来自 source-only diff。局部编译结论必须来自 verify-summary 和日志。