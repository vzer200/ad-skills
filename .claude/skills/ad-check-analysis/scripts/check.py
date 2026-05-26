#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AD 巡检脚本 — 严格按照 ad-check-analysis SKILL.md 流程实现
"""

import argparse
import json
import os
import re
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
        resolve_device_pw,
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
from typing import Any, Dict, List, Optional, Tuple, Union


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


def _scene_names_from_response(response: Dict[str, Any]) -> List[str]:
    """Extract scene names from the device offline-check scene API response."""
    names: List[str] = []
    for item in _response_items(response):
        name = item.get("name") if isinstance(item, dict) else ""
        if isinstance(name, str) and name.strip():
            names.append(name.strip())
    return names


def fetch_scene_names(client: ADClient) -> List[str]:
    """Fetch available inspection scenes from the device API."""
    try:
        response = client._request("GET", "/sys/offline-check/")
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise RuntimeError(f"API 调用失败: {e}")
    names = _scene_names_from_response(response)
    if not names:
        raise RuntimeError("无法获取巡检场景列表")
    return names


def render_interaction_prompt(
    stage: str,
    target: str,
    scene: str = "标准巡检",
    scenes: Optional[List[str]] = None,
) -> str:
    """Render user-visible interaction prompts so WorkBot does not improvise them."""
    target = (target or "AD1").strip()
    scene = (scene or "标准巡检").strip()
    if stage == "scene":
        scene_names = [item.strip() for item in (scenes or []) if isinstance(item, str) and item.strip()]
        if not scene_names:
            scene_names = ["标准巡检", "全量巡检", "安全巡检"]
        return "\n".join([f"请问你要对 {target} 执行哪种巡检？", *scene_names])
    if stage == "confirm":
        return f"已检查历史巡检记录，是否确认对 {target} 强制继续{scene}？"
    raise ValueError(f"unsupported prompt stage: {stage}")


def _extract_ip(host: str) -> str:
    """Extract an IPv4 address from a host URL for user-facing labels."""
    host = host or "?"
    m = re.search(r"(\d+\.\d+\.\d+\.\d+)", host)
    return m.group(1) if m else host


def _response_items(response: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Return API items only; pagination totals are metadata and must not drive logic."""
    items = response.get("items", []) if isinstance(response, dict) else []
    return items if isinstance(items, list) else []


