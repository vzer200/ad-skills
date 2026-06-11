# AD 巡检分析 - 示例输入

## 场景 1: 查看可用巡检场景

执行巡检前查询设备支持哪些巡检场景（标准巡检/全量巡检）。

```bash
python scripts/check.py scenes --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0

---

## 场景 2: 执行标准巡检（单设备）

最常用场景：对单台设备执行标准巡检。脚本自动检查记录上限、启动巡检并返回 work_dir。

```bash
python scripts/check.py run --host https://192.168.8.30 --password $env:AD_PASS --scene "标准巡检"
```

期望 exit code: 0（启动成功，输出 work_dir）

---

## 场景 3: 强制巡检（绕过记录上限）

当历史巡检记录达到上限（5 条）时，使用 `--force` 强制启动新巡检。

```bash
python scripts/check.py run --host https://192.168.8.30 --password $env:AD_PASS --scene "标准巡检" --force
```

期望 exit code: 0

---

## 场景 4: 多设备并行巡检

同时对多台 AD 设备启动巡检（异步模式），每台设备输出独立的 work_dir。

```bash
python scripts/check.py run --hosts "https://192.168.8.30,https://192.168.8.31" --password $env:AD_PASS --scene "标准巡检" --force
```

期望 exit code: 0（全部成功）或 7（部分失败）

---

## 场景 5: 查询巡检进度

启动巡检后轮询查询任务执行状态（WAITING / RUNNING / FINISHED / NO_RUNNING）。

```bash
python scripts/check.py progress --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0

---

## 场景 6: 等待巡检完成（阻塞模式）

启动巡检后阻塞等待，自动轮询进度，完成后自动下载并分析。

```bash
python scripts/check.py wait --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（成功下载并分析）或 5（超时 12 分钟未完成）

---

## 场景 7: 分析已下载的巡检报告

已有本地巡检报告（解压后的 ad.json + _meta.json），直接分析并生成 Markdown 报告。

```bash
python scripts/check.py analyze --path /tmp/ad_check_https___192.168.8.30
```

期望 exit code: 0

---

## 场景 8: 查看历史巡检记录

查询设备上的历史巡检任务列表。

```bash
python scripts/check.py history --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0
