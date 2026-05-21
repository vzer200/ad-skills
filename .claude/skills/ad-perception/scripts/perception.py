#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AD Device Perception Analysis CLI
Analyzes traffic anomalies (3σ), device state (thresholds),
address conflicts (IP:Port overlaps), and correlates logs.
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
    from ad_api import ADClient
except ImportError as e:
    print(f"错误: 无法导入 ad_api: {e}", file=sys.stderr)
    sys.exit(9)
from db_schema import VS_SAMPLES_DDL, COLUMNS
from multi_device import (
    run_multi, parse_hosts_arg, load_devices_json,
    compute_multi_exit_code, render_multi_summary, host_slug,
)

import argparse
import json
import math
import statistics
import sqlite3
from datetime import datetime, timedelta


def detect_anomaly_3sigma(points, window_seconds=21600, z_threshold=3, min_window=30):
    """
    Run 3σ anomaly detection on a sorted time series.

    Args:
        points: list of dicts with 'ts' (int) and 'value' (float), sorted by ts ascending
        window_seconds: lookback window in seconds (default 6h)
        z_threshold: z-score threshold (default 3)
        min_window: minimum number of valid points in window to compute stats

    Returns:
        list of anomaly dicts: {ts, value, baseline_mean, z, direction}
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


def query_traffic_db(db_path, vs_name=None, days=7):
    """
    Query SQLite for traffic data.

    Args:
        db_path: path to SQLite database
        vs_name: optional VS name filter
        days: lookback days (default 7)

    Returns:
        list of dicts [{'ts': int, 'vs_name': str, 'metric': str, 'value': float}, ...]
        or None if db_path doesn't exist or error
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


def _run_3sigma_on_vs_group(points_by_vs_metric):
    """
    Run 3σ per (VS, metric) group.

    Args:
        points_by_vs_metric: dict keyed by (vs_name, metric) with list of point dicts

    Returns:
        list of anomaly dicts
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


def _fetch_vs_names(client):
    """Get all VS names from the device."""
    try:
        data = client.get_virtual_services()
        return [item.get('name', '') for item in data.get('items', []) if item.get('name')]
    except Exception:
        return []


def _fetch_trend_raw(client, vs_name, trend="last-hour"):
    """Fetch raw trend data for a VS and trend period."""
    try:
        data = client.get_vs_trend_by_name(vs_name, trend=trend)
        return data
    except Exception:
        return None


def _build_metric_tables_from_trend(trends_by_vs):
    """
    Build metric summary tables from raw API trend data.
    Only includes metrics where max/mean >= 2.
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


def _extract_metric_values(item):
    """Extract numeric values from a trend API item dict.

    Trend API returns flat arrays: {"name": "connection_rate", "values": [1340, ...]}
    """
    vals = item.get('values', [])
    if not isinstance(vals, list):
        return []
    return [float(v) for v in vals if isinstance(v, (int, float)) and math.isfinite(v)]


