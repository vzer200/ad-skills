from __future__ import annotations

import copy
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
VENDOR_DIR = SCRIPT_DIR / "_vendor"
if VENDOR_DIR.exists() and str(VENDOR_DIR) not in sys.path:
    sys.path.insert(0, str(VENDOR_DIR))
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import yaml

from ad_ops_common import METHODS, skill_paths, write_json


PATCH_REPORT_NAME = "api-patch-report.json"
PATCH_DIR_NAME = "api-patches"


class ApiPatchError(ValueError):
    pass


def patch_files(patch_dir: Path) -> list[Path]:
    if not patch_dir.exists():
        return []
    return sorted(
        path
        for pattern in ("*.yml", "*.yaml")
        for path in patch_dir.glob(pattern)
        if path.is_file()
    )


def patch_id(patch: dict[str, Any], patch_path: Path, index: int) -> str:
    value = patch.get("id")
    if isinstance(value, str) and value:
        return value
    return f"{patch_path.name}#{index}"


def version_matches(patch_doc: dict[str, Any], current_version: str | None) -> bool:
    versions = patch_doc.get("versions", patch_doc.get("version"))
    if isinstance(versions, str):
        return versions == current_version
    if isinstance(versions, list):
        return current_version in versions
    raise ApiPatchError("patch document must include version or versions")


def sha_matches(patch_doc: dict[str, Any], current_sha: str | None) -> bool:
    expected = patch_doc.get("sha256")
    if expected in (None, ""):
        return True
    if isinstance(expected, str):
        return expected == current_sha
    if isinstance(expected, list):
        return current_sha in expected
    raise ApiPatchError("patch sha256 must be a string or list")


def get_document(docs_by_rel: dict[str, dict[str, Any]], document: Any) -> dict[str, Any]:
    if not isinstance(document, str) or not document:
        raise ApiPatchError("patch operation requires document")
    doc = docs_by_rel.get(document)
    if doc is None:
        raise ApiPatchError(f"document not found: {document}")
    return doc


def get_schema(doc: dict[str, Any], schema: Any) -> dict[str, Any]:
    if not isinstance(schema, str) or not schema:
        raise ApiPatchError("schema patch operation requires schema")
    definition = (doc.get("definitions") or {}).get(schema)
    if not isinstance(definition, dict):
        raise ApiPatchError(f"schema not found: {schema}")
    return definition


def strip_array_marker(token: str) -> tuple[str, bool]:
    if token.endswith("[]"):
        return token[:-2], True
    return token, False


def array_item_schema(schema: dict[str, Any]) -> dict[str, Any]:
    item = schema.get("items")
    if not isinstance(item, dict):
        raise ApiPatchError("array field does not define object items")
    return item


def child_schema(schema: dict[str, Any], token: str) -> dict[str, Any]:
    name, wants_item = strip_array_marker(token)
    properties = schema.get("properties") or {}
    if not isinstance(properties, dict) or name not in properties or not isinstance(properties[name], dict):
        raise ApiPatchError(f"field not found: {name}")
    child = properties[name]
    return array_item_schema(child) if wants_item else child


def field_parent(schema: dict[str, Any], field: Any) -> tuple[dict[str, Any], str]:
    if not isinstance(field, str) or not field:
        raise ApiPatchError("field patch operation requires field")
    tokens = field.split(".")
    current = schema
    for token in tokens[:-1]:
        if current.get("type") == "array":
            current = array_item_schema(current)
        current = child_schema(current, token)
    if current.get("type") == "array":
        current = array_item_schema(current)
    field_name, wants_item = strip_array_marker(tokens[-1])
    if wants_item:
        raise ApiPatchError("required field paths cannot end with []")
    properties = current.get("properties") or {}
    if not isinstance(properties, dict) or field_name not in properties or not isinstance(properties[field_name], dict):
        raise ApiPatchError(f"field not found: {field}")
    return current, field_name


def field_schema(schema: dict[str, Any], field: Any) -> dict[str, Any]:
    parent, field_name = field_parent(schema, field)
    return parent["properties"][field_name]


def add_required(schema: dict[str, Any], field: str) -> None:
    parent, field_name = field_parent(schema, field)
    required = parent.setdefault("required", [])
    if not isinstance(required, list):
        raise ApiPatchError("schema required must be a list")
    if field_name not in required:
        required.append(field_name)


def remove_required(schema: dict[str, Any], field: str) -> None:
    parent, field_name = field_parent(schema, field)
    required = parent.get("required", [])
    if not isinstance(required, list):
        raise ApiPatchError("schema required must be a list")
    parent["required"] = [name for name in required if name != field_name]


def replace_field_value(schema: dict[str, Any], field: str, key: str, value: Any) -> None:
    field_schema(schema, field)[key] = value


def paths(doc: dict[str, Any]) -> dict[str, Any]:
    value = doc.setdefault("paths", {})
    if not isinstance(value, dict):
        raise ApiPatchError("document paths must be an object")
    return value


