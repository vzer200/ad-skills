#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AD 巡检脚本 — 严格按照 ad-check-analysis SKILL.md 流程实现
"""

import argparse
import json
import os
import sys
import tempfile
import time
from pathlib import Path

# Cross-skill import: ad-ops provides ADClient and multi_device utilities
_ad_ops_scripts = Path(__file__).resolve().parent.parent.parent / "ad-ops" / "scripts"
if not _ad_ops_scripts.is_dir():
    print("错误: 无法定位 ad-ops/scripts 目录", file=sys.stderr)
    sys.exit(9)
if str(_ad_ops_scripts) not in sys.path:
    sys.path.insert(0, str(_ad_ops_scripts))
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
try:
    from render import render_multi_device_report
except ImportError as e:
    print(f"错误: 无法导入 render: {e}", file=sys.stderr)
    sys.exit(9)

import zipfile
from typing import Any, Dict, Optional


# ---------------------------------------------------------------------------
# 自定义异常类
# ---------------------------------------------------------------------------

class CheckError(RuntimeError):
    """Base exception for check operations."""
    pass

class CheckSceneNotFoundError(CheckError):
    """The requested check scene does not exist."""
    pass

class CheckLimitReachedError(CheckError):
    """Check history limit reached, need --force."""
    pass

class CheckTimeoutError(CheckError):
    """Check report generation timed out."""
    pass

class CheckDownloadError(CheckError):
    """Check report download failed."""
    pass


# ---------------------------------------------------------------------------
# 巡检执行流程
# ---------------------------------------------------------------------------

def start_check(
    client: ADClient,
    scene: str,
    force: bool = False,
    work_dir: str = None,
) -> Dict[str, Any]:
    """
    步骤 1-3：场景确认 + 记录上限检查 + 后台启动巡检
    """
    if work_dir is None:
        work_dir = os.path.join(tempfile.gettempdir(), "ad_check")
    os.makedirs(work_dir, exist_ok=True)

    # 步骤 1: 确认巡检场景
    scenes = client._request("GET", "/sys/offline-check/")
    scene_names = [s["name"] for s in scenes.get("items", [])]
    if not scene_names:
        raise RuntimeError("无法获取巡检场景列表")
    if scene not in scene_names:
        raise CheckSceneNotFoundError(f"场景 '{scene}' 不存在，可用: {scene_names}")

    # 步骤 2: 检查巡检记录上限
    history = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
    pre_run_items = history.get("items", [])
    count = len(pre_run_items)
    pre_run_latest_name = pre_run_items[0].get("name", "") if pre_run_items else ""
    need_force = count >= 5
    print(f"[步骤 2] 巡检记录: {count}/5 {'(已达上限，需 --force)' if need_force else '(未达上限，可直接执行)'}")
    if need_force and not force:
        raise CheckLimitReachedError(
            "巡检记录已达 5 条上限，需要使用 --force 参数强制巡检（会删除最早一条记录）"
        )

    # 步骤 3: 后台启动巡检（立即返回）
    print(f"[步骤 3] 启动巡检: scene='{scene}' force={force}")
    result = client._request(
        "POST", "/debug/sys/offline-check",
        data={"scene": scene},
        params={"force": "true"} if (force and need_force) else None,
    )
    event_id = result.get("event_id")
    if not event_id:
        raise RuntimeError(f"巡检启动失败: {result}")
    print(f"         event_id={event_id}  state={result.get('state')}")
    print("         巡检已在设备后台执行，请使用 progress 命令轮询进度。")

    check_start_time = result.get("start_time", "")
    meta = {
        "scene": scene,
        "host": client.host,
        "event_id": event_id,
        "report_name": "",
        "t0_int": _normalize_start_time(check_start_time),
        "pre_run_latest_name": pre_run_latest_name,
        "work_dir": work_dir,
    }
    meta_path = os.path.join(work_dir, "_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    return meta


def wait_and_download(
    client: ADClient,
    work_dir: str = "/tmp/ad_check",
    poll_interval: int = 10,
    timeout: int = 600,
    max_attempts: int = 60,
) -> Dict[str, Any]:
    """
    步骤 4-6：轮询历史记录确认新报告生成 → 下载报告 → 解压保存元数据

    通过 _meta.json 中的 start_time（精确匹配）+ pre_run_latest_name（兜底）
    判定 history[0] 是否为本次 run 触发的新报告，并要求 end_time != "" 表示已完成。
    """
    meta_path = os.path.join(work_dir, "_meta.json")
    if not os.path.exists(meta_path):
        raise RuntimeError(f"找不到 {meta_path}，请先执行 run 启动巡检")

    with open(meta_path, encoding="utf-8") as f:
        meta = json.load(f)

    scene = meta.get("scene", "?")
    t0_int = meta.get("t0_int", 0)
    pre_run_latest_name = meta.get("pre_run_latest_name", "")

    if not t0_int and not pre_run_latest_name:
        raise RuntimeError(
            "无法判定新报告：_meta.json 缺少 t0_int 和 pre_run_latest_name。"
            "请用最新版 run 重新启动巡检后再 wait。"
        )

    # ── 步骤 4: 轮询历史记录，等待新报告生成 ─────────────────────────
    print(f"[步骤 4] 轮询历史等待新报告 (interval={poll_interval}s, timeout={timeout}s)", file=sys.stderr)
    deadline = time.time() + timeout
    latest = None
    attempt = 0
    while time.time() < deadline and attempt < max_attempts:
        attempt += 1
        try:
            history = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
        except (ADConnectionError, ADAuthError, ADAPIError) as e:
            raise RuntimeError(f"API 调用失败: {e}")
        items = history.get("items", [])
        if items:
            top = items[0]
            top_name = top.get("name", "")
            top_start = top.get("start_time", "")
            top_end = top.get("end_time", "")
            if t0_int:
                is_new = _is_new_report(top, pre_run_latest_name, t0_int)
            else:
                is_new = bool(top_end) and top_name != pre_run_latest_name
            is_finished = bool(top_end)
            state = "FINISHED" if is_finished else "RUNNING"
            tag = "✓ 新报告" if is_new else "× 旧报告"
            print(f"         [{attempt}] {tag} {state} name={top_name} start={top_start}", file=sys.stderr)
            if is_new and is_finished:
                latest = top
                break
        else:
            print(f"         [{attempt}] 历史为空", file=sys.stderr)
        time.sleep(poll_interval)

    if latest is None:
        raise CheckTimeoutError(
            f"未检测到本次巡检的完成报告 (attempts={attempt})。"
            "请使用 progress 确认完成后再 wait，或增加重试次数。"
        )

    # ── 步骤 5: 下载报告 ─────────────────────────────────────────────
    print("[步骤 5] 下载巡检报告…", file=sys.stderr)
    report_name = latest["name"]
    report_scene = latest.get("scene", scene)
    start_time = latest.get("start_time", "")
    print(f"         报告: {report_name}", file=sys.stderr)

    try:
        token_resp = client._request(
            "GET", "/debug/sys/offline-check",
            params={"type": "download", "key": report_name, "encrypt": "false"},
        )
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise RuntimeError(f"API 调用失败: {e}")
    file_token = token_resp.get("file_token")
    if not file_token:
        raise CheckDownloadError(f"获取 file_token 失败: {token_resp}")

    zip_path = os.path.join(work_dir, "report.zip")
    try:
        data = client._raw_request(f"/cgi/file-resource?d={file_token}")
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise CheckDownloadError(f"文件下载失败: {e}")
    os.makedirs(os.path.dirname(zip_path) or ".", exist_ok=True)
    with open(zip_path, "wb") as f:
        f.write(data)
    print(f"         下载: {zip_path} ({os.path.getsize(zip_path)} bytes)", file=sys.stderr)

    # ── 步骤 6: 解压并更新元数据 ────────────────────────────────────
    print("[步骤 6] 解压并保存元数据…", file=sys.stderr)
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(work_dir)

        # 查找 acheck_offline_check_info.json（通过文件名包含 check_info 匹配）
        check_info_path = None
        for name in zf.namelist():
            basename = os.path.basename(name)
            if "check_info" in basename.lower() and basename.endswith(".json"):
                check_info_path = os.path.join(work_dir, name)
                break

    if check_info_path and not os.path.exists(check_info_path):
        # namelist 可能不含目录前缀，尝试直接在 work_dir 下查找
        for root, _, files in os.walk(work_dir):
            for f in files:
                if "check_info" in f.lower() and f.endswith(".json"):
                    check_info_path = os.path.join(root, f)
                    break
            if check_info_path:
                break

    meta["check_info_path"] = check_info_path if (check_info_path and os.path.exists(check_info_path)) else None

    ad_json_path = os.path.join(work_dir, "ad.json")
    if not os.path.exists(ad_json_path):
        for root, _, files in os.walk(work_dir):
            if "ad.json" in files:
                ad_json_path = os.path.join(root, "ad.json")
                break

    if not os.path.exists(ad_json_path):
        raise RuntimeError(f"解压后未找到 ad.json 文件在 {work_dir}")

    # 更新 meta
    meta.update({
        "report_name": report_name,
        "scene": report_scene,
        "start_time": start_time,
        "ad_json_path": ad_json_path,
    })
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"         ad.json: {ad_json_path} ({os.path.getsize(ad_json_path)} bytes)", file=sys.stderr)
    print("✅ 下载完成", file=sys.stderr)

    return meta


# ---------------------------------------------------------------------------
# 巡检结果分析（67 项全覆盖）
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# 优化建议映射表
# ---------------------------------------------------------------------------

_SUGGESTION_MAP = {
    "base_cpu_info": "CPU 使用率偏高，建议检查是否存在异常进程或考虑扩容",
    "base_memory": "内存使用率偏高，建议检查是否存在内存泄漏或考虑扩容",
    "base_disk": "磁盘信息缺失，建议检查磁盘状态",
    "fan_state": "风扇状态异常，建议检查硬件并及时更换故障风扇",
    "power_state": "电源状态异常，建议检查电源模块并安排维护",
    "nic_health_check": "网卡健康状态异常，建议检查网卡硬件和驱动",
    "base_core_process": "核心进程缺失，建议检查服务状态并重启相关服务",
    "base_kernel_log": "内核日志存在异常，建议排查内核错误日志",
    "weak_password": "存在弱密码账户，建议修改为强密码",
    "ssh_or_adapi_authority": "SSH/ADAPI 权限未正确配置，建议检查并加固访问控制",
    "ssl_strategy_check": "SSL 策略存在不安全算法或协议，建议禁用旧版本",
    "dangerous_port": "存在风险端口开放，建议关闭不必要的端口",
    "base_net_state": "设备网口连接异常，建议检查物理链路",
    "config_id_conflict_check": "配置 ID 存在冲突，建议排查并修正配置",
    "base_crash_time": "存在崩溃日志，建议排查系统稳定性问题",
    "shm_sem_check": "共享内存/信号量异常，可能存在内存泄漏",
    "base_file_leak": "文件描述符泄漏，建议检查进程资源使用",
    "base_err_log": "错误日志数量偏高，建议排查系统日志",
    "base_report_stability": "报表稳定性异常，建议检查报表服务",
    "base_conntrack": "连接跟踪数偏高，建议检查网络连接状况",
    "security_check": "安全检查未通过，建议排查安全配置",
    "cluster_brain_split_check": "检测到集群脑裂风险，建议检查集群通信",
    "check_admin_account": "管理员账户未正确配置，建议检查账户设置",
    "base_app_version": "AD版本信息缺失，建议检查系统状态",
    "bios_version_check": "BIOS有可用更新，建议评估后升级",
    "remote_maintenance": "远程维护已开启，建议评估安全风险后决定是否关闭",
    "enable_iplimit": "IP限制未启用，建议启用以增强安全性",
    "check_dev_online": "设备未注册云平台，建议检查网络连接",
    "patch_info": "补丁信息为空，建议检查补丁管理状态",
    "base_blackbox_data": "黑盒dmesg数据存在异常记录",
    "base_blackbox_state": "黑盒状态异常，建议检查黑盒服务",
    "alarms_enabled": "告警未启用，建议配置告警策略",
    "base_running_time": "运行时间数据缺失，建议检查系统状态",
    "acceleration_check": "加速引擎未就绪，建议检查加速卡状态",
    "snat_sport_exhaustion_check": "SNAT端口耗尽，建议检查NAT配置",
}

# ---------------------------------------------------------------------------
# 35 条 rule_id → 中文名称映射
# ---------------------------------------------------------------------------

CHECK_NAMES = {
    "ssh_or_adapi_authority": "SSH/ADAPI授权",
    "patch_info": "补丁信息",
    "base_report_stability": "报表稳定性",
    "weak_password": "弱密码",
    "ssl_strategy_check": "SSL策略",
    "enable_iplimit": "IP限制",
    "dangerous_port": "危险端口",
    "security_check": "安全检查",
    "cluster_brain_split_check": "集群脑裂检查",
    "check_admin_account": "管理员账户",
    "base_app_version": "AD版本",
    "bios_version_check": "BIOS版本",
    "shm_sem_check": "共享内存/信号量",
    "base_conntrack": "连接跟踪",
    "power_state": "电源状态",
    "fan_state": "风扇状态",
    "acceleration_check": "加速引擎",
    "base_memory": "内存使用率",
    "base_crash_time": "崩溃日志",
    "base_disk": "磁盘信息",
    "remote_maintenance": "远程维护",
    "base_kernel_log": "内核日志",
    "base_core_process": "核心进程",
    "base_net_state": "网络状态",
    "base_file_leak": "文件描述符泄漏",
    "base_cpu_info": "CPU使用率",
    "base_err_log": "错误日志",
    "base_running_time": "运行时间",
    "check_dev_online": "设备在线状态",
    "base_blackbox_data": "黑盒dmesg数据",
    "base_blackbox_state": "黑盒状态",
    "alarms_enabled": "告警启用",
    "config_id_conflict_check": "配置ID冲突",
    "nic_health_check": "网卡健康检查",
    "snat_sport_exhaustion_check": "SNAT端口耗尽",
}

# ---------------------------------------------------------------------------
# rule_id → category 映射
# ---------------------------------------------------------------------------

CHECK_CATEGORY_MAP = {
    "ssh_or_adapi_authority": "secure",
    "patch_info": "secure",
    "base_report_stability": "health",
    "weak_password": "secure",
    "ssl_strategy_check": "secure",
    "enable_iplimit": "secure",
    "dangerous_port": "secure",
    "security_check": "secure",
    "cluster_brain_split_check": "feature",
    "check_admin_account": "secure",
    "base_app_version": "feature",
    "bios_version_check": "health",
    "shm_sem_check": "health",
    "base_conntrack": "health",
    "power_state": "health",
    "fan_state": "health",
    "acceleration_check": "health",
    "base_memory": "health",
    "base_crash_time": "health",
    "base_disk": "health",
    "remote_maintenance": "secure",
    "base_kernel_log": "health",
    "base_core_process": "health",
    "base_net_state": "health",
    "base_file_leak": "health",
    "base_cpu_info": "health",
    "base_err_log": "health",
    "base_running_time": "feature",
    "check_dev_online": "feature",
    "base_blackbox_data": "health",
    "base_blackbox_state": "health",
    "alarms_enabled": "health",
    "config_id_conflict_check": "feature",
    "nic_health_check": "health",
    "snat_sport_exhaustion_check": "health",
}

# ---------------------------------------------------------------------------
# rule_id → ad.json 实际字段名映射
# ---------------------------------------------------------------------------

RULE_FIELD_MAP = {
    "ssh_or_adapi_authority": ["ssh_authority", "ADAPI_authority"],
    "patch_info": ["patch_info"],
    "base_report_stability": ["base_report_stab"],
    "weak_password": ["weak_pwd"],
    "ssl_strategy_check": ["unsafe_algorithm", "unsafe_protocol"],
    "enable_iplimit": ["enable_iplimit"],
    "dangerous_port": ["dangerous_port"],
    "security_check": ["security_check_state"],
    "cluster_brain_split_check": ["cluster_brain_split_check"],
    "check_admin_account": ["admin"],
    "base_app_version": ["ad_appversion"],
    "bios_version_check": ["bios_update_state"],
    "shm_sem_check": ["shm_sem_state"],
    "base_conntrack": ["conntrack_count", "conntrack_new_count"],
    "power_state": ["power_state"],
    "fan_state": ["fan_state"],
    "acceleration_check": ["acceleration"],
    "base_memory": ["snmp_mem_rate"],
    "base_crash_time": ["base_crash_time"],
    "base_disk": ["disk_info", "base_disk_high_usage"],
    "remote_maintenance": ["remote_mt"],
    "base_kernel_log": ["base_kernel_log"],
    "base_core_process": ["base_core_process_lack"],
    "base_net_state": ["base_eth_abnormal", "base_eth_mtu", "base_drop_err_packet_rate", "base_eth_info"],
    "base_file_leak": ["base_file_ds"],
    "base_cpu_info": ["base_cpu_usage"],
    "base_err_log": ["base_log_error_exist"],
    "base_running_time": ["base_running_time"],
    "check_dev_online": ["online"],
    "base_blackbox_data": ["base_blackbox_dmesg"],
    "base_blackbox_state": ["base_blackbox_state"],
    "alarms_enabled": ["alarms_enabled"],
    "config_id_conflict_check": ["id_conflict_list"],
    "nic_health_check": ["I350_nic_state", "82599_nic_state"],
    "snat_sport_exhaustion_check": ["snat_sport_exhaustion_log_num"],
}

# ---------------------------------------------------------------------------
# 按 ad.json 实际字段名索引的类型化判定规则
# ---------------------------------------------------------------------------

CORRECTED_FIELD_RULES = {
    # === threshold (支持 warn_at 两级阈值：先检查 abnormal→fail，再检查 warn_at→warn) ===
    'power_state':       {'type': 'threshold', 'abnormal': 0,  'compare': '==', 'severity': 'fail',  'warn_at': -1, 'warn_compare': '==', 'name': '电源状态'},  # 0=故障(fail), -1=无传感器VM(warn), 1=正常
    'fan_state':         {'type': 'threshold', 'abnormal': 0,  'compare': '==', 'severity': 'fail',  'warn_at': -1, 'warn_compare': '==', 'name': '风扇状态'},  # 0=故障(fail), -1=无传感器VM(warn), 1=正常
    'acceleration':      {'type': 'threshold', 'abnormal': 0,  'compare': '==', 'severity': 'warn',  'name': '加速引擎'},
    'base_file_ds':      {'type': 'threshold', 'abnormal': 0,  'compare': '>',  'severity': 'fail',  'name': '文件描述符泄漏'},
    'base_log_error_exist':{'type': 'threshold','abnormal': 100,'compare': '>', 'severity': 'fail',  'warn_at': 0, 'warn_compare': '>', 'name': '错误日志数量'},  # >100=fail, >0=warn
    'conntrack_count':   {'type': 'threshold', 'abnormal': 100000, 'compare': '>', 'severity': 'warn', 'name': '连接跟踪数'},
    'conntrack_new_count':{'type':'threshold', 'abnormal': 10000,  'compare': '>', 'severity': 'warn', 'name': '新建连接数'},
    'snmp_mem_rate':     {'type': 'threshold', 'abnormal': 90,  'compare': '>', 'severity': 'fail',  'warn_at': 80, 'warn_compare': '>', 'name': '内存使用率'},  # >90=fail, >80=warn
    'base_cpu_usage':    {'type': 'threshold', 'abnormal': 90,  'compare': '>', 'severity': 'fail',  'warn_at': 80, 'warn_compare': '>', 'name': 'CPU使用率'},  # >90=fail, >80=warn
    # === bool_false ===
    'ADAPI_authority':   {'type': 'bool_false', 'severity': 'warn',  'name': 'ADAPI授权'},
    'ssh_authority':     {'type': 'bool_false', 'severity': 'warn',  'name': 'SSH授权'},
    'security_check_state':{'type':'bool_false', 'severity': 'fail',  'name': '安全检查状态'},
    'shm_sem_state':     {'type': 'bool_false', 'severity': 'fail',  'name': '共享内存状态'},
    'base_report_stab':  {'type': 'bool_false', 'severity': 'fail',  'name': '报表稳定性'},
    # === str_equal ===
    'enable_iplimit':    {'type': 'str_equal', 'abnormal': 'false', 'severity': 'warn',  'name': 'IP限制'},
    'remote_mt':         {'type': 'str_equal', 'abnormal': 'true',  'severity': 'fail',  'name': '远程维护'},
    'online':            {'type': 'str_equal', 'abnormal': 'false', 'severity': 'warn',  'name': '设备在线状态'},
    # === str_not_equal ===
    'auto_update':       {'type': 'str_not_equal', 'normal': 'true','severity':'warn',  'name': '自动更新'},
    # === non_empty ===
    'weak_pwd':          {'type': 'non_empty', 'severity': 'fail',  'name': '弱密码'},
    'dangerous_port':    {'type': 'non_empty', 'severity': 'fail',  'name': '危险端口'},
    'base_core_process_lack':{'type':'non_empty','severity':'fail', 'name': '缺失核心进程'},
    'base_eth_abnormal': {'type': 'non_empty', 'severity': 'fail',  'name': '网卡异常'},
    'base_eth_mtu':      {'type': 'non_empty', 'severity': 'warn',  'name': '网卡MTU'},
    'base_drop_err_packet_rate':{'type':'non_empty','severity':'fail','name': '丢包率'},
    'id_conflict_list':  {'type': 'non_empty', 'severity': 'fail',  'name': '配置ID冲突'},
    'cluster_brain_split_check':{'type':'non_empty','severity':'fail','name': '集群脑裂检查'},
    'base_disk_high_usage':{'type':'non_empty', 'severity':'fail',  'name': '磁盘高使用率'},
    'base_crash_time':   {'type': 'non_empty', 'severity': 'fail',  'name': '崩溃时间'},
    'base_blackbox_dmesg':{'type':'non_empty', 'severity':'warn',   'name': '黑盒dmesg数据'},
    # === bool_true ===
    'unsafe_algorithm':  {'type': 'bool_true',  'severity': 'fail',  'name': '不安全算法'},
    'unsafe_protocol':   {'type': 'bool_true',  'severity': 'fail',  'name': '不安全协议'},
    # === not_zero / zero / has_value / not_normal ===
    'base_kernel_log':   {'type': 'not_zero',   'severity': 'fail',  'name': '内核日志'},
    'base_blackbox_state':{'type':'not_zero',   'severity': 'warn',  'name': '黑盒状态'},
    'alarms_enabled':    {'type': 'zero',        'severity': 'warn',  'name': '告警启用'},
    'bios_update_state': {'type': 'has_value',   'severity': 'warn',  'name': 'BIOS更新状态'},
    'I350_nic_state':    {'type': 'not_normal',  'severity': 'fail',  'name': 'I350网卡状态'},
    '82599_nic_state':   {'type': 'not_normal',  'severity': 'fail',  'name': '82599网卡状态'},
    # === special ===
    'base_eth_info':     {'type': 'eth_parse',   'severity': 'fail',  'name': '网卡信息'},
    'snat_sport_exhaustion_log_num': {'type': 'threshold', 'abnormal': 0, 'compare': '>', 'severity': 'warn', 'name': 'SNAT端口耗尽'},
    'disk_info':         {'type': 'empty_dict',  'severity': 'warn',  'name': '磁盘信息'},
    'patch_info':        {'type': 'nested_list', 'key': 'patched_list', 'severity': 'warn', 'name': '补丁信息'},
    'admin':             {'type': 'str_not_equal','normal': 'true', 'severity': 'warn',  'name': '管理员账户'},
    'ad_appversion':     {'type': 'missing',      'severity': 'warn',  'name': 'AD版本'},
    'base_running_time': {'type': 'missing',      'severity': 'warn',  'name': '运行时间'},
}


def analyze_v1(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    根据 ad.json 内容进行结构化分析。
    严格按 ad.json 中实际存在的字段分析，不依赖场景定义。
    字段不存在则跳过该检查项，不记录。
    分类规则：根据字段名自动归入功能/健康/安全三类。
    """

    if not isinstance(data, dict):
        return {
            "device_info": {},
            "check_results": {},
            "categories": {"feature": [], "health": [], "secure": []},
            "summary": {"total": 0, "pass": 0, "fail": 0, "warn": 0, "score": 0},
            "health_scores": {"feature": {"pass": 0, "total": 0, "score": 0}, "health": {"pass": 0, "total": 0, "score": 0}, "secure": {"pass": 0, "total": 0, "score": 0}, "overall": 0},
            "suggestions": [],
        }
    check_results = {}
    data_keys = set(data.keys())  # ad.json 中实际存在的字段集合

    def has(*keys) -> bool:
        """检查 ad.json 中是否包含至少一个指定字段"""
        return any(k in data_keys for k in keys)

    def check(name: str, status: str, value: str = "", detail: str = ""):
        check_results[name] = {"status": status, "value": str(value), "detail": detail}

    # ─────────────────────────────────────────────────────────────────────
    # 逐字段分析（ad.json 有什么就分析什么，字段不存在则跳过）
    # ─────────────────────────────────────────────────────────────────────

    if has("ad_appversion"):
        # 1. APP_VERSION_CHECK
        app_ver = data.get("ad_appversion", "").strip()
        check("APP_VERSION_CHECK", "pass" if app_ver else "warn",
              app_ver[:60] if app_ver else "未获取到版本信息")

    if has("admin"):
        # 2. ADMIN_ROLE_CHECK
        admin = data.get("admin", "")
        check("ADMIN_ROLE_CHECK", "pass" if admin == "true" else "fail",
              f"admin={admin}", detail="管理员角色未正确配置" if admin != "true" else "")

    if has("security_check_state"):
        # 4. DEVICE_SAFE_CHECK
        sec_state = data.get("security_check_state", False)
        check("DEVICE_SAFE_CHECK",
              "pass" if sec_state else "fail",
              f"security_check_state={sec_state}")

    if has("dns_proxy_enabled"):
        # 5. DNS_DETECT_CHECK
        dns_proxy = data.get("dns_proxy_enabled", False)
        check("DNS_DETECT_CHECK",
              "pass" if not dns_proxy else "warn",
              f"dns_proxy_enabled={dns_proxy}")

    if has("dnat_dst_ip2net_if"):
        # 6. DNAT_CHECK
        dnat = data.get("dnat_dst_ip2net_if", [])
        check("DNAT_CHECK", "pass" if not dnat else "warn",
              f"{len(dnat)} 条 DNAT 规则" if dnat else "无 DNAT 规则")

    if has("heartbeat_state"):
        # 7. HEARTBEAT_CHECK
        hb = data.get("heartbeat_state", True)
        check("HEARTBEAT_CHECK",
              "pass" if hb else "fail",
              f"heartbeat_state={hb}")

    if has("static_ip_config"):
        # 8. STATIC_IP_CHECK
        static_ip = data.get("static_ip_config", [])
        check("STATIC_IP_CHECK", "pass" if not static_ip else "warn",
              f"{len(static_ip)} 条静态 IP" if static_ip else "无静态 IP 配置")

    if has("cluster_state"):
        # 9. CLUSTER_STATE_CHECK
        cluster = data.get("cluster_state", "NOT_CLUSTER_MODE")
        check("CLUSTER_STATE_CHECK",
              "pass" if cluster == "NORMAL" else "warn",
              cluster)

    if has("cluster_virtual_mac"):
        # 11. VIRTUAL_MAC_CHECK
        vmac = data.get("cluster_virtual_mac", "CLUSTER_UNABLE")
        check("VIRTUAL_MAC_CHECK",
              "pass" if vmac != "CLUSTER_UNABLE" else "warn",
              vmac)

    if has("ms_state"):
        # 12. DUAL_STATE_CHECK
        ms = data.get("ms_state", "CLUSTER_UNABLE_OR_NOTIN")
        check("DUAL_STATE_CHECK",
              "pass" if ms == "NORMAL" else "warn",
              ms)

    if has("node_pool_persist"):
        # 13. POOL_PERSIST_CHECK
        pool_persist = data.get("node_pool_persist", [])
        check("POOL_PERSIST_CHECK", "pass" if pool_persist else "warn",
              f"{len(pool_persist)} 个节点池" if pool_persist else "无持久化节点池")

    if has("static_route_health_check"):
        # 14. STATIC_ROUTE_CHECK
        sr = data.get("static_route_health_check", [])
        check("STATIC_ROUTE_CHECK", "pass" if not sr else "warn",
              f"{len(sr)} 条异常" if sr else "正常")

    if has("node_pool_health_check_detect"):
        # 15. POOL_HEALTH_CHECK
        ph = data.get("node_pool_health_check_detect", [])
        check("POOL_HEALTH_CHECK",
              "pass" if not ph or ph == ["12"] else "warn",
              f"检测到 {len(ph)} 个节点池" if ph else "正常")

    if has("rs_level_check"):
        # 16. RS_LEVEL_CHECK
        rs_level = data.get("rs_level_check", True)
        check("RS_LEVEL_CHECK",
              "pass" if rs_level else "warn",
              f"rs_level_check={rs_level}")

    if has("cluster_appgroup_unit"):
        # 17. APP_GROUP_CHECK
        ag = data.get("cluster_appgroup_unit", "CLUSTER_UNABLE")
        check("APP_GROUP_CHECK",
              "pass" if ag != "CLUSTER_UNABLE" else "warn",
              ag)

    if has("dns_server_health"):
        # 18. DNS_SERVER_STATE_CHECK
        dns_h = data.get("dns_server_health", [])
        check("DNS_SERVER_STATE_CHECK", "pass" if not dns_h else "warn",
              f"{len(dns_h)} 台异常" if dns_h else "正常")

    if has("link_health_check"):
        # 19. LINK_HEALTH_CHECK
        lh = data.get("link_health_check", [])
        check("LINK_HEALTH_CHECK", "pass" if not lh else "warn",
              f"{len(lh)} 条异常" if lh else "正常")

    if has("static_proximity_check"):
        # 20. STATIC_PROXIMITY_CHECK
        sp = data.get("static_proximity_check", True)
        check("STATIC_PROXIMITY_CHECK",
              "pass" if sp else "warn",
              f"static_proximity_check={sp}")

    if has("dns64_enabled"):
        # 21. DNS64_CHECK
        dns64 = data.get("dns64_enabled", False)
        check("DNS64_CHECK", "pass" if not dns64 else "warn",
              f"dns64_enabled={dns64}")

    if has("newly_added_policy_route"):
        # 22. POLICY_ROUTE_CHECK
        npr = data.get("newly_added_policy_route", False)
        check("POLICY_ROUTE_CHECK",
              "pass" if not npr else "warn",
              f"newly_added_policy_route={npr}")

    if has("ms_manage_ip_difference"):
        # 23. MANAGE_IP_CHECK
        mip = data.get("ms_manage_ip_difference", "CLUSTER_UNABLE")
        check("MANAGE_IP_CHECK",
              "pass" if mip == "CLUSTER_UNABLE" else "fail",
              mip)

    if has("snmp_alarm_enabled"):
        # 24. SNMP_TRAPS_CHECK
        snmp = data.get("snmp_alarm_enabled", False)
        check("SNMP_TRAPS_CHECK", "pass" if snmp else "warn",
              f"snmp_alarm_enabled={snmp}")

    if has("dns_pre_rule_exist"):
        # 25. DNS_REFLECT_CHECK
        dr = data.get("dns_pre_rule_exist", False)
        check("DNS_REFLECT_CHECK", "pass" if not dr else "warn",
              f"dns_pre_rule_exist={dr}")

    if has("dns_server_enabled"):
        # 26. DNS_SERVER_CHECK
        ds = data.get("dns_server_enabled", "")
        check("DNS_SERVER_CHECK",
              "pass" if ds in ("true", "") else "warn",
              f"dns_server_enabled={ds}")

    if has("dnat_port_and_proto"):
        # 27. DNAT_PORT_CHECK
        dpp = data.get("dnat_port_and_proto", [])
        check("DNAT_PORT_CHECK", "pass" if not dpp else "warn",
              f"{len(dpp)} 条" if dpp else "无端口映射")

    if has("cluster_session_sync"):
        # 28. SESSION_SYNC_CHECK
        ss = data.get("cluster_session_sync", "CLUSTER_UNABLE")
        check("SESSION_SYNC_CHECK",
              "pass" if ss in ("NORMAL", "CLUSTER_UNABLE") else "warn",
              ss)

    if has("email_alarm_enabled"):
        # 29. MAIL_WARN_CHECK
        mw = data.get("email_alarm_enabled", False)
        check("MAIL_WARN_CHECK", "pass" if mw else "warn",
              f"email_alarm_enabled={mw}")

    if has("virtual_ip_pool_check"):
        # 30. VIP_POOL_CHECK
        vip = data.get("virtual_ip_pool_check", {})
        vip_fail = []
        for region in ("local", "global"):
            region_data = vip.get(region, {})
            vip_fail.extend(region_data.get("failure", []))
            vip_fail.extend(region_data.get("disable", []))
        check("VIP_POOL_CHECK", "pass" if not vip_fail else "fail",
              f"{len(vip_fail)} 个异常" if vip_fail else "正常")

    if has("proxy_policy_check"):
        # 31. PROXY_POLICY_CHECK
        pp = data.get("proxy_policy_check", True)
        check("PROXY_POLICY_CHECK",
              "pass" if pp else "warn",
              f"proxy_policy_check={pp}")

    if has("dns_map_persist_enable"):
        # 32. DNS_MAP_PS_CHECK
        dm = data.get("dns_map_persist_enable", {})
        dm_empty = all(not v for v in dm.values())
        check("DNS_MAP_PS_CHECK", "pass" if dm_empty else "warn",
              str(dm)[:60] if dm else "未启用")

    if has("wan_max_bandwidth"):
        # 33. WAN_BANDWIDTH_CHECK
        wb = data.get("wan_max_bandwidth", [])
        check("WAN_BANDWIDTH_CHECK", "pass" if not wb else "warn",
              f"{len(wb)} 条带宽配置" if wb else "无配置")

    if has("cluster_fault_switch_enabled"):
        # 34. FAULT_SWITCH_CHECK
        fs = data.get("cluster_fault_switch_enabled", "CLUSTER_UNABLE")
        check("FAULT_SWITCH_CHECK",
              "pass" if fs == "CLUSTER_UNABLE" else "warn",
              fs)

    if has("syslog_enabled"):
        # 35. SYSLOG_CHECK
        syl = data.get("syslog_enabled", False)
        check("SYSLOG_CHECK", "pass" if syl else "warn",
              f"syslog_enabled={syl}")

    # ─────────────────────────────────────────────────────────────────────
    # 健康巡检（25 项）
    # ─────────────────────────────────────────────────────────────────────

    if has("auto_update"):
        # 36. AUTO_UPDATE_CHECK
        au = data.get("auto_update", "")
        check("AUTO_UPDATE_CHECK", "pass" if au == "true" else "warn",
              f"auto_update={au}")

    if has("base_cpu_usage", "base_cpu_mpstat"):
        # 37. CPU_CHECK
        cpu = data.get("base_cpu_usage", [])
        cpu_max = max(cpu) if cpu else 0
        check("CPU_CHECK",
              "pass" if cpu_max <= 80 else ("warn" if cpu_max <= 90 else "fail"),
              f"max={cpu_max}%")

    if has("base_log_error_exist"):
        # 38. LOG_CHECK
        le = data.get("base_log_error_exist", -1)
        check("LOG_CHECK",
              "pass" if le == 0 else ("warn" if le <= 100 else "fail"),
              f"{le} 条错误日志")

    if has("base_running_time"):
        # 39. DEVICE_RUN_TIME
        rt = data.get("base_running_time", "")
        check("DEVICE_RUN_TIME", "pass" if rt else "warn", rt or "未知")

    if has("base_file_ds"):
        # 40. DEVICE_FILE_CHECK
        fd = data.get("base_file_ds", -1)
        check("DEVICE_FILE_CHECK", "pass" if fd == 0 else "fail", str(fd))

    if has("base_eth_abnormal"):
        # 41. NIC_STATE_CHECK
        eth_ab = data.get("base_eth_abnormal", [])
        check("NIC_STATE_CHECK", "pass" if not eth_ab else "fail",
              f"{len(eth_ab)} 网口异常" if eth_ab else "正常")

    if has("base_core_process_lack"):
        # 42. CORE_PROCESS_CHECK
        cpl = data.get("base_core_process_lack", [])
        check("CORE_PROCESS_CHECK", "pass" if not cpl else "fail",
              f"{len(cpl)} 个缺失" if cpl else "正常")

    if has("base_kernel_log"):
        # 43. KERNEL_LOG_CHECK
        kl = data.get("base_kernel_log", -1)
        check("KERNEL_LOG_CHECK",
              "pass" if kl == 0 else ("warn" if kl < 5 else "fail"),
              f"{kl} 条")

    if has("remote_mt"):
        # 44. REMOTE_MAINTAIN_CHECK
        rm = data.get("remote_mt", "")
        check("REMOTE_MAINTAIN_CHECK",
              "warn" if rm == "true" else "pass",
              f"remote_mt={rm}")

    if has("base_blackbox_state"):
        # 45. BLACK_BOX_CHECK
        bb = data.get("base_blackbox_state", -1)
        check("BLACK_BOX_CHECK", "pass" if bb == 0 else "warn", str(bb))

    if has("base_blackbox_dmesg"):
        # 46. DMESG_DATA_CHECK
        dmesg = data.get("base_blackbox_dmesg", {})
        check("DMESG_DATA_CHECK", "pass" if not dmesg else "warn",
              f"{len(dmesg)} 条" if dmesg else "无")

    if has("disk_info"):
        # 47. DISK_CHECK
        disk = data.get("disk_info", {})
        check("DISK_CHECK",
              "pass" if disk else "warn",
              "正常" if disk else "无磁盘信息")

    if has("base_crash_time"):
        # 48. CRASH_LOG_CHECK
        crash = data.get("base_crash_time", [])
        check("CRASH_LOG_CHECK", "pass" if not crash else "fail",
              f"{len(crash)} 条" if crash else "无")

    if has("snmp_mem_rate"):
        # 49. MEMORY_CHECK
        mr = data.get("snmp_mem_rate", 0)
        check("MEMORY_CHECK",
              "pass" if mr <= 80 else ("warn" if mr <= 90 else "fail"),
              f"使用率={mr}%")

    if has("acceleration"):
        # 50. SPEED_CARD_CHECK
        accel = data.get("acceleration", -1)
        check("SPEED_CARD_CHECK",
              "pass" if accel in (1, 2) else "warn",
              f"acceleration={accel}")

    if has("fan_state"):
        # 51. FAN_STATE_CHECK
        fan = data.get("fan_state", -1)
        check("FAN_STATE_CHECK",
              "pass" if fan == 1 else ("warn" if fan == -1 else "fail"),
              str(fan))

    if has("power_state"):
        # 52. POWER_STATE_CHECK
        ps = data.get("power_state", -1)
        check("POWER_STATE_CHECK",
              "pass" if ps == 1 else ("warn" if ps == -1 else "fail"),
              str(ps))

    if has("bios_update_state"):
        # 53. BIOS_VERSION_CHECK
        bios = data.get("bios_update_state", "")
        check("BIOS_VERSION_CHECK",
              "pass" if bios in ("", "normal") else "warn",
              bios or "未更新")

    if has("alarms_enabled"):
        # 54. WARN_LOG_CHECK
        al = data.get("alarms_enabled", -1)
        check("WARN_LOG_CHECK",
              "pass" if al >= 0 else "warn",
              str(al))

    if has("shm_sem_state"):
        # 55. MEMORY_LEAK_CHECK
        leak = data.get("shm_sem_state", False)
        check("MEMORY_LEAK_CHECK",
              "pass" if leak else "fail",
              f"shm_sem_state={leak}", detail="共享内存/信号量异常" if not leak else "")

    if has("base_eth_info"):
        # 56. DEVICE_CONNECTION_CHECK
        eth_info = data.get("base_eth_info", "")
        link_detected = "Link detected: yes" in eth_info if eth_info else False
        check("DEVICE_CONNECTION_CHECK",
              "pass" if link_detected else "fail",
              "eth0 已连通" if link_detected else "eth0 未连通")

    if has("base_no_core"):
        # 57. COREDUMP_INFO_CHECK
        nc = data.get("base_no_core", -1)
        check("COREDUMP_INFO_CHECK",
              "pass" if nc == -1 else "warn",
              "正常" if nc == -1 else f"base_no_core={nc}")

    if has("id_conflict_list"):
        # 58. CONFIG_ID_CONFLICT_CHECK
        idc = data.get("id_conflict_list", [])
        check("CONFIG_ID_CONFLICT_CHECK", "pass" if not idc else "fail",
              f"{len(idc)} 个冲突" if idc else "无冲突")

    if has("I350_nic_state", "82599_nic_state"):
        # 59. NIC_HEALTH_CHECK
        i350 = data.get("I350_nic_state", "")
        nic99 = data.get("82599_nic_state", "")
        check("NIC_HEALTH_CHECK",
              "pass" if i350 == "normal" and nic99 == "normal" else "warn",
              f"I350={i350} 82599={nic99}")

    if has("snat_sport_exhaustion_log_num"):
        # 60. SNAT_SPORT_EXHAUSTION_CHECK
        snat = data.get("snat_sport_exhaustion_log_num", -1)
        check("SNAT_SPORT_EXHAUSTION_CHECK",
              "pass" if snat == 0 else "warn",
              str(snat))

    # ─────────────────────────────────────────────────────────────────────
    # 安全巡检（7 项）
    # ─────────────────────────────────────────────────────────────────────

    if has("ssh_authority"):
        # 61. SSH_API_CHECK
        ssh = data.get("ssh_authority", False)
        check("SSH_API_CHECK", "pass" if ssh else "fail",
              f"ssh_authority={ssh}")

    if has("patch_info"):
        # 62. PATCH_INFO_CHECK
        patches = data.get("patch_info", {}).get("patched_list", [])
        check("PATCH_INFO_CHECK",
              "pass" if patches else "warn",
              f"{len(patches)} 个补丁" if patches else "无补丁")

    if has("base_report_stab"):
        # 63. REPORT_CHECK
        br = data.get("base_report_stab", False)
        check("REPORT_CHECK", "pass" if br else "fail",
              f"base_report_stab={br}")

    if has("weak_pwd"):
        # 64. WEAK_PASSWORD_CHECK
        wp = data.get("weak_pwd", [])
        check("WEAK_PASSWORD_CHECK", "pass" if not wp else "fail",
              f"{len(wp)} 个弱密码" if wp else "无")

    if has("unsafe_algorithm", "unsafe_protocol"):
        # 65. SSL_POLICY_CHECK
        ua = data.get("unsafe_algorithm", False)
        up = data.get("unsafe_protocol", False)
        check("SSL_POLICY_CHECK",
              "pass" if not ua and not up else "fail",
              f"algorithm={ua} protocol={up}")

    if has("enable_iplimit"):
        # 66. IP_LIMIT_CHECK
        ipl = data.get("enable_iplimit", "")
        check("IP_LIMIT_CHECK",
              "pass" if ipl == "true" else "fail",
              f"enable_iplimit={ipl}")

    if has("dangerous_port"):
        # 67. OPEN_PORT_CHECK
        dp = data.get("dangerous_port", [])
        check("OPEN_PORT_CHECK",
              "pass" if not dp else "warn",
              f"{len(dp)} 个风险端口: {', '.join(str(p) for p in dp[:3])}" if dp else "无")

    # ─────────────────────────────────────────────────────────────────────
    # 汇总（仅统计当前场景的检查项）
    # ─────────────────────────────────────────────────────────────────────

    pass_count = sum(1 for k, v in check_results.items() if v["status"] == "pass")
    fail_count = sum(1 for k, v in check_results.items() if v["status"] == "fail")
    warn_count = sum(1 for k, v in check_results.items() if v["status"] == "warn")
    total = len(check_results)
    score = round((pass_count + warn_count * 0.5) / total * 100) if total else 0

    # ── 自动分类：根据检查项名称归入功能/健康/安全 ─────────────────────
    FEATURE_PREFIXES = (
        "APP_", "ADMIN_", "HEARTBEAT_", "DEVICE_SAFE_", "DNS_DETECT_",
        "DNAT_", "HEARTBEAT_", "STATIC_IP_", "CLUSTER_", "DNS_PROXY_",
        "VIRTUAL_MAC_", "DUAL_STATE_", "POOL_", "STATIC_ROUTE_",
        "RS_LEVEL_", "APP_GROUP_", "DNS_SERVER_STATE_", "LINK_HEALTH_",
        "STATIC_PROXIMITY_", "DNS64_", "POLICY_ROUTE_", "MANAGE_IP_",
        "SNMP_TRAPS_", "DNS_REFLECT_", "DNS_SERVER_", "SESSION_SYNC_",
        "MAIL_WARN_", "VIP_POOL_", "PROXY_POLICY_", "DNS_MAP_",
        "WAN_BANDWIDTH_", "FAULT_SWITCH_", "SYSLOG_",
    )
    HEALTH_PREFIXES = (
        "AUTO_UPDATE_", "CPU_", "LOG_", "DEVICE_RUN_", "DEVICE_FILE_",
        "NIC_STATE_", "CORE_PROCESS_", "KERNEL_LOG_", "REMOTE_MAINTAIN_",
        "BLACK_BOX_", "DMESG_", "DISK_", "CRASH_LOG_", "MEMORY_",
        "SPEED_CARD_", "FAN_", "POWER_", "BIOS_", "WARN_LOG_",
        "DEVICE_CONNECTION_", "COREDUMP_", "CONFIG_ID_", "NIC_HEALTH_",
        "SNAT_SPORT_",
    )
    SECURE_PREFIXES = (
        "SSH_", "PATCH_", "REPORT_", "WEAK_PASSWORD_", "SSL_",
        "IP_LIMIT_", "OPEN_PORT_",
    )

    feature_keys = [k for k in check_results if any(k.startswith(p) for p in FEATURE_PREFIXES)]
    health_keys = [k for k in check_results if any(k.startswith(p) for p in HEALTH_PREFIXES)]
    secure_keys = [k for k in check_results if any(k.startswith(p) for p in SECURE_PREFIXES)]
    # 未匹配的归入功能巡检
    categorized = set(feature_keys + health_keys + secure_keys)
    uncategorized = [k for k in check_results if k not in categorized]
    if uncategorized:
        feature_keys.extend(uncategorized)

    # ── 计算各维度健康评分 ─────────────────────────────────────────────
    def _dimension_scores(keys):
        p = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "pass")
        t = len(keys)
        s = round(p / max(t, 1) * 100)
        return {"pass": p, "total": t, "score": s}

    f_score = _dimension_scores(feature_keys)
    h_score = _dimension_scores(health_keys)
    s_score = _dimension_scores(secure_keys)
    overall = round((f_score["score"] + h_score["score"] + s_score["score"]) / 3)

    # ── 生成优化建议 ───────────────────────────────────────────────────
    suggestions = []
    for key, result in check_results.items():
        if result["status"] in ("fail", "warn"):
            entry = {
                "check": key,
                "priority": "高" if result["status"] == "fail" else "中",
                "suggestion": _SUGGESTION_MAP.get(key, f"检查项 {key} 状态为 {result['status']}，建议进一步排查"),
            }
            suggestions.append(entry)

    return {
        "device_info": {
            "version": data.get("version", ""),
            "app_version": data.get("ad_appversion", "").strip(),
            "gateway_id": data.get("gateway_id", ""),
            "runtime": data.get("base_running_time", ""),
            "ip": data.get("dst_ip", ""),
        },
        "check_results": check_results,
        "categories": {
            "feature": feature_keys,
            "health": health_keys,
            "secure": secure_keys,
        },
        "summary": {
            "total": total,
            "pass": pass_count,
            "fail": fail_count,
            "warn": warn_count,
            "score": score,
        },
        "health_scores": {
            "feature": f_score,
            "health": h_score,
            "secure": s_score,
            "overall": overall,
        },
        "suggestions": suggestions,
    }


