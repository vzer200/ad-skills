---
name: ad-config-ops
description: >
  用于用户要基于深信服 AD/ADC/SLB API 创建、修改、删除或生成配置模板/脚本，尤其是虚拟服务、节点池、节点、前置策略、HTTP 优化策略、命令行脚本或 WorkBot R4 配置。
---

# ad-config-ops

## WorkBot R4 漂移防护

- R4 是 YAML-first 流程。创建、修改、删除请求的第一阶段只生成 YAML 模板；不要在聊天里收集 VIP、端口、节点、节点池成员、匹配条件、优先级或优化策略字段。
- 如果当前请求完全或大致等同于 `在 AD1 上帮我创建虚拟服务、节点池、前置策略和 http 优化策略。`，本 skill 已经命中；不要说请求过于模糊，不要询问虚拟服务类型或前置策略类型，直接发布选择型 YAML 模板。
- 选择型 YAML 使用 `resource_family`、`variant_field` 和 payload 中的 `service` 字段表达类型。默认示例可以是 HTTP；如果用户要改成 TCP/UDP 等类型，让用户在 YAML 中修改，而不是在聊天中追问。
- 如果你正准备询问类型、VIP、端口、节点、Pool 成员、URL/Host 匹配条件、连接复用/压缩/缓存等业务字段，立刻停止，并改按下面的 WorkBot R4 固定入口发布 YAML。
- R4 节点池节点优先级固定入口：如果当前 WorkBot 消息匹配 `修改节点池中节点的优先级`、`修改节点池.*优先级` 或 `pool node priority`，必须先于通用 modify/patch 参数收集处理。这个阶段 A 固定入口只发布可填写 YAML 模板；不要连接设备，不要运行 `lookup_api.py`，不要运行 `prepare_edit_template.py`，不要检查已有节点池，也不要询问节点池、节点或优先级字段。节点池名称、节点列表和 `priority_level` 都是由操作员填写或上传的 YAML 字段；阶段 B 在收到填写完成的 YAML 后再执行只读预检和脚本生成。
- 固定入口第一条答复直接发布 YAML；可见答复必须严格使用下面的形态，`## 配置结论` 之前不要添加任何前言：
```text
## 配置结论
AD1 的 YAML 模板已生成；当前只生成模板，未连接设备，未下发。
## 产出物
/opt/agent/data/outputs/adops-bundle.yml
## 下一步
请下载并填写该 YAML。虚拟服务和前置策略类型在 YAML 的 service 字段中选择；填好后上传并回复“我写完了 YAML”。
```

## 核心规则

- 以项目内 skill 源码 `skills/ad-config-ops/` 为准。
- 除非用户明确要求同步 AD-OPS，否则不要同步、安装、写入或覆盖任何全局 Codex skill 目录。
- 忽略已有的同类全局 skill；它不是本项目的实现来源。
- WorkBot R4 固定入口必须先于通用参数收集处理：如果用户说 `在 AD1 上帮我创建虚拟服务、节点池、前置策略和 http 优化策略。`，不要询问虚拟服务类型、前置策略类型、VIP、端口、后端节点、匹配规则、转发目标或 HTTP 优化策略字段值。立即运行固定 YAML 发布命令块，复制 `templates/r4/vs-pool-pre-rule-http-profile-select.yml` 并发布 `adops-bundle.yml`。
- WorkBot R4 节点池节点优先级固定入口必须先于通用 modify/patch 参数收集处理：如果用户说 `修改节点池中节点的优先级`、`在 AD1 上帮我修改节点池 internet_http_pool 中节点的优先级。`，或使用匹配 `修改节点池.*优先级` / `pool node priority` 的说法，不要先询问节点池名称、节点名称/地址或优先级值。不要连接 AD1，不要查询节点池，也不要在阶段 A 运行 lookup/prepare-edit。立即清理运行目录和输出目录，并将 `templates/r4/pool-node-priority-update.yml` 发布为 `/opt/agent/data/outputs/adops-bundle.yml`。
- CLI 覆盖规则：如果当前用户消息要求 `命令行`、`CLI`、`sfcli`、`apply.sfcli`、`命令行脚本`、`离线命令` 或 `可粘贴命令`，立即转交 `sangforad-cli`。不要运行阶段 B API 脚本块，不要运行 `ad_ops_flow.py plan-and-render`，不要运行 `ad_ops_flow.py summarize-plan`，不要发布 `apply.py`/`rollback_apply.py`，也不要运行 `apply-slb-plan` 或 `rollback-and-verify`。WorkBot R4 CLI 仍可运行 `connect.py` 加只读 `preflight-slb-plan`；CLI 计划必须由 `sangforad-cli/scripts/render_cli.py --bundle ... --plan-out ... --plan-only` 构建，因此预检前不渲染 `apply.sfcli`，已有资源可复用，回滚 CLI 可从快照生成。
- 默认只生成产物。除非用户接受真实设备验证，否则不要执行真实下发、回滚或其他会修改设备的操作。WorkBot R4 阶段 B 和 CLI 分支中的只读连接预检、同名资源预检属于脚本生成前置校验，可以直接按 R4 命令块执行，不需要额外询问。
- 生成脚本和 batch JSON 后，非 WorkBot R4 流程必须询问是否进入真实设备验证；WorkBot R4 阶段 B 已明确要求只读预检和直接给出脚本用法，不再询问是否预检或是否给脚本。
- 如果用户要求验证但没有给设备别名，只收集设备地址和用户名/密码或 token。默认使用 HTTPS、`verify=False` 和 Basic Auth。
- 如果用户说使用 `devices.json`、给出 `AD1` 这类设备别名，或要求复用打包设备列表，就把 `--devices devices.json --device <alias>` 传给设备脚本；不要打开、打印或手工复制 `devices.json` 中的密钥。如果文件中有多个设备且用户没有选择，询问设备别名。
- WorkBot R4 流程只要提到 `AD1` 或 `AD2`，就必须使用打包设备文件，不得询问账号、密码、主机、token 或凭据确认。WorkBot 命令示例和最终答复只展示 `--devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1` 或匹配别名；不要展示 `--host`、`--username`、`--password`，不要提示交互式输入密码。
- 本 skill 中可连接设备的脚本是 `execute_plan.py`、`rollback.py`、`prepare_edit_template.py` 和 `interface_adapter.py`；它们都支持 `--devices <path> --device <name>`。`--host` 可以是 `192.168.8.30` 或 `https://192.168.8.30`。
- `verify=False` 是已批准的 AD 设备集成流程中的刻意默认值。
- 当前 `scripts/execute_plan.py` 预览模式只做离线计划预览；不会连接设备、询问凭据、执行预检 GET 或修改设备。
- 不要声称存在单独的只读设备预检模式，除非它已经实现。
- 每个新的 AD-OPS 创建、modify/patch/replace 或删除流程，都必须从 `scripts/init_env.py` 初始化运行文件环境开始；这是 lookup、模板生成、计划、渲染、验证、下发或回滚前的第一步。
    - 在 WorkBot 中，`AD_OPS_WORKDIR` 保持为内部运行目录，例如 `/tmp/ad-ops-workdir`；`/opt/agent/data/outputs` 只用于用户可下载产物。
    - 在 WorkBot 中，流程初始化必须先清理 `/opt/agent/data/outputs`，避免早先提示词留下的旧文件继续可下载。
    - WorkBot 的纯模板阶段，`/opt/agent/data/outputs` 只能包含可下载的 `adops-bundle.yml`；不要留下 lookup JSON、artifact JSON、env 文件、脚本或其他 AD-OPS 内部文件。
    - WorkBot 之外运行任何 AD-OPS 脚本前，先设置 `AD_OPS_WORKDIR`。如果宿主没有提供工作目录，使用 `./ad_ops_workdir`。
