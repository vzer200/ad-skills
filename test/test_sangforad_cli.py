import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / ".claude" / "skills" / "sangforad-cli" / "scripts" / "render_cli.py"
SKILL_MD = REPO / ".claude" / "skills" / "sangforad-cli" / "SKILL.md"
AD_CONFIG_OPS_ROOT = REPO / ".claude" / "skills" / "ad-config-ops"


class TestSangforAdCli(unittest.TestCase):
    def test_skill_trigger_description_covers_command_script_prompts(self):
        text = SKILL_MD.read_text(encoding="utf-8")

        for phrase in ["command scripts", "CLI scripts", "命令行脚本", "配置脚本", "离线命令", "apply.sfcli"]:
            self.assertIn(phrase, text)

    def run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        env = {**os.environ, "PYTHONUTF8": "1"}
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            cwd=str(REPO),
            env=env,
            text=True,
            encoding="utf-8",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=120,
            check=True,
        )

    def test_render_cli_from_slb_create_bundle(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = self.run_script(
                "--bundle",
                "test/fixtures/workbot/r4-slb-full.yml",
                "--ad-config-ops-root",
                str(AD_CONFIG_OPS_ROOT),
                "--workdir",
                tmp,
            )
            summary = json.loads(result.stdout)
            cli_script = Path(summary["cli_script"])
            text = cli_script.read_text(encoding="utf-8")

        self.assertTrue(summary["ok"])
        self.assertEqual(summary["operation_count"], 4)
        self.assertEqual(text.count(";"), 4)
        self.assertIn("create slb http-profile wb_http_profile_workbot_01", text)
        self.assertIn("source_address { operation request-header-insert-srcip request_header X-Forwarded-For }", text)
        self.assertIn("create slb pool wb_pool_workbot_flow_01", text)
        self.assertIn("nodes add [ { name node_1_192.0.2.51_80 type address address 192.0.2.51 port 80 state enable weight 10 priority_level 1 } ]", text)
        self.assertIn("create slb pre-rule http wb_pre_rule_workbot_01", text)
        self.assertIn("create slb virtual-service wb_vs_workbot_flow_01", text)
        self.assertNotIn("/api/ad/v3", text)

    def test_render_cli_from_patch_and_delete_bundles(self):
        cases = [
            (
                "test/fixtures/workbot/r4-slb-update.yml",
                [
                    'modify slb http-profile wb_http_profile_workbot_01 description "WorkBot acceptance UPDATED HTTP optimization profile.";',
                    'modify slb virtual-service wb_vs_workbot_flow_01 description "WorkBot acceptance UPDATED virtual service.";',
                ],
            ),
            (
                "test/fixtures/workbot/r4-slb-delete.yml",
                [
                    "delete slb virtual-service wb_vs_workbot_flow_01;",
                    "delete slb http-profile wb_http_profile_workbot_01;",
                ],
            ),
        ]
        for fixture, expected_lines in cases:
            with self.subTest(fixture=fixture), tempfile.TemporaryDirectory() as tmp:
                result = self.run_script(
                    "--bundle",
                    fixture,
                    "--ad-config-ops-root",
                    str(AD_CONFIG_OPS_ROOT),
                    "--workdir",
                    tmp,
                )
                summary = json.loads(result.stdout)
                text = Path(summary["cli_script"]).read_text(encoding="utf-8")
                for line in expected_lines:
                    self.assertIn(line, text)

    def test_render_cli_from_plan_file_without_ad_config_ops(self):
        plan = {
            "version": 1,
            "operations": [
                {
                    "id": "delete-vs",
                    "action": "delete",
                    "method": "DELETE",
                    "path": "/api/ad/v3/slb/virtual-service/vs1",
                    "resource_path": "/api/ad/v3/slb/virtual-service/{name}",
                    "path_parameters": {"name": "vs1"},
                    "payload": {"name": "vs1"},
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            plan_path = Path(tmp) / "plan.json"
            plan_path.write_text(json.dumps(plan), encoding="utf-8")
            result = self.run_script("--plan", str(plan_path), "--workdir", tmp)
            summary = json.loads(result.stdout)
            text = Path(summary["cli_script"]).read_text(encoding="utf-8")

        self.assertTrue(summary["ok"])
        self.assertIn("delete slb virtual-service vs1;", text)

    def test_plan_argument_with_bundle_shaped_file_replans_before_rendering(self):
        with tempfile.TemporaryDirectory() as tmp:
            copied = Path(tmp) / "adops-plan.json"
            copied.write_text(
                (REPO / "test" / "fixtures" / "workbot" / "r4-slb-full.yml").read_text(encoding="utf-8"),
                encoding="utf-8",
            )
            result = self.run_script(
                "--plan",
                str(copied),
                "--ad-config-ops-root",
                str(AD_CONFIG_OPS_ROOT),
                "--workdir",
                tmp,
            )
            summary = json.loads(result.stdout)
            text = Path(summary["cli_script"]).read_text(encoding="utf-8")

        self.assertTrue(summary["ok"])
        self.assertIn("create slb http-profile wb_http_profile_workbot_01", text)
        self.assertIn("create slb virtual-service wb_vs_workbot_flow_01", text)


if __name__ == "__main__":
    unittest.main()
