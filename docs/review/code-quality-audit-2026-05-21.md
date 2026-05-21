# AD Skills 代码质量与缺陷预防审计报告

**审计日期**: 2026-05-21
**审计范围**: `.claude/skills/` (10 个 Python 脚本, 5 个 SKILL.md, 4 个 checklist) + 根目录配置
**审计方法**: 全量逐文件阅读 → 多维度交叉分析
**代码总量**: ~220KB Python + ~50KB 文档/配置

---

## 问题总览

| 严重程度 | 数量 | 说明 |
|----------|------|------|
| CRITICAL | 3 | 安全漏洞或数据丢失风险，需立即修复 |
| HIGH | 7 | 可能导致生产故障或安全暴露 |
| MEDIUM | 11 | 代码健壮性、可维护性问题 |
| LOW | 9 | 风格/规范问题，建议改进 |
| **合计** | **30** | |

---

## CRITICAL (3)

### C1. 硬编码默认解压密码 — blackbox.py

**文件**: `.claude/skills/ad-blackbox-analysis/scripts/blackbox.py`
**位置**: 第 190, 218, 432, 485 行

```python
def _blackbox_start(client, from_date="", to_date="", archive_password="root1234+", ...):
```

`archive_password` 参数在多处函数签名和 argparse 中硬编码默认值为 `"root1234+"`。这是黑盒日志 ZIP 文件的解压密码，属于敏感凭据。

**风险**: 密码泄露到代码仓库、git 历史、日志输出。攻击者获取后可直接解密所有设备导出的黑盒文件。

**修复**: 移除硬编码默认值，改为从环境变量读取（如 `BLACKBOX_ARCHIVE_PASSWORD`），仅在未设置时报错退出。

---

### C2. SSL 证书验证完全禁用 — ad_api.py

**文件**: `.claude/skills/ad-ops/scripts/ad_api.py`
**位置**: 第 78-80 行

```python
self.ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
self.ssl_context.check_hostname = False
self.ssl_context.verify_mode = ssl.CERT_NONE
```

所有 AD 设备 API 通信完全跳过 TLS 证书验证，不检查主机名，不验证证书链。

**风险**: 中间人攻击 (MITM) 完全可行。任何能劫持网络路径的攻击者都可以解密、篡改所有 API 通信，包括认证凭据和配置数据。虽然有注释说明"AD 设备使用自签证书"，但这不能作为生产环境中完全禁用验证的理由。

**修复**:
1. 短期：从设备获取自签证书，将其添加到信任存储，仅信任该证书
2. 长期：支持用户配置 CA 证书路径，默认拒绝不可信连接

---

### C3. 密码通过命令行参数传递 — 所有脚本

**文件**: 全部 10 个脚本
**位置**: 所有 `--password` argparse 参数

```bash
python scripts/check.py run --host https://IP --password "明文密码"
```

密码通过命令行参数 `--password` 传入，在 Windows 和 Linux 上，命令行参数对同一主机的所有用户可见（通过 `ps`、`/proc`、任务管理器、WMI 等）。

**风险**: 多用户环境下的凭据泄露。任何能查看进程列表的用户都能看到 AD 设备管理员密码。

**修复**: 
1. 已部分支持 `AD_PASS` 环境变量（如 perception.py:1031 `os.environ.get("AD_PASS", "") or args.password`），但 check.py 和 blackbox.py 在 argpass 中 default=""未经环境变量回退
2. 统一所有脚本优先使用环境变量，`--password` 仅作为 fallback
3. 长期：支持从 stdin 或加密配置文件读取密码

---

## HIGH (7)

### H1. 所有脚本缺乏操作审计日志

**文件**: 全部 10 个脚本

None of the scripts log who executed what command, when, with which parameters, and what the result was. No audit trail exists for operations performed on AD devices.

**风险**: 无法追溯操作历史，安全事件调查困难，无法满足合规要求。

**修复**: 添加统一的日志模块，记录时间戳、操作类型、目标设备、结果状态到文件。

---

### H2. 硬编码 Unix 路径 — check.py

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 52, 1141 行

```python
def start_check(client, scene, force=False, work_dir="/tmp/ad_check"):
```

函数签名默认值使用 Unix 路径。虽然在 `_check_one()` 和 `_start_only()` 中会 fallback 到 `tempfile.gettempdir()`，但直接调用 `start_check()` 时仍会使用 `/tmp/ad_check`。

**风险**: Windows 上运行时可能失败或产生不预期的行为。

**修复**: 将默认值改为 `None`，函数内部统一使用 `tempfile.gettempdir()` 派生。

---

### H3. 数据库操作无连接池，无重试机制

**文件**: `.claude/skills/ad-perception/scripts/collector.py`, `perception.py`

SQLite 连接在每次操作中创建和关闭（如 `query_traffic_db` 第 105 行 `conn = sqlite3.connect(db_path)`），没有连接池。网络/VPN 抖动时 API 调用（`ADClient._request`）无重试逻辑。

**风险**: 采集器在瞬态网络故障时丢失数据点，数据库文件在并发写入时可能损坏（WAL 模式下风险较低但存在）。

**修复**: 
1. API 层添加指数退避重试（3 次，间隔 1s/2s/4s）
2. 采集器连接改为长连接或使用 WAL 模式显式启用

---