- 每个流程开始时只运行一次 `init_env.py`。同一流程中，用户上传或填写完 YAML 后不要再次运行它，否则会擦掉当前流程产物。
- 所有 AD-OPS 脚本都必须传入 `--workdir "$AD_OPS_WORKDIR"`。
- 面向用户的文件、生成计划、脚本、结果和回滚文件都创建在 `AD_OPS_WORKDIR` 下；WorkBot 中只把用户需要下载的产物复制到 `/opt/agent/data/outputs`。
- 不要在 `AD_OPS_WORKDIR` 内再创建嵌套工作目录。
- 默认情况下，可能输出大量内容的脚本应写文件并只打印简短 JSON 摘要。使用明确的 `--json`、`--summary`、`--out`、`--result-out` 或 `--workdir` 参数，不要把大段 stdout 交回模型。
- 所有 shell 命令禁止使用 `2>&1` 合并 stdout/stderr；不要运行 `ad_ops_flow.py --help`，不要为了查看 `--help` 加管道、`head` 或重定向。不要用 `ls`、`head`、`grep`、`cat` 或 `python -c` 探索脚本/产物。需要了解下一步时运行本 skill 明确列出的命令，或运行 `ad_ops_flow.py status`。
- 修改场景的 edit-template 准备和真实设备快照/验证 GET，只获取被选中的资源路径，并包含 `all_properties=true`，确保设备返回全部配置字段。
- 修改设备前，先展示操作计划、预检、验证字段和回滚计划。
- 不要要求第二次下发确认。只要用户明确要求真实设备验证或下发，并提供当前运行所需凭据，就足以批准 apply 流程，包括计划内的 POST、PATCH、PUT、DELETE 或下游变更。
- 脚本自验证成功后，请用户从设备侧或业务侧验证。
- 用户确认结果正确后，询问保留还是回滚本次配置。不要要求第二次回滚确认；用户要求回滚时，直接运行回滚流程。
- 最终面向用户的完成摘要中，只把 `apply.py` 作为可复用产物：说明它是自包含 apply 脚本，并给出准确命令格式。除非用户明确询问回滚内部产物，否则不要把 `adops-rollback.json` 这类回滚产物作为最终用户产物展示。

## 确定性护栏

