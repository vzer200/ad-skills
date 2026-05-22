#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Multi-device inspection report rendering.

Produces rich markdown reports from check analysis results, including
a device comparison table, abnormal-items table, uncovered summary,
and per-device full reports.
"""

import re
import sys
from typing import Any, Dict, List, Optional


def _extract_ip(host: str) -> str:
    """Extract IPv4 address from a host URL like https://192.168.8.30:443."""
    m = re.search(r'(\d+\.\d+\.\d+\.\d+)', host)
    return m.group(1) if m else host


def _extract_host(host: str) -> str:
    """Extract IP:port display string from a host URL.
    Includes port only when it's non-standard (not 443 for https, not 80 for http).
    """
    m = re.search(r'https?://([^/]+)', host)
    raw = m.group(1) if m else host
    # If already IP:port form (no protocol), return as-is
    # Drop default ports
    if raw.endswith(':443'):
        raw = raw[:-4]
    elif raw.endswith(':80'):
        raw = raw[:-3]
    # If port is present and non-default, keep it
    if ':' in raw:
        return raw
    return _extract_ip(host)


def _format_check_time(raw_time: str) -> str:
    """Format YYYYMMDDHHMMSS to YYYY-MM-DD HH:MM:SS."""
    if raw_time and len(raw_time) >= 14:
        return "{}-{}-{} {}:{}:{}".format(
            raw_time[:4], raw_time[4:6], raw_time[6:8],
            raw_time[8:10], raw_time[10:12], raw_time[12:14],
        )
    return raw_time


def _score_icon(score: int) -> str:
    """Green/yellow/red circle based on score threshold."""
    if score >= 90:
        return "\U0001f7e2"
    elif score >= 70:
        return "\U0001f7e1"
    else:
        return "\U0001f534"


def _check_icon(status: str) -> str:
    """Icon for pass/fail check status."""
    return {"pass": "✅", "fail": "❌"}.get(status, status)


# ---------------------------------------------------------------------------
# Uncovered (both devices missing) summary
# ---------------------------------------------------------------------------

def _render_uncovered_both(results: Dict[str, Any], device_labels: Dict[str, str]) -> str:
    """Build the 'unchecked items' summary — items uncovered on every device."""
    valid_hosts = [h for h, r in results.items() if "error" not in r and r.get("analysis")]
    if not valid_hosts:
        return ""

    # Collect uncovered check_keys from each device
    all_uncovered_sets = []
    for host in valid_hosts:
        uc = results[host]["analysis"].get("uncovered", [])
        all_uncovered_sets.append(set(u["check_key"] for u in uc))

    # Intersection: items uncovered on ALL devices
    common = all_uncovered_sets[0]
    for s in all_uncovered_sets[1:]:
        common = common & s

    if not common:
        return ""

    # Build device list string for the column
    dev_list = ", ".join(device_labels.get(h, _extract_ip(h)) for h in valid_hosts)

    # Build rows from the first device's uncovered data (descriptions are the same)
    first_uc = {u["check_key"]: u for u in results[valid_hosts[0]]["analysis"].get("uncovered", [])}
    rows = []
    for ck in sorted(common):
        info = first_uc.get(ck, {})
        name = info.get("name", ck)
        reasons = info.get("reasons", ["不在本次巡检范围内"])
        reason_str = reasons[0] if reasons else "不在本次巡检范围内"
        rows.append(f"| {name} | {dev_list} | {reason_str} |")

    if not rows:
        return ""

    header = f"### ⚠️ 未检查项（{len(rows)} 项）\n\n"
    header += "以下检查项在所有设备上均未采集到对应数据，不代表设备存在异常。\n\n"
    header += "| 检查项 | 未检查设备 | 原因 |\n|--------|-----------|------|\n"
    return header + "\n".join(rows) + "\n"


# ---------------------------------------------------------------------------
# Abnormal items table (per-device columns)
# ---------------------------------------------------------------------------