# ---------------------------------------------------------------------------
# v2 规则驱动分析引擎
# ---------------------------------------------------------------------------

def _check_field_rule(value, rule):
    """Type-based field rule evaluation. Returns (is_abnormal: bool, severity: str, issue: str)."""
    if value is None:
        return False, "warn", "数据不可用"
    rule_type = rule['type']
    name = rule['name']
    severity = rule.get('severity', 'fail')

    if rule_type == 'threshold':
        # Handle list values (e.g., base_cpu_usage is a list of samples)
        if isinstance(value, list):
            if not value:
                return False, "warn", f"{name}数据为空"
            try:
                v = float(max(value))
            except (ValueError, TypeError):
                return False, "warn", f"{name}值无法解析: {value}"
        else:
            try:
                v = float(value)
            except (ValueError, TypeError):
                return False, "warn", f"{name}值无法解析: {value}"
        abnormal = rule['abnormal']
        compare = rule.get('compare', '==')
        if compare == '>': is_ab = v > abnormal
        elif compare == '<': is_ab = v < abnormal
        else: is_ab = v == abnormal
        if is_ab:
            issue = f"{name}异常: {value}"
            return True, severity, issue
        # Check warn_at tier (optional second level)
        warn_at = rule.get('warn_at')
        if warn_at is not None:
            warn_compare = rule.get('warn_compare', '==')
            if warn_compare == '>': is_warn = v > warn_at
            elif warn_compare == '<': is_warn = v < warn_at
            else: is_warn = v == warn_at
            if is_warn:
                return True, "warn", f"{name}警告: {value}"
        issue = ""
    elif rule_type == 'bool_false':
        is_ab = (value is False or str(value).lower() in ("false", "0", "no", ""))
        issue = f"{name}关闭" if is_ab else ""
    elif rule_type == 'bool_true':
        is_ab = (value is True or str(value).lower() == "true")
        issue = f"存在{name}" if is_ab else ""
    elif rule_type == 'str_equal':
        is_ab = (str(value) == str(rule['abnormal']))
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'str_not_equal':
        is_ab = (str(value) != str(rule['normal']))
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'non_empty':
        is_ab = bool(value)
        issue = f"存在异常: {str(value)[:100]}" if is_ab else ""
    elif rule_type == 'not_normal':
        is_ab = (value != 'normal')
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'not_zero':
        try: is_ab = (int(value) != 0)
        except (ValueError, TypeError): is_ab = False
        issue = f"{name}异常: {value}" if is_ab else ""
    elif rule_type == 'zero':
        try: is_ab = (int(value) == 0)
        except (ValueError, TypeError): is_ab = False
        issue = f"{name}关闭" if is_ab else ""
    elif rule_type == 'has_value':
        is_ab = bool(value)
        issue = f"{name}: {value}" if is_ab else ""
    elif rule_type == 'missing':
        is_ab = not bool(value)
        issue = f"{name}数据缺失" if is_ab else ""
    elif rule_type == 'empty_dict':
        is_ab = isinstance(value, dict) and len(value) == 0
        issue = f"{name}无数据" if is_ab else ""
    elif rule_type == 'nested_list':
        key = rule.get('key')
        if key and isinstance(value, dict):
            inner = value.get(key, [])
        else:
            inner = value if isinstance(value, list) else []
        is_ab = not bool(inner)
        issue = f"{name}为空" if is_ab else ""
    elif rule_type == 'eth_parse':
        value_str = str(value)
        if 'Link detected: no' in value_str:
            is_ab, issue = True, '存在网卡链路断开'
        elif 'Speed: 10Mb/s' in value_str:
            is_ab, issue = True, '存在网卡速率过低(10Mb/s)'
        else:
            is_ab, issue = False, ''
    else:
        return False, "warn", f"未知规则类型: {rule_type}"

    return is_ab, severity if is_ab else "pass", issue


