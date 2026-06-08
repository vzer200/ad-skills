from __future__ import annotations

import argparse
import collections
import importlib.util
import json
import re
from pathlib import Path
from typing import Any


SKILL_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = SKILL_ROOT / "references" / "cli_model.jsonl"
DEFAULT_API_INDEX = Path(".claude/skills/ad-config-ops/references/api-index.json")
HELPER = SKILL_ROOT / "scripts" / "sangfor_cli.py"
REF_SCHEMA_RE = re.compile(r"#/definitions/([^#]+)$")


def load_helper() -> Any:
    spec = importlib.util.spec_from_file_location("sangfor_cli", HELPER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load helper: {HELPER}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def family(path: str | None) -> str:
    return re.sub(r"/\{[^/]+\}$", "", str(path or ""))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate the local Sangfor sfcli command model.")
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--api-index", type=Path, default=DEFAULT_API_INDEX)
    parser.add_argument("--sample-limit", type=int, default=20)
    return parser.parse_args()


def walk_fields(fields: list[dict[str, Any]], prefix: str = "") -> list[dict[str, Any]]:
    result = []
    for field in fields:
        if not isinstance(field, dict):
            continue
        current = dict(field)
        name = str(current.get("name") or "")
        current["_path"] = f"{prefix}.{name}" if prefix and name else name
        result.append(current)
        properties = field.get("properties") if isinstance(field.get("properties"), list) else []
        result.extend(walk_fields(properties, current["_path"]))
        item = field.get("items") if isinstance(field.get("items"), dict) else None
        if item:
            result.extend(walk_fields([item], current["_path"] + "[]"))
    return result


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
    if path.startswith("/api/"):
        path = path[5:]
    path = path.lstrip("/")
    if path.endswith(".yaml"):
        path = path[:-5] + ".js"
    return path or None


def source_definition_map(index: dict[str, Any]) -> dict[tuple[str, str], dict[str, Any]]:
    definitions: dict[tuple[str, str], dict[str, Any]] = {}
    for item in index.get("definitions") or []:
        if isinstance(item, dict) and item.get("name"):
            definitions[(str(item["name"]), str(item.get("document") or ""))] = item
            definitions.setdefault((str(item["name"]), ""), item)
    return definitions


def resolve_source_definition(
    definitions: dict[tuple[str, str], dict[str, Any]],
    ref: str | None,
    document: str,
) -> dict[str, Any] | None:
    if not ref:
        return None
    schema = ref_schema_name(ref)
    ref_doc = ref_document(ref)
    return (
        (definitions.get((schema, ref_doc)) if ref_doc else None)
        or definitions.get((schema, document))
        or definitions.get((schema, "{common}.js"))
        or definitions.get((schema, ""))
    )


def source_field_summary(
    field: dict[str, Any],
    definitions: dict[tuple[str, str], dict[str, Any]],
    document: str,
    seen: tuple[str, ...] = (),
) -> dict[str, Any]:
    raw_ref = str(field.get("ref") or "")
    if raw_ref:
        ref_name = ref_schema_name(raw_ref)
        definition = resolve_source_definition(definitions, raw_ref, document)
        if definition and ref_name not in seen:
            merged = dict(definition)
            for key, value in field.items():
                if key != "ref" and value not in (None, [], {}):
                    merged[key] = value
            merged.setdefault("ref", raw_ref)
            field = merged

    result: dict[str, Any] = {
        "name": field.get("name"),
        "required": bool(field.get("required")),
        "type": field.get("type") or field.get("ref"),
    }
    if field.get("ref"):
        result["ref"] = field.get("ref")
    for key in ("enum", "optionalEnum"):
        if isinstance(field.get(key), list):
            result[key] = field[key]
    if isinstance(field.get("properties"), list) and field["properties"]:
        seen_name = ref_schema_name(str(field.get("ref") or field.get("name") or ""))
        next_seen = (*seen, seen_name) if seen_name else seen
        result["properties"] = [
            source_field_summary(item, definitions, document, next_seen)
            for item in field["properties"]
            if isinstance(item, dict) and item.get("name")
        ]
    if isinstance(field.get("items"), dict) and field["items"]:
        item = dict(field["items"])
        item.setdefault("name", "item")
        result["items"] = source_field_summary(item, definitions, document, seen)
    return result


def source_schema_fields(
    definitions: dict[tuple[str, str], dict[str, Any]],
    schema: str,
    document: str,
) -> list[dict[str, Any]]:
    definition = resolve_source_definition(definitions, schema, document)
    if not definition:
        return []
    return [
        source_field_summary(item, definitions, document)
        for item in definition.get("properties") or []
        if isinstance(item, dict) and item.get("name")
    ]


def flatten_field_paths(fields: list[dict[str, Any]], prefix: str = "") -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for field in fields:
        if not isinstance(field, dict):
            continue
        name = str(field.get("name") or "")
        if not name:
            continue
        path = f"{prefix}{name}"
        result[path] = field
        properties = field.get("properties") if isinstance(field.get("properties"), list) else []
        result.update(flatten_field_paths(properties, path + "."))
        item = field.get("items") if isinstance(field.get("items"), dict) else None
        if item:
            item_path = path + "[]"
            result[item_path] = item
            item_properties = item.get("properties") if isinstance(item.get("properties"), list) else []
            result.update(flatten_field_paths(item_properties, item_path + "."))
    return result


def operation_key(operation: dict[str, Any]) -> tuple[str, str, str, str]:
    return (
        str(operation.get("method") or "").lower(),
        str(operation.get("api_path") or operation.get("path") or ""),
        str(operation.get("document") or ""),
        str(operation.get("operationId") or ""),
    )


def source_operation_fields(index: dict[str, Any]) -> dict[tuple[str, str, str, str], list[dict[str, Any]]]:
    definitions = source_definition_map(index)
    result: dict[tuple[str, str, str, str], list[dict[str, Any]]] = {}
    for operation in index.get("operations") or []:
        if not isinstance(operation, dict):
            continue
        document = str(operation.get("document") or "")
        schemas = [schema for schema in operation.get("request_schemas") or [] if isinstance(schema, str)]
        fields = source_schema_fields(definitions, schemas[0], document) if schemas else []
        result[operation_key(operation)] = fields
    return result


def main() -> int:
    args = parse_args()
    helper = load_helper()
    entries = helper.load_model(args.model)

    description_mismatches = []
    missing_required = []
    missing_hinted = []
    create_name_missing = []
    string_enum_missing_cli_enum = []
    cli_enum_uppercase_values = []
    optional_enum_missing_cli_enum = []
    cli_optional_enum_uppercase_values = []
    command_to_paths: dict[str, set[str]] = collections.defaultdict(set)
    command_path_to_documents: dict[tuple[str, str], set[str]] = collections.defaultdict(set)
    missing_operations = []
    missing_source_fields = []
    source_enum_mismatch = []
    unresolved_model_refs = []
    source_counts = collections.Counter()

    source_by_operation: dict[tuple[str, str, str, str], list[dict[str, Any]]] = {}
    if args.api_index.exists():
        source_index = json.loads(args.api_index.read_text(encoding="utf-8"))
        source_by_operation = source_operation_fields(source_index)

    for entry in entries:
        command_to_paths[str(entry.get("command") or "")].add(str(entry.get("path") or ""))
        command_path_to_documents[(str(entry.get("command") or ""), str(entry.get("path") or ""))].add(
            str(entry.get("document") or "")
        )
        query = str(entry.get("description") or entry.get("summary") or "").strip()
        if query:
            top = (helper.command_search(query, 1, args.model).get("matches") or [None])[0]
            if not top or family(top.get("path")) != family(entry.get("path")) or top.get("action") != entry.get("action"):
                description_mismatches.append(
                    {
                        "query": query,
                        "expected": {"action": entry.get("action"), "path": entry.get("path")},
                        "top": None
                        if top is None
                        else {"action": top.get("action"), "path": top.get("path"), "score": top.get("score")},
                    }
                )

        fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
        selected = helper.select_template_fields(entry, fields, False)
        selected_names = {str(field.get("name") or "") for field in selected}
        command = str(entry.get("command") or "")

        for field in walk_fields(fields):
            name = str(field.get("name") or "")
            if not name:
                continue
            enum_values = field.get("enum") if isinstance(field.get("enum"), list) else []
            cli_values = field.get("cli_enum") if isinstance(field.get("cli_enum"), list) else []
            if field.get("type") == "string" and enum_values:
                if not cli_values:
                    string_enum_missing_cli_enum.append({"command": command, "path": entry.get("path"), "field": name})
                for value in cli_values:
                    if str(value) != str(value).lower():
                        cli_enum_uppercase_values.append(
                            {"command": command, "path": entry.get("path"), "field": name, "value": value}
                        )
            optional_values = field.get("optionalEnum") if isinstance(field.get("optionalEnum"), list) else []
            cli_optional_values = field.get("cli_optionalEnum") if isinstance(field.get("cli_optionalEnum"), list) else []
            if field.get("type") == "string" and optional_values:
                if not cli_optional_values:
                    optional_enum_missing_cli_enum.append(
                        {"command": command, "path": entry.get("path"), "field": name}
                    )
                for value in cli_optional_values:
                    if str(value) != str(value).lower():
                        cli_optional_enum_uppercase_values.append(
                            {"command": command, "path": entry.get("path"), "field": name, "value": value}
                        )
            field_path = str(field.get("_path") or name)
            is_nested = "." in field_path
            if not is_nested and field.get("required") and f"[{name}]" not in command and name not in selected_names:
                missing_required.append({"command": command, "path": entry.get("path"), "field": name})

        if source_by_operation:
            key = operation_key(entry)
            source_fields = source_by_operation.get(key)
            if source_fields is None:
                missing_operations.append(
                    {
                        "command": command,
                        "method": entry.get("method"),
                        "api_path": entry.get("api_path"),
                        "document": entry.get("document"),
                        "operationId": entry.get("operationId"),
                    }
                )
            else:
                source_map = flatten_field_paths(source_fields)
                model_map = flatten_field_paths(fields)
                source_counts["source_fields"] += len(source_map)
                source_counts["model_fields"] += len(model_map)
                for field_path, source_field in source_map.items():
                    if source_field.get("type") == "object" and source_field.get("properties"):
                        source_counts["source_object_with_props"] += 1
                    if field_path.endswith("[]") and source_field.get("type") == "object" and source_field.get("properties"):
                        source_counts["source_array_object_items"] += 1
                    model_field = model_map.get(field_path)
                    if not model_field:
                        missing_source_fields.append(
                            {"command": command, "path": entry.get("path"), "document": entry.get("document"), "field": field_path}
                        )
                        continue
                    for enum_key in ("enum", "optionalEnum"):
                        source_values = source_field.get(enum_key) if isinstance(source_field.get(enum_key), list) else []
                        model_values = model_field.get(enum_key) if isinstance(model_field.get(enum_key), list) else []
                        missing_values = sorted({str(value) for value in source_values} - {str(value) for value in model_values})
                        if missing_values:
                            source_enum_mismatch.append(
                                {
                                    "command": command,
                                    "path": entry.get("path"),
                                    "document": entry.get("document"),
                                    "field": field_path,
                                    enum_key: missing_values,
                                }
                            )
                for field_path, model_field in model_map.items():
                    model_type = str(model_field.get("type") or "")
                    if model_type.startswith("/api/") or (
                        model_field.get("ref")
                        and not model_field.get("properties")
                        and not model_field.get("enum")
                        and not model_field.get("optionalEnum")
                        and model_type not in {"string", "integer", "number", "boolean", "array", "object"}
                    ):
                        unresolved_model_refs.append(
                            {
                                "command": command,
                                "path": entry.get("path"),
                                "document": entry.get("document"),
                                "field": field_path,
                                "type": model_type,
                                "ref": model_field.get("ref"),
                            }
                        )

        for field in helper.fields_with_required_hints(fields):
            name = str(field.get("name") or "")
            if entry.get("path") == "debug/sys/maintenance-passwd" and name in {"pk_password", "pk_ssh_password"}:
                continue
            if name and name not in selected_names:
                missing_hinted.append({"command": command, "path": entry.get("path"), "field": name})

        if entry.get("action") == "create":
            field_names = {str(field.get("name") or "") for field in fields}
            if "name" in field_names and "[name]" not in command and "name" not in selected_names:
                # token creation returns a token named `name`; it is not an object name input.
                if entry.get("path") != "token":
                    create_name_missing.append({"command": command, "path": entry.get("path")})

    duplicate_commands = [
        {"command": command, "paths": sorted(paths)}
        for command, paths in sorted(command_to_paths.items())
        if command and len(paths) > 1
    ]
    duplicate_command_paths = [
        {"command": command, "path": path, "documents": sorted(documents)}
        for (command, path), documents in sorted(command_path_to_documents.items())
        if command and path and len(documents) > 1
    ]

    result = {
        "ok": not missing_required
        and not missing_hinted
        and not create_name_missing
        and not string_enum_missing_cli_enum
        and not cli_enum_uppercase_values
        and not optional_enum_missing_cli_enum
        and not cli_optional_enum_uppercase_values
        and not missing_operations
        and not missing_source_fields
        and not source_enum_mismatch
        and not unresolved_model_refs,
        "entries": len(entries),
        "duplicate_command_requires_path": len(duplicate_commands),
        "duplicate_command_path_requires_document": len(duplicate_command_paths),
        "description_family_action_mismatch": len(description_mismatches),
        "missing_required": len(missing_required),
        "missing_required_hint": len(missing_hinted),
        "create_name_missing": len(create_name_missing),
        "string_enum_missing_cli_enum": len(string_enum_missing_cli_enum),
        "cli_enum_uppercase_values": len(cli_enum_uppercase_values),
        "optional_enum_missing_cli_enum": len(optional_enum_missing_cli_enum),
        "cli_optional_enum_uppercase_values": len(cli_optional_enum_uppercase_values),
        "source_alignment": {
            "enabled": bool(source_by_operation),
            "source_operations": len(source_by_operation),
            "missing_operations": len(missing_operations),
            "source_fields": source_counts["source_fields"],
            "model_fields": source_counts["model_fields"],
            "source_object_with_props": source_counts["source_object_with_props"],
            "source_array_object_items": source_counts["source_array_object_items"],
            "missing_source_fields": len(missing_source_fields),
            "source_enum_mismatch": len(source_enum_mismatch),
            "unresolved_model_refs": len(unresolved_model_refs),
        },
        "samples": {
            "description_family_action_mismatch": description_mismatches[: args.sample_limit],
            "missing_required": missing_required[: args.sample_limit],
            "missing_required_hint": missing_hinted[: args.sample_limit],
            "create_name_missing": create_name_missing[: args.sample_limit],
            "string_enum_missing_cli_enum": string_enum_missing_cli_enum[: args.sample_limit],
            "cli_enum_uppercase_values": cli_enum_uppercase_values[: args.sample_limit],
            "optional_enum_missing_cli_enum": optional_enum_missing_cli_enum[: args.sample_limit],
            "cli_optional_enum_uppercase_values": cli_optional_enum_uppercase_values[: args.sample_limit],
            "missing_operations": missing_operations[: args.sample_limit],
            "missing_source_fields": missing_source_fields[: args.sample_limit],
            "source_enum_mismatch": source_enum_mismatch[: args.sample_limit],
            "unresolved_model_refs": unresolved_model_refs[: args.sample_limit],
            "duplicate_command_requires_path": duplicate_commands[: args.sample_limit],
            "duplicate_command_path_requires_document": duplicate_command_paths[: args.sample_limit],
        },
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
