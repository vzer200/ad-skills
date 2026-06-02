# 把 1600+ 条设备命令交给 AI：SangforAD CLI + Skill 智能执行体系

## 背景

在传统 Sangfor AD 运维场景中，命令行操作通常依赖工程师登录设备后台，再根据手册查找 `sfcli` 命令、补齐参数、执行验证。这个过程对经验依赖很强，尤其在 Web 控制台不可用、管理口异常、需要通过后台恢复配置时，操作链路容易变长，也容易因为命令格式、参数大小写、字段顺序、特殊字符转义等细节出错。

我们通过 `CLI + Skill` 的方式，把 Sangfor AD 的产品命令行能力沉淀成 AI 可理解、可检索、可模板化、可审核、可修复、可交接执行的工具链。AI 不只是回答“命令怎么写”，而是可以在受控流程下替工程师完成命令选择、模板生成、执行前审核、远程执行交接和失败修复学习。

## 核心创新

### 1. 从命令手册到 AI 可调用模型

我们没有让 AI 临场阅读 PDF 或手工翻命令手册，而是基于结构化 API/YAML 命令模型生成本地 `cli_model.jsonl`。AI 通过 skill 调用本地工具进行搜索和模板渲染：

```bash
python sangfor_cli.py search "修改管理口地址"
python sangfor_cli.py template --command "modify sys management" --path "sys/management" --document "sys/management.js"
```

这样 AI 拿到的不是模糊文本，而是带有 `command`、`path`、`document`、字段、枚举、必填项和说明的结构化结果。

### 2. 用 Skill 约束 AI 的操作路径

`sangfor-cli` skill 明确规定了 AI 的工作流：

```text
用户意图
  -> search 查命令
  -> 选择 command/path/document
  -> template 精确渲染
  -> 人工审核
  -> run 调度执行或交给 SSH/MCP
```

这避免了 AI 直接凭记忆拼命令，也避免了自然语言匹配造成命令类型误判。对于 HTTP/TCP/DNS 等同名命令，必须通过 `document` 区分资源类型，保证模板来自正确的设备能力模型。

### 3. 把 API 口径自动转换为 CLI 口径

这次新增了一个关键能力：模板不再直接暴露 API/YAML 的枚举值，而是转换成真实 `sfcli` 更容易接受的 CLI 口径。

例如 API 模型里字段可能是：

```json
{
  "name": "multi_login",
  "enum": ["ENABLE", "DISABLE"]
}
```

但真实 CLI 命令需要：

```bash
sfcli modify sys web-service multi_login enable;
```

现在模型构建阶段会生成：

```json
{
  "enum": ["ENABLE", "DISABLE"],
  "cli_enum": ["enable", "disable"]
}
```

`template`、`format`、`run`、`batch` 都会优先使用 `cli_enum`。类似 `NONE` 这类 `optionalEnum` 也会被转换成 `none`，避免 AI 继续把 API 大写枚举直接拿去执行。数组元素里的枚举也会被同样处理，例如 SSL 协议、加密套件、备份模块列表等，不再只覆盖顶层字段。

对于 object 类型字段，工具也会保留子字段结构，并按真实 CLI 习惯生成大括号语法。AI 不应生成点号对象写法，而应生成：

```bash
sfcli modify sys passwd-policy login_protect { state enable };
```

如果用户输入了点号、方括号或遗漏大括号的错误写法，工具会在进入人工审核或远程执行前自动修复；无法根据模型修复时会直接拒绝，避免无效命令进入设备。对于跨文档引用的复杂字段，例如节点池 `nodes` 引用的节点对象、SSL Server `cipher_suites` 引用的加密套件枚举，也会递归解析源 YAML/API 模型，把子字段和枚举完整带入模板。

### 4. 自动修复与本地学习

命令行自动化最怕“模板看起来对，但设备执行不认”。现在工具支持失败后的修复闭环：

```bash
python sangfor_cli.py repair \
  --failed-command "sfcli modify sys web-service multi_login ENABLE" \
  --error 'Syntax error: 非法参数"ENABLE"'
```

工具会识别非法参数，结合本地命令模型生成候选修复：

```bash
sfcli modify sys web-service multi_login enable;
```

如果人工确认并在设备上执行成功，可以写入本地学习记录：