def _render_abnormal_table(
    results: Dict[str, Any],
    device_labels: Dict[str, str],
    uncovered_both: set,
) -> str:
    """Build table of items where at least one device has an anomaly.
    Per-device columns show pass/fail/unchecked.
    Skips items that are uncovered on ALL devices (already shown in uncovered section).
    """
    valid_hosts = [h for h, r in results.items() if "error" not in r and r.get("analysis")]
    if not valid_hosts:
        return ""

    # Collect per-device uncovered check_keys
    device_uncovered: Dict[str, set] = {}
    for host in valid_hosts:
        uc = results[host]["analysis"].get("uncovered", [])
        device_uncovered[host] = set(u["check_key"] for u in uc)

    # Collect all check_keys across all devices
    all_keys: set = set()
    for host in valid_hosts:
        all_keys.update(results[host]["analysis"]["check_results"].keys())
        all_keys.update(device_uncovered.get(host, set()))

    # Filter: keep items where at least one device has "fail", and NOT in uncovered_both
    abnormal_keys = set()
    for ck in all_keys:
        if ck in uncovered_both:
            continue
        for host in valid_hosts:
            cr = results[host]["analysis"]["check_results"].get(ck)
            if cr and cr["status"] == "fail":
                abnormal_keys.add(ck)
                break

    if not abnormal_keys:
        return ""

    # Build device label list for header
    dev_labels = [device_labels.get(h, _extract_ip(h)) for h in valid_hosts]
    header_cols = " | ".join(dev_labels)
    header = f"### ❌ 异常项（至少一台设备异常，{len(abnormal_keys)} 项）\n\n"
    header += "全部通过的项目不在此表中展示。\n\n"
    header += f"| 检查项 | 检查详情 | {header_cols} |\n"
    header += f"|--------|---------|{'|'.join(['------'] * len(valid_hosts))}|\n"

    rows = []
    for ck in sorted(abnormal_keys):
        # Get display name and description from first device that has it
        name = ck
        desc = ""
        for host in valid_hosts:
            cr = results[host]["analysis"]["check_results"].get(ck)
            if cr:
                name = cr.get("name", ck)
                desc = cr.get("description", "")
                break
        if not desc:
            # Look in uncovered data
            for host in valid_hosts:
                for u in results[host]["analysis"].get("uncovered", []):
                    if u["check_key"] == ck:
                        name = u.get("name", ck)
                        break

        # Per-device status
        cells = []
        for host in valid_hosts:
            if ck in device_uncovered.get(host, set()):
                cells.append("— 未检查")  # — 未检查
            else:
                cr = results[host]["analysis"]["check_results"].get(ck, {})
                status = cr.get("status", "pass")
                label = "✅ 正常" if status == "pass" else "❌ 异常"
                cells.append(label)
        cells_str = " | ".join(cells)
        rows.append(f"| {name} | {desc} | {cells_str} |")

    return header + "\n".join(rows) + "\n"


# ---------------------------------------------------------------------------
# Suggestions (multi-device)
# ---------------------------------------------------------------------------

