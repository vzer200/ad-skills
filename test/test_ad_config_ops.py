"""Tests for ad-config-ops bundle rendering and planning."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL_ROOT = ROOT / ".claude" / "skills" / "ad-config-ops"
SCRIPTS = SKILL_ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

from ad_ops_common import read_json, write_json  # noqa: E402
from dependency_order import load_resource_order  # noqa: E402
from plan_operations import build_bundle_plan  # noqa: E402
from render_slb_bundle import build_bundle, parse_args  # noqa: E402
from resolve_schema import definition_map  # noqa: E402


class TestRenderSlbBundle(unittest.TestCase):
    def build_plan(self, bundle: dict) -> dict:
        with tempfile.TemporaryDirectory() as tmp:
            bundle_path = Path(tmp) / "bundle.yml"
            write_json(bundle_path, bundle)
            index = read_json(SKILL_ROOT / "references" / "api-index.json")
            return build_bundle_plan(index, definition_map(index), bundle_path, load_resource_order(SKILL_ROOT))

    def test_xff_pool_and_vs_plan(self):
        args = parse_args(
            [
                "--vs-name",
                "wb_vs_xff_test_01",
                "--vip",
                "10.250.250.10",
                "--vport",
                "8080",
                "--pool",
                "wb_pool_xff_test_01",
                "--node",
                "192.0.2.10:80",
                "--node",
                "192.0.2.11:80",
                "--create-http-profile-xff",
                "wb_xff_profile_01",
            ]
        )
        bundle = build_bundle(args)
        plan = self.build_plan(bundle)
        self.assertEqual(
            [item["id"] for item in plan["operations"]],
            ["create-http-profile-xff", "create-pool", "create-virtual-service"],
        )
        vs_payload = plan["operations"][-1]["payload"]
        self.assertEqual(vs_payload["http_profile"], "wb_xff_profile_01")
        self.assertEqual(vs_payload["pool"], "wb_pool_xff_test_01")

    def test_http_pre_rule_plan(self):
        args = parse_args(
            [
                "--vs-name",
                "wb_vs_prerule_test_01",
                "--vip",
                "10.250.250.20",
                "--vport",
                "8081",
                "--pool",
                "wb_pool_prerule_test_01",
                "--node",
                "192.0.2.20:80",
                "--create-pre-rule-http",
                "wb_pre_rule_01",
                "--pre-rule-uri-pattern",
                "/api",
                "--pre-rule-uri-mode",
                "CONTAIN",
            ]
        )
        plan = self.build_plan(build_bundle(args))
        paths = [item["path"] for item in plan["operations"]]
        self.assertIn("/api/ad/v3/slb/pre-rule/http/", paths)
        vs_payload = plan["operations"][-1]["payload"]
        self.assertEqual(vs_payload["pre_rules"], ["wb_pre_rule_01"])

    def test_combined_xff_and_pre_rule_plan(self):
        args = parse_args(
            [
                "--vs-name",
                "wb_vs_combo_test_01",
                "--vip",
                "10.250.250.30",
                "--vport",
                "8082",
                "--pool",
                "wb_pool_combo_test_01",
                "--node",
                "192.0.2.30:80",
                "--create-http-profile-xff",
                "wb_xff_profile_02",
                "--create-pre-rule-http",
                "wb_pre_rule_02",
                "--pre-rule-uri-pattern",
                "/",
                "--pre-rule-uri-mode",
                "WILDCARD",
            ]
        )
        plan = self.build_plan(build_bundle(args))
        self.assertEqual(len(plan["operations"]), 4)
        vs_payload = plan["operations"][-1]["payload"]
        self.assertEqual(vs_payload["http_profile"], "wb_xff_profile_02")
        self.assertEqual(vs_payload["pre_rules"], ["wb_pre_rule_02"])

    def test_existing_references_do_not_create_dependencies(self):
        args = parse_args(
            [
                "--vs-name",
                "wb_vs_existing_refs_01",
                "--vip",
                "10.250.250.40",
                "--vport",
                "8083",
                "--pool",
                "existing_pool",
                "--http-profile",
                "existing_http_profile",
                "--pre-rule",
                "existing_pre_rule",
            ]
        )
        bundle = build_bundle(args)
        self.assertEqual([item["id"] for item in bundle["operations"]], ["create-virtual-service"])
        plan = self.build_plan(bundle)
        payload = plan["operations"][0]["payload"]
        self.assertEqual(payload["pool"], "existing_pool")
        self.assertEqual(payload["http_profile"], "existing_http_profile")
        self.assertEqual(payload["pre_rules"], ["existing_pre_rule"])


if __name__ == "__main__":
    unittest.main()
