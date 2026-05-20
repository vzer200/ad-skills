# AD Skills Architecture Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Unify ADClient across 4 skills, consolidate shared code into `scripts/`, add 200+ tests (ad_api/check/blackbox), and standardize all SKILL.md to ~130-line template.

**Architecture:** Move `ad_api.py` + `db_schema.py` to shared `scripts/` directory. All skill scripts import from there via unified path resolver. check.py and blackbox.py drop embedded ADClient classes. New test files for previously uncovered modules. 4 SKILL.md files rewritten to unified template.

**Tech Stack:** Python 3.12/3.14 stdlib only — `unittest`, `unittest.mock`, `sqlite3`, `urllib`, `ssl`, `tempfile`

**Phases:** 0-Preflight → 1-Shared Scripts (parallel) → 2-Import Migration → 3-ADClient Unification (parallel) → 4-Check Enhancement → 5-Test Suite → 6-SKILL.md (parallel) → 7-Cleanup → 8-Verification (real devices)

---

## Phase 0: Pre-flight

### Task 0.1: Backup and branch

**Files:** None (git operation)

- [ ] **Step 1: Create backup branch**

```bash
git checkout -b feature/architecture-consolidation
```

- [ ] **Step 2: Verify clean state**

```bash
git status
```

Expected: working tree clean, on `feature/architecture-consolidation`

- [ ] **Step 3: Run all existing tests as baseline**

```bash
Set-Location test
python -m unittest discover -p "test_*.py" -v
```

Expected: 65 tests, all pass, exit 0

---

## Phase 1: Shared Scripts Directory (Parallel Agents)

### Task 1.1: Move ad_api.py to scripts/

**Files:**
- Create: `D:\workSpace\scripts\ad_api.py`
- Modify: `D:\workSpace\.claude\skills\ad-ops\scripts\ad_api.py` (rename to .bak)

- [ ] **Step 1: Create scripts directory and copy file**

```powershell
New-Item -ItemType Directory -Force -Path "D:\workSpace\scripts"
Copy-Item "D:\workSpace\.claude\skills\ad-ops\scripts\ad_api.py" "D:\workSpace\scripts\ad_api.py"
```

- [ ] **Step 2: Modify scripts/ad_api.py — add params support to _request()**

Change `_request` signature from:
```python
def _request(self, method, endpoint, data=None):
```
to:
```python
def _request(self, method, endpoint, data=None, params=None):
```

Add params handling before URL construction:
```python
url = f"{self.host}/api/lb/current-version{endpoint}"
if params:
    import urllib.parse
    qs = urllib.parse.urlencode(params)
    url = f"{url}?{qs}" if '?' not in url else f"{url}&{qs}"
```

- [ ] **Step 3: Modify scripts/ad_api.py — add _raw_request() method**

Add after `_request()`:
```python
def _raw_request(self, url_path):
    """Binary download. url_path must start with /cgi/ and not contain .."""
    if not url_path.startswith("/cgi/") or ".." in url_path:
        raise ValueError(f"Invalid url_path: {url_path}")
    url = f"{self.host}{url_path}"
    req = urllib.request.Request(url, method="GET")
    auth = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
    req.add_header("Authorization", f"Basic {auth}")
    try:
        with urllib.request.urlopen(req, context=self.ssl_context, timeout=self.timeout) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        if e.code in (401, 403):
            raise ADAuthError(f"HTTP {e.code}: {body}", http_code=e.code, original=e)
        raise ADAPIError(f"HTTP {e.code}: {body}", http_code=e.code, response_body=body, original=e)
    except urllib.error.URLError as e:
        raise ADConnectionError(f"连接失败: {e.reason}", original=e)
```

- [ ] **Step 4: Modify scripts/ad_api.py — replace generic Exception with custom exception classes**

Add after imports, before `class ADClient`:
```python
class ADError(Exception):
    """AD API error base class."""
    def __init__(self, message, original=None):
        super().__init__(message)
        self.original = original

class ADConnectionError(ADError):
    """Connection failure (URLError, timeout)."""
    pass

class ADAuthError(ADError):
    """Authentication failure (HTTP 401/403)."""
    def __init__(self, message, http_code, original=None):
        super().__init__(message, original)
        self.http_code = http_code

class ADAPIError(ADError):
    """API error (HTTP 4xx/5xx non-auth)."""
    def __init__(self, message, http_code, response_body=None, original=None):
        super().__init__(message, original)
        self.http_code = http_code
        self.response_body = response_body
```

Then update `_request()` error handling: replace `raise Exception(f"HTTP {e.code}: {error_body}")` with the appropriate custom exception, and `raise Exception(f"连接失败: {e.reason}")` with `ADConnectionError`.

- [ ] **Step 5: Modify scripts/ad_api.py — add get_last_event() method**

Add after the HA section:
```python
def get_last_event(self):
    """Get last async task event (used by blackbox for task polling)."""
    return self._request("GET", "/last-event")
```

- [ ] **Step 6: Modify scripts/ad_api.py — refactor download_blackbox_log()**

Change the URL construction from inline to use `self._raw_request()`:
```python
def download_blackbox_log(self, file_token, save_path):
    data = self._raw_request(f"/cgi/file-resource?d={file_token}")
    os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(data)
    return save_path
```

- [ ] **Step 7: Modify scripts/ad_api.py — fix main() exit codes**

Change `sys.exit(1)` for missing host and missing password to `sys.exit(4)`.

- [ ] **Step 8: Rename original to .bak**

```powershell
Rename-Item "D:\workSpace\.claude\skills\ad-ops\scripts\ad_api.py" "ad_api.py.bak"
```

- [ ] **Step 9: Commit**

```bash
git add scripts/ad_api.py
git add -u .claude/skills/ad-ops/scripts/ad_api.py
git commit -m "feat: move ad_api.py to shared scripts/, add params/_raw_request/exception classes/get_last_event"
```

### Task 1.2: Move db_schema.py to scripts/

**Files:**
- Create: `D:\workSpace\scripts\db_schema.py`
- Modify: `D:\workSpace\.claude\skills\ad-perception\scripts\db_schema.py` (rename to .bak)

- [ ] **Step 1: Copy file**

```powershell
Copy-Item "D:\workSpace\.claude\skills\ad-perception\scripts\db_schema.py" "D:\workSpace\scripts\db_schema.py"
```

- [ ] **Step 2: Rename original to .bak**

