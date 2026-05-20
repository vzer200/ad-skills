# AD Skills 架构整合 + 测试覆盖 设计文档

> 日期: 2026-05-19 | 状态: v3 (5-agent×2轮 并行审核后修订) | 范围: 4 个 Skill 架构统一 + 测试补全

## 1. 背景

全量分析发现 5 个问题：

| # | 问题 | 影响 |
|---|------|------|
| 1 | check.py / blackbox.py 内嵌独立 ADClient，与 ad_api.py 重复 | SSL bug 三处修复，接口分叉 |
| 2 | 跨 Skill import 用硬编码相对路径 `sys.path.insert` | 目录结构调整即崩溃 |
| 3 | ad_api.py(622行) / check.py(1149行) / blackbox.py(343行) 零测试 | 重构无安全网 |
| 4 | 4 个 SKILL.md 内容密度 47~242 行，缺统一规范 | LLM 信息不对称 |
| 5 | 无测试运行脚本 | 手动逐个跑 |

## 2. 设计决策

### 2.1 ADClient 统一

**目标**：三个脚本共享同一个 `ad_api.ADClient`。

**基础改动**：

1. **`_request()` 加可选 `params` 参数**：`_request(self, method, endpoint, data=None, params=None)`。当 endpoint 和 params 同时含 `?` 时，使用 `urllib.parse.urlparse` 合并 query string；params 中的 key 覆盖 endpoint 中同名 key。

2. **`_raw_request()` 新增**：`_raw_request(url_path)` 返回 `bytes`。输入校验：`url_path.startswith("/cgi/")` 且不包含 `..`，否则抛 `ValueError`。HTTP 4xx/5xx 时与 `_request()` 一致，转换为 `ADAPIError` / `ADAuthError`。

3. **自定义异常类**（统一基类 `ADError(Exception)`）：

```python
class ADError(Exception):
    """AD API 错误基类。"""
    def __init__(self, message, original=None):
        super().__init__(message)
        self.original = original  # 原始异常，用于调试

class ADConnectionError(ADError):
    """连接失败 (URLError, timeout)。"""
    pass

class ADAuthError(ADError):
    """认证失败 (HTTP 401/403)。携带 http_code。"""
    def __init__(self, message, http_code, original=None):
        super().__init__(message, original)
        self.http_code = http_code

class ADAPIError(ADError):
    """API 错误 (HTTP 4xx/5xx 非认证)。携带 http_code 和响应体。"""
    def __init__(self, message, http_code, response_body=None, original=None):
        super().__init__(message, original)
        self.http_code = http_code
        self.response_body = response_body
```

4. **`download_blackbox_log()` 重构**：当前 `ad_api.py:396` 自行构造 `/cgi/file-resource` URL，绕过 `_raw_request` 白名单。改为内部调用 `self._raw_request(f"/cgi/file-resource?d={token}")`，消除重复代码和校验绕过。

5. **`ad_api.py` main() 退出码修正**：缺少 `--host` 或 `--password` 参数时当前 `exit(1)`，改为 `exit(4)`。

6. **新增 `get_last_event()` 公开方法**：签名 `get_last_event() -> Dict[str, Any]`，调用 `_request("GET", "/last-event")`。供 blackbox.py 查询异步任务状态。

**check.py 迁移对照表**：

> 实际签名：check.py `_json_request(self, method, path, data=None, params=None)` 与 ad_api `_request(self, method, endpoint, data=None, params=None)` 参数顺序相同。所有调用点对可选参数使用关键字传参，不存在顺序敏感问题。唯一差异是 path 需去掉 `/api/lb/current-version` 前缀。

| check.py 当前调用 | 迁移后 | 说明 |
|---|---|---|
| `self._json_request("GET", "/api/lb/current-version/sys/offline-check/")` | `client._request("GET", "/sys/offline-check/")` | |
| `self._json_request("GET", ".../debug/sys/offline-check", params={"type":"history"})` | `client._request("GET", "/debug/sys/offline-check", params={"type":"history"})` | |
| `self._json_request("GET", ".../debug/sys/offline-check", params={"type":"progress"})` | `client._request("GET", "/debug/sys/offline-check", params={"type":"progress"})` | NO_RUNNING fallback 逻辑保留在 check.py |
| `self._json_request("POST", ".../debug/sys/offline-check", data={"scene":scene}, params=...)` | `client._request("POST", "/debug/sys/offline-check", data={"scene":scene}, params=...)` | |
| `self._json_request("GET", ".../debug/sys/offline-check", params={"type":"download","key":name,"encrypt":"false"})` | `client._request("GET", "/debug/sys/offline-check", params=...)` | |
| `self._raw_request(f"/cgi/file-resource?d={token}")` | `client._raw_request(f"/cgi/file-resource?d={token}")` | |
| `self.get_check_scenes()` → `_json_request("GET", "...")` | 内联为 `client._request("GET", "/sys/offline-check/")` | 不新增 ADClient 方法 |

