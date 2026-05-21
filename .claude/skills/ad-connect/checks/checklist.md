<!-- 关联: connect.py _render_table(), _compute_exit_code() -->
<!-- 最后验证: 2026-05-21 -->
<!-- 如果 connect.py 被修改，必须同步更新本清单中受影响的项目 -->

# AD 连接测试 - 回归检查清单

## 核心路径

- [ ] 1. 单设备正常
  运行: `python scripts/connect.py --host TEST_IP --password TEST_PASS`
  验证: stdout 包含 `✅` 和 `连接正常，认证通过`
        exit code 0

- [ ] 2. 单设备连接失败
  运行: `python scripts/connect.py --host https://192.0.2.1 --password TEST_PASS`
  验证: stdout 包含 `🔌` 和 `连接失败`
        exit code 1

- [ ] 3. 单设备认证失败
  运行: `python scripts/connect.py --host TEST_IP --password wrong_pass`
  验证: stdout 包含 `🔑` 和 `认证失败`
        exit code 2

- [ ] 4. 多设备全部正常
  运行: `python scripts/connect.py --hosts "TEST_IP1,TEST_IP2" --password TEST_PASS`
  验证: stdout 表格两行均为 `✅ 正常`
        汇总行 `> 2/2 台设备连接正常。`
        exit code 0

- [ ] 5. 多设备部分失败
  运行: `python scripts/connect.py --hosts "TEST_IP1,FAIL_IP" --password TEST_PASS`
  验证: stdout 表格含 `✅ 正常` 和失败状态
        汇总行包含 `> 1/2 台设备连接正常，1/2 台失败。`
        exit code 7

- [ ] 6. 多设备全部失败
  运行: `python scripts/connect.py --hosts "FAIL_IP1,FAIL_IP2" --password TEST_PASS`
  验证: stdout 汇总行 `> 0/2 台设备连接正常，全部失败。`
        exit code 1（连接失败）或 2（认证失败）

- [ ] 7. 单设备 JSON 输出
  运行: `python scripts/connect.py --host TEST_IP --password TEST_PASS --format json`
  验证: stdout 为合法 JSON，可被 `python -c "import json,sys; json.load(sys.stdin)"` 解析
        包含 `"host"` 和 `"status"` 字段
        exit code 0

- [ ] 8. 多设备 JSON 输出
  运行: `python scripts/connect.py --hosts "TEST_IP1,TEST_IP2" --password TEST_PASS --format json`
  验证: stdout 为合法 JSON，顶层键包含 `"results"` 和 `"summary"`
        `summary` 包含 `total`、`ok`、`failed` 字段
        exit code 0（全部成功）或 7（部分失败）

## 错误处理

- [ ] 9. 缺少 --host
  运行: `python scripts/connect.py`
  验证: exit code 4
        stderr 包含 `未指定设备`

- [ ] 10. 密码从环境变量读取
  运行: `$env:AD_PASS=TEST_PASS; python scripts/connect.py --host TEST_IP`
  验证: exit code 0
        （未传 --password，但 AD_PASS 环境变量已设置）

- [ ] 11. devices.json 加载
  运行: `python scripts/connect.py --devices devices.json`
  验证: 能正确从 JSON 文件加载设备列表并执行连接测试
        密码通过 `password_from` 字段引用环境变量
        exit code 0（全部成功）或 7（部分失败）

## 示例保鲜

- [ ] 12. output.md 与代码一致
  运行: `python scripts/connect.py --hosts "TEST_IP1,TEST_IP2" --password TEST_PASS`
  验证: stdout 表格列数为 3（`| 设备 | IP | 状态 |`）
        汇总行格式匹配 output.md 中的三种模式之一
        单设备模式验证 stdout 单行格式（图标 + host + 描述）
        （不比对动态数值，只比对表格结构和列数）