```powershell
Rename-Item "D:\workSpace\.claude\skills\ad-perception\scripts\db_schema.py" "db_schema.py.bak"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/db_schema.py
git add -u .claude/skills/ad-perception/scripts/db_schema.py
git commit -m "feat: move db_schema.py to shared scripts/"
```

> **Dispatch Tasks 1.1 and 1.2 as parallel agents.** They operate on disjoint files.

---

## Phase 2: Import Migration (Sequential — depends on Phase 1)

### Task 2.1: Update perception.py import

**Files:** Modify `D:\workSpace\.claude\skills\ad-perception\scripts\perception.py:12-19`

- [ ] **Step 1: Replace the current sys.path block**

Replace lines 12-18:
```python
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ad-ops", "scripts"))
try:
    from ad_api import ADClient
except ImportError:
    print("错误: 无法导入 ad_api.py，请确认文件路径未变更", file=sys.stderr)
    sys.exit(9)

from db_schema import VS_SAMPLES_DDL, COLUMNS
```

With unified pattern:
```python
import sys, os
_scripts_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "scripts"
)
_scripts_dir = os.path.realpath(_scripts_dir)
if not os.path.isdir(_scripts_dir):
    print("错误: 无法定位共享 scripts 目录", file=sys.stderr)
    sys.exit(9)
sys.path.append(_scripts_dir)
try:
    from ad_api import ADClient
except ImportError as e:
    print(f"错误: 无法导入 ad_api: {e}", file=sys.stderr)
    sys.exit(9)
try:
    from db_schema import VS_SAMPLES_DDL, COLUMNS
except ImportError:
    pass
```

- [ ] **Step 2: Verify import works**

```powershell
Set-Location "D:\workSpace\.claude\skills\ad-perception\scripts"
python -c "from perception import ADClient; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-perception/scripts/perception.py
git commit -m "refactor: update perception.py import to shared scripts/"
```

### Task 2.2: Update collector.py import

**Files:** Modify `D:\workSpace\.claude\skills\ad-perception\scripts\collector.py:14-28`

- [ ] **Step 1: Replace sys.path block**

Replace lines 14-28 with same unified pattern (copy from Task 2.1, keep `from db_schema import VS_SAMPLES_DDL, COLUMNS` as `try/except`).

- [ ] **Step 2: Verify**

```powershell
Set-Location "D:\workSpace\.claude\skills\ad-perception\scripts"
python -c "from collector import VSCollector; print('OK')"
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-perception/scripts/collector.py
git commit -m "refactor: update collector.py import to shared scripts/"
```

### Task 2.3: Update overview.py import

**Files:** Modify `D:\workSpace\.claude\skills\ad-ops\scripts\overview.py:24`

- [ ] **Step 1: Add sys.path before the existing import**

Replace `from ad_api import ADClient` with the unified import block:
```python
import sys, os
_scripts_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "scripts"
)
_scripts_dir = os.path.realpath(_scripts_dir)
if not os.path.isdir(_scripts_dir):
    print("错误: 无法定位共享 scripts 目录", file=sys.stderr)
    sys.exit(9)
sys.path.append(_scripts_dir)
try:
    from ad_api import ADClient
except ImportError as e:
    print(f"错误: 无法导入 ad_api: {e}", file=sys.stderr)
    sys.exit(9)
```

- [ ] **Step 2: Verify**

```powershell
Set-Location "D:\workSpace\.claude\skills\ad-ops\scripts"
python -c "from overview import build_overview; print('OK')"
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-ops/scripts/overview.py
git commit -m "refactor: add shared scripts import to overview.py"
```

### Task 2.4: Update all test files import

**Files:** Modify `D:\workSpace\test\test_perception.py:3`, `test_overview.py:10`, `test_collector.py:8-18`

- [ ] **Step 1: Update test_perception.py**

Add after the existing `sys.path.insert` (keep it for importing perception module):
```python
# Add shared scripts/ for ad_api dependency
_scripts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts")
sys.path.append(os.path.realpath(_scripts_dir))
```

- [ ] **Step 2: Update test_overview.py** — same addition

- [ ] **Step 3: Update test_collector.py**

Replace the existing `sys.path.insert` to `ad-perception/scripts` with:
```python
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-perception", "scripts"))
# Add shared scripts/ for ad_api and db_schema
_scripts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts")
sys.path.append(os.path.realpath(_scripts_dir))
```

- [ ] **Step 4: Run all existing tests to verify no regressions**

```powershell
Set-Location "D:\workSpace\test"
python -m unittest discover -p "test_*.py" -v
```

Expected: 65 tests, all pass

- [ ] **Step 5: Commit**

```bash
git add test/test_perception.py test/test_overview.py test/test_collector.py
git commit -m "refactor: update test imports for shared scripts/"
```

---

## Phase 3: ADClient Unification (Parallel Agents)

### Task 3.1: Unify check.py — delete embedded ADClient

**Files:** Modify `D:\workSpace\.claude\skills\ad-check-analysis\scripts\check.py:25-157`

- [ ] **Step 1: Add unified import at top**

After `import time`, before `from typing import ...`:
```python
import sys, os
_scripts_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "scripts"
)
_scripts_dir = os.path.realpath(_scripts_dir)
if not os.path.isdir(_scripts_dir):
    print("错误: 无法定位共享 scripts 目录", file=sys.stderr)
    sys.exit(9)
sys.path.append(_scripts_dir)
try:
    from ad_api import ADClient, ADError, ADAuthError, ADAPIError, ADConnectionError
except ImportError as e:
    print(f"错误: 无法导入 ad_api: {e}", file=sys.stderr)
    sys.exit(9)
```

- [ ] **Step 2: Delete embedded ADClient class**

Remove lines 25-157 (the entire `class ADClient:` in check.py).

- [ ] **Step 3: Replace all self._json_request / self._raw_request calls**

- `self._json_request("GET", "/api/lb/current-version/sys/offline-check/")` → `client._request("GET", "/sys/offline-check/")`
- `self._json_request("GET", "/api/lb/current-version/debug/sys/offline-check", params={"type":"history"})` → `client._request("GET", "/debug/sys/offline-check", params={"type":"history"})`
- `self._json_request("GET", "/api/lb/current-version/debug/sys/offline-check", params={"type":"progress"})` → `client._request("GET", "/debug/sys/offline-check", params={"type":"progress"})`
- `self._json_request("POST", "/api/lb/current-version/debug/sys/offline-check", data={"scene": scene}, params=...)` → `client._request("POST", "/debug/sys/offline-check", data={"scene": scene}, params=...)`
- `self._json_request("GET", "/api/lb/current-version/debug/sys/offline-check", params={"type":"download",...})` → `client._request("GET", "/debug/sys/offline-check", params={"type":"download",...})`
- `self._raw_request(f"/cgi/file-resource?d={file_token}")` → `client._raw_request(f"/cgi/file-resource?d={file_token}")`

