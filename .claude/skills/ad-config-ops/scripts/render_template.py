from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from ad_ops_common import read_json, skill_paths, tmp_file_path, update_artifacts, workdir_path
from resolve_schema import resolve_schema


HEADER_LINES = [
    "# AD-OPS 模板使用说明：",
    "# 1. 只填写需要下发的字段；未填写的空字符串、null、空数组、空对象会在生成 plan 时递归删除。",
    "# 2. 数组下的空元素和对象数组下的全空示例对象仅用于提示填写，未填写会自动删除。",
    "# 3. 如果确实需要下发空值，请把 payload 相对路径写入 empty_reserve，例如 empty_reserve: [service_monitors]；保留空数组元素可写 nodes[]。",
    "# 4. 数值和布尔字段默认留空即可；填写时不要加双引号，例如 port: 80、state: ENABLE、enabled: true。",
]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a fillable YAML template for an AD API schema.")
    parser.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root.")
    parser.add_argument("--schema", required=True, help="Schema name, for example config.virtual_service.")
    parser.add_argument("--document", help="Optional document constraint, for example slb/virtual-service.js.")
    parser.add_argument("--out", type=Path, help="Optional YAML output path. Defaults to TMP_FILE when set.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    parser.add_argument(
        "--preset",
        action="append",
        default=[],
        metavar="PATH=VALUE",
        help="Prefill a scalar field in the rendered template. Repeat for multiple fields.",
    )
    return parser.parse_args(argv)


class PresetValue:
    def __init__(self, raw: str) -> None:
        self.raw = raw


def clean_text(value: str) -> str:
    value = value.replace("...", "").replace("……", "").replace("省略", "")
    return re.sub(r"[\r\n]+", " ", value).strip()


def scalar_text(value: Any) -> str:
    if isinstance(value, str):
        return clean_text(value)
    return clean_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")))


def list_text(values: Any) -> str | None:
    if not isinstance(values, list):
        return None
    return ", ".join(scalar_text(value) for value in values)


def range_text(field: dict[str, Any]) -> str | None:
    minimum = field.get("minimum")
    maximum = field.get("maximum")
    if minimum is None and maximum is None:
        return None
    if minimum is not None and maximum is not None:
        return f"{scalar_text(minimum)}..{scalar_text(maximum)}"
    if minimum is not None:
        return f">= {scalar_text(minimum)}"
    return f"<= {scalar_text(maximum)}"


def length_text(field: dict[str, Any]) -> str | None:
    minimum = field.get("minLength")
    maximum = field.get("maxLength")
    if minimum is None and maximum is None:
        return None
    if minimum is not None and maximum is not None:
        return f"{scalar_text(minimum)}..{scalar_text(maximum)}"
    if minimum is not None:
        return f">= {scalar_text(minimum)}"
    return f"<= {scalar_text(maximum)}"


def comment_parts(field: dict[str, Any]) -> list[str]:
    parts = ["required" if field.get("required") else "optional"]
    if field.get("type") is not None:
        parts.append(f"type: {scalar_text(field['type'])}")

    enum = list_text(field.get("enum"))
    if enum is not None:
        parts.append(f"enum: {enum}")

    optional_enum = list_text(field.get("optionalEnum"))
    if optional_enum is not None:
        parts.append(f"optionalEnum: {optional_enum}")

    for key in ("default", "example"):
        if field.get(key) is not None:
            parts.append(f"{key}: {scalar_text(field[key])}")

    value_range = range_text(field)
    if value_range is not None:
        parts.append(f"range: {value_range}")

    value_length = length_text(field)
    if value_length is not None:
        parts.append(f"length: {value_length}")

    description = field.get("description")
    if isinstance(description, str) and clean_text(description):
        parts.append(clean_text(description))

    return parts


def comment_suffix(field: dict[str, Any]) -> str:
    comment = "; ".join(part for part in comment_parts(field) if part)
    return f"  # {comment}" if comment else ""


def blank_value_text(field_type: Any) -> str:
    return '""' if field_type == "string" else ""


