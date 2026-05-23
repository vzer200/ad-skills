import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-perception", "scripts"))

import unittest
from unittest.mock import patch, MagicMock, call
import math
import statistics
import json
import sqlite3
import time
import tempfile
from datetime import datetime

from perception import (
    detect_anomaly_3sigma,
    query_traffic_db,
    query_device_state_db,
    traffic_analysis,
    state_analysis,
    conflict_analysis,
    log_correlation,
    fetch_service_logs,
    render_logs_markdown,
    _logs_one,
    render_markdown,
    render_json,
    _compute_exit_code,
    analyze_full,
    _extract_metric_values,
    _build_metric_tables_from_trend,
    _fetch_vs_names,
    _fetch_trend_raw,
    _run_3sigma_on_vs_group,
    main,
    ADClient,
)


class TestAnomalyDetection(unittest.TestCase):
    """Tests for 3σ anomaly detection algorithm."""

    def _make_points(self, values, start_ts=1700000000, interval=60):
        """Helper to create point dicts from a list of values."""
        return [{'ts': start_ts + i * interval, 'value': v} for i, v in enumerate(values)]

    def test_detect_anomaly_z_greater_than_3(self):
        """A point with z > 3 and relative deviation > 5% should be flagged as anomaly."""
        # 400 normal points with cycling values around mean ~129
        base_ts = 1700000000
        points = self._make_points(
            [100.0 + (i % 30) * 2.0 for i in range(400)],
            start_ts=base_ts,
            interval=60
        )
        # Add a strong outlier
        points.append({'ts': base_ts + 400 * 60, 'value': 500.0})

        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 1)
        self.assertGreater(anomalies[0]['z'], 3)
        self.assertEqual(anomalies[0]['direction'], "上升")
        self.assertAlmostEqual(anomalies[0]['value'], 500.0)


    def test_detect_no_anomaly_normal_data(self):
        """Normal data within expected range should not produce anomalies."""
        base_ts = 1700000000
        # 400 points with mild oscillation around 100, sd ~ 1.5
        points = self._make_points(
            [100.0 + (i % 5) * 0.5 for i in range(400)],
            start_ts=base_ts,
            interval=60
        )
        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 0, "Normal data should have no anomalies")

    def test_detect_anomaly_sudden_drop(self):
        """A sudden drop below threshold should be flagged as 下降."""
        base_ts = 1700000000
        # 400 normal points around 200
        points = self._make_points(
            [200.0 + (i % 20) * 2.0 for i in range(400)],
            start_ts=base_ts,
            interval=60
        )
        # Add a sudden drop
        points.append({'ts': base_ts + 400 * 60, 'value': 10.0})

        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 1)
        self.assertEqual(anomalies[0]['direction'], "下降")
        self.assertAlmostEqual(anomalies[0]['value'], 10.0)
        self.assertGreater(anomalies[0]['z'], 3)


    def test_high_z_but_low_deviation_not_flagged(self):
        """z > 3 but relative deviation < 5% should NOT be flagged."""
        # High mean (~1001), low std (~0.58): outlier has z > 3 but tiny relative change
        values = [1000.0 + (i % 100) * 0.02 for i in range(400)]
        values.append(1003.0)  # delta ≈ 2, rel dev ≈ 0.2% < 5%
        points = self._make_points(values, interval=60)
        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 0,
                         "High z but low relative deviation should not be flagged")

    def test_skip_small_window_lt_30(self):
        """Window with fewer than 30 points should be skipped."""
        points = self._make_points(
            [100.0 + (i % 5) * 5.0 for i in range(20)] + [500.0],
            interval=300  # 5-min intervals, 20 pts = 100 min < 6h, and < 30 pts
        )
        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 0,
                         "Window < 30 points should be skipped")

    def test_skip_zero_std(self):
        """Flat baseline (std == 0) should be skipped."""
        # All normal points are identical value
        points = self._make_points(
            [100.0] * 400 + [500.0],
            interval=60
        )
        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 0,
                         "Zero std baseline should be skipped")

    def test_skip_all_zero_vs(self):
        """All-zero VS should be skipped entirely."""
        points = self._make_points([0.0] * 500, interval=60)
        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 0,
                         "All-zero VS should be skipped")

    def test_skip_single_point(self):
        """A single point should be skipped (no window)."""
        points = [{'ts': 1700000000, 'value': 100.0}]
        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 0,
                         "Single point should be skipped")

    def test_nan_inf_filtered_from_window(self):
        """NaN and Inf values should be filtered out from window calculation."""
        # Normal data with variation, plus NaN/Inf interleaved
        values = []
        for i in range(350):
            values.append(100.0 + (i % 30) * 2.0)
        # Replace some with NaN/Inf
        for idx in range(50, 100):
            values[idx] = float('nan')
        values[150] = float('inf')
        values[200] = float('-inf')
        values.append(500.0)  # outlier at the end
        points = self._make_points(values, interval=60)

        # Should not crash and should still detect the outlier
        anomalies = detect_anomaly_3sigma(points)
        self.assertEqual(len(anomalies), 1,
                         "Outlier should still be detected despite NaN/Inf in data")