- [ ] **Step 4: Add try/except for HTTP error handling**

In `start_check()` and `wait_and_download()`, wrap ADClient calls that replace old `_json_request` (which returned error dicts) with try/except to preserve the existing "check response for items" pattern:

```python
try:
    scenes = client._request("GET", "/sys/offline-check/")
except (ADConnectionError, ADAuthError, ADAPIError) as e:
    raise RuntimeError(f"API 调用失败: {e}")
```

- [ ] **Step 5: Implement exit code mapping in main()**

Replace generic `except Exception as e: ... sys.exit(1)` with specific mappings per design doc §4.1.

- [ ] **Step 6: Verify syntax**

```powershell
Set-Location "D:\workSpace\.claude\skills\ad-check-analysis\scripts"
python -c "from check import ADClient; print('OK')"
```

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/ad-check-analysis/scripts/check.py
git commit -m "refactor: check.py uses shared ADClient, deletes embedded copy"
```

### Task 3.2: Unify blackbox.py — delete embedded ADClient

**Files:** Modify `D:\workSpace\.claude\skills\ad-blackbox-analysis\scripts\blackbox.py:30-99`

- [ ] **Step 1: Add unified import at top**

Same pattern as Task 3.1 Step 1, adjusted for blackbox path.

- [ ] **Step 2: Delete embedded ADClient class**

Remove lines 30-99.

- [ ] **Step 3: Replace calls**

- `self._request("POST", "/log/blackbox-log/export", data={...})` → `client._request("POST", "/log/blackbox-log/export", data={...})`
- `self.get_task_status()` → `client.get_last_event()`
- `self.download_file(token, path)` → use `client._raw_request()` + local file write

- [ ] **Step 4: Remove standalone get_task_status() URL construction**

The old code directly constructed `/api/lb/current-version/last-event` URL. Replace with `client.get_last_event()`.

- [ ] **Step 5: Implement exit code mapping in main()**

Per design doc §4.2.

- [ ] **Step 6: Verify syntax**

```powershell
Set-Location "D:\workSpace\.claude\skills\ad-blackbox-analysis\scripts"
python -c "from blackbox import ADClient; print('OK')"
```

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/ad-blackbox-analysis/scripts/blackbox.py
git commit -m "refactor: blackbox.py uses shared ADClient, deletes embedded copy"
```

> **Dispatch Tasks 3.1 and 3.2 as parallel agents.** They operate on disjoint files.

---

## Phase 4: Check Enhancement

### Task 4.1: Add optimization suggestions to check.py analyze()

**Files:** Modify `D:\workSpace\.claude\skills\ad-check-analysis\scripts\check.py`

- [ ] **Step 1: Add _SUGGESTION_MAP after imports**

```python
_SUGGESTION_MAP = {
    "CPU_CHECK": {
        "fail": ("CPU 使用率过高，建议排查高负载进程或考虑扩容", "高"),
        "warn": ("CPU 使用率偏高，建议持续监控", "中"),
    },
    "MEMORY_CHECK": {
        "fail": ("内存使用率过高，建议排查内存泄漏或考虑扩容", "高"),
        "warn": ("内存使用率偏高", "中"),
    },
    "DISK_CHECK": {
        "fail": ("磁盘使用率严重，建议清理日志或扩容", "高"),
        "warn": ("磁盘空间偏低", "中"),
    },
    "FAN_STATE_CHECK": {
        "fail": ("风扇故障，需立即检查硬件", "高"),
    },
    "POWER_STATE_CHECK": {
        "fail": ("电源异常，需立即检查硬件", "高"),
    },
    "SSH_API_CHECK": {
        "fail": ("SSH 配置存在安全风险", "中"),
    },
    "WEAK_PASSWORD_CHECK": {
        "fail": ("存在弱密码账户，建议修改", "高"),
    },
}
```

- [ ] **Step 2: Extend analyze() to generate suggestions**

In `analyze()`, after the existing `cat_summary()` logic, add:
```python
suggestions = []
for category, checks in [("feature", feature_results), ("health", health_results), ("secure", secure_results)]:
    for check in checks:
        status = check.get("status", "")
        check_name = check.get("check_name", "")
        if status in ("fail", "warn") and check_name in _SUGGESTION_MAP:
            rule = _SUGGESTION_MAP[check_name].get(status)
            if rule:
                suggestions.append({
                    "priority": rule[1],
                    "suggestion": rule[0],
                    "check": check_name,
                })
suggestions.sort(key=lambda s: {"高": 0, "中": 1, "低": 2}.get(s["priority"], 3))
analysis["suggestions"] = suggestions
```

- [ ] **Step 3: Extend analyze() to generate health_scores**

```python
def _calc_score(checks):
    total = len(checks)
    if total == 0:
        return {"pass": 0, "warn": 0, "fail": 0, "total": 0, "score": 0}
    n_pass = sum(1 for c in checks if c.get("status") == "pass")
    n_warn = sum(1 for c in checks if c.get("status") == "warn")
    n_fail = total - n_pass - n_warn
    score = round((n_pass + n_warn * 0.5) / total * 100)
    return {"pass": n_pass, "warn": n_warn, "fail": n_fail, "total": total, "score": score}

analysis["health_scores"] = {
    "feature": _calc_score(feature_results),
    "health": _calc_score(health_results),
    "secure": _calc_score(secure_results),
}
analysis["health_scores"]["overall"] = round(
    (analysis["health_scores"]["feature"]["score"] +
     analysis["health_scores"]["health"]["score"] +
     analysis["health_scores"]["secure"]["score"]) / 3
)
```

- [ ] **Step 4: Update render_markdown() to output suggestions and health_scores**

After the existing 统计汇总 table, add:
```python
# 优化建议
suggestions = analysis.get("suggestions", [])
if suggestions:
    a("### 💡 优化建议")
    a("| 优先级 | 建议 |")
    a("|--------|------|")
    for s in suggestions:
        icon = {"高": "🔴", "中": "🟡", "低": "🟢"}.get(s["priority"], "")
        a(f"| {icon} {s['priority']} | {s['suggestion']} |")
    a("")

# 健康评分
hs = analysis.get("health_scores", {})
if hs:
    a("### ✅ 健康评分")
    a("| 类别 | 检查项数 | 通过 | 评分 |")
    a("|------|----------|------|------|")
    for key, label in [("feature", "功能巡检"), ("health", "健康巡检"), ("secure", "安全巡检")]:
        item = hs.get(key, {})
        a(f"| {label} | {item.get('total', 0)} | {item.get('pass', 0)} | {item.get('score', 0)}/100 |")
    a(f"| **综合评分** | | | **{hs.get('overall', 0)}/100** |")
    a("")
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/ad-check-analysis/scripts/check.py
git commit -m "feat: add optimization suggestions and health scores to check.py"
```

