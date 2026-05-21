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
import csv
import json
import os
import sys
import time
import tarfile
import zipfile
import urllib.request
import tempfile
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
                reader = csv.reader(f)
                records = []
                for row in reader:
                    if len(row) >= 10:
                        record = {
                            "time": row[0],
                            "user": row[1],
                            "ip": row[2],
                            "method": row[3],
                            "module": row[4],
                            "submodule": row[5],
                            "status": row[6],
                            "path": row[7],
                            "code": row[8],
                            "description": row[9] if len(row) > 9 else ""
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
    
    def _count_field(self, records: List[Dict], field: str) -> Dict[str, int]:
        """统计字段值出现次数"""
        counts = {}
        for record in records:
            value = record.get(field, "unknown")
            counts[value] = counts.get(value, 0) + 1
        return counts
    
    def generate_report(self, audit_results: Dict) -> str:
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


def _blackbox_start(client, from_date="", to_date="", archive_password="root1234+", output_dir=""):
    """Start blackbox export only — returns immediately with event_id and output_dir."""
    slug = host_slug(client.host)
    if not output_dir:
        output_dir = os.path.join(tempfile.gettempdir(), f"blackbox_{slug}")
    else:
        output_dir = os.path.join(output_dir, slug)
    os.makedirs(output_dir, exist_ok=True)

    if not from_date or not to_date:
        return {"error": "必须指定 --from-date 和 --to-date"}

    result = client.export_blackbox_log(from_date, to_date, archive_password)
    event_id = result.get("event_id")
    if not event_id:
        return {"error": f"导出启动失败: {result}"}

    # Save event_id for later polling
    meta_path = os.path.join(output_dir, "_export_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({"host": client.host, "event_id": event_id,
                    "from_date": from_date, "to_date": to_date,
                    "archive_password": archive_password, "output_dir": output_dir}, f,
                  ensure_ascii=False, indent=2)

    return {"host": client.host, "event_id": event_id, "output_dir": output_dir}


def _blackbox_download(client, output_dir, archive_password="root1234+"):
    """Complete an async export: check event, download, extract, analyze. No sys.exit."""
    meta_path = os.path.join(output_dir, "_export_meta.json")
    if not os.path.exists(meta_path):
        return {"error": f"找不到 {meta_path}，请先用 --hosts 启动导出"}

    with open(meta_path, encoding="utf-8") as f:
        meta = json.load(f)

    event_id = meta.get("event_id", "")
    # Check event status
    tasks = client.get_last_event()
    for task in tasks.get("items", []):
        if task.get("event_id") == event_id:
            state = task.get("state")
            if state == "SUCCESS":
                file_token = task.get("data", {}).get("file_token")
                if not file_token:
                    return {"error": "任务成功但缺少 file_token"}
                archive_path = os.path.join(output_dir, "blackbox.tar.gz")
                try:
                    data = client._raw_request(f"/cgi/file-resource?d={file_token}")
                except Exception as e:
                    return {"error": f"文件下载失败: {e}"}
                with open(archive_path, "wb") as f:
                    f.write(data)

                analyzer = BlackboxAnalyzer(output_dir)
                try:
                    analyzer.extract(archive_path, meta.get("archive_password", archive_password))
                except (zipfile.BadZipFile, RuntimeError):
                    return {"error": "归档密码错误，请检查 --archive-password"}
                audit_results = analyzer.analyze_audit_logs()
                report = analyzer.generate_report(audit_results)
                report_path = os.path.join(output_dir, "report.md")
                with open(report_path, "w", encoding="utf-8") as f:
                    f.write(report)

                return {
                    "event_id": event_id, "output_dir": output_dir,
                    "report_path": report_path, "report": report,
                    "audit_dates": list(audit_results.keys()),
                }
            elif state == "FAILED":
                return {"error": f"导出任务失败: event_id={event_id}"}
            else:
                return {"status": state, "event_id": event_id,
                        "message": f"导出进行中 (state={state})，稍后重试"}
    return {"error": f"未找到事件 event_id={event_id}"}