def _prompt_scene_client(args: argparse.Namespace) -> Optional[ADClient]:
    """Build a client for prompt-time scene lookup when device context is supplied."""
    password_fallback = args.password or os.environ.get("AD_PASS", "")
    if getattr(args, "devices", ""):
        devices = load_devices_json(args.devices, getattr(args, "device", ""))
        if not devices:
            raise ValueError("设备列表为空")
        device = devices[0]
        password = resolve_device_pw(device, password_fallback)
        if not password:
            raise ValueError("未指定密码")
        client = ADClient(
            device["host"],
            device.get("user", args.username),
            password,
        )
        setattr(client, "device_name", device.get("name", ""))
        return client
    if getattr(args, "host", ""):
        if not password_fallback:
            raise ValueError("未指定密码")
        return ADClient(args.host, args.username, password_fallback)
    return None


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
    scene_names = fetch_scene_names(client)
    if scene not in scene_names:
        raise CheckSceneNotFoundError(f"场景 '{scene}' 不存在，可用: {scene_names}")

    # 步骤 2: 检查巡检记录上限
    try:
        history = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
    except (ADConnectionError, ADAuthError, ADAPIError) as e:
        raise RuntimeError(f"API 调用失败: {e}")
    pre_run_items = _response_items(history)
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
    print("         巡检已在设备后台执行，请使用 progress 命令每 30 秒轮询进度。")

    check_start_time = result.get("start_time", "")
    device_name = getattr(client, "device_name", "")
    if not isinstance(device_name, str):
        device_name = ""
    meta = {
        "scene": scene,
        "host": client.host,
        "device_name": device_name,
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
    verbose: bool = False,
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
    def log(message: str) -> None:
        if verbose:
            print(message, file=sys.stderr)

    log(f"[步骤 4] 轮询历史等待新报告 (interval={poll_interval}s, timeout={timeout}s)")
    deadline = time.time() + timeout
    latest = None
    attempt = 0
    while time.time() < deadline and attempt < max_attempts:
        attempt += 1
        try:
            history = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
        except (ADConnectionError, ADAuthError, ADAPIError) as e:
            raise RuntimeError(f"API 调用失败: {e}")
        items = _response_items(history)
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
            log(f"         [{attempt}] {tag} {state} name={top_name} start={top_start}")
            if is_new and is_finished:
                latest = top
                break
        else:
            log(f"         [{attempt}] 历史为空")
        time.sleep(poll_interval)

    if latest is None:
        raise CheckTimeoutError(
            f"未检测到本次巡检的完成报告 (attempts={attempt})。"
            "请使用 progress 确认完成后再 wait，或增加重试次数。"
        )

    # ── 步骤 5: 下载报告 ─────────────────────────────────────────────
    log("[步骤 5] 下载巡检报告…")
    report_name = latest["name"]
    report_scene = latest.get("scene", scene)
    start_time = latest.get("start_time", "")
    log(f"         报告: {report_name}")

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
    log(f"         下载: {zip_path} ({os.path.getsize(zip_path)} bytes)")

    # ── 步骤 6: 解压并更新元数据 ────────────────────────────────────
    log("[步骤 6] 解压并保存元数据…")
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(work_dir)

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

    log(f"         ad.json: {ad_json_path} ({os.path.getsize(ad_json_path)} bytes)")
    log("✅ 下载完成")

    return meta


# ---------------------------------------------------------------------------
# 巡检结果分析（67 项全覆盖）
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# 优化建议映射表
# ---------------------------------------------------------------------------

_SUGGESTION_MAP = {
    "ADMIN_ROLE_CHECK": "管理员角色配置异常，建议确认管理账号角色是否完整，并按最小权限原则修正角色授权",
    "DEVICE_SAFE_CHECK": "设备安全检查未开启，建议开启设备安全检查并复核高危配置项",
    "DNS_DETECT_CHECK": "DNS 代理配置需要确认，建议核对当前业务是否依赖 DNS 代理，避免误开放代理能力",
    "DNAT_CHECK": "存在 DNAT 映射规则，建议确认公网映射是否仍在使用，并清理无业务归属的规则",
    "HEARTBEAT_CHECK": "心跳状态异常，建议检查双机/集群心跳链路、心跳接口和对端设备状态",
    "STATIC_IP_CHECK": "存在静态 IP 配置，建议核对地址规划，避免与动态分配或业务地址冲突",
    "CLUSTER_STATE_CHECK": "集群状态未处于正常状态，建议确认当前是否为预期单机模式；如应为集群，请检查集群链路和成员状态",
    "VIRTUAL_MAC_CHECK": "虚拟 MAC 状态异常，建议确认集群/双机场景下虚拟 MAC 是否启用并同步正常",
    "DUAL_STATE_CHECK": "双机状态异常，建议检查主备关系、同步状态和心跳连通性",
    "POOL_PERSIST_CHECK": "节点池持久化配置需要确认，建议核对关键业务是否需要会话保持或连接保持",
    "STATIC_ROUTE_CHECK": "静态路由健康检查存在异常，建议检查下一跳可达性、路由绑定接口和探测目标",
    "POOL_HEALTH_CHECK": "节点池健康检查存在异常，建议检查节点池成员状态、健康检查配置和后端服务可达性",
    "RS_LEVEL_CHECK": "节点级别检查未通过，建议确认节点优先级、权重和实际承载策略是否符合预期",
    "APP_GROUP_CHECK": "应用组状态异常，建议检查应用组成员、关联虚拟服务和集群同步状态",
    "DNS_SERVER_STATE_CHECK": "DNS 服务健康状态异常，建议检查 DNS 服务进程、监听地址和解析测试结果",
    "LINK_HEALTH_CHECK": "链路健康检查存在异常，建议检查链路探测目标、运营商线路和出口连通性",
    "STATIC_PROXIMITY_CHECK": "静态就近性检查未通过，建议核对就近性策略、地址库和调度结果",
    "DNS64_CHECK": "DNS64 配置需要确认，建议核对 IPv6/IPv4 转换业务是否需要该能力",
    "POLICY_ROUTE_CHECK": "检测到新增策略路由，建议确认变更来源和业务归属，避免异常流量绕行",
    "MANAGE_IP_CHECK": "管理 IP 状态不一致，建议检查集群成员管理地址配置和同步状态",
    "SNMP_TRAPS_CHECK": "SNMP Trap 告警未开启，建议按监控规范配置 Trap 服务器并验证告警送达",
    "DNS_REFLECT_CHECK": "DNS 前置策略配置需要确认，建议检查策略命中范围和业务影响",
    "DNS_SERVER_CHECK": "DNS 服务配置异常，建议确认 DNS 服务是否应启用，并检查监听和解析配置",
    "DNAT_PORT_CHECK": "DNAT 端口/协议配置需要确认，建议核对映射端口是否仍有业务使用",
    "SESSION_SYNC_CHECK": "会话同步状态异常，建议检查双机/集群会话同步开关、链路和成员状态",
    "MAIL_WARN_CHECK": "邮件告警未开启，建议配置告警收件人和 SMTP 服务器并发送测试邮件",
    "VIP_POOL_CHECK": "虚拟 IP 池存在异常地址，建议检查地址池可用性、冲突地址和关联业务",
    "PROXY_POLICY_CHECK": "代理策略检查未通过，建议核对代理策略范围、启用状态和业务需求",
    "DNS_MAP_PS_CHECK": "DNS 映射持久化配置需要确认，建议检查持久化策略是否符合业务访问预期",
    "WAN_BANDWIDTH_CHECK": "WAN 带宽配置需要确认，建议核对带宽限制是否与线路能力和业务策略一致",
    "FAULT_SWITCH_CHECK": "故障切换配置需要确认，建议检查切换策略、触发条件和演练结果",
    "SYSLOG_CHECK": "Syslog 未开启，建议配置日志服务器并验证设备日志可正常外送",
    "AUTO_UPDATE_CHECK": "自动更新未开启，建议确认是否按运维规范启用更新或建立人工补丁检查机制",
    "CPU_CHECK": "CPU 使用率偏高，建议检查是否存在异常进程或考虑扩容",
    "MEMORY_CHECK": "内存使用率偏高，建议检查是否存在内存泄漏或考虑扩容",
    "LOG_CHECK": "检测到错误日志，建议优先查看最近时间段错误日志，定位是否存在服务异常或配置变更失败",
    "DEVICE_RUN_TIME": "设备运行时间未正常获取，建议确认基础状态采集是否正常",
    "DEVICE_FILE_CHECK": "设备文件检查异常，建议检查临时文件、异常残留文件和磁盘目录权限",
    "DISK_CHECK": "磁盘信息缺失或使用率异常，建议检查磁盘采集状态、清理日志或扩容磁盘",
    "FAN_STATE_CHECK": "风扇状态异常，建议检查硬件并及时更换故障风扇",
    "POWER_STATE_CHECK": "电源状态异常，建议检查电源模块并安排维护",
    "NIC_STATE_CHECK": "网口状态异常，建议检查物理链路和网卡状态",
    "CORE_PROCESS_CHECK": "核心进程缺失，建议检查服务状态并重启相关服务",
    "KERNEL_LOG_CHECK": "内核日志存在异常，建议排查内核错误日志",
    "REMOTE_MAINTAIN_CHECK": "远程维护未开启，建议确认是否需要开启远程维护通道，并按安全要求限制访问来源",
    "BLACK_BOX_CHECK": "黑盒日志状态异常，建议检查黑盒日志采集和存储状态",
    "DMESG_DATA_CHECK": "启动日志存在异常信息，建议检查内核启动日志并确认是否影响设备稳定性",
    "SPEED_CARD_CHECK": "加速卡状态异常，建议检查加速卡驱动、硬件状态和业务加速能力",
    "BIOS_VERSION_CHECK": "BIOS 状态需要确认，建议核对当前 BIOS 版本和厂商推荐版本",
    "WARN_LOG_CHECK": "告警日志状态异常，建议查看设备告警中心并确认是否存在未处理告警",
    "COREDUMP_INFO_CHECK": "Core 文件状态异常，建议收集 Core 文件并排查相关服务崩溃原因",
    "NIC_HEALTH_CHECK": "网卡健康状态异常，建议检查网卡驱动、链路质量和硬件告警",
    "SNAT_SPORT_EXHAUSTION_CHECK": "SNAT 源端口存在耗尽风险，建议检查连接数、SNAT 地址池和端口复用配置",
    "WEAK_PASSWORD_CHECK": "存在弱密码账户，建议修改为强密码",
    "SSH_API_CHECK": "SSH 权限未正确配置，建议检查并加固 SSH 访问控制",
    "SSL_POLICY_CHECK": "SSL 策略存在不安全算法或协议，建议禁用旧版本",
    "OPEN_PORT_CHECK": "存在风险端口开放，建议关闭不必要的端口",
    "DEVICE_CONNECTION_CHECK": "设备网口连接异常，建议检查物理链路",
    "CONFIG_ID_CONFLICT_CHECK": "配置 ID 存在冲突，建议排查并修正配置",
    "CRASH_LOG_CHECK": "存在崩溃日志，建议排查系统稳定性问题",
    "PATCH_INFO_CHECK": "未检测到补丁信息，建议确认当前版本是否已包含最新安全修复，并按变更流程评估补丁升级",
    "REPORT_CHECK": "报表服务状态异常，建议检查报表服务进程、磁盘空间和服务日志",
    "IP_LIMIT_CHECK": "管理登录 IP 限制未启用，建议开启管理来源限制，仅允许可信运维网段登录",
    "MEMORY_LEAK_CHECK": "共享内存/信号量异常，可能存在内存泄漏",
}


def _suggestion_for_check(check_key: str, check_name: str, result: Dict[str, Any]) -> str:
    suggestion = _SUGGESTION_MAP.get(check_key)
    if suggestion:
        return suggestion
    return f"{check_name} 未达到预期状态，建议结合详情列查看当前状态，并在设备对应配置页核对业务影响后处理"

_CHECK_LABELS = {
    "APP_VERSION_CHECK": "应用版本检查",
    "ADMIN_ROLE_CHECK": "管理员角色检查",
    "DEVICE_SAFE_CHECK": "设备安全状态检查",
    "DNS_DETECT_CHECK": "DNS 探测配置检查",
    "DNAT_CHECK": "DNAT 配置检查",
    "HEARTBEAT_CHECK": "心跳状态检查",
    "STATIC_IP_CHECK": "静态 IP 配置检查",
    "CLUSTER_STATE_CHECK": "集群状态检查",
    "VIRTUAL_MAC_CHECK": "虚拟 MAC 检查",
    "DUAL_STATE_CHECK": "双机状态检查",
    "POOL_PERSIST_CHECK": "节点池会话保持检查",
    "STATIC_ROUTE_CHECK": "静态路由检查",
    "POOL_HEALTH_CHECK": "节点池健康检查",
    "RS_LEVEL_CHECK": "真实服务器状态检查",
    "APP_GROUP_CHECK": "应用组状态检查",
    "DNS_SERVER_STATE_CHECK": "DNS 服务状态检查",
    "LINK_HEALTH_CHECK": "链路健康检查",
    "STATIC_PROXIMITY_CHECK": "静态就近性检查",
    "DNS64_CHECK": "DNS64 配置检查",
    "POLICY_ROUTE_CHECK": "策略路由检查",
    "MANAGE_IP_CHECK": "管理 IP 检查",
    "SNMP_TRAPS_CHECK": "SNMP Trap 检查",
    "DNS_REFLECT_CHECK": "DNS 反射配置检查",
    "DNS_SERVER_CHECK": "DNS 服务器检查",
    "DNAT_PORT_CHECK": "DNAT 端口检查",
    "SESSION_SYNC_CHECK": "会话同步检查",
    "MAIL_WARN_CHECK": "邮件告警检查",
    "VIP_POOL_CHECK": "虚拟服务和节点池绑定检查",
    "PROXY_POLICY_CHECK": "代理策略检查",
    "DNS_MAP_PS_CHECK": "DNS 映射策略检查",
    "WAN_BANDWIDTH_CHECK": "出口带宽检查",
    "FAULT_SWITCH_CHECK": "故障切换检查",
    "SYSLOG_CHECK": "Syslog 配置检查",
    "AUTO_UPDATE_CHECK": "自动更新检查",
    "CPU_CHECK": "CPU 使用率检查",
    "LOG_CHECK": "日志状态检查",
    "DEVICE_RUN_TIME": "设备运行时间检查",
    "DEVICE_FILE_CHECK": "设备文件检查",
    "NIC_STATE_CHECK": "网卡状态检查",
    "CORE_PROCESS_CHECK": "核心进程检查",
    "KERNEL_LOG_CHECK": "内核日志检查",
    "REMOTE_MAINTAIN_CHECK": "远程维护检查",
    "BLACK_BOX_CHECK": "黑匣子日志检查",
    "DMESG_DATA_CHECK": "内核启动日志检查",
    "DISK_CHECK": "磁盘使用率检查",
    "CRASH_LOG_CHECK": "崩溃日志检查",
    "MEMORY_CHECK": "内存使用率检查",
    "SPEED_CARD_CHECK": "加速卡状态检查",
    "FAN_STATE_CHECK": "风扇状态检查",
    "POWER_STATE_CHECK": "电源状态检查",
    "BIOS_VERSION_CHECK": "BIOS 版本检查",
    "WARN_LOG_CHECK": "告警日志检查",
    "MEMORY_LEAK_CHECK": "内存泄漏风险检查",
    "DEVICE_CONNECTION_CHECK": "设备连接检查",
    "COREDUMP_INFO_CHECK": "Core Dump 检查",
    "CONFIG_ID_CONFLICT_CHECK": "配置 ID 冲突检查",
    "NIC_HEALTH_CHECK": "网卡健康检查",
    "SNAT_SPORT_EXHAUSTION_CHECK": "SNAT 源端口耗尽检查",
    "SSH_API_CHECK": "SSH/API 访问控制检查",
    "PATCH_INFO_CHECK": "补丁信息检查",
    "REPORT_CHECK": "报表任务检查",
    "WEAK_PASSWORD_CHECK": "弱密码检查",
    "SSL_POLICY_CHECK": "SSL 安全策略检查",
    "IP_LIMIT_CHECK": "管理登录 IP 限制检查",
    "OPEN_PORT_CHECK": "开放端口检查",
}


_CHECK_DESCRIPTIONS = {
    "APP_VERSION_CHECK": "应用版本检查用于确认当前 AD 应用版本是否已正确采集。",
    "ADMIN_ROLE_CHECK": "管理员角色检查用于确认管理账号角色配置是否完整。",
    "DEVICE_SAFE_CHECK": "设备安全状态检查用于确认设备安全检查功能是否开启。",
    "DNS_DETECT_CHECK": "DNS 探测配置检查用于确认 DNS 代理和探测相关配置是否符合预期。",
    "DNAT_CHECK": "DNAT 配置检查用于确认 DNAT 映射规则是否存在潜在风险。",
    "HEARTBEAT_CHECK": "心跳状态检查用于确认双机或集群心跳链路是否正常。",
    "STATIC_IP_CHECK": "静态 IP 配置检查用于确认静态地址配置是否存在规划风险。",
    "DNS64_CHECK": "DNS64 检查用于确认 DNS64 功能是否按需开启。",
    "POLICY_ROUTE_CHECK": "策略路由检查用于确认策略路由变更是否存在异常。",
    "SNMP_ALARM_CHECK": "SNMP Trap 告警检查用于确认告警通知是否开启。",
    "DNS_PRE_RULE_CHECK": "DNS 前置策略检查用于确认 DNS 前置策略配置是否符合预期。",
    "DNS_SERVER_CHECK": "DNS 服务器检查用于确认 DNS 服务配置是否符合预期。",
    "EMAIL_ALARM_CHECK": "邮件告警检查用于确认邮件告警通知是否开启。",
    "PROXY_POLICY_CHECK": "代理策略检查用于确认代理策略配置是否存在风险。",
    "SYSLOG_CHECK": "Syslog 检查用于确认日志外发配置是否开启。",
    "AUTO_UPDATE_CHECK": "自动更新检查用于确认自动更新功能是否开启。",
    "CPU_CHECK": "CPU 使用率检查用于确认巡检期间 CPU 使用率是否处于正常范围。",
    "LOG_CHECK": "日志状态检查用于确认设备错误日志数量是否异常。",
    "RUNNING_TIME_CHECK": "设备运行时间检查用于确认设备运行时长是否正常。",
    "FILE_CHECK": "设备文件检查用于确认设备关键文件是否存在异常。",
    "NIC_STATE_CHECK": "网卡状态检查用于确认物理网卡链路和状态是否正常。",
    "CORE_PROCESS_CHECK": "核心进程检查用于确认设备核心进程是否正常运行。",
    "KERNEL_LOG_CHECK": "内核日志检查用于确认内核日志中是否存在错误。",
    "REMOTE_MT_CHECK": "远程维护检查用于确认远程维护功能状态是否符合要求。",
    "BLACKBOX_LOG_CHECK": "黑匣子日志检查用于确认黑盒日志中是否存在异常。",
    "KERNEL_BOOT_LOG_CHECK": "内核启动日志检查用于确认启动日志中是否存在异常。",
    "DISK_CHECK": "磁盘使用率检查用于确认磁盘空间和采集状态是否正常。",
    "CRASH_LOG_CHECK": "崩溃日志检查用于确认设备是否产生崩溃日志。",
    "MEMORY_CHECK": "内存使用率检查用于确认巡检期间内存使用率是否处于正常范围。",
    "SPEED_CARD_CHECK": "加速卡状态检查用于确认 SSL/压缩等硬件加速卡是否正常工作。",
    "FAN_STATE_CHECK": "风扇状态检查用于确认风扇模块是否处于正常状态。",
    "POWER_STATE_CHECK": "电源状态检查用于确认电源模块是否处于正常状态。",
    "BIOS_VERSION_CHECK": "BIOS 版本检查用于确认 BIOS 版本是否需要关注。",
    "ALARM_LOG_CHECK": "告警日志检查用于确认当前告警日志数量是否异常。",
    "MEMORY_LEAK_CHECK": "内存泄漏风险检查用于确认共享内存和信号量是否存在异常。",
    "DEVICE_CONNECTION_CHECK": "设备连接检查用于确认设备管理网口连通性是否正常。",
    "CONFIG_ID_CONFLICT_CHECK": "配置 ID 冲突检查用于确认配置对象 ID 是否存在冲突。",
    "NIC_HEALTH_CHECK": "网卡健康检查用于确认网卡健康状态是否正常。",
    "SNAT_SPORT_EXHAUSTION_CHECK": "SNAT 源端口耗尽检查用于确认 SNAT 源端口是否存在耗尽风险。",
    "SSH_API_CHECK": "SSH/API 访问控制检查用于确认 SSH 和 API 访问控制是否开启。",
    "PATCH_INFO_CHECK": "补丁信息检查用于确认设备补丁信息是否可用。",
    "REPORT_CHECK": "报表任务检查用于确认报表服务状态是否正常。",
    "WEAK_PASSWORD_CHECK": "弱密码检查用于确认是否存在弱密码账号。",
    "SSL_POLICY_CHECK": "SSL 安全策略检查用于确认是否启用了不安全算法或协议。",
    "IP_LIMIT_CHECK": "管理登录 IP 限制检查用于确认管理登录来源限制是否开启。",
    "OPEN_PORT_CHECK": "开放端口检查用于确认是否存在不必要的风险端口开放。",
}


def check_label(key: str) -> str:
    """Return a user-facing Chinese label for a check id."""
    return _CHECK_LABELS.get(key, key.replace("_CHECK", "").replace("_", " ").title())


def check_description(key: str) -> str:
    """Return the native/fallback user-facing description for a check id."""
    return _CHECK_DESCRIPTIONS.get(key, f"{check_label(key)}用于确认该巡检项是否符合设备预期。")


_CHECK_SOURCE_FIELDS = {
    "APP_VERSION_CHECK": ["ad_appversion"],
    "ADMIN_ROLE_CHECK": ["admin"],
    "DEVICE_SAFE_CHECK": ["security_check_state"],
    "DNS_DETECT_CHECK": ["dns_proxy_enabled"],
    "DNAT_CHECK": ["dnat_dst_ip2net_if"],
    "HEARTBEAT_CHECK": ["heartbeat_state"],
    "STATIC_IP_CHECK": ["static_ip_config"],
    "CLUSTER_STATE_CHECK": ["cluster_state"],
    "VIRTUAL_MAC_CHECK": ["cluster_virtual_mac"],
    "DUAL_STATE_CHECK": ["ms_state"],
    "POOL_PERSIST_CHECK": ["node_pool_persist"],
    "STATIC_ROUTE_CHECK": ["static_route_health_check"],
    "POOL_HEALTH_CHECK": ["node_pool_health_check_detect"],
    "RS_LEVEL_CHECK": ["rs_level_check"],
    "APP_GROUP_CHECK": ["cluster_appgroup_unit"],
    "DNS_SERVER_STATE_CHECK": ["dns_server_health"],
    "LINK_HEALTH_CHECK": ["link_health_check"],
    "STATIC_PROXIMITY_CHECK": ["static_proximity_check"],
    "DNS64_CHECK": ["dns64_enabled"],
    "POLICY_ROUTE_CHECK": ["newly_added_policy_route"],
    "MANAGE_IP_CHECK": ["ms_manage_ip_difference"],
    "SNMP_TRAPS_CHECK": ["snmp_alarm_enabled"],
    "DNS_REFLECT_CHECK": ["dns_pre_rule_exist"],
    "DNS_SERVER_CHECK": ["dns_server_enabled"],
    "DNAT_PORT_CHECK": ["dnat_port_and_proto"],
    "SESSION_SYNC_CHECK": ["cluster_session_sync"],
    "MAIL_WARN_CHECK": ["email_alarm_enabled"],
    "VIP_POOL_CHECK": ["virtual_ip_pool_check"],
    "PROXY_POLICY_CHECK": ["proxy_policy_check"],
    "DNS_MAP_PS_CHECK": ["dns_map_persist_enable"],
    "WAN_BANDWIDTH_CHECK": ["wan_max_bandwidth"],
    "FAULT_SWITCH_CHECK": ["cluster_fault_switch_enabled"],
    "SYSLOG_CHECK": ["syslog_enabled"],
    "AUTO_UPDATE_CHECK": ["auto_update"],
    "CPU_CHECK": ["base_cpu_usage", "base_cpu_mpstat"],
    "LOG_CHECK": ["base_log_error_exist"],
    "DEVICE_RUN_TIME": ["base_running_time"],
    "DEVICE_FILE_CHECK": ["base_file_ds"],
    "NIC_STATE_CHECK": ["base_eth_abnormal"],
    "CORE_PROCESS_CHECK": ["base_core_process_lack"],
    "KERNEL_LOG_CHECK": ["base_kernel_log"],
    "REMOTE_MAINTAIN_CHECK": ["remote_mt"],
    "BLACK_BOX_CHECK": ["base_blackbox_state"],
    "DMESG_DATA_CHECK": ["base_blackbox_dmesg"],
    "DISK_CHECK": ["disk_info"],
    "CRASH_LOG_CHECK": ["base_crash_time"],
    "MEMORY_CHECK": ["snmp_mem_rate"],
    "SPEED_CARD_CHECK": ["acceleration"],
    "FAN_STATE_CHECK": ["fan_state"],
    "POWER_STATE_CHECK": ["power_state"],
    "BIOS_VERSION_CHECK": ["bios_update_state"],
    "WARN_LOG_CHECK": ["alarms_enabled"],
    "MEMORY_LEAK_CHECK": ["shm_sem_state"],
    "DEVICE_CONNECTION_CHECK": ["base_eth_info"],
    "COREDUMP_INFO_CHECK": ["base_no_core"],
    "CONFIG_ID_CONFLICT_CHECK": ["id_conflict_list"],
    "NIC_HEALTH_CHECK": ["I350_nic_state", "82599_nic_state"],
    "SNAT_SPORT_EXHAUSTION_CHECK": ["snat_sport_exhaustion_log_num"],
    "SSH_API_CHECK": ["ssh_authority"],
    "PATCH_INFO_CHECK": ["patch_info"],
    "REPORT_CHECK": ["base_report_stab"],
    "WEAK_PASSWORD_CHECK": ["weak_pwd"],
    "SSL_POLICY_CHECK": ["unsafe_algorithm", "unsafe_protocol"],
    "IP_LIMIT_CHECK": ["enable_iplimit"],
    "OPEN_PORT_CHECK": ["dangerous_port"],
}


def _collect_native_descriptions(data: Dict[str, Any]) -> Dict[str, str]:
    """Collect raw API description text keyed by native field/check names."""
    descriptions: Dict[str, str] = {}

    def add(key: Any, value: Any) -> None:
        if not key or value is None:
            return
        text = str(value).strip()
        if text:
            descriptions.setdefault(str(key), text)

    for container_key in ("descriptions", "description", "check_descriptions"):
        container = data.get(container_key)
        if isinstance(container, dict):
            for key, value in container.items():
                add(key, value)

    for key, value in data.items():
        if isinstance(value, dict):
            add(key, value.get("description") or value.get("desc"))

    for container_key in ("items", "check_items", "check_results"):
        container = data.get(container_key)
        if isinstance(container, dict):
            for key, value in container.items():
                if isinstance(value, dict):
                    add(key, value.get("description") or value.get("desc"))
        elif isinstance(container, list):
            for item in container:
                if not isinstance(item, dict):
                    continue
                key = item.get("field") or item.get("key") or item.get("name") or item.get("id") or item.get("check")
                add(key, item.get("description") or item.get("desc"))

    return descriptions


def _extract_percent_values(value: Any, key_hint: str = "") -> List[float]:
    values: List[float] = []
    if isinstance(value, dict):
        for key, item in value.items():
            values.extend(_extract_percent_values(item, str(key)))
        return values
    if isinstance(value, (list, tuple, set)):
        for item in value:
            values.extend(_extract_percent_values(item, key_hint))
        return values
    if isinstance(value, str):
        values.extend(float(match.group(1)) for match in re.finditer(r"(-?\d+(?:\.\d+)?)\s*%", value))
        return values
    key = key_hint.lower()
    if isinstance(value, (int, float)) and any(token in key for token in ("percent", "pct", "usage", "used", "rate")):
        values.append(float(value))
    return values


def _disk_check_status_and_detail(disk: Any) -> Tuple[str, str]:
    if not disk:
        return "warn", "无磁盘信息"

    percents = _extract_percent_values(disk)
    if not percents:
        return "pass", "磁盘信息已采集"

    max_percent = max(percents)
    status = "fail" if max_percent >= 90 else ("warn" if max_percent >= 80 else "pass")
    return status, f"最大使用率={max_percent:g}%"


def _text_values(value: Any) -> List[str]:
    if isinstance(value, dict):
        texts: List[str] = []
        for item in value.values():
            texts.extend(_text_values(item))
        return texts
    if isinstance(value, (list, tuple, set)):
        texts = []
        for item in value:
            texts.extend(_text_values(item))
        return texts
    return [str(value)]


def _connection_check_status_and_detail(eth_info: Any) -> Tuple[str, str]:
    texts = _text_values(eth_info)
    has_yes = any(re.search(r"Link\s+detected:\s*yes", text, re.IGNORECASE) for text in texts)
    has_no = any(re.search(r"Link\s+detected:\s*no", text, re.IGNORECASE) for text in texts)
    if has_yes:
        return "pass", "检测到已连接网口"
    if has_no:
        return "fail", "未检测到已连接网口"
    return "warn", "未获取到明确网口连接状态"


def _not_applicable_detail(value: Any, reason: str) -> str:
    text = str(value).strip()
    return f"{reason}；设备返回：{text}" if text else reason


def analyze(data: Dict[str, Any]) -> Dict[str, Any]:
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
            "summary": {"total": 0, "pass": 0, "fail": 0, "warn": 0, "not_applicable": 0, "score": 0},
            "health_scores": {
                "feature": {"pass": 0, "total": 0, "not_applicable": 0, "score": 0},
                "health": {"pass": 0, "total": 0, "not_applicable": 0, "score": 0},
                "secure": {"pass": 0, "total": 0, "not_applicable": 0, "score": 0},
                "overall": 0,
            },
            "suggestions": [],
        }
    check_results = {}
    data_keys = set(data.keys())  # ad.json 中实际存在的字段集合
    native_descriptions = _collect_native_descriptions(data)

    def has(*keys: str) -> bool:
        """检查 ad.json 中是否包含至少一个指定字段"""
        return any(k in data_keys for k in keys)

    def native_description(name: str) -> str:
        for key in [name, *_CHECK_SOURCE_FIELDS.get(name, [])]:
            desc = native_descriptions.get(key)
            if desc:
                return desc
        return ""

    def check(name: str, status: str, value: str = "", detail: str = "") -> None:
        check_results[name] = {
            "name": check_label(name),
            "status": status,
            "value": str(value),
            "detail": detail,
            "description": native_description(name) or check_description(name),
        }

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
              "安全检查已开启" if sec_state else "设备安全检查未开启")

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
        cluster_na = cluster in ("NOT_CLUSTER_MODE", "CLUSTER_UNABLE", "CLUSTER_UNABLE_OR_NOTIN")
        check("CLUSTER_STATE_CHECK",
              "not_applicable" if cluster_na else ("pass" if cluster == "NORMAL" else "warn"),
              cluster,
              detail=_not_applicable_detail(cluster, "设备未启用集群，集群状态检查不适用") if cluster_na else "")

    if has("cluster_virtual_mac"):
        # 11. VIRTUAL_MAC_CHECK
        vmac = data.get("cluster_virtual_mac", "CLUSTER_UNABLE")
        vmac_na = vmac == "CLUSTER_UNABLE"
        check("VIRTUAL_MAC_CHECK",
              "not_applicable" if vmac_na else "pass",
              vmac,
              detail=_not_applicable_detail(vmac, "设备未启用集群，虚拟 MAC 检查不适用") if vmac_na else "")

    if has("ms_state"):
        # 12. DUAL_STATE_CHECK
        ms = data.get("ms_state", "CLUSTER_UNABLE_OR_NOTIN")
        ms_na = ms in ("CLUSTER_UNABLE", "CLUSTER_UNABLE_OR_NOTIN", "NOT_CLUSTER_MODE")
        check("DUAL_STATE_CHECK",
              "not_applicable" if ms_na else ("pass" if ms == "NORMAL" else "warn"),
              ms,
              detail=_not_applicable_detail(ms, "设备未启用双机/集群，双机状态检查不适用") if ms_na else "")

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
        ag_na = ag == "CLUSTER_UNABLE"
        check("APP_GROUP_CHECK",
              "not_applicable" if ag_na else "pass",
              ag,
              detail=_not_applicable_detail(ag, "设备未启用集群，应用组单元检查不适用") if ag_na else "")

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
        mip_na = mip == "CLUSTER_UNABLE"
        check("MANAGE_IP_CHECK",
              "not_applicable" if mip_na else "fail",
              mip,
              detail=_not_applicable_detail(mip, "设备未启用集群，管理 IP 一致性检查不适用") if mip_na else "")

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
        ss_na = ss == "CLUSTER_UNABLE"
        check("SESSION_SYNC_CHECK",
              "not_applicable" if ss_na else ("pass" if ss == "NORMAL" else "warn"),
              ss,
              detail=_not_applicable_detail(ss, "设备未启用集群，会话同步检查不适用") if ss_na else "")

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
        fs_na = fs == "CLUSTER_UNABLE"
        check("FAULT_SWITCH_CHECK",
              "not_applicable" if fs_na else ("pass" if fs == "true" else "warn"),
              fs,
              detail=_not_applicable_detail(fs, "设备未启用集群，故障切换检查不适用") if fs_na else "")

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
              "pass" if rm == "true" else "warn",
              "远程维护已开启" if rm == "true" else "远程维护未开启")

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
        disk_status, disk_detail = _disk_check_status_and_detail(disk)
        check("DISK_CHECK", disk_status, disk_detail)

    if has("base_crash_time"):
        # 48. CRASH_LOG_CHECK
        crash = data.get("base_crash_time", [])
        check("CRASH_LOG_CHECK", "pass" if not crash else "fail",
              f"{len(crash)} 条" if crash else "无")

    if has("snmp_mem_rate"):
        # 49. MEMORY_CHECK
        mr = data.get("snmp_mem_rate", 0)
        check("MEMORY_CHECK",
              "pass" if mr < 80 else ("warn" if mr < 90 else "fail"),
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
        fan_na = fan == -1
        check("FAN_STATE_CHECK",
              "not_applicable" if fan_na else ("pass" if fan == 1 else "fail"),
              str(fan),
              detail="设备未提供该硬件传感器数据" if fan_na else "")

    if has("power_state"):
        # 52. POWER_STATE_CHECK
        ps = data.get("power_state", -1)
        ps_na = ps == -1
        check("POWER_STATE_CHECK",
              "not_applicable" if ps_na else ("pass" if ps == 1 else "fail"),
              str(ps),
              detail="设备未提供该硬件传感器数据" if ps_na else "")

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
        conn_status, conn_detail = _connection_check_status_and_detail(eth_info)
        check("DEVICE_CONNECTION_CHECK", conn_status, conn_detail)

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
              "SSH/API 访问控制已开启" if ssh else "SSH/API 访问控制未开启")

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
              "报表服务状态正常" if br else "报表服务状态异常")

    if has("weak_pwd"):
        # 64. WEAK_PASSWORD_CHECK
        wp = data.get("weak_pwd", [])
        check("WEAK_PASSWORD_CHECK", "pass" if not wp else "fail",
              f"{len(wp)} 个弱密码" if wp else "无")

    if has("unsafe_algorithm", "unsafe_protocol"):
        # 65. SSL_POLICY_CHECK
        ua = data.get("unsafe_algorithm", False)
        up = data.get("unsafe_protocol", False)
        ssl_detail = "未发现不安全算法或协议"
        if ua and up:
            ssl_detail = "存在不安全算法和不安全协议"
        elif ua:
            ssl_detail = "存在不安全算法"
        elif up:
            ssl_detail = "存在不安全协议"
        check("SSL_POLICY_CHECK",
              "pass" if not ua and not up else "fail",
              ssl_detail)

    if has("enable_iplimit"):
        # 66. IP_LIMIT_CHECK
        ipl = data.get("enable_iplimit", "")
        check("IP_LIMIT_CHECK",
              "pass" if ipl == "true" else "fail",
              "已启用管理登录 IP 限制" if ipl == "true" else "未启用管理登录 IP 限制")

    if has("dangerous_port"):
        # 67. OPEN_PORT_CHECK
        dp = data.get("dangerous_port", [])
        check("OPEN_PORT_CHECK",
              "pass" if not dp else "warn",
              f"{len(dp)} 个风险端口: {', '.join(str(p) for p in dp[:3])}" if dp else "无")

    # ── 诊断：检测 ad.json 中存在但未被映射的字段 ─────────────────────
    _checked_fields = {
        # 功能巡检
        "ad_appversion", "admin", "security_check_state", "dns_proxy_enabled",
        "dnat_dst_ip2net_if", "heartbeat_state", "static_ip_config",
        "cluster_state", "cluster_virtual_mac", "ms_state", "node_pool_persist",
        "static_route_health_check", "node_pool_health_check_detect",
        "rs_level_check", "cluster_appgroup_unit", "dns_server_health",
        "link_health_check", "static_proximity_check", "dns64_enabled",
        "newly_added_policy_route", "ms_manage_ip_difference",
        "snmp_alarm_enabled", "dns_pre_rule_exist", "dns_server_enabled",
        "dnat_port_and_proto", "cluster_session_sync", "email_alarm_enabled",
        "virtual_ip_pool_check", "proxy_policy_check", "dns_map_persist_enable",
        "wan_max_bandwidth", "cluster_fault_switch_enabled", "syslog_enabled",
        # 健康巡检
        "auto_update", "base_cpu_usage", "base_cpu_mpstat",
        "base_log_error_exist", "base_running_time", "base_file_ds",
        "base_eth_abnormal", "base_core_process_lack", "base_kernel_log",
        "remote_mt", "base_blackbox_state", "base_blackbox_dmesg", "disk_info",
        "base_crash_time", "snmp_mem_rate", "acceleration", "fan_state",
        "power_state", "bios_update_state", "alarms_enabled", "shm_sem_state",
        "base_eth_info", "base_no_core", "id_conflict_list", "I350_nic_state",
        "82599_nic_state", "snat_sport_exhaustion_log_num",
        # 安全巡检
        "ssh_authority", "patch_info", "base_report_stab", "weak_pwd",
        "unsafe_algorithm", "unsafe_protocol", "enable_iplimit", "dangerous_port",
        # 设备信息字段（不产生检查项，但占位避免误报）
        "version", "gateway_id", "dst_ip",
    }
    _unmapped = data_keys - _checked_fields
    if _unmapped and os.environ.get("AD_CHECK_DEBUG_UNMAPPED") == "1":
        print(f"[analyze] 未映射的 ad.json 字段 ({len(_unmapped)}): {sorted(_unmapped)}", file=sys.stderr)

    # ─────────────────────────────────────────────────────────────────────
    # 汇总（仅统计当前场景的检查项）
    # ─────────────────────────────────────────────────────────────────────

    pass_count = sum(1 for k, v in check_results.items() if v["status"] == "pass")
    fail_count = sum(1 for k, v in check_results.items() if v["status"] == "fail")
    warn_count = sum(1 for k, v in check_results.items() if v["status"] == "warn")
    not_applicable_count = sum(1 for k, v in check_results.items() if v["status"] == "not_applicable")
    total = pass_count + fail_count + warn_count
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
    def _dimension_scores(keys: List[str]) -> Dict[str, int]:
        p = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "pass")
        w = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "warn")
        n = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "not_applicable")
        t = sum(1 for k in keys if k in check_results and check_results[k]["status"] in ("pass", "fail", "warn"))
        s = round((p + w * 0.5) / t * 100) if t else 0
        return {"pass": p, "total": t, "not_applicable": n, "score": s}

    f_score = _dimension_scores(feature_keys)
    h_score = _dimension_scores(health_keys)
    s_score = _dimension_scores(secure_keys)
    active_scores = [item["score"] for item in (f_score, h_score, s_score) if item["total"] > 0]
    overall = round(sum(active_scores) / len(active_scores)) if active_scores else 0

    # ── 生成优化建议 ───────────────────────────────────────────────────
    suggestions = []
    for key, result in check_results.items():
        if result["status"] in ("fail", "warn"):
            check_name = check_label(key)
            entry = {
                "check": key,
                "check_name": check_name,
                "priority": "高" if result["status"] == "fail" else "中",
                "suggestion": _suggestion_for_check(key, check_name, result),
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
            "not_applicable": not_applicable_count,
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

_DETAIL_FIELD_LABELS = {
    "admin": "管理员角色",
    "dns_proxy_enabled": "DNS 代理",
    "heartbeat_state": "心跳状态",
    "rs_level_check": "节点级别检查",
    "static_proximity_check": "静态就近性检查",
    "dns64_enabled": "DNS64",
    "newly_added_policy_route": "新增策略路由",
    "snmp_alarm_enabled": "SNMP Trap 告警",
    "dns_pre_rule_exist": "DNS 前置策略",
    "dns_server_enabled": "DNS 服务",
    "email_alarm_enabled": "邮件告警",
    "proxy_policy_check": "代理策略",
    "syslog_enabled": "Syslog",
    "auto_update": "自动更新",
    "max": "最大值",
    "acceleration": "加速卡状态",
    "shm_sem_state": "共享内存/信号量",
    "base_no_core": "Core 文件状态",
    "I350": "I350 网卡",
    "82599": "82599 网卡",
    "security_check_state": "设备安全检查",
    "remote_mt": "远程维护",
    "ssh_authority": "SSH/API 访问控制",
    "base_report_stab": "报表服务状态",
    "algorithm": "不安全算法",
    "protocol": "不安全协议",
    "enable_iplimit": "管理登录 IP 限制",
}

_DETAIL_VALUE_REPLACEMENTS = {
    "true": "是",
    "false": "否",
    "True": "是",
    "False": "否",
    "NORMAL": "正常",
    "normal": "正常",
    "NOT_CLUSTER_MODE": "非集群模式",
    "CLUSTER_UNABLE": "集群不可用",
    "CLUSTER_UNABLE_OR_NOTIN": "未加入集群或集群不可用",
}


def _friendly_detail_value(field: str, raw_value: str) -> str:
    value = raw_value.strip().strip("\"'")
    if value == "":
        return "未配置"
    lower = value.lower()
    if lower in ("true", "false"):
        enabled_word = "已开启" if lower == "true" else "未开启"
        pass_word = "通过" if lower == "true" else "未通过"
        if field.endswith("_enabled") or field in {
            "dns64_enabled", "syslog_enabled", "auto_update", "enable_iplimit", "remote_mt",
        }:
            return enabled_word
        if field.endswith("_state") or field.endswith("_check") or field in {
            "admin", "ssh_authority", "security_check_state", "base_report_stab",
            "shm_sem_state",
        }:
            return pass_word
    return _DETAIL_VALUE_REPLACEMENTS.get(value, value)


def _user_detail(text: Any) -> str:
    detail = str(text or "").replace("\n", " ")

    def repl(match: re.Match[str]) -> str:
        field = match.group(1)
        value = match.group(2)
        label = _DETAIL_FIELD_LABELS.get(field, field.replace("_", " "))
        return f"{label}：{_friendly_detail_value(field, value)}"

    detail = re.sub(r"\b([A-Za-z][A-Za-z0-9_]*|82599)=([^\s,|]*)", repl, detail)
    return detail.replace("`ad.json`", "设备巡检报告").replace("ad.json", "设备巡检报告")


def _table_cell(text: Any) -> str:
    return str(text or "").replace("\n", " ").replace("|", "\\|").strip()


def _first_int(text: str) -> Optional[int]:
    match = re.search(r"-?\d+", text or "")
    return int(match.group(0)) if match else None


def _friendly_check_detail(check_key: str, result: Dict[str, Any]) -> str:
    status = result.get("status", "")
    value = _user_detail(result.get("detail") or result.get("value") or "")
    raw_value = str(result.get("value", "")).strip()
    is_ok = status == "pass"

    if check_key == "APP_VERSION_CHECK":
        return f"当前应用版本：{value}" if value else "未获取到应用版本信息"
    if check_key == "ADMIN_ROLE_CHECK":
        return "管理员角色配置正常" if is_ok else "管理员角色未正确配置，可能影响设备管理权限完整性"
    if check_key == "DEVICE_SAFE_CHECK":
        return "设备安全检查已开启" if is_ok else "设备安全检查未开启"
    if check_key == "AUTO_UPDATE_CHECK":
        return "自动更新已开启" if is_ok else "自动更新未开启，请确认是否符合补丁管理要求"
    if check_key == "CPU_CHECK":
        current = value.replace("最大值：", "").strip()
        return f"本次采集最大 CPU 使用率：{current}" if current else "未获取到 CPU 使用率"
    if check_key == "MEMORY_CHECK":
        current = value.replace("使用率：", "").strip()
        return f"本次采集内存使用率：{current}" if current else "未获取到内存使用率"
    if check_key == "LOG_CHECK":
        count = _first_int(value)
        return "未检测到错误日志" if count == 0 else f"检测到 {count} 条错误日志，建议结合日志时间点排查" if count is not None else value
    if check_key == "DEVICE_FILE_CHECK":
        count = _first_int(value)
        return "未发现异常文件" if count == 0 else f"检测到 {count} 项文件异常" if count is not None else value
    if check_key == "KERNEL_LOG_CHECK":
        count = _first_int(value)
        return "未检测到内核错误日志" if count == 0 else f"检测到 {count} 条内核日志异常" if count is not None else value
    if check_key == "BLACK_BOX_CHECK":
        count = _first_int(value)
        return "黑盒日志未发现异常" if count == 0 else f"黑盒日志状态异常，返回值：{value}" if value else "黑盒日志状态异常"
    if check_key == "DMESG_DATA_CHECK":
        return "启动日志未发现异常" if is_ok else f"启动日志存在异常记录：{value}"
    if check_key == "DISK_CHECK":
        return "磁盘信息采集正常" if is_ok else "未获取到磁盘使用率信息，需确认磁盘采集是否正常"
    if check_key == "CRASH_LOG_CHECK":
        count = _first_int(value)
        return "未发现崩溃日志" if count == 0 else f"检测到 {count} 条崩溃日志" if count is not None else value
    if check_key == "SPEED_CARD_CHECK":
        return "加速卡状态正常" if is_ok else f"加速卡状态异常或未采集到正常值（{value}）"
    if check_key == "FAN_STATE_CHECK":
        return "风扇状态正常" if raw_value == "1" else "未采集到明确正常的风扇状态" if raw_value == "-1" else f"风扇状态异常，返回值：{value}"
    if check_key == "POWER_STATE_CHECK":
        return "电源状态正常" if raw_value == "1" else "未采集到明确正常的电源状态" if raw_value == "-1" else f"电源状态异常，返回值：{value}"
    if check_key == "BIOS_VERSION_CHECK":
        return "未发现需要关注的 BIOS 更新信息" if is_ok else f"BIOS 状态需要确认：{value}"
    if check_key == "WARN_LOG_CHECK":
        count = _first_int(value)
        return f"当前告警日志数量：{count}" if count is not None and count >= 0 else "未获取到告警日志状态"
    if check_key == "MEMORY_LEAK_CHECK":
        return "共享内存/信号量状态正常" if is_ok else "共享内存/信号量异常，可能存在内存泄漏风险"
    if check_key == "DEVICE_CONNECTION_CHECK":
        return "设备管理网口连通正常" if is_ok else "设备管理网口未连通或链路状态异常"
    if check_key == "COREDUMP_INFO_CHECK":
        return "未发现 Core 文件" if is_ok else f"检测到 Core 文件状态异常：{value}"
    if check_key == "NIC_HEALTH_CHECK":
        return "网卡健康状态正常" if is_ok else f"网卡健康状态需要确认：{value}"
    if check_key == "SNAT_SPORT_EXHAUSTION_CHECK":
        count = _first_int(value)
        return "未发现 SNAT 源端口耗尽风险" if count == 0 else f"检测到 {count} 条 SNAT 源端口耗尽相关记录" if count is not None else value
    if check_key == "SSH_API_CHECK":
        return "SSH/API 访问控制已开启" if is_ok else "SSH/API 访问控制未开启"
    if check_key == "PATCH_INFO_CHECK":
        count = _first_int(value)
        return f"检测到 {count} 个补丁信息" if is_ok and count is not None else "未检测到已安装补丁信息"
    if check_key == "REPORT_CHECK":
        return "报表服务状态正常" if is_ok else "报表服务状态异常"
    if check_key == "WEAK_PASSWORD_CHECK":
        count = _first_int(value)
        return "未发现弱密码账户" if is_ok else f"检测到 {count} 个弱密码账户" if count is not None else value
    if check_key == "IP_LIMIT_CHECK":
        return "已启用管理登录 IP 限制" if is_ok else "未启用管理登录 IP 限制，管理入口暴露范围偏大"
    if check_key == "OPEN_PORT_CHECK":
        return value.replace("个风险端口: ", "个风险端口开放：").replace("个风险端口:", "个风险端口开放：") if value else "未发现风险端口开放"

    if value in ("0", "0 条", "无", "正常"):
        return "未发现异常" if is_ok else value
    return value or ("检查通过" if is_ok else "设备返回异常状态")


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

    def status_label(s: str) -> str:
        return {"pass": "✅ 正常", "fail": "❌ 异常", "warn": "❌ 异常", "not_applicable": "➖ 不适用"}.get(s, s)

    def score_icon_for(val: Union[int, float]) -> str:
        return "🟢" if val >= 90 else ("🟡" if val >= 70 else "🔴")

    def risk_label(val: Union[int, float]) -> str:
        return "低风险" if val >= 90 else ("中风险" if val >= 70 else "高风险")

    def overall_status() -> str:
        return "✅ 正常" if summary["fail"] + summary["warn"] == 0 else "❌ 发现异常"

    def priority_label(priority: str) -> str:
        return {"高": "🔴 高", "中": "🟡 中", "低": "🟢 低"}.get(priority, priority)

    def rate_cell(cat: Dict[str, int]) -> str:
        return f"{cat['rate']}%" if cat["total"] else "未覆盖"

    def score_cell(score: Union[int, float], total: int) -> str:
        return f"{score_icon_for(score)} {score}/100" if total else "未覆盖"

    def risk_cell(score: Union[int, float], total: int) -> str:
        return risk_label(score) if total else "未覆盖"

    def cat_summary(keys: List[str]) -> Dict[str, int]:
        p = sum(1 for k in keys if k in results and results[k]["status"] == "pass")
        f = sum(1 for k in keys if k in results and results[k]["status"] == "fail")
        w = sum(1 for k in keys if k in results and results[k]["status"] == "warn")
        n = sum(1 for k in keys if k in results and results[k]["status"] == "not_applicable")
        applicable_total = p + f + w
        rate = round(p / max(applicable_total, 1) * 100)
        return {
            "total": applicable_total + n,
            "applicable_total": applicable_total,
            "pass": p,
            "fail": f,
            "warn": w,
            "not_applicable": n,
            "rate": rate,
        }

    f = cat_summary(feature_keys)
    h = cat_summary(health_keys)
    s = cat_summary(secure_keys)

    # ── 所有检查项分 pass / fail-warn 两组 ───────────────────────────
    all_keys = feature_keys + health_keys + secure_keys

    def all_check_rows() -> str:
        rows = []
        for k in all_keys:
            if k in results:
                r = results[k]
                check_name = r.get("name") or check_label(k)
                description = r.get("description") or check_description(k)
                if r.get("status") == "not_applicable":
                    reason = _user_detail(r.get("detail") or r.get("value") or "")
                    if reason and reason not in description:
                        description = f"{description}（{reason}）"
                rows.append(
                    f"| {_table_cell(check_name)} | {_table_cell(description)} | "
                    f"{_table_cell(status_label(r['status']))} |"
                )
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
        suggestion_rows.append(
            f"| {_table_cell(priority_label(sug.get('priority', '')))} | {_table_cell(sug.get('check_name') or check_label(sug.get('check', '')))} | {_table_cell(_user_detail(sug.get('suggestion', '')))} |"
        )
    suggestions_table = "\n".join(suggestion_rows) if suggestion_rows else "| - | - | 暂无需要处理的异常项 |"

    # 设备中文名（从 devices.json 匹配，降级到设备 IP）
    device_host = meta.get("host", "?")
    device_label = meta.get("device_name") or _extract_ip(device_host)
    try:
        import json as _json
        _devices_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "devices.json")
        if os.path.isfile(_devices_path):
            with open(_devices_path, encoding="utf-8") as _f:
                _data = _json.load(_f)
            for _d in _data.get("devices", []):
                _hosts = [_d.get("host", ""), _d.get("host", "").replace("https://", "http://")]
                if device_host in _hosts:
                    device_label = _d.get("name", device_label)
                    break
    except Exception:
        pass
    device_ip = _extract_ip(device_host)

    # 巡检时间格式化
    raw_time = meta.get("start_time", "")
    if raw_time and len(raw_time) == 14:
        # 20260518193542 → 2026-05-18 19:35:42
        check_time = f"{raw_time[:4]}-{raw_time[4:6]}-{raw_time[6:8]} {raw_time[8:10]}:{raw_time[10:12]}:{raw_time[12:]}"
    else:
        check_time = raw_time

    progress_text = str(meta.get("progress_text", "") or "").strip()
    progress_value = _progress_count_value(progress_text) or progress_text
    progress_line = f"- 巡检进度：{progress_value}\n" if progress_value else ""

    # ── 检查项详情渲染（单设备全量展示正常+异常） ────────
    has_anomaly = any(k in results and results[k]["status"] in ("fail", "warn") for k in all_keys)
    has_not_applicable = any(k in results and results[k]["status"] == "not_applicable" for k in all_keys)
    all_rows_text = all_check_rows()
    if all_rows_text:
        check_detail_section = f"""| 检查项 | 具体说明 | 状态 |
|--------|----------|------|
{all_rows_text}
"""
        if not has_anomaly:
            prefix = "> 未发现异常；不适用项已标记。\n\n" if has_not_applicable else "> 所有检查项通过，无异常。\n\n"
            check_detail_section = prefix + check_detail_section
    else:
        check_detail_section = "> 本次报告未包含可分析检查项。\n"

    return f"""## 巡检结论
- 目标：{device_label} ({device_ip})
- 场景：{meta.get("scene", "?")}
{progress_line}\
- 总体状态：{overall_status()}
- 综合评分：{score_icon} {overall}/100（{risk_label(overall)}）
- 异常数量：{summary["fail"] + summary["warn"]} 项
- 数据来源：设备巡检报告
- 巡检时间：{check_time or "-"}

## 分类统计
| 类别 | 检查项 | ✅ 正常 | ❌ 异常 | ➖ 不适用 | 得分 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 功能 | {f["total"]} | {f["pass"]} | {f["fail"] + f["warn"]} | {f["not_applicable"]} | {score_cell(stability_score, f["applicable_total"])} |
| 健康 | {h["total"]} | {h["pass"]} | {h["fail"] + h["warn"]} | {h["not_applicable"]} | {score_cell(hardware_score, h["applicable_total"])} |
| 安全 | {s["total"]} | {s["pass"]} | {s["fail"] + s["warn"]} | {s["not_applicable"]} | {score_cell(security_score, s["applicable_total"])} |

## 设备基本信息

| 信息 | 内容 |
|------|-----|
| AD 版本 | {dev["version"]} |
| 网关 ID | {dev["gateway_id"]} |
| 运行时间 | {dev["runtime"]} |

## 检查项明细

{check_detail_section}

## 优化建议

| 优先级 | 问题 | 处理建议 |
|--------|--------|------|
{suggestions_table}

## 健康评分

| 维度 | 评分 | 风险 |
|------|------:|------|
| 系统稳定性 | {score_cell(stability_score, f["total"])} | {risk_cell(stability_score, f["total"])} |
| 硬件健康 | {score_cell(hardware_score, h["total"])} | {risk_cell(hardware_score, h["total"])} |
| 安全配置 | {score_cell(security_score, s["total"])} | {risk_cell(security_score, s["total"])} |
| **综合评分** | {score_icon} **{overall}/100** | **{risk_label(overall)}** |

**说明**: 以上结果全部来自设备巡检报告，严格按照巡检返回数据进行分析。
"""


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

