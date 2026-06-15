# 手工验证通过的 overlay 恢复流程

本文只记录一次已经手工跑通的流程，用于指导后续 CLI 实现和内网 AI 测试。它不是最终产品说明，也不要求用户长期手工执行这些步骤。

> 重要：本文是历史参考，不是当前 AI 或用户的操作入口。当前可执行流程必须以 `AGENTS.md`、`skills/ad-build/SKILL.md`、`README.md` 和 `docs/artifact-overlay-operations.md` 中的稳定 CLI 命令为准；不要用本文里的手工 `tar`、`sed`、`ln`、`make`、`PREFIX_SOURCE` 步骤替代 CLI。

## 结论

这次跑通的方向是“编译产物 overlay”：

1. AD 源码不打包。
2. 全量编译后的设备只打包编译产物、生成文件、构建缓存和必要的被构建过程改写的文件。
3. 干净设备必须已经有同分支 AD 源码。
4. 干净设备解包 overlay 后，需要做路径迁移和 DPDK/RDMA 相关修复，再编译 appd。

这不是镜像方案，也不是把整个 AD 工作区打包。我们手工验证时，排除了 `.git`、`.ad-build`、`mkpacket`、`ssipacket`、`ad_packet`，最后得到的 `ad-artifact-overlay-v2.tar.gz` 约 3.1G。

## 环境角色

全量编译设备：

- AD 目录：`/root/AD`
- 状态：同分支已经完整全量编译过
- 作用：产出 overlay 包

干净验证设备：

- AD 目录：`/root/workspace/AD`
- 状态：只有干净源码，没有跑全量编译
- 作用：恢复 overlay，然后验证 appd 是否能编译

两台设备上的 AD 源码分支和 commit 应该一致。后续 CLI 必须在 restore 前快速检查这一点。

## 打包内容

手工验证的包不包含 AD 源码本身，主要包含以下几类：

1. 公共编译输出：
   - `obj/`
   - `app_bin/`
   - `include/` 中生成或改写的头文件

2. appd 相关三方构建结果：
   - `libs/rdma-core-2404mlnx51/build/`
   - `apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build/`
   - `apps/ad_appd_new/libs/dpdk/tmp_install/`

3. 构建过程生成或改写的模块文件：
   - `apps/`
   - `libs/`
   - `sinfor/`
   - `shell/`
   - `cfg/`
   - `ui/`
   - `ui_new/`
   - `linux/`

4. 顶层构建入口文件：
   - `Makefile*`
   - `app*.mk`
   - `OS_PLATFORM.file`
   - `KERNEL_VER`
   - 其他构建过程中需要的顶层小文件

必须排除：

- `.git/`
- `.ad-build/`
- `mkpacket/`
- `ssipacket/`
- `ad_packet/`

原因是后三个目录体积大，并且不是支撑单模块编译的核心依赖。`.git` 和 `.ad-build` 不能混入产物包。

## 全量编译设备上的手工步骤

在全量编译设备确认源码状态：

```bash
cd /root/AD
git branch --show-current
git rev-parse HEAD
```

记录这两个值。后续干净设备恢复前要检查它们。

然后基于已经筛选好的文件列表打包：

```bash
cd /root/AD

tar \
  --checkpoint=10000 \
  --checkpoint-action='echo=packed records: %u' \
  -czf /root/ad-artifact-overlay-v2.tar.gz \
  --files-from=/root/ad-overlay-v2-files.txt

sha256sum /root/ad-artifact-overlay-v2.tar.gz > /root/ad-artifact-overlay-v2.tar.gz.sha256
ls -lh /root/ad-artifact-overlay-v2.tar.gz /root/ad-artifact-overlay-v2.tar.gz.sha256
```

这次手工验证得到的包约 3.1G。打包耗时可以接受，因为一个版本通常只做一次。真正敏感的是干净设备拉取和恢复耗时。

## 传输方式

这次验证过程中发现，把 3G 压缩包直接作为普通 Git blob 通过 HTTP 拉取，容易出现：

```text
RPC failed
curl 18 transfer closed with outstanding read data remaining
early EOF
unpack-objects failed
```

根因不是包内容错误，而是大文件通过普通 Git/HTTP 传输不稳定，而且 Git 会把大二进制写进历史对象，后续拉取成本高。

可选传输方式按优先级：

