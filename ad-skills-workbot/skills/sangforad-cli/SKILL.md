---
name: sangforad-cli
description: >
  用于用户要求把深信服 AD/ADC/SLB 配置生成为命令行、CLI、sfcli、命令行脚本、配置脚本、离线命令、可粘贴命令或 apply.sfcli 时；输入可以是已验证的 AD 操作计划，也可以是已填写的 ad-config-ops YAML bundle。该 skill 只生成命令脚本，不执行 CLI 命令；WorkBot R4 可使用只读 AD API 预检来判断复用和生成回滚 CLI。
---

# sangforad-cli

## 核心规则

- 以项目内 skill 源码 `skills/sangforad-cli/` 为准。
- 只要用户要求 AD 配置以命令行文本或脚本形式输出，就必须触发本 skill，即使用户没有明确说 `sangforad-cli`。典型说法包括：“生成命令行脚本”“给我离线命令”“导出可粘贴的 CLI 命令”“不要下发，产出配置脚本”“生成 apply.sfcli”。
- CLI 命令只能由 `scripts/render_cli.py` 生成；禁止凭记忆手写深信服 AD 命令块。
- `adops-plan.json` 或已填写的 `adops-bundle.yml` 是事实来源。如果用户只有自然语言意图，先用 `ad-config-ops` 生成并校验 bundle，再回到本 skill 生成 CLI。
- 默认模式是离线生成。不要 SSH、telnet、登录 CLI 会话、粘贴命令或声称命令已经执行。WorkBot R4 只允许通过 `connect.py` 和 `preflight-slb-plan` 做只读 AD API 预检；该预检仍然不能修改设备。
- 单独使用本 skill 时，默认面向用户的产物是 `apply.sfcli`。WorkBot R4 CLI 模式必须同时发布 `apply.sfcli` 和 `rollback.sfcli`。内部 plan/bundle 文件默认不展示，除非用户明确调试生成器。
- WorkBot R4 CLI：用户上传填写后的 R4 YAML，并回复 `我写完了 YAML，生成命令行脚本` 或其他 CLI/sfcli 相关说法时，必须先做只读 AD API 预检，再渲染最终 CLI 脚本。不要运行 `ad_ops_flow.py plan-and-render`、`ad_ops_flow.py summarize-plan`、`apply-slb-plan`、`rollback-and-verify`，不要 SSH、telnet，也不要粘贴 CLI 命令。CLI 计划只能用 `render_cli.py --bundle ... --plan-out ...` 构建。用户可见产物是 `/opt/agent/data/outputs/apply.sfcli` 和 `/opt/agent/data/outputs/rollback.sfcli`；这次答复不要展示 `apply.py` 或 `rollback_apply.py`。
- WorkBot R4 CLI 中，只要上传的 YAML 顶层包含 `operations:`，它就是当前事实来源；即使它的动作或资源类型与同一会话里先前生成的阶段 A 模板不同，也不要询问它是否匹配旧模板，不要因为模型侧判断“不一致”而停下。继续执行 CLI 计划构建、只读预检和最终 CLI 渲染；是否继续由工具错误或预检失败决定。
- 渲染后不要打开、读取、cat、file_read、粘贴、总结或展示 `apply.sfcli` / `rollback.sfcli` 内容。只使用 JSON 摘要和 `test -f` 证据。生成的 sfcli 文件是用户可下载产物，不是聊天正文内容。
- 最终提醒用户在粘贴到 AD CLI 会话前先审阅命令。不要把生成的命令描述成已经应用到设备。

## 执行流程

使用宿主环境提供的 Python 解释器。WorkBot/Linux 示例使用 `python3`；在本 Windows 仓库中，如果 `python3` 或 `python` 指向 Windows Store 占位程序，就使用 `CLAUDE.md` 中的打包 Python 路径。

### 1. 选择输入

如果已经存在通过校验的计划文件：

```bash
python3 skills/sangforad-cli/scripts/render_cli.py --plan "$AD_OPS_WORKDIR/adops-plan.json" --workdir "$AD_OPS_WORKDIR"
```

`--plan` 只能用于 `ad-config-ops` 生成的真实 AD-OPS 计划，其中必须包含 API `path` 或 `resource_path` 字段。不要把用户上传的 YAML bundle 改名成 `adops-plan.json`。

如果用户已填写 AD-OPS bundle YAML，但当前还没有计划文件：

```bash
python3 skills/sangforad-cli/scripts/render_cli.py --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" --ad-config-ops-root skills/ad-config-ops --workdir "$AD_OPS_WORKDIR"
```

如果从仓库源码而不是 WorkBot 打包目录运行，`--ad-config-ops-root` 使用 `.claude/skills/ad-config-ops`。

WorkBot R4 中，把上传的 YAML 复制进运行目录，先构建 CLI 计划，再做只读预检，然后基于预检结果渲染正向和回滚 CLI 脚本，最后只发布 `apply.sfcli` 和 `rollback.sfcli`：

