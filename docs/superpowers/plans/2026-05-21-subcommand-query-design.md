# Subcommand Query Design — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `--hosts`/`--devices` multi-device support to ad_api.py and update all 4 SKILL.md files with子命令选择决策 (subcommand selection decision) chapters.

**Architecture:** Extract ad_api.py's command dispatch into a reusable `_execute_command(client, args)` function, add `--hosts`/`--devices` args, and gate between single-device (existing) and multi-device (new, via `run_multi`) paths. Update 4 SKILL.md files using 3 distinct templates: resource-type (ad-ops), workflow-type (check/blackbox), hybrid-type (perception).

**Tech Stack:** Python 3.14 (argparse, multi_device.py shared module), Markdown (SKILL.md)

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `.claude/skills/ad-ops/scripts/ad_api.py` | Modify | Add `--hosts`/`--devices` + `_execute_command` extraction |
| `.claude/skills/ad-ops/SKILL.md` | Modify | Add resource-type decision table + trigger word rules |
| `.claude/skills/ad-check-analysis/SKILL.md` | Modify | Add workflow-type task→command mapping |
| `.claude/skills/ad-perception/SKILL.md` | Modify | Add hybrid-type decision table + param filter column |
| `.claude/skills/ad-blackbox-analysis/SKILL.md` | Modify | Add workflow-type task→command mapping |

---

### Task 1: Add multi_device import to ad_api.py

**Files:**
- Modify: `.claude/skills/ad-ops/scripts/ad_api.py:18` (after last import)

- [ ] **Step 1: Add import for multi_device helpers**

After line 18 (`from typing import Any, Dict, Optional`), add:

```python
# Multi-device support (deferred import in multi_device.py avoids circular dependency)
from multi_device import (
    run_multi, parse_hosts_arg, load_devices_json,
    compute_multi_exit_code, host_slug,
)
```

- [ ] **Step 2: Verify import works**

```powershell
& "$env:USERPROFILE\.local\bin\python3.14.exe" -c "import sys; sys.path.insert(0, '.claude/skills/ad-ops/scripts'); from ad_api import ADClient; from multi_device import run_multi; print('imports OK')"
```

Expected: `imports OK`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-ops/scripts/ad_api.py
git commit -m "feat(ad_api): add multi_device imports for --hosts support"
```

---

### Task 2: Extract `_execute_command` function

**Files:**
- Modify: `.claude/skills/ad-ops/scripts/ad_api.py:447` (before `def main()`)

- [ ] **Step 1: Add `_execute_command` function before `def main()`**

Insert after line 446 (before `def main():`):

```python
def _execute_command(client, args):
    """Execute a parsed command on a single ADClient. Returns result dict.
    
    Does NOT print output or call sys.exit — the caller handles presentation.
    Used by both single-device (direct call) and multi-device (via run_multi) paths.
    """
    if args.command == "login":
        return {"_login_success": True, "data": client.get_users()}

    elif args.command == "users":
        if args.subcommand == "list":
            return client.get_users()
        elif args.subcommand == "get":
            return client.get_user(args.name)

    elif args.command == "slb":
        if args.subcommand == "list":
            return client.get_virtual_services()
        elif args.subcommand == "get":
            return client.get_virtual_service(args.name)

    elif args.command == "pool":
        if args.subcommand == "list":
            return client.get_pools()
        elif args.subcommand == "get":
            return client.get_pool(args.name)

    elif args.command == "stat":
        if args.subcommand == "device":
            return client.get_system_status()
        elif args.subcommand == "sys":
            return client.get_sys_system()
        elif args.subcommand == "vs":
            return client.get_vs_stat()
        elif args.subcommand == "vs-get":
            return client.get_vs_stat_by_name(args.name)
        elif args.subcommand == "trend":
            items = args.items.split(",") if args.items else None
            return client.get_vs_summary_trend(items=items, trend=args.trend)
        elif args.subcommand == "vs-trend":
            items = args.items.split(",") if args.items else None
            return client.get_vs_trend_by_name(args.name, items=items, trend=args.trend)
        elif args.subcommand == "pool":
            return client.get_pool_node_stat(args.pool)
        elif args.subcommand == "nodes":
            return client.get_all_node_stat()
        elif args.subcommand == "cpu":
            return client.get_cpu_status()
        elif args.subcommand == "mem":
            return client.get_memory_status()
        elif args.subcommand == "disk":
            return client.get_disk_status()
        elif args.subcommand == "net":
            return client.get_network_status()

    elif args.command == "cert":
        if args.subcommand == "list":
            return client.get_ssl_certificates()

    elif args.command == "log":
        if args.subcommand == "service":
            return client.get_service_log(limit=args.limit)

    elif args.command == "ha":
        if args.subcommand == "status":
            return client.get_ha_status()
        elif args.subcommand == "cluster":
            return client.get_ha_cluster()

    return None
