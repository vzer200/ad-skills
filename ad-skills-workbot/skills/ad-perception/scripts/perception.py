#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AD 设备感知分析 CLI
分析流量异常(3σ)、设备状态(阈值)、地址冲突(IP:Port重叠)、日志关联。
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
    from ad_api import ADClient, ADAuthError
except ImportError as e:
    print(f"错误: 无法导入 ad_api: {e}", file=sys.stderr)
    sys.exit(9)
from db_schema import VS_SAMPLES_DDL, COLUMNS
from multi_device import (
    run_multi, parse_hosts_arg, load_devices_json,
    render_multi_summary,
)

import argparse
import html as html_lib
import json
import math
import statistics
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import urlparse


STATE_TREND_OPTIONS = {
    "last-hour": {"label": "最近 1 小时"},
    "last-day": {"label": "最近 24 小时"},
    "last-month": {"label": "最近 1 个月"},
}

TRAFFIC_TREND_OPTIONS = STATE_TREND_OPTIONS

STATE_TREND_METRICS = [
    {"api": "cpu_usage", "metric": "cpu", "label": "CPU"},
    {"api": "memory_usage", "metric": "memory", "label": "内存"},
    {"api": "connection_rate", "metric": "connection_rate", "label": "新建速率"},
]

TOTAL_CPU_KEYS = {"TotalCpu", "total_cpu", "totalcpu"}


def detect_anomaly_3sigma(points: List[Dict[str, Any]], window_seconds: int = 21600, z_threshold: int = 3, min_window: int = 30) -> List[Dict[str, Any]]:
    """
    对排序后的时间序列运行 3σ 异常检测。

    Args:
        points: 包含 'ts' (int) 和 'value' (float) 的字典列表，按 ts 升序排列
        window_seconds: 回溯窗口(秒)，默认 6h
        z_threshold: z-score 阈值，默认 3
        min_window: 窗口内统计所需的最小有效点数

    Returns:
        异常字典列表: {ts, value, baseline_mean, z, direction}
    """
    anomalies = []
    cleaned = [(p['ts'], p['value']) for p in points if math.isfinite(p.get('value', 0))]
    if len(cleaned) == 0:
        return anomalies

    # Check if all values are zero
    if all(v == 0 for _, v in cleaned):
        return anomalies

    for i, (ts, value) in enumerate(cleaned):
        # Find points within window before this point
        window_ts = ts - window_seconds
        window = [v for j, (t, v) in enumerate(cleaned) if j < i and t >= window_ts and math.isfinite(v)]

        if len(window) < min_window:
            continue

        mean = statistics.mean(window)
        std = statistics.stdev(window)
        if std == 0:
            continue

        z = abs(value - mean) / std
        if z > z_threshold and abs(value - mean) / max(mean, 1e-6) > 0.05:
            direction = "上升" if value > mean else "下降"
            anomalies.append({
                'ts': ts,
                'value': value,
                'baseline_mean': mean,
                'z': z,
                'direction': direction,
            })

    return anomalies


def query_traffic_db(db_path: str, vs_name: Optional[str] = None, days: int = 7) -> Optional[List[Dict[str, Any]]]:
    """
    从 SQLite 查询流量数据。

    Args:
        db_path: SQLite 数据库路径
        vs_name: 可选的 VS 名称过滤
        days: 回溯天数，默认 7

    Returns:
        字典列表 [{'ts': int, 'vs_name': str, 'metric': str, 'value': float}, ...]
        如果 db_path 不存在或出错则返回 None
    """
    if not db_path or not os.path.isfile(db_path):
        return None
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cutoff = int(datetime.now().timestamp()) - days * 86400
        if vs_name:
            cursor.execute(
                "SELECT ts, vs_name, metric, value FROM vs_samples WHERE ts > ? AND vs_name = ? ORDER BY ts",
                (cutoff, vs_name)
            )
        else:
            cursor.execute(
                "SELECT ts, vs_name, metric, value FROM vs_samples WHERE ts > ? ORDER BY ts",
                (cutoff,)
            )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows
    except Exception:
        return None


def _analyze_traffic_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group SQLite rows and run 3σ analysis."""
    groups: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
    for row in rows:
        key = (row['vs_name'], row['metric'])
        groups.setdefault(key, []).append(row)
    return _run_3sigma_on_vs_group(groups)


def query_device_state_db(db_path: str, metric: Optional[str] = None, days: int = 7) -> Optional[List[Dict[str, Any]]]:
    """
    从 SQLite 查询设备状态数据。

    Args:
        db_path: SQLite 数据库路径
        metric: 可选的指标过滤
        days: 回溯天数，默认 7

    Returns:
        字典列表 [{'ts': int, 'metric': str, 'value': float}, ...]
        如果 db_path 不存在或出错则返回 None
    """
    if not db_path or not os.path.isfile(db_path):
        return None
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cutoff = int(datetime.now().timestamp()) - days * 86400
        if metric:
            cursor.execute(
                "SELECT ts, metric, value FROM device_state WHERE ts > ? AND metric = ? ORDER BY ts",
                (cutoff, metric)
            )
        else:
            cursor.execute(
                "SELECT ts, metric, value FROM device_state WHERE ts > ? ORDER BY ts",
                (cutoff,)
            )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows
    except Exception:
        return None


def _run_3sigma_on_vs_group(points_by_vs_metric: Dict[Tuple[str, str], List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    按 (VS, 指标) 分组运行 3σ 分析。

    Args:
        points_by_vs_metric: 以 (vs_name, metric) 为键、点字典列表为值的字典

    Returns:
        异常字典列表
    """
    anomalies = []
    for (vs_name, metric), points in points_by_vs_metric.items():
        pts = [{'ts': p['ts'], 'value': p['value']} for p in points]
        pts.sort(key=lambda x: x['ts'])
        detected = detect_anomaly_3sigma(pts)
        for a in detected:
            a['vs'] = vs_name
            a['metric'] = metric
            anomalies.append(a)
    return anomalies


def _fetch_vs_names(client: Any) -> List[str]:
    """从设备获取所有 VS 名称。"""
    try:
        data = client.get_virtual_services()
        return [item.get('name', '') for item in data.get('items', []) if item.get('name')]
    except Exception:
        return []


def _fetch_trend_raw(
    client: Any,
    vs_name: str,
    trend: str = "last-hour",
    from_time: str = "",
    to_time: str = "",
) -> Optional[Dict[str, Any]]:
    """获取指定 VS 和趋势周期的原始趋势数据。"""
    try:
        kwargs: Dict[str, Any] = {"trend": trend}
        if from_time:
            kwargs["from_time"] = from_time
        if to_time:
            kwargs["to_time"] = to_time
        data = client.get_vs_trend_by_name(vs_name, **kwargs)
        return data
    except Exception:
        return None