def traffic_analysis(client, db_path=None, vs_name=None):
    """
    Traffic analysis: try SQLite first, fall back to API.

    Returns dict with:
        status: 'ok' | 'insufficient_data' | 'error'
        anomalies: list of anomaly dicts (when status == 'ok')
        error: str or None
    """
    result = {'status': 'ok', 'anomalies': [], 'error': None, 'source': 'sqlite'}

    # Auto-derive DB path from client host if not explicitly provided
    if not db_path and client is not None and hasattr(client, 'host'):
        host = client.host
        if isinstance(host, str):
            import re
            safe = re.sub(r'[^a-zA-Z0-9._-]', '_', host)
            db_path = f"vs_samples_{safe}.db"

    # Try SQLite
    rows = None
    if db_path and os.path.isfile(db_path):
        rows = query_traffic_db(db_path, vs_name)

    if rows is not None and len(rows) >= 100:
        # Enough data for 3σ analysis
        # Group by (vs_name, metric)
        groups = {}
        for row in rows:
            key = (row['vs_name'], row['metric'])
            if key not in groups:
                groups[key] = []
            groups[key].append(row)

        anomalies = _run_3sigma_on_vs_group(groups)
        result['anomalies'] = anomalies
        result['source'] = 'sqlite'
    else:
        # Injection branch: try to seed SQLite with trend API last-hour data
        if client is not None and db_path:
            try:
                from collector import collect_once
            except ImportError:
                pass
            else:
                injected = collect_once(client, db_path)
                if injected > 0:
                    rows = query_traffic_db(db_path, vs_name)
                    if rows is not None and len(rows) >= 100:
                        groups = {}
                        for row in rows:
                            key = (row['vs_name'], row['metric'])
                            if key not in groups:
                                groups[key] = []
                            groups[key].append(row)
                        anomalies = _run_3sigma_on_vs_group(groups)
                        result['anomalies'] = anomalies
                        result['source'] = 'sqlite_injected'
                        return result

        # API fallback - insufficient data
        result['status'] = 'insufficient_data'
        result['source'] = 'api_fallback'

        vs_names = [vs_name] if vs_name else _fetch_vs_names(client)
        if not vs_names:
            return result

        trends_by_vs = {}
        for vn in vs_names:
            trends = {}
            for trend_period in ('last-hour', 'last-day', 'last-month'):
                trends[trend_period] = _fetch_trend_raw(client, vn, trend_period)
            trends_by_vs[vn] = trends

        result['raw_trends'] = _build_metric_tables_from_trend(trends_by_vs)

        # If API fallback returned no data, mark as error
        if not result['raw_trends']:
            result['status'] = 'error'
            result['error'] = '数据库和 API 均无法获取流量数据'

    return result


def state_analysis(client, disk_source=None):
    """
    Device state anomaly detection.

    Checks CPU, memory, fan, power, interface status from API,
    and optionally disk from local check report.

    Returns dict with:
        status: 'ok' | 'warning' | 'critical' | 'error'
        items: list of metric dicts {metric, value, level, message}
        disk: dict with availability info
    """
    items = []
    has_warn = False
    has_critical = False
    disk_info = {'available': False, 'value': None, 'source': 'none'}

    try:
        sys_data = client.get_sys_system()
    except Exception as e:
        return {
            'status': 'error',
            'items': [{'metric': 'system', 'value': None, 'level': 'error', 'message': str(e)}],
            'disk': disk_info,
        }

    # Helper to extract value from API dict {"value": N, ...} or raw number
    def _val(field, default=0):
        if isinstance(field, dict):
            return field.get('value', default)
        return field if field is not None else default

    # CPU check
    cpu = _val(sys_data.get('cpu_usage'))
    if cpu >= 90:
        level = 'critical'
        has_critical = True
    elif cpu >= 80:
        level = 'warn'
        has_warn = True
    else:
        level = 'ok'
    items.append({'metric': 'cpu', 'value': cpu, 'level': level,
                  'message': f'CPU 使用率: {cpu}%'})

    # Memory check
    mem = _val(sys_data.get('memory_usage'))
    if mem >= 90:
        level = 'critical'
        has_critical = True
    elif mem >= 80:
        level = 'warn'
        has_warn = True
    else:
        level = 'ok'
    items.append({'metric': 'memory', 'value': mem, 'level': level,
                  'message': f'内存使用率: {mem}%'})

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

    # Determine overall status
    if has_critical:
        status = 'critical'
    elif has_warn:
        status = 'warning'
    else:
        status = 'ok'

    return {'status': status, 'items': items, 'disk': disk_info}


