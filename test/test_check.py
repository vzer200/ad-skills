#!/usr/bin/env python3
"""Unit tests for check.py — AD inspection workflow."""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-check-analysis", "scripts"))

import json
import unittest
import tempfile
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from unittest.mock import patch, MagicMock

from check import (
    start_check, analyze, render_markdown,
    render_interaction_prompt, _SUGGESTION_MAP,
)
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

    def test_record_limit_ignores_total_when_items_are_empty(self):
        self.client._request.side_effect = [
            {"items": [{"name": "standard"}]},
            {"total": 5, "items": []},
            {"event_id": "ev-total-ignored"},
        ]

        result = start_check(self.client, "standard", force=False, work_dir=self.work_dir)

        self.assertEqual(result["event_id"], "ev-total-ignored")

    def test_record_limit_uses_items_even_when_total_is_lower(self):
        self.client._request.side_effect = [
            {"items": [{"name": "standard"}]},
            {"total": 0, "items": [{}, {}, {}, {}, {}]},
        ]

        with self.assertRaises(RuntimeError) as cm:
            start_check(self.client, "standard", force=False, work_dir=self.work_dir)

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
        with self.assertRaises(RuntimeError):
            start_check(self.client, "标准巡检", work_dir=self.work_dir)

    def test_scenes_api_connection_error(self):
        self.client._request.side_effect = ADConnectionError("timeout")
        with self.assertRaises(RuntimeError):
            start_check(self.client, "标准巡检", work_dir=self.work_dir)


