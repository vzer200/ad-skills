<!-- 关联: overview.py render_markdown() -->
<!-- 最后验证: 2026-05-21 -->
<!-- 如果 render_markdown() 被修改，必须同步更新本清单中受影响的项目 -->

# AD 智能运维 - 回归检查清单

## 核心路径

- [ ] 1. 全量总览
  运行: `python scripts/overview.py all --host TEST_IP --password TEST_PASS`
  验证: stdout 包含 `# AD Device Overview`，`## Device Info`，`## Virtual Services`，`## SSL Certificates`，`## Hardware Status`
        exit code 0

- [ ] 2. 虚拟服务查询
  运行: `python scripts/overview.py vs --host TEST_IP --password TEST_PASS`
  验证: stdout 包含 `## Virtual Services` 及 7 列表格 `| Name | VIP:Port | Pool | Status | Nodes (Up/Total) | Connections | Rate |`
        `## SSL Certificates` 节显示 `(无证书)`，`## Hardware Status` 节显示 `(无硬件信息)`
        exit code 0

- [ ] 3. 证书查询
  运行: `python scripts/overview.py cert --host TEST_IP --password TEST_PASS`
  验证: stdout 包含 `## SSL Certificates` 及 4 列表格 `| Name | Expiry | Days Left | Status |`
        exit code 0

- [ ] 4. 硬件状态查询
  运行: `python scripts/overview.py hardware --host TEST_IP --password TEST_PASS`
  验证: stdout 包含 `## Hardware Status` 及 3 列表格 `| Component | Value | Status |`
        exit code 0

- [ ] 5. JSON 格式输出
  运行: `python scripts/overview.py all --host TEST_IP --password TEST_PASS --format json`
  验证: stdout 为合法 JSON，可被 `python -c "import json,sys; json.load(sys.stdin)"` 解析
        顶层键包含 device, virtual_services, certificates, hardware
        exit code 0

- [ ] 6. 多设备并行
  运行: `python scripts/overview.py all --hosts "https://IP1,https://IP2" --password TEST_PASS`
  验证: 每台设备有独立的 `## {host}` section
        末尾有汇总表（total / success / failed）
        exit code 0（全部成功）或 7（部分失败）

- [ ] 7. 多设备 JSON
  运行: `python scripts/overview.py all --hosts "https://IP1,https://IP2" --password TEST_PASS --format json`
  验证: stdout 为合法 JSON，mode 字段为 "multi"，summary 包含 total/success/failed
        results 为以 host 为 key 的对象

## 错误处理

- [ ] 8. 认证失败
  运行: `python scripts/overview.py all --host TEST_IP --password wrong_pass`
  验证: exit code 2
        stderr 包含 `认证失败` 或 `401`

- [ ] 9. 缺少参数
  运行: `python scripts/overview.py all`
  验证: exit code 4
        stderr 包含 usage 信息（`--host`）

- [ ] 10. 连接失败
  运行: `python scripts/overview.py all --host https://192.0.2.1 --password TEST_PASS`
  验证: exit code 1
        stderr 包含 `连接失败`

## 示例保鲜

- [ ] 11. output.md 与代码一致
  运行: `python scripts/overview.py all --host TEST_IP --password TEST_PASS`
  验证: stdout 结构包含 examples/output.md 中所有的 section 标题和 key-value 字段名
        （不比对动态数值，只比对标题层级和表格列数）