**关键行为变化——错误处理**：check.py 内嵌 ADClient 的 `_json_request` 在 HTTP 错误时**返回字典**（`{"error": raw, "http_status": e.code}`），调用方检查响应中的 `items` 字段。迁移后共享 ADClient 在 HTTP 错误时**抛出异常**（`ADAuthError` / `ADAPIError`）。需要在 `start_check()` 和 `wait_and_download()` 的调用点添加 `try/except ADError` 处理，捕获后转为与当前行为兼容的错误信息。

**blackbox.py 迁移对照表**：

| blackbox.py 当前 | 迁移后 | 说明 |
|---|---|---|
| `self._request("POST", "/log/blackbox-log/export", data={...})` | `client._request("POST", "/log/blackbox-log/export", data={...})` | `/api/ad/v3`→`/api/lb/current-version`，需验证 |
| `get_task_status()` — 裸 `urlopen` 请求 | **添加为 ADClient 公开方法** `client.get_last_event()` | 决策明确：加入共享 ADClient。当前实现不走 `_request`，新增时统一走 `_request("GET", "/last-event")` |
| `self.download_file(token, path)` | `client._raw_request(...)` + 文件写入 | 文件写入逻辑保留在 blackbox.py |
| `self.export_blackbox_log(...)` | `client._request("POST", "/log/blackbox-log/export", ...)` | 如实际设备上路径不可达，回退方案见风险章节 |

**SSL 统一**：切到共享 ADClient 后，`SSLContext(PROTOCOL_TLS_CLIENT)` 自动生效。内嵌 ADClient 的 `create_default_context()` 随删除一起移除，不需要单独替换。

### 2.2 共享 scripts 目录

**目标**：消除相对路径硬编码。

**结构变化**：
```
Before:                               After:
.claude/skills/                        scripts/
  ad-ops/scripts/ad_api.py      →       ad_api.py
  ad-perception/scripts/                db_schema.py
    db_schema.py                 →
```

**Import 模式——Skill 脚本**（`.claude/skills/<name>/scripts/` 下，统一使用）：
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
    from ad_api import ADClient, ADError, ADConnectionError, ADAuthError, ADAPIError
except ImportError as e:
    print(f"错误: 无法导入 ad_api: {e}", file=sys.stderr)
    sys.exit(9)
try:
    from db_schema import VS_SAMPLES_DDL, COLUMNS  # 如需要
except ImportError:
    pass  # 非所有脚本都需要 db_schema
```

> 统一模式：`os.path.isdir()` 哨兵 + `try/except ImportError`，两者结合覆盖"目录不存在"和"模块损坏"两种故障。

**Import 模式——测试文件**（`test/` 下）：
```python
import sys, os
# 保留现有 skill 脚本路径（导入被测模块）
_skill_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", "<skill>", "scripts")
sys.path.append(os.path.realpath(_skill_dir))
# 新增共享 scripts 路径（被测模块内部需要 from ad_api import ...）
_scripts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts")
sys.path.append(os.path.realpath(_scripts_dir))
```

> 测试文件需要**两条路径**：① 保留原有 skill 目录路径（导入被测模块如 `perception` / `overview` / `collector`）② 新增 `scripts/` 路径（被测模块内部 `from ad_api import ADClient` 需要）。

**Import 模式——`run_all.py`**（统一前置，测试文件可省略各自 insert）：
```python
sys.path.insert(0, os.path.join(os.path.realpath(os.path.dirname(__file__)), "..", "scripts"))
# 同时添加各 skill 目录，确保测试文件能导入被测模块
for skill in ("ad-ops", "ad-perception", "ad-check-analysis", "ad-blackbox-analysis"):
    _p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", skill, "scripts")
    sys.path.insert(0, os.path.realpath(_p))