1. 专用制品仓库或对象存储：最适合 3G 级产物，支持断点、校验、生命周期管理。
2. GitLab SSH + 单分支单快照提交：比 HTTP 稳定，但仍不适合长期堆多个 3G blob。
3. Git LFS：如果内网 GitLab 已配置 LFS，可以考虑，但仍要验证权限和下载速度。
4. 分片文件：例如 512M 一片，配合 sha256 校验和重组，适合临时绕过网络限制。
5. 个人电脑中转：当全量编译设备和干净设备不通时，可先从全量设备取到本地，再上传到干净设备。

后续 CLI 不应该依赖普通 Git 历史长期保存大包。如果继续用 GitLab，应该至少做到：按 release 分支发布、每个分支只保留最新快照、用 SSH 拉取。

## 干净设备上的手工恢复步骤

假设 overlay 包已经传到干净设备：

```bash
/root/workspace/ad-artifact-overlay-v2.tar.gz
```

先确认干净设备源码状态：

```bash
cd /root/workspace/AD
git branch --show-current
git rev-parse HEAD
```

分支和 commit 必须与打包时记录的一致。若不一致，不应该默认恢复。后续 CLI 应输出 GitLab compare 链接，并要求用户显式 `--force` 才继续。

解包：

```bash
cd /root/workspace/AD
sha256sum /root/workspace/ad-artifact-overlay-v2.tar.gz

time tar -xzf /root/workspace/ad-artifact-overlay-v2.tar.gz -C /root/workspace/AD
```

这次手工验证中，解包耗时约 3 分钟。

解包后检查关键目录：

```bash
cd /root/workspace/AD

ls -ld libs/rdma-core-2404mlnx51/build/include
find libs/rdma-core-2404mlnx51/build/include -type f | wc -l

ls -ld apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build
ls -ld obj/lib64 obj/bin app_bin include
```

当时关键现象：

- `libs/rdma-core-2404mlnx51/build/include` 存在
- `find ... -type f | wc -l` 能看到文件，手工验证时是 19
- DPDK build 目录存在
- `obj/lib64`、`obj/bin`、`app_bin`、`include` 存在

## 路径迁移

全量编译设备路径是 `/root/AD`，干净设备路径是 `/root/workspace/AD`。overlay 中会包含文本配置、pkgconfig、meson/cmake 缓存和 symlink，它们可能引用旧路径。

需要把旧路径迁移到新路径：

```bash
cd /root/workspace/AD

OLD=/root/AD
NEW=/root/workspace/AD

grep -RIl "$OLD" \
  obj app_bin include libs apps sinfor shell cfg ui ui_new linux \
  2>/dev/null \
  | while read -r file; do
      sed -i "s#$OLD#$NEW#g" "$file"
    done
```

还要修复指向旧路径的 symlink：

```bash
cd /root/workspace/AD

OLD=/root/AD
NEW=/root/workspace/AD

find obj app_bin include libs apps sinfor shell cfg ui ui_new linux \
  -type l 2>/dev/null \
  | while read -r link; do
      target=$(readlink "$link")
      case "$target" in
        "$OLD"/*)
          new_target="$NEW${target#$OLD}"
          rm -f "$link"
          ln -s "$new_target" "$link"
          ;;
      esac
    done
```

注意：不要手工把 `mlx5dv.h` 复制到 `build/include/infiniband/mlx5dv.h` 覆盖 symlink。之前尝试过复制，会引入重复定义风险。正确方式是修复 symlink 的目标路径，或者重新生成 DPDK build 缓存。

## DPDK/RDMA 修复

appd 依赖 DPDK，DPDK 又依赖 rdma-core 的 build/include。手工验证中，最关键的问题不是源码缺失，而是 DPDK 的 meson/pkgconfig 缓存里残留了旧路径，或者 `PREFIX_SOURCE` 没有正确传入 DPDK 子构建。

先单独重建 DPDK 缓存：

```bash
cd /root/workspace/AD/apps/ad_appd_new/libs/dpdk

make clean || true
PREFIX_SOURCE=/root/workspace/AD make V=1 VERBOSE=1 2>&1 | tee /tmp/dpdk-prefix-source.log
echo "exit=$?"
```

期望：

```text
exit=0
```

如果失败，不要只看 appd 顶层日志。DPDK 真实错误通常在当前命令日志或 `log3party.log` 里。

排查命令：