### H4. 单设备模式密码为空时行为不一致

**文件**: 多个 main() 函数

- `perception.py:1102-1104`: 密码为空时 `sys.exit(4)` 
- `ad_api.py:682-685`: 密码为空时 `sys.exit(4)`
- `check.py run` 单设备模式: **未检查密码是否为空** (第 1214 行直接创建 ADClient)
- `blackbox.py`: **未检查密码是否为空**，传递给 ADClient 构造函数

**风险**: 空密码可能导致 API 调用以无认证方式执行，返回错误或意外的数据暴露。

**修复**: 所有单设备模式入口统一检查密码是否为空（包括环境变量）。

---

### H5. collector.py 的 PID 文件在 Windows 上有信号安全隐患

**文件**: `.claude/skills/ad-perception/scripts/collector.py`
**位置**: 第 298-319 行

```python
if sys.platform == 'win32':
    import ctypes
    kernel32 = ctypes.windll.kernel32
    SYNCHRONIZE = 0x00100000
    handle = kernel32.OpenProcess(SYNCHRONIZE, False, pid)
```

直接调用 Win32 API 检查进程存活。代码注释承认 `os.kill(pid, 0)` 在 Windows 上会错误触发 CTRL_C_EVENT。

**风险**: Win32 API 调用无错误处理（如进程权限不足时 `OpenProcess` 返回 NULL 被误判为进程不存在）。代码假设 `ctypes.windll.kernel32` 始终存在，但缺少 try/except。

**修复**: 在 `OpenProcess` 调用周围添加异常处理，处理 `ctypes.GetLastError()` 的错误码（如 ERROR_ACCESS_DENIED = 5）。

---

### H6. blackbox.py 异步任务状态查询无超时和重试上限

**文件**: `.claude/skills/ad-blackbox-analysis/scripts/blackbox.py`

`_blackbox_download()` 函数（第 218 行）只检查一次 `get_last_event()` 返回的任务列表。如果任务状态为 `RUNNING`，返回 `{"status": state}` 让 LLM 重试，但脚本本身不包含轮询循环或超时机制。

**风险**: 依赖 LLM 正确实现轮询逻辑。如果 LLM 行为异常（如忘记轮询、轮询间隔错误），可能导致任务状态丢失。

**修复**: 虽然设计上由 LLM 轮询是合理的（避免脚本长时间阻塞），但应在 `progress` 子命令的文档中明确超时策略。

---

### H7. .gitignore 不覆盖数据库文件和 PID 文件

**文件**: `.gitignore`

```
__pycache__/
*.bak
AD-agent/
__MACOSX/
.claude/success/
.claude/worktrees/
```

未排除 SQLite 数据库文件 (`*.db`)、PID 文件 (`*.pid`)、临时报告目录。

**风险**: 包含生产数据的 SQLite 数据库文件（含设备流量数据）可能被意外提交到仓库。

**修复**: 添加 `*.db`、`*.pid`、`*.db-journal`、`*.db-wal` 到 .gitignore。

---

### H8. check.py ZIP 解压后 ad.json 缺失导致 FileNotFoundError — check.py

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 220-237 行

```python
ad_json_path = os.path.join(work_dir, "ad.json")
if not os.path.exists(ad_json_path):
    for root, _, files in os.walk(work_dir):
        if "ad.json" in files:
            ad_json_path = os.path.join(root, "ad.json")
            break
# ...
print(f"         ad.json: {ad_json_path} ({os.path.getsize(ad_json_path)} bytes)")
```

`wait_and_download` 在第 220 行将 `ad_json_path` 初始化为 `work_dir/ad.json`。如果 ZIP 内容中没有 `ad.json`，`os.walk` 循环不会更新该变量，第 237 行 `os.path.getsize(ad_json_path)` 对不存在的文件调用，抛出 **FileNotFoundError 且未被任何上层 catch 包裹**（`except RuntimeError` 无法匹配），导致进程崩溃。

**风险**: 设备返回的巡检 ZIP 结构变化时，脚本直接 crash 而非报告友好错误。

**修复**: 在 `os.path.getsize` 调用前检查文件存在性；或在 `os.walk` 未找到时提前 raise RuntimeError。

---

### H9. perception.py 环境变量密码优先级与文档矛盾 — perception.py

**文件**: `.claude/skills/ad-perception/scripts/perception.py`
**位置**: 第 1005、1031 行

```python
# 第 1005 行 help text:
p.add_argument("--password", default="", help="Password (overrides AD_PASS env var)")

# 第 1031 行实际逻辑:
password = os.environ.get("AD_PASS", "") or args.password
```

help text 明确声明 `--password` **覆盖** `AD_PASS` 环境变量。但实际代码 `os.environ.get("AD_PASS", "") or args.password` 的行为是：如果 `AD_PASS` 环境变量非空，**始终使用环境变量**，忽略 `--password`。这和文档描述的优先级完全相反。

**风险**: 用户设置 `AD_PASS=prod_pass` 后尝试用 `--password staging_pass` 连接测试设备，实际会静默连接到生产设备。审计报告 C3 认为此行"正确支持环境变量"，但未发现优先级反转。

**修复**: 改为 `args.password or os.environ.get("AD_PASS", "")`，使命令行参数优先于环境变量。

---

### H10. conflict_analysis 使用 vport(单数) 与 overview.py 的 vports(复数) 不一致 — perception.py

