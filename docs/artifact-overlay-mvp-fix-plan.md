# artifact overlay MVP 修复方案

## 当前结论

本次手测已经证明：在干净源码设备上恢复全量编译设备产出的 artifact overlay 后，`appd` 可以编译通过。

已验证事实：

- 全量编译设备 AD 路径：`/root/AD`
- 干净源码设备 AD 路径：`/root/workspace/AD`
- 手工 overlay 包：`/root/ad-artifact-overlay-v2.tar.gz`
- overlay 包大小：约 `3.1G`
- 干净设备解压耗时：约 `3m`
- `appd` 最终编译结果：`exit=0`

这个结果说明方向成立：干净设备已有 AD 源码时，不一定要重新全量编译；只要恢复足够完整、可重定位、可验证的编译产物，就能支撑至少 `appd` 这类模块的本地编译验证。

但当前结论只覆盖 `appd`。其他模块是否也能通过，还不能下结论。下一轮必须用新版流程继续覆盖更多模块。

## 方案定位

当前方案应明确为：

```text
全量编译产物 overlay 方案
```

它不是：

- Docker 镜像方案
- 把 AD 源码打包进仓库的方案
- 旧版只恢复少量公共目录的 `public-base` 方案
- 针对 `appd` 的专用裁剪包

干净设备已经有 AD 源码，因此 overlay 只应该恢复“全量编译后产生或改变的构建产物/构建元数据”，不能把源码目录整体打包并覆盖。

## 手工成功流程必须固化进 CLI

下午手工测试已经跑通，下一版工作的关键不是重新设计一套新流程，而是把这套成功路径完整、确定地融入 CLI。

手工成功路径可以抽象成：

```text
全量编译设备
  1. 从 /root/AD 识别全量编译后的产物
  2. 排除 mkpacket / ssipacket / ad_packet / .git / .ad-build/cache
  3. 生成 ad-artifact-overlay-v2.tar.gz
  4. 记录 sha256、source branch、source commit、source root

干净源码设备
  5. 拿到 overlay 包
  6. 校验 sha256
  7. 按 manifest/inventory entries 恢复到 /root/workspace/AD，并执行冲突保护
  8. 把产物中的 /root/AD 重定位为 /root/workspace/AD
  9. 修复 RDMA build/include 下的绝对路径软链接
  10. 清理并重配 DPDK build/tmp_install
  11. 使用 PREFIX_SOURCE=/root/workspace/AD 编译 appd
  12. 检查最终 exit=0
```

CLI 的核心职责就是把这些人工步骤变成固定命令，而不是让用户或 AI 继续手工执行 `tar`、`sed`、`ln -s`、`export PREFIX_SOURCE`、`rm -rf dpdk build`。

映射关系：

```text
手工识别并打包产物
  -> ad-build overlay pack

手工上传/记录 sha256
  -> ad-build overlay publish

手工下载/校验/解压
  -> ad-build overlay use

手工替换 /root/AD 路径
  -> overlay use 内置 relocation
  -> ad-build overlay repair paths 作为诊断修复入口

手工修 RDMA symlink
  -> overlay use 内置 symlink relocation
  -> ad-build overlay repair paths 作为诊断修复入口

手工清理并重配 DPDK
  -> ad-build overlay repair dpdk

手工 PREFIX_SOURCE=/root/workspace/AD make
  -> ad-build overlay build appd

手工 grep/tail 日志判断真实错误
  -> overlay build 自动收集日志并输出 first_real_error
```

因此本次修复文档的落点是：

```text
把已验证成功的手工 appd overlay 流程产品化到 CLI + Skill。
```

不是继续扩大旧 `public-base`，也不是让 AI 继续根据经验手工拼命令。

## 本次暴露的问题

### 1. public-base 思路过窄

最初 `public-base` 只打包较小的公共依赖层，例如：

- `obj/lib64`
- `obj/bin`
- `include`
- `app_bin`
- `libs/rdma-core-2404mlnx51/build/include`

实际测试发现这不够。`appd` 不只是依赖头文件和公共库，还依赖：

- DPDK 构建输出
- RDMA 构建输出
- 局部构建缓存
- 生成配置
- pkgconfig 文件
- CMake/meson/ninja 元数据
- Makefile 变量传递
- 绝对路径软链接

结论：当前问题更接近“恢复全量编译后的可编译状态”，不是“恢复最小公共依赖包”。

### 2. 打包范围一开始包含了无用大目录

第一版 overlay 接近 `19G`，因为包含了：

- `mkpacket`
- `ssipacket`
- `ad_packet`
- `.ad-build/cache`

这些目录对本地模块编译不是核心输入，且体积很大。打包、上传、下载、Git 拉取都会被它们拖垮。

后续 v2 排除这些目录后，包大小降到约 `3.1G`。

结论：overlay 必须有明确 pack policy，不能简单收集“所有 git dirty + 所有疑似产物”。

### 3. HTTP Git 拉取 3G overlay 失败，SSH Git 作为 MVP 主路径

把 `3.1G` 的 `tar.gz` 提交到 GitLab 后，干净设备通过 HTTPS remote 执行 `git pull` 出现：

```text
RPC failed; curl 18 transfer closed with outstanding read data remaining
fatal: early EOF
fatal: unpack-objects failed
```

这次失败发生在 HTTPS/HTTP Git 链路上。结合你们已有经验：SSH 拉取几十 G 仓库可以成功，因此 MVP 阶段不再把“GitLab 承载 overlay 包”判定为不可行，而是调整为：

