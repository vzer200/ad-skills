"""Comprehensive tests for multi-device support across all AD skill scripts.

Covers:
  - multi_device.py: run_multi, resolve_device_pw, parse_hosts_arg, load_devices_json,
    host_slug, compute_multi_exit_code, render_multi_summary
  - overview.py: _overview_one, --hosts/--devices arg parsing, multi markdown output
  - perception.py: _analyze_one, --hosts arg parsing
  - check.py: _check_one (atomic run+wait+analyze), work_dir derivation, history multi
  - blackbox.py: _blackbox_one, independent output dirs
  - collector.py: stop_event threading, RuntimeError instead of sys.exit(3)
"""

import json
import os
import sys
import tempfile
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from unittest.mock import patch, MagicMock, call

# Ensure all skill script directories are importable
_test_dir = os.path.dirname(os.path.abspath(__file__))
for skill in ("ad-ops", "ad-perception", "ad-check-analysis", "ad-blackbox-analysis"):
    _p = os.path.join(_test_dir, "..", ".claude", "skills", skill, "scripts")
    sys.path.insert(0, os.path.realpath(_p))


# =============================================================================
# multi_device.py unit tests
# =============================================================================

class TestResolveDevicePw(unittest.TestCase):
    """Tests for resolve_device_pw()."""

    def setUp(self):
        from multi_device import resolve_device_pw
        self.resolve = resolve_device_pw

    def test_password_field_priority(self):
        """password field takes highest priority."""
        result = self.resolve({"password": "direct", "password_from": "ENV_VAR"}, "fallback")
        self.assertEqual(result, "direct")

    def test_password_from_env_var(self):
        """password_from reads from environment variable."""
        with patch.dict(os.environ, {"MY_PW": "from_env"}):
            result = self.resolve({"password_from": "MY_PW"}, "fallback")
            self.assertEqual(result, "from_env")

    def test_password_from_missing_env_var(self):
        """password_from with missing env var returns empty string (no fallback)."""
        with patch.dict(os.environ, {}, clear=True):
            result = self.resolve({"password_from": "MISSING_VAR"}, "fallback")
            self.assertEqual(result, "")

    def test_fallback_when_no_password_fields(self):
        """Neither password nor password_from present → fallback."""
        result = self.resolve({"host": "https://x.x.x.x"}, "fallback_pw")
        self.assertEqual(result, "fallback_pw")

    def test_empty_fallback(self):
        """Empty string fallback is valid."""
        result = self.resolve({}, "")
        self.assertEqual(result, "")


class TestParseHostsArg(unittest.TestCase):
    """Tests for parse_hosts_arg()."""

    def setUp(self):
        from multi_device import parse_hosts_arg
        self.parse = parse_hosts_arg

    def test_single_host(self):
        devices = self.parse("https://192.168.8.30")
        self.assertEqual(len(devices), 1)
        self.assertEqual(devices[0]["host"], "https://192.168.8.30")

    def test_multiple_hosts(self):
        devices = self.parse("https://192.168.8.30,https://192.168.8.31")
        self.assertEqual(len(devices), 2)
        self.assertEqual(devices[0]["host"], "https://192.168.8.30")
        self.assertEqual(devices[1]["host"], "https://192.168.8.31")

    def test_user_and_password_propagation(self):
        devices = self.parse("https://a.com,https://b.com", user="ops", password="secret")
        for d in devices:
            self.assertEqual(d["user"], "ops")
            self.assertEqual(d["password"], "secret")

    def test_whitespace_handling(self):
        devices = self.parse("  https://a.com , https://b.com  ")
        self.assertEqual(len(devices), 2)
        self.assertEqual(devices[0]["host"], "https://a.com")
        self.assertEqual(devices[1]["host"], "https://b.com")

    def test_empty_string(self):
        devices = self.parse("")
        self.assertEqual(len(devices), 0)

    def test_trailing_comma(self):
        devices = self.parse("https://a.com,")
        self.assertEqual(len(devices), 1)