SAFE_SCALAR_RE = re.compile(r"^[A-Za-z0-9_.\/:-]+$")
INTEGER_RE = re.compile(r"^[+-]?\d+$")
NUMBER_RE = re.compile(r"^[+-]?(?:(?:\d+\.\d*)|(?:\.\d+)|(?:\d+))(?:[eE][+-]?\d+)?$")
YAML_AMBIGUOUS_STRINGS = {"null", "true", "false", "yes", "no", "on", "off", "~"}


def plain_string_is_safe(value: str) -> bool:
    if not value or not SAFE_SCALAR_RE.match(value):
        return False
    if value.lower() in YAML_AMBIGUOUS_STRINGS:
        return False
    return NUMBER_RE.match(value) is None


def coerce_preset_value(raw: str, field: dict[str, Any]) -> Any:
    field_type = field.get("type")
    if field_type == "boolean" and raw.lower() in {"true", "false"}:
        return raw.lower() == "true"
    if field_type == "integer" and INTEGER_RE.match(raw):
        return int(raw, 10)
    if field_type == "number" and NUMBER_RE.match(raw):
        return int(raw, 10) if INTEGER_RE.match(raw) else float(raw)
    return raw


def preset_value_text(value: PresetValue, field: dict[str, Any]) -> str:
    coerced = coerce_preset_value(value.raw, field)
    if isinstance(coerced, str):
        return coerced if plain_string_is_safe(coerced) else json.dumps(coerced, ensure_ascii=False)
    return scalar_value_text(coerced, field)


def scalar_value_text(value: Any, field: dict[str, Any]) -> str:
    if isinstance(value, PresetValue):
        return preset_value_text(value, field)
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, str):
        if field.get("type") == "string" or not SAFE_SCALAR_RE.match(value):
            return json.dumps(value, ensure_ascii=False)
        return value
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def parse_presets(presets: list[str] | None) -> dict[str, Any]:
    values: dict[str, Any] = {}
    for preset in presets or []:
        if "=" not in preset:
            raise ValueError("--preset expects PATH=VALUE")
        path, raw = preset.split("=", 1)
        path = path.strip()
        if not path:
            raise ValueError("--preset path must not be empty")
        parts = path.split(".")
        if any(not part for part in parts):
            raise ValueError(f"invalid preset path: {path}")

        cursor = values
        for part in parts[:-1]:
            existing = cursor.setdefault(part, {})
            if not isinstance(existing, dict):
                raise ValueError(f"preset path conflicts with scalar value: {path}")
            cursor = existing
        leaf = parts[-1]
        if leaf in cursor:
            raise ValueError(f"duplicate preset path: {path}")
        cursor[leaf] = PresetValue(raw)
    return values


def render_field(field: dict[str, Any]) -> str:
    value = blank_value_text(field.get("type"))
    separator = " " if value else ""
    return f"{field['path']}:{separator}{value}{comment_suffix(field)}"


def field_label(path: str) -> str:
    return path.rsplit(".", 1)[-1].replace("[]", "")


def direct_child_paths(fields: list[dict[str, Any]], prefix: str) -> list[str]:
    children: list[str] = []
    for field in fields:
        path = field["path"]
        if not path.startswith(prefix) or path == prefix.rstrip("."):
            continue
        rest = path[len(prefix) :]
        if not rest:
            continue
        child = f"{prefix}{rest.split('.', 1)[0]}"
        if child not in children:
            children.append(child)
    return children


def child_fields(fields: list[dict[str, Any]], prefix: str) -> list[dict[str, Any]]:
    by_path = {field["path"]: field for field in fields}
    return [by_path[path] for path in direct_child_paths(fields, prefix) if path in by_path]


def render_scalar_sample(field: dict[str, Any], indent: int) -> list[str]:
    value = blank_value_text(field.get("type"))
    separator = " " if value else ""
    return [f"{' ' * indent}{field_label(field['path'])}:{separator}{value}{comment_suffix(field)}"]


def render_simple_array_sample(field: dict[str, Any], indent: int) -> list[str]:
    item_comment = item_comment_suffix(field.get("items"))
    item_type = field.get("items", {}).get("type") if isinstance(field.get("items"), dict) else None
    value = blank_value_text(item_type)
    separator = f" {value}" if value else ""
    return [
        f"{' ' * indent}{field_label(field['path'])}:{comment_suffix(field)}",
        f"{' ' * (indent + 2)}-{separator}{item_comment}",
    ]