```text
overlay 实体包上传到独立 GitLab 仓库
CLI 默认使用 SSH 拉取该 GitLab 仓库
不走 HTTPS token 拉取大包
```

需要保留的技术约束：

- overlay 包不能放进 AD 源码仓库，只能放进独立的 `ad-build-public-base` 产物仓库。这个仓库名是历史命名，不代表旧 `public-base` 方案继续作为主路径。
- `ad-build login` 默认配置 SSH 认证，不再默认配置 HTTPS token。
- `ad-build overlay use` 默认用 SSH remote 拉取产物仓库。
- 如果后续 SSH Git 对多版本大包仍然变慢，再考虑切换到 Git LFS 或制品库。

结论：本阶段接受“overlay 包上传到 GitLab，通过 SSH 拉到本地”的方式。HTTP/HTTPS 拉取失败不再作为否定 GitLab 方案的依据。

### 4. overlay 当前不是可重定位产物

全量编译设备路径是 `/root/AD`，干净设备路径是 `/root/workspace/AD`。

恢复后发现大量产物写死旧路径：

- 文本构建元数据中的 `/root/AD`
- RDMA include 目录下的绝对路径软链接
- DPDK meson build 缓存里的旧路径
- pkgconfig、CMake、meson-private、ninja 等构建元数据

只替换普通文本文件不够，因为软链接目标也可能是绝对路径。也不能全仓库无差别 `sed`，否则会修改干净设备已有源码，甚至破坏二进制产物。

结论：restore 不能只是解压，必须基于 manifest 对 overlay 产物执行受控 relocation。

### 5. restore 后缺少强制验证

本次靠人工逐步验证了：

- `libs/rdma-core-2404mlnx51/build/include` 是否存在
- `libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h` 是否可读
- `apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build` 是否存在
- `obj/lib64`、`obj/bin`、`app_bin`、`include` 是否存在
- 是否还有软链接指向 `/root/AD`
- 是否还有文本构建元数据引用 `/root/AD`
- 是否存在 dangling symlink

这些检查必须脚本化。否则 AI 或人很容易跳过关键检查，后续把环境恢复问题误判为源码问题。

### 6. `PREFIX_SOURCE` 没有稳定传递

`appd -> libs -> dpdk` 构建链路中，DPDK 依赖 `PREFIX_SOURCE` 计算 RDMA 路径。

当 `PREFIX_SOURCE` 为空时，路径会变成：

```text
/libs/rdma-core-2404mlnx51
```

正确路径应该是：

```text
/root/workspace/AD/libs/rdma-core-2404mlnx51
```

本次手工通过下面方式绕过：

```bash
PREFIX_SOURCE=/root/workspace/AD make V=1 VERBOSE=1
```

结论：CLI 不能让用户或 AI 记这个变量。新版 build 入口必须自动注入 `PREFIX_SOURCE=<AD_ROOT>`，并检查子 make/DPDK 进程是否实际继承。

### 7. DPDK build 缓存需要可控 reconfigure

本次实际出现过：

- 先是 `infiniband/mlx5dv.h: No such file or directory`
- 修复 RDMA 软链接后，变成 `redefinition` / `redeclaration`
- 清理 DPDK build 缓存并使用正确 `PREFIX_SOURCE` 重新配置后，问题消失

这说明 DPDK 的 meson/ninja build 目录可能缓存了旧路径或旧探测结果。恢复路径变化后不能盲目信任旧 build 缓存。

结论：对 DPDK 这类 meson/ninja 产物，需要固定 repair/reconfigure 策略，并记录 `PREFIX_SOURCE`、`PKG_CONFIG_PATH`、include 路径来源和日志。

### 8. 日志被子构建重定向隐藏

部分 Makefile 使用类似：

```make
cd dpdk && make -j1 >> log3party.log
```

这会导致终端只看到上层 `Error 2`，真实错误被写进子日志。AI 和人如果只看外层输出，会误判。

结论：CLI 的 build/verify 入口必须主动收集子构建日志，例如 `log3party.log`、meson log、ninja log，并在失败时输出真实错误来源文件和上下文窗口。

### 9. 当前 CLI 主流程与真实 MVP 目标错位

当前 CLI 已经有不少能力：

- `public-base key`
- `public-base check`
- `public-base pack`
- `public-base publish`
- `public-base use`
- `image status/save/pull/push/restore`
- `bundle pack`
- `bundle restore`
- `inventory status`
- `completion install`
- `diff --source-only`
- `map --source-only`
- `precheck`
- `full-build`
- `baseline-save`
- `verify`
- `skill install`
- `login`

但本次真正跑通的是手工 artifact overlay 流程。旧 `public-base` 能力对当前目标帮助有限，甚至会把用户和 AI 带回过窄的依赖包方向。

结论：下一版 CLI 应收敛到 artifact overlay 生命周期。旧 `public-base`、`image`、`bundle`、`baseline` 能力不再保留公开入口；如果短期保留实现，也只能作为隐藏兼容/诊断代码，并且误执行时提示迁移到 `overlay`。

## 多 agent 审核共识

四个 agent 从架构、传输、CLI/Skill、构建细节四个方向审核后达成以下共识：