WINDOW = 120  # 新报告判定窗口（秒），POST 与 history start_time 差值上限


def _normalize_start_time(s: str) -> int:
    """提取字符串中所有数字，转为 YYYYMMDDHHMMSS 整数。"""
    digits = ''.join(c for c in s if c.isdigit())
    if len(digits) >= 14:
        return int(digits[:14])
    return 0


def _is_new_report(top_item: Dict[str, Any], pre_run_latest_name: str, t0_int: int) -> bool:
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


def _progress_one(client: Any, **kw: Any) -> Dict[str, Any]:
    """Single-device progress query for ThreadPoolExecutor, with NO_RUNNING fallback."""
    delay_seconds = float(kw.get("delay_seconds", 0) or 0)
    if delay_seconds < 0:
        raise ValueError("delay_seconds must be non-negative")
    if delay_seconds:
        sleeper = kw.get("_sleeper", time.sleep)
        sleeper(delay_seconds)
    result = client._request("GET", "/debug/sys/offline-check", params={"type": "progress"})
    retry_count = int(kw.get("retry_count", 4))
    retry_interval = float(kw.get("retry_interval", 2))
    for _ in range(retry_count):
        if not _progress_needs_retry(result):
            break
        time.sleep(retry_interval)
        result = client._request("GET", "/debug/sys/offline-check", params={"type": "progress"})
    if result.get("state") == "NO_RUNNING":
        try:
            history = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
            items = _response_items(history)
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
    result["progress_text"] = _format_progress_text(result)
    work_dir = kw.get("work_dir") or _default_work_dir_for_host(client.host)
    result["work_dir"] = work_dir
    _save_progress_text(work_dir, result["progress_text"], result)
    return result


