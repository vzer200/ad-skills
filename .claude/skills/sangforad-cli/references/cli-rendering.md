# Sangfor AD CLI Rendering Notes

Use this reference when extending `scripts/render_cli.py` or checking whether a
generated command shape is reasonable.

## Source Rules

The legacy `gen_cli_man.py` and the AD 7.0.29R1 command manual use these stable
rules:

- Strip the API prefix such as `/api/ad/v3/`.
- Convert the remaining URI path to command words.
- Map methods/actions:
  - `post` or `create` -> `create`
  - `patch`, `put`, `patch action`, or `replace` -> `modify`
  - `delete` -> `delete`
  - `get` -> `list`; `stat` resources usually use `show`
- If the resource path ends in `{name}`, do not keep `{name}` as a word. Use the
  actual object name as the positional argument.
- Do not repeat top-level `name` in options after it is used as the positional
  object name.
- Render scalar payload fields as `field value`.
- Render object payload fields as `field { child value ... }`.
- Render arrays of scalars as `field [ item1 item2 ]`.
- Render arrays of objects as `field add [ { key value ... } ]`.
- Lowercase all-caps enum-like values such as `HTTP`, `ENABLE`, and
  `ROUND-ROBIN`, but preserve mixed-case strings such as `X-Forwarded-For`.
- Quote strings that contain whitespace or CLI punctuation with JSON string
  quoting.
- End generated commands with `;` so they can be pasted as a command block.

## SLB Examples

```text
create slb pool pool1 method round-robin nodes add [ { type address address 192.0.2.51 port 80 } ];
modify slb virtual-service vs1 description "Updated description";
delete slb virtual-service vs1;
```

The first implementation intentionally covers the deterministic command form
for AD-OPS generated plans. It does not infer live-device state, perform CLI
login, or execute commands.