- 从 `public-base` 转向 `artifact overlay` 是合理的。
- HTTPS/HTTP Git 拉取 3G overlay 失败，但 SSH Git 在你们环境中可以作为 MVP 主路径继续验证。
- pack 不能把 `apps/`、`libs/` 等源码目录整体打包；这些目录只能作为扫描作用域。
- restore 必须只写入 manifest 中的 artifact entries，并保护用户本地改动。
- relocation 必须限制在 overlay 产物和构建元数据上，不能全仓库无差别替换。
- symlink 必须在 pack 和 restore 两端作为一等对象处理。
- `use`、`doctor`、`repair`、`build` 的职责必须写清楚，防止 AI 调不存在或不该调的命令。
- 只验证 `appd` 不能声明所有模块可用，必须定义 `appd MVP` 和 `multi-module MVP` 两个层级。

## 下一版目标流程

### 登录与认证

`ad-build login` 默认使用 SSH 登录 GitLab，不再默认使用 HTTPS token。

默认行为：

```text
ad-build login
```

等价于配置 SSH Git 访问：

```text
1. 检查 ~/.ssh/id_ed25519 或可用 SSH key
2. 如果没有 key，引导生成 SSH key
3. 输出 public key，提示用户加到 GitLab SSH Keys
4. 执行 ssh -T git@git.sangfor.com 做连通性测试
5. 将 artifact repo remote 配置为 git@git.sangfor.com:69765/ad-build-public-base.git
6. 写入 .ad-build/overlay/auth.json，记录 auth_method=ssh
```

HTTPS token 只作为兼容/诊断模式，不作为默认主流程：

```text
ad-build login --method https-token
```

SSH 登录只负责 GitLab 仓库访问。后续如果实体包改走对象存储，再单独设计 artifact 下载凭据。

### 产物发布者

在可信全量编译设备上：

```text
ad-build overlay pack
ad-build overlay publish
```

### 普通开发者/内网 AI

在干净 AD 源码设备上：

```text
ad-build overlay use
ad-build overlay build <module>
```

### 诊断/修复入口

仅当 `use` 或 `build` 失败时使用：

```text
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
```

## 推荐传输方案

### 首选：GitLab SSH 仓库承载 overlay 包

固定 GitLab 仓库：

```text
git@git.sangfor.com:69765/ad-build-public-base.git
```

注意：`ad-build-public-base` 是历史仓库名。下一版 CLI 使用它承载 artifact overlay，不再使用旧 `public-base` 命令族作为主路径。

仓库内保存 manifest、inventory、sha256 和 overlay 实体包：

```text
release-AD7.0.29R2/
  latest-artifact-overlay.json
  artifact-overlay/
    sha256-<short>/
      manifest.json
      inventory.json
      ad-artifact-overlay.tar.gz
      ad-artifact-overlay.tar.gz.sha256
      README.md
```

CLI 内部使用 SSH Git 拉取。以下命令只描述内部等价行为，不是用户或 AI 的操作步骤：

```bash
git clone git@git.sangfor.com:69765/ad-build-public-base.git
git pull --ff-only
```

`ad-build overlay use` 不要求用户手工执行上述命令，而是内部完成：

```text
1. 确认 ad-build login 已通过 SSH
2. clone 或更新 .ad-build/cache/artifact-overlay-repo
3. 读取 latest-artifact-overlay.json
4. 定位 ad-artifact-overlay.tar.gz
5. 校验 sha256
6. 按 inventory 恢复 entries
```

这个方式的前提：

- 内网 GitLab SSH 拉取大仓库稳定。
- overlay 包放在独立产物仓库，不污染 AD 源码仓库。
- 每个 release/version 的 overlay 数量要受控，避免仓库长期无限膨胀。
- 后续如发现 SSH Git 拉取仍然慢，再切到 Git LFS 或制品库。

### 备选：Git LFS 或 HTTP/对象存储

如果后续 GitLab SSH 仓库因多版本大包变慢，可以再切换到：

- Git LFS
- GitLab Generic Package Registry
- GitLab Release asset
- 内网 HTTP/Nginx 文件服务
- MinIO/S3 对象存储
- Nexus/制品库

切换到 HTTP/对象存储时才要求：

- 服务端支持 HTTP `Range`
- 鉴权方式适合 CLI 非交互下载
- 重定向后仍可续传
- 下载失败可重试
- 下载后必须 sha256 校验

### 临时验证：rsync/scp 中转

适合临时手测，不适合正式产品主链路。

可以使用：

```bash
rsync --partial --append-verify
```

但它缺少统一 manifest 审计、版本索引、权限模型和多人发现机制。当前全量编译设备与干净设备网络不互通时，还需要中转机。

### 不再采用：HTTPS Git 拉取 overlay 大包

当前不再把 HTTPS Git 作为默认主路径。

原因：

- 下午测试中 HTTPS Git 拉 3G 包失败。
- HTTPS 链路可能受代理、网关、GitLab HTTP 配置影响。
- CLI 默认 SSH 可复用你们已有的大仓库拉取能力。

## manifest 契约

`manifest.json` 必须足够让 CLI 自动下载、校验、恢复和重定位。

必要字段：

```json
{
  "schema_version": 1,
  "kind": "ad-build-artifact-overlay",
  "release": "release-AD7.0.29R2",
  "source_branch": "release-AD7.0.29R2",
  "source_commit": "<commit>",
  "source_root_at_pack_time": "/root/AD",
  "artifact_repo_ssh": "git@git.sangfor.com:69765/ad-build-public-base.git",
  "artifact_path": "release-AD7.0.29R2/artifact-overlay/sha256-<short>/ad-artifact-overlay.tar.gz",
  "artifact_sha256": "sha256:<hex>",
  "artifact_size_bytes": 0,
  "inventory": "inventory.json",
  "inventory_sha256": "sha256:<hex>",
  "pack_rules_version": 1,
  "created_at": "2026-06-14T00:00:00Z",
  "created_by_cli_version": "0.x.y",
  "entries_count": 0
}
```

