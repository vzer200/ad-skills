#!/usr/bin/env python3
"""Unit tests for check.py — AD inspection workflow."""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-check-analysis", "scripts"))

import json
import unittest
import tempfile
from unittest.mock import patch, MagicMock

from check import (
    start_check, analyze, render_markdown,
    _SUGGESTION_MAP, CHECK_RULES, FIELD_RULES,
)
from check import _evaluate_field, _evaluate_vip_pool
from ad_api import ADAuthError, ADConnectionError


class TestStartCheck(unittest.TestCase):
    """Test start_check state machine."""

    def setUp(self):
        self.client = MagicMock()
        self.client.host = "https://10.0.0.1"
        self.tmpdir = tempfile.TemporaryDirectory()
        self.work_dir = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_scenes_list_success(self):
        self.client._request.side_effect = [
            {"items": [{"name": "标准巡检"}, {"name": "全量巡检"}]},
            {"items": []},
            {"event_id": "ev123"},
        ]
        result = start_check(self.client, "标准巡检", work_dir=self.work_dir)
        self.assertIn("event_id", result)

    def test_scene_not_found(self):
        self.client._request.return_value = {"items": [{"name": "标准巡检"}]}
        with self.assertRaises(RuntimeError) as cm:
            start_check(self.client, "不存在的场景", work_dir=self.work_dir)
        self.assertIn("不存在", str(cm.exception))

    def test_record_limit_reached_without_force(self):
        self.client._request.side_effect = [
            {"items": [{"name": "标准巡检"}]},
            {"items": [{}, {}, {}, {}, {}]},
        ]
        with self.assertRaises(RuntimeError) as cm:
            start_check(self.client, "标准巡检", force=False, work_dir=self.work_dir)
        self.assertIn("上限", str(cm.exception))

    def test_record_limit_with_force(self):
        self.client._request.side_effect = [
            {"items": [{"name": "标准巡检"}]},
            {"items": [{}, {}, {}, {}, {}]},
            {"event_id": "ev456"},
        ]
        result = start_check(self.client, "标准巡检", force=True, work_dir=self.work_dir)
        self.assertEqual(result["event_id"], "ev456")

    def test_scenes_api_auth_error(self):
        self.client._request.side_effect = ADAuthError("HTTP 401", http_code=401)
        with self.assertRaises(ADAuthError):
            start_check(self.client, "标准巡检", work_dir=self.work_dir)

    def test_scenes_api_connection_error(self):
        self.client._request.side_effect = ADConnectionError("timeout")
        with self.assertRaises(ADConnectionError):
            start_check(self.client, "标准巡检", work_dir=self.work_dir)


class TestAnalyze(unittest.TestCase):
    """Test analyze() with real ad.json fields."""

    def setUp(self):
        self.sample_data = {
            "version": "AD 7.1.8",
            "ad_appversion": "7.1.8.20250101",
            "gateway_id": "GATEWAY001",
            "base_running_time": "365 days",
            "dst_ip": "192.168.1.100",
            # Health fields
            "base_cpu_usage": [10, 20, 30],
            "snmp_mem_rate": 45,
            "fan_state": 1,
            "power_state": 1,
            "acceleration": 2,
            "base_file_ds": 0,
            "base_log_error_exist": 0,
            "base_kernel_log": 0,
            "base_crash_time": [],
            "base_blackbox_state": 0,
            "base_blackbox_dmesg": {},
            "base_core_process_lack": [],
            "base_eth_abnormal": [],
            "base_eth_mtu": [],
            "base_drop_err_packet_rate": [],
            "base_eth_info": "Link detected: yes\nSpeed: 1000Mb/s",
            "disk_info": {"sda": {"size": "100G"}},
            "base_disk_high_usage": [],
            "shm_sem_state": True,
            "bios_update_state": "",
            "alarms_enabled": 1,
            "I350_nic_state": "normal",
            "82599_nic_state": "normal",
            "conntrack_count": 5000,
            "conntrack_new_count": 100,
            "snat_sport_exhaustion_log_num": 0,
            "base_no_core": -1,
            "auto_update": "true",
            "remote_mt": "false",
            "id_conflict_list": [],
            # Secure fields
            "ssh_authority": True,
            "ADAPI_authority": True,
            "patch_info": {"patched_list": ["KB001"]},
            "base_report_stab": True,
            "weak_pwd": [],
            "unsafe_algorithm": False,
            "unsafe_protocol": False,
            "enable_iplimit": "true",
            "dangerous_port": [],
            # Feature fields
            "security_check_state": True,
            "cluster_brain_split_check": [],
            "admin": "true",
            "online": "true",
            "heartbeat_state": True,
            "dns_proxy_enabled": False,
            "cluster_state": "NORMAL",
            "cluster_virtual_mac": "NORMAL",
            "ms_state": "NORMAL",
            "syslog_enabled": True,
            "virtual_ip_pool_check": {"local": {"failure": [], "disable": []}, "global": {"failure": [], "disable": []}},
        }

    def test_analyze_health_scores(self):
        result = analyze(self.sample_data)
        hs = result.get("health_scores", {})
        self.assertIn("feature", hs)
        self.assertIn("health", hs)
        self.assertIn("secure", hs)
        self.assertIn("overall", hs)
        for key in ("feature", "health", "secure"):
            item = hs[key]
            self.assertIn("score", item)
            self.assertIn("pass", item)
            self.assertIn("total", item)

    def test_analyze_generates_suggestions_for_fail(self):
        # fan_state=0 is abnormal → fail
        data = dict(self.sample_data, fan_state=0)
        result = analyze(data)
        suggestions = result.get("suggestions", [])
        self.assertIsInstance(suggestions, list, "Must return a suggestions list")
        cr = result.get("check_results", {})
        self.assertEqual(cr.get("FAN_STATE_CHECK", {}).get("status"), "fail")

    def test_analyze_all_pass_no_suggestions(self):
        result = analyze(self.sample_data)
        suggestions = result.get("suggestions", [])
        # All fields pass in the setup data
        self.assertEqual(len(suggestions), 0)