```bash
grep -nE 'rdma_lib_path|/libs/rdma-core|/root/workspace/AD/libs/rdma-core|fatal error|ERROR|Error|error|failed|No such|cannot|ninja' \
  /tmp/dpdk-prefix-source.log \
  | tail -120
```

如果看到 `/libs/rdma-core-2404mlnx51` 这种缺少 `/root/workspace/AD` 前缀的路径，说明 `PREFIX_SOURCE` 没有传进去。

如果看到 `infiniband/mlx5dv.h: No such file or directory`，优先检查 symlink 是否还指向 `/root/AD`：

```bash
cd /root/workspace/AD
find libs/rdma-core-2404mlnx51/build/include -type l -lname '/root/AD/*' -print
```

## appd 验证

DPDK 单独通过后，再编译 appd：

```bash
cd /root/workspace/AD/apps/ad_appd_new

PREFIX_SOURCE=/root/workspace/AD make V=1 VERBOSE=1 2>&1 | tee /tmp/appd-after-dpdk-reconfigure.log
echo "exit=$?"
```

期望：

```text
exit=0
```

这次手工验证最终 appd 编译通过，日志末尾可以看到 `exit=0`。

如果失败，优先找真实错误：

```bash
grep -nE 'fatal error|No such file|redefinition|redeclaration|FAILED:|subcommand failed|Error [0-9]|error:' \
  /tmp/appd-after-dpdk-reconfigure.log \
  | tail -120
```

注意：appd 构建中有些子目录会把输出重定向到 `log3party.log`，所以顶层 `tail` 不一定能看到真正错误。

## 本次 CLI 失败暴露的问题

这次 CLI 没有跑到最终编译流程，主要不是因为 overlay 思路不成立，而是 CLI 没有完整复现手工成功路径：

1. restore 前没有先快速检查当前 AD 源码分支和 commit。
2. 不一致时没有给出 GitLab compare 链接，也没有清晰要求用户显式 `--force`。
3. 长耗时步骤缺少进度，用户无法判断是卡住还是正常运行。
4. 部分状态/cache/output 路径曾经落在 AD 仓库目录下，应该统一放到 `$HOME/.ad-build`。
5. login 的 SSH 状态反馈不够清晰，未认证时应该持续给出需要添加的完整 public key。
6. restore 的 symlink 覆盖、路径迁移、DPDK/RDMA 修复没有按手工成功顺序做完整。
7. 对 dangling symlink 的检查过严，容易在还没进入关键编译验证前阻断流程。
8. 旧命令太多，干扰主路径，后续应该只保留清晰的 pack/publish/restore/status/doctor/repair/verify。

## 后续 CLI 应复现的最小主路径

全量编译设备：

```bash
cd /root/AD
ad-build login
ad-build pack --branch release-AD7.0.29R2
ad-build publish --branch release-AD7.0.29R2
```

干净设备：

```bash
cd /root/workspace/AD
ad-build login
ad-build restore --branch release-AD7.0.29R2
ad-build verify appd
```

其中 `restore` 必须自动完成：

1. 拉取指定 release 分支的最新 overlay manifest。
2. 快速检查当前 AD 分支和 commit 是否与 manifest 一致。
3. 不一致时停止，不解压、不覆盖，并输出 compare 链接。
4. 用户显式 `--force` 时才允许继续。
5. 校验 overlay sha256。
6. 解压 overlay。
7. 恢复 inventory 中的文件和 symlink。
8. 迁移 `/root/AD` 到当前 AD 目录。
9. 修复旧路径 symlink。
10. 重建 DPDK/RDMA 缓存。
11. 运行 readiness check。

`verify appd` 只负责验证编译，不应该承担 restore 阶段的固定修复工作。

## 成功判定

手工流程成功的最低标准：

1. 干净设备解包后关键目录存在。
2. 文本配置中不再残留 `/root/AD`。
3. 关键 symlink 不再指向 `/root/AD`。
4. DPDK 单独执行 `PREFIX_SOURCE=/root/workspace/AD make` 返回 `exit=0`。
5. `apps/ad_appd_new` 下执行 `PREFIX_SOURCE=/root/workspace/AD make` 返回 `exit=0`。

目前只验证了 appd。其他模块可能还有类似路径缓存、三方库 build cache 或 symlink 问题，后续需要用新版流程继续扩展验证范围。
