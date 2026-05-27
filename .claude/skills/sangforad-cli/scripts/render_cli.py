from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any


DEFAULT_OUTPUT_NAME = "apply.sfcli"
DEFAULT_WORKDIR_NAME = "sangforad_cli_workdir"
WORKDIR_ENV = "SANGFORAD_CLI_WORKDIR"
AD_OPS_WORKDIR_ENV = "AD_OPS_WORKDIR"
SAFE_SCALAR_RE = re.compile(r"^[A-Za-z0-9_.:/@+-]+$")
PATH_PARAMETER_RE = re.compile(r"^\{([^{}]+)\}$")
API_PREFIX_RE = re.compile(r"^/api/ad/v\d+/", re.IGNORECASE)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render Sangfor AD CLI commands from an AD operation plan or bundle.")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--plan", type=Path, help="AD-OPS operation plan JSON path.")
    source.add_argument("--bundle", type=Path, help="Filled AD-OPS bundle YAML path.")
    parser.add_argument(
        "--ad-config-ops-root",
        type=Path,
        default=Path("skills/ad-config-ops"),
        help="ad-config-ops skill root, required when --bundle is used.",
    )
    parser.add_argument("--out", type=Path, help=f"CLI script output path. Defaults to workdir/{DEFAULT_OUTPUT_NAME}.")
    parser.add_argument(
        "--workdir",
        type=Path,
        help=f"Artifact work directory. Defaults to {WORKDIR_ENV}, then {AD_OPS_WORKDIR_ENV}, then ./{DEFAULT_WORKDIR_NAME}.",
    )
    return parser.parse_args(argv)


def short_summary(**items: Any) -> str:
    return json.dumps(items, ensure_ascii=False, separators=(",", ":")) + "\n"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def resolve_workdir(path: Path | None) -> Path:
    if path is not None:
        workdir = path
    elif os.environ.get(WORKDIR_ENV):
        workdir = Path(os.environ[WORKDIR_ENV])
    elif os.environ.get(AD_OPS_WORKDIR_ENV):
        workdir = Path(os.environ[AD_OPS_WORKDIR_ENV])
    else:
        workdir = Path.cwd() / DEFAULT_WORKDIR_NAME
    workdir = workdir.expanduser()
    workdir.mkdir(parents=True, exist_ok=True)
    return workdir


def load_plan_from_bundle(bundle: Path, ad_config_ops_root: Path) -> dict[str, Any]:
    root = resolve_ad_config_ops_root(ad_config_ops_root)
    scripts = root / "scripts"
    if not scripts.exists():
        raise ValueError(f"ad-config-ops scripts directory not found: {scripts}")
    if str(scripts) not in sys.path:
        sys.path.insert(0, str(scripts))

    from ad_ops_common import read_json as read_adops_json
    from ad_ops_common import skill_paths
    from dependency_order import load_resource_order
    from plan_operations import build_bundle_plan
    from resolve_schema import definition_map

    paths = skill_paths(root)
    index = read_adops_json(paths.references / "api-index.json")
    return build_bundle_plan(index, definition_map(index), bundle, load_resource_order(paths.root))


def resolve_ad_config_ops_root(path: Path) -> Path:
    candidates = [path.expanduser()]
    if str(path).replace("\\", "/") == "skills/ad-config-ops":
        candidates.append(Path(".claude/skills/ad-config-ops"))
    for candidate in candidates:
        resolved = candidate.resolve()
        if (resolved / "scripts").exists() and (resolved / "references" / "api-index.json").exists():
            return resolved
    return candidates[0].resolve()


def is_adops_plan(data: Any) -> bool:
    if not isinstance(data, dict):
        return False
    operations = data.get("operations")
    if not isinstance(operations, list) or not operations:
        return False
    return all(
        isinstance(operation, dict)
        and (isinstance(operation.get("path"), str) or isinstance(operation.get("resource_path"), str))
        for operation in operations
    )


def is_bundle_like(data: Any) -> bool:
    if not isinstance(data, dict):
        return False
    operations = data.get("operations")
    if not isinstance(operations, list) or not operations:
        return False
    return all(
        isinstance(operation, dict)
        and isinstance(operation.get("schema"), str)
        and isinstance(operation.get("action"), str)
        for operation in operations
    )


def load_plan(args: argparse.Namespace) -> tuple[dict[str, Any], str]:
    if args.plan is not None:
        loaded = read_json(args.plan)
        if is_adops_plan(loaded):
            return loaded, str(args.plan)
        if is_bundle_like(loaded):
            return load_plan_from_bundle(args.plan, args.ad_config_ops_root), str(args.plan)
        raise ValueError("--plan must contain AD-OPS operations with path/resource_path; use --bundle for filled bundles")
    return load_plan_from_bundle(args.bundle, args.ad_config_ops_root), str(args.bundle)


def cli_action(operation: dict[str, Any]) -> str:
    action = str(operation.get("action") or "").lower()
    if action == "create":
        return "create"
    if action in {"patch", "replace"}:
        return "modify"
    if action == "delete":
        return "delete"

    method = str(operation.get("method") or "").upper()
    if method == "GET":
        return "show" if str(operation.get("path") or "").startswith("/api/ad/v") and "/stat/" in str(operation.get("path")) else "list"
    return {
        "POST": "create",
        "PATCH": "modify",
        "PUT": "modify",
        "DELETE": "delete",
    }.get(method, method.lower())


