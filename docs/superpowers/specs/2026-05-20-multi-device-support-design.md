# AD Skills 多设备支持 设计文档

> 日期: 2026-05-20 | 状态: v2 (4-agent 并行审核后修订) | 实现方式: ThreadPoolExecutor + threading.Event

## 1. 背景

当前所有 4 个 Skill 只接受单个 `--host`，不支持多设备批量操作。

## 2. 设计决策

### 2.1 整体方案

**ThreadPoolExecutor 并行 + `--hosts` 逗号分隔为主，`--devices` JSON 为辅。**

```bash
# 同密码多设备（推荐，覆盖 90% 场景）
python overview.py all --hosts "https://192.168.8.30,https://192.168.8.31" --password xxx

# 异密码多设备（高级选项）
python overview.py all --devices devices.json
```

- **`--hosts` 为主推**：LLM 一次调用完成，无需创建文件
- **`--devices` 为备选**：仅当设备密码不同时使用
- `--host` 单设备模式完全保留

### 2.2 并行模型

```python
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FutureTimeout

MAX_WORKERS = 10  # 硬上限，防止 API 限流

def _resolve_pw(d, fallback=""):
    """解析设备密码：password 字段 > password_from 环境变量 > fallback"""
    if d.get("password"):
        return d["password"]
    if d.get("password_from"):
        return os.environ.get(d["password_from"], "")
    return fallback

def run_multi(devices, func, **kwargs):
    """
    devices: list of dicts [{host, user, password, name}, ...]
    func: callable(client, **kwargs) -> result dict
    kwargs: 公共参数传给 func（如 subcommand, scene, work_dir_base 等）
    """
    results = {}
    common_pw = kwargs.pop("password", os.environ.get("AD_PASS", ""))
    total_timeout = kwargs.pop("_timeout", 900)  # 最长 15 分钟
    with ThreadPoolExecutor(max_workers=min(len(devices), MAX_WORKERS)) as ex:
        futures = {}
        # 解析密码：password 字段 > password_from 环境变量 > 公共 --password > AD_PASS
        def _resolve_pw(d, fallback=""):
            if d.get("password"):
                return d["password"]
            if d.get("password_from"):
                return os.environ.get(d["password_from"], "")
            return fallback

        for d in devices:
            pw = _resolve_pw(d, common_pw)
            client = ADClient(
                host=d["host"],
                username=d.get("user", "admin"),
                password=pw
            )
            # 只传 func 需要的参数，不是 **d
            futures[ex.submit(func, client, **kwargs)] = d

        deadline = time.monotonic() + total_timeout
        for f in as_completed(futures, timeout=total_timeout):
            d = futures[f]
            remaining = deadline - time.monotonic()
            try:
                if remaining <= 0:
                    raise FutureTimeout("全局超时")
                results[d["host"]] = f.result(timeout=max(remaining, 1))
            except FutureTimeout:
                results[d["host"]] = {"error": "超时（仍在执行）"}
            except Exception as e:
                results[d["host"]] = {"error": f"{type(e).__name__}: {e}"}
    return results
```

**关键设计约束**：
- `func` 签名统一为 `func(client, **kwargs)` — 不接受设备字典展开
- 被 submit 的函数**不得调用 `sys.exit()`**，必须通过异常或返回值报告错误
- `as_completed(timeout=...)` 防止单设备永久挂起阻塞全部
- `max_workers` 硬上限 10，防止 API 限流
- 线程超时后不强制终止（Python 限制），标注"仍在执行"

### 2.3 各脚本改动

#### overview.py

- 新增 `--hosts` 参数（逗号分隔）
- 提交给线程的函数：`_overview_one(client, subcommand)`  → 调用 `build_overview()` + `render_markdown()`
- 输出：每设备 `## {name or host}` 分块
- 退出码：全部成功 → 0，部分失败 → 7，全部失败 → 1

#### perception.py

- 新增 `--hosts` 参数
- 提交函数：`_analyze_one(client, db_path, disk_source)` → 调用 `analyze_full()`
- 采集器改造见 2.4
- 退出码同上

#### check.py

- 巡检流程必须合并为原子操作（不能拆 run + wait 两步）
- 新增内部函数 `_check_one(client, scene, force, work_dir)`：
  1. `start_check(client, scene, force, work_dir)` — 启动
  2. `wait_and_download(client, work_dir, _sleeper=time.sleep)` — 轮询+下载
  3. `analyze(ad_json)` — 分析
  4. `render_markdown(analysis, meta)` — 渲染
  5. 返回结果 dict