class TestRenderMarkdown(unittest.TestCase):
    """Test render_markdown output structure."""

    def test_render_includes_health_scores(self):
        analysis = {
            "summary": {"total": 0, "pass": 0, "fail": 0, "warn": 0, "score": 100},
            "check_results": {},
            "device_info": {"version": "v1", "app_version": "", "gateway_id": "", "runtime": "", "ip": ""},
            "feature_scene": {"rule": []},
            "health_scene": {"rule": []},
            "secure_scene": {"rule": []},
            "check_summary": {"total": 0, "pass": 0, "fail": 0, "warn": 0, "score": 100},
            "health_scores": {
                "feature": {"pass": 2, "total": 2, "score": 100},
                "health": {"pass": 3, "total": 3, "score": 100},
                "secure": {"pass": 1, "total": 1, "score": 100},
                "overall": 100,
            },
            "suggestions": [
                {"priority": "高", "suggestion": "Test suggestion", "check": "CPU_CHECK"}
            ],
        }
        meta = {"host": "https://10.0.0.1", "scene": "标准巡检", "start_time": "2026-01-01 00:00:00"}
        output = render_markdown(analysis, meta)
        self.assertIn("优化建议", output)
        self.assertIn("健康评分", output)
        self.assertIn("100", output)


class TestExitCodes(unittest.TestCase):
    """Test exit code mappings."""

    def test_missing_args_exit_4(self):
        with patch("sys.argv", ["check.py", "run", "--host", "https://10.0.0.1"]):
            with patch.dict("os.environ", {}, clear=True):
                with self.assertRaises(SystemExit) as cm:
                    from check import main
                    main()
                self.assertEqual(cm.exception.code, 4)

    def test_auth_failure_exit_2(self):
        with patch("sys.argv", [
            "check.py", "run", "--host", "https://10.0.0.1", "--password", "wrong",
            "--scene", "标准巡检"
        ]):
            with patch("check.ADClient") as mock_client_class:
                mock_client = MagicMock()
                mock_client._request.side_effect = ADAuthError("HTTP 401", http_code=401)
                mock_client_class.return_value = mock_client
                # ADAuthError in start_check → exit 2
                with self.assertRaises(SystemExit) as cm:
                    from check import main
                    main()
                self.assertEqual(cm.exception.code, 2)


class TestNormalizeStartTime(unittest.TestCase):
    """Test _normalize_start_time."""

    def test_full_timestamp(self):
        from check import _normalize_start_time
        self.assertEqual(_normalize_start_time("2026-05-19 19:35:42"), 20260519193542)

    def test_digit_string(self):
        from check import _normalize_start_time
        self.assertEqual(_normalize_start_time("20260519193542"), 20260519193542)

    def test_short_string(self):
        from check import _normalize_start_time
        self.assertEqual(_normalize_start_time("2026"), 0)

    def test_empty_string(self):
        from check import _normalize_start_time
        self.assertEqual(_normalize_start_time(""), 0)

    def test_no_digits(self):
        from check import _normalize_start_time
        self.assertEqual(_normalize_start_time("abc"), 0)