def _history_one(client: Any, **kw: Any) -> Dict[str, Any]:
    """Single-device history query normalized for record-limit decisions."""
    result = client._request("GET", "/debug/sys/offline-check", params={"type": "history"})
    items = _response_items(result)
    return {
        "record_count": len(items),
        "record_limit": 5,
        "limit_reached": len(items) >= 5,
        "items": items,
    }


def _to_int(value: Any) -> Optional[int]:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _format_progress_text(result: Dict[str, Any]) -> str:
    """Render a concise user-facing progress line from the device progress API."""
    finished = _to_int(result.get("finished"))
    total = _to_int(result.get("total"))
    state = str(result.get("state", "")).upper()
    if total and total > 0 and finished is not None:
        if state in ("FINISHED", "DONE", "SUCCESS") or finished >= total:
            current = total
        else:
            current = min(finished + 1, total)
        return f"目前巡检进度：{current}/{total}"
    if result.get("history_latest", {}).get("finished"):
        return "当前没有运行中的巡检任务，最近一次巡检已完成"
    if state == "NO_RUNNING":
        return "当前没有运行中的巡检任务"
    return "巡检进度暂不可用"


def _progress_needs_retry(result: Dict[str, Any]) -> bool:
    state = str(result.get("state", "")).upper()
    total = _to_int(result.get("total"))
    finished = _to_int(result.get("finished"))
    return state in ("WAITING", "PENDING", "STARTING") and (not total) and (finished in (None, 0))