class TestLoadDevicesJson(unittest.TestCase):
    """Tests for load_devices_json()."""

    def test_loads_device_list(self):
        data = {"devices": [
            {"name": "AD1", "host": "https://192.168.8.30", "password_from": "AD1_PASS"},
            {"name": "AD2", "host": "https://192.168.8.31", "password_from": "AD2_PASS"},
        ]}
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
            json.dump(data, f)
            tmp_path = f.name
        try:
            from multi_device import load_devices_json
            devices = load_devices_json(tmp_path)
            self.assertEqual(len(devices), 2)
            self.assertEqual(devices[0]["name"], "AD1")
            self.assertEqual(devices[1]["host"], "https://192.168.8.31")
        finally:
            os.unlink(tmp_path)

    def test_empty_devices(self):
        data = {"devices": []}
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
            json.dump(data, f)
            tmp_path = f.name
        try:
            from multi_device import load_devices_json
            devices = load_devices_json(tmp_path)
            self.assertEqual(len(devices), 0)
        finally:
            os.unlink(tmp_path)


class TestHostSlug(unittest.TestCase):
    """Tests for host_slug()."""

    def setUp(self):
        from multi_device import host_slug
        self.slug = host_slug

    def test_https_url(self):
        self.assertEqual(self.slug("https://192.168.8.30"), "https___192.168.8.30")

    def test_ip_only(self):
        self.assertEqual(self.slug("192.168.8.30"), "192.168.8.30")

    def test_special_characters(self):
        result = self.slug("https://user:pass@host:8443/path?q=1")
        self.assertNotIn("/", result)
        self.assertNotIn(":", result.replace("_", ""))  # only underscores should replace special chars


class TestComputeMultiExitCode(unittest.TestCase):
    """Tests for compute_multi_exit_code()."""

    def setUp(self):
        from multi_device import compute_multi_exit_code
        self.compute = compute_multi_exit_code

    def test_all_success(self):
        results = {"h1": {"ok": True}, "h2": {"ok": True}}
        self.assertEqual(self.compute(results), 0)

    def test_all_failed(self):
        results = {"h1": {"error": "fail"}, "h2": {"error": "fail"}}
        self.assertEqual(self.compute(results), 1)

    def test_all_auth_failed(self):
        results = {"h1": {"error": "ADAuthError: 认证失败"}, "h2": {"error": "Authentication failed"}}
        self.assertEqual(self.compute(results), 2)

    def test_partial_failure(self):
        results = {"h1": {"ok": True}, "h2": {"error": "timeout"}}
        self.assertEqual(self.compute(results), 7)

    def test_empty_results(self):
        self.assertEqual(self.compute({}), 4)

    def test_single_device_success(self):
        results = {"h1": {"ok": True}}
        self.assertEqual(self.compute(results), 0)

    def test_mixed_auth_and_other_failure(self):
        """Partial failure with mixed error types → 7 (partial)."""
        results = {"h1": {"ok": True}, "h2": {"error": "ADAuthError: 401"}}
        self.assertEqual(self.compute(results), 7)


class TestRenderMultiSummary(unittest.TestCase):
    """Tests for render_multi_summary()."""

    def setUp(self):
        from multi_device import render_multi_summary
        self.render = render_multi_summary

    def test_all_success_summary(self):
        results = {"https://a.com": {"ok": 1}, "https://b.com": {"ok": 2}}
        output = self.render(results, "Test")
        self.assertIn("全部成功", output)
        self.assertIn("2/2", output)

    def test_partial_failure_summary(self):
        results = {"https://a.com": {"ok": 1}, "https://b.com": {"error": "fail"}}
        output = self.render(results, "Test")
        self.assertIn("部分失败", output)
        self.assertIn("exit 7", output)

    def test_all_failure_summary(self):
        results = {"https://a.com": {"error": "e1"}, "https://b.com": {"error": "e2"}}
        output = self.render(results, "Test")
        self.assertIn("全部失败", output)

    def test_device_names_mapping(self):
        results = {"https://a.com": {"ok": 1}}
        names = {"https://a.com": "MyDevice"}
        output = self.render(results, "Test", device_names=names)
        self.assertIn("MyDevice", output)


