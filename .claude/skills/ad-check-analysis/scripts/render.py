#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Multi-device inspection report rendering.

Produces rich markdown reports from check analysis results, including
a unified check-items table, per-device summary, and health scores.
"""

from typing import Any, Dict, Optional


def _extract_ip(host: str) -> str:
    """Extract IPv4 address from a host URL like https://192.168.8.30:443."""
    import re
    m = re.search(r'(\d+\.\d+\.\d+\.\d+)', host)
    return m.group(1) if m else host


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


_CATEGORY_LABELS = {
    "feature": "功能巡检",
    "health": "健康巡检",
    "secure": "安全巡检",
}


def _device_summary_status(result: Dict[str, Any]) -> str:
    """Determine device-level status string (with icon)."""
    if "error" in result:
        err = result["error"]
        if any(kw in err for kw in ("Auth", "401", "认证")):
            return "❌ 认证失败"
        return "❌ 连接失败"
    analysis = result.get("analysis", {})
    summary = analysis.get("summary", {})
    if summary.get("fail", 0) > 0:
        return "❌ 异常"
    return "✅ 正常"


def _render_unified_check_table(
    results: Dict[str, Any],
    device_names: Dict[str, str],
) -> str:
    """Build the unified all-items check table: | 检查项 | 检查详情 | 异常设备 |."""
    valid_hosts = [h for h, r in results.items() if "error" not in r and r.get("analysis")]

    if not valid_hosts:
        return ""

    # Collect all check keys from the first valid device (all devices share same key set)
    all_keys = list(results[valid_hosts[0]]["analysis"].get("check_results", {}).keys())
    if not all_keys:
        return ""

    lines = [
        "| 检查项 | 检查详情 | 异常设备 |",
        "|--------|---------|---------|",
    ]

    for key in all_keys:
        # Gather info from all devices
        display_name = key
        description = ""
        failed_devices = []

        for host in valid_hosts:
            cr = results[host]["analysis"]["check_results"].get(key)
            if not cr:
                continue
            if cr.get("name"):
                display_name = cr["name"]
            if cr.get("description") and not description:
                description = cr["description"]
            if cr["status"] == "fail":
                dev_name = device_names.get(host, _extract_ip(host))
                failed_devices.append(dev_name)

        abnormal = ", ".join(failed_devices) if failed_devices else "全部通过"
        lines.append(f"| {display_name} | {description} | {abnormal} |")

    return "\n".join(lines)


def _render_suggestions_multi(
    results: Dict[str, Any],
    device_names: Dict[str, str],
) -> str:
    """Build suggestions table with anomaly device column."""
    valid_hosts = [h for h, r in results.items() if "error" not in r and r.get("analysis")]

    # Collect all suggestions keyed by check_key with device info
    suggestion_map: Dict[str, Dict] = {}
    for host in valid_hosts:
        analysis = results[host]["analysis"]
        dev_name = device_names.get(host, _extract_ip(host))
        for sug in analysis.get("suggestions", []):
            ck = sug.get("check", "")
            if ck not in suggestion_map:
                suggestion_map[ck] = {"priority": sug.get("priority", "高"), "suggestion": sug.get("suggestion", ""), "devices": []}
            suggestion_map[ck]["devices"].append(dev_name)

    if not suggestion_map:
        return "暂无优化建议。\n"

    lines = [
        "| 优先级 | 检查项 | 异常设备 | 建议 |",
        "|--------|--------|---------|------|",
    ]
    for ck, info in suggestion_map.items():
        cr = results[valid_hosts[0]]["analysis"]["check_results"].get(ck, {})
        check_name = cr.get("name", ck)
        dev_list = ", ".join(info["devices"])
        lines.append(f"| {info['priority']} | {check_name} | {dev_list} | {info['suggestion']} |")

    return "\n".join(lines)


