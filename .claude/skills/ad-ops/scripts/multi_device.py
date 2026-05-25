#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Shared multi-device support for AD skill scripts.

Provides:
    run_multi()          — ThreadPoolExecutor-based parallel execution
    resolve_device_pw()  — password resolution: field > env var > fallback
    render_multi_summary() — markdown summary output helper
    compute_multi_exit_code() — exit code per design spec (0/1/2/4/7)
    parse_hosts_arg()    — parse --hosts comma-separated string into device list
    load_devices_json()  — load devices.json file
"""

import copy
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FutureTimeout
from typing import Any, Callable, Dict, List, Optional

MAX_WORKERS = 10


def resolve_device_pw(device: Dict[str, Any], fallback: str = "") -> str:
    """Resolve device password: password field > password_from env var > fallback."""
    if device.get("password"):
        return device["password"]
    if device.get("password_from"):
        return os.environ.get(device["password_from"], "")
    return fallback


def parse_hosts_arg(hosts_str: str, user: str = "admin", password: str = "") -> List[Dict[str, Any]]:
    """Parse a comma-separated --hosts string into a device list.

    Example: "https://192.168.8.30,https://192.168.8.31" ->
        [{"host": "https://192.168.8.30", "user": "admin", "password": ""}, ...]
    """
    devices = []
    for host in hosts_str.split(","):
        host = host.strip()
        if host:
            devices.append({"host": host, "user": user, "password": password})
    return devices


def _device_env_prefix(name: str) -> str:
    """Return the environment prefix used for a device name such as AD1."""
    return re.sub(r"[^A-Za-z0-9]+", "_", name).strip("_").upper()


def _first_env(names: List[str]) -> str:
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    return ""


def apply_device_env_overrides(device: Dict[str, Any]) -> Dict[str, Any]:
    """Apply non-secret host/user overrides for named devices.

    This keeps devices.json portable: AD1 can default to the documented host,
    while WorkBot or local operators can select public/private reachability with
    AD1_HOST, AD1_PUBLIC_URL, or AD1_BASE_URL.
    """
    item = copy.deepcopy(device)
    name = str(item.get("name") or "").strip()
    if not name:
        return item
    prefix = _device_env_prefix(name)
    host = _first_env([f"{prefix}_HOST", f"{prefix}_PUBLIC_URL", f"{prefix}_BASE_URL"])
    user = _first_env([f"{prefix}_USER", f"{prefix}_USERNAME"])
    if host:
        item["host"] = host
    if user:
        item["user"] = user
    return item


def filter_devices(devices: List[Dict[str, Any]], selector: str = "") -> List[Dict[str, Any]]:
    """Filter devices by name or host. Empty selector returns all devices."""
    needle = selector.strip().lower()
    if not needle:
        return devices
    return [
        device
        for device in devices
        if str(device.get("name", "")).strip().lower() == needle
        or str(device.get("host", "")).strip().lower() == needle
    ]


def load_devices_json(path: str, device: str = "") -> List[Dict[str, Any]]:
    """Load device list from a JSON file.

    Expected format:
        {"devices": [{"name": "AD1", "host": "https://...", "user": "admin", "password": "..."}]}
    """
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    devices = [apply_device_env_overrides(item) for item in data.get("devices", [])]
    return filter_devices(devices, device)


def run_multi(
    devices: List[Dict[str, Any]],
    func: Callable[..., Any],
    **kwargs: Any,
) -> Dict[str, Any]:
    """Execute func(client, **kwargs) in parallel for each device.

    Args:
        devices: list of dicts [{host, user, password, name}, ...]
        func: callable(client, **kwargs) -> result dict
        **kwargs: common params passed to func (subcommand, scene, work_dir_base, etc.)

    Returns:
        {host: result_dict, ...} — each result dict may contain an "error" key on failure.
    """
    results: Dict[str, Any] = {}
    common_pw = kwargs.pop("password", os.environ.get("AD_PASS", ""))
    total_timeout = kwargs.pop("_timeout", 900)

    from ad_api import ADClient

    with ThreadPoolExecutor(max_workers=min(len(devices), MAX_WORKERS)) as ex:
        futures = {}
        for d in devices:
            pw = resolve_device_pw(d, common_pw)
            client = ADClient(
                host=d["host"],
                username=d.get("user", "admin"),
                password=pw,
            )
            setattr(client, "device_name", d.get("name", ""))
            futures[ex.submit(func, client, **kwargs)] = d

        deadline = time.monotonic() + total_timeout
        for f in as_completed(futures, timeout=total_timeout):
            d = futures[f]
            remaining = deadline - time.monotonic()
            try:
                if remaining <= 0:
                    raise FutureTimeout("全局超时")
                results[d["host"]] = f.result(timeout=max(remaining, 1))
            except FutureTimeout:
                results[d["host"]] = {"error": "超时（仍在执行）"}
            except (KeyboardInterrupt, SystemExit):
                raise
            except Exception as e:
                results[d["host"]] = {"error": f"{type(e).__name__}: {e}"}

    return results


def compute_multi_exit_code(results: Dict[str, Any]) -> int:
    """Compute exit code for multi-device results.

    0 = all success
    1 = all failed
    2 = all auth failed
    4 = parameter error (not used here directly)
    7 = partial success / partial failure (distinct from single-device exit 5/6)
    """
    total = len(results)
    if total == 0:
        return 4

    success_count = sum(1 for v in results.values() if "error" not in v)
    failed_count = total - success_count

    if failed_count == 0:
        return 0

    if success_count == 0:
        # Check if all failures are auth-related
        auth_keywords = ("401", "认证失败", "Authentication", "ADAuthError")
        all_auth = all(
            any(kw in v.get("error", "") for kw in auth_keywords)
            for v in results.values()
        )
        return 2 if all_auth else 1

    # Partial success
    return 7


def render_multi_summary(
    results: Dict[str, Any],
    title: str = "AD Report — 多设备",
    device_names: Optional[Dict[str, str]] = None,
) -> str:
    """Render a multi-device summary table in markdown.

    Args:
        results: {host: result_dict, ...}
        title: report title
        device_names: optional {host: name} mapping for display

    Returns:
        markdown string with summary table
    """
    lines = [f"# {title}", ""]
    device_names = device_names or {}

    # Summary table
    lines.append("| 设备 | 状态 |")
    lines.append("|------|------|")
    success_count = 0
    failed_count = 0
    for host, result in results.items():
        name = device_names.get(host, host)
        if "error" in result:
            lines.append(f"| {name} | ❌ {result['error']} |")
            failed_count += 1
        else:
            lines.append(f"| {name} | ✅ 正常 |")
            success_count += 1
    lines.append("")

    total = success_count + failed_count
    if failed_count == 0:
        lines.append(f"> {success_count}/{total} 台正常。全部成功")
    elif success_count == 0:
        lines.append(f"> 0/{total} 台正常。全部失败 (exit 1)")
    else:
        lines.append(f"> {success_count}/{total} 台正常，{failed_count}/{total} 台异常。部分失败 (exit 7)")

    return "\n".join(lines)


def host_slug(host: str) -> str:
    """Convert a host URL to a filesystem-safe slug."""
    import re
    return re.sub(r'[^a-zA-Z0-9._-]', '_', host)


def _print_error(msg: str) -> None:
    """Print to stderr with a consistent prefix."""
    print(msg, file=sys.stderr)

if __name__ == "__main__":
    print("This module is not meant to be run directly.", file=sys.stderr)