def operation_path(operation: dict[str, Any]) -> str:
    path = operation.get("resource_path") or operation.get("path") or ""
    if not isinstance(path, str):
        return ""
    return API_PREFIX_RE.sub("", path).strip("/")


def path_parameters(operation: dict[str, Any]) -> dict[str, Any]:
    parameters = operation.get("path_parameters")
    return parameters if isinstance(parameters, dict) else {}


def command_path(operation: dict[str, Any]) -> tuple[list[str], str | None]:
    segments = [segment for segment in operation_path(operation).split("/") if segment]
    parameters = path_parameters(operation)
    trailing_parameter: str | None = None
    if segments:
        match = PATH_PARAMETER_RE.match(segments[-1])
        if match:
            trailing_parameter = match.group(1)
            segments = segments[:-1]

    rendered: list[str] = []
    for segment in segments:
        match = PATH_PARAMETER_RE.match(segment)
        if match:
            name = match.group(1)
            rendered.append(str(parameters.get(name) or f"[{name}]"))
        else:
            rendered.append(segment)
    return rendered, trailing_parameter


def resource_name(operation: dict[str, Any], trailing_parameter: str | None) -> str | None:
    payload = operation.get("payload")
    if isinstance(payload, dict) and isinstance(payload.get("name"), str) and payload["name"]:
        return payload["name"]
    if isinstance(operation.get("name"), str) and operation["name"]:
        return operation["name"]

    parameters = path_parameters(operation)
    if trailing_parameter and isinstance(parameters.get(trailing_parameter), str):
        return parameters[trailing_parameter]
    for key in ("name", "node_name", "pool_name"):
        if isinstance(parameters.get(key), str):
            return parameters[key]
    return None


def normalize_string(value: str) -> str:
    if value and value.upper() == value and any(char.isalpha() for char in value):
        value = value.lower()
    if SAFE_SCALAR_RE.match(value):
        return value
    return json.dumps(value, ensure_ascii=False)


def cli_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    if value is None:
        return "null"
    return normalize_string(str(value))


def cli_object(value: dict[str, Any]) -> str:
    parts: list[str] = []
    for key, child in value.items():
        if child is None:
            continue
        parts.append(str(key))
        parts.append(cli_value(child))
    return "{ " + " ".join(parts) + " }"


def cli_array(value: list[Any]) -> str:
    if all(isinstance(item, dict) for item in value):
        objects = " ".join(cli_object(item) for item in value)
        return f"add [ {objects} ]"
    return "[ " + " ".join(cli_value(item) for item in value) + " ]"


def cli_value(value: Any) -> str:
    if isinstance(value, dict):
        return cli_object(value)
    if isinstance(value, list):
        return cli_array(value)
    return cli_scalar(value)


def payload_options(operation: dict[str, Any]) -> list[str]:
    payload = operation.get("payload")
    if not isinstance(payload, dict):
        return []
    skip_keys = {"name", *path_parameters(operation).keys()}
    options: list[str] = []
    for key, value in payload.items():
        if key in skip_keys or value is None:
            continue
        options.append(str(key))
        options.append(cli_value(value))
    return options


def render_command(operation: dict[str, Any]) -> str:
    action = cli_action(operation)
    path_parts, trailing_parameter = command_path(operation)
    parts = [action, *path_parts]
    name = resource_name(operation, trailing_parameter)
    if name and action in {"create", "modify", "delete"}:
        parts.append(cli_scalar(name))
    if action != "delete":
        parts.extend(payload_options(operation))
    return " ".join(part for part in parts if part) + ";"


def render_cli(plan: dict[str, Any]) -> str:
    operations = [operation for operation in plan.get("operations", []) if isinstance(operation, dict)]
    lines = [
        "# Generated by sangforad-cli from a validated AD operation plan.",
        "# Review commands before pasting them into the Sangfor AD CLI.",
        "# The order follows ad-config-ops dependency sorting when rendered from a bundle.",
        "",
    ]
    lines.extend(render_command(operation) for operation in operations)
    return "\n".join(lines) + "\n"


def update_artifacts(workdir: Path, **items: str | Path | None) -> Path:
    path = workdir / "sangforad-cli-artifacts.json"
    current: dict[str, Any] = {}
    if path.exists():
        try:
            loaded = read_json(path)
            if isinstance(loaded, dict):
                current = loaded
        except Exception:
            current = {}
    for key, value in items.items():
        if value is not None:
            current[key] = str(value)
    write_json(path, current)
    return path


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        plan, source = load_plan(args)
        workdir = resolve_workdir(args.workdir)
        out = args.out or workdir / DEFAULT_OUTPUT_NAME
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render_cli(plan), encoding="utf-8")
        artifacts = update_artifacts(workdir, source=source, cli_script=out)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2

    operations = plan.get("operations")
    operation_count = len(operations) if isinstance(operations, list) else 0
    print(
        short_summary(
            ok=True,
            operation_count=operation_count,
            source=source,
            cli_script=str(out),
            artifacts=str(artifacts),
            workflow_contract="script_generated_cli",
            must_review_before_paste=True,
        ),
        end="",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