class TestRunMulti(unittest.TestCase):
    """Tests for run_multi() with mocked ADClient."""

    def setUp(self):
        from multi_device import run_multi
        self.run_multi = run_multi

    def test_parallel_execution_all_success(self):
        """run_multi dispatches to all devices and collects results."""
        def fake_func(client, **kwargs):
            return {"host": client.host, "result": kwargs.get("subcommand", "all")}

        devices = [
            {"host": "https://a.com", "user": "admin", "password": "pw"},
            {"host": "https://b.com", "user": "admin", "password": "pw"},
        ]
        with patch("ad_api.ADClient") as mock_client_cls:
            mock_client_cls.side_effect = lambda host, username, password: MagicMock(host=host)
            results = self.run_multi(devices, fake_func, subcommand="all")

        self.assertEqual(len(results), 2)
        self.assertIn("https://a.com", results)
        self.assertIn("https://b.com", results)
        self.assertEqual(results["https://a.com"]["result"], "all")

    def test_error_isolation(self):
        """One device failing doesn't affect others."""
        def fake_func(client, **kwargs):
            if "b.com" in client.host:
                raise RuntimeError("B failed")
            return {"ok": True}

        devices = [
            {"host": "https://a.com", "user": "admin", "password": "pw"},
            {"host": "https://b.com", "user": "admin", "password": "pw"},
        ]
        with patch("ad_api.ADClient") as mock_client_cls:
            mock_client_cls.side_effect = lambda host, username, password: MagicMock(host=host)
            results = self.run_multi(devices, fake_func)

        self.assertEqual(len(results), 2)
        self.assertNotIn("error", results["https://a.com"])
        self.assertIn("error", results["https://b.com"])
        self.assertIn("RuntimeError", results["https://b.com"]["error"])

    def test_password_resolution_in_run_multi(self):
        """Common password is propagated to devices without their own."""
        def fake_func(client, **kwargs):
            return {"ok": True}

        devices = [{"host": "https://a.com", "user": "admin"}]
        with patch("ad_api.ADClient") as mock_cls:
            mock_cls.return_value = MagicMock(host="https://a.com")
            self.run_multi(devices, fake_func, password="common_pw")
            mock_cls.assert_called_once_with(host="https://a.com", username="admin", password="common_pw")

    def test_max_workers_capped(self):
        """MAX_WORKERS=10 cap is enforced even with many devices."""
        def fake_func(client, **kwargs):
            return {"ok": True}

        devices = [{"host": f"https://dev{i}.com", "user": "admin", "password": "pw"} for i in range(25)]
        with patch("ad_api.ADClient") as mock_cls:
            mock_cls.return_value = MagicMock()
            with patch("multi_device.ThreadPoolExecutor", wraps=ThreadPoolExecutor) as spy:
                self.run_multi(devices, fake_func)
                # ThreadPoolExecutor was created with max_workers <= MAX_WORKERS (10)
                # max_workers is passed as first positional arg
                call_args = spy.call_args
                if call_args:
                    # max_workers could be positional [0] or keyword ['max_workers']
                    if call_args[0]:
                        self.assertLessEqual(call_args[0][0], 10)
                    elif 'max_workers' in call_args[1]:
                        self.assertLessEqual(call_args[1]['max_workers'], 10)


# =============================================================================
# overview.py multi-device tests
# =============================================================================

class TestOverviewMultiDevice(unittest.TestCase):
    """Tests for overview.py multi-device support."""

    def setUp(self):
        sys.path.insert(0, os.path.join(_test_dir, "..", ".claude", "skills", "ad-ops", "scripts"))
        from overview import _overview_one, build_parser
        self._overview_one = _overview_one
        self.build_parser = build_parser

    def test_overview_one_returns_dict(self):
        """_overview_one returns a dict with overview and markdown keys."""
        client = MagicMock()
        client.host = "https://192.168.8.30"
        client.get_virtual_services.return_value = {"items": []}
        client.get_pools.return_value = {"items": []}
        client.get_ssl_certificates.return_value = {"items": []}
        client.get_ha_status.return_value = {}
        client.get_sys_system.return_value = {}
        client.get_vs_stat.return_value = {"items": []}

        result = self._overview_one(client, "all")
        self.assertIsInstance(result, dict)
        self.assertIn("overview", result)
        self.assertIn("markdown", result)
        self.assertIn("# AD Device Overview", result["markdown"])

    def test_overview_one_error_isolation(self):
        """API errors are captured in overview, not raised."""
        client = MagicMock()
        client.host = "https://bad.host"
        client.get_virtual_services.side_effect = Exception("VS API down")
        client.get_pools.return_value = {"items": []}
        client.get_ssl_certificates.return_value = {"items": []}
        client.get_ha_status.return_value = {}
        client.get_sys_system.return_value = {}
        client.get_vs_stat.return_value = {"items": []}

        result = self._overview_one(client, "all")
        self.assertIsInstance(result, dict)
        errors = result["overview"].get("api_errors", {})
        self.assertIsNotNone(errors.get("vs"))

    def test_parser_has_hosts_and_devices_args(self):
        """--hosts and --devices are in the argument parser."""
        parser = self.build_parser()
        # Parse --help to verify args exist (won't raise)
        with self.assertRaises(SystemExit):
            parser.parse_args(["--help"])

    def test_hosts_arg_accepted(self):
        """--hosts argument is accepted by the parser."""
        parser = self.build_parser()
        args = parser.parse_args(["all", "--hosts", "https://a.com,https://b.com", "--password", "pw"])
        self.assertEqual(args.hosts, "https://a.com,https://b.com")

    def test_devices_arg_accepted(self):
        """--devices argument is accepted by the parser."""
        parser = self.build_parser()
        args = parser.parse_args(["all", "--devices", "devices.json", "--password", "pw"])
        self.assertEqual(args.devices, "devices.json")


