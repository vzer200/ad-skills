from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from api_patches import apply_versioned_api_patches
from ad_ops_common import METHODS, load_swagger_docs_with_node, read_json, skill_paths, write_json


SUMMARY_KEYS = (
    "enum",
    "optionalEnum",
    "default",
    "example",
    "readOnly",
    "writeOnly",
    "minimum",
    "maximum",
    "minLength",
    "maxLength",
)
COMMON_REF_PREFIX = "/api/{common}.yaml#/"


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a searchable index for bundled AD API documents.")
    parser.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root containing references/api-docs.")
    return parser.parse_args(argv)


def ref_tail(ref: str) -> str:
    for prefix in ("#/definitions/", f"{COMMON_REF_PREFIX}definitions/"):
        if ref.startswith(prefix):
            return ref[len(prefix) :]
    return ref


def resolve_ref(value: Any, doc: dict[str, Any], common_doc: dict[str, Any], section: str) -> Any:
    if not isinstance(value, dict):
        return value
    ref = value.get("$ref")
    if not isinstance(ref, str):
        return value
    local_prefix = f"#/{section}/"
    common_prefix = f"{COMMON_REF_PREFIX}{section}/"
    source = doc
    if ref.startswith(local_prefix):
        name = ref[len(local_prefix) :]
    elif ref.startswith(common_prefix):
        name = ref[len(common_prefix) :]
        source = common_doc
    else:
        return value
    resolved = source.get(section, {}).get(name)
    if not isinstance(resolved, dict):
        return value
    merged = dict(resolved)
    for key, item in value.items():
        if key != "$ref":
            merged[key] = item
    return merged


def collect_schema_refs(schema: Any) -> list[str]:
    refs: list[str] = []

    def walk(value: Any) -> None:
        if isinstance(value, dict):
            ref = value.get("$ref")
            if isinstance(ref, str):
                refs.append(ref_tail(ref))
            for key in ("schema", "items", "additionalProperties", "not"):
                walk(value.get(key))
            for key in ("allOf", "anyOf", "oneOf"):
                for item in value.get(key, []) or []:
                    walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(schema)
    return sorted(set(refs))


def summarize_schema(schema: Any) -> dict[str, Any]:
    if not isinstance(schema, dict):
        return {}
    summary: dict[str, Any] = {}
    for key in ("type", "format", "description"):
        if key in schema and schema[key] is not None:
            summary[key] = schema[key]
    if isinstance(schema.get("$ref"), str):
        summary["ref"] = ref_tail(schema["$ref"])
    if isinstance(schema.get("items"), dict):
        item_summary = summarize_schema(schema["items"])
        if item_summary:
            summary["items"] = item_summary
    required = schema.get("required") or []
    required_names = set(required) if isinstance(required, list) else set()
    properties = []
    for prop_name, prop_schema in (schema.get("properties") or {}).items():
        if not isinstance(prop_schema, dict):
            continue
        prop = {"name": prop_name, "required": prop_name in required_names}
        prop.update(summarize_schema(prop_schema))
        properties.append(prop)
    if properties:
        summary["properties"] = properties
    for key in SUMMARY_KEYS:
        if key in schema:
            summary[key] = schema[key]
    return summary


def summarize_definition(name: str, definition: Any, document: str) -> dict[str, Any]:
    if not isinstance(definition, dict):
        return {"name": name, "document": document, "raw": definition}

    required = definition.get("required") or []
    properties = []
    for prop_name, prop_schema in (definition.get("properties") or {}).items():
        prop = {"name": prop_name, "required": prop_name in required}
        prop.update(summarize_schema(prop_schema))
        properties.append(prop)

    summary: dict[str, Any] = {
        "name": name,
        "document": document,
        "type": definition.get("type"),
        "required": required,
        "properties": properties,
    }
    if definition.get("description") is not None:
        summary["description"] = definition["description"]
    for key in SUMMARY_KEYS:
        if key in definition:
            summary[key] = definition[key]
    return {key: value for key, value in summary.items() if value is not None}


def collect_sfcli_examples(doc: dict[str, Any]) -> list[dict[str, Any]]:
    examples: list[dict[str, Any]] = []
    for path, path_item in sorted((doc.get("paths") or {}).items()):
        if not isinstance(path_item, dict):
            continue
        for example in path_item.get("__sfcli_example__", []) or []:
            if isinstance(example, dict):
                examples.append({"path": path, **example})
            else:
                examples.append({"path": path, "example": example})
    return examples