def _build_metric_tables_from_trend(trends_by_vs: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    根据 API 原始趋势数据构建指标汇总表。
    仅包含 max/mean >= 2 的指标。
    """
    result = []
    for vs_name, trends in trends_by_vs.items():
        for trend_period, data in trends.items():
            if data is None:
                continue
            items = data.get('items', []) if isinstance(data, dict) else []
            for item in items:
                name = item.get('name', '')
                vals = _extract_metric_values(item)
                if vals:
                    mean_val = statistics.mean(vals) if vals else 0
                    max_val = max(vals) if vals else 0
                    if max_val >= 2 or mean_val >= 2:
                        result.append({
                            'vs': vs_name,
                            'metric': name,
                            'trend': trend_period,
                            'mean': mean_val,
                            'max': max_val,
                        })
    return result


def _summarize_vs_metric_trend(
    vs_name: str,
    item: Dict[str, Any],
    data: Dict[str, Any],
    from_ts: Optional[int] = None,
    to_ts: Optional[int] = None,
) -> Dict[str, Any]:
    metric_name = str(item.get("name") or item.get("metric") or "")
    values = item.get("values", [])
    if not isinstance(values, list):
        values = []
    points = _build_points_from_trend(values, data.get("start_time"), data.get("step_time"))
    points = _filter_points_by_time(points, from_ts=from_ts, to_ts=to_ts)
    filtered_values = [
        float(point["value"])
        for point in points
        if isinstance(point.get("value"), (int, float))
    ]
    summary: Dict[str, Any] = {
        "vs": vs_name,
        "metric": metric_name,
        "label": f"{vs_name} / {_metric_label(metric_name)}",
        "sample_count": len(filtered_values),
        "unit": item.get("unit") or data.get("unit", ""),
        "step_time": data.get("step_time"),
        "points": points,
    }
    if filtered_values:
        summary.update({
            "latest": filtered_values[-1],
            "mean": statistics.mean(filtered_values),
            "max": max(filtered_values),
        })
    return summary


def fetch_traffic_trends(
    client: Any,
    vs_name: Optional[str] = None,
    trend: str = "last-hour",
    from_time: str = "",
    to_time: str = "",
) -> Dict[str, Any]:
    """Fetch VS traffic trends directly from the device API."""
    if trend not in TRAFFIC_TREND_OPTIONS:
        supported = "、".join(TRAFFIC_TREND_OPTIONS)
        return {
            "status": "error",
            "period": trend,
            "range": "",
            "sample_count": 0,
            "metrics": [],
            "errors": [f"不支持的流量趋势区间：{trend}；当前支持：{supported}"],
        }

    try:
        from_ts = _parse_time_bound(from_time)
        to_ts = _parse_time_bound(to_time)
    except ValueError as exc:
        return {
            "status": "error",
            "period": trend,
            "range": _traffic_trend_range_label(trend, from_time, to_time),
            "query_range": TRAFFIC_TREND_OPTIONS[trend]["label"],
            "sample_count": 0,
            "metrics": [],
            "errors": [str(exc)],
        }
    if from_ts is not None and to_ts is not None and from_ts > to_ts:
        return {
            "status": "error",
            "period": trend,
            "range": _traffic_trend_range_label(trend, from_time, to_time),
            "query_range": TRAFFIC_TREND_OPTIONS[trend]["label"],
            "sample_count": 0,
            "metrics": [],
            "errors": ["开始时间不能晚于结束时间"],
        }

    vs_names = [vs_name] if vs_name else _fetch_vs_names(client)
    if not vs_names:
        return {
            "status": "error",
            "period": trend,
            "range": _traffic_trend_range_label(trend, from_time, to_time),
            "query_range": TRAFFIC_TREND_OPTIONS[trend]["label"],
            "from_time": from_time,
            "to_time": to_time,
            "sample_count": 0,
            "metrics": [],
            "errors": ["未找到目标虚拟服务"],
        }

    metrics: List[Dict[str, Any]] = []
    errors: List[str] = []
    for name in vs_names:
        try:
            data = _fetch_trend_raw(
                client,
                name,
                trend=trend,
                from_time=from_time,
                to_time=to_time,
            )
        except Exception as exc:
            data = None
            errors.append(f"{name} 趋势获取失败：{exc}")
        if not isinstance(data, dict):
            errors.append(f"{name} 趋势获取失败")
            continue
        items = data.get("items", []) if isinstance(data.get("items"), list) else []
        if not items:
            errors.append(f"{name} 趋势无有效指标")
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            summary = _summarize_vs_metric_trend(name, item, data, from_ts=from_ts, to_ts=to_ts)
            if summary["sample_count"] == 0:
                errors.append(f"{name} / {_metric_label(summary.get('metric'))} 趋势无有效样本")
            metrics.append(summary)

    sample_count = sum(int(item.get("sample_count", 0)) for item in metrics)
    step_times = [item.get("step_time") for item in metrics if item.get("step_time") is not None]
    status = "ok"
    if sample_count == 0:
        status = "insufficient_data" if metrics else "error"
    elif errors:
        status = "partial"
    return {
        "status": status,
        "period": trend,
        "range": _traffic_trend_range_label(trend, from_time, to_time),
        "query_range": TRAFFIC_TREND_OPTIONS[trend]["label"],
        "from_time": from_time,
        "to_time": to_time,
        "step_time": step_times[0] if step_times else None,
        "sample_count": sample_count,
        "metrics": metrics,
        "errors": errors,
    }


def _extract_metric_values(item: Dict[str, Any]) -> List[float]:
    """从趋势 API 返回的字典中提取数值。

    趋势 API 返回扁平数组: {"name": "connection_rate", "values": [1340, ...]}
    """
    vals = item.get('values', [])
    if not isinstance(vals, list):
        return []
    return [float(v) for v in vals if isinstance(v, (int, float)) and math.isfinite(v)]


def _extract_system_trend_values(data: Dict[str, Any], api_metric: str) -> List[Any]:
    """Extract numeric values from system trend responses."""
    if not isinstance(data, dict):
        return []
    if api_metric == "cpu_usage" and isinstance(data.get("series"), list):
        for series in data["series"]:
            if isinstance(series, dict) and series.get("name") in TOTAL_CPU_KEYS:
                values = series.get("values", [])
                return values if isinstance(values, list) else []
        return []
    if isinstance(data.get("values"), list):
        return data["values"]
    return []


def _build_points_from_trend(values: List[Any], start_time: Any, step_time: Any) -> List[Dict[str, Any]]:
    """Build timestamped points from AD trend metadata."""
    try:
        start = int(start_time)
        step = int(step_time)
    except (TypeError, ValueError):
        start = 0
        step = 60
    points = []
    for idx, raw_value in enumerate(values):
        if isinstance(raw_value, (int, float)) and math.isfinite(float(raw_value)):
            points.append({"ts": start + idx * step, "value": float(raw_value)})
    return points


def _parse_time_bound(value: str) -> Optional[int]:
    """Parse a CLI time bound into epoch seconds."""
    if not value:
        return None
    raw = str(value).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return int(datetime.strptime(raw, fmt).timestamp())
        except ValueError:
            continue
    raise ValueError(f"时间格式不正确：{value}；请使用 YYYY-MM-DD HH:MM:SS")


def select_state_trend(
    trend: Optional[str] = "auto",
    from_time: str = "",
    to_time: str = "",
) -> str:
    """Select the AD state trend window from an explicit value or fixed time range."""
    requested = str(trend or "auto").strip()
    if requested and requested != "auto":
        if requested not in STATE_TREND_OPTIONS:
            supported = "、".join(["auto", *STATE_TREND_OPTIONS.keys()])
            raise ValueError(f"不支持的状态趋势区间：{requested}；当前支持：{supported}")
        return requested

    if from_time and to_time:
        from_ts = _parse_time_bound(from_time)
        to_ts = _parse_time_bound(to_time)
        if from_ts is None or to_ts is None:
            return "last-hour"
        if from_ts > to_ts:
            raise ValueError("开始时间不能晚于结束时间")
        duration = to_ts - from_ts
        now_ts = int(datetime.now().timestamp())
        required_window = duration
        if from_ts <= now_ts:
            required_window = max(required_window, now_ts - from_ts)
        if required_window <= 3600:
            return "last-hour"
        if required_window <= 86400:
            return "last-day"
        if required_window <= 31 * 86400:
            return "last-month"
        raise ValueError("固定时间段超过 1 个月，设备状态趋势 API 只支持最近 1 小时、1 天、1 个月三个窗口")

    return "last-hour"


def select_traffic_trend(
    trend: Optional[str] = "auto",
    from_time: str = "",
    to_time: str = "",
) -> str:
    """Select the AD traffic trend window from an explicit value or fixed time range."""
    try:
        return select_state_trend(trend, from_time=from_time, to_time=to_time)
    except ValueError as exc:
        message = str(exc).replace("状态趋势", "流量趋势").replace("设备状态趋势 API", "设备流量趋势 API")
        raise ValueError(message)


def _filter_points_by_time(
    points: List[Dict[str, Any]],
    from_ts: Optional[int] = None,
    to_ts: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Keep only points inside the requested inclusive time range."""
    if from_ts is None and to_ts is None:
        return points
    filtered = []
    for point in points:
        ts = point.get("ts")
        if not isinstance(ts, int):
            continue
        if from_ts is not None and ts < from_ts:
            continue
        if to_ts is not None and ts > to_ts:
            continue
        filtered.append(point)
    return filtered


def _system_trend_range_label(trend: str, from_time: str = "", to_time: str = "") -> str:
    if from_time or to_time:
        start = from_time or "起始时间未指定"
        end = to_time or "当前"
        return f"{start} 至 {end}"
    return STATE_TREND_OPTIONS[trend]["label"]


def _traffic_trend_range_label(trend: str, from_time: str = "", to_time: str = "") -> str:
    if from_time or to_time:
        start = from_time or "起始时间未指定"
        end = to_time or "当前"
        return f"{start} 至 {end}"
    return TRAFFIC_TREND_OPTIONS[trend]["label"]


def _summarize_system_trend(
    metric: Dict[str, str],
    data: Dict[str, Any],
    from_ts: Optional[int] = None,
    to_ts: Optional[int] = None,
) -> Dict[str, Any]:
    values = _extract_system_trend_values(data, metric["api"])
    points = _build_points_from_trend(values, data.get("start_time"), data.get("step_time"))
    points = _filter_points_by_time(points, from_ts=from_ts, to_ts=to_ts)
    values = [float(point["value"]) for point in points if isinstance(point.get("value"), (int, float))]
    summary: Dict[str, Any] = {
        "metric": metric["metric"],
        "label": metric["label"],
        "sample_count": len(values),
        "unit": data.get("unit", ""),
        "step_time": data.get("step_time"),
        "points": points,
    }
    if values:
        summary.update({
            "latest": values[-1],
            "mean": statistics.mean(values),
            "max": max(values),
        })
    return summary


def fetch_system_trends(
    client: Any,
    trend: str = "last-hour",
    from_time: str = "",
    to_time: str = "",
) -> Dict[str, Any]:
    """Fetch CPU, memory, and connection-rate trends directly from the device."""
    if trend not in STATE_TREND_OPTIONS:
        supported = "、".join(STATE_TREND_OPTIONS)
        return {
            "status": "error",
            "period": trend,
            "range": "",
            "sample_count": 0,
            "metrics": [],
            "errors": [f"不支持的状态趋势区间：{trend}；当前支持：{supported}"],
        }

    try:
        from_ts = _parse_time_bound(from_time)
        to_ts = _parse_time_bound(to_time)
    except ValueError as exc:
        return {
            "status": "error",
            "period": trend,
            "range": _system_trend_range_label(trend, from_time, to_time),
            "query_range": STATE_TREND_OPTIONS[trend]["label"],
            "sample_count": 0,
            "metrics": [],
            "errors": [str(exc)],
        }
    if from_ts is not None and to_ts is not None and from_ts > to_ts:
        return {
            "status": "error",
            "period": trend,
            "range": _system_trend_range_label(trend, from_time, to_time),
            "query_range": STATE_TREND_OPTIONS[trend]["label"],
            "sample_count": 0,
            "metrics": [],
            "errors": ["开始时间不能晚于结束时间"],
        }

    metrics: List[Dict[str, Any]] = []
    errors: List[str] = []
    for metric in STATE_TREND_METRICS:
        try:
            data = client._request(
                "GET",
                f"/stat/sys/system/{metric['api']}",
                params={"trend": trend, "all_properties": "true"},
            )
            summary = _summarize_system_trend(metric, data, from_ts=from_ts, to_ts=to_ts)
            if summary["sample_count"] == 0:
                errors.append(f"{metric['label']} 趋势无有效样本")
            metrics.append(summary)
        except Exception as exc:
            errors.append(f"{metric['label']} 趋势获取失败：{exc}")

    sample_count = sum(int(item.get("sample_count", 0)) for item in metrics)
    step_times = [item.get("step_time") for item in metrics if item.get("step_time") is not None]
    status = "ok"
    if sample_count == 0 and errors:
        status = "error"
    elif errors and metrics:
        status = "partial"
    elif errors and not metrics:
        status = "error"
    return {
        "status": status,
        "period": trend,
        "range": _system_trend_range_label(trend, from_time, to_time),
        "query_range": STATE_TREND_OPTIONS[trend]["label"],
        "from_time": from_time,
        "to_time": to_time,
        "step_time": step_times[0] if step_times else None,
        "sample_count": sample_count,
        "metrics": metrics,
        "errors": errors,
    }


def build_traffic_window(
    days: int = 7,
    from_time: str = "",
    to_time: str = "",
) -> Tuple[str, str, str]:
    """Build AD traffic trend query window and a user-facing range label."""
    safe_days = max(1, int(days or 7))
    now = datetime.now()
    end = to_time or now.strftime("%Y-%m-%d %H:%M:%S")
    if from_time:
        return from_time, end, f"{from_time} 至 {end}"
    start_dt = now - timedelta(days=safe_days)
    return start_dt.strftime("%Y-%m-%d %H:%M:%S"), end, f"最近 {safe_days} 天"


def traffic_analysis(
    client: Any,
    db_path: Optional[str] = None,
    vs_name: Optional[str] = None,
    days: int = 7,
    require_db: bool = False,
    trend: Optional[str] = "auto",
    from_time: str = "",
    to_time: str = "",
) -> Dict[str, Any]:
    """
    流量趋势分析: 默认直接使用设备 VS 趋势 API。
    require_db=True 时保留旧版 SQLite/collector 兼容路径，禁止实时 API 回退。

    返回字典包含:
        status: 'ok' | 'warning' | 'insufficient_data' | 'error'
        anomalies: 异常字典列表 (当 status == 'ok' 时)
        error: 错误信息或 None
    """
    safe_days = max(1, int(days or 7))
    result = {
        'status': 'ok',
        'anomalies': [],
        'error': None,
        'source': 'device_trend_api',
        'days': safe_days,
        'range': '',
        'from_time': from_time,
        'to_time': to_time,
        'vs': vs_name,
        'db_queried': False,
        'db_path': db_path,
        'sample_count': 0,
    }

    # Auto-derive DB path from client host if not explicitly provided
    if not db_path and client is not None and hasattr(client, 'host'):
        host = client.host
        if isinstance(host, str):
            import re
            safe = re.sub(r'[^a-zA-Z0-9._-]', '_', host)
            db_path = f"vs_samples_{safe}.db"
            result['db_path'] = db_path

    if require_db:
        trend_from, trend_to, range_label = build_traffic_window(
            days=safe_days,
            from_time=from_time,
            to_time=to_time,
        )
        result.update({
            'source': 'sqlite',
            'range': range_label,
            'from_time': trend_from,
            'to_time': trend_to,
        })
        rows = None
        if db_path and os.path.isfile(db_path):
            rows = query_traffic_db(db_path, vs_name, days=result['days'])
            result['db_queried'] = rows is not None
            result['sample_count'] = len(rows or [])
        else:
            result['status'] = 'error'
            result['error'] = f"历史流量库不存在，无法进行数据库趋势分析：{db_path or '未指定'}"
            return result

        if rows is not None and len(rows) >= 100:
            result['anomalies'] = _analyze_traffic_rows(rows)
            if result['anomalies']:
                result['status'] = 'warning'
            return result

        result['status'] = 'insufficient_data' if rows else 'error'
        if rows:
            result['error'] = None
        else:
            result['error'] = f"历史流量库中未查询到 {vs_name or '目标虚拟服务'} 最近 {result['days']} 天的数据"
        return result

    try:
        selected_trend = select_traffic_trend(trend or "auto", from_time=from_time, to_time=to_time)
    except ValueError as exc:
        result['status'] = 'error'
        result['error'] = str(exc)
        return result

    trend_info = fetch_traffic_trends(
        client,
        vs_name=vs_name,
        trend=selected_trend,
        from_time=from_time,
        to_time=to_time,
    )
    result.update({
        'status': trend_info.get('status', 'ok'),
        'range': trend_info.get('range') or '',
        'from_time': trend_info.get('from_time') or from_time,
        'to_time': trend_info.get('to_time') or to_time,
        'sample_count': trend_info.get('sample_count', 0),
        'trend': trend_info,
        'raw_trends': [
            {
                'vs': metric.get('vs', ''),
                'metric': metric.get('metric', ''),
                'trend': trend_info.get('period', selected_trend),
                'mean': metric.get('mean', 0.0),
                'max': metric.get('max', 0.0),
            }
            for metric in trend_info.get('metrics', [])
            if isinstance(metric.get('mean'), (int, float)) or isinstance(metric.get('max'), (int, float))
        ],
    })

    if result['status'] in ('ok', 'partial'):
        groups: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        for metric in trend_info.get('metrics', []):
            key = (str(metric.get('vs') or vs_name or ''), str(metric.get('metric') or ''))
            groups[key] = list(metric.get('points') or [])
        result['anomalies'] = _run_3sigma_on_vs_group(groups)
        if result['anomalies']:
            result['status'] = 'warning'
    elif result['status'] == 'insufficient_data':
        result['error'] = None
    else:
        errors = trend_info.get('errors') or []
        result['error'] = "；".join(errors) if errors else "设备趋势 API 无法获取流量数据"

    return result


def state_analysis(
    client: Any,
    disk_source: Optional[str] = None,
    db_path: Optional[str] = None,
    trend: Optional[str] = None,
    from_time: str = "",
    to_time: str = "",
) -> Dict[str, Any]:
    """
    设备状态异常检测。

    检查 API 返回的 CPU、内存、风扇、电源、接口状态，
    并可选择从本地巡检报告中检查磁盘。

    如果提供了 db_path，则对 SQLite 中的历史设备状态数据
    运行 3σ 异常检测。

    Args:
        client: ADClient 实例
        disk_source: 可选，包含 ad.json 的巡检报告目录路径
        db_path: 可选，包含 device_state 表的 SQLite 数据库路径

    返回字典包含:
        status: 'ok' | 'warning' | 'critical' | 'error'
        items: 指标字典列表 {metric, value, level, message, ...}
        disk: 包含磁盘可用性信息的字典
        anomalies: 3σ 异常字典列表
    """
    trend_requested = trend is not None or bool(from_time or to_time)
    selected_trend: Optional[str] = None
    if trend_requested:
        try:
            selected_trend = select_state_trend(trend or "auto", from_time=from_time, to_time=to_time)
        except ValueError as exc:
            supported = "、".join(["auto", *STATE_TREND_OPTIONS.keys()])
            message = str(exc) if str(exc) else f"不支持的状态趋势区间：{trend}；当前支持：{supported}"
            if "当前支持" not in message and "超过 1 个月" not in message and "开始时间" not in message and "时间格式" not in message:
                message = f"{message}；当前支持：{supported}"
            return {
                'status': 'error',
                'error': message,
                'items': [],
                'disk': {'available': False, 'value': None, 'source': 'none'},
                'anomalies': [],
            }
    if selected_trend and selected_trend not in STATE_TREND_OPTIONS:
        supported = "、".join(STATE_TREND_OPTIONS)
        return {
            'status': 'error',
            'error': f"不支持的状态趋势区间：{selected_trend}；当前支持：{supported}",
            'items': [],
            'disk': {'available': False, 'value': None, 'source': 'none'},
            'anomalies': [],
        }

    items = []
    has_warn = False
    has_critical = False
    disk_info = {'available': False, 'value': None, 'source': 'none'}
    trend_info: Optional[Dict[str, Any]] = None

    try:
        sys_data = client.get_sys_system()
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'items': [{'metric': 'system', 'value': None, 'level': 'error', 'message': str(e)}],
            'disk': disk_info,
        }

    # Helper to extract value from API dict {"value": N, ...} or raw number.
    # Missing CPU/memory means unknown; it must not be rendered as 0%.
    def _val(field: Any, default: Any = None) -> Any:
        if isinstance(field, dict):
            return field.get('value', default)
        return field if field is not None else default

    def _append_usage(metric: str, label: str, value: Any) -> None:
        nonlocal has_warn, has_critical
        if value is None:
            return
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            has_warn = True
            items.append({'metric': metric, 'value': value, 'level': 'warn',
                          'message': f'{label}: {value}'})
            return
        if numeric >= 90:
            level = 'critical'
            has_critical = True
        elif numeric >= 80:
            level = 'warn'
            has_warn = True
        else:
            level = 'ok'
        items.append({'metric': metric, 'value': value, 'level': level,
                      'message': f'{label}: {value}%'})

    _append_usage('cpu', 'CPU 使用率', _val(sys_data.get('cpu_usage')))
    _append_usage('memory', '内存使用率', _val(sys_data.get('memory_usage')))

    # Fan check — API returns "fan": [] (list of dicts) or empty list
    fan_list = sys_data.get('fan') or []
    if isinstance(fan_list, list):
        for f in fan_list:
            fs = f.get('status', '') if isinstance(f, dict) else str(f)
            if fs == 'fail':
                has_critical = True
                items.append({'metric': 'fan', 'value': fs, 'level': 'critical',
                              'message': f'风扇 {f.get("name", "")} 状态: {fs}'})
            elif fs and fs != 'normal':
                has_warn = True
                items.append({'metric': 'fan', 'value': fs, 'level': 'warn',
                              'message': f'风扇 {f.get("name", "")} 状态: {fs}'})

    # Power check — API returns "power_supply": "UNSUPPORTED" (string) or list
    ps_raw = sys_data.get('power_supply', '')
    if isinstance(ps_raw, str):
        if ps_raw.lower() == 'fail':
            has_critical = True
            items.append({'metric': 'power', 'value': ps_raw, 'level': 'critical',
                          'message': f'电源状态: {ps_raw}'})
        elif ps_raw.lower() not in ('', 'normal', 'unsupported'):
            has_warn = True
            items.append({'metric': 'power', 'value': ps_raw, 'level': 'warn',
                          'message': f'电源状态: {ps_raw}'})
    elif isinstance(ps_raw, list):
        for p in ps_raw:
            ps = p.get('status', '') if isinstance(p, dict) else str(p)
            if ps == 'fail':
                has_critical = True
                items.append({'metric': 'power', 'value': ps, 'level': 'critical',
                              'message': f'电源 {p.get("name", "")} 状态: {ps}'})
            elif ps and ps != 'normal':
                has_warn = True
                items.append({'metric': 'power', 'value': ps, 'level': 'warn',
                              'message': f'电源 {p.get("name", "")} 状态: {ps}'})

    # Interface check — API returns "interface": {"plug": {"in": [...], "out": [...]}}
    iface_raw = sys_data.get('interface', {})
    if isinstance(iface_raw, dict):
        plug = iface_raw.get('plug', {})
        for name in plug.get('out', []):
            has_warn = True
            items.append({
                'metric': 'interface',
                'value': name,
                'level': 'warn',
                'message': f'接口 {name} 状态: out (未连接)'
            })

    # Disk handling
    if disk_source:
        ad_json_path = os.path.join(disk_source, 'ad.json')
        if not os.path.isfile(ad_json_path):
            print('[WARN] --disk-source 指定的目录中未找到 ad.json', file=sys.stderr)
            disk_info = {'available': False, 'value': None, 'source': 'ad.json'}
            items.append({'metric': 'disk', 'value': None, 'level': 'ok',
                          'message': '磁盘: 巡检报告不可用'})
        else:
            try:
                with open(ad_json_path, 'r', encoding='utf-8') as f:
                    ad_data = json.load(f)
                disk_check = ad_data.get('check_results', {}).get('disk_check', {})
                disk_info = {
                    'available': True,
                    'value': disk_check.get('disk_usage', 'unknown'),
                    'source': 'ad.json'
                }
                disk_pct = disk_check.get('disk_usage', '')
                if isinstance(disk_pct, str) and '%' in disk_pct:
                    try:
                        pct_val = float(disk_pct.split('%')[0].split()[-1])
                        if pct_val >= 90:
                            has_critical = True
                            items.append({'metric': 'disk', 'value': pct_val, 'level': 'critical',
                                          'message': f'磁盘使用率: {disk_pct}'})
                        elif pct_val >= 80:
                            has_warn = True
                            items.append({'metric': 'disk', 'value': pct_val, 'level': 'warn',
                                          'message': f'磁盘使用率: {disk_pct}'})
                    except (ValueError, IndexError):
                        pass
            except Exception as e:
                print(f'[WARN] ad.json 解析失败: {e}', file=sys.stderr)
                disk_info = {'available': False, 'value': None, 'source': 'error'}
                items.append({'metric': 'disk', 'value': None, 'level': 'ok',
                              'message': '磁盘: 巡检报告损坏'})
    else:
        disk_info = {'available': False, 'value': None, 'source': 'none'}
        items.append({'metric': 'disk', 'value': None, 'level': 'ok',
                      'message': '磁盘: 未提供巡检数据'})

    anomalies = []
    if selected_trend:
        trend_info = fetch_system_trends(client, selected_trend, from_time=from_time, to_time=to_time)
        for metric_summary in trend_info.get("metrics", []):
            points = metric_summary.get("points", [])
            if len(points) < 30:
                continue
            detected = detect_anomaly_3sigma(points)
            for anomaly in detected:
                anomaly["metric"] = metric_summary.get("metric")
                anomalies.append(anomaly)
        if anomalies:
            has_warn = True
    elif db_path and os.path.isfile(db_path):
        rows = query_device_state_db(db_path)
        if rows is not None and len(rows) > 0:
            # Group by metric
            groups = {}
            for row in rows:
                m = row['metric']
                if m not in groups:
                    groups[m] = []
                groups[m].append({'ts': row['ts'], 'value': row['value']})

            has_enough = any(len(pts) >= 30 for pts in groups.values())

            if not has_enough:
                # Injection branch: try to collect system trend data
                try:
                    from collector import collect_system_once
                except ImportError:
                    pass
                else:
                    injected = collect_system_once(client, db_path)
                    if injected > 0:
                        rows = query_device_state_db(db_path)
                        if rows is not None:
                            groups = {}
                            for row in rows:
                                m = row['metric']
                                if m not in groups:
                                    groups[m] = []
                                groups[m].append({'ts': row['ts'], 'value': row['value']})

            # Run 3σ per metric
            for metric, points in groups.items():
                if len(points) < 30:
                    continue
                points.sort(key=lambda x: x['ts'])
                detected = detect_anomaly_3sigma(points)
                for a in detected:
                    a['metric'] = metric
                    anomalies.append(a)

        # Annotate items with anomaly info (most recent anomaly per metric)
        if anomalies:
            latest_by_metric = {}
            for a in anomalies:
                m = a['metric']
                if m not in latest_by_metric or a['ts'] > latest_by_metric[m]['ts']:
                    latest_by_metric[m] = a

            for item in items:
                if item['metric'] in latest_by_metric:
                    a = latest_by_metric[item['metric']]
                    baseline = a['baseline_mean']
                    value = a['value']
                    item['baseline_mean'] = baseline
                    item['z'] = a['z']
                    item['direction'] = a['direction']
                    if baseline != 0:
                        item['deviation_pct'] = (value - baseline) / baseline * 100
                    else:
                        item['deviation_pct'] = 0

    # Determine overall status
    if has_critical:
        status = 'critical'
    elif has_warn:
        status = 'warning'
    else:
        status = 'ok'
    if trend_info:
        if trend_info.get('status') == 'error':
            status = 'error'
        elif trend_info.get('status') == 'partial' and status == 'ok':
            status = 'warning'

    result = {'status': status, 'items': items, 'disk': disk_info, 'anomalies': anomalies}
    if trend_info is not None:
        result['trend'] = trend_info
    return result


