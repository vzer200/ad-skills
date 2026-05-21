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
sys.path.append(os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts")))

import io
import signal
import sqlite3
import tempfile
import time
import unittest
from unittest.mock import MagicMock, patch

from collector import (
    VSCollector, _inject_trend_into_db, _inject_system_trend_into_db,
    collect_once, collect_system_once, collect_and_analyze,
    _derive_db_path, _fetch_system_trend,
)
from db_schema import VS_SAMPLES_DDL, DEVICE_STATE_DDL, COLUMNS


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
        fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)  # Close file handle so SQLite gets exclusive access
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
            try:
                os.unlink(db_path)
            except PermissionError:
                pass

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

    def test_parse_vs_stat_nested_dict(self):
        """API response with nested dict values (real AD format) is parsed correctly."""
        mock_response = {
            "items": [
                {
                    "name": "vs_web",
                    "connection": {"model": "INSTANT", "value": 100, "unit": "COUNT"},
                    "connection_rate": {"model": "INSTANT", "value": 5.0, "unit": "REQUEST-PER-SECOND"},
                },
            ]
        }

        collector = VSCollector("https://10.0.0.1", "testpass", db_path=":memory:")
        collector.open_db()
        try:
            rows = collector.parse_vs_stat(mock_response)
            self.assertEqual(len(rows), 2)

            row_tuples = {(r[1], r[2], r[3]) for r in rows}
            self.assertIn(("vs_web", "connection", 100.0), row_tuples)
            self.assertIn(("vs_web", "connection_rate", 5.0), row_tuples)
        finally:
            collector.close_db()

    def test_check_process_alive_dead_pid(self):
        """A definitely-dead PID should return False cross-platform."""
        from collector import _check_process_alive
        self.assertFalse(_check_process_alive(999999999))

    def test_default_db_derived_from_host(self):
        """When --db is not specified, the default DB path is derived from host."""
        collector = VSCollector("https://192.168.8.31", "testpass")
        self.assertIn("192.168.8.31", collector.db_path)
        self.assertTrue(collector.db_path.endswith(".db"))

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


class TestInjectTrendIntoDB(unittest.TestCase):
    """Tests for _inject_trend_into_db — trend API data → SQLite."""

    def setUp(self):
        fd, self.db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)

    def tearDown(self):
        try:
            os.unlink(self.db_path)
        except PermissionError:
            pass

    def test_inject_creates_table_and_inserts_rows(self):
        """Valid trend data should create table and insert rows."""
        trend_data = {
            'items': [
                {'name': 'connection_rate', 'values': [1340, 1327, 1379], 'unit': 'REQUEST-PER-SECOND'},
                {'name': 'connection', 'values': [13425, 13306, 13200], 'unit': 'COUNT'},
            ]
        }
        count = _inject_trend_into_db(self.db_path, 'vs_test', trend_data)
        self.assertEqual(count, 6)

        conn = sqlite3.connect(self.db_path)
        rows = conn.execute("SELECT COUNT(*) FROM vs_samples").fetchone()[0]
        self.assertEqual(rows, 6)
        conn.close()

    def test_inject_synthesizes_timestamps(self):
        """Timestamps should be in the past (within last hour) and monotonically increasing."""
        trend_data = {
            'items': [
                {'name': 'connection_rate', 'values': [100.0, 200.0, 300.0]},
            ]
        }
        _inject_trend_into_db(self.db_path, 'vs_test', trend_data)

        conn = sqlite3.connect(self.db_path)
        rows = conn.execute("SELECT ts FROM vs_samples ORDER BY ts").fetchall()
        conn.close()

        now = int(time.time())
        for (ts,) in rows:
            self.assertGreater(ts, now - 3600)
            self.assertLess(ts, now + 10)

        # Timestamps should be strictly increasing
        for i in range(len(rows) - 1):
            self.assertLess(rows[i][0], rows[i + 1][0])

    def test_inject_empty_data(self):
        """Empty items list should return 0."""
        count = _inject_trend_into_db(self.db_path, 'vs_test', {'items': []})
        self.assertEqual(count, 0)

    def test_inject_none_data(self):
        """None trend_data should return 0."""
        count = _inject_trend_into_db(self.db_path, 'vs_test', None)
        self.assertEqual(count, 0)

    def test_inject_skips_non_numeric_values(self):
        """Non-numeric values in the values array should be skipped."""
        trend_data = {
            'items': [
                {'name': 'metric1', 'values': [100, None, 200, 'bad', 300]},
            ]
        }
        count = _inject_trend_into_db(self.db_path, 'vs_test', trend_data)
        self.assertEqual(count, 3)  # only 100, 200, 300

    def test_inject_skips_empty_metric_name(self):
        """Items with empty name should be skipped."""
        trend_data = {
            'items': [
                {'name': '', 'values': [1, 2, 3]},
                {'name': 'valid', 'values': [4, 5]},
            ]
        }
        count = _inject_trend_into_db(self.db_path, 'vs_test', trend_data)
        self.assertEqual(count, 2)

    def test_inject_idempotent(self):
        """Second injection with same data should overwrite, not duplicate."""
        trend_data = {
            'items': [
                {'name': 'connection_rate', 'values': [100.0, 200.0]},
            ]
        }
        _inject_trend_into_db(self.db_path, 'vs_test', trend_data)
        _inject_trend_into_db(self.db_path, 'vs_test', trend_data)

        conn = sqlite3.connect(self.db_path)
        count = conn.execute("SELECT COUNT(*) FROM vs_samples").fetchone()[0]
        conn.close()
        self.assertEqual(count, 2)  # not 4


