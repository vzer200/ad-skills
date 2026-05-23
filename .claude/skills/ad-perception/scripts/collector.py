#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VS 流量采集工具 —— 获取 AD 设备 VS 统计趋势数据并存入 SQLite。
"""

import argparse
import os
import signal
import sqlite3
import sys
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

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

MAX_CONSECUTIVE_FAILURES = 30


def _fetch_system_trend(client: Any, api_metric: str) -> Optional[Dict[str, Any]]:
    """从 AD 设备 API 获取系统趋势数据。

    Args:
        client: ``ADClient`` 实例。
        api_metric: API 指标名称 (例如 ``'cpu_usage'``, ``'memory_usage'``)。

    Returns:
        响应字典，出错时返回 None。
    """
    try:
        return client._request(
            "GET",
            f"/stat/sys/system/{api_metric}",
            params={"trend": "last-hour", "all_properties": "true"},
        )
    except Exception:
        return None


def _inject_system_trend_into_db(db_path: str, metric_name: str, trend_data: Dict[str, Any]) -> int:
    """将系统趋势 API 数据注入 SQLite。

    处理三种格式:
    - ``series`` (CPU): 找到名称在 TOTAL_CPU_KEYS 中的第一个序列。
    - ``values`` (memory, connection_rate): 注入扁平的值数组。
    - 两者都不是: 抛出 ValueError。

    时间戳根据 API 的 ``start_time`` + ``i * step_time`` 计算。

    Args:
        db_path: SQLite 数据库文件路径。
        metric_name: 内部指标名称 (例如 ``'cpu'``, ``'memory'``)。
        trend_data: ``_fetch_system_trend`` 返回的字典。

    Returns:
        写入的行数 (int)。

    Raises:
        ValueError: 趋势数据格式无法识别时抛出。
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


def collect_system_once(client: Any, db_path: str) -> int:
    """采集系统指标(CPU、内存、连接速率)趋势数据。

    单个指标失败不会阻塞其他指标的采集。

    Args:
        client: ``ADClient`` 实例。
        db_path: SQLite 数据库文件路径。

    Returns:
        写入的总行数 (int)。
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


def _inject_trend_into_db(db_path: str, vs_name: str, trend_data: Dict[str, Any]) -> int:
    """将趋势 API ``last-hour`` 数据注入 SQLite。

    趋势 API 返回每个指标的扁平数组，并携带 ``start_time`` 与 ``step_time``。
    时间戳按 ``ts = start_time + i * step_time`` 写入，其中 i=0 最旧。
    使用 ``INSERT OR REPLACE`` 实现幂等写入，依赖 UNIQUE(ts, vs_name, metric) 约束。

    Args:
        db_path: SQLite 数据库文件路径。
        vs_name: 虚拟服务名称。
        trend_data: ``ADClient.get_vs_trend_by_name(name, trend='last-hour')`` 返回的字典。

    Returns:
        写入的行数 (int)。
    """
    items = trend_data.get('items', []) if isinstance(trend_data, dict) else []
    if not items:
        return 0

    conn = sqlite3.connect(db_path)
    conn.executescript(VS_SAMPLES_DDL)

    # Cleanup data older than 7 days to prevent unbounded growth
    cutoff = int(time.time()) - 7 * 86400
    conn.execute("DELETE FROM vs_samples WHERE ts < ?", (cutoff,))

    start_time = trend_data.get("start_time", 0)
    step_time = trend_data.get("step_time", 60)
    total = 0

    for item in items:
        metric_name = item.get('name', '')
        values = item.get('values', [])
        if not metric_name or not isinstance(values, list):
            continue

        for i, v in enumerate(values):
            if not isinstance(v, (int, float)):
                continue
            ts = start_time + i * step_time
            conn.execute(
                "INSERT OR REPLACE INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
                (ts, vs_name, metric_name, float(v)),
            )
            total += 1

    conn.commit()
    conn.close()
    return total


def collect_once(client: Any, db_path: str) -> int:
    """运行一次采集周期: 获取 VS 名称，拉取趋势数据，注入 SQLite。

    Args:
        client: ``ADClient`` 实例。
        db_path: SQLite 数据库文件路径。

    Returns:
        写入的总行数 (int)。若无 VS 或所有 API 调用均失败则返回 0。
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


def collect_and_analyze(client: Any, db_path: str) -> Dict[str, Any]:
    """通过 ``collect_once`` 采集趋势数据，然后运行 3σ 异常检测。

    Args:
        client: ``ADClient`` 实例。
        db_path: SQLite 数据库文件路径。

    Returns:
        包含键 status, anomalies, report, device, rows_injected 的字典。
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
            'rows_injected': rows,
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


def _check_process_alive(pid: int) -> bool:
    """检查指定 PID 的进程是否存活(跨平台)。

    在 Windows 上，os.kill(pid, 0) 可能错误触发 CTRL_C_EVENT
    (Windows 将信号 0 映射到 CTRL_C)，因此直接使用 OpenProcess。
    在 POSIX 上，os.kill(pid, 0) 是标准的空信号检查方式。
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