- 脚本和文件是事实来源。不要使用聊天历史、之前轮次、旧产物或记忆中的值作为设备状态、API 输出、payload 内容、schema 字段、枚举值、验证结果或回滚状态。
- 每个新的创建、modify/patch/replace 或删除请求都是新的歧义范围。除非用户在当前请求中明确重复资源类型，否则不要把早先流程的资源类型澄清答案带入当前流程。
- lookup 前不要把当前模糊请求改写成带类型的查询。例如当前请求是 `创建虚拟服务，节点池，前置策略和http优化策略` 时，`http` 只决定 HTTP 优化配置，不决定虚拟服务类型或前置策略类型。WorkBot R4 阶段 A 遇到这种变体歧义时，不在聊天中追问类型；使用选择型 YAML 的 `resource_family`、`variant_field` 和 payload 判别字段表达可选类型。只有资源族本身无法确定、无法用 YAML 选择字段表达时，才询问澄清项。
- 生成产物是不透明机器文件。除非正在调试 AD-OPS 实现本身，否则不要打开、cat、sed、grep、总结、解析或粘贴生成的 bundle、plan、batch、apply、result 或 rollback 产物给模型分析。
- 用脚本 JSON 摘要和 `AD_OPS_WORKDIR/adops-artifacts.json` 在步骤之间传递文件路径。除非调试 AD-OPS 本身，否则不要读取、粘贴或总结生成的 bundle、plan、batch、apply、result 或 rollback 文件。
- 不要要求其他模型、工具或 agent 解析 AD-OPS 中间文件。需要信息时，运行 `scripts/ad_ops_flow.py status`、`scripts/ad_ops_flow.py summarize-plan`、`scripts/execute_plan.py` 或 `scripts/rollback.py`，只使用它们的简短 JSON stdout 摘要。
- 不要跨用户请求复用已有的 `adops-plan.json`、`adops-batch.json`、`apply.py`、`adops-execute-result.json` 或 `adops-rollback.json`。新模板填写完成或新的设备读取被批准后，必须基于 `AD_OPS_WORKDIR` 下当前 bundle 文件重新生成下游产物。
- 所有内部生成文件必须使用 `adops-` 前缀。`apply.py` 是唯一面向用户的可复用例外；清理逻辑仍把它视为 AD-OPS 生成文件。
- WorkBot 创建、修改、删除流程中，必须通过 `init_env.py --confirm-clean --clean-output-dir` 自动清理旧生成文件。WorkBot 之外，如果 `init_env.py` 在任务开始时报告残留 AD-OPS 生成产物，询问用户是否删除；用户同意则用 `--confirm-clean` 重新运行，用户拒绝则停止任务并说明必须先清理 workdir。
- 除非用户在当前运行中明确重新提供或明确要求复用，否则不要复用以前的设备地址、用户名、密码或 token。
- 不要猜测 API 路径、schema、请求方法、路径参数、枚举值或必填字段。按需运行 `lookup_api.py`、`resolve_schema.py`、`render_template.py`、`render_bundle_template.py`、`prepare_edit_template.py` 和 `plan_operations.py`。
- `lookup_api.py` 在评分前有确定性精确匹配层：如果 `references/search/search-map-effective.json` 中的 `exact_terms` 命中用户请求，返回结果会带有 `match_source: exact`，必须信任它而不是评分候选。增删精确匹配词只能通过 `references/search/search-map-overrides.json`；生成的审计文件是 `references/search/exact-match-review.yml`。
- 如果 `lookup_api.py` 返回 `needs_clarification`，先判断澄清类型。`reason: ambiguous_variant_family` 这类变体族澄清（例如虚拟服务或前置策略的 `service` 类型）在 WorkBot R4 阶段 A 中应转成选择型 YAML，不要追问；YAML 后续由 `plan_operations.py` 根据 `resource_family`、`variant_field` 和 payload 判别字段选择具体 schema/document。`reason: ambiguous_resource_family` 这类资源族澄清（例如网口或监视器）仍需停止并询问返回的问题和选项。如果结果包含必须询问的 `clarifications`，在一条用户消息中一次性询问所有问题和选项块；不要只问第一个歧义。
- 澄清答案只对提出该澄清的流程有效。如果后续用户消息开启新流程且省略资源族，必须重新询问。对 WorkBot R4 可由 YAML `service` 字段表达的变体类型，不要求用户在聊天中重复确认。
- 如果 `lookup_api.py` 返回选中项且包含 `preset_fields`，把每个预设传给模板生成，例如 `--preset service=HTTP`；不要要求用户填写已经确定的变体字段。
- 如果用户对澄清回答了具体资源类型，例如 `HTTP`，则为每个受影响操作选择匹配的拆分文档，例如 `slb/virtual-service/http.js` 和 `slb/pre-rule/http.js`。这些文档必须在 payload 中渲染 `service: HTTP`。
- 模板渲染会自动从选中的 schema/document 预填顶层单值 `service` 或 `type` 判别字段，因此用户无需填写 lookup 或澄清已确定的类型。
- 对模板中包含 `interface` 或 `interfaces` 字段的网络资源，不要猜可用的物理口、Bond、VLAN 或 Bridge 接口名。如果用户希望设备辅助，运行 `scripts/interface_adapter.py`，只用它的简短 JSON 摘要展示候选 `interface.type` 和 `interface.interface` 填写提示。
- 多操作 bundle 必须由脚本做依赖排序，不由模型判断。`render_bundle_template.py`、`plan_operations.py` 和 `ad_ops_flow.py` 使用 `scripts/dependency_order.py` 以及 `references/recipes/slb-basic.json`，覆盖 `references/api-index.json` 中当前所有 SLB 可写资源前缀：create/patch/replace 会先按用户顺序放置未排序外部资源，再按依赖顺序放置 SLB 资源；delete 会先按反向依赖顺序放置 SLB 资源，再按用户逆序放置未排序外部资源。如果脚本报告混合 delete 和非 delete 操作，停止并报告错误。
- 如果脚本失败，停止并报告简短错误。不要手工编造 payload、plan、batch、result、rollback manifest 或验证结论来绕过失败。
- 脚本打印 JSON 摘要时，依赖该摘要和 `adops-artifacts.json` 获取路径。除非验证/调试确实需要，否则不要粘贴或检查大文件。
- 不确定下一步时，运行 `scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"`，并遵循 `workflow_contract`；不要从文件内容自行推断下一步。
- 对真实设备，只把当前已批准脚本运行返回的数据视为当前设备状态。修改流程中的当前状态必须来自 `prepare_edit_template.py`，或来自 `execute_plan.py` 内部预检 GET；两者都使用 `all_properties=true`。
- WorkBot R4 中，绝不要用 `cat`、`grep`、`head`、`sed` 或 `python -c` 打开或解析 `adops-lookup.json`；使用刚运行的 `lookup_api.py --summary` 命令 stdout 中的 JSON。如果需要再次查看摘要，重新运行 `lookup_api.py --summary` 并读取 stdout。