```

**涉及文件**：
- `ad-ops/scripts/ad_api.py` → 移动到 `scripts/ad_api.py`
- `ad-perception/scripts/db_schema.py` → 移动到 `scripts/db_schema.py`
- `ad-perception/scripts/perception.py` — 改为统一 Skill 脚本 import 模式（4级 `..` + sentinel + try/except）
- `ad-perception/scripts/collector.py` — 同上
- `ad-ops/scripts/overview.py` — **新增** `sys.path`（当前无，与 ad_api 同目录）+ sentinel + try/except ImportError → exit 9
- `ad-check-analysis/scripts/check.py` — **新增** import + 删内嵌 ADClient(~130行) + 添加 HTTP 错误 try/except 处理
- `ad-blackbox-analysis/scripts/blackbox.py` — **新增** import + 删内嵌 ADClient(~70行) + 使用 `client.get_last_event()`
- `test/test_perception.py` — 保留现有 skill 路径 + 新增 scripts/ 路径
- `test/test_overview.py` — 同上
- `test/test_collector.py` — 同上
- **所有 `__pycache__/` 目录** — `git rm` 已跟踪的 .pyc（共 11 个），新建 `.gitignore` 添加 `__pycache__/` 规则

### 2.3 测试覆盖

**优先级**：
1. `test/test_ad_api.py` — 622 行，所有 Skill 的依赖基础
2. `test/test_check.py` — 1149 行，多步骤状态机
3. `test/test_blackbox.py` — 343 行，解压/CSV 解析/报告

**Mock 层级规范**：

| 测试目标 | Mock 层级 | 原因 |
|---------|----------|------|
| `ad_api.py` | `urllib.request.urlopen` | 验证 URL 拼接、auth header、JSON 序列化、错误转换 |
| `check.py` | `ADClient` 公开方法 | 验证状态机逻辑，不重复测 HTTP 层 |
| `blackbox.py` | `ADClient` 公开方法 + 文件系统 | 验证解压/解析/报告逻辑 |

**ad_api.py 测试覆盖**：
- 读操作：每个 `get_*` 方法（20+）至少 1 条——验证 endpoint 正确、响应解析
- 写操作：每个 `create_*` / `update_*` / `delete_*` 方法（12 个）至少 1 条——验证 POST body JSON 序列化
- 新增方法：`get_last_event()` 至少 1 条
- 错误路径：HTTP 401/403 → `ADAuthError`（含 `http_code` 断言），HTTP 500 → `ADAPIError`（含 `response_body` 断言），URLError → `ADConnectionError`（含 `original` 断言）
- `_raw_request`：HTTP 200 正常返回 bytes、HTTP 4xx → 对应异常、白名单拒绝 `ValueError`
- 边界：空响应、null 字段、非预期 JSON 结构
- `params` 参数：验证 query string 拼接、与 endpoint 已有 `?` 的合并（同名 key 覆盖）

**check.py 测试覆盖**：
- `scenes` 子命令：空列表、正常列表
- `start_check` 状态机：场景验证（存在/不存在）、记录上限（<5 / =5 的 --force）、启动成功/失败、HTTP 错误 try/except 处理
- `wait_and_download` 状态机：新报告检测、下载成功、超时、文件系统失败
- `analyze` 纯函数：功能/健康/安全三类各至少 2 项通过 + 2 项失败
- `render_markdown`：验证新增的优化建议表格和分项评分表格
- 轮询逻辑：注入 `_sleeper` 参数（默认 `time.sleep`，测试中替换为 lambda s: None）
- 文件系统隔离：`_meta.json` 读写通过 `tempfile.TemporaryDirectory` + Mock `open`
- 退出码：见第 4.1 节 RuntimeError→退出码映射表，每个场景至少 1 条

**check.py 可测试性改进**（实现前先做）：
- `start_check()` 和 `wait_and_download()` 增加可选 `_sleeper=time.sleep` 参数
- `analyze()` 保持纯函数，扩展返回结构（见 2.4.1）
- `get_check_progress()` 的 NO_RUNNING fallback 逻辑抽取为独立函数 `_try_progress_fallback(client)` 便于单独测试

**blackbox.py 测试覆盖**：
- `get_last_event`：正常/空响应
- `export_blackbox_log`：正常/ADAPIError/ADAuthError/ADConnectionError
- `download_file`：正常/文件系统错误
- `BlackboxAnalyzer.extract`：通过 `tempfile.TemporaryDirectory` + 构造目录树测试，不创建真实 ZIP
- `BlackboxAnalyzer.analyze_audit_logs`：正常 CSV / 空文件 / 字段数不足 / 编码错误
- `BlackboxAnalyzer.analyze_system_logs`：正常 / 空目录
- `BlackboxAnalyzer.get_available_dates`：正常 / 空 / 非日期目录
- `BlackboxAnalyzer._count_field`：纯函数，直接测试
- `generate_report`：正常 / 空结果
- 退出码：见第 4.2 节场景→退出码映射表

**测试模式**：沿用现有 unittest + MagicMock + `:memory:` SQLite + `tempfile` 模式，零外部依赖。

### 2.4 SKILL.md 统一

**模板**（~130 行）：

```
---
name: <skill-name>
description: <一句话中文描述，用于触发匹配>
---

