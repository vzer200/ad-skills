---
name: "sangfor-cli"
description: "Use only for Sangfor AD/ADC product resource commands executed through `sfcli`, such as AD configuration resources, SLB/DNS/NET/SYS product objects, AD product operations, and commands found in the generated API/YAML command model. Do not use for ordinary Linux/backend development commands on an AD device, such as cd/ls/cat/grep/vim/python/git/systemctl/service/log/process/file/debug shell work, unless the user explicitly asks for an AD product `sfcli` command."
---

# Sangfor CLI Skill

Use this skill as the stable entry point for Sangfor AD product resource CLI
work. The bundled tool can search the generated command model, render `sfcli`
command templates, normalize batches, and dispatch final commands.

Scope guard: use this skill only for AD product `sfcli` commands from the AD
resource command model. Do not use it for ordinary backend shell/development
work on an AD device, including filesystem navigation, file editing, source
code work, process inspection, service management, logs, package commands, or
generic Linux diagnostics. Those tasks should use the normal shell/SSH tools.

Important device constraint: Sangfor product CLI commands only work on the
backend shell of a Sangfor AD device where the `sfcli` program exists. They are
not local Windows/Linux commands and will not take effect outside an AD device.
Always present executable product commands with the `sfcli` prefix:

```bash
sfcli modify sys management addresses [ <addresses> ];
```

## Skill Path

Set the helper path to this skill's installed directory. Prefer resolving it
from the active skill path instead of hardcoding a workspace-specific location:

```bash
export SGCLI="<this-skill-dir>/scripts/sangfor_cli.py"
```

On Windows PowerShell:

```powershell
$env:SGCLI = "<this-skill-dir>\scripts\sangfor_cli.py"
```

## Workflow

1. Search the local command model when command syntax is uncertain:

```bash
python "$SGCLI" search "管理口 地址"
```

This searches `references/cli_model.jsonl` and returns candidate commands,
fields, and descriptions.

2. Render a command skeleton:

```bash
python "$SGCLI" template "修改管理口地址"
```

Example output:

```bash
sfcli modify sys management addresses [ <addresses> ];
```

Natural-language `template <query>` is for exploration. Do not execute it
directly. For execution, first run `search`, select the intended result, then
render with exact `command`, `path`, and `document`.

When a previous `search` result already returned the intended command, render it
by exact command instead of re-searching natural language:

```bash
python "$SGCLI" template --command "run debug sys maintenance-passwd" --path "debug/sys/maintenance-passwd" --document "debug/sys/maintenance-passwd.js"
```

For execution workflows, use `search` first, then pass `command`, `path`, and
`document` from the selected search result into
`template --command ... --path ... --document ...`. Some commands share the same
visible command words and path across different product types, so exact
templating without `document` may be rejected as ambiguous.

For virtual-service requests that say "跟 VS_X 一致", "参考 VS_X", or "把
VS_A 到 VS_B 改成和 VS_X 一样", first read the source virtual service on the
device and compare its real fields before generating commands. Do not infer
field names from the natural-language word alone. For example, a user may call
`tcp_profile` an 优化策略 because the source VS currently references a profile
named `test`; in that case copy the actual `tcp_profile` value rather than
searching for an unrelated `http-profile` resource.

3. Normalize a command or command file when needed:

```bash
python "$SGCLI" format sfcli list sys management all_properties true
python "$SGCLI" batch --file commands.sfcli --out normalized.sfcli
```

`format`, `batch`, and `run` normalize API/YAML enum values to CLI syntax
before returning commands. For example, if a model field has API enum
`ENABLE/DISABLE`, the helper emits the sfcli form `enable/disable`.
This also applies to enum values inside nested object fields and array items.
The helper also applies scoped semantic aliases for high-risk fields. For
HTTP/HTTPS virtual-service `http_sched_mode`, use `connection` for 按连接调度
/ 首个请求 and `request` for 按每个请求调度 / 每个请求. If the user says
首个请求 or 每个请求, pass that wording through `format` or `run`; the helper
will normalize it to the correct sfcli value and include a `semantic_alias`
repair note.
They reject unresolved template placeholders such as `[name]` or `<value>`,
unknown product commands outside the local AD CLI model, and missing required
fields for create workflows before any review or execution handoff.
They also repair common object-field mistakes. For an object field such as
`login_protect`, generate only brace syntax:

```bash
sfcli modify sys passwd-policy login_protect { state enable };
```

Do not generate dotted object syntax for object fields; it is not a valid sfcli
command form. If a user supplies that invalid form, the helper will repair or
reject it before review/execution.

4. Execute through the dispatcher:

```bash
python "$SGCLI" run sfcli list sys management all_properties true
```

The first `run` call is a mandatory human-review gate. It returns
`requires_human_confirmation: true` and `review_text`. Show `review_text` to the
user/operator and wait for explicit approval. Do not pass the command to SSH/MCP
and do not add `--confirm-reviewed` yourself until the human approves.
For copy/paste or SSH/MCP execution, use `review_text`, `shell_safe_text`, or
`remote_text`. The helper returns shell-quoted command text for machine
consumption and does not expose an unsafe raw shell command field.

After approval, rerun with:

```bash
python "$SGCLI" run --confirm-reviewed sfcli list sys management all_properties true
```

`run` first executes `cat /app/appversion && command -v sfcli`.

- If the probe succeeds and confirms both `/app/appversion` and `sfcli`, `run`
  executes the `sfcli ...` command in the current shell and returns stdout/stderr.
- If the current shell is not an AD device, `run` returns JSON with
  `need_remote: true` plus `remote_text`. Immediately pass `remote_text` to the
  available SSH skill/MCP/remote-shell tool and execute it on the target AD
  device. `remote_text` is shell-safe quoted and intentionally strips trailing
  command semicolons; do not append another semicolon in the SSH/MCP command
  wrapper.
  If SSH/MCP returns an sfcli error, feed the original failed `sfcli ...`
  command and the full stderr/stdout text into `repair --error`. After a
  reviewed repair succeeds remotely, record it with `learn --bad ... --good
  ... --error ...` so the same device-side pattern is reusable.
  If `template` returns `execution_ready: false`, resolve the listed
  `path_placeholders` or `complex_fields` with real values, live `sfcli help`,
  or known device syntax before running.

If a command fails with an sfcli syntax error such as `非法参数"ENABLE"`, use
the repair workflow before trying random variants:

```bash
python "$SGCLI" repair --failed-command "sfcli modify sys web-service multi_login ENABLE" --error 'Syntax error: 非法参数"ENABLE"'
```

`repair` also handles confirmed device-side business validation patterns that
require an sfcli command suffix. For example, when the device says the change
needs 强制提交, pass the full server error so the helper can propose the bare
`force` switch instead of invalid forms such as `force true`:

```bash
python "$SGCLI" repair --failed-command "sfcli modify sys whitelist web_console { whitelist_address { type global-whitelist } }" --error "Server error: 管理口配置-Web控制台引用了白名单或者用户地址集，客户端源IP[10.32.33.75]不在其中，请确认是否强制提交"
```

Review the returned candidate with the operator, execute it through the normal
`run --confirm-reviewed` or SSH/MCP path, and after success record the learning:

```bash
python "$SGCLI" learn --bad "sfcli modify sys web-service multi_login ENABLE" --good "sfcli modify sys web-service multi_login enable"
```

If the successful command adds a suffix token such as `force`, include the
original server error in `--error` so the learning is replayed only for that
class of business validation:

```bash
python "$SGCLI" learn --bad "sfcli modify sys whitelist web_console { whitelist_address { type global-whitelist } }" --good "sfcli modify sys whitelist web_console { whitelist_address { type global-whitelist } } force" --error "Server error: 请确认是否强制提交"
```