def _create_pid_file(pid_path: str) -> None:
    """原子方式创建 PID 文件。若已有实例在运行则退出(退出码 6)。

    如果 PID 文件存在但对应进程已死亡，则移除过期文件并创建新文件。
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
    """从 AD 设备采集 VS 统计数据并存入 SQLite。"""

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
        self.stop_event = None
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
    def host_slug(self) -> str:
        """文件系统安全的主机标识符，用于日志输出。"""
        import re
        return re.sub(r'[^a-zA-Z0-9._-]', '_', self.host)

    def open_db(self) -> None:
        """打开 SQLite 连接，必要时创建 vs_samples 表。"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.executescript(VS_SAMPLES_DDL)

    def close_db(self) -> None:
        """关闭 SQLite 连接。"""
        if self.conn:
            self.conn.close()
            self.conn = None

    def cleanup_old_data(self, cutoff: Optional[int] = None) -> None:
        """在显式事务中删除超过 30 天的旧采样数据。

        Args:
            cutoff: 可选的 Unix 时间戳截断点 (默认: 当前时间 - 30 天)。
        """
        if cutoff is None:
            cutoff = int(time.time()) - 7 * 86400
        self.conn.execute("BEGIN")
        self.conn.execute("DELETE FROM vs_samples WHERE ts < ?", (cutoff,))
        self.conn.execute("COMMIT")

    def parse_vs_stat(self, data: Dict[str, Any]) -> List[Tuple[int, str, str, float]]:
        """将 VS 统计 API 响应解析为 (ts, vs_name, metric, value) 元组列表。

        同时处理原始数值和嵌套字典格式，
        如 ``{"model": "INSTANT", "value": 100, ...}``。

        Args:
            data: ADClient.get_vs_stat() 返回的字典。

        Returns:
            (ts, vs_name, metric, value) 元组列表。
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

    def run_once(self) -> Optional[List[Tuple[int, str, str, float]]]:
        """执行一次采样周期: 获取、解析、存储。

        Returns:
            成功时返回已插入的 (ts, vs_name, metric, value) 行列表，
            失败时返回 None。

        Raises:
            RuntimeError: SQLite 写入失败时抛出。
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

    def start(self, pid_path: Optional[str] = None) -> str:
        """初始化采集器: 创建 PID 文件，打开数据库，打印数据库路径。

        Args:
            pid_path: PID 文件路径 (默认: ``<db_path>.pid``)。

        Returns:
            PID 文件路径 (str)。

        Raises:
            SystemExit: 如果已有活动的 PID 文件存在。
        """
        if pid_path is None:
            pid_path = self.db_path + ".pid"

        _create_pid_file(pid_path)
        self.pid_path = pid_path
        self.open_db()
        self.cleanup_old_data()
        print(f"数据库路径: {self.db_path}")
        return pid_path

    def handle_signal(self, signum: int, frame: Any) -> None:
        """处理 SIGINT / SIGBREAK 信号: 关闭数据库，删除 PID 文件，退出(退出码 0)。"""
        if self.stop_event is not None:
            self.stop_event.set()
        self.close_db()
        if hasattr(self, "pid_path") and self.pid_path and os.path.exists(self.pid_path):
            os.unlink(self.pid_path)
        print("采集器已停止")
        sys.exit(0)


def _collect_loop(collector: VSCollector) -> None:
    """Run the legacy daemon collection loop until stopped or fatally stalled."""
    if collector.stop_event is None:
        collector.stop_event = threading.Event()

    collector.open_db()
    try:
        collector.cleanup_old_data()
        while not collector.stop_event.is_set():
            try:
                collector.run_once()
            except Exception as exc:
                collector.consecutive_failures += 1
                collector.fatal_error = str(exc)
                print(f"[{collector.host_slug}] WARN: 采集循环异常: {exc}", file=sys.stderr)
                if collector.consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                    collector.stop_event.set()
                    break

            if collector.stop_event.wait(float(collector.interval)):
                break
    finally:
        collector.close_db()


def _add_common_args(p: argparse.ArgumentParser) -> None:
    """添加所有子命令共享的 CLI 公共参数。"""
    p.add_argument("--host", default="", help="AD device address (e.g. https://10.74.27.42)")
    p.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    p.add_argument("--device", default="", help="从 --devices 中选择单台设备名称，如 AD1")
    p.add_argument("--user", default="admin", help="AD username (default: admin)")
    p.add_argument("--password", default="", help="AD password (env AD_PASS overrides if --password not given)")
    p.add_argument("--db", default="", help="SQLite database path (default: ./vs_samples_<host>.db)")