```bash
python sangfor_cli.py learn \
  --bad "sfcli modify sys web-service multi_login ENABLE" \
  --good "sfcli modify sys web-service multi_login enable" \
  --path "sys/web-service" \
  --document "sys/web-service.js"
```

学习结果会进入 `references/cli_overrides.json`。后续 AI 再遇到同类命令，会直接生成修正后的 CLI 写法。

这次进一步把“同长度参数值修复”扩展成“结构性修复学习”：如果失败命令本身语法正确，但设备端业务校验提示需要额外确认，例如“请确认是否强制提交”，AI 在人工确认后通过裸 `force` 执行成功，就可以把失败命令和成功命令写入学习记录。后续再遇到同类服务端错误时，工具会自动提出 `... force;` 这种命令后缀候选，而不是继续尝试无效的 `force true`、`force enable` 或 `force 1`。

### 5. 自动修复也必须二次确认

为了避免“AI 自动试命令”带来新的风险，执行链路仍然保留强制人工确认：

```json
{
  "requires_human_confirmation": true,
  "review_text": "sfcli modify sys web-service multi_login enable"
}
```

即使首次执行失败后生成了修复候选，修复候选也不会绕过审核。必须由人工确认修复后的命令，再使用二次确认参数执行。这样既能让 AI 具备修复能力，又不会让 AI 在设备上随意试错。

### 6. 处理真实命令执行细节

命令行自动化的难点不只是“命令是什么”，还包括：

- 参数是否必填
- 字段是否存在隐性必填
- 同一命令是否有多个资源类型
- 密码里是否包含 `$`、`;`、`&`、空格等特殊字符
- SSH/MCP 执行时是否会出现多余分号
- 当前 shell 是否已经在 AD 设备后台
- API 枚举和 CLI 枚举是否存在大小写差异
- object 字段是否需要 `{ 子字段 值 }` 这种 CLI 写法

工具链内置了这些处理：

- 自动补齐显式必填字段
- 识别描述中的“必选”“二者必选其一”等隐性约束
- 对复杂对象和数组字段标记 `execution_ready: false`
- 生成 shell-safe 的 `remote_text`
- 执行前检查 `cat /app/appversion && command -v sfcli`
- 非 AD 环境返回 `need_remote: true`，交给 SSH skill/MCP 执行
- 重复 command 会合并字段，避免只命中第一条模型记录
- object 字段会保留子字段并自动修复常见错误语法

### 7. 缩小触发范围，避免误调用

AD 设备后台经常用于开发、排障和普通 Linux 操作，比如 `ls`、`cat`、`grep`、`python`、`systemctl`、查看日志、编辑文件等。为了避免误触发，`sangfor-cli` 被限定为只处理 Sangfor AD 产品资源类 `sfcli` 命令，不接管普通后台 shell 命令。

也就是说：

- 修改虚拟服务、节点池、DNS 记录、管理口配置等产品资源：使用 `sangfor-cli`
- 查看文件、改代码、跑脚本、查进程、看日志：使用普通 shell/SSH 工具

这个边界让 skill 更像一个专业产品命令工具，而不是泛化的远程 shell 代理。

## 典型流程

以“修改后台维护密码”为例：

```text
用户：修改后台维护密码
AI：调用 search 查找命令
AI：命中 run debug sys maintenance-passwd
AI：调用 template 精确生成命令
AI：提示 username/password/ssh_password 含义
AI：生成待审核命令
用户：确认
AI：调用 run --confirm-reviewed
AI：当前不是 AD 后台时，返回 remote_text
AI：调用 SSH skill/MCP 在目标 AD 后台执行
AI：返回执行结果
```

示例命令：

```bash
sfcli run debug sys maintenance-passwd username admin password <current_admin_password> ssh_password <new_maintenance_password>
```

其中 `password` 用于验证当前管理员身份，`ssh_password` 才是要设置的新维护密码。

## 多 Agent 交叉审核

为了保证这套能力不是只修一个点，我们引入了多 agent 交叉排查：

- 一个 agent 专门审查模板值域，发现 `optionalEnum` 也存在大写泄露风险
- 一个 agent 专门审查执行链路，发现自动修复需要二次确认、学习逻辑需要处理命令歧义
- 一个 agent 专门对比源 API/YAML 和生成后的 `cli_model.jsonl`，发现早期解析没有完整展开跨文档 `$ref`、`array<object>` 和深层 object 子字段
- 一个 agent 专门构造错误命令，验证 `xx.yy` 点号语法、未知子字段、数组枚举大写不会进入人工审核或远程执行

