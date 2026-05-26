# AD-OPS API 文档补丁

`references/api-patches/` 用于修正特定 AD API 文档版本中的确定性错误，例如 URI 错误、字段必填漏标、枚举缺失、字段类型或默认值错误。

补丁只在 `scripts/build_index.py` 构建 `references/api-index.json` 前应用到内存中的 Swagger 文档，不会修改 `references/api-docs/` 原始文件。`scripts/refresh_api_docs.py` 替换 API 文档后会重新运行 build index，并保留本目录下的补丁文件。

## 生效规则

- 只加载 `references/api-patches/` 顶层的 `.yml` / `.yaml` 文件。
- `examples/` 目录下的文件只是示例，不会被加载。
- 补丁必须声明 `version` 或 `versions`，并且必须匹配 `references/api-version.json` 中的版本。
- 如果声明 `sha256`，还必须匹配当前 API 文档目录的 sha256。
- 默认严格失败：补丁引用的 document、schema、field、path 或 method 不存在时，`build_index.py` 会失败。确实允许失败的补丁可在 patch 上设置 `optional: true`。
- 每次构建都会写入 `references/generated/api-patch-report.json`，记录 applied、skipped 和 errors。

## 文件格式

```yaml
version: "7.0.28"
sha256: "<可选；绑定具体API文档树>"

patches:
  - id: "唯一补丁ID"
    reason: "为什么需要这个补丁"
    document: "net/link/lan.js"
    schema: "config.link_lan"
    operations:
      - op: "add_required"
        field: "addresses"
```

也可以用一个文件放多个 YAML document：

```yaml
version: "7.0.28"
patches: []
---
version: "7.0.25"
patches: []
```

## 支持的操作

字段类操作需要 `document`、`schema`、`field`：

```yaml
- op: "add_required"
  field: "addresses"

- op: "remove_required"
  field: "legacy_field"

- op: "replace_description"
  field: "addresses"
  value: "必选参数；地址列表"

- op: "replace_enum"
  field: "state"
  values: ["ENABLE", "DISABLE"]

- op: "set_default"
  field: "state"
  value: "ENABLE"

- op: "set_type"
  field: "timeout"
  value: "integer"
```

URI 类操作需要 `document`：

```yaml
- op: "move_path"
  from: "/api/ad/v3/old"
  to: "/api/ad/v3/new"

- op: "copy_path"
  from: "/api/ad/v3/old"
  to: "/api/ad/v3/new-compatible"

- op: "remove_path"
  path: "/api/ad/v3/wrong"

- op: "move_method"
  method: "post"
  from: "/api/ad/v3/old"
  to: "/api/ad/v3/new"

- op: "replace_path_parameter"
  path: "/api/ad/v3/slb/example/{id}"
  from: "id"
  to: "name"
```