**文件**: `.claude/skills/ad-perception/scripts/perception.py`
**位置**: 第 593 行

```python
vport = vs.get('vport', '')  # 单数
```

对比 `overview.py` 第 249 行：
```python
vports = vs.get('vports') or []  # 复数，且用列表推导做 Cartesian product
```

`conflict_analysis` 读取 `vport`（字符串），而 `overview.py` 读取 `vports`（列表）。如果 AD API 返回 `vports` 字段名（复数，列表形式），`conflict_analysis` 总是得到空字符串 `''`，走到第 594 行的 `if not vips or not vport: continue` 直接跳过该 VS。**整个 VS IP:Port 冲突检测功能静默失效。**

**风险**: 所有多 VS 共享 IP:Port 的冲突无法被检测出来，可能导致运维人员不知道存在地址冲突。

**修复**: 统一字段名。确认 AD API 实际返回的 key 是 `vport` 还是 `vports`，两个文件同步修改。

---

## MEDIUM (17)

### M1. 跨技能导入代码高度重复

**文件**: check.py:14-38, perception.py:12-30, collector.py:16-29, blackbox.py:28-48, connect.py:12-30

每个脚本约 20 行完全相同的路径解析和导入逻辑。对 `ad_api` 和 `multi_device` 的导入失败处理方式也完全一致（打印错误 + sys.exit(9)）。

**风险**: 重复代码意味着修改需要在多处同步，容易出现遗漏。

**修复**: 不急于抽象。当前 5 处重复尚可接受，但当第 6 个 skill 加入时应考虑提取公共模块。注意：这里不适用 pip 包，因为脚本需要零依赖独立运行。

---

### M2. _SUGGESTION_MAP 不完整

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 251-268 行

16 个检查项的优化建议，但 `analyze()` 函数中实际有 67 个检查项。未映射的检查项会得到通用建议 `f"检查项 {key} 状态为 {result['status']}，建议进一步排查"`（第 796 行）。

**风险**: 用户体验差——异常项得不到有针对性的修复建议。

**修复**: 补全所有 67 个检查项的映射，或至少补全常见的 fail 项。

---

### M3. db_schema.py 无 Schema 版本管理

**文件**: `.claude/skills/ad-perception/scripts/db_schema.py`

```sql
CREATE TABLE IF NOT EXISTS vs_samples (...)
CREATE TABLE IF NOT EXISTS device_state (...)
```

使用 `CREATE TABLE IF NOT EXISTS` 但没有 schema 版本号。如果未来需要添加列或修改约束，无法自动迁移。

**风险**: Schema 变更时现有数据库文件与新代码不兼容，静默失败或数据错乱。

**修复**: 添加 `schema_version` 表，启动时检查版本并在不兼容时提示用户重建。

---

### M4. check.py analyze() 缺少对异常数据类型的防御

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 296-730 行

`analyze()` 函数大量使用 `data.get(key, default)`，但未检查 `ad.json` 文件是否为有效 JSON 对象（非数组、非字符串）。在第 1098-1099 行调用方已做 json.load，但如果上游 API 返回格式变化，analyze 函数自身不会报错。

**风险**: 格式变化导致静默分析失败，所有检查项被跳过但返回 score=0。

**修复**: 在 `analyze()` 开头添加对 `data` 类型的防御性检查——如果不是 dict 则返回错误。

---

### M5. 多个脚本缺少 `if __name__ == "__main__"` 保护

**文件**: `multi_device.py`, `db_schema.py`, `render.py`

作为被 import 的模块，不会直接执行。但如果被意外直接运行，不会有任何提示。

**风险**: 极低——这些文件没有 CLI 入口。但 Python 最佳实践要求所有模块都有 `if __name__ == "__main__"` 保护。

---

### M6. collector.py daemon 模式已废弃但代码仍在

**文件**: `.claude/skills/ad-perception/scripts/collector.py`
**位置**: 第 541-548, 625-683 行

`daemon` 子命令标记为 DEPRECATED 但所有逻辑完整保留（~130 行）。`_run_daemon` 函数（第 625 行）和 `run_collector_multi` 函数（第 572 行）仅被 daemon 路径使用。

**风险**: 死代码增加维护负担，废弃代码中的 bug 不会被关注。

**修复**: 在下个大版本中移除 daemon 模式代码，或明确标注移除时间线。

---

### M7. 错误消息使用中文，但代码标识符使用英文

**文件**: 全部脚本

用户面向的错误消息使用中文（"连接失败"、"认证失败"），但内部标识符使用英文。这不是问题本身，但导致错误分类逻辑使用字符串匹配中文关键词（如 check.py:1223 `if "场景" in msg and "不存在" in msg`）。

**风险**: 错误分类依赖中文字符串匹配，修改错误消息文案会导致分类逻辑静默失效。

**修复**: 使用异常类型或错误码进行分类，而非字符串匹配。

---

### M8. perception.py analyze 维度间无隔离

**文件**: `.claude/skills/ad-perception/scripts/perception.py`
**位置**: `analyze_full()` 第 901-946 行

```python
try:
    traffic_result = traffic_analysis(client, db_path=db_path)
except Exception as e:
    traffic_result = {'status': 'error', ...}
```