```bash
export AD_OPS_WORKDIR="/tmp/ad-ops-workdir"
export AD_OPS_OUTPUT_DIR="/opt/agent/data/outputs"
set -e
cd /root/.zeroclaw/workspace
cp /opt/agent/data/inputs/<uploaded-yaml-name>.yml "$AD_OPS_WORKDIR/adops-bundle.yml"
python3 skills/sangforad-cli/scripts/render_cli.py --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" --ad-config-ops-root skills/ad-config-ops --workdir "$AD_OPS_WORKDIR" --plan-out "$AD_OPS_WORKDIR/sangforad-cli-plan.json" --plan-only
python3 skills/ad-connect/scripts/connect.py --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1 --format json
python3 skills/ad-config-ops/scripts/ad_ops_flow.py preflight-slb-plan --plan "$AD_OPS_WORKDIR/sangforad-cli-plan.json" --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1 --workdir "$AD_OPS_WORKDIR"
python3 skills/sangforad-cli/scripts/render_cli.py --plan "$AD_OPS_WORKDIR/sangforad-cli-plan.json" --preflight "$AD_OPS_WORKDIR/adops-preflight.json" --out "$AD_OPS_WORKDIR/apply.sfcli" --rollback-out "$AD_OPS_WORKDIR/rollback.sfcli" --workdir "$AD_OPS_WORKDIR"
cp "$AD_OPS_WORKDIR/apply.sfcli" "$AD_OPS_OUTPUT_DIR/apply.sfcli"
cp "$AD_OPS_WORKDIR/rollback.sfcli" "$AD_OPS_OUTPUT_DIR/rollback.sfcli"
test -f "$AD_OPS_OUTPUT_DIR/apply.sfcli"
test -f "$AD_OPS_OUTPUT_DIR/rollback.sfcli"
```

不要在这段流程旁边追加 API apply 脚本生成。不要运行 `ad_ops_flow.py plan-and-render` 或 `ad_ops_flow.py summarize-plan`；CLI 模式下，第一条 `render_cli.py --bundle ... --plan-out ... --plan-only` 命令就是计划构建步骤，且预检前不得渲染 `apply.sfcli`。必须保留 `set -e`，让计划构建、连接检查、预检或最终渲染任一步失败时都停止发布。唯一的设备动作是只读 API 预检，不执行任何 CLI 命令。正常 WorkBot R4 CLI 流程中不要围绕该命令块运行 `rm -rf`，因为阶段 A 已经初始化当前流程的运行目录。

### 2. 使用脚本摘要

`render_cli.py` 会输出简短 JSON 摘要，包含：

- `ok`
- `operation_count`
- `cli_script`
- `artifacts`
- `workflow_contract`

使用该摘要判断路径和状态。除非正在调试 `sangforad-cli` 本身，否则不要解析或总结生成的产物文件。

### 3. 完成答复

单独生成 CLI 时，最终答复只列出可复用产物 `apply.sfcli`。WorkBot R4 CLI 模式必须同时列出 `apply.sfcli` 和 `rollback.sfcli`。说明这些文件是可粘贴的深信服 AD CLI 命令脚本、当前未执行，且粘贴到设备 CLI 前必须先人工审阅。

WorkBot R4 CLI 的可见答复使用下面形态：

```text
## 配置结论
命令行脚本已生成；已完成只读预检，当前未下发，未执行 CLI 命令。预检结果：<已存在复用/待新建/失败摘要>。
## 产出物
/opt/agent/data/outputs/apply.sfcli
/opt/agent/data/outputs/rollback.sfcli
## 下一步
请先审阅 apply.sfcli 和 rollback.sfcli 内容，再按变更流程复制到 AD CLI 会话执行。
```

可见答复不要增加逐资源表格、逐行操作列表或脚本正文。只需要一句紧凑预检说明，例如：`预检结果：4 项待新建，0 项复用，0 项失败。`

## 命令形态

详细渲染说明在 `references/cli-rendering.md`。扩展渲染器或检查命令语法时再读取该文件。

当前渲染器遵循旧版 AD CLI 手册形态：

- AD-OPS 操作动作中的 `create`、`modify` 和 `delete` 对应 CLI 动作。
- `/api/ad/v3/` 后面的 URI 路径会转成命令词，例如 `/slb/virtual-service/{name}` 转成 `slb virtual-service <name>`。
- 顶层 `name` 作为位置参数，不再重复为选项。
- 标量 payload 值渲染为 `field value`。
- 对象渲染为 `field { child value ... }`。
- 标量数组渲染为 `field [ item1 item2 ]`。
- 对象数组渲染为 `field add [ { key value ... } ]`。

## 边界

- 本 skill 不替代 `ad-config-ops` 的模板生成、schema 校验、依赖排序、API 下发或回滚。
- 本 skill 运行时不读取 PDF 手册。
- 如果 `render_cli.py` 失败，停止并报告简短错误；不要手工修补 CLI 输出。
