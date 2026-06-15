# ad-build Overlay MVP 验收与后续计划

## 当前结论

本轮修复目标是把下午手工跑通的“全量编译产物 overlay 恢复方案”固化进 CLI，避免内网 AI 和开发人员继续手工执行 `tar`、`sed`、`ln`、`make`、`export PREFIX_SOURCE` 等易错步骤。

当前稳定命令只保留这一组：

```bash
ad-build login
ad-build pack --branch <AD分支>
ad-build publish --branch <AD分支>
ad-build restore --branch <AD分支>
ad-build status
ad-build doctor
ad-build repair paths
ad-build repair dpdk
ad-build verify appd
```

`ad-build overlay ...` 仍作为兼容别名保留，但文档、Skill 和后续 AI 流程必须使用上面的顶层命令。

## 已完成修复

- [x] `pack`、`publish`、`restore` 必须显式指定 `--branch`，默认不允许裸命令恢复未知分支产物。
- [x] `pack` 会校验当前 AD 工作区分支与 `--branch` 一致；诊断场景可显式加 `--allow-branch-mismatch`。
- [x] `publish` 发布到产物仓库同名分支，例如 AD 分支 `release-AD7.0.29R2` 对应产物仓库分支 `release-AD7.0.29R2`。
- [x] `publish` 会把 AD 源码分支、commit 和 Git remote URL 写入发布 manifest，用于消费端恢复前校验。
- [x] `publish` 现在把产物分支整理成单个最新快照提交，避免干净设备拉取旧 overlay 历史导致 3G 变多次传输。
- [x] `login` 默认使用 SSH，不再依赖 HTTPS token；内部 Git 操作强制使用记录的私钥和 `BatchMode=yes`，不应再弹密码。
- [x] `login` 已通过时只输出简短状态；未通过时只在首次或换 key 时打印需要添加到 GitLab 的完整公钥。
- [x] 所有 overlay 状态、缓存、认证、默认输出目录都放到 `$HOME/.ad-build/`，不再写入 AD 仓库目录。
- [x] 长时间命令增加基础进度输出，`--json` 时进度写到 stderr，stdout 保持可解析 JSON。
- [x] `restore` 在校验大包 sha256 和解压前，先比对当前 AD 源码分支和 commit；不一致时快速退出并输出 overlay/current 两边 `branch` + `commit`，不再依赖 GitLab compare 链接，只有显式 `--force` 才继续恢复。
- [x] `restore` 集成手工验证过的关键流程：拉取产物、校验 sha256、恢复 inventory、修正旧 `/root/AD` 路径、修复 managed symlink、用 `PREFIX_SOURCE=<当前 AD 根>` 重建 appd DPDK/RDMA 缓存、运行 readiness 检查。
- [x] 如果 `doctor` 或 `verify appd` 后续仍提示 DPDK/RDMA 缓存问题，再显式执行 `ad-build repair dpdk` 重试同一固定修复步骤。
- [x] `restore --force` 表示用户要求强制恢复到 overlay 基线环境；CLI 只清理声明过的可重建编译产物、缓存和软链接，不删除源码、`.git`、排除目录或未知路径。
- [x] `doctor` 默认不再因为大量非关键 dangling symlink 直接阻断 MVP；严格检查改为 `ad-build doctor --strict`。
- [x] 成功 `restore` 不再把同一次运行里的 `use-summary missing` 旧告警写进最终状态。
- [x] `pack` / `restore` 的临时 staging 目录在成功和失败时都会清理。
- [x] `completion install` 不再作为用户命令暴露，补全由包安装流程尽力自动处理。

## 下一步计划