## WorkBot R4 用户可见合同

- R4 最终可见答复必须严格使用这些紧凑标题：`## 配置结论`、`## 产出物`、`## 下一步`。不要把 `操作计划`、`计划摘要`、`执行摘要`、`安全确认` 作为可见标题。
- 可见答复不要展示内部子命令名（`init_env.py`、`ad_ops_flow.py`、`lookup_api`、`plan-and-render`、`summarize-plan`、`preflight-slb-plan`、`apply-slb-plan`、`rollback-and-verify`）或调试词（`阶段 A`、`阶段 B`、`lookup 结果`、`fixed-prompt`、`SKILL.md`、`根据 SKILL.md`、`固定入口规则`）。这些只允许出现在工具命令或工具折叠详情里；面向用户用中文短语说明“已完成模板生成 / 计划渲染 / 只读预检 / 真实下发 / 回滚校验”。
- R4 可见答复必须直接从 `## 配置结论` 开始；不要添加 `用户的请求正是...` 或 `按照 SKILL.md...` 这类解释性前言。
- 阶段 A（用户提出创建/修改/删除意图）只生成并发布 `adops-bundle.yml`。如果只是虚拟服务、前置策略这类可由 YAML 判别字段表达的类型歧义，不询问，直接生成选择型 YAML；如果资源族本身无法确定，才先询问澄清项。用户回答后，运行 `init_env.py --confirm-clean --clean-output-dir` 并渲染 YAML。阶段 A 不运行 `plan-and-render`、`preflight-slb-plan`、`apply-slb-plan` 或 `rollback-and-verify`。
- 阶段 A 可见答复不得打印 YAML 字段表、必填字段表、占位值、截取的 YAML 片段或“至少填好以下字段”风格的字段列表。只说明可下载 YAML 已准备好，并提示用户填写。
- 命中 R4 节点池节点优先级固定入口（`修改节点池中节点的优先级`、`修改节点池.*优先级`、`pool node priority`）时，不走通用修改流程，不询问设备、节点池、节点或优先级字段；即使文本已包含 `AD1` 或 `internet_http_pool`，也先发布模板，不连接设备、不读取现网状态。运行以下阶段 A 命令块：
```bash
export AD_OPS_WORKDIR="/tmp/ad-ops-workdir"
export AD_OPS_OUTPUT_DIR="/opt/agent/data/outputs"
cd /root/.zeroclaw/workspace
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR" --confirm-clean --clean-output-dir
cp skills/ad-config-ops/templates/r4/pool-node-priority-update.yml "$AD_OPS_WORKDIR/adops-bundle.yml"
cp "$AD_OPS_WORKDIR/adops-bundle.yml" "$AD_OPS_OUTPUT_DIR/adops-bundle.yml"
test -f "$AD_OPS_OUTPUT_DIR/adops-bundle.yml"
```
- 发布节点优先级 YAML 后，可见答复必须从 `## 配置结论` 开始，说明当前只生成 YAML 模板；`## 产出物` 只列 `/opt/agent/data/outputs/adops-bundle.yml`。提示用户下载、填写、上传 YAML，并回复 `我写完了 YAML。`，之后再进入正常 YAML 完成后的脚本生成和只读预检流程。
- 固定提示为 `在 AD1 上帮我创建虚拟服务、节点池、前置策略和 http 优化策略。` 时，将四个资源都视为要新建的资源。阶段 A 不询问虚拟服务或前置策略类型，直接发布选择型 YAML；YAML 中的 `service` 字段用于选择类型，默认示例为 HTTP。
- 使用下面的精确命令块生成 YAML：
```bash
export AD_OPS_WORKDIR="/tmp/ad-ops-workdir"
export AD_OPS_OUTPUT_DIR="/opt/agent/data/outputs"
cd /root/.zeroclaw/workspace
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR" --confirm-clean --clean-output-dir
cp skills/ad-config-ops/templates/r4/vs-pool-pre-rule-http-profile-select.yml "$AD_OPS_WORKDIR/adops-bundle.yml"
cp "$AD_OPS_WORKDIR/adops-bundle.yml" "$AD_OPS_OUTPUT_DIR/adops-bundle.yml"
test -f "$AD_OPS_OUTPUT_DIR/adops-bundle.yml"
```
- 发布 YAML 后，可见答复必须使用下面的形态；不要列出字段名、枚举列表、文件大小或内部命令名：
```text
## 配置结论
AD1 的 YAML 模板已生成；当前只生成模板，未连接设备，未下发。
## 产出物
/opt/agent/data/outputs/adops-bundle.yml
## 下一步
请下载并填写该 YAML。虚拟服务和前置策略类型在 YAML 的 service 字段中选择；填好后上传并回复“我写完了 YAML”。
```
- 这个 YAML 发布步骤中，不要运行 `ls`、`grep`、`head`、`cat`、`sed` 或 `python -c` 去检查 `/opt/agent/data/outputs`；用 `cp` 发布，如需保护性检查，只使用 `test -f "$AD_OPS_OUTPUT_DIR/adops-bundle.yml"`。
- CLI 覆盖规则的优先级高于所有阶段 B API/Python 脚本规则。如果同一条 YAML 完成回复要求 `生成命令行脚本`、`CLI`、`sfcli`、`apply.sfcli` 或其他命令行相关表达，不要运行 `ad_ops_flow.py plan-and-render`，不要运行 `ad_ops_flow.py summarize-plan`，不要运行阶段 B API 命令块，也不要发布 `apply.py` 或 `rollback_apply.py`。转交 `sangforad-cli`；这次答复的用户可见产出物是 `/opt/agent/data/outputs/apply.sfcli` 和 `/opt/agent/data/outputs/rollback.sfcli`，并附带紧凑的只读预检结果。
- CLI 覆盖规则中，不要拿上传的 YAML 和之前的阶段 A 模板比较，也不要因为动作或资源类型变化而拒绝它。带有顶层 `operations:` 的 YAML bundle 是当前回复的有效 CLI 输入。转交 `sangforad-cli`，由 CLI 只读预检验证创建复用、patch 目标存在性和回滚快照。
- 非 CLI 的阶段 B（用户上传填写后的 YAML 并表示已完成，但没有要求 CLI/命令行）必须运行 `ad_ops_flow.py plan-and-render`、`ad_ops_flow.py summarize-plan`，随后运行 `ad_ops_flow.py preflight-slb-plan --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1`。脚本模式下，不要再询问 `是否下发` 或 `是否给脚本` 这类第二个问题；立即展示三个产出物和离线预览/下发/回滚命令格式。命令 token 使用 `preflight-slb-plan`，不要替换成 `execute_plan.py` preview。
- WorkBot 阶段 B 命令必须逐字复制下面的命令块；不要省略 `--skill-root`，不要调用 `--help`，也不要检查生成文件：
```bash
export AD_OPS_WORKDIR="/tmp/ad-ops-workdir"
export AD_OPS_OUTPUT_DIR="/opt/agent/data/outputs"
cd /root/.zeroclaw/workspace
cp /opt/agent/data/inputs/<uploaded-yaml-name>.yml "$AD_OPS_WORKDIR/adops-bundle.yml"
cp "$AD_OPS_WORKDIR/adops-bundle.yml" "$AD_OPS_OUTPUT_DIR/adops-bundle.yml"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py plan-and-render --skill-root skills/ad-config-ops --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py summarize-plan --plan "$AD_OPS_WORKDIR/adops-plan.json" --workdir "$AD_OPS_WORKDIR"
cp "$AD_OPS_WORKDIR/apply.py" "$AD_OPS_OUTPUT_DIR/apply.py"
cp "$AD_OPS_WORKDIR/rollback_apply.py" "$AD_OPS_OUTPUT_DIR/rollback_apply.py"
python3 skills/ad-connect/scripts/connect.py --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1 --format json
python3 skills/ad-config-ops/scripts/ad_ops_flow.py preflight-slb-plan --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1 --workdir "$AD_OPS_WORKDIR"
```
- 阶段 B 必须把三个用户产出物镜像到 `/opt/agent/data/outputs`：`adops-bundle.yml`、`apply.py`、`rollback_apply.py`。可见的 `## 产出物` 区段必须列出这三个真实文件。
- 阶段 B 命令块前后不要额外运行 `ls`、`head`、`grep`、`cat`、`sed`、`python -c` 或 `2>&1` 命令。三个 `cp` 命令和 flow JSON 摘要已经是足够证据。
- 阶段 B 只读预检后，可见答复只能使用中文状态名，不得提到 `plan-and-render`、`summarize-plan`、`preflight-slb-plan`、`apply-slb-plan` 或 `rollback-and-verify`。必须直接给出脚本用法；不要要求用户回复 `直接给出脚本`：
```text
## 配置结论
AD1 的计划已渲染并完成只读预检；当前未下发。预检结果：<同名/复用/待新建/失败摘要>。
## 产出物
/opt/agent/data/outputs/adops-bundle.yml
/opt/agent/data/outputs/apply.py
/opt/agent/data/outputs/rollback_apply.py
## 下一步
运行离线预览：
python3 /opt/agent/data/outputs/apply.py --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1 --dry-run
执行真实下发：
python3 /opt/agent/data/outputs/apply.py --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1 --execute
执行回滚脚本：
python3 /opt/agent/data/outputs/rollback_apply.py --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1 --execute
```
- `直接给出脚本`、`先不下发`、`不需要下发` 这类只给脚本回复不得调用下发或回滚流程；必须保持上面相同的三个产出物和三条命令结构。不要展示 `--host`、`--username`，不要提示交互式输入密码，不要写“我不会调用某内部命令”这种否定式内部说明。
- 阶段 B 之后的只给脚本可见文本不得写“未连接设备”，因为只读预检已经连接过 AD1；只写“已完成只读预检，未下发”。
- `真实下发` 这类交付回复必须在预检后运行 `ad_ops_flow.py apply-slb-plan --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1`，写入回滚产物，列出同样三个产出物，然后请用户验证并决定是否回滚。
- 回滚回复必须在用户明确确认回滚后运行 `ad_ops_flow.py rollback-and-verify --devices /root/.zeroclaw/workspace/skills/ad-config-ops/devices.json --device AD1`。