- work_dir 自动派生：`{tmp}/ad_check_{host_slug}/`（slug = host 去特殊字符）
- 退出码同上
- **子命令支持矩阵**：

| 子命令 | 多设备 | 说明 |
|--------|--------|------|
| `run` | ✅ | `--hosts` 并行启动多台巡检 |
| `scenes` | ❌ | 无意义（场景列表是设备相关的） |
| `progress` | ❌ | 单设备查询 |
| `history` | ✅ | 并行查询多台历史 |
| `analyze` | ❌ | 用 `--path` 不连设备 |

#### blackbox.py

- 新增 `--hosts` 参数
- 提交函数：`_blackbox_one(client, from_date, to_date, archive_password, output_dir)` → 完整导出流程
- 每设备独立 `output_dir`：`{output_base}/{host_slug}/`
- 退出码同上

### 2.4 采集器多线程

采集器不用 `ThreadPoolExecutor`（长期运行不适合线程池），改用裸 `threading.Thread` + `threading.Event`。

```python
import threading

def run_collector_multi(devices, db_paths, interval=30):
    stop_event = threading.Event()
    threads = []
    collectors = []
    for d in devices:
        pw = _resolve_pw(d)
        c = VSCollector(d["host"], pw, d.get("user", "admin"),
                        db_path=db_paths[d["host"]], interval=interval)
        c.stop_event = stop_event  # 注入停止信号
        t = threading.Thread(target=_collect_loop, args=(c,), daemon=True)
        t.start()
        threads.append(t)
        collectors.append(c)

    # 主线程等待信号
    signal.signal(signal.SIGINT, lambda s, f: stop_event.set())
    if hasattr(signal, 'SIGBREAK'):
        signal.signal(signal.SIGBREAK, lambda s, f: stop_event.set())

    for t in threads:
        t.join()  # 等待所有线程因 stop_event 退出

    for c in collectors:
        c.close_db()

def _collect_loop(collector):
    collector.open_db()
    collector.cleanup_old_data()
    max_consecutive_failures = 30  # 15分钟
    while not collector.stop_event.is_set():
        try:
            collector.run_once()
        except Exception as e:
            collector.consecutive_failures += 1
            print(f"[{collector.host_slug}] 采集异常: {e}", file=sys.stderr)
            if collector.consecutive_failures >= max_consecutive_failures:
                collector.fatal_error = str(e)
                collector.stop_event.set()  # 停止该设备采集
                break
        collector.stop_event.wait(timeout=collector.interval)
    collector.close_db()
```

**关键**：
- 信号处理器只 set event，不做 `sys.exit()`
- 每设备独立 DB（已支持，host 派生文件名）
- 每线程独立 SQLite 连接
- `run_once()` 中 `sys.exit(3)` 改为抛异常（线程中不能 exit）

### 2.5 输出格式

#### Markdown

每台设备分块前加汇总表：

```markdown
# AD Device Overview — 多设备

| 设备 | 状态 | CPU | 内存 |
|------|------|-----|------|
| AD1 (192.168.8.30) | ✅ 正常 | 17% | 42% |
| AD2 (192.168.8.31) | ⚠️ 警告 | 85% | 37% |

---

## AD1 (https://192.168.8.30)
... 正常单设备输出 ...

## AD2 (https://192.168.8.31)
... 正常单设备输出 ...

---

> 1/2 台正常，1/2 台异常。部分失败 (exit 7)
```

#### JSON

```json
{
  "mode": "multi",
  "summary": {"total": 2, "success": 1, "failed": 1},
  "results": {
    "192.168.8.30": { ... },
    "192.168.8.31": { "error": "ADConnectionError: 连接失败" }
  }
}
```

### 2.6 错误处理 + 退出码

| 场景 | 退出码 |
|------|--------|
| 全部设备成功 | 0 |
| 全部设备失败 | 1 |
| 认证失败（全部） | 2 |
| 部分成功部分失败 | **7**（区别于 exit 6 采集器重复启动、exit 5 单设备超时） |
| 参数错误 | 4 |

### 2.7 线程安全约束

- **ADClient**：无共享可变状态，每设备独立实例，天然线程安全
- **SQLite**：每设备独立文件 + 独立连接，`check_same_thread=False` 显式设置
- **多线程 print**：结果输出在主线程（收集完再输出）；进度日志加 `[{host_slug}]` 前缀
- **sys.exit() 禁令**：被 submit 的函数禁止调用 `sys.exit()`，通过异常上报错误

