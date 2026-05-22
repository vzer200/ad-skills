from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import short_summary  # noqa: E402


DEFAULT_TIMEOUT = (5, 30)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Discover reusable AD objects before rendering a config bundle.")
    parser.add_argument("--kind", choices=["http-profile-xff"], required=True)
    parser.add_argument("--host", default=os.environ.get("AD_HOST"), help="AD device host or address.")
    parser.add_argument("--username", default=os.environ.get("AD_USERNAME", "admin"), help="AD API username.")
    parser.add_argument("--password", default=os.environ.get("AD_PASSWORD"), help="AD API password.")
    parser.add_argument("--token", default=os.environ.get("AD_TOKEN"), help="Existing AD API token.")
    parser.add_argument("--header", default="X-Forwarded-For", help="Header name for http-profile-xff discovery.")
    parser.add_argument("--connect-timeout", type=float, default=DEFAULT_TIMEOUT[0])
    parser.add_argument("--read-timeout", type=float, default=DEFAULT_TIMEOUT[1])
    return parser.parse_args(argv)


def base_url(host: str) -> str:
    if host.startswith("http://") or host.startswith("https://"):
        return host.rstrip("/")
    return "https://" + host.strip("/")


def configure_session(args: argparse.Namespace) -> requests.Session:
    session = requests.Session()
    session.verify = False
    if args.token:
        session.headers["x-token-sangforad"] = args.token
    else:
        if not args.username:
            raise ValueError("--username/AD_USERNAME is required unless --token is provided")
        if args.password is None:
            raise ValueError("--password/AD_PASSWORD is required unless --token is provided")
        session.auth = (args.username, args.password)
    return session


def list_payload_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        items = payload.get("items")
        if isinstance(items, list):
            return [item for item in items if isinstance(item, dict)]
        data = payload.get("data")
        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            return [item for item in data["items"] if isinstance(item, dict)]
        if payload.get("name"):
            return [payload]
    return []


def discover_http_profile_xff(args: argparse.Namespace) -> dict[str, Any]:
    if not args.host:
        raise ValueError("--host/AD_HOST is required")
    session = configure_session(args)
    url = base_url(args.host) + "/api/ad/v3/slb/http-profile/"
    response = session.get(
        url,
        params={"all_properties": "true"},
        timeout=(args.connect_timeout, args.read_timeout),
    )
    if not response.ok:
        return {
            "ok": False,
            "kind": args.kind,
            "status": response.status_code,
            "error": response.text[:300],
            "reusable": False,
        }
    payload = response.json()
    header = args.header.lower()
    matches: list[str] = []
    for item in list_payload_items(payload):
        source = item.get("source_address")
        if not isinstance(source, dict):
            continue
        operation = str(source.get("operation", "")).upper()
        request_header = str(source.get("request_header", "")).lower()
        name = item.get("name")
        if operation == "REQUEST-HEADER-INSERT-SRCIP" and request_header == header and isinstance(name, str):
            matches.append(name)
    return {
        "ok": True,
        "kind": args.kind,
        "reusable": bool(matches),
        "selected": matches[0] if matches else None,
        "match_count": len(matches),
        "matches": matches[:10],
    }


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        if args.kind == "http-profile-xff":
            result = discover_http_profile_xff(args)
        else:
            raise ValueError(f"unsupported kind: {args.kind}")
    except Exception as exc:
        print(short_summary(ok=False, kind=getattr(args, "kind", None), error=str(exc)), end="")
        return 2
    print(short_summary(**result), end="")
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
