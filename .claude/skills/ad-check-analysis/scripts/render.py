#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Multi-device inspection report rendering.

Produces rich markdown reports from check analysis results, including
per-device detail blocks, cross-device comparison, and summary tables.

All functions in this module are specific to ad-check-analysis.
"""

import sys
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
    """Icon for pass/fail/warn check status."""
    return {"pass": "✅", "fail": "❌", "warn": "⚠️"}.get(status, status)


_CATEGORY_LABELS = {
    "feature": "功能巡检",
    "health": "健康巡检",
    "secure": "安全巡检",
}


def _device_summary_status(result: Dict[str, Any]) -> str:
    """Determine device-level status string (with icon) from a result dict."""
    if "error" in result:
        err = result["error"]
        if any(kw in err for kw in ("Auth", "401", "认证")):
            return "❌ 认证失败"
        return "❌ 连接失败"
    analysis = result.get("analysis", {})
    summary = analysis.get("summary", {})
    if summary.get("fail", 0) > 0 or summary.get("warn", 0) > 0:
        return "⚠️ 异常"
    return "✅ 正常"


def _render_device_detail_block(
    host: str,
    result: Dict[str, Any],
    device_name: str,
) -> str:
    """Render a single device's detail block for the multi-device report."""
    ip = _extract_ip(host)
    heading = "### \U0001f50d {} ({}) 详细报告".format(device_name, ip)

    analysis = result.get("analysis", {})
    if not analysis:
        return "{}\n\n> 无分析数据\n".format(heading)

    meta = result.get("meta", {})
    dev = analysis.get("device_info", {})
    check_results = analysis.get("check_results", {})
    categories = analysis.get("categories", {})
    suggestions = analysis.get("suggestions", [])
    health_scores = analysis.get("health_scores", {})

    raw_time = meta.get("start_time", "")
    check_time = _format_check_time(raw_time)

    lines = [heading, ""]
    if check_time:
        lines.append("**巡检时间**: {}".format(check_time))
        lines.append("")

    lines.append("#### \U0001f4ca 设备基本信息")
    lines.append("")
    lines.append("| 项目 | 值 |")
    lines.append("|------|-----|")
    lines.append("| AD 版本 | {} |".format(dev.get("version", "-")))
    lines.append("| APP 版本 | {} |".format(dev.get("app_version", "-")))
    lines.append("| 网关 ID | {} |".format(dev.get("gateway_id", "-")))
    lines.append("| 运行时间 | {} |".format(dev.get("runtime", "-")))
    lines.append("| 管理 IP | {} |".format(dev.get("ip", ip)))
    lines.append("")

    for cat_key, cat_label in _CATEGORY_LABELS.items():
        keys = categories.get(cat_key, [])
        if not keys:
            continue
        # Only show abnormal items, skip all-pass categories
        abnormal = []
        for k in keys:
            cr = check_results.get(k)
            if cr and cr["status"] in ("fail", "warn"):
                abnormal.append((k, cr))
        if not abnormal:
            continue
        lines.append("#### {} ({} 项异常)".format(cat_label, len(abnormal)))
        lines.append("")
        lines.append("| 检查项 | 状态 | 值 |")
        lines.append("|--------|------|-----|")
        for k, cr in abnormal:
            lines.append("| {} | {} {} | {} |".format(cr.get('name', k), _check_icon(cr["status"]), cr["status"], cr.get("detail") or cr["value"]))
        lines.append("")

    # If no anomalies at all, show summary line
    all_pass = all(
        check_results.get(k, {}).get("status") == "pass"
        for cat_key in _CATEGORY_LABELS
        for k in categories.get(cat_key, [])
    )
    if all_pass:
        lines.append("> 所有检查项通过，无异常。")
        lines.append("")

    lines.append("#### \U0001f4c8 统计汇总")
    lines.append("")
    lines.append("| 类别 | 检查项数 | ✅ 通过 | ❌ 异常 | ⚠️ 警告 | 通过率 |")
    lines.append("|------|----------|---------|---------|---------|--------|")

    for cat_key, cat_label in _CATEGORY_LABELS.items():
        keys = categories.get(cat_key, [])
        if not keys:
            continue
        p = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "pass")
        f = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "fail")
        w = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "warn")
        t = p + f + w
        rate = round(p / max(t, 1) * 100)
        lines.append("| {} | {} | {} | {} | {} | {}% |".format(cat_label, t, p, f, w, rate))

    lines.append("")

    lines.append("#### \U0001f4a1 优化建议")
    lines.append("")
    if suggestions:
        lines.append("| 优先级 | 检查项 | 建议 |")
        lines.append("|--------|--------|------|")
        for sug in suggestions:
            check_key = sug.get("check", "")
            check_name = check_results.get(check_key, {}).get("name", check_key) if check_key else "-"
            lines.append("| {} | {} | {} |".format(
                sug.get("priority", ""), check_name, sug.get("suggestion", ""),
            ))
    else:
        lines.append("暂无优化建议。")
    lines.append("")

    overall = health_scores.get("overall", analysis.get("summary", {}).get("score", 0))
    lines.append("#### ✅ 健康评分")
    lines.append("")
    lines.append("| 项目 | 评分 |")
    lines.append("|------|------|")
    lines.append("| **综合评分** | {} **{}/100** |".format(_score_icon(overall), overall))
    lines.append("")

    return "\n".join(lines)


