#!/usr/bin/env python3
"""Unit tests for connect.py — AD device connectivity test."""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-connect", "scripts"))

import unittest
from unittest.mock import patch, MagicMock

from connect import (
    test_one_device, _test_one, _extract_ip, _render_table, main,
)
from ad_api import ADConnectionError, ADAuthError, ADAPIError


class TestTestOneDevice(unittest.TestCase):
    """Test test_one_device — connectivity and auth check."""

    @patch("connect.ADClient")
    def test_ok_status(self, mock_cls):
        mock_client = MagicMock()
        mock_client.get_users.return_value = {"items": []}
        mock_cls.return_value = mock_client
        result = test_one_device("https://10.0.0.1", "admin", "secret")
        self.assertEqual(result["status"], "ok")

    @patch("connect.ADClient")
    def test_auth_fail_status(self, mock_cls):
        mock_client = MagicMock()
        mock_client.get_users.side_effect = ADAuthError("HTTP 401", http_code=401)
        mock_cls.return_value = mock_client
        result = test_one_device("https://10.0.0.1", "admin", "wrong")
        self.assertEqual(result["status"], "auth_fail")
        self.assertIn("error", result)

    @patch("connect.ADClient")
    def test_connect_fail_status(self, mock_cls):
        mock_client = MagicMock()
        mock_client.get_users.side_effect = ADConnectionError("timeout")
        mock_cls.return_value = mock_client
        result = test_one_device("https://10.0.0.1", "admin", "p")
        self.assertEqual(result["status"], "connect_fail")

    @patch("connect.ADClient")
    def test_api_error_means_ok_with_warning(self, mock_cls):
        mock_client = MagicMock()
        mock_client.get_users.side_effect = ADAPIError("HTTP 500", http_code=500)
        mock_cls.return_value = mock_client
        result = test_one_device("https://10.0.0.1", "admin", "p")
        self.assertEqual(result["status"], "api_error")
        self.assertIn("warning", result)

    @patch("connect.ADClient")
    def test_generic_exception(self, mock_cls):
        mock_client = MagicMock()
        mock_client.get_users.side_effect = RuntimeError("unexpected")
        mock_cls.return_value = mock_client
        result = test_one_device("https://10.0.0.1", "admin", "p")
        self.assertEqual(result["status"], "error")
        self.assertIn("RuntimeError", result["error"])


class TestTestOne(unittest.TestCase):
    """Test _test_one — worker for run_multi."""

    @patch("connect.test_one_device")
    def test_delegates_to_test_one_device(self, mock_test):
        mock_test.return_value = {"host": "h", "status": "ok"}
        client = MagicMock()
        client.host = "https://10.0.0.1"
        client.username = "admin"
        client.password = "pw"
        result = _test_one(client)
        mock_test.assert_called_once_with("https://10.0.0.1", "admin", "pw")
        self.assertEqual(result["status"], "ok")


class TestExtractIp(unittest.TestCase):
    """Test _extract_ip helper."""

    def test_standard_url(self):
        self.assertEqual(_extract_ip("https://192.168.8.30:8443"), "192.168.8.30")

    def test_no_ip_returns_host(self):
        self.assertEqual(_extract_ip("https://mydevice.local"), "https://mydevice.local")

    def test_ip_only(self):
        self.assertEqual(_extract_ip("192.168.1.1"), "192.168.1.1")

    def test_ip_mid_string(self):
        self.assertEqual(_extract_ip("http://10.0.0.1/api"), "10.0.0.1")


class TestRenderTable(unittest.TestCase):
    """Test _render_table — summary table rendering."""

    def test_all_ok(self):
        results = {
            "https://a.com": {"host": "https://a.com", "status": "ok"},
            "https://b.com": {"host": "https://b.com", "status": "ok"},
        }
        output = _render_table(results)
        self.assertIn("2/2", output)

    def test_all_connect_fail(self):
        results = {"https://a.com": {"error": "timeout"}}
        output = _render_table(results)
        self.assertIn("0/1", output)

    def test_all_auth_fail(self):
        results = {"https://a.com": {"error": "Auth failed 401"}}
        output = _render_table(results)
        self.assertIn("0/1", output)

    def test_partial_failure(self):
        results = {
            "https://a.com": {"host": "https://a.com", "status": "ok"},
            "https://b.com": {"host": "https://b.com", "status": "connect_fail", "error": "timeout"},
        }
        output = _render_table(results)
        self.assertIn("1/2", output)



class TestMainCLI(unittest.TestCase):
    """Test main() CLI entry point."""

    def test_missing_host_exits_4(self):
        with patch("sys.argv", ["connect.py"]):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 4)

    @patch("connect.test_one_device")
    def test_single_device_ok(self, mock_test):
        mock_test.return_value = {"host": "https://10.0.0.1", "status": "ok"}
        with patch("sys.argv", ["connect.py", "--host", "https://10.0.0.1", "--password", "pw"]):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 0)

    @patch("connect.test_one_device")
    def test_single_device_auth_fail(self, mock_test):
        mock_test.return_value = {"host": "https://10.0.0.1", "status": "auth_fail", "error": "bad pw"}
        with patch("sys.argv", ["connect.py", "--host", "https://10.0.0.1", "--password", "pw"]):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 2)

    @patch("connect.run_multi")
    def test_multi_device_mode(self, mock_run):
        mock_run.return_value = {"https://a.com": {"status": "ok"}}
        with patch("sys.argv", ["connect.py", "--hosts", "https://a.com,https://b.com", "--password", "pw"]):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 0)

    def test_empty_device_list_exits_4(self):
        with patch("sys.argv", ["connect.py", "--hosts", "", "--devices", ""]):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 4)


if __name__ == "__main__":
    unittest.main()