---

## Phase 5: Test Suite (Parallel Agents)

### Task 5.1: Create test/test_ad_api.py

**Files:** Create `D:\workSpace\test\test_ad_api.py`

This tests the shared ADClient at the `urllib.request.urlopen` layer.

- [ ] **Step 1: Write the test file**

```python
#!/usr/bin/env python3
"""Unit tests for ad_api.py — shared ADClient."""
import sys, os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))

import unittest
import json
import urllib.request
import urllib.error
from unittest.mock import patch, MagicMock
from io import BytesIO

from ad_api import (
    ADClient, ADError, ADConnectionError, ADAuthError, ADAPIError
)


class TestADClientHTTP(unittest.TestCase):
    """Test ADClient._request at the urlopen layer."""

    def setUp(self):
        self.client = ADClient(host="https://10.0.0.1", username="admin", password="test123")

    def _mock_response(self, status=200, body=None):
        if body is None:
            body = {"status": "ok"}
        resp = MagicMock()
        resp.read.return_value = json.dumps(body).encode("utf-8")
        resp.status = status
        # urlopen returns a context manager
        cm = MagicMock()
        cm.__enter__.return_value = resp
        cm.__exit__.return_value = None
        return cm

    # ---- Normal paths ----

    @patch("urllib.request.urlopen")
    def test_get_users_correct_url(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response()
        self.client.get_users()
        req = mock_urlopen.call_args[0][0]
        self.assertIn("/api/lb/current-version/sys/user/", req.full_url)

    @patch("urllib.request.urlopen")
    def test_get_users_auth_header(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response()
        self.client.get_users()
        req = mock_urlopen.call_args[0][0]
        auth = req.get_header("Authorization")
        self.assertIsNotNone(auth)
        self.assertTrue(auth.startswith("Basic "))

    @patch("urllib.request.urlopen")
    def test_get_virtual_services_endpoint(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response({"items": []})
        result = self.client.get_virtual_services()
        req = mock_urlopen.call_args[0][0]
        self.assertIn("/slb/virtual-service/", req.full_url)
        self.assertEqual(result, {"items": []})

    @patch("urllib.request.urlopen")
    def test_get_ssl_certificates(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response({"items": [{"name": "cert1"}]})
        result = self.client.get_ssl_certificates()
        self.assertEqual(result["items"][0]["name"], "cert1")

    @patch("urllib.request.urlopen")
    def test_get_sys_system(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response({"cpu_usage": 50.0})
        result = self.client.get_sys_system()
        self.assertEqual(result["cpu_usage"], 50.0)

    @patch("urllib.request.urlopen")
    def test_get_last_event(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response({"items": [{"event_id": "ev1"}]})
        result = self.client.get_last_event()
        req = mock_urlopen.call_args[0][0]
        self.assertIn("/last-event", req.full_url)

    # ---- Write operations ----

    @patch("urllib.request.urlopen")
    def test_create_user_post_body(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response()
        self.client.create_user({"name": "testuser", "password": "pwd"})
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.method, "POST")
        body = json.loads(req.data.decode())
        self.assertEqual(body["name"], "testuser")

    @patch("urllib.request.urlopen")
    def test_delete_user_method(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response()
        self.client.delete_user("testuser")
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.method, "DELETE")
        self.assertIn("/sys/user/testuser", req.full_url)

    # ---- params support ----

    @patch("urllib.request.urlopen")
    def test_params_appended_to_url(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response()
        self.client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
        req = mock_urlopen.call_args[0][0]
        self.assertIn("type=history", req.full_url)

    @patch("urllib.request.urlopen")
    def test_params_merged_with_existing_query(self, mock_urlopen):
        mock_urlopen.return_value = self._mock_response()
        self.client._request("GET", "/endpoint?existing=1", params={"new": "2"})
        req = mock_urlopen.call_args[0][0]
        self.assertIn("existing=1", req.full_url)
        self.assertIn("new=2", req.full_url)

    # ---- Error handling ----

    @patch("urllib.request.urlopen")
    def test_http_401_raises_auth_error(self, mock_urlopen):
        error_response = BytesIO(b'{"error": "unauthorized"}')
        mock_urlopen.side_effect = urllib.error.HTTPError(
            "https://10.0.0.1/", 401, "Unauthorized", {}, error_response
        )
        with self.assertRaises(ADAuthError) as cm:
            self.client.get_users()
        self.assertEqual(cm.exception.http_code, 401)

    @patch("urllib.request.urlopen")
    def test_http_500_raises_api_error(self, mock_urlopen):
        error_response = BytesIO(b'{"error": "internal"}')
        mock_urlopen.side_effect = urllib.error.HTTPError(
            "https://10.0.0.1/", 500, "Internal Error", {}, error_response
        )
        with self.assertRaises(ADAPIError) as cm:
            self.client.get_users()
        self.assertEqual(cm.exception.http_code, 500)

    @patch("urllib.request.urlopen")
    def test_connection_error(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.URLError("timeout")
        with self.assertRaises(ADConnectionError):
            self.client.get_users()

    # ---- _raw_request ----

    @patch("urllib.request.urlopen")
    def test_raw_request_returns_bytes(self, mock_urlopen):
        resp = MagicMock()
        resp.read.return_value = b"file content"
        cm = MagicMock()
        cm.__enter__.return_value = resp
        cm.__exit__.return_value = None
        mock_urlopen.return_value = cm
        result = self.client._raw_request("/cgi/file-resource?d=token123")
        self.assertEqual(result, b"file content")

    def test_raw_request_rejects_path_traversal(self):
        with self.assertRaises(ValueError):
            self.client._raw_request("/cgi/../../../etc/passwd")

    def test_raw_request_rejects_non_cgi_path(self):
        with self.assertRaises(ValueError):
            self.client._raw_request("/etc/hosts")

    # ---- ADError base class ----

    def test_ad_error_original_chaining(self):
        orig = Exception("root cause")
        err = ADConnectionError("connection failed", original=orig)
        self.assertEqual(err.original, orig)
        self.assertIn("connection failed", str(err))


class TestADClientInstance(unittest.TestCase):
    """Test ADClient instance creation and configuration."""

    def test_host_trailing_slash_stripped(self):
        client = ADClient(host="https://10.0.0.1/")
        self.assertEqual(client.host, "https://10.0.0.1")

    def test_ssl_context_no_verify(self):
        client = ADClient(host="https://10.0.0.1")
        self.assertEqual(client.ssl_context.verify_mode, 0)  # ssl.CERT_NONE
        self.assertFalse(client.ssl_context.check_hostname)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests**

```powershell
Set-Location "D:\workSpace\test"
python test_ad_api.py -v
```

Expected: 18 tests pass

- [ ] **Step 3: Commit**

```bash
git add test/test_ad_api.py
git commit -m "test: add ad_api.py unit tests (18 cases, urlopen layer mock)"
```

### Task 5.2: Create test/test_check.py

**Files:** Create `D:\workSpace\test\test_check.py`

- [ ] **Step 1: Write the test file**

```python
#!/usr/bin/env python3
"""Unit tests for check.py — AD inspection workflow."""
import sys, os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-check-analysis", "scripts"))