### 2.8 向后兼容

- `--host` 单设备模式行为完全不变
- `--hosts` 和 `--host` 不互斥：同时传入时 `--hosts` 优先，`--host` 忽略（带 stderr warning）
- `AD_HOST` 环境变量仅在单设备模式生效，`--hosts` 模式下忽略

### 2.9 SKILL.md 更新

4 个 SKILL.md 各做以下改动：

#### 2.9.1 脚本强制规则表新增多设备行

| Skill | 新增行 |
|-------|--------|
| ad-ops | `多设备总览 \| python .claude/skills/ad-ops/scripts/overview.py all --hosts "..."` |
| ad-perception | `多设备感知分析 \| python scripts/perception.py analyze --hosts "..."` |
| ad-check-analysis | `多设备巡检 \| python scripts/check.py run --hosts "..." --scene "..."` |
| ad-blackbox-analysis | `多设备黑盒 \| python scripts/blackbox.py --hosts "..." --from-date ...` |

#### 2.9.2 CLI 命令参考补充

- **ad-ops**：补充 `overview.py` 完整 CLI（当前缺失，只列出了 `ad_api.py`）
- **ad-perception**：修复跨 Skill CLI 路径——`scripts/overview.py` 改为 `../ad-ops/scripts/overview.py` 或绝对路径

#### 2.9.3 多设备触发决策树

```markdown
### 多设备判断

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`（单台设备行为与 `--host` 等价）
4. 密码不同时 → 必须用 `--devices` JSON 文件
```

#### 2.9.4 设备注册权威来源

在项目根新建 `devices.json` 作为 4 个 Skill 的统一设备表：

```json
{
  "devices": [
    {"name": "AD1", "host": "https://192.168.8.30", "user": "admin", "password_from": "AD1_PASS"},
    {"name": "AD2", "host": "https://192.168.8.31", "user": "admin", "password_from": "AD2_PASS"}
  ]
}
```

密码通过 `password_from` 引用环境变量名，禁止明文。4 个 SKILL.md 的"已知设备"表统一引用此文件。

#### 2.9.5 报告展示规则补充

```markdown
- 多设备输出含汇总表 + 每设备分块，可能较长
- LLM 全文展示，不截断、不折叠、不选择性展示
- 超过单条消息限制时分多条展示（保持设备分块完整）
```

## 3. 改动范围

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `ad-ops/scripts/overview.py` | 修改 | 加 `--hosts` + `run_multi()` + ThreadPoolExecutor |
| 2 | `ad-perception/scripts/perception.py` | 修改 | 同上 |
| 3 | `ad-perception/scripts/collector.py` | 修改 | 多线程采集 + threading.Event + sys.exit(3)→异常 |
| 4 | `ad-check-analysis/scripts/check.py` | 修改 | `_check_one()` 原子化 + 子命令矩阵 |
| 5 | `ad-blackbox-analysis/scripts/blackbox.py` | 修改 | `--hosts` + 独立输出目录 |
| 6 | `ad-ops/SKILL.md` | 修改 | 加多设备 CLI + 脚本强制规则行 + overview.py CLI 补充 |
| 7 | `ad-perception/SKILL.md` | 修改 | 加多设备 CLI + 修复跨 Skill 路径 |
| 8 | `ad-check-analysis/SKILL.md` | 修改 | 加多设备 CLI + 触发决策树 |
| 9 | `ad-blackbox-analysis/SKILL.md` | 修改 | 加多设备 CLI |
| 10 | `devices.json` | **新建** | 统一设备注册表（password_from 环境变量引用） |
| 11 | `test/test_multi_device.py` | 新建 | Mock 多设备并行测试 |

## 4. 风险

- 线程数上限 10，设备数 > 10 时分批执行（自动排队）
- 采集器长期运行需要系统守护（systemd / 任务计划）
- 多线程 `print()` 进度日志可能交错（带 host_slug 前缀可区分）
- `concurrent.futures` 无法强制终止超时线程（Python 限制）

## 5. 不变约束

- 零外部依赖（concurrent.futures + threading 均为 stdlib）
- 脚本固化所有逻辑，LLM 只调度+展示
- Markdown/JSON 双输出
- 单设备模式行为不变
- 被 submit 的函数不得调用 `sys.exit()`，通过异常或返回值报告错误