def _check_vip_pool(data):
    """Special handler for VIP Pool check — nested dict traversal."""
    vip = data.get("virtual_ip_pool_check", {})
    failures = []
    for region in ("local", "global"):
        region_data = vip.get(region, {})
        failures.extend(region_data.get("failure", []))
        failures.extend(region_data.get("disable", []))
    if not failures:
        return "pass", "正常", ""
    return "fail", f"{len(failures)} 个异常", f"VIP Pool 存在 {len(failures)} 个异常"


def _print_compare_diff(v1_result: dict, v2_result: dict):
    """Print v1 vs v2 difference summary to stderr.

    Note: v1 and v2 use different key systems (v1: old names like CPU_CHECK,
    v2: rule_ids like base_cpu_info), so direct key comparison is not possible.
    This compares aggregate counts instead.
    """
    v1_s = v1_result.get("summary", {})
    v2_s = v2_result.get("summary", {})
    print(f"[AD_CHECK_ENGINE=compare] v1: total={v1_s.get('total','?')} pass={v1_s.get('pass','?')} fail={v1_s.get('fail','?')} warn={v1_s.get('warn','?')} score={v1_s.get('score','?')}", file=sys.stderr)
    print(f"[AD_CHECK_ENGINE=compare] v2: total={v2_s.get('total','?')} pass={v2_s.get('pass','?')} fail={v2_s.get('fail','?')} warn={v2_s.get('warn','?')} score={v2_s.get('score','?')}", file=sys.stderr)
    # Compare per-category scores
    v1_hs = v1_result.get("health_scores", {})
    v2_hs = v2_result.get("health_scores", {})
    for cat in ("feature", "health", "secure"):
        s1 = v1_hs.get(cat, {}).get("score", "?")
        s2 = v2_hs.get(cat, {}).get("score", "?")
        if s1 != s2:
            print(f"[AD_CHECK_ENGINE=compare] {cat}: v1={s1} v2={s2}", file=sys.stderr)
    # Also compare v1 and v2 check_result keys where they intersect
    v1_results = v1_result.get("check_results", {})
    v2_results = v2_result.get("check_results", {})
    v1_only = set(v1_results.keys()) - set(v2_results.keys())
    v2_only = set(v2_results.keys()) - set(v1_results.keys())
    common = set(v1_results.keys()) & set(v2_results.keys())
    if v1_only:
        print(f"[AD_CHECK_ENGINE=compare] v1-only keys ({len(v1_only)}): {sorted(v1_only)[:10]}...", file=sys.stderr)
    if v2_only:
        print(f"[AD_CHECK_ENGINE=compare] v2-only keys ({len(v2_only)}): {sorted(v2_only)[:10]}...", file=sys.stderr)
    diffs = []
    for k in sorted(common):
        s1 = v1_results.get(k, {}).get("status", "?")
        s2 = v2_results.get(k, {}).get("status", "?")
        if s1 != s2:
            diffs.append(f"  {k}: v1={s1} v2={s2}")
    if diffs:
        print(f"[AD_CHECK_ENGINE=compare] Common key diffs ({len(diffs)}):", file=sys.stderr)
        for d in diffs[:20]:
            print(d, file=sys.stderr)
    elif v1_only or v2_only:
        print("[AD_CHECK_ENGINE=compare] Key systems differ (v1 old names vs v2 rule_ids) — compare summary scores above.", file=sys.stderr)


