#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Unit tests for collector.py -- VS traffic collection daemon."""

import sys
import os

sys.path.insert(
    0,
    os.path.join(
        os.path.dirname(__file__),
        "..",
        ".claude",
        "skills",
        "ad-perception",
        "scripts",
    ),
)

import io
import signal
import sqlite3
import tempfile
import time
import unittest
from unittest.mock import MagicMock, patch

from collector import VSCollector
from db_schema import VS_SAMPLES_DDL, COLUMNS


class TestCollector(unittest.TestCase):
    """Test suite for VSCollector."""

    def test_create_table_on_first_run(self):
        """Verify vs_samples table is created on first DB open."""
        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        try:
            cursor = collector.conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='vs_samples'"
            )
            self.assertIsNotNone(cursor.fetchone())
        finally:
            collector.close_db()

    def test_resume_with_existing_db(self):
        """Data survives reconnect via IF NOT EXISTS."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        try:
            # First connection: create table, insert a row
            c1 = VSCollector("https://10.0.0.1", "testpass", db_path=db_path)
            c1.open_db()
            c1.conn.execute(
                "INSERT INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
                (1000, "vs1", "connection", 5.0),
            )
            c1.conn.commit()
            c1.close_db()

            # Second connection: reuse same file (IF NOT EXISTS)
            c2 = VSCollector("https://10.0.0.1", "testpass", db_path=db_path)
            c2.open_db()
            cursor = c2.conn.execute(
                "SELECT ts, vs_name, metric, value FROM vs_samples"
            )
            rows = cursor.fetchall()
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0], (1000, "vs1", "connection", 5.0))
            c2.close_db()
        finally:
            os.unlink(db_path)

    def test_insert_sample(self):
        """A single sample row is stored correctly."""
        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        try:
            collector.conn.execute(
                "INSERT OR REPLACE INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
                (1000, "vs1", "connection", 5.0),
            )
            collector.conn.commit()
            cursor = collector.conn.execute("SELECT * FROM vs_samples")
            rows = cursor.fetchall()
            self.assertEqual(len(rows), 1)
            row = rows[0]
            self.assertEqual(row[1], 1000)
            self.assertEqual(row[2], "vs1")
            self.assertEqual(row[3], "connection")
            self.assertEqual(row[4], 5.0)
        finally:
            collector.close_db()

    def test_insert_or_replace_dedup(self):
        """Duplicate (ts, vs_name, metric) overwrites value via INSERT OR REPLACE."""
        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        try:
            collector.conn.execute(
                "INSERT OR REPLACE INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
                (1000, "vs1", "connection", 5.0),
            )
            collector.conn.execute(
                "INSERT OR REPLACE INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
                (1000, "vs1", "connection", 10.0),
            )
            collector.conn.commit()
            cursor = collector.conn.execute("SELECT * FROM vs_samples")
            rows = cursor.fetchall()
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0][4], 10.0)
        finally:
            collector.close_db()

    def test_cleanup_old_data(self):
        """Rows older than 30 days are deleted during cleanup."""
        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        collector.close_db()
        collector.conn = sqlite3.connect(":memory:")
        collector.conn.executescript(VS_SAMPLES_DDL)

        now = int(time.time())
        old_ts = now - 31 * 86400
        recent_ts = now - 1 * 86400

        collector.conn.execute(
            "INSERT OR REPLACE INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
            (old_ts, "vs_old", "connection", 1.0),
        )
        collector.conn.execute(
            "INSERT OR REPLACE INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
            (recent_ts, "vs_recent", "connection", 2.0),
        )
        collector.conn.commit()

        collector.cleanup_old_data(cutoff=now - 30 * 86400)

        cursor = collector.conn.execute(
            "SELECT vs_name, value FROM vs_samples ORDER BY vs_name"
        )
        rows = cursor.fetchall()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0][0], "vs_recent")
        collector.conn.close()

    def test_parse_vs_stat_response(self):
        """API response is parsed into correct (ts, vs_name, metric, value) rows."""
        mock_response = {
            "items": [
                {
                    "name": "vs_web",
                    "connection": 100,
                    "connection_rate": 5.0,
                    "upstream_throughput": 1024.5,
                },
                {
                    "name": "vs_api",
                    "connection": 200,
                    "connection_rate": 10.0,
                    "downstream_throughput": 2048.0,
                },
            ]
        }

        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        try:
            rows = collector.parse_vs_stat(mock_response)
            self.assertEqual(len(rows), 6)

            row_tuples = {(r[1], r[2], r[3]) for r in rows}
            self.assertIn(("vs_web", "connection", 100.0), row_tuples)
            self.assertIn(("vs_web", "connection_rate", 5.0), row_tuples)
            self.assertIn(("vs_web", "upstream_throughput", 1024.5), row_tuples)
            self.assertIn(("vs_api", "connection", 200.0), row_tuples)
            self.assertIn(("vs_api", "connection_rate", 10.0), row_tuples)
            self.assertIn(("vs_api", "downstream_throughput", 2048.0), row_tuples)

            ts_set = {r[0] for r in rows}
            self.assertEqual(len(ts_set), 1)
        finally:
            collector.close_db()

    @patch("collector.ADClient.get_vs_stat")
    def test_consecutive_failures_logged(self, mock_get_vs_stat):
        """5 consecutive failures trigger STALLED message."""
        mock_get_vs_stat.side_effect = Exception("API timeout")

        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        try:
            stderr_buf = io.StringIO()
            with patch("sys.stderr", stderr_buf):
                for i in range(5):
                    result = collector.run_once()
                    self.assertIsNone(result)

            all_output = stderr_buf.getvalue()
            self.assertIn("连续 5 次", all_output)
            self.assertEqual(collector.consecutive_failures, 5)
        finally:
            collector.close_db()

    @patch("collector.ADClient.get_vs_stat")
    def test_single_failure_logs_warn_not_stalled(self, mock_get_vs_stat):
        """1 failure logs WARN but does NOT trigger STALLED."""
        mock_get_vs_stat.side_effect = Exception("API timeout")

        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        try:
            stderr_buf = io.StringIO()
            with patch("sys.stderr", stderr_buf):
                result = collector.run_once()
                self.assertIsNone(result)

            all_output = stderr_buf.getvalue()
            self.assertIn("WARN", all_output)
            self.assertNotIn("连续 5 次", all_output)
            self.assertEqual(collector.consecutive_failures, 1)
        finally:
            collector.close_db()

    def test_db_path_printed_absolute(self):
        """Startup resolves DB path to absolute."""
        collector = VSCollector(
            "https://10.0.0.1", "testpass", db_path="relative_path.db"
        )
        self.assertTrue(os.path.isabs(collector.db_path))
        self.assertTrue(collector.db_path.endswith("relative_path.db"))

    def test_duplicate_start_blocked_exit_6(self):
        """Starting with a live PID in the PID file exits with code 6."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, "test.db")
            pid_path = db_path + ".pid"

            # Pre-create PID file with current (live) PID
            with open(pid_path, "w") as f:
                f.write(str(os.getpid()))

            collector = VSCollector(
                "https://10.0.0.1", "testpass", db_path=db_path
            )
            stderr_buf = io.StringIO()
            with patch("sys.stderr", stderr_buf):
                with self.assertRaises(SystemExit) as cm:
                    collector.start(pid_path)

            self.assertEqual(cm.exception.code, 6)
            output = stderr_buf.getvalue()
            self.assertIn("已在运行", output)

    def test_sigint_graceful_shutdown(self):
        """Signal handler closes DB, deletes PID, and exits 0."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, "test.db")
            pid_path = db_path + ".pid"

            collector = VSCollector(
                "https://10.0.0.1", "testpass", db_path=db_path
            )
            collector.start(pid_path)
            self.assertIsNotNone(collector.conn)
            self.assertTrue(os.path.exists(pid_path))

            stdout_buf = io.StringIO()
            with patch("sys.stdout", stdout_buf):
                with self.assertRaises(SystemExit) as cm:
                    collector.handle_signal(signal.SIGINT, None)

            self.assertEqual(cm.exception.code, 0)
            self.assertIsNone(collector.conn)
            self.assertFalse(os.path.exists(pid_path))
            self.assertIn("采集器已停止", stdout_buf.getvalue())

    def test_stale_pid_cleaned_on_start(self):
        """A stale (dead) PID file is cleaned up and recreated on start."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, "test.db")
            pid_path = db_path + ".pid"

            # Pre-create PID file with a definitely dead PID
            with open(pid_path, "w") as f:
                f.write("999999999")

            collector = VSCollector(
                "https://10.0.0.1", "testpass", db_path=":memory:"
            )
            collector.start(pid_path)

            # PID file should now contain this process's PID
            self.assertTrue(os.path.exists(pid_path))
            with open(pid_path) as f:
                actual_pid = int(f.read().strip())
            self.assertEqual(actual_pid, os.getpid())
            collector.close_db()

    @patch("collector.ADClient.get_vs_stat")
    def test_stalled_recovery_resets_counter(self, mock_get_vs_stat):
        """After STALLED, a successful call resets counter and logs RECOVERED."""
        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        try:
            # 5 failures to reach STALLED
            mock_get_vs_stat.side_effect = Exception("API timeout")
            stderr_buf = io.StringIO()
            with patch("sys.stderr", stderr_buf):
                for i in range(5):
                    collector.run_once()

            self.assertIn("连续 5 次", stderr_buf.getvalue())
            self.assertEqual(collector.consecutive_failures, 5)

            # Now succeed
            mock_get_vs_stat.side_effect = None
            mock_get_vs_stat.return_value = {
                "items": [{"name": "vs1", "connection": 100}]
            }

            stderr_buf2 = io.StringIO()
            with patch("sys.stderr", stderr_buf2):
                rows = collector.run_once()

            self.assertEqual(collector.consecutive_failures, 0)
            self.assertIsNotNone(rows)
            self.assertIn("RECOVERED", stderr_buf2.getvalue())
        finally:
            collector.close_db()


if __name__ == "__main__":
    unittest.main()
