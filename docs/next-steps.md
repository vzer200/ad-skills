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
- [x] `restore` 在校验大包 sha256 和解压前，先比对当前 AD 源码分支和 commit；不一致时快速退出并输出 GitLab compare 链接，只有显式 `--force` 才继续恢复。
- [x] `restore` 集成手工验证过的关键流程：拉取产物、校验 sha256、恢复 inventory、修正旧 `/root/AD` 路径、修复 managed symlink、用 `PREFIX_SOURCE=<当前 AD 根>` 重建 appd DPDK/RDMA 缓存、运行 readiness 检查。
- [x] 如果 `doctor` 或 `verify appd` 后续仍提示 DPDK/RDMA 缓存问题，再显式执行 `ad-build repair dpdk` 重试同一固定修复步骤。
- [x] `restore --force` 允许在 inventory 声明范围内把已有普通文件或旧 symlink 替换为目标 symlink；目录仍然不会被删除。
- [x] `doctor` 默认不再因为大量非关键 dangling symlink 直接阻断 MVP；严格检查改为 `ad-build doctor --strict`。
- [x] 成功 `restore` 不再把同一次运行里的 `use-summary missing` 旧告警写进最终状态。
- [x] `pack` / `restore` 的临时 staging 目录在成功和失败时都会清理。
- [x] `completion install` 不再作为用户命令暴露，补全由包安装流程尽力自动处理。

## 下一步计划

- [ ] 增强 `pack` 全量扫描阶段的进度显示。当前 `pack` 在 `collectPackEntries()` 递归扫描期间只输出“开始扫描”和“扫描完成”，真实 AD 仓库较大时用户会误以为卡住。优先实现低风险版本：每扫描固定数量的文件/目录输出一次 `已扫描 N 个路径，已选中 M 个产物文件`；如果后续仍需要百分比，再增加一次轻量预统计得到总数后输出 `N/TOTAL` 和百分比。进度继续写 stderr，避免破坏 `--json` stdout。

## 仍需真实设备验证

本轮只确认 `appd` 路径。后续不能直接宣称“所有模块可用”，必须按模块逐步验证。

建议验证顺序：

1. 在全量编译完成设备执行 `ad-build pack --branch <AD分支>`。
2. 执行 `ad-build publish --branch <AD分支>`，确认产物仓库同名分支只有一个最新快照。
3. 在干净设备执行 `ad-build login`，确认 SSH 已通过。
4. 确认干净设备 AD 源码分支和 commit 与发布 manifest 一致；如果不一致，先查看 `restore` 输出的 GitLab compare 链接，不要默认恢复。
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