import unittest
import json
import tempfile
from unittest.mock import patch, MagicMock
from datetime import datetime

from check import (
    start_check, wait_and_download, analyze, render_markdown,
    _SUGGESTION_MAP,
)
from ad_api import ADError, ADAuthError, ADAPIError, ADConnectionError


class TestStartCheck(unittest.TestCase):
    """Test start_check state machine."""

    def setUp(self):
        self.client = MagicMock()
        self.client.host = "https://10.0.0.1"
        self.tmpdir = tempfile.TemporaryDirectory()
        self.work_dir = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_scenes_list_success(self):
        self.client._request.side_effect = [
            {"items": [{"name": "标准巡检"}, {"name": "全量巡检"}]},  # scenes
            {"items": []},  # history (empty)
            {"event_id": "ev123"},  # run result
        ]
        result = start_check(self.client, "标准巡检", work_dir=self.work_dir)
        self.assertIn("event_id", result)

    def test_scene_not_found(self):
        self.client._request.return_value = {"items": [{"name": "标准巡检"}]}
        with self.assertRaises(RuntimeError) as cm:
            start_check(self.client, "不存在的场景", work_dir=self.work_dir)
        self.assertIn("不存在", str(cm.exception))

    def test_record_limit_reached_without_force(self):
        self.client._request.side_effect = [
            {"items": [{"name": "标准巡检"}]},
            {"items": [{}, {}, {}, {}, {}]},  # 5 records
        ]
        with self.assertRaises(RuntimeError) as cm:
            start_check(self.client, "标准巡检", force=False, work_dir=self.work_dir)
        self.assertIn("上限", str(cm.exception))

    def test_record_limit_with_force(self):
        self.client._request.side_effect = [
            {"items": [{"name": "标准巡检"}]},
            {"items": [{}, {}, {}, {}, {}]},
            {"event_id": "ev456"},
        ]
        result = start_check(self.client, "标准巡检", force=True, work_dir=self.work_dir)
        self.assertEqual(result["event_id"], "ev456")

    def test_scenes_api_auth_error(self):
        self.client._request.side_effect = ADAuthError("HTTP 401", http_code=401)
        with self.assertRaises(RuntimeError):
            start_check(self.client, "标准巡检", work_dir=self.work_dir)

    def test_scenes_api_connection_error(self):
        self.client._request.side_effect = ADConnectionError("timeout")
        with self.assertRaises(RuntimeError):
            start_check(self.client, "标准巡检", work_dir=self.work_dir)


class TestAnalyze(unittest.TestCase):
    """Test analyze() pure function with mock check results."""

    def setUp(self):
        self.sample_data = {
            "check_results": {
                "cpu_check": {"status": "pass", "value": "17%"},
                "memory_check": {"status": "pass", "value": "42%"},
                "disk_check": {"status": "warn", "disk_usage": "/ 82%"},
                "fan_state_check": {"status": "pass"},
                "power_state_check": {"status": "pass"},
                "kernel_log_check": {"status": "pass"},
                "nic_state_check": {"status": "pass"},
            },
            "feature_scene": {"rule": ["APP_VERSION_CHECK", "ADMIN_ROLE_CHECK"]},
            "health_scene": {"rule": ["CPU_CHECK", "MEMORY_CHECK", "DISK_CHECK"]},
            "secure_scene": {"rule": ["SSH_API_CHECK", "WEAK_PASSWORD_CHECK"]},
        }

    def test_analyze_finds_suggestions(self):
        result = analyze(self.sample_data)
        suggestions = result.get("suggestions", [])
        self.assertTrue(len(suggestions) > 0, "Should generate at least one suggestion")
        priorities = {s["priority"] for s in suggestions}
        self.assertTrue(priorities.issubset({"高", "中", "低"}))

    def test_analyze_health_scores(self):
        result = analyze(self.sample_data)
        hs = result.get("health_scores", {})
        self.assertIn("feature", hs)
        self.assertIn("health", hs)
        self.assertIn("secure", hs)
        self.assertIn("overall", hs)
        for key in ("feature", "health", "secure"):
            item = hs[key]
            self.assertIn("score", item)
            self.assertIn("pass", item)
            self.assertIn("total", item)

    def test_analyze_all_pass_no_suggestions(self):
        """When all checks pass, no suggestions and perfect scores."""
        data = {
            "check_results": {
                "cpu_check": {"status": "pass", "value": "17%"},
                "memory_check": {"status": "pass", "value": "42%"},
            },
            "feature_scene": {"rule": []},
            "health_scene": {"rule": ["CPU_CHECK", "MEMORY_CHECK"]},
            "secure_scene": {"rule": []},
        }
        result = analyze(data)
        suggestions = result.get("suggestions", [])
        self.assertEqual(len(suggestions), 0)


class TestRenderMarkdown(unittest.TestCase):
    """Test render_markdown output structure."""

    def test_render_includes_suggestions_table(self):
        analysis = {
            "suggestions": [
                {"priority": "高", "suggestion": "Test suggestion", "check": "CPU_CHECK"}
            ],
            "health_scores": {
                "feature": {"pass": 2, "total": 2, "score": 100},
                "health": {"pass": 3, "total": 3, "score": 100},
                "secure": {"pass": 1, "total": 1, "score": 100},
                "overall": 100,
            },
        }
        meta = {"device_info": {}, "check_time": "2026-01-01 00:00:00"}
        output = render_markdown(analysis, meta)
        self.assertIn("优化建议", output)
        self.assertIn("健康评分", output)
        self.assertIn("100/100", output)

    def test_render_empty_suggestions_omitted(self):
        analysis = {
            "suggestions": [],
            "health_scores": {},
        }
        meta = {"device_info": {}, "check_time": "2026-01-01 00:00:00"}
        output = render_markdown(analysis, meta)
        self.assertNotIn("优化建议", output)


