from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import read_json, resolve_output_path, skill_paths, tmp_file_path, update_artifacts, workdir_path
from dependency_order import load_resource_order, sorted_by_dependency_order
from render_template import (
    HEADER_LINES,
    default_presets_for_schema_document,
    merge_preset_maps,
    parse_presets,
    render_template,
)


SAFE_SCALAR_RE = re.compile(r"^[A-Za-z0-9_.\/-]+$")
SUPPORTED_ACTIONS = {"create", "patch", "replace", "delete"}


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a single YAML bundle template for multiple AD API operations.")
    parser.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root.")
    parser.add_argument(
        "--operation",
        action="append",
        nargs="+",
        required=True,
        metavar="VALUE",
        help="Operation as: ID ACTION SCHEMA [DOCUMENT] [KEY=VALUE ...]. Repeat for multiple operations.",
    )
    parser.add_argument("--out", type=Path, help="Optional YAML output path.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    return parser.parse_args(argv)


def yaml_scalar(value: str) -> str:
    if SAFE_SCALAR_RE.match(value):
        return value
    return json.dumps(value, ensure_ascii=False)


def parse_operation(values: list[str]) -> dict[str, Any]:
    if len(values) < 3:
        raise ValueError("--operation expects: ID ACTION SCHEMA [DOCUMENT] [KEY=VALUE ...]")
    operation_id, action, schema = values[:3]
    document = None
    preset_args: list[str] = []
    for value in values[3:]:
        if "=" in value:
            preset_args.append(value)
        elif document is None:
            document = value
        else:
            raise ValueError("--operation expects at most one DOCUMENT before KEY=VALUE presets")
    if action not in SUPPORTED_ACTIONS:
        raise ValueError(f"unsupported action for {operation_id}: {action}")
    operation = {"id": operation_id, "action": action, "schema": schema, "document": document}
    presets = merge_preset_maps(default_presets_for_schema_document(schema, document), parse_presets(preset_args))
    if presets:
        operation["presets"] = presets
    return operation


def indent_payload(template: str) -> list[str]:
    lines = template.rstrip("\n").splitlines()
    return [f"      {line}" for line in lines] if lines else ["      {}"]


def render_bundle_template(index: dict[str, Any], operations: list[dict[str, Any]]) -> str:
    lines = [*HEADER_LINES, "operations:"]
    for operation in operations:
        lines.append(f"  - id: {yaml_scalar(str(operation['id']))}")
        lines.append(f"    action: {yaml_scalar(str(operation['action']))}")
        lines.append(f"    schema: {yaml_scalar(str(operation['schema']))}")
        if operation.get("document"):
            lines.append(f"    document: {yaml_scalar(str(operation['document']))}")
        lines.append("    empty_reserve: []")
        lines.append("    payload:")
        lines.extend(
            indent_payload(
                render_template(
                    index,
                    str(operation["schema"]),
                    operation.get("document"),
                    include_header=False,
                    values=operation.get("presets") or None,
                )
            )
        )
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        paths = skill_paths(args.skill_root)
        index = read_json(paths.references / "api-index.json")
        operations = [parse_operation(values) for values in args.operation]
        operations = sorted_by_dependency_order(operations, load_resource_order(paths.root))
        output = render_bundle_template(index, operations)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    output_path = resolve_output_path(args.out or tmp_file_path(), args.workdir)
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output, encoding="utf-8")
        update_artifacts(workdir_path(args.workdir), bundle=output_path)
    else:
        print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