- [x] **P0：`pack` 补齐手工 3.1G overlay 包中的 rdma-core 软链目标采集。** 当前 CLI 会把 `libs/rdma-core-2404mlnx51/build/include/...` 下的软链本身写入 inventory，但可能漏掉软链指向的仓库内部目标文件，例如 `libs/rdma-core-2404mlnx51/providers/mlx5/mlx5dv.h`。已修复：`pack` 按手工成功包的规则补齐 rdma-core 头文件/内部 symlink target，并在 `validatePackReadiness()` 中检查关键 symlink 的内部目标也已经进入 inventory，避免用户下载和解压大包后才发现不可用。
- [x] **P0：`pack` 正确处理 `source_root_at_pack_time` 下带 `..` 的内部绝对 symlink。** 已修复：`pack` 会先对 `/root/AD/.../../...` 这类目标做 POSIX 归一化；归一化后仍在 `source_root_at_pack_time` 下的 rdma-core 构建产物链接按 AD 内部 symlink 采集，不再误报为外部 symlink。归一化后越过 AD 根目录的目标仍然按违规外部 symlink 阻断。
- [x] **P0：`restore` 删除 GitLab compare 链接依赖。** 源码分支或 commit 不一致时，不再把 GitLab compare URL 作为主要判断依据；错误信息直接输出两组可人工核对的信息：overlay 打包来源的 `branch`/`commit`，以及当前 AD 工作区的 `branch`/`commit`。如果用户确认风险可接受，再显式执行 `ad-build restore --branch <AD分支> --force`。
- [x] **P0：`restore` 本地 AD Git 前置校验提前。** 在任何 artifact repo fetch、checkout、sha256 校验或大包下载之前，先确认当前目录是可验证的 AD Git 工作区，并能读取当前 `branch`、`commit` 和 remote。当前目录不是 AD Git 工作区、Git 状态不可读或缺少必要源码信息时，立即失败并提示切换到正确 AD 根目录，避免拉取很久后才发现目录不对。
- [x] **P0：`restore` 先轻量校验 source metadata，再决定是否拉取大包。** `restore` 先获取轻量的 latest/manifest/source metadata，用它和当前 AD `branch`/`commit` 做风险判断；如果源码不一致，会在完整 checkout overlay 产物包之前停止并提示用户是否接受 `--force` 风险。只有本地 AD Git 校验通过且 source metadata 校验通过，或用户显式 `--force`，才继续后续大包获取、校验和恢复。
- [x] **P0：`restore` 轻量 manifest fetch 兼容旧 cache/Git。** 已修复：CLI 创建或复用 `$HOME/.ad-build/cache/artifact-overlay-repo/` 时会补齐 partial clone 配置；如果当前 Git 仍不支持或不认识 `--filter=blob:none`，或 cache 配置不兼容，`restore` 会自动 fallback 到普通 `depth=1` fetch 并提示可能下载更多对象；如果 Git 服务端忽略 filter 但返回成功，也会提示本次 metadata fetch 可能已下载更多对象。不再要求用户手工删除 cache 后重试。
- [x] **P0：`pack` 补齐 appd 根目录构建入口文件。** 已修复：`KERNEL_VER`、`OS_PLATFORM.file`、`compile.sh`、`version_change.sh`、`php_encode_x86_64`、根目录 `Makefile*`、根目录 `app*.mk` 作为明确的 top-level build entry 收集；`KERNEL_VER` 和 `OS_PLATFORM.file` 同时进入 appd readiness 检查，避免发布端存在但干净机 `verify appd` 反复报 `cat: .../KERNEL_VER: No such file or directory`。
- [x] **P0：`restore` 重建白名单 external dependency 入口软链。** 已修复：`include/lua -> /usr/local/include/luajit-2.1/` 仍不进入 inventory 和 tar payload，但 manifest 会记录 `restore_link: true`；`restore` 在确认外部目标存在后重建 AD 工作区入口软链，`doctor` 同时检查外部目标和入口软链，避免 `verify appd` 报 `fatal error: lua/lua.h: No such file or directory`。
- [x] **P1：`restore --force` 文案基于两边 commit 信息确认。** `--force` 前后的提示文案围绕已经展示出的 overlay/current `branch` + `commit`，让用户确认自己接受的是具体源码差异风险，而不是一个抽象的“继续恢复”。
- [x] **P1：`restore` 结束时输出本次命令总耗时。** `restore` 完成所有任务后，在最终文本输出里增加类似 `总耗时: 8m32s` 的汇总；`--json` 输出同步增加机器可读的 `duration_ms` 字段。
- [x] **P0：`restore --force` 强制恢复 overlay 基线环境。** 已修复：`--force` 会先输出 `--force 已启用，将强制恢复到 overlay 基线环境`，再按白名单清理 `obj/`、`app_bin/`、DPDK build/tmp_install、RDMA build/include 等可重建范围，并写入 `$HOME/.ad-build/overlay/force-plan.json` 与 `force-summary.json`；源码文件、`.git`、`mkpacket/`、`ssipacket/`、`ad_packet/` 和未知路径不处理。
- [x] **P1：`restore` 输出分阶段耗时。** 已修复：文本输出新增 `阶段耗时: metadata=... artifact-fetch=... sha256=... extract=... inventory-restore=... dpdk-repair=... doctor=...`；`use-summary.json` 同步写入 `stage_timings`，用于定位接收端耗时瓶颈。
- [x] **P1：`verify appd` 成功时隐藏非致命错误匹配。** 已修复：当 `make` 退出码为 0 且 summary `status=passed` 时，不再把日志中的 `No such file` / `cannot stat` 等匹配显示为“首个有效错误”；该信息只作为 `nonfatal_log_error_match` 和 warning 保留在 JSON，避免误导排障。
- [x] **P1：补测试覆盖前置失败路径。** 已增加测试覆盖：非 AD Git 工作区执行 `restore` 时不会触发 artifact repo fetch；源码 branch/commit 不一致时不会先校验大包；source metadata 缺失或当前 Git 不可验证时保持快速失败；错误信息包含 overlay/current 两边 `branch`/`commit`，不依赖 GitLab compare。
- [x] 增强 `pack` 全量扫描阶段的进度显示。当前实现为简单低风险版本：每扫描固定数量的文件/目录输出一次 `已扫描 N 个路径，已选中 M 个产物文件`。进度继续写 stderr，避免破坏 `--json` stdout。
- [x] **P0：`pack` 外部 symlink 不再遇到第一个就失败。** 当前实现会扫描完整 pack scope，一次性汇总所有未知外部 symlink，并在错误中输出 `path`、`link_target`、`resolved_path`；错误信息同时说明 `mkpacket/`、`ssipacket/`、`ad_packet/` 等排除目录不参与 overlay 扫描/判定。
- [x] **P0：对当前 6 个外部 symlink 建立 appd MVP 分类策略。** `include/lua -> /usr/local/include/luajit-2.1/` 作为 `external_dependencies` 记录；`shell/etc/apache2/httpd.conf`、`shell/etc/squid/squid.conf`、`test/.../mock_S04NicFactory` 按部署/测试环境链接跳过；`shell/arch/aarch64/...` 按 aarch64 shell 包路径跳过，不纳入 appd x86 MVP overlay。
- [x] **P1：`restore` / `doctor` 检查 manifest external dependency。** 白名单外部依赖不写入 inventory；`doctor` 会检查 `manifest.external_dependencies[].check_path` 是否存在，缺失时把 overlay 状态判为 `not_ready` 并给出明确依赖路径。带 `restore_link: true` 的依赖会在 restore 阶段重建工作区入口软链，并由 doctor 额外检查入口是否存在且匹配。