class TestCollectOnce(unittest.TestCase):
    """Tests for collect_once — fetch VS names + trend data + inject."""

    def setUp(self):
        fd, self.db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        self.client = MagicMock()

    def tearDown(self):
        try:
            os.unlink(self.db_path)
        except PermissionError:
            pass

    def test_collect_once_fetches_and_injects(self):
        """Should fetch VS names, get trend for each, inject into DB."""
        self.client.get_virtual_services.return_value = {
            'items': [{'name': 'vs_a'}, {'name': 'vs_b'}]
        }
        self.client.get_vs_trend_by_name.return_value = {
            'items': [
                {'name': 'connection_rate', 'values': [100.0, 200.0]},
                {'name': 'connection', 'values': [1000.0, 2000.0]},
            ]
        }

        count = collect_once(self.client, self.db_path)
        self.assertEqual(count, 8)  # 2 VS × 2 metrics × 2 values

        conn = sqlite3.connect(self.db_path)
        rows = conn.execute("SELECT DISTINCT vs_name FROM vs_samples").fetchall()
        vs_names = {r[0] for r in rows}
        self.assertEqual(vs_names, {'vs_a', 'vs_b'})
        conn.close()

    def test_collect_once_no_vs(self):
        """Empty VS list should return 0."""
        self.client.get_virtual_services.return_value = {'items': []}
        count = collect_once(self.client, self.db_path)
        self.assertEqual(count, 0)

    def test_collect_once_api_error_graceful(self):
        """API error in get_virtual_services should return 0."""
        self.client.get_virtual_services.side_effect = Exception("API error")
        count = collect_once(self.client, self.db_path)
        self.assertEqual(count, 0)

    def test_collect_once_trend_error_per_vs(self):
        """Trend API error for one VS should not block others."""
        self.client.get_virtual_services.return_value = {
            'items': [{'name': 'vs_a'}, {'name': 'vs_b'}]
        }
        call_count = [0]

        def mock_trend(vn, trend='last-hour'):
            call_count[0] += 1
            if vn == 'vs_a':
                raise Exception("API error")
            return {
                'items': [{'name': 'm1', 'values': [1.0, 2.0]}]
            }

        self.client.get_vs_trend_by_name.side_effect = mock_trend
        count = collect_once(self.client, self.db_path)
        self.assertEqual(count, 2)  # only vs_b succeeded


