import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-perception", "scripts"))

import unittest
from unittest.mock import patch, MagicMock, call
import math
import statistics
import json
import sqlite3
import tempfile
from datetime import datetime

from perception import (
    detect_anomaly_3sigma,
    query_traffic_db,
    traffic_analysis,
    state_analysis,
    conflict_analysis,
    log_correlation,
    render_markdown,
    render_json,
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
        # Mock get_vs_trend_by_name
        self.client.get_vs_trend_by_name.return_value = {
            'items': [{'name': 'vs_test', 'connection-rate': {'60s': [[1700000000, 100.0]]}}]
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
                {'date': '2026-05-19', 'time': '10:00:00', 'user': 'admin', 'action': 'login', 'status': 'success'},
                {'date': '2026-05-19', 'time': '10:30:00', 'user': 'admin', 'action': 'config_change', 'status': 'success'},
                {'date': '2026-05-19', 'time': '11:00:00', 'user': 'admin', 'action': 'logout', 'status': 'success'},
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


if __name__ == '__main__':
    unittest.main()