```

- [ ] **Step 2: Verify the function is syntactically valid**

```powershell
& "$env:USERPROFILE\.local\bin\python3.14.exe" -c "import sys; sys.path.insert(0, '.claude/skills/ad-ops/scripts'); import ast; ast.parse(open('.claude/skills/ad-ops/scripts/ad_api.py', encoding='utf-8').read()); print('syntax OK')"
```

Expected: `syntax OK`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-ops/scripts/ad_api.py
git commit -m "refactor(ad_api): extract _execute_command for multi-device reuse"
```

---

### Task 3: Add --hosts/--devices args to ad_api.py

**Files:**
- Modify: `.claude/skills/ad-ops/scripts/ad_api.py:465-479` (args section)

- [ ] **Step 1: Add --hosts and --devices arguments**

After the `--password` argument (after line 469), before `--json`, insert:

```python
    parser.add_argument(
        "--hosts",
        default=os.environ.get("AD_HOSTS", ""),
        help="多设备地址，逗号分隔 (如 https://IP1,https://IP2)",
    )
    parser.add_argument(
        "--devices",
        default="",
        help="设备清单 JSON 文件路径 (密码不同时使用)",
    )
```

- [ ] **Step 2: Verify args parse correctly**

```powershell
& "$env:USERPROFILE\.local\bin\python3.14.exe" .claude/skills/ad-ops/scripts/ad_api.py --help
```

Expected: Help output includes `--hosts` and `--devices` options.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-ops/scripts/ad_api.py
git commit -m "feat(ad_api): add --hosts and --devices CLI arguments"
```

---

### Task 4: Add multi-device dispatch to main()

**Files:**
- Modify: `.claude/skills/ad-ops/scripts/ad_api.py:548-566` (after `args = parser.parse_args()`)

- [ ] **Step 1: Replace arg validation block with multi-device-aware version**

Replace lines 548-566:
```python
    args = parser.parse_args()

    # 检查参数
    if not args.host:
        print("错误: 未指定 AD 设备地址", file=sys.stderr)
        print("使用 --host 或设置环境变量 AD_HOST", file=sys.stderr)
        sys.exit(4)

    if not args.password:
        print("错误: 未指定密码", file=sys.stderr)
        print("使用 --password 或设置环境变量 AD_PASS", file=sys.stderr)
        sys.exit(4)

    # 创建客户端
    client = ADClient(
        host=args.host,
        username=args.user,
        password=args.password,
    )

    # 输出选项
    output_options = {"indent": 2 if args.pretty else None}

    def output(data: Dict) -> None:
        """输出数据"""
        if args.json:
            print(json.dumps(data, **output_options))
        elif args.pretty:
            print(json.dumps(data, **output_options, ensure_ascii=False))
        else:
            print(json.dumps(data, **output_options))
```

With:

```python
    args = parser.parse_args()

    # --- Multi-device mode ---
    if args.hosts or args.devices:
        # login is single-device only
        if args.command == "login":
            print("错误: login 不支持多设备模式，请使用 --host", file=sys.stderr)
            sys.exit(4)

        # --hosts and --host conflict
        if args.hosts and args.host:
            print("警告: --hosts 和 --host 同时指定，--host 将被忽略", file=sys.stderr)

        # Resolve devices
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, args.password)
        else:
            devices = load_devices_json(args.devices)

        if not devices:
            print("错误: 设备列表为空", file=sys.stderr)
            sys.exit(4)

        # Parallel execution
        results = run_multi(devices, _execute_command, args=args)
        print(json.dumps(results, indent=2, ensure_ascii=False))
        sys.exit(compute_multi_exit_code(results))

    # --- Single-device mode (unchanged) ---
    if not args.host:
        print("错误: 未指定 AD 设备地址", file=sys.stderr)
        print("使用 --host 或设置环境变量 AD_HOST", file=sys.stderr)
        sys.exit(4)

    if not args.password:
        print("错误: 未指定密码", file=sys.stderr)
        print("使用 --password 或设置环境变量 AD_PASS", file=sys.stderr)
        sys.exit(4)

    # 创建客户端
    client = ADClient(
        host=args.host,
        username=args.user,
        password=args.password,
    )

    # 输出选项
    output_options = {"indent": 2 if args.pretty else None}

    def output(data: Dict) -> None:
        """输出数据"""
        if args.json:
            print(json.dumps(data, **output_options))
        elif args.pretty:
            print(json.dumps(data, **output_options, ensure_ascii=False))
        else:
            print(json.dumps(data, **output_options))