class TestExitCodes(unittest.TestCase):
    """Test exit code mappings."""

    def test_scene_not_found_exit_4(self):
        with patch("sys.argv", [
            "check.py", "run", "--host", "https://10.0.0.1", "--password", "test",
            "--scene", "不存在的场景"
        ]):
            with patch("check.ADClient") as mock_client_class:
                mock_client = MagicMock()
                mock_client._request.return_value = {"items": [{"name": "标准巡检"}]}
                mock_client_class.return_value = mock_client
                with self.assertRaises(SystemExit) as cm:
                    from check import main
                    main()
                self.assertEqual(cm.exception.code, 4)

    def test_auth_failure_exit_2(self):
        with patch("sys.argv", [
            "check.py", "run", "--host", "https://10.0.0.1", "--password", "wrong",
            "--scene", "标准巡检"
        ]):
            with patch("check.ADClient") as mock_client_class:
                mock_client = MagicMock()
                mock_client._request.side_effect = ADAuthError("HTTP 401", http_code=401)
                mock_client_class.return_value = mock_client
                with self.assertRaises(SystemExit) as cm:
                    from check import main
                    main()
                self.assertEqual(cm.exception.code, 2)

    def test_missing_password_exit_4(self):
        with patch("sys.argv", ["check.py", "run", "--host", "https://10.0.0.1"]):
            with patch.dict("os.environ", {}, clear=True):
                with self.assertRaises(SystemExit) as cm:
                    from check import main
                    main()
                self.assertEqual(cm.exception.code, 4)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests**

```powershell
Set-Location "D:\workSpace\test"
python test_check.py -v
```

Expected: 12 tests pass

- [ ] **Step 3: Commit**

```bash
git add test/test_check.py
git commit -m "test: add check.py unit tests (12 cases, state machine + analyze + render + exit codes)"
```

### Task 5.3: Create test/test_blackbox.py

**Files:** Create `D:\workSpace\test\test_blackbox.py`

- [ ] **Step 1: Write the test file**

