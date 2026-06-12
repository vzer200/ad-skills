# ad-build bundle drop-in

这个 ZIP 不是 git patch。把它解压覆盖到 `codex/ad-build-cli-skill` 分支的仓库根目录即可。

```bash
cd ad-skills
git checkout codex/ad-build-cli-skill
unzip -o /path/to/ad-build-bundle-dropin.zip
node --test test/bundle.test.js
npm test
```

新增命令：

```bash
ad-build bundle pack --profile full --out ad-build-compiled-state.tar
ad-build bundle inspect --bundle ad-build-compiled-state.tar
ad-build bundle restore --bundle ad-build-compiled-state.tar
ad-build inventory status
ad-build diff --source-only
ad-build map --source-only
```

第一阶段建议流程：

```bash
# 在刚刚全量编译成功的容器里
cd /root/AD
ad-build bundle pack --profile full --out ad-build-compiled-state.tar

# 后续流水线/开发环境，同一 commit 下
ad-build bundle restore --bundle ad-build-compiled-state.tar
ad-build diff --source-only
ad-build map --source-only
ad-build verify <module>
```

`bin/ad-build.js` 是兼容包装器：

- `bundle` / `inventory` / `diff --source-only` / `map --source-only` 走新增 bundle 逻辑。
- 其他命令仍然委托给原来的 `lib/commands.js`。

注意：解压会覆盖 `bin/ad-build.js` 和 `package.json`，解压前可自行备份。