def _render_suggestions_multi(
    results: Dict[str, Any],
    device_labels: Dict[str, str],
) -> str:
    """Build suggestions table with anomaly device column."""
    valid_hosts = [h for h, r in results.items() if "error" not in r and r.get("analysis")]

    _CATEGORY_ICON = {"secure": "🛡️ 安全巡检", "health": "❤️ 健康巡检", "feature": "⚙️ 功能巡检"}
    _CATEGORY_ORDER = {"secure": 0, "health": 1, "feature": 2}
    suggestion_map: Dict[str, Dict] = {}
    for host in valid_hosts:
        analysis = results[host]["analysis"]
        dev_name = device_labels.get(host, _extract_ip(host))
        for sug in analysis.get("suggestions", []):
            ck = sug.get("check", "")
            if ck not in suggestion_map:
                suggestion_map[ck] = {
                    "category": sug.get("category", "feature"),
                    "suggestion": sug.get("suggestion", ""),
                    "devices": [],
                }
            suggestion_map[ck]["devices"].append(dev_name)

    if not suggestion_map:
        return "暂无异常项。\n"

    lines = [
        "| 类别 | 检查项 | 异常设备 | 建议 |",
        "|------|--------|---------|------|",
    ]
    sorted_checks = sorted(suggestion_map.keys(), key=lambda ck: _CATEGORY_ORDER.get(suggestion_map[ck]["category"], 99))
    for ck in sorted_checks:
        info = suggestion_map[ck]
        cr = results[valid_hosts[0]]["analysis"]["check_results"].get(ck, {})
        check_name = cr.get("name", ck)
        dev_list = ", ".join(info["devices"])
        cat_icon = _CATEGORY_ICON.get(info["category"], info["category"])
        lines.append(f"| {cat_icon} | {check_name} | {dev_list} | {info['suggestion']} |")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def render_multi_device_report(
    results: Dict[str, Any],
    scene: str = "标准巡检",
    device_names: Optional[Dict[str, str]] = None,
) -> str:
    """Render a rich multi-device inspection report in markdown.

    Produces:
      1. Device comparison table
      2. Unchecked items (all devices)
      3. Abnormal items table (per-device columns, all-pass items hidden)
      4. Suggestions
      5. Per-device full reports
    """
    device_names = device_names or {}
    valid_hosts = [h for h, r in results.items() if "error" not in r and r.get("analysis")]
    error_hosts = [h for h, r in results.items() if "error" in r]

    # ── Device labels ──────────────────────────────────────────────────
    device_labels: Dict[str, str] = {}
    for host in list(results.keys()):
        name = device_names.get(host)
        if name:
            device_labels[host] = name  # e.g., "AD1 (21039)"
        else:
            device_labels[host] = _extract_host(host)  # e.g., "192.168.8.30:21039"

    # ── Device comparison table ────────────────────────────────────────
    devices_info = []
    for host, result in results.items():
        ip = _extract_ip(host)
        label = device_labels[host]
        if "error" in result:
            devices_info.append({
                "label": label, "ip": ip, "has_error": True,
                "checked": "-", "pass_count": "-", "fail_count": "-",
                "unchecked": "-", "score_text": "-",
            })
        else:
            analysis = result.get("analysis", {})
            summary = analysis.get("summary", {})
            total = summary.get("total", 0)
            total_expected = summary.get("total_expected", total)
            pass_count = summary.get("pass", 0)
            fail_count = summary.get("fail", 0)
            uc_count = len(analysis.get("uncovered", []))
            checked_str = f"{total}/{total_expected}"
            score = summary.get("score", 0)
            devices_info.append({
                "label": label, "ip": ip, "has_error": False,
                "checked": checked_str,
                "pass_count": str(pass_count),
                "fail_count": str(fail_count),
                "unchecked": str(uc_count),
                "score_text": f"{_score_icon(score)} {score}/100" if total else "-",
            })

    # Time range
    times = []
    for host, result in results.items():
        if "error" not in result:
            t = result.get("meta", {}).get("start_time", "")
            formatted = _format_check_time(t)
            if formatted:
                times.append(formatted)
    times.sort()
    if len(times) >= 2:
        time_range = f"{times[0]} ~ {times[-1]}"
    elif len(times) == 1:
        time_range = times[0]
    else:
        time_range = "N/A"

    total_devices = len(results)
    anomaly_devices = sum(
        1 for d in devices_info
        if not d["has_error"] and int(d["fail_count"]) > 0
    )

    # ── Header ─────────────────────────────────────────────────────────
    lines = [
        "## AD 巡检分析报告（多设备）",
        "",
        f"**巡检场景**: {scene}",
        f"**巡检时间**: {time_range}",
        f"**设备数量**: {total_devices} 台",
        "",
        "---",
        "",
        "### \U0001f4ca 设备对比",
        "",
        "| 设备 | 检查项 | 通过 | 异常 | 未检查 | 健康评分 |",
        "|------|--------|------|------|--------|---------|",
    ]

    for d in devices_info:
        lines.append(
            f"| {d['label']} | {d['checked']} | {d['pass_count']} | "
            f"{d['fail_count']} | {d['unchecked']} | {d['score_text']} |"
        )
    lines.append("")

    if anomaly_devices == 0:
        lines.append(f"> {total_devices} 台设备: 无异常项")
    else:
        lines.append(f"> {total_devices} 台设备: {anomaly_devices} 台存在异常项")
    lines.append("")

    # ── Uncovered items (both devices) ─────────────────────────────────
    uncovered_both = set()
    if len(valid_hosts) >= 1:
        all_uc_sets = []
        for host in valid_hosts:
            uc = results[host]["analysis"].get("uncovered", [])
            all_uc_sets.append(set(u["check_key"] for u in uc))
        uncovered_both = all_uc_sets[0]
        for s in all_uc_sets[1:]:
            uncovered_both = uncovered_both & s

    uncovered_section = _render_uncovered_both(results, device_labels)
    if uncovered_section:
        lines.append("---")
        lines.append("")
        lines.append(uncovered_section)

    # ── Abnormal items table ───────────────────────────────────────────
    abnormal_section = _render_abnormal_table(results, device_labels, uncovered_both)
    if abnormal_section:
        lines.append("---")
        lines.append("")
        lines.append(abnormal_section)

    # ── Suggestions ────────────────────────────────────────────────────
    suggestions = _render_suggestions_multi(results, device_labels)
    lines.append("---")
    lines.append("")
    lines.append("### \U0001f4a1 排查建议")
    lines.append("")
    lines.append("以下检查项在本次巡检中状态为异常，建议按指引逐一排查：")
    lines.append("")
    lines.append(suggestions)

    lines.append("---")
    lines.append("")
    lines.append("**说明**: 以上结果全部来自各设备巡检报告文件 `ad.json`。")

    return "\n".join(lines)


if __name__ == "__main__":
    print("This module is not meant to be run directly.", file=sys.stderr)