def _analyze_v2(data: dict, check_info: dict | None = None) -> dict:
    """Core v2 analysis: rules-driven with check_info defining scope."""

    # Empty result template
    _empty = {
        "device_info": {},
        "check_results": {},
        "categories": {"feature": [], "health": [], "secure": []},
        "summary": {"total": 0, "pass": 0, "fail": 0, "warn": 0, "score": 0},
        "health_scores": {"feature": {"pass": 0, "total": 0, "score": 0}, "health": {"pass": 0, "total": 0, "score": 0}, "secure": {"pass": 0, "total": 0, "score": 0}, "overall": 0},
        "suggestions": [],
    }

    if not isinstance(data, dict):
        return _empty

    # ── Entry guard: extract rules from check_info ─────────────────────
    rules = None
    if check_info and isinstance(check_info, dict):
        rules = check_info.get("rules")
        if not rules:  # None or empty list
            rules = None

    check_results = {}

    if rules:
        # ── Main path: rules-driven ───────────────────────────────────
        covered_rule_ids = set()

        for rule_entry in rules:
            rule_id = rule_entry.get("id") or rule_entry.get("rule_id") or rule_entry.get("name", "")
            if not rule_id:
                continue
            covered_rule_ids.add(rule_id)

            # Special handler: VIP_POOL_CHECK
            if rule_id == "virtual_ip_pool_check":
                status, value, detail = _check_vip_pool(data)
                name = CHECK_NAMES.get(rule_id, rule_id)
                check_results[rule_id] = {"status": status, "name": name, "value": value, "detail": detail}
                continue

            # Get ad.json fields for this rule_id
            fields = RULE_FIELD_MAP.get(rule_id, [])
            if not fields:
                # rule_id not in RULE_FIELD_MAP → skip with diagnostic
                print(f"[analyze] 未映射的 rule_id: {rule_id}", file=sys.stderr)
                continue

            # Evaluate each field against CORRECTED_FIELD_RULES
            field_statuses = []
            for field_name in fields:
                if field_name not in data:
                    continue
                value = data[field_name]
                field_rule = CORRECTED_FIELD_RULES.get(field_name)
                if not field_rule:
                    print(f"[analyze] 字段 {field_name} 无对应规则", file=sys.stderr)
                    continue
                is_ab, severity, issue = _check_field_rule(value, field_rule)
                field_statuses.append((is_ab, severity, issue, value))

            if not field_statuses:
                # No fields found in ad.json — rule executed but no data
                name = CHECK_NAMES.get(rule_id, rule_id)
                check_results[rule_id] = {"status": "pass", "name": name, "value": "（无可读取字段）", "detail": ""}
                print(f"[analyze] rule_id={rule_id} 在 ad.json 中无对应字段", file=sys.stderr)
                continue

            # Aggregate: worst status wins (fail > warn > pass)
            worst = "pass"
            worst_value = ""
            worst_detail = ""
            for is_ab, sev, issue, val in field_statuses:
                if is_ab and sev == "fail":
                    worst = "fail"
                    worst_value = str(val)[:100]
                    worst_detail = issue
                    break
                elif is_ab and sev == "warn" and worst != "fail":
                    worst = "warn"
                    worst_value = str(val)[:100]
                    worst_detail = issue

            if worst == "pass":
                worst_value = str(field_statuses[0][3])[:100] if field_statuses else ""

            name = CHECK_NAMES.get(rule_id, rule_id)
            check_results[rule_id] = {"status": worst, "name": name, "value": worst_value, "detail": worst_detail}

        # Print uncovered rule_ids diagnostic
        all_known = set(RULE_FIELD_MAP.keys())
        uncovered = all_known - covered_rule_ids
        if uncovered:
            print(f"[analyze] 未覆盖的 rule_id ({len(uncovered)}): {sorted(uncovered)}", file=sys.stderr)
    else:
        # ── Fallback path: iterate by rule_id for correct categorization ──
        # Build reverse mapping: field_name → rule_id
        _field_to_rule = {}
        for _rid, _fields in RULE_FIELD_MAP.items():
            for _f in _fields:
                _field_to_rule[_f] = _rid

        for rule_id, fields in RULE_FIELD_MAP.items():
            # Check if any mapped field exists in ad.json
            field_statuses = []
            for field_name in fields:
                if field_name not in data:
                    continue
                value = data[field_name]
                field_rule = CORRECTED_FIELD_RULES.get(field_name)
                if not field_rule:
                    continue
                is_ab, severity, issue = _check_field_rule(value, field_rule)
                field_statuses.append((is_ab, severity, issue, value))

            if not field_statuses:
                continue

            # Aggregate: worst status wins
            worst = "pass"
            worst_value = ""
            worst_detail = ""
            for is_ab, sev, issue, val in field_statuses:
                if is_ab and sev == "fail":
                    worst = "fail"; worst_value = str(val)[:100]; worst_detail = issue
                    break
                elif is_ab and sev == "warn" and worst != "fail":
                    worst = "warn"; worst_value = str(val)[:100]; worst_detail = issue

            if worst == "pass":
                worst_value = str(field_statuses[0][3])[:100]

            name = CHECK_NAMES.get(rule_id, rule_id)
            check_results[rule_id] = {"status": worst, "name": name, "value": worst_value, "detail": worst_detail}

        # Also check orphan fields (in CORRECTED_FIELD_RULES but not in RULE_FIELD_MAP)
        for field_name, field_rule in CORRECTED_FIELD_RULES.items():
            if field_name in _field_to_rule:
                continue  # already handled above
            if field_name not in data:
                continue
            value = data[field_name]
            is_ab, severity, issue = _check_field_rule(value, field_rule)
            status = severity if is_ab else "pass"
            name = field_rule.get('name', field_name)
            check_results[field_name] = {"status": status, "name": name, "value": str(value)[:100], "detail": issue}

    # ── Categorize ────────────────────────────────────────────────────
    feature_keys, health_keys, secure_keys = [], [], []
    for rule_id in check_results:
        cat = CHECK_CATEGORY_MAP.get(rule_id, "feature")
        if cat == "feature":
            feature_keys.append(rule_id)
        elif cat == "health":
            health_keys.append(rule_id)
        else:
            secure_keys.append(rule_id)

    # ── Summary ───────────────────────────────────────────────────────
    pass_count = sum(1 for v in check_results.values() if v["status"] == "pass")
    fail_count = sum(1 for v in check_results.values() if v["status"] == "fail")
    warn_count = sum(1 for v in check_results.values() if v["status"] == "warn")
    total = len(check_results)
    score = round((pass_count + warn_count * 0.5) / total * 100) if total else 0

    def _dimension_scores(keys):
        p = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "pass")
        t = len(keys)
        s = round(p / max(t, 1) * 100)
        return {"pass": p, "total": t, "score": s}

    f_score = _dimension_scores(feature_keys)
    h_score = _dimension_scores(health_keys)
    s_score = _dimension_scores(secure_keys)
    overall = round((f_score["score"] + h_score["score"] + s_score["score"]) / 3)

    # ── Suggestions ───────────────────────────────────────────────────
    suggestions = []
    for key, result in check_results.items():
        if result["status"] in ("fail", "warn"):
            entry = {
                "check": key,
                "priority": "高" if result["status"] == "fail" else "中",
                "suggestion": _SUGGESTION_MAP.get(key, f"检查项 {result.get('name', key)} 状态为 {result['status']}，建议进一步排查"),
            }
            suggestions.append(entry)

    # ── Device info ───────────────────────────────────────────────────
    device_info = {
        "version": data.get("version", ""),
        "app_version": str(data.get("ad_appversion", "")).strip(),
        "gateway_id": data.get("gateway_id", ""),
        "runtime": str(data.get("base_running_time", "")),
        "ip": data.get("dst_ip", ""),
    }

    return {
        "device_info": device_info,
        "check_results": check_results,
        "categories": {"feature": feature_keys, "health": health_keys, "secure": secure_keys},
        "summary": {"total": total, "pass": pass_count, "fail": fail_count, "warn": warn_count, "score": score},
        "health_scores": {"feature": f_score, "health": h_score, "secure": s_score, "overall": overall},
        "suggestions": suggestions,
    }


