"""Tests for ad-config-ops bundle rendering and planning."""

from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
SKILL_ROOT = ROOT / ".claude" / "skills" / "ad-config-ops"
SCRIPTS = SKILL_ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

from ad_ops_common import read_json, write_json  # noqa: E402
from dependency_order import load_resource_order  # noqa: E402
from plan_operations import build_bundle_plan  # noqa: E402
from render_slb_bundle import build_bundle, parse_args  # noqa: E402
from render_outputs import render_script  # noqa: E402
from resolve_schema import definition_map  # noqa: E402
import verify_slb_resource  # noqa: E402


class FakeResponse:
    def __init__(self, status_code: int, payload: object | None = None, text: str = ""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    @property
    def ok(self) -> bool:
        return self.status_code < 400

    def json(self) -> object:
        if self._payload is None:
            raise ValueError("no json payload")
        return self._payload


class FakeSession:
    def __init__(self, responses: list[FakeResponse]):
        self.responses = list(responses)
        self.calls: list[dict[str, object]] = []
        self.verify = True
        self.auth: tuple[str, str] | None = None

    def get(self, url: str, **kwargs: object) -> FakeResponse:
        self.calls.append({"method": "GET", "url": url, **kwargs})
        if not self.responses:
            raise AssertionError(f"unexpected GET {url}")
        return self.responses.pop(0)


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

    def test_apply_script_supports_rollback_out(self):
        args = parse_args(
            [
                "--vs-name",
                "wb_vs_apply_script_01",
                "--vip",
                "10.250.250.60",
                "--vport",
                "8080",
                "--pool",
                "wb_pool_apply_script_01",
                "--node",
                "192.0.2.60:80",
            ]
        )
        plan = self.build_plan(build_bundle(args))
        script = render_script(plan)
        self.assertIn("--rollback-out", script)
        self.assertIn("execute_plan_operations(plan, auth, args.rollback_out)", script)


class TestVerifySlbResource(unittest.TestCase):
    def test_verify_slb_resources_uses_read_only_gets(self):
        args = verify_slb_resource.parse_args(
            [
                "--base-url",
                "https://ad.example",
                "--username",
                "admin",
                "--password",
                "secret",
                "--vs-name",
                "vs1",
                "--pool-name",
                "pool1",
                "--node-ip",
                "192.0.2.10",
                "--http-profile",
                "profile1",
                "--pre-rule",
                "rule1",
            ]
        )
        session = FakeSession(
            [
                FakeResponse(200, {"name": "vs1"}),
                FakeResponse(200, {"name": "pool1", "nodes": [{"address": "192.0.2.10"}]}),
                FakeResponse(200, {"name": "profile1"}),
                FakeResponse(200, {"name": "rule1"}),
            ]
        )

        result = verify_slb_resource.verify_resources(args, session=session)

        self.assertTrue(result["ok"])
        self.assertEqual(result["missing"], [])
        self.assertEqual(
            result["found"],
            [
                "virtual_service:vs1",
                "pool:pool1",
                "http_profile:profile1",
                "pre_rule:rule1",
                "node_ip:192.0.2.10",
            ],
        )
        self.assertEqual(session.auth, ("admin", "secret"))
        self.assertFalse(session.verify)
        self.assertTrue(all(call["method"] == "GET" for call in session.calls))
        self.assertEqual(len(session.calls), 4)
        self.assertIn("/api/ad/v3/slb/pool/pool1", result["endpoints"])

    def test_verify_slb_resource_reports_missing_without_device(self):
        args = verify_slb_resource.parse_args(
            [
                "--base-url",
                "ad.example",
                "--username",
                "admin",
                "--password",
                "secret",
                "--pool-name",
                "pool1",
                "--node-ip",
                "192.0.2.10",
            ]
        )
        session = FakeSession([FakeResponse(200, {"name": "pool1", "nodes": [{"address": "192.0.2.11"}]})])

        result = verify_slb_resource.verify_resources(args, session=session)

        self.assertFalse(result["ok"])
        self.assertEqual(result["found"], ["pool:pool1"])
        self.assertEqual(result["missing"], ["node_ip:192.0.2.10"])
        self.assertEqual(session.calls[0]["url"], "https://ad.example/api/ad/v3/slb/pool/pool1")

    def test_verify_slb_resource_can_expect_absent(self):
        args = verify_slb_resource.parse_args(
            [
                "--base-url",
                "https://ad.example",
                "--username",
                "admin",
                "--password",
                "secret",
                "--vs-name",
                "vs-not-delivered",
                "--expect",
                "absent",
            ]
        )
        session = FakeSession([FakeResponse(404, text="not found")])

        result = verify_slb_resource.verify_resources(args, session=session)

        self.assertTrue(result["ok"])
        self.assertEqual(result["expect"], "absent")
        self.assertEqual(result["found"], [])
        self.assertEqual(result["missing"], ["virtual_service:vs-not-delivered"])

    def test_verify_slb_resource_main_reads_env_and_prints_json(self):
        session = FakeSession([FakeResponse(200, {"name": "vs-env"})])
        env = {
            "AD_BASE_URL": "https://ad.example",
            "AD_USERNAME": "admin",
            "AD_PASSWORD": "secret",
        }
        stdout = io.StringIO()
        with mock.patch.dict(os.environ, env), mock.patch.object(verify_slb_resource.requests, "Session", return_value=session):
            with contextlib.redirect_stdout(stdout):
                code = verify_slb_resource.main(["--vs-name", "vs-env"])

        result = json.loads(stdout.getvalue())
        self.assertEqual(code, 0)
        self.assertEqual(result["found"], ["virtual_service:vs-env"])
        self.assertEqual(result["missing"], [])


if __name__ == "__main__":
    unittest.main()