def conflict_analysis(client: Any) -> Dict[str, Any]:
    """
    地址冲突检测。

    检测:
    1. VS IP:Port 重叠 (vips x vports 笛卡尔积)
    2. Pool 节点重复 (相同 ip:port 出现在不同的 pool 中)

    返回字典包含:
        status: 'ok' | 'conflict_found' | 'error'
        vs_overlaps: 列表 [[vs_names], 'ip:port']
        pool_overlaps: 列表 ['ip:port', [pool_names]]
    """
    result = {
        'status': 'ok',
        'vs_overlaps': [],
        'pool_overlaps': [],
    }

    try:
        # 1. VS IP:Port overlap detection
        vs_data = client.get_virtual_services()
        vs_items = vs_data.get('items', [])

        vs_map = {}  # (ip, port) -> [vs_names]
        for vs in vs_items:
            name = vs.get('name', '')
            vips = vs.get('vips', [])
            if isinstance(vips, str):
                vips = [vips]
            vports = vs.get('vports') or []
            if isinstance(vports, str):
                vports = [vports]
            if not vports:
                # Fallback to singular vport field
                vport = vs.get('vport', '')
                if vport:
                    vports = [str(vport)]
            if not vips or not vports:
                continue
            for vip in vips:
                for vport in vports:
                    key = (vip, str(vport))
                    if key not in vs_map:
                        vs_map[key] = []
                    if name not in vs_map[key]:
                        vs_map[key].append(name)

        for (ip, port), names in vs_map.items():
            if len(names) > 1:
                result['vs_overlaps'].append([names, f'{ip}:{port}'])

        # 2. Pool node overlap detection
        pool_data = client.get_pools()
        pool_items = pool_data.get('items', [])

        node_map = {}  # ip:port -> [pool_names]
        for pool in pool_items:
            pool_name = pool.get('name', '')
            members = pool.get('member_list', [])
            if not isinstance(members, list):
                continue
            for member in members:
                if not isinstance(member, dict):
                    continue
                ip = member.get('ip', '')
                port = member.get('port', '')
                node_key = f'{ip}:{port}'
                if node_key not in node_map:
                    node_map[node_key] = []
                if pool_name not in node_map[node_key]:
                    node_map[node_key].append(pool_name)

        for node_key, pool_names in node_map.items():
            if len(pool_names) > 1:
                result['pool_overlaps'].append([node_key, pool_names])

        if result['vs_overlaps'] or result['pool_overlaps']:
            result['status'] = 'conflict_found'

    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)

    return result


def log_correlation(client: Any, anomalies: List[Dict[str, Any]], limit: int = 20) -> Dict[str, Any]:
    """
    围绕异常时间点的日志关联。

    仅当存在异常时运行。查询服务日志并匹配
    异常时间点 ±5 分钟范围内的日志条目。

    返回字典包含:
        status: 'ok' | 'no_anomaly' | 'no_match' | 'error'
        entries: 匹配的日志条目列表
    """
    if not anomalies:
        return {'status': 'no_anomaly', 'entries': []}

    try:
        log_data = client.get_service_log(limit=limit)
        log_entries = log_data.get('items', [])
    except Exception:
        return {'status': 'error', 'entries': [], 'error': 'Failed to fetch logs'}

    # Collect anomaly time windows (±5 min)
    matched = []
    for entry in log_entries:
        date_str = entry.get('date', '')
        time_str = entry.get('time', '')
        if not date_str or not time_str:
            continue
        try:
            log_dt = datetime.strptime(f'{date_str} {time_str}', '%Y-%m-%d %H:%M:%S')
            log_ts = int(log_dt.timestamp())
        except (ValueError, OSError):
            continue

        for anomaly in anomalies:
            anomaly_ts = anomaly.get('ts', 0)
            if abs(log_ts - anomaly_ts) <= 300:  # 5 min = 300 seconds
                matched.append({
                    'time': f'{date_str} {time_str}',
                    'level': entry.get('level', ''),
                    'module': entry.get('module', ''),
                    'detail': entry.get('detail', ''),
                })
                break

    if matched:
        return {'status': 'ok', 'entries': matched}
    else:
        return {'status': 'no_match', 'entries': []}


def _normalize_log_limit(limit: int = 20) -> int:
    return min(max(int(limit or 20), 1), 20)


def parse_log_levels(value: Optional[str] = None) -> List[str]:
    """Parse comma-separated log levels, defaulting to ALERT + ERROR."""
    raw = value or "ALERT,ERROR"
    levels = [part.strip().upper() for part in raw.split(",") if part.strip()]
    return levels or ["ALERT", "ERROR"]


def parse_log_modules(value: Optional[str] = None) -> List[str]:
    """Parse comma-separated AD service-log modules."""
    raw = value or ""
    return [part.strip().upper() for part in raw.split(",") if part.strip()]


_LOG_TYPE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "address-conflict": {
        "label": "地址冲突",
        "aliases": {
            "address-conflict",
            "address_conflict",
            "ip-conflict",
            "ip_conflict",
            "conflict",
            "地址冲突",
            "地址端口冲突",
            "ip冲突",
            "ip地址冲突",
        },
        "strong_keywords": (
            "地址冲突",
            "地址端口冲突",
            "ip冲突",
            "ip 地址冲突",
            "vip冲突",
            "vip 冲突",
            "端口冲突",
        ),
        "context_keywords": (
            "地址",
            "ip",
            "vip",
            "端口",
            "port",
            "虚拟服务",
            "virtual",
            "slb",
            "pool",
            "节点",
            "node",
        ),
        "conflict_keywords": (
            "冲突",
            "重复",
            "重叠",
            "conflict",
            "duplicate",
            "overlap",
        ),
    },
}


def normalize_log_type(value: Optional[str] = None) -> str:
    """Normalize a user-facing semantic log type to an internal key."""
    raw = str(value or "").strip()
    if not raw:
        return ""
    lowered = raw.lower()
    for key, definition in _LOG_TYPE_DEFINITIONS.items():
        aliases = definition.get("aliases", set())
        if lowered == key or lowered in aliases or raw in aliases:
            return key
    supported = "、".join(d.get("label", k) for k, d in _LOG_TYPE_DEFINITIONS.items())
    raise ValueError(f"不支持的日志类型：{raw}；当前支持：{supported}")


def log_type_label(log_type: str) -> str:
    definition = _LOG_TYPE_DEFINITIONS.get(log_type, {})
    return str(definition.get("label") or log_type or "")


def _log_entry_text(entry: Dict[str, Any]) -> str:
    fields = [
        entry.get("module", ""),
        entry.get("detail", ""),
        entry.get("message", ""),
        entry.get("name", ""),
        entry.get("event", ""),
    ]
    return " ".join(str(field) for field in fields if field is not None).lower()


def log_entry_matches_type(entry: Dict[str, Any], log_type: str) -> bool:
    """Return True when a service-log row matches a supported semantic type."""
    normalized = normalize_log_type(log_type)
    if not normalized:
        return True
    definition = _LOG_TYPE_DEFINITIONS.get(normalized)
    if not definition:
        return False
    text = _log_entry_text(entry)
    if any(str(keyword).lower() in text for keyword in definition.get("strong_keywords", ())):
        return True
    has_context = any(str(keyword).lower() in text for keyword in definition.get("context_keywords", ()))
    has_conflict = any(str(keyword).lower() in text for keyword in definition.get("conflict_keywords", ()))
    return has_context and has_conflict


def filter_log_entries_by_type(entries: List[Dict[str, Any]], log_type: str) -> List[Dict[str, Any]]:
    normalized = normalize_log_type(log_type)
    if not normalized:
        return entries
    return [entry for entry in entries if isinstance(entry, dict) and log_entry_matches_type(entry, normalized)]


def build_log_window(
    days: int = 0,
    hours: int = 24,
    from_time: str = "",
    to_time: str = "",
) -> Tuple[str, str, str]:
    """Build AD service-log query window and a user-facing range label."""
    now = datetime.now()
    end = to_time or now.strftime("%Y-%m-%d %H:%M:%S")
    if from_time:
        return from_time, end, f"{from_time} 至 {end}"
    if days and int(days) > 0:
        start_dt = now - timedelta(days=int(days))
        return start_dt.strftime("%Y-%m-%d %H:%M:%S"), end, f"最近 {int(days)} 天"
    safe_hours = max(1, int(hours or 24))
    start_dt = now - timedelta(hours=safe_hours)
    return start_dt.strftime("%Y-%m-%d %H:%M:%S"), end, f"最近 {safe_hours} 小时"


def _fetch_service_log_data(
    client: Any,
    limit: int = 20,
    from_time: str = "",
    to_time: str = "",
    levels: Optional[List[str]] = None,
    modules: Optional[List[str]] = None,
) -> Dict[str, Any]:
    kwargs: Dict[str, Any] = {"limit": _normalize_log_limit(limit)}
    if from_time:
        kwargs["from_time"] = from_time
    if to_time:
        kwargs["to_time"] = to_time
    if levels:
        kwargs["levels"] = levels
    if modules:
        kwargs["modules"] = modules
    data = client.get_service_log(**kwargs)
    return data if isinstance(data, dict) else {"items": []}


def fetch_service_logs(
    client: Any,
    limit: int = 50,
    from_time: str = "",
    to_time: str = "",
    levels: Optional[List[str]] = None,
    modules: Optional[List[str]] = None,
    log_type: str = "",
) -> List[Dict[str, Any]]:
    """
    从设备获取服务日志。

    Args:
        client: ADClient 实例
        limit: 返回的最大日志条数

    Returns:
        按日期+时间降序排列的日志条目字典列表
    """
    normalized_type = normalize_log_type(log_type)
    query_limit = _normalize_log_limit(limit)
    if normalized_type:
        query_limit = max(query_limit, 100)
    data = _fetch_service_log_data(
        client,
        limit=query_limit,
        from_time=from_time,
        to_time=to_time,
        levels=levels,
        modules=modules,
    )
    entries = data.get('items', [])
    if normalized_type:
        entries = filter_log_entries_by_type(entries, normalized_type)
    return entries[:_normalize_log_limit(limit)]


