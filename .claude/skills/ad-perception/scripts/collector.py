#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VS traffic collection daemon — polls AD device VS statistics and stores in SQLite.
"""

import argparse
import os
import signal
import sqlite3
import sys
import threading
import time

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
from db_schema import VS_SAMPLES_DDL, COLUMNS, DEVICE_STATE_DDL


SYSTEM_METRICS = ["cpu_usage", "memory_usage", "connection_rate"]

METRIC_NAME_MAP = {"cpu_usage": "cpu", "memory_usage": "memory", "connection_rate": "connection_rate"}

TOTAL_CPU_KEYS = {"TotalCpu", "total_cpu", "totalcpu"}


def _fetch_system_trend(client, api_metric):
    """Fetch system trend data from the AD device API.

    Args:
        client: ``ADClient`` instance.
        api_metric: API metric name (e.g. ``'cpu_usage'``, ``'memory_usage'``).

    Returns:
        Response dict, or None on error.
    """
    try:
        return client._request(
            "GET",
            f"/stat/sys/system/{api_metric}",
            params={"trend": "last-hour", "all_properties": "true"},
        )
    except Exception:
        return None


def _inject_system_trend_into_db(db_path, metric_name, trend_data):
    """Inject system trend API data into SQLite.

    Handles three formats:
    - ``series`` (CPU): finds the first series whose name is in TOTAL_CPU_KEYS.
    - ``values`` (memory, connection_rate): injects the flat values array.
    - Neither: raises ValueError.

    Timestamps are computed from the API's ``start_time`` + ``i * step_time``.

    Args:
        db_path: path to SQLite database file.
        metric_name: internal metric name (e.g. ``'cpu'``, ``'memory'``).
        trend_data: dict returned by ``_fetch_system_trend``.

    Returns:
        Number of rows written (int).

    Raises:
        ValueError: if the trend data format is unrecognized.
    """
    if not isinstance(trend_data, dict):
        return 0

    conn = sqlite3.connect(db_path)
    conn.executescript(DEVICE_STATE_DDL)

    # Cleanup data older than 7 days to prevent unbounded growth
    cutoff = int(time.time()) - 7 * 86400
    conn.execute("DELETE FROM device_state WHERE ts < ?", (cutoff,))

    start_time = trend_data.get("start_time", 0)
    step_time = trend_data.get("step_time", 60)
    values_array = None

    if "series" in trend_data:
        # CPU format: find first matching TotalCpu series
        target_series = None
        for s in trend_data["series"]:
            if s.get("name", "") in TOTAL_CPU_KEYS:
                target_series = s
                break
        if target_series is None:
            raise ValueError("CPU trend: no TotalCpu key found")
        values_array = target_series.get("values", [])
    elif "values" in trend_data:
        # Memory / connection_rate format: flat values array
        values_array = trend_data["values"]
    else:
        raise ValueError(f"Unknown system trend format for {metric_name}")

    total = 0
    for i, v in enumerate(values_array):
        if not isinstance(v, (int, float)):
            continue
        ts = start_time + i * step_time
        conn.execute(
            "INSERT OR REPLACE INTO device_state (ts, metric, value) VALUES (?, ?, ?)",
            (ts, metric_name, float(v)),
        )
        total += 1

    conn.commit()
    conn.close()
    return total


def collect_system_once(client, db_path):
    """Collect system metrics (CPU, memory, connection rate) trend data.

    Individual metric failures do not block other metrics.

    Args:
        client: ``ADClient`` instance.
        db_path: path to SQLite database file.

    Returns:
        Total number of rows written (int).
    """
    total = 0
    for api_metric in SYSTEM_METRICS:
        try:
            trend_data = _fetch_system_trend(client, api_metric)
        except Exception:
            continue
        if trend_data:
            try:
                total += _inject_system_trend_into_db(
                    db_path, METRIC_NAME_MAP[api_metric], trend_data
                )
            except Exception:
                continue
    return total


def _inject_trend_into_db(db_path, vs_name, trend_data):
    """Inject trend API ``last-hour`` data into SQLite with synthesized timestamps.

    Trend API returns flat arrays (~60 values per metric) without timestamps.
    Synthesized as ``ts = now - (n - i) * 60`` where i=0 is oldest, i=n-1 is newest.
    Uses ``INSERT OR REPLACE`` for idempotent writes against the UNIQUE(ts, vs_name, metric)
    constraint.

    Args:
        db_path: path to SQLite database file.
        vs_name: virtual service name.
        trend_data: dict returned by ``ADClient.get_vs_trend_by_name(name, trend='last-hour')``.

    Returns:
        Number of rows written (int).
    """
    items = trend_data.get('items', []) if isinstance(trend_data, dict) else []
    if not items:
        return 0

    conn = sqlite3.connect(db_path)
    conn.executescript(VS_SAMPLES_DDL)

    # Cleanup data older than 7 days to prevent unbounded growth
    cutoff = int(time.time()) - 7 * 86400
    conn.execute("DELETE FROM vs_samples WHERE ts < ?", (cutoff,))

    now = int(time.time())
    total = 0

    for item in items:
        metric_name = item.get('name', '')
        values = item.get('values', [])
        if not metric_name or not isinstance(values, list):
            continue

        n = len(values)
        for i, v in enumerate(values):
            if not isinstance(v, (int, float)):
                continue
            ts = now - (n - i) * 60
            conn.execute(
                "INSERT OR REPLACE INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
                (ts, vs_name, metric_name, float(v)),
            )
            total += 1

    conn.commit()
    conn.close()
    return total


def collect_once(client, db_path):
    """Run one collection cycle: fetch VS names, get trend data, inject into SQLite.

    Args:
        client: ``ADClient`` instance.
        db_path: path to SQLite database file.

    Returns:
        Total number of rows written (int). Returns 0 if no VS or all API calls fail.
    """
    try:
        data = client.get_virtual_services()
        vs_names = [item.get('name', '') for item in data.get('items', []) if item.get('name')]
    except Exception:
        return 0

    if not vs_names:
        return 0

    total = 0
    for vn in vs_names:
        try:
            trend_data = client.get_vs_trend_by_name(vn, trend='last-hour')
        except Exception:
            continue
        if trend_data:
            total += _inject_trend_into_db(db_path, vn, trend_data)

    total += collect_system_once(client, db_path)

    return total


def collect_and_analyze(client, db_path):
    """Collect trend data via ``collect_once``, then run 3σ anomaly detection.

    Args:
        client: ``ADClient`` instance.
        db_path: path to SQLite database file.

    Returns:
        dict with keys: status, anomalies, report, device, rows_injected.
    """
    rows = collect_once(client, db_path)

    # Late import to avoid circular dependency at module level
    from perception import query_traffic_db, _run_3sigma_on_vs_group, render_markdown

    db_rows = query_traffic_db(db_path)
    if not db_rows:
        # No data after collection — device may have no VS (legitimate)
        report = render_markdown({
            'device': client.host,
            'traffic': {'status': 'ok', 'anomalies': [], 'error': None},
            'state': {'status': 'ok', 'items': [], 'disk': {'available': False, 'value': None, 'source': 'none'}},
            'logs': {'status': 'no_anomaly', 'entries': []},
            'conflicts': {'status': 'ok', 'vs_overlaps': [], 'pool_overlaps': []},
        })
        return {
            'status': 'ok',
            'anomalies': [],
            'report': report,
            'device': client.host,
            'rows_injected': 0,
            'note': '设备无虚拟服务或采集无数据',
        }

    groups = {}
    for row in db_rows:
        key = (row['vs_name'], row['metric'])
        if key not in groups:
            groups[key] = []
        groups[key].append(row)

    anomalies = _run_3sigma_on_vs_group(groups)
    report = render_markdown({
        'device': client.host,
        'traffic': {'status': 'ok', 'anomalies': anomalies, 'error': None},
        'state': {'status': 'ok', 'items': [], 'disk': {'available': False, 'value': None, 'source': 'none'}},
        'logs': {'status': 'no_anomaly', 'entries': []},
        'conflicts': {'status': 'ok', 'vs_overlaps': [], 'pool_overlaps': []},
    })

    return {
        'status': 'ok',
        'anomalies': anomalies,
        'report': report,
        'device': client.host,
        'rows_injected': rows,
    }


def _check_process_alive(pid):
    """Check if a process with the given PID is alive (cross-platform).

    On Windows, os.kill(pid, 0) may incorrectly trigger CTRL_C_EVENT
    (Windows maps signal 0 to CTRL_C), so we use OpenProcess directly.
    On POSIX, os.kill(pid, 0) is the standard null-signal check.
    """
    if sys.platform == 'win32':
        import ctypes
        kernel32 = ctypes.windll.kernel32
        SYNCHRONIZE = 0x00100000
        handle = kernel32.OpenProcess(SYNCHRONIZE, False, pid)
        if handle:
            kernel32.CloseHandle(handle)
            return True
        return False
    else:
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False


def _create_pid_file(pid_path):
    """Atomically create a PID file. Exits with code 6 if duplicate running.

    If the PID file exists with a dead PID, the stale file is removed
    and a fresh one is created.
    """
    try:
        fd = os.open(pid_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        with open(pid_path) as f:
            raw = f.read().strip()
        existing_pid = int(raw) if raw else 0
        if existing_pid > 0 and _check_process_alive(existing_pid):
            print(f"错误: 采集器已在运行 (PID={existing_pid})", file=sys.stderr)
            sys.exit(6)
        # Stale PID file — remove and recreate
        os.unlink(pid_path)
        fd = os.open(pid_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)

    with os.fdopen(fd, "w") as f:
        f.write(str(os.getpid()))


class VSCollector:
    """Collects VS statistics from an AD device and stores them in SQLite."""

    def __init__(
        self,
        host: str,
        password: str,
        username: str = "admin",
        db_path: str = "",
        interval: int = 30,
    ):
        self.host = host
        self.password = password
        self.username = username
        self.interval = interval
        self.client = ADClient(host, username, password)
        self.consecutive_failures = 0
        self.conn = None
        self.running = False
        self.stop_event = None  # injected by run_collector_multi()
        self.fatal_error = None

        # Derive default DB name from host if not explicitly provided
        if not db_path:
            import re
            safe_host = re.sub(r'[^a-zA-Z0-9._-]', '_', host)
            db_path = f"vs_samples_{safe_host}.db"

        # Resolve DB path (keep :memory: unchanged for testing)
        if db_path != ":memory:" and not db_path.startswith(":memory:"):
            self.db_path = os.path.abspath(db_path)
        else:
            self.db_path = db_path

    @property
    def host_slug(self):
        """Filesystem-safe host identifier for logging."""
        import re
        return re.sub(r'[^a-zA-Z0-9._-]', '_', self.host)

    def open_db(self):
        """Open SQLite connection and create the vs_samples table if needed."""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.executescript(VS_SAMPLES_DDL)

    def close_db(self):
        """Close the SQLite connection."""
        if self.conn:
            self.conn.close()
            self.conn = None

    def cleanup_old_data(self, cutoff=None):
        """Delete samples older than 30 days in an explicit transaction.

        Args:
            cutoff: optional Unix timestamp cutoff (default: now - 30 days).
        """
        if cutoff is None:
            cutoff = int(time.time()) - 7 * 86400
        self.conn.execute("BEGIN")
        self.conn.execute("DELETE FROM vs_samples WHERE ts < ?", (cutoff,))
        self.conn.execute("COMMIT")

    def parse_vs_stat(self, data):
        """Parse VS stat API response into list of (ts, vs_name, metric, value) tuples.

        Handles both raw numeric values and nested dicts like
        ``{"model": "INSTANT", "value": 100, ...}``.

        Args:
            data: dict returned by ADClient.get_vs_stat().

        Returns:
            list of (ts, vs_name, metric, value) tuples.
        """
        ts = int(time.time())
        rows = []
        items = data.get("items", [])
        for item in items:
            vs_name = item.get("name", "")
            if not vs_name:
                continue
            for key, value in item.items():
                if key == "name":
                    continue
                if isinstance(value, (int, float)):
                    rows.append((ts, vs_name, key, float(value)))
                elif isinstance(value, dict) and "value" in value:
                    rows.append((ts, vs_name, key, float(value["value"])))
        return rows

    def run_once(self):
        """Execute one sampling cycle: fetch, parse, store.

        Returns:
            list of inserted (ts, vs_name, metric, value) rows on success,
            or None on failure.

        Raises:
            RuntimeError: on SQLite write failure.
        """
        try:
            data = self.client.get_vs_stat()
        except Exception as e:
            self.consecutive_failures += 1
            if self.consecutive_failures >= 5:
                print(
                    "[STALLED] 连续 5 次采样失败，请检查设备和网络",
                    file=sys.stderr,
                )
            else:
                print(f"[WARN] 采样失败: {e}", file=sys.stderr)
            return None

        rows = self.parse_vs_stat(data)

        try:
            for row in rows:
                self.conn.execute(
                    "INSERT OR REPLACE INTO vs_samples "
                    "(ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
                    row,
                )
            self.conn.commit()
        except Exception as e:
            print(f"[{self.host_slug}] 错误: 数据库写入失败: {e}", file=sys.stderr)
            raise RuntimeError(f"数据库写入失败: {e}")

        # Check if we were in STALLED state and just recovered
        if self.consecutive_failures >= 5:
            print("[RECOVERED] 采样已恢复", file=sys.stderr)
        self.consecutive_failures = 0
        return rows

    def start(self, pid_path=None):
        """Initialize the collector: create PID file, open DB, print DB path.

        Args:
            pid_path: path to PID file (default: ``<db_path>.pid``).

        Returns:
            The PID file path (str).

        Raises:
            SystemExit: if a live PID file already exists.
        """
        if pid_path is None:
            pid_path = self.db_path + ".pid"

        _create_pid_file(pid_path)
        self.pid_path = pid_path
        self.open_db()
        self.cleanup_old_data()
        print(f"数据库路径: {self.db_path}")
        return pid_path

    def handle_signal(self, signum, frame):
        """Handle SIGINT / SIGBREAK: close DB, delete PID file, exit 0."""
        self.close_db()
        if hasattr(self, "pid_path") and self.pid_path and os.path.exists(self.pid_path):
            os.unlink(self.pid_path)
        print("采集器已停止")
        sys.exit(0)


def _add_common_args(p):
    """Add common CLI arguments shared by all subcommands."""
    p.add_argument("--host", default="", help="AD device address (e.g. https://10.74.27.42)")
    p.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    p.add_argument("--user", default="admin", help="AD username (default: admin)")
    p.add_argument("--password", default="", help="AD password (env AD_PASS overrides if --password not given)")
    p.add_argument("--db", default="", help="SQLite database path (default: ./vs_samples_<host>.db)")


def _derive_db_path(host):
    """Derive default DB path from host URL."""
    import re
    safe = re.sub(r'[^a-zA-Z0-9._-]', '_', host)
    return f"vs_samples_{safe}.db"


def parse_args(argv=None):
    """Parse CLI arguments with subcommand routing."""
    parser = argparse.ArgumentParser(
        description="AD VS traffic collection tool — one-shot collect or long-running daemon.",
    )
    subparsers = parser.add_subparsers(dest="command", help="Subcommand")

    # collect subcommand (one-shot)
    collect_p = subparsers.add_parser(
        "collect", help="One-shot: fetch trend API last-hour data, inject into SQLite, run 3σ analysis"
    )
    _add_common_args(collect_p)

    # daemon subcommand (deprecated, preserved for backward compatibility)
    daemon_p = subparsers.add_parser(
        "daemon", help="DEPRECATED: long-running collection daemon"
    )
    _add_common_args(daemon_p)
    daemon_p.add_argument(
        "--interval", type=int, default=30,
        help="Sampling interval in seconds (default: 30)",
    )

    return parser.parse_args(argv)


def _collect_loop(collector):
    """Collection loop driven by stop_event. Runs in a daemon thread."""
    collector.open_db()
    collector.cleanup_old_data()
    max_consecutive_failures = 30
    while not collector.stop_event.is_set():
        try:
            collector.run_once()
        except Exception as e:
            collector.consecutive_failures += 1
            print(f"[{collector.host_slug}] 采集异常: {e}", file=sys.stderr)
            if collector.consecutive_failures >= max_consecutive_failures:
                collector.fatal_error = str(e)
                collector.stop_event.set()
                break
        collector.stop_event.wait(timeout=collector.interval)
    collector.close_db()


def run_collector_multi(devices, db_paths, interval=30):
    """Launch multiple collectors in parallel threads with a shared stop_event.

    Args:
        devices: list of dicts [{host, password, user}, ...]
        db_paths: dict {host: db_path}
        interval: sampling interval in seconds

    The function blocks until SIGINT/SIGBREAK is received, then stops all collectors.
    """
    from multi_device import resolve_device_pw

    stop_event = threading.Event()
    threads = []
    collectors = []

    for d in devices:
        pw = resolve_device_pw(d)
        c = VSCollector(
            d["host"], pw, d.get("user", "admin"),
            db_path=db_paths.get(d["host"], ""), interval=interval
        )
        c.stop_event = stop_event
        t = threading.Thread(target=_collect_loop, args=(c,), daemon=True)
        t.start()
        threads.append(t)
        collectors.append(c)

    # Main thread waits for signal
    import signal as sig_module
    def _handle_signal(signum, frame):
        stop_event.set()
    sig_module.signal(sig_module.SIGINT, _handle_signal)
    if hasattr(sig_module, 'SIGBREAK'):
        sig_module.signal(sig_module.SIGBREAK, _handle_signal)

    for t in threads:
        t.join()

    for c in collectors:
        try:
            c.close_db()
        except Exception:
            pass


def _collect_and_analyze_one(client, db_path):
    """Single-device collect+analyze for ThreadPoolExecutor (run_multi compatible)."""
    if not db_path:
        db_path = _derive_db_path(client.host)
    return collect_and_analyze(client, db_path)


def _run_daemon(args):
    """Run the legacy daemon mode (single or multi device)."""
    password = args.password or os.environ.get("AD_PASS", "")

    # Multi-device daemon mode
    if hasattr(args, 'hosts') and args.hosts:
        devices = []
        for host in args.hosts.split(","):
            host = host.strip()
            if host:
                devices.append({"host": host, "user": args.user, "password": password})

        db_paths = {}
        for d in devices:
            db_paths[d["host"]] = _derive_db_path(d["host"])

        run_collector_multi(devices, db_paths, interval=args.interval)
        sys.exit(0)

    # Single-device daemon mode
    if not args.host:
        print("错误: 未指定设备地址，请使用 --host 指定 AD 设备 URL", file=sys.stderr)
        sys.exit(4)
    if not password:
        print("错误: 未指定密码，请使用 --password 或设置环境变量 AD_PASS", file=sys.stderr)
        sys.exit(1)

    if not args.db:
        args.db = _derive_db_path(args.host)

    collector = VSCollector(
        host=args.host, password=password, username=args.user,
        db_path=args.db, interval=args.interval,
    )

    pid_path = collector.db_path + ".pid"
    signal.signal(signal.SIGINT, collector.handle_signal)
    if hasattr(signal, 'SIGBREAK'):
        signal.signal(signal.SIGBREAK, collector.handle_signal)

    collector.start(pid_path)

    last_cleanup_ts = int(time.time())
    try:
        while True:
            rows = collector.run_once()
            if rows is not None:
                vs_set = {r[1] for r in rows}
                ts_display = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time()))
                print(f"[{ts_display}] 采样 {len(vs_set)} 个 VS，{len(rows)} 条记录")
            now = int(time.time())
            if now - last_cleanup_ts >= 3600:
                collector.cleanup_old_data()
                last_cleanup_ts = now
            time.sleep(collector.interval)
    except SystemExit:
        raise
    except KeyboardInterrupt:
        collector.handle_signal(signal.SIGINT, None)


def _run_collect(args):
    """Run one-shot collect+analyze (single or multi device)."""
    from multi_device import run_multi, parse_hosts_arg, load_devices_json, compute_multi_exit_code

    password = args.password or os.environ.get("AD_PASS", "")

    # Multi-device collect mode
    if args.hosts or args.devices:
        if args.host:
            print("警告: --hosts/--devices 和 --host 同时指定，--host 将被忽略", file=sys.stderr)
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, args.password)
        else:
            devices = load_devices_json(args.devices)

        if not devices:
            print("错误: 设备列表为空", file=sys.stderr)
            sys.exit(4)

        results = run_multi(devices, _collect_and_analyze_one, db_path=args.db or "")
        for host, result in results.items():
            if "error" in result:
                print(f"\n## {host}\n> 错误: {result['error']}")
            else:
                print(f"\n## {host}")
                print(f"注入行数: {result.get('rows_injected', 0)}")
                print(f"异常数: {len(result.get('anomalies', []))}")
                if result.get('report'):
                    print(result['report'])
        sys.exit(compute_multi_exit_code(results))

    # Single-device collect mode
    if not args.host:
        print("错误: 未指定设备地址，请使用 --host 指定 AD 设备 URL", file=sys.stderr)
        sys.exit(4)
    if not password:
        print("错误: 未指定密码，请使用 --password 或设置环境变量 AD_PASS", file=sys.stderr)
        sys.exit(4)

    db_path = args.db or _derive_db_path(args.host)

    try:
        client = ADClient(args.host, args.user, password)
    except Exception as e:
        print(f"错误: 无法连接设备: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        result = collect_and_analyze(client, db_path)
    except Exception as e:
        print(f"错误: 采集分析失败: {e}", file=sys.stderr)
        sys.exit(1)

    if result.get('status') == 'error':
        print(f"错误: {result.get('error', '未知错误')}", file=sys.stderr)
        sys.exit(1)

    print(f"注入行数: {result.get('rows_injected', 0)}")
    print(f"异常数: {len(result.get('anomalies', []))}")
    if result.get('report'):
        print(result['report'])
    sys.exit(0)


def main():
    """CLI entry point — routes to collect (one-shot) or daemon (deprecated)."""
    sys.stdout.reconfigure(encoding='utf-8')
    args = parse_args()

    if args.command == "daemon":
        _run_daemon(args)
    else:
        # Default: collect mode
        _run_collect(args)


if __name__ == "__main__":
    main()