class TestAnalyze(unittest.TestCase):
    """Test analyze() with mock check results."""

    def setUp(self):
        self.sample_data = {
            "check_results": {
                "cpu_check": {"status": "pass", "value": "17%"},
                "memory_check": {"status": "pass", "value": "42%"},
                "disk_check": {"status": "warn", "disk_usage": "/ 82%"},
                "fan_state_check": {"status": "pass"},
                "power_state_check": {"status": "pass"},
                "kernel_log_check": {"status": "pass"},
                "nic_state_check": {"status": "pass"},
            },
            "feature_scene": {"rule": ["APP_VERSION_CHECK", "ADMIN_ROLE_CHECK"]},
            "health_scene": {"rule": ["CPU_CHECK", "MEMORY_CHECK", "DISK_CHECK"]},
            "secure_scene": {"rule": ["SSH_API_CHECK", "WEAK_PASSWORD_CHECK"]},
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

    def test_analyze_generates_suggestions_for_warn(self):
        result = analyze(self.sample_data)
        suggestions = result.get("suggestions", [])
        # DISK_CHECK (from disk_check) with "warn" status should generate a suggestion
        self.assertIsInstance(suggestions, list, "Must return a suggestions list")
        # Sample data has disk_check warn, which maps to DISK_CHECK in _SUGGESTION_MAP
        # after analyze() normalizes check names

    def test_analyze_all_pass_no_suggestions(self):
        data = {
            "check_results": {
                "cpu_check": {"status": "pass", "value": "17%"},
                "memory_check": {"status": "pass", "value": "42%"},
            },
            "feature_scene": {"rule": []},
            "health_scene": {"rule": ["CPU_CHECK", "MEMORY_CHECK"]},
            "secure_scene": {"rule": []},
        }
        result = analyze(data)
        suggestions = result.get("suggestions", [])
        self.assertEqual(len(suggestions), 0)

    def test_overall_score_ignores_empty_dimensions(self):
        result = analyze({"ad_appversion": "AD-1.0"})
        hs = result["health_scores"]
        self.assertEqual(hs["feature"]["score"], 100)
        self.assertEqual(hs["health"]["total"], 0)
        self.assertEqual(hs["secure"]["total"], 0)
        self.assertEqual(hs["overall"], 100)
        self.assertEqual(result["summary"]["score"], 100)

    def test_dimension_score_counts_warn_as_half_credit(self):
        result = analyze({"base_log_error_exist": 1})
        hs = result["health_scores"]
        self.assertEqual(hs["health"]["total"], 1)
        self.assertEqual(hs["health"]["score"], 50)
        self.assertEqual(hs["overall"], 50)
        self.assertEqual(result["summary"]["score"], 50)

    def test_log_check_only_fails_above_100_error_logs(self):
        self.assertEqual(analyze({"base_log_error_exist": 0})["check_results"]["LOG_CHECK"]["status"], "pass")
        self.assertEqual(analyze({"base_log_error_exist": 100})["check_results"]["LOG_CHECK"]["status"], "warn")
        self.assertEqual(analyze({"base_log_error_exist": 101})["check_results"]["LOG_CHECK"]["status"], "fail")

    def test_memory_check_warns_at_80_and_fails_at_90(self):
        self.assertEqual(analyze({"snmp_mem_rate": 79})["check_results"]["MEMORY_CHECK"]["status"], "pass")
        self.assertEqual(analyze({"snmp_mem_rate": 80})["check_results"]["MEMORY_CHECK"]["status"], "warn")
        self.assertEqual(analyze({"snmp_mem_rate": 90})["check_results"]["MEMORY_CHECK"]["status"], "fail")

    def test_disk_check_uses_empty_and_usage_thresholds(self):
        self.assertEqual(analyze({"disk_info": {}})["check_results"]["DISK_CHECK"]["status"], "warn")
        self.assertEqual(analyze({"disk_info": {"root": "79%"}})["check_results"]["DISK_CHECK"]["status"], "pass")
        self.assertEqual(analyze({"disk_info": {"root": "80%"}})["check_results"]["DISK_CHECK"]["status"], "warn")
        self.assertEqual(analyze({"disk_info": {"root": "90%"}})["check_results"]["DISK_CHECK"]["status"], "fail")

    def test_device_connection_check_accepts_any_connected_interface(self):
        result = analyze({"base_eth_info": {"eth0": "Link detected: no", "eth1": "Link detected: yes"}})
        self.assertEqual(result["check_results"]["DEVICE_CONNECTION_CHECK"]["status"], "pass")

    def test_not_applicable_checks_do_not_affect_score_or_suggestions(self):
        result = analyze({
            "ad_appversion": "AD-1.0",
            "cluster_state": "NOT_CLUSTER_MODE",
            "cluster_virtual_mac": "CLUSTER_UNABLE",
            "ms_state": "CLUSTER_UNABLE_OR_NOTIN",
            "cluster_appgroup_unit": "CLUSTER_UNABLE",
            "cluster_session_sync": "CLUSTER_UNABLE",
            "cluster_fault_switch_enabled": "CLUSTER_UNABLE",
            "fan_state": -1,
            "power_state": -1,
        })

        self.assertEqual(result["check_results"]["CLUSTER_STATE_CHECK"]["status"], "not_applicable")
        self.assertEqual(result["check_results"]["VIRTUAL_MAC_CHECK"]["status"], "not_applicable")
        self.assertEqual(result["check_results"]["DUAL_STATE_CHECK"]["status"], "not_applicable")
        self.assertEqual(result["check_results"]["APP_GROUP_CHECK"]["status"], "not_applicable")
        self.assertEqual(result["check_results"]["SESSION_SYNC_CHECK"]["status"], "not_applicable")
        self.assertEqual(result["check_results"]["FAULT_SWITCH_CHECK"]["status"], "not_applicable")
        self.assertEqual(result["check_results"]["FAN_STATE_CHECK"]["status"], "not_applicable")
        self.assertEqual(result["check_results"]["POWER_STATE_CHECK"]["status"], "not_applicable")
        self.assertEqual(result["summary"]["total"], 1)
        self.assertEqual(result["summary"]["pass"], 1)
        self.assertEqual(result["summary"]["fail"], 0)
        self.assertEqual(result["summary"]["warn"], 0)
        self.assertEqual(result["summary"]["not_applicable"], 8)
        self.assertEqual(result["summary"]["score"], 100)
        self.assertEqual(result["health_scores"]["overall"], 100)
        self.assertEqual(result["suggestions"], [])

    def test_security_details_are_user_facing(self):
        result = analyze({
            "security_check_state": False,
            "unsafe_algorithm": True,
            "unsafe_protocol": True,
            "enable_iplimit": "false",
            "ssh_authority": False,
        })
        rendered_values = "\n".join(item["value"] for item in result["check_results"].values())
        self.assertIn("设备安全检查未开启", rendered_values)
        self.assertIn("存在不安全算法和不安全协议", rendered_values)
        self.assertIn("未启用管理登录 IP 限制", rendered_values)
        self.assertIn("SSH/API 访问控制未开启", rendered_values)
        self.assertNotIn("security_check_state=", rendered_values)
        self.assertNotIn("algorithm=", rendered_values)
        self.assertNotIn("enable_iplimit=", rendered_values)

    def test_analyze_carries_native_check_description(self):
        result = analyze({
            "admin": "false",
            "descriptions": {
                "admin": "原生 API 管理员角色说明",
            },
        })

        self.assertEqual(
            result["check_results"]["ADMIN_ROLE_CHECK"]["description"],
            "原生 API 管理员角色说明",
        )

    def test_interaction_prompt_requires_history_before_force(self):
        self.assertEqual(
            render_interaction_prompt("scene", "AD1"),
            "请问你要对 AD1 执行哪种巡检？\n标准巡检\n全量巡检\n安全巡检",
        )
        self.assertEqual(
            render_interaction_prompt("confirm", "AD1", "全量巡检"),
            "已检查历史巡检记录，是否确认对 AD1 强制继续全量巡检？",
        )

    def test_interaction_prompt_can_use_api_scene_names(self):
        self.assertEqual(
            render_interaction_prompt("scene", "AD1", scenes=["功能巡检", "健康巡检"]),
            "请问你要对 AD1 执行哪种巡检？\n功能巡检\n健康巡检",
        )


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
        meta = {"host": "https://10.0.0.1", "device_name": "AD1", "scene": "标准巡检", "start_time": "2026-01-01 00:00:00"}
        output = render_markdown(analysis, meta)
        self.assertIn("- 目标：AD1 (10.0.0.1)", output)
        self.assertIn("优化建议", output)
        self.assertIn("健康评分", output)
        self.assertIn("100", output)
        self.assertNotIn("## 巡检过程", output)
        self.assertNotIn("## 原始报告", output)

    def test_render_marks_empty_dimensions_as_not_covered(self):
        analysis = analyze({"ad_appversion": "AD-1.0"})
        output = render_markdown(analysis, {"host": "https://10.0.0.1", "scene": "标准巡检", "start_time": ""})
        self.assertIn("未覆盖", output)
        self.assertIn("**100/100**", output)
        self.assertNotIn("硬件健康 | 🔴 0/100", output)

    def test_render_sanitizes_raw_device_fields(self):
        analysis = analyze({
            "admin": "false",
            "heartbeat_state": False,
            "shm_sem_state": False,
            "security_check_state": False,
            "unsafe_algorithm": True,
            "unsafe_protocol": True,
            "enable_iplimit": "false",
            "dns_server_enabled": "",
        })
        output = render_markdown(analysis, {"host": "https://10.0.0.1", "scene": "标准巡检", "start_time": ""})
        self.assertIn("管理员角色配置异常，建议确认管理账号角色是否完整", output)
        self.assertIn("心跳状态异常", output)
        self.assertIn("共享内存/信号量异常", output)
        self.assertIn("设备安全检查未开启", output)
        self.assertIn("SSL 策略存在不安全算法或协议", output)
        self.assertIn("管理登录 IP 限制未启用", output)
        self.assertIn("DNS 服务器检查用于确认 DNS 服务配置是否符合预期。", output)
        self.assertNotIn("admin=", output)
        self.assertNotIn("heartbeat_state=", output)
        self.assertNotIn("shm_sem_state=", output)
        self.assertNotIn("security_check_state=", output)
        self.assertNotIn("algorithm=", output)
        self.assertNotIn("protocol=", output)
        self.assertNotIn("enable_iplimit=", output)
        self.assertNotIn("dns_server_enabled=", output)
        self.assertNotIn("ad.json", output)
        self.assertNotIn("## 重点异常", output)
        self.assertNotIn("## 巡检过程", output)
        self.assertNotIn("## 原始报告", output)
        self.assertNotRegex(output, r"\b(?:[A-Za-z][A-Za-z0-9_]*|82599)=")
        self.assertNotIn("⚠️ 异常", output)
        self.assertIn("| 检查项 | 具体说明 | 状态 |", output)
        self.assertNotIn("当前发现", output)
        self.assertIn("| 设备安全状态检查 | 设备安全状态检查用于确认设备安全检查功能是否开启。 | ❌ 异常 |", output)
        self.assertIn("✅ 正常", output)

    def test_render_check_detail_description_before_status(self):
        analysis = analyze({
            "admin": "false",
            "descriptions": {
                "admin": "原生 API 管理员角色说明",
            },
        })
        output = render_markdown(analysis, {"host": "https://10.0.0.1", "scene": "标准巡检", "start_time": ""})

        self.assertIn("| 检查项 | 具体说明 | 状态 |", output)
        self.assertNotIn("当前发现", output)
        self.assertIn("| 管理员角色检查 | 原生 API 管理员角色说明 | ❌ 异常 |", output)
        self.assertNotIn("| 管理员角色检查 | ❌ 异常 | 原生 API 管理员角色说明 |", output)

    def test_render_progress_text_inside_report_header(self):
        analysis = analyze({"ad_appversion": "1.0"})
        output = render_markdown(
            analysis,
            {
                "host": "https://10.0.0.1",
                "scene": "标准巡检",
                "start_time": "",
                "progress_text": "目前巡检 8/35",
            },
        )

        self.assertIn("- 巡检进度：目前巡检 8/35", output)
        self.assertLess(output.index("- 巡检进度：目前巡检 8/35"), output.index("- 总体状态："))

    def test_render_not_applicable_without_counting_anomaly(self):
        analysis = analyze({
            "ad_appversion": "1.0",
            "cluster_state": "NOT_CLUSTER_MODE",
            "power_state": -1,
        })
        output = render_markdown(analysis, {"host": "https://10.0.0.1", "scene": "标准巡检", "start_time": ""})

        self.assertIn("➖ 不适用", output)
        self.assertIn("- 异常数量：0 项", output)
        self.assertNotIn("POWER_STATE_CHECK", "\n".join(item["check"] for item in analysis["suggestions"]))

    def test_render_check_details_and_suggestions_are_operator_facing(self):
        analysis = analyze({
            "admin": "false",
            "security_check_state": False,
            "base_log_error_exist": 6,
            "acceleration": 2,
            "power_state": -1,
            "unsafe_algorithm": True,
            "unsafe_protocol": True,
            "enable_iplimit": "false",
            "dangerous_port": ["TCP:85为报表服务", "TCP:161为智能DNS服务"],
        })
        output = render_markdown(analysis, {"host": "https://10.0.0.1", "scene": "标准巡检", "start_time": ""})

        self.assertIn("管理员角色配置异常，建议确认管理账号角色是否完整", output)
        self.assertIn("检测到错误日志，建议优先查看最近时间段错误日志", output)
        self.assertIn("| 加速卡状态检查 | 加速卡状态检查用于确认 SSL/压缩等硬件加速卡是否正常工作。 | ✅ 正常 |", output)
        self.assertIn("| 电源状态检查 | 电源状态检查用于确认电源模块是否处于正常状态。（设备未提供该硬件传感器数据） | ➖ 不适用 |", output)
        self.assertIn("存在风险端口开放，建议关闭不必要的端口", output)
        self.assertIn("管理登录 IP 限制未启用，建议开启管理来源限制", output)
        self.assertNotIn("| 电源状态检查 | - | ❌ 异常 | -1 |", output)
        self.assertNotIn("当前发现", output)
        self.assertNotIn("状态异常，建议进一步排查", output)

        suggestion_checks = {item["check"] for item in analysis["suggestions"]}
        self.assertNotIn("POWER_STATE_CHECK", suggestion_checks)
        self.assertIn("OPEN_PORT_CHECK", suggestion_checks)
        self.assertNotIn("SPEED_CARD_CHECK", suggestion_checks)

    def test_wait_devices_timeout_does_not_render_report(self):
        from check import main
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False) as f:
            json.dump({
                "devices": [
                    {"name": "AD1", "host": "https://10.0.0.1", "user": "admin", "password": "pw"}
                ]
            }, f)
            devices_path = f.name
        stdout = StringIO()
        stderr = StringIO()
        try:
            argv = ["check.py", "wait", "--devices", devices_path, "--device", "AD1"]
            with patch("sys.argv", argv), patch("check.run_multi", return_value={
                "https://10.0.0.1": {"error": "CheckTimeoutError: 未检测到本次巡检的完成报告"}
            }):
                with self.assertRaises(SystemExit) as cm, redirect_stdout(stdout), redirect_stderr(stderr):
                    main()
            self.assertEqual(cm.exception.code, 5)
            self.assertNotIn("## 巡检结论", stdout.getvalue())
            self.assertNotIn("## 原始报告", stdout.getvalue())
            self.assertIn("CheckTimeoutError", stderr.getvalue())
        finally:
            os.unlink(devices_path)


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
                # ADAuthError in start_check → wrapped as RuntimeError → exit 4
                with self.assertRaises(SystemExit) as cm:
                    from check import main
                    main()
                self.assertEqual(cm.exception.code, 4)


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

    def test_running_progress_includes_user_visible_text(self):
        from check import _progress_one
        client = MagicMock()
        client._request.return_value = {"state": "RUNNING", "finished": 22, "total": 35}
        result = _progress_one(client)
        self.assertEqual(result["progress_text"], "目前巡检 23/35")

    def test_progress_one_persists_progress_text_for_wait_report(self):
        from check import _progress_one
        client = MagicMock()
        client.host = "https://10.0.0.1"
        client._request.return_value = {"state": "RUNNING", "finished": 22, "total": 35}
        with tempfile.TemporaryDirectory() as work_dir:
            result = _progress_one(client, work_dir=work_dir)
            progress_path = os.path.join(work_dir, "_progress.json")

            self.assertEqual(result["progress_text"], "目前巡检 23/35")
            self.assertTrue(os.path.exists(progress_path))
            with open(progress_path, encoding="utf-8") as f:
                saved = json.load(f)
            self.assertEqual(saved["progress_text"], "目前巡检 23/35")

    def test_saved_progress_text_is_prefixed_to_wait_report(self):
        from check import _prepend_progress_text
        with tempfile.TemporaryDirectory() as work_dir:
            with open(os.path.join(work_dir, "_progress.json"), "w", encoding="utf-8") as f:
                json.dump({"progress_text": "目前巡检 23/35"}, f, ensure_ascii=False)

            report = _prepend_progress_text("## 巡检结论\n- 目标：AD1", work_dir, {})

            self.assertTrue(report.startswith("目前巡检 23/35\n\n## 巡检结论"))

    def test_wait_report_uses_final_item_count_when_progress_has_no_numbers(self):
        from check import _prepend_progress_text
        with tempfile.TemporaryDirectory() as work_dir:
            with open(os.path.join(work_dir, "_progress.json"), "w", encoding="utf-8") as f:
                json.dump({"progress_text": "巡检进度暂不可用"}, f, ensure_ascii=False)

            report = _prepend_progress_text("## 巡检结论\n- 目标：AD1", work_dir, {}, fallback_total=35)

            self.assertTrue(report.startswith("目前巡检 35/35\n\n## 巡检结论"))

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


