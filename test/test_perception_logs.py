import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PERCEPTION_PATH = ROOT / ".claude" / "skills" / "ad-perception" / "scripts" / "perception.py"
sys.path.insert(0, str(PERCEPTION_PATH.parent))


spec = importlib.util.spec_from_file_location("perception", PERCEPTION_PATH)
perception = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(perception)


class FakeLogClient:
    def __init__(self):
        self.calls = []

    def get_service_log(self, **kwargs):
        self.calls.append(kwargs)
        skip = kwargs.get("skip", 0)
        limit = kwargs.get("limit", 20)
        if skip == 0:
            return {
                "items": [
                    {
                        "date": "2026-06-09",
                        "time": f"16:{i:02d}:00",
                        "level": "ALERT",
                        "module": "APPD",
                        "detail": "virtual service fault",
                    }
                    for i in range(limit)
                ]
            }
        if skip == limit:
            return {
                "items": [
                    {
                        "date": "2026-06-04",
                        "time": "12:34:56",
                        "level": "ALERT",
                        "module": "APPD",
                        "detail": "检测到IP冲突 eth1:172.16.1.100，冲突设备的硬件地址：FE:FC:FE:16:D5:0A",
                    }
                ]
            }
        return {"items": []}


class ServiceLogTests(unittest.TestCase):
    def test_semantic_log_filter_reads_beyond_first_display_page(self):
        client = FakeLogClient()

        result = perception.fetch_service_log_result(
            client,
            limit=20,
            from_time="2026-06-01 00:00:00",
            to_time="2026-06-09 23:59:59",
            levels=["ALERT", "ERROR"],
            log_type="address-conflict",
        )

        self.assertEqual(result["shown"], 1)
        self.assertIn("172.16.1.100", result["entries"][0]["detail"])
        self.assertIn(100, [call.get("skip", 0) for call in client.calls])


if __name__ == "__main__":
    unittest.main()