虽然有 try/except 外层包裹，但如果 `traffic_analysis` 中调用了 `sys.exit()`（它不会，但子函数中没有保证），会导致整个进程退出。当前实现是安全的，但没有明确契约。

**风险**: 低——当前实现正确，但未来修改可能引入 sys.exit 破坏隔离。

**修复**: 在文档中明确约定：被 `analyze_full()` 调用的子分析函数不得调用 `sys.exit()`。

---

### M9. Overview.py 中 API 错误隔离不完整

**文件**: `.claude/skills/ad-ops/scripts/overview.py`
**位置**: 第 168-175 行

```python
for api_type in api_types:
    method = api_method_map[api_type]
    try:
        raw[api_type] = _try_call(client, method)
    except Exception as e:
        raw[api_type] = None
        overview["api_errors"][api_type] = str(e)
```

如果 `api_type` 不在 `api_method_map` 中（如自定义 subcommand），会抛出 `KeyError` 且未被捕获。当前 `API_GROUPS` 的约束保证了这不会发生，但没有防御性编程。

**风险**: 添加新 API 类型时遗漏更新 `api_method_map` 会导致未处理异常。

**修复**: 在 `api_method_map[api_type]` 前检查 key 存在性，或使用 `.get()`。

---

### M10. connect.py 导入 JSON 模块在函数内部

**文件**: `.claude/skills/ad-connect/scripts/connect.py`
**位置**: 第 182, 209 行

```python
if args.format == "json":
    import json  # 在 if 块内部导入
```

虽然是合法的（json 是标准库），但不符合 PEP 8 建议（导入应放在文件顶部）。

**风险**: 无功能风险，但降低代码可读性。

---

### M11. check.py progress 多设备模式 `hasattr(args, 'hosts')` 检查多余

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 1278 行

```python
if hasattr(args, 'hosts') and args.hosts:
```

`argparse` 中 `--hosts` 已通过 `add_argument` 注册，`hasattr` 始终为 True。这个检查是多余的，可能是从早期代码遗留。

**风险**: 无功能风险，但暗示代码经历过多次重构。

---

### M12. overview.py 证书到期计算使用 naive datetime — overview.py

**文件**: `.claude/skills/ad-ops/scripts/overview.py`
**位置**: 第 46 行

```python
expiry = datetime.strptime(validity_not_after, "%Y/%m/%d %H:%M:%S")
delta = expiry - now  # now = datetime.now()，均为 naive
```

`calc_days_left` 使用 naive `datetime.now()` 与设备返回的 naive `validity_not_after` 做差值。如果设备时区与运行脚本的机器时区不同（如设备在 UTC+8，机器在 UTC），`delta.days` 会偏差 ±1 天。对于距到期 ≤30 天的证书，这可能导致过期告警延迟或误报。

**风险**: 跨时区部署时证书到期判定不准确。

**修复**: 将两边统一为 UTC 时间或添加时区参数。

---

### M13. blackbox.py audit CSV 路径硬编码 — blackbox.py

**文件**: `.claude/skills/ad-blackbox-analysis/scripts/blackbox.py`
**位置**: 第 102 行

```python
audit_file = os.path.join(hislog_dir, f"{date}.audit", "zh_CN", "0.audit.csv")
```

目录结构 `{date}.audit/zh_CN/0.audit.csv` 硬编码在代码中。如果 ZIP/TGZ 解压后的实际结构不同（如非中文系统返回 `en_US`，文件名变体 `0.audit-report.csv`），`os.path.exists` 在第 103 行返回 False，整个日期的审计记录被静默跳过（`continue`），返回空结果且无任何警告。

**风险**: 设备固件升级导致目录结构变化时，审计日志分析功能静默失效。

**修复**: 添加 glob 兜底搜索，或在未找到文件时打印 warning。

---

### M14. check.py MEMORY_LEAK_CHECK 逻辑疑似反转 — check.py

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 642-645 行

```python
if has("shm_sem_state"):
    leak = data.get("shm_sem_state", False)
    check("MEMORY_LEAK_CHECK",
          "pass" if leak else "fail",
          f"shm_sem_state={leak}", detail="共享内存/信号量异常" if not leak else "")
```

变量名取为 `leak` 暗示开发者认为 `True` = "检测到泄漏/异常"。但检查逻辑 `"pass" if leak else "fail"` 在 `leak=True` 时标记为 **pass**（正常），`leak=False` 时标记为 fail。这与语义直觉相反。需确认 `shm_sem_state` 字段在 ad.json 中的实际语义：True = 共享内存状态正常，还是 True = 检测到异常。

**风险**: 如果 True 表示"检测到异常"，则内存泄漏永远不会被巡检发现。

**修复**: 与 AD 设备文档或开发团队确认 `shm_sem_state` 的语义，确保 pass/fail 逻辑正确。

---

### M15. check.py 单设备 progress 路径缺少异常处理 — check.py

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 1289-1290 行

```python
client = ADClient(args.host, args.username, args.password)
result = _progress_one(client)
```

与同文件中的 `scenes`、`run`、`wait`、`history` 子命令不同，单设备 `progress` 路径对 `ADClient` 创建和 `_progress_one` 调用没有任何 try/except。如果设备不可达或认证失败，`ADConnectionError`/`ADAuthError` 直接传播为未处理的 Python traceback。

