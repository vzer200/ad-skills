#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AD Device Overview Snapshot Script
深信服AD设备概览快照脚本

Usage:
    python overview.py all      --host https://x.x.x.x --user admin --password xxx [--format json]
    python overview.py vs       --host ... [--format json]
    python overview.py pool     --host ... [--format json]
    python overview.py cert     --host ... [--format json]
    python overview.py hardware --host ... [--format json]
    python overview.py ha       --host ... [--format json]
    python overview.py traffic  --host ... [--format json]
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

from ad_api import ADClient
from multi_device import (
    run_multi, parse_hosts_arg, load_devices_json,
    compute_multi_exit_code, render_multi_summary, host_slug,
)


# =============================================================================
# Helper: certificate date / level
# =============================================================================

def calc_days_left(validity_not_after: str, now: Optional[datetime] = None) -> int:
    """
    Calculate the number of days between *now* and the certificate expiry date.

    The AD API returns dates in ``"YYYY/MM/DD HH:MM:SS"`` format (device local
    time).  No time-zone conversion is performed.
    """
    if not validity_not_after:
        return -1
    if now is None:
        now = datetime.now()
    expiry = datetime.strptime(validity_not_after, "%Y/%m/%d %H:%M:%S")
    delta = expiry - now
    return delta.days


def cert_level(days_left: int) -> str:
    """Return the English severity level for a certificate."""
    if days_left <= 30:
        return "critical"
    if days_left <= 60:
        return "warning"
    if days_left <= 90:
        return "info"
    return "ok"


def cert_level_cn(days_left: int) -> str:
    """Return the Chinese severity level for a certificate."""
    if days_left <= 30:
        return "严重"
    if days_left <= 60:
        return "警告"
    if days_left <= 90:
        return "提示"
    return "正常"


# =============================================================================
# Helper: hardware component levels
# =============================================================================

def hardware_component_level(value: float, warn_threshold: float, crit_threshold: float) -> str:
    """Numeric hardware threshold."""
    if value >= crit_threshold:
        return "critical"
    if value >= warn_threshold:
        return "warning"
    return "ok"


def fan_level(status: str) -> str:
    """Fan status → level."""
    s = status.lower()
    if s == "fail":
        return "critical"
    if s != "normal":
        return "warning"
    return "ok"


def power_level(status: str) -> str:
    """Power status → level."""
    s = status.lower()
    if s == "fail":
        return "critical"
    if s in ("unsupported", "abnormal"):
        return "warning"
    return "ok"


def interface_level(status: str) -> str:
    """Interface status → level."""
    s = status.lower()
    if s in ("out", "down"):
        return "warning"
    return "ok"


# =============================================================================
# Build the overview data structure
# =============================================================================

# -- API dispatch table -------------------------------------------------------
# Maps subcommand → list of internal API type names, and each type to the
# ADClient method that provides the data.
API_GROUPS: Dict[str, List[str]] = {
    "all":      ["vs", "pool", "cert", "ha", "hardware", "traffic"],
    "vs":       ["vs", "traffic"],
    "pool":     ["pool"],
    "cert":     ["cert"],
    "hardware": ["hardware"],
    "ha":       ["ha"],
    "traffic":  ["traffic"],
}


def _try_call(client, method_name: str) -> Any:
    """Call a named ADClient method; return the result or raise."""
    return getattr(client, method_name)()