def render_multi_device_report(
    results: Dict[str, Any],
    scene: str = "标准巡检",
    device_names: Optional[Dict[str, str]] = None,
) -> str:
    """Render a rich multi-device inspection report in markdown.

    Produces:
      - Header with scene / time range / device count
      - Device summary table (quick overview)
      - Unified check-items table (all items, anomaly-device column)
      - Per-device statistics summary
      - Suggestions (with anomaly device column)
      - Health scores per device
    """
    device_names = device_names or {}

    # ── Device summary table ──────────────────────────────────────────
    devices_info = []
    for host, result in results.items():
        ip = _extract_ip(host)
        name = device_names.get(host, ip)
        if "error" in result:
            devices_info.append({
                "host": host, "name": name, "ip": ip,
                "has_anomaly": True, "status_text": _device_summary_status(result),
                "total_checks": "-", "pass_rate": "-", "score_text": "-",
            })
        else:
            analysis = result.get("analysis", {})
            summary = analysis.get("summary", {})
            total = summary.get("total", 0)
            fail_count = summary.get("fail", 0)
            pass_count = summary.get("pass", 0)
            score = summary.get("score", 0)
            rate = round(pass_count / max(total, 1) * 100) if total else 0
            devices_info.append({
                "host": host, "name": name, "ip": ip,
                "has_anomaly": fail_count > 0, "status_text": _device_summary_status(result),
                "total_checks": str(total) if total else "-",
                "pass_rate": f"{rate}%" if total else "-",
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
    success_count = sum(1 for d in devices_info if not d["has_anomaly"])
    failed_count = total_devices - success_count

    valid_hosts = [h for h, r in results.items() if "error" not in r and r.get("analysis")]

    # ── Header ────────────────────────────────────────────────────────
    lines = [
        "## AD 巡检分析报告（多设备）",
        "",
        f"**巡检场景**: {scene}",
        f"**巡检时间**: {time_range}",
        f"**设备数量**: {total_devices} 台",
        "",
        "---",
        "",
        "### 📊 设备汇总",
        "",
        "| 设备 | IP | 状态 | 检查项 | 通过率 | 综合评分 |",
        "|------|-----|------|--------|--------|----------|",
    ]

    for d in devices_info:
        lines.append(f"| {d['name']} | {d['ip']} | {d['status_text']} | {d['total_checks']} | {d['pass_rate']} | {d['score_text']} |")
    lines.append("")

    if failed_count == 0:
        lines.append(f"> {total_devices} 台设备: {success_count} 台正常, 0 台异常")
    elif success_count == 0:
        lines.append(f"> {total_devices} 台设备: 0 台正常, {failed_count} 台异常")
    else:
        lines.append(f"> {total_devices} 台设备: {success_count} 台正常, {failed_count} 台异常")
    lines.append("")

    # ── Unified check table ───────────────────────────────────────────
    check_table = _render_unified_check_table(results, device_names)
    if check_table:
        lines.append("---")
        lines.append("")
        lines.append("### 🔍 巡检结果详情")
        lines.append("")
        lines.append(check_table)
        lines.append("")

    # ── Statistics summary (per-device × category) ────────────────────
    if valid_hosts:
        lines.append("---")
        lines.append("")
        lines.append("### 📈 统计汇总")
        lines.append("")

        # Build header row with category names
        cat_keys = list(_CATEGORY_LABELS.keys())
        header_cols = " | ".join([_CATEGORY_LABELS[k] for k in cat_keys])
        lines.append(f"| 设备 | {header_cols} | 综合通过率 |")
        sep = "|".join(["------"] * (len(cat_keys) + 2))
        lines.append(f"|{sep}|")

        for host in valid_hosts:
            analysis = results[host]["analysis"]
            dev_name = device_names.get(host, _extract_ip(host))
            categories = analysis.get("categories", {})
            total_pass = 0
            total_items = 0
            cat_stats = []
            for ck in cat_keys:
                keys = categories.get(ck, [])
                if not keys:
                    cat_stats.append("-")
                    continue
                check_results = analysis.get("check_results", {})
                p = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "pass")
                t = len(keys)
                total_pass += p
                total_items += t
                cat_stats.append(f"{p}/{t} ({round(p / max(t, 1) * 100)}%)")
            overall_rate = round(total_pass / max(total_items, 1) * 100)
            cols = " | ".join(cat_stats)
            lines.append(f"| {dev_name} | {cols} | {overall_rate}% |")
        lines.append("")

    # ── Suggestions ───────────────────────────────────────────────────
    suggestions = _render_suggestions_multi(results, device_names)
    lines.append("---")
    lines.append("")
    lines.append("### 💡 优化建议")
    lines.append("")
    lines.append(suggestions)

    # ── Health scores per device ──────────────────────────────────────
    if valid_hosts:
        lines.append("---")
        lines.append("")
        lines.append("### ✅ 健康评分")
        lines.append("")
        lines.append("| 设备 | 系统稳定性 | 硬件健康 | 安全配置 | 综合评分 |")
        lines.append("|------|----------|---------|---------|---------|")

        for host in valid_hosts:
            analysis = results[host]["analysis"]
            dev_name = device_names.get(host, _extract_ip(host))
            hs = analysis.get("health_scores", {})
            f_s = hs.get("feature", {}).get("score", 0)
            h_s = hs.get("health", {}).get("score", 0)
            s_s = hs.get("secure", {}).get("score", 0)
            overall = hs.get("overall", analysis.get("summary", {}).get("score", 0))
            lines.append(
                f"| {dev_name} | {_score_icon(f_s)} {f_s}/100 | {_score_icon(h_s)} {h_s}/100 | "
                f"{_score_icon(s_s)} {s_s}/100 | {_score_icon(overall)} **{overall}/100** |"
            )
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("**说明**: 以上结果全部来自各设备巡检报告文件 `ad.json`。")

    return "\n".join(lines)


if __name__ == "__main__":
    print("This module is not meant to be run directly.", file=sys.stderr)