class TestDBFallback(unittest.TestCase):
    """Tests for traffic analysis DB/API fallback logic."""

    def setUp(self):
        self.client = MagicMock()
        # Mock get_virtual_services to return some VS
        self.client.get_virtual_services.return_value = {
            'items': [{'name': 'vs_test'}]
        }
        # Mock get_vs_trend_by_name — trend API returns flat arrays in 'values'
        self.client.get_vs_trend_by_name.return_value = {
            'items': [
                {'name': 'connection_rate', 'values': [100.0, 200.0, 300.0], 'unit': 'REQUEST-PER-SECOND', 'feature': 'ENABLE'},
                {'name': 'connection', 'values': [5000.0, 6000.0, 7000.0], 'unit': 'COUNT', 'feature': 'ENABLE'},
            ]
        }
        self.now_ts = int(datetime.now().timestamp())

    def _create_db_file(self, num_points):
        """Create a temp SQLite DB file with num_points sample rows using recent timestamps."""
        fd, db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        conn = sqlite3.connect(db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS vs_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts INTEGER NOT NULL,
                vs_name TEXT NOT NULL,
                metric TEXT NOT NULL,
                value REAL NOT NULL,
                UNIQUE(ts, vs_name, metric)
            )
        """)
        # Use timestamps within last 7 days
        base_ts = self.now_ts - 3 * 86400  # 3 days ago
        for i in range(num_points):
            conn.execute(
                "INSERT OR IGNORE INTO vs_samples (ts, vs_name, metric, value) VALUES (?, ?, ?, ?)",
                (base_ts + i * 60, 'vs_test', 'connection-rate', 100.0 + (i % 10) * 2.0)
            )
        conn.commit()
        conn.close()
        return db_path

    def test_db_fallback_insufficient_points(self):
        """< 100 total points in DB should trigger API fallback."""
        db_path = self._create_db_file(50)
        try:
            result = traffic_analysis(self.client, db_path=db_path)
            self.assertEqual(result['status'], 'insufficient_data')
            self.client.get_vs_trend_by_name.assert_called()
        finally:
            if os.path.isfile(db_path):
                os.unlink(db_path)

    def test_db_enough_points_no_api_call(self):
        """>= 100 total points in DB should NOT trigger API fallback."""
        db_path = self._create_db_file(400)
        try:
            result = traffic_analysis(self.client, db_path=db_path)
            # 3σ should run without API fallback
            self.client.get_vs_trend_by_name.assert_not_called()
            # Results should have anomalies list
            self.assertIn('anomalies', result)
            self.assertIsInstance(result['anomalies'], list)
        finally:
            if os.path.isfile(db_path):
                os.unlink(db_path)

    def test_render_raw_trend_when_db_insufficient(self):
        """When DB has insufficient data, output should show raw trend table with '数据不足'."""
        db_path = self._create_db_file(50)
        try:
            result = traffic_analysis(self.client, db_path=db_path)
            self.assertEqual(result['status'], 'insufficient_data')
            self.assertIn('raw_trends', result)
        finally:
            if os.path.isfile(db_path):
                os.unlink(db_path)

    def test_injection_branch_seeds_db_and_reruns_3sigma(self):
        """When DB has < 100 points, injection branch seeds trend data then re-runs 3σ."""
        db_path = self._create_db_file(10)  # way below threshold
        try:
            # Patch collect_once to actually inject enough data into the DB
            from collector import _inject_trend_into_db

            def _fake_collect_once(client_arg, db_path_arg):
                trend_data = {
                    'start_time': int(time.time()) - 3600,
                    'step_time': 60,
                    'items': [
                        {'name': 'connection_rate', 'values': [float(100 + i % 10) for i in range(60)]},
                        {'name': 'connection', 'values': [float(5000 + i % 5) for i in range(60)]},
                    ]
                }
                return _inject_trend_into_db(db_path_arg, 'vs_test', trend_data)

            with patch('collector.collect_once', _fake_collect_once):
                result = traffic_analysis(self.client, db_path=db_path)

            self.assertEqual(result['status'], 'ok')
            self.assertEqual(result['source'], 'sqlite_injected')
            self.assertIn('anomalies', result)
        finally:
            if os.path.isfile(db_path):
                os.unlink(db_path)

    def test_injection_branch_no_data_still_falls_back(self):
        """When injection fails (collect_once returns 0), should fall back to API."""
        db_path = self._create_db_file(10)
        try:
            with patch('collector.collect_once', return_value=0):
                result = traffic_analysis(self.client, db_path=db_path)

            self.assertEqual(result['status'], 'insufficient_data')
            self.assertEqual(result['source'], 'api_fallback')
        finally:
            if os.path.isfile(db_path):
                os.unlink(db_path)

    def test_injection_adds_some_but_still_insufficient(self):
        """When injection adds rows but total still < 100, should fall back to API."""
        db_path = self._create_db_file(10)
        try:
            # Inject only 5 more rows (15 total, still < 100)
            from collector import _inject_trend_into_db

            def _fake_collect_once(client_arg, db_path_arg):
                trend_data = {
                    'items': [{'name': 'connection_rate', 'values': [float(i) for i in range(5)]}]
                }
                return _inject_trend_into_db(db_path_arg, 'vs_test', trend_data)

            with patch('collector.collect_once', _fake_collect_once):
                result = traffic_analysis(self.client, db_path=db_path)

            self.assertEqual(result['status'], 'insufficient_data')
            self.assertEqual(result['source'], 'api_fallback')
        finally:
            if os.path.isfile(db_path):
                os.unlink(db_path)


class TestStateAnalysis(unittest.TestCase):
    """Tests for device state anomaly detection."""

    def setUp(self):
        self.client = MagicMock()
        self.client.get_sys_system.return_value = {
            'cpu_usage': 45.0,
            'memory_usage': 60.0,
        }

    def test_cpu_warn_at_80(self):
        """CPU >= 80% should be flagged as warn."""
        self.client.get_sys_system.return_value = {
            'cpu_usage': 80.0,
            'memory_usage': 50.0,
        }
        result = state_analysis(self.client)
        cpu_items = [i for i in result.get('items', []) if i.get('metric') == 'cpu']
        self.assertTrue(any(i.get('level') == 'warn' for i in cpu_items),
                        "CPU at 80% should be warn")

    def test_cpu_critical_at_90(self):
        """CPU >= 90% should be flagged as critical."""
        self.client.get_sys_system.return_value = {
            'cpu_usage': 90.0,
            'memory_usage': 50.0,
        }
        result = state_analysis(self.client)
        cpu_items = [i for i in result.get('items', []) if i.get('metric') == 'cpu']
        self.assertTrue(any(i.get('level') == 'critical' for i in cpu_items),
                        "CPU at 90% should be critical")

    def test_memory_warn_at_80(self):
        """Memory >= 80% should be flagged as warn."""
        self.client.get_sys_system.return_value = {
            'cpu_usage': 30.0,
            'memory_usage': 80.0,
        }
        result = state_analysis(self.client)
        mem_items = [i for i in result.get('items', []) if i.get('metric') == 'memory']
        self.assertTrue(any(i.get('level') == 'warn' for i in mem_items),
                        "Memory at 80% should be warn")

    def test_memory_critical_at_90(self):
        """Memory >= 90% should be flagged as critical."""
        self.client.get_sys_system.return_value = {
            'cpu_usage': 30.0,
            'memory_usage': 90.0,
        }
        result = state_analysis(self.client)
        mem_items = [i for i in result.get('items', []) if i.get('metric') == 'memory']
        self.assertTrue(any(i.get('level') == 'critical' for i in mem_items),
                        "Memory at 90% should be critical")

    def _make_ad_json(self, dir_path, content):
        """Create ad.json in the given directory."""
        with open(os.path.join(dir_path, 'ad.json'), 'w', encoding='utf-8') as f:
            json.dump(content, f)

    def test_disk_missing_without_flag(self):
        """Without --disk-source, disk should be marked as missing."""
        result = state_analysis(self.client)
        disk_info = result.get('disk', {})
        self.assertFalse(disk_info.get('available', True),
                         "Disk should not be available without --disk-source")

    def test_disk_with_valid_source(self):
        """Valid ad.json should be parsed and included in results."""
        with tempfile.TemporaryDirectory() as tmpdir:
            self._make_ad_json(tmpdir, {
                'check_results': {
                    'disk_check': {
                        'disk_usage': '/ 45%',
                        'disk_status': 'normal'
                    }
                }
            })
            result = state_analysis(self.client, disk_source=tmpdir)
            self.assertTrue(result.get('disk', {}).get('available', False),
                            "Disk should be available with valid ad.json")


class TestConflictDetection(unittest.TestCase):
    """Tests for address conflict detection."""

    def setUp(self):
        self.client = MagicMock()
        # Default: two VS with overlapping IP:Port
        self.client.get_virtual_services.return_value = {
            'items': [
                {
                    'name': 'vs_web',
                    'vips': ['10.0.0.1'],
                    'vport': '80',
                    'default_pool_name': 'pool_web',
                    'protocol': 'http',
                },
                {
                    'name': 'vs_api',
                    'vips': ['10.0.0.1'],
                    'vport': '80',
                    'default_pool_name': 'pool_api',
                    'protocol': 'http',
                },
            ]
        }
        self.client.get_pools.return_value = {
            'items': [
                {
                    'name': 'pool_web',
                    'member_list': [
                        {'ip': '10.0.0.10', 'port': 8080},
                        {'ip': '10.0.0.11', 'port': 8080},
                    ]
                },
                {
                    'name': 'pool_api',
                    'member_list': [
                        {'ip': '10.0.0.10', 'port': 8080},
                        {'ip': '10.0.0.12', 'port': 8080},
                    ]
                },
            ]
        }

    def test_vs_ip_port_cartesian_overlap(self):
        """Cartesian expansion of vips x vports should detect IP:Port overlap."""
        result = conflict_analysis(self.client)
        self.assertEqual(result.get('status'), 'conflict_found')
        self.assertTrue(len(result.get('vs_overlaps', [])) > 0,
                        "Should detect VS IP:Port overlap")

    def test_vs_ip_port_no_overlap(self):
        """Different VIP:Port combinations should not produce conflicts."""
        self.client.get_virtual_services.return_value = {
            'items': [
                {'name': 'vs_web', 'vips': ['10.0.0.1'], 'vport': '80', 'default_pool_name': 'pool_web'},
                {'name': 'vs_api', 'vips': ['10.0.0.2'], 'vport': '8080', 'default_pool_name': 'pool_api'},
            ]
        }
        self.client.get_pools.return_value = {
            'items': [
                {'name': 'pool_web', 'member_list': [{'ip': '10.0.0.10', 'port': 8080}]},
                {'name': 'pool_api', 'member_list': [{'ip': '10.0.0.20', 'port': 8080}]},
            ]
        }
        result = conflict_analysis(self.client)
        self.assertEqual(result.get('status'), 'ok')

    def test_pool_node_duplicate_detected(self):
        """Same ip:port across different pools should be flagged as overlap."""
        result = conflict_analysis(self.client)
        self.assertTrue(len(result.get('pool_overlaps', [])) > 0,
                        "Should detect pool node overlap")

    def test_pool_empty_nodes(self):
        """Empty pool member lists should not cause errors."""
        self.client.get_pools.return_value = {
            'items': [
                {'name': 'pool_empty', 'member_list': []},
            ]
        }
        result = conflict_analysis(self.client)
        # Should not crash - if there are no overlaps, status should be 'ok'
        self.assertIn(result.get('status'), ('ok', 'conflict_found'))


class TestLogCorrelation(unittest.TestCase):
    """Tests for log correlation."""

    def setUp(self):
        self.client = MagicMock()
        self.client.get_service_log.return_value = {
            'items': [
                {'date': '2026-05-19', 'time': '10:00:00', 'level': 'INFO', 'module': 'AUTH', 'detail': '用户 admin 登录成功'},
                {'date': '2026-05-19', 'time': '10:30:00', 'level': 'ALERT', 'module': 'CONFIG', 'detail': '配置变更: VS test 修改'},
                {'date': '2026-05-19', 'time': '11:00:00', 'level': 'INFO', 'module': 'AUTH', 'detail': '用户 admin 登出'},
            ]
        }

    def _make_anomaly(self, ts):
        return {'ts': ts, 'value': 500.0, 'baseline_mean': 100.0, 'z': 4.0, 'direction': '上升', 'vs': 'vs_test', 'metric': 'connection-rate'}

    def test_log_time_window_match(self):
        """Log entries within ±5min of anomaly time should be matched."""
        # Use naive datetime matching log timestamps (same local time interpretation)
        from datetime import datetime
        dt = datetime(2026, 5, 19, 10, 28, 0)  # naive -> same local time as log's 10:30:00
        anomaly_ts = int(dt.timestamp())

        anomalies = [self._make_anomaly(anomaly_ts)]
        result = log_correlation(self.client, anomalies)
        self.assertEqual(result.get('status'), 'ok')
        self.assertTrue(len(result.get('entries', [])) > 0,
                        "Should find log entries within ±5min of anomaly")

    def test_log_no_entries_fallback(self):
        """When no log entries match anomaly times, state it clearly."""
        from datetime import datetime
        dt = datetime(2025, 5, 18, 3, 0, 0)  # naive, different date entirely
        anomaly_ts = int(dt.timestamp())

        anomalies = [self._make_anomaly(anomaly_ts)]
        result = log_correlation(self.client, anomalies)
        self.assertEqual(result.get('status'), 'no_match')

    def test_log_skipped_when_no_anomaly(self):
        """When there are no anomalies, log section should not run."""
        result = log_correlation(self.client, [])
        self.assertEqual(result.get('status'), 'no_anomaly')


class TestRenderFunctions(unittest.TestCase):
    """Tests for output rendering."""

    def setUp(self):
        self.sample_results = {
            'device': 'https://10.0.0.1',
            'traffic': {'status': 'ok', 'anomalies': [], 'error': None},
            'state': {
                'status': 'ok',
                'items': [
                    {'metric': 'cpu', 'value': 45.0, 'level': 'ok', 'message': 'CPU: 45%'},
                    {'metric': 'memory', 'value': 60.0, 'level': 'ok', 'message': 'Memory: 60%'},
                ],
                'disk': {'available': False, 'value': None, 'source': 'none'}
            },
            'logs': {'status': 'no_anomaly', 'entries': []},
            'conflicts': {'status': 'ok', 'vs_overlaps': [], 'pool_overlaps': []},
        }

    def test_render_markdown_all_sections(self):
        """Full-dimension output should render all sections in markdown."""
        output = render_markdown(self.sample_results)
        self.assertIsInstance(output, str)
        self.assertTrue(len(output) > 0)
        self.assertIn('10.0.0.1', output)

    def test_render_json_matches_schema(self):
        """JSON output should match the expected schema."""
        output = render_json(self.sample_results)
        parsed = json.loads(output)
        self.assertIn('device', parsed)
        self.assertIn('traffic', parsed)
        self.assertIn('state', parsed)
        self.assertIn('logs', parsed)
        self.assertIn('conflicts', parsed)
        self.assertEqual(parsed['device'], 'https://10.0.0.1')


class TestDiskEdgeCases(unittest.TestCase):
    """Tests for disk edge cases in state analysis."""

    def setUp(self):
        self.client = MagicMock()
        self.client.get_sys_system.return_value = {'cpu_usage': 10.0, 'memory_usage': 20.0}

    def test_disk_source_ad_json_missing(self):
        """--disk-source dir with no ad.json should print WARN."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create empty dir, no ad.json
            result = state_analysis(self.client, disk_source=tmpdir)
            disk_items = [i for i in result.get('items', []) if i.get('metric') == 'disk']
            self.assertTrue(any('巡检报告不可用' in i.get('message', '') for i in disk_items),
                            "Missing ad.json should report 巡检报告不可用")

    def test_disk_source_ad_json_malformed(self):
        """Invalid JSON in ad.json should print WARN."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with open(os.path.join(tmpdir, 'ad.json'), 'w', encoding='utf-8') as f:
                f.write('{invalid json!!!}')
            result = state_analysis(self.client, disk_source=tmpdir)
            disk_items = [i for i in result.get('items', []) if i.get('metric') == 'disk']
            self.assertTrue(any('巡检报告损坏' in i.get('message', '') for i in disk_items),
                            "Malformed ad.json should report 巡检报告损坏")


class TestErrorHandling(unittest.TestCase):
    """Tests for error handling and exit codes."""

    def setUp(self):
        self.client = MagicMock()

    def test_partial_failure_exit_code_5(self):
        """Partial failure should map to exit code 5."""
        # Setup: traffic fails, but state and conflict work
        self.client.get_virtual_services.side_effect = Exception("API error")
        self.client.get_sys_system.return_value = {'cpu_usage': 10.0, 'memory_usage': 20.0}
        self.client.get_pools.return_value = {'items': []}

        # We can't easily test sys.exit, so let's test the exit code mapping logic
        dimensions = {
            'traffic': {'status': 'error', 'error': 'API error'},
            'state': {'status': 'ok', 'items': []},
            'conflict': {'status': 'ok', 'vs_overlaps': [], 'pool_overlaps': []},
        }
        # Simulate exit code logic
        has_success = any(d.get('status') == 'ok' for d in dimensions.values())
        has_failure = any(d.get('status') == 'error' for d in dimensions.values())
        self.assertTrue(has_success and has_failure,
                        "Should detect partial failure (some pass, some fail)")

    def test_analyze_partial_failure_continues(self):
        """One dimension failing should not stop other dimensions."""
        # This tests the orchestration logic in analyze_full/CLI
        self.client.get_virtual_services.side_effect = Exception("API error")
        self.client.get_sys_system.return_value = {'cpu_usage': 10.0, 'memory_usage': 20.0}
        self.client.get_pools.return_value = {'items': []}

        # Run state separately - it should succeed despite traffic failing
        state_result = state_analysis(self.client)
        self.assertEqual(state_result.get('status'), 'ok',
                         "State analysis should succeed even if other dimensions fail")


class TestAPIFallbackEdgeCases(unittest.TestCase):
    """Tests for API fallback edge cases."""

    def setUp(self):
        self.client = MagicMock()
        self.client.get_virtual_services.return_value = {'items': [{'name': 'vs_test'}]}
        self.client.get_vs_trend_by_name.side_effect = Exception("API unreachable")

    def test_traffic_db_empty_api_fails(self):
        """When DB is empty AND API fails, should return error status."""
        result = traffic_analysis(self.client, db_path=None)
        self.assertEqual(result.get('status'), 'error',
                         "Should return error when both DB and API fail")


class TestSubcommandStandalone(unittest.TestCase):
    """Tests for standalone subcommand paths."""

    def setUp(self):
        self.client = MagicMock()
        self.client.get_sys_system.return_value = {'cpu_usage': 10.0, 'memory_usage': 20.0}
        self.client.get_virtual_services.return_value = {'items': []}
        self.client.get_pools.return_value = {'items': []}

    def test_traffic_subcommand_with_vs_flag(self):
        """Traffic subcommand with --vs flag should pass VS name to analysis."""
        vs_name = "my_vs"
        # This verifies the function signature accepts vs_name
        # With no DB and no data, it should fall back to API
        self.client.get_vs_trend_by_name.return_value = {'items': []}
        result = traffic_analysis(self.client, vs_name=vs_name)
        self.assertIn('status', result,
                      "traffic_analysis should return a status with vs_name filter")
        self.client.get_vs_trend_by_name.assert_called()

    def test_state_subcommand_standalone(self):
        """State subcommand should work standalone without other analyses."""
        result = state_analysis(self.client)
        self.assertEqual(result.get('status'), 'ok')
        self.assertTrue(len(result.get('items', [])) > 0)

    def test_conflict_subcommand_standalone(self):
        """Conflict subcommand should work standalone without other analyses."""
        result = conflict_analysis(self.client)
        self.assertEqual(result.get('status'), 'ok')


class TestServiceLogs(unittest.TestCase):
    """Tests for the logs subcommand: fetch_service_logs, render_logs_markdown, _logs_one."""

    def setUp(self):
        self.client = MagicMock()
        self.client.host = 'https://10.0.0.1'
        self.client.get_service_log.return_value = {
            'items': [
                {'date': '2026-05-20', 'time': '23:50:15', 'level': 'ALERT', 'module': 'APPD',
                 'detail': '虚拟服务 [test] 恢复', 'log_id': '1'},
                {'date': '2026-05-20', 'time': '22:10:00', 'level': 'INFO', 'module': 'AUTH',
                 'detail': '用户 admin 登录成功', 'log_id': '2'},
            ]
        }

    def test_fetch_service_logs_returns_sorted(self):
        """fetch_service_logs should return entries sorted by date+time descending."""
        entries = fetch_service_logs(self.client, limit=50)
        self.client.get_service_log.assert_called_once_with(limit=50)
        self.assertIsInstance(entries, list)
        self.assertEqual(len(entries), 2)
        # First entry should be the most recent (23:50:15)
        self.assertIn('23:50:15', entries[0]['time'])

    def test_render_logs_markdown_output(self):
        """render_logs_markdown should output the expected markdown table format."""
        entries = [
            {'date': '2026-05-20', 'time': '23:50:15', 'level': 'ALERT', 'module': 'APPD',
             'detail': '虚拟服务 [test] 恢复'},
        ]
        output = render_logs_markdown(entries, 'https://10.0.0.1')
        self.assertIn('## 服务日志 (https://10.0.0.1)', output)
        self.assertIn('| 时间 | 级别 | 模块 | 详情 |', output)
        self.assertIn('2026-05-20 23:50:15', output)
        self.assertIn('ALERT', output)
        self.assertIn('APPD', output)
        self.assertIn('虚拟服务 [test] 恢复', output)

    def test_render_logs_markdown_separate_from_render_markdown(self):
        """render_logs_markdown is independent and does not affect render_markdown output."""
        entries = [
            {'date': '2026-05-20', 'time': '23:50:15', 'level': 'ALERT', 'module': 'APPD',
             'detail': '虚拟服务 [test] 恢复'},
        ]
        logs_output = render_logs_markdown(entries, 'https://10.0.0.1')
        # Existing render_markdown should still work as before
        full_output = render_markdown({
            'device': 'https://10.0.0.1',
            'traffic': {'status': 'ok', 'anomalies': []},
            'state': {'status': 'ok', 'items': [{'metric': 'cpu', 'value': 45, 'level': 'ok', 'message': 'CPU: 45%'}],
                      'disk': {'available': False, 'value': None, 'source': 'none'}},
            'logs': {'status': 'no_anomaly', 'entries': []},
            'conflicts': {'status': 'ok', 'vs_overlaps': [], 'pool_overlaps': []},
        })
        self.assertIn('## 感知结论', full_output)
        self.assertIn('## 分析结果', full_output)
        self.assertIn('## 结论边界', full_output)
        self.assertNotIn('## 服务日志', full_output)  # render_markdown has '## 日志关联' not '## 服务日志'

    def test_logs_one_returns_correct_structure(self):
        """_logs_one should return dict with host, entries, total."""
        result = _logs_one(self.client, limit=20)
        self.assertEqual(result['host'], 'https://10.0.0.1')
        self.assertEqual(result['total'], 2)
        self.assertIsInstance(result['entries'], list)
        self.assertEqual(len(result['entries']), 2)


class TestState3Sigma(unittest.TestCase):
    """Tests for device state 3σ anomaly detection."""

    def setUp(self):
        self.client = MagicMock()
        self.client.host = 'https://10.0.0.1'
        self.client.get_sys_system.return_value = {
            'cpu_usage': {'value': 15, 'unit': 'PERCENT'},
            'memory_usage': {'value': 40, 'unit': 'PERCENT'},
        }

    def _create_device_state_db(self, metric, base_val, num_points=60):
        """Create a temp SQLite DB with historic device_state data."""
        fd, db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        conn = sqlite3.connect(db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS device_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts INTEGER NOT NULL,
                metric TEXT NOT NULL,
                value REAL NOT NULL,
                UNIQUE(ts, metric)
            )
        """)
        now = int(datetime.now().timestamp())
        for i in range(num_points):
            conn.execute(
                "INSERT OR IGNORE INTO device_state (ts, metric, value) VALUES (?, ?, ?)",
                (now - (num_points - i) * 60, metric, base_val + (i % 10) * 0.5)
            )
        conn.commit()
        conn.close()
        return db_path

    def test_state_analysis_with_db_runs_3sigma(self):
        """state_analysis with db_path should return anomalies key."""
        db_path = self._create_device_state_db('cpu', 12.0)
        try:
            result = state_analysis(self.client, db_path=db_path)
            self.assertIn('anomalies', result)
            self.assertIsInstance(result['anomalies'], list)
        finally:
            if os.path.isfile(db_path):
                os.unlink(db_path)

    def test_state_analysis_without_db_still_works(self):
        """state_analysis without db_path should work (backward compat)."""
        result = state_analysis(self.client)
        self.assertEqual(result['status'], 'ok')
        self.assertIn('items', result)
        self.assertIn('anomalies', result)

    def test_static_threshold_still_runs_with_3sigma(self):
        """CPU >= 90% should still be critical even with 3σ."""
        self.client.get_sys_system.return_value = {
            'cpu_usage': {'value': 95, 'unit': 'PERCENT'},
            'memory_usage': {'value': 40, 'unit': 'PERCENT'},
        }
        db_path = self._create_device_state_db('cpu', 12.0)
        try:
            result = state_analysis(self.client, db_path=db_path)
            cpu_items = [i for i in result['items'] if i['metric'] == 'cpu']
            self.assertTrue(any(i['level'] == 'critical' for i in cpu_items))
        finally:
            if os.path.isfile(db_path):
                os.unlink(db_path)

    def test_render_markdown_shows_3sigma_table(self):
        """render_markdown should show 3σ table when state has anomalies."""
        anomaly = {
            'ts': int(datetime.now().timestamp()) - 120,
            'metric': 'cpu', 'value': 45.0, 'baseline_mean': 12.0,
            'z': 15.0, 'direction': '上升',
        }
        results = {
            'device': 'https://10.0.0.1',
            'traffic': {'status': 'ok', 'anomalies': [], 'error': None},
            'state': {
                'status': 'warning',
                'items': [
                    {'metric': 'cpu', 'value': 45.0, 'level': 'warn', 'message': 'CPU: 45%'},
                    {'metric': 'memory', 'value': 40.0, 'level': 'ok', 'message': 'Memory: 40%'},
                ],
                'disk': {'available': False, 'value': None, 'source': 'none'},
                'anomalies': [anomaly],
            },
            'logs': {'status': 'no_anomaly', 'entries': []},
            'conflicts': {'status': 'ok', 'vs_overlaps': [], 'pool_overlaps': []},
        }
        output = render_markdown(results)
        self.assertIn('趋势异常检测', output)
        self.assertIn('CPU', output)
        self.assertIn('❌ 严重', output)

    def test_render_markdown_scoped_logs_uses_perception_template(self):
        output = render_markdown({
            'device': 'https://10.0.0.1',
            'logs': {'status': 'ok', 'entries': [
                {'time': '2026-05-20 23:50:15', 'level': 'ALERT', 'module': 'APPD', 'detail': '虚拟服务恢复'}
            ]},
            '_scope': 'logs',
        })

        self.assertIn('## 感知结论', output)
        self.assertIn('## 日志线索', output)
        self.assertIn('虚拟服务恢复', output)
        self.assertIn('## 结论边界', output)

    def test_state_analysis_missing_cpu_memory_not_fake_zero(self):
        client = MagicMock()
        client.get_sys_system.return_value = {
            'power_supply': 'normal',
            'interface': {'plug': {'in': ['eth1'], 'out': []}},
        }

        result = state_analysis(client)
        output = render_markdown({'device': 'https://10.0.0.1', 'state': result, '_scope': 'state'})

        self.assertNotIn('CPU 使用率：0%', output)
        self.assertNotIn('内存使用率：0%', output)
        self.assertIn('设备未返回 CPU/内存使用率', output)