def build_overview(client: ADClient, subcommand: str = "all") -> Dict[str, Any]:
    """
    Call the relevant APIs and assemble a complete overview dictionary.

    Returns
    -------
    dict with keys:
        device, virtual_services, certificates, hardware, api_errors
    """
    api_types = API_GROUPS.get(subcommand, [subcommand])

    overview: Dict[str, Any] = {
        "device": {"host": client.host},
        "virtual_services": [],
        "certificates": [],
        "hardware": {},
        "api_errors": {},
    }

    # ---------- Collect raw data (with error isolation) -----------------------
    raw: Dict[str, Any] = {}

    api_method_map = {
        "vs":       "get_virtual_services",
        "pool":     "get_pools",
        "cert":     "get_ssl_certificates",
        "ha":       "get_ha_status",
        "hardware": "get_sys_system",
        "traffic":  "get_vs_stat",
    }

    for api_type in api_types:
        method = api_method_map.get(api_type)
        if method is None:
            overview["api_errors"][api_type] = f"未知的 API 类型: {api_type}"
            raw[api_type] = None
            continue
        try:
            raw[api_type] = _try_call(client, method)
            overview["api_errors"][api_type] = None
        except Exception as e:
            raw[api_type] = None
            overview["api_errors"][api_type] = str(e)

    # ---------- Device info (HA + hardware summary) --------------------------
    ha_data = raw.get("ha")
    if ha_data:
        overview["device"]["ha_role"] = ha_data.get("role", "")
        overview["device"]["ha_status"] = ha_data.get("status", "")

    sys_data = raw.get("hardware")
    if sys_data:
        overview["device"]["version"] = sys_data.get("version", "")
        overview["device"]["uptime"] = sys_data.get("uptime", "")
        overview["device"]["cpu"] = _extract_value(sys_data.get("cpu_usage"))
        overview["device"]["memory"] = _extract_value(sys_data.get("memory_usage"))

    # ---------- Virtual Services ---------------------------------------------
    vs_data = raw.get("vs")
    pool_data = raw.get("pool")
    vs_stat_data = raw.get("traffic")

    if vs_data is not None:
        vs_items = vs_data.get("items", [])
        pool_map = _build_pool_map(pool_data) if pool_data else {}
        stat_map = _build_vs_stat_map(vs_stat_data) if vs_stat_data else {}

        for vs in vs_items:
            overview["virtual_services"].append(_process_vs(vs, pool_map, stat_map))

    # ---------- Certificates ------------------------------------------------
    cert_data = raw.get("cert")
    if cert_data is not None:
        for cert in cert_data.get("items", []):
            overview["certificates"].append(_process_cert(cert))

    # ---------- Hardware detail ---------------------------------------------
    if sys_data is not None:
        overview["hardware"] = _process_hardware(sys_data)

    return overview


# -- Internal processors ------------------------------------------------------

