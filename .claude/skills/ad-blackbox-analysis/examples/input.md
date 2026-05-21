# AD 黑盒日志分析 - 示例输入

## 场景 1: 启动黑盒导出（异步，单设备）

最常用场景：指定时间范围启动异步导出，脚本立即返回 event_id 和 output_dir，后续用 progress/download 完成。

```bash
python scripts/blackbox.py --host https://192.168.8.30 --password $env:AD_PASS --from-date 2026-05-14 --to-date 2026-05-20
```

期望 exit code: 0
期望 stdout: `event_id=xxx output_dir=C:\Users\...`

---

## 场景 2: 查询导出进度

异步导出启动后，轮询查询任务进度。

```bash
python scripts/blackbox.py progress --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（RUNNING/SUCCESS）或 5（FAILED/NOT_FOUND）

---

## 场景 3: 指定自定义日期范围导出

典型审计场景：针对特定事件窗口（如安全事件前后 3 天）导出日志。

```bash
python scripts/blackbox.py --host https://192.168.8.30 --password $env:AD_PASS --from-date 2026-05-10 --to-date 2026-05-16
```

期望 exit code: 0

---

## 场景 4: 多设备并行导出

多台 AD 同时启动异步导出，每台独立返回 event_id 和 output_dir。

```bash
python scripts/blackbox.py --hosts "https://192.168.8.30,https://192.168.8.31" --password $env:AD_PASS --from-date 2026-05-14 --to-date 2026-05-20
```

期望 exit code: 0（全部成功）或 7（部分设备失败）
期望 stdout: 每台设备一行 `[IP] event_id=... output_dir=...`

---

## 场景 5: 下载并分析（完成异步工作流）

在 progress 返回 SUCCESS 后执行，下载 tar.gz、解压、分析并输出报告。

```bash
python scripts/blackbox.py download --host https://192.168.8.30 --password $env:AD_PASS --output /tmp/blackbox_analysis/https___192.168.8.30
```

期望 exit code: 0
期望 stdout: 包含 `# AD 黑盒日志分析报告`

---

## 场景 6: 指定自定义解压密码

当黑盒文件使用非默认密码加密时使用。

```bash
python scripts/blackbox.py --host https://192.168.8.30 --password $env:AD_PASS --from-date 2026-05-14 --to-date 2026-05-20 --archive-password mycustom
```

期望 exit code: 0（导出启动成功）或 5（密码错误，在 download 阶段体现）

---

## 场景 7: 指定自定义输出目录

将黑盒文件和分析结果输出到指定目录。

```bash
python scripts/blackbox.py --host https://192.168.8.30 --password $env:AD_PASS --from-date 2026-05-14 --to-date 2026-05-20 --output D:\blackbox_data
```

期望 exit code: 0