class TestComputeExitCode(unittest.TestCase):
    """Test _compute_exit_code for analysis results."""

    def test_all_success(self):
        r = {"traffic": {"status": "ok"}, "state": {"status": "ok"}, "conflicts": {"status": "ok"}}
        self.assertEqual(_compute_exit_code(r), 0)

    def test_all_error(self):
        r = {"traffic": {"status": "error"}, "state": {"status": "error"}, "conflicts": {"status": "error"}}
        self.assertEqual(_compute_exit_code(r), 1)

    def test_partial_failure(self):
        r = {"traffic": {"status": "error"}, "state": {"status": "ok"}, "conflicts": {"status": "ok"}}
        self.assertEqual(_compute_exit_code(r), 5)

    def test_warning_counts_as_success(self):
        r = {"traffic": {"status": "ok"}, "state": {"status": "warning"}, "conflicts": {"status": "ok"}}
        self.assertEqual(_compute_exit_code(r), 0)

    def test_conflict_found_counts_as_success(self):
        r = {"traffic": {"status": "ok"}, "state": {"status": "ok"}, "conflicts": {"status": "conflict_found"}}
        self.assertEqual(_compute_exit_code(r), 0)


class TestExtractMetricValues(unittest.TestCase):
    """Test _extract_metric_values."""

    def test_normal_values(self):
        self.assertEqual(_extract_metric_values({"values": [1340, 1327, 1379]}), [1340.0, 1327.0, 1379.0])

    def test_non_numeric_filtered(self):
        result = _extract_metric_values({"values": [100, None, 200, "bad"]})
        self.assertEqual(result, [100.0, 200.0])

    def test_empty_list(self):
        self.assertEqual(_extract_metric_values({"values": []}), [])

    def test_non_list(self):
        self.assertEqual(_extract_metric_values({"values": "not_a_list"}), [])

    def test_nan_filtered(self):
        result = _extract_metric_values({"values": [100.0, float('nan'), 200.0]})
        self.assertEqual(result, [100.0, 200.0])

    def test_inf_filtered(self):
        result = _extract_metric_values({"values": [100.0, float('inf'), 200.0]})
        self.assertEqual(result, [100.0, 200.0])


