#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AD Device Connectivity Test CLI
Tests TCP/TLS reachability and Basic Auth for one or more devices.
"""

import sys
import os

# Cross-skill import: ad-ops provides ADClient
_scripts_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "ad-ops", "scripts"
)
_scripts_dir = os.path.realpath(_scripts_dir)
if not os.path.isdir(_scripts_dir):
    print("错误: 无法定位 ad-ops/scripts 目录", file=sys.stderr)
    sys.exit(9)
sys.path.insert(0, _scripts_dir)

try:
    from ad_api import ADClient, ADConnectionError, ADAuthError, ADAPIError
except ImportError as e:
    print(f"错误: 无法导入 ad_api: {e}", file=sys.stderr)
    sys.exit(9)

from multi_device import (
    run_multi, parse_hosts_arg, load_devices_json,
    compute_multi_exit_code, host_slug,
)

import argparse
import json
from typing import Any, Dict, Optional


def test_one_device(host: str, username: str = "admin", password: str = "") -> Dict[str, str]:
    """Test connectivity and auth for a single device.

    Returns:
        dict with keys: host, status ('ok'|'connect_fail'|'auth_fail'|'error'),
        and optional error message.
    """
    try:
        client = ADClient(host=host, username=username, password=password)
        # Lightweight auth test: call a minimal API endpoint
        client.get_users()
        return {"host": host, "status": "ok"}
    except ADAuthError as e:
        return {"host": host, "status": "auth_fail", "error": str(e)}
    except ADConnectionError as e:
        return {"host": host, "status": "connect_fail", "error": str(e)}
    except ADAPIError as e:
        # Non-auth API error means we connected and authenticated successfully,
        # but the API call itself failed (unlikely for get_users)
        return {"host": host, "status": "api_error", "warning": str(e)}
    except Exception as e:
        return {"host": host, "status": "error", "error": f"{type(e).__name__}: {e}"}


def _test_one(client: Any) -> Dict[str, str]:
    """Worker function for run_multi (receives ADClient, returns result dict)."""
    return test_one_device(client.host, client.username, client.password)


def _extract_ip(host: str) -> str:
    """Extract IPv4 from a host URL."""
    import re
    m = re.search(r'(\d+\.\d+\.\d+\.\d+)', host)
    return m.group(1) if m else host


def _render_table(results: Dict[str, Any]) -> str:
    """Render a simple summary table."""
    lines = []
    lines.append("| 设备 | IP | 状态 |")
    lines.append("|------|-----|------|")

    status_icons = {
        "ok": "✅ 正常",
        "connect_fail": "🔌 连接失败",
        "auth_fail": "🔑 认证失败",
        "api_error": "⚠️ API 异常",
        "error": "❌ 错误",
    }

    ok_count = 0
    fail_count = 0

    for host, result in results.items():
        ip = _extract_ip(host)
        if "error" in result:
            st = result["error"]
            if "Auth" in st or "401" in st or "认证" in st:
                icon = status_icons["auth_fail"]
            else:
                icon = status_icons["connect_fail"]
            lines.append(f"| {host} | {ip} | {icon} |")
            fail_count += 1
        else:
            status = result.get("status", "ok")
            icon = status_icons.get(status, status_icons["error"])
            lines.append(f"| {host} | {ip} | {icon} |")
            if status == "ok":
                ok_count += 1
            else:
                fail_count += 1

    lines.append("")

    total = ok_count + fail_count
    if fail_count == 0:
        lines.append(f"> {ok_count}/{total} 台设备连接正常。")
    elif ok_count == 0:
        lines.append(f"> 0/{total} 台设备连接正常，全部失败。")
    else:
        lines.append(f"> {ok_count}/{total} 台设备连接正常，{fail_count}/{total} 台失败。")

    return "\n".join(lines)


def _compute_exit_code(results: Dict[str, Any]) -> int:
    """Compute exit code for connect results.

    0 = all OK
    1 = all connection failed
    2 = all auth failed
    7 = partial failure
    9 = import error (handled earlier)
    """
    total = len(results)
    if total == 0:
        return 4

    ok = sum(1 for v in results.values() if v.get("status") == "ok")
    failed = total - ok

    if failed == 0:
        return 0

    if ok == 0:
        auth_failures = sum(
            1 for v in results.values()
            if v.get("status") == "auth_fail"
            or ("error" in v and any(kw in v["error"] for kw in ("Auth", "401", "认证")))
        )
        if auth_failures == total:
            return 2
        return 1

    return 7


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="AD Device Connectivity Test")
    parser.add_argument("--host", default="", help="单设备地址")
    parser.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    parser.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    parser.add_argument("--device", default="", help="从 --devices 中选择单台设备名称，如 AD1")
    parser.add_argument("--user", default="admin", help="用户名 (default: admin)")
    parser.add_argument("--password", default="", help="密码 (或环境变量 AD_PASS)")
    parser.add_argument("--format", choices=["table", "json"], default="table",
                        help="输出格式 (default: table)")

    args = parser.parse_args()

    password = os.environ.get("AD_PASS", "") or args.password

    # Multi-device mode
    if args.hosts or args.devices:
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, password)
        else:
            devices = load_devices_json(args.devices, args.device)

        if not devices:
            print("错误: 设备列表为空", file=sys.stderr)
            sys.exit(4)

        results = run_multi(devices, _test_one)

        if args.format == "json":
            output = {
                "results": results,
                "summary": {
                    "total": len(results),
                    "ok": sum(1 for v in results.values() if v.get("status") == "ok"),
                    "failed": sum(1 for v in results.values() if v.get("status") != "ok"),
                }
            }
            print(json.dumps(output, ensure_ascii=False, indent=2, default=str))
        else:
            print(_render_table(results))

        sys.exit(_compute_exit_code(results))

    # Single-device mode
    if not args.host:
        print("错误: 未指定设备，请使用 --host 或 --hosts", file=sys.stderr)
        sys.exit(4)

    host = args.host
    try:
        result = test_one_device(host, args.user, password)
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)

    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
    else:
        if result["status"] == "ok":
            print(f"✅ {host} — 连接正常，认证通过")
            if "warning" in result:
                print(f"   ⚠️ {result['warning']}")
        elif result["status"] == "connect_fail":
            print(f"🔌 {host} — 连接失败: {result['error']}")
        elif result["status"] == "auth_fail":
            print(f"🔑 {host} — 认证失败: {result['error']}")
        else:
            print(f"❌ {host} — 错误: {result.get('error', '未知')}")

    sys.exit(0 if result["status"] == "ok" else 1)


if __name__ == "__main__":
    main()
