"""Tests for ad-config-ops bundle rendering and planning."""

from __future__ import annotations

import contextlib
import io
import json
import os
import argparse
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
import ad_ops_flow  # noqa: E402
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

    def request(self, method: str, url: str, **kwargs: object) -> FakeResponse:
        method = method.upper()
        self.calls.append({"method": method, "url": url, **kwargs})
        if not self.responses:
            raise AssertionError(f"unexpected {method} {url}")
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


class TestAdOpsFlowPreflight(unittest.TestCase):
    def test_preflight_reuses_same_name_create_targets_and_rerenders_effective_plan(self):
        plan = {
            "operations": [
                {
                    "id": "create-pool",
                    "action": "create",
                    "method": "POST",
                    "path": "/api/ad/v3/slb/pool/",
                    "resource_path": "/api/ad/v3/slb/pool/{name}",
                    "path_parameters": {"name": "pool1"},
                    "payload": {"name": "pool1"},
                },
                {
                    "id": "create-virtual-service",
                    "action": "create",
                    "method": "POST",
                    "path": "/api/ad/v3/slb/virtual-service/",
                    "resource_path": "/api/ad/v3/slb/virtual-service/{name}",
                    "path_parameters": {"name": "vs1"},
                    "payload": {"name": "vs1", "pool": "pool1"},
                },
            ],
            "verify": [
                {"operation_id": "create-pool", "path": "/api/ad/v3/slb/pool/pool1", "expected": {"name": "pool1"}},
                {"operation_id": "create-virtual-service", "path": "/api/ad/v3/slb/virtual-service/vs1", "expected": {"name": "vs1"}},
            ],
        }
        session = FakeSession(
            [
                FakeResponse(200, {"name": "pool1"}),
                FakeResponse(404, text="not found"),
            ]
        )
        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp)
            preflight, effective, reused, artifacts = ad_ops_flow.run_preflight(
                plan=plan,
                session=session,
                base_url="https://ad.example",
                auth={"host": "https://ad.example", "username": "admin", "password": "secret", "token": None},
                workdir=workdir,
            )
            effective_plan = read_json(artifacts["effective_plan"])

        self.assertEqual(preflight["reused_count"], 1)
        self.assertEqual(reused[0]["target_path"], "/api/ad/v3/slb/pool/pool1")
        self.assertTrue(reused[0]["compatibility_ok"])
        self.assertEqual([item["id"] for item in effective["operations"]], ["create-virtual-service"])
        self.assertEqual([item["id"] for item in effective_plan["operations"]], ["create-virtual-service"])
        self.assertEqual([item["method"] for item in session.calls], ["GET", "GET"])

    def test_preflight_records_same_name_payload_mismatch_without_blocking_reuse(self):
        plan = {
            "operations": [
                {
                    "id": "create-pool",
                    "action": "create",
                    "method": "POST",
                    "path": "/api/ad/v3/slb/pool/",
                    "resource_path": "/api/ad/v3/slb/pool/{name}",
                    "path_parameters": {"name": "pool1"},
                    "payload": {"name": "pool1", "description": "expected"},
                }
            ]
        }
        session = FakeSession([FakeResponse(200, {"name": "pool1", "description": "actual"})])
        with tempfile.TemporaryDirectory() as tmp:
            preflight, effective, reused, _artifacts = ad_ops_flow.run_preflight(
                plan=plan,
                session=session,
                base_url="https://ad.example",
                auth={"host": "https://ad.example", "username": "admin", "password": "secret", "token": None},
                workdir=Path(tmp),
            )

        self.assertEqual(preflight["reused_count"], 1)
        self.assertFalse(preflight["checks"][0]["compatibility_ok"])
        self.assertEqual(reused[0]["compatibility_diff_count"], 1)
        self.assertEqual(effective["operations"], [])

    def test_preflight_stops_on_non_404_get_failure(self):
        plan = {
            "operations": [
                {
                    "id": "create-pool",
                    "action": "create",
                    "method": "POST",
                    "path": "/api/ad/v3/slb/pool/",
                    "resource_path": "/api/ad/v3/slb/pool/{name}",
                    "path_parameters": {"name": "pool1"},
                    "payload": {"name": "pool1"},
                }
            ]
        }
        session = FakeSession([FakeResponse(500, text="device error")])
        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp)
            with self.assertRaisesRegex(ValueError, "preflight GET failed"):
                ad_ops_flow.run_preflight(
                    plan=plan,
                    session=session,
                    base_url="https://ad.example",
                    auth={"host": "https://ad.example", "username": "admin", "password": "secret", "token": None},
                    workdir=workdir,
                )
            preflight = read_json(workdir / "adops-preflight.json")

        self.assertFalse(preflight["ok"])
        self.assertEqual(preflight["error_count"], 1)
        self.assertEqual(preflight["errors"][0]["status"], 500)

    def test_apply_slb_plan_honors_allow_existing_flag(self):
        plan = {
            "operations": [
                {
                    "id": "create-pool",
                    "action": "create",
                    "method": "POST",
                    "path": "/api/ad/v3/slb/pool/",
                    "resource_path": "/api/ad/v3/slb/pool/{name}",
                    "path_parameters": {"name": "pool1"},
                    "payload": {"name": "pool1"},
                }
            ]
        }
        session = FakeSession([FakeResponse(404, text="not found"), FakeResponse(200, {"name": "pool1"})])
        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp)
            plan_path = workdir / "plan.json"
            write_json(plan_path, plan)
            args = argparse.Namespace(
                plan=plan_path,
                host="https://ad.example",
                username="admin",
                password="secret",
                allow_existing=True,
                vs_name=None,
                pool_name=None,
                node_ip=[],
                http_profile=None,
                pre_rule=None,
                workdir=workdir,
            )
            with mock.patch.object(ad_ops_flow.requests, "Session", return_value=session):
                with mock.patch.object(ad_ops_flow, "execute_plan", return_value={"ok": True, "mode": "execute", "executed": [], "verify": []}) as execute_mock:
                    result = ad_ops_flow.apply_slb_plan(args)

        self.assertTrue(result["ok"])
        self.assertTrue(execute_mock.call_args.kwargs["allow_existing"])

    def test_compare_get_states_detects_rollback_mismatch(self):
        baseline = {
            "checks": [
                {"target_path": "/api/ad/v3/slb/pool/pool1", "found": True, "status": 200, "payload": {"name": "pool1"}},
                {"target_path": "/api/ad/v3/slb/virtual-service/vs1", "found": False, "status": 404},
            ]
        }
        same = {
            "checks": [
                {"target_path": "/api/ad/v3/slb/pool/pool1", "found": True, "status": 200, "payload": {"name": "pool1"}},
                {"target_path": "/api/ad/v3/slb/virtual-service/vs1", "found": False, "status": 404},
            ]
        }
        changed = {
            "checks": [
                {"target_path": "/api/ad/v3/slb/pool/pool1", "found": True, "status": 200, "payload": {"name": "pool1", "method": "LC"}},
                {"target_path": "/api/ad/v3/slb/virtual-service/vs1", "found": True, "status": 200, "payload": {"name": "vs1"}},
            ]
        }

        self.assertTrue(ad_ops_flow.compare_get_states(baseline, same)["ok"])
        result = ad_ops_flow.compare_get_states(baseline, changed)
        self.assertFalse(result["ok"])
        self.assertEqual(result["diff_count"], 2)

    def test_rollback_and_verify_rejects_host_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp)
            manifest_path = workdir / "adops-rollback.json"
            baseline_path = workdir / "adops-preflight.json"
            write_json(
                manifest_path,
                {
                    "version": 1,
                    "source": {"base_url": "https://ad-a.example", "plan_sha256": "abc"},
                    "actions": [],
                },
            )
            write_json(
                baseline_path,
                {
                    "ok": True,
                    "check_count": 1,
                    "source": {"base_url": "https://ad-a.example", "plan_sha256": "abc"},
                    "checks": [{"target_path": "/api/ad/v3/slb/pool/pool1", "found": False, "status": 404}],
                },
            )
            args = argparse.Namespace(
                manifest=manifest_path,
                baseline=baseline_path,
                host="https://ad-b.example",
                username="admin",
                password="secret",
                workdir=workdir,
            )
            with self.assertRaisesRegex(ValueError, "baseline belongs to"):
                ad_ops_flow.rollback_and_verify(args)


if __name__ == "__main__":
    unittest.main()
