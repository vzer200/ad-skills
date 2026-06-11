# AD 智能运维 - 示例输入

## 场景 1: 全量总览

最常用场景：一次性获取设备信息、VS、证书、硬件状态等完整快照。

```bash
python scripts/overview.py all --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（全部成功）或 5（部分数据源失败）

---

## 场景 2: 仅查询虚拟服务

只看 VS 列表，不拉取证书、硬件等其他维度。

```bash
python scripts/overview.py vs --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（全部成功）、5（部分数据源失败）或 1（全部失败）

---

## 场景 3: 仅查询证书

快速盘点 SSL 证书到期情况。

```bash
python scripts/overview.py cert --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（成功）或 1（证书查询失败）

---

## 场景 4: 仅查询硬件状态

检查风扇、电源、温度、接口等硬件组件。

```bash
python scripts/overview.py hardware --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（成功）或 1（硬件查询失败）

---

## 场景 5: 多设备并行查询

多台 AD 同时拉取总览，每台设备独立输出报告块。

```bash
python scripts/overview.py all --hosts "https://192.168.8.30,https://192.168.8.31" --password $env:AD_PASS
```

期望 exit code: 0（全部成功）或 7（部分设备失败）

---

## 场景 6: JSON 格式输出

结构化输出，供脚本或自动化工具消费。

```bash
python scripts/overview.py all --host https://192.168.8.30 --password $env:AD_PASS --format json
```

期望 exit code: 0