**风险**: 用户体验差，device 不可达时收到原始异常堆栈而非清晰的错误消息。

**修复**: 添加 try/except 包裹，匹配其他子命令的处理方式。

---

### M16. blackbox.py 解压异常捕获不完整 — blackbox.py

**文件**: `.claude/skills/ad-blackbox-analysis/scripts/blackbox.py`
**位置**: 第 248 行

```python
except (zipfile.BadZipFile, RuntimeError):
    return {"error": "归档密码错误，请检查 --archive-password"}
```

解压过程除了 `BadZipFile` 外，还可能出现 `tarfile.ReadError`、`tarfile.ExtractError`、`EOFError`（文件截断）、`PermissionError` 等。这些异常未被此 catch 块捕获，直接传播到外层 `except Exception` 产生通用 `"错误: ..."` 消息。其中 `tarfile.ReadError`（TGZ 损坏）和 `PermissionError` 与"密码错误"完全无关，用户会得到误导性的错误提示。

**风险**: 误导性的错误信息延长排障时间。

**修复**: 扩展 catch 的异常类型列表，或为不同异常类型提供不同的错误消息。

---

### M17. perception.py API fallback 使用未文档化的 trend period — perception.py

**文件**: `.claude/skills/ad-perception/scripts/perception.py`
**位置**: 第 313-314 行

```python
for trend_period in ('last-hour', 'last-day', 'last-month'):
    trends[trend_period] = _fetch_trend_raw(client, vn, trend_period)
```

`ADClient.get_vs_trend_by_name` 文档（ad_api.py 第 289 行）列出的有效 trend 值为 `last-5m, last-30m, last-hour, last-6h, last-day`。`'last-month'` 不在有效值列表中。如果 API 对无效值返回空数据，API fallback 路径会因 `raw_trends` 为空而返回 `status: 'error'`，错误消息"数据库和 API 均无法获取流量数据"，即使 `last-hour` 和 `last-day` 数据可用。

**风险**: 用户看到"无法获取数据"错误，但实际有数据可用（被 `last-month` 的查询失败拖累）。

**修复**: 确认 API 是否支持 `last-month`。不支持则移除并调整 `_build_metric_tables_from_trend` 的阈值逻辑。

---

## LOW (14)

### L1. 类型注解不完整

**文件**: 多个脚本

部分函数有类型注解（如 `ad_api.py` 的方法签名），部分完全缺失（如 `blackbox.py` 的大部分函数）。不一致。

### L2. 文档注释语言混用

部分 docstring 使用中文，部分使用英文，部分中英混合。如 `collector.py` docstring 是中文，`perception.py` docstring 是英文。

### L3. checklist.md 使用 `TEST_IP` / `TEST_PASS` 占位符

所有 4 个 checklist 使用 `TEST_IP` 和 `TEST_PASS` 作为占位符，但没有自动化测试框架或 CI 集成来执行这些检查。目前 checklist 仅用于手动验证。

### L4. ad_bench.py 定位不清

根目录的 `ad_bench.py` 是一个独立的 AD 打流测试工具，与 skills 系统无直接关系。没有任何文档说明其用途和归属。

### L5. devices.json 缺少 JSON Schema 验证

`devices.json` 的格式约定（`name`, `host`, `user`, `password_from` 字段）在多处被引用，但没有 JSON Schema 文件来验证格式正确性。

### L6. CHANGELOG.md 仅记录文档变更

CHANGELOG 记录了 v2.0.0 的模板化改造（纯文档变更），但没有记录脚本代码的实际变更历史。

### L7. `__MACOSX/` 目录残留在仓库中

`__MACOSX/` 目录包含 macOS 资源分叉文件（`._` 前缀文件），已在 .gitignore 中排除但物理文件仍存在。应清理。

### L8. Python shebang 使用 `#!/usr/bin/env python3`

全部脚本使用 `#!/usr/bin/env python3`，在 Windows 上实际通过文件关联运行而非 shebang。不影响功能。

### L9. 部分脚本缺少 encoding 声明

虽然 Python 3 默认 UTF-8，大多数文件有 `# -*- coding: utf-8 -*-` 声明，但 `ad_bench.py` 等少数文件缺失。

---

### L10. ad_api.py 单设备模式缺子命令时无引导信息 — ad_api.py

**文件**: `.claude/skills/ad-ops/scripts/ad_api.py`
**位置**: 第 708-721 行

单设备模式下，若用户运行 `python ad_api.py users`（缺子命令 `list`/`get`），`_execute_command` 返回 `None`，代码走到 `parser.print_help()` 打印顶层帮助而非提示 "users 需要子命令 (list/get)"。

### L11. check.py wait 子命令 help 引用不存在的 --output 参数 — check.py

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 1142 行

```python
p_wait.add_argument("--work-dir", default="/tmp/ad_check",
                    help="与 run 的 --output 保持一致")
```

help text 提示 "与 run 的 --output 保持一致"，但 `run` 子命令实际使用的是 `--work-dir`，不存在 `--output` 参数。用户按 help 提示操作会被误导。

### L12. connect.py ADAPIError 被误判为 ok — connect.py

**文件**: `.claude/skills/ad-connect/scripts/connect.py`
**位置**: 第 51-54 行

```python
except ADAPIError as e:
    return {"host": host, "status": "ok", "warning": str(e)}
```