## 可执行流程

从仓库根目录运行。下面每一步都标明负责该行为的脚本；不要用模型侧解析、手工 payload 或早先轮次记忆替代脚本调用。

运行任何 AD-OPS 命令前，先设置运行目录。在 WorkBot 中，运行内部文件必须放在可下载 outputs 目录之外：

```bash
export AD_OPS_WORKDIR="${AD_OPS_WORKDIR:-/tmp/ad-ops-workdir}"
export AD_OPS_OUTPUT_DIR=/opt/agent/data/outputs
```

如果其他宿主产品提供工作目录，将 `AD_OPS_WORKDIR` 设置为该路径；否则使用本地默认值：

```bash
export AD_OPS_WORKDIR="${AD_OPS_WORKDIR:-./ad_ops_workdir}"
```

### 步骤 0：初始化运行环境

目的：在任何 lookup、模板、计划、下发或回滚工作之前，创建当前流程的产物契约并清理旧 AD-OPS 文件。每个创建、modify/patch/replace 和删除流程都必须执行该步骤。

每个新的 WorkBot 创建/修改/删除流程开始时运行一次：

```bash
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR" --confirm-clean --clean-output-dir
python3 skills/ad-config-ops/scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"
```

`init_env.py` 会清理 `AD_OPS_WORKDIR` 中的生成产物和 WorkBot 可下载输出目录。步骤 0 之后，直到当前流程发布所需产物前，`/opt/agent/data/outputs` 必须为空。

