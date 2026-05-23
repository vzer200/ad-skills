---
name: ad-config-ops
description: 深信服 AD/ADC/SLB 配置 skill。用于根据用户参数生成并下发虚拟服务、Pool、节点、HTTP Profile、Pre Rule 等 SLB 组合配置，产出下发脚本、执行结果、回滚脚本和设备验证结果。
---

# AD 配置生成

## 强制规则

- 只使用本 skill 内脚本作为事实来源：`skills/ad-config-ops/scripts/`。
- R4 必须分阶段执行：提示词先落成 YAML；YAML 再生成计划/脚本；用户明确选择后才进入下发验证。
- 禁止用追问补参数。提示词不完整时，直接产出带空字段/注释的 YAML 模板让人工补齐，不能猜。
- 阶段 A 必须识别目标设备。验收主线提示词会包含 `AD1`；如果用户未说明设备，YAML 模板必须保留设备空字段让人工填写，不能默认猜 AD1。
- 用户选择“仅产出脚本”时，只输出正向脚本和回滚脚本，不下发。
- 用户选择“下发验证”时，下发前必须 GET 设备保存 baseline；下发后必须 GET 验证资源；然后停止，等待用户人工检查完成后再回滚。
- 回滚后必须再次 GET，并和下发前 baseline 比较；两次 GET 不一致时，禁止宣称兜底成功。
- 用户交互必须短句化：不要把命令参数塞给用户。接受“我写完了 YAML”“真实下发”“直接给出脚本”“不需要下发”“需要回滚”“是”“不符合预期”这类短回复，并按本流程推进。
- 不要手写 API payload、batch JSON、apply.py 或回滚文件；必须由脚本生成。
- 不要打开、粘贴、改写或解析生成的 `adops-bundle.yml`、`adops-plan.json`、`adops-batch.json`、`apply.py`。这些文件是机器产物。
- 面向用户输出时，只使用脚本输出的短 JSON 摘要和 `summarize-plan` 的结果，但不要把“工具调用”、退出码、stdout/stderr 作为用户正文标题；这些只供验收侧后台核验。
- 最终正文的 `markdown-body` 只能从 `## 配置结论` 开始，按固定输出模板结束。禁止出现 `工具调用`、`执行命令`、`命令摘要`、`退出码`、`stdout`、`stderr`、`init_env.py`、`ad_ops_flow.py`、`render_slb_bundle.py`、`plan-and-render`、`summarize-plan`、`preflight-slb-plan`、`apply-slb-plan`、`rollback-and-verify`。用户可见区域可以展示业务产物路径，例如 `apply.py`、`rollback_apply.py`、`adops-bundle.yml`、`adops-plan.json`。
- 每个新任务先设置 `AD_OPS_WORKDIR`，然后运行 `init_env.py`。WorkBot 验收场景允许直接清理旧的 `adops-*` 生成文件。

```bash
export AD_OPS_WORKDIR="${AD_OPS_WORKDIR:-./ad_ops_workdir}"
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR" --confirm-clean
python3 skills/ad-config-ops/scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"
```

## R4 固定阶段

### 阶段 A：提示词到 YAML

当用户要求新建或生成 SLB/VS 配置，例如“新增 VS”“VS + XFF”“VS + PRE_RULE”“VS + Pool + 节点”“VS 引用已有策略”等，第一步只做 YAML，不追问。

