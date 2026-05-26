from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from ad_ops_common import read_json, skill_paths


FIELD_KEYS = (
    "path",
    "type",
    "description",
    "required",
    "items",
    "enum",
    "optionalEnum",
    "default",
    "example",
    "minimum",
    "maximum",
    "minLength",
    "maxLength",
    "readOnly",
    "writeOnly",
)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Resolve and flatten an AD API schema from api-index.json.")
    parser.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root.")
    parser.add_argument("--schema", required=True, help="Schema name, for example config.virtual_service.")
    parser.add_argument("--document", help="Optional document constraint, for example slb/virtual-service.js.")
    return parser.parse_args(argv)


def definition_map(index: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    by_name: dict[str, list[dict[str, Any]]] = {}
    for definition in index.get("definitions", []) or []:
        name = definition.get("name")
        if isinstance(name, str):
            by_name.setdefault(name, []).append(definition)
    for definitions in by_name.values():
        definitions.sort(key=lambda item: (len(str(item.get("document", ""))), str(item.get("document", ""))))
    return by_name


def find_definition(
    definitions: dict[str, list[dict[str, Any]]],
    name: str,
    document: str | None = None,
) -> dict[str, Any] | None:
    candidates = definitions.get(name, [])
    if document:
        for candidate in candidates:
            if candidate.get("document") == document:
                return candidate
        return None
    return candidates[0] if candidates else None


def ref_parts(schema: dict[str, Any]) -> tuple[str | None, str | None]:
    ref = schema.get("ref") or schema.get("$ref")
    if not isinstance(ref, str):
        return None, None
    if ref.startswith("#/definitions/"):
        return ref[len("#/definitions/") :], None

    marker = "#/definitions/"
    if marker in ref:
        ref_path, name = ref.split(marker, 1)
        target_document = None
        if ref_path.startswith("/api/") and ref_path.endswith(".yaml"):
            target_document = f"{ref_path[len('/api/'):-len('.yaml')]}.js"
        return name, target_document

    return ref, None


def ref_name(schema: dict[str, Any]) -> str | None:
    return ref_parts(schema)[0]


def find_ref_definition(
    schema: dict[str, Any],
    definitions: dict[str, list[dict[str, Any]]],
    document: str | None,
) -> dict[str, Any] | None:
    ref, target_document = ref_parts(schema)
    if not ref:
        return None

    search_documents: list[str | None] = []
    for candidate in (target_document, document):
        if candidate and candidate not in search_documents:
            search_documents.append(candidate)
    search_documents.append(None)

    for candidate_document in search_documents:
        resolved = find_definition(definitions, ref, candidate_document)
        if resolved:
            return resolved
    return None


def resolve_ref_schema(
    schema: dict[str, Any],
    definitions: dict[str, list[dict[str, Any]]],
    document: str | None,
) -> dict[str, Any]:
    return find_ref_definition(schema, definitions, document) or schema


def merge_ref(
    field: dict[str, Any],
    definitions: dict[str, list[dict[str, Any]]],
    document: str | None,
) -> dict[str, Any]:
    if not ref_name(field):
        return dict(field)
    resolved = find_ref_definition(field, definitions, document)
    if not resolved:
        return dict(field)

    merged = dict(resolved)
    merged.pop("name", None)
    merged.pop("document", None)
    merged.pop("properties", None)
    merged.pop("required", None)
    merged.update({key: value for key, value in field.items() if key != "ref" or value is not None})
    for key in ("type", "description", "enum", "optionalEnum", "default", "example"):
        if key not in field and key in resolved:
            merged[key] = resolved[key]
    return merged


def field_value(field: dict[str, Any], key: str) -> Any:
    if key == "enum":
        return field.get("enum")
    if key == "optionalEnum":
        return field.get("optionalEnum")
    return field.get(key)


def make_field(path: str, source: dict[str, Any], required: bool) -> dict[str, Any]:
    field = {key: field_value(source, key) for key in FIELD_KEYS}
    field["path"] = path
    field["required"] = required
    return field


def properties_list(schema: dict[str, Any]) -> list[dict[str, Any]]:
    properties = schema.get("properties") or []
    if isinstance(properties, dict):
        return [{"name": name, **value} for name, value in properties.items() if isinstance(value, dict)]
    if isinstance(properties, list):
        return [item for item in properties if isinstance(item, dict)]
    return []


def required_names(schema: dict[str, Any]) -> set[str]:
    required = schema.get("required", [])
    return set(required) if isinstance(required, list) else set()


def schema_identity(schema: dict[str, Any], document: str | None) -> tuple[str | None, str] | None:
    name = text_or_none(schema.get("name"))
    if not name:
        return None
    return (text_or_none(schema.get("document")) or document, name)


def flatten_schema(
    schema: dict[str, Any],
    definitions: dict[str, list[dict[str, Any]]],
    document: str | None,
    prefix: str = "",
    parent_required: set[str] | None = None,
    active: set[tuple[str | None, str]] | None = None,
) -> list[dict[str, Any]]:
    active = active or set()
    current_identity = schema_identity(schema, document)
    active = {*active, current_identity} if current_identity else active
    parent_required = parent_required or set()
    fields: list[dict[str, Any]] = []

    for property_schema in properties_list(schema):
        name = property_schema.get("name")
        if not isinstance(name, str) or not name:
            continue
        path = f"{prefix}.{name}" if prefix else name
        required = bool(property_schema.get("required", name in parent_required))
        effective = merge_ref(property_schema, definitions, document)
        fields.append(make_field(path, effective, required))

        nested_schema = effective
        ref_schema = resolve_ref_schema(property_schema, definitions, document)
        if ref_schema is not property_schema:
            nested_schema = ref_schema

        nested_identity = schema_identity(nested_schema, document)
        if nested_identity and nested_identity in active:
            continue
        next_active = {*active, nested_identity} if nested_identity else active

        if nested_schema.get("type") == "object":
            nested_required = required_names(nested_schema)
            fields.extend(flatten_schema(nested_schema, definitions, document, path, nested_required, next_active))
        elif nested_schema.get("type") == "array" and isinstance(nested_schema.get("items"), dict):
            item_schema = nested_schema["items"]
            item_effective = resolve_ref_schema(item_schema, definitions, document)
            item_path = f"{path}[]"
            item_identity = schema_identity(item_effective, document)
            if item_identity and item_identity in active:
                continue
            if item_effective.get("type") == "object" and properties_list(item_effective):
                fields.extend(
                    flatten_schema(
                        item_effective,
                        definitions,
                        document,
                        item_path,
                        required_names(item_effective),
                        {*active, item_identity} if item_identity else active,
                    )
                )
    return fields


def text_or_none(value: Any) -> str | None:
    return value if isinstance(value, str) else None


def resolve_schema(index: dict[str, Any], schema_name: str, document: str | None = None) -> dict[str, Any]:
    definitions = definition_map(index)
    schema = find_definition(definitions, schema_name, document)
    if not schema:
        scope = f" in {document}" if document else ""
        raise ValueError(f"schema not found: {schema_name}{scope}")
    actual_document = text_or_none(schema.get("document"))
    required = schema.get("required", []) or []
    return {
        "schema": schema.get("name"),
        "document": actual_document,
        "required": required,
        "fields": flatten_schema(schema, definitions, actual_document, parent_required=required_names(schema)),
    }


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        paths = skill_paths(args.skill_root)
        index = read_json(paths.references / "api-index.json")
        result = resolve_schema(index, args.schema, args.document)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