def conflict_analysis(client):
    """
    Address conflict detection.

    Detects:
    1. VS IP:Port overlap (Cartesian product of vips x vports)
    2. Pool node overlap (same ip:port in different pools)

    Returns dict with:
        status: 'ok' | 'conflict_found' | 'error'
        vs_overlaps: list of [vs_a, vs_b, ip:port]
        pool_overlaps: list of [ip:port, [pool_a, pool_b]]
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
            vport = vs.get('vport', '')
            if not vips or not vport:
                continue
            for vip in vips:
                key = (vip, str(vport))
                if key not in vs_map:
                    vs_map[key] = []
                if name not in vs_map[key]:
                    vs_map[key].append(name)

        for (ip, port), names in vs_map.items():
            if len(names) > 1:
                result['vs_overlaps'].append([names[0], names[1], f'{ip}:{port}'])

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


def log_correlation(client, anomalies, limit=20):
    """
    Log correlation around anomaly timestamps.

    Only runs if anomalies exist. Queries service logs and matches
    entries within ±5 minutes of anomaly timestamps.

    Returns dict with:
        status: 'ok' | 'no_anomaly' | 'no_match' | 'error'
        entries: list of matching log entries
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


def fetch_service_logs(client, limit=50):
    """
    Fetch service logs from the device.

    Args:
        client: ADClient instance
        limit: maximum number of log entries to return

    Returns:
        list of log entry dicts sorted by date+time descending
    """
    data = client.get_service_log(limit=limit)
    if not isinstance(data, dict):
        return []
    items = data.get('items', [])
    return items


def render_logs_markdown(entries, host):
    """
    Render service log entries as a markdown table.

    This is a NEW independent function — do NOT modify existing render_markdown().

    Args:
        entries: list of log entry dicts [{date, time, level, module, detail, log_id}, ...]
        host: device host URL

    Returns:
        markdown string
    """
    lines = [f'## 服务日志 ({host})']
    lines.append('| 时间 | 级别 | 模块 | 详情 |')
    lines.append('|---|---|---|---|')
    for e in entries:
        date_str = e.get('date', '')
        time_str = e.get('time', '')
        time_display = f'{date_str} {time_str}' if date_str and time_str else ''
        lines.append(
            f"| {time_display} | {e.get('level', '')} | {e.get('module', '')} | {e.get('detail', '')} |"
        )
    return '\n'.join(lines)