def require_path(doc_paths: dict[str, Any], path: Any) -> dict[str, Any]:
    if not isinstance(path, str) or not path:
        raise ApiPatchError("URI patch operation requires path")
    path_item = doc_paths.get(path)
    if not isinstance(path_item, dict):
        raise ApiPatchError(f"path not found: {path}")
    return path_item


def ensure_target_path(doc_paths: dict[str, Any], target: Any, source_item: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(target, str) or not target:
        raise ApiPatchError("URI patch operation requires target path")
    target_item = doc_paths.get(target)
    metadata = {key: copy.deepcopy(value) for key, value in source_item.items() if key not in METHODS}
    if target_item is None:
        target_item = metadata
        doc_paths[target] = target_item
    elif not isinstance(target_item, dict):
        raise ApiPatchError(f"target path is not an object: {target}")
    else:
        for key, value in metadata.items():
            target_item.setdefault(key, value)
    return target_item


def move_path(doc: dict[str, Any], operation: dict[str, Any]) -> None:
    doc_paths = paths(doc)
    source = operation.get("from")
    target = operation.get("to")
    source_item = require_path(doc_paths, source)
    if not isinstance(target, str) or not target:
        raise ApiPatchError("move_path requires to")
    if target in doc_paths and not operation.get("overwrite"):
        raise ApiPatchError(f"target path already exists: {target}")
    doc_paths[target] = source_item
    del doc_paths[source]


def copy_path(doc: dict[str, Any], operation: dict[str, Any]) -> None:
    doc_paths = paths(doc)
    source = operation.get("from")
    target = operation.get("to")
    source_item = require_path(doc_paths, source)
    if not isinstance(target, str) or not target:
        raise ApiPatchError("copy_path requires to")
    if target in doc_paths and not operation.get("overwrite"):
        raise ApiPatchError(f"target path already exists: {target}")
    doc_paths[target] = copy.deepcopy(source_item)


def remove_path(doc: dict[str, Any], operation: dict[str, Any]) -> None:
    doc_paths = paths(doc)
    source = operation.get("path", operation.get("from"))
    require_path(doc_paths, source)
    del doc_paths[source]


def move_method(doc: dict[str, Any], operation: dict[str, Any]) -> None:
    doc_paths = paths(doc)
    source = operation.get("from")
    target = operation.get("to")
    method = operation.get("method")
    if not isinstance(method, str) or method.lower() not in METHODS:
        raise ApiPatchError("move_method requires a valid method")
    method = method.lower()
    source_item = require_path(doc_paths, source)
    if method not in source_item or not isinstance(source_item[method], dict):
        raise ApiPatchError(f"method not found: {method} {source}")
    target_item = ensure_target_path(doc_paths, target, source_item)
    if method in target_item and not operation.get("overwrite"):
        raise ApiPatchError(f"target method already exists: {method} {target}")
    target_item[method] = source_item.pop(method)


def rename_path_parameter_in_list(parameters: Any, old: str, new: str) -> None:
    if not isinstance(parameters, list):
        return
    for parameter in parameters:
        if isinstance(parameter, dict) and parameter.get("in") == "path" and parameter.get("name") == old:
            parameter["name"] = new


def replace_path_parameter(doc: dict[str, Any], operation: dict[str, Any]) -> None:
    doc_paths = paths(doc)
    source_path = operation.get("path")
    old = operation.get("from")
    new = operation.get("to")
    if not isinstance(old, str) or not old or not isinstance(new, str) or not new:
        raise ApiPatchError("replace_path_parameter requires from and to parameter names")
    path_item = require_path(doc_paths, source_path)
    target_path = str(source_path).replace("{" + old + "}", "{" + new + "}")
    if target_path != source_path:
        if target_path in doc_paths and not operation.get("overwrite"):
            raise ApiPatchError(f"target path already exists: {target_path}")
        doc_paths[target_path] = path_item
        del doc_paths[source_path]
    rename_path_parameter_in_list(path_item.get("parameters"), old, new)
    for method in METHODS:
        method_item = path_item.get(method)
        if isinstance(method_item, dict):
            rename_path_parameter_in_list(method_item.get("parameters"), old, new)


def apply_patch_operation(
    docs_by_rel: dict[str, dict[str, Any]],
    patch: dict[str, Any],
    operation: dict[str, Any],
) -> None:
    op = operation.get("op")
    document = operation.get("document", patch.get("document"))
    doc = get_document(docs_by_rel, document)

    if op in {"add_required", "remove_required", "replace_description", "replace_enum", "set_default", "set_type"}:
        schema = get_schema(doc, operation.get("schema", patch.get("schema")))
        field = operation.get("field")
        if op == "add_required":
            add_required(schema, field)
        elif op == "remove_required":
            remove_required(schema, field)
        elif op == "replace_description":
            replace_field_value(schema, field, "description", operation.get("value"))
        elif op == "replace_enum":
            values = operation.get("values")
            if not isinstance(values, list):
                raise ApiPatchError("replace_enum requires values list")
            replace_field_value(schema, field, "enum", values)
        elif op == "set_default":
            replace_field_value(schema, field, "default", operation.get("value"))
        elif op == "set_type":
            value = operation.get("value")
            if not isinstance(value, str) or not value:
                raise ApiPatchError("set_type requires string value")
            replace_field_value(schema, field, "type", value)
        return

    if op == "move_path":
        move_path(doc, operation)
    elif op == "copy_path":
        copy_path(doc, operation)
    elif op == "remove_path":
        remove_path(doc, operation)
    elif op == "move_method":
        move_method(doc, operation)
    elif op == "replace_path_parameter":
        replace_path_parameter(doc, operation)
    else:
        raise ApiPatchError(f"unsupported patch op: {op}")


def patch_docs_from_file(patch_path: Path) -> list[dict[str, Any]]:
    loaded = list(yaml.safe_load_all(patch_path.read_text(encoding="utf-8")))
    docs = [item for item in loaded if item is not None]
    if not all(isinstance(item, dict) for item in docs):
        raise ApiPatchError(f"patch file must contain YAML objects: {patch_path}")
    return docs


def report_path(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def apply_versioned_api_patches(
    skill_root: Path,
    docs: list[dict[str, Any]],
    api_version: dict[str, Any],
) -> dict[str, Any]:
    paths = skill_paths(skill_root)
    patch_dir = paths.references / PATCH_DIR_NAME
    docs_by_rel = {
        entry["rel"]: entry["doc"]
        for entry in docs
        if isinstance(entry.get("rel"), str) and isinstance(entry.get("doc"), dict)
    }
    report: dict[str, Any] = {
        "api_version": api_version,
        "patch_dir": report_path(patch_dir, paths.root),
        "applied_patches": [],
        "skipped_patches": [],
        "errors": [],
    }
    current_version = api_version.get("version") if isinstance(api_version.get("version"), str) else None
    current_sha = api_version.get("sha256") if isinstance(api_version.get("sha256"), str) else None

    for patch_path in patch_files(patch_dir):
        try:
            patch_documents = patch_docs_from_file(patch_path)
        except ApiPatchError as exc:
            report["errors"].append({"file": report_path(patch_path, paths.root), "error": str(exc)})
            continue

        for doc_index, patch_doc in enumerate(patch_documents, start=1):
            patch_file = report_path(patch_path, paths.root)
            patches = patch_doc.get("patches") or []
            if not isinstance(patches, list):
                report["errors"].append({"file": patch_file, "error": "patches must be a list"})
                continue

            try:
                matches_version = version_matches(patch_doc, current_version)
                matches_sha = sha_matches(patch_doc, current_sha)
            except ApiPatchError as exc:
                report["errors"].append({"file": patch_file, "error": str(exc)})
                continue

            if not matches_version:
                for patch_index, patch in enumerate(patches, start=1):
                    if isinstance(patch, dict):
                        report["skipped_patches"].append(
                            {"file": patch_file, "id": patch_id(patch, patch_path, patch_index), "reason": "version_mismatch"}
                        )
                continue
            if not matches_sha:
                for patch_index, patch in enumerate(patches, start=1):
                    if isinstance(patch, dict):
                        report["skipped_patches"].append(
                            {"file": patch_file, "id": patch_id(patch, patch_path, patch_index), "reason": "sha256_mismatch"}
                        )
                continue

            for patch_index, patch in enumerate(patches, start=1):
                if not isinstance(patch, dict):
                    report["errors"].append({"file": patch_file, "error": "patch entry must be an object"})
                    continue
                patch_name = patch_id(patch, patch_path, patch_index)
                operations = patch.get("operations") or []
                if not isinstance(operations, list) or not operations:
                    report["errors"].append({"file": patch_file, "id": patch_name, "error": "operations must be a non-empty list"})
                    continue
                try:
                    for operation in operations:
                        if not isinstance(operation, dict):
                            raise ApiPatchError("patch operation must be an object")
                        apply_patch_operation(docs_by_rel, patch, operation)
                except ApiPatchError as exc:
                    if patch.get("optional"):
                        report["skipped_patches"].append(
                            {"file": patch_file, "id": patch_name, "reason": "optional_failed", "error": str(exc)}
                        )
                    else:
                        report["errors"].append({"file": patch_file, "id": patch_name, "error": str(exc)})
                    continue
                report["applied_patches"].append(
                    {
                        "file": patch_file,
                        "document_index": doc_index,
                        "id": patch_name,
                        "operation_count": len(operations),
                        "reason": patch.get("reason"),
                    }
                )

    write_json(paths.generated / PATCH_REPORT_NAME, report)
    if report["errors"]:
        first = report["errors"][0]
        raise ApiPatchError(first.get("error") or f"API patch failed: {first}")
    return report