def _derive_db_path(host: str) -> str:
    """根据主机 URL 推导默认数据库路径。"""
    import re
    safe = re.sub(r'[^a-zA-Z0-9._-]', '_', host)
    return f"vs_samples_{safe}.db"


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    """解析 CLI 参数并进行子命令路由。"""
    parser = argparse.ArgumentParser(
        description="AD VS traffic collection tool — one-shot collect with trend analysis.",
    )
    subparsers = parser.add_subparsers(dest="command", help="Subcommand")

    # collect subcommand (one-shot)
    collect_p = subparsers.add_parser(
        "collect", help="One-shot: fetch trend API last-hour data, inject into SQLite, run 3σ analysis"
    )
    _add_common_args(collect_p)
    collect_p.add_argument("--collect-only", action="store_true", help="只采集写库，不渲染分析报告")

    daemon_p = subparsers.add_parser(
        "daemon", help="Deprecated compatibility mode: collect VS stat samples in a loop"
    )
    _add_common_args(daemon_p)
    daemon_p.add_argument("--interval", type=int, default=30, help="采样间隔秒数 (默认: 30)")

    return parser.parse_args(argv)


def _collect_and_analyze_one(client: Any, db_path: str) -> Dict[str, Any]:
    """单设备采集+分析，供 ThreadPoolExecutor 调用 (兼容 run_multi)。"""
    if not db_path:
        db_path = _derive_db_path(client.host)
    return collect_and_analyze(client, db_path)


def _collect_only_one(client: Any, db_path: str) -> Dict[str, Any]:
    """单设备只采集写库，不渲染感知报告。"""
    if not db_path:
        db_path = _derive_db_path(client.host)
    rows = collect_once(client, db_path)
    return {"rows_injected": rows, "db_path": db_path}


def _run_collect(args: argparse.Namespace) -> None:
    """运行一次性采集+分析 (单设备或多设备)。"""
    from multi_device import run_multi, parse_hosts_arg, load_devices_json, compute_multi_exit_code

    password = args.password or os.environ.get("AD_PASS", "")

    # Multi-device collect mode
    if args.hosts or args.devices:
        if args.host:
            print("警告: --hosts/--devices 和 --host 同时指定，--host 将被忽略", file=sys.stderr)
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, args.password)
        else:
            devices = load_devices_json(args.devices, args.device)

        if not devices:
            print("错误: 设备列表为空", file=sys.stderr)
            sys.exit(4)

        worker = _collect_only_one if getattr(args, "collect_only", False) else _collect_and_analyze_one
        results = run_multi(devices, worker, db_path=args.db or "")
        for host, result in results.items():
            if "error" in result:
                print(f"\n## {host}\n> 错误: {result['error']}")
            else:
                print(f"\n## {host}")
                print(f"注入行数: {result.get('rows_injected', 0)}")
                if not getattr(args, "collect_only", False):
                    print(f"异常数: {len(result.get('anomalies', []))}")
                if result.get('report') and not getattr(args, "collect_only", False):
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

    if getattr(args, "collect_only", False):
        rows = collect_once(client, db_path)
        print(f"数据库路径: {db_path}")
        print(f"注入行数: {rows}")
        sys.exit(0 if rows > 0 else 1)

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


def _run_daemon(args: argparse.Namespace) -> None:
    """运行旧版常驻采集器，保留给历史提示词和外部调度兼容。"""
    password = args.password or os.environ.get("AD_PASS", "")
    if not args.host:
        print("错误: 未指定设备地址，请使用 --host 指定 AD 设备 URL", file=sys.stderr)
        sys.exit(4)
    if not password:
        print("错误: 未指定密码，请使用 --password 或设置环境变量 AD_PASS", file=sys.stderr)
        sys.exit(4)

    collector = VSCollector(
        args.host,
        password,
        username=args.user,
        db_path=args.db or _derive_db_path(args.host),
        interval=args.interval,
    )
    collector.stop_event = threading.Event()
    collector.pid_path = collector.db_path + ".pid"

    try:
        _create_pid_file(collector.pid_path)
    except SystemExit:
        raise
    except Exception as exc:
        print(f"错误: 无法创建 PID 文件: {exc}", file=sys.stderr)
        sys.exit(1)

    signal.signal(signal.SIGINT, collector.handle_signal)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, collector.handle_signal)

    print(f"数据库路径: {collector.db_path}")
    try:
        _collect_loop(collector)
    finally:
        if os.path.exists(collector.pid_path):
            os.unlink(collector.pid_path)

    if collector.fatal_error:
        print(f"错误: 采集器连续失败，已停止: {collector.fatal_error}", file=sys.stderr)
        sys.exit(1)
    sys.exit(0)


def main() -> None:
    """CLI 入口。"""
    sys.stdout.reconfigure(encoding='utf-8')
    args = parse_args()
    if args.command == "collect":
        _run_collect(args)
    elif args.command == "daemon":
        _run_daemon(args)
    else:
        print("错误: 未指定子命令，请使用 collect 或 daemon", file=sys.stderr)
        sys.exit(4)


if __name__ == "__main__":
    main()