class TestCollectAndAnalyze(unittest.TestCase):
    """Tests for collect_and_analyze — full collect+analyze pipeline."""

    def setUp(self):
        fd, self.db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        self.client = MagicMock()
        self.client.host = 'https://10.0.0.1'

    def tearDown(self):
        try:
            os.unlink(self.db_path)
        except PermissionError:
            pass

    def test_collect_and_analyze_returns_report(self):
        """Should return a result dict with status, anomalies, report."""
        self.client.get_virtual_services.return_value = {
            'items': [{'name': 'vs_a'}]
        }
        # Generate 60+ points so 3σ has enough data (> min_window=30)
        self.client.get_vs_trend_by_name.return_value = {
            'items': [
                {'name': 'connection_rate', 'values': [100.0 + (i % 10) * 2.0 for i in range(60)]},
                {'name': 'connection', 'values': [5000.0 + (i % 5) * 10.0 for i in range(60)]},
            ]
        }

        result = collect_and_analyze(self.client, self.db_path)
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(result['device'], 'https://10.0.0.1')
        self.assertGreater(result['rows_injected'], 0)
        self.assertIn('report', result)
        self.assertIsInstance(result['anomalies'], list)

    def test_collect_and_analyze_no_data(self):
        """When no VS exist, should return ok status with note (not an error)."""
        self.client.get_virtual_services.return_value = {'items': []}
        result = collect_and_analyze(self.client, self.db_path)
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(result['rows_injected'], 0)
        self.assertIn('note', result)


class TestDeriveDBPath(unittest.TestCase):
    """Tests for _derive_db_path helper."""

    def test_derives_from_url(self):
        path = _derive_db_path("https://192.168.8.31")
        self.assertIn("192.168.8.31", path)
        self.assertTrue(path.endswith(".db"))

    def test_special_chars_replaced(self):
        path = _derive_db_path("https://10.0.0.1:8443/")
        self.assertNotIn(":", path.split("vs_samples_")[1])
        self.assertNotIn("/", path)