def analyze(data: Dict[str, Any], check_info: dict | None = None) -> Dict[str, Any]:
    """New v2 rule-driven analysis engine.

    Args:
        data: ad.json content
        check_info: acheck_offline_check_info.json content (None → fallback mode)

    Engine selection via AD_CHECK_ENGINE env var:
        v1 → use analyze_v1(), v2 or unset → use this, compare → run both + diff
    """
    engine = os.environ.get("AD_CHECK_ENGINE", "v2")
    if engine == "v1":
        return analyze_v1(data)
    if engine == "compare":
        v1_result = analyze_v1(data)
        v2_result = _analyze_v2(data, check_info)
        _print_compare_diff(v1_result, v2_result)
        return v2_result
    return _analyze_v2(data, check_info)


# ---------------------------------------------------------------------------
# Markdown 报告渲染
# ---------------------------------------------------------------------------

def render_markdown(
    analysis: Dict[str, Any],
    meta: Dict[str, Any],
) -> str:
    dev = analysis["device_info"]
    results = analysis["check_results"]
    summary = analysis["summary"]

    # ── 三类巡检的检查项（从 analyze 结果中自动分类获取） ──────────────
    feature_keys = analysis.get("categories", {}).get("feature", [])
    health_keys = analysis.get("categories", {}).get("health", [])
    secure_keys = analysis.get("categories", {}).get("secure", [])

    def icon(s: str) -> str:
        return {"pass": "✅", "fail": "❌", "warn": "⚠️"}.get(s, s)

    def status_label(s: str) -> str:
        return {"pass": "正常", "fail": "异常", "warn": "异常"}.get(s, s)

    def score_icon_for(val):
        return "🟢" if val >= 90 else ("🟡" if val >= 70 else "🔴")

    def cat_summary(keys):
        p = sum(1 for k in keys if k in results and results[k]["status"] == "pass")
        f = sum(1 for k in keys if k in results and results[k]["status"] == "fail")
        w = sum(1 for k in keys if k in results and results[k]["status"] == "warn")
        t = p + f + w
        rate = round(p / max(t, 1) * 100)
        return {"total": t, "pass": p, "fail": f, "warn": w, "rate": rate}

    f = cat_summary(feature_keys)
    h = cat_summary(health_keys)
    s = cat_summary(secure_keys)

    # ── 所有检查项分 pass / fail-warn 两组 ───────────────────────────
    all_keys = feature_keys + health_keys + secure_keys

    def all_check_rows():
        rows = []
        for k in all_keys:
            if k in results:
                r = results[k]
                detail = r.get('detail') or r['value']
                rows.append(f"| {r.get('name', k)} | {icon(r['status'])} {status_label(r['status'])} | {detail.replace(chr(10), ' ')} |")
        return "\n".join(rows)

    # ── 健康评分（优先使用 analyze 返回的 health_scores） ─────────────
    health_scores = analysis.get("health_scores", {})
    if health_scores:
        stability_score = health_scores.get("feature", {}).get("score", f["rate"])
        hardware_score = health_scores.get("health", {}).get("score", h["rate"])
        security_score = health_scores.get("secure", {}).get("score", s["rate"])
        overall = health_scores.get("overall", summary["score"])
    else:
        stability_score = f["rate"]
        hardware_score = h["rate"]
        security_score = s["rate"]
        overall = summary["score"]
    score_icon = score_icon_for(overall)

    # ── 优化建议 ───────────────────────────────────────────────────────
    suggestions = analysis.get("suggestions", [])
    suggestion_rows = []
    for sug in suggestions:
        check_key = sug.get('check', '')
        check_name = results.get(check_key, {}).get('name', check_key) if check_key else '-'
        suggestion_rows.append(
            f"| {sug.get('priority', '')} | {check_name} | {sug.get('suggestion', '')} |"
        )
    suggestions_table = "\n".join(suggestion_rows) if suggestion_rows else "| - | - | 暂无优化建议 |"

    # 设备中文名（从 devices.json 匹配，降级到 host URL）
    device_label = meta.get("host", "?")
    try:
        import json as _json
        _devices_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "devices.json")
        if os.path.isfile(_devices_path):
            with open(_devices_path, encoding="utf-8") as _f:
                _data = _json.load(_f)
            for _d in _data.get("devices", []):
                _hosts = [_d.get("host", ""), _d.get("host", "").replace("https://", "http://")]
                if meta.get("host", "") in _hosts:
                    device_label = _d.get("name", device_label)
                    break
    except Exception:
        pass

    # 巡检时间格式化
    raw_time = meta.get("start_time", "")
    if raw_time and len(raw_time) == 14:
        # 20260518193542 → 2026-05-18 19:35:42
        check_time = f"{raw_time[:4]}-{raw_time[4:6]}-{raw_time[6:8]} {raw_time[8:10]}:{raw_time[10:12]}:{raw_time[12:]}"
    else:
        check_time = raw_time

    # ── 检查项详情渲染（全量展示正常+异常） ────────
    has_anomaly = any(k in results and results[k]["status"] in ("fail", "warn") for k in all_keys)
    if not has_anomaly:
        check_detail_section = "> 所有检查项通过，无异常。\n"
    else:
        all_rows_text = all_check_rows()
        check_detail_section = f"""| 检查项 | 状态 | 详情 |
|--------|------|------|
{all_rows_text}
"""

    return f"""## ✅ AD 巡检分析报告

**设备**: {device_label} ({meta.get("host", "?")})
**巡检时间**: {check_time}
**巡检场景**: {meta.get("scene", "?")}
**检查项**: {summary["total"]} 项

---

### 📊 设备基本信息

| 项目 | 值 |
|------|-----|
| AD 版本 | {dev["version"]} |
| 网关 ID | {dev["gateway_id"]} |
| 运行时间 | {dev["runtime"]} |

---

### 🔍 巡检结果详情

{check_detail_section}

---

### 📈 统计汇总

| 类别 | 检查项数 | 通过 | 异常 | 通过率 |
|------|----------|------|------|--------|
| 功能巡检 | {f["total"]} | {f["pass"]} | {f["fail"] + f["warn"]} | {f["rate"]}% |
| 健康巡检 | {h["total"]} | {h["pass"]} | {h["fail"] + h["warn"]} | {h["rate"]}% |
| 安全巡检 | {s["total"]} | {s["pass"]} | {s["fail"] + s["warn"]} | {s["rate"]}% |

---

### 💡 优化建议

| 优先级 | 检查项 | 建议 |
|--------|--------|------|
{suggestions_table}

---

### ✅ 健康评分

| 项目 | 评分 |
|------|------|
| 系统稳定性 | {score_icon_for(stability_score)} {stability_score}/100 |
| 硬件健康 | {score_icon_for(hardware_score)} {hardware_score}/100 |
| 安全配置 | {score_icon_for(security_score)} {security_score}/100 |
| **综合评分** | {score_icon} **{overall}/100** |

---

**说明**: 以上结果全部来自巡检报告文件 `ad.json`。
"""


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