```python
#!/usr/bin/env python3
"""Unit tests for blackbox.py — AD blackbox log analysis."""
import sys, os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "ad-blackbox-analysis", "scripts"))

import unittest
import json
import tempfile
import os as _os
from unittest.mock import patch, MagicMock
from io import StringIO

from blackbox import BlackboxAnalyzer, generate_report
from ad_api import ADError, ADAuthError, ADAPIError, ADConnectionError


class TestBlackboxAnalyzer(unittest.TestCase):
    """Test BlackboxAnalyzer without real ZIP files."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.extract_path = self.tmpdir.name

    def tearDown(self):
        self.tmpdir.cleanup()

    def _create_audit_log(self, date="20260519", lines=None):
        """Create a fake audit log directory structure."""
        audit_dir = _os.path.join(self.extract_path, "hislog", "hislog", f"{date}.audit", "zh_CN")
        _os.makedirs(audit_dir, exist_ok=True)
        if lines is None:
            lines = [
                '"2026-05-19 10:00:00","admin","10.0.0.1","POST","system","user","SUCCESS","/api/user","0","创建用户"',
                '"2026-05-19 10:30:00","admin","10.0.0.1","DELETE","system","user","FAILED","/api/user","1","权限不足"',
            ]
        with open(_os.path.join(audit_dir, "0.audit.csv"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

    def _create_system_log(self, date="20260519"):
        log_dir = _os.path.join(self.extract_path, "hislog", "log", date, "zh_CN", "0")
        _os.makedirs(log_dir, exist_ok=True)
        with open(_os.path.join(log_dir, f"kernel-{date}.csv"), "w", encoding="utf-8") as f:
            f.write("kernel log line 1\nkernel log line 2\n")

    def test_get_available_dates(self):
        self._create_audit_log("20260519")
        self._create_audit_log("20260518")
        analyzer = BlackboxAnalyzer(self.extract_path)
        dates = analyzer.get_available_dates()
        self.assertEqual(len(dates), 2)
        self.assertIn("20260519", dates)
        self.assertIn("20260518", dates)

    def test_get_available_dates_empty(self):
        analyzer = BlackboxAnalyzer(self.extract_path)
        dates = analyzer.get_available_dates()
        self.assertEqual(dates, [])

    def test_analyze_audit_logs_parse_correctly(self):
        self._create_audit_log("20260519")
        analyzer = BlackboxAnalyzer(self.extract_path)
        results = analyzer.analyze_audit_logs(["20260519"])
        self.assertIn("20260519", results)
        self.assertEqual(results["20260519"]["count"], 2)
        records = results["20260519"]["records"]
        self.assertEqual(records[0]["user"], "admin")
        self.assertEqual(records[0]["status"], "SUCCESS")
        self.assertEqual(records[1]["status"], "FAILED")

    def test_analyze_audit_logs_methods_count(self):
        self._create_audit_log("20260519")
        analyzer = BlackboxAnalyzer(self.extract_path)
        results = analyzer.analyze_audit_logs(["20260519"])
        methods = results["20260519"]["methods"]
        self.assertEqual(methods["POST"], 1)
        self.assertEqual(methods["DELETE"], 1)

    def test_analyze_system_logs(self):
        self._create_system_log("20260519")
        analyzer = BlackboxAnalyzer(self.extract_path)
        results = analyzer.analyze_system_logs("20260519")
        self.assertIn("kernel", results)
        self.assertEqual(results["kernel"]["count"], 2)

    def test_analyze_system_logs_empty_dir(self):
        analyzer = BlackboxAnalyzer(self.extract_path)
        results = analyzer.analyze_system_logs("20260519")
        self.assertEqual(results, {})

    def test_count_field(self):
        analyzer = BlackboxAnalyzer(self.extract_path)
        records = [
            {"method": "POST", "user": "admin"},
            {"method": "POST", "user": "admin"},
            {"method": "GET", "user": "guest"},
        ]
        result = analyzer._count_field(records, "method")
        self.assertEqual(result["POST"], 2)
        self.assertEqual(result["GET"], 1)

    def test_generate_report_structure(self):
        results = {
            "20260519": {
                "count": 2,
                "records": [],
                "methods": {"POST": 2},
                "users": {"admin": 2},
                "statuses": {"SUCCESS": 2},
            }
        }
        report = generate_report(results)
        self.assertIn("黑盒日志分析报告", report)
        self.assertIn("20260519", report)
        self.assertIn("2", report)


class TestBlackboxExitCodes(unittest.TestCase):
    """Test blackbox.py exit code mappings."""

    def test_missing_args_exit_4(self):
        with patch("sys.argv", ["blackbox.py"]):
            with self.assertRaises(SystemExit) as cm:
                from blackbox import main
                main()
            self.assertEqual(cm.exception.code, 4)

    def test_auth_failure_exit_2(self):
        with patch("sys.argv", [
            "blackbox.py", "--host", "https://10.0.0.1", "--password", "wrong",
            "--from-date", "2026-05-01", "--to-date", "2026-05-08",
            "--archive-password", "admin"
        ]):
            with patch("blackbox.ADClient") as mock_client_class:
                mock_client = MagicMock()
                mock_client._request.side_effect = ADAuthError("HTTP 401", http_code=401)
                mock_client_class.return_value = mock_client
                with self.assertRaises(SystemExit) as cm:
                    from blackbox import main
                    main()
                self.assertEqual(cm.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests**

```powershell
Set-Location "D:\workSpace\test"
python test_blackbox.py -v
```

Expected: 9 tests pass

- [ ] **Step 3: Commit**

```bash
git add test/test_blackbox.py
git commit -m "test: add blackbox.py unit tests (9 cases, analyzer + report + exit codes)"
```

### Task 5.4: Create test/run_all.py

**Files:** Create `D:\workSpace\test\run_all.py`

- [ ] **Step 1: Write run_all.py** (use exact code from design doc §2.5)

- [ ] **Step 2: Verify all tests pass via run_all.py**

```powershell
Set-Location "D:\workSpace\test"
python run_all.py
```

Expected: 104 tests (65 existing + 18 ad_api + 12 check + 9 blackbox), all pass, exit 0

- [ ] **Step 3: Commit**

```bash
git add test/run_all.py
git commit -m "feat: add run_all.py test runner"
```

> **Dispatch Tasks 5.1, 5.2, 5.3 as parallel agents.** They create independent test files.

---

## Phase 6: SKILL.md Unification (Parallel Agents)

### Task 6.1: Rewrite ad-ops SKILL.md

**Files:** Rewrite `D:\workSpace\.claude\skills\ad-ops\SKILL.md`

Replace entire content with ~130-line unified template. Key sections: 功能概述、CLI 命令参考（path updated to `python scripts/ad_api.py`）、脚本强制规则、已知设备、行为准则（必须+禁止）、报告展示规则、外部依赖（`scripts/ad_api.py`）、错误码（0/1/2/4/5/9）、相关技能.

Fix: `ad_ops` → `ad-ops` in Quick Start example.

- [ ] **Commit**

```bash
git add .claude/skills/ad-ops/SKILL.md
git commit -m "docs: rewrite ad-ops SKILL.md to unified template"
```

### Task 6.2: Rewrite ad-check-analysis SKILL.md

**Files:** Rewrite `D:\workSpace\.claude\skills\ad-check-analysis\SKILL.md`

Delete 70-line report template, add error code table, external dependencies, behavior rules. Keep scene selection rules, async task mechanism, progress status table.

- [ ] **Commit**

```bash
git add .claude/skills/ad-check-analysis/SKILL.md
git commit -m "docs: rewrite ad-check-analysis SKILL.md to unified template"
```

### Task 6.3: Rewrite ad-blackbox-analysis SKILL.md

**Files:** Rewrite `D:\workSpace\.claude\skills\ad-blackbox-analysis\SKILL.md`

Add behavior rules, error codes, related skills, report display rules. Fix API path reference. Update CLI path format.

- [ ] **Commit**

```bash
git add .claude/skills/ad-blackbox-analysis/SKILL.md
git commit -m "docs: rewrite ad-blackbox-analysis SKILL.md to unified template"
```

### Task 6.4: Tune ad-perception SKILL.md

**Files:** Modify `D:\workSpace\.claude\skills\ad-perception\SKILL.md`

Reorder sections to match template. Update external dependency path to `scripts/ad_api.py`.

- [ ] **Commit**

```bash
git add .claude/skills/ad-perception/SKILL.md
git commit -m "docs: align ad-perception SKILL.md to unified template"
```

> **Dispatch Tasks 6.1-6.4 as parallel agents.** They operate on disjoint files.

---

## Phase 7: Cleanup

### Task 7.1: Create .gitignore and remove __pycache__

- [ ] **Step 1: Create .gitignore**

```powershell
Set-Content -Path "D:\workSpace\.gitignore" -Value "__pycache__/"
Add-Content -Path "D:\workSpace\.gitignore" -Value "*.bak"
```

- [ ] **Step 2: Remove tracked .pyc files**

```powershell
git rm --cached .claude/skills/ad-check-analysis/scripts/__pycache__/check.cpython-312.pyc
git rm --cached .claude/skills/ad-check-analysis/scripts/__pycache__/check.cpython-314.pyc
git rm --cached .claude/skills/ad-ops/scripts/__pycache__/ad_api.cpython-314.pyc
git rm --cached .claude/skills/ad-ops/scripts/__pycache__/overview.cpython-314.pyc
git rm --cached .claude/skills/ad-perception/scripts/__pycache__/collector.cpython-314.pyc
git rm --cached .claude/skills/ad-perception/scripts/__pycache__/db_schema.cpython-314.pyc
git rm --cached .claude/skills/ad-perception/scripts/__pycache__/perception.cpython-314.pyc
git rm --cached test/__pycache__/__init__.cpython-314.pyc
git rm --cached test/__pycache__/test_collector.cpython-314.pyc
git rm --cached test/__pycache__/test_overview.cpython-314.pyc
git rm --cached test/__pycache__/test_perception.cpython-314.pyc
```

- [ ] **Step 3: Delete old .bak files**

```powershell
Remove-Item "D:\workSpace\.claude\skills\ad-ops\scripts\ad_api.py.bak"
Remove-Item "D:\workSpace\.claude\skills\ad-perception\scripts\db_schema.py.bak"
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore, remove __pycache__ and .bak files"
```

---

## Phase 8: Verification — Real Device End-to-End

### Task 8.1: Full test suite pass

- [ ] **Run complete test suite**

```powershell
Set-Location "D:\workSpace\test"
python run_all.py
```

Expected: 104 tests pass, exit 0. On failure: debug before proceeding.

### Task 8.2: Real device — AD overview

- [ ] **Test overview.py on real AD1 device**

```powershell
$env:AD_PASS = "<real_password>"
python "D:\workSpace\.claude\skills\ad-ops\scripts\overview.py" all --host https://<AD1_IP> --format markdown
```

Verify: Markdown output contains Device Info / Virtual Services / SSL Certificates / Hardware Status sections. No import errors.

- [ ] **Test overview.py JSON output**

```powershell
python "D:\workSpace\.claude\skills\ad-ops\scripts\overview.py" all --host https://<AD1_IP> --format json
```

Verify: Valid JSON with `device`, `virtual_services`, `certificates`, `hardware` keys.

### Task 8.3: Real device — Perception analysis

- [ ] **Test perception.py state analysis**

```powershell
python "D:\workSpace\.claude\skills\ad-perception\scripts\perception.py" state --host https://<AD1_IP>
```

Verify: CPU/memory/fan/power/interface status output. No import errors.

- [ ] **Test perception.py conflict analysis**

```powershell
python "D:\workSpace\.claude\skills\ad-perception\scripts\perception.py" conflict --host https://<AD1_IP>
```

Verify: VS overlap and pool overlap detection output.

- [ ] **Test perception.py traffic analysis (API fallback)**

```powershell
python "D:\workSpace\.claude\skills\ad-perception\scripts\perception.py" traffic --host https://<AD1_IP>
```

Verify: "数据不足" message or trend data table.

### Task 8.4: Real device — Check inspection

- [ ] **Test check.py scenes**

```powershell
python "D:\workSpace\.claude\skills\ad-check-analysis\scripts\check.py" scenes --host https://<AD1_IP>
```

Verify: Available inspection scenes listed.

- [ ] **Test check.py run (dry-run by checking limit)**

```powershell
python "D:\workSpace\.claude\skills\ad-check-analysis\scripts\check.py" history --host https://<AD1_IP>
```

Verify: History records listed.

### Task 8.5: Real device — Blackbox export (conditional)

- [ ] **Test blackbox.py import only**

```powershell
Set-Location "D:\workSpace\.claude\skills\ad-blackbox-analysis\scripts"
python -c "from blackbox import ADClient; print('import OK')"
```

Verify: `import OK` (shared ADClient import works).

- [ ] **If blackbox API path is confirmed valid on device, test full export**

```powershell
python "D:\workSpace\.claude\skills\ad-blackbox-analysis\scripts\blackbox.py" `
  --host https://<AD1_IP> --from-date 2026-05-18 --to-date 2026-05-19 --archive-password <pwd>
```