WorkBot 之外，每个新流程开始时运行一次：

```bash
python3 skills/ad-config-ops/scripts/init_env.py --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py status --workdir "$AD_OPS_WORKDIR"
```

如果非 WorkBot 命令报告存在残留生成产物，询问用户是否删除。用户同意时，使用 `--confirm-clean` 重新运行；用户拒绝清理时，停止任务。同一流程后续不要为了切换文件再次运行 `init_env.py`；应使用 `AD_OPS_WORKDIR/adops-artifacts.json` 中的路径。

### 步骤 1：解析 API

目的：把用户意图映射到 API 文档路径和 schema。不要猜 API 路径、schema 名称、枚举值或可写字段。

运行 lookup，只使用简短 JSON 摘要和被选中文件路径：

```bash
python3 skills/ad-config-ops/scripts/lookup_api.py --skill-root skills/ad-config-ops --query "<intent>" --module <module> --out "$AD_OPS_WORKDIR/adops-lookup.json" --summary
```

如果 lookup 返回带有 `match_source: exact` 的匹配结果，优先使用这些精确匹配；不要用评分 fallback 候选替代。例如：`HTTP虚拟服务` 直接映射到 `slb/virtual-service/http.js`，`ICMP监视器` 直接映射到 `slb/service-monitor/icmp.js`，`节点池` 直接映射到 `slb/pool.js`。

如果 lookup 返回 `needs_clarification`，停止流程，并询问 lookup 摘要返回的问题和选项。当摘要或保存的 lookup 结果包含 `clarifications` 时，一次性展示所有 `clarifications` 块，形成紧凑选择模板，并要求用户为每个块选择一个精确选项。`multiple_ambiguities` 表示用户请求包含多个模糊资源族或字段变体。所有返回澄清都有精确用户选择前，不要生成模板；只有精确资源或变体明确后，才重新运行 lookup 或模板生成。`ambiguous_resource_family` 表示资源族，例如网口或监视器。`ambiguous_variant_family` 表示变体族，例如虚拟服务 service 类型。

如果 lookup 在选中匹配中返回 `preset_fields`，把每个键值对转换为模板 preset。对 HTTP 虚拟服务这类拆分文档，直接使用选中文档；模板渲染器会预填其单值 `service` 字段：

```bash
python3 skills/ad-config-ops/scripts/render_template.py --skill-root skills/ad-config-ops --schema config.virtual_service --document slb/virtual-service/http.js --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

步骤 1 之后按意图分支。如果请求是修改、patch、replace 或 edit，运行步骤 2 并跳过步骤 3。如果请求是创建，运行步骤 3 并跳过步骤 2。

### 步骤 2：修改现有配置

目的：任何修改、patch、replace 或 edit 请求，都必须先获取当前对象，并基于真实设备状态生成编辑模板。

询问是否连接真实设备读取选中对象。只收集设备地址和用户名/密码或 token。修改请求不要渲染空白模板。

用户批准读取后运行：

```bash
python3 skills/ad-config-ops/scripts/prepare_edit_template.py --skill-root skills/ad-config-ops --schema <schema> --document <document> --name <object-name> --host <ad-host:port> --username <user> --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

用户从 `devices.json` 选择设备时，使用 `--devices devices.json --device <alias>`，不要使用 `--host/--username/--password`。用户提供 token 时，使用 `--token <token>`，不要使用 `--username <user>`。脚本会对选中资源执行一次带 `all_properties=true` 的 GET，然后按 API schema 顺序写出全字段 bundle YAML，默认 `action: patch`。提示用户编辑 `"$AD_OPS_WORKDIR/adops-bundle.yml"`，并停止等待用户说已经填好。

### 步骤 3：生成创建模板

目的：只针对创建请求，按 API 文档顺序生成面向客户的全字段 YAML 模板。

单资源：

```bash
python3 skills/ad-config-ops/scripts/render_template.py --skill-root skills/ad-config-ops --schema <schema> --document <document> --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

多资源变更：使用重复的 `--operation <id> <action> <schema> <document>` 参数生成一个 bundle 文件：

```bash
python3 skills/ad-config-ops/scripts/render_bundle_template.py --skill-root skills/ad-config-ops --operation <id> <action> <schema> <document> --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

用户已经澄清类型时，为每个受影响操作追加 `KEY=VALUE` preset。下面是创建 HTTP 节点池、HTTP 前置策略和 HTTP 虚拟服务的示例：

```bash
python3 skills/ad-config-ops/scripts/render_bundle_template.py --skill-root skills/ad-config-ops \
  --operation pool1 create config.pool slb/pool.js \
  --operation policy1 create config.pre_rule_http slb/pre-rule/http.js \
  --operation vs1 create config.virtual_service slb/virtual-service/http.js \
  --out "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
```

