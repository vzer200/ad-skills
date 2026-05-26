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
import json
import math
import statistics
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import urlparse


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


def _extract_metric_values(item: Dict[str, Any]) -> List[float]:
    """从趋势 API 返回的字典中提取数值。

    趋势 API 返回扁平数组: {"name": "connection_rate", "values": [1340, ...]}
    """
    vals = item.get('values', [])
    if not isinstance(vals, list):
        return []
    return [float(v) for v in vals if isinstance(v, (int, float)) and math.isfinite(v)]


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
    from_time: str = "",
    to_time: str = "",
) -> Dict[str, Any]:
    """
    流量分析: 默认优先使用 SQLite 数据，必要时回退到 API。
    require_db=True 时必须从 SQLite 得到结果，禁止实时 API 回退。

    返回字典包含:
        status: 'ok' | 'insufficient_data' | 'error'
        anomalies: 异常字典列表 (当 status == 'ok' 时)
        error: 错误信息或 None
    """
    safe_days = max(1, int(days or 7))
    trend_from, trend_to, range_label = build_traffic_window(
        days=safe_days,
        from_time=from_time,
        to_time=to_time,
    )
    result = {
        'status': 'ok',
        'anomalies': [],
        'error': None,
        'source': 'sqlite',
        'days': safe_days,
        'range': range_label,
        'from_time': trend_from,
        'to_time': trend_to,
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

    # Try SQLite
    rows = None
    if db_path and os.path.isfile(db_path):
        rows = query_traffic_db(db_path, vs_name, days=result['days'])
        result['db_queried'] = rows is not None
        result['sample_count'] = len(rows or [])
    elif require_db:
        result['status'] = 'error'
        result['source'] = 'sqlite'
        result['error'] = f"历史流量库不存在，无法进行数据库趋势分析：{db_path or '未指定'}"
        return result

    if rows is not None and len(rows) >= 100:
        # Enough data for 3σ analysis
        result['anomalies'] = _analyze_traffic_rows(rows)
        result['source'] = 'sqlite'
        if result['anomalies']:
            result['status'] = 'warning'
    elif require_db:
        result['status'] = 'insufficient_data' if rows else 'error'
        result['source'] = 'sqlite'
        if rows:
            result['error'] = None
        else:
            result['error'] = f"历史流量库中未查询到 {vs_name or '目标虚拟服务'} 最近 {result['days']} 天的数据"
        return result
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
                    rows = query_traffic_db(db_path, vs_name, days=result['days'])
                    result['db_queried'] = rows is not None
                    result['sample_count'] = len(rows or [])
                    if rows is not None and len(rows) >= 100:
                        result['anomalies'] = _analyze_traffic_rows(rows)
                        result['source'] = 'sqlite_injected'
                        if result['anomalies']:
                            result['status'] = 'warning'
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
            for trend_period in ('last-hour', 'last-day'):
                trends[trend_period] = _fetch_trend_raw(
                    client,
                    vn,
                    trend_period,
                    from_time=trend_from,
                    to_time=trend_to,
                )
            trends_by_vs[vn] = trends

        result['raw_trends'] = _build_metric_tables_from_trend(trends_by_vs)

        # If API fallback returned no data, mark as error
        if not result['raw_trends']:
            result['status'] = 'error'
            result['error'] = '数据库和 API 均无法获取流量数据'

    return result


def state_analysis(client: Any, disk_source: Optional[str] = None, db_path: Optional[str] = None) -> Dict[str, Any]:
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
    items = []
    has_warn = False
    has_critical = False
    disk_info = {'available': False, 'value': None, 'source': 'none'}

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

    # 3σ anomaly detection on historical data
    anomalies = []
    if db_path and os.path.isfile(db_path):
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

    return {'status': status, 'items': items, 'disk': disk_info, 'anomalies': anomalies}


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
    if any(status in ('critical', 'warning', 'warn', 'conflict_found', 'insufficient_data', 'no_match') for status in statuses):
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
            lines.append('')
        if traffic.get('status') in ('ok', 'warning'):
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
                lines.append(f'✅ 最近 {days_label} 天内未检测到流量异常。')
        elif traffic.get('status') == 'insufficient_data':
            if traffic.get('source') == 'sqlite':
                lines.append('⚠️ 已完成数据库查询，但历史样本不足，暂不输出趋势判断。')
                lines.append('ℹ️ 为避免误判，本次没有回退到实时 API 生成趋势结论。')
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
    from_time: str = "",
    to_time: str = "",
) -> Dict[str, Any]:
    traffic_result = traffic_analysis(
        client,
        db_path=db_path,
        vs_name=vs_name,
        days=days,
        require_db=require_db,
        from_time=from_time,
        to_time=to_time,
    )
    return {'device': client.host, 'traffic': traffic_result, '_scope': 'traffic'}


def _state_one(client: Any, db_path: Optional[str] = None, disk_source: Optional[str] = None) -> Dict[str, Any]:
    state_result = state_analysis(client, disk_source=disk_source, db_path=db_path)
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
    traffic_p.add_argument("--days", type=int, default=7, help="历史流量库回溯天数 (默认7)")
    traffic_p.add_argument("--from-time", default="", help="开始时间，格式 YYYY-MM-DD HH:MM:SS")
    traffic_p.add_argument("--to-time", default="", help="结束时间，格式 YYYY-MM-DD HH:MM:SS")
    traffic_p.add_argument("--require-db", action="store_true", help="必须使用 SQLite 历史库，禁止实时 API 回退")
    state_p = subparsers.add_parser("state", help="Device state anomaly detection")
    _add_common_args(state_p); state_p.add_argument("--disk-source", default="", help="Check report directory with ad.json")
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
            results = run_multi(
                devices,
                _traffic_one,
                db_path=db_path,
                vs_name=vs_name,
                days=getattr(args, 'days', 7),
                require_db=getattr(args, 'require_db', False),
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
                print(render_json(output))
            else:
                print(_render_multi_markdown(results, "AD 流量趋势分析 — 多设备", lambda _host, result: render_markdown(result)))
            sys.exit(_compute_perception_multi_exit_code(results))
        elif cmd == "state":
            disk_src = args.disk_source if hasattr(args, 'disk_source') and args.disk_source else None
            results = run_multi(devices, _state_one, db_path=db_path, disk_source=disk_src)

            if output_format == "json":
                output = {
                    "mode": "multi",
                    "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v),
                               "failed": sum(1 for v in results.values() if "error" in v)},
                    "results": results,
                }
                print(render_json(output))
            else:
                print(_render_multi_markdown(results, "AD 设备资源分析 — 多设备", lambda _host, result: render_markdown(result)))
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
            traffic_result = traffic_analysis(
                client,
                db_path=db_path,
                vs_name=vs_name,
                days=getattr(args, 'days', 7),
                require_db=getattr(args, 'require_db', False),
                from_time=getattr(args, 'from_time', ''),
                to_time=getattr(args, 'to_time', ''),
            )
            result = {'device': host, 'traffic': traffic_result, '_scope': 'traffic'}
            _print_result(result, output_format)
            sys.exit(0 if traffic_result.get('status') != 'error' else 1)

        elif cmd == "state":
            disk_source = args.disk_source if hasattr(args, 'disk_source') and args.disk_source else None
            state_result = state_analysis(client, disk_source=disk_source, db_path=db_path)
            result = {'device': host, 'state': state_result, '_scope': 'state'}
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
