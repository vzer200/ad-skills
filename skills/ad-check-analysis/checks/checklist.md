<!-- 关联: check.py render_markdown() -->
<!-- 最后验证: 2026-05-23 -->
<!-- 如果 render_markdown() 被修改，必须同步更新本清单中受影响的项目 -->

# AD 巡检分析 - 回归检查清单

## 核心路径

- [ ] 1. 场景列表查询
  运行: `python scripts/check.py scenes --host TEST_IP --password TEST_PASS`
  验证: stdout 为合法 JSON，`items[].name` 包含 "标准巡检" 和 "全量巡检"
        exit code 0

- [ ] 2. 标准巡检启动（单设备）
  运行: `python scripts/check.py run --host TEST_IP --password TEST_PASS --scene "标准巡检"`
  验证: stdout 包含 `工作目录:` 路径
        输出提示 `后续请用 wait 命令轮询进度`
        exit code 0

- [ ] 3. 强制巡检（绕过记录上限）
  运行: `python scripts/check.py run --host TEST_IP --password TEST_PASS --scene "标准巡检" --force`
  验证: 即使已有 5 条历史记录也正常启动
        stdout 包含 `工作目录:`
        exit code 0

- [ ] 4. 多设备并行启动（异步模式）
  运行: `python scripts/check.py run --hosts "https://IP1,https://IP2" --password TEST_PASS --scene "标准巡检" --force`
  验证: 每台设备输出 `[HOST] work_dir=... event_id=...`
        汇总 exit code 0（全部成功）或 7（部分失败）

- [ ] 5. 进度查询
  运行: `python scripts/check.py progress --host TEST_IP --password TEST_PASS`
  验证: stdout 为合法 JSON，包含 `state` 字段
        state 为 RUNNING / WAITING / FINISHED / NO_RUNNING 之一
        exit code 0

- [ ] 6. 报告下载与分析（wait 命令）
  运行: `python scripts/check.py wait --host TEST_IP --password TEST_PASS --work-dir /tmp/ad_check_test --timeout 600`
  验证: stdout 包含 `## 巡检结论`、`## 分类统计`、`## 设备基本信息`、`## 检查项明细`、`## 优化建议`、`## 健康评分`
        不包含 `## 巡检过程`、`## 原始报告`
        检查项显示中文名称，用户正文不包含工具调用、脚本名、退出码、stdout/stderr
        exit code 0

- [ ] 7. 本地报告分析
  运行: `python scripts/check.py analyze --path /path/to/unzipped/report`
  验证: stdout 包含 `## 巡检结论`
        所有 section 标题与 live 巡检输出一致
        exit code 0

## 错误处理

- [ ] 8. 认证失败
  运行: `python scripts/check.py scenes --host TEST_IP --password wrong_pass`
  验证: exit code 2 或 1（取决于脚本实现）
        stderr 包含 `认证失败` 或 `Auth`

- [ ] 9. 缺少必要参数
  运行: `python scripts/check.py run`（无 --host）
  验证: exit code 4
        stderr 包含 `错误: 必须指定 --host`

- [ ] 10. 巡检记录上限拒绝
  运行: `python scripts/check.py run --host TEST_IP --password TEST_PASS --scene "标准巡检"`（已有 5 条记录）
  验证: exit code 4
        stderr 包含 `上限` 或 `记录`
        不启动新巡检

- [ ] 11. wait 超时处理
  运行: `python scripts/check.py wait --host TEST_IP --password TEST_PASS --work-dir /tmp/ad_check_test --timeout 5`
  验证: 超时后 exit code 5（部分失败）
        stderr 包含 `超时`

## 示例保鲜

- [ ] 12. output.md 与代码一致
  运行: `python scripts/check.py analyze --path /path/to/report`
  验证: stdout 结构包含 examples/output.md 中所有的 section 标题
        （不比对动态数值，只比对标题层级和表格列数）