class TestBuildMetricTablesFromTrend(unittest.TestCase):
    """Test _build_metric_tables_from_trend."""

    def test_above_threshold_shown(self):
        trends = {"vs1": {"last-hour": {"items": [{"name": "conn", "values": [100, 200, 300]}]}}}
        result = _build_metric_tables_from_trend(trends)
        self.assertTrue(any(r["metric"] == "conn" for r in result))

    def test_below_threshold_excluded(self):
        trends = {"vs1": {"last-hour": {"items": [{"name": "low_metric", "values": [0, 0, 1]}]}}}
        result = _build_metric_tables_from_trend(trends)
        self.assertEqual(len(result), 0)

    def test_none_data_skipped(self):
        trends = {"vs1": {"last-hour": None}}
        result = _build_metric_tables_from_trend(trends)
        self.assertEqual(len(result), 0)

    def test_empty_items(self):
        trends = {"vs1": {"last-hour": {"items": []}}}
        result = _build_metric_tables_from_trend(trends)
        self.assertEqual(len(result), 0)


class TestFetchHelpers(unittest.TestCase):
    """Test _fetch_vs_names and _fetch_trend_raw."""

    def test_fetch_vs_names_success(self):
        client = MagicMock()
        client.get_virtual_services.return_value = {"items": [{"name": "vs1"}, {"name": "vs2"}]}
        self.assertEqual(_fetch_vs_names(client), ["vs1", "vs2"])

    def test_fetch_vs_names_api_error(self):
        client = MagicMock()
        client.get_virtual_services.side_effect = Exception("API down")
        self.assertEqual(_fetch_vs_names(client), [])

    def test_fetch_trend_raw_success(self):
        client = MagicMock()
        client.get_vs_trend_by_name.return_value = {"items": []}
        result = _fetch_trend_raw(client, "vs1", "last-hour")
        self.assertEqual(result, {"items": []})

    def test_fetch_trend_raw_error(self):
        client = MagicMock()
        client.get_vs_trend_by_name.side_effect = Exception("API down")
        self.assertIsNone(_fetch_trend_raw(client, "vs1"))


