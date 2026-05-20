#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AD 黑盒日志分析工具

功能：
- 导出黑盒日志
- 下载黑盒文件
- 解压并分析日志
- 生成分析报告
"""

import argparse
import json
import os
import sys
import time
import tarfile
import zipfile
import urllib.request
import urllib.error
import ssl
import base64
import tempfile
import shutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any


# Cross-skill import: ad-ops provides ADClient
_scripts_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "ad-ops", "scripts"
)
_scripts_dir = os.path.realpath(_scripts_dir)
if not os.path.isdir(_scripts_dir):
    print("错误: 无法定位 ad-ops/scripts 目录", file=sys.stderr)
    sys.exit(9)
sys.path.insert(0, _scripts_dir)
try:
    from ad_api import ADClient, ADError, ADAuthError, ADAPIError, ADConnectionError
except ImportError as e:
    print(f"错误: 无法导入 ad_api: {e}", file=sys.stderr)
    sys.exit(9)
try:
    from multi_device import (
        run_multi, parse_hosts_arg, load_devices_json,
        compute_multi_exit_code, render_multi_summary, host_slug,
    )
except ImportError as e:
    print(f"错误: 无法导入 multi_device: {e}", file=sys.stderr)
    sys.exit(9)


class BlackboxAnalyzer:
    """黑盒日志分析器"""
    
    def __init__(self, extract_path: str):
        self.extract_path = extract_path
        self.hislog_path = os.path.join(extract_path, "hislog")
    
    def extract(self, archive_path: str, password: str) -> None:
        """解压黑盒文件"""
        # 创建临时目录
        os.makedirs(self.extract_path, exist_ok=True)
        
        # 解压外层 ZIP
        print(f"解压 ZIP 文件: {archive_path}")
        with zipfile.ZipFile(archive_path, "r") as zf:
            zf.extractall(self.extract_path, pwd=password.encode())
        
        # 解压内层 tgz
        tgz_path = os.path.join(self.hislog_path, "adlog1.tgz")
        if os.path.exists(tgz_path):
            print(f"解压 TGZ 文件: {tgz_path}")
            with tarfile.open(tgz_path, "r:gz") as tf:
                tf.extractall(self.hislog_path)
        
        print("解压完成")
    
    def get_available_dates(self) -> List[str]:
        """获取可用的日期列表"""
        dates = []
        hislog_dir = os.path.join(self.hislog_path, "hislog")
        
        if not os.path.exists(hislog_dir):
            return dates
        
        for name in os.listdir(hislog_dir):
            if name.endswith(".audit"):
                date = name.replace(".audit", "")
                if date.startswith("20"):
                    dates.append(date)
        
        return sorted(dates)
    
    def analyze_audit_logs(self, dates: Optional[List[str]] = None) -> Dict[str, Any]:
        """分析审计日志"""
        results = {}
        hislog_dir = os.path.join(self.hislog_path, "hislog")
        
        if dates is None:
            dates = self.get_available_dates()
        
        for date in dates:
            audit_file = os.path.join(hislog_dir, f"{date}.audit", "zh_CN", "0.audit.csv")
            if not os.path.exists(audit_file):
                continue
            
            with open(audit_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            records = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # 解析 CSV 行
                parts = line.split(",")
                if len(parts) >= 10:
                    record = {
                        "time": parts[0].strip('"'),
                        "user": parts[1].strip('"'),
                        "ip": parts[2].strip('"'),
                        "method": parts[3].strip('"'),
                        "module": parts[4].strip('"'),
                        "submodule": parts[5].strip('"'),
                        "status": parts[6].strip('"'),
                        "path": parts[7].strip('"'),
                        "code": parts[8].strip('"'),
                        "description": parts[9].strip('"') if len(parts) > 9 else ""
                    }
                    records.append(record)
            
            results[date] = {
                "count": len(records),
                "records": records,
                "methods": self._count_field(records, "method"),
                "users": self._count_field(records, "user"),
                "statuses": self._count_field(records, "status")
            }
        
        return results
    
    def analyze_system_logs(self, date: str) -> Dict[str, Any]:
        """分析系统日志"""
        results = {}
        log_dir = os.path.join(self.hislog_path, "log", date, "zh_CN", "0")
        
        if not os.path.exists(log_dir):
            return results
        
        for filename in os.listdir(log_dir):
            if not filename.endswith(".csv"):
                continue
            
            filepath = os.path.join(log_dir, filename)
            log_type = filename.replace(f"-{date}.csv", "").replace(f"-{date}.csv.1", "")
            
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            results[log_type] = {
                "count": len(lines),
                "file": filename
            }
        
        return results
    
    def _count_field(self, records: List[Dict], field: str) -> Dict[str, int]:
        """统计字段值出现次数"""
        counts = {}
        for record in records:
            value = record.get(field, "unknown")
            counts[value] = counts.get(value, 0) + 1
        return counts
    
    def generate_report(self, audit_results: Dict, system_results: Dict = None) -> str:
        """生成分析报告"""
        report = []
        report.append("# AD 黑盒日志分析报告")
        report.append("")
        report.append(f"**分析时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # 审计日志统计
        report.append("## 📊 审计日志统计")
        report.append("")
        report.append("| 日期 | 操作数 | 用户 | 操作类型 | 状态 |")
        report.append("|------|--------|------|----------|------|")
        
        total_count = 0
        for date, data in sorted(audit_results.items()):
            count = data["count"]
            total_count += count
            users = ", ".join(f"{k}({v})" for k, v in sorted(data["users"].items(), key=lambda x: -x[1]))
            methods = ", ".join(f"{k}({v})" for k, v in sorted(data["methods"].items(), key=lambda x: -x[1]))
            statuses = ", ".join(f"{k}({v})" for k, v in sorted(data["statuses"].items(), key=lambda x: -x[1]))
            
            report.append(f"| {date} | {count} | {users} | {methods} | {statuses} |")
        
        report.append(f"| **总计** | **{total_count}** | - | - | - |")
        report.append("")
        
        # 健康评估
        report.append("## ✅ 健康评估")
        report.append("")
        report.append("| 项目 | 状态 | 说明 |")
        report.append("|------|------|------|")
        
        # 检查是否有失败操作
        has_failed = False
        for date, data in audit_results.items():
            if "FAILED" in data["statuses"]:
                has_failed = True
                break
        
        report.append(f"| 系统稳定性 | {'⚠️ 异常' if has_failed else '✅ 正常'} | {'存在失败操作' if has_failed else '无异常'} |")
        report.append(f"| 审计记录 | ✅ 正常 | 共 {total_count} 条记录 |")
        report.append("")
        
        return "\n".join(report)


def _blackbox_one(client, from_date="", to_date="", archive_password="root1234+", output_dir=""):
    """Single-device blackbox export+analyze for ThreadPoolExecutor. No sys.exit."""
    slug = host_slug(client.host)
    if not output_dir:
        output_dir = os.path.join(tempfile.gettempdir(), f"blackbox_{slug}")
    else:
        output_dir = os.path.join(output_dir, slug)
    os.makedirs(output_dir, exist_ok=True)

    if not from_date or not to_date:
        return {"error": "必须指定 --from-date 和 --to-date"}

    # Export blackbox log
    result = client.export_blackbox_log(from_date, to_date, archive_password)
    event_id = result.get("event_id")
    if not event_id:
        return {"error": f"导出启动失败: {result}"}

    # Wait for task completion (max 60 cycles = 5 min)
    for i in range(60):
        tasks = client.get_last_event()
        for task in tasks.get("items", []):
            if task.get("event_id") == event_id:
                state = task.get("state")
                if state == "SUCCESS":
                    file_token = task.get("data", {}).get("file_token")
                    # Download file
                    archive_path = os.path.join(output_dir, "blackbox.tar.gz")
                    data = client._raw_request(f"/cgi/file-resource?d={file_token}")
                    with open(archive_path, "wb") as f:
                        f.write(data)

                    # Extract and analyze
                    analyzer = BlackboxAnalyzer(output_dir)
                    analyzer.extract(archive_path, archive_password)
                    audit_results = analyzer.analyze_audit_logs()
                    report = analyzer.generate_report(audit_results)

                    # Write report
                    report_path = os.path.join(output_dir, "report.md")
                    with open(report_path, "w", encoding="utf-8") as f:
                        f.write(report)

                    return {
                        "event_id": event_id,
                        "output_dir": output_dir,
                        "report_path": report_path,
                        "report": report,
                        "audit_dates": list(audit_results.keys()),
                    }
                elif state == "FAILED":
                    return {"error": f"任务失败: event_id={event_id}"}
        time.sleep(5)

    return {"error": f"轮询超时: event_id={event_id}"}


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description="AD 黑盒日志分析工具")
    parser.add_argument("--host", default="", help="AD 设备地址")
    parser.add_argument("--hosts", default="", help="多设备地址，逗号分隔 (如 https://IP1,https://IP2)")
    parser.add_argument("--devices", default="", help="设备清单 JSON 文件路径 (密码不同时使用)")
    parser.add_argument("--user", default="admin", help="用户名")
    parser.add_argument("--password", help="密码")
    parser.add_argument("--from-date", help="开始日期 (YYYY-MM-DD)")
    parser.add_argument("--to-date", help="结束日期 (YYYY-MM-DD)")
    parser.add_argument("--archive-password", default="root1234+", help="黑盒文件解压密码")
    parser.add_argument("--output", default="/tmp/blackbox_analysis", help="输出目录")

    args = parser.parse_args()

    try:
        # Multi-device mode
        if args.hosts or args.devices:
            if args.host:
                print("警告: --hosts 和 --host 同时指定，--host 将被忽略", file=sys.stderr)
            if args.hosts:
                devices = parse_hosts_arg(args.hosts, args.user, args.password)
            else:
                devices = load_devices_json(args.devices)

            if not devices:
                print("错误: 设备列表为空", file=sys.stderr)
                sys.exit(4)

            results = run_multi(devices, _blackbox_one,
                              from_date=args.from_date or "",
                              to_date=args.to_date or "",
                              archive_password=args.archive_password,
                              output_dir=args.output)

            # Output per device
            for host, result in results.items():
                if "error" in result:
                    print(f"\n## {host}\n> 错误: {result['error']}")
                else:
                    print(f"\n## {host}")
                    print(f"输出目录: {result.get('output_dir', '')}")
                    print(f"报告路径: {result.get('report_path', '')}")
                    print(result.get("report", ""))

            print(f"\n---\n{render_multi_summary(results, 'AD 黑盒日志分析 — 多设备')}")
            sys.exit(compute_multi_exit_code(results))

        # Single-device validation
        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        # 创建客户端 (使用共享 ADClient)
        client = ADClient(args.host, args.user, args.password)

        # 如果指定了日期范围，则导出黑盒日志
        if args.from_date and args.to_date:
            print(f"导出黑盒日志: {args.from_date} ~ {args.to_date}")
            result = client.export_blackbox_log(args.from_date, args.to_date, args.archive_password)
            event_id = result.get("event_id")
            print(f"任务ID: {event_id}")

            # 等待任务完成
            print("等待任务完成...")
            for i in range(60):
                tasks = client.get_last_event()
                for task in tasks.get("items", []):
                    if task.get("event_id") == event_id:
                        state = task.get("state")
                        print(f"[{i+1}] 状态: {state}")
                        if state == "SUCCESS":
                            file_token = task.get("data", {}).get("file_token")
                            print(f"文件Token: {file_token}")

                            # 下载文件
                            archive_path = os.path.join(args.output, "blackbox.tar.gz")
                            os.makedirs(args.output, exist_ok=True)
                            data = client._raw_request(f"/cgi/file-resource?d={file_token}")
                            with open(archive_path, "wb") as f:
                                f.write(data)
                            print(f"文件下载完成: {archive_path}")

                            # 解压并分析
                            analyzer = BlackboxAnalyzer(args.output)
                            analyzer.extract(archive_path, args.archive_password)

                            # 分析审计日志
                            audit_results = analyzer.analyze_audit_logs()

                            # 生成报告
                            report = analyzer.generate_report(audit_results)
                            report_path = os.path.join(args.output, "report.md")
                            with open(report_path, "w", encoding="utf-8") as f:
                                f.write(report)
                            print(f"报告已生成: {report_path}")

                            sys.exit(0)
                        elif state == "FAILED":
                            print("任务失败", file=sys.stderr)
                            sys.exit(1)

                time.sleep(5)

            # 轮询超时
            print("错误: 轮询超时，任务未完成", file=sys.stderr)
            sys.exit(5)
        else:
            # 分析已有的黑盒文件
            analyzer = BlackboxAnalyzer(args.output)
            audit_results = analyzer.analyze_audit_logs()
            report = analyzer.generate_report(audit_results)
            print(report)
            sys.exit(0)

    except ADAuthError as e:
        print(f"认证失败: {e}", file=sys.stderr)
        sys.exit(2)
    except (ADConnectionError, ADAPIError) as e:
        print(f"通信错误: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(5)


if __name__ == "__main__":
    main()
