from __future__ import annotations

import argparse
import json
import re
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

from ad_ops_common import (
    operation_count,
    DEFAULT_PLAN_NAME,
    read_json,
    resolve_file_path,
    short_summary,
    skill_paths,
    tmp_file_path,
    update_artifacts,
    workdir_path,
    write_json,
)
from dependency_order import load_resource_order, sorted_by_dependency_order
from resolve_schema import definition_map, find_definition, properties_list, resolve_ref_schema, resolve_schema


ROLLBACK_POLICY = {
    "create": "delete-created-resource",
    "patch": "restore-previous-snapshot",
    "replace": "restore-previous-snapshot",
    "delete": "recreate-previous-snapshot",
}

ACTION_METHODS = {
    "create": "post",
    "patch": "patch",
    "replace": "put",
    "delete": "delete",
}

PATH_PARAMETER_RE = re.compile(r"{([^{}]+)}")


class PlanError(ValueError):
    pass


OMIT = object()


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Plan validated AD API operations from a filled YAML payload.")
    parser.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root.")
    parser.add_argument("--schema", help="Schema name, for example config.virtual_service.")
    parser.add_argument("--document", help="Optional document constraint, for example slb/virtual-service/http.js.")
    parser.add_argument("--action", choices=sorted(ACTION_METHODS), help="Operation action.")
    parser.add_argument("--input", type=Path, help="Filled YAML input.")
    parser.add_argument("--bundle", type=Path, help="Filled YAML bundle with an operations list.")
    parser.add_argument("--out", type=Path, help="Optional JSON plan output path.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    return parser.parse_args(argv)


def field_name(path: str) -> str:
    return path.split(".", 1)[0].split("[]", 1)[0]


def get_path_value(data: Any, path: str) -> tuple[bool, Any]:
    current = data
    for part in path.split("."):
        if "[]" in part:
            part = part.split("[]", 1)[0]
            if not isinstance(current, dict) or part not in current:
                return False, None
            current = current[part]
            if not isinstance(current, list) or not current:
                return False, None
            current = current[0]
            continue
        if not isinstance(current, dict) or part not in current:
            return False, None
        current = current[part]
    return True, current


def iter_path_values(data: Any, path: str) -> list[tuple[str, Any]]:
    def walk(current: Any, parts: list[str], label: str) -> list[tuple[str, Any]]:
        if not parts:
            return [(label, current)]

        part = parts[0]
        if "[]" in part:
            key = part.split("[]", 1)[0]
            if not isinstance(current, dict) or key not in current or not isinstance(current[key], list):
                return []
            values: list[tuple[str, Any]] = []
            for index, item in enumerate(current[key]):
                item_label = f"{label}.{key}[{index}]" if label else f"{key}[{index}]"
                values.extend(walk(item, parts[1:], item_label))
            return values

        if not isinstance(current, dict) or part not in current:
            return []
        next_label = f"{label}.{part}" if label else part
        return walk(current[part], parts[1:], next_label)

    return walk(data, path.split("."), "")


def validate_type(field: dict[str, Any], value: Any) -> None:
    expected = field.get("type")
    path = field.get("path", "<unknown>")
    if expected == "string" and not isinstance(value, str):
        raise PlanError(f"{path}: expected string")
    if expected == "integer" and (not isinstance(value, int) or isinstance(value, bool)):
        raise PlanError(f"{path}: expected integer")
    if expected == "number" and (not isinstance(value, (int, float)) or isinstance(value, bool)):
        raise PlanError(f"{path}: expected number")
    if expected == "boolean" and not isinstance(value, bool):
        raise PlanError(f"{path}: expected boolean")
    if expected == "array" and not isinstance(value, list):
        raise PlanError(f"{path}: expected array")
    if expected == "object" and not isinstance(value, dict):
        raise PlanError(f"{path}: expected object")


def validate_enum(field: dict[str, Any], value: Any) -> None:
    enum = field.get("enum")
    if isinstance(enum, list) and value not in enum:
        allowed = ", ".join(str(item) for item in enum)
        raise PlanError(f"{field.get('path', '<unknown>')}: expected one of {allowed}")


def validate_limits(field: dict[str, Any], value: Any) -> None:
    path = field.get("path", "<unknown>")
    minimum = field.get("minimum")
    maximum = field.get("maximum")
    if minimum is not None and isinstance(value, (int, float)) and not isinstance(value, bool) and value < minimum:
        raise PlanError(f"{path}: expected >= {minimum}")
    if maximum is not None and isinstance(value, (int, float)) and not isinstance(value, bool) and value > maximum:
        raise PlanError(f"{path}: expected <= {maximum}")

    min_length = field.get("minLength")
    max_length = field.get("maxLength")
    if min_length is not None and isinstance(value, str) and len(value) < min_length:
        raise PlanError(f"{path}: expected length >= {min_length}")
    if max_length is not None and isinstance(value, str) and len(value) > max_length:
        raise PlanError(f"{path}: expected length <= {max_length}")


def validate_field_value(field: dict[str, Any], value: Any) -> None:
    validate_type(field, value)
    validate_enum(field, value)
    validate_limits(field, value)


def schema_properties(schema: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {item["name"]: item for item in properties_list(schema) if isinstance(item.get("name"), str)}


def item_field(path: str, schema: dict[str, Any]) -> dict[str, Any]:
    field = dict(schema)
    field["path"] = path
    return field


def validate_array_items(
    path: str,
    item_schema: dict[str, Any],
    value: list[Any],
    definitions: dict[str, list[dict[str, Any]]],
    document: str | None,
) -> None:
    effective = resolve_ref_schema(item_schema, definitions, document)
    expected = effective.get("type")
    if expected in {"string", "integer", "number", "boolean", "array", "object"}:
        for item in value:
            validate_field_value(item_field(f"{path}[]", effective), item)
    if expected == "object":
        child_properties = schema_properties(effective)
        for item in value:
            if not isinstance(item, dict):
                continue
            for child_name, child_schema in child_properties.items():
                if child_name not in item:
                    continue
                child_value = item[child_name]
                child_path = f"{path}[].{child_name}"
                validate_field_value(item_field(child_path, child_schema), child_value)
                if (
                    child_schema.get("type") == "array"
                    and isinstance(child_schema.get("items"), dict)
                    and isinstance(child_value, list)
                ):
                    validate_array_items(child_path, child_schema["items"], child_value, definitions, document)


def validate_top_level_array_items(
    payload: dict[str, Any],
    schema: dict[str, Any],
    definitions: dict[str, list[dict[str, Any]]],
    document: str | None,
) -> None:
    for name, property_schema in schema_properties(schema).items():
        if property_schema.get("type") != "array" or not isinstance(property_schema.get("items"), dict):
            continue
        if name not in payload:
            continue
        value = payload[name]
        if isinstance(value, list):
            validate_array_items(name, property_schema["items"], value, definitions, document)


def validate_payload(
    payload: dict[str, Any],
    resolved: dict[str, Any],
    action: str,
    schema: dict[str, Any] | None = None,
    definitions: dict[str, list[dict[str, Any]]] | None = None,
) -> None:
    if "name" not in payload:
        raise PlanError("missing required field: name")

    enforce_required = action in {"create", "replace"}
    if enforce_required:
        for name in resolved.get("required", []) or []:
            if name not in payload:
                raise PlanError(f"missing required field: {name}")

    for field in resolved.get("fields", []) or []:
        if field.get("readOnly") is True:
            continue
        exists, value = get_path_value(payload, field["path"])
        if not exists:
            if (
                enforce_required
                and field.get("required")
                and "[]" not in field["path"]
                and ("." not in field["path"] or get_path_value(payload, field["path"].rsplit(".", 1)[0])[0])
            ):
                raise PlanError(f"missing required field: {field['path']}")
            continue
        for value_path, value in iter_path_values(payload, field["path"]):
            value_field = dict(field)
            value_field["path"] = value_path
            validate_field_value(value_field, value)

    if action != "delete" and schema and definitions:
        validate_top_level_array_items(payload, schema, definitions, resolved.get("document"))


def remove_read_only(payload: dict[str, Any], resolved: dict[str, Any]) -> dict[str, Any]:
    read_only = {field_name(field["path"]) for field in resolved.get("fields", []) or [] if field.get("readOnly") is True}
    return {key: value for key, value in payload.items() if key not in read_only}


def normalize_empty_reserve(value: Any, label: str = "empty_reserve") -> set[str]:
    if value is None:
        return set()
    if not isinstance(value, list) or any(not isinstance(item, str) or not item for item in value):
        raise PlanError(f"{label} must be a list of non-empty payload paths")
    return set(value)


def child_payload_path(path: str, key: str) -> str:
    return f"{path}.{key}" if path else key


def array_item_path(path: str) -> str:
    return f"{path}[]" if path else "[]"


def is_reserved(path: str, empty_reserve: set[str]) -> bool:
    return path in empty_reserve


def prune_unfilled_with_reserve(value: Any, empty_reserve: set[str], path: str = "") -> Any:
    if value is None or value == "":
        return value if is_reserved(path, empty_reserve) else OMIT

    if isinstance(value, dict):
        if not value:
            return value if is_reserved(path, empty_reserve) else OMIT
        cleaned: dict[str, Any] = {}
        for key, child in value.items():
            pruned = prune_unfilled_with_reserve(child, empty_reserve, child_payload_path(path, str(key)))
            if pruned is not OMIT:
                cleaned[key] = pruned
        if cleaned:
            return cleaned
        return {} if is_reserved(path, empty_reserve) else OMIT

    if isinstance(value, list):
        if not value:
            return value if is_reserved(path, empty_reserve) else OMIT
        cleaned_list: list[Any] = []
        item_path = array_item_path(path)
        for item in value:
            pruned = prune_unfilled_with_reserve(item, empty_reserve, item_path)
            if pruned is not OMIT:
                cleaned_list.append(pruned)
        if cleaned_list:
            return cleaned_list
        return [] if is_reserved(path, empty_reserve) else OMIT

    return value


def prune_payload(data: Any, empty_reserve: set[str] | None = None) -> dict[str, Any]:
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise PlanError("input YAML must be an object")
    payload = dict(data)
    inline_reserve = normalize_empty_reserve(payload.pop("empty_reserve", None))
    reserves = set(empty_reserve or set()) | inline_reserve
    pruned = prune_unfilled_with_reserve(payload, reserves)
    if pruned is OMIT:
        return {}
    if not isinstance(pruned, dict):
        raise PlanError("input YAML must be an object")
    return pruned


def load_payload(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return prune_payload(data)


def operation_method(action: str) -> str:
    try:
        return ACTION_METHODS[action]
    except KeyError as exc:
        raise PlanError(f"unsupported action: {action}") from exc


def operation_score(operation: dict[str, Any], document: str | None, prefer_resource: bool) -> tuple[int, int, int, str]:
    path = str(operation.get("path", ""))
    document_score = 0 if document and operation.get("document") == document else 1
    resource_score = 0 if ("{name}" in path) == prefer_resource else 1
    return (document_score, resource_score, len(path), path)


def find_operation(index: dict[str, Any], schema: str, action: str, document: str | None) -> dict[str, Any]:
    method = operation_method(action)
    candidates = [
        operation
        for operation in index.get("operations", []) or []
        if operation.get("method") == method and schema in (operation.get("request_schemas") or [])
    ]
    if document:
        candidates = [operation for operation in candidates if operation.get("document") == document]
    if action == "delete":
        candidates = [
            operation
            for operation in index.get("operations", []) or []
            if operation.get("method") == method
            and (operation.get("document") == document or not document)
            and "{name}" in str(operation.get("path", ""))
        ]
    if not candidates:
        raise PlanError(f"operation not found for {action} {schema}")
    return sorted(candidates, key=lambda item: operation_score(item, document, prefer_resource=action != "create"))[0]


def find_resource_path(index: dict[str, Any], schema: str, document: str | None, base_operation: dict[str, Any]) -> str:
    base_path = str(base_operation.get("path", ""))
    candidates = [
        operation
        for operation in index.get("operations", []) or []
        if operation.get("method") == "get"
        and "{name}" in str(operation.get("path", ""))
        and (operation.get("document") == document or not document)
        and any(schema == ref for response in operation.get("response_schemas", []) or [] for ref in response.get("refs", []) or [])
    ]
    if not candidates:
        candidates = [
            operation
            for operation in index.get("operations", []) or []
            if operation.get("document") == base_operation.get("document")
            and "{name}" in str(operation.get("path", ""))
            and str(operation.get("path", "")).rstrip("/").startswith(base_path.rstrip("/"))
        ]
    if candidates:
        return str(sorted(candidates, key=lambda item: operation_score(item, document, prefer_resource=True))[0]["path"])
    if "{name}" in base_path:
        return base_path
    return base_path.rstrip("/") + "/{name}"


def path_parameter_names(path: str) -> list[str]:
    names: list[str] = []
    for match in PATH_PARAMETER_RE.finditer(path):
        name = match.group(1)
        if name not in names:
            names.append(name)
    return names


def path_parameter_metadata(operation: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        parameter["name"]: parameter
        for parameter in operation.get("parameters", []) or []
        if parameter.get("in") == "path" and isinstance(parameter.get("name"), str)
    }


def typed_path_parameter_value(parameter: dict[str, Any], value: Any) -> Any:
    parameter_type = parameter.get("type")
    name = parameter.get("name", "<unknown>")
    if parameter_type == "integer":
        if isinstance(value, bool):
            raise PlanError(f"{name}: expected integer")
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise PlanError(f"{name}: expected integer") from exc
    if parameter_type == "number":
        if isinstance(value, bool):
            raise PlanError(f"{name}: expected number")
        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise PlanError(f"{name}: expected number") from exc
    if parameter_type == "boolean":
        if isinstance(value, bool):
            return value
        if isinstance(value, str) and value.lower() in {"true", "false"}:
            return value.lower() == "true"
        raise PlanError(f"{name}: expected boolean")
    if parameter_type == "string" and not isinstance(value, str):
        raise PlanError(f"{name}: expected string")
    return value


def validate_path_parameter_value(parameter: dict[str, Any], value: Any) -> str:
    typed_value = typed_path_parameter_value(parameter, value)
    enum = parameter.get("enum")
    if isinstance(enum, list) and typed_value not in enum:
        allowed = ", ".join(str(item) for item in enum)
        raise PlanError(f"{parameter.get('name', '<unknown>')}: expected one of {allowed}")
    return str(typed_value).lower() if isinstance(typed_value, bool) else str(typed_value)


def collect_path_parameters(
    paths: list[str],
    payload: dict[str, Any],
    name_field: str,
    name: str,
    operation: dict[str, Any],
) -> dict[str, str]:
    required = []
    for path in paths:
        required.extend(path_parameter_names(path))
    required = list(dict.fromkeys(required))

    parameter_metadata = path_parameter_metadata(operation)
    values: dict[str, str] = {name_field: name}
    missing: list[str] = []
    for parameter in required:
        value = values.get(parameter, payload.get(parameter))
        if value is None or value == "":
            missing.append(parameter)
            continue
        metadata = parameter_metadata.get(parameter)
        values[parameter] = validate_path_parameter_value(metadata, value) if metadata else str(value)

    if missing:
        raise PlanError("missing path parameter(s): " + ", ".join(missing))
    return values


def materialize_path(path: str, path_parameters: dict[str, str]) -> str:
    def replace(match: re.Match[str]) -> str:
        parameter = match.group(1)
        if parameter not in path_parameters:
            raise PlanError(f"missing path parameter(s): {parameter}")
        return path_parameters[parameter]

    materialized = PATH_PARAMETER_RE.sub(replace, path)
    if "{" in materialized or "}" in materialized:
        raise PlanError(f"unresolved path template: {materialized}")
    return materialized


def schema_field_names(resolved: dict[str, Any]) -> set[str]:
    return {field_name(field["path"]) for field in resolved.get("fields", []) or []}


def operation_payload(payload: dict[str, Any], resolved: dict[str, Any], path_parameters: dict[str, str]) -> dict[str, Any]:
    fields = schema_field_names(resolved)
    return {
        key: value
        for key, value in payload.items()
        if key in fields or key not in path_parameters
    }


def build_plan(
    index: dict[str, Any],
    schema: str,
    action: str,
    payload: dict[str, Any],
    resolved: dict[str, Any],
    operation_id: str | None = None,
) -> dict[str, Any]:
    operation = find_operation(index, schema, action, resolved.get("document"))
    name_field = "name"
    name = payload.get(name_field)
    if not isinstance(name, str) or not name:
        raise PlanError("missing required field: name")

    resource_path = find_resource_path(index, schema, resolved.get("document"), operation)
    operation_path = str(operation["path"])
    path_parameters = collect_path_parameters([operation_path, resource_path], payload, name_field, name, operation)
    operation_path = materialize_path(operation_path, path_parameters)
    verify_path = materialize_path(resource_path, path_parameters)
    request_payload = operation_payload(payload, resolved, path_parameters)
    operation_id = operation_id or f"{action}-{schema}-{name}"
    return {
        "version": 1,
        "operations": [
            {
                "id": operation_id,
                "action": action,
                "schema": schema,
                "method": str(operation["method"]).upper(),
                "path": operation_path,
                "resource_path": resource_path,
                "path_parameters": path_parameters,
                "name_field": name_field,
                "name": name,
                "payload": request_payload,
            }
        ],
        "verify": [
            {
                "operation_id": operation_id,
                "method": "GET",
                "path": verify_path,
                "expected": {} if action == "delete" else request_payload,
            }
        ],
        "rollback_policy": ROLLBACK_POLICY,
    }


def build_validated_plan(
    index: dict[str, Any],
    definitions: dict[str, list[dict[str, Any]]],
    schema_name: str,
    action: str,
    payload: dict[str, Any],
    document: str | None = None,
    operation_id: str | None = None,
) -> dict[str, Any]:
    resolved = resolve_schema(index, schema_name, document)
    schema = find_definition(definitions, schema_name, resolved.get("document"))
    payload = remove_read_only(payload, resolved)
    validate_payload(payload, resolved, action, schema, definitions)
    return build_plan(index, schema_name, action, payload, resolved, operation_id)


def load_bundle(path: Path) -> list[dict[str, Any]]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise PlanError("bundle YAML must be an object")
    operations = data.get("operations")
    if not isinstance(operations, list) or not operations:
        raise PlanError("bundle YAML must include a non-empty operations list")
    normalized: list[dict[str, Any]] = []
    for index, operation in enumerate(operations, start=1):
        if not isinstance(operation, dict):
            raise PlanError(f"operations[{index}]: expected object")
        if operation.get("enabled") is False:
            continue
        schema_name = operation.get("schema")
        action = operation.get("action")
        if not isinstance(schema_name, str) or not schema_name:
            raise PlanError(f"operations[{index}]: missing schema")
        if not isinstance(action, str) or action not in ACTION_METHODS:
            raise PlanError(f"operations[{index}]: unsupported or missing action")
        document = operation.get("document")
        if document is not None and not isinstance(document, str):
            raise PlanError(f"operations[{index}]: document must be a string")
        operation_id = operation.get("id")
        if operation_id is not None and (not isinstance(operation_id, str) or not operation_id):
            raise PlanError(f"operations[{index}]: id must be a non-empty string")
        payload = operation.get("payload")
        if payload is None:
            payload = {}
        empty_reserve = normalize_empty_reserve(operation.get("empty_reserve"), f"operations[{index}].empty_reserve")
        try:
            payload = prune_payload(payload, empty_reserve)
        except PlanError as exc:
            raise PlanError(f"operations[{index}]: {exc}") from exc
        normalized.append(
            {
                "index": index,
                "id": operation_id,
                "action": action,
                "schema": schema_name,
                "document": document,
                "payload": payload,
            }
        )
    if not normalized:
        raise PlanError("bundle YAML has no enabled operations")
    return normalized


def build_bundle_plan(
    index: dict[str, Any],
    definitions: dict[str, list[dict[str, Any]]],
    bundle_path: Path,
    resource_order: list[str] | None = None,
) -> dict[str, Any]:
    combined = {"version": 1, "operations": [], "verify": [], "rollback_policy": ROLLBACK_POLICY}
    seen_ids: set[str] = set()
    for operation in sorted_by_dependency_order(load_bundle(bundle_path), resource_order):
        label = operation.get("id") or f"operations[{operation['index']}]"
        try:
            plan = build_validated_plan(
                index,
                definitions,
                operation["schema"],
                operation["action"],
                operation["payload"],
                operation.get("document"),
                operation.get("id"),
            )
        except PlanError as exc:
            raise PlanError(f"{label}: {exc}") from exc
        for planned_operation in plan["operations"]:
            operation_id = str(planned_operation.get("id"))
            if operation_id in seen_ids:
                raise PlanError(f"duplicate operation id: {operation_id}")
            seen_ids.add(operation_id)
            combined["operations"].append(planned_operation)
        combined["verify"].extend(plan["verify"])
    return combined


def require_single_operation_args(args: argparse.Namespace) -> None:
    missing = [
        name
        for name in ("schema", "action")
        if getattr(args, name) is None
    ]
    if args.input is None and tmp_file_path() is None:
        missing.append("input")
    if missing:
        raise PlanError("single operation mode requires: " + ", ".join(f"--{name}" for name in missing))


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        paths = skill_paths(args.skill_root)
        index = read_json(paths.references / "api-index.json")
        definitions = definition_map(index)
        if args.bundle:
            plan = build_bundle_plan(index, definitions, args.bundle, load_resource_order(paths.root))
        elif args.schema is None and args.action is None and args.input is None and tmp_file_path() is not None:
            plan = build_bundle_plan(index, definitions, tmp_file_path(), load_resource_order(paths.root))
        else:
            require_single_operation_args(args)
            input_path = resolve_file_path(args.input, "input YAML")
            plan = build_validated_plan(
                index,
                definitions,
                args.schema,
                args.action,
                load_payload(input_path),
                args.document,
            )
    except PlanError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    active_workdir = workdir_path(args.workdir)
    output_path = args.out or (active_workdir / DEFAULT_PLAN_NAME if active_workdir else None)
    if output_path:
        write_json(output_path, plan)
        artifacts = update_artifacts(active_workdir, plan=output_path)
        print(
            short_summary(
                ok=True,
                operation_count=operation_count(plan),
                plan=str(output_path),
                **({"artifacts": str(artifacts)} if artifacts else {}),
            ),
            end="",
        )
    else:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
