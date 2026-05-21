#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AD 巡检脚本 — 严格按照 ad-check-analysis SKILL.md 流程实现
"""

import argparse
import json
import os
import sys
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
# 巡检执行流程
# ---------------------------------------------------------------------------

def start_check(
    client: ADClient,
    scene: str,
    force: bool = False,
    work_dir: str = "/tmp/ad_check",
) -> Dict[str, Any]:
    """
    步骤 1-3：场景确认 + 记录上限检查 + 后台启动巡检
    启动后立即返回，不轮询。
    """
    os.makedirs(work_dir, exist_ok=True)

    # 步骤 1: 确认巡检场景
    try:
        scenes = client._request("GET", "/sys/offline-check/")
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise RuntimeError(f"API 调用失败: {e}")
    scene_names = [s["name"] for s in scenes.get("items", [])]
    if not scene_names:
        raise RuntimeError("无法获取巡检场景列表")
    if scene not in scene_names:
        raise RuntimeError(f"场景 '{scene}' 不存在，可用: {scene_names}")

    # 步骤 2: 检查巡检记录上限
    try:
        history = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise RuntimeError(f"API 调用失败: {e}")
    pre_run_items = history.get("items", [])
    count = len(pre_run_items)
    pre_run_latest_name = pre_run_items[0].get("name", "") if pre_run_items else ""
    need_force = count >= 5
    print(f"[步骤 2] 巡检记录: {count}/5 {'(已达上限，需 --force)' if need_force else '(未达上限，可直接执行)'}")
    if need_force and not force:
        raise RuntimeError(
            "巡检记录已达 5 条上限，需要使用 --force 参数强制巡检（会删除最早一条记录）"
        )

    # 步骤 3: 后台启动巡检（立即返回）
    print(f"[步骤 3] 启动巡检: scene='{scene}' force={force}")
    try:
        result = client._request(
            "POST", "/debug/sys/offline-check",
            data={"scene": scene},
            params={"force": "true"} if (force and need_force) else None,
        )
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise RuntimeError(f"API 调用失败: {e}")
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
    max_attempts: int = 1,
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
    print(f"[步骤 4] 轮询历史等待新报告 (interval={poll_interval}s, timeout={timeout}s)")
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
            print(f"         [{attempt}] {tag} {state} name={top_name} start={top_start}")
            if is_new and is_finished:
                latest = top
                break
        else:
            print(f"         [{attempt}] 历史为空")
        time.sleep(poll_interval)

    if latest is None:
        raise RuntimeError(
            f"未检测到本次巡检的完成报告 (attempts={attempt})。"
            "请使用 progress 确认完成后再 wait，或增加重试次数。"
        )

    # ── 步骤 5: 下载报告 ─────────────────────────────────────────────
    print("[步骤 5] 下载巡检报告…")
    report_name = latest["name"]
    report_scene = latest.get("scene", scene)
    start_time = latest.get("start_time", "")
    print(f"         报告: {report_name}")

    try:
        token_resp = client._request(
            "GET", "/debug/sys/offline-check",
            params={"type": "download", "key": report_name, "encrypt": "false"},
        )
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise RuntimeError(f"API 调用失败: {e}")
    file_token = token_resp.get("file_token")
    if not file_token:
        raise RuntimeError(f"获取 file_token 失败: {token_resp}")

    zip_path = os.path.join(work_dir, "report.zip")
    try:
        data = client._raw_request(f"/cgi/file-resource?d={file_token}")
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise RuntimeError(f"文件下载失败: {e}")
    os.makedirs(os.path.dirname(zip_path) or ".", exist_ok=True)
    with open(zip_path, "wb") as f:
        f.write(data)
    print(f"         下载: {zip_path} ({os.path.getsize(zip_path)} bytes)")

    # ── 步骤 6: 解压并更新元数据 ────────────────────────────────────
    print("[步骤 6] 解压并保存元数据…")
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(work_dir)

    ad_json_path = os.path.join(work_dir, "ad.json")
    if not os.path.exists(ad_json_path):
        for root, _, files in os.walk(work_dir):
            if "ad.json" in files:
                ad_json_path = os.path.join(root, "ad.json")
                break

    # 更新 meta
    meta.update({
        "report_name": report_name,
        "scene": report_scene,
        "start_time": start_time,
        "ad_json_path": ad_json_path,
    })
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"         ad.json: {ad_json_path} ({os.path.getsize(ad_json_path)} bytes)")
    print("✅ 下载完成")

    return meta


# ---------------------------------------------------------------------------
# 巡检结果分析（67 项全覆盖）
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# 优化建议映射表
# ---------------------------------------------------------------------------

_SUGGESTION_MAP = {
    "CPU_CHECK": "CPU 使用率偏高，建议检查是否存在异常进程或考虑扩容",
    "MEMORY_CHECK": "内存使用率偏高，建议检查是否存在内存泄漏或考虑扩容",
    "DISK_CHECK": "磁盘使用率偏高，建议清理日志或扩容磁盘",
    "FAN_STATE_CHECK": "风扇状态异常，建议检查硬件并及时更换故障风扇",
    "POWER_STATE_CHECK": "电源状态异常，建议检查电源模块并安排维护",
    "NIC_STATE_CHECK": "网口状态异常，建议检查物理链路和网卡状态",
    "CORE_PROCESS_CHECK": "核心进程缺失，建议检查服务状态并重启相关服务",
    "KERNEL_LOG_CHECK": "内核日志存在异常，建议排查内核错误日志",
    "WEAK_PASSWORD_CHECK": "存在弱密码账户，建议修改为强密码",
    "SSH_API_CHECK": "SSH 权限未正确配置，建议检查并加固 SSH 访问控制",
    "SSL_POLICY_CHECK": "SSL 策略存在不安全算法或协议，建议禁用旧版本",
    "OPEN_PORT_CHECK": "存在风险端口开放，建议关闭不必要的端口",
    "DEVICE_CONNECTION_CHECK": "设备网口连接异常，建议检查物理链路",
    "CONFIG_ID_CONFLICT_CHECK": "配置 ID 存在冲突，建议排查并修正配置",
    "CRASH_LOG_CHECK": "存在崩溃日志，建议排查系统稳定性问题",
    "MEMORY_LEAK_CHECK": "共享内存/信号量异常，可能存在内存泄漏",
}


def analyze(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    根据 ad.json 内容进行结构化分析。
    严格按 ad.json 中实际存在的字段分析，不依赖场景定义。
    字段不存在则跳过该检查项，不记录。
    分类规则：根据字段名自动归入功能/健康/安全三类。
    """

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
              "pass" if cpu_max < 90 else ("warn" if cpu_max < 95 else "fail"),
              f"max={cpu_max}%")

    if has("base_log_error_exist"):
        # 38. LOG_CHECK
        le = data.get("base_log_error_exist", -1)
        check("LOG_CHECK",
              "pass" if le == 0 else ("warn" if le < 5 else "fail"),
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
              "pass" if rm == "true" else "warn",
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
              "pass" if mr < 95 else "warn",
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

    def anomaly_rows():
        rows = []
        for k in all_keys:
            if k in results and results[k]["status"] in ("fail", "warn"):
                r = results[k]
                detail = r.get('detail') or r['value']
                rows.append(f"| {k} | {icon(r['status'])} {status_label(r['status'])} | {detail} |")
        return "\n".join(rows) if rows else "> 无异常项"

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
        suggestion_rows.append(
            f"| {sug.get('priority', '')} | {sug.get('suggestion', '')} |"
        )
    suggestions_table = "\n".join(suggestion_rows) if suggestion_rows else "| - | 暂无优化建议 |"

    # 设备中文名（从 devices.json 匹配，降级到 host URL）
    device_label = meta.get("host", "?")
    try:
        import json as _json
        _devices_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "devices.json")
        if os.path.isfile(_devices_path):
            with open(_devices_path, encoding="utf-8") as _f:
                _devices = _json.load(_f)
            for _d in _devices:
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

    # ── 异常项渲染（区分有/无异常两种显示方式） ────────
    anomaly_rows_text = anomaly_rows()
    if anomaly_rows_text == "> 无异常项":
        anomaly_section = "> 所有检查项通过，无异常。\n"
    else:
        anomaly_section = f"""#### ⚠️ 异常项

| 检查项 | 状态 | 详情 |
|--------|------|------|
{anomaly_rows_text}
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

{anomaly_section}

---

### 📈 统计汇总

| 类别 | 检查项数 | 通过 | 异常 | 通过率 |
|------|----------|------|------|--------|
| 功能巡检 | {f["total"]} | {f["pass"]} | {f["fail"] + f["warn"]} | {f["rate"]}% |
| 健康巡检 | {h["total"]} | {h["pass"]} | {h["fail"] + h["warn"]} | {h["rate"]}% |
| 安全巡检 | {s["total"]} | {s["pass"]} | {s["fail"] + s["warn"]} | {s["rate"]}% |

---

### 💡 优化建议

| 优先级 | 建议 |
|--------|------|
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

**说明**: 以上结果全部来自巡检报告文件 `ad.json`，严格按照巡检返回数据进行分析。
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
    analysis = analyze(data)
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
    p_scenes.add_argument("--username", default="admin")
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
    p_run.add_argument("--username", default="admin")
    p_run.add_argument("--password", default="")
    p_run.add_argument("--scene", default="标准巡检", help="巡检场景")
    p_run.add_argument("--force", action="store_true", help="强制巡检（覆盖上限）")
    p_run.add_argument("--work-dir", help="工作目录（默认 /tmp/ad_check_<timestamp>）")

    # wait — 步骤 4-6：轮询确认新报告生成 → 下载 → 分析
    p_wait = sub.add_parser("wait", help="下载巡检报告并分析（请先用 progress 确认已完成）")
    p_wait.add_argument("--host", required=True)
    p_wait.add_argument("--username", default="admin")
    p_wait.add_argument("--password", default="")
    p_wait.add_argument("--work-dir", default="/tmp/ad_check",
                        help="与 run 的 --output 保持一致")
    p_wait.add_argument("--poll-interval", type=int, default=10,
                        help="轮询间隔秒数，默认 10")
    p_wait.add_argument("--timeout", type=int, default=600,
                        help="最长等待秒数，默认 600")

    # history
    p_hist = sub.add_parser("history", help="查看历史巡检记录")
    p_hist.add_argument("--host", default="", help="设备地址 https://IP")
    p_hist.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_hist.add_argument("--username", default="admin")
    p_hist.add_argument("--password", default="")

    # progress
    p_prog = sub.add_parser("progress", help="查询巡检进度（单次）")
    p_prog.add_argument("--host", default="", help="设备地址 https://IP")
    p_prog.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_prog.add_argument("--username", default="admin")
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
        client = ADClient(args.host, args.username, args.password)
        try:
            result = client._request("GET", "/sys/offline-check/")
        except (ADConnectionError, ADAuthError, ADAPIError) as e:
            print(f"❌ API 调用失败: {e}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.command == "run":
        if args.hosts:
            if args.devices:
                devices = load_devices_json(args.devices)
            else:
                devices = parse_hosts_arg(args.hosts, args.username, args.password)
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

        client = ADClient(args.host, args.username, args.password)
        work_dir = args.work_dir or f"/tmp/ad_check_{int(time.time())}"
        try:
            meta = start_check(client, args.scene, force=args.force, work_dir=work_dir)
            print(f"         工作目录: {work_dir}")
            print(f"         后续请用 wait 命令轮询进度，或用 progress 命令单独查询")
        except RuntimeError as e:
            msg = str(e)
            print(f"❌ {msg}", file=sys.stderr)
            if "场景" in msg and "不存在" in msg:
                sys.exit(4)
            elif "上限" in msg or "记录" in msg:
                sys.exit(4)
            else:
                sys.exit(4)

    elif args.command == "wait":
        client = ADClient(args.host, args.username, args.password)
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
            analysis = analyze(data)
            report = render_markdown(analysis, meta)
            print("\n" + report)
        except RuntimeError as e:
            msg = str(e)
            print(f"❌ {msg}", file=sys.stderr)
            if "超时" in msg:
                sys.exit(5)
            elif "file_token" in msg or "文件下载" in msg:
                sys.exit(4)
            elif "找不到" in msg:
                sys.exit(4)
            else:
                sys.exit(4)

    elif args.command == "history":
        if args.hosts:
            devices = parse_hosts_arg(args.hosts, args.username, args.password)
            results = run_multi(devices, lambda client, **kw: client._request("GET", "/debug/sys/offline-check", params={"type": "history"}))
            output = {"mode": "multi", "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v), "failed": sum(1 for v in results.values() if "error" in v)}, "results": results}
            print(json.dumps(output, indent=2, ensure_ascii=False))
            sys.exit(compute_multi_exit_code(results))

        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        client = ADClient(args.host, args.username, args.password)
        try:
            result = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
        except (ADConnectionError, ADAuthError, ADAPIError) as e:
            print(f"❌ API 调用失败: {e}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.command == "progress":
        if hasattr(args, 'hosts') and args.hosts:
            devices = parse_hosts_arg(args.hosts, args.username, args.password)
            results = run_multi(devices, _progress_one)
            output = {"mode": "multi", "summary": {"total": len(results), "success": sum(1 for v in results.values() if "error" not in v), "failed": sum(1 for v in results.values() if "error" in v)}, "results": results}
            print(json.dumps(output, indent=2, ensure_ascii=False))
            sys.exit(compute_multi_exit_code(results))

        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        client = ADClient(args.host, args.username, args.password)
        result = _progress_one(client)
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

        analysis = analyze(data)
        report = render_markdown(analysis, meta)
        print(report)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
