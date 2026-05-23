#!/usr/bin/env python3
"""Unit tests for render.py — multi-device inspection report rendering."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-check-analysis", "scripts"))

import unittest

from render import (
    _extract_ip, _format_check_time, _score_icon, _check_icon,
    _device_summary_status, _render_device_detail_block,
    _render_cross_device_comparison, render_multi_device_report,
)


class TestExtractIp(unittest.TestCase):
    def test_standard_url(self):
        self.assertEqual(_extract_ip("https://192.168.8.30:443"), "192.168.8.30")

    def test_no_ip_returns_host(self):
        self.assertEqual(_extract_ip("https://myhost.local"), "https://myhost.local")

    def test_ip_only(self):
        self.assertEqual(_extract_ip("10.0.0.1"), "10.0.0.1")


class TestFormatCheckTime(unittest.TestCase):
    def test_full_timestamp(self):
        self.assertEqual(_format_check_time("20260520120000"), "2026-05-20 12:00:00")

    def test_short_string_returns_as_is(self):
        self.assertEqual(_format_check_time("2026"), "2026")

    def test_empty_string(self):
        self.assertEqual(_format_check_time(""), "")

    def test_exactly_14_chars(self):
        self.assertEqual(_format_check_time("20260520120000"), "2026-05-20 12:00:00")


class TestScoreIcon(unittest.TestCase):
    def test_score_thresholds(self):
        # >= 90: green circle
        self.assertIsInstance(_score_icon(90), str)
        self.assertTrue(len(_score_icon(90)) > 0)
        # >= 70: yellow circle
        self.assertIsInstance(_score_icon(70), str)
        self.assertTrue(len(_score_icon(70)) > 0)
        # < 70: red circle
        self.assertIsInstance(_score_icon(69), str)
        self.assertTrue(len(_score_icon(69)) > 0)
        # All three should be different
        icons = {_score_icon(100), _score_icon(80), _score_icon(50)}
        self.assertEqual(len(icons), 3, "Three score tiers should have different icons")


class TestCheckIcon(unittest.TestCase):
    def test_pass(self):
        self.assertIn("✅", _check_icon("pass"))

    def test_fail(self):
        self.assertIn("❌", _check_icon("fail"))

    def test_warn(self):
        self.assertIn("⚠", _check_icon("warn"))

    def test_unknown(self):
        self.assertEqual(_check_icon("unknown"), "unknown")


class TestDeviceSummaryStatus(unittest.TestCase):
    def test_error_with_auth(self):
        result = {"error": "ADAuthError: 认证失败"}
        self.assertIn("认证失败", _device_summary_status(result))

    def test_error_without_auth(self):
        result = {"error": "Connection refused"}
        self.assertIn("连接失败", _device_summary_status(result))

    def test_anomaly_found(self):
        result = {"analysis": {"summary": {"total": 3, "pass": 2, "fail": 1, "warn": 0, "score": 67}}}
        self.assertIn("异常", _device_summary_status(result))

    def test_all_pass(self):
        result = {"analysis": {"summary": {"total": 3, "pass": 3, "fail": 0, "warn": 0, "score": 100}}}
        self.assertIn("正常", _device_summary_status(result))


def _make_analysis(check_results=None, categories=None, suggestions=None, health_scores=None, summary=None):
    cr = check_results or {}
    cats = categories or {"feature": [], "health": [], "secure": []}
    if summary is None:
        p = sum(1 for k, v in cr.items() if v["status"] == "pass")
        f = sum(1 for k, v in cr.items() if v["status"] == "fail")
        w = sum(1 for k, v in cr.items() if v["status"] == "warn")
        t = p + f + w
        summary = {"total": t, "pass": p, "fail": f, "warn": w, "score": round((p + w * 0.5) / max(t, 1) * 100)}
    return {
        "device_info": {"version": "8.0", "app_version": "v1", "gateway_id": "gw1", "runtime": "100d", "ip": "192.168.8.30"},
        "check_results": cr,
        "categories": cats,
        "summary": summary,
        "health_scores": health_scores or {"feature": {"pass": 0, "total": 0, "score": 100}, "health": {"pass": 0, "total": 0, "score": 100}, "secure": {"pass": 0, "total": 0, "score": 100}, "overall": 100},
        "suggestions": suggestions or [],
    }


class TestRenderDeviceDetailBlock(unittest.TestCase):
    def test_full_result_with_anomalies(self):
        result = {
            "meta": {"host": "https://192.168.8.30", "scene": "标准巡检", "start_time": "20260520120000"},
            "analysis": _make_analysis(
                check_results={
                    "CPU_CHECK": {"status": "pass", "value": "17%"},
                    "DISK_CHECK": {"status": "warn", "value": "/ 82%", "detail": "磁盘偏高"},
                    "FAN_STATE_CHECK": {"status": "fail", "value": "-1"},
                },
                categories={"feature": ["CPU_CHECK"], "health": ["DISK_CHECK", "FAN_STATE_CHECK"], "secure": []},
                suggestions=[{"check": "DISK_CHECK", "priority": "中", "suggestion": "磁盘使用率偏高"}],
            ),
        }
        output = _render_device_detail_block("https://192.168.8.30", result, "AD1")
        self.assertIn("AD1", output)
        self.assertIn("192.168.8.30", output)
        self.assertIn("2026-05-20 12:00:00", output)
        self.assertIn("AD 版本", output)
        self.assertIn("DISK_CHECK", output)
        self.assertIn("FAN_STATE_CHECK", output)
        self.assertIn("统计汇总", output)

    def test_all_pass_no_anomalies(self):
        result = {
            "meta": {"host": "https://192.168.8.30", "start_time": ""},
            "analysis": _make_analysis(
                check_results={"CPU_CHECK": {"status": "pass", "value": "17%"}},
                categories={"feature": ["CPU_CHECK"], "health": [], "secure": []},
            ),
        }
        output = _render_device_detail_block("https://192.168.8.30", result, "AD1")
        self.assertIn("所有检查项通过", output)

    def test_no_analysis_data(self):
        result = {"meta": {}}
        output = _render_device_detail_block("https://192.168.8.30", result, "AD1")
        self.assertIn("无分析数据", output)


class TestRenderCrossDeviceComparison(unittest.TestCase):
    def setUp(self):
        self.device_names = {"https://dev1.com": "AD1", "https://dev2.com": "AD2"}

    def test_two_devices_with_differences(self):
        results = {
            "https://dev1.com": {
                "analysis": _make_analysis(
                    check_results={"CPU_CHECK": {"status": "pass", "value": "17%"}},
                    categories={"feature": ["CPU_CHECK"], "health": [], "secure": []},
                ),
            },
            "https://dev2.com": {
                "analysis": _make_analysis(
                    check_results={"CPU_CHECK": {"status": "fail", "value": "95%"}},
                    categories={"feature": ["CPU_CHECK"], "health": [], "secure": []},
                ),
            },
        }
        output = _render_cross_device_comparison(results, self.device_names)
        self.assertIn("跨设备对比", output)
        self.assertIn("CPU_CHECK", output)

    def test_all_pass_returns_empty(self):
        results = {
            "https://dev1.com": {"analysis": _make_analysis(
                check_results={"CPU_CHECK": {"status": "pass", "value": "17%"}},
                categories={"feature": ["CPU_CHECK"], "health": [], "secure": []},
            )},
            "https://dev2.com": {"analysis": _make_analysis(
                check_results={"CPU_CHECK": {"status": "pass", "value": "20%"}},
                categories={"feature": ["CPU_CHECK"], "health": [], "secure": []},
            )},
        }
        self.assertEqual(_render_cross_device_comparison(results, self.device_names), "")

    def test_single_device_returns_empty(self):
        results = {"https://dev1.com": {"analysis": _make_analysis()}}
        self.assertEqual(_render_cross_device_comparison(results, self.device_names), "")


class TestRenderMultiDeviceReport(unittest.TestCase):
    def test_all_success(self):
        results = {
            "https://dev1.com": {
                "meta": {"host": "https://dev1.com", "scene": "标准巡检", "start_time": "20260520120000"},
                "analysis": _make_analysis(
                    check_results={"CPU_CHECK": {"status": "pass", "value": "17%"}},
                    categories={"feature": ["CPU_CHECK"], "health": [], "secure": []},
                ),
            },
        }
        output = render_multi_device_report(results, scene="标准巡检", device_names={"https://dev1.com": "AD1"})
        self.assertIn("AD 巡检分析报告（多设备）", output)
        self.assertIn("AD1", output)
        self.assertIn("标准巡检", output)
        self.assertIn("设备汇总", output)

    def test_mixed_success_and_error(self):
        results = {
            "https://dev1.com": {
                "meta": {"host": "https://dev1.com", "start_time": ""},
                "analysis": _make_analysis(),
            },
            "https://dev2.com": {"error": "Connection refused"},
        }
        output = render_multi_device_report(results)
        self.assertIn("设备汇总", output)
        self.assertIn("2 台", output)

    def test_with_anomalies_includes_comparison(self):
        results = {
            "https://dev1.com": {
                "meta": {"host": "https://dev1.com", "start_time": "20260520120000"},
                "analysis": _make_analysis(
                    check_results={"CPU_CHECK": {"status": "pass", "value": "17%"}},
                    categories={"feature": ["CPU_CHECK"], "health": [], "secure": []},
                    summary={"total": 1, "pass": 1, "fail": 0, "warn": 0, "score": 100},
                ),
            },
            "https://dev2.com": {
                "meta": {"host": "https://dev2.com", "start_time": "20260520130000"},
                "analysis": _make_analysis(
                    check_results={"CPU_CHECK": {"status": "fail", "value": "95%"}},
                    categories={"feature": ["CPU_CHECK"], "health": [], "secure": []},
                    summary={"total": 1, "pass": 0, "fail": 1, "warn": 0, "score": 0},
                ),
            },
        }
        output = render_multi_device_report(results)
        self.assertIn("跨设备对比", output)

    def test_device_summary_uses_overall_health_score(self):
        results = {
            "https://dev1.com": {
                "meta": {"host": "https://dev1.com", "start_time": "20260520120000"},
                "analysis": _make_analysis(
                    check_results={
                        "A_CHECK": {"status": "pass", "value": "ok"},
                        "B_CHECK": {"status": "warn", "value": "warn"},
                    },
                    categories={"feature": ["A_CHECK"], "health": ["B_CHECK"], "secure": []},
                    summary={"total": 2, "pass": 1, "fail": 0, "warn": 1, "score": 76},
                    health_scores={
                        "feature": {"pass": 1, "total": 1, "score": 100},
                        "health": {"pass": 0, "total": 1, "score": 18},
                        "secure": {"pass": 0, "total": 0, "score": 0},
                        "overall": 59,
                    },
                ),
            },
        }
        output = render_multi_device_report(results, device_names={"https://dev1.com": "AD1"})
        self.assertIn("59/100", output)
        self.assertNotIn("76/100", output)


if __name__ == "__main__":
    unittest.main()
