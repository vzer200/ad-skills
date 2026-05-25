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

from ad_ops_common import read_json, remove_generated_artifacts, require_workdir, skill_paths, tmp_file_path, update_artifacts, workdir_path
from dependency_order import load_resource_order, sorted_by_dependency_order
from render_template import HEADER_LINES, render_template


SAFE_SCALAR_RE = re.compile(r"^[A-Za-z0-9_.\/-]+$")
SUPPORTED_ACTIONS = {"create", "patch", "replace", "delete"}


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a single YAML bundle template for multiple AD API operations.")
    parser.add_argument("--skill-root", required=True, type=Path, help="ad-config-ops skill root.")
    parser.add_argument(
        "--operation",
        action="append",
        nargs="+",
        required=True,
        metavar="VALUE",
        help="Operation as: ID ACTION SCHEMA [DOCUMENT]. Repeat for multiple operations.",
    )
    parser.add_argument("--out", type=Path, help="Optional YAML output path.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    return parser.parse_args(argv)


def yaml_scalar(value: str) -> str:
    if SAFE_SCALAR_RE.match(value):
        return value
    return json.dumps(value, ensure_ascii=False)


def parse_operation(values: list[str]) -> dict[str, str | None]:
    if len(values) not in {3, 4}:
        raise ValueError("--operation expects: ID ACTION SCHEMA [DOCUMENT]")
    operation_id, action, schema = values[:3]
    document = values[3] if len(values) == 4 else None
    if action not in SUPPORTED_ACTIONS:
        raise ValueError(f"unsupported action for {operation_id}: {action}")
    return {"id": operation_id, "action": action, "schema": schema, "document": document}


def indent_payload(template: str) -> list[str]:
    lines = template.rstrip("\n").splitlines()
    return [f"      {line}" for line in lines] if lines else ["      {}"]


def render_bundle_template(index: dict[str, Any], operations: list[dict[str, str | None]]) -> str:
    lines = [*HEADER_LINES, "operations:"]
    for operation in operations:
        lines.append(f"  - id: {yaml_scalar(str(operation['id']))}")
        lines.append(f"    action: {yaml_scalar(str(operation['action']))}")
        lines.append(f"    schema: {yaml_scalar(str(operation['schema']))}")
        if operation.get("document"):
            lines.append(f"    document: {yaml_scalar(str(operation['document']))}")
        if operation.get("action") == "delete":
            lines.append("    rollback:")
            lines.append("      rollback_method: POST")
            lines.append("      rollback_path: ")
        lines.append("    empty_reserve: []")
        lines.append("    payload:")
        lines.extend(indent_payload(render_template(index, str(operation["schema"]), operation.get("document"), include_header=False)))
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

    output_path = args.out or tmp_file_path()
    active_workdir = require_workdir(args.workdir) if (args.workdir is not None or workdir_path() is not None) else None
    if output_path:
        if active_workdir is not None:
            remove_generated_artifacts(active_workdir, keep={output_path})
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output, encoding="utf-8")
        update_artifacts(active_workdir, bundle=output_path)
    else:
        print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
