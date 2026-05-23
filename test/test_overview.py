"""Tests for overview.py — AD device overview snapshot script."""

import sys
import os
import json
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))

from overview import (
    build_overview,
    render_markdown,
    calc_days_left,
    cert_level,
    cert_level_cn,
    hardware_component_level,
    fan_level,
    power_level,
    interface_level,
    main,
)


class TestOverviewAPI(unittest.TestCase):
    """Test the core overview functions."""

    def setUp(self):
        """Set up a mock ADClient with realistic return values for all APIs."""
        self.client = MagicMock()
        self.client.host = "https://10.0.0.1"
        self.client.device_name = "AD1"

        # -- Virtual Services -------------------------------------------------
        self.client.get_virtual_services.return_value = {
            "items": [
                {
                    "name": "vs_web",
                    "state": "enable",
                    "vips": ["10.0.0.1"],
                    "vports": ["80"],
                    "pool_name": "pool_web",
                },
                {
                    "name": "vs_api",
                    "state": "enable",
                    "vips": ["10.0.0.2"],
                    "vports": ["443"],
                    "pool_name": "pool_api",
                },
            ]
        }

        # -- Pools & Nodes ----------------------------------------------------
        self.client.get_pools.return_value = {
            "items": [
                {
                    "name": "pool_web",
                    "state": "enable",
                    "members": [
                        {"name": "web1", "ip": "192.168.1.1", "port": 80, "state": "up", "weight": 1},
                        {"name": "web2", "ip": "192.168.1.2", "port": 80, "state": "down", "weight": 1},
                    ],
                },
                {
                    "name": "pool_api",
                    "state": "enable",
                    "members": [
                        {"name": "api1", "ip": "192.168.2.1", "port": 443, "state": "up", "weight": 1},
                    ],
                },
            ]
        }

        # -- SSL Certificates -------------------------------------------------
        self.client.get_ssl_certificates.return_value = {
            "items": [
                {
                    "name": "cert_web",
                    "validity_not_after": "2099/12/31 23:59:59",
                    "issuer": "CA",
                    "subject": "*.example.com",
                },
            ]
        }

        # -- HA Status --------------------------------------------------------
        self.client.get_ha_status.return_value = {
            "role": "master",
            "status": "normal",
        }

        # -- System / Hardware ------------------------------------------------
        self.client.get_sys_system.return_value = {
            "cpu_usage": 7.0,
            "memory_usage": 37.0,
            "temperature": 45,
            "fan": [{"name": "fan1", "status": "normal"}],
            "power_supply": [{"name": "psu1", "status": "normal"}],
            "interface": {"plug": {"in": ["eth0"], "out": []}},
        }

        # -- VS Traffic Stats -------------------------------------------------
        self.client.get_vs_stat.return_value = {
            "items": [
                {
                    "name": "vs_web",
                    "connection": 100,
                    "connection_rate": 10,
                    "throughput": 500,
                },
                {
                    "name": "vs_api",
                    "connection": 50,
                    "connection_rate": 5,
                    "throughput": 200,
                },
            ]
        }

    # ------------------------------------------------------------------
    # Test 1: All 6 APIs merged correctly
    # ------------------------------------------------------------------
    def test_build_overview_merges_all_sources(self):
        """build_overview('all') must call every API and merge data."""
        overview = build_overview(self.client, "all")

        self.client.get_virtual_services.assert_called_once()
        self.client.get_pools.assert_called_once()
        self.client.get_ssl_certificates.assert_called_once()
        self.client.get_ha_status.assert_called_once()
        self.client.get_sys_system.assert_called_once()
        self.client.get_vs_stat.assert_called_once()

        # Device section
        self.assertIn("device", overview)
        self.assertEqual(overview["device"]["host"], "https://10.0.0.1")
        self.assertEqual(overview["device"]["ha_role"], "master")

        # Virtual services
        self.assertIn("virtual_services", overview)
        self.assertEqual(len(overview["virtual_services"]), 2)

        # Pools and traffic are separate from VS config
        self.assertIn("pools", overview)
        self.assertEqual(len(overview["pools"]), 2)
        self.assertIn("traffic", overview)
        self.assertEqual(len(overview["traffic"]), 2)
        self.assertNotIn("connections", overview["virtual_services"][0])
        self.assertNotIn("connection_rate", overview["virtual_services"][0])

        # Certificates
        self.assertIn("certificates", overview)
        self.assertEqual(len(overview["certificates"]), 1)

        # Hardware
        self.assertIn("hardware", overview)

        # Pool / node health merged into VS entries
        vs_web = next(v for v in overview["virtual_services"] if v["name"] == "vs_web")
        self.assertEqual(vs_web["pool"], "pool_web")

        vs_api = next(v for v in overview["virtual_services"] if v["name"] == "vs_api")
        self.assertEqual(vs_api["pool"], "pool_api")

    # ------------------------------------------------------------------
    # Test 2: days-left calculation
    # ------------------------------------------------------------------
    def test_cert_days_left_calculation(self):
        """calc_days_left must correctly compute the difference in days."""
        now = datetime(2025, 1, 1, 0, 0, 0)

        # 50 days in the future
        self.assertEqual(calc_days_left("2025/02/20 00:00:00", now=now), 50)

        # Same day (0 days)
        self.assertEqual(calc_days_left("2025/01/01 12:00:00", now=now), 0)

        # Past date (negative)
        self.assertEqual(calc_days_left("2024/12/15 00:00:00", now=now), -17)

    # ------------------------------------------------------------------
    # Test 3: ≤30 days → critical
    # ------------------------------------------------------------------
    def test_cert_level_boundary_critical(self):
        """30 days or fewer → 'critical' (严重)."""
        self.assertEqual(cert_level(30), "critical")
        self.assertEqual(cert_level(15), "critical")
        self.assertEqual(cert_level(1), "critical")
        self.assertEqual(cert_level(0), "critical")

        self.assertEqual(cert_level_cn(30), "严重")
        self.assertEqual(cert_level_cn(15), "严重")
        self.assertEqual(cert_level_cn(0), "严重")

    # ------------------------------------------------------------------
    # Test 4: ≤60 days → warning
    # ------------------------------------------------------------------
    def test_cert_level_boundary_warn(self):
        """Between 31 and 60 days inclusive → 'warning' (警告)."""
        self.assertEqual(cert_level(31), "warning")
        self.assertEqual(cert_level(45), "warning")
        self.assertEqual(cert_level(60), "warning")

        self.assertEqual(cert_level_cn(31), "警告")
        self.assertEqual(cert_level_cn(60), "警告")

    # ------------------------------------------------------------------
    # Test 5: ≤90 days → info
    # ------------------------------------------------------------------
    def test_cert_level_boundary_info(self):
        """Between 61 and 90 days inclusive → 'info' (提示)."""
        self.assertEqual(cert_level(61), "info")
        self.assertEqual(cert_level(75), "info")
        self.assertEqual(cert_level(90), "info")

        self.assertEqual(cert_level_cn(61), "提示")
        self.assertEqual(cert_level_cn(90), "提示")

    # ------------------------------------------------------------------
    # Test 6: Exact boundary values
    # ------------------------------------------------------------------
    def test_cert_level_exact_30_60_90_boundaries(self):
        """Verify the exact boundary values for every tier."""
        self.assertEqual(cert_level(30), "critical")    # ≤30 → critical
        self.assertEqual(cert_level(31), "warning")     # 31 → warning
        self.assertEqual(cert_level(60), "warning")     # ≤60 → warning
        self.assertEqual(cert_level(61), "info")        # 61 → info
        self.assertEqual(cert_level(90), "info")        # ≤90 → info
        self.assertEqual(cert_level(91), "ok")          # 91 → ok

    # ------------------------------------------------------------------
    # Test 7: Hardware CPU warning at 80%
    # ------------------------------------------------------------------
    def test_hardware_cpu_warn_at_80(self):
        """CPU / Memory ≥ 80% → 'warning' (警告)."""
        self.assertEqual(hardware_component_level(80, 80, 90), "warning")
        self.assertEqual(hardware_component_level(85, 80, 90), "warning")
        self.assertEqual(hardware_component_level(79, 80, 90), "ok")

    # ------------------------------------------------------------------
    # Test 8: Hardware CPU critical at 90%
    # ------------------------------------------------------------------
    def test_hardware_cpu_critical_at_90(self):
        """CPU / Memory ≥ 90% → 'critical' (严重)."""
        self.assertEqual(hardware_component_level(90, 80, 90), "critical")
        self.assertEqual(hardware_component_level(95, 80, 90), "critical")
        self.assertEqual(hardware_component_level(89, 80, 90), "warning")

    # ------------------------------------------------------------------
    # Test 9: Markdown contains highlighted rows (anomalies)
    # ------------------------------------------------------------------
    def test_render_markdown_contains_highlighted_rows(self):
        """Markdown output must include expected sections and data."""
        overview = build_overview(self.client, "all")
        md = render_markdown(overview)

        # Section headers
        self.assertIn("查询结论", md)
        self.assertIn("查询范围", md)
        self.assertIn("查询结果", md)
        self.assertIn("目标设备：AD1（10.0.0.1）", md)
        self.assertNotIn("覆盖说明", md)
        self.assertIn("设备状态", md)
        self.assertIn("虚拟服务配置", md)
        self.assertIn("节点池配置", md)
        self.assertIn("流量状态", md)
        self.assertIn("SSL 证书", md)
        self.assertIn("硬件状态", md)
        self.assertNotIn("AD Device Overview", md)
        self.assertNotIn("Device Info", md)
        self.assertNotIn("Virtual Services", md)
        self.assertNotIn("SSL Certificates", md)
        self.assertNotIn("Hardware Status", md)
        self.assertNotIn("Connections", md)
        self.assertNotIn("Rate", md)

        # Data from mocks
        self.assertIn("vs_web", md)
        self.assertIn("cert_web", md)
        self.assertIn("主用", md)
        self.assertIn("7.0%", md)
        self.assertIn("37.0%", md)

        # Near-expiry certificate → severe highlighting
        near_expiry = (datetime.now() + timedelta(days=15)).strftime("%Y/%m/%d %H:%M:%S")
        self.client.get_ssl_certificates.return_value = {
            "items": [
                {
                    "name": "cert_expiring",
                    "validity_not_after": near_expiry,
                    "issuer": "CA",
                    "subject": "x",
                }
            ]
        }
        overview2 = build_overview(self.client, "all")
        md2 = render_markdown(overview2)
        self.assertIn("cert_expiring", md2)

        # Critical certificates should show "严重" in the status column
        self.assertIn("严重", md2)

    # ------------------------------------------------------------------
    # Test 10: JSON schema
    # ------------------------------------------------------------------
    def test_render_json_matches_schema(self):
        """JSON-serialised output must match the expected schema."""
        overview = build_overview(self.client, "all")
        json_str = json.dumps(overview, indent=2, ensure_ascii=False)
        data = json.loads(json_str)

        # Top-level keys
        self.assertIn("device", data)
        self.assertIn("virtual_services", data)
        self.assertIn("pools", data)
        self.assertIn("certificates", data)
        self.assertIn("hardware", data)
        self.assertIn("traffic", data)

        # Device keys
        self.assertIn("host", data["device"])
        self.assertIn("ha_role", data["device"])

        # Virtual services — list
        self.assertIsInstance(data["virtual_services"], list)
        vs_list = data["virtual_services"]
        if vs_list:
            vs = vs_list[0]
            self.assertIn("name", vs)
            self.assertIn("pool", vs)

        # Certificates — list with days_left & level
        self.assertIsInstance(data["certificates"], list)
        cert_list = data["certificates"]
        if cert_list:
            c = cert_list[0]
            self.assertIn("name", c)
            self.assertIn("days_left", c)
            self.assertIn("level", c)
            self.assertIsInstance(c["days_left"], int)

        # Hardware — cpu, memory, fans
        self.assertIn("cpu", data["hardware"])
        self.assertIn("memory", data["hardware"])

    # ------------------------------------------------------------------
    # Test 11: Single API failure does not block others
    # ------------------------------------------------------------------
    def test_single_api_failure_does_not_block_others(self):
        """One API failure must not crash the whole overview."""
        self.client.get_pools.side_effect = Exception("池获取失败")

        overview = build_overview(self.client, "all")

        # Other sections unaffected
        self.assertEqual(len(overview["virtual_services"]), 2)
        self.assertEqual(len(overview["certificates"]), 1)

        # Error recorded
        self.assertIn("api_errors", overview)
        self.assertIsNotNone(overview["api_errors"].get("pool"))

        # Markdown should still render without raising
        md = render_markdown(overview)
        self.assertIn("vs_web", md)

    # ------------------------------------------------------------------
    # Test 12: Auth failure → exit code 2
    # ------------------------------------------------------------------
    def test_auth_failure_exit_code(self):
        """All APIs failing with auth error → sys.exit(2)."""
        auth_err = Exception("HTTP 401: 认证失败")
        self.client.get_virtual_services.side_effect = auth_err
        self.client.get_pools.side_effect = auth_err
        self.client.get_ssl_certificates.side_effect = auth_err
        self.client.get_ha_status.side_effect = auth_err
        self.client.get_sys_system.side_effect = auth_err
        self.client.get_vs_stat.side_effect = auth_err

        with patch("sys.argv", [
            "overview.py", "all", "--host", "https://10.0.0.1", "--password", "wrong",
        ]):
            with patch("overview.ADClient", return_value=self.client):
                with self.assertRaises(SystemExit) as cm:
                    main()
                self.assertEqual(cm.exception.code, 2)

    # ------------------------------------------------------------------
    # Test 13: Empty VS and cert lists
    # ------------------------------------------------------------------
    def test_empty_vs_and_certs(self):
        """Zero VS or zero certs must not crash anything."""
        self.client.get_virtual_services.return_value = {"items": []}
        self.client.get_ssl_certificates.return_value = {"items": []}

        overview = build_overview(self.client, "all")

        self.assertEqual(len(overview["virtual_services"]), 0)
        self.assertEqual(len(overview["certificates"]), 0)

        # Markdown must render without errors
        md = render_markdown(overview)
        self.assertIn("虚拟服务配置", md)
        self.assertIn("SSL 证书", md)

    # ------------------------------------------------------------------
    # Test 14: Multi-VIP / multi-Port Cartesian expansion
    # ------------------------------------------------------------------
    def test_multi_vip_vs_cartesian_expansion(self):
        """Multiple VIPs × multiple ports → correct Cartesian product."""
        self.client.get_virtual_services.return_value = {
            "items": [
                {
                    "name": "vs_multi",
                    "state": "enable",
                    "vips": ["10.0.0.1", "10.0.0.2"],
                    "vports": ["80", "443"],
                    "pool_name": "pool_web",
                },
            ]
        }
        self.client.get_pools.return_value = {"items": []}
        self.client.get_ssl_certificates.return_value = {"items": []}
        self.client.get_vs_stat.return_value = {"items": []}

        overview = build_overview(self.client, "vs")

        self.assertEqual(len(overview["virtual_services"]), 1)
        vs = overview["virtual_services"][0]
        self.assertEqual(vs["name"], "vs_multi")
        self.assertIn("vip_ports", vs)
        self.assertEqual(len(vs["vip_ports"]), 4)
        self.assertIn("10.0.0.1:80", vs["vip_ports"])
        self.assertIn("10.0.0.1:443", vs["vip_ports"])
        self.assertIn("10.0.0.2:80", vs["vip_ports"])
        self.assertIn("10.0.0.2:443", vs["vip_ports"])
        self.client.get_vs_stat.assert_not_called()

    def test_vs_query_does_not_request_or_render_traffic(self):
        """VS config queries must not include traffic/status fields."""
        overview = build_overview(self.client, "vs")
        md = render_markdown(overview)

        self.client.get_virtual_services.assert_called_once()
        self.client.get_vs_stat.assert_not_called()
        self.assertEqual(overview["traffic"], [])
        self.assertNotIn("connections", overview["virtual_services"][0])
        self.assertNotIn("connection_rate", overview["virtual_services"][0])
        self.assertIn("虚拟服务配置", md)
        self.assertNotIn("流量状态", md)
        self.assertNotIn("当前连接数", md)
        self.assertNotIn("新建速率", md)
        self.assertNotIn("Connections", md)
        self.assertNotIn("Rate", md)

    def test_traffic_query_renders_traffic_only(self):
        """Traffic queries render status metrics without VS config tables."""
        overview = build_overview(self.client, "traffic")
        md = render_markdown(overview)

        self.client.get_vs_stat.assert_called_once()
        self.client.get_virtual_services.assert_not_called()
        self.assertEqual(len(overview["traffic"]), 2)
        self.assertIn("流量状态", md)
        self.assertIn("当前连接数", md)
        self.assertNotIn("虚拟服务配置", md)

    def test_config_query_renders_configuration_only(self):
        """Default/config queries must not include status or traffic sections."""
        overview = build_overview(self.client, "config")
        md = render_markdown(overview)

        self.client.get_virtual_services.assert_called_once()
        self.client.get_pools.assert_called_once()
        self.client.get_ssl_certificates.assert_called_once()
        self.client.get_ha_status.assert_not_called()
        self.client.get_sys_system.assert_not_called()
        self.client.get_vs_stat.assert_not_called()
        self.assertIn("虚拟服务配置", md)
        self.assertIn("节点池配置", md)
        self.assertIn("SSL 证书", md)
        self.assertNotIn("设备状态", md)
        self.assertNotIn("硬件状态", md)
        self.assertNotIn("流量状态", md)
        self.assertNotIn("当前连接数", md)
        self.assertNotIn("CPU 使用率", md)

    def test_missing_hardware_does_not_render_fake_zero_usage(self):
        """Missing status fields must not be shown as zero usage."""
        self.client.get_sys_system.side_effect = Exception("hardware unavailable")

        overview = build_overview(self.client, "all")
        md = render_markdown(overview)

        self.assertNotIn("CPU 使用率：0%", md)
        self.assertNotIn("内存使用率：0%", md)

    def test_partial_hardware_payload_does_not_render_fake_zero_usage(self):
        """Missing CPU/memory fields in a partial payload must stay unknown."""
        self.client.get_sys_system.return_value = {
            "power_supply": [{"name": "psu1", "status": "normal"}],
            "interface": {"plug": {"in": ["eth0"], "out": []}},
        }

        overview = build_overview(self.client, "hardware")
        md = render_markdown(overview)

        self.assertNotIn("CPU 使用率：0%", md)
        self.assertNotIn("内存使用率：0%", md)
        self.assertNotIn("| CPU 使用率 | 0% |", md)
        self.assertNotIn("| 内存使用率 | 0% |", md)
        self.assertIn("电源：psu1", md)

    # ------------------------------------------------------------------
    # Test 15: Parameter error → exit code 4
    # ------------------------------------------------------------------
    def test_param_error_exit_4(self):
        """Missing host must cause sys.exit(4)."""
        with patch("sys.argv", ["overview.py", "all"]):
            with patch.dict(os.environ, {"AD_PASS": "", "AD_HOST": ""}):
                with self.assertRaises(SystemExit) as cm:
                    main()
                self.assertEqual(cm.exception.code, 4)

    # ------------------------------------------------------------------
    # Test 16: Full success → exit code 0
    # ------------------------------------------------------------------
    def test_full_success_exit_0(self):
        """All APIs succeeding must cause sys.exit(0)."""
        with patch("sys.argv", [
            "overview.py", "all", "--host", "https://10.0.0.1", "--password", "test123",
        ]):
            with patch("overview.ADClient", return_value=self.client):
                with self.assertRaises(SystemExit) as cm:
                    main()
                self.assertEqual(cm.exception.code, 0)

    # ------------------------------------------------------------------
    # Test 17: All API failure → exit code 1
    # ------------------------------------------------------------------
    def test_all_api_failure_exit_1(self):
        """All APIs failing must cause sys.exit(1)."""
        conn_err = Exception("连接失败: timeout")
        self.client.get_virtual_services.side_effect = conn_err
        self.client.get_pools.side_effect = conn_err
        self.client.get_ssl_certificates.side_effect = conn_err
        self.client.get_ha_status.side_effect = conn_err
        self.client.get_sys_system.side_effect = conn_err
        self.client.get_vs_stat.side_effect = conn_err

        with patch("sys.argv", [
            "overview.py", "all", "--host", "https://10.0.0.1", "--password", "test123",
        ]):
            with patch("overview.ADClient", return_value=self.client):
                with self.assertRaises(SystemExit) as cm:
                    main()
                self.assertEqual(cm.exception.code, 1)

    # ------------------------------------------------------------------
    # Helper tests for fan / power / interface level functions
    # ------------------------------------------------------------------
    def test_fan_level_normal(self):
        """Fan status 'normal' → 'ok'."""
        self.assertEqual(fan_level("normal"), "ok")

    def test_fan_level_warn(self):
        """Fan status abnormal (not 'normal'/'fail') → 'warning'."""
        self.assertEqual(fan_level("abnormal"), "warning")
        self.assertEqual(fan_level("unknown"), "warning")

    def test_fan_level_critical(self):
        """Fan status 'fail' → 'critical'."""
        self.assertEqual(fan_level("fail"), "critical")

    def test_power_level_unsupported(self):
        """Power status 'UNSUPPORTED' → 'warning'."""
        self.assertEqual(power_level("UNSUPPORTED"), "warning")

    def test_power_level_abnormal(self):
        """Power status 'abnormal' → 'warning'."""
        self.assertEqual(power_level("abnormal"), "warning")

    def test_power_level_fail(self):
        """Power status 'fail' → 'critical'."""
        self.assertEqual(power_level("fail"), "critical")

    def test_power_level_normal(self):
        """Power status 'normal' → 'ok'."""
        self.assertEqual(power_level("normal"), "ok")

    def test_interface_level_out(self):
        """Interface status 'out' (unplugged) → 'warning'."""
        self.assertEqual(interface_level("out"), "warning")

    def test_interface_level_up(self):
        """Interface status 'up' → 'ok'."""
        self.assertEqual(interface_level("up"), "ok")

    def test_interface_level_down(self):
        """Interface status 'down' → 'warning'."""
        self.assertEqual(interface_level("down"), "warning")


if __name__ == "__main__":
    unittest.main()