```

- [ ] **Step 2: Replace try/except command dispatch block**

Replace lines 580-652:
```python
    # 执行命令
    try:
        if args.command == "login":
            result = client.get_users()
            print("✓ 登录成功")
            output(result)

        elif args.command == "users":
            if args.subcommand == "list":
                output(client.get_users())
            elif args.subcommand == "get":
                output(client.get_user(args.name))

        elif args.command == "slb":
            if args.subcommand == "list":
                output(client.get_virtual_services())
            elif args.subcommand == "get":
                output(client.get_virtual_service(args.name))

        elif args.command == "pool":
            if args.subcommand == "list":
                output(client.get_pools())
            elif args.subcommand == "get":
                output(client.get_pool(args.name))

        elif args.command == "stat":
            if args.subcommand == "device":
                output(client.get_system_status())
            elif args.subcommand == "sys":
                output(client.get_sys_system())
            elif args.subcommand == "vs":
                output(client.get_vs_stat())
            elif args.subcommand == "vs-get":
                output(client.get_vs_stat_by_name(args.name))
            elif args.subcommand == "trend":
                items = args.items.split(",") if args.items else None
                output(client.get_vs_summary_trend(items=items, trend=args.trend))
            elif args.subcommand == "vs-trend":
                items = args.items.split(",") if args.items else None
                output(client.get_vs_trend_by_name(args.name, items=items, trend=args.trend))
            elif args.subcommand == "pool":
                output(client.get_pool_node_stat(args.pool))
            elif args.subcommand == "nodes":
                output(client.get_all_node_stat())
            elif args.subcommand == "cpu":
                output(client.get_cpu_status())
            elif args.subcommand == "mem":
                output(client.get_memory_status())
            elif args.subcommand == "disk":
                output(client.get_disk_status())
            elif args.subcommand == "net":
                output(client.get_network_status())

        elif args.command == "cert":
            if args.subcommand == "list":
                output(client.get_ssl_certificates())

        elif args.command == "log":
            if args.subcommand == "service":
                output(client.get_service_log(limit=args.limit))

        elif args.command == "ha":
            if args.subcommand == "status":
                output(client.get_ha_status())
            elif args.subcommand == "cluster":
                output(client.get_ha_cluster())

        else:
            parser.print_help()

    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)
```

With this version that calls `_execute_command`:

```python
    # 执行命令
    try:
        if args.command is None:
            parser.print_help()
            sys.exit(0)

        if args.command == "login":
            result = _execute_command(client, args)
            print("✓ 登录成功")
            output(result["data"])
        else:
            result = _execute_command(client, args)
            if result is not None:
                output(result)
            else:
                parser.print_help()

    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)
```

- [ ] **Step 3: Verify syntax after all edits**

```powershell
& "$env:USERPROFILE\.local\bin\python3.14.exe" -c "import sys; sys.path.insert(0, '.claude/skills/ad-ops/scripts'); import ast; ast.parse(open('.claude/skills/ad-ops/scripts/ad_api.py', encoding='utf-8').read()); print('syntax OK')"
```

Expected: `syntax OK`

- [ ] **Step 4: Verify single-device path still works (help output)**

```powershell
& "$env:USERPROFILE\.local\bin\python3.14.exe" .claude/skills/ad-ops/scripts/ad_api.py --help
```

Expected: Full help output with all subcommands, no errors.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/ad-ops/scripts/ad_api.py
git commit -m "feat(ad_api): add multi-device dispatch via --hosts/--devices"
```

---

### Task 5: Update ad-ops SKILL.md

**Files:**
- Modify: `.claude/skills/ad-ops/SKILL.md`

- [ ] **Step 1: Replace CLI 命令参考 section with full subcommand reference**

Replace the current "CLI 命令参考" section (lines 23-53) with:

```markdown
## CLI 命令参考

### ad_api.py — 原始数据查询

支持 `--host` (单设备) 和 `--hosts` / `--devices` (多设备)。

```bash
# 用户
python scripts/ad_api.py --host https://IP --password xxx users list          # 所有用户
python scripts/ad_api.py --host https://IP --password xxx users get <name>     # 指定用户

# 虚拟服务
python scripts/ad_api.py --host https://IP --password xxx slb list             # 所有 VS
python scripts/ad_api.py --host https://IP --password xxx slb get <name>       # 指定 VS

# 节点池
python scripts/ad_api.py --host https://IP --password xxx pool list            # 所有 Pool
python scripts/ad_api.py --host https://IP --password xxx pool get <name>      # 指定 Pool

# 系统状态
python scripts/ad_api.py --host https://IP --password xxx stat sys             # CPU/内存/磁盘/连接
python scripts/ad_api.py --host https://IP --password xxx stat cpu             # CPU 状态
python scripts/ad_api.py --host https://IP --password xxx stat mem             # 内存状态
python scripts/ad_api.py --host https://IP --password xxx stat disk            # 磁盘状态
python scripts/ad_api.py --host https://IP --password xxx stat net             # 网络状态
python scripts/ad_api.py --host https://IP --password xxx stat device          # 系统概览

# VS 统计
python scripts/ad_api.py --host https://IP --password xxx stat vs              # 所有 VS 瞬时状态
python scripts/ad_api.py --host https://IP --password xxx stat vs-get <name>   # 指定 VS 瞬时状态
python scripts/ad_api.py --host https://IP --password xxx stat trend           # 所有 VS 汇总趋势
python scripts/ad_api.py --host https://IP --password xxx stat vs-trend <name> # 指定 VS 趋势
python scripts/ad_api.py --host https://IP --password xxx stat nodes           # 全部节点状态
python scripts/ad_api.py --host https://IP --password xxx stat pool <name>     # 指定 Pool 节点状态

# 证书 / 日志 / HA
python scripts/ad_api.py --host https://IP --password xxx cert list            # SSL 证书列表
python scripts/ad_api.py --host https://IP --password xxx log service          # 服务日志
python scripts/ad_api.py --host https://IP --password xxx ha status            # HA 状态
python scripts/ad_api.py --host https://IP --password xxx ha cluster           # 集群信息

# 多设备（所有查询子命令均支持）
python scripts/ad_api.py --hosts "https://IP1,https://IP2" --password xxx users list
python scripts/ad_api.py --hosts "https://IP1,https://IP2" --password xxx stat sys
python scripts/ad_api.py --devices devices.json users list
```

### overview.py — 格式化快照

带健康标签、颜色标记的格式化输出。支持 `--host` / `--hosts` / `--devices`。

```bash
python scripts/overview.py all --host https://IP --password xxx [--format json]
python scripts/overview.py vs --hosts "IP1,IP2" --password xxx
python scripts/overview.py pool --host ...
python scripts/overview.py cert --host ...
python scripts/overview.py hardware --host ...
python scripts/overview.py ha --host ...
python scripts/overview.py traffic --host ...
```
```

- [ ] **Step 2: Add 子命令选择决策 chapter**

After the CLI reference section, insert:

```markdown
## 子命令选择决策

### 工具选择：ad_api.py vs overview.py

| 用户说 | 使用 | 原因 |
|--------|------|------|
| "总览" / "概览" / "快照" / "overview" / "设备概况" | `overview.py` | 格式化输出，含健康标签/颜色标记 |
| "查询" / "列表" / "获取" / "具体某个" / "原始数据" | `ad_api.py` | 原始 JSON 输出，支持 get 单查 |

### 资源查询决策表（ad_api.py）

| 用户意图 | 命令 | 参数 |
|----------|------|------|
| 查看所有用户 | `ad_api.py users list` | `--host` 或 `--hosts` |
| 查看某个用户 | `ad_api.py users get <name>` | `--host` 或 `--hosts` |
| 查看所有虚拟服务 | `ad_api.py slb list` 或 `overview.py vs` | `--host[s]` |
| 查看某个虚拟服务 | `ad_api.py slb get <name>` | `--host` 或 `--hosts` |
| 查看所有节点池 | `ad_api.py pool list` 或 `overview.py pool` | `--host[s]` |
| 查看某个节点池 | `ad_api.py pool get <name>` | `--host` 或 `--hosts` |
| 查看设备硬件状态 | `ad_api.py stat sys` 或 `overview.py hardware` | `--host[s]` |
| 查看所有 VS 流量统计 | `ad_api.py stat vs` 或 `overview.py traffic` | `--host[s]` |
| 查看指定 VS 流量趋势 | `ad_api.py stat vs-trend <name>` | `--host` 或 `--hosts` |
| 查看 SSL 证书 | `ad_api.py cert list` 或 `overview.py cert` | `--host[s]` |
| 查看 HA 状态 | `ad_api.py ha status` 或 `overview.py ha` | `--host[s]` |
| 查看服务日志 | `ad_api.py log service` | `--host` 或 `--hosts` |
| 测试连接 | `ad_api.py login` | `--host`（不支持 `--hosts`） |

### 多设备触发

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`（单台设备行为与 `--host` 等价）
4. 密码不同时 → 必须用 `--devices` JSON 文件
```

- [ ] **Step 3: Update 脚本强制规则 table**

Replace the existing "脚本强制规则" section (lines 77-83) with:

```markdown
## 脚本强制规则