def fetch_service_log_result(
    client: Any,
    limit: int = 20,
    from_time: str = "",
    to_time: str = "",
    levels: Optional[List[str]] = None,
    modules: Optional[List[str]] = None,
    log_type: str = "",
    range_label: str = "",
) -> Dict[str, Any]:
    """Fetch service logs with metadata used by the user-facing template."""
    normalized_limit = _normalize_log_limit(limit)
    normalized_type = normalize_log_type(log_type)
    query_limit = normalized_limit
    if normalized_type:
        # Semantic filtering happens after API fetch; query a wider page so
        # relevant rows are not lost when the newest generic logs are noisy.
        query_limit = max(normalized_limit, 100)
    data = _fetch_service_log_data(
        client,
        limit=query_limit,
        from_time=from_time,
        to_time=to_time,
        levels=levels,
        modules=modules,
    )
    entries = data.get('items', [])
    unfiltered_total = data.get('total') or data.get('count') or len(entries)
    if normalized_type:
        entries = filter_log_entries_by_type(entries, normalized_type)
    filtered_total = len(entries)
    shown_entries = entries[:normalized_limit]
    total = filtered_total if normalized_type else unfiltered_total
    return {
        'status': 'warning' if shown_entries else 'ok',
        'entries': shown_entries,
        'total': total,
        'shown': len(shown_entries),
        'limit': normalized_limit,
        'query_limit': query_limit,
        'range': range_label,
        'from_time': from_time,
        'to_time': to_time,
        'levels': levels or ["ALERT", "ERROR"],
        'modules': modules or [],
        'log_type': normalized_type,
        'log_type_label': log_type_label(normalized_type),
        'semantic_filter': bool(normalized_type),
        'unfiltered_total': unfiltered_total,
    }


def _log_time_display(entry: Dict[str, Any]) -> str:
    date_str = str(entry.get('date', '') or '').strip()
    time_str = str(entry.get('time', '') or '').strip()
    if date_str and time_str and not time_str.startswith(date_str):
        return f"{date_str} {time_str}"
    return time_str or date_str or str(entry.get('timestamp', '') or '')


def _md_cell(value: Any) -> str:
    return str(value if value is not None else '').replace('\n', ' ').replace('|', '\\|')


def render_logs_markdown(entries: List[Dict[str, Any]], host: str) -> str:
    """
    将服务日志条目渲染为 markdown 表格。

    这是一个新的独立函数 —— 请勿修改已有的 render_markdown()。

    Args:
        entries: 日志条目字典列表 [{date, time, level, module, detail, log_id}, ...]
        host: 设备主机 URL

    Returns:
        markdown 字符串
    """
    lines = [f'## 服务日志 ({host})']
    lines.append('| 时间 | 级别 | 模块 | 详情 |')
    lines.append('|---|---|---|---|')
    for e in entries:
        lines.append(
            f"| {_md_cell(_log_time_display(e))} | {_md_cell(e.get('level', ''))} | {_md_cell(e.get('module', ''))} | {_md_cell(e.get('detail', ''))} |"
        )
    return '\n'.join(lines)


_STATUS_BADGES = {
    '失败': '❌ 失败',
    '需关注': '⚠️ 需关注',
    '未发现明显异常': '✅ 未发现明显异常',
}


_LEVEL_BADGES = {
    'critical': '❌ 严重',
    'warn': '⚠️ 警告',
    'warning': '⚠️ 警告',
    'ok': '✅ 正常',
    'error': '❌ 失败',
}


_METRIC_LABELS = {
    'cpu': 'CPU',
    'memory': '内存',
    'disk': '磁盘',
    'fan': '风扇',
    'power': '电源',
    'interface': '接口',
    'system': '系统',
    'connection': '当前连接数',
    'connection-rate': '新建速率',
    'connection_rate': '新建速率',
    'general-throughput': '总吞吐量',
    'general_throughput': '总吞吐量',
    'throughput': '吞吐量',
}


def _display_device_ref(device: Any) -> str:
    """Return a compact device label without leaking URL schemes."""
    raw = str(device or '').strip()
    parsed = urlparse(raw)
    return parsed.hostname or raw or 'Unknown'


def _level_badge(level: Any) -> str:
    """Return a Chinese level label with a small status icon."""
    raw = str(level or '').strip().lower()
    return _LEVEL_BADGES.get(raw, str(level or '-'))


def _metric_label(metric: Any) -> str:
    """Return a user-facing metric label."""
    raw = str(metric or '')
    return _METRIC_LABELS.get(raw, raw)


def _analysis_status_badge(statuses: List[str]) -> str:
    """Summarize scoped perception dimensions into one user-facing status."""
    if any(status == 'error' for status in statuses):
        return _STATUS_BADGES['失败']
    if any(status in ('critical', 'warning', 'warn', 'partial', 'conflict_found', 'insufficient_data', 'no_match') for status in statuses):
        return _STATUS_BADGES['需关注']
    return _STATUS_BADGES['未发现明显异常']


def _scope_label(scope: str) -> str:
    labels = {
        'analyze': '流量异常、资源状态、地址冲突、日志线索',
        'traffic': '流量趋势分析',
        'state': '设备资源状态异常',
        'conflict': '地址冲突',
        'logs': '服务日志线索',
    }
    return labels.get(scope, labels['analyze'])


def render_markdown(results: Dict[str, Any]) -> str:
    """将结果渲染为 markdown 字符串。"""
    lines = []

    device = _display_device_ref(results.get('device') or results.get('_device') or results.get('host'))
    scope = results.get('_scope', 'analyze')
    traffic = results.get('traffic', {}) if isinstance(results.get('traffic', {}), dict) else {}
    state = results.get('state', {}) if isinstance(results.get('state', {}), dict) else {}
    logs = results.get('logs', {}) if isinstance(results.get('logs', {}), dict) else {}
    conflicts = results.get('conflicts', {}) if isinstance(results.get('conflicts', {}), dict) else {}

    show_traffic = scope in ('analyze', 'traffic') and traffic
    show_state = scope in ('analyze', 'state') and state
    show_logs = scope == 'logs' or (scope == 'analyze' and logs and logs.get('status') not in ('no_anomaly', None))
    show_conflicts = scope in ('analyze', 'conflict') and conflicts

    scoped_statuses = []
    if show_traffic:
        scoped_statuses.append(traffic.get('status', ''))
    if show_state:
        scoped_statuses.append(state.get('status', ''))
    if show_logs:
        scoped_statuses.append(logs.get('status', ''))
    if show_conflicts:
        scoped_statuses.append(conflicts.get('status', ''))
    status_text = _analysis_status_badge(scoped_statuses)
    if scope == 'logs' and logs.get('status') == 'ok':
        status_text = '✅ 成功'

    lines.append('## 感知结论')
    lines.append(f'- 目标设备：{device}')
    lines.append(f'- 分析范围：📌 {_scope_label(scope)}')
    source_label = '📡 设备实时分析'
    if show_traffic and traffic.get('source') in ('sqlite', 'sqlite_injected'):
        source_label = '📊 历史流量库'
    if show_traffic and traffic.get('source') == 'device_trend_api':
        source_label = '📈 设备趋势 API'
    if show_state and state.get('trend'):
        source_label = '📈 设备趋势 API'
    if scope == 'logs':
        source_label = '📄 设备日志接口'
    lines.append(f'- 数据来源：{source_label}')
    lines.append(f'- 状态：{status_text}')
    lines.append('')
    lines.append('## 分析结果')
    lines.append('')

    if show_traffic:
        lines.append('## 流量分析')
        days_label = traffic.get('days', 7)
        vs_label = traffic.get('vs') or '全部虚拟服务'
        range_label = traffic.get('range') or f"最近 {days_label} 天"
        if traffic.get('db_queried') or traffic.get('source') in ('sqlite', 'sqlite_injected'):
            lines.append(f"- 分析对象：{vs_label}")
            lines.append(f"- 时间范围：{range_label}")
            lines.append(f"- 数据样本：{traffic.get('sample_count', 0)} 条")
            lines.append('')
        elif range_label:
            lines.append(f"- 分析对象：{vs_label}")
            lines.append(f"- 时间范围：{range_label}")
            if traffic.get('source') == 'device_trend_api':
                trend_info = traffic.get('trend') or {}
                lines.append(f"- 查询窗口：{trend_info.get('query_range') or trend_info.get('period') or '-'}")
                if trend_info.get('step_time') is not None:
                    lines.append(f"- 采样粒度：{trend_info.get('step_time')} 秒")
                lines.append(f"- 数据样本：{traffic.get('sample_count', 0)} 条")
            lines.append('')
        if traffic.get('status') in ('ok', 'warning', 'partial'):
            trend_info = traffic.get('trend') or {}
            metrics = trend_info.get('metrics') or []
            if metrics:
                lines.append('| 虚拟服务 | 指标 | 样本数 | 最新值 | 均值 | 峰值 |')
                lines.append('|---|---|---:|---:|---:|---:|')
                for metric in metrics:
                    latest = metric.get('latest')
                    mean = metric.get('mean')
                    max_value = metric.get('max')
                    latest_text = f"{latest:.1f}" if isinstance(latest, (int, float)) else "-"
                    mean_text = f"{mean:.1f}" if isinstance(mean, (int, float)) else "-"
                    max_text = f"{max_value:.1f}" if isinstance(max_value, (int, float)) else "-"
                    lines.append(
                        f"| {metric.get('vs', vs_label)} | {_metric_label(metric.get('metric'))} | "
                        f"{int(metric.get('sample_count', 0))} | {latest_text} | {mean_text} | {max_text} |"
                    )
                lines.append('')
            anomalies = traffic.get('anomalies', [])
            if anomalies:
                lines.append('| 虚拟服务 | 指标 | 时间 | 当前值 | 基线值 | 变化比例 |')
                lines.append('|---|---|---|---:|---:|---|')
                for a in anomalies:
                    ts_str = datetime.fromtimestamp(a['ts']).strftime('%m-%d %H:%M') if a.get('ts') else 'N/A'
                    baseline = a['baseline_mean']
                    value = a['value']
                    pct = ((value - baseline) / baseline * 100) if baseline != 0 else 0
                    change_label = f"{a['direction']} {abs(pct):.1f}%"
                    lines.append(f"| {a['vs']} | {_metric_label(a['metric'])} | {ts_str} | {value:.1f} | {baseline:.1f} | {change_label} |")
            else:
                lines.append(f'✅ {range_label} 内未检测到流量异常。')
            if traffic.get('status') == 'partial':
                errors = trend_info.get('errors') or []
                if errors:
                    lines.append('')
                    lines.append('⚠️ 部分虚拟服务或指标趋势获取失败：')
                    for error in errors[:5]:
                        lines.append(f'- {error}')
        elif traffic.get('status') == 'insufficient_data':
            if traffic.get('source') == 'sqlite':
                lines.append('⚠️ 已完成数据库查询，但历史样本不足，暂不输出趋势判断。')
                lines.append('ℹ️ 为避免误判，本次没有回退到实时 API 生成趋势结论。')
            elif traffic.get('source') == 'device_trend_api':
                lines.append('⚠️ 设备趋势 API 在该时间段内返回的有效样本不足，暂不输出趋势判断。')
            else:
                lines.append('⚠️ 历史样本不足，已回退到设备实时趋势。')
            raw_trends = traffic.get('raw_trends', [])
            if raw_trends:
                lines.append('')
                lines.append('**实时趋势参考**')
                lines.append('| 虚拟服务 | 指标 | 周期 | 均值 | 峰值 |')
                lines.append('|---|---|---|---:|---:|')
                for t in raw_trends:
                    lines.append(f"| {t['vs']} | {_metric_label(t['metric'])} | {t['trend']} | {t['mean']:.1f} | {t['max']:.1f} |")
            lines.append('')
            lines.append('⚠️ 当前样本不足，无法形成稳定的 3σ 趋势判断。')
        elif traffic.get('status') == 'error':
            lines.append(f'❌ 流量分析失败：{traffic.get("error", "未知错误")}')
        lines.append('')

    if show_state:
        lines.append('## 设备资源分析')
        if state.get('status') == 'error':
            lines.append(f'❌ 设备资源状态获取失败：{state.get("error", "未知错误")}')
        else:
            items = state.get('items', [])
            cpu_item = next((i for i in items if i.get('metric') == 'cpu'), None)
            mem_item = next((i for i in items if i.get('metric') == 'memory'), None)
            if cpu_item:
                lines.append(f"- CPU 使用率：{_level_badge(cpu_item.get('level'))}，当前 {cpu_item.get('value')}%")
            if mem_item:
                lines.append(f"- 内存使用率：{_level_badge(mem_item.get('level'))}，当前 {mem_item.get('value')}%")
            if not cpu_item and not mem_item:
                lines.append('- ℹ️ 设备未返回 CPU/内存使用率。')
            lines.append('')

            trend_info = state.get('trend', {})
            if trend_info:
                lines.append('**资源趋势**')
                lines.append('')
                if trend_info.get('range'):
                    lines.append(f"- 趋势窗口：{trend_info.get('range')}")
                if trend_info.get('step_time') is not None:
                    lines.append(f"- 采样粒度：{trend_info.get('step_time')} 秒")
                lines.append(f"- 数据样本：{trend_info.get('sample_count', 0)} 条")
                errors = trend_info.get('errors') or []
                if errors:
                    lines.append(f"- 采集状态：{trend_info.get('status', '-')}")
                    for error in errors:
                        lines.append(f"  - {error}")
                metrics = trend_info.get('metrics') or []
                if metrics:
                    lines.append('')
                    lines.append('| 指标 | 样本数 | 最新值 | 均值 | 峰值 |')
                    lines.append('|---|---:|---:|---:|---:|')
                    for metric in metrics:
                        latest = metric.get('latest')
                        mean = metric.get('mean')
                        max_value = metric.get('max')
                        latest_text = f"{latest:.1f}" if isinstance(latest, (int, float)) else '-'
                        mean_text = f"{mean:.1f}" if isinstance(mean, (int, float)) else '-'
                        max_text = f"{max_value:.1f}" if isinstance(max_value, (int, float)) else '-'
                        lines.append(
                            f"| {metric.get('label') or _metric_label(metric.get('metric'))} | "
                            f"{metric.get('sample_count', 0)} | {latest_text} | {mean_text} | {max_text} |"
                        )
                lines.append('')

            state_anomalies = state.get('anomalies', [])
            if state_anomalies:
                lines.append('**趋势异常检测**')
                lines.append('')
                lines.append('| 指标 | 时间 | 当前值 | 基线值 | 变化比例 |')
                lines.append('|---|---|---:|---:|---|')
                for a in state_anomalies:
                    ts_str = datetime.fromtimestamp(a['ts']).strftime('%m-%d %H:%M') if a.get('ts') else 'N/A'
                    baseline = a['baseline_mean']
                    value = a['value']
                    pct = ((value - baseline) / baseline * 100) if baseline != 0 else 0
                    change_label = f"{a['direction']} {abs(pct):.1f}%"
                    lines.append(f"| {_metric_label(a['metric'])} | {ts_str} | {value:.1f} | {baseline:.1f} | {change_label} |")
                lines.append('')

            non_ok = [i for i in items if i.get('level') not in ('ok', None)]
            if non_ok:
                lines.append('| 指标 | 当前值 | 风险 | 说明 |')
                lines.append('|---|---:|---|---|')
                for i in non_ok:
                    lines.append(f"| {_metric_label(i.get('metric'))} | {i.get('value', '-')} | {_level_badge(i.get('level'))} | {i.get('message', '-')} |")
            elif items:
                lines.append('✅ 资源阈值检查未发现异常。')

            disk = state.get('disk', {})
            disk_source = disk.get('source', 'none')
            if disk_source == 'none':
                lines.append('ℹ️ 磁盘：未提供巡检数据。')
            elif disk_source == 'error':
                lines.append('⚠️ 磁盘：巡检报告损坏。')
            elif disk_source == 'ad.json' and not disk.get('available'):
                lines.append('ℹ️ 磁盘：巡检报告不可用。')
            elif disk.get('available'):
                lines.append(f"✅ 磁盘：{disk.get('value', 'N/A')}")
        lines.append('')

    if show_logs:
        lines.append('## 日志线索')
        if logs.get('status') in ('ok', 'warning'):
            entries = logs.get('entries', [])
            levels = logs.get('levels') or []
            modules = logs.get('modules') or []
            log_type_display = logs.get('log_type_label') or log_type_label(str(logs.get('log_type', '') or ''))
            if logs.get('range'):
                lines.append(f"- 查询范围：{logs.get('range')}")
            if levels:
                lines.append(f"- 日志级别：{'、'.join(levels)}")
            if log_type_display:
                lines.append(f"- 日志类型：{log_type_display}")
            if modules:
                lines.append(f"- 日志模块：{'、'.join(modules)}")
            if 'total' in logs or 'shown' in logs:
                lines.append(f"- 输出数量：最新 {logs.get('shown', len(entries))} 条（上限 {logs.get('limit', 20)} 条）")
            if entries:
                lines.append('')
            if entries:
                lines.append('| 时间 | 级别 | 模块 | 详情 |')
                lines.append('|---|---|---|---|')
                for e in entries:
                    lines.append(f"| {_md_cell(_log_time_display(e))} | {_md_cell(e.get('level', ''))} | {_md_cell(e.get('module', ''))} | {_md_cell(e.get('detail', ''))} |")
            else:
                lines.append('ℹ️ 查询范围内未发现告警或错误日志。')
        elif logs.get('status') == 'no_anomaly':
            lines.append('✅ 未发现需关联日志的异常事件。')
        elif logs.get('status') == 'no_match':
            lines.append('ℹ️ 异常时间窗口附近未发现关联日志。')
        elif logs.get('status') == 'error':
            lines.append(f'❌ 日志查询失败：{logs.get("error", "未知错误")}')
        lines.append('')

    if show_conflicts:
        lines.append('## 地址冲突分析')
        if conflicts.get('status') == 'conflict_found':
            vs_overlaps = conflicts.get('vs_overlaps', [])
            if vs_overlaps:
                lines.append('**虚拟服务地址端口重叠**')
                lines.append('| 重叠地址 | 冲突虚拟服务 |')
                lines.append('|---|---|')
                for o in vs_overlaps:
                    names_list = o[0]
                    ip_port = o[1]
                    lines.append(f"| {ip_port} | {', '.join(names_list)} |")

            pool_overlaps = conflicts.get('pool_overlaps', [])
            if pool_overlaps:
                lines.append('')
                lines.append('**节点池成员重复**')
                lines.append('| 节点地址 | 所属节点池 |')
                lines.append('|---|---|')
                for o in pool_overlaps:
                    lines.append(f"| {o[0]} | {', '.join(o[1])} |")
        elif conflicts.get('status') == 'ok':
            lines.append('✅ 未发现虚拟服务地址端口重叠或节点池成员重复。')
        elif conflicts.get('status') == 'error':
            lines.append(f'❌ 冲突检测失败：{conflicts.get("error", "未知错误")}')
        lines.append('')

    lines.append('## 结论边界')
    lines.append('- 本结论只基于设备实时数据、历史基线和日志记录中能够确认的现象。')
    lines.append('- 未返回证据的根因、趋势或处置建议不会展开。')
    lines.append('')

    return '\n'.join(lines)


