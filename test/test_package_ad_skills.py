import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from tools.package_ad_skills import devices_arc_names, render_devices_json


class TestPackageAdSkills(unittest.TestCase):
    def test_render_devices_json_keeps_password_from_by_default(self):
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

            rendered, injected = render_devices_json(devices, inject_passwords=False)
            data = json.loads(rendered)

        self.assertEqual(injected, [])
        self.assertEqual(data["devices"][0]["password_from"], "AD1_PASS")
        self.assertNotIn("password", data["devices"][0])

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

            rendered, injected = render_devices_json(devices, inject_passwords=True)
            data = json.loads(rendered)

        self.assertEqual(injected, ["AD1"])
        self.assertEqual(data["devices"][0]["password"], "secret")
        self.assertNotIn("password_from", data["devices"][0])

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


if __name__ == "__main__":
    unittest.main()