# <中文标题>

<一句话定位>

## 功能概述
<3-5 列表项>

## CLI 命令参考
<带注释的 bash 代码块，使用 python scripts/<name>.py 格式>

## 脚本强制规则
<操作 → 必须/禁止表>

## 已知设备
<设备表>

## 行为准则
### 必须行为
<列表>
### 禁止行为
<列表>

## 报告展示规则
<LLM 展示要求 — 脚本 stdout 原样贴入对话正文，不放折叠区域>

## 外部依赖
<跨 Skill 依赖表>

## 错误码
<exit code 表>

## 相关技能
<链接到其他 Skill>
```

**各 SKILL.md 改动**：

| Skill | 行数 | 改动 |
|-------|------|------|
| ad-check-analysis | 242→130 | **删** 70 行报告模板。**补** 错误码表、外部依赖。**补** check.py 的优化建议+分项评分（见 2.4.1） |
| ad-ops | 47→130 | **补** 行为准则、错误码、相关技能、报告展示规则。**修正** Quick Start 示例 `ad_ops`→`ad-ops`。**更新** CLI 路径 `python .claude/skills/ad-ops/scripts/ad_api.py`→`python scripts/ad_api.py` |
| ad-blackbox-analysis | 48→130 | **补** 行为准则、错误码、相关技能、报告展示规则。**修正** API 路径描述。**更新** CLI 路径格式与统一模板一致 |
| ad-perception | 74→130 | 微调：章节顺序对齐模板，"外部依赖"路径更新为 `scripts/ad_api.py` |

**description 语言统一**：全部采用中文短描述（与 ad-perception 格式一致：`AD 设备<功能> — <关键词列表>`）。

#### 2.4.1 check.py render_markdown() 补充

删除 SKILL.md 报告模板后，脚本需要生成模板覆盖的全部内容。当前缺口：

| 模板有 | 脚本当前 | 修复方案 |
|--------|---------|---------|
| ✅ 设备基本信息 | 有 | — |
| ✅ 巡检结果详情 | 有（按功能/健康/安全分组） | — |
| ✅ 统计汇总 | 有 | — |
| ❌ 优化建议 | 缺失 | 见下方 |
| ❌ 分项健康评分 | 仅有综合评分 | 见下方 |

**优化建议规则引擎**：

在 `analyze()` 返回结构中新增 `"suggestions"` 键（`List[Dict]`），由预定义映射表驱动：

```python
# 建议映射表（示例，完整列表在实现时补全）
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
    # ... 覆盖所有 67 个检查项
}
```

优先级判定：`fail` 默认映射到对应优先级（如映射表无指定则 `fail`→"高"、`warn`→"中"）。可逐项覆盖。

**分项健康评分**：

在 `analyze()` 返回结构中新增 `"health_scores"` 键：

```python
{
    "health_scores": {
        "feature": {"pass": 5, "total": 5, "score": 100},  # 功能巡检
        "health":  {"pass": 4, "warn": 1, "total": 5, "score": 90},  # 健康巡检
        "secure":  {"pass": 3, "fail": 2, "total": 5, "score": 60},  # 安全巡检
        "overall": 83  # 综合
    }
}
```

标签使用 `analyze()` 中已有的类别名称（`功能巡检`/`健康巡检`/`安全巡检`），与 SKILL.md 模板的标签保持一致。评分公式统一为：`score = (pass + warn*0.5) / total * 100`（与综合评分公式一致）。

`render_markdown()` 新增输出：
```markdown
### 💡 优化建议
| 优先级 | 建议 |
|--------|------|
| 🔴 高 | CPU 使用率过高，建议排查... |
| 🟡 中 | SSH 配置存在安全风险 |

