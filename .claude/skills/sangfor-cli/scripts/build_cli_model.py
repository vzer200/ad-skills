from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


API_PREFIX_RE = re.compile(r"^/api/ad/v\d+/", re.IGNORECASE)
PATH_PARAMETER_RE = re.compile(r"^\{([^{}]+)\}$")
REF_SCHEMA_RE = re.compile(r"#/definitions/([^#]+)$")
UNSUPPORTED_PATH_RE = re.compile(r"\(\?:|\\[dDsSwW]|\(|\)")
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_ROOT = SCRIPT_DIR.parent
DEFAULT_API_INDEX = SKILL_ROOT.parent / "ad-config-ops" / "references" / "api-index.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a Sangfor sfcli command model from the AD API/YAML index.")
    parser.add_argument(
        "--api-index",
        type=Path,
        default=DEFAULT_API_INDEX,
        help="Structured API index generated from the AD API manual source.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=SKILL_ROOT / "references" / "cli_model.jsonl",
        help="Output JSONL command model.",
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def cli_action(operation: dict[str, Any]) -> str:
    method = str(operation.get("method") or "").lower()
    path = str(operation.get("path") or "")
    stripped = API_PREFIX_RE.sub("", path).strip("/")
    if method == "get":
        return "show" if stripped.startswith("stat/") else "list"
    if method in {"patch", "put"}:
        return "modify"
    if method == "delete":
        return "delete"
    if method == "post":
        return "run" if stripped.startswith("debug/") else "create"
    return method


def cli_path(path: str) -> tuple[list[str], str | None]:
    stripped = API_PREFIX_RE.sub("", path).strip("/")
    segments = [segment for segment in stripped.split("/") if segment]
    trailing_name: str | None = None
    if segments and PATH_PARAMETER_RE.match(segments[-1]):
        trailing_name = PATH_PARAMETER_RE.match(segments[-1]).group(1)  # type: ignore[union-attr]
        segments = segments[:-1]
    rendered = []
    for segment in segments:
        match = PATH_PARAMETER_RE.match(segment)
        rendered.append(f"[{match.group(1)}]" if match else segment)
    return rendered, trailing_name


def supported_operation_path(path: str) -> bool:
    stripped = API_PREFIX_RE.sub("", path).strip("/")
    return not UNSUPPORTED_PATH_RE.search(stripped)


def definition_map(index: dict[str, Any]) -> dict[tuple[str, str], dict[str, Any]]:
    defs: dict[tuple[str, str], dict[str, Any]] = {}
    for item in index.get("definitions") or []:
        if isinstance(item, dict) and item.get("name"):
            defs[(str(item["name"]), str(item.get("document") or ""))] = item
            defs.setdefault((str(item["name"]), ""), item)
    return defs


def ref_schema_name(ref: str) -> str:
    match = REF_SCHEMA_RE.search(ref)
    if match:
        return match.group(1)
    if "/" in ref:
        return ref.rsplit("/", 1)[-1]
    return ref


def ref_document(ref: str) -> str | None:
    if "#" not in ref:
        return None
    path = ref.split("#", 1)[0]
    if not path:
        return None
    if path.startswith("/api/"):
        path = path[5:]
    path = path.lstrip("/")
    if path.endswith(".yaml"):
        path = path[:-5] + ".js"
    return path or None


def resolve_definition(
    index_defs: dict[tuple[str, str], dict[str, Any]],
    ref: str | None,
    document: str,
) -> dict[str, Any] | None:
    if not ref:
        return None
    schema = ref_schema_name(ref)
    ref_doc = ref_document(ref)
    return (
        (index_defs.get((schema, ref_doc)) if ref_doc else None)
        or index_defs.get((schema, document))
        or index_defs.get((schema, "{common}.js"))
        or index_defs.get((schema, ""))
    )


def merge_ref_field(
    field: dict[str, Any],
    index_defs: dict[tuple[str, str], dict[str, Any]],
    document: str,
    seen: tuple[str, ...],
) -> dict[str, Any]:
    ref = str(field.get("ref") or "")
    definition = resolve_definition(index_defs, ref, document)
    ref_name = ref_schema_name(ref)
    if not definition or ref_name in seen:
        return field
    merged = dict(definition)
    for key, value in field.items():
        if key == "ref":
            continue
        if value not in (None, [], {}):
            merged[key] = value
    merged.setdefault("ref", ref)
    return merged


def field_summary(
    field: dict[str, Any],
    index_defs: dict[tuple[str, str], dict[str, Any]],
    document: str,
    seen: tuple[str, ...] = (),
) -> dict[str, Any]:
    if field.get("ref"):
        field = merge_ref_field(field, index_defs, document, seen)

    result: dict[str, Any] = {
        "name": field.get("name"),
        "required": bool(field.get("required")),
        "type": field.get("type") or field.get("ref"),
    }
    if field.get("ref"):
        result["ref"] = field.get("ref")
    for key in ("description", "enum", "optionalEnum", "default", "example"):
        if key in field and field[key] is not None:
            result[key] = field[key]
    if isinstance(field.get("properties"), list) and field["properties"]:
        seen_name = ref_schema_name(str(field.get("ref") or field.get("name") or ""))
        next_seen = (*seen, seen_name) if seen_name else seen
        result["properties"] = [
            field_summary(item, index_defs, document, next_seen)
            for item in field["properties"]
            if isinstance(item, dict) and item.get("name")
        ]
    if isinstance(field.get("items"), dict) and field["items"]:
        item = dict(field["items"])
        item.setdefault("name", "item")
        result["items"] = field_summary(item, index_defs, document, seen)
    if result.get("type") == "string":
        enum_values = result.get("enum")
        optional_values = result.get("optionalEnum")
        if isinstance(enum_values, list) and enum_values:
            # sfcli help/manual generation lowercases string enum choices even when
            # the backing API/YAML schema stores them as uppercase API values.
            result["cli_enum"] = [str(item).lower() for item in enum_values]
        if isinstance(optional_values, list) and optional_values:
            result["cli_optionalEnum"] = [str(item).lower() for item in optional_values]
        all_api_values = []
        if isinstance(enum_values, list):
            all_api_values.extend(enum_values)
        if isinstance(optional_values, list):
            all_api_values.extend(optional_values)
        for source_key, target_key in (("default", "cli_default"), ("example", "cli_example")):
            value = result.get(source_key)
            if isinstance(value, str) and value in all_api_values:
                result[target_key] = value.lower()
    return result


def schema_fields(index_defs: dict[tuple[str, str], dict[str, Any]], schema: str, document: str) -> list[dict[str, Any]]:
    definition = resolve_definition(index_defs, schema, document)
    if not definition:
        return []
    fields = []
    for item in definition.get("properties") or []:
        if isinstance(item, dict) and item.get("name"):
            fields.append(field_summary(item, index_defs, document))
    return fields


def operation_entry(operation: dict[str, Any], index_defs: dict[tuple[str, str], dict[str, Any]]) -> dict[str, Any]:
    path = str(operation.get("path") or "")
    action = cli_action(operation)
    parts, trailing_name = cli_path(path)
    command = " ".join([action, *parts, f"[{trailing_name}]" if trailing_name else ""]).strip()
    document = str(operation.get("document") or "")
    schemas = [schema for schema in operation.get("request_schemas") or [] if isinstance(schema, str)]
    fields = schema_fields(index_defs, schemas[0], document) if schemas else []
    return {
        "command": command,
        "action": action,
        "path": API_PREFIX_RE.sub("", path).strip("/"),
        "api_path": path,
        "method": operation.get("method"),
        "document": document,
        "operationId": operation.get("operationId"),
        "summary": operation.get("summary"),
        "description": operation.get("description") or operation.get("path_description"),
        "request_schemas": schemas,
        "fields": fields,
    }


def main() -> int:
    args = parse_args()
    index = load_json(args.api_index)
    defs = definition_map(index)
    entries = [
        operation_entry(operation, defs)
        for operation in index.get("operations") or []
        if isinstance(operation, dict) and operation.get("path") and supported_operation_path(str(operation.get("path") or ""))
    ]
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as handle:
        for entry in entries:
            handle.write(json.dumps(entry, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({"ok": True, "commands": len(entries), "out": str(args.out)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
