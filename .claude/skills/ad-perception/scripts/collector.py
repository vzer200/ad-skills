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
import time

# Cross-skill import: ad-ops -> ad-perception
sys.path.insert(
    0,
    os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "..", "ad-ops", "scripts"
    ),
)

try:
    from ad_api import ADClient
except ImportError:
    print("错误: 无法导入 ad_api.py，请确认文件路径未变更", file=sys.stderr)
    sys.exit(9)

from db_schema import VS_SAMPLES_DDL, COLUMNS


def _check_process_alive(pid):
    """Check if a process with the given PID is alive (Windows)."""
    import ctypes

    kernel32 = ctypes.windll.kernel32
    handle = kernel32.OpenProcess(0x0400, False, pid)
    if not handle:
        return False
    kernel32.CloseHandle(handle)
    return True


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
        db_path: str = "vs_samples.db",
        interval: int = 60,
    ):
        self.host = host
        self.password = password
        self.username = username
        self.interval = interval
        self.client = ADClient(host, username, password)
        self.consecutive_failures = 0
        self.conn = None
        self.running = False

        # Resolve DB path (keep :memory: unchanged for testing)
        if db_path != ":memory:" and not db_path.startswith(":memory:"):
            self.db_path = os.path.abspath(db_path)
        else:
            self.db_path = db_path

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
            cutoff = int(time.time()) - 30 * 86400
        self.conn.execute("BEGIN")
        self.conn.execute("DELETE FROM vs_samples WHERE ts < ?", (cutoff,))
        self.conn.execute("COMMIT")

    def parse_vs_stat(self, data):
        """Parse VS stat API response into list of (ts, vs_name, metric, value) tuples.

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
        return rows

    def run_once(self):
        """Execute one sampling cycle: fetch, parse, store.

        Returns:
            list of inserted (ts, vs_name, metric, value) rows on success,
            or None on failure.

        Raises:
            SystemExit: (code 3) on SQLite write failure.
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
            print(f"错误: 数据库写入失败: {e}", file=sys.stderr)
            sys.exit(3)

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


def parse_args(argv=None):
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="VS traffic collection daemon — polls AD VS stats into SQLite.",
    )
    parser.add_argument(
        "--host",
        required=True,
        help="AD device address (e.g. https://10.74.27.42)",
    )
    parser.add_argument(
        "--user",
        default="admin",
        help="AD username (default: admin)",
    )
    parser.add_argument(
        "--password",
        default="",
        help="AD password (env AD_PASS overrides if --password not given)",
    )
    parser.add_argument(
        "--db",
        default="vs_samples.db",
        help="SQLite database path (default: ./vs_samples.db)",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Sampling interval in seconds (default: 60)",
    )
    return parser.parse_args(argv)


def main():
    """CLI entry point for the VS collector daemon."""
    args = parse_args()

    # Resolve password: --password > AD_PASS env var
    password = args.password or os.environ.get("AD_PASS", "")
    if not password:
        print("错误: 未指定密码，请使用 --password 或设置环境变量 AD_PASS", file=sys.stderr)
        sys.exit(1)

    collector = VSCollector(
        host=args.host,
        password=password,
        username=args.user,
        db_path=args.db,
        interval=args.interval,
    )

    pid_path = collector.db_path + ".pid"

    # Signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, collector.handle_signal)
    signal.signal(signal.SIGBREAK, collector.handle_signal)

    # Initialize: PID file, DB table, data cleanup
    collector.start(pid_path)

    # Hourly cleanup tracker
    last_cleanup_ts = int(time.time())

    # Main sampling loop
    try:
        while True:
            rows = collector.run_once()

            if rows is not None:
                vs_set = {r[1] for r in rows}
                ts_display = time.strftime(
                    "%Y-%m-%d %H:%M:%S", time.localtime(time.time())
                )
                print(
                    f"[{ts_display}] 采样 {len(vs_set)} 个 VS，{len(rows)} 条记录"
                )

            # Hourly data cleanup
            now = int(time.time())
            if now - last_cleanup_ts >= 3600:
                collector.cleanup_old_data()
                last_cleanup_ts = now

            time.sleep(collector.interval)
    except SystemExit:
        raise
    except KeyboardInterrupt:
        collector.handle_signal(signal.SIGINT, None)


if __name__ == "__main__":
    main()