def render_markdown(results):
    """Render results as markdown string."""
    lines = []

    # Device header
    device = results.get('device', '')
    if not device:
        device = results.get('_device', 'Unknown')
    lines.append(f'# AD 感知分析报告')
    lines.append(f'**设备**: {device}')
    lines.append('')

    # Traffic section
    traffic = results.get('traffic', {})
    lines.append('## 流量分析')
    if traffic.get('status') == 'ok':
        anomalies = traffic.get('anomalies', [])
        if anomalies:
            lines.append('| VS | 指标 | 时间 | 当前值 | 正常范围 | 偏离幅度 | 方向 | 严重程度 |')
            lines.append('|---|---|---|---|---|---|---|---|')
            for a in anomalies:
                from datetime import datetime
                ts_str = datetime.fromtimestamp(a['ts']).strftime('%m-%d %H:%M') if a.get('ts') else 'N/A'
                baseline = a['baseline_mean']
                value = a['value']
                pct = ((value - baseline) / baseline * 100) if baseline != 0 else 0
                z = a['z']
                if z > 10:
                    severity = '🔴 严重'
                elif z > 5:
                    severity = '🟡 明显'
                else:
                    severity = '🟠 轻微'
                lines.append(f"| {a['vs']} | {a['metric']} | {ts_str} | {value:.1f} | {baseline:.1f} | {pct:+.1f}% | {a['direction']} | {severity} |")
        else:
            lines.append('✅ 过去 7 天内未检测到流量异常。')
    elif traffic.get('status') == 'insufficient_data':
        lines.append('⚠️ 数据库数据不足，回退到 API 实时趋势查询。')
        raw_trends = traffic.get('raw_trends', [])
        if raw_trends:
            lines.append('')
            lines.append('**API 原始趋势数据:**')
            lines.append('| VS | 指标 | 趋势周期 | 均值 | 最大值 |')
            lines.append('|---|---|---|---|---|')
            for t in raw_trends:
                lines.append(f"| {t['vs']} | {t['metric']} | {t['trend']} | {t['mean']:.1f} | {t['max']:.1f} |")
        lines.append('')
        lines.append('⚠️ 数据不足，无法进行 3σ 异常检测。')
    elif traffic.get('status') == 'error':
        lines.append(f'❌ 流量分析失败: {traffic.get("error", "未知错误")}')
    lines.append('')

    # State section
    state = results.get('state', {})
    lines.append('## 设备状态')
    if state.get('status') == 'error':
        lines.append(f'❌ 设备状态获取失败: {state.get("error", "未知错误")}')
    else:
        items = state.get('items', [])
        # Check if all ok
        # Show OK summary line first
        cpu_item = next((i for i in items if i['metric'] == 'cpu'), None)
        mem_item = next((i for i in items if i['metric'] == 'memory'), None)
        cpu_val = cpu_item['value'] if cpu_item else '?'
        mem_val = mem_item['value'] if mem_item else '?'
        lines.append(f'CPU: {cpu_val}%, 内存: {mem_val}%')
        lines.append('')

        non_ok = [i for i in items if i.get('level') not in ('ok', None)]
        if non_ok:
            lines.append('| 指标 | 当前值 | 级别 | 描述 |')
            lines.append('|---|---|---|---|')
            for i in non_ok:
                level_icon = {'warn': '⚠️', 'critical': '🔴'}.get(i['level'], '')
                lines.append(f"| {i['metric']} | {i['value']} | {level_icon} {i['level']} | {i['message']} |")

        disk = state.get('disk', {})
        disk_source = disk.get('source', 'none')
        if disk_source == 'none':
            lines.append('磁盘: 未提供巡检数据')
        elif disk_source == 'error':
            lines.append('磁盘: 巡检报告损坏')
        elif disk_source == 'ad.json' and not disk.get('available'):
            lines.append('磁盘: 巡检报告不可用')
        elif disk.get('available'):
            lines.append(f"磁盘: {disk.get('value', 'N/A')}")
    lines.append('')

    # Logs section — only show if there are anomalies to correlate
    logs = results.get('logs', {})
    if logs and logs.get('status') not in ('no_anomaly', None):
        lines.append('## 日志关联')
        if logs.get('status') == 'ok':
            entries = logs.get('entries', [])
            if entries:
                lines.append('| 时间 | 级别 | 模块 | 详情 |')
                lines.append('|---|---|---|---|')
                for e in entries:
                    lines.append(f"| {e.get('time', '')} | {e.get('level', '')} | {e.get('module', '')} | {e.get('detail', '')} |")
            else:
                lines.append('未在异常时间点附近找到关联日志条目。')
        elif logs.get('status') == 'no_match':
            lines.append('未在异常时间点附近找到关联日志条目。')
        elif logs.get('status') == 'error':
            lines.append(f'❌ 日志查询失败: {logs.get("error", "未知错误")}')
        lines.append('')

    # Conflicts section
    conflicts = results.get('conflicts', {})
    lines.append('## 地址冲突')
    if conflicts.get('status') == 'conflict_found':
        vs_overlaps = conflicts.get('vs_overlaps', [])
        if vs_overlaps:
            lines.append('**VS IP:Port 重叠:**')
            lines.append('| VS A | VS B | 重叠地址 |')
            lines.append('|---|---|---|')
            for o in vs_overlaps:
                lines.append(f"| {o[0]} | {o[1]} | {o[2]} |")

        pool_overlaps = conflicts.get('pool_overlaps', [])
        if pool_overlaps:
            lines.append('')
            lines.append('**Pool 节点重复:**')
            lines.append('| 节点地址 | 所属 Pool |')
            lines.append('|---|---|')
            for o in pool_overlaps:
                lines.append(f"| {o[0]} | {', '.join(o[1])} |")
    elif conflicts.get('status') == 'ok':
        lines.append('✅ 未发现 VS IP:Port 重叠或 Pool 节点重复。')
    elif conflicts.get('status') == 'error':
        lines.append(f'❌ 冲突检测失败: {conflicts.get("error", "未知错误")}')
    lines.append('')

    return '\n'.join(lines)


