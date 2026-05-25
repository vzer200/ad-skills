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
- 所有 shell 命令禁止使用 `2>&1` 合并 stderr/stdout；工具平台会单独保存 stderr，用户可见正文也不能复制 stderr/stdout。
- 每个新任务先设置 `AD_OPS_WORKDIR`，然后运行 `init_env.py --confirm-clean`。WorkBot 验收场景允许直接清理旧的 `adops-*` 生成文件。
- R4 阶段 A 禁止纯文字回答。只要用户表达“创建/新增/生成/配置 VS/虚拟服务/SLB/节点池/策略/Profile”等配置意图，第一轮必须真实调用 shell 工具生成 `adops-bundle.yml`；不能先问 VS 名称、VIP、端口、节点、策略细节。

```bash
export AD_OPS_WORKDIR="${AD_OPS_WORKDIR:-./ad_ops_workdir}"
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR" --confirm-clean
python3 skills/ad-config-ops/scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"
```

## R4 固定阶段

### 阶段 A：提示词到 YAML

当用户要求新建、修改或删除 SLB/VS 配置，例如“新增 VS”“修改这套 SLB 配置”“删除这套 SLB 配置”“VS + XFF”“VS + PRE_RULE”“VS + Pool + 节点”“VS 引用已有策略”等，第一步只做 YAML，不追问。

- 阶段 A 第一条 shell 工具调用必须运行 `init_env.py --confirm-clean` 清理上轮残留产物，然后再生成本轮 YAML；禁止跳过清理或把清理挪到阶段 B。
- 常见组合参数能从提示词识别时，使用 `render_slb_bundle.py` 生成 `adops-bundle.yml`。
- 提示词缺字段或组合超出快捷矩阵时，使用下面的 Stage A 通用模板命令生成 `adops-bundle.yml`，让用户人工补齐。不要回复“信息不足”“请补充参数”“VS 名称/VIP/端口是什么”等追问。
- 阶段 A 结束时停止，告诉用户下载生成的 YAML、填写必要内容后重新上传；用户只需回复“我写完了 YAML”即可进入阶段 B。
- 阶段 A 用户可见正文只说明 YAML 产物和下一步，不做计划、不做设备 GET、不下发。
- 阶段 A 用户可见正文必须明确写出目标设备，例如 `设备：AD1` 或 `目标设备：AD1`。
- 阶段 A 必须把 `adops-bundle.yml` 作为可见产出物写在 `## 产出物` 表格里；如果平台支持附件/下载链接，必须让用户能下载该 YAML。

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

如果用户只说“创建虚拟服务，引用节点池、前置策略和 HTTP 优化策略”这类缺少具体字段的需求，必须执行这个通用模板命令，而不是追问：

```bash
export AD_OPS_WORKDIR="${AD_OPS_WORKDIR:-./ad_ops_workdir}"
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR" --confirm-clean
python3 skills/ad-config-ops/scripts/render_bundle_template.py \
  --skill-root skills/ad-config-ops \
  --operation create-http-profile create config.http_profile slb/http-profile.js \
  --operation create-pool create config.pool slb/pool.js \
  --operation create-http-pre-rule create config.pre_rule_http slb/pre-rule/http.js \
  --operation create-virtual-service create config.virtual_service slb/virtual-service.js \
  --out "$AD_OPS_WORKDIR/adops-bundle.yml" \
  --workdir "$AD_OPS_WORKDIR"
cp "$AD_OPS_WORKDIR/adops-bundle.yml" /opt/agent/data/outputs/adops-bundle.yml
```

Stage A 完成后只输出固定模板中的 `配置结论 / 产出物 / 下一步`，不要列字段说明表。

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

`plan-and-render` 和 `preflight-slb-plan` 会把 `adops-bundle.yml`、`apply.py`、`rollback_apply.py` 镜像到 WorkBot outputs 目录，并在 stdout 的 `user_outputs` 字段返回路径。用户可见 `## 产出物` 表格优先使用 `user_outputs` 中的路径；如果 `user_outputs` 为空，再使用 `$AD_OPS_WORKDIR` 内的路径。不能只在正文里声称脚本已生成，必须让用户能在产出物区域看到或按路径拿到三个文件，并说明每个产物的用途。