def example_object_keys(field: dict[str, Any]) -> list[str]:
    examples = field.get("example")
    objects: list[dict[str, Any]] = []
    if isinstance(examples, dict):
        objects = [examples]
    elif isinstance(examples, list):
        objects = [item for item in examples if isinstance(item, dict)]

    keys: list[str] = []
    for item in objects:
        for key in item:
            if isinstance(key, str) and key not in keys:
                keys.append(key)
    return keys


def render_object_array_sample_from_example(field: dict[str, Any], indent: int) -> list[str]:
    keys = example_object_keys(field)
    lines = [
        f"{' ' * indent}{field_label(field['path'])}:{comment_suffix(field)}",
        f"{' ' * (indent + 2)}-",
    ]
    if not keys:
        lines[-1] = f"{lines[-1]} {{}}{item_comment_suffix(field.get('items'))}"
        return lines
    first_example = next(
        (item for item in (field.get("example") or []) if isinstance(item, dict)),
        field.get("example") if isinstance(field.get("example"), dict) else {},
    )
    for key in keys:
        sample_value = first_example.get(key) if isinstance(first_example, dict) else None
        value = '""' if isinstance(sample_value, str) else ""
        separator = " " if value else ""
        lines.append(f"{' ' * (indent + 4)}{key}:{separator}{value}  # array element example field")
    return lines


def item_comment_suffix(items: Any) -> str:
    if not isinstance(items, dict):
        return ""
    parts: list[str] = ["array element"]
    if items.get("type") is not None:
        parts.append(f"type: {scalar_text(items['type'])}")
    enum = list_text(items.get("enum"))
    if enum is not None:
        parts.append(f"enum: {enum}")
    optional_enum = list_text(items.get("optionalEnum"))
    if optional_enum is not None:
        parts.append(f"optionalEnum: {optional_enum}")
    description = items.get("description")
    if isinstance(description, str) and clean_text(description):
        parts.append(clean_text(description))
    return f"  # {'; '.join(parts)}" if parts else ""


def render_object_field(field: dict[str, Any], fields: list[dict[str, Any]], indent: int) -> list[str]:
    children = child_fields(fields, f"{field['path']}.")
    if not children:
        return render_scalar_sample(field, indent)
    lines = [f"{' ' * indent}{field_label(field['path'])}:{comment_suffix(field)}"]
    for child in children:
        lines.extend(render_structured_field(child, fields, indent + 2))
    return lines


def render_array_field(field: dict[str, Any], fields: list[dict[str, Any]], indent: int) -> list[str]:
    children = child_fields(fields, f"{field['path']}[].")
    if not children:
        if isinstance(field.get("items"), dict) and field["items"].get("type") == "object":
            return render_object_array_sample_from_example(field, indent)
        return render_simple_array_sample(field, indent)
    lines = [
        f"{' ' * indent}{field_label(field['path'])}:{comment_suffix(field)}",
        f"{' ' * (indent + 2)}-",
    ]
    for child in children:
        lines.extend(render_structured_field(child, fields, indent + 4))
    return lines


def render_structured_field(field: dict[str, Any], fields: list[dict[str, Any]], indent: int = 0) -> list[str]:
    field_type = field.get("type")
    if field_type == "array":
        return render_array_field(field, fields, indent)
    if field_type == "object":
        return render_object_field(field, fields, indent)
    return render_scalar_sample(field, indent)


def render_unknown_mapping(value: dict[str, Any], indent: int) -> list[str]:
    lines: list[str] = []
    for key, item in value.items():
        if isinstance(item, dict):
            lines.append(f"{' ' * indent}{key}:")
            lines.extend(render_unknown_mapping(item, indent + 2))
        elif isinstance(item, list):
            lines.append(f"{' ' * indent}{key}:")
            for child in item:
                if isinstance(child, dict):
                    lines.append(f"{' ' * (indent + 2)}-")
                    lines.extend(render_unknown_mapping(child, indent + 4))
                else:
                    lines.append(f"{' ' * (indent + 2)}- {scalar_value_text(child, {})}")
        else:
            lines.append(f"{' ' * indent}{key}: {scalar_value_text(item, {})}")
    return lines