def render_json(results):
    """Render results as JSON string."""
    return json.dumps(results, ensure_ascii=False, indent=2, default=str)


def analyze_full(client, db_path=None, disk_source=None):
    """
    Full analysis: runs all 4 dimensions and correlates logs.

    Returns dict with keys: device, traffic, state, logs, conflicts
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
        state_result = state_analysis(client, disk_source=disk_source)
    except Exception as e:
        state_result = {'status': 'error', 'items': [], 'error': str(e), 'disk': {'available': False, 'value': None, 'source': 'none'}}
    result['state'] = state_result

    # Log correlation (only if anomalies in traffic or state)
    all_anomalies = list(traffic_result.get('anomalies', []))
    state_issues = [i for i in state_result.get('items', []) if i.get('level') in ('warn', 'critical')]
    if all_anomalies or state_issues:
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


def _compute_exit_code(results):
    """
    Compute process exit code based on analysis results.

    Rules:
        0 = all success
        1 = all data sources fail, or connection failure
        2 = auth failure
        4 = parameter error (not currently used here)
        5 = partial failure (some pass, some fail)
    """
    has_success = False
    has_failure = False
    all_fail = True

    for key in ('traffic', 'state', 'conflicts'):
        dim = results.get(key, {})
        if dim.get('status') in ('ok', 'warning', 'critical', 'conflict_found', 'insufficient_data'):
            has_success = True
            all_fail = False
        elif dim.get('status') == 'error':
            has_failure = True

    if has_failure and not has_success:
        return 1  # all failed
    elif has_failure and has_success:
        return 5  # partial failure
    return 0  # all success


def _analyze_one(client, db_path=None, disk_source=None):
    """Single-device analysis for ThreadPoolExecutor."""
    result = analyze_full(client, db_path=db_path, disk_source=disk_source)
    result['device'] = client.host
    return result


def _logs_one(client, limit=50):
    """Single-device log fetcher for ThreadPoolExecutor / run_multi."""
    entries = fetch_service_logs(client, limit=limit)
    return {
        'host': client.host,
        'entries': entries,
        'total': len(entries),
    }


def main():
    """CLI entry point."""
    sys.stdout.reconfigure(encoding='utf-8')
    # 公共参数：同时注册在父解析器和所有子命令上，LLM 无论放前放后都能解析
    def _add_common_args(p):
        p.add_argument("--host", default="", help="AD device URL (e.g. https://x.x.x.x)")
        p.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
        p.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
        p.add_argument("--user", default="admin", help="Username (default: admin)")
        p.add_argument("--password", default="", help="Password (overrides AD_PASS env var)")
        p.add_argument("--db", default="", help="SQLite database path")
        p.add_argument("--format", choices=["markdown", "json"], default="markdown", help="Output format")

    parser = argparse.ArgumentParser(description="AD Device Perception Analysis")
    _add_common_args(parser)
    subparsers = parser.add_subparsers(dest="command", help="Subcommand")

    analyze_p = subparsers.add_parser("analyze", help="Full analysis (default)")
    _add_common_args(analyze_p)
    analyze_p.add_argument("--disk-source", default="", help="Check report directory with ad.json")
    traffic_p = subparsers.add_parser("traffic", help="Flow anomaly detection")
    _add_common_args(traffic_p); traffic_p.add_argument("--vs", default="", help="VS name filter")
    state_p = subparsers.add_parser("state", help="Device state anomaly detection")
    _add_common_args(state_p); state_p.add_argument("--disk-source", default="", help="Check report directory with ad.json")
    conflict_p = subparsers.add_parser("conflict", help="Address conflict detection")
    _add_common_args(conflict_p)
    logs_p = subparsers.add_parser("logs", help="服务日志查询")
    _add_common_args(logs_p)
    logs_p.add_argument("--limit", type=int, default=50, help="返回条数 (default: 50)")

    args = parser.parse_args()
    cmd = args.command or "analyze"

    host = args.host
    user = args.user
    password = os.environ.get("AD_PASS", "") or args.password

    db_path = os.path.abspath(args.db) if args.db else None
    output_format = args.format

    # Multi-device mode
    if args.hosts or args.devices:
        if args.host:
            print("警告: --hosts 和 --host 同时指定，--host 将被忽略", file=sys.stderr)
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, args.password)
        else:
            devices = load_devices_json(args.devices)

        if not devices:
            print("错误: 设备列表为空", file=sys.stderr)
            sys.exit(4)

        if cmd == "logs":
            limit = args.limit if hasattr(args, 'limit') else 50
            results = run_multi(devices, _logs_one, limit=limit)

            if output_format == "json":
                output = {
                    "mode": "multi",
                    "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v),
                               "failed": sum(1 for v in results.values() if "error" in v)},
                    "results": results,
                }
                print(render_json(output))
            else:
                lines = [render_multi_summary(results, "AD 服务日志 — 多设备")]
                lines.append("---")
                for host, result in results.items():
                    if "error" in result:
                        lines.append(f"## {host}")
                        lines.append(f"> 错误: {result['error']}")
                    else:
                        lines.append(render_logs_markdown(result.get('entries', []), result.get('host', host)))
                    lines.append("")
                print("\n".join(lines))
            sys.exit(compute_multi_exit_code(results))
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
                lines = [render_multi_summary(results, "AD 感知分析报告 — 多设备")]
                lines.append("---")
                for host, result in results.items():
                    if "error" in result:
                        lines.append(f"## {host}")
                        lines.append(f"> 错误: {result['error']}")
                    else:
                        lines.append(render_markdown(result))
                    lines.append("")
                print("\n".join(lines))
            sys.exit(compute_multi_exit_code(results))

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
            result = traffic_analysis(client, db_path=db_path, vs_name=vs_name)
            _print_result(result, output_format)
            sys.exit(0 if result.get('status') != 'error' else 1)

        elif cmd == "state":
            disk_source = args.disk_source if hasattr(args, 'disk_source') and args.disk_source else None
            result = state_analysis(client, disk_source=disk_source)
            _print_result(result, output_format)
            sys.exit(0 if result.get('status') != 'error' else 1)

        elif cmd == "conflict":
            result = conflict_analysis(client)
            _print_result(result, output_format)
            sys.exit(0 if result.get('status') != 'error' else 1)

        elif cmd == "logs":
            limit = args.limit if hasattr(args, 'limit') else 50
            entries = fetch_service_logs(client, limit=limit)
            if output_format == "json":
                result = {'host': host, 'entries': entries, 'total': len(entries)}
                print(render_json(result))
            else:
                print(render_logs_markdown(entries, host))
            sys.exit(0)

        else:
            # analyze (full)
            result = analyze_full(client, db_path=db_path, disk_source=args.disk_source if hasattr(args, 'disk_source') and args.disk_source else None)
            result['device'] = host
            exit_code = _compute_exit_code(result)
            _print_result(result, output_format)
            sys.exit(exit_code)

    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


def _print_result(result, output_format):
    """Print analysis result in requested format."""
    if output_format == "json":
        print(render_json(result))
    else:
        # For full analysis results, use markdown
        print(render_markdown(result))


if __name__ == "__main__":
    main()
