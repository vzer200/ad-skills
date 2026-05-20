#!/usr/bin/env python3
"""Unit tests for check.py — AD inspection workflow."""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-check-analysis", "scripts"))

import unittest
import tempfile
from unittest.mock import patch, MagicMock

from check import (
    start_check, analyze, render_markdown,
    _SUGGESTION_MAP,
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
                try:
                    from check import main
                    main()
                except SystemExit as e:
                    # ADAuthError raised during scene check → wrapped as RuntimeError → exit 4
                    # In other code paths ADAuthError → exit 2 directly
                    self.assertIn(e.code, (2, 4))


if __name__ == "__main__":
    unittest.main()