WorkBot 纯模板阶段，只把 bundle YAML 发布到可下载 outputs 目录：

```bash
mkdir -p "$AD_OPS_OUTPUT_DIR"
find "$AD_OPS_OUTPUT_DIR" -maxdepth 1 -type f \( -name 'adops-*' -o -name 'apply.py' -o -name 'rollback_apply.py' -o -name 'apply.sfcli' -o -name 'rollback.sfcli' \) -delete
cp "$AD_OPS_WORKDIR/adops-bundle.yml" "$AD_OPS_OUTPUT_DIR/adops-bundle.yml"
```

提示用户在 WorkBot 中填写 `"$AD_OPS_OUTPUT_DIR/adops-bundle.yml"`，或在 WorkBot 之外填写 `"$AD_OPS_WORKDIR/adops-bundle.yml"`，然后停止等待用户说已经填好。不要读取或总结 YAML 文件内容。

对于网络接口/链路资源，在用户填写模板前提供可选的设备侧接口辅助。这是只读操作，但仍会连接真实设备，因此先询问是否查询可用接口，并只收集设备地址和用户名/密码或 token。用户批准后运行：

```bash
python3 skills/ad-config-ops/scripts/interface_adapter.py --document <document> --host <ad-host:port> --username <user> --workdir "$AD_OPS_WORKDIR"
```

用户从 `devices.json` 选择设备时，使用 `--devices devices.json --device <alias>`，不要使用 `--host/--username/--password`。适用时使用 `--token <token>`，不要使用 `--username <user>`。脚本会把已知文档映射到 adapter 模块，包括 `net/link/lan.js -> net/link/lan/interface`、`net/link/wan.js -> net/link/wan/interface`、`net/link/pppoe.js -> net/link/pppoe/interface`、`net/bond.js -> net/bond/interfaces`、`net/vlan.js -> net/vlan/interface` 和 `net/bridge.js -> net/bridge/interfaces`。它会写出 `"$AD_OPS_WORKDIR/adops-interface-adapter.json"`，并打印带 `fill_hints` 的简短摘要；使用这些提示告诉用户如何填写 `interface.type` 和 `interface.interface`。除非调试 AD-OPS 本身，否则不要打开或解析 `adops-interface-adapter.json`。

### 步骤 4：计划并渲染

目的：校验填写后的 bundle，裁剪未填写模板占位，按依赖排序操作，并在不把大文件加载进对话的情况下渲染可复用输出。

用户说 bundle 已填好后运行：

```bash
python3 skills/ad-config-ops/scripts/ad_ops_flow.py plan-and-render --skill-root skills/ad-config-ops --bundle "$AD_OPS_WORKDIR/adops-bundle.yml" --workdir "$AD_OPS_WORKDIR"
python3 skills/ad-config-ops/scripts/ad_ops_flow.py summarize-plan --plan "$AD_OPS_WORKDIR/adops-plan.json" --workdir "$AD_OPS_WORKDIR"
```

`plan-and-render` 会写出 `adops-plan.json`、`adops-batch.json`、`apply.py`，并更新 `adops-artifacts.json`。生成的 apply.py 必须直接嵌入操作计划，确保用户只凭脚本即可执行 apply。如果脚本失败，停止并报告简短错误；不要手工修补 payload。

### 步骤 5：询问真实设备验证

目的：默认保持只生成产物，同时在产物存在后提供真实设备验证和预检计划。

WorkBot R4 阶段 B 不执行本通用询问步骤；它必须按上文固定命令块直接完成只读连接预检和同名资源预检，然后给出脚本产物和命令用法。

非 WorkBot R4 流程在步骤 4 后，询问是否进入真实设备验证和预检计划。用户不批准时，跳到步骤 9。用户批准时，只收集设备地址和用户名/密码或 token，然后继续步骤 6。用户已经要求真实设备验证并提供凭据后，不要再询问第二次 apply 确认。

如果设备操作前需要简短离线预览，运行：

```bash
python3 skills/ad-config-ops/scripts/execute_plan.py --plan "$AD_OPS_WORKDIR/adops-plan.json" --result-out "$AD_OPS_WORKDIR/adops-execute-preview.json" --workdir "$AD_OPS_WORKDIR"
```

该预览只离线执行。它不会连接设备、询问凭据、执行设备 GET 或修改设备。

### 步骤 6：真实设备下发

目的：用户批准验证后，对当前设备运行已批准的 apply 流程，并使用脚本摘要判断验证状态。

如果当前运行还没有设备信息，只收集设备地址和用户名/密码或 token。展示脚本 stdout 摘要中的简短操作摘要、预检路径、验证计数和回滚计划；不要粘贴完整 payload。因为用户已经要求真实设备验证，所以无需第二次确认即可运行 apply 流程：

```bash
python3 skills/ad-config-ops/scripts/execute_plan.py --plan "$AD_OPS_WORKDIR/adops-plan.json" --host <ad-host:port> --username <user> --execute --result-out "$AD_OPS_WORKDIR/adops-execute-result.json" --rollback-out "$AD_OPS_WORKDIR/adops-rollback.json" --workdir "$AD_OPS_WORKDIR"
```

用户从 `devices.json` 选择设备时，使用 `--devices devices.json --device <alias>`，不要使用 `--host/--username/--password`。适用时使用 `--token <token>`，不要使用 `--username <user>`。脚本会执行带 `all_properties=true` 的真实设备预检 GET，下发计划，再执行带 `all_properties=true` 的验证 GET，比较结果，创建回滚 manifest，并打印简短 JSON 摘要。