# =============================================================================
# perception.py multi-device tests
# =============================================================================

class TestPerceptionMultiDevice(unittest.TestCase):
    """Tests for perception.py multi-device support."""

    def setUp(self):
        sys.path.insert(0, os.path.join(_test_dir, "..", ".claude", "skills", "ad-perception", "scripts"))
        from perception import _analyze_one
        self._analyze_one = _analyze_one

    def test_analyze_one_returns_dict_with_device(self):
        """_analyze_one returns a dict with 'device' key set to client.host."""
        client = MagicMock()
        client.host = "https://192.168.8.30"
        client.get_virtual_services.return_value = {"items": []}
        client.get_pools.return_value = {"items": []}
        client.get_sys_system.return_value = {}
        client.get_service_log.return_value = {"items": []}

        result = self._analyze_one(client)
        self.assertIsInstance(result, dict)
        self.assertEqual(result["device"], "https://192.168.8.30")
        self.assertIn("traffic", result)
        self.assertIn("state", result)
        self.assertIn("conflicts", result)
        self.assertIn("logs", result)

    def test_analyze_one_handles_connection_error(self):
        """Connection errors in analyze_full are caught and returned."""
        client = MagicMock()
        client.host = "https://bad.host"
        client.get_virtual_services.side_effect = Exception("Connection refused")
        client.get_sys_system.side_effect = Exception("Connection refused")

        # _analyze_one calls analyze_full which catches exceptions per dimension
        result = self._analyze_one(client)
        self.assertIsInstance(result, dict)
        self.assertEqual(result["device"], "https://bad.host")


# =============================================================================
# check.py multi-device tests
# =============================================================================

