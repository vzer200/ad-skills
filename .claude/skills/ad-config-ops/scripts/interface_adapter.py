from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import require_workdir, short_summary, update_artifacts
from execute_plan import ALL_PROPERTIES_PARAMS, DEFAULT_REQUEST_TIMEOUT, configure_session, full_url
from prepare_edit_template import base_url_from_host


DEFAULT_INTERFACE_ADAPTER_NAME = "adops-interface-adapter.json"

DOCUMENT_MODULES = {
    "net/link/lan.js": "net/link/lan/interface",
    "net/link/wan.js": "net/link/wan/interface",
    "net/link/pppoe.js": "net/link/pppoe/interface",
    "net/bridge.js": "net/bridge/interfaces",
    "net/bond.js": "net/bond/interfaces",
    "net/vlan.js": "net/vlan/interface",
}

VALID_MODULES = {
    "all",
    *DOCUMENT_MODULES.values(),
    "ha/active-standby/ha/interface",
    "ha/active-standby/alternate_ha/interface",
    "ha/active-standby/standby_interface_poweroff/interfaces",
    "ha/active-standby-join/ha/interface",
    "ha/active-standby-join/alternate_ha/interface",
    "ha/cluster/ha/interface",
    "ha/cluster/alternate_ha/interface",
    "ha/cluster-join/ha/interface",
    "ha/cluster-join/alternate_ha/interface",
}


class InterfaceAdapterError(RuntimeError):
    pass


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Query AD net interface-adapter candidates for interface fields.")
    parser.add_argument("--document", help="Resource document, for example net/link/lan.js.")
    parser.add_argument("--module", help="Interface adapter module, for example net/link/lan/interface.")
    parser.add_argument("--host", default=os.environ.get("AD_HOST"), help="AD device host, host:port, or URL.")
    parser.add_argument("--username", default=os.environ.get("AD_USERNAME"), help="AD API username.")
    parser.add_argument("--password", default=os.environ.get("AD_PASSWORD"), help="AD API password.")
    parser.add_argument("--token", default=os.environ.get("AD_TOKEN"), help="Existing AD API token.")
    parser.add_argument("--out", type=Path, help=f"Full result JSON output path. Defaults to workdir/{DEFAULT_INTERFACE_ADAPTER_NAME}.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    parser.add_argument("--limit", type=int, default=20, help="Maximum interfaces to include in the short stdout summary.")
    parser.add_argument("--json", action="store_true", help="Print the full adapter result JSON instead of a short summary.")
    parser.add_argument("--connect-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[0], help="Connect timeout in seconds.")
    parser.add_argument("--read-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[1], help="Read timeout in seconds.")
    return parser.parse_args(argv)


def module_for_document(document: str) -> str:
    module = DOCUMENT_MODULES.get(document)
    if not module:
        raise InterfaceAdapterError(f"no interface-adapter module is defined for document: {document}")
    return module


def select_module(document: str | None, module: str | None) -> str:
    selected = module or (module_for_document(document) if document else None)
    if not selected:
        raise InterfaceAdapterError("--module or --document is required")
    if selected not in VALID_MODULES:
        raise InterfaceAdapterError(f"unsupported interface-adapter module: {selected}")
    return selected


def adapter_path(module: str) -> str:
    return f"/api/ad/v3/net/interface-adapter/{quote(module, safe='/')}/"


def response_payload(response: Any, path: str) -> dict[str, Any]:
    if not response.ok:
        raise InterfaceAdapterError(f"GET {path} failed: {response.status_code} {getattr(response, 'text', '')}")
    try:
        payload = response.json()
    except Exception as exc:
        raise InterfaceAdapterError(f"GET {path} did not return valid JSON") from exc
    if not isinstance(payload, dict):
        raise InterfaceAdapterError(f"GET {path} did not return a JSON object")
    return payload


def normalize_interfaces(payload: dict[str, Any]) -> list[dict[str, Any]]:
    items = payload.get("items")
    if not isinstance(items, list):
        if isinstance(payload.get("name"), str):
            items = [payload]
        else:
            items = []
    normalized = []
    for item in items:
        if not isinstance(item, dict):
            continue
        entry = {
            key: item[key]
            for key in ("name", "type", "device", "occupied_by", "occupier")
            if key in item and item[key] not in (None, "", [])
        }
        if entry:
            normalized.append(entry)
    return normalized


def fill_hints(interfaces: list[dict[str, Any]]) -> list[dict[str, str]]:
    hints = []
    for item in interfaces:
        name = item.get("name")
        if not isinstance(name, str) or not name:
            continue
        hint = {"interface": name}
        interface_type = item.get("type")
        if isinstance(interface_type, str) and interface_type:
            hint = {"type": interface_type, **hint}
        hints.append(hint)
    return hints


def query_interface_adapter(
    *,
    session: Any,
    base_url: str,
    auth: dict[str, Any],
    module: str,
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> dict[str, Any]:
    configure_session(session, auth)
    path = adapter_path(module)
    response = session.request("GET", full_url(base_url, path), params=ALL_PROPERTIES_PARAMS, timeout=timeout)
    payload = response_payload(response, path)
    interfaces = normalize_interfaces(payload)
    return {
        "module": module,
        "path": path,
        "items_length": payload.get("items_length", len(interfaces)),
        "interfaces": interfaces,
        "fill_hints": fill_hints(interfaces),
        "raw_response": payload,
    }


def summarize_adapter_result(result: dict[str, Any], limit: int = 20) -> dict[str, Any]:
    interfaces = result.get("interfaces")
    if not isinstance(interfaces, list):
        interfaces = []
    hints = result.get("fill_hints")
    if not isinstance(hints, list):
        hints = []
    return {
        "ok": True,
        "module": result.get("module"),
        "count": len(interfaces),
        "items_length": result.get("items_length"),
        "interfaces": interfaces[: max(limit, 0)],
        "fill_hints": hints[: max(limit, 0)],
        "workflow_contract": "scripts_only",
        "must_not_parse_artifacts": True,
    }


def cli_auth(args: argparse.Namespace) -> dict[str, Any]:
    password = args.password
    if not args.token and args.username and password is None:
        password = getpass.getpass("AD password: ")
    return {"username": args.username, "password": password, "token": args.token}


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        if not args.host:
            raise InterfaceAdapterError("--host or AD_HOST is required")
        workdir = require_workdir(args.workdir)
        module = select_module(args.document, args.module)
        session = requests.Session()
        result = query_interface_adapter(
            session=session,
            base_url=base_url_from_host(args.host),
            auth=cli_auth(args),
            module=module,
            timeout=(args.connect_timeout, args.read_timeout),
        )
        output_path = args.out or workdir / DEFAULT_INTERFACE_ADAPTER_NAME
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        artifacts = update_artifacts(workdir, interface_adapter=output_path)
        if args.json:
            print(json.dumps({**result, "result": str(output_path), "artifacts": str(artifacts)}, ensure_ascii=False, indent=2))
        else:
            print(
                short_summary(
                    **summarize_adapter_result(result, args.limit),
                    result=str(output_path),
                    artifacts=str(artifacts),
                ),
                end="",
            )
    except InterfaceAdapterError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