- 常见组合参数能从提示词识别时，使用 `render_slb_bundle.py` 生成 `adops-bundle.yml`。
- 提示词缺字段或组合超出快捷矩阵时，使用“通用模板流程”生成 `adops-bundle.yml` 模板，让用户人工补齐。
- 阶段 A 结束时停止，告诉用户下载生成的 YAML、填写必要内容后重新上传；用户只需回复“我写完了 YAML”即可进入阶段 B。
- 阶段 A 用户可见正文只说明 YAML 产物和下一步，不做计划、不做设备 GET、不下发。

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
```

### 阶段 B：YAML 到脚本/下发选择

用户确认 YAML 后，生成计划和脚本，并先用 YAML 对目标设备做 GET 预检。有同名 create 目标存在时，直接复用设备现有资源，重新渲染有效计划和脚本；不要再 POST 创建同名资源。YAML 中已有 create 操作的资源，GET 404 表示需要新建，是正常结果；只有 YAML 明确引用现网已有资源、且没有对应 create 操作时，GET 404 才阻断流程。必须在用户正文里说明本次预检结果：待新建资源、复用已有资源、引用资源已确认，或预检失败。

```bash
python3 skills/ad-config-ops/scripts/ad_ops_flow.py plan-and-render \
  --skill-root skills/ad-config-ops \
  --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" \
  --workdir "$AD_OPS_WORKDIR"

python3 skills/ad-config-ops/scripts/ad_ops_flow.py summarize-plan \
  --plan "$AD_OPS_WORKDIR/adops-plan.json" \
  --workdir "$AD_OPS_WORKDIR"

python3 skills/ad-config-ops/scripts/ad_ops_flow.py preflight-slb-plan \
  --plan "$AD_OPS_WORKDIR/adops-plan.json" \
  --host "$AD_HOST" \
  --username "$AD_USERNAME" \
  --workdir "$AD_OPS_WORKDIR"
```

Preflight safety: create target HTTP 404 means absent and can proceed as a new resource; referenced-existing target HTTP 404 blocks the workflow because the YAML points to a resource that is not present. Any other GET failure blocks before script output or device mutation.
Same-name reuse safety: an existing resource is reused by name and is not overwritten. If the preflight result reports `reuse_compatibility_warning_count > 0`, surface it to the user and require manual review during the device inspection step.

预检后必须让用户二选一，只接受短回复：

- 用户回复“直接给出脚本”“不需要下发”“先不下发”“只要脚本”：输出 `apply.py` 和 `rollback_apply.py`，说明如何使用，然后结束；禁止执行 `apply-slb-plan`。
- 用户回复“真实下发”：进入阶段 C。

### 阶段 C：下发、人工检查、回滚兜底

用户选择下发验证时，使用固定编排 `apply-slb-plan`，不要让模型自行拼接多个下发/验证命令。该命令会自动执行 preflight GET、复用同名资源、下发有效计划、保存 post-apply GET，并生成回滚清单。

```bash
export AD_HOST="<AD_HOST>"
export AD_USERNAME="<AD_USERNAME>"
export AD_PASSWORD="<AD_PASSWORD>"

python3 skills/ad-config-ops/scripts/ad_ops_flow.py apply-slb-plan \
  --plan "$AD_OPS_WORKDIR/adops-plan.json" \
  --host "$AD_HOST" \
  --username "$AD_USERNAME" \
  --vs-name <VS_NAME> \
  --pool-name <POOL_NAME> \
  [--node-ip <NODE_IP>] \
  [--http-profile <HTTP_PROFILE>] \
  [--pre-rule <PRE_RULE>] \
  --workdir "$AD_OPS_WORKDIR"
```

`apply-slb-plan` 完成后必须停止，要求用户到设备侧验证是否符合预期，并询问是否回滚。用户回复“需要回滚”“回滚”或“是”后，才运行：

```bash
python3 skills/ad-config-ops/scripts/ad_ops_flow.py rollback-and-verify \
  --manifest "$AD_OPS_WORKDIR/adops-rollback.json" \
  --baseline "$AD_OPS_WORKDIR/adops-preflight.json" \
  --host "$AD_HOST" \
  --username "$AD_USERNAME" \
  --workdir "$AD_OPS_WORKDIR"
