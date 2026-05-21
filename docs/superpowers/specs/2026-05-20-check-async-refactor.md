# check.py 异步巡检改造方案 v2

> 日期: 2026-05-20 | 来源: 参考 skill + 平台 60s 超时 + 3-agent 审核修订

## 1. 问题

当前 `wait_and_download` 内部轮询 + `_check_one` 阻塞等待巡检完成，在平台 shell 超时 60s 的环境下进程被 kill。

## 2. 修复方案

### 2.1 核心思路

**`wait_and_download` 加 `max_attempts` 参数，默认 1 次检查即返回。** 不删轮询，只是控制检查次数。

```
max_attempts=1  → 查一次 history，_is_new_report 通过就下载，没过就报错（供 LLM 异步调用）
max_attempts=60 → 轮询等待（供 _check_one / --wait 同步模式）
```

### 2.2 wait_and_download 改动

```python
def wait_and_download(
    client, work_dir="/tmp/ad_check",
    poll_interval=10, timeout=600,
    max_attempts=1,  # 新增：单次检查即返回
) -> Dict[str, Any]:
    """下载巡检报告并分析。

    默认 max_attempts=1: 检查一次 history[0]，_is_new_report 通过就下载，否则报错。
    同步模式传 max_attempts=60: 轮询等待巡检完成。
    """
    # ... 读取 meta，拿到 t0_int 和 pre_run_latest_name ...

    # 检查 history[0]
    attempt = 0
    deadline = time.time() + timeout
    while time.time() < deadline and attempt < max_attempts:
        attempt += 1
        # ... 查 history, 用 _is_new_report() 判断 ...
        if is_new and is_finished:
            # 下载 + 解压 + 分析
            return meta
        if attempt < max_attempts:
            time.sleep(poll_interval)

    raise RuntimeError(
        f"未检测到本次巡检的完成报告 (attempts={attempt})。"
        "请使用 progress 确认完成后再 wait，或增加重试次数。"
    )
```

**关键**：`_is_new_report()` 作为所有权验证保留，防止下载到别人的报告。

### 2.3 各路径参数

| 调用方 | max_attempts | 行为 |
|--------|-------------|------|
| `wait` 子命令（LLM 异步） | 1（默认） | 查一次，过就下载，不过报错 |
| `_check_one`（`run --hosts --wait`） | 60 | 轮询等待巡检完成 |
| 老 `run` + `wait` 两步（单设备） | 1（默认） | LLM 先 progress 确认，再 wait |

### 2.4 run --hosts 默认行为

- 默认：`--no-wait`（异步），用 `_start_only`，启动后立即退出
- 显式 `--wait`：同步，用 `_check_one`（内部传 `max_attempts=60`）

### 2.5 progress --hosts

当前已声明 `--hosts` 参数但未接线。补充实现，返回所有设备进度 JSON。

### 2.6 LLM 执行流程

```
1. run --hosts "AD1,AD2" --force          → 启动，输出 work_dir，立即退出（<3s）
2. 每 10s: progress --hosts "AD1,AD2"     → 查所有设备进度（<2s）
3. 某设备 FINISHED:
   wait --host AD1 --work-dir /tmp/xxx    → 下载+分析（<5s）
```

每步都远小于 60s。

## 3. 改动清单

| # | 文件 | 改动 |
|---|------|------|
| 1 | `check.py` `wait_and_download()` | 加 `max_attempts` 参数，默认 1 |
| 2 | `check.py` `_check_one()` | 调用 `wait_and_download` 时传 `max_attempts=60` |
| 3 | `check.py` `run --hosts` handler | 默认用 `_start_only`，加 `--wait` 选项用 `_check_one` |
| 4 | `check.py` `progress` handler | 接线 `--hosts`，并行查询所有设备进度 |
| 5 | `check.py` `wait` 子命令 | 用默认 `max_attempts=1`（不传参） |

## 4. 行为变更（明确说明）

- `wait` 子命令行为变化：旧方式内部轮询 600s，新方式默认检查 1 次即返回。LLM 必须先通过 `progress` 确认完成
- `run --hosts` 默认行为变化：旧方式默认同步等待，新方式默认异步（`--no-wait`），需显式传 `--wait` 恢复同步
- `_is_new_report` / `_normalize_start_time` / `t0_int` / `WINDOW` 全部保留
- 轮询循环保留不删，通过 `max_attempts` 控制
- 同步 `_check_one`（`--wait`）路径完整保留，传 `max_attempts=60`
