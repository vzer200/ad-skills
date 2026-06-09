#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch AD offline-check rule metadata from the device API."""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

_ad_ops_scripts = Path(__file__).resolve().parent.parent.parent / "ad-ops" / "scripts"
if str(_ad_ops_scripts) not in sys.path:
    sys.path.insert(0, str(_ad_ops_scripts))

from ad_api import ADClient  # noqa: E402
from multi_device import load_devices_json, resolve_device_pw  # noqa: E402


def _items_from_response(response: Dict[str, Any]) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    for group in ("feature_scene", "health_scene", "secure_scene"):
        value = response.get(group, [])
        if not isinstance(value, list):
            continue
        for item in value:
            if isinstance(item, dict):
                records.append({
                    "group": group,
                    "enumerate": item.get("enumerate", ""),
                    "id": item.get("id", ""),
                    "name": item.get("name", ""),
                    "description": item.get("description", ""),
                })
    return records


def fetch_metadata(client: ADClient) -> List[Dict[str, Any]]:
    response = client._request("GET", "/debug/sys/offline-check", params={"type": "rule"})
    return _items_from_response(response)


def _resolve_device(args: argparse.Namespace) -> Dict[str, Any]:
    if args.devices:
        devices = load_devices_json(args.devices, args.device)
        if not devices:
            raise SystemExit(f"device not found: {args.device or args.devices}")
        return devices[0]
    if not args.host:
        raise SystemExit("missing --host or --devices")
    return {"host": args.host, "user": args.username, "password": args.password}


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Fetch AD check rule names and descriptions")
    parser.add_argument("--host", default="", help="Device URL, for example https://192.168.8.30")
    parser.add_argument("--username", default="admin")
    parser.add_argument("--password", default="")
    parser.add_argument("--devices", default="", help="devices.json path")
    parser.add_argument("--device", default="", help="Device alias from devices.json, for example AD1")
    parser.add_argument("--out", default="", help="Optional JSON output path")
    args = parser.parse_args()

    device = _resolve_device(args)
    password = resolve_device_pw(device, args.password or os.environ.get("AD_PASS", ""))
    client = ADClient(device["host"], device.get("user", args.username), password)
    records = fetch_metadata(client)
    text = json.dumps(records, ensure_ascii=False, indent=2)
    if args.out:
        Path(args.out).write_text(text + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