class TestIsNewReport(unittest.TestCase):
    """Test _is_new_report logic."""

    def test_new_report_within_window(self):
        from check import _is_new_report
        top = {"name": "rpt_002", "start_time": "2026-05-20 12:00:30", "end_time": "2026-05-20 12:02:00"}
        self.assertTrue(_is_new_report(top, "rpt_001", 20260520120000))

    def test_same_name_as_previous(self):
        from check import _is_new_report
        top = {"name": "rpt_001", "start_time": "2026-05-20 12:00:30", "end_time": "2026-05-20 12:02"}
        self.assertFalse(_is_new_report(top, "rpt_001", 20260520120000))

    def test_no_end_time(self):
        from check import _is_new_report
        top = {"name": "rpt_002", "start_time": "2026-05-20 12:00:30", "end_time": ""}
        self.assertFalse(_is_new_report(top, "rpt_001", 20260520120000))

    def test_outside_window(self):
        from check import _is_new_report
        top = {"name": "rpt_002", "start_time": "2026-05-20 12:05:00", "end_time": "2026-05-20 12:07"}
        self.assertFalse(_is_new_report(top, "rpt_001", 20260520120000))

    def test_zero_start_time(self):
        from check import _is_new_report
        top = {"name": "rpt_002", "start_time": "", "end_time": "2026-05-20 12:02"}
        self.assertFalse(_is_new_report(top, "rpt_001", 0))


