#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
多设备巡检报告渲染。

根据巡检分析结果生成多设备摘要 Markdown 报告，避免逐设备展开导致输出过长。

本模块所有函数均为 ad-check-analysis 专用。
"""

import re
from typing import Any, Dict, Optional


def _extract_ip(host: str) -> str:
    """从主机 URL (如 https://192.168.8.30:443) 中提取 IPv4 地址。"""
    import re
    m = re.search(r'(\d+\.\d+\.\d+\.\d+)', host)
    return m.group(1) if m else host


def _format_check_time(raw_time: str) -> str:
    """将 YYYYMMDDHHMMSS 格式化为 YYYY-MM-DD HH:MM:SS。"""
    if raw_time and len(raw_time) >= 14:
        return "{}-{}-{} {}:{}:{}".format(
            raw_time[:4], raw_time[4:6], raw_time[6:8],
            raw_time[8:10], raw_time[10:12], raw_time[12:14],
        )
    return raw_time


def _score_icon(score: int) -> str:
    """根据分数阈值返回绿/黄/红圆形图标。"""
    if score >= 90:
        return "\U0001f7e2"
    elif score >= 70:
        return "\U0001f7e1"
    else:
        return "\U0001f534"


def _risk_display(risk: str) -> str:
    return {"低": "🟢 低", "中": "🟡 中", "高": "🔴 高"}.get(risk, risk)


def _score_display(score: int) -> str:
    return "{} {}/100".format(_score_icon(score), score)


def _table_cell(text: Any) -> str:
    return str(text or "").replace("\n", " ").replace("|", "\\|").strip()


def _check_icon(status: str) -> str:
    """根据 pass/fail/warn 检查状态返回对应图标。"""
    return {"pass": "✅", "fail": "❌", "warn": "⚠️"}.get(status, status)


def _overall_score(analysis: Dict[str, Any]) -> int:
    """Return the same overall score used by the single-device report."""
    health_scores = analysis.get("health_scores", {})
    if isinstance(health_scores, dict) and "overall" in health_scores:
        return int(health_scores.get("overall") or 0)
    return int(analysis.get("summary", {}).get("score", 0) or 0)


def _check_label(key: str, result: Optional[Dict[str, Any]] = None) -> str:
    """Return the Chinese check label carried by check.py analysis."""
    if result:
        return result.get("name") or result.get("check_name") or key
    return key


def _status_label(status: str) -> str:
    return {"pass": "✅ 正常", "fail": "❌ 异常", "warn": "❌ 异常"}.get(status, status)


_CATEGORY_LABELS = {
    "feature": "功能巡检",
    "health": "健康巡检",
    "secure": "安全巡检",
}

_DETAIL_FIELD_LABELS = {
    "admin": "管理员角色",
    "dns_proxy_enabled": "DNS 代理",
    "heartbeat_state": "心跳状态",
    "rs_level_check": "节点级别检查",
    "static_proximity_check": "静态就近性检查",
    "dns64_enabled": "DNS64",
    "newly_added_policy_route": "新增策略路由",
    "snmp_alarm_enabled": "SNMP Trap 告警",
    "dns_pre_rule_exist": "DNS 前置策略",
    "dns_server_enabled": "DNS 服务",
    "email_alarm_enabled": "邮件告警",
    "proxy_policy_check": "代理策略",
    "syslog_enabled": "Syslog",
    "auto_update": "自动更新",
    "max": "最大值",
    "acceleration": "加速卡状态",
    "shm_sem_state": "共享内存/信号量",
    "base_no_core": "Core 文件状态",
    "I350": "I350 网卡",
    "82599": "82599 网卡",
    "security_check_state": "设备安全检查",
    "remote_mt": "远程维护",
    "ssh_authority": "SSH/API 访问控制",
    "base_report_stab": "报表服务状态",
    "algorithm": "不安全算法",
    "protocol": "不安全协议",
    "enable_iplimit": "管理登录 IP 限制",
}

_DETAIL_VALUE_REPLACEMENTS = {
    "true": "是",
    "false": "否",
    "True": "是",
    "False": "否",
    "NORMAL": "正常",
    "normal": "正常",
    "NOT_CLUSTER_MODE": "非集群模式",
    "CLUSTER_UNABLE": "集群不可用",
    "CLUSTER_UNABLE_OR_NOTIN": "未加入集群或集群不可用",
}


def _friendly_detail_value(field: str, raw_value: str) -> str:
    value = raw_value.strip().strip("\"'")
    if value == "":
        return "未配置"
    lower = value.lower()
    if lower in ("true", "false"):
        enabled_word = "已开启" if lower == "true" else "未开启"
        pass_word = "通过" if lower == "true" else "未通过"
        if field.endswith("_enabled") or field in {
            "dns64_enabled", "syslog_enabled", "auto_update", "enable_iplimit", "remote_mt",
        }:
            return enabled_word
        if field.endswith("_state") or field.endswith("_check") or field in {
            "admin", "ssh_authority", "security_check_state", "base_report_stab",
            "shm_sem_state",
        }:
            return pass_word
    return _DETAIL_VALUE_REPLACEMENTS.get(value, value)


def _user_detail(text: Any) -> str:
    detail = str(text or "").replace("\n", " ")

    def repl(match: re.Match[str]) -> str:
        field = match.group(1)
        value = match.group(2)
        label = _DETAIL_FIELD_LABELS.get(field, field.replace("_", " "))
        return "{}：{}".format(label, _friendly_detail_value(field, value))

    detail = re.sub(r"\b([A-Za-z][A-Za-z0-9_]*|82599)=([^\s,|]*)", repl, detail)
    return detail.replace("`ad.json`", "设备巡检报告").replace("ad.json", "设备巡检报告")


def _device_summary_status(result: Dict[str, Any]) -> str:
    """从结果字典中确定设备级状态字符串(含图标)。"""
    if "error" in result:
        err = result["error"]
        if any(kw in err for kw in ("Auth", "401", "认证")):
            return "❌ 认证失败"
        return "❌ 连接失败"
    analysis = result.get("analysis", {})
    summary = analysis.get("summary", {})
    if summary.get("fail", 0) > 0 or summary.get("warn", 0) > 0:
        return "❌ 异常"
    return "✅ 正常"


def _risk_level(min_score: Optional[int], has_failed_device: bool = False) -> str:
    if has_failed_device:
        return "高"
    if min_score is None:
        return "未知"
    if min_score >= 90:
        return "低"
    if min_score >= 70:
        return "中"
    return "高"


def _suggestion_for_check(analysis: Dict[str, Any], check_key: str, check_name: str) -> str:
    for suggestion in analysis.get("suggestions", []) or []:
        if suggestion.get("check") == check_key or suggestion.get("check_name") == check_name:
            return _user_detail(suggestion.get("suggestion", ""))
    return "{} 未达到预期状态，建议结合设备配置页确认业务影响后处理".format(check_name)


def _render_device_detail_block(
    host: str,
    result: Dict[str, Any],
    device_name: str,
) -> str:
    """为多设备报告渲染单个设备的详情块。"""
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

    for cat_key, cat_label in [
        ("feature", "功能巡检"),
        ("health", "健康巡检"),
        ("secure", "安全巡检"),
    ]:
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
            lines.append("| {} | {} | {} |".format(
                _check_label(k, cr),
                _status_label(cr["status"]),
                _user_detail(cr.get("detail") or cr["value"]),
            ))
        lines.append("")

    # If no anomalies at all, show summary line
    all_pass = all(
        check_results.get(k, {}).get("status") == "pass"
        for cat_key in ["feature", "health", "secure"]
        for k in categories.get(cat_key, [])
        if k in check_results
    )
    if all_pass:
        lines.append("> 所有检查项通过，无异常。")
        lines.append("")

    lines.append("#### \U0001f4c8 统计汇总")
    lines.append("")
    lines.append("| 类别 | 检查项数 | 通过 | 异常 | 通过率 |")
    lines.append("|------|----------|------|------|--------|")

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
        lines.append("| {} | {} | {} | {} | {}% |".format(cat_label, t, p, f + w, rate))

    lines.append("")

    lines.append("#### \U0001f4a1 优化建议")
    lines.append("")
    if suggestions:
        lines.append("| 优先级 | 检查项 | 建议 |")
        lines.append("|--------|--------|------|")
        for sug in suggestions:
            lines.append("| {} | {} | {} |".format(
                sug.get("priority", ""), sug.get("check_name") or sug.get("check", ""), sug.get("suggestion", ""),
            ))
    else:
        lines.append("暂无优化建议。")
    lines.append("")

    overall = _overall_score(analysis)
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
    """生成跨设备对比表，列出设备间存在差异的检查项。"""
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

        sample = next(iter(statuses.values())) if statuses else {}
        row = "| {} |".format(_check_label(key, sample))
        notes = []
        for host in valid_hosts:
            s = statuses.get(host, {})
            status = s.get("status", "?")
            value = _user_detail(s.get("value", "?"))
            row += " {}：{} |".format(_status_label(status), value)
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
    """渲染摘要型多设备巡检报告(markdown 格式)。

    多设备场景避免逐台展开检查项，正文只保留：
      - 巡检结论
      - 设备概览
      - 全局共性问题（所有成功巡检设备都异常的检查项）

    Args:
        results: run_multi() 返回的 {host: result_dict, ...}。
                 成功结果包含 {meta, analysis, markdown}；
                 失败结果包含 {error}。
        scene: 巡检场景名称。
        device_names: 可选的 {host: name} 映射，用于显示。

    Returns:
        完整的 markdown 多设备报告字符串。
    """
    device_names = device_names or {}

    devices_info = []
    successful_hosts = []
    anomaly_sets = []
    min_score: Optional[int] = None
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
                "abnormal_count": "-",
                "score_text": "-",
            })
        else:
            analysis = result.get("analysis", {})
            summary = analysis.get("summary", {})
            score = _overall_score(analysis)
            fail_warn = summary.get("fail", 0) + summary.get("warn", 0)
            if min_score is None or score < min_score:
                min_score = score
            successful_hosts.append(host)
            anomaly_keys = {
                key
                for key, check in (analysis.get("check_results", {}) or {}).items()
                if check.get("status") in ("fail", "warn")
            }
            anomaly_sets.append(anomaly_keys)

            devices_info.append({
                "host": host,
                "name": name,
                "ip": ip,
                "has_error": False,
                "status_text": _device_summary_status(result),
                "abnormal_count": str(fail_warn),
                "score_text": _score_display(score),
            })

    total_devices = len(results)
    failed_count = sum(1 for d in devices_info if d["has_error"])
    device_abnormal_count = 0
    for d in devices_info:
        if d["has_error"]:
            device_abnormal_count += 1
            continue
        analysis = results[d["host"]].get("analysis", {})
        summary = analysis.get("summary", {})
        if summary.get("fail", 0) + summary.get("warn", 0):
            device_abnormal_count += 1

    risk = _risk_level(min_score, failed_count > 0)
    if anomaly_sets:
        common_keys = set.intersection(*anomaly_sets) if anomaly_sets else set()
    else:
        common_keys = set()

    common_rows = []
    if common_keys:
        first_success = successful_hosts[0]
        first_analysis = results[first_success].get("analysis", {})
        check_results = first_analysis.get("check_results", {})
        for key in sorted(common_keys, key=lambda item: _check_label(item, check_results.get(item))):
            check = check_results.get(key, {})
            check_name = _check_label(key, check)
            common_rows.append("| {} | {} |".format(
                _table_cell(check_name),
                _table_cell(_suggestion_for_check(first_analysis, key, check_name)),
            ))

    lines = [
        "## 巡检结论",
        "- 目标：全部 AD 设备",
        "- 场景：{}".format(scene),
        "- 设备数量：{} 台".format(total_devices),
        "- 异常设备：{} 台".format(device_abnormal_count),
        "- 总体风险：{}".format(_risk_display(risk)),
        "",
        "## 设备概览",
        "",
        "| 设备 | IP | 状态 | 综合评分 | 异常项 |",
        "| --- | --- | --- | ---: | ---: |",
    ]

    for d in devices_info:
        lines.append("| {} | {} | {} | {} | {} |".format(
            _table_cell(d["name"]), _table_cell(d["ip"]), _table_cell(d["status_text"]),
            _table_cell(d["score_text"]), _table_cell(d["abnormal_count"]),
        ))

    lines.append("")
    lines.append("## 全局共性问题")
    lines.append("")
    if common_rows:
        lines.append("| 问题 | 建议 |")
        lines.append("| --- | --- |")
        lines.extend(common_rows)
    else:
        lines.append("未发现所有设备共同存在的异常项。")

    return "\n".join(lines)

if __name__ == "__main__":
    print("This module is not meant to be run directly.", file=sys.stderr)