def _progress_text_has_count(progress_text: str) -> bool:
    return bool(re.search(r"\d+\s*/\s*\d+", progress_text or ""))


def _progress_count_value(progress_text: str) -> str:
    match = re.search(r"(\d+)\s*/\s*(\d+)", progress_text or "")
    if not match:
        return ""
    return f"{match.group(1)}/{match.group(2)}"


_LEADING_PROGRESS_RE = re.compile(
    r"^(?:(?:目前巡检进度[：:]\s*|目前巡检\s+)\d+\s*/\s*\d+\s*)+"
)


def _strip_leading_progress_text(markdown: str) -> str:
    stripped = markdown.lstrip()
    previous = None
    while previous != stripped:
        previous = stripped
        stripped = _LEADING_PROGRESS_RE.sub("", stripped).lstrip()
    return stripped


def _default_work_dir_for_host(host: str) -> str:
    if not isinstance(host, str) or not host:
        host = "unknown"
    return os.path.join(tempfile.gettempdir(), f"ad_check_{host_slug(host)}")


def _progress_json_path(work_dir: str) -> str:
    return os.path.join(work_dir, "_progress.json")


def _save_progress_text(work_dir: str, progress_text: str, result: Dict[str, Any]) -> None:
    """Persist progress text so the later wait report can include it."""
    if not work_dir or not progress_text:
        return
    try:
        os.makedirs(work_dir, exist_ok=True)
        snapshot = {
            "progress_text": progress_text,
            "state": result.get("state", ""),
            "finished": result.get("finished"),
            "total": result.get("total"),
        }
        with open(_progress_json_path(work_dir), "w", encoding="utf-8") as f:
            json.dump(snapshot, f, ensure_ascii=False, indent=2)
    except Exception:
        # Progress display should never make the actual inspection fail.
        return