class TestWaitAndDownload(unittest.TestCase):
    """Test wait_and_download — poll + download + extract."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.work_dir = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_missing_meta_raises(self):
        from check import wait_and_download
        client = MagicMock()
        with self.assertRaises(RuntimeError) as cm:
            wait_and_download(client, work_dir=self.work_dir)
        self.assertIn("找不到", str(cm.exception))

    def test_meta_without_identifiers_raises(self):
        from check import wait_and_download
        client = MagicMock()
        meta_path = os.path.join(self.work_dir, "_meta.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({"scene": "test"}, f)
        with self.assertRaises(RuntimeError) as cm:
            wait_and_download(client, work_dir=self.work_dir)
        self.assertIn("判定", str(cm.exception))

    def test_api_error_during_poll(self):
        from check import wait_and_download
        client = MagicMock()
        client._request.side_effect = ADConnectionError("timeout")
        meta = {"scene": "标准巡检", "t0_int": 20260520120000, "pre_run_latest_name": "old", "work_dir": self.work_dir}
        with open(os.path.join(self.work_dir, "_meta.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f)
        with self.assertRaises(RuntimeError):
            wait_and_download(client, work_dir=self.work_dir, max_attempts=1)

    def test_timeout_no_new_report(self):
        from check import wait_and_download
        client = MagicMock()
        client._request.return_value = {"items": []}
        meta = {"scene": "标准巡检", "t0_int": 20260520120000, "pre_run_latest_name": "old", "work_dir": self.work_dir}
        with open(os.path.join(self.work_dir, "_meta.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f)
        with self.assertRaises(RuntimeError) as cm:
            wait_and_download(client, work_dir=self.work_dir, max_attempts=3, poll_interval=0.01)
        self.assertIn("未检测到", str(cm.exception))

    def test_download_missing_file_token(self):
        from check import wait_and_download
        client = MagicMock()
        history_resp = {"items": [{"name": "rpt_new", "start_time": "2026-05-20 12:00:30", "end_time": "2026-05-20 12:02"}]}
        token_resp = {}
        client._request.side_effect = [history_resp, token_resp]
        meta = {"scene": "标准巡检", "t0_int": 20260520120000, "pre_run_latest_name": "old", "work_dir": self.work_dir}
        with open(os.path.join(self.work_dir, "_meta.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f)
        with self.assertRaises(RuntimeError) as cm:
            wait_and_download(client, work_dir=self.work_dir, max_attempts=1)
        self.assertIn("file_token", str(cm.exception))


class TestProgressOne(unittest.TestCase):
    """Test _progress_one — single-device progress query."""

    def test_normal_progress(self):
        from check import _progress_one
        client = MagicMock()
        client._request.return_value = {"state": "RUNNING", "progress": 50}
        result = _progress_one(client)
        self.assertEqual(result["state"], "RUNNING")

    def test_no_running_with_history(self):
        from check import _progress_one
        client = MagicMock()
        client._request.side_effect = [
            {"state": "NO_RUNNING"},
            {"items": [{"name": "r1", "scene": "全量巡检", "start_time": "t1", "end_time": "t2"}]},
        ]
        result = _progress_one(client)
        self.assertIn("history_latest", result)
        self.assertEqual(result["history_latest"]["name"], "r1")

    def test_no_running_empty_history(self):
        from check import _progress_one
        client = MagicMock()
        client._request.side_effect = [
            {"state": "NO_RUNNING"},
            {"items": []},
        ]
        result = _progress_one(client)
        self.assertNotIn("history_latest", result)


class TestCheckMainSubcommands(unittest.TestCase):
    """Test main() subcommand paths not covered elsewhere."""

    def test_scenes_success(self):
        with patch("sys.argv", ["check.py", "scenes", "--host", "https://10.0.0.1", "--password", "pw"]):
            with patch("check.ADClient") as mock_cls:
                mock_client = MagicMock()
                mock_client._request.return_value = {"items": [{"name": "标准巡检"}]}
                mock_cls.return_value = mock_client
                from check import main
                main()  # no SystemExit — prints JSON and returns

    def test_scenes_api_error_exits_1(self):
        with patch("sys.argv", ["check.py", "scenes", "--host", "https://10.0.0.1", "--password", "pw"]):
            with patch("check.ADClient") as mock_cls:
                mock_client = MagicMock()
                mock_client._request.side_effect = ADConnectionError("timeout")
                mock_cls.return_value = mock_client
                with self.assertRaises(SystemExit) as cm:
                    from check import main
                    main()
                self.assertEqual(cm.exception.code, 1)

    def test_history_success(self):
        with patch("sys.argv", ["check.py", "history", "--host", "https://10.0.0.1", "--password", "pw"]):
            with patch("check.ADClient") as mock_cls:
                mock_client = MagicMock()
                mock_client._request.return_value = {"items": []}
                mock_cls.return_value = mock_client
                from check import main
                main()  # no SystemExit — prints JSON and returns

    def test_history_missing_host(self):
        with patch("sys.argv", ["check.py", "history"]):
            with self.assertRaises(SystemExit) as cm:
                from check import main
                main()
            self.assertEqual(cm.exception.code, 4)

    def test_progress_single_device(self):
        with patch("sys.argv", ["check.py", "progress", "--host", "https://10.0.0.1", "--password", "pw"]):
            with patch("check.ADClient") as mock_cls:
                mock_client = MagicMock()
                mock_client._request.return_value = {"state": "RUNNING"}
                mock_cls.return_value = mock_client
                from check import main
                main()  # no SystemExit — prints JSON and returns

    def test_analyze_ad_json_not_found(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("sys.argv", ["check.py", "analyze", "--path", tmpdir]):
                with self.assertRaises(SystemExit) as cm:
                    from check import main
                    main()
                self.assertEqual(cm.exception.code, 4)

    def test_analyze_with_valid_data(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            ad_path = os.path.join(tmpdir, "ad.json")
            with open(ad_path, "w", encoding="utf-8") as f:
                json.dump({"version": "1.0", "ad_appversion": "test"}, f)
            meta_path = os.path.join(tmpdir, "_meta.json")
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump({"host": "https://10.0.0.1", "scene": "标准巡检"}, f)
            with patch("sys.argv", ["check.py", "analyze", "--path", tmpdir]):
                from check import main
                main()  # no SystemExit — prints report markdown and returns


class TestAnalyzeV2(unittest.TestCase):
    """Test new data-driven analyze() with real ad.json fields."""

    def setUp(self):
        self.sample_data = {
            "version": "AD 7.1.8",
            "ad_appversion": "7.1.8.20250101",
            "gateway_id": "GATEWAY001",
            "base_running_time": "365 days",
            "dst_ip": "192.168.1.100",
            # Health fields
            "base_cpu_usage": [10, 20, 30],
            "snmp_mem_rate": 45,
            "fan_state": 1,
            "power_state": 1,
            "acceleration": 2,
            "base_file_ds": 0,
            "base_log_error_exist": 5,
            "base_kernel_log": 0,
            "base_crash_time": [],
            "base_blackbox_state": 0,
            "base_blackbox_dmesg": {},
            "base_core_process_lack": [],
            "base_eth_abnormal": [],
            "base_eth_mtu": [],
            "base_drop_err_packet_rate": [],
            "base_eth_info": "Link detected: yes\nSpeed: 1000Mb/s",
            "disk_info": {"sda": {"size": "100G"}},
            "base_disk_high_usage": [],
            "shm_sem_state": True,
            "bios_update_state": "",
            "alarms_enabled": 1,
            "I350_nic_state": "normal",
            "82599_nic_state": "normal",
            "conntrack_count": 5000,
            "conntrack_new_count": 100,
            "snat_sport_exhaustion_log_num": 0,
            "base_no_core": -1,
            "auto_update": "true",
            "remote_mt": "false",
            "id_conflict_list": [],
            # Secure fields
            "ssh_authority": True,
            "ADAPI_authority": True,
            "patch_info": {"patched_list": ["KB001"]},
            "base_report_stab": True,
            "weak_pwd": [],
            "unsafe_algorithm": False,
            "unsafe_protocol": False,
            "enable_iplimit": "true",
            "dangerous_port": [],
            # Feature fields
            "security_check_state": True,
            "cluster_brain_split_check": [],
            "admin": "true",
            "online": "true",
            "heartbeat_state": True,
            "cluster_state": "NORMAL",
            "cluster_virtual_mac": "NORMAL",
            "ms_state": "NORMAL",
            "syslog_enabled": True,
            "virtual_ip_pool_check": {"local": {"failure": [], "disable": []}, "global": {"failure": [], "disable": []}},
            "dns_proxy_enabled": False,
            "cluster_fault_switch_enabled": "CLUSTER_UNABLE",
        }

    def test_analyze_processes_all_mapped_fields(self):
        """Engine processes all ad.json fields that have FIELD_RULES entries."""
        result = analyze(self.sample_data)
        self.assertGreater(len(result["check_results"]), 30)
        summary = result["summary"]
        self.assertGreater(summary["total"], 30)

    def test_analyze_fallback_with_none_check_info(self):
        """None check_info → still processes all fields (parameter preserved, unused)."""
        result = analyze(self.sample_data, None)
        self.assertGreater(len(result["check_results"]), 0)
        cats = result["categories"]
        self.assertIn("feature", cats)
        self.assertIn("health", cats)
        self.assertIn("secure", cats)

    def test_analyze_output_structure(self):
        """Verify complete output structure."""
        result = analyze(self.sample_data)
        self.assertIn("device_info", result)
        self.assertIn("check_results", result)
        self.assertIn("categories", result)
        self.assertIn("summary", result)
        self.assertIn("health_scores", result)
        self.assertIn("suggestions", result)
        dev = result["device_info"]
        self.assertEqual(dev["version"], "AD 7.1.8")

    def test_analyze_fan_state_pass(self):
        """fan_state=1 → FAN_STATE_CHECK pass (1 = normal)."""
        data = {"fan_state": 1}
        result = analyze(data)
        self.assertEqual(result["check_results"]["FAN_STATE_CHECK"]["status"], "pass")

    def test_analyze_fan_state_fail(self):
        """fan_state=0 → FAN_STATE_CHECK fail."""
        data = {"fan_state": 0}
        result = analyze(data)
        self.assertEqual(result["check_results"]["FAN_STATE_CHECK"]["status"], "fail")

    def test_analyze_cpu_threshold_fail(self):
        """CPU usage 95 > 90 → CPU_CHECK fail."""
        data = {"base_cpu_usage": 95}
        result = analyze(data)
        self.assertEqual(result["check_results"]["CPU_CHECK"]["status"], "fail")

    def test_analyze_cpu_threshold_pass(self):
        """CPU usage 50 < 80 → CPU_CHECK pass."""
        data = {"base_cpu_usage": 50}
        result = analyze(data)
        self.assertEqual(result["check_results"]["CPU_CHECK"]["status"], "pass")

    def test_analyze_ssh_authority_false_fail(self):
        """ssh_authority=False → SSH_API_CHECK fail (disabled)."""
        data = {"ssh_authority": False}
        result = analyze(data)
        self.assertEqual(result["check_results"]["SSH_API_CHECK"]["status"], "fail")

    def test_analyze_unsafe_algorithm_fail(self):
        """unsafe_algorithm=True → SSL_POLICY_CHECK fail."""
        data = {"unsafe_algorithm": True}
        result = analyze(data)
        self.assertEqual(result["check_results"]["SSL_POLICY_CHECK"]["status"], "fail")

    def test_analyze_dangerous_port_fail(self):
        """dangerous_port non-empty → OPEN_PORT_CHECK fail."""
        data = {"dangerous_port": [22, 23]}
        result = analyze(data)
        self.assertEqual(result["check_results"]["OPEN_PORT_CHECK"]["status"], "fail")

    def test_analyze_weak_pwd_fail(self):
        """weak_pwd non-empty → WEAK_PASSWORD_CHECK fail."""
        data = {"weak_pwd": ["admin"]}
        result = analyze(data)
        self.assertEqual(result["check_results"]["WEAK_PASSWORD_CHECK"]["status"], "fail")

    def test_analyze_with_none_data(self):
        """None data → empty result, no crash."""
        result = analyze(None)
        self.assertEqual(result["summary"]["total"], 0)

    def test_check_results_have_name_field(self):
        """Every check_result entry must have a 'name' field from CHECK_RULES."""
        result = analyze(self.sample_data)
        for key, cr in result["check_results"].items():
            self.assertIn("name", cr, f"Missing 'name' in check_result {key}")
            self.assertIsNotNone(cr["name"])

    def test_suggestions_use_check_keys(self):
        """Suggestions entries use CHECK_RULES keys."""
        data = {"fan_state": 0}
        result = analyze(data)
        sug = result["suggestions"]
        self.assertGreater(len(sug), 0)
        self.assertEqual(sug[0]["check"], "FAN_STATE_CHECK")

    # ── Threshold / warn_at tier tests ─────────────────────────────

    def test_cpu_list_max_takes_highest(self):
        """base_cpu_usage as a list → takes max()."""
        data = {"base_cpu_usage": [85, 92, 78]}
        result = analyze(data)
        self.assertEqual(result["check_results"]["CPU_CHECK"]["status"], "fail")

    def test_cpu_list_warn_tier(self):
        """base_cpu_usage list max between 80-90 → fail (unified severity)."""
        data = {"base_cpu_usage": [85, 70, 82]}
        result = analyze(data)
        cr = result["check_results"]["CPU_CHECK"]
        self.assertIn(cr["status"], ["fail"])

    def test_memory_warn_tier(self):
        """snmp_mem_rate 85 > 80 warn_at → fail (unified severity)."""
        data = {"snmp_mem_rate": 85}
        result = analyze(data)
        self.assertEqual(result["check_results"]["MEMORY_CHECK"]["status"], "fail")

    def test_log_error_warn_tier(self):
        """base_log_error_exist 50 > 0 warn_at → fail (unified)."""
        data = {"base_log_error_exist": 50}
        result = analyze(data)
        self.assertEqual(result["check_results"]["LOG_CHECK"]["status"], "fail")

    def test_log_error_fail(self):
        """base_log_error_exist 200 > 100 → fail."""
        data = {"base_log_error_exist": 200}
        result = analyze(data)
        self.assertEqual(result["check_results"]["LOG_CHECK"]["status"], "fail")

    def test_log_error_zero_pass(self):
        """base_log_error_exist 0 → pass."""
        data = {"base_log_error_exist": 0}
        result = analyze(data)
        self.assertEqual(result["check_results"]["LOG_CHECK"]["status"], "pass")

    # ── Feature scene field tests ──────────────────────────────────

    def test_admin_role_pass(self):
        """admin='true' → ADMIN_ROLE_CHECK pass."""
        data = {"admin": "true"}
        result = analyze(data)
        self.assertEqual(result["check_results"]["ADMIN_ROLE_CHECK"]["status"], "pass")

    def test_heartbeat_state_pass(self):
        """heartbeat_state=True → HEARTBEAT_CHECK pass."""
        data = {"heartbeat_state": True}
        result = analyze(data)
        self.assertEqual(result["check_results"]["HEARTBEAT_CHECK"]["status"], "pass")

    def test_cluster_state_pass(self):
        """cluster_state='NORMAL' → CLUSTER_STATE_CHECK pass."""
        data = {"cluster_state": "NORMAL"}
        result = analyze(data)
        self.assertEqual(result["check_results"]["CLUSTER_STATE_CHECK"]["status"], "pass")

    def test_sibling_key_propagation(self):
        """dns_proxy_enabled should propagate to both DNS_PROXY_CHECK and DNS_DETECT_CHECK."""
        data = {"dns_proxy_enabled": False}
        result = analyze(data)
        # Both check_keys share the same field
        self.assertIn("DNS_PROXY_CHECK", result["check_results"])
        self.assertIn("DNS_DETECT_CHECK", result["check_results"])
        self.assertEqual(result["check_results"]["DNS_PROXY_CHECK"]["status"],
                         result["check_results"]["DNS_DETECT_CHECK"]["status"])

    def test_vip_pool_check_pass(self):
        """Empty VIP pool failures → VIP_POOL_CHECK pass."""
        data = {"virtual_ip_pool_check": {"local": {"failure": [], "disable": []}, "global": {"failure": [], "disable": []}}}
        result = analyze(data)
        self.assertEqual(result["check_results"]["VIP_POOL_CHECK"]["status"], "pass")

    def test_vip_pool_check_fail(self):
        """VIP pool with failures → VIP_POOL_CHECK fail."""
        data = {"virtual_ip_pool_check": {"local": {"failure": ["vs1"], "disable": []}, "global": {"failure": [], "disable": ["vs2"]}}}
        result = analyze(data)
        self.assertEqual(result["check_results"]["VIP_POOL_CHECK"]["status"], "fail")

    # ── Categories are populated ───────────────────────────────────

    def test_categories_contain_all_three(self):
        result = analyze(self.sample_data)
        cats = result["categories"]
        self.assertGreater(len(cats["feature"]), 0, "Feature category should have items")
        self.assertGreater(len(cats["health"]), 0, "Health category should have items")
        self.assertGreater(len(cats["secure"]), 0, "Secure category should have items")


class TestEvaluateField(unittest.TestCase):
    """Test _evaluate_field for all rule types."""

    def test_threshold_gt_abnormal(self):
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'name': 'CPU', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(95, rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    def test_threshold_gt_normal(self):
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'name': 'CPU', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(50, rule)
        self.assertFalse(is_ab)
        self.assertEqual(sev, 'pass')

    def test_threshold_eq_abnormal(self):
        rule = {'type': 'threshold', 'abnormal': -1, 'compare': '==', 'name': 'Power', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(-1, rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    def test_threshold_bad_value(self):
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'name': 'Test', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field("not_a_number", rule)
        self.assertFalse(is_ab)
        self.assertEqual(sev, 'fail')
        self.assertIn("无法解析", issue)

    def test_bool_false_false(self):
        rule = {'type': 'bool_false', 'name': 'SSH', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(False, rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    def test_bool_false_true(self):
        rule = {'type': 'bool_false', 'name': 'SSH', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(True, rule)
        self.assertFalse(is_ab)

    def test_bool_false_string(self):
        rule = {'type': 'bool_false', 'name': 'Test', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field("false", rule)
        self.assertTrue(is_ab)

    def test_bool_true_true(self):
        rule = {'type': 'bool_true', 'name': 'Unsafe', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(True, rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    def test_str_equal_match(self):
        rule = {'type': 'str_equal', 'abnormal': 'false', 'name': 'IPLimit', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field('false', rule)
        self.assertTrue(is_ab)

    def test_str_not_equal_mismatch(self):
        rule = {'type': 'str_not_equal', 'normal': 'true', 'name': 'AutoUpdate', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field('false', rule)
        self.assertTrue(is_ab)

    def test_non_empty_list(self):
        rule = {'type': 'non_empty', 'name': 'WeakPwd', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(['admin'], rule)
        self.assertTrue(is_ab)

    def test_non_empty_empty_list(self):
        rule = {'type': 'non_empty', 'name': 'WeakPwd', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field([], rule)
        self.assertFalse(is_ab)

    def test_not_normal_mismatch(self):
        rule = {'type': 'not_normal', 'name': 'NIC', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field('error', rule)
        self.assertTrue(is_ab)

    def test_not_normal_match(self):
        rule = {'type': 'not_normal', 'name': 'NIC', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field('normal', rule)
        self.assertFalse(is_ab)

    def test_not_zero_nonzero(self):
        rule = {'type': 'not_zero', 'name': 'KernelLog', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(5, rule)
        self.assertTrue(is_ab)

    def test_not_zero_zero(self):
        rule = {'type': 'not_zero', 'name': 'KernelLog', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(0, rule)
        self.assertFalse(is_ab)

    def test_zero_zero(self):
        rule = {'type': 'zero', 'name': 'Alarm', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(0, rule)
        self.assertTrue(is_ab)

    def test_has_value_present(self):
        rule = {'type': 'has_value', 'name': 'BIOS', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field('v2.0', rule)
        self.assertTrue(is_ab)

    def test_missing_empty(self):
        rule = {'type': 'missing', 'name': 'Version', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field('', rule)
        self.assertTrue(is_ab)

    def test_empty_dict_empty(self):
        rule = {'type': 'empty_dict', 'name': 'Disk', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field({}, rule)
        self.assertTrue(is_ab)

    def test_empty_dict_non_empty(self):
        rule = {'type': 'empty_dict', 'name': 'Disk', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field({"sda": "ok"}, rule)
        self.assertFalse(is_ab)

    def test_nested_list_empty(self):
        rule = {'type': 'nested_list', 'key': 'patched_list', 'name': 'Patch', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field({"patched_list": []}, rule)
        self.assertTrue(is_ab)

    def test_eth_parse_link_down(self):
        rule = {'type': 'eth_parse', 'name': 'Eth', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field('Link detected: no', rule)
        self.assertTrue(is_ab)

    def test_eth_parse_ok(self):
        rule = {'type': 'eth_parse', 'name': 'Eth', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field('Link detected: yes\nSpeed: 1000Mb/s', rule)
        self.assertFalse(is_ab)

    def test_none_value(self):
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'name': 'Test', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field(None, rule)
        self.assertFalse(is_ab)
        self.assertEqual(sev, 'fail')
        self.assertIn("数据不可用", issue)

    def test_unknown_rule_type(self):
        rule = {'type': 'nonexistent', 'name': 'Test', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field("some_value", rule)
        self.assertFalse(is_ab)
        self.assertIn("未知规则类型", issue)

    # ── Two-tier threshold (warn_at) ────────────────────────────────

    def test_threshold_warn_at_pass(self):
        """value below warn_at → pass."""
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'severity': 'fail',
                'warn_at': 80, 'warn_compare': '>', 'name': 'Test'}
        is_ab, sev, issue = _evaluate_field(50, rule)
        self.assertFalse(is_ab)
        self.assertEqual(sev, 'pass')

    def test_threshold_warn_at_triggered(self):
        """value between warn_at and abnormal → fail (severity unified)."""
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'severity': 'fail',
                'warn_at': 80, 'warn_compare': '>', 'name': 'Test'}
        is_ab, sev, issue = _evaluate_field(85, rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    def test_threshold_warn_at_fail(self):
        """value exceeds abnormal → fail."""
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'severity': 'fail',
                'warn_at': 80, 'warn_compare': '>', 'name': 'Test'}
        is_ab, sev, issue = _evaluate_field(95, rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    def test_threshold_list_value(self):
        """List value → take max() before comparing."""
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'severity': 'fail',
                'warn_at': 80, 'warn_compare': '>', 'name': 'CPU使用率'}
        is_ab, sev, issue = _evaluate_field([95, 30, 85], rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    def test_threshold_list_value_warn(self):
        """List value max between warn_at and abnormal → fail (unified)."""
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'severity': 'fail',
                'warn_at': 80, 'warn_compare': '>', 'name': 'CPU使用率'}
        is_ab, sev, issue = _evaluate_field([85, 30, 50], rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    def test_threshold_empty_list(self):
        """Empty list → fail with data empty message."""
        rule = {'type': 'threshold', 'abnormal': 90, 'compare': '>', 'severity': 'fail', 'name': 'Test'}
        is_ab, sev, issue = _evaluate_field([], rule)
        self.assertFalse(is_ab)
        self.assertEqual(sev, 'fail')
        self.assertIn("数据为空", issue)

    def test_threshold_warn_at_eq(self):
        """warn_at with == compare → fail (unified severity)."""
        rule = {'type': 'threshold', 'abnormal': 0, 'compare': '==', 'severity': 'fail',
                'warn_at': -1, 'warn_compare': '==', 'name': '电源状态'}
        is_ab, sev, issue = _evaluate_field(-1, rule)
        self.assertTrue(is_ab)
        self.assertEqual(sev, 'fail')

    # ── bool_false edge cases ──────────────────────────────────────

    def test_bool_false_empty_string(self):
        """Empty string → abnormal (treated as falsy)."""
        rule = {'type': 'bool_false', 'name': 'Test', 'severity': 'fail'}
        is_ab, sev, issue = _evaluate_field("", rule)
        self.assertTrue(is_ab)


class TestEvaluateVipPool(unittest.TestCase):
    """Test _evaluate_vip_pool special handler."""

    def test_vip_pool_pass(self):
        data = {"virtual_ip_pool_check": {"local": {"failure": [], "disable": []}, "global": {"failure": [], "disable": []}}}
        status, value, detail = _evaluate_vip_pool(data)
        self.assertEqual(status, "pass")

    def test_vip_pool_fail(self):
        data = {"virtual_ip_pool_check": {"local": {"failure": ["vs1"], "disable": []}, "global": {"failure": [], "disable": ["vs2"]}}}
        status, value, detail = _evaluate_vip_pool(data)
        self.assertEqual(status, "fail")
        self.assertIn("2", value)

    def test_vip_pool_empty_data(self):
        status, value, detail = _evaluate_vip_pool({})
        self.assertEqual(status, "pass")


if __name__ == "__main__":
    unittest.main()