## 仍需真实设备验证

本轮只确认 `appd` 路径。后续不能直接宣称“所有模块可用”，必须按模块逐步验证。

建议验证顺序：

1. 在全量编译完成设备执行 `ad-build pack --branch <AD分支>`。
2. 执行 `ad-build publish --branch <AD分支>`，确认产物仓库同名分支只有一个最新快照。
3. 在干净设备执行 `ad-build login`，确认 SSH 已通过。
4. 确认干净设备 AD 源码分支和 commit 与发布 manifest 一致；如果不一致，先核对 `restore` 输出的 overlay/current 两边 `branch` + `commit`，不要默认恢复。
5. 执行 `ad-build restore --branch <AD分支>`，确认状态为 ready。
6. 先执行 `ad-build verify appd`。
7. 再由人工或内网 AI 扩展到其他模块，记录缺失路径、旧根路径、symlink、第三方库缓存等问题。

## 性能关注点

这个工具的核心价值是减少干净设备恢复全量编译环境的时间，不能让拉取产物接近一次全量编译成本。

当前策略：

- 产物仓库按 AD 分支保存 overlay。
- 每个产物分支只保留一个最新快照提交。
- 发布端不拉取旧产物分支内容，直接生成本地最新快照后 force push，避免全量编译设备因为旧 3G 包历史再次下载大对象。
- 客户端只拉指定分支，不拉所有 release 历史。
- overlay 压缩包仍是主要传输对象；如果 GitLab 对 3G 单文件仍不稳定，需要评估分片上传或对象存储，而不是恢复旧的多历史 Git 大包方案。

如果后续 `restore --branch <AD分支>` 仍稳定需要 7 到 8 分钟以上，需要优先测量：

- Git 拉取耗时
- 解压耗时
- inventory 恢复耗时
- 路径修正耗时
- DPDK/RDMA repair 耗时
- doctor/readiness 耗时

优化必须基于分段耗时，不能牺牲校验、冲突保护或 readiness 检查。

## 后续功能边界

- 多模块支持必须以真实模块验证为准，不能只靠 `appd` 推断。
- `doctor --strict` 可以继续增强 symlink 分类报告，但默认 restore 只阻断关键 readiness 路径。
- 如果 GitLab 服务器长期保留不可达旧 blob，需要服务端 GC 或改用非 Git 大对象存储；CLI 已经避免新发布继续引用旧历史。
- 旧 `public-base`、`bundle`、`image`、`baseline`、`diff`、`map`、`report`、`completion` 用户命令不应重新进入主路径。
