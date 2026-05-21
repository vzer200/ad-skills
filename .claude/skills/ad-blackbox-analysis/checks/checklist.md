<!-- 关联: blackbox.py generate_report() -->
<!-- 最后验证: 2026-05-21 -->
<!-- 如果 generate_report() 被修改，必须同步更新本清单中受影响的项目 -->

# AD 黑盒日志分析 - 回归检查清单

## 异步工作流（核心路径）

- [ ] 1. 启动异步导出（单设备）
  运行: `python scripts/blackbox.py --host TEST_IP --password TEST_PASS --from-date 2026-05-14 --to-date 2026-05-20`
  验证: stdout 包含 `event_id=` 和 `output_dir=`
        生成 `_export_meta.json` 文件
        exit code 0

- [ ] 2. 查询导出进度
  运行: `python scripts/blackbox.py progress --host TEST_IP --password TEST_PASS --output OUTPUT_DIR`
  验证: stdout 为合法 JSON，包含 `"status"` 字段
        状态为 `NOT_FOUND`、`RUNNING`、`SUCCESS` 或 `FAILED` 之一
        exit code 0（正常）或 5（error 字段存在时）

- [ ] 3. 下载并分析（SUCCESS 后）
  运行: `python scripts/blackbox.py download --host TEST_IP --password TEST_PASS --output OUTPUT_DIR`
  验证: stdout 包含 `# AD 黑盒日志分析报告`
        报告含 `## 📊 审计日志统计` 和 `## ✅ 健康评估` 两个 section
        统计表含 5 列：`| 日期 | 操作数 | 用户 | 操作类型 | 状态 |`
        总计行格式为 `| **总计** | **N** | - | - | - |`
        exit code 0

- [ ] 4. 多设备并行导出
  运行: `python scripts/blackbox.py --hosts https://IP1,https://IP2 --password TEST_PASS --from-date 2026-05-14 --to-date 2026-05-20`
  验证: 每台设备输出 `[IP] event_id=... output_dir=...`
        exit code 0（全部成功）或 7（部分失败）

## 日期校验

- [ ] 5. 日期范围超过 7 天
  运行: `python scripts/blackbox.py --host TEST_IP --password TEST_PASS --from-date 2026-05-01 --to-date 2026-05-20`
  验证: exit code 4
        stderr 包含 `超过 7 天`

- [ ] 6. 结束日期早于开始日期
  运行: `python scripts/blackbox.py --host TEST_IP --password TEST_PASS --from-date 2026-05-20 --to-date 2026-05-14`
  验证: exit code 4
        stderr 包含 `结束日期早于开始日期`

- [ ] 7. 无效日期格式
  运行: `python scripts/blackbox.py --host TEST_IP --password TEST_PASS --from-date 20260514 --to-date 2026-05-20`
  验证: exit code 4
        stderr 包含 `日期格式无效`

## 错误处理

- [ ] 8. 认证失败
  运行: `python scripts/blackbox.py --host TEST_IP --password wrong_pass --from-date 2026-05-14 --to-date 2026-05-20`
  验证: exit code 2
        stderr 包含 `认证失败`

- [ ] 9. 缺少必要参数
  运行: `python scripts/blackbox.py`
  验证: exit code 4
        stderr 包含 usage 信息（`--host`）

## 密码处理

- [ ] 10. download 指定自定义解压密码
  运行: `python scripts/blackbox.py download --host TEST_IP --password TEST_PASS --output OUTPUT_DIR --archive-password custom`
  验证: 若密码正确，正常输出报告
        若密码错误，exit code 5，stderr 包含 `密码错误`

## 示例保鲜

- [ ] 11. output.md 与代码一致
  运行: `python scripts/blackbox.py download --host TEST_IP --password TEST_PASS --output OUTPUT_DIR`
  验证: stdout 结构包含 examples/output.md 中所有的 section 标题
        （不比对动态数值，只比对标题层级和表格列数）