| 操作 | 必须使用 | 禁止使用 |
|------|----------|----------|
| 单设备 API 查询 | `python scripts/ad_api.py --host ...` | ❌ 直接调 API |
| 多设备 API 查询 | `python scripts/ad_api.py --hosts "..."` | ❌ 直接调 API |
| 单设备总览快照 | `python scripts/overview.py all --host ...` | ❌ 直接调 API |
| 多设备总览快照 | `python scripts/overview.py all --hosts "..."` | ❌ 直接调 API |
```

- [ ] **Step 4: Remove standalone 多设备触发决策 section**

Delete the existing "多设备触发决策" section (old lines 113-118) since it's now merged into 子命令选择决策.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/ad-ops/SKILL.md
git commit -m "docs(ad-ops): add subcommand decision table, trigger word rules, update enforcement table"
```

---

### Task 6: Update ad-check-analysis SKILL.md

**Files:**
- Modify: `.claude/skills/ad-check-analysis/SKILL.md`

- [ ] **Step 1: Add 子命令选择决策 chapter**

After the existing "多设备子命令支持" table (after line ~92), insert:

```markdown
## 子命令选择决策

### 任务 → 命令映射

| 任务 | 命令 | 关键参数 |
|------|------|----------|
| 查看可用巡检场景 | `check.py scenes` | `--host`（不支持 `--hosts`） |
| 启动巡检（单设备） | `check.py run --host ...` | `--scene`, `--force` |
| 启动巡检（多设备异步） | `check.py run --hosts "..."` | `--scene`, `--force` |
| 启动巡检（多设备同步等待） | `check.py run --hosts "..." --wait` | `--scene`, `--force` |
| 查询巡检进度（单设备） | `check.py progress --host ...` | — |
| 查询巡检进度（多设备） | `check.py progress --hosts "..."` | `--password` |
| 下载分析巡检报告 | `check.py wait --host ...` | `--work-dir` |
| 查看历史记录（单设备） | `check.py history --host ...` | — |
| 查看历史记录（多设备） | `check.py history --hosts "..."` | `--password` |
| 分析本地巡检报告 | `check.py analyze --path ...` | `--host`, `--scene`（可选覆盖） |

### 多设备触发

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`（单台设备行为与 `--host` 等价）
4. 密码不同时 → 必须用 `--devices` JSON 文件
```

- [ ] **Step 2: Remove old standalone 多设备触发决策 section**

Delete the existing "多设备触发决策" section (old lines 76-81) since it's now merged into 子命令选择决策.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-check-analysis/SKILL.md
git commit -m "docs(ad-check): add workflow-type decision table, merge multi-device rules"
```

---

### Task 7: Update ad-perception SKILL.md

**Files:**
- Modify: `.claude/skills/ad-perception/SKILL.md`

- [ ] **Step 1: Add 子命令选择决策 chapter**

After the "执行工作流" section (after line ~95), insert:

