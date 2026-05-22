from __future__ import annotations

import argparse
import getpass
import json
import sys
from pathlib import Path
from typing import Any

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import read_json, short_summary, skill_paths, tmp_file_path, update_artifacts, workdir_path
from execute_plan import DEFAULT_REQUEST_TIMEOUT, configure_session, full_url
from plan_operations import collect_path_parameters, find_operation, find_resource_path, materialize_path
from render_bundle_template import indent_payload, yaml_scalar
from render_template import HEADER_LINES, render_template
from resolve_schema import resolve_schema


SUPPORTED_EDIT_ACTIONS = {"patch", "replace"}


class PrepareEditError(RuntimeError):
    pass


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="GET an existing AD object and render a full-field edit bundle YAML.")
    parser.add_argument("--skill-root", required=True, type=Path, help="ad-config-ops skill root.")
    parser.add_argument("--schema", required=True, help="Schema name, for example config.virtual_service.")
    parser.add_argument("--document", help="Optional document constraint, for example slb/virtual-service.js.")
    parser.add_argument("--name", required=True, help="Existing object name.")
    parser.add_argument("--action", choices=sorted(SUPPORTED_EDIT_ACTIONS), default="patch", help="Edit action.")
    parser.add_argument("--operation-id", help="Optional operation id in the generated bundle.")
    parser.add_argument(
        "--path-param",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Additional path parameter. Repeat when the resource path has parameters other than {name}.",
    )
    parser.add_argument("--host", default=None, help="AD device host, host:port, or URL. Defaults to AD_HOST.")
    parser.add_argument("--username", default=None, help="AD API username. Defaults to AD_USERNAME.")
    parser.add_argument("--password", default=None, help="AD API password. Defaults to AD_PASSWORD.")
    parser.add_argument("--token", default=None, help="Existing AD API token. Defaults to AD_TOKEN.")
    parser.add_argument("--out", type=Path, help="YAML output path. Defaults to TMP_FILE when set.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    parser.add_argument("--connect-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[0], help="Connect timeout in seconds.")
    parser.add_argument("--read-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[1], help="Read timeout in seconds.")
    return parser.parse_args(argv)


def parse_key_value(items: list[str]) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for item in items:
        if "=" not in item:
            raise PrepareEditError(f"--path-param must be KEY=VALUE: {item}")
        key, value = item.split("=", 1)
        if not key or value == "":
            raise PrepareEditError(f"--path-param must be KEY=VALUE: {item}")
        parsed[key] = value
    return parsed


def base_url_from_host(host: str) -> str:
    if host.startswith("http://") or host.startswith("https://"):
        return host.rstrip("/")
    return "https://" + host.rstrip("/")


def resource_get_path(
    index: dict[str, Any],
    schema: str,
    document: str | None,
    action: str,
    name: str,
    path_parameters: dict[str, str] | None = None,
) -> str:
    resolved = resolve_schema(index, schema, document)
    operation = find_operation(index, schema, action, resolved.get("document"))
    resource_path = find_resource_path(index, schema, resolved.get("document"), operation)
    payload_parameters = {**(path_parameters or {}), "name": name}
    collected = collect_path_parameters([resource_path], payload_parameters, "name", name, operation)
    return materialize_path(resource_path, collected)


def response_payload(response: Any, path: str) -> dict[str, Any]:
    if not response.ok:
        raise PrepareEditError(f"GET {path} failed: {response.status_code} {getattr(response, 'text', '')}")
    try:
        payload = response.json()
    except Exception as exc:
        raise PrepareEditError(f"GET {path} did not return valid JSON") from exc
    if not isinstance(payload, dict):
        raise PrepareEditError(f"GET {path} did not return a JSON object")
    return payload


def get_current_config(
    *,
    session: Any,
    base_url: str,
    path: str,
    auth: dict[str, Any],
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> dict[str, Any]:
    configure_session(session, auth)
    response = session.request(
        "GET",
        full_url(base_url, path),
        params={"all_properties": "true"},
        timeout=timeout,
    )
    return response_payload(response, path)


def render_edit_bundle(
    *,
    index: dict[str, Any],
    schema: str,
    document: str | None,
    action: str,
    operation_id: str,
    payload: dict[str, Any],
) -> str:
    lines = [*HEADER_LINES, "operations:"]
    lines.append(f"  - id: {yaml_scalar(operation_id)}")
    lines.append(f"    action: {yaml_scalar(action)}")
    lines.append(f"    schema: {yaml_scalar(schema)}")
    if document:
        lines.append(f"    document: {yaml_scalar(document)}")
    lines.append("    empty_reserve: []")
    lines.append("    payload:")
    template = render_template(index, schema, document, include_header=False, values=payload)
    lines.extend(indent_payload(template))
    return "\n".join(lines) + "\n"


def prepare_edit_bundle_template(
    *,
    index: dict[str, Any],
    schema: str,
    document: str | None,
    name: str,
    session: Any,
    base_url: str,
    auth: dict[str, Any],
    action: str = "patch",
    operation_id: str | None = None,
    path_parameters: dict[str, str] | None = None,
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> str:
    if action not in SUPPORTED_EDIT_ACTIONS:
        raise PrepareEditError(f"unsupported edit action: {action}")
    path = resource_get_path(index, schema, document, action, name, path_parameters)
    current = get_current_config(session=session, base_url=base_url, path=path, auth=auth, timeout=timeout)
    return render_edit_bundle(
        index=index,
        schema=schema,
        document=document,
        action=action,
        operation_id=operation_id or f"{action}-{schema}-{name}",
        payload=current,
    )


def cli_auth(args: argparse.Namespace) -> dict[str, Any]:
    import os

    username = args.username if args.username is not None else os.environ.get("AD_USERNAME")
    token = args.token if args.token is not None else os.environ.get("AD_TOKEN")
    password = args.password if args.password is not None else os.environ.get("AD_PASSWORD")
    if not token and username and password is None:
        password = getpass.getpass("AD password: ")
    return {"username": username, "password": password, "token": token}


def cli_host(args: argparse.Namespace) -> str:
    import os

    host = args.host or os.environ.get("AD_HOST")
    if not host:
        raise PrepareEditError("--host or AD_HOST is required")
    return base_url_from_host(host)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        paths = skill_paths(args.skill_root)
        index = read_json(paths.references / "api-index.json")
        session = requests.Session()
        output = prepare_edit_bundle_template(
            index=index,
            schema=args.schema,
            document=args.document,
            name=args.name,
            session=session,
            base_url=cli_host(args),
            auth=cli_auth(args),
            action=args.action,
            operation_id=args.operation_id,
            path_parameters=parse_key_value(args.path_param),
            timeout=(args.connect_timeout, args.read_timeout),
        )
    except PrepareEditError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    output_path = args.out or tmp_file_path()
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output, encoding="utf-8")
        artifacts = update_artifacts(workdir_path(args.workdir), edit_template=output_path, bundle=output_path)
        print(
            short_summary(
                ok=True,
                edit_template=str(output_path),
                **({"artifacts": str(artifacts)} if artifacts else {}),
            ),
            end="",
        )
    else:
        print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