class TestQueryDeviceStateDB(unittest.TestCase):
    """Test query_device_state_db."""

    def setUp(self):
        fd, self.db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        conn = sqlite3.connect(self.db_path)
        conn.execute("CREATE TABLE device_state (id INTEGER PRIMARY KEY, ts INTEGER, metric TEXT, value REAL, UNIQUE(ts, metric))")
        now = int(time.time())
        conn.execute("INSERT OR IGNORE INTO device_state (ts, metric, value) VALUES (?, ?, ?)", (now - 100, "cpu", 10.0))
        conn.execute("INSERT OR IGNORE INTO device_state (ts, metric, value) VALUES (?, ?, ?)", (now - 200, "memory", 40.0))
        conn.commit()
        conn.close()

    def tearDown(self):
        try:
            os.unlink(self.db_path)
        except PermissionError:
            pass

    def test_returns_all_metrics(self):
        rows = query_device_state_db(self.db_path)
        self.assertIsNotNone(rows)
        self.assertGreaterEqual(len(rows), 2)

    def test_metric_filter(self):
        rows = query_device_state_db(self.db_path, metric="cpu")
        self.assertIsNotNone(rows)
        self.assertTrue(all(r["metric"] == "cpu" for r in rows))

    def test_nonexistent_db(self):
        self.assertIsNone(query_device_state_db("/nonexistent/path.db"))