`latest-artifact-overlay.json` 只是指针文件，只指向某个不可变 manifest：

```json
{
  "schema_version": 1,
  "kind": "ad-build-artifact-overlay-latest",
  "release": "release-AD7.0.29R2",
  "manifest": "artifact-overlay/sha256-<short>/manifest.json",
  "updated_at": "2026-06-14T00:00:00Z"
}
```

避免在 latest 和 manifest 中重复维护多份大包信息，防止两者不一致。

`inventory.json` 是具体恢复清单，必须和 manifest 一起发布。CLI 恢复时不得从 tar 包内容临时推断恢复范围，必须以 inventory 为准。

`inventory.json` 至少包含：

```json
{
  "schema_version": 1,
  "kind": "ad-build-artifact-overlay-inventory",
  "entries": [
    {
      "path": "libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h",
      "type": "symlink",
      "sha256": null,
      "link_target": "/root/AD/libs/rdma-core-2404mlnx51/providers/mlx5/mlx5dv.h",
      "relocatable": true
    }
  ]
}
```

manifest 记录 `inventory_sha256`，`overlay use` 必须先校验 inventory，再按 inventory entries 恢复。

## overlay 打包规则

### 核心原则

`ad-build overlay pack` 不能打包整个 AD 源码树。

`apps/`、`libs/`、`linux/`、`access_layer/`、`ui/`、`ui_new/` 等目录只能作为候选扫描作用域，不代表整目录入包。

实际入包对象必须来自 inventory：

- 全量编译后新增的 generated artifact
- 全量编译后改变的 tracked build side effect
- 构建工具产生的 metadata
- 构建所需的 symlink
- 必需的 generated headers
- 必需的 object/archive/shared library

### 默认排除

```text
.git/
.ad-build/cache/
mkpacket/
ssipacket/
ad_packet/
```

说明：排除 `mkpacket/`、`ssipacket/`、`ad_packet/` 意味着 overlay MVP 不支持最终打包/整机制品验证。如果后续某些模块确实依赖这些目录中的少量生成配置，应通过多模块验证补回最小文件，而不是恢复整目录。

### 候选扫描作用域

```text
obj/
app_bin/
include/
cfg/
shell/
ui/
ui_new/
linux/
libs/
sinfor/
access_layer/
apps/
apps2/
gtest/
test/
KERNEL_VER
OS_PLATFORM.file
Makefile*
app*.mk
compile.sh
version_change.sh
php_encode_x86_64
```

### entry 分类

manifest/inventory 中每个 entry 必须记录类型：

```text
generated_artifact
tracked_build_side_effect
build_metadata
generated_header
symlink
tool_output
unknown_artifact
```

恢复、relocation、doctor、diff 过滤都必须基于 entry 类型做判断。

## restore 安全边界

`ad-build overlay use` 只能写入 manifest 中记录的 artifact entries。

默认冲突策略：

- 如果目标文件不存在，可以恢复。
- 如果目标文件属于上一次 overlay inventory 且内容匹配可管理状态，可以覆盖。
- 如果目标文件是 git clean 且 entry 类型是受信任的 build side effect，可以覆盖。
- 如果目标文件有本地 modified/staged 状态，拒绝覆盖。
- 如果目标路径存在 untracked 文件且不属于 overlay inventory，拒绝覆盖。
- 如果父目录存在 symlink/junction 导致路径逃逸，拒绝恢复。
- 如果 entry 路径试图逃出 AD 根目录，拒绝恢复。

`--force` 不应作为普通用户路径。即使存在 `--force`，也不能绕过 path escape、父目录 symlink、unsafe path 等安全检查。

## relocation 规则

`ad-build overlay use` 解压后必须执行 relocation，但只能处理 overlay inventory 里的对象。

### 可替换对象

允许替换旧根路径的对象类型：

- `.pc`
- `CMakeCache.txt`
- CMake 生成的 install/cache 文件
- meson-private 文本元数据
- ninja 文本元数据
- `compile_commands.json`
- 构建生成的 Makefile 片段
- shell/env 文本文件
- manifest 标记的 build metadata
- symlink target

### 禁止盲目替换

禁止无差别 `sed`：

- AD 源码文件
- ELF/二进制
- `.o`
- `.a`
- `.so`
- `.ko`
- 压缩包
- 未在 inventory 中的文件

如果二进制里存在旧路径，例如 RPATH 或 debug path，不能直接 sed，应记录为 warning，并由后续专门 repair 处理。

### symlink 硬要求

pack 阶段必须：

- 保留 symlink entry 类型
- 记录 link target
- 禁止意外 dereference

restore 阶段必须：

- 按 symlink entry 恢复软链接
- 对指向旧根路径的 symlink target 做 relocation
- 检查 dangling symlink

本次 RDMA 问题说明，symlink 不是边角问题，而是主链路必需能力。

## `overlay use` 与 `doctor` 职责

`overlay use` 是普通用户主入口，必须内置最小 doctor。

执行顺序：

1. 读取 fixed Git 仓库里的 latest pointer
2. 读取 manifest
3. 通过 SSH remote clone/pull 固定产物仓库，并按 manifest 的 `artifact_path` 定位 artifact
4. 校验 sha256
5. 解压 manifest entries
6. 执行 relocation
7. 执行 symlink relocation
8. 执行最小 doctor
9. 写 `.ad-build/overlay/current.json`
10. 写 `.ad-build/overlay/use-summary.json`

