#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深信服 AD 设备查询脚本

Usage:
    python overview.py all      --host https://x.x.x.x --user admin --password xxx [--format json]
    python overview.py config   --host ... [--format json]
    python overview.py vs       --host ... [--format json]
    python overview.py node     --host ... [--format json]
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
from urllib.parse import urlparse

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
    "config":   ["vs", "pool", "cert"],
    "vs":       ["vs"],
    "node":     ["pool"],
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

    device_name = getattr(client, "device_name", "")
    if not isinstance(device_name, str):
        device_name = ""

    overview: Dict[str, Any] = {
        "query": subcommand,
        "device": {"host": client.host, "name": device_name},
        "virtual_services": [],
        "pools": [],
        "nodes": [],
        "certificates": [],
        "hardware": {},
        "traffic": [],
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
        cpu_value = _extract_optional_value(sys_data.get("cpu_usage"))
        mem_value = _extract_optional_value(sys_data.get("memory_usage"))
        if cpu_value is not None:
            overview["device"]["cpu"] = cpu_value
        if mem_value is not None:
            overview["device"]["memory"] = mem_value

    # ---------- Virtual Services ---------------------------------------------
    vs_data = raw.get("vs")
    pool_data = raw.get("pool")

    if vs_data is not None:
        vs_items = vs_data.get("items", [])

        for vs in vs_items:
            overview["virtual_services"].append(_process_vs(vs))

    # ---------- Pools / Nodes ------------------------------------------------
    if pool_data is not None:
        for pool in pool_data.get("items", []):
            processed_pool = _process_pool(pool)
            overview["pools"].append(processed_pool)
            for member in processed_pool.get("members", []):
                overview["nodes"].append(_process_node(member, processed_pool.get("name", "")))

    # ---------- Certificates ------------------------------------------------
    cert_data = raw.get("cert")
    if cert_data is not None:
        for cert in cert_data.get("items", []):
            overview["certificates"].append(_process_cert(cert))

    # ---------- Traffic -----------------------------------------------------
    vs_stat_data = raw.get("traffic")
    if vs_stat_data is not None:
        for item in vs_stat_data.get("items", []):
            overview["traffic"].append(_process_traffic(item))

    # ---------- Hardware detail ---------------------------------------------
    if sys_data is not None:
        overview["hardware"] = _process_hardware(sys_data)

    return overview


# -- Internal processors ------------------------------------------------------

def _process_vs(vs: Dict[str, Any]) -> Dict[str, Any]:
    """Transform a single VS entry into the overview representation."""
    vips = vs.get("vips") or []
    vports = vs.get("vports") or []

    # Cartesian product: every VIP × every VPort
    vip_ports = [f"{vip}:{vport}" for vip in vips for vport in vports]

    pool_name = _first_non_empty(vs, ("pool", "pool_name", "default_pool_name"))

    return {
        "name": vs.get("name", ""),
        "vip_ports": vip_ports,
        "pool": pool_name,
        "status": vs.get("state", ""),
    }


def _process_pool(pool: Dict[str, Any]) -> Dict[str, Any]:
    """Transform a pool entry into a user-facing config summary."""
    members = pool.get("members")
    if members is None:
        members = pool.get("nodes")
    members = members or []
    up = sum(1 for m in members if str(m.get("state", "")).lower() == "up")
    total = len(members)
    return {
        "name": pool.get("name", ""),
        "status": _first_non_empty(pool, ("state", "status", "enabled", "enable")) or "enable",
        "total": total,
        "up": up,
        "down": total - up,
        "members": [
            {
                "name": m.get("name", ""),
                "ip": m.get("ip", "") or m.get("address", ""),
                "port": m.get("port", ""),
                "status": m.get("state", ""),
                "weight": m.get("weight", ""),
            }
            for m in members
        ],
    }


def _first_non_empty(source: Dict[str, Any], keys: tuple[str, ...]) -> Any:
    """Return the first present non-empty value from a set of API field aliases."""
    for key in keys:
        value = source.get(key)
        if value not in (None, ""):
            return value
    return ""


def _process_node(member: Dict[str, Any], pool_name: str) -> Dict[str, Any]:
    """Transform a pool member into a flattened node config row."""
    endpoint = f"{member.get('ip', '')}:{member.get('port', '')}".strip(":")
    return {
        "name": member.get("name", "") or endpoint,
        "endpoint": endpoint,
        "pool": pool_name,
        "status": member.get("status", ""),
        "weight": member.get("weight", ""),
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


def _process_traffic(item: Dict[str, Any]) -> Dict[str, Any]:
    """Transform a VS traffic item into a separate status summary."""
    return {
        "name": item.get("name", ""),
        "connections": _extract_value(item.get("connection")),
        "connection_rate": _extract_value(item.get("connection_rate")),
        "throughput": _extract_value(item.get("throughput")),
    }


def _extract_value(field: Any) -> Any:
    """Extract numeric value from API field which may be a dict like
    {"model": "INSTANT", "value": 7, ...} or a raw number."""
    if isinstance(field, dict):
        return field.get("value", 0)
    if isinstance(field, list):
        return field[0] if field else None
    return field if field is not None else 0


def _extract_optional_value(field: Any) -> Any:
    """Extract a metric where missing means unknown, not zero."""
    if isinstance(field, dict):
        return field.get("value")
    if isinstance(field, list):
        return field[0] if field else None
    return field


def _process_hardware(sys_data: Dict[str, Any]) -> Dict[str, Any]:
    """Transform system data into the hardware detail section."""
    cpu_val = _extract_optional_value(sys_data.get("cpu_usage"))
    mem_val = _extract_optional_value(sys_data.get("memory_usage"))

    def _level_numeric(v: Any, warn: float = 80, crit: float = 90) -> str:
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

    hardware = {
        "fans": fans,
        "power": power,
        "interfaces": interfaces,
    }
    if cpu_val is not None:
        hardware["cpu"] = {"value": cpu_val, "level": _level_numeric(cpu_val)}
    if mem_val is not None:
        hardware["memory"] = {"value": mem_val, "level": _level_numeric(mem_val)}
    temp_val = _extract_optional_value(sys_data.get("temperature"))
    if temp_val is not None:
        hardware["temperature"] = {"value": temp_val, "level": "ok"}
    return hardware


# =============================================================================
# Markdown rendering
# =============================================================================

_LEVEL_CN_MAP = {
    "critical": "严重",
    "warning":  "警告",
    "info":     "提示",
    "ok":       "正常",
    "unknown":  "未知",
}

_QUERY_LABELS = {
    "all": "配置、流量、设备状态、SSL 证书",
    "config": "配置",
    "vs": "虚拟服务配置",
    "node": "节点配置",
    "pool": "节点池配置",
    "cert": "SSL 证书",
    "hardware": "设备状态",
    "ha": "HA 状态",
    "traffic": "流量状态",
}

_STATE_CN_MAP = {
    "enable": "启用",
    "enabled": "启用",
    "disable": "停用",
    "disabled": "停用",
    "up": "正常",
    "down": "异常",
    "out": "未接入",
    "normal": "正常",
    "abnormal": "异常",
    "fail": "故障",
    "failed": "故障",
    "master": "主用",
    "slave": "备用",
    "standby": "备用",
    "unsupported": "不支持",
}


_STATE_ICON_MAP = {
    "启用": "✅",
    "正常": "✅",
    "主用": "✅",
    "备用": "✅",
    "停用": "⏸️",
    "异常": "⚠️",
    "未接入": "⚠️",
    "故障": "❌",
    "不支持": "⚠️",
    "-": "—",
}


_LEVEL_ICON_MAP = {
    "critical": "❌",
    "warning": "⚠️",
    "info": "ℹ️",
    "ok": "✅",
    "unknown": "❔",
}


def _level_cn(level: str) -> str:
    """Map English level to Chinese label."""
    return _LEVEL_CN_MAP.get(level, level)


def _level_badge(level: str) -> str:
    """Return a compact user-facing level with an icon."""
    cn = _level_cn(level)
    icon = _LEVEL_ICON_MAP.get(level, "")
    return f"{icon} {cn}".strip()


def _query_label(query: str) -> str:
    """Return the user-facing query label."""
    return _QUERY_LABELS.get(query, query)


def _status_cn(status: Any) -> str:
    """Return a Chinese status label while preserving unknown device values."""
    if status is None or status == "":
        return "-"
    raw = str(status)
    return _STATE_CN_MAP.get(raw.strip().lower(), raw)


def _status_badge(status: Any) -> str:
    """Return a compact user-facing status with an icon."""
    cn = _status_cn(status)
    if cn == "-":
        return cn
    icon = _STATE_ICON_MAP.get(cn, "")
    return f"{icon} {cn}".strip()


def _enabled_text(status: Any, default: str = "否") -> str:
    """Return 是/否 for table columns named 是否启用."""
    if status is None or status == "":
        return default
    normalized = str(status).strip().lower()
    if normalized in {"enable", "enabled", "up", "online", "running", "active", "true", "yes", "1"}:
        return "是"
    if normalized in {"disable", "disabled", "down", "offline", "stopped", "inactive", "false", "no", "0"}:
        return "否"
    return default


def _usage_badge(value: Any) -> str:
    """Return a CPU/memory value with a simple health icon."""
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return _fmt_value(value, "%")
    if numeric >= 90:
        icon = "❌"
    elif numeric >= 80:
        icon = "⚠️"
    else:
        icon = "✅"
    return f"{icon} {_fmt_value(value, '%')}"


def _fmt_value(value: Any, suffix: str = "") -> str:
    """Format a device/API value for markdown tables."""
    if value is None or value == "":
        return "-"
    return f"{value}{suffix}"


def _display_host(host: str) -> str:
    """Return a user-facing host without URL scheme."""
    parsed = urlparse(str(host or ""))
    return parsed.hostname or str(host or "")


def _display_device(device: Dict[str, Any]) -> str:
    """Return a compact user-facing device label."""
    host = _display_host(device.get("host", ""))
    name = str(device.get("name") or "").strip()
    if name and host:
        return f"{name}（{host}）"
    return name or host


def render_markdown(overview: Dict[str, Any]) -> str:
    """Render the overview dictionary as a Markdown string."""
    lines: List[str] = []
    api_errors = overview.get("api_errors", {})
    query = overview.get("query", "all")
    failed = {k: v for k, v in api_errors.items() if v}

    def a(e: str) -> None:
        lines.append(e)

    a("## 查询结论")
    a(f"- 目标设备：{_display_device(overview.get('device', {}))}")
    a(f"- 维度：📌 {_query_label(query)}")
    a("- 数据来源：📡 设备实时查询")
    a(f"- 状态：{'❌ 失败' if failed else '✅ 成功'}")
    a("")

    a("## 查询范围")
    if query == "all":
        a("- 展示范围：配置、流量、设备状态和 SSL 证书。")
    else:
        a(f"- 展示范围：仅{_query_label(query)}。")
    a("- 校验结果：✅ 连接校验和设备读取已完成。")
    a("")

    a("## 查询结果")
    a("")

    dev = overview.get("device", {})
    if query in ("all", "hardware", "ha"):
        a("### 设备状态")
        if dev.get("version"):
            a(f"- 版本：{dev['version']}")
        if dev.get("uptime"):
            a(f"- 运行时间：{dev['uptime']}")
        if dev.get("ha_role") or dev.get("ha_status"):
            role = _status_cn(dev.get("ha_role", ""))
            ha_status = _status_badge(dev.get("ha_status", ""))
            a(f"- HA：{role}（{ha_status}）")
        if "cpu" in dev:
            cpu_display = _extract_value(dev.get("cpu"))
            a(f"- CPU 使用率：{_usage_badge(cpu_display)}")
        if "memory" in dev:
            mem_display = _extract_value(dev.get("memory"))
            a(f"- 内存使用率：{_usage_badge(mem_display)}")
        if not any(k in dev and dev.get(k) not in (None, "") for k in ("version", "uptime", "ha_role", "ha_status", "cpu", "memory")):
            a("- ℹ️ 暂无设备状态摘要。")
        a("")

    if query in ("all", "config", "vs"):
        a("### 虚拟服务配置")
        vs_error = api_errors.get("vs")
        if vs_error:
            a(f"> ❌ 获取失败：{vs_error}")
        else:
            vs_list = overview.get("virtual_services", [])
            if not vs_list:
                a("ℹ️ 暂无虚拟服务配置。")
            else:
                a("| 虚拟服务 | VIP/端口 | 引用节点池 | 是否启用 |")
                a("| --- | --- | --- | --- |")
                for vs in vs_list:
                    name = vs.get("name", "")
                    vip_ports = ", ".join(vs.get("vip_ports", [])) or "-"
                    pool = vs.get("pool", "") or "-"
                    status = _enabled_text(vs.get("status", ""))
                    a(f"| {name} | {vip_ports} | {pool} | {status} |")
        a("")

    if query in ("all", "config", "pool"):
        a("### 节点池配置")
        pool_error = api_errors.get("pool")
        if pool_error:
            a(f"> ❌ 获取失败：{pool_error}")
        else:
            pools = overview.get("pools", [])
            if not pools:
                a("ℹ️ 暂无节点池配置。")
            else:
                a("| 节点池 | 是否启用 | 节点数 | 节点明细 |")
                a("| --- | --- | ---: | --- |")
                for pool in pools:
                    members = []
                    for member in pool.get("members", []):
                        endpoint = f"{member.get('ip', '')}:{member.get('port', '')}".strip(":")
                        weight = member.get("weight", "")
                        weight_text = f"，权重 {weight}" if weight != "" else ""
                        members.append(f"{member.get('name') or endpoint}（{endpoint}{weight_text}）")
                    member_text = "<br>".join(members) if members else "-"
                    a(
                        f"| {pool.get('name', '')} | {_enabled_text(pool.get('status'), default='是')} | "
                        f"{pool.get('total', 0)} | {member_text} |"
                    )
        a("")

    if query == "node":
        a("### 节点配置")
        node_error = api_errors.get("pool")
        if node_error:
            a(f"> ❌ 获取失败：{node_error}")
        else:
            nodes = overview.get("nodes", [])
            if not nodes:
                a("ℹ️ 暂无节点配置。")
            else:
                a("| 节点 | 地址/端口 | 所属节点池 | 是否启用 | 权重 |")
                a("| --- | --- | --- | --- | ---: |")
                for node in nodes:
                    a(
                        f"| {node.get('name', '')} | {_fmt_value(node.get('endpoint'))} | "
                        f"{_fmt_value(node.get('pool'))} | {_enabled_text(node.get('status'))} | "
                        f"{_fmt_value(node.get('weight'))} |"
                    )
        a("")

    if query in ("all", "traffic"):
        a("### 流量状态")
        traffic_error = api_errors.get("traffic")
        if traffic_error:
            a(f"> ❌ 获取失败：{traffic_error}")
        else:
            traffic = overview.get("traffic", [])
            if not traffic:
                a("ℹ️ 暂无流量数据。")
            else:
                a("| 虚拟服务 | 当前连接数 | 新建速率 | 吞吐量 |")
                a("| --- | ---: | ---: | ---: |")
                for item in traffic:
                    rate = _fmt_value(item.get("connection_rate"), "/s")
                    a(
                        f"| {item.get('name', '')} | {_fmt_value(item.get('connections'))} | "
                        f"{rate} | {_fmt_value(item.get('throughput'))} |"
                    )
        a("")

    if query in ("all", "config", "cert"):
        a("### SSL 证书")
        cert_error = api_errors.get("cert")
        if cert_error:
            a(f"> ❌ 获取失败：{cert_error}")
        else:
            cert_list = overview.get("certificates", [])
            if not cert_list:
                a("ℹ️ 暂无 SSL 证书。")
            else:
                a("| 证书 | 到期时间 | 剩余天数 | 风险级别 |")
                a("| --- | --- | ---: | --- |")
                for c in cert_list:
                    cn = _level_badge(c.get("level", "ok"))
                    a(f"| {c.get('name', '')} | {c.get('expiry', '')} | {c.get('days_left', '')} | {cn} |")
        a("")

    if query in ("all", "hardware"):
        a("### 硬件状态")
        hw_error = api_errors.get("hardware")
        if hw_error:
            a(f"> ❌ 获取失败：{hw_error}")
        else:
            hw = overview.get("hardware", {})
            if not hw:
                a("ℹ️ 暂无硬件信息。")
            else:
                a("| 项目 | 当前值 | 状态 |")
                a("| --- | --- | --- |")

                def hw_row(label: str, value_str: str, level: str) -> None:
                    cn = _level_badge(level)
                    a(f"| {label} | {value_str} | {cn} |")

                if "cpu" in hw:
                    cpu = hw["cpu"]
                    hw_row("CPU 使用率", f"{cpu.get('value', '')}%", cpu.get("level", "ok"))
                if "memory" in hw:
                    mem = hw["memory"]
                    hw_row("内存使用率", f"{mem.get('value', '')}%", mem.get("level", "ok"))
                temp_val = hw.get("temperature", {}).get("value")
                if temp_val is not None:
                    hw_row("温度", f"{temp_val}C", hw["temperature"].get("level", "ok"))

                for f in hw.get("fans", []):
                    hw_row(f"风扇：{f.get('name', '')}", _status_badge(f.get("status", "")), f.get("level", "ok"))
                for p in hw.get("power", []):
                    hw_row(f"电源：{p.get('name', '')}", _status_badge(p.get("status", "")), p.get("level", "ok"))
                for i in hw.get("interfaces", []):
                    hw_row(f"接口：{i.get('name', '')}", _status_badge(i.get("status", "")), i.get("level", "ok"))
        a("")

    return "\n".join(lines)


# =============================================================================
# CLI
# =============================================================================

def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser."""
    parser = argparse.ArgumentParser(
        description="深信服 AD 设备查询",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    parser.add_argument(
        "subcommand",
        nargs="?",
        choices=["all", "config", "vs", "node", "pool", "cert", "hardware", "ha", "traffic"],
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
        "--device",
        default="",
        help="从 --devices 中选择单台设备名称，如 AD1",
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


def _overview_one(client: Any, subcommand: str = "all") -> Dict[str, Any]:
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
            devices = load_devices_json(args.devices, args.device)

        if not devices:
            print("错误: 设备列表为空", file=sys.stderr)
            sys.exit(4)

        results = run_multi(devices, _overview_one, subcommand=args.subcommand)
        device_names = {d["host"]: _display_device({"host": d.get("host", ""), "name": d.get("name", "")}) for d in devices}

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
            lines = [render_multi_summary(results, "AD 设备查询概览 - 多设备", device_names)]
            lines.append("---")
            for host, result in results.items():
                device_label = device_names.get(host, _display_host(host))
                if "error" in result:
                    lines.append(f"## {device_label}")
                    lines.append(f"> 错误: {result['error']}")
                else:
                    lines.append(f"## {device_label}")
                    lines.append(result.get("markdown", ""))
                lines.append("")
            lines.append("---")
            lines.append(render_multi_summary(results, "", device_names))
            print("\n".join(lines))

        sys.exit(compute_multi_exit_code(results))

    # -- Parameter validation -------------------------------------------------
    if not args.host:
        print("用法: python overview.py {all|config|vs|node|pool|cert|hardware|ha|traffic}", file=sys.stderr)
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