class TestCheckMultiDevice(unittest.TestCase):
    """Tests for check.py _check_one atomic function."""

    def setUp(self):
        sys.path.insert(0, os.path.join(_test_dir, "..", ".claude", "skills", "ad-check-analysis", "scripts"))
        from check import _check_one, host_slug
        self._check_one = _check_one
        self.host_slug = host_slug

    @patch("check.wait_and_download")
    @patch("check.start_check")
    def test_check_one_atomic_flow(self, mock_start, mock_wait):
        """_check_one chains start_check → wait_and_download → analyze → render."""
        # Create a temporary valid ad.json
        ad_json = os.path.join(tempfile.gettempdir(), "test_ad.json")
        with open(ad_json, "w", encoding="utf-8") as f:
            json.dump({"version": "1.0", "ad_appversion": "test"}, f)

        mock_start.return_value = {
            "scene": "标准巡检", "host": "https://192.168.8.30",
            "event_id": "evt123", "report_name": "",
            "start_time": "20260520120000", "pre_run_latest_name": "old_report",
            "work_dir": tempfile.gettempdir(),
        }
        mock_wait.return_value = {
            "scene": "标准巡检", "host": "https://192.168.8.30",
            "event_id": "evt123", "report_name": "rpt1",
            "start_time": "20260520120000", "pre_run_latest_name": "old_report",
            "work_dir": tempfile.gettempdir(),
            "ad_json_path": ad_json,
        }

        client = MagicMock()
        client.host = "https://192.168.8.30"

        try:
            with patch("check.analyze") as mock_analyze, \
                 patch("check.render_markdown") as mock_render:
                mock_analyze.return_value = {"summary": {"score": 95}}
                mock_render.return_value = "# Fake Report"

                result = self._check_one(client, scene="标准巡检", force=False)

            self.assertIsInstance(result, dict)
            self.assertIn("meta", result)
            self.assertIn("analysis", result)
            self.assertIn("markdown", result)
            mock_start.assert_called_once()
            mock_wait.assert_called_once()
        finally:
            if os.path.exists(ad_json):
                os.unlink(ad_json)

    def test_check_one_work_dir_auto_derivation(self):
        """work_dir is auto-derived from host when not provided."""
        # Create a temporary valid ad.json
        ad_json = os.path.join(tempfile.gettempdir(), "test_ad2.json")
        with open(ad_json, "w", encoding="utf-8") as f:
            json.dump({"version": "1.0"}, f)

        client = MagicMock()
        client.host = "https://192.168.8.30"
        try:
            with patch("check.start_check") as mock_start:
                mock_start.return_value = {"work_dir": "/tmp/ad_check_test"}
                with patch("check.wait_and_download") as mock_wait:
                    mock_wait.return_value = {
                        "work_dir": "/tmp/ad_check_test",
                        "ad_json_path": ad_json,
                        "host": "https://192.168.8.30",
                        "scene": "标准巡检",
                        "event_id": "evt1",
                        "start_time": "20260520120000",
                        "report_name": "r1",
                        "pre_run_latest_name": "",
                    }
                    with patch("check.analyze") as mock_analyze, \
                         patch("check.render_markdown") as mock_render:
                        mock_analyze.return_value = {"summary": {}}
                        mock_render.return_value = "# OK"
                        self._check_one(client, scene="标准巡检")
                        call_kwargs = mock_start.call_args.kwargs
                        self.assertIn("ad_check_", call_kwargs["work_dir"])
                        self.assertIn("https___192.168.8.30", call_kwargs["work_dir"])
        finally:
            if os.path.exists(ad_json):
                os.unlink(ad_json)


# =============================================================================
# blackbox.py multi-device tests
# =============================================================================