### Task 8.6: Multi-agent simulation — LLM usage scenario

This task simulates how an LLM + agent would invoke these skills in production.

- [ ] **Scenario 1: "给我 AD1 的设备总览"**

LLM dispatches:
```powershell
python "D:\workSpace\.claude\skills\ad-ops\scripts\overview.py" all --host https://<AD1_IP>
```
Verify: Markdown output complete, all sections rendered, no errors in stderr.

- [ ] **Scenario 2: "分析 AD1 的异常情况"**

LLM dispatches:
```powershell
python "D:\workSpace\.claude\skills\ad-perception\scripts\perception.py" analyze --host https://<AD1_IP>
```
Verify: 4-dimension analysis output (traffic/state/logs/conflicts), exit code correct.

- [ ] **Scenario 3: "对 AD1 做标准巡检"**

LLM dispatches (3 steps):
```powershell
# Step 1: Check scenes
python "D:\workSpace\.claude\skills\ad-check-analysis\scripts\check.py" scenes --host https://<AD1_IP>
# Step 2: Run inspection
python "D:\workSpace\.claude\skills\ad-check-analysis\scripts\check.py" run --host https://<AD1_IP> --scene "标准巡检"
# Step 3: Wait for completion + analyze
python "D:\workSpace\.claude\skills\ad-check-analysis\scripts\check.py" wait --host https://<AD1_IP> --work-dir <work_dir_from_step2>
```
Verify: Each step produces expected output. Final report includes optimization suggestions and health scores.

- [ ] **Scenario 4: "导出 AD1 最近一天的黑盒日志"** (if API path confirmed)

```powershell
python "D:\workSpace\.claude\skills\ad-blackbox-analysis\scripts\blackbox.py" `
  --host https://<AD1_IP> --from-date 2026-05-18 --to-date 2026-05-19 --archive-password <pwd>
```
Verify: Export + download + analysis complete.

### Task 8.7: Error path verification

- [ ] **Wrong password → exit 2**

```powershell
python "D:\workSpace\.claude\skills\ad-ops\scripts\overview.py" all --host https://<AD1_IP> --password wrongpassword; echo "Exit: $LASTEXITCODE"
```
Verify: Exit code 2.

- [ ] **Missing host → exit 4**

```powershell
python "D:\workSpace\.claude\skills\ad-perception\scripts\perception.py" state --host ""; echo "Exit: $LASTEXITCODE"
```
Verify: Exit code 4.

- [ ] **Invalid scene → exit 4 (check.py)**

```powershell
python "D:\workSpace\.claude\skills\ad-check-analysis\scripts\check.py" run --host https://<AD1_IP> --scene "不存在的场景" --password test
```
Verify: Exit code 4, message contains "不存在".

### Task 8.8: Final commit

- [ ] **Verify clean state**

```powershell
git status
```

- [ ] **Final commit if any fixes from verification**

```bash
git add -A
git diff --cached --stat
git commit -m "fix: real-device verification fixes"
```

---

## Summary

| Phase | Tasks | Parallel? | Est. Time |
|-------|-------|-----------|-----------|
| 0 | 1 | No | 5 min |
| 1 | 2 | Yes (1.1 ‖ 1.2) | 15 min |
| 2 | 4 | No (sequential) | 15 min |
| 3 | 2 | Yes (3.1 ‖ 3.2) | 20 min |
| 4 | 1 | No | 15 min |
| 5 | 4 | Yes (5.1 ‖ 5.2 ‖ 5.3) | 30 min |
| 6 | 4 | Yes (6.1 ‖ 6.2 ‖ 6.3 ‖ 6.4) | 20 min |
| 7 | 1 | No | 5 min |
| 8 | 8 | Yes (8.1-8.7 on real device) | 45 min |

**Total estimated: ~3 hours** | **Commits: ~18** | **Tests: 65 → 104**
