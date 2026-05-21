#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Shared multi-device support for AD skill scripts.

Provides:
    run_multi()          — ThreadPoolExecutor-based parallel execution
    resolve_device_pw()  — password resolution: field > env var > fallback
    render_multi_summary() — multi-device markdown/JSON output helpers
    compute_multi_exit_code() — exit code per design spec (0/1/2/4/7)
    parse_hosts_arg()    — parse --hosts comma-separated string into device list
    load_devices_json()  — load devices.json file
"""

import json
import os
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


def load_devices_json(path: str) -> List[Dict[str, Any]]:
    """Load device list from a JSON file.

    Expected format:
        {"devices": [{"name": "AD1", "host": "https://...", "user": "admin", "password_from": "AD1_PASS"}]}
    """
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("devices", [])


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


# ---------------------------------------------------------------------------
# Multi-device report rendering (rich format per output-multi.md spec)
# ---------------------------------------------------------------------------

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
        return "\U0001f7e2"  # green circle
    elif score >= 70:
        return "\U0001f7e1"  # yellow circle
    else:
        return "\U0001f534"  # red circle


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
    """Render a single device's detail block for the multi-device report.

    Handles both success (has analysis data) and error cases.
    """
    ip = _extract_ip(host)
    heading = "### \U0001f50d {} ({}) 详细报告".format(device_name, ip)

    if "error" in result:
        err = result["error"]
        if any(kw in err for kw in ("Auth", "401", "认证")):
            status_text = "❌ 认证失败"
            hint = "认证凭据无效，请检查用户名和密码配置。"
        else:
            status_text = "❌ 连接失败"
            hint = "无法连接至该设备，请检查网络连通性和设备可达性。"
        return "{}\n\n**状态**: {}\n**错误**: {}\n\n> {}\n".format(heading, status_text, err, hint)

    # Success case
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

    # Device basic info
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

    # Per-category item tables
    for cat_key, cat_label in [
        ("feature", "功能巡检"),
        ("health", "健康巡检"),
        ("secure", "安全巡检"),
    ]:
        keys = categories.get(cat_key, [])
        if not keys:
            continue
        lines.append("#### {} ({} 项)".format(cat_label, len(keys)))
        lines.append("")
        lines.append("| 检查项 | 状态 | 值 |")
        lines.append("|--------|------|-----|")
        for k in keys:
            cr = check_results.get(k)
            if cr:
                lines.append("| {} | {} {} | {} |".format(k, _check_icon(cr["status"]), cr["status"], cr["value"]))
            else:
                lines.append("| {} | - | - |".format(k))
        lines.append("")

    # Statistics summary
    lines.append("#### \U0001f4c8 统计汇总")
    lines.append("")
    lines.append("| 类别 | 检查项数 | ✅ 通过 | ❌ 异常 | ⚠️ 警告 | 通过率 |")
    lines.append("|------|----------|---------|---------|---------|--------|")

    for cat_key, cat_label in [
        ("feature", "功能巡检"),
        ("health", "健康巡检"),
        ("secure", "安全巡检"),
    ]:
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

    # Optimization suggestions
    lines.append("#### \U0001f4a1 优化建议")
    lines.append("")
    if suggestions:
        lines.append("| 优先级 | 检查项 | 建议 |")
        lines.append("|--------|--------|------|")
        for sug in suggestions:
            lines.append("| {} | {} | {} |".format(
                sug.get("priority", ""), sug.get("check", ""), sug.get("suggestion", ""),
            ))
    else:
        lines.append("暂无优化建议。")
    lines.append("")

    # Health score (single row per multi-device spec)
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
    """Generate cross-device comparison table for items with inter-device differences.

    Only includes successfully inspected devices that have analysis data.
    Generates comparison when >=2 devices are connected and >=1 has anomalies.
    """
    valid_hosts = []
    for host, result in results.items():
        if "error" not in result and result.get("analysis"):
            valid_hosts.append(host)

    if len(valid_hosts) < 2:
        return ""

    # Check if any device has anomalies
    has_anomaly = False
    for host in valid_hosts:
        summary = results[host]["analysis"].get("summary", {})
        if summary.get("fail", 0) > 0 or summary.get("warn", 0) > 0:
            has_anomaly = True
            break
    if not has_anomaly:
        return ""

    # Collect all check keys across devices
    all_keys = set()
    for host in valid_hosts:
        all_keys.update(results[host]["analysis"].get("check_results", {}).keys())

    # Find items with cross-device differences
    comparison_rows = []
    for key in sorted(all_keys):
        statuses = {}
        for host in valid_hosts:
            cr = results[host]["analysis"]["check_results"].get(key)
            if cr:
                statuses[host] = cr

        if len(statuses) < 2:
            continue

        # Include if any device has fail/warn, or statuses differ
        unique_statuses = set(s["status"] for s in statuses.values())
        if len(unique_statuses) <= 1 and all(s["status"] == "pass" for s in statuses.values()):
            continue

        # Build row
        row = "| {} |".format(key)
        notes = []
        for host in valid_hosts:
            s = statuses.get(host, {})
            status = s.get("status", "?")
            value = s.get("value", "?")
            row += " {} {} |".format(_check_icon(status), value)
            if status in ("fail", "warn"):
                name = device_names.get(host, _extract_ip(host))
                notes.append("{} {}".format(name, status))
        row += " {} |".format("; ".join(notes) if notes else "-")
        comparison_rows.append(row)

    if not comparison_rows:
        return ""

    # Build header with device names
    header_parts = ["| 检查项 |"]
    for host in valid_hosts:
        name = device_names.get(host, _extract_ip(host))
        header_parts.append(" {} |".format(name))
    header_parts.append(" 说明 |")
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

    # ── Build device info list ──────────────────────────────────────────
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

    # ── Compute time range from successful devices ─────────────────────
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

    # ── Count stats ────────────────────────────────────────────────────
    total_devices = len(results)
    success_count = sum(1 for d in devices_info if not d["has_error"])
    failed_count = total_devices - success_count

    # ── Build report ───────────────────────────────────────────────────
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

    # Summary status line
    if failed_count == 0:
        lines.append("> {} 台设备: {} 台正常, 0 台异常".format(total_devices, success_count))
    elif success_count == 0:
        lines.append("> {} 台设备: 0 台正常, {} 台异常".format(total_devices, failed_count))
    else:
        lines.append("> {} 台设备: {} 台正常, {} 台异常".format(total_devices, success_count, failed_count))

    lines.append("")

    # ── Per-device detail blocks ───────────────────────────────────────
    for i, d in enumerate(devices_info):
        lines.append("---")
        lines.append("")
        result = results[d["host"]]
        detail_block = _render_device_detail_block(d["host"], result, d["name"])
        lines.append(detail_block)

    # ── Cross-device comparison (only when useful) ────────────────────
    cross = _render_cross_device_comparison(results, device_names)
    if cross:
        lines.append("---")
        lines.append("")
        lines.append(cross)

    # ── Footer ─────────────────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("**说明**: 以上结果全部来自各设备巡检报告文件 `ad.json`，严格按照巡检返回数据进行分析。")

    return "\n".join(lines)


def _print_error(msg: str) -> None:
    """Print to stderr with a consistent prefix."""
    print(msg, file=sys.stderr)
