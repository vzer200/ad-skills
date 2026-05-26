import json
import os
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
SKILL_ROOT = REPO / ".claude" / "skills" / "ad-config-ops"


class TestAdConfigOpsIntegration(unittest.TestCase):
    def run_skill(self, *args: str, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
        env = {**os.environ, "PYTHONUTF8": "1"}
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
        self.assertEqual(top["document"], "slb/virtual-service.js")
        self.assertEqual(top["match_source"], "exact")
        self.assertEqual(top["preset_fields"], {"service": "HTTP"})

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
        self.assertIn("skills/ad-config-ops/SKILL.md", names)
        self.assertIn("skills/ad-config-ops/scripts/_vendor/yaml/__init__.py", names)
        self.assertFalse(any(name.startswith("AD_API_new/") for name in names))
        self.assertFalse(any("__MACOSX" in name or name.endswith(".DS_Store") for name in names))


if __name__ == "__main__":
    unittest.main()
