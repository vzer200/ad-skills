#!/usr/bin/env python3
"""Unit tests for blackbox.py — AD blackbox log analysis."""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-blackbox-analysis", "scripts"))

import json
import unittest
import tempfile
import os as _os
from unittest.mock import patch, MagicMock

from blackbox import BlackboxAnalyzer, _blackbox_progress, _blackbox_progress_one
from ad_api import ADError, ADAuthError, ADAPIError, ADConnectionError


class TestBlackboxAnalyzer(unittest.TestCase):
    """Test BlackboxAnalyzer without real ZIP files."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.extract_path = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def _create_audit_log(self, date="20260519", lines=None):
        audit_dir = _os.path.join(self.extract_path, "hislog", "hislog", f"{date}.audit", "zh_CN")
        _os.makedirs(audit_dir, exist_ok=True)
        if lines is None:
            lines = [
                '"2026-05-19 10:00:00","admin","10.0.0.1","POST","system","user","SUCCESS","/api/user","0","创建用户"',
                '"2026-05-19 10:30:00","admin","10.0.0.1","DELETE","system","user","FAILED","/api/user","1","权限不足"',
            ]
        with open(_os.path.join(audit_dir, "0.audit.csv"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

    def _create_system_log(self, date="20260519"):
        log_dir = _os.path.join(self.extract_path, "hislog", "log", date, "zh_CN", "0")
        _os.makedirs(log_dir, exist_ok=True)
        with open(_os.path.join(log_dir, f"kernel-{date}.csv"), "w", encoding="utf-8") as f:
            f.write("kernel log line 1\nkernel log line 2\n")

    def test_get_available_dates(self):
        self._create_audit_log("20260519")
        self._create_audit_log("20260518")
        analyzer = BlackboxAnalyzer(self.extract_path)
        dates = analyzer.get_available_dates()
        self.assertEqual(len(dates), 2)
        self.assertIn("20260519", dates)

    def test_get_available_dates_empty(self):
        analyzer = BlackboxAnalyzer(self.extract_path)
        dates = analyzer.get_available_dates()
        self.assertEqual(dates, [])

    def test_analyze_audit_logs_parse_correctly(self):
        self._create_audit_log("20260519")
        analyzer = BlackboxAnalyzer(self.extract_path)
        results = analyzer.analyze_audit_logs(["20260519"])
        self.assertIn("20260519", results)
        self.assertEqual(results["20260519"]["count"], 2)
        records = results["20260519"]["records"]
        self.assertEqual(records[0]["user"], "admin")
        self.assertEqual(records[1]["status"], "FAILED")

    def test_analyze_audit_logs_methods_count(self):
        self._create_audit_log("20260519")
        analyzer = BlackboxAnalyzer(self.extract_path)
        results = analyzer.analyze_audit_logs(["20260519"])
        methods = results["20260519"]["methods"]
        self.assertEqual(methods["POST"], 1)

    def test_analyze_system_logs(self):
        self._create_system_log("20260519")
        analyzer = BlackboxAnalyzer(self.extract_path)
        results = analyzer.analyze_system_logs("20260519")
        self.assertIn("kernel", results)
        self.assertEqual(results["kernel"]["count"], 2)

    def test_analyze_system_logs_empty_dir(self):
        analyzer = BlackboxAnalyzer(self.extract_path)
        results = analyzer.analyze_system_logs("20260519")
        self.assertEqual(results, {})

    def test_count_field(self):
        analyzer = BlackboxAnalyzer(self.extract_path)
        records = [
            {"method": "POST", "user": "admin"},
            {"method": "POST", "user": "admin"},
            {"method": "GET", "user": "guest"},
        ]
        result = analyzer._count_field(records, "method")
        self.assertEqual(result["POST"], 2)
        self.assertEqual(result["GET"], 1)

    def test_generate_report_structure(self):
        results = {
            "20260519": {
                "count": 2,
                "records": [],
                "methods": {"POST": 2},
                "users": {"admin": 2},
                "statuses": {"SUCCESS": 2},
            }
        }
        analyzer = BlackboxAnalyzer(self.extract_path)
        report = analyzer.generate_report(results)
        self.assertIn("黑盒日志分析报告", report)
        self.assertIn("20260519", report)
        self.assertIn("2", report)


class TestBlackboxExitCodes(unittest.TestCase):
    """Test blackbox.py exit code mappings."""

    def test_missing_args_exit_4(self):
        with patch("sys.argv", ["blackbox.py"]):
            # --host is now optional; missing both --host and --hosts exits 4
            with self.assertRaises(SystemExit) as cm:
                from blackbox import main
                main()
            self.assertEqual(cm.exception.code, 4)


class TestBlackboxProgress(unittest.TestCase):
    """Test _blackbox_progress and _blackbox_progress_one."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.output_dir = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def _write_meta(self, event_id="evt-001"):
        meta = {
            "host": "https://10.0.0.1",
            "event_id": event_id,
            "from_date": "2026-05-01",
            "to_date": "2026-05-03",
            "archive_password": "root1234+",
            "output_dir": self.output_dir,
        }
        meta_path = os.path.join(self.output_dir, "_export_meta.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    def test_progress_not_found_when_event_not_in_list(self):
        """Returns NOT_FOUND when event_id is not in get_last_event items."""
        self._write_meta("evt-001")
        mock_client = MagicMock()
        mock_client.host = "https://10.0.0.1"
        mock_client.get_last_event.return_value = {
            "items": [{"event_id": "evt-other", "state": "SUCCESS"}]
        }
        result = _blackbox_progress(mock_client, self.output_dir)
        self.assertEqual(result["status"], "NOT_FOUND")

    def test_progress_running_state(self):
        """Returns RUNNING when event is found but not in terminal state."""
        self._write_meta("evt-001")
        mock_client = MagicMock()
        mock_client.host = "https://10.0.0.1"
        mock_client.get_last_event.return_value = {
            "items": [{"event_id": "evt-001", "state": "PROCESSING"}]
        }
        result = _blackbox_progress(mock_client, self.output_dir)
        self.assertEqual(result["status"], "RUNNING")
        self.assertEqual(result["state"], "PROCESSING")
        self.assertEqual(result["event_id"], "evt-001")

    def test_progress_success_state(self):
        """Returns SUCCESS with file_size_mb when event is complete."""
        self._write_meta("evt-001")
        mock_client = MagicMock()
        mock_client.host = "https://10.0.0.1"
        mock_client.get_last_event.return_value = {
            "items": [{
                "event_id": "evt-001",
                "state": "SUCCESS",
                "data": {"file_token": "tok-123", "file_size": 1048576},
            }]
        }
        result = _blackbox_progress(mock_client, self.output_dir)
        self.assertEqual(result["status"], "SUCCESS")
        self.assertEqual(result["file_size_mb"], 1.0)

    def test_progress_failed_state(self):
        """Returns FAILED with error when task failed."""
        self._write_meta("evt-001")
        mock_client = MagicMock()
        mock_client.host = "https://10.0.0.1"
        mock_client.get_last_event.return_value = {
            "items": [{"event_id": "evt-001", "state": "FAILED"}]
        }
        result = _blackbox_progress(mock_client, self.output_dir)
        self.assertEqual(result["status"], "FAILED")
        self.assertIn("event_id=evt-001", result["error"])

    def test_progress_missing_meta_file(self):
        """Returns error when _export_meta.json does not exist."""
        mock_client = MagicMock()
        result = _blackbox_progress(mock_client, self.output_dir)
        self.assertIn("error", result)

    def test_progress_corrupt_meta_file(self):
        """Returns error when _export_meta.json is corrupt (not valid JSON)."""
        meta_path = os.path.join(self.output_dir, "_export_meta.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            f.write("NOT JSON {{{")
        mock_client = MagicMock()
        result = _blackbox_progress(mock_client, self.output_dir)
        self.assertIn("error", result)

    def test_progress_one_derives_output_dir(self):
        """_blackbox_progress_one derives per-device output_dir from base + host_slug."""
        self._write_meta("evt-001")
        # Create a subdir matching host_slug of the mock client
        slug_dir = os.path.join(self.output_dir, "https___10.0.0.2")
        os.makedirs(slug_dir, exist_ok=True)
        meta_path = os.path.join(slug_dir, "_export_meta.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({
                "host": "https://10.0.0.2",
                "event_id": "evt-002",
                "from_date": "2026-05-01",
                "to_date": "2026-05-03",
                "archive_password": "root1234+",
                "output_dir": slug_dir,
            }, f, ensure_ascii=False, indent=2)

        mock_client = MagicMock()
        mock_client.host = "https://10.0.0.2"
        mock_client.get_last_event.return_value = {
            "items": [{"event_id": "evt-002", "state": "RUNNING"}]
        }
        result = _blackbox_progress_one(mock_client, output_dir=self.output_dir)
        self.assertEqual(result["status"], "RUNNING")


if __name__ == "__main__":
    unittest.main()