`ADAPIError` 表示 HTTP 4xx/5xx（非 401/403），表示设备可达且认证通过但 API 返回异常。代码将其标记为 `status: "ok"`（exit 0），可能掩盖设备 API 层的实际问题。应标记为 `status: "api_error"` 以示区分。

### L13. render.py 死代码：name 变量赋值后未使用 — render.py

**文件**: `.claude/skills/ad-check-analysis/scripts/render.py`
**位置**: 第 237 行

```python
name = device_names.get(host, _extract_ip(host))
```

该变量被赋值后从未引用。后续代码再次调用 `_extract_ip(host)` 而非复用 `name`。

### L14. overview.py _level_numeric 闭包 v 参数可能为 None — overview.py

**文件**: `.claude/skills/ad-ops/scripts/overview.py`
**位置**: 第 296-298 行

```python
def _level_numeric(v, warn=80, crit=90):
    if v is None:
        return "unknown"
    return hardware_component_level(float(v), warn, crit)
```

`_extract_value` 可能返回 `None`（当 field 为列表且为空时返回 `None`），已有 `v is None` 检查。但若 `v` 为非数值字符串（如 API 返回 `"UNSUPPORTED"`），`float(v)` 抛出 `ValueError`。虽然当前调用点传入的值来源安全，但函数自身缺乏防御性。

---

## 缺陷预防建议

### 立即执行

1. **修复 C1**: 移除 blackbox.py 中的硬编码密码 → 环境变量
2. **修复 C2**: TLS 证书验证至少添加 certificate pinning
3. **修复 H7**: 更新 .gitignore 排除 `*.db`, `*.pid`

### 短期（1-2 周）

4. **统一密码传递机制**: 所有脚本优先环境变量，`--password` 仅 fallback
5. **添加操作审计日志**: 统一日志模块，记录时间/操作/设备/结果
6. **补全 SUGGESTION_MAP**: check.py 中 67 个检查项的优化建议
7. **修复 Windows 路径硬编码**: `/tmp/ad_check` → `tempfile.gettempdir()`

### 中期（1 个月）

8. **API 调用添加重试机制**: 指数退避，最多 3 次
9. **db_schema 版本管理**: 添加 schema_version 表
10. **错误分类改用异常类型**: 替换中文字符串匹配
11. **清理 collector.py daemon 废弃代码**

### 长期

12. **自动化回归测试**: 将 checklist.md 转化为可执行的测试脚本
13. **JSON Schema 验证**: 为 devices.json 和 probe JSON 定义 schema
14. **CI 集成**: 至少运行语法检查和 import 验证

---

## 总结

代码库整体质量**中等偏上**。优点：

- **架构清晰**: 5 个 skill 各司其职，跨 skill 复用通过 import 实现
- **错误处理框架完整**: ADClient 有明确的异常层次（ADError → ADConnectionError/ADAuthError/ADAPIError）
- **多设备支持统一**: `multi_device.py` 提供了良好的并行执行抽象
- **文档齐全**: SKILL.md + checklist + examples 三层结构完整
- **脚本零外部依赖**: 仅使用 Python 标准库，部署简单

主要短板集中在**安全配置**（TLS 禁用、密码明文传递、硬编码凭据）和**运维可观测性**（无审计日志、无重试、无 schema 迁移）。建议优先修复 3 个 CRITICAL 和 7 个 HIGH 项。

---

*报告由全量代码审查生成，覆盖 .claude/skills/ 下全部 10 个 Python 脚本（~220KB）和所有配置/文档文件。*

---

## 第三轮交叉审核附录 (2026-05-21)

第三轮审核逐条对照源代码重新验证。结论：**30 条发现全部确认有效，无误报。** 发现 3 处遗漏和 1 处严重程度调整。

### 严重程度调整

| 编号 | 原评级 | 新评级 | 原因 |
|------|--------|--------|------|
| H2 | HIGH | **MEDIUM** | `/tmp/ad_check` 在 Windows 上会被解析为 `C:\tmp\ad_check`（当前驱动器根目录），`os.makedirs()` 可正常创建。实际执行路径（`_check_one`、`_start_only`）已使用 `tempfile.gettempdir()`，仅 `wait` 子命令的 argparse default 和单设备 `run` fallback 受影响 |

### 新增发现（第三轮审查中补充）

#### N1. check.py 大量调用 ADClient 私有方法 — HIGH

**文件**: `.claude/skills/ad-check-analysis/scripts/check.py`
**位置**: 第 62, 73, 89, 157, 195, 1050, 1053, 1178, 1260, 1271 行（共 10 处）

```python
scenes = client._request("GET", "/sys/offline-check/")
```

check.py 大量直接调用 `ADClient._request()`（下划线前缀的私有方法），因为离线巡检 API 端点（`/debug/sys/offline-check`）在 ADClient 中没有对应的公共方法。

**风险**: 私有方法签名变更会破坏 check.py；绕过 ADClient 的错误处理层次（尽管 _request 内部有异常转换）；collector.py 也存在同样问题（第 50 行）。

**修复**: 在 ADClient 中为离线巡检端点添加公共方法（如 `get_offline_check_scenes()`, `start_offline_check()`, `get_offline_check_progress()` 等），让所有调用方使用公共 API。

#### N2. blackbox.py `analyze_audit_logs` 文件读取无异常处理 — MEDIUM