### 步骤 7：用户侧验证

目的：区分脚本自验证和用户设备侧/业务侧确认。

如果步骤 6 报告成功，请用户从设备侧或业务侧验证。用户说正确时，询问保留配置还是回滚。用户报告问题时，不要猜测；使用脚本摘要和当前任务产物决定下一条命令。

### 步骤 8：按请求回滚

目的：用户侧验证后，如果用户要求回滚，就执行回滚。

用户请求回滚时，不再询问第二次回滚确认，直接运行回滚流程：

```bash
python3 skills/ad-config-ops/scripts/rollback.py --manifest "$AD_OPS_WORKDIR/adops-rollback.json" --host <ad-host:port> --username <user> --execute --result-out "$AD_OPS_WORKDIR/adops-rollback-result.json" --workdir "$AD_OPS_WORKDIR"
```

用户从 `devices.json` 选择设备时，使用 `--devices devices.json --device <alias>`，不要使用 `--host/--username/--password`。适用时使用 `--token <token>`，不要使用 `--username <user>`。回滚验证 GET 也必须包含 `all_properties=true`。

### 步骤 9：以最终产物收尾

目的：只告诉用户可复用 apply 脚本及其用法，以此收尾任务。

告诉用户可复用脚本路径是 `"$AD_OPS_WORKDIR/apply.py"`，并展示：

```bash
python3 "$AD_OPS_WORKDIR/apply.py" --host <ad-host:port> --username <user> --execute
```

说明脚本会提示输入密码，除非提供 `AD_PASSWORD` 或 `--token`。除非用户明确询问回滚内部产物，否则最终完成消息不要展示回滚产物。

## 维护命令

只有在用户提供替换文档或要求刷新时，才刷新版本化 API 文档并重新生成 API 派生产物：

```bash
python3 skills/ad-config-ops/scripts/refresh_api_docs.py --source <api-docs-json-dir> --version <fallback-version> --skill-root skills/ad-config-ops
```

`--source` 必须指向包含 `toc.js`、`{common}.js` 和 `token.js` 的 Swagger JS 文档目录；对打包 Web 文档而言通常是 `json/` 目录。当父级 Web 包含 `index.html` 或 `js/app.js` 时，刷新逻辑使用 Web 展示版本（例如 `API 7.0.28`）作为规范版本，并只把 CLI `--version` 值记录为 `requested_version` fallback 元数据。`references/api-version.json` 会记录 `version_source`、`web_version`、`swagger_version`，以及这些来源不一致时的警告。

刷新后，先检查 `references/api-version.json` 和 `references/generated/api-patch-report.json`，再依赖生成结果。版本绑定修复位于 `references/api-patches/`；刷新会保留该目录，并只应用与检测到的 API 版本匹配的 patch。

同步只能由用户触发。写入全局目标时，必须同时有用户同步请求和 `--confirm`：

```bash
python3 skills/ad-config-ops/scripts/sync_to_codex_skill.py --source skills/ad-config-ops --target /Users/fangpb/.codex/skills/ad-config-ops --confirm
```

## 模板规则

- 模板必须包含所选 schema 中的每个可写字段。
- 基于真实设备 GET 生成的编辑模板必须保持 API 文档字段顺序；当前对象已有值时填入该值；省略未知/只读响应字段；缺失的可写字段保留为普通模板占位。
- 每个生成的 YAML 模板都必须以中文注释开头，说明如何填写模板、空值如何裁剪，以及如何使用 `empty_reserve`。
- 未填写字段会通过递归裁剪空字符串、null、空数组、空对象和未填写的数组示例元素，从 payload 中省略。
- 如果用户有意发送空值，模板必须提供机器可读的 `empty_reserve` 列表。路径相对 `payload`；保留空数组项时使用 `[]` 表示数组元素，例如 `nodes[]`。
- `enum` 和 `optionalEnum` 值必须在注释中完整列出。
- 数组字段必须渲染为 YAML 列表，并包含一个空白示例元素。
- 对象数组字段必须渲染一个空白示例对象，并展开该对象的每个可写字段，包括嵌套数组。
- 空白示例元素只用于指导填写；如果用户留空，计划阶段必须从最终 payload 中裁剪它们，除非匹配路径列在 `empty_reserve` 中。
- 模板不得给非字符串占位值加引号。整数、数字、布尔、对象和未知类型字段保持空白，避免误导用户把它们写成字符串。
- 只读字段不得成为用户可填写字段。
- 如果必填字段为空，停止并要求用户填写。
- `adops-plan.json` 仍可用于审计/调试，但生成的 `apply.py` 必须直接嵌入操作计划，用户执行 apply 时不需要携带单独 plan 文件。

## API 版本刷新

使用 `scripts/refresh_api_docs.py` 替换版本化 API 文档并重新生成 API 派生产物。刷新逻辑只允许自动重写 `references/generated/`、`scripts/generated/`、`references/api-docs/`、`references/api-index.json`、`references/api-version.json`、`references/search/generated-search-map.json`、`references/search/search-map-effective.json`、`references/search/search-map-review.yml` 和 `references/search/exact-match-review.yml`。不得覆盖 `references/search/search-map-overrides.json` 或 `references/api-patches/`。

已知 API 版本特有的文档缺陷，应通过 `references/api-patches/` 中的版本绑定 patch 文件修复，不要直接编辑 `references/api-docs/` 下的原始文件。`build_index.py` 写入 `references/api-index.json` 前会应用匹配 patch，并把审计报告写入 `references/generated/api-patch-report.json`。patch 编写示例见 `references/api-patches/README.md` 和 `references/api-patches/examples/`。