```markdown
## 子命令选择决策

### 任务 → 命令映射

| 用户意图 | 命令 | 关键参数 |
|----------|------|----------|
| 全维度分析（单设备） | `perception.py analyze --host ...` | `--db`, `--disk-source`（可选） |
| 全维度分析（多设备） | `perception.py analyze --hosts "..."` | `--db` |
| 单 VS 流量异常检测 | `perception.py traffic --host ... --vs <name>` | `--db` |
| 设备状态阈值检查 | `perception.py state --host ...` | `--disk-source`（可选） |
| IP:Port 冲突检测 | `perception.py conflict --host ...` | — |
| 服务日志查询（单设备） | `perception.py logs --host ...` | `--limit` |
| 服务日志查询（多设备） | `perception.py logs --hosts "..."` | `--limit` |
| 定时采集+分析（单设备） | `collector.py collect --host ...` | `--db` |
| 定时采集+分析（多设备） | `collector.py collect --hosts "..."` | `--db` |

### 维度选择

| 用户说 | 使用命令 |
|--------|----------|
| "分析" / "检测" / "诊断" / "感知" / "全面检查" | `analyze`（全维度） |
| "流量" / "吞吐" / "连接数" / "带宽" | `traffic` |
| "CPU" / "内存" / "风扇" / "电源" / "状态" / "硬件" | `state` |
| "冲突" / "重叠" / "重复" / "IP冲突" | `conflict` |
| "日志" / "告警" / "错误日志" | `logs` |

### 多设备触发

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`
4. 密码不同时 → 必须用 `--devices` JSON 文件
```

- [ ] **Step 2: Remove old standalone 多设备触发决策 section**

Delete the existing "多设备触发决策" section (old lines 168-173) since it's now merged.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-perception/SKILL.md
git commit -m "docs(ad-perception): add hybrid-type decision table, merge multi-device rules"
```

---

### Task 8: Update ad-blackbox-analysis SKILL.md

**Files:**
- Modify: `.claude/skills/ad-blackbox-analysis/SKILL.md`

- [ ] **Step 1: Add 子命令选择决策 chapter**

After "Key Rules" section (after line ~130), insert:

```markdown
## 子命令选择决策

### 任务 → 命令映射

| 任务 | 命令 | 关键参数 |
|------|------|----------|
| 启动导出（单设备） | `blackbox.py --host ...` | `--from-date`, `--to-date` |
| 启动导出（多设备） | `blackbox.py --hosts "..."` | `--from-date`, `--to-date` |
| 查询导出进度（单设备） | `blackbox.py progress --host ...` | `--output` |
| 查询导出进度（多设备） | `blackbox.py progress --hosts "..."` | `--output` |
| 下载分析结果 | `blackbox.py download --host ...` | `--output`, `--archive-password` |

### 异步轮询流程

```
export (--hosts) → 等待 60-90s → progress (每10s轮询) → download (仅SUCCESS后)
```

### 多设备触发

1. 用户提到多个 IP/设备名 → `--hosts`
2. 用户用"所有"、"全部"、"批量"、"同时"、"都" → `--hosts`
3. 不确定时 → 默认用 `--hosts`
4. 密码不同时 → 必须用 `--devices` JSON 文件
```

- [ ] **Step 2: Remove old standalone 多设备触发决策 section**

Delete the existing "多设备触发决策" section (old lines 171-176) since it's now merged.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/ad-blackbox-analysis/SKILL.md
git commit -m "docs(ad-blackbox): add workflow-type decision table, merge multi-device rules"
```

---

### Task 9: Final verification

- [ ] **Step 1: Verify all 4 SKILL.md files have 子命令选择决策 chapter**

```powershell
Select-String -Path '.claude/skills/*/SKILL.md' -Pattern '子命令选择决策' | ForEach-Object { $_.Filename }
```

Expected: 4 files listed.

- [ ] **Step 2: Verify no standalone 多设备触发决策 remains**

```powershell
Select-String -Path '.claude/skills/*/SKILL.md' -Pattern '^## 多设备触发决策'
```

Expected: No matches (all merged into 子命令选择决策).

- [ ] **Step 3: Verify ad_api.py syntax and imports**

```powershell
& "$env:USERPROFILE\.local\bin\python3.14.exe" -c "import sys; sys.path.insert(0, '.claude/skills/ad-ops/scripts'); import ast; tree = ast.parse(open('.claude/skills/ad-ops/scripts/ad_api.py', encoding='utf-8').read()); print('syntax OK'); funcs = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]; print('Functions:', funcs)"
```

Expected: `syntax OK` and `_execute_command` in function list.

- [ ] **Step 4: Commit verification**

```bash
git add -A
git diff --cached --stat
git commit -m "chore: final verification of subcommand-query-design implementation"
```
