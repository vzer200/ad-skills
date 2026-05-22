---
name: ad-config-ops
description: 深信服 AD/ADC/SLB 配置生成 skill。用于根据用户参数生成虚拟服务、Pool、节点、HTTP Profile、Pre Rule 等组合配置脚本、batch JSON、预检查计划和回滚计划。默认只生成产物，不连接真实设备、不下发配置。
---

# AD 配置生成

## 强制规则

- 只使用本 skill 内脚本作为事实来源：`skills/ad-config-ops/scripts/`。
- 默认是离线生成模式。除非用户单独明确要求下发，否则禁止运行任何带 `--execute` 的命令。
- 不要手写 API payload、batch JSON、apply.py 或回滚文件；必须由脚本生成。
- 不要打开、粘贴、改写或解析生成的 `adops-bundle.yml`、`adops-plan.json`、`adops-batch.json`、`apply.py`。这些文件是机器产物。
- 面向用户输出时，只使用脚本 stdout 的短 JSON 摘要和 `summarize-plan` 的结果。
- 每个新任务先设置 `AD_OPS_WORKDIR`，然后运行 `init_env.py`。WorkBot 验收场景允许直接清理旧的 `adops-*` 生成文件。

```bash
export AD_OPS_WORKDIR="${AD_OPS_WORKDIR:-./ad_ops_workdir}"
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR" --confirm-clean
python3 skills/ad-config-ops/scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"
```

## 通用 SLB 组合生成

当用户要求新建或生成 SLB/VS 配置，例如“新增 VS”“VS + XFF”“VS + PRE_RULE”“VS + Pool + 节点”“VS 引用已有策略”等，优先使用通用组合入口：

```bash
python3 skills/ad-config-ops/scripts/render_slb_bundle.py \
  --vs-name <VS_NAME> \
  --vip <VIP> \
  --vport <VPORT> \
  --pool <POOL_NAME> \
  [--node <NODE_IP>:<NODE_PORT>] \
  [--create-pool] \
  [--http-profile <EXISTING_HTTP_PROFILE>] \
  [--create-http-profile-xff <NEW_HTTP_PROFILE>] \
  [--pre-rule <EXISTING_PRE_RULE>] \
  [--create-pre-rule-http <NEW_PRE_RULE>] \
  [--pre-rule-uri-pattern <URI_PATTERN>] \
  --workdir "$AD_OPS_WORKDIR"

python3 skills/ad-config-ops/scripts/ad_ops_flow.py plan-and-render \
  --skill-root skills/ad-config-ops \
  --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" \
  --workdir "$AD_OPS_WORKDIR"

python3 skills/ad-config-ops/scripts/ad_ops_flow.py summarize-plan \
  --plan "$AD_OPS_WORKDIR/adops-plan.json" \
  --workdir "$AD_OPS_WORKDIR"
```

Supported composition examples:

| User intent | Required render arguments |
| --- | --- |
| 新建 VS + Pool + 节点 | `--pool ... --node ip:port` |
| 新建 VS + 复用已有 HTTP Profile | `--http-profile <name>` |
| 新建 VS + 新建 XFF HTTP Profile | `--create-http-profile-xff <name> --xff-header X-Forwarded-For` |
| 新建 VS + 复用已有 Pre Rule | `--pre-rule <name>` |
| 新建 VS + 新建 HTTP Pre Rule | `--create-pre-rule-http <name> --pre-rule-uri-pattern <pattern>` |
| 新建 VS + XFF + HTTP Pre Rule | 同时使用 `--create-http-profile-xff` 和 `--create-pre-rule-http` |

`render_vs_xff_bundle.py` 只是兼容旧示例的快捷入口；新任务优先使用 `render_slb_bundle.py`。

## 复用已有对象

如果用户要求“先检查设备上是否已有可复用策略”，这属于真实设备只读发现，必须先用 `ad-connect` 连接预检，然后再运行发现脚本。发现脚本只做 GET，不下发配置。

检查是否已有 XFF HTTP Profile：

```bash
python3 skills/ad-config-ops/scripts/discover_reuse.py \
  --kind http-profile-xff \
  --host <AD_HOST> \
  --username <USER> \
  --password "$AD_PASSWORD" \
  --header X-Forwarded-For
```

如果 stdout 中 `reusable=true` 且 `selected` 有值，后续 `render_slb_bundle.py` 必须使用 `--http-profile <selected>`，不要新建 XFF Profile。否则才使用 `--create-http-profile-xff <new_name>`。

## 固定输出模板

必须按这个模板输出，不要额外发挥：

```text
## 目标
<一句话说明用户要生成什么>

## 工具调用
- <脚本名>: <成功/失败>，<关键 stdout 摘要>

## 生成产物
- bundle: <路径>
- plan: <路径>
- batch: <路径>
- apply_script: <路径>

## 操作计划
- <method> <path> (<operation id>)

## 下发状态
未下发配置；除 discover_reuse.py 的只读 GET 外未连接真实设备；没有执行 --execute。
```

## 通用模板流程

如果用户的资源组合超出 `render_slb_bundle.py` 支持范围，先查 API，再生成模板，用户填好后再规划：

```bash
python3 skills/ad-config-ops/scripts/lookup_api.py --skill-root skills/ad-config-ops --query "<intent>" --module <module> --out "$AD_OPS_WORKDIR/adops-lookup.json" --summary
python3 skills/ad-config-ops/scripts/render_bundle_template.py --skill-root skills/ad-config-ops --operation <id> <action> <schema> <document> --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py plan-and-render --skill-root skills/ad-config-ops --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py summarize-plan --plan "$AD_OPS_WORKDIR/adops-plan.json" --workdir "$AD_OPS_WORKDIR"
```

真实设备验证、下发、回滚必须分别得到用户明确确认。