def _state_html_result(results: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize single-device or one-selected-device state results for HTML rendering."""
    if results.get("state"):
        return results
    nested = results.get("results")
    if isinstance(nested, dict):
        for item in nested.values():
            if isinstance(item, dict) and item.get("state"):
                return item
    return results


def _format_point_time(ts: Any) -> str:
    try:
        return datetime.fromtimestamp(int(ts)).strftime("%Y-%m-%d %H:%M:%S")
    except (TypeError, ValueError, OSError):
        return "-"


STATE_SVG_WIDTH = 920
STATE_SVG_HEIGHT = 380
STATE_SVG_PAD_LEFT = 104
STATE_SVG_PAD_RIGHT = 44
STATE_SVG_PAD_TOP = 26
STATE_SVG_PAD_BOTTOM = 92


def _svg_point_x(ts: int, x_min: int, x_max: int) -> float:
    span_x = max(1, x_max - x_min)
    return STATE_SVG_PAD_LEFT + (ts - x_min) / span_x * (STATE_SVG_WIDTH - STATE_SVG_PAD_LEFT - STATE_SVG_PAD_RIGHT)


def _svg_point_xy(ts: int, value: float, x_min: int, x_max: int, y_max: float) -> Tuple[float, float]:
    pad_top = STATE_SVG_PAD_TOP
    pad_bottom = STATE_SVG_PAD_BOTTOM
    safe_y_max = max(1.0, y_max)
    x = _svg_point_x(ts, x_min, x_max)
    y = STATE_SVG_HEIGHT - pad_bottom - (value / safe_y_max) * (STATE_SVG_HEIGHT - pad_top - pad_bottom)
    return x, y


def _svg_polyline(points: List[Dict[str, Any]], x_min: int, x_max: int, y_max: float, color: str) -> str:
    coords = []
    for point in points:
        try:
            ts = int(point["ts"])
            value = float(point["value"])
        except (KeyError, TypeError, ValueError):
            continue
        x, y = _svg_point_xy(ts, value, x_min, x_max, y_max)
        coords.append(f"{x:.1f},{y:.1f}")
    if len(coords) < 2:
        return ""
    return f'<polyline class="data-line" points="{" ".join(coords)}" fill="none" stroke="{color}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" />'


def _svg_value_anchor(x: float) -> str:
    if x <= STATE_SVG_PAD_LEFT + 18:
        return "start"
    if x >= STATE_SVG_WIDTH - STATE_SVG_PAD_RIGHT - 18:
        return "end"
    return "middle"


def _svg_value_y(y: float) -> float:
    if y <= STATE_SVG_PAD_TOP + 14:
        return y + 18
    return y - 10


def _svg_markers(
    points: List[Dict[str, Any]],
    x_min: int,
    x_max: int,
    y_max: float,
    color: str,
    label: str,
    show_value_labels: bool = False,
) -> List[str]:
    markers = []
    safe_label = html_lib.escape(label)
    for point in points:
        try:
            ts = int(point["ts"])
            value = float(point["value"])
        except (KeyError, TypeError, ValueError):
            continue
        x, y = _svg_point_xy(ts, value, x_min, x_max, y_max)
        title = html_lib.escape(f"{_format_point_time(ts)} / {label}: {value:.1f}")
        markers.append(
            f'<circle class="data-point" cx="{x:.1f}" cy="{y:.1f}" r="4.6" '
            f'fill="#fff" stroke="{color}" stroke-width="2.4" data-label="{safe_label}" data-value="{value:.1f}">'
            f"<title>{title}</title></circle>"
        )
        if show_value_labels:
            markers.append(
                f'<text class="point-value-label" x="{x:.1f}" y="{_svg_value_y(y):.1f}" '
                f'text-anchor="{_svg_value_anchor(x)}" fill="{color}">{value:.1f}</text>'
            )
    return markers


def _render_state_svg_grid(x_min: int, x_max: int, y_max: float) -> str:
    width = STATE_SVG_WIDTH
    height = STATE_SVG_HEIGHT
    pad_left = STATE_SVG_PAD_LEFT
    pad_right = STATE_SVG_PAD_RIGHT
    pad_top = STATE_SVG_PAD_TOP
    pad_bottom = STATE_SVG_PAD_BOTTOM
    plot_w = width - pad_left - pad_right
    plot_h = height - pad_top - pad_bottom
    safe_y_max = max(1.0, y_max)
    lines = [
        f'<rect x="{pad_left}" y="{pad_top}" width="{plot_w}" height="{plot_h}" rx="10" class="plot-bg" />',
    ]
    for idx in range(5):
        ratio = idx / 4
        y = height - pad_bottom - ratio * plot_h
        value = ratio * safe_y_max
        lines.append(f'<line x1="{pad_left}" y1="{y:.1f}" x2="{width - pad_right}" y2="{y:.1f}" class="grid" />')
        lines.append(f'<text x="{pad_left - 12}" y="{y + 4:.1f}" text-anchor="end" class="tick">{value:.1f}</text>')
    for idx in range(4):
        ratio = idx / 3 if idx else 0
        x = pad_left + ratio * plot_w
        lines.append(f'<line x1="{x:.1f}" y1="{pad_top}" x2="{x:.1f}" y2="{height - pad_bottom}" class="grid vertical" />')
    lines.extend([
        f'<line x1="{pad_left}" y1="{pad_top}" x2="{pad_left}" y2="{height - pad_bottom}" class="axis" />',
        f'<line x1="{pad_left}" y1="{height - pad_bottom}" x2="{width - pad_right}" y2="{height - pad_bottom}" class="axis" />',
    ])
    return "\n".join(lines)


def _format_point_time_label(ts: int, same_day: bool) -> str:
    try:
        dt = datetime.fromtimestamp(int(ts))
    except (TypeError, ValueError, OSError):
        return "-"
    return dt.strftime("%H:%M") if same_day else dt.strftime("%m-%d %H:%M")


def _render_point_time_labels(timestamps: List[int], x_min: int, x_max: int) -> List[str]:
    unique_ts = sorted({int(ts) for ts in timestamps})
    if not unique_ts:
        return []
    try:
        same_day = len({datetime.fromtimestamp(ts).date() for ts in unique_ts}) == 1
    except (TypeError, ValueError, OSError):
        same_day = True
    dense = len(unique_ts) > 10
    axis_y = STATE_SVG_HEIGHT - STATE_SVG_PAD_BOTTOM
    label_y = axis_y + (34 if dense else 24)
    tick_y2 = axis_y + (12 if dense else 8)
    lines: List[str] = []
    for ts in unique_ts:
        x = _svg_point_x(ts, x_min, x_max)
        label = html_lib.escape(_format_point_time_label(ts, same_day))
        lines.append(f'<line class="point-time-tick" x1="{x:.1f}" y1="{axis_y:.1f}" x2="{x:.1f}" y2="{tick_y2:.1f}" />')
        if dense:
            label_x = x
            lines.append(
                f'<text class="point-time-label" x="{label_x:.1f}" y="{label_y:.1f}" '
                f'text-anchor="end" transform="rotate(-58 {label_x:.1f} {label_y:.1f})">{label}</text>'
            )
        else:
            lines.append(
                f'<text class="point-time-label" x="{x:.1f}" y="{label_y:.1f}" '
                f'text-anchor="{_svg_value_anchor(x)}">{label}</text>'
            )
    return lines


def _parse_optional_time_bound(value: Any) -> Optional[int]:
    try:
        return _parse_time_bound(str(value)) if value else None
    except ValueError:
        return None


def _render_state_svg(metrics: List[Dict[str, Any]], from_time: str = "", to_time: str = "") -> str:
    all_points = [
        point
        for metric in metrics
        for point in metric.get("points", [])
        if isinstance(point, dict) and isinstance(point.get("ts"), int) and isinstance(point.get("value"), (int, float))
    ]
    if not all_points:
        return '<div class="empty">该时间段内没有可渲染的趋势点。</div>'

    data_x_min = min(int(point["ts"]) for point in all_points)
    data_x_max = max(int(point["ts"]) for point in all_points)
    from_ts = _parse_optional_time_bound(from_time)
    to_ts = _parse_optional_time_bound(to_time)
    x_min = min(data_x_min, from_ts) if from_ts is not None else data_x_min
    x_max = max(data_x_max, to_ts) if to_ts is not None else data_x_max
    y_max = max(float(point["value"]) for point in all_points)
    colors = ["#2563eb", "#16a34a", "#e11d48", "#9333ea"]
    polylines = []
    markers = []
    legends = []
    point_timestamps = [int(point["ts"]) for point in all_points]
    time_labels = _render_point_time_labels(point_timestamps, x_min, x_max)
    show_value_labels = len(set(point_timestamps)) <= 24 or len(all_points) <= 36
    for idx, metric in enumerate(metrics):
        color = colors[idx % len(colors)]
        points = metric.get("points", [])
        line = _svg_polyline(points, x_min, x_max, y_max, color)
        if line:
            polylines.append(line)
        label_raw = str(metric.get("label") or _metric_label(metric.get("metric")))
        label = html_lib.escape(label_raw)
        markers.extend(_svg_markers(points, x_min, x_max, y_max, color, label_raw, show_value_labels=show_value_labels))
        legends.append(f'<span class="legend-item"><i style="background:{color}"></i>{label}</span>')

    return "\n".join([
        f'<div class="legend">{"".join(legends)}</div>',
        f'<svg viewBox="0 0 {STATE_SVG_WIDTH} {STATE_SVG_HEIGHT}" role="img" aria-label="资源趋势折线图">',
        _render_state_svg_grid(x_min, x_max, y_max),
        *polylines,
        *markers,
        *time_labels,
        '</svg>',
    ])


def _render_state_points_table(metrics: List[Dict[str, Any]]) -> str:
    labels = [str(metric.get("label") or _metric_label(metric.get("metric"))) for metric in metrics]
    rows: Dict[int, Dict[str, float]] = {}
    for metric in metrics:
        label = str(metric.get("label") or _metric_label(metric.get("metric")))
        for point in metric.get("points", []):
            try:
                ts = int(point["ts"])
                value = float(point["value"])
            except (KeyError, TypeError, ValueError):
                continue
            rows.setdefault(ts, {})[label] = value
    if not rows:
        return ""

    header = "".join(f"<th>{html_lib.escape(label)}</th>" for label in labels)
    body = []
    for ts in sorted(rows):
        values = rows[ts]
        cells = []
        for label in labels:
            value = values.get(label)
            cells.append(f"<td>{value:.1f}</td>" if isinstance(value, (int, float)) else "<td>-</td>")
        body.append(f"<tr><td>{html_lib.escape(_format_point_time(ts))}</td>{''.join(cells)}</tr>")
    return "\n".join([
        "<table>",
        f"<thead><tr><th>时间</th>{header}</tr></thead>",
        f"<tbody>{''.join(body)}</tbody>",
        "</table>",
    ])


def render_state_trend_html(results: Dict[str, Any]) -> str:
    """Render the state trend as a self-contained HTML artifact."""
    result = _state_html_result(results)
    state = result.get("state", {}) if isinstance(result.get("state", {}), dict) else {}
    trend = state.get("trend", {}) if isinstance(state.get("trend", {}), dict) else {}
    metrics = trend.get("metrics") or []
    device = _display_device_ref(result.get("device") or result.get("_device") or result.get("host"))
    range_label = trend.get("range") or "-"
    query_range = trend.get("query_range") or trend.get("period") or "-"
    sample_count = trend.get("sample_count", 0)
    step_time = trend.get("step_time")

    summary_rows = []
    for metric in metrics:
        label = html_lib.escape(str(metric.get("label") or _metric_label(metric.get("metric"))))
        latest = metric.get("latest")
        mean = metric.get("mean")
        max_value = metric.get("max")
        latest_text = f"{latest:.1f}" if isinstance(latest, (int, float)) else "-"
        mean_text = f"{mean:.1f}" if isinstance(mean, (int, float)) else "-"
        max_text = f"{max_value:.1f}" if isinstance(max_value, (int, float)) else "-"
        summary_rows.append(
            "<tr>"
            f"<td>{label}</td>"
            f"<td>{int(metric.get('sample_count', 0))}</td>"
            f"<td>{latest_text}</td>"
            f"<td>{mean_text}</td>"
            f"<td>{max_text}</td>"
            "</tr>"
        )

    return "\n".join([
        "<!doctype html>",
        '<html lang="zh-CN">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        "<title>AD 设备资源趋势</title>",
        "<style>",
        ":root{--bg:#f4f7fb;--panel:#ffffff;--ink:#0f172a;--muted:#64748b;--border:#d8e2ef;--soft:#eef4fb}",
        "*{box-sizing:border-box}",
        "body{font-family:Arial,'Microsoft YaHei',sans-serif;margin:0;background:var(--bg);color:var(--ink)}",
        "main{max-width:1180px;margin:0 auto;padding:30px 28px 36px}",
        ".top{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}",
        "h1{font-size:28px;line-height:1.2;margin:0;font-weight:800;letter-spacing:0}",
        ".subtitle{color:var(--muted);font-size:13px;margin-top:6px}",
        ".meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:18px}",
        ".meta-card,.panel{background:var(--panel);border:1px solid var(--border);border-radius:8px;box-shadow:0 10px 24px rgba(15,23,42,.05)}",
        ".meta-card{padding:16px 18px;min-height:104px;display:flex;flex-direction:column;justify-content:space-between}",
        ".label{color:var(--muted);font-size:12px;margin-bottom:10px}",
        ".value{font-size:18px;font-weight:800;line-height:1.25;word-break:break-word}",
        ".panel{padding:18px;margin-top:16px}",
        ".panel h2{font-size:16px;line-height:1.25;margin:0 0 12px;font-weight:800}",
        "svg{width:100%;height:auto;display:block;background:#fff;border:1px solid var(--border);border-radius:8px}",
        ".plot-bg{fill:#fbfdff;stroke:#e2eaf5;stroke-width:1}",
        ".axis{stroke:#91a4bd;stroke-width:1.2}",
        ".grid{stroke:#e6edf6;stroke-width:1}",
        ".grid.vertical{stroke-dasharray:4 6}",
        ".tick{fill:#64748b;font-size:11px}",
        ".data-line{filter:drop-shadow(0 3px 4px rgba(15,23,42,.10))}",
        ".data-point{cursor:pointer;filter:drop-shadow(0 2px 3px rgba(15,23,42,.20));transition:stroke-width .16s ease}",
        ".data-point:hover{stroke-width:4}",
        ".point-value-label{font-size:10px;font-weight:800;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round;pointer-events:none}",
        ".point-time-tick{stroke:#c7d4e5;stroke-width:1}",
        ".point-time-label{font-size:9px;font-weight:700;fill:#475569;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round;pointer-events:none}",
        ".legend{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 14px}",
        ".legend-item{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#334155;background:#f8fbff;border:1px solid #dfe8f4;border-radius:999px;padding:6px 10px}",
        ".legend-item i{display:inline-block;width:12px;height:12px;border-radius:3px}",
        "table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border:1px solid var(--border);border-radius:8px;overflow:hidden}",
        "th,td{border-bottom:1px solid #e7edf5;padding:10px 12px;text-align:right;font-size:13px}",
        "tr:last-child td{border-bottom:0}",
        "th:first-child,td:first-child{text-align:left}",
        "th{background:#f0f5fb;color:#334155;font-weight:800}",
        ".empty{background:#fff;border:1px dashed #cbd5e1;border-radius:8px;padding:20px;color:#64748b}",
        "@media(max-width:720px){main{padding:20px 14px}.top{display:block}h1{font-size:24px}.value{font-size:16px}th,td{padding:8px 9px}}",
        "</style>",
        "</head>",
        "<body>",
        "<main>",
        '<div class="top"><div><h1>AD 设备资源趋势</h1><div class="subtitle">CPU、内存与新建速率的固定时间段趋势</div></div></div>',
        '<section class="meta">',
        f'<div class="meta-card"><div class="label">设备</div><div class="value">{html_lib.escape(str(device))}</div></div>',
        f'<div class="meta-card"><div class="label">时间范围</div><div class="value">{html_lib.escape(str(range_label))}</div></div>',
        f'<div class="meta-card"><div class="label">查询窗口</div><div class="value">{html_lib.escape(str(query_range))}</div></div>',
        f'<div class="meta-card"><div class="label">采样</div><div class="value">{sample_count} 条 / {html_lib.escape(str(step_time if step_time is not None else "-"))} 秒</div></div>',
        "</section>",
        '<section class="panel">',
        "<h2>趋势图</h2>",
        _render_state_svg(metrics, from_time=str(trend.get("from_time") or ""), to_time=str(trend.get("to_time") or "")),
        "</section>",
        '<section class="panel">',
        "<h2>指标摘要</h2>",
        "<table><thead><tr><th>指标</th><th>样本数</th><th>最新值</th><th>均值</th><th>峰值</th></tr></thead>",
        f"<tbody>{''.join(summary_rows)}</tbody></table>",
        "</section>",
        '<section class="panel">',
        "<h2>数据点</h2>",
        _render_state_points_table(metrics) or '<div class="empty">该时间段内没有数据点。</div>',
        "</section>",
        "</main>",
        "</body>",
        "</html>",
    ])


def write_state_trend_html(results: Dict[str, Any], output_path: str) -> str:
    """Write a state trend HTML artifact and return the absolute path."""
    if not output_path:
        return ""
    path = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as file:
        file.write(render_state_trend_html(results))
    return path


def _traffic_html_result(results: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize single-device or one-selected-device traffic results for HTML rendering."""
    if results.get("traffic"):
        return results
    nested = results.get("results")
    if isinstance(nested, dict):
        for item in nested.values():
            if isinstance(item, dict) and item.get("traffic"):
                return item
    return results


def _traffic_metric_xy(
    ts: int,
    value: float,
    x_min: int,
    x_max: int,
    y_max: float,
    panel_top: float,
    panel_height: float,
) -> Tuple[float, float]:
    safe_y_max = max(1.0, y_max)
    x = _svg_point_x(ts, x_min, x_max)
    y = panel_top + panel_height - (value / safe_y_max) * panel_height
    return x, y


def _traffic_svg_polyline(
    points: List[Dict[str, Any]],
    x_min: int,
    x_max: int,
    y_max: float,
    panel_top: float,
    panel_height: float,
    color: str,
) -> str:
    coords = []
    for point in points:
        try:
            ts = int(point["ts"])
            value = float(point["value"])
        except (KeyError, TypeError, ValueError):
            continue
        x, y = _traffic_metric_xy(ts, value, x_min, x_max, y_max, panel_top, panel_height)
        coords.append(f"{x:.1f},{y:.1f}")
    if len(coords) < 2:
        return ""
    return f'<polyline class="data-line" points="{" ".join(coords)}" fill="none" stroke="{color}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" />'


def _traffic_value_label_y(y: float, panel_top: float, panel_height: float) -> float:
    if y <= panel_top + 22:
        label_y = y + 18
    else:
        label_y = y - 10
    return min(max(label_y, panel_top + 12), panel_top + panel_height - 8)


def _traffic_svg_markers(
    points: List[Dict[str, Any]],
    x_min: int,
    x_max: int,
    y_max: float,
    panel_top: float,
    panel_height: float,
    color: str,
    label: str,
    show_value_labels: bool,
) -> List[str]:
    markers = []
    safe_label = html_lib.escape(label)
    for point in points:
        try:
            ts = int(point["ts"])
            value = float(point["value"])
        except (KeyError, TypeError, ValueError):
            continue
        x, y = _traffic_metric_xy(ts, value, x_min, x_max, y_max, panel_top, panel_height)
        title = html_lib.escape(f"{_format_point_time(ts)} / {label}: {value:.1f}")
        markers.append(
            f'<circle class="data-point" cx="{x:.1f}" cy="{y:.1f}" r="4.6" '
            f'fill="#fff" stroke="{color}" stroke-width="2.4" data-label="{safe_label}" data-value="{value:.1f}">'
            f"<title>{title}</title></circle>"
        )
        if show_value_labels:
            label_y = _traffic_value_label_y(y, panel_top, panel_height)
            markers.append(
                f'<text class="point-value-label" x="{x:.1f}" y="{label_y:.1f}" '
                f'text-anchor="{_svg_value_anchor(x)}" fill="{color}">{value:.1f}</text>'
            )
    return markers


def _render_traffic_time_labels(timestamps: List[int], x_min: int, x_max: int, axis_y: float) -> List[str]:
    unique_ts = sorted({int(ts) for ts in timestamps})
    if not unique_ts:
        return []
    try:
        same_day = len({datetime.fromtimestamp(ts).date() for ts in unique_ts}) == 1
    except (TypeError, ValueError, OSError):
        same_day = True
    dense = len(unique_ts) > 10
    label_y = axis_y + (34 if dense else 24)
    tick_y2 = axis_y + (12 if dense else 8)
    lines: List[str] = []
    for ts in unique_ts:
        x = _svg_point_x(ts, x_min, x_max)
        label = html_lib.escape(_format_point_time_label(ts, same_day))
        lines.append(f'<line class="point-time-tick" x1="{x:.1f}" y1="{axis_y:.1f}" x2="{x:.1f}" y2="{tick_y2:.1f}" />')
        if dense:
            lines.append(
                f'<text class="point-time-label" x="{x:.1f}" y="{label_y:.1f}" '
                f'text-anchor="end" transform="rotate(-58 {x:.1f} {label_y:.1f})">{label}</text>'
            )
        else:
            lines.append(
                f'<text class="point-time-label" x="{x:.1f}" y="{label_y:.1f}" '
                f'text-anchor="{_svg_value_anchor(x)}">{label}</text>'
            )
    return lines


def _render_traffic_svg(metrics: List[Dict[str, Any]], from_time: str = "", to_time: str = "") -> str:
    all_points = [
        point
        for metric in metrics
        for point in metric.get("points", [])
        if isinstance(point, dict) and isinstance(point.get("ts"), int) and isinstance(point.get("value"), (int, float))
    ]
    if not all_points:
        return '<div class="empty">\u8be5\u65f6\u95f4\u6bb5\u5185\u6ca1\u6709\u53ef\u6e32\u67d3\u7684\u8d8b\u52bf\u70b9\u3002</div>'

    data_x_min = min(int(point["ts"]) for point in all_points)
    data_x_max = max(int(point["ts"]) for point in all_points)
    from_ts = _parse_optional_time_bound(from_time)
    to_ts = _parse_optional_time_bound(to_time)
    x_min = min(data_x_min, from_ts) if from_ts is not None else data_x_min
    x_max = max(data_x_max, to_ts) if to_ts is not None else data_x_max
    colors = ["#2563eb", "#16a34a", "#e11d48", "#9333ea", "#0891b2", "#f97316"]
    panel_height = 128
    panel_gap = 48
    pad_top = 34
    pad_bottom = 86
    panel_count = max(1, len(metrics))
    svg_height = int(pad_top + panel_count * panel_height + (panel_count - 1) * panel_gap + pad_bottom)
    plot_w = STATE_SVG_WIDTH - STATE_SVG_PAD_LEFT - STATE_SVG_PAD_RIGHT
    lines: List[str] = []
    legends = []
    point_timestamps = [int(point["ts"]) for point in all_points]
    show_value_labels = len(set(point_timestamps)) <= 24 or len(all_points) <= 36

    for idx, metric in enumerate(metrics):
        color = colors[idx % len(colors)]
        points = [
            point
            for point in metric.get("points", [])
            if isinstance(point, dict) and isinstance(point.get("ts"), int) and isinstance(point.get("value"), (int, float))
        ]
        if not points:
            continue
        label_raw = str(metric.get("label") or _metric_label(metric.get("metric")))
        label = html_lib.escape(label_raw)
        panel_top = pad_top + idx * (panel_height + panel_gap)
        axis_y = panel_top + panel_height
        y_max = max(float(point["value"]) for point in points)
        legends.append(f'<span class="legend-item"><i style="background:{color}"></i>{label}</span>')
        lines.append(
            f'<rect x="{STATE_SVG_PAD_LEFT}" y="{panel_top:.1f}" width="{plot_w}" height="{panel_height}" rx="10" class="plot-bg" />'
        )
        lines.append(
            f'<text x="{STATE_SVG_PAD_LEFT}" y="{panel_top - 10:.1f}" text-anchor="start" class="metric-title" fill="{color}">{label}</text>'
        )
        for tick_idx in range(4):
            ratio = tick_idx / 3
            y = axis_y - ratio * panel_height
            value = ratio * max(1.0, y_max)
            lines.append(f'<line x1="{STATE_SVG_PAD_LEFT}" y1="{y:.1f}" x2="{STATE_SVG_WIDTH - STATE_SVG_PAD_RIGHT}" y2="{y:.1f}" class="grid" />')
            lines.append(f'<text x="{STATE_SVG_PAD_LEFT - 12}" y="{y + 4:.1f}" text-anchor="end" class="tick">{value:.1f}</text>')
        for grid_idx in range(4):
            ratio = grid_idx / 3 if grid_idx else 0
            x = STATE_SVG_PAD_LEFT + ratio * plot_w
            lines.append(f'<line x1="{x:.1f}" y1="{panel_top:.1f}" x2="{x:.1f}" y2="{axis_y:.1f}" class="grid vertical" />')
        lines.append(f'<line x1="{STATE_SVG_PAD_LEFT}" y1="{panel_top:.1f}" x2="{STATE_SVG_PAD_LEFT}" y2="{axis_y:.1f}" class="axis" />')
        lines.append(f'<line x1="{STATE_SVG_PAD_LEFT}" y1="{axis_y:.1f}" x2="{STATE_SVG_WIDTH - STATE_SVG_PAD_RIGHT}" y2="{axis_y:.1f}" class="axis" />')
        line = _traffic_svg_polyline(points, x_min, x_max, y_max, panel_top, panel_height, color)
        if line:
            lines.append(line)
        lines.extend(_traffic_svg_markers(points, x_min, x_max, y_max, panel_top, panel_height, color, label_raw, show_value_labels))

    time_axis_y = pad_top + (panel_count - 1) * (panel_height + panel_gap) + panel_height
    lines.extend(_render_traffic_time_labels(point_timestamps, x_min, x_max, time_axis_y))

    return "\n".join([
        f'<div class="legend">{"".join(legends)}</div>',
        f'<svg viewBox="0 0 {STATE_SVG_WIDTH} {svg_height}" role="img" aria-label="\u6d41\u91cf\u8d8b\u52bf\u5206\u9762\u6298\u7ebf\u56fe">',
        *lines,
        '</svg>',
    ])


def _render_traffic_trend_html_legacy(results: Dict[str, Any]) -> str:
    """Render the traffic trend as a self-contained HTML artifact."""
    result = _traffic_html_result(results)
    traffic = result.get("traffic", {}) if isinstance(result.get("traffic", {}), dict) else {}
    trend = traffic.get("trend", {}) if isinstance(traffic.get("trend", {}), dict) else {}
    state_like = {
        "device": result.get("device") or result.get("_device") or result.get("host"),
        "_scope": "state",
        "state": {
            "status": traffic.get("status", "ok"),
            "items": [],
            "disk": {"available": False, "value": None, "source": "none"},
            "anomalies": traffic.get("anomalies", []),
            "trend": trend,
        },
    }
    html = render_state_trend_html(state_like)
    replacements = {
        "AD 设备资源趋势": "AD 虚拟服务流量趋势",
        "CPU、内存与新建速率的固定时间段趋势": "虚拟服务连接数、新建速率与吞吐量趋势",
        "资源趋势折线图": "流量趋势折线图",
    }
    for old, new in replacements.items():
        html = html.replace(old, new)
    return html


def render_traffic_trend_html(results: Dict[str, Any]) -> str:
    """Render traffic trend metrics as faceted charts with independent Y axes."""
    result = _traffic_html_result(results)
    traffic = result.get("traffic", {}) if isinstance(result.get("traffic", {}), dict) else {}
    trend = traffic.get("trend", {}) if isinstance(traffic.get("trend", {}), dict) else {}
    metrics = trend.get("metrics") or []
    device = _display_device_ref(result.get("device") or result.get("_device") or result.get("host"))
    range_label = trend.get("range") or "-"
    query_range = trend.get("query_range") or trend.get("period") or "-"
    sample_count = trend.get("sample_count", 0)
    step_time = trend.get("step_time")

    summary_rows = []
    for metric in metrics:
        label = html_lib.escape(str(metric.get("label") or _metric_label(metric.get("metric"))))
        latest = metric.get("latest")
        mean = metric.get("mean")
        max_value = metric.get("max")
        latest_text = f"{latest:.1f}" if isinstance(latest, (int, float)) else "-"
        mean_text = f"{mean:.1f}" if isinstance(mean, (int, float)) else "-"
        max_text = f"{max_value:.1f}" if isinstance(max_value, (int, float)) else "-"
        summary_rows.append(
            "<tr>"
            f"<td>{label}</td>"
            f"<td>{int(metric.get('sample_count', 0))}</td>"
            f"<td>{latest_text}</td>"
            f"<td>{mean_text}</td>"
            f"<td>{max_text}</td>"
            "</tr>"
        )

    return "\n".join([
        "<!doctype html>",
        '<html lang="zh-CN">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        "<title>AD \u865a\u62df\u670d\u52a1\u6d41\u91cf\u8d8b\u52bf</title>",
        "<style>",
        ":root{--bg:#f4f7fb;--panel:#ffffff;--ink:#0f172a;--muted:#64748b;--border:#d8e2ef;--soft:#eef4fb}",
        "*{box-sizing:border-box}",
        "body{font-family:Arial,'Microsoft YaHei',sans-serif;margin:0;background:var(--bg);color:var(--ink)}",
        "main{max-width:1180px;margin:0 auto;padding:30px 28px 36px}",
        ".top{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}",
        "h1{font-size:28px;line-height:1.2;margin:0;font-weight:800;letter-spacing:0}",
        ".subtitle{color:var(--muted);font-size:13px;margin-top:6px}",
        ".meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:18px}",
        ".meta-card,.panel{background:var(--panel);border:1px solid var(--border);border-radius:8px;box-shadow:0 10px 24px rgba(15,23,42,.05)}",
        ".meta-card{padding:16px 18px;min-height:104px;display:flex;flex-direction:column;justify-content:space-between}",
        ".label{color:var(--muted);font-size:12px;margin-bottom:10px}",
        ".value{font-size:18px;font-weight:800;line-height:1.25;word-break:break-word}",
        ".panel{padding:18px;margin-top:16px}",
        ".panel h2{font-size:16px;line-height:1.25;margin:0 0 12px;font-weight:800}",
        "svg{width:100%;height:auto;display:block;background:#fff;border:1px solid var(--border);border-radius:8px}",
        ".plot-bg{fill:#fbfdff;stroke:#e2eaf5;stroke-width:1}",
        ".axis{stroke:#91a4bd;stroke-width:1.2}",
        ".grid{stroke:#e6edf6;stroke-width:1}",
        ".grid.vertical{stroke-dasharray:4 6}",
        ".tick{fill:#64748b;font-size:11px}",
        ".metric-title{font-size:13px;font-weight:800;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}",
        ".data-line{filter:drop-shadow(0 3px 4px rgba(15,23,42,.10))}",
        ".data-point{cursor:pointer;filter:drop-shadow(0 2px 3px rgba(15,23,42,.20));transition:stroke-width .16s ease}",
        ".data-point:hover{stroke-width:4}",
        ".point-value-label{font-size:10px;font-weight:800;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round;pointer-events:none}",
        ".point-time-tick{stroke:#c7d4e5;stroke-width:1}",
        ".point-time-label{font-size:9px;font-weight:700;fill:#475569;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round;pointer-events:none}",
        ".legend{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 14px}",
        ".legend-item{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#334155;background:#f8fbff;border:1px solid #dfe8f4;border-radius:999px;padding:6px 10px}",
        ".legend-item i{display:inline-block;width:12px;height:12px;border-radius:3px}",
        "table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border:1px solid var(--border);border-radius:8px;overflow:hidden}",
        "th,td{border-bottom:1px solid #e7edf5;padding:10px 12px;text-align:right;font-size:13px}",
        "tr:last-child td{border-bottom:0}",
        "th:first-child,td:first-child{text-align:left}",
        "th{background:#f0f5fb;color:#334155;font-weight:800}",
        ".empty{background:#fff;border:1px dashed #cbd5e1;border-radius:8px;padding:20px;color:#64748b}",
        "@media(max-width:720px){main{padding:20px 14px}.top{display:block}h1{font-size:24px}.value{font-size:16px}th,td{padding:8px 9px}}",
        "</style>",
        "</head>",
        "<body>",
        "<main>",
        '<div class="top"><div><h1>AD \u865a\u62df\u670d\u52a1\u6d41\u91cf\u8d8b\u52bf</h1><div class="subtitle">\u865a\u62df\u670d\u52a1\u8fde\u63a5\u6570\u3001\u65b0\u5efa\u901f\u7387\u4e0e\u541e\u5410\u91cf\u72ec\u7acb\u91cf\u7eb2\u8d8b\u52bf</div></div></div>',
        '<section class="meta">',
        f'<div class="meta-card"><div class="label">\u8bbe\u5907</div><div class="value">{html_lib.escape(str(device))}</div></div>',
        f'<div class="meta-card"><div class="label">\u65f6\u95f4\u8303\u56f4</div><div class="value">{html_lib.escape(str(range_label))}</div></div>',
        f'<div class="meta-card"><div class="label">\u67e5\u8be2\u7a97\u53e3</div><div class="value">{html_lib.escape(str(query_range))}</div></div>',
        f'<div class="meta-card"><div class="label">\u91c7\u6837</div><div class="value">{sample_count} \u6761 / {html_lib.escape(str(step_time if step_time is not None else "-"))} \u79d2</div></div>',
        "</section>",
        '<section class="panel">',
        "<h2>\u8d8b\u52bf\u56fe</h2>",
        _render_traffic_svg(metrics, from_time=str(trend.get("from_time") or ""), to_time=str(trend.get("to_time") or "")),
        "</section>",
        '<section class="panel">',
        "<h2>\u6307\u6807\u6458\u8981</h2>",
        "<table><thead><tr><th>\u6307\u6807</th><th>\u6837\u672c\u6570</th><th>\u6700\u65b0\u503c</th><th>\u5747\u503c</th><th>\u5cf0\u503c</th></tr></thead>",
        f"<tbody>{''.join(summary_rows)}</tbody></table>",
        "</section>",
        '<section class="panel">',
        "<h2>\u6570\u636e\u70b9</h2>",
        _render_state_points_table(metrics) or '<div class="empty">\u8be5\u65f6\u95f4\u6bb5\u5185\u6ca1\u6709\u6570\u636e\u70b9\u3002</div>',
        "</section>",
        "</main>",
        "</body>",
        "</html>",
    ])


def write_traffic_trend_html(results: Dict[str, Any], output_path: str) -> str:
    """Write a traffic trend HTML artifact and return the absolute path."""
    if not output_path:
        return ""
    path = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as file:
        file.write(render_traffic_trend_html(results))
    return path


def render_json(results: Dict[str, Any]) -> str:
    """将结果渲染为 JSON 字符串。"""
    return json.dumps(results, ensure_ascii=False, indent=2, default=str)


def _render_multi_markdown(
    results: Dict[str, Dict[str, Any]],
    title: str,
    renderer: Callable[[str, Dict[str, Any]], str],
) -> str:
    """Render one selected device as a clean final block; keep summaries only for true multi-device output."""
    if len(results) == 1:
        host, result = next(iter(results.items()))
        if "error" in result:
            return f"## {host}\n> 错误: {result['error']}"
        return renderer(host, result)

    lines = [render_multi_summary(results, title), "---"]
    for host, result in results.items():
        if "error" in result:
            lines.append(f"## {host}")
            lines.append(f"> 错误: {result['error']}")
        else:
            lines.append(renderer(host, result))
        lines.append("")
    return "\n".join(lines)


def _render_logs_multi_result(host: str, result: Dict[str, Any]) -> str:
    wrapped = {
        'device': result.get('host', host),
        'logs': {
            'status': result.get('status', 'ok'),
            'entries': result.get('entries', []),
            'total': result.get('total'),
            'shown': result.get('shown'),
            'limit': result.get('limit'),
            'range': result.get('range'),
            'levels': result.get('levels'),
            'modules': result.get('modules'),
            'log_type': result.get('log_type'),
            'log_type_label': result.get('log_type_label'),
        },
        '_scope': 'logs',
    }
    return render_markdown(wrapped)


def analyze_full(client: Any, db_path: Optional[str] = None, disk_source: Optional[str] = None) -> Dict[str, Any]:
    """
    全量分析: 运行全部 4 个维度并关联日志。

    返回字典，键为: device, traffic, state, logs, conflicts
    """
    result = {}

    # Traffic analysis
    try:
        traffic_result = traffic_analysis(client, db_path=db_path)
    except Exception as e:
        traffic_result = {'status': 'error', 'anomalies': [], 'error': str(e)}
    result['traffic'] = traffic_result

    # State analysis
    try:
        state_result = state_analysis(client, disk_source=disk_source, db_path=db_path)
    except Exception as e:
        state_result = {'status': 'error', 'items': [], 'error': str(e), 'disk': {'available': False, 'value': None, 'source': 'none'}}
    result['state'] = state_result

    # Log correlation (only if anomalies in traffic or state)
    all_anomalies = list(traffic_result.get('anomalies', []))
    # Merge state 3σ anomalies
    all_anomalies.extend(state_result.get('anomalies', []))
    # Merge state threshold issues (warn/critical) for log correlation
    state_issues = [i for i in state_result.get('items', []) if i.get('level') in ('warn', 'critical')]
    all_anomalies.extend(state_issues)
    if all_anomalies:
        try:
            log_result = log_correlation(client, all_anomalies)
        except Exception as e:
            log_result = {'status': 'error', 'entries': [], 'error': str(e)}
    else:
        log_result = {'status': 'no_anomaly', 'entries': []}
    result['logs'] = log_result

    # Conflict detection
    try:
        conflict_result = conflict_analysis(client)
    except Exception as e:
        conflict_result = {'status': 'error', 'vs_overlaps': [], 'pool_overlaps': [], 'error': str(e)}
    result['conflicts'] = conflict_result

    return result


def _compute_exit_code(results: Dict[str, Any]) -> int:
    """
    根据分析结果计算进程退出码。

    规则:
        0 = 全部成功
        1 = 所有数据源失败或连接失败
        2 = 认证失败
        4 = 参数错误 (此处暂未使用)
        5 = 部分失败 (部分通过，部分失败)
    """
    has_success = False
    has_failure = False
    all_fail = True

    for key in ('traffic', 'state', 'conflicts'):
        dim = results.get(key, {})
        if dim.get('status') in ('ok', 'warning', 'critical', 'partial', 'conflict_found', 'insufficient_data'):
            has_success = True
            all_fail = False
        elif dim.get('status') == 'error':
            has_failure = True

    if has_failure and not has_success:
        return 1  # all failed
    elif has_failure and has_success:
        return 5  # partial failure
    return 0  # all success


def _perception_result_failed(result: Dict[str, Any]) -> bool:
    """Return True when a run_multi result contains a scoped analysis failure."""
    if "error" in result:
        return True
    for key in ('traffic', 'state', 'conflicts', 'logs'):
        dim = result.get(key, {})
        if isinstance(dim, dict) and dim.get('status') == 'error':
            return True
    return False


def _compute_perception_multi_exit_code(results: Dict[str, Any]) -> int:
    """Multi-device exit code that respects nested perception status fields."""
    total = len(results)
    if total == 0:
        return 4
    failed_count = sum(1 for result in results.values() if _perception_result_failed(result))
    if failed_count == 0:
        return 0
    if failed_count == total:
        return 1
    return 7


def _analyze_one(client: Any, db_path: Optional[str] = None, disk_source: Optional[str] = None) -> Dict[str, Any]:
    """单设备分析，供 ThreadPoolExecutor 调用。"""
    result = analyze_full(client, db_path=db_path, disk_source=disk_source)
    result['device'] = client.host
    return result


def _traffic_one(
    client: Any,
    db_path: Optional[str] = None,
    vs_name: Optional[str] = None,
    days: int = 7,
    require_db: bool = False,
    trend: Optional[str] = "auto",
    from_time: str = "",
    to_time: str = "",
) -> Dict[str, Any]:
    traffic_result = traffic_analysis(
        client,
        db_path=db_path,
        vs_name=vs_name,
        days=days,
        require_db=require_db,
        trend=trend,
        from_time=from_time,
        to_time=to_time,
    )
    return {'device': client.host, 'traffic': traffic_result, '_scope': 'traffic'}


def _state_one(
    client: Any,
    db_path: Optional[str] = None,
    disk_source: Optional[str] = None,
    trend: Optional[str] = None,
    from_time: str = "",
    to_time: str = "",
) -> Dict[str, Any]:
    state_result = state_analysis(
        client,
        disk_source=disk_source,
        db_path=db_path,
        trend=trend,
        from_time=from_time,
        to_time=to_time,
    )
    return {'device': client.host, 'state': state_result, '_scope': 'state'}


def _conflict_one(client: Any) -> Dict[str, Any]:
    conflict_result = conflict_analysis(client)
    return {'device': client.host, 'conflicts': conflict_result, '_scope': 'conflict'}


def _logs_one(
    client: Any,
    limit: int = 20,
    from_time: str = "",
    to_time: str = "",
    levels: Optional[List[str]] = None,
    modules: Optional[List[str]] = None,
    log_type: str = "",
    range_label: str = "",
) -> Dict[str, Any]:
    """单设备日志获取，供 ThreadPoolExecutor / run_multi 调用。"""
    log_result = fetch_service_log_result(
        client,
        limit=limit,
        from_time=from_time,
        to_time=to_time,
        levels=levels,
        modules=modules,
        log_type=log_type,
        range_label=range_label,
    )
    return {'host': client.host, **log_result}


def main() -> None:
    """CLI 入口。"""
    sys.stdout.reconfigure(encoding='utf-8')
    # 公共参数：同时注册在父解析器和所有子命令上，LLM 无论放前放后都能解析
    def _add_common_args(p: argparse.ArgumentParser) -> None:
        p.add_argument("--host", default="", help="AD device URL (e.g. https://x.x.x.x)")
        p.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
        p.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
        p.add_argument("--device", default="", help="从 --devices 中选择单台设备名称，如 AD1")
        p.add_argument("--user", default="admin", help="Username (default: admin)")
        p.add_argument("--password", default="", help="Password (falls back to AD_PASS env var)")
        p.add_argument("--db", default="", help="SQLite database path")
        p.add_argument("--format", choices=["markdown", "json"], default="markdown", help="Output format")

    parser = argparse.ArgumentParser(description="AD Device Perception Analysis")
    _add_common_args(parser)
    subparsers = parser.add_subparsers(dest="command", help="Subcommand")

    analyze_p = subparsers.add_parser("analyze", help="Full analysis (default)")
    _add_common_args(analyze_p)
    analyze_p.add_argument("--disk-source", default="", help="Check report directory with ad.json")
    traffic_p = subparsers.add_parser("traffic", help="Flow anomaly detection")
    _add_common_args(traffic_p)
    traffic_p.add_argument("--vs", default="", help="VS name filter")
    traffic_p.add_argument("--days", type=int, default=7, help="Legacy SQLite history days when --require-db is used")
    traffic_p.add_argument(
        "--trend",
        choices=["auto", *TRAFFIC_TREND_OPTIONS.keys()],
        default="auto",
        help="VS traffic trend range: auto, last-hour, last-day, or last-month (default: auto)",
    )
    traffic_p.add_argument("--from-time", default="", help="开始时间，格式 YYYY-MM-DD HH:MM:SS")
    traffic_p.add_argument("--to-time", default="", help="结束时间，格式 YYYY-MM-DD HH:MM:SS")
    traffic_p.add_argument("--html-out", default="", help="Write an HTML traffic trend artifact to this path")
    traffic_p.add_argument("--require-db", action="store_true", help="Legacy mode: use SQLite history DB and disable device API trend")
    state_p = subparsers.add_parser("state", help="Device state anomaly detection")
    _add_common_args(state_p)
    state_p.add_argument("--disk-source", default="", help="Check report directory with ad.json")
    state_p.add_argument(
        "--trend",
        choices=["auto", *STATE_TREND_OPTIONS.keys()],
        default="auto",
        help="Device trend range: auto, last-hour, last-day, or last-month (default: auto)",
    )
    state_p.add_argument("--from-time", default="", help="开始时间，格式 YYYY-MM-DD HH:MM:SS")
    state_p.add_argument("--to-time", default="", help="结束时间，格式 YYYY-MM-DD HH:MM:SS")
    state_p.add_argument("--html-out", default="", help="Write an HTML trend artifact to this path")
    conflict_p = subparsers.add_parser("conflict", help="Address conflict detection")
    _add_common_args(conflict_p)
    logs_p = subparsers.add_parser("logs", help="服务日志查询")
    _add_common_args(logs_p)
    logs_p.add_argument("--limit", type=int, default=20, help="输出条数，上限20 (default: 20)")
    logs_p.add_argument("--days", type=int, default=0, help="最近 N 天日志；未指定时默认最近24小时")
    logs_p.add_argument("--hours", type=int, default=24, help="最近 N 小时日志 (default: 24)")
    logs_p.add_argument("--from-time", default="", help="开始时间，格式 YYYY-MM-DD HH:MM:SS")
    logs_p.add_argument("--to-time", default="", help="结束时间，格式 YYYY-MM-DD HH:MM:SS")
    logs_p.add_argument("--levels", default="ALERT,ERROR", help="逗号分隔日志级别 (default: ALERT,ERROR)")
    logs_p.add_argument("--modules", default="", help="逗号分隔日志模块/类型，如 ALARM,APPD,RS_DETECT")
    logs_p.add_argument("--log-type", "--type", dest="log_type", default="", help="日志语义类型，目前支持 address-conflict/地址冲突")

    args = parser.parse_args()
    cmd = args.command or "analyze"

    host = args.host
    user = args.user
    password = args.password or os.environ.get("AD_PASS", "")

    db_path = os.path.abspath(args.db) if args.db else None
    output_format = args.format

    def _log_options_from_args(a: argparse.Namespace) -> Dict[str, Any]:
        from_time, to_time, range_label = build_log_window(
            days=getattr(a, 'days', 0),
            hours=getattr(a, 'hours', 24),
            from_time=getattr(a, 'from_time', ''),
            to_time=getattr(a, 'to_time', ''),
        )
        return {
            'limit': _normalize_log_limit(getattr(a, 'limit', 20)),
            'from_time': from_time,
            'to_time': to_time,
            'levels': parse_log_levels(getattr(a, 'levels', 'ALERT,ERROR')),
            'modules': parse_log_modules(getattr(a, 'modules', '')),
            'log_type': normalize_log_type(getattr(a, 'log_type', '')),
            'range_label': range_label,
        }

    def _state_trend_from_args(a: argparse.Namespace) -> str:
        try:
            return select_state_trend(
                getattr(a, 'trend', 'auto'),
                from_time=getattr(a, 'from_time', ''),
                to_time=getattr(a, 'to_time', ''),
            )
        except ValueError as exc:
            print(f"错误: {exc}", file=sys.stderr)
            sys.exit(4)

    def _traffic_trend_from_args(a: argparse.Namespace) -> str:
        try:
            return select_traffic_trend(
                getattr(a, 'trend', 'auto'),
                from_time=getattr(a, 'from_time', ''),
                to_time=getattr(a, 'to_time', ''),
            )
        except ValueError as exc:
            print(f"错误: {exc}", file=sys.stderr)
            sys.exit(4)

    # Multi-device mode
    if args.hosts or args.devices:
        if args.host:
            print("警告: --hosts 和 --host 同时指定，--host 将被忽略", file=sys.stderr)
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, args.password)
        else:
            devices = load_devices_json(args.devices, args.device)

        if not devices:
            print("错误: 设备列表为空", file=sys.stderr)
            sys.exit(4)

        if cmd == "logs":
            log_options = _log_options_from_args(args)
            results = run_multi(devices, _logs_one, **log_options)

            if output_format == "json":
                output = {
                    "mode": "multi",
                    "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v),
                               "failed": sum(1 for v in results.values() if "error" in v)},
                    "results": results,
                }
                print(render_json(output))
            else:
                print(_render_multi_markdown(results, "AD 服务日志 — 多设备", _render_logs_multi_result))
            sys.exit(_compute_perception_multi_exit_code(results))
        elif cmd == "traffic":
            vs_name = args.vs if hasattr(args, 'vs') and args.vs else None
            selected_trend = getattr(args, 'trend', 'auto')
            if not getattr(args, 'require_db', False):
                selected_trend = _traffic_trend_from_args(args)
            results = run_multi(
                devices,
                _traffic_one,
                db_path=db_path,
                vs_name=vs_name,
                days=getattr(args, 'days', 7),
                require_db=getattr(args, 'require_db', False),
                trend=selected_trend,
                from_time=getattr(args, 'from_time', ''),
                to_time=getattr(args, 'to_time', ''),
            )

            if output_format == "json":
                output = {
                    "mode": "multi",
                    "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v),
                               "failed": sum(1 for v in results.values() if "error" in v)},
                    "results": results,
                }
                if getattr(args, 'html_out', ''):
                    html_path = write_traffic_trend_html(output, getattr(args, 'html_out', ''))
                    print(f"[artifact] HTML written: {html_path}", file=sys.stderr)
                print(render_json(output))
            else:
                rendered = _render_multi_markdown(results, "AD 流量趋势分析 — 多设备", lambda _host, result: render_markdown(result))
                if getattr(args, 'html_out', ''):
                    html_path = write_traffic_trend_html({"mode": "multi", "results": results}, getattr(args, 'html_out', ''))
                    print(f"[artifact] HTML written: {html_path}", file=sys.stderr)
                print(rendered)
            sys.exit(_compute_perception_multi_exit_code(results))
        elif cmd == "state":
            disk_src = args.disk_source if hasattr(args, 'disk_source') and args.disk_source else None
            selected_trend = _state_trend_from_args(args)
            results = run_multi(
                devices,
                _state_one,
                db_path=db_path,
                disk_source=disk_src,
                trend=selected_trend,
                from_time=getattr(args, 'from_time', ''),
                to_time=getattr(args, 'to_time', ''),
            )

            if output_format == "json":
                output = {
                    "mode": "multi",
                    "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v),
                               "failed": sum(1 for v in results.values() if "error" in v)},
                    "results": results,
                }
                if getattr(args, 'html_out', ''):
                    html_path = write_state_trend_html(output, getattr(args, 'html_out', ''))
                    print(f"[artifact] HTML written: {html_path}", file=sys.stderr)
                print(render_json(output))
            else:
                rendered = _render_multi_markdown(results, "AD 设备资源分析 — 多设备", lambda _host, result: render_markdown(result))
                if getattr(args, 'html_out', ''):
                    html_path = write_state_trend_html({"mode": "multi", "results": results}, getattr(args, 'html_out', ''))
                    print(f"[artifact] HTML written: {html_path}", file=sys.stderr)
                print(rendered)
            sys.exit(_compute_perception_multi_exit_code(results))
        elif cmd == "conflict":
            results = run_multi(devices, _conflict_one)

            if output_format == "json":
                output = {
                    "mode": "multi",
                    "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v),
                               "failed": sum(1 for v in results.values() if "error" in v)},
                    "results": results,
                }
                print(render_json(output))
            else:
                print(_render_multi_markdown(results, "AD 地址冲突分析 — 多设备", lambda _host, result: render_markdown(result)))
            sys.exit(_compute_perception_multi_exit_code(results))
        else:
            disk_src = args.disk_source if hasattr(args, 'disk_source') and args.disk_source else None
            results = run_multi(devices, _analyze_one, db_path=db_path, disk_source=disk_src)

            if output_format == "json":
                output = {
                    "mode": "multi",
                    "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v),
                               "failed": sum(1 for v in results.values() if "error" in v)},
                    "results": results,
                }
                print(render_json(output))
            else:
                print(_render_multi_markdown(results, "AD 感知分析报告 — 多设备", lambda _host, result: render_markdown(result)))
            sys.exit(_compute_perception_multi_exit_code(results))

    # Single-device mode
    if not host:
        print("错误: 未指定设备地址，请使用 --host 指定 AD 设备 URL", file=sys.stderr)
        sys.exit(4)
    if not password:
        print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
        sys.exit(4)

    try:
        client = ADClient(host=host, username=user, password=password)

        if cmd == "traffic":
            vs_name = args.vs if hasattr(args, 'vs') and args.vs else None
            selected_trend = getattr(args, 'trend', 'auto')
            if not getattr(args, 'require_db', False):
                selected_trend = _traffic_trend_from_args(args)
            traffic_result = traffic_analysis(
                client,
                db_path=db_path,
                vs_name=vs_name,
                days=getattr(args, 'days', 7),
                require_db=getattr(args, 'require_db', False),
                trend=selected_trend,
                from_time=getattr(args, 'from_time', ''),
                to_time=getattr(args, 'to_time', ''),
            )
            result = {'device': host, 'traffic': traffic_result, '_scope': 'traffic'}
            if getattr(args, 'html_out', ''):
                html_path = write_traffic_trend_html(result, getattr(args, 'html_out', ''))
                print(f"[artifact] HTML written: {html_path}", file=sys.stderr)
            _print_result(result, output_format)
            sys.exit(0 if traffic_result.get('status') != 'error' else 1)

        elif cmd == "state":
            disk_source = args.disk_source if hasattr(args, 'disk_source') and args.disk_source else None
            selected_trend = _state_trend_from_args(args)
            state_result = state_analysis(
                client,
                disk_source=disk_source,
                db_path=db_path,
                trend=selected_trend,
                from_time=getattr(args, 'from_time', ''),
                to_time=getattr(args, 'to_time', ''),
            )
            result = {'device': host, 'state': state_result, '_scope': 'state'}
            if getattr(args, 'html_out', ''):
                html_path = write_state_trend_html(result, getattr(args, 'html_out', ''))
                print(f"[artifact] HTML written: {html_path}", file=sys.stderr)
            _print_result(result, output_format)
            sys.exit(0 if state_result.get('status') != 'error' else 1)

        elif cmd == "conflict":
            conflict_result = conflict_analysis(client)
            result = {'device': host, 'conflicts': conflict_result, '_scope': 'conflict'}
            _print_result(result, output_format)
            sys.exit(0 if conflict_result.get('status') != 'error' else 1)

        elif cmd == "logs":
            log_options = _log_options_from_args(args)
            log_result = fetch_service_log_result(client, **log_options)
            if output_format == "json":
                result = {'host': host, **log_result}
                print(render_json(result))
            else:
                result = {'device': host, 'logs': log_result, '_scope': 'logs'}
                print(render_markdown(result))
            sys.exit(0)

        else:
            # analyze (full)
            result = analyze_full(client, db_path=db_path, disk_source=args.disk_source if hasattr(args, 'disk_source') and args.disk_source else None)
            result['device'] = host
            exit_code = _compute_exit_code(result)
            _print_result(result, output_format)
            sys.exit(exit_code)

    except ADAuthError as e:
        print(f"认证失败: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


def _print_result(result: Dict[str, Any], output_format: str) -> None:
    """以指定格式输出分析结果。"""
    if output_format == "json":
        print(render_json(result))
    else:
        # For full analysis results, use markdown
        print(render_markdown(result))


if __name__ == "__main__":
    main()