`overlay doctor` 是诊断入口，用于失败后做更完整检查，不要求普通用户每次手动运行。

准入标准以 `use-summary.json` 为准：

```text
status: ready
integrity_status: matched
restore_status: restored
relocation_status: passed
doctor_status: passed
```

## doctor 检查项

### appd MVP 必查

```text
libs/rdma-core-2404mlnx51/build/include
libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h
apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build
obj/lib64
obj/bin
app_bin
include
```

同时检查：

```text
rdma_header_readable
rdma_symlinks_relocated
dpdk_build_exists
dpdk_pkgconfig_paths_relocated
dpdk_can_resolve_rdma_headers
prefix_source_env_exists
old_source_root_text_references
old_source_root_symlink_references
dangling_symlinks
```

### multi-module MVP 扩展检查

后续模块验证后再补：

- `access_layer` 依赖的公共 `.mk`、生成头、链接脚本
- `ui/ui_new` 的 node/npm 构建缓存或生成资源
- `linux/kernel` 的 `.config`、`Module.symvers`、kernel build 目录
- `sinfor/libs` 的 pkg-config、CMake、configure 缓存
- `apps2/test/gtest` 的测试框架、运行时库路径、工具链环境

## source commit 兼容策略

默认策略必须保守。

`overlay use` 默认只允许：

- 当前分支匹配 manifest `source_branch`
- 当前 HEAD 等于 manifest `source_commit`，或当前 HEAD 是基于该 commit 的开发提交

跨 commit 使用必须显式参数，例如：

```text
--allow-source-drift
```

启用后必须输出强 warning，并禁止给出“稳定可用”结论，只能给出“允许诊断使用”。

## build 入口

用户和 AI 不应该直接运行：

```bash
PREFIX_SOURCE=/root/workspace/AD make V=1 VERBOSE=1
```

应该使用：

```bash
ad-build overlay build appd
```

该命令负责：

- 自动定位 AD 根目录
- 自动读取 `.ad-build/overlay/env.sh`
- 自动注入 `PREFIX_SOURCE`
- 检查子 make 是否继承 `PREFIX_SOURCE`
- 自动解析模块名到真实目录
- 自动保存完整日志
- 自动收集子构建日志
- 失败时提取真实错误窗口
- 成功时输出 `status: passed`

失败输出必须包含：

```text
status
module
module_dir
top_make_exit_code
first_real_error
first_real_error_source
error_log_path
suggested_next_command
```

模块名解析规则需要明确。第一版可以内置少量映射，例如：

```text
appd -> apps/ad_appd_new
```

找不到模块时，必须列出可用模块或提示如何配置，不允许 AI 自行臆造路径。

## repair 命令

`repair` 是诊断修复入口，不能作为普通主流程必跑步骤。

### `ad-build overlay repair paths`

执行：

- 基于 inventory 修复文本构建元数据中的旧根路径
- 基于 inventory 修复 symlink target
- 重新检查 dangling symlink
- 输出修复数量和剩余旧路径引用

### `ad-build overlay repair dpdk`

执行：

- 删除 `apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build`
- 删除 `apps/ad_appd_new/libs/dpdk/tmp_install`
- 使用 `PREFIX_SOURCE=<AD_ROOT>` 重新 make
- 记录 `PREFIX_SOURCE`、`PKG_CONFIG_PATH`、include 路径
- 保存 meson/ninja/make 日志
- 验证 RDMA header 可解析

该命令是“恢复后产物修复/重配置”，不是全量编译替代。

## 日志收集要求

`overlay build` 失败后不能只看外层 make 输出。

必须扫描模块目录内新增或更新的关键日志：

```text
log3party.log
meson-logs/meson-log.txt
ninja logs
*.log
```

输出真实错误窗口时必须包含：

```text
source_file
line
matched_pattern
context_before
context_after
```

常见错误模式：

```text
fatal error:
No such file or directory
redefinition of
redeclaration of
FAILED:
ninja: build stopped
subcommand failed
undefined reference
cannot find
```

## Skill 修复要求

Skill 必须把固定动作写死，防止内网 AI 幻觉。

AI 白名单命令：

```text
ad-build login
ad-build overlay use
ad-build overlay build <module>
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
```

产物发布者白名单命令：

```text
ad-build overlay pack
ad-build overlay publish
```

`pack/publish` 只允许产物发布者角色在用户明确授权的可信全量编译设备上执行。普通验证 AI 不得执行 `pack/publish`。

Skill 必须禁止 AI 在常规流程中自行执行：

```text
git clone ad-build-public-base
git pull
手工拼 latest JSON 路径
HTTPS Git 拉 3G 大包
裸 make
export PREFIX_SOURCE
sed /root/AD
ln -s 手工修软链
rm -rf dpdk build
tar 解包 overlay
curl/wget/rsync/scp 拉取 overlay
Python/Perl 手工批量改路径
```

`suggested_next_command` 不能绕过白名单。只有当 CLI 输出的 `suggested_next_command` 属于以下命令族时，AI 才能执行：

```text
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
ad-build overlay build <module>
```

如果 CLI 建议裸 shell、Git、sed、ln、make、rm、tar、curl/wget/rsync/scp、Python/Perl 手工修复，AI 必须停止并要求修 CLI，不能继续手工复刻。

遇到旧命令建议时，Skill 必须要求 AI 改写为 overlay：

