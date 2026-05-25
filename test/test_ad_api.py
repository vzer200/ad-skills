#!/usr/bin/env python3
"""Unit tests for ad_api.py — shared ADClient."""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))

import unittest
import json
import urllib.request
import urllib.error
import urllib.parse
from unittest.mock import patch, MagicMock
from io import BytesIO

from ad_api import (
    ADClient, ADError, ADConnectionError, ADAuthError, ADAPIError
)


class _FakeResponse:
    """Simulates urllib response for testing."""
    def __init__(self, body=None, status=200):
        if body is None:
            body = {"status": "ok"}
        self._bytes = json.dumps(body).encode("utf-8") if not isinstance(body, bytes) else body
        self.status = status

    def read(self):
        return self._bytes

    def __enter__(self):
        return self

    def __exit__(self, *a):
        pass


class TestADClientHTTP(unittest.TestCase):
    """Test ADClient._request at the urlopen layer."""

    def setUp(self):
        self.client = ADClient(host="https://10.0.0.1", username="admin", password="test123")

    @patch("urllib.request.urlopen")
    def test_get_users_correct_url(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse()
        self.client.get_users()
        req = mock_urlopen.call_args[0][0]
        self.assertIn("/api/lb/current-version/sys/user/", req.full_url)

    @patch("urllib.request.urlopen")
    def test_auth_header_present(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse()
        self.client.get_users()
        req = mock_urlopen.call_args[0][0]
        auth = req.get_header("Authorization")
        self.assertIsNotNone(auth)
        self.assertTrue(auth.startswith("Basic "))

    @patch("urllib.request.urlopen")
    def test_get_ssl_certificates(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse({"items": [{"name": "cert1"}]})
        result = self.client.get_ssl_certificates()
        self.assertEqual(result["items"][0]["name"], "cert1")

    @patch("urllib.request.urlopen")
    def test_get_sys_system(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse({"cpu_usage": 50.0})
        result = self.client.get_sys_system()
        self.assertEqual(result["cpu_usage"], 50.0)

    @patch("urllib.request.urlopen")
    def test_get_last_event(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse({"items": [{"event_id": "ev1"}]})
        result = self.client.get_last_event()
        req = mock_urlopen.call_args[0][0]
        self.assertIn("/last-event", req.full_url)

    @patch("urllib.request.urlopen")
    def test_create_user_post_body(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse()
        self.client.create_user({"name": "testuser", "password": "pwd"})
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.method, "POST")
        body = json.loads(req.data.decode())
        self.assertEqual(body["name"], "testuser")

    @patch("urllib.request.urlopen")
    def test_delete_user_method(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse()
        self.client.delete_user("testuser")
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.method, "DELETE")
        self.assertIn("/sys/user/testuser", req.full_url)

    @patch("urllib.request.urlopen")
    def test_params_appended_to_url(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse()
        self.client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
        req = mock_urlopen.call_args[0][0]
        self.assertIn("type=history", req.full_url)

    @patch("urllib.request.urlopen")
    def test_list_params_use_repeated_query_keys(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse()
        self.client._request("GET", "/log/service-log", params={"level": ["ALERT", "ERROR"]})
        req = mock_urlopen.call_args[0][0]
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(req.full_url).query)
        self.assertEqual(parsed["level"], ["ALERT", "ERROR"])

    @patch("urllib.request.urlopen")
    def test_params_merged_with_existing_query(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse()
        self.client._request("GET", "/endpoint?existing=1", params={"new": "2"})
        req = mock_urlopen.call_args[0][0]
        self.assertIn("existing=1", req.full_url)
        self.assertIn("new=2", req.full_url)

    @patch("urllib.request.urlopen")
    def test_http_401_raises_auth_error(self, mock_urlopen):
        error_response = BytesIO(b'{"error": "unauthorized"}')
        mock_urlopen.side_effect = urllib.error.HTTPError(
            "https://10.0.0.1/", 401, "Unauthorized", {}, error_response
        )
        with self.assertRaises(ADAuthError) as cm:
            self.client.get_users()
        self.assertEqual(cm.exception.http_code, 401)

    @patch("urllib.request.urlopen")
    def test_http_500_raises_api_error(self, mock_urlopen):
        error_response = BytesIO(b'{"error": "internal"}')
        mock_urlopen.side_effect = urllib.error.HTTPError(
            "https://10.0.0.1/", 500, "Internal Error", {}, error_response
        )
        with self.assertRaises(ADAPIError) as cm:
            self.client.get_users()
        self.assertEqual(cm.exception.http_code, 500)

    @patch("urllib.request.urlopen")
    def test_connection_error(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.URLError("timeout")
        with self.assertRaises(ADConnectionError):
            self.client.get_users()

    @patch("urllib.request.urlopen")
    def test_raw_request_returns_bytes(self, mock_urlopen):
        resp = MagicMock()
        resp.read.return_value = b"file content"
        cm = MagicMock()
        cm.__enter__.return_value = resp
        cm.__exit__.return_value = None
        mock_urlopen.return_value = cm
        result = self.client._raw_request("/cgi/file-resource?d=token123")
        self.assertEqual(result, b"file content")

    def test_raw_request_rejects_path_traversal(self):
        with self.assertRaises(ValueError):
            self.client._raw_request("/cgi/../../../etc/passwd")

    def test_raw_request_rejects_non_cgi_path(self):
        with self.assertRaises(ValueError):
            self.client._raw_request("/etc/hosts")

    def test_ad_error_original_chaining(self):
        orig = Exception("root cause")
        err = ADConnectionError("connection failed", original=orig)
        self.assertEqual(err.original, orig)
        self.assertIn("connection failed", str(err))

    @patch("urllib.request.urlopen")
    def test_get_service_log_filters_and_sorts_latest(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse({
            "items": [
                {"date": "2026-05-20", "time": "10:00:00", "level": "ALERT"},
                {"date": "2026-05-21", "time": "09:00:00", "level": "ERROR"},
            ],
            "total": 2,
        })
        result = self.client.get_service_log(
            limit=20,
            from_time="2026-05-20 00:00:00",
            to_time="2026-05-21 23:59:59",
            levels=["ALERT"],
        )
        req = mock_urlopen.call_args[0][0]
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(req.full_url).query)
        self.assertEqual(parsed["top"], ["20"])
        self.assertEqual(parsed["from"], ["2026-05-20 00:00:00"])
        self.assertEqual(parsed["to"], ["2026-05-21 23:59:59"])
        self.assertEqual(parsed["level"], ["ALERT"])
        self.assertEqual(result["items"][0]["date"], "2026-05-21")

    def test_get_service_log_queries_each_level_separately(self):
        self.client._request = MagicMock(side_effect=[
            {"items": [{"date": "2026-05-20", "time": "10:00:00", "level": "ALERT", "log_id": "a"}]},
            {"items": [{"date": "2026-05-21", "time": "09:00:00", "level": "ERROR", "log_id": "b"}]},
        ])

        result = self.client.get_service_log(limit=20, levels=["ALERT", "ERROR"])

        calls = self.client._request.call_args_list
        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[0].kwargs["params"]["level"], "ALERT")
        self.assertEqual(calls[1].kwargs["params"]["level"], "ERROR")
        self.assertEqual([item["log_id"] for item in result["items"]], ["b", "a"])

    @patch("urllib.request.urlopen")
    def test_vs_trend_includes_explicit_time_range(self, mock_urlopen):
        mock_urlopen.return_value = _FakeResponse({"items": []})
        self.client.get_vs_trend_by_name(
            "vs_test",
            trend="last-hour",
            from_time="2026-05-20 00:00:00",
            to_time="2026-05-20 01:00:00",
        )
        req = mock_urlopen.call_args[0][0]
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(req.full_url).query)
        self.assertEqual(parsed["trend"], ["last-hour"])
        self.assertEqual(parsed["from"], ["2026-05-20 00:00:00"])
        self.assertEqual(parsed["to"], ["2026-05-20 01:00:00"])
        self.assertEqual(parsed["netns"], ["default"])


class TestADClientInstance(unittest.TestCase):
    """Test ADClient instance creation and configuration."""

    def test_host_trailing_slash_stripped(self):
        client = ADClient(host="https://10.0.0.1/")
        self.assertEqual(client.host, "https://10.0.0.1")

    def test_ssl_context_no_verify(self):
        client = ADClient(host="https://10.0.0.1")
        self.assertEqual(client.ssl_context.verify_mode, 0)
        self.assertFalse(client.ssl_context.check_hostname)


if __name__ == "__main__":
    unittest.main()
