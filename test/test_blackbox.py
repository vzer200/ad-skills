#!/usr/bin/env python3
"""Unit tests for blackbox.py — AD blackbox log analysis."""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-blackbox-analysis", "scripts"))

import unittest
import tempfile
import os as _os
from unittest.mock import patch, MagicMock

from blackbox import BlackboxAnalyzer, generate_report
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
        report = generate_report(results)
        self.assertIn("黑盒日志分析报告", report)
        self.assertIn("20260519", report)
        self.assertIn("2", report)


class TestBlackboxExitCodes(unittest.TestCase):
    """Test blackbox.py exit code mappings."""

    def test_missing_args_exit_4(self):
        with patch("sys.argv", ["blackbox.py"]):
            with self.assertRaises(SystemExit) as cm:
                from blackbox import main
                main()
            self.assertEqual(cm.exception.code, 4)


if __name__ == "__main__":
    unittest.main()