def _blackbox_progress(client, output_dir):
    """Query blackbox export progress without downloading.

    Reads _export_meta.json for event_id, then queries get_last_event().
    Returns one of:
      - {"status": "NOT_FOUND"}
      - {"status": "RUNNING"}
      - {"status": "SUCCESS", "file_size_mb": N}
      - {"status": "FAILED", "error": "..."}
      - {"error": "..."} for missing/corrupt meta file
    Does NOT download anything. Executes in < 2s.
    """
    meta_path = os.path.join(output_dir, "_export_meta.json")
    if not os.path.exists(meta_path):
        return {"error": f"找不到 {meta_path}，请先用 export 启动导出"}

    try:
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
    except json.JSONDecodeError:
        return {"error": f"元数据文件损坏: {meta_path}"}

    event_id = meta.get("event_id", "")
    if not event_id:
        return {"error": "元数据文件缺少 event_id"}

    try:
        tasks = client.get_last_event()
    except Exception as e:
        return {"error": f"查询事件失败: {e}"}

    if not isinstance(tasks, dict):
        return {"error": "查询事件返回数据格式异常"}

    for task in tasks.get("items", []):
        if task.get("event_id") == event_id:
            state = task.get("state")
            if state == "SUCCESS":
                data = task.get("data", {})
                file_size = data.get("file_size", 0)
                file_size_mb = None
                if file_size:
                    try:
                        file_size_mb = round(float(file_size) / (1024 * 1024), 2)
                    except (TypeError, ValueError):
                        file_size_mb = None
                return {"status": "SUCCESS", "file_size_mb": file_size_mb}
            elif state == "FAILED":
                return {"status": "FAILED", "error": f"导出任务失败: event_id={event_id}"}
            else:
                return {"status": "RUNNING", "state": state, "event_id": event_id}

    return {"status": "NOT_FOUND"}


def _blackbox_progress_one(client, **kw):
    """Single-device progress adapter for ThreadPoolExecutor."""
    output_base = kw.get("output_dir", "")
    slug = host_slug(client.host)
    if output_base:
        output_dir = os.path.join(output_base, slug)
    else:
        output_dir = os.path.join(tempfile.gettempdir(), f"blackbox_{slug}")
    return _blackbox_progress(client, output_dir)


def _validate_date_range(from_date, to_date):
    """Validate date range does not exceed 7 days. Returns True if valid."""
    if not from_date or not to_date:
        return True
    try:
        fd = datetime.strptime(from_date, "%Y-%m-%d")
        td = datetime.strptime(to_date, "%Y-%m-%d")
        span = (td - fd).days
        if span < 0:
            print("错误: 结束日期早于开始日期", file=sys.stderr)
            return False
        if span >= 7:
            print(
                f"错误: 日期范围 ({from_date} ~ {to_date}) 跨 {span} 天，超过 7 天上限",
                file=sys.stderr,
            )
            return False
    except ValueError:
        print("错误: 日期格式无效，请使用 YYYY-MM-DD", file=sys.stderr)
        return False
    return True


