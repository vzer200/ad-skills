import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
SKILL_ROOT = REPO / ".claude" / "skills" / "ad-config-ops"


class TestAdConfigOpsIntegration(unittest.TestCase):
    def run_skill(
        self,
        *args: str,
        cwd: Path | None = None,
        env_extra: dict[str, str] | None = None,
        env_remove: tuple[str, ...] = (),
    ) -> subprocess.CompletedProcess[str]:
        env = {**os.environ, "PYTHONUTF8": "1"}
        for key in env_remove:
            env.pop(key, None)
        if env_extra:
            env.update(env_extra)
        return subprocess.run(
            [sys.executable, *args],
            cwd=str(cwd or REPO),
            env=env,
            text=True,
            encoding="utf-8",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=120,
            check=True,
        )

    def test_skill_metadata_uses_packaged_name(self):
        text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("name: ad-config-ops", text)
        self.assertIn("skills/ad-config-ops", text)
        self.assertNotIn("skills/AD-OPS", text)

    def test_skill_forbids_reusing_prior_clarification_scope(self):
        text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("Do not carry resource-type clarification answers from earlier workflows", text)
        self.assertIn("Do not rewrite an ambiguous current request into a typed query before lookup", text)
        self.assertIn("A clarification answer is valid only for the workflow that asked it", text)

    def test_lookup_exact_match_works_without_external_install(self):
        result = self.run_skill(
            ".claude/skills/ad-config-ops/scripts/lookup_api.py",
            "--skill-root",
            ".claude/skills/ad-config-ops",
            "--query",
            "创建 HTTP 虚拟服务",
            "--module",
            "slb",
            "--summary",
        )
        data = json.loads(result.stdout)
        top = data["top_matches"][0]

        self.assertTrue(data["ok"])
        self.assertEqual(top["document"], "slb/virtual-service/http.js")
        self.assertEqual(top["match_source"], "exact")
        self.assertEqual(top["resource"], "slb.virtual_service.http")
        self.assertNotIn("preset_fields", top)

    def test_lookup_ambiguous_virtual_service_uses_split_documents(self):
        result = self.run_skill(
            ".claude/skills/ad-config-ops/scripts/lookup_api.py",
            "--skill-root",
            ".claude/skills/ad-config-ops",
            "--query",
            "创建虚拟服务",
            "--module",
            "slb",
            "--summary",
        )
        data = json.loads(result.stdout)

        self.assertTrue(data["needs_clarification"])
        self.assertEqual(data["family"], "slb.virtual_service")
        self.assertIn("slb/virtual-service/http.js", {option["document"] for option in data["options"]})

    def test_init_env_and_status_use_vendored_yaml_runtime(self):
        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp) / "adops"
            self.run_skill(
                ".claude/skills/ad-config-ops/scripts/init_env.py",
                "--workdir",
                str(workdir),
                "--confirm-clean",
            )
            status = self.run_skill(
                ".claude/skills/ad-config-ops/scripts/ad_ops_flow.py",
                "status",
                "--workdir",
                str(workdir),
            )
            data = json.loads(status.stdout)

        self.assertTrue(data["ok"])
        self.assertEqual(data["workflow_contract"], "scripts_only")

    def test_init_env_cleans_workbot_output_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp) / "adops"
            outputs = Path(tmp) / "outputs"
            nested = outputs / "stale-dir"
            nested.mkdir(parents=True)
            (outputs / "adops-bundle.yml").write_text("stale bundle", encoding="utf-8")
            (outputs / "apply.py").write_text("stale script", encoding="utf-8")
            (outputs / "notes.txt").write_text("stale note", encoding="utf-8")
            (nested / "old.txt").write_text("stale nested file", encoding="utf-8")

            result = self.run_skill(
                ".claude/skills/ad-config-ops/scripts/init_env.py",
                "--workdir",
                str(workdir),
                "--confirm-clean",
                env_extra={"AD_OPS_OUTPUT_DIR": str(outputs)},
            )
            data = json.loads(result.stdout)

            self.assertTrue(data["ok"])
            self.assertEqual(data["output_dir"], str(outputs))
            self.assertEqual(data["output_cleaned_count"], 4)
            self.assertEqual(list(outputs.iterdir()), [])

    def test_fixture_bundle_plans_and_renders_apply_script(self):
        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp) / "adops"
            self.run_skill(
                ".claude/skills/ad-config-ops/scripts/init_env.py",
                "--workdir",
                str(workdir),
                "--confirm-clean",
            )
            rendered = self.run_skill(
                ".claude/skills/ad-config-ops/scripts/ad_ops_flow.py",
                "plan-and-render",
                "--skill-root",
                ".claude/skills/ad-config-ops",
                "--bundle",
                "test/fixtures/workbot/r4-slb-full.yml",
                "--workdir",
                str(workdir),
            )
            summary = self.run_skill(
                ".claude/skills/ad-config-ops/scripts/ad_ops_flow.py",
                "summarize-plan",
                "--plan",
                str(workdir / "adops-plan.json"),
                "--workdir",
                str(workdir),
            )
            rendered_data = json.loads(rendered.stdout)
            summary_data = json.loads(summary.stdout)

            self.assertTrue(rendered_data["ok"])
            self.assertTrue(summary_data["ok"])
            self.assertEqual(summary_data["operation_count"], 4)
            self.assertTrue(Path(rendered_data["apply_script"]).is_file())

    def test_workbot_empty_workdir_and_root_bundle_path_use_outputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            outputs = Path(tmp) / "outputs"
            self.run_skill(
                ".claude/skills/ad-config-ops/scripts/render_bundle_template.py",
                "--skill-root",
                ".claude/skills/ad-config-ops",
                "--operation",
                "pool",
                "create",
                "config.pool",
                "slb/pool.js",
                "--out",
                "/adops-bundle.yml",
                "--workdir",
                "",
                env_extra={"AD_OPS_WORKBOT_OUTPUTS": str(outputs)},
                env_remove=("AD_OPS_WORKDIR",),
            )
            bundle = outputs / "adops-bundle.yml"
            artifacts = json.loads((outputs / "adops-artifacts.json").read_text(encoding="utf-8"))

            self.assertTrue(bundle.is_file())
            self.assertEqual(artifacts["bundle"], str(bundle))

    def test_bundle_template_infers_http_type_fields(self):
        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp) / "adops"
            bundle = workdir / "adops-bundle.yml"
            self.run_skill(
                ".claude/skills/ad-config-ops/scripts/render_bundle_template.py",
                "--skill-root",
                ".claude/skills/ad-config-ops",
                "--operation",
                "pool1",
                "create",
                "config.pool",
                "slb/pool.js",
                "--operation",
                "policy1",
                "create",
                "config.pre_rule_http",
                "slb/pre-rule/http.js",
                "--operation",
                "vs1",
                "create",
                "config.virtual_service",
                "slb/virtual-service/http.js",
                "--out",
                str(bundle),
                "--workdir",
                str(workdir),
            )
            text = bundle.read_text(encoding="utf-8")

        self.assertIn("schema: config.pre_rule_http", text)
        self.assertIn("schema: config.virtual_service", text)
        self.assertEqual(len(re.findall(r"^      service: HTTP\b", text, re.MULTILINE)), 2)

    def test_device_config_resolves_devices_json_and_url_hosts(self):
        scripts = SKILL_ROOT / "scripts"
        if str(scripts) not in sys.path:
            sys.path.insert(0, str(scripts))
        from argparse import Namespace
        from device_config import normalize_base_url, resolve_device_connection

        with tempfile.TemporaryDirectory() as tmp:
            devices = Path(tmp) / "devices.json"
            devices.write_text(
                json.dumps(
                    {
                        "devices": [
                            {
                                "name": "AD1",
                                "host": "https://192.168.8.30",
                                "user": "admin",
                                "password": "secret",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            args = Namespace(devices=devices, device="AD1", host=None, username=None, password=None, token=None)
            auth = resolve_device_connection(args)

        self.assertEqual(auth["host"], "https://192.168.8.30")
        self.assertEqual(auth["username"], "admin")
        self.assertEqual(auth["password"], "secret")
        self.assertEqual(normalize_base_url(auth["host"]), "https://192.168.8.30")
        self.assertEqual(normalize_base_url("192.168.8.30"), "https://192.168.8.30")

    def test_device_capable_scripts_expose_devices_args(self):
        for script in ("execute_plan.py", "rollback.py", "prepare_edit_template.py", "interface_adapter.py"):
            with self.subTest(script=script):
                text = (SKILL_ROOT / "scripts" / script).read_text(encoding="utf-8")

                self.assertIn("--devices", text)
                self.assertIn("--device", text)
                self.assertIn("resolve_device_connection", text)
                self.assertIn("normalize_base_url", text)

    def test_template_prefills_single_value_discriminator_fields(self):
        cases = [
            ("config.link_lan", "net/link/lan.js", r"^type: LAN\b"),
            ("config.tcp_profile_l7_proxy", "slb/tcp-profile/l7-proxy.js", r"^type: L7-PROXY\b"),
            ("config.service_monitor_http", "slb/service-monitor/http.js", r"^type: HTTP\b"),
        ]
        for schema, document, pattern in cases:
            with self.subTest(schema=schema, document=document):
                result = self.run_skill(
                    ".claude/skills/ad-config-ops/scripts/render_template.py",
                    "--skill-root",
                    ".claude/skills/ad-config-ops",
                    "--schema",
                    schema,
                    "--document",
                    document,
                )
                self.assertIsNotNone(re.search(pattern, result.stdout, re.MULTILINE))

    def test_package_includes_ad_config_ops_and_excludes_source_artifacts(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "ad-skills-workbot.zip"
            manifest = Path(tmp) / "manifest.json"
            self.run_skill(
                "tools/package_ad_skills.py",
                "--out",
                str(out),
                "--manifest-out",
                str(manifest),
            )
            data = json.loads(manifest.read_text(encoding="utf-8"))
            with zipfile.ZipFile(out) as zf:
                names = set(zf.namelist())

        self.assertIn("ad-config-ops", data["skills"])
        self.assertIn("sangforad-cli", data["skills"])
        self.assertIn("skills/ad-config-ops/SKILL.md", names)
        self.assertIn("skills/sangforad-cli/SKILL.md", names)
        self.assertIn("skills/sangforad-cli/scripts/render_cli.py", names)
        self.assertIn("skills/ad-config-ops/scripts/_vendor/yaml/__init__.py", names)
        self.assertFalse(any(name.startswith("AD_API_new/") for name in names))
        self.assertFalse(any("__MACOSX" in name or name.endswith(".DS_Store") for name in names))


if __name__ == "__main__":
    unittest.main()
