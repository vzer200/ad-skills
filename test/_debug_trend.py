"""Debug: test trend APIs on both devices to find the 500."""
import json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))
from ad_api import ADClient, ADError, ADAuthError, ADAPIError, ADConnectionError

for name, host in [("AD1", "https://14.18.243.211:21039"), ("AD2", "https://14.18.243.211:21044")]:
    c = ADClient(host, "admin", "root1234+")
    print(f"\n{'='*60}")
    print(f"  {name}: {host}")
    print(f"{'='*60}")

    # Test 1: get_vs_summary_trend
    print("\n[1] get_vs_summary_trend(items='connection-rate,connection', trend='last-hour')")
    try:
        r = c.get_vs_summary_trend(items='connection-rate,connection', trend='last-hour')
        print(f"    OK: keys={list(r.keys()) if isinstance(r, dict) else 'N/A'}")
    except ADAPIError as e:
        print(f"    HTTP {e.http_code}: {e.response_body[:200]}")
    except Exception as e:
        print(f"    ERROR: {e}")

    # Test 2: get_vs_trend_by_name
    print("\n[2] get_vs_trend_by_name('test', items='connection-rate,connection', trend='last-hour')")
    try:
        r = c.get_vs_trend_by_name('test', items='connection-rate,connection', trend='last-hour')
        print(f"    OK: keys={list(r.keys()) if isinstance(r, dict) else 'N/A'}")
    except ADAPIError as e:
        print(f"    HTTP {e.http_code}: {e.response_body[:200]}")
    except Exception as e:
        print(f"    ERROR: {e}")

    # Test 3: get_vs_trend_by_name with different trend period
    for trend in ('last-5m', 'last-30m', 'last-day', 'last-month'):
        print(f"\n[3] get_vs_trend_by_name('test', trend='{trend}')")
        try:
            r = c.get_vs_trend_by_name('test', items='connection-rate', trend=trend)
            print(f"    OK")
        except ADAPIError as e:
            print(f"    HTTP {e.http_code}: {e.response_body[:200]}")
        except Exception as e:
            print(f"    ERROR: {e}")

    # Test 4: _request raw URL to see exact path
    print("\n[4] Raw _request GET /stat/slb/virtual-service/test/combine-items?trend=last-hour&items=connection-rate&netns=default&all_properties=true")
    try:
        r = c._request("GET", "/stat/slb/virtual-service/test/combine-items",
                       params={"trend": "last-hour", "items": "connection-rate", "netns": "default"})
        print(f"    OK: keys={list(r.keys()) if isinstance(r, dict) else 'N/A'}")
    except ADAPIError as e:
        print(f"    HTTP {e.http_code}: {e.response_body[:300]}")
    except Exception as e:
        print(f"    ERROR: {e}")

print("\n\nDONE")