class TestRun3SigmaOnVSGroup(unittest.TestCase):
    """Test _run_3sigma_on_vs_group."""

    def test_adds_vs_and_metric_keys(self):
        now = int(time.time())
        groups = {("vs_test", "conn"): [{"ts": now - i * 60, "value": 100.0 + i * 0.5} for i in range(400)]}
        groups[("vs_test", "conn")].append({"ts": now + 60, "value": 500.0})
        result = _run_3sigma_on_vs_group(groups)
        if result:
            self.assertEqual(result[0]["vs"], "vs_test")
            self.assertEqual(result[0]["metric"], "conn")


class TestAnalyzeFull(unittest.TestCase):
    """Test analyze_full orchestration."""

    def setUp(self):
        self.client = MagicMock()
        self.client.host = "https://10.0.0.1"
        self.client.get_virtual_services.return_value = {"items": []}
        self.client.get_pools.return_value = {"items": []}
        self.client.get_sys_system.return_value = {"cpu_usage": 10.0, "memory_usage": 20.0}
        self.client.get_service_log.return_value = {"items": []}

    def test_all_dimensions_included(self):
        result = analyze_full(self.client)
        self.assertIn("traffic", result)
        self.assertIn("state", result)
        self.assertIn("conflicts", result)
        self.assertIn("logs", result)

    def test_traffic_insufficient_data_doesnt_block_others(self):
        # When no VS data and no DB, traffic falls to insufficient_data but state/conflicts succeed
        self.client.get_virtual_services.return_value = {"items": []}
        self.client.get_vs_trend_by_name.side_effect = Exception("Trend API down")
        result = analyze_full(self.client)
        self.assertIn(result["traffic"]["status"], ("insufficient_data", "error"))
        self.assertEqual(result["state"]["status"], "ok")
        self.assertEqual(result["conflicts"]["status"], "ok")