### ✅ 健康评分
| 类别 | 检查项数 | 通过 | 评分 |
|------|----------|------|------|
| 功能巡检 | 5 | 5 | 100/100 |
| 健康巡检 | 5 | 4 | 90/100 |
| 安全巡检 | 5 | 3 | 60/100 |
| **综合评分** | | | **83/100** |
```

### 2.5 测试运行脚本

**文件**: `test/run_all.py`

```python
#!/usr/bin/env python3
"""Run all AD project tests."""
import sys
import os
import unittest
import warnings

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # 统一添加共享 scripts 目录
    sys.path.insert(0, os.path.join(os.path.realpath(os.path.dirname(__file__)), "..", "scripts"))
    # 添加各 skill 目录，确保测试文件能导入被测模块
    for skill in ("ad-ops", "ad-perception", "ad-check-analysis", "ad-blackbox-analysis"):
        _p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills", skill, "scripts")
        sys.path.insert(0, os.path.realpath(_p))
    # Surface import errors during discover
    warnings.simplefilter('always', ImportWarning)
    loader = unittest.defaultTestLoader
    suite = loader.discover(".", pattern="test_*.py")
    if loader.errors:
        for e in loader.errors:
            print(f"Load error: {e}", file=sys.stderr)
        sys.exit(1)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
