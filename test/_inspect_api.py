"""Quick API inspection — compare start_time across POST/history/progress."""
import json, sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-ops", "scripts"))
from ad_api import ADClient

DEVICES = [
    ("AD1", "https://14.18.243.211:21039"),
    ("AD2", "https://14.18.243.211:21044"),
]

for name, host in DEVICES:
    c = ADClient(host, "admin", "root1234+")
    print(f"\n{'='*60}")
    print(f"  {name}: {host}")
    print(f"{'='*60}")

    # 1. History (before starting, to see format)
    try:
        r = c._request("GET", "/debug/sys/offline-check", params={"type": "history"})
        items = r.get("items", [])
        print(f"\n[history] {len(items)} records:")
        for i, item in enumerate(items[:3]):
            print(f"  [{i}] name={item.get('name')}")
            print(f"      start_time={item.get('start_time')!r}")
            print(f"      end_time={item.get('end_time')!r}")
            print(f"      scene={item.get('scene')!r}")
            pre_name = items[0].get("name", "") if items else ""
    except Exception as e:
        print(f"  history error: {e}")
        pre_name = ""

    # 2. Start check with force
    try:
        my_t0 = time.time()
        my_t0_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(my_t0))
        print(f"\n[POST start_check] 发起时间 (本地时钟): {my_t0_str}")
        r = c._request("POST", "/debug/sys/offline-check",
                       data={"scene": "标准巡检"}, params={"force": "true"})
        print(f"  完整响应: {json.dumps(r, indent=2, ensure_ascii=False)}")
        # Check all time-related fields
        for k in r:
            if 'time' in k.lower() or 'event' in k.lower() or 'state' in k.lower():
                print(f"  {k} = {r[k]!r}")
    except Exception as e:
        print(f"  POST error: {e}")

    # 3. Wait a moment then check progress
    time.sleep(3)
    try:
        r = c._request("GET", "/debug/sys/offline-check", params={"type": "progress"})
        print(f"\n[progress]: {json.dumps(r, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"  progress error: {e}")

    # 4. Wait for check to complete, then check history again
    print(f"\n[waiting for check to complete...]")
    for attempt in range(30):
        time.sleep(5)
        try:
            r = c._request("GET", "/debug/sys/offline-check", params={"type": "history"})
            items = r.get("items", [])
            if items:
                top = items[0]
                new_name = top.get("name", "")
                end_time = top.get("end_time", "")
                if new_name != pre_name and end_time:
                    print(f"  新报告完成! (attempt {attempt+1})")
                    print(f"  name={new_name}")
                    print(f"  start_time={top.get('start_time')!r}")
                    print(f"  end_time={top.get('end_time')!r}")
                    print(f"  scene={top.get('scene')!r}")
                    break
                else:
                    print(f"  [{attempt+1}] name={new_name} end={end_time} is_new={new_name!=pre_name} finished={bool(end_time)}")
        except Exception as e:
            print(f"  poll error: {e}")
            break
    else:
        print(f"  TIMEOUT after 30 attempts")

print("\n\n===== ANALYSIS COMPLETE =====")