def _main_progress():
    """Handle 'progress' subcommand — query blackbox export progress."""
    parser = argparse.ArgumentParser(
        prog="blackbox.py progress", description="查询黑盒导出进度"
    )
    parser.add_argument("--host", default="", help="AD 设备地址")
    parser.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    parser.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    parser.add_argument("--user", default="admin", help="用户名")
    parser.add_argument("--password", help="密码")
    parser.add_argument(
        "--output",
        default="blackbox_analysis",
        help="输出目录（与 export 时的 output_dir 一致）",
    )

    remaining = sys.argv[2:] if len(sys.argv) > 2 else []
    args = parser.parse_args(remaining)

    try:
        if args.hosts or args.devices:
            if args.hosts:
                devices = parse_hosts_arg(args.hosts, args.user, args.password)
            else:
                devices = load_devices_json(args.devices)
            if not devices:
                print("错误: 设备列表为空", file=sys.stderr)
                sys.exit(4)
            results = run_multi(
                devices, _blackbox_progress_one,
                output_dir=args.output, password=args.password,
            )
            print(json.dumps(
                {"mode": "multi", "results": results},
                indent=2, ensure_ascii=False,
            ))
            sys.exit(compute_multi_exit_code(results))

        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        client = ADClient(args.host, args.user, args.password)
        result = _blackbox_progress(client, args.output)
        is_error = "error" in result
        print(json.dumps(result, indent=2, ensure_ascii=False))
        sys.exit(5 if is_error else 0)

    except ADAuthError as e:
        print(f"认证失败: {e}", file=sys.stderr)
        sys.exit(2)
    except (ADConnectionError, ADAPIError) as e:
        print(f"通信错误: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(5)


def _main_download():
    """Handle 'download' subcommand — download blackbox archive and analyze."""
    parser = argparse.ArgumentParser(
        prog="blackbox.py download", description="下载黑盒文件并分析（仅在 progress 返回 SUCCESS 后使用）"
    )
    parser.add_argument("--host", required=True, help="AD 设备地址")
    parser.add_argument("--user", default="admin", help="用户名")
    parser.add_argument("--password", help="密码")
    parser.add_argument(
        "--output",
        required=True,
        help="输出目录（与 export 时的 output_dir 一致）",
    )
    parser.add_argument(
        "--archive-password",
        default="root1234+",
        help="黑盒文件解压密码",
    )

    remaining = sys.argv[2:] if len(sys.argv) > 2 else []
    args = parser.parse_args(remaining)

    try:
        client = ADClient(args.host, args.user, args.password)
        result = _blackbox_download(client, args.output, args.archive_password)
        if "error" in result:
            print(f"错误: {result['error']}", file=sys.stderr)
            sys.exit(5)
        elif "status" in result:
            print(json.dumps(result, ensure_ascii=False))
            sys.exit(0)
        else:
            print(f"输出目录: {result.get('output_dir', '')}")
            print(f"报告路径: {result.get('report_path', '')}")
            print(result.get("report", ""))
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


def main():
    sys.stdout.reconfigure(encoding='utf-8')

    # ── Route to subcommand if first arg is a known command ──────────────
    cmd = sys.argv[1] if len(sys.argv) > 1 else None
    if cmd == "progress":
        return _main_progress()
    elif cmd == "download":
        return _main_download()

    # ── Legacy backward-compatible flow (no subcommand) ──────────────────
    parser = argparse.ArgumentParser(description="AD 黑盒日志分析工具")
    parser.add_argument("--host", default="", help="AD 设备地址")
    parser.add_argument("--hosts", default="", help="多设备地址，逗号分隔 (如 https://IP1,https://IP2)")
    parser.add_argument("--devices", default="", help="设备清单 JSON 文件路径 (密码不同时使用)")
    parser.add_argument("--complete", default="", help="已废弃：请使用 download 子命令")
    parser.add_argument("--user", default="admin", help="用户名")
    parser.add_argument("--password", help="密码")
    parser.add_argument("--from-date", help="开始日期 (YYYY-MM-DD)")
    parser.add_argument("--to-date", help="结束日期 (YYYY-MM-DD)")
    parser.add_argument("--archive-password", default="root1234+", help="黑盒文件解压密码")
    parser.add_argument("--output", default="blackbox_analysis", help="输出目录")

    args = parser.parse_args()

    try:
        # Date range validation (max 7 days)
        if args.from_date and args.to_date:
            if not _validate_date_range(args.from_date, args.to_date):
                sys.exit(4)

        # --complete: deprecated, route to download logic
        if args.complete:
            print("警告: --complete 已废弃，请使用 download 子命令", file=sys.stderr)
            if not args.host:
                print("错误: --complete 需要指定 --host", file=sys.stderr)
                sys.exit(4)
            client = ADClient(args.host, args.user, args.password)
            result = _blackbox_download(client, args.complete, args.archive_password)
            if "error" in result:
                print(f"错误: {result['error']}", file=sys.stderr)
                sys.exit(5)
            elif "status" in result:
                print(json.dumps(result, ensure_ascii=False))
                sys.exit(0)
            else:
                print(f"输出目录: {result.get('output_dir', '')}")
                print(f"报告路径: {result.get('report_path', '')}")
                print(result.get("report", ""))
                sys.exit(0)

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

            # 异步模式：启动导出后立即退出，LLM 用 progress/download 轮询
            results = run_multi(devices, _blackbox_start,
                              from_date=args.from_date or "",
                              to_date=args.to_date or "",
                              archive_password=args.archive_password,
                              output_dir=args.output)
            for host, r in results.items():
                if "error" in r:
                    print(f"[{host}] 错误: {r['error']}", file=sys.stderr)
                else:
                    print(f"[{host}] event_id={r['event_id']} output_dir={r['output_dir']}")
            sys.exit(compute_multi_exit_code(results))

        # Single-device validation
        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        client = ADClient(args.host, args.user, args.password)

        if args.from_date and args.to_date:
            # 异步模式：启动导出后立即退出，LLM 用 progress/download 轮询
            result = _blackbox_start(client, from_date=args.from_date, to_date=args.to_date,
                                     archive_password=args.archive_password, output_dir=args.output)
            if "error" in result:
                print(f"错误: {result['error']}", file=sys.stderr)
                sys.exit(5)
            print(f"event_id={result['event_id']} output_dir={result['output_dir']}")
            sys.exit(0)
        else:
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