Preflight safety: create target HTTP 404 means absent and can proceed as a new resource; referenced-existing target HTTP 404 blocks the workflow because the YAML points to a resource that is not present. Any other GET failure blocks before script output or device mutation.
Same-name reuse safety: an existing resource is reused by name and is not overwritten. If the preflight result reports `reuse_compatibility_warning_count > 0`, surface it to the user and require manual review during the device inspection step.

预检后必须让用户二选一，只接受短回复：

- 用户回复“直接给出脚本”“不需要下发”“先不下发”“只要脚本”：输出 `apply.py` 和 `rollback_apply.py`，说明产物用途和如何使用，然后结束；禁止执行 `apply-slb-plan`。
- 用户回复“真实下发”：进入阶段 C。
- 阶段 B 及后续每次用户可见回答都必须在 `## 产出物` 表格里列出 `adops-bundle.yml`、`apply.py` 和 `rollback_apply.py` 三个产物；不能只说“脚本已生成”。

### 只审/撞现网预检

如果用户表达“检查这份 VS 配置会不会撞现网”“只审不下发”“检查同名冲突”“检查是否会覆盖现网”等意图，且当前对话已有用户上传的 YAML 或已经生成的 `adops-bundle.yml`，这是 R4 只读预检流程：

- 必须运行 `plan-and-render`、`summarize-plan`、`preflight-slb-plan`；禁止用 `verify_slb_resource.py` 代替 YAML 计划预检。
- 必须只做 GET 预检，不执行 `apply-slb-plan`、不执行 `rollback-and-verify`。
- 用户可见正文仍然必须使用 `## 配置结论`、`## 产出物`、`## 下一步` 三个标题；不要输出裸表格或命令过程。
- `## 配置结论` 中用一句话说明待新建、复用已有、引用已确认或预检失败；发现同名资源时说明会复用，不要说会覆盖。
- `## 产出物` 至少列出 YAML；如果脚本已经由 `plan-and-render` 生成，也可以列出 `apply.py` 和 `rollback_apply.py`，但不要引导用户下发，除非用户明确回复“真实下发”。

如果用户要求撞现网检查但还没有可用 YAML，必须用固定三段模板提醒用户先上传已填写的 YAML，不能猜配置内容，也不能用上一次无关任务的 YAML 当作本次事实来源。

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

阶段 B/C 成功后必须优先告诉用户这两个脚本产物，不能只列内部 JSON：

- 下发脚本：`$AD_OPS_WORKDIR/apply.py`
- 回滚脚本：`$AD_OPS_WORKDIR/rollback_apply.py`

Rollback safety: `rollback-and-verify` must use the rollback manifest and baseline created by the same `apply-slb-plan` run and the same AD host. A host/plan mismatch is a hard stop.

Delete safety: YAML 中的 `delete` 操作必须包含 `rollback_method` 和 `rollback_path`，否则不能进入下发。删除下发前必须 GET 到待删除对象并保存快照；回滚清单使用保存的快照重建对象。

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
| 修改现有 VS/Pool/Profile/Pre Rule | 使用上传 YAML 中的 `patch` 操作；预检必须确认目标对象存在 |
| 删除现有 VS/Pool/Profile/Pre Rule | 使用上传 YAML 中的 `delete` 操作；每个删除操作必须写明 `rollback_method` 和 `rollback_path` |

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

必须按阶段使用下面的精简模板，不要额外发挥。每次 R4 对用户可见正文必须包含且只围绕 `## 配置结论`、`## 产出物`、`## 下一步` 这三个标题组织。禁止输出 `操作计划`、`计划摘要`、`执行摘要`、`安全确认` 这类长区块；不要列 YAML 字段说明表、字段示例表或“其余字段可按需填写”这类展开说明，字段补齐由 YAML 产物承接；不要列 `batch`、`effective_plan`、`post_apply`、`post_rollback`、`rollback_compare` 等内部文件，除非用户明确要求排障细节。

阶段 A 的可见正文尤其要短：禁止出现 `字段` 表头、`当前占位值`、`TODO_`，也不要逐行列 `name`、`vips`、`vports`、`pool`、`http_profile`、`pre_rules`。只告诉用户“下载 YAML，填写必要内容后上传，并回复我写完了 YAML”。

### 阶段 A：YAML 待填写

```markdown
## 配置结论
- 设备：AD1
- 阶段：等待填写 YAML
- 内容：<虚拟服务、节点池、节点、前置策略、HTTP 优化策略等一句话概括>

## 产出物
| 产物 | 路径 |
| --- | --- |
| YAML 模板 | <adops-bundle.yml 路径> |

## 下一步
下载 YAML，填写必要内容后上传，并回复“我写完了 YAML”。
```

