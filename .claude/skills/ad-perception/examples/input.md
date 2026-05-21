# AD 感知分析 - 示例输入

## 场景 1: 单设备感知分析

最常用场景：检测流量异常 + 设备状态 + 地址冲突 + 日志关联。

```bash
python scripts/perception.py analyze --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（全部正常）或 5（部分维度失败）

---

## 场景 2: 多设备并行分析

多台 AD 同时分析，每台独立输出报告块。

```bash
python scripts/perception.py analyze --hosts "https://192.168.8.30,https://192.168.8.31" --password $env:AD_PASS
```

期望 exit code: 0（全部成功）或 7（部分设备失败）

---

## 场景 3: 流量采集 (oneshot)

采集过去 1 小时 VS 趋势 + 系统状态到 SQLite，供后续分析使用。

```bash
python scripts/collector.py collect --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0

---

## 场景 4: JSON 格式输出

结构化输出，供脚本或自动化工具消费。

```bash
python scripts/perception.py analyze --host https://192.168.8.30 --password $env:AD_PASS --format json
```

期望 exit code: 0

---

## 场景 5: 服务日志查询

独立查询服务日志，不跑完整分析流程。

```bash
python scripts/perception.py logs --host https://192.168.8.30 --password $env:AD_PASS --limit 20
```

期望 exit code: 0

---

## 场景 6: 指定数据库分析

使用已有采集数据，跳过 API 趋势注入。

```bash
python scripts/perception.py analyze --host https://192.168.8.30 --password $env:AD_PASS --db ./vs_samples_192.168.8.30.db
```

期望 exit code: 0