```

## 3. 改动范围（完整清单）

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `.claude/skills/ad-ops/scripts/ad_api.py` → `scripts/ad_api.py` | **移动+修改** | 加 params / _raw_request / 异常类 / get_last_event() / download_blackbox_log 重构 / main() exit(4) |
| 2 | `.claude/skills/ad-perception/scripts/db_schema.py` → `scripts/db_schema.py` | **移动** | 纯常量文件，无改动 |
| 3 | `.claude/skills/ad-ops/scripts/overview.py` | **修改** | **新增** sys.path（4级.. + sentinel + try/except ImportError → exit 9）。当前无 sys.path |
| 4 | `.claude/skills/ad-perception/scripts/perception.py` | **修改** | 改为统一 Skill 脚本 import 模式（4级.. + sentinel + try/except） |
| 5 | `.claude/skills/ad-perception/scripts/collector.py` | **修改** | 同上 |
| 6 | `.claude/skills/ad-check-analysis/scripts/check.py` | **修改** | **删**内嵌 ADClient(~130行)，**新增** 统一 import + HTTP 错误 try/except。补退出码映射（见 4.1）。补 render_markdown 优化建议+分项评分（见 2.4.1） |
| 7 | `.claude/skills/ad-blackbox-analysis/scripts/blackbox.py` | **修改** | **删**内嵌 ADClient(~70行)，**新增** 统一 import。使用 `client.get_last_event()`。补退出码映射（见 4.2） |
| 8 | `.claude/skills/ad-ops/SKILL.md` | **重写** | 统一模板 ~130行，修正 CLI 路径和示例代码 |
| 9 | `.claude/skills/ad-check-analysis/SKILL.md` | **重写** | 统一模板，删报告模板 |
| 10 | `.claude/skills/ad-blackbox-analysis/SKILL.md` | **重写** | 统一模板，修正 API 路径 |
| 11 | `.claude/skills/ad-perception/SKILL.md` | **微调** | 章节对齐，更新外部依赖路径 |
| 12 | `test/test_perception.py` | **修改** | 保留现有 skill 路径 + 新增 scripts/ 路径 |
| 13 | `test/test_overview.py` | **修改** | 同上 |
| 14 | `test/test_collector.py` | **修改** | 同上 |
| 15 | `test/test_ad_api.py` | **新建** | Mock urllib.request.urlopen 层，测试 20+ get_* + 12 write + 异常类 + _raw_request |
| 16 | `test/test_check.py` | **新建** | Mock ADClient 公开方法 + tempfile，测试状态机 + 分析 + 渲染 + 退出码 |
| 17 | `test/test_blackbox.py` | **新建** | Mock ADClient + tempfile 目录树，测试导出/解析/报告 + 退出码 |
| 18 | `test/run_all.py` | **新建** | unittest discover，统一 sys.path（含各 skill 目录），检查 loader.errors |
| 19 | 所有 `__pycache__/` | **git rm** | 11 个已跟踪 .pyc 文件，在迁移 commit 中删除 |
| 20 | `.gitignore` | **新建** | 内容：`__pycache__/`（防止后续 .pyc 被再次提交） |
| 21 | 旧 `ad_api.py` + `db_schema.py` | **保留 .bak** | 本地临时保险（不提交 git，加入 .gitignore `*.bak`），测试全过后手动删除 |

## 4. 错误码体系

**统一错误码**（所有脚本强制执行）：

| Code | 含义 | 触发场景 |
|------|------|---------|
| 0 | 成功 | 所有维度正常完成 |
| 1 | 连接失败 | ADConnectionError、超时、全部 API 失败 |
| 2 | 认证失败 | ADAuthError (HTTP 401/403) |
| 3 | SQLite 错误 | 数据库写入失败 (collector) |
| 4 | 参数错误 | 缺少必需参数、无效参数值、场景不存在、记录满未 --force |
| 5 | 部分失败 | 部分维度成功、部分失败 |
| 6 | 重复启动 | 采集器已在运行 (PID 文件) |
| 9 | Import 失败 | 无法导入 ad_api / db_schema |

### 4.1 check.py RuntimeError → 退出码映射

| 场景 | 退出码 | 触发条件 |
|------|--------|---------|
| "无法获取巡检场景列表" | 1 | ADConnectionError |
| "场景 'xxx' 不存在" | 4 | 用户指定无效场景名 |
| "巡检记录已达 5 条上限" | 4 | 超限且未传 --force |
| "巡检启动失败" | 1 | ADAPIError |
| "找不到 _meta.json" | 4 | work_dir 路径错误 |
| "无法判定新报告" | 4 | 巡检未启动或 work_dir 空 |
| "超时未检测到完成报告" | 5 | 轮询超时（巡检可能仍在跑） |
| "获取 file_token 失败" | 1 | ADAPIError |
| "ad.json 未找到" (analyze 子命令) | 4 | 用户指定的 work_dir 路径无效 |
| 认证失败 | 2 | ADAuthError |
| 全部成功 | 0 | — |

### 4.2 blackbox.py 场景 → 退出码映射

| 场景 | 退出码 | 触发条件 |
|------|--------|---------|
| 导出 API 连接失败 | 1 | ADConnectionError |
| 导出 API 认证失败 | 2 | ADAuthError |
| 导出 API 服务端错误 | 1 | ADAPIError |
| 异步任务返回 FAILED | 1 | 设备端任务执行失败 |
| 轮询超时 (60次) | 5 | 任务可能在运行但未在预期时间内完成 |
| 文件下载失败 | 1 | ADConnectionError / 文件系统错误 |
| 解压失败 | 5 | 文件损坏（导出可能成功但文件不完整） |
| CSV 解析错误 | 5 | 格式异常（跳过错误行，继续解析其余） |
| 参数错误 | 4 | 缺少 host/password/日期范围 |
| 全部成功 | 0 | — |

### 4.3 其他脚本当前缺口

| 脚本 | 缺口 | 修复 |
|------|------|------|
| `overview.py` | 缺 import 错误处理 (ImportError → exit 9) | 新增 try/except ImportError |
| `ad_api.py` main() | 缺 host/password → exit(1) 应为 exit(4) | 两者均改为 exit(4) |
| `check.py` | 所有异常 exit(1)，未分级 | 按 4.1 表映射 |
| `blackbox.py` | 不 sys.exit，return 0 | 按 4.2 表补全 |

## 5. 风险与回滚

- `ad_api.py` 移动后，所有 import 路径一次性切换 → **一个 commit** 完成全部切换
- `params` 参数向后兼容（默认 `None`），现有调用方零影响
- **回滚方案**：`git revert <commit>` 恢复全部变更。旧文件在原位置保留 `.bak` 仅作为本地临时保险（不提交 git，在 `.gitignore` 中加入 `*.bak`），测试全过后手动删除
- `__pycache__/` 在迁移 commit 中 `git rm` 已跟踪的 .pyc 文件（11 个），新建 `.gitignore` 阻止再次提交
- **blackbox API 路径** `/api/lb/current-version/log/blackbox-log/export` 需在实际设备上验证端点可达后再合并。如端点不存在，回退方案：保留 blackbox.py 独立 ADClient（使用 `/api/ad/v3` 但 SSL 修复为 `SSLContext(PROTOCOL_TLS_CLIENT)`）

## 6. 不变约束

- 零外部依赖（纯 stdlib）
- 脚本固化所有逻辑，LLM 只调度+展示
- Markdown/JSON 双输出
- 错误码体系：0/1/2/3/4/5/6/9，所有脚本强制执行
- `AD_PASS` 环境变量优先于 `--password` 命令行参数（凭证安全）