WINDOW = 120  # 新报告判定窗口（秒），POST 与 history start_time 差值上限


def _normalize_start_time(s):
    """提取字符串中所有数字，转为 YYYYMMDDHHMMSS 整数。"""
    digits = ''.join(c for c in s if c.isdigit())
    if len(digits) >= 14:
        return int(digits[:14])
    return 0


def _is_new_report(top_item, pre_run_latest_name, t0_int):
    """判定 history[0] 是否为本轮巡检产生的新报告。

    Args:
        top_item: history API items[0]
        pre_run_latest_name: 启动巡检前 history[0].name
        t0_int: POST 响应的 start_time 归一化整数 (YYYYMMDDHHMMSS)

    Returns:
        True 表示该记录是本轮巡检产生的新报告
    """
    top_name = top_item.get("name", "")
    top_start = top_item.get("start_time", "")
    top_end = top_item.get("end_time", "")

    if not top_end:
        return False
    if top_name == pre_run_latest_name:
        return False

    top_int = _normalize_start_time(top_start)
    if top_int == 0:
        return False

    # Use datetime for proper time difference (handles midnight crossing)
    from datetime import datetime as _dt
    try:
        _t1 = _dt.strptime(str(top_int), "%Y%m%d%H%M%S")
        _t0 = _dt.strptime(str(t0_int), "%Y%m%d%H%M%S")
        diff = abs((_t1 - _t0).total_seconds())
    except ValueError:
        return False
    return diff < WINDOW