def build_parameter_summary(parameter: Any, doc: dict[str, Any], common_doc: dict[str, Any]) -> dict[str, Any]:
    resolved = resolve_ref(parameter, doc, common_doc, "parameters")
    if not isinstance(resolved, dict):
        return {"raw": resolved}
    summary = {
        "name": resolved.get("name"),
        "in": resolved.get("in"),
        "required": resolved.get("required", False),
        "description": resolved.get("description"),
        "schema_refs": collect_schema_refs(resolved.get("schema")),
    }
    for key in ("type", "format", "default", "example", "enum", "optionalEnum"):
        if key in resolved:
            summary[key] = resolved[key]
    if isinstance(parameter, dict) and isinstance(parameter.get("$ref"), str):
        summary["ref"] = parameter["$ref"]
    return {key: value for key, value in summary.items() if value not in (None, [], {})}


def build_operation(
    document: str,
    path: str,
    method: str,
    path_item: dict[str, Any],
    operation: dict[str, Any],
    doc: dict[str, Any],
    common_doc: dict[str, Any],
) -> dict[str, Any]:
    parameters = list(path_item.get("parameters", []) or []) + list(operation.get("parameters", []) or [])
    resolved_parameters = [resolve_ref(parameter, doc, common_doc, "parameters") for parameter in parameters]
    request_schemas = sorted(
        {
            schema_ref
            for parameter in resolved_parameters
            if isinstance(parameter, dict) and parameter.get("in") == "body"
            for schema_ref in collect_schema_refs(parameter.get("schema"))
        }
    )

    response_schemas = []
    for status, response in sorted((operation.get("responses") or {}).items()):
        resolved = resolve_ref(response, doc, common_doc, "responses")
        response_schemas.append(
            {
                "status": str(status),
                "refs": collect_schema_refs(resolved.get("schema") if isinstance(resolved, dict) else None),
            }
        )

    return {
        "path": path,
        "method": method,
        "document": document,
        "operationId": operation.get("operationId"),
        "summary": operation.get("summary"),
        "description": operation.get("description"),
        "path_description": path_item.get("description"),
        "tags": operation.get("tags", []),
        "parameters": [build_parameter_summary(parameter, doc, common_doc) for parameter in parameters],
        "request_schemas": request_schemas,
        "response_schemas": response_schemas,
        "responses": sorted(str(status) for status in (operation.get("responses") or {})),
    }


def build_index(skill_root: Path) -> dict[str, Any]:
    paths = skill_paths(skill_root)
    docs = load_swagger_docs_with_node(paths.api_docs)
    version_metadata = {}
    version_path = paths.references / "api-version.json"
    if version_path.exists():
        api_version = read_json(version_path)
        version_metadata = {
            key: api_version[key]
            for key in ("version", "file_count", "sha256")
            if key in api_version
        }

    apply_versioned_api_patches(skill_root, docs, version_metadata)
    docs_by_rel = {entry["rel"]: entry["doc"] for entry in docs}
    common_doc = docs_by_rel.get("{common}.js", {})
    documents: list[dict[str, Any]] = []
    operations: list[dict[str, Any]] = []
    definitions: list[dict[str, Any]] = []
    path_catalog: list[dict[str, Any]] = []

    for entry in docs:
        rel = entry["rel"]
        doc = entry["doc"]
        doc_paths = doc.get("paths") or {}
        sfcli_examples = collect_sfcli_examples(doc)
        documents.append(
            {
                "rel": rel,
                "title": (doc.get("info") or {}).get("title"),
                "version": (doc.get("info") or {}).get("version"),
                "path_count": len(doc_paths),
                "definition_count": len(doc.get("definitions") or {}),
                "sfcli_examples": sfcli_examples,
            }
        )

        for definition_name, definition in sorted((doc.get("definitions") or {}).items()):
            definitions.append(summarize_definition(definition_name, definition, rel))

        for path, path_item in sorted(doc_paths.items()):
            if not isinstance(path_item, dict):
                continue
            methods = []
            for method in METHODS:
                operation = path_item.get(method)
                if not isinstance(operation, dict):
                    continue
                methods.append(method)
                operations.append(build_operation(rel, path, method, path_item, operation, doc, common_doc))
            if methods:
                path_catalog.append({"path": path, "methods": methods, "document": rel})

    index = {
        "api_version": version_metadata,
        "documents": sorted(documents, key=lambda item: item["rel"]),
        "operations": sorted(operations, key=lambda item: (item["path"], item["method"], item["document"])),
        "definitions": sorted(definitions, key=lambda item: (item["name"], item["document"])),
    }
    write_json(paths.references / "api-index.json", index)
    write_json(paths.generated / "path-catalog.json", sorted(path_catalog, key=lambda item: (item["path"], item["document"])))
    return index


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        index = build_index(args.skill_root)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(json.dumps({"documents": len(index["documents"]), "operations": len(index["operations"]), "definitions": len(index["definitions"])}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
