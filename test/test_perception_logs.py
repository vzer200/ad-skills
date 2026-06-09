import importlib.util
import tempfile
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PERCEPTION_PATH = ROOT / ".claude" / "skills" / "ad-perception" / "scripts" / "perception.py"
AD_API_PATH = ROOT / ".claude" / "skills" / "ad-ops" / "scripts" / "ad_api.py"
sys.path.insert(0, str(PERCEPTION_PATH.parent))
sys.path.insert(0, str(AD_API_PATH.parent))


spec = importlib.util.spec_from_file_location("perception", PERCEPTION_PATH)
perception = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(perception)

ad_api_spec = importlib.util.spec_from_file_location("ad_api", AD_API_PATH)
ad_api = importlib.util.module_from_spec(ad_api_spec)
assert ad_api_spec.loader is not None
ad_api_spec.loader.exec_module(ad_api)


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


class FakePagingClient:
    def __init__(self, total_items=6):
        self.calls = []
        self.total_items = total_items

    def get_service_log(self, **kwargs):
        self.calls.append(kwargs)
        skip = int(kwargs.get("skip", 0))
        limit = int(kwargs.get("limit", 2))
        remaining = max(0, self.total_items - skip)
        count = min(limit, remaining)
        return {
            "total_items": self.total_items,
            "items": [
                {
                    "date": "2026-06-09",
                    "time": f"16:{len(self.calls):02d}:{i:02d}",
                    "level": "ALERT",
                    "module": "APPD",
                    "detail": "ordinary log",
                }
                for i in range(count)
            ],
        }


class RecordingADClient(ad_api.ADClient):
    def __init__(self):
        super().__init__("https://example.invalid", username="admin", password="pw")
        self.requests = []

    def _request(self, method, endpoint, data=None, params=None):
        self.requests.append((method, endpoint, dict(params or {})))
        return {"items": []}


class ServiceLogTests(unittest.TestCase):
    def test_service_log_uses_frontend_dollar_pagination_params(self):
        client = RecordingADClient()

        client.get_service_log(
            limit=100,
            skip=4000,
            from_time="2026-06-09 00:00:00",
            to_time="2026-06-09 23:59:59",
            levels=["INFO", "ALERT", "ERROR"],
            modules=["APPD", "RS_DETECT"],
        )

        self.assertEqual(len(client.requests), 1)
        _method, endpoint, params = client.requests[0]
        self.assertEqual(endpoint, "/log/service-log")
        self.assertEqual(params["$top"], 100)
        self.assertEqual(params["$skip"], 4000)
        self.assertNotIn("top", params)
        self.assertNotIn("skip", params)
        self.assertEqual(params["level"], "INFO,ALERT,ERROR")
        self.assertEqual(params["module"], "APPD,RS_DETECT")

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

    def test_progress_job_advances_across_calls_until_semantic_match(self):
        client = FakeLogClient()
        with tempfile.TemporaryDirectory() as temp_dir:
            job = perception.create_service_log_job(
                host="https://192.168.8.31",
                display_limit=20,
                page_size=100,
                from_time="2026-06-01 00:00:00",
                to_time="2026-06-09 23:59:59",
                levels=["ALERT"],
                modules=[],
                log_type="address-conflict",
                state_dir=temp_dir,
            )

            first = perception.advance_service_log_job(job["job_id"], client, state_dir=temp_dir, max_pages=1)
            self.assertFalse(first["done"])
            self.assertEqual(first["matched"], 0)

            second = perception.advance_service_log_job(job["job_id"], client, state_dir=temp_dir, max_pages=1)
            self.assertTrue(second["done"])
            self.assertEqual(second["matched"], 1)
            self.assertIn("172.16.1.100", second["entries"][0]["detail"])
            self.assertEqual(second["display_limit"], 20)

    def test_progress_job_has_no_implicit_4000_scan_cap(self):
        client = FakePagingClient(total_items=4002)
        with tempfile.TemporaryDirectory() as temp_dir:
            job = perception.create_service_log_job(
                host="https://192.168.8.31",
                display_limit=20,
                page_size=1000,
                from_time="2026-06-01 00:00:00",
                to_time="2026-06-09 23:59:59",
                levels=["ALERT"],
                modules=[],
                log_type="address-conflict",
                state_dir=temp_dir,
            )

            result = perception.advance_service_log_job(job["job_id"], client, state_dir=temp_dir, max_pages=10)

            self.assertTrue(result["done"])
            self.assertEqual(result["scanned"], 4002)
            self.assertEqual([call["skip"] for call in client.calls], [0, 1000, 2000, 3000, 4000])


if __name__ == "__main__":
    unittest.main()