def _progress_one(client, **kw):
    """Single-device progress query for ThreadPoolExecutor, with NO_RUNNING fallback."""
    result = client._request("GET", "/debug/sys/offline-check", params={"type": "progress"})
    if result.get("state") == "NO_RUNNING":
        try:
            history = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
            items = history.get("items", [])
            if items:
                latest = items[0]
                result["history_latest"] = {
                    "name": latest.get("name", ""),
                    "scene": latest.get("scene", ""),
                    "start_time": latest.get("start_time", ""),
                    "end_time": latest.get("end_time", ""),
                    "finished": latest.get("end_time") != "",
                }
        except Exception:
            pass
    return result


def _start_only(client, scene="标准巡检", force=False, work_dir=None):
    """Start check only — returns immediately with work_dir and event_id, no sys.exit."""
    import tempfile
    if work_dir is None:
        slug = host_slug(client.host)
        work_dir = os.path.join(tempfile.gettempdir(), f"ad_check_{slug}")
    meta = start_check(client, scene, force=force, work_dir=work_dir)
    return {
        "host": client.host,
        "work_dir": work_dir,
        "event_id": meta.get("event_id", ""),
        "scene": meta.get("scene", ""),
    }


def _check_one(client, scene="标准巡检", force=False, work_dir=None):
    """Atomic check for a single device — run+wait+analyze+render, no sys.exit."""
    import tempfile
    if work_dir is None:
        slug = host_slug(client.host)
        work_dir = os.path.join(tempfile.gettempdir(), f"ad_check_{slug}")

    # Step 1-3: Start check
    meta = start_check(client, scene, force=force, work_dir=work_dir)

    # Step 4-6: Wait and download
    meta = wait_and_download(client, work_dir=work_dir, max_attempts=60)

    # Analyze
    with open(meta["ad_json_path"], encoding="utf-8") as f:
        data = json.load(f)
    check_info = None
    check_info_path = meta.get("check_info_path")
    if check_info_path and os.path.exists(check_info_path):
        try:
            with open(check_info_path, encoding="utf-8") as f:
                check_info = json.load(f)
        except Exception as e:
            print(f"[_check_one] 读取 check_info 失败: {e}", file=sys.stderr)
    analysis = analyze(data, check_info)
    report = render_markdown(analysis, meta)

    return {
        "meta": meta,
        "analysis": analysis,
        "markdown": report,
    }


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description="AD 设备巡检工具")
    sub = parser.add_subparsers(dest="command", help="子命令")

    # scenes
    p_scenes = sub.add_parser("scenes", help="获取巡检场景列表")
    p_scenes.add_argument("--host", required=True)
    p_scenes.add_argument("--user", default="admin")
    p_scenes.add_argument("--password", default="")

    # run — 步骤 1-3：场景确认 + 上限检查 + 启动
    # 单设备 / --no-wait: 启动后立即退出
    # 多设备 (默认): 启动 + 等待完成 + 下载分析
    p_run = sub.add_parser("run", help="启动巡检")
    p_run.add_argument("--host", default="", help="设备地址 https://IP")
    p_run.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_run.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    p_run.add_argument("--wait", action="store_true", help="多设备模式：等待巡检完成并输出报告")
    p_run.add_argument("--no-wait", action="store_true", help="多设备模式：仅启动，不等待完成（默认）")
    p_run.add_argument("--user", default="admin")
    p_run.add_argument("--password", default="")
    p_run.add_argument("--scene", default="标准巡检", help="巡检场景")
    p_run.add_argument("--force", action="store_true", help="强制巡检（覆盖上限）")
    p_run.add_argument("--work-dir", help="工作目录（默认 /tmp/ad_check_<timestamp>）")

    # wait — 步骤 4-6：轮询确认新报告生成 → 下载 → 分析
    p_wait = sub.add_parser("wait", help="下载巡检报告并分析（请先用 progress 确认已完成）")
    p_wait.add_argument("--host", required=True)
    p_wait.add_argument("--user", default="admin")
    p_wait.add_argument("--password", default="")
    p_wait.add_argument("--work-dir", default=os.path.join(tempfile.gettempdir(), "ad_check"),
                        help="与 run 的 --work-dir 保持一致")
    p_wait.add_argument("--poll-interval", type=int, default=10,
                        help="轮询间隔秒数，默认 10")
    p_wait.add_argument("--timeout", type=int, default=600,
                        help="最长等待秒数，默认 600")

    # history
    p_hist = sub.add_parser("history", help="查看历史巡检记录")
    p_hist.add_argument("--host", default="", help="设备地址 https://IP")
    p_hist.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_hist.add_argument("--user", default="admin")
    p_hist.add_argument("--password", default="")

    # progress
    p_prog = sub.add_parser("progress", help="查询巡检进度（单次）")
    p_prog.add_argument("--host", default="", help="设备地址 https://IP")
    p_prog.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_prog.add_argument("--user", default="admin")
    p_prog.add_argument("--password", default="")

    # analyze
    p_analyze = sub.add_parser("analyze", help="分析已下载的巡检报告")
    p_analyze.add_argument("--path", required=True,
                           help="report.zip 解压目录（含 ad.json 和 _meta.json）")
    p_analyze.add_argument("--host", default="",
                           help="设备地址（从 meta 读取时可省略）")
    p_analyze.add_argument("--scene", default="",
                           help="巡检场景（从 meta 读取时可省略）")
    p_analyze.add_argument("--start-time", default="",
                           help="巡检开始时间（从 meta 读取时可省略）")

    args = parser.parse_args()

    if args.command == "scenes":
        password = args.password or os.environ.get("AD_PASS", "")
        if not password:
            print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
            sys.exit(4)
        client = ADClient(args.host, args.user, password)
        try:
            result = client._request("GET", "/sys/offline-check/")
        except ADAuthError as e:
            print(f"认证失败: {e}", file=sys.stderr)
            sys.exit(2)
        except (ADConnectionError, ADAPIError) as e:
            print(f"通信错误: {e}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.command == "run":
        if args.hosts:
            if args.devices:
                devices = load_devices_json(args.devices)
            else:
                devices = parse_hosts_arg(args.hosts, args.user, args.password)
            if not devices:
                print("错误: 设备列表为空", file=sys.stderr)
                sys.exit(4)

            if args.wait:
                # 同步模式：等待所有设备完成（需平台超时充足）
                results = run_multi(devices, _check_one, scene=args.scene, force=args.force)
                device_names = {d["host"]: d["name"] for d in devices if d.get("name")}
                print(render_multi_device_report(results, scene=args.scene, device_names=device_names))
                sys.exit(compute_multi_exit_code(results))
            else:
                # 异步模式（默认）：启动后立即退出，返回 work_dir 供 LLM 轮询
                results = run_multi(devices, _start_only, scene=args.scene, force=args.force)
                for host, r in results.items():
                    if "error" in r:
                        print(f"[{host}] 错误: {r['error']}", file=sys.stderr)
                    else:
                        print(f"[{host}] work_dir={r['work_dir']} event_id={r['event_id']}")
                sys.exit(compute_multi_exit_code(results))

        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        password = args.password or os.environ.get("AD_PASS", "")
        if not password:
            print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
            sys.exit(4)
        client = ADClient(args.host, args.user, password)
        work_dir = args.work_dir or os.path.join(tempfile.gettempdir(), f"ad_check_{int(time.time())}")
        try:
            meta = start_check(client, args.scene, force=args.force, work_dir=work_dir)
            print(f"         工作目录: {work_dir}")
            print(f"         后续请用 wait 命令轮询进度，或用 progress 命令单独查询")
        except CheckSceneNotFoundError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(4)
        except CheckLimitReachedError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(4)
        except ADAuthError as e:
            print(f"认证失败: {e}", file=sys.stderr)
            sys.exit(2)
        except (ADConnectionError, ADAPIError) as e:
            print(f"通信错误: {e}", file=sys.stderr)
            sys.exit(1)
        except RuntimeError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(4)

    elif args.command == "wait":
        password = args.password or os.environ.get("AD_PASS", "")
        if not password:
            print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
            sys.exit(4)
        client = ADClient(args.host, args.user, password)
        try:
            meta = wait_and_download(
                client,
                work_dir=args.work_dir,
                poll_interval=args.poll_interval,
                timeout=args.timeout,
            )
            # 下载完成后自动分析并输出 markdown
            with open(meta["ad_json_path"], encoding="utf-8") as f:
                data = json.load(f)
            check_info = None
            check_info_path = meta.get("check_info_path")
            if check_info_path and os.path.exists(check_info_path):
                try:
                    with open(check_info_path, encoding="utf-8") as f:
                        check_info = json.load(f)
                except Exception as e:
                    print(f"[wait] 读取 check_info 失败: {e}", file=sys.stderr)
            analysis = analyze(data, check_info)
            report = render_markdown(analysis, meta)
            print("\n" + report)
        except CheckTimeoutError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(5)
        except CheckDownloadError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(4)
        except RuntimeError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(4)

    elif args.command == "history":
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, args.password)
            results = run_multi(devices, lambda client, **kw: client._request("GET", "/debug/sys/offline-check", params={"type": "history"}))
            output = {"mode": "multi", "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v), "failed": sum(1 for v in results.values() if "error" in v)}, "results": results}
            print(json.dumps(output, indent=2, ensure_ascii=False))
            sys.exit(compute_multi_exit_code(results))

        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        password = args.password or os.environ.get("AD_PASS", "")
        if not password:
            print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
            sys.exit(4)
        client = ADClient(args.host, args.user, password)
        try:
            result = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
        except ADAuthError as e:
            print(f"认证失败: {e}", file=sys.stderr)
            sys.exit(2)
        except (ADConnectionError, ADAPIError) as e:
            print(f"通信错误: {e}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.command == "progress":
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.user, args.password)
            results = run_multi(devices, _progress_one)
            output = {"mode": "multi", "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v), "failed": sum(1 for v in results.values() if "error" in v)}, "results": results}
            print(json.dumps(output, indent=2, ensure_ascii=False))
            sys.exit(compute_multi_exit_code(results))

        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        password = args.password or os.environ.get("AD_PASS", "")
        if not password:
            print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
            sys.exit(4)
        try:
            client = ADClient(args.host, args.user, password)
            result = _progress_one(client)
        except ADAuthError as e:
            print(f"认证失败: {e}", file=sys.stderr)
            sys.exit(2)
        except (ADConnectionError, ADAPIError) as e:
            print(f"通信错误: {e}", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            print(f"错误: {e}", file=sys.stderr)
            sys.exit(5)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.command == "analyze":
        # 读取 sidecar meta（优先，其次用命令行参数覆盖）
        meta_path = os.path.join(args.path, "_meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)
        else:
            meta = {}

        # 命令行参数覆盖 meta
        if args.host:
            meta["host"] = args.host
        if args.scene:
            meta["scene"] = args.scene
        if args.start_time:
            meta["start_time"] = args.start_time
        meta["work_dir"] = args.path

        # 查找 ad.json
        ad_path = os.path.join(args.path, "ad.json")
        if not os.path.exists(ad_path):
            for root, _, files in os.walk(args.path):
                if "ad.json" in files:
                    ad_path = os.path.join(root, "ad.json")
                    break

        if not os.path.exists(ad_path):
            print(f"❌ 找不到 ad.json 在 {args.path}")
            sys.exit(4)

        with open(ad_path, encoding="utf-8") as f:
            data = json.load(f)

        # 查找 check_info 文件
        check_info = None
        for root, _, files in os.walk(args.path):
            for f in files:
                if "check_info" in f.lower() and f.endswith(".json"):
                    ci_path = os.path.join(root, f)
                    try:
                        with open(ci_path, encoding="utf-8") as cf:
                            check_info = json.load(cf)
                        break
                    except Exception:
                        pass
            if check_info is not None:
                break

        analysis = analyze(data, check_info)
        report = render_markdown(analysis, meta)
        print(report)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