def _build_pool_map(pool_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Build a lookup map: pool_name → {total, up, down, state}."""
    pool_map: Dict[str, Dict[str, Any]] = {}
    for pool in pool_data.get("items", []):
        name = pool.get("name", "")
        members = pool.get("members", [])
        up = sum(1 for m in members if m.get("state") == "up")
        total = len(members)
        pool_map[name] = {
            "total": total,
            "up": up,
            "down": total - up,
            "state": pool.get("state", ""),
        }
    return pool_map


def _build_vs_stat_map(vs_stat_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Build a lookup map: vs_name → stat dict."""
    stat_map: Dict[str, Dict[str, Any]] = {}
    for item in vs_stat_data.get("items", []):
        stat_map[item.get("name", "")] = item
    return stat_map


def _process_vs(vs: Dict[str, Any],
                pool_map: Dict[str, Dict[str, Any]],
                stat_map: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Transform a single VS entry into the overview representation."""
    name = vs.get("name", "")
    vips = vs.get("vips") or []
    vports = vs.get("vports") or []

    # Cartesian product: every VIP × every VPort
    vip_ports = [f"{vip}:{vport}" for vip in vips for vport in vports]

    pool_name = vs.get("pool_name", "")
    pool_info = pool_map.get(pool_name, {})
    stat = stat_map.get(name, {})

    return {
        "name": name,
        "vip_ports": vip_ports,
        "pool": pool_name,
        "status": vs.get("state", ""),
        "nodes": pool_info,
        "connections": _extract_value(stat.get("connection")),
        "connection_rate": _extract_value(stat.get("connection_rate")),
    }


def _process_cert(cert: Dict[str, Any]) -> Dict[str, Any]:
    """Transform a certificate entry and compute expiry metadata."""
    validity = cert.get("validity_not_after", "")
    days = calc_days_left(validity)
    return {
        "name": cert.get("name", ""),
        "expiry": validity,
        "days_left": days,
        "level": cert_level(days),
    }


def _extract_value(field):
    """Extract numeric value from API field which may be a dict like
    {"model": "INSTANT", "value": 7, ...} or a raw number."""
    if isinstance(field, dict):
        return field.get("value", 0)
    if isinstance(field, list):
        return field[0] if field else None
    return field if field is not None else 0


def _process_hardware(sys_data: Dict[str, Any]) -> Dict[str, Any]:
    """Transform system data into the hardware detail section."""
    cpu_val = _extract_value(sys_data.get("cpu_usage"))
    mem_val = _extract_value(sys_data.get("memory_usage"))

    def _level_numeric(v, warn=80, crit=90):
        if v is None:
            return "unknown"
        try:
            return hardware_component_level(float(v), warn, crit)
        except (ValueError, TypeError):
            return "unknown"

    # fan: list of dicts or empty list
    fan_list = sys_data.get("fan") or []
    fans = [
        {
            "name": f.get("name", ""),
            "status": f.get("status", "unknown"),
            "level": fan_level(f.get("status", "unknown")),
        }
        for f in fan_list
    ]

    # power_supply: string like "UNSUPPORTED" or list of dicts
    ps_raw = sys_data.get("power_supply", "")
    if isinstance(ps_raw, str):
        power = [{"name": "psu", "status": ps_raw, "level": power_level(ps_raw)}]
    elif isinstance(ps_raw, list):
        power = [
            {
                "name": p.get("name", ""),
                "status": p.get("status", "unknown"),
                "level": power_level(p.get("status", "unknown")),
            }
            for p in ps_raw
        ]
    else:
        power = []

    # interface: dict like {"total": 5, "plug": {"in": ["eth1"], "out": ["eth2",...]}}
    iface_raw = sys_data.get("interface", {})
    interfaces = []
    if isinstance(iface_raw, dict):
        plug = iface_raw.get("plug", {})
        for name in plug.get("in", []):
            interfaces.append({"name": name, "status": "up", "level": interface_level("up")})
        for name in plug.get("out", []):
            interfaces.append({"name": name, "status": "out", "level": interface_level("out")})
    elif isinstance(iface_raw, list):
        for i in iface_raw:
            interfaces.append({
                "name": i.get("name", ""),
                "status": i.get("status", "unknown"),
                "level": interface_level(i.get("status", "unknown")),
            })

    return {
        "cpu": {"value": cpu_val, "level": _level_numeric(cpu_val)},
        "memory": {"value": mem_val, "level": _level_numeric(mem_val)},
        "temperature": {"value": _extract_value(sys_data.get("temperature")), "level": "ok"},
        "fans": fans,
        "power": power,
        "interfaces": interfaces,
    }


# =============================================================================
# Markdown rendering
# =============================================================================

_LEVEL_CN_MAP = {
    "critical": "严重",
    "warning":  "警告",
    "info":     "提示",
    "ok":       "正常",
}


def _level_cn(level: str) -> str:
    """Map English level to Chinese label."""
    return _LEVEL_CN_MAP.get(level, level)


def render_markdown(overview: Dict[str, Any]) -> str:
    """Render the overview dictionary as a Markdown string."""
    lines: List[str] = []
    api_errors = overview.get("api_errors", {})

    def a(e):
        lines.append(e)

    a("# AD Device Overview")
    a("")

    # -- Device Info ----------------------------------------------------------
    a("## Device Info")
    dev = overview.get("device", {})
    a(f"- **Host**: {dev.get('host', '')}")
    if dev.get("version"):
        a(f"- **Version**: {dev['version']}")
    if dev.get("uptime"):
        a(f"- **Uptime**: {dev['uptime']}")
    if dev.get("ha_role"):
        ha_status = dev.get("ha_status", "")
        role_line = f"- **HA Role**: {dev['ha_role']}"
        if ha_status:
            role_line += f" ({ha_status})"
        a(role_line)
    cpu_display = _extract_value(dev.get("cpu"))
    mem_display = _extract_value(dev.get("memory"))
    if cpu_display is not None:
        a(f"- **CPU**: {cpu_display}%")
    if mem_display is not None:
        a(f"- **Memory**: {mem_display}%")
    a("")

    # -- Virtual Services -----------------------------------------------------
    a("## Virtual Services")
    vs_error = api_errors.get("vs")
    if vs_error:
        a(f"> 获取失败: {vs_error}")
    else:
        vs_list = overview.get("virtual_services", [])
        if not vs_list:
            a("(无虚拟服务)")
        else:
            a("| Name | VIP:Port | Pool | Status | Nodes (Up/Total) | Connections | Rate |")
            a("|------|----------|------|--------|-------------------|-------------|------|")
            for vs in vs_list:
                name = vs.get("name", "")
                vip_ports = ", ".join(vs.get("vip_ports", []))
                pool = vs.get("pool", "")
                status = vs.get("status", "")
                nodes = vs.get("nodes", {})
                node_str = f"{nodes.get('up', 0)}/{nodes.get('total', 0)}"
                conn = _extract_value(vs.get("connections"))
                conn_str = str(conn) if conn is not None else "-"
                rate = _extract_value(vs.get("connection_rate"))
                rate_str = f"{rate}/s" if rate is not None else "-"
                a(f"| {name} | {vip_ports} | {pool} | {status} | {node_str} | {conn_str} | {rate_str} |")
    a("")

    # -- SSL Certificates -----------------------------------------------------
    a("## SSL Certificates")
    cert_error = api_errors.get("cert")
    if cert_error:
        a(f"> 获取失败: {cert_error}")
    else:
        cert_list = overview.get("certificates", [])
        if not cert_list:
            a("(无证书)")
        else:
            a("| Name | Expiry | Days Left | Status |")
            a("|------|--------|-----------|--------|")
            for c in cert_list:
                cn = _level_cn(c.get("level", "ok"))
                a(f"| {c.get('name', '')} | {c.get('expiry', '')} | {c.get('days_left', '')} | {cn} |")
    a("")

    # -- Hardware Status ------------------------------------------------------
    a("## Hardware Status")
    hw_error = api_errors.get("hardware")
    if hw_error:
        a(f"> 获取失败: {hw_error}")
    else:
        hw = overview.get("hardware", {})
        if not hw:
            a("(无硬件信息)")
        else:
            a("| Component | Value | Status |")
            a("|-----------|-------|--------|")

            def hw_row(label, value_str, level):
                cn = _level_cn(level)
                a(f"| {label} | {value_str} | {cn} |")

            if "cpu" in hw:
                cpu = hw["cpu"]
                hw_row("CPU", f"{cpu.get('value', '')}%", cpu.get("level", "ok"))
            if "memory" in hw:
                mem = hw["memory"]
                hw_row("Memory", f"{mem.get('value', '')}%", mem.get("level", "ok"))
            temp_val = hw.get("temperature", {}).get("value")
            if temp_val is not None:
                hw_row("Temperature", f"{temp_val}C", hw["temperature"].get("level", "ok"))

            for f in hw.get("fans", []):
                hw_row(f"Fan: {f.get('name', '')}", f.get("status", ""), f.get("level", "ok"))
            for p in hw.get("power", []):
                hw_row(f"Power: {p.get('name', '')}", p.get("status", ""), p.get("level", "ok"))
            for i in hw.get("interfaces", []):
                hw_row(f"Interface: {i.get('name', '')}", i.get("status", ""), i.get("level", "ok"))
    a("")

    return "\n".join(lines)


# =============================================================================
# CLI
# =============================================================================

def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser."""
    parser = argparse.ArgumentParser(
        description="AD Device Overview — 深信服AD设备概览快照",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    parser.add_argument(
        "subcommand",
        nargs="?",
        choices=["all", "vs", "pool", "cert", "hardware", "ha", "traffic"],
        default="all",
        help="概览维度 (默认: all)",
    )
    parser.add_argument(
        "--host", "-H",
        default=os.environ.get("AD_HOST", ""),
        help="AD 设备地址 (可设置环境变量 AD_HOST)",
    )
    parser.add_argument(
        "--hosts",
        default="",
        help="多设备地址，逗号分隔 (如 https://IP1,https://IP2)",
    )
    parser.add_argument(
        "--devices",
        default="",
        help="设备清单 JSON 文件路径 (密码不同时使用)",
    )
    parser.add_argument(
        "--user", "-u",
        default=os.environ.get("AD_USER", "admin"),
        help="用户名 (默认: admin)",
    )
    parser.add_argument(
        "--password", "-p",
        default=os.environ.get("AD_PASS", ""),
        help="密码 (可设置环境变量 AD_PASS)",
    )
    parser.add_argument(
        "--format", "-f",
        choices=["markdown", "json"],
        default="markdown",
        help="输出格式 (默认: markdown)",
    )
    return parser


def _overview_one(client, subcommand="all"):
    """Single-device overview for ThreadPoolExecutor — returns dict, no sys.exit."""
    overview = build_overview(client, subcommand)
    markdown = render_markdown(overview)
    return {"overview": overview, "markdown": markdown}


def main() -> None:
    """CLI entry point."""
    sys.stdout.reconfigure(encoding='utf-8')
    parser = build_parser()
    args = parser.parse_args()

    if args.hosts and args.host:
        print("警告: --hosts 和 --host 同时指定，--host 将被忽略", file=sys.stderr)

    # -- Multi-device mode -----------------------------------------------------
    if args.hosts or args.devices:
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, args.password)
        else:
            devices = load_devices_json(args.devices)

        if not devices:
            print("错误: 设备列表为空", file=sys.stderr)
            sys.exit(4)

        results = run_multi(devices, _overview_one, subcommand=args.subcommand)

        if args.format == "json":
            output = {
                "mode": "multi",
                "summary": {
                    "total": len(results),
                    "success": sum(1 for v in results.values() if "error" not in v),
                    "failed": sum(1 for v in results.values() if "error" in v),
                },
                "results": results,
            }
            print(json.dumps(output, indent=2, ensure_ascii=False))
        else:
            lines = [render_multi_summary(results, "AD Device Overview — 多设备")]
            lines.append("---")
            for host, result in results.items():
                if "error" in result:
                    lines.append(f"## {host}")
                    lines.append(f"> 错误: {result['error']}")
                else:
                    lines.append(f"## {host}")
                    lines.append(result.get("markdown", ""))
                lines.append("")
            lines.append("---")
            lines.append(render_multi_summary(results, "", {}))
            print("\n".join(lines))

        sys.exit(compute_multi_exit_code(results))

    # -- Parameter validation -------------------------------------------------
    if not args.host:
        print("用法: python overview.py {all|vs|pool|cert|hardware|ha|traffic}", file=sys.stderr)
        print("       --host HOST [--user USER] [--password PASS] [--format json]", file=sys.stderr)
        print("", file=sys.stderr)
        print("密码优先使用环境变量 AD_PASS, 其次 --password 参数", file=sys.stderr)
        sys.exit(4)

    if not args.password:
        print("用法: 未指定密码, 请使用 --password 或设置环境变量 AD_PASS", file=sys.stderr)
        sys.exit(4)

    # -- Collect data ---------------------------------------------------------
    try:
        client = ADClient(
            host=args.host,
            username=args.user,
            password=args.password,
        )
    except Exception as e:
        print(f"错误: 连接失败: {e}", file=sys.stderr)
        sys.exit(1)

    overview = build_overview(client, args.subcommand)

    # -- Output ---------------------------------------------------------------
    if args.format == "json":
        print(json.dumps(overview, indent=2, ensure_ascii=False))
    else:
        print(render_markdown(overview))

    # -- Exit code ------------------------------------------------------------
    api_errors = overview.get("api_errors", {})
    errors = {k: v for k, v in api_errors.items() if v is not None}
    total_apis = len(api_errors)
    failed_count = len(errors)

    if failed_count == 0:
        sys.exit(0)

    if failed_count == total_apis:
        # All API calls failed
        first_err = list(errors.values())[0]
        if any(kw in first_err for kw in ("401", "认证失败", "Authentication")):
            print("错误: 认证失败", file=sys.stderr)
            sys.exit(2)
        if "连接失败" in first_err:
            print(f"错误: 连接失败", file=sys.stderr)
            sys.exit(1)
        print("错误: 所有数据源获取失败", file=sys.stderr)
        sys.exit(1)

    # Partial failure
    for err_msg in errors.values():
        print(f"错误: {err_msg}", file=sys.stderr)
    sys.exit(5)


if __name__ == "__main__":
    main()