def _render_cross_device_comparison(
    results: Dict[str, Any],
    device_names: Dict[str, str],
) -> str:
    """Generate cross-device comparison table for items with inter-device differences."""
    valid_hosts = []
    for host, result in results.items():
        if "error" not in result and result.get("analysis"):
            valid_hosts.append(host)

    if len(valid_hosts) < 2:
        return ""

    has_anomaly = False
    for host in valid_hosts:
        summary = results[host]["analysis"].get("summary", {})
        if summary.get("fail", 0) > 0 or summary.get("warn", 0) > 0:
            has_anomaly = True
            break
    if not has_anomaly:
        return ""

    all_keys = set()
    for host in valid_hosts:
        all_keys.update(results[host]["analysis"].get("check_results", {}).keys())

    comparison_rows = []
    for key in sorted(all_keys):
        statuses = {}
        for host in valid_hosts:
            cr = results[host]["analysis"]["check_results"].get(key)
            if cr:
                statuses[host] = cr

        if len(statuses) < 2:
            continue

        unique_statuses = set(s["status"] for s in statuses.values())
        if len(unique_statuses) <= 1 and all(s["status"] == "pass" for s in statuses.values()):
            continue

        # Sample display name from first available host's check_result
        display_name = key
        for host in valid_hosts:
            cr = results[host]["analysis"]["check_results"].get(key)
            if cr and cr.get("name"):
                display_name = cr["name"]
                break
        row = "| {} |".format(display_name)
        notes = []
        for host in valid_hosts:
            s = statuses.get(host, {})
            status = s.get("status", "?")
            value = s.get("value", "?")
            row += " {} {} |".format(_check_icon(status), value)
            if status in ("fail", "warn"):
                notes.append(_extract_ip(host))
        row += " {} |".format(", ".join(notes) if notes else "-")
        comparison_rows.append(row)

    if not comparison_rows:
        return ""

    header_parts = ["| 检查项 |"]
    for host in valid_hosts:
        name = device_names.get(host, _extract_ip(host))
        header_parts.append(" {} |".format(name))
    header_parts.append(" 未通过设备 |")
    header = "".join(header_parts)

    sep_cols = ["--------"] * (len(valid_hosts) + 2)
    separator = "|" + "|".join(sep_cols) + "|"

    lines = [
        "### \U0001f4c8 跨设备对比",
        "",
        "以下检查项在多台设备间存在显著差异：",
        "",
        header,
        separator,
    ]
    lines.extend(comparison_rows)
    lines.append("")

    return "\n".join(lines)