```text
ad-build public-base use  -> ad-build overlay use
ad-build verify <module> -> ad-build overlay build <module>
ad-build image ...       -> 不执行，要求使用 overlay
ad-build bundle ...      -> 不执行，要求使用 overlay
ad-build precheck        -> 不执行，要求使用 overlay status/doctor
ad-build completion install -> 不执行，由 npm/skill install 自动处理
```

Skill 还必须明确：

- 如果 `use-summary.json.status != ready`，不要继续 build。
- 如果 build 失败，先看 CLI 提取的真实错误，不要只看上层 `Error 2`。
- 如果只验证过 `appd`，最终结论只能写 `appd MVP passed`，不得声明所有模块可用、overlay 全可用或环境已完整恢复。
- 如果出现旧根路径残留，先运行 `ad-build overlay doctor` 或 CLI 建议的 repair 命令。

## CLI 功能收敛

### README 主流程只展示

普通开发者：

```text
ad-build login
ad-build overlay use --branch release-AD7.0.29R2
ad-build overlay build appd
```

产物发布者：

```text
ad-build overlay pack --branch release-AD7.0.29R2
ad-build overlay publish --branch release-AD7.0.29R2
```

### 诊断章节展示

```text
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
```

### 旧命令删除和收敛清单

下一版 CLI 的公开命令面必须围绕 `overlay` 收敛，不能继续把历史方案暴露给用户或内网 AI。否则 AI 会在 `public-base`、`bundle`、`image`、`baseline` 几套语义之间来回跳，复现下午手工流程时容易重新走偏。

#### 必须删除：Docker/base-image 类

以下命令属于“基础镜像/镜像恢复”旧方案，不再作为主路径，也不保留公开入口：

```text
ad-build image status
ad-build image key
ad-build image save
ad-build image save --push
ad-build image pull
ad-build image push
ad-build image restore
ad-build image restore --delete
```

删除原因：

- 这套方案假设可以用 Docker image 承载公共编译状态，但实际验证中真正需要迁移的是全量编译后的 AD 工作区编译产物。
- 镜像拉取慢，且不适合承载 AD 编译产物的细粒度恢复。
- 当前成功路径已经转为 GitLab SSH 产物仓库中的 artifact overlay。

#### 必须删除：compiled-state bundle 类

以下命令属于最早“大包恢复”方案，不再保留公开入口：

```text
ad-build bundle pack --profile full --out <bundle.tar>
ad-build bundle pack --profile dev --out <bundle.tar>
ad-build bundle inspect --bundle <bundle.tar>
ad-build bundle restore --bundle <bundle.tar>
ad-build bundle restore --bundle <bundle.tar> --allow-commit-mismatch
ad-build inventory status
ad-build diff --source-only
ad-build map --source-only
```

删除原因：

- `bundle full/dev` 容易把大量无关产物、包输出目录、旧缓存一起打进去，包体不可控。
- `inventory status` 是旧 bundle restore 的配套检查，和新的 overlay inventory 不是同一个生命周期。
- `diff --source-only`、`map --source-only` 是旧 bundle 过滤逻辑的辅助命令，不应继续作为主流程能力。

#### 必须删除或隐藏：completion 公开路由

以下命令不再作为用户操作步骤，也不再出现在公开 help、README、Skill、shell completion 候选中：

```text
ad-build completion
ad-build completion help
ad-build completion bash
ad-build completion zsh
ad-build completion install --shell bash
ad-build completion install --shell zsh
```

补全脚本应默认安装：

- npm `postinstall` 或 `ad-build skill install --force` 时自动安装/更新补全脚本。
- 自动安装失败只能输出 warning，不能让 npm 安装失败。
- 正常 README 和 Skill 不再要求用户手工执行 completion install。
- 如果实现层需要保留 completion 生成函数，只能作为内部 API 使用，不能作为公开 CLI 路由。
- 生成出的 bash/zsh completion 不能继续补全 `public-base`、`bundle`、`image`、`inventory`、`baseline`、旧 `verify/report/modules/map/diff` 等入口。

#### 必须重写：login/logout

旧 `login/logout` 当前绑定 `public-base auth` 和 HTTPS token，不符合新路径。下一版必须重写为 artifact overlay 的 SSH 登录：

```text
ad-build login
ad-build logout
```

要求：

- `ad-build login` 默认配置 SSH，不再默认配置 HTTPS token。
- 登录流程检查或生成 SSH key，提示用户把 public key 加到 GitLab。
- 登录验证使用 `ssh -T git@git.sangfor.com` 或等价 GitLab SSH 探测。
- 固定产物仓库 remote 为 `git@git.sangfor.com:69765/ad-build-public-base.git`。
- HTTPS token 只作为兼容诊断入口，例如 `ad-build login --method https-token`，不得作为默认主流程。

#### 必须隐藏或删除：public-base 类

以下命令是上一阶段“公共依赖包”方案，已经被 artifact overlay 替代：

```text
ad-build public-base key
ad-build public-base check
ad-build public-base pack
ad-build public-base publish
ad-build public-base use
ad-build public-base restore
ad-build public-base status
ad-build public-base auth login
ad-build public-base auth status
ad-build public-base auth logout
ad-build public-base auth
```

处理原则：

- README、Skill、help 不再展示这些命令。
- 如果短期因为测试或兼容保留实现，也必须从公开 help 中隐藏。
- 用户误执行时输出明确迁移提示：`use ad-build overlay ... instead`，不要继续执行旧逻辑。
- 暂不建议把 `public-base` alias 到 `overlay`，避免语义混乱。
- `public-base auth` 不再作为公开 CI/登录入口；HTTPS token 兼容只允许走新的 `ad-build login --method https-token` 诊断路径。