def render_scalar_value(field: dict[str, Any], value: Any, indent: int) -> list[str]:
    rendered = scalar_value_text(value, field)
    return [f"{' ' * indent}{field_label(field['path'])}: {rendered}{comment_suffix(field)}"]


def render_object_value(field: dict[str, Any], fields: list[dict[str, Any]], value: Any, indent: int) -> list[str]:
    children = child_fields(fields, f"{field['path']}.")
    if not isinstance(value, dict):
        return render_scalar_value(field, value, indent)
    if not value and not children:
        return [f"{' ' * indent}{field_label(field['path'])}: {{}}{comment_suffix(field)}"]
    lines = [f"{' ' * indent}{field_label(field['path'])}:{comment_suffix(field)}"]
    if children:
        for child in children:
            child_key = field_label(child["path"])
            if child_key in value:
                lines.extend(render_structured_value(child, fields, value[child_key], indent + 2))
            else:
                lines.extend(render_structured_field(child, fields, indent + 2))
    else:
        lines.extend(render_unknown_mapping(value, indent + 2))
    return lines


def render_array_value(field: dict[str, Any], fields: list[dict[str, Any]], value: Any, indent: int) -> list[str]:
    if not isinstance(value, list):
        return render_scalar_value(field, value, indent)
    if not value:
        return [f"{' ' * indent}{field_label(field['path'])}: []{comment_suffix(field)}"]

    children = child_fields(fields, f"{field['path']}[].")
    lines = [f"{' ' * indent}{field_label(field['path'])}:{comment_suffix(field)}"]
    item_schema = field.get("items") if isinstance(field.get("items"), dict) else {}
    item_field = dict(item_schema)
    item_field["path"] = f"{field['path']}[]"
    for item in value:
        if isinstance(item, dict):
            if children:
                lines.append(f"{' ' * (indent + 2)}-")
                for child in children:
                    child_key = field_label(child["path"])
                    if child_key in item:
                        lines.extend(render_structured_value(child, fields, item[child_key], indent + 4))
                    else:
                        lines.extend(render_structured_field(child, fields, indent + 4))
            elif item:
                lines.append(f"{' ' * (indent + 2)}-")
                lines.extend(render_unknown_mapping(item, indent + 4))
            else:
                lines.append(f"{' ' * (indent + 2)}- {{}}{item_comment_suffix(item_schema)}")
        else:
            lines.append(f"{' ' * (indent + 2)}- {scalar_value_text(item, item_field)}{item_comment_suffix(item_schema)}")
    return lines


def render_structured_value(field: dict[str, Any], fields: list[dict[str, Any]], value: Any, indent: int = 0) -> list[str]:
    field_type = field.get("type")
    if field_type == "array":
        return render_array_value(field, fields, value, indent)
    if field_type == "object":
        return render_object_value(field, fields, value, indent)
    return render_scalar_value(field, value, indent)


def render_template(
    index: dict[str, Any],
    schema: str,
    document: str | None = None,
    include_header: bool = True,
    values: dict[str, Any] | None = None,
) -> str:
    resolved = resolve_schema(index, schema, document)
    fields = [field for field in resolved["fields"] if field.get("readOnly") is not True]
    top_level_fields = [field for field in fields if "." not in field["path"] and "[]" not in field["path"]]
    lines: list[str] = [*HEADER_LINES, "empty_reserve: []", ""] if include_header else []
    for field in top_level_fields:
        key = field_label(field["path"])
        if values is not None and key in values:
            lines.extend(render_structured_value(field, fields, values[key]))
        else:
            lines.extend(render_structured_field(field, fields))
    return "\n".join(lines) + ("\n" if lines else "")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        paths = skill_paths(args.skill_root)
        index = read_json(paths.references / "api-index.json")
        presets = parse_presets(args.preset)
        output = render_template(index, args.schema, args.document, values=presets or None)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    output_path = args.out or tmp_file_path()
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output, encoding="utf-8")
        update_artifacts(workdir_path(args.workdir), template=output_path)
    else:
        print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