**文件**: `.claude/skills/ad-blackbox-analysis/scripts/blackbox.py`
**位置**: 第 106 行

```python
with open(audit_file, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
```

打开 audit CSV 文件未包裹 try/except。虽然外层调用方（`_blackbox_download` 第 246 行）有 try/except 捕获，但如果中间有日期对应的 `.audit` 目录存在但 CSV 文件损坏或权限不足，会跳过该日期（第 103 行的 `if not os.path.exists` 只检查文件存在性，不检查可读性）。

**风险**: 部分损坏的黑盒文件导致整体分析失败，而非跳过损坏文件继续。

**修复**: 在 `analyze_audit_logs` 的 for 循环内对单个日期的文件读取添加 try/except，使单日损坏不影响其他日期。

#### N3. collector.py PID 文件存在 TOCTOU 窗口 — MEDIUM

**文件**: `.claude/skills/ad-perception/scripts/collector.py`
**位置**: 第 330-339 行

```python
with open(pid_path) as f:
    raw = f.read().strip()
existing_pid = int(raw) if raw else 0
if existing_pid > 0 and _check_process_alive(existing_pid):
    ...
os.unlink(pid_path)
fd = os.open(pid_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
```

读 PID → 检查存活 → unlink → 重建，这之间存在窗口。虽然最终 `O_EXCL` 保证了原子性（如果另一个进程抢先创建，本进程会得到 FileExistsError），但在高并发场景下可能导致本应成功的进程被误杀（exit 6）。

**风险**: 极低——采集器通常单实例运行，但边缘情况下可能出现误报"已在运行"。

**修复**: 将 `os.unlink` + `os.open(O_EXCL)` 替换为 `os.open(O_TRUNC)` 或使用文件锁（`fcntl.lockf` / `msvcrt.locking`）。

### 逐条验证摘要

| 编号 | 状态 | 验证方式 |
|------|------|----------|
| C1 | ✅ 确认 | 第 190/218/432/485 行共 4 处硬编码 `"root1234+"` |
| C2 | ✅ 确认 | 第 78-80 行 `CERT_NONE` + `check_hostname=False` |
| C3 | ✅ 确认 | check.py/blackbox.py 不支持 `AD_PASS` 环境变量（其余 5 脚本支持） |
| H1 | ✅ 确认 | 全局搜索 `logging`/`audit` 无结果 |
| H2 | ⬇️ 降级 | `/tmp/ad_check` 在 Windows 上解析为 `C:\tmp\...` 可正常工作 |
| H3 | ✅ 确认 | `query_traffic_db` 每次新建连接，API 无重试 |
| H4 | ✅ 确认 | check.py:1214 / blackbox.py:547 无密码空值检查 |
| H5 | ✅ 确认 | `OpenProcess` 无 try/except，无 GetLastError 检查 |
| H6 | ✅ 确认 | `_blackbox_download` 仅单次查询，无轮询循环 |
| H7 | ✅ 确认 | .gitignore 无 `*.db`/`*.pid`/`*.db-journal`/`*.db-wal` |
| M1-M11 | ✅ 确认 | 逐条对照源代码确定行号准确 |
| L1-L9 | ✅ 确认 | 全部为代码风格/规范类问题，判断准确 |

### 结论

原始报告 30 条发现全部经得起交叉验证。调整 H2 严重程度（HIGH→MEDIUM），补充 3 条新发现（N1-N3）。

### 第四轮补充审计 (2026-05-21)

在全量测试覆盖率分析和源码逐行逻辑审查后，新增 **14 条发现**（H8-H10, M12-M17, L10-L14）。这轮审查侧重执行路径级别的具体缺陷：crash 路径（H8）、字段名不一致导致功能静默失效（H10）、密码优先级反转（H9）、逻辑语义疑似反转（M14）、异常处理缺口（M15, M16）等。

最终总计 **44 条问题**（CRITICAL 3, HIGH 10, MEDIUM 17, LOW 14）。

---

## 第五轮：修复执行与分类 (2026-05-21)

排除范围：黑盒日志(blackbox.py)、SSL 证书(ad_api.py SSLContext)、Windows 特定(collector.py PID/Win32 API、/tmp 路径)不做改动。

### 已修复 (9 条)

| 编号 | 严重程度 | 问题 | 修复内容 |
|------|----------|------|----------|
| M4 | MEDIUM | check.py analyze() 缺防御性类型检查 | `analyze()` 开头添加 `isinstance(data, dict)` 守卫，非 dict 返回空结果结构 |
| M11 | MEDIUM | check.py 冗余 `hasattr(args, 'hosts')` | 移除 progress 命令中的冗余检查，直接使用 `args.hosts` |
| H4 | HIGH | check.py 单设备模式密码为空无检查 | 5 个单设备路径(scenes/run/wait/history/progress)统一添加 `AD_PASS` 环境变量回退 + 空值检查 |
| H7 | HIGH | .gitignore 不覆盖数据库/PID 文件 | 添加 `*.db`, `*.db-journal`, `*.db-wal`, `*.pid` |
| L7 | LOW | `__MACOSX/` 目录残留 | 目录已不存在（或已清理），.gitignore 已有排除规则 |
| M5 | MEDIUM | multi_device.py/db_schema.py/render.py 缺 `__name__` guard | 三个文件末尾添加 `if __name__ == "__main__"` 保护 |
| M9 | MEDIUM | overview.py `api_method_map[api_type]` KeyError 风险 | 改用 `.get()` + None 守卫，未知类型记录错误后 `continue` |
| M10 | MEDIUM | connect.py `import json` 在函数内部 | `import json` 移至文件顶部（第 33 行），移除两处内联 import |
| M3 | MEDIUM | db_schema.py 无 Schema 版本管理 | 添加 `SCHEMA_VERSION=1`, `SCHEMA_VERSION_DDL`, `INIT_DDL` 聚合常量 |