#### 必须覆盖：旧命令 bare/help/default 入口

删除旧入口不能只删带参数的正常路径，还必须覆盖默认子命令和 help 路径：

```text
ad-build image
ad-build image help
ad-build image --help
ad-build bundle
ad-build bundle help
ad-build bundle --help
ad-build public-base
ad-build public-base help
ad-build public-base --help
ad-build completion
ad-build completion help
ad-build inventory
ad-build public-base auth
```

这些入口不得输出旧 help 文案。短期兼容时只能输出迁移提示，并返回非成功状态或明确的 deprecated 状态，避免 AI 误以为旧流程仍可用。

#### 需要重新定位：baseline/verify/module-map 类

代码和 README 中还存在以下旧流程命令：

```text
ad-build doctor
ad-build precheck
ad-build full-build -- <command...>
ad-build baseline-save --from-run latest
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
```

处理原则：

- `precheck`、`full-build`、`baseline-save` 属于旧 baseline 流程，应从公开命令和 README/Skill 中删除。
- `doctor` 可以保留名称，但语义必须改为 overlay doctor；不能继续检查旧 `AD_BUILD_BASELINE_DIR`、旧 module-map、旧 public-base 配置。
- `diff`、`map`、`modules`、`verify`、`report` 如果仍有价值，应作为 overlay 内部诊断能力重建；不再作为普通用户主流程。
- 普通编译入口统一收敛为 `ad-build overlay build <module>`，报告统一由 overlay build 输出。

#### 保留的公开主命令

下一版 README、Skill、CLI help 只展示以下公开主命令：

```text
ad-build login
ad-build logout
ad-build overlay pack --branch <release>
ad-build overlay publish --branch <release>
ad-build overlay use --branch <release>
ad-build overlay status
ad-build overlay doctor
ad-build overlay repair paths
ad-build overlay repair dpdk
ad-build overlay build <module>
ad-build skill status
```

`ad-build skill install --force` 可以作为管理员/诊断隐藏入口保留，但普通安装路径应由 npm 更新自动覆盖 skill 和 completion。`ad-build skill uninstall` 不进入 README、Skill、help、completion 主流程。

## 后续多模块验证计划

当前只有 `appd MVP` 成立。下一轮至少覆盖：

- 一个 `apps/` 下的大模块
- 一个依赖 `libs/` 的模块
- 一个涉及 `access_layer/` 的模块
- 一个涉及 `ui` 或 `ui_new` 的模块
- 一个涉及 kernel/linux 相关产物的模块，如果日常开发需要

每个模块记录：

```text
module
command
exit_code
first_error
first_error_source
required_overlay_paths
extra_repair_steps
duration
```

只有多个代表性模块都通过后，才能把方案升级为 `multi-module MVP`。

## 本次要修复的交付项

下一次代码修复必须按下午手工成功流程逐项固化。

### 第零阶段：删除旧公开入口并收敛命令面

1. 从 `bin/ad-build.js` 移除 `image`、`bundle`、`inventory`、`completion`、`public-base` 的公开路由。
2. 移除 `diff --source-only`、`map --source-only` 的旧 bundle 辅助入口。
3. `login/logout` 不再委托 `public-base auth`，改为 overlay SSH 登录/登出。
4. `helpText()`、README、Skill 只展示 overlay 主命令。
5. `precheck`、`full-build`、`baseline-save`、旧 `verify/report/modules/map/diff` 从普通用户流程移除。
6. 同步处理旧命令 bare/help/default 入口，包括 `image help`、`image -h`、`image --help`、`bundle help`、`bundle -h`、`bundle --help`、`public-base help`、`public-base -h`、`public-base --help`、`completion help`、`completion -h`、`completion --help`、`inventory`、`public-base auth`。
7. 如果短期保留旧实现文件用于回滚或测试，入口必须隐藏，并在误用时输出迁移提示，不得继续执行旧流程。
8. 至少落地 `ad-build overlay help` 或等价迁移提示，避免删除旧 help 后 CLI 没有可用主路径。
9. 更新 `package.json.files`，移除旧 public-base/glm5 public-base/image/bundle 方案文档，加入新的 overlay 交付文档。
10. 更新 `package.json scripts.test`，不再默认运行验证旧公开行为的 `base-image`、`bundle`、`public-base` 测试。
11. 更新测试矩阵：
    - `ad-build.test.js` 覆盖 help 只展示 overlay 主命令。
    - `completion.test.js` 覆盖生成补全只包含 overlay 白名单，不包含旧命令。
    - `public-base.test.js`、`bundle.test.js`、`base-image.test.js` 要么迁移为 overlay 测试，要么移动到 hidden/internal 兼容测试，不能继续验证公开主流程。
    - `skill-install.test.js` 增加 npm/skill 安装触发 completion best-effort 的测试。
12. 使用 `npm pack --dry-run` 或等价测试验证发布包内容不再包含旧主流程文档。

### 第零点五阶段：自动安装 skill 和 completion

1. npm 更新后普通用户只需要执行 `npm install -g ad-build`。
2. `postinstall` 默认覆盖安装 Skill，并 best-effort 安装/更新 shell completion。
3. completion 自动安装必须 warning-only：无 HOME、unsupported shell、写 rc 文件失败、CI 环境、Windows 环境都不能导致 npm install 失败。
4. 提供环境变量跳过自动 completion，例如 `AD_BUILD_SKIP_COMPLETION_INSTALL=1`。
5. `ad-build skill install --force` 作为管理员入口时，也应 best-effort 同步 completion。
6. 自动安装出的 completion 不能包含旧命令候选。