def render_multi_device_report(
    results: Dict[str, Any],
    scene: str = "标准巡检",
    device_names: Optional[Dict[str, str]] = None,
) -> str:
    """Render a rich multi-device inspection report in markdown.

    Produces the full output format defined in
    ad-check-analysis/examples/output-multi.md, including:
      - Header with scene / time range / device count
      - 6-column summary table
      - Per-device detail blocks (category-grouped items, stats, suggestions)
      - Cross-device comparison (when >=2 devices connected and >=1 has anomalies)
      - Error blocks for failed devices

    Args:
        results: {host: result_dict, ...} from run_multi().
                 Success results carry {meta, analysis, markdown};
                 error results carry {error}.
        scene: inspection scene name.
        device_names: optional {host: name} mapping for display.

    Returns:
        Markdown string with the full multi-device report.
    """
    device_names = device_names or {}

    devices_info = []
    for host, result in results.items():
        ip = _extract_ip(host)
        name = device_names.get(host, ip)

        if "error" in result:
            devices_info.append({
                "host": host,
                "name": name,
                "ip": ip,
                "has_error": True,
                "status_text": _device_summary_status(result),
                "error": result["error"],
                "total_checks": "-",
                "pass_rate": "-",
                "score_text": "-",
            })
        else:
            analysis = result.get("analysis", {})
            summary = analysis.get("summary", {})
            total = summary.get("total", 0)
            pass_count = summary.get("pass", 0)
            score = summary.get("score", 0)
            rate = round(pass_count / max(total, 1) * 100) if total else 0

            devices_info.append({
                "host": host,
                "name": name,
                "ip": ip,
                "has_error": False,
                "status_text": _device_summary_status(result),
                "total_checks": str(total) if total else "-",
                "pass_rate": "{}%".format(rate) if total else "-",
                "score_text": "{} {}/100".format(_score_icon(score), score) if total else "-",
            })

    times = []
    for host, result in results.items():
        if "error" not in result:
            meta = result.get("meta", {})
            t = meta.get("start_time", "")
            formatted = _format_check_time(t)
            if formatted:
                times.append(formatted)
    times.sort()
    if len(times) >= 2:
        time_range = "{} ~ {}".format(times[0], times[-1])
    elif len(times) == 1:
        time_range = times[0]
    else:
        time_range = "N/A"

    total_devices = len(results)
    success_count = sum(1 for d in devices_info if not d["has_error"])
    failed_count = total_devices - success_count

    lines = [
        "## AD 巡检分析报告（多设备）",
        "",
        "**巡检场景**: {}".format(scene),
        "**巡检时间**: {}".format(time_range),
        "**设备数量**: {} 台".format(total_devices),
        "",
        "---",
        "",
        "### \U0001f4ca 设备汇总",
        "",
        "| 设备 | IP | 状态 | 检查项 | 通过率 | 综合评分 |",
        "|------|-----|------|--------|--------|----------|",
    ]

    for d in devices_info:
        lines.append("| {} | {} | {} | {} | {} | {} |".format(
            d["name"], d["ip"], d["status_text"],
            d["total_checks"], d["pass_rate"], d["score_text"],
        ))

    lines.append("")

    if failed_count == 0:
        lines.append("> {} 台设备: {} 台正常, 0 台异常".format(total_devices, success_count))
    elif success_count == 0:
        lines.append("> {} 台设备: 0 台正常, {} 台异常".format(total_devices, failed_count))
    else:
        lines.append("> {} 台设备: {} 台正常, {} 台异常".format(total_devices, success_count, failed_count))

    lines.append("")

    for i, d in enumerate(devices_info):
        if d["has_error"]:
            continue  # Connection/auth failures are reported by ad-connect, not in this report
        lines.append("---")
        lines.append("")
        result = results[d["host"]]
        detail_block = _render_device_detail_block(d["host"], result, d["name"])
        lines.append(detail_block)

    cross = _render_cross_device_comparison(results, device_names)
    if cross:
        lines.append("---")
        lines.append("")
        lines.append(cross)

    lines.append("---")
    lines.append("")
    lines.append("**说明**: 以上结果全部来自各设备巡检报告文件 `ad.json`。")

    return "\n".join(lines)

if __name__ == "__main__":
    print("This module is not meant to be run directly.", file=sys.stderr)