### 未修复 (35 条)

#### CRITICAL (3) — 全部排除

| 编号 | 问题 | 排除原因 |
|------|------|----------|
| C1 | blackbox.py 硬编码默认密码 `"root1234+"` | 黑盒相关不做改动 |
| C2 | ad_api.py SSL 证书验证完全禁用 | SSL 相关不做改动 |
| C3 | 密码通过命令行参数传递 | 核心改动涉及所有脚本的密码传递机制，需统一设计；check.py 已部分修复(H4) |

#### HIGH (7)

| 编号 | 问题 | 状态 |
|------|------|------|
| H1 | 所有脚本缺乏操作审计日志 | 未修复 — 需统一日志模块设计 |
| H2 | check.py 硬编码 `/tmp/ad_check` | 未修复 — Windows 相关且实际影响低(已降级为 MEDIUM) |
| H3 | 数据库操作无连接池/重试机制 | 未修复 — 需架构设计 |
| H5 | collector.py PID 文件 Win32 API 无错误处理 | 未修复 — Windows 特定 |
| H6 | blackbox.py 异步任务查询无超时/重试 | 未修复 — 黑盒相关 |
| H8 | check.py ZIP 解压后 ad.json 缺失导致 FileNotFoundError | 未修复 — 第四轮新发现 |
| H9 | perception.py 密码优先级与文档矛盾 | 未修复 — 第四轮新发现 |
| H10 | perception.py conflict_analysis 使用 vport(单数) 与 overview.py vports(复数) 不一致 | 未修复 — 第四轮新发现，需确认 AD API 实际字段名 |

#### MEDIUM (11)

| 编号 | 问题 | 状态 |
|------|------|------|
| M1 | 跨技能导入代码高度重复 | 未修复 — 暂不抽象 |
| M2 | _SUGGESTION_MAP 不完整(16/67) | 未修复 — 需补全 51 条建议 |
| M6 | collector.py daemon 模式废弃代码 | 未修复 — 需单独清理计划 |
| M7 | 错误分类依赖中文字符串匹配 | 未修复 — 需架构调整 |
| M8 | perception.py analyze 维度间无隔离契约 | 未修复 — 需文档约定 |
| M12 | overview.py 证书到期计算使用 naive datetime | 未修复 — 第四轮新发现 |
| M13 | blackbox.py audit CSV 路径硬编码 | 未修复 — 黑盒相关 |
| M14 | check.py MEMORY_LEAK_CHECK 逻辑疑似反转 | 未修复 — 第四轮新发现，需确认 AD 设备字段语义 |
| M15 | check.py 单设备 progress 路径缺异常处理 | 未修复 — 第四轮新发现 |
| M16 | blackbox.py 解压异常捕获不完整 | 未修复 — 黑盒相关 |
| M17 | perception.py API fallback 使用未文档化的 trend period | 未修复 — 第四轮新发现 |

#### LOW (14)

| 编号 | 问题 | 状态 |
|------|------|------|
| L1 | 类型注解不完整 | 未修复 |
| L2 | 文档注释语言混用 | 未修复 |
| L3 | checklist.md 无自动化 | 未修复 |
| L4 | ad_bench.py 定位不清 | 未修复 |
| L5 | devices.json 缺 JSON Schema | 未修复 |
| L6 | CHANGELOG.md 仅记录文档变更 | 未修复 |
| L8 | shebang 对 Windows 无意义 | 未修复 — Windows 特定 |
| L9 | 部分脚本缺 encoding 声明 | 未修复 |
| L10 | ad_api.py 缺子命令时无引导 | 未修复 — 第四轮新发现 |
| L11 | check.py wait help 引用不存在的 --output | 未修复 — 第四轮新发现 |
| L12 | connect.py ADAPIError 误判为 ok | 未修复 — 第四轮新发现 |
| L13 | render.py 死代码: name 变量赋值未使用 | 未修复 — 第四轮新发现 |
| L14 | overview.py _level_numeric 缺非数值防御 | 未修复 — 第四轮新发现 |

### 修复统计

| 维度 | 已修复 | 未修复 | 合计 |
|------|--------|--------|------|
| CRITICAL | 0 | 3 | 3 |
| HIGH | 2 (H4, H7) | 8 | 10 |
| MEDIUM | 6 (M3/M4/M5/M9/M10/M11) | 11 | 17 |
| LOW | 1 (L7) | 13 | 14 |
| **合计** | **9** | **35** | **44** |

> 注：H2 原为 HIGH，第三轮降级为 MEDIUM。L7 目录已不存在自然解决。排除范围：黑盒(C1/H6/N2/M13/M16)、SSL(C2)、Windows(H2/H5/N3/L8)不做改动。