这些问题已经反向进入实现：

- `optionalEnum` 现在也生成 CLI 小写值域
- 重复 command 会合并字段
- `learn` 遇到歧义会要求 `--path/--document`
- 无实际修复时不会假装生成修复候选
- 自动修复候选必须二次确认后才能执行
- `validate_cli_model.py` 现在会做源模型对齐校验：1656 个 operation、14840 个递归字段、1391 个 object 子字段、394 个 array<object> 项全部对齐，缺失字段、枚举不一致、未解析 ref 都会让校验失败
- `format/run/batch` 会优先把 object 子字段修成 `{ 子字段 值 }`，把 API 大写枚举修成 CLI 小写；修不了的 dotted/未知子字段直接拒绝

这让 skill 不只是“能跑”，而是具备可审计、可修正、可持续学习的工程闭环。

## 价值

这套方案的价值不在于简单封装一个脚本，而是把“AI 会说命令”升级为“AI 能按流程操作命令”：

- 从手册检索变成结构化命令检索
- 从自然语言猜测变成 command/path/document 精确渲染
- 从手工拼参数变成字段驱动模板
- 从 API 枚举误用变成 CLI 口径自动转换
- 从失败后人工翻文档变成自动修复候选和学习记录
- 从直接执行变成人工审核后执行
- 从本地脚本变成可与 SSH skill/MCP 协同的执行调度器

最终效果是：当 Web 控制台不可用、需要后台命令行处理 AD 配置时，AI 可以帮助工程师快速定位正确 `sfcli` 命令、生成参数模板、修正执行格式，并在人工确认后完成执行交接，大幅降低命令行运维门槛和操作风险。

## 后续方向

- 接入真实设备 `sfcli help` 输出，进一步反向补充本地命令模型
- 针对高频场景沉淀专项模板，比如管理口恢复、虚拟服务创建、DNS 记录维护、维护密码修改
- 将成功修复记录按版本沉淀，形成设备版本级命令兼容知识库
- 记录执行审计链路，形成“用户意图 -> 命令模板 -> 人工确认 -> 执行结果 -> 修复学习”的闭环

`CLI + Skill` 的本质，是把设备命令行能力变成 AI 可控调用的产品接口。它不是替代工程师，而是把工程师的经验、手册和执行流程固化进工具，让 AI 成为可审核、可交接、可学习的 AD 命令行助手。

## 发布成熟度补强

为了避免 AI 在真实使用时继续踩命令格式坑，`sangfor-cli` 增加了发布前自测门禁 `scripts/selftest_sangfor_cli.py`。它不连接设备、不执行真实 `sfcli`，只对本地命令模型和解析器做生成式验证：

- 覆盖完整 `cli_model.jsonl` 中的命令、路径占位符、标量字段、object、nested object、array、array<object>
- 覆盖标量数组的 `addresses [ 10.0.0.0/8 ]` 这类括号列表写法，确保闭合符被完整消费
- 拦截未替换的 `[name]`、`<value>` 等模板占位符
- 拦截不在 AD CLI 模型中的 `create/modify/delete/list/show/run` 命令，避免普通 shell 片段被误当成产品命令
- 对 `create` 必填字段、`modify` 资源身份字段、object/array<object> 必填子字段做执行前校验
- 将 API 大写枚举、数组元素枚举、示例枚举统一修正为 CLI 小写形式
- 对旧模板里的 `nodes add [ { ... } ]` 兼容修正为真实 `nodes add { ... }`
- 确保 `run` 默认只进入人工审核，不会未确认执行；远程交接只输出 shell-safe 的 `remote_text`
- 增加字段语义别名校验，例如 `http_sched_mode` 中 `connection` 对应按连接调度/首个请求，`request` 对应按每个请求调度，避免自然语言和 CLI 枚举含义搞反
- 批量变更通过 `sfcli -f` 执行，把审核后的命令转换成无 `sfcli` 前缀、无尾部分号的批量文件正文，远端只需一次性执行 heredoc

当前完整自测结果：`6139` 条检查，`0` 失败；覆盖 `839` 个标量字段、`315` 个对象字段、`457` 个数组字段、`1023` 个路径占位符命令。以后重新生成模型或打包 zip 前，必须先跑 selftest 和 `validate_cli_model.py`，两者都通过后才能发布。