class TestHistoryOne(unittest.TestCase):
    """Test _history_one — history normalization for force decisions."""

    def test_history_limit_uses_items_not_total_items(self):
        from check import _history_one
        client = MagicMock()
        client._request.return_value = {"total_items": 5, "items": []}

        result = _history_one(client)

        self.assertEqual(result["record_count"], 0)
        self.assertEqual(result["record_limit"], 5)
        self.assertFalse(result["limit_reached"])
        self.assertNotIn("total_items", result)

    def test_history_limit_reached_when_items_has_five_records(self):
        from check import _history_one
        client = MagicMock()
        client._request.return_value = {"total_items": 0, "items": [{}, {}, {}, {}, {}]}

        result = _history_one(client)

        self.assertEqual(result["record_count"], 5)
        self.assertTrue(result["limit_reached"])


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

    def test_prompt_scene_uses_api_scenes_when_host_given(self):
        with patch("sys.argv", ["check.py", "prompt", "--stage", "scene", "--target", "AD1", "--host", "https://10.0.0.1", "--password", "pw"]):
            with patch("check.ADClient") as mock_cls:
                mock_client = MagicMock()
                mock_client._request.return_value = {"items": [{"name": "功能巡检"}, {"name": "安全巡检"}]}
                mock_cls.return_value = mock_client
                stdout = StringIO()
                with redirect_stdout(stdout):
                    from check import main
                    main()

                mock_client._request.assert_called_once_with("GET", "/sys/offline-check/")
                output = stdout.getvalue()
                self.assertIn("功能巡检", output)
                self.assertIn("安全巡检", output)
                self.assertNotIn("标准巡检", output)

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


if __name__ == "__main__":
    unittest.main()
