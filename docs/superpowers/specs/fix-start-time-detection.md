# start_time 新报告检测修复方案

> 日期: 2026-05-20 | 状态: 已调研 + v2 (3-agent 审核修订中)

## 1. 问题

`wait_and_download()` 用 `start_time` 精确匹配判断"新报告是否生成"。两个端点的 `start_time` 格式和值都不一致，导致 `wait` 永远超时。

### 实测数据

| 端点 | 示例值 | 格式 |
|------|--------|------|
| `POST /sys/offline-check` | `"2026-05-20 18:18:07"` | YYYY-MM-DD HH:MM:SS |
| `GET ?type=history` | `"20260520181810"` | YYYYMMDDHHMMSS |
| `GET ?type=progress` | `"20260520181810"` | YYYYMMDDHHMMSS |

- POST 返回值和 history 返回值差 **3 秒**（排队延迟），即使格式相同也不可能精确匹配
- `--force` 模式下删除旧记录导致 history[0] 变化，`pre_run_latest_name` 兜底也受影响

### 影响范围

- 单设备 `check.py run` + `check.py wait`：LLM 被迫直调 curl 绕过脚本
- 多设备 `check.py run --hosts`：`_check_one` 内 wait_and_download 超时，全部失败
- `ad-perception` 的 `--disk-source` 也无法摄入巡检结果

## 2. 修复方案

### 2.1 核心思路

**比较 POST 响应和 history 的 `start_time` 差值。两者来自同一设备时钟，差值仅为排队延迟（通常 < 30 秒）。**

将 POST 返回的 `start_time`（格式因固件而异）和 history 的 `start_time`（始终 14 位数字）统一归一化为整数 `YYYYMMDDHHMMSS`，差值 < 120 秒即判定为新报告。

```python
WINDOW = 120  # 秒，新报告判定窗口（POST 与 history 的 start_time 差值上限）


def _normalize_start_time(s):
    """提取字符串中所有数字，转为 YYYYMMDDHHMMSS 整数。"""
    digits = ''.join(c for c in s if c.isdigit())
    if len(digits) >= 14:
        return int(digits[:14])
    return 0


def _is_new_report(top_item, pre_run_latest_name, t0_int):
    """
    判定 history[0] 是否为本轮巡检产生的新报告。

    Args:
        top_item: history API 返回的 items[0] 字典
        pre_run_latest_name: 启动巡检前 history[0].name
        t0_int: POST 响应的 start_time 归一化整数 (YYYYMMDDHHMMSS)

    Returns:
        True 表示该记录是本轮巡检的新报告
    """
    top_name = top_item.get("name", "")
    top_start = top_item.get("start_time", "")
    top_end = top_item.get("end_time", "")

    # 必须已完成
    if not top_end:
        return False

    # 名字必须变化（最可靠的信号）
    if top_name == pre_run_latest_name:
        return False

    # 时间窗口判定（history start_time 始终 14 位数字）
    top_int = _normalize_start_time(top_start)
    if top_int == 0:
        return False

    diff = abs(top_int - t0_int)
    # 处理秒级进位：例如 18:18:59 vs 18:19:02 → 20260520181859 vs 20260520181902 → diff=43
    # 也处理分钟进位：18:59:55 vs 19:00:05 → 20260520185955 vs 20260520190005 → diff=4050
    # 简单修正：diff > 4000 且 < 10000 时减去 4000（跨分钟修正）
    if 4000 < diff < 10000:
        diff = diff - 4000
    return diff < WINDOW
```

**关键优势**：
- 两个 `start_time` 来自同一设备时钟，无时钟偏差问题
- 差值仅反映排队延迟（实测 3 秒），120 秒窗口非常宽松
- POST 返回空字符串时，`t0_int = 0`，回退为纯 name 比较
- 秒级进位修正处理 `:59 → :02` 这种跨分钟边界

### 2.2 改动位置

`check.py` 中的 `start_check()` 和 `wait_and_download()`：

**start_check()** — 保存归一化后的 `t0_int` 到 `_meta.json`：

```python
check_start_time = result.get("start_time", "")  # POST 响应: "2026-05-20 18:18:07"
t0_int = _normalize_start_time(check_start_time)  # 归一化: 20260520181807

meta = {
    "scene": scene,
    "host": client.host,
    "event_id": event_id,
    "report_name": "",
    "t0_int": t0_int,                              # 新增：归一化的 POST start_time
    "pre_run_latest_name": pre_run_latest_name,
    "work_dir": work_dir,
}
```

**wait_and_download()** — 用 `_is_new_report()` 替换精确匹配：

```python
t0_int = meta.get("t0_int", 0)
# ... 轮询循环内 ...
top = items[0]

if t0_int:
    is_new = _is_new_report(top, pre_run_latest_name, t0_int)
else:
    # 兼容旧的 _meta.json (无 t0_int 字段)：降级为纯 name 比较
    is_new = bool(top.get("end_time")) and top.get("name") != pre_run_latest_name
```

### 2.3 为什么不用本地时钟

- POST 的 `start_time` 和 history 的 `start_time` 来自**同一设备时钟**，差值仅为排队延迟（实测 3 秒）
- 本地时钟引入时钟偏差问题，不如直接比较两个同源时间戳
- POST 返回空字符串时 `t0_int = 0`，降级为纯 name 比较

### 2.4 窗口参数选择

- **WINDOW = 120 秒**：覆盖设备排队延迟（实测 3 秒），留足余量
- 旧报告的 start_time 差值以小时/天计，120 秒窗口不会误判
- 包含跨分钟秒级进位修正（`:59 → :02` 这种边界）

### 2.5 已知局限

| 场景 | 说明 |
|------|------|
| 巡检排队超过 120 秒 | 窗口过小可能拒绝新报告。可调大 WINDOW 常量 |
| POST start_time 为空 | 降级为纯 name 比较，`--force` 场景可能误判 |
| 多用户同时巡检同一设备 | 未来可考虑用 `event_id` 精确关联 |

## 3. 不变约束

- `_check_one` 原子化流程不受影响
- 多设备 `--hosts` 不受影响（每设备独立 t0 + 独立 work_dir）
- 向后兼容：无 `t0` 字段的旧 `_meta.json` 降级为纯 name 比较
- `_meta.json` 的 `start_time` 字段仍由 step 6 写入（来自 history API），render_markdown 展示不受影响