```

阶段 B/C 成功后必须告诉用户：

- 下发脚本：`$AD_OPS_WORKDIR/apply.py`
- batch：`$AD_OPS_WORKDIR/adops-batch.json`
- 预检 baseline：`$AD_OPS_WORKDIR/adops-preflight.json`
- 有效计划：`$AD_OPS_WORKDIR/adops-effective-plan.json`
- 执行结果：`$AD_OPS_WORKDIR/adops-execute-result.json`
- 下发后 GET：`$AD_OPS_WORKDIR/adops-post-apply.json`
- 回滚脚本：`$AD_OPS_WORKDIR/rollback_apply.py`
- 回滚清单：`$AD_OPS_WORKDIR/adops-rollback.json`
- 回滚后 GET：`$AD_OPS_WORKDIR/adops-post-rollback.json`
- 回滚前后比较：`$AD_OPS_WORKDIR/adops-rollback-compare.json`
- 设备验证结果：`apply-slb-plan` 结果中的 `verify_result`

Rollback safety: `rollback-and-verify` must use the rollback manifest and baseline created by the same `apply-slb-plan` run and the same AD host. A host/plan mismatch is a hard stop.

如果用户在下发后回复“不符合预期”“有问题”等类似内容，必须先提示建议回滚当前下发并重新提交 YAML；禁止继续基于旧 YAML 二次修改或追加下发。用户确认回滚后执行 `rollback-and-verify`，然后回到阶段 A/阶段 B 等待新的 YAML。

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

如果发现结果中 `reusable=true` 且 `selected` 有值，后续 `render_slb_bundle.py` 必须使用 `--http-profile <selected>`，不要新建 XFF Profile。否则才使用 `--create-http-profile-xff <new_name>`。

## 固定输出模板

必须按这个模板输出，不要额外发挥：

```text
## 配置结论
- 目标：<一句话说明用户要生成什么>
- 阶段：<YAML 待填写/脚本已生成/已下发待回滚/已回滚>
- 数据来源：配置计划和设备预检结果
- 设备：<AD1/未下发>

## 执行摘要
- 配置计划：<已生成/失败>
- 同名预检：<无冲突/复用已有资源/失败>
- 下发验证：<未执行/通过/失败>
- 回滚验证：<未执行/一致/不一致>

## 生成产物
| 产物 | 路径 |
| --- | --- |
| YAML/bundle | <路径> |
| plan | <路径> |
| effective_plan | <路径> |
| batch | <路径> |
| 正向脚本 apply.py | <路径> |
| 回滚脚本 rollback_apply.py | <路径> |
| preflight GET | <路径> |
| execute_result | <路径/未执行> |
| post_apply GET | <路径/未执行> |
| rollback manifest | <路径/未执行> |
| post_rollback GET | <路径/未执行> |
| rollback_compare | <路径/未执行> |

## 操作计划
- <method> <path> (<operation id>)

## 安全确认
- 同名资源复用：<无/有，列出 reused_count 和 warning_count>
- 下发状态：<未下发/已下发>
- 设备验证：<未执行/通过/失败>
- 回滚状态：<未执行/已执行>
- 回滚后 GET 与下发前 baseline：<一致/不一致/未执行>

## 下一步
<等待填写 YAML/等待选择“真实下发”或“直接给出脚本”/等待用户决定是否回滚/流程结束>
```

## 通用模板流程

如果用户的资源组合超出 `render_slb_bundle.py` 支持范围，先查 API，再生成模板，用户填好后再规划。不要追问字段；用 YAML 模板承接人工补齐：

```bash
python3 skills/ad-config-ops/scripts/lookup_api.py --skill-root skills/ad-config-ops --query "<intent>" --module <module> --out "$AD_OPS_WORKDIR/adops-lookup.json" --summary
python3 skills/ad-config-ops/scripts/render_bundle_template.py --skill-root skills/ad-config-ops --operation <id> <action> <schema> <document> --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py plan-and-render --skill-root skills/ad-config-ops --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py summarize-plan --plan "$AD_OPS_WORKDIR/adops-plan.json" --workdir "$AD_OPS_WORKDIR"
```

真实设备回滚必须得到用户明确确认。默认下发场景禁止跳过回滚清单生成。