def _load_progress_text(work_dir: str) -> str:
    if not work_dir:
        return ""
    path = _progress_json_path(work_dir)
    if not os.path.exists(path):
        return ""
    try:
        with open(path, encoding="utf-8") as f:
            snapshot = json.load(f)
    except Exception:
        return ""
    text = snapshot.get("progress_text", "")
    return text if isinstance(text, str) else ""


def _prepend_progress_text(
    markdown: str,
    work_dir: str,
    meta: Optional[Dict[str, Any]] = None,
    fallback_total: int = 0,
) -> str:
    progress_text = ""
    if meta:
        progress_text = meta.get("progress_text", "")
    if not progress_text:
        progress_text = _load_progress_text(work_dir)
    if fallback_total and not _progress_text_has_count(progress_text):
        progress_text = f"目前巡检进度：{fallback_total}/{fallback_total}"
    if not progress_text:
        return markdown
    if meta is not None:
        meta["progress_text"] = progress_text
    stripped = _strip_leading_progress_text(markdown)
    return f"{progress_text}\n\n{stripped}"


def _start_only(client: Any, scene: str = "标准巡检", force: bool = False, work_dir: Optional[str] = None) -> Dict[str, Any]:
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


def _check_one(client: Any, scene: str = "标准巡检", force: bool = False, work_dir: Optional[str] = None) -> Dict[str, Any]:
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


