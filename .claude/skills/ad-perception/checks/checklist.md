<!-- 关联: perception.py render_markdown() -->
<!-- 最后验证: 2026-05-21 -->
<!-- 如果 render_markdown() 被修改，必须同步更新本清单中受影响的项目 -->

# AD 感知分析 - 回归检查清单

## 核心路径

- [ ] 1. 单设备完整分析
  运行: `python scripts/perception.py analyze --host TEST_IP --password TEST_PASS`
  验证: stdout 包含 `# AD 感知分析报告`，`## 流量分析`，`## 设备状态`，`## 地址冲突`
        exit code 0

- [ ] 2. 流量异常检测
  运行: `python scripts/perception.py traffic --host TEST_IP --password TEST_PASS --vs any_vs`
  验证: 有异常时表格为 8 列 `| VS | 指标 | 时间 | 当前值 | 正常范围 | 偏离幅度 | 方向 | 严重程度 |`
        无异常时输出 `✅ 过去 7 天内未检测到流量异常`

- [ ] 3. 数据不足回退
  运行: `python scripts/perception.py analyze --host TEST_IP --password TEST_PASS --db /tmp/empty.db`
  验证: 输出包含 `⚠️ 数据库数据不足，回退到 API 实时趋势查询`
        输出包含 `⚠️ 数据不足，无法进行 3σ 异常检测`

- [ ] 4. 多设备并行
  运行: `python scripts/perception.py analyze --hosts https://IP1,https://IP2 --password TEST_PASS`
  验证: 每台设备有独立的 `## {host}` section
        汇总表包含成功/失败计数
        exit code 0（全部成功）或 7（部分失败）

- [ ] 5. JSON 格式输出
  运行: `python scripts/perception.py analyze --host TEST_IP --password TEST_PASS --format json`
  验证: stdout 为合法 JSON，可被 `python -c "import json,sys; json.load(sys.stdin)"` 解析
        顶层键包含 device, traffic, state, conflicts

## 错误处理

- [ ] 6. 认证失败
  运行: `python scripts/perception.py analyze --host TEST_IP --password wrong_pass`
  验证: exit code 2
        stderr 包含 `认证失败` 或 `401`

- [ ] 7. 缺少参数
  运行: `python scripts/perception.py analyze`
  验证: exit code 4
        stderr 包含 usage 信息（`--host`）

## 采集器

- [ ] 8. 采集写入
  运行: `python scripts/collector.py collect --host TEST_IP --password TEST_PASS`
  验证: 生成 `vs_samples_*.db` 文件
        SQLite 文件包含 vs_samples 和 device_state 两张表
        exit code 0

- [ ] 9. 采集器重复启动
  运行: 连续两次 `python scripts/collector.py collect --host TEST_IP --password TEST_PASS`
  验证: 第二次 exit code 6
        stderr 包含 `已在运行`

## 示例保鲜

- [ ] 10. output.md 与代码一致
  运行: `python scripts/perception.py analyze --host TEST_IP --password TEST_PASS`
  验证: stdout 结构包含 examples/output.md 中所有的 section 标题
        （不比对动态数值，只比对标题层级和表格列数）