class TestSystemTrend(unittest.TestCase):
    """Tests for system metric trend collection functions."""

    def setUp(self):
        fd, self.db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        self.client = MagicMock()

    def tearDown(self):
        try:
            os.unlink(self.db_path)
        except PermissionError:
            pass

    def test_fetch_system_trend_calls_request(self):
        """_fetch_system_trend should call client._request with correct path and params."""
        client = MagicMock()
        client._request.return_value = {'values': [10, 20, 30]}
        result = _fetch_system_trend(client, 'cpu_usage')
        client._request.assert_called_once_with(
            'GET',
            '/stat/sys/system/cpu_usage',
            params={'trend': 'last-hour', 'all_properties': 'true'},
        )
        self.assertEqual(result, {'values': [10, 20, 30]})

    def test_inject_system_cpu_series_format(self):
        """CPU trend data with series[TotalCpu] should be injected with API timestamps."""
        t0 = int(time.time()) - 1800  # recent enough to survive 7-day cleanup
        trend_data = {
            'start_time': t0,
            'step_time': 60,
            'series': [
                {'name': 'TotalCpu', 'values': [10.0, 20.0, 30.0]},
                {'name': 'CPU0[0]', 'values': [8.0, 18.0, 28.0]},
            ],
        }
        count = _inject_system_trend_into_db(self.db_path, 'cpu', trend_data)
        self.assertEqual(count, 3)

        conn = sqlite3.connect(self.db_path)
        rows = conn.execute("SELECT ts, metric, value FROM device_state ORDER BY ts").fetchall()
        conn.close()
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0][1], 'cpu')
        self.assertEqual(rows[0][0], t0)       # start_time + 0*60
        self.assertEqual(rows[0][2], 10.0)
        self.assertEqual(rows[1][0], t0 + 60)  # start_time + 1*60
        self.assertEqual(rows[1][2], 20.0)
        self.assertEqual(rows[2][0], t0 + 120) # start_time + 2*60
        self.assertEqual(rows[2][2], 30.0)

    def test_inject_system_cpu_no_total_cpu_raises(self):
        """If no TotalCpu key is found in series, ValueError should be raised."""
        trend_data = {
            'start_time': 1000,
            'step_time': 60,
            'series': [
                {'name': 'CPU0[0]', 'values': [8.0, 18.0]},
                {'name': 'CPU0[1]', 'values': [13.0, 9.0]},
            ],
        }
        with self.assertRaises(ValueError) as ctx:
            _inject_system_trend_into_db(self.db_path, 'cpu', trend_data)
        self.assertIn('no TotalCpu key', str(ctx.exception))

    def test_inject_system_memory_flat_values(self):
        """Memory trend data with flat values array should be injected."""
        t0 = int(time.time()) - 1800  # recent enough to survive 7-day cleanup
        trend_data = {
            'start_time': t0,
            'step_time': 60,
            'values': [36.0, 37.0, 38.0],
        }
        count = _inject_system_trend_into_db(self.db_path, 'memory', trend_data)
        self.assertEqual(count, 3)

        conn = sqlite3.connect(self.db_path)
        rows = conn.execute("SELECT ts, metric, value FROM device_state ORDER BY ts").fetchall()
        conn.close()
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0][1], 'memory')
        self.assertEqual(rows[0][0], t0)
        self.assertEqual(rows[1][0], t0 + 60)

    def test_inject_system_unknown_format_raises(self):
        """Unknown format (no series, no values) should raise ValueError."""
        with self.assertRaises(ValueError) as ctx:
            _inject_system_trend_into_db(self.db_path, 'cpu', {'unknown_key': []})
        self.assertIn('Unknown system trend format', str(ctx.exception))

    @patch('collector._fetch_system_trend')
    def test_collect_system_once_integration(self, mock_fetch):
        """collect_system_once should fetch all 3 metrics and inject them."""
        t0 = int(time.time()) - 1800  # recent enough to survive 7-day cleanup
        mock_fetch.side_effect = [
            {   # cpu_usage
                'start_time': t0, 'step_time': 60,
                'series': [{'name': 'TotalCpu', 'values': [10.0, 20.0]}],
            },
            {   # memory_usage
                'start_time': t0, 'step_time': 60,
                'values': [30.0, 40.0],
            },
            {   # connection_rate
                'start_time': t0, 'step_time': 60,
                'values': [0.0, 0.0],
            },
        ]
        count = collect_system_once(self.client, self.db_path)
        self.assertEqual(count, 6)  # 2 + 2 + 2

        conn = sqlite3.connect(self.db_path)
        metrics = conn.execute(
            "SELECT DISTINCT metric FROM device_state ORDER BY metric"
        ).fetchall()
        conn.close()
        metric_names = {r[0] for r in metrics}
        self.assertEqual(metric_names, {'cpu', 'memory', 'connection_rate'})

    def test_device_state_cleanup_7day(self):
        """Rows older than 7 days in device_state should be deleted during injection."""
        conn = sqlite3.connect(self.db_path)
        conn.executescript(DEVICE_STATE_DDL)

        now = int(time.time())
        old_ts = now - 8 * 86400
        recent_ts = now - 1 * 86400

        conn.execute(
            "INSERT INTO device_state (ts, metric, value) VALUES (?, ?, ?)",
            (old_ts, 'cpu', 10.0),
        )
        conn.execute(
            "INSERT INTO device_state (ts, metric, value) VALUES (?, ?, ?)",
            (recent_ts, 'cpu', 20.0),
        )
        conn.commit()
        conn.close()

        # Trigger cleanup by injecting new data
        trend_data = {
            'start_time': now, 'step_time': 60,
            'values': [50.0],
        }
        _inject_system_trend_into_db(self.db_path, 'cpu', trend_data)

        conn = sqlite3.connect(self.db_path)
        rows = conn.execute(
            "SELECT ts, metric, value FROM device_state ORDER BY ts"
        ).fetchall()
        conn.close()

        timestamps = [r[0] for r in rows]
        self.assertNotIn(old_ts, timestamps)
        self.assertIn(recent_ts, timestamps)
        self.assertGreaterEqual(len(rows), 2)  # recent + newly injected


if __name__ == "__main__":
    unittest.main()
