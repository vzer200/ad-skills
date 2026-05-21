# AD 连接测试 - 示例输入

## 场景 1: 单设备连接测试

最常用场景：验证单台 AD 设备的连通性和认证状态。

```bash
python scripts/connect.py --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（正常）或 1（连接失败）或 2（认证失败）

---

## 场景 2: 多设备批量测试

一次性验证多台 AD 设备的连接状态，每台独立返回结果。

```bash
python scripts/connect.py --hosts "https://192.168.8.30,https://192.168.8.31" --password $env:AD_PASS
```

期望 exit code: 0（全部成功）或 7（部分失败）或 1（全部连接失败）或 2（全部认证失败）

---

## 场景 3: 前置步骤（在其他 AD 操作前验证）

在执行巡检、黑盒导出、运维查询等 AD 操作前，先验证目标设备的连通性。

```bash
# Step 1: 连接预检
python scripts/connect.py --host https://192.168.8.30 --password $env:AD_PASS

# Step 2: 全部通过则继续后续操作
python ../ad-ops/scripts/overview.py all --host https://192.168.8.30 --password $env:AD_PASS
```

期望 exit code: 0（继续后续操作）或非 0（终止流程，报告失败原因）

---

## 场景 4: 指定用户名测试

使用非默认用户名（admin 以外的账户）测试认证。

```bash
python scripts/connect.py --host https://192.168.8.30 --user operator --password $env:AD_PASS
```

期望 exit code: 0（operator 认证通过）或 2（认证失败）

---

## 场景 5: JSON 格式输出

结构化输出，供脚本或自动化工具消费。

```bash
python scripts/connect.py --host https://192.168.8.30 --password $env:AD_PASS --format json
```

期望 exit code: 0
期望 stdout: 合法 JSON，包含 `"host"` 和 `"status"` 字段

多设备 JSON：

```bash
python scripts/connect.py --hosts "https://192.168.8.30,https://192.168.8.31" --password $env:AD_PASS --format json
```

期望 exit code: 0（全部成功）或 7（部分失败）
期望 stdout: 合法 JSON，包含 `"results"` 和 `"summary"` 顶层键

---

## 场景 6: 使用 devices.json

从设备清单文件加载设备列表进行批量连接测试。

```bash
python scripts/connect.py --devices devices.json
```

期望 exit code: 0（全部成功）或 7（部分失败）

devices.json 格式示例：

```json
{
  "devices": [
    {"host": "https://192.168.8.30", "username": "admin", "password_from": "AD_PASS"},
    {"host": "https://192.168.8.31", "username": "admin", "password_from": "AD_PASS"}
  ]
}
```