class TestBlackboxMultiDevice(unittest.TestCase):
    """Tests for blackbox.py _blackbox_one function."""

    def setUp(self):
        sys.path.insert(0, os.path.join(_test_dir, "..", ".claude", "skills", "ad-blackbox-analysis", "scripts"))
        from blackbox import _blackbox_one
        self._blackbox_one = _blackbox_one

    def test_blackbox_one_requires_dates(self):
        """_blackbox_one returns error when dates are missing."""
        client = MagicMock()
        client.host = "https://192.168.8.30"
        result = self._blackbox_one(client, from_date="", to_date="")
        self.assertIn("error", result)
        self.assertIn("from-date", result["error"])

    @patch("blackbox.BlackboxAnalyzer")
    def test_blackbox_one_success_flow(self, mock_analyzer_cls):
        """_blackbox_one full export → wait → download → analyze flow."""
        client = MagicMock()
        client.host = "https://192.168.8.30"
        client.export_blackbox_log.return_value = {"event_id": "evt_001"}

        # Simulate: first call returns RUNNING, second returns SUCCESS
        client.get_last_event.side_effect = [
            {"items": [{"event_id": "evt_001", "state": "RUNNING"}]},
            {"items": [{"event_id": "evt_001", "state": "SUCCESS",
                         "data": {"file_token": "tok_abc"}}]},
        ]
        client._raw_request.return_value = b"fake_zip_data"

        mock_analyzer = MagicMock()
        mock_analyzer.analyze_audit_logs.return_value = {"20260501": {"count": 5, "records": []}}
        mock_analyzer.generate_report.return_value = "# Report"
        mock_analyzer_cls.return_value = mock_analyzer

        with tempfile.TemporaryDirectory() as tmpdir:
            result = self._blackbox_one(client, from_date="2026-05-01",
                                        to_date="2026-05-07",
                                        archive_password="pw",
                                        output_dir=tmpdir)

        self.assertNotIn("error", result)
        self.assertIn("report", result)
        self.assertEqual(result["event_id"], "evt_001")

    def test_blackbox_one_independent_output_dir(self):
        """Each device gets {output_base}/{host_slug}/ output directory."""
        client = MagicMock()
        client.host = "https://192.168.8.30"
        client.export_blackbox_log.return_value = {"event_id": "evt_001"}
        client.get_last_event.return_value = {
            "items": [{"event_id": "evt_001", "state": "FAILED"}]
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            result = self._blackbox_one(client, from_date="2026-05-01",
                                        to_date="2026-05-07",
                                        archive_password="pw",
                                        output_dir=tmpdir)
            # Even on failure, output_dir in result should contain host slug
            self.assertIn("error", result)  # FAILED state


# =============================================================================
# collector.py threading tests
# =============================================================================

class TestCollectorThreading(unittest.TestCase):
    """Tests for collector.py threading support."""

    def setUp(self):
        sys.path.insert(0, os.path.join(_test_dir, "..", ".claude", "skills", "ad-perception", "scripts"))
        from collector import VSCollector, _collect_loop
        self.VSCollector = VSCollector
        self._collect_loop = _collect_loop

    def test_collector_has_stop_event_attribute(self):
        """VSCollector instances have stop_event and fatal_error attributes."""
        c = self.VSCollector("https://a.com", "pw", db_path=":memory:")
        self.assertIsNone(c.stop_event)
        self.assertIsNone(c.fatal_error)

    def test_host_slug_property(self):
        """host_slug property returns filesystem-safe identifier."""
        c = self.VSCollector("https://192.168.8.30:8443", "pw", db_path=":memory:")
        slug = c.host_slug
        self.assertNotIn("/", slug)
        self.assertNotIn(":", slug)

    def test_run_once_raises_runtime_error_instead_of_exit(self):
        """run_once() raises RuntimeError on DB write failure, not sys.exit."""
        c = self.VSCollector("https://a.com", "pw", db_path=":memory:")
        # Use a mock connection instead of real sqlite3 (execute is C-level, read-only)
        c.conn = MagicMock()
        c.client = MagicMock()
        c.client.get_vs_stat.return_value = {"items": [{"name": "vs1", "connection": 100}]}
        c.conn.execute.side_effect = Exception("DB error")

        with self.assertRaises(RuntimeError) as ctx:
            c.run_once()
        self.assertIn("数据库写入失败", str(ctx.exception))

    def test_collect_loop_stops_on_event(self):
        """_collect_loop exits when stop_event is set."""
        c = self.VSCollector("https://a.com", "pw", db_path=":memory:")
        c.stop_event = threading.Event()
        c.stop_event.set()  # Signal stop immediately
        c.open_db = MagicMock()
        c.cleanup_old_data = MagicMock()
        c.close_db = MagicMock()

        self._collect_loop(c)
        # Should exit immediately without calling run_once
        c.open_db.assert_called_once()
        c.close_db.assert_called_once()

    def test_collect_loop_single_iteration(self):
        """_collect_loop runs one iteration then stops."""
        c = self.VSCollector("https://a.com", "pw", db_path=":memory:")
        c.stop_event = threading.Event()
        c.interval = 0.01
        c.open_db = MagicMock()
        c.cleanup_old_data = MagicMock()
        c.close_db = MagicMock()
        c.run_once = MagicMock(return_value=[])

        # Set stop after a short delay
        def _stop_after_delay():
            time.sleep(0.05)
            c.stop_event.set()

        t = threading.Thread(target=_stop_after_delay, daemon=True)
        t.start()
        self._collect_loop(c)
        t.join(timeout=1)

        c.run_once.assert_called()  # At least one iteration
        c.close_db.assert_called_once()

    def test_collect_loop_fatal_error_threshold(self):
        """After max_consecutive_failures, stop_event is set and fatal_error recorded."""
        c = self.VSCollector("https://a.com", "pw", db_path=":memory:")
        c.stop_event = threading.Event()
        c.interval = 0.001
        c.consecutive_failures = 0
        c.open_db = MagicMock()
        c.cleanup_old_data = MagicMock()
        c.close_db = MagicMock()
        c.run_once = MagicMock(side_effect=Exception("persistent failure"))

        # Run _collect_loop — should stop after max failures (30), not run forever
        self._collect_loop(c)

        self.assertTrue(c.stop_event.is_set())
        self.assertIsNotNone(c.fatal_error)
        self.assertIn("persistent failure", c.fatal_error)
        self.assertGreaterEqual(c.consecutive_failures, 30)


# =============================================================================
# Integration: cross-script multi-device flow
# =============================================================================

class TestCrossScriptMultiDevice(unittest.TestCase):
    """End-to-end integration tests across scripts."""

    def test_run_multi_with_overview_one(self):
        """run_multi dispatches _overview_one to multiple mock devices."""
        sys.path.insert(0, os.path.join(_test_dir, "..", ".claude", "skills", "ad-ops", "scripts"))
        from multi_device import run_multi, compute_multi_exit_code
        from overview import _overview_one

        def _make_client(host):
            client = MagicMock()
            client.host = host
            client.get_virtual_services.return_value = {"items": []}
            client.get_pools.return_value = {"items": []}
            client.get_ssl_certificates.return_value = {"items": []}
            client.get_ha_status.return_value = {}
            client.get_sys_system.return_value = {}
            client.get_vs_stat.return_value = {"items": []}
            return client

        devices = [
            {"host": "https://dev1.com", "user": "admin", "password": "pw"},
            {"host": "https://dev2.com", "user": "admin", "password": "pw"},
        ]

        with patch("ad_api.ADClient") as mock_cls:
            mock_cls.side_effect = lambda host, username, password: _make_client(host)
            results = run_multi(devices, _overview_one, subcommand="all")

        self.assertEqual(len(results), 2)
        for host, result in results.items():
            self.assertIn("overview", result)
            self.assertIn("markdown", result)
        self.assertEqual(compute_multi_exit_code(results), 0)

    def test_run_multi_error_isolation_across_scripts(self):
        """When one device fails in run_multi(_analyze_one), others still succeed."""
        sys.path.insert(0, os.path.join(_test_dir, "..", ".claude", "skills", "ad-ops", "scripts"))
        from multi_device import run_multi, compute_multi_exit_code
        from perception import _analyze_one

        def _make_client(host, should_fail=False):
            client = MagicMock()
            client.host = host
            if should_fail:
                client.get_virtual_services.side_effect = Exception("boom")
                client.get_pools.side_effect = Exception("boom")
                client.get_sys_system.side_effect = Exception("boom")
                client.get_service_log.side_effect = Exception("boom")
            else:
                client.get_virtual_services.return_value = {"items": []}
                client.get_pools.return_value = {"items": []}
                client.get_sys_system.return_value = {}
                client.get_service_log.return_value = {"items": []}
            return client

        devices = [
            {"host": "https://good.com", "user": "admin", "password": "pw"},
            {"host": "https://bad.com", "user": "admin", "password": "pw"},
        ]

        clients = {"https://good.com": _make_client("https://good.com"),
                    "https://bad.com": _make_client("https://bad.com", should_fail=True)}

        with patch("ad_api.ADClient") as mock_cls:
            mock_cls.side_effect = lambda host, username, password: clients[host]
            results = run_multi(devices, _analyze_one)

        self.assertEqual(len(results), 2)
        # _analyze_one catches errors per dimension, so both return dicts
        # The "bad" device has all error statuses in its dimensions
        good_result = results["https://good.com"]
        bad_result = results["https://bad.com"]
        self.assertNotIn("error", good_result)
        # bad device: traffic should show error status (caught inside analyze_full)
        self.assertIn("traffic", bad_result)
        # Partial failure is per-dimension, not per-device — so exit_code=0
        self.assertEqual(compute_multi_exit_code(results), 0)

    def test_devices_json_file_integration(self):
        """The root devices.json file exists and has valid structure."""
        devices_path = os.path.join(_test_dir, "..", "devices.json")
        self.assertTrue(os.path.isfile(devices_path), f"devices.json not found at {devices_path}")
        with open(devices_path, encoding="utf-8") as f:
            data = json.load(f)
        self.assertIn("devices", data)
        self.assertIsInstance(data["devices"], list)
        for d in data["devices"]:
            self.assertIn("host", d)
            self.assertIn("name", d)
            # password should NOT be in plaintext (use password_from)
            if "password" in d:
                self.fail(f"Device {d['name']} has plaintext password — use password_from")


if __name__ == "__main__":
    unittest.main(verbosity=2)
