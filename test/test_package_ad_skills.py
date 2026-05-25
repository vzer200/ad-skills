import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from tools.package_ad_skills import devices_arc_names, discover_skill_paths, render_devices_json


class TestPackageAdSkills(unittest.TestCase):
    def test_source_devices_use_workbot_intranet_hosts(self):
        data = json.loads(Path("devices.json").read_text(encoding="utf-8"))
        hosts = {device["name"]: device["host"] for device in data["devices"]}

        self.assertEqual(hosts["AD1"], "https://192.168.8.30")
        self.assertEqual(hosts["AD2"], "https://192.168.8.31")
        for device in data["devices"]:
            self.assertIn("user", device)
            self.assertIn("password", device)
            self.assertNotIn("password_from", device)

    def test_render_devices_json_uses_direct_passwords_by_default(self):
        with tempfile.TemporaryDirectory() as tmp:
            devices = Path(tmp) / "devices.json"
            devices.write_text(
                json.dumps(
                    {
                        "devices": [
                            {
                                "name": "AD1",
                                "host": "https://example",
                                "user": "admin",
                                "password": "secret",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            rendered, credential_devices, overrides = render_devices_json(devices, inject_passwords=False)
            data = json.loads(rendered)

        self.assertEqual(credential_devices, ["AD1"])
        self.assertEqual(overrides, [])
        self.assertEqual(data["devices"][0]["password"], "secret")
        self.assertNotIn("password_from", data["devices"][0])

    def test_render_devices_json_rejects_password_from_without_injection(self):
        with tempfile.TemporaryDirectory() as tmp:
            devices = Path(tmp) / "devices.json"
            devices.write_text(
                json.dumps(
                    {
                        "devices": [
                            {
                                "name": "AD1",
                                "host": "https://example",
                                "user": "admin",
                                "password_from": "AD1_PASS",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            with self.assertRaises(SystemExit):
                render_devices_json(devices, inject_passwords=False)

    def test_render_devices_json_injects_password_from_environment(self):
        with tempfile.TemporaryDirectory() as tmp, mock.patch.dict(os.environ, {"AD1_PASS": "secret"}, clear=False):
            devices = Path(tmp) / "devices.json"
            devices.write_text(
                json.dumps(
                    {
                        "devices": [
                            {
                                "name": "AD1",
                                "host": "https://example",
                                "user": "admin",
                                "password_from": "AD1_PASS",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            rendered, injected, overrides = render_devices_json(devices, inject_passwords=True)
            data = json.loads(rendered)

        self.assertEqual(injected, ["AD1"])
        self.assertEqual(overrides, [])
        self.assertEqual(data["devices"][0]["password"], "secret")
        self.assertNotIn("password_from", data["devices"][0])

    def test_render_devices_json_injects_host_and_user_overrides(self):
        env = {"AD1_HOST": "https://192.168.8.30", "AD1_USER": "admin2"}
        with tempfile.TemporaryDirectory() as tmp, mock.patch.dict(os.environ, env, clear=False):
            devices = Path(tmp) / "devices.json"
            devices.write_text(
                json.dumps(
                    {
                        "devices": [
                            {
                                "name": "AD1",
                                "host": "https://public",
                                "user": "admin",
                                "password": "secret",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            rendered, injected, overrides = render_devices_json(
                devices,
                inject_passwords=False,
                inject_overrides=True,
            )
            data = json.loads(rendered)

        self.assertEqual(injected, ["AD1"])
        self.assertEqual(overrides, ["AD1.host", "AD1.user"])
        self.assertEqual(data["devices"][0]["host"], "https://192.168.8.30")
        self.assertEqual(data["devices"][0]["user"], "admin2")

    def test_devices_arc_names_include_root_shared_and_skill_copies(self):
        names = [item.as_posix() for item in devices_arc_names(["ad-connect", "ad-ops"])]

        self.assertEqual(
            names,
            [
                "devices.json",
                "skills/devices.json",
                "skills/ad-connect/devices.json",
                "skills/ad-ops/devices.json",
            ],
        )

    def test_discover_skill_paths_requires_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "real-skill").mkdir()
            (root / "real-skill" / "SKILL.md").write_text("---\nname: real-skill\n---\n", encoding="utf-8")
            (root / "residual-dir").mkdir()

            names = [path.name for path in discover_skill_paths(root)]

        self.assertEqual(names, ["real-skill"])


if __name__ == "__main__":
    unittest.main()