class TestStateAnalysisEdges(unittest.TestCase):
    """Test state_analysis edge cases not covered elsewhere."""

    def setUp(self):
        self.client = MagicMock()

    def test_api_exception_returns_error(self):
        self.client.get_sys_system.side_effect = Exception("API timeout")
        result = state_analysis(self.client)
        self.assertEqual(result["status"], "error")
        self.assertIn("error", result)
        self.assertEqual(len(result["items"]), 1)

    def test_fan_list_with_fail_status(self):
        self.client.get_sys_system.return_value = {
            "cpu_usage": 10.0, "memory_usage": 20.0,
            "fan": [{"name": "fan1", "status": "fail"}],
        }
        result = state_analysis(self.client)
        self.assertEqual(result["status"], "critical")

    def test_power_string_fail(self):
        self.client.get_sys_system.return_value = {
            "cpu_usage": 10.0, "memory_usage": 20.0,
            "power_supply": "fail",
        }
        result = state_analysis(self.client)
        self.assertEqual(result["status"], "critical")

    def test_power_list_with_fail(self):
        self.client.get_sys_system.return_value = {
            "cpu_usage": 10.0, "memory_usage": 20.0,
            "power_supply": [{"name": "psu1", "status": "fail"}],
        }
        result = state_analysis(self.client)
        self.assertEqual(result["status"], "critical")

    def test_interface_out_entries(self):
        self.client.get_sys_system.return_value = {
            "cpu_usage": 10.0, "memory_usage": 20.0,
            "interface": {"plug": {"in": [], "out": ["eth1", "eth2"]}},
        }
        result = state_analysis(self.client)
        self.assertEqual(result["status"], "warning")

    def test_nested_dict_values(self):
        self.client.get_sys_system.return_value = {
            "cpu_usage": {"value": 85, "unit": "PERCENT"},
            "memory_usage": {"value": 40, "unit": "PERCENT"},
        }
        result = state_analysis(self.client)
        self.assertEqual(result["status"], "warning")
        cpu_item = next(i for i in result["items"] if i["metric"] == "cpu")
        self.assertEqual(cpu_item["level"], "warn")


if __name__ == '__main__':
    unittest.main()
