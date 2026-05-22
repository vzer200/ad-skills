from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any
from urllib.parse import quote


DEFAULT_REQUEST_TIMEOUT = (5, 30)
ALL_PROPERTIES_PARAMS = {"all_properties": "true"}
RESOURCE_ENDPOINTS = {
    "virtual_service": "/api/ad/v3/slb/virtual-service/{name}",
    "pool": "/api/ad/v3/slb/pool/{name}",
    "http_profile": "/api/ad/v3/slb/http-profile/{name}",
    "pre_rule": "/api/ad/v3/slb/pre-rule/http/{name}",
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from ad_http import normalize_base_url, requests  # noqa: E402


def env_base_url() -> str | None:
    return os.environ.get("AD_BASE_URL") or os.environ.get("AD_HOST")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify SLB resources on an AD device with read-only GET requests.")
    parser.add_argument("--base-url", default=env_base_url(), help="AD API base URL. Defaults to AD_BASE_URL, then AD_HOST.")
    parser.add_argument("--username", default=os.environ.get("AD_USERNAME"), help="AD API username.")
    parser.add_argument("--password", default=os.environ.get("AD_PASSWORD"), help="AD API password.")
    parser.add_argument("--vs-name", help="Virtual service name to verify.")
    parser.add_argument("--pool-name", help="Pool name to verify.")
    parser.add_argument("--node-ip", help="Backend node IP to verify. Checks the named pool when --pool-name is set.")
    parser.add_argument("--http-profile", help="HTTP profile name to verify.")
    parser.add_argument("--pre-rule", help="HTTP pre-rule name to verify.")
    parser.add_argument(
        "--expect",
        choices=("present", "absent"),
        default="present",
        help="Whether checked resources should exist. Defaults to present.",
    )
    parser.add_argument("--connect-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[0], help="Connect timeout in seconds.")
    parser.add_argument("--read-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[1], help="Read timeout in seconds.")
    return parser.parse_args(argv)


def full_url(base_url: str, endpoint: str) -> str:
    return base_url.rstrip("/") + "/" + endpoint.lstrip("/")


def endpoint_for(kind: str, name: str) -> str:
    return RESOURCE_ENDPOINTS[kind].format(name=quote(name.strip(), safe=""))


def resource_id(kind: str, name: str) -> str:
    return f"{kind}:{name}"


def configure_session(session: Any, username: str, password: str) -> None:
    session.verify = False
    session.auth = (username, password)


def response_payload(response: Any) -> Any:
    try:
        return response.json()
    except Exception:
        return None


def get_endpoint(session: Any, base_url: str, endpoint: str, timeout: tuple[float, float]) -> Any:
    return session.get(full_url(base_url, endpoint), params=ALL_PROPERTIES_PARAMS, timeout=timeout)


def iter_items(payload: Any) -> list[Any]:
    if isinstance(payload, dict):
        items = payload.get("items")
        if isinstance(items, list):
            return items
        data = payload.get("data")
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return iter_items(data)
        return [payload]
    if isinstance(payload, list):
        return payload
    return []


def iter_pool_nodes(payload: Any) -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    for item in iter_items(payload):
        if not isinstance(item, dict):
            continue
        item_nodes = item.get("nodes")
        if isinstance(item_nodes, list):
            nodes.extend(node for node in item_nodes if isinstance(node, dict))
    return nodes


def node_has_ip(node: dict[str, Any], ip: str) -> bool:
    for key in ("address", "ip", "ip_address", "node_ip"):
        if str(node.get(key, "")).strip() == ip:
            return True
    return False


def check_named_resource(
    session: Any,
    base_url: str,
    kind: str,
    name: str,
    timeout: tuple[float, float],
) -> tuple[dict[str, Any], Any]:
    endpoint = endpoint_for(kind, name)
    response = get_endpoint(session, base_url, endpoint, timeout)
    found = bool(getattr(response, "ok", False))
    status = getattr(response, "status_code", None)
    check = {
        "type": kind,
        "name": name,
        "found": found,
        "status": status,
        "endpoint": endpoint,
        "method": "GET",
    }
    if not found and getattr(response, "text", ""):
        check["error"] = response.text
    return check, response_payload(response) if found else None


def check_node_ip(
    session: Any,
    base_url: str,
    node_ip: str,
    timeout: tuple[float, float],
    pool_name: str | None,
    pool_payload: Any,
) -> dict[str, Any]:
    if pool_name:
        endpoint = endpoint_for("pool", pool_name)
        payload = pool_payload
        status = 200 if payload is not None else None
        if payload is None:
            response = get_endpoint(session, base_url, endpoint, timeout)
            status = getattr(response, "status_code", None)
            payload = response_payload(response) if getattr(response, "ok", False) else None
    else:
        endpoint = "/api/ad/v3/slb/pool/"
        response = get_endpoint(session, base_url, endpoint, timeout)
        status = getattr(response, "status_code", None)
        payload = response_payload(response) if getattr(response, "ok", False) else None

    nodes = iter_pool_nodes(payload)
    found = any(node_has_ip(node, node_ip) for node in nodes)
    check: dict[str, Any] = {
        "type": "node_ip",
        "name": node_ip,
        "found": found,
        "status": status,
        "endpoint": endpoint,
        "method": "GET",
    }
    if pool_name:
        check["pool"] = pool_name
    return check


def requested_checks(args: argparse.Namespace) -> list[tuple[str, str]]:
    checks: list[tuple[str, str]] = []
    if args.vs_name:
        checks.append(("virtual_service", args.vs_name))
    if args.pool_name:
        checks.append(("pool", args.pool_name))
    if args.http_profile:
        checks.append(("http_profile", args.http_profile))
    if args.pre_rule:
        checks.append(("pre_rule", args.pre_rule))
    if args.node_ip:
        checks.append(("node_ip", args.node_ip))
    return checks


def verify_resources(args: argparse.Namespace, session: Any | None = None) -> dict[str, Any]:
    base_url = normalize_base_url(args.base_url or "")
    username = (args.username or "").strip()
    password = args.password
    if not username:
        raise ValueError("--username or AD_USERNAME is required")
    if password is None:
        raise ValueError("--password or AD_PASSWORD is required")
    if not requested_checks(args):
        raise ValueError("at least one resource check is required")

    session = session or requests.Session()
    configure_session(session, username, password)
    timeout = (args.connect_timeout, args.read_timeout)

    checked: list[dict[str, Any]] = []
    found: list[str] = []
    missing: list[str] = []
    payloads: dict[str, Any] = {}

    for kind, value in requested_checks(args):
        if kind == "node_ip":
            check = check_node_ip(session, base_url, value, timeout, args.pool_name, payloads.get("pool"))
        else:
            check, payload = check_named_resource(session, base_url, kind, value, timeout)
            if kind == "pool":
                payloads["pool"] = payload
        checked.append(check)
        target = resource_id(kind, value)
        if check["found"]:
            found.append(target)
        else:
            missing.append(target)

    endpoints = []
    seen: set[str] = set()
    for check in checked:
        endpoint = check["endpoint"]
        if endpoint not in seen:
            seen.add(endpoint)
            endpoints.append(endpoint)

    ok = not missing if args.expect == "present" else not found
    return {
        "ok": ok,
        "expect": args.expect,
        "found": found,
        "missing": missing,
        "checked": checked,
        "endpoints": endpoints,
    }


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        result = verify_resources(args)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