### 第一阶段：固化全量编译设备侧 pack/publish

1. 新增 `ad-build overlay pack`。
2. `pack` 从全量编译后的 AD 工作区生成 inventory。
3. inventory 只记录编译产物、构建元数据、软链接、tracked build side effect，不把源码目录整体入包。
4. `pack` 默认排除 `.git/`、`.ad-build/cache/`、`mkpacket/`、`ssipacket/`、`ad_packet/`。
5. `pack` 记录 `source_root_at_pack_time=/root/AD`、branch、commit、CLI 版本、pack rule 版本。
6. `pack` 保留 symlink entry，不 dereference。
7. `pack` 输出 overlay 包、manifest、inventory、sha256。
8. 新增 `ad-build overlay publish`。
9. `publish` 把 manifest、inventory、latest pointer、sha256 和 `.tar.gz` 实体包写入固定 GitLab 产物仓库。
10. `publish` 使用 SSH remote 提交并 push，不使用 HTTPS token 作为默认发布方式。

### 第二阶段：固化干净设备侧 use

1. 新增 `ad-build overlay use --branch <release>`。
2. `use` 根据 fixed Git 仓库中的 latest pointer 读取 manifest。
3. `use` 使用 SSH remote clone/pull 固定 GitLab 产物仓库。
4. `use` 根据 manifest 的 `artifact_path` 定位 overlay 实体包。
5. `use` 校验 sha256，不匹配直接停止。
6. `use` 只恢复 manifest inventory 中的 entries。
7. `use` 恢复前检查本地 modified/staged/untracked 冲突，默认拒绝覆盖用户改动。
8. `use` 解压后执行受控文本 relocation。
9. `use` 解压后执行 symlink relocation。
10. `use` 写 `.ad-build/overlay/current.json` 和 `.ad-build/overlay/use-summary.json`。
11. `use` 内置最小 doctor，确认状态可用后输出 `status: ready`。

### 第三阶段：固化下午手工修复动作

1. 新增 `ad-build overlay repair paths`。
2. `repair paths` 基于 inventory 修复旧根路径文本引用和 symlink target。
3. `repair paths` 输出剩余旧路径引用和 dangling symlink。
4. 新增 `ad-build overlay repair dpdk`。
5. `repair dpdk` 删除 DPDK build/tmp_install。
6. `repair dpdk` 使用 `PREFIX_SOURCE=<AD_ROOT>` 重新配置/构建 DPDK。
7. `repair dpdk` 保存 meson/ninja/make 日志。
8. `repair dpdk` 验证 RDMA header 可解析。

### 第四阶段：固化模块编译入口

1. 新增 `ad-build overlay build <module>`。
2. 第一版至少支持 `appd -> apps/ad_appd_new`。
3. `build` 自动读取 overlay env。
4. `build` 自动注入 `PREFIX_SOURCE=<AD_ROOT>`。
5. `build` 禁止用户和 AI 手工 export `PREFIX_SOURCE` 作为常规步骤。
6. `build` 保存完整 stdout/stderr。
7. `build` 扫描子构建日志，例如 `log3party.log`、meson log、ninja log。
8. `build` 输出 `first_real_error`、来源文件、上下文窗口。
9. `build` 成功时输出 `status: passed` 和 `exit_code: 0`。

### 第五阶段：更新 Skill 和 README

1. Skill 只允许内网 AI 使用白名单 overlay 命令。
2. Skill 禁止 AI 手工 clone 产物仓库、手工拼 latest、使用 HTTPS Git 拉大包、手工 sed、手工修软链、裸 make。
3. Skill 明确：下午手工流程已成功，AI 的职责是使用 CLI 固化流程，不是重新猜命令。
4. README 按角色展示最短路径：产物发布者和普通开发者分开。
5. README 不再展示 `public-base`、`bundle`、`image`、`baseline`、手工 completion install 旧流程。
6. Skill 明确：遇到旧命令建议时必须改用 overlay 命令，不得照旧执行。
7. npm 更新时自动覆盖 skill 和 completion；普通用户只需要 `npm install -g ad-build`。
8. 当前 `skills/ad-build/SKILL.md` 仍是旧 `public-base`/`verify`/`report` 工作流，必须整体重写为 overlay Skill，不能只在旧 Skill 顶部追加几段限制。
9. Skill front matter、常规流程、允许命令、禁止命令、错误处理、最终输出格式都必须使用 artifact overlay 语义。

## 成功标准

### appd MVP 成功标准

命令：

```text
ad-build overlay use --branch release-AD7.0.29R2
ad-build overlay build appd
```

满足：

```text
use-summary.json status: ready
build status: passed
exit_code: 0
无 /root/AD dangling symlink
无关键旧路径残留
无需用户手工 export PREFIX_SOURCE
无需用户手工 sed /root/AD
无需用户手工修软链接
无需用户手工清理 DPDK build
无需 HTTPS Git 拉 3G 大包
README/Skill/help 不展示 public-base/image/bundle/baseline 旧主流程
```

### multi-module MVP 成功标准

满足：

```text
至少 5 类代表性模块通过 overlay build
所有失败都能通过 CLI 输出定位到真实错误
所有模块都走同一套 use/build/doctor/repair 流程
不依赖用户手工路径修复
不依赖 AI 自行猜测 Makefile 环境变量
```