If `learn` reports the command is ambiguous, rerun it with the exact `--path`
and `--document` values from the selected `search` result.

The learning is stored in `references/cli_overrides.json`. Value rewrites are
used by future normalization/templates. Command suffix rewrites, such as
`force`, are replayed only by future `repair` workflows when the same class of
server error appears. On a local AD shell, `run --confirm-reviewed
--auto-repair ...` only returns the repaired candidate and requires one more
approval. Rerun with `--confirm-reviewed --auto-repair
--confirm-auto-repair` only after the operator explicitly approves the repaired
candidate. Corrections are recorded only if the retry succeeds.

For batch execution:

```bash
python "$SGCLI" run --file normalized.sfcli
python "$SGCLI" run --file normalized.sfcli --confirm-reviewed
```

`run --file --confirm-reviewed` uses `sfcli -f` for batch execution. On a
remote AD device, `remote_text` writes a temporary `.sfcli` file with normalized
command bodies, runs `sfcli -f "$tmp"`, then removes the file. Do not split the
returned `remote_text` into per-command SSH calls.

For backend maintenance password changes, prefer `template "修改后台维护密码"`
first. The command uses space-separated field/value pairs, not `key=value`:

```bash
sfcli run debug sys maintenance-passwd username <admin_user> password <current_admin_password> ssh_password <new_maintenance_password>;
```

Here `username` and `password` verify the current administrator identity, while
`ssh_password` is the maintenance SSH password value to set.

## Local Helper Commands

- `search <query>`: search the generated API/YAML command model.
- `template <query>`: render the best matched `sfcli ...` command skeleton.
- `template --command <command> [--path <path>] [--document <document>]`:
  render one exact command from a prior `search` result; prefer passing all
  three values for execution workflows.
- `format sfcli <command>`: normalize one product command to the `sfcli ...;`
  form.
- `help <topic>`: render an `sfcli help <topic>` command for live-device help.
- `batch --file <path> [--out <path>]`: normalize a local `.sfcli` command
  file; each input line may include or omit the `sfcli` prefix. Without
  `--confirm-reviewed`, it does not emit `remote_text`. With
  `--confirm-reviewed`, `remote_text` uses `sfcli -f`.
- `run sfcli <command>` or `run --file <path>`: first returns a human-review
  request. Only with `--confirm-reviewed` will it probe the current environment,
  execute locally on AD, or return `need_remote: true` and `remote_text` for the
  existing SSH skill/MCP. For `run --file`, execution and `remote_text` use
  `sfcli -f` instead of issuing each command one by one.
- `repair --failed-command <command> --error <stderr>`: propose a likely fixed
  command after a syntax error or known device business validation prompt,
  including API enum casing problems and confirmed command suffixes such as
  `force`.
- `learn --bad <failed-command> --good <working-command> [--path <path>
  --document <document>] [--error <stderr>]`: persist a confirmed correction to
  `references/cli_overrides.json`.
- `scripts/build_cli_model.py`: rebuild the local command model from
  `.claude/skills/ad-config-ops/references/api-index.json`.
- `scripts/validate_cli_model.py`: scan the command model for missing required
  fields, description-required hints, and create-name template gaps after model
  rebuilds.
- `scripts/selftest_sangfor_cli.py`: release gate for `format`, `template`,
  `run`, object/array parsing, placeholder rejection, shell-safe output, and
  required-field checks. Run it before packaging this skill.
- `scripts/package_sangfor_cli.py`: standalone release packager. It runs
  compile checks, model validation, selftest, writes a portable `sangfor-cli.zip`
  with forward-slash paths, and smoke-tests the zip after extraction.

## Coverage

`search` and `template` cover the generated API/YAML command model. `format`,
`batch`, and `run` are for AD product `sfcli` commands in that resource-command
domain, not arbitrary AD backend shell commands. The live device `sfcli help`
remains authoritative for commands added, removed, or changed by a specific
device build.