阶段 A 必须在这一步停止，不要继续列 `name/vips/vports/pool/pre_rules/http_profile` 等字段清单、占位值或示例。

### 阶段 B：YAML 已确认，等待选择

```markdown
## 配置结论
- 设备：AD1
- 阶段：脚本已生成，未下发
- 预检：<待新建资源/复用已有资源/引用资源已确认/失败>

## 产出物
| 产物 | 用途 | 路径 |
| --- | --- | --- |
| 正向下发脚本 `apply.py` | 将本次 YAML 对应的配置写入目标 AD 设备 | <apply.py 路径> |
| 回滚脚本 `rollback_apply.py` | 撤销本次正向下发产生的配置变更 | <rollback_apply.py 路径> |
| YAML `adops-bundle.yml` | 本次配置编排源文件，用于复核或重新生成脚本 | <adops-bundle.yml 路径> |

## 下一步
回复“真实下发”执行到设备验证；回复“直接给出脚本”或“不需要下发”则只保留脚本结束。
```

如果用户选择“直接给出脚本”“不需要下发”“先不下发”等脚本模式，也必须使用同样三个标题结束，不要新增“使用方式”标题：

```markdown
## 配置结论
- 设备：AD1
- 阶段：脚本已生成，不下发
- 内容：<一句话概括本次会创建或复用的 SLB 资源>

## 产出物
| 产物 | 用途 | 路径 |
| --- | --- | --- |
| 正向下发脚本 `apply.py` | 将本次 YAML 对应的配置写入目标 AD 设备 | <apply.py 路径> |
| 回滚脚本 `rollback_apply.py` | 撤销本次正向下发产生的配置变更 | <rollback_apply.py 路径> |
| YAML `adops-bundle.yml` | 本次配置编排源文件，用于复核或重新生成脚本 | <adops-bundle.yml 路径> |

## 下一步
- 人工确认要写入设备时，使用正向下发脚本 `apply.py`；脚本默认不会下发，必须显式进入执行模式后才会修改设备。
- 下发后不符合预期或需要撤销时，使用回滚脚本 `rollback_apply.py` 回滚本次变更。
- 两个脚本都要配合同一份 `adops-bundle.yml` 和同一台目标设备使用，不要混用旧产物。
- 流程结束。后续要调整配置，请重新提交 YAML。
```

### 只审/撞现网：预检完成，不下发

```markdown
## 配置结论
- 设备：AD1
- 阶段：预检已完成，未下发
- 预检：<待新建资源/复用已有资源/引用资源已确认/失败；如无同名冲突，直接写无冲突>

## 产出物
| 产物 | 路径 |
| --- | --- |
| YAML | <adops-bundle.yml 路径> |

## 下一步
本次只做现网冲突检查，不下发。若确认要执行，请回复“真实下发”；否则流程结束。
```

### 阶段 C：已下发，等待人工确认

```markdown
## 配置结论
- 设备：AD1
- 阶段：已下发，等待确认是否回滚
- 设备验证：<通过/失败>

## 产出物
| 产物 | 用途 | 路径 |
| --- | --- | --- |
| 正向下发脚本 `apply.py` | 本次已执行的正向下发脚本 | <apply.py 路径> |
| 回滚脚本 `rollback_apply.py` | 用于撤销本次下发 | <rollback_apply.py 路径> |
| YAML `adops-bundle.yml` | 本次配置编排源文件 | <adops-bundle.yml 路径> |

## 下一步
请到设备侧确认配置是否符合预期；需要回滚请回复“是”或“需要回滚”。
```

### 阶段 D：已回滚/流程结束

```markdown
## 配置结论
- 设备：AD1
- 阶段：已回滚
- 回滚验证：<与下发前一致/不一致>

## 产出物
| 产物 | 用途 | 路径 |
| --- | --- | --- |
| 正向下发脚本 `apply.py` | 本次正向下发脚本，保留用于追溯 | <apply.py 路径> |
| 回滚脚本 `rollback_apply.py` | 本次回滚脚本，保留用于追溯 | <rollback_apply.py 路径> |
| YAML `adops-bundle.yml` | 本次配置编排源文件 | <adops-bundle.yml 路径> |

## 下一步
流程结束。后续要调整配置，请重新提交 YAML。
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