def _wait_one(
    client: Any,
    work_dir: Optional[str] = None,
    poll_interval: int = 5,
    timeout: int = 55,
    verbose: bool = False,
    **kw: Any,
) -> Dict[str, Any]:
    """Download and analyze a finished check report for one device."""
    import tempfile
    if work_dir is None:
        slug = host_slug(client.host)
        work_dir = os.path.join(tempfile.gettempdir(), f"ad_check_{slug}")

    meta = wait_and_download(
        client,
        work_dir=work_dir,
        poll_interval=poll_interval,
        timeout=timeout,
        verbose=verbose,
    )
    device_name = getattr(client, "device_name", "")
    if isinstance(device_name, str) and device_name and not meta.get("device_name"):
        meta["device_name"] = device_name
    with open(meta["ad_json_path"], encoding="utf-8") as f:
        data = json.load(f)
    analysis = analyze(data)
    fallback_total = len(analysis.get("check_results", {}))
    progress_text = meta.get("progress_text", "") or _load_progress_text(work_dir)
    if fallback_total and not _progress_text_has_count(progress_text):
        progress_text = f"目前巡检进度：{fallback_total}/{fallback_total}"
    if progress_text:
        meta["progress_text"] = progress_text
    report = render_markdown(analysis, meta)
    return {
        "meta": meta,
        "analysis": analysis,
        "markdown": report,
    }


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description="AD 设备巡检工具")
    sub = parser.add_subparsers(dest="command", help="子命令")

    # scenes
    p_scenes = sub.add_parser("scenes", help="获取巡检场景列表")
    p_scenes.add_argument("--host", required=True)
    p_scenes.add_argument("--username", default="admin")
    p_scenes.add_argument("--password", default="")

    # prompt
    p_prompt = sub.add_parser("prompt", help="输出固定交互提示词")
    p_prompt.add_argument("--stage", required=True, choices=["scene", "confirm"])
    p_prompt.add_argument("--target", default="AD1")
    p_prompt.add_argument("--scene", default="标准巡检")
    p_prompt.add_argument("--host", default="", help="设备地址；stage=scene 时用于从设备获取巡检场景")
    p_prompt.add_argument("--devices", default="", help="设备清单 JSON；stage=scene 时用于从设备获取巡检场景")
    p_prompt.add_argument("--device", default="", help="从 --devices 中选择单台设备")
    p_prompt.add_argument("--username", default="admin")
    p_prompt.add_argument("--password", default="")

    # run — 步骤 1-3：场景确认 + 上限检查 + 启动
    # 单设备 / --no-wait: 启动后立即退出
    # 多设备 (默认): 启动 + 等待完成 + 下载分析
    p_run = sub.add_parser("run", help="启动巡检")
    p_run.add_argument("--host", default="", help="设备地址 https://IP")
    p_run.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_run.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    p_run.add_argument("--device", default="", help="从 --devices 中选择单台设备名称，如 AD1")
    p_run.add_argument("--wait", action="store_true", help="等待巡检完成并输出报告")
    p_run.add_argument("--no-wait", action="store_true", help="仅启动，不等待完成（默认）")
    p_run.add_argument("--username", default="admin")
    p_run.add_argument("--password", default="")
    p_run.add_argument("--scene", default="标准巡检", help="巡检场景")
    p_run.add_argument("--force", action="store_true", help="强制巡检（覆盖上限）")
    p_run.add_argument("--work-dir", help="工作目录（默认 /tmp/ad_check_<timestamp>）")

    # wait — 步骤 4-6：轮询确认新报告生成 → 下载 → 分析
    p_wait = sub.add_parser("wait", help="下载巡检报告并分析（请先用 progress 确认已完成）")
    p_wait.add_argument("--host", default="", help="设备地址 https://IP")
    p_wait.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_wait.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    p_wait.add_argument("--device", default="", help="从 --devices 中选择单台设备名称，如 AD1")
    p_wait.add_argument("--username", default="admin")
    p_wait.add_argument("--password", default="")
    p_wait.add_argument("--work-dir", default="",
                        help="与 run 的 --work-dir 保持一致")
    p_wait.add_argument("--poll-interval", type=int, default=5,
                        help="轮询间隔秒数，默认 5")
    p_wait.add_argument("--timeout", type=int, default=55,
                        help="最长等待秒数，默认 55，避免 WorkBot 工具调用超时")
    p_wait.add_argument("--verbose", action="store_true",
                        help="输出下载和轮询过程日志；默认只输出最终巡检报告")

    # history
    p_hist = sub.add_parser("history", help="查看历史巡检记录")
    p_hist.add_argument("--host", default="", help="设备地址 https://IP")
    p_hist.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_hist.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    p_hist.add_argument("--device", default="", help="从 --devices 中选择单台设备名称，如 AD1")
    p_hist.add_argument("--username", default="admin")
    p_hist.add_argument("--password", default="")

    # progress
    p_prog = sub.add_parser("progress", help="查询巡检进度（单次）")
    p_prog.add_argument("--host", default="", help="设备地址 https://IP")
    p_prog.add_argument("--hosts", default="", help="多设备地址，逗号分隔")
    p_prog.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    p_prog.add_argument("--device", default="", help="从 --devices 中选择单台设备名称，如 AD1")
    p_prog.add_argument("--username", default="admin")
    p_prog.add_argument("--password", default="")
    p_prog.add_argument("--work-dir", default="", help="与 run/wait 使用的工作目录保持一致")
    p_prog.add_argument("--delay-seconds", type=float, default=0.0,
                        help="查询前等待指定秒数；WorkBot 进度轮询建议 30 秒")

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

    if args.command == "prompt":
        scenes = None
        if args.stage == "scene":
            try:
                client = _prompt_scene_client(args)
                if client is not None:
                    scenes = fetch_scene_names(client)
            except ValueError as e:
                print(f"错误: {e}，请使用 --password、AD_PASS 或 devices.json 中的 password 字段", file=sys.stderr)
                sys.exit(4)
            except RuntimeError as e:
                print(f"❌ {e}", file=sys.stderr)
                sys.exit(1)
        print(render_interaction_prompt(args.stage, args.target, args.scene, scenes=scenes))

    elif args.command == "scenes":
        password = args.password or os.environ.get("AD_PASS", "")
        if not password:
            print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
            sys.exit(4)
        client = ADClient(args.host, args.username, password)
        try:
            result = client._request("GET", "/sys/offline-check/")
        except (ADConnectionError, ADAuthError, ADAPIError) as e:
            print(f"❌ API 调用失败: {e}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.command == "run":
        if args.hosts or args.devices:
            if args.devices:
                devices = load_devices_json(args.devices, args.device)
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

        password = args.password or os.environ.get("AD_PASS", "")
        if not password:
            print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
            sys.exit(4)
        client = ADClient(args.host, args.username, password)
        if args.work_dir:
            work_dir = args.work_dir
        else:
            import tempfile
            work_dir = os.path.join(tempfile.gettempdir(), f"ad_check_{host_slug(args.host)}")
        try:
            if args.wait:
                result = _check_one(client, scene=args.scene, force=args.force, work_dir=work_dir)
                print(result["markdown"])
            else:
                meta = start_check(client, args.scene, force=args.force, work_dir=work_dir)
                print(f"         工作目录: {work_dir}")
                print(f"         后续请用 progress 命令每 30 秒查询进度，完成后再用 wait 下载报告")
        except CheckSceneNotFoundError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(4)
        except CheckLimitReachedError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(4)
        except RuntimeError as e:
            print(f"❌ {e}", file=sys.stderr)
            sys.exit(4)

    elif args.command == "wait":
        if args.hosts or args.devices:
            if args.devices:
                devices = load_devices_json(args.devices, args.device)
            else:
                devices = parse_hosts_arg(args.hosts, args.username, args.password)
            if not devices:
                print("错误: 设备列表为空", file=sys.stderr)
                sys.exit(4)
            results = run_multi(
                devices,
                _wait_one,
                work_dir=args.work_dir or None,
                poll_interval=args.poll_interval,
                timeout=args.timeout,
                verbose=args.verbose,
                _timeout=min(max(args.timeout + 15, 30), 75),
            )
            wait_errors = [
                str(v.get("error", ""))
                for v in results.values()
                if isinstance(v, dict)
                and "error" in v
                and (
                    "CheckTimeoutError" in str(v.get("error", ""))
                    or "未检测到本次巡检的完成报告" in str(v.get("error", ""))
                    or "_meta.json" in str(v.get("error", ""))
                )
            ]
            if wait_errors:
                for err in wait_errors:
                    print(f"❌ {err}", file=sys.stderr)
                sys.exit(5 if any("CheckTimeoutError" in e or "未检测到本次巡检的完成报告" in e for e in wait_errors) else 4)
            if len(devices) == 1:
                only = next(iter(results.values()))
                if "error" not in only and only.get("markdown"):
                    print("\n" + only["markdown"])
                    sys.exit(compute_multi_exit_code(results))
            device_names = {d["host"]: d["name"] for d in devices if d.get("name")}
            scenes = [
                r.get("meta", {}).get("scene")
                for r in results.values()
                if "error" not in r and r.get("meta", {}).get("scene")
            ]
            scene = scenes[0] if scenes else "巡检"
            print(render_multi_device_report(results, scene=scene, device_names=device_names))
            sys.exit(compute_multi_exit_code(results))

        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)
        password = args.password or os.environ.get("AD_PASS", "")
        if not password:
            print("错误: 未指定密码，请使用 --password 或设置 AD_PASS 环境变量", file=sys.stderr)
            sys.exit(4)
        client = ADClient(args.host, args.username, password)
        try:
            result = _wait_one(
                client,
                work_dir=args.work_dir or None,
                poll_interval=args.poll_interval,
                timeout=args.timeout,
                verbose=args.verbose,
            )
            print("\n" + result["markdown"])
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
        if args.hosts or args.devices:
            if args.devices:
                devices = load_devices_json(args.devices, args.device)
            else:
                devices = parse_hosts_arg(args.hosts, args.username, args.password)
            results = run_multi(devices, _history_one)
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
        client = ADClient(args.host, args.username, password)
        try:
            result = _history_one(client)
        except (ADConnectionError, ADAuthError, ADAPIError) as e:
            print(f"❌ API 调用失败: {e}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.command == "progress":
        if args.hosts or args.devices:
            if args.devices:
                devices = load_devices_json(args.devices, args.device)
            else:
                devices = parse_hosts_arg(args.hosts, args.username, args.password)
            results = run_multi(
                devices,
                _progress_one,
                work_dir=args.work_dir or None,
                delay_seconds=args.delay_seconds,
                _timeout=min(max(args.delay_seconds + 20, 30), 75),
            )
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
            client = ADClient(args.host, args.username, password)
            result = _progress_one(
                client,
                work_dir=args.work_dir or None,
                delay_seconds=args.delay_seconds,
            )
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

        analysis = analyze(data)
        report = render_markdown(analysis, meta)
        print(report)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
