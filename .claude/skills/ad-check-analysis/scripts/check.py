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
    skip_history: bool = False,
) -> Dict[str, Any]:
    """
    步骤 1-3：场景确认 + 记录上限检查 + 后台启动巡检

    Args:
        skip_history: 多设备模式跳过历史记录查询（SKILL.md B3）
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

    # 步骤 2: 检查巡检记录上限（多设备模式跳过）
    pre_run_latest_name = ""
    need_force = False
    if skip_history:
        print(f"[步骤 2] 多设备模式跳过历史记录查询")
    else:
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
        params={"force": "true"} if force else None,
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
# 排查建议映射表（67 条 CHECK_RULES key → 具体排查指引）
# ---------------------------------------------------------------------------

_SUGGESTION_MAP = {
    # ── 功能巡检 (35) ──────────────────────────────────────────────────
    "APP_VERSION_CHECK":       "当前版本与推荐版本存在差距，建议尽快升级到推荐版本以获取最新功能和安全修复",
    "ADMIN_ROLE_CHECK":        "存在非必要的管理员账号，建议在系统管理-用户管理中清理多余的管理员账号",
    "HEARTBEAT_ERROR_CHECK":   "心跳口故障检测未开启，建议在双机配置中启用心跳口故障检测以避免脑裂风险",
    "DEVICE_SAFE_CHECK":       "设备存在安全隐患，建议按安全检查提示逐项修复",
    "DNS_DETECT_CHECK":        "DNS代理未配置监视域名，建议在DNS代理配置中添加监视域名以实现故障切换",
    "DNAT_CHECK":              "DNAT规则的目标IP未配置在设备链路上或未配置ARP代理，建议检查DNAT规则和对应链路配置",
    "HEARTBEAT_CHECK":         "备份心跳口选择了管理口，建议使用独立的数据口作为心跳口以保证双机可靠性",
    "STATIC_IP_CHECK":         "集群内设备链路未全部配置静态IP，建议为所有业务链路配置静态IP以确保集群通信稳定",
    "CLUSTER_STATE_CHECK":     "集群状态异常，建议检查集群成员设备的网络连通性和同步配置",
    "DNS_PROXY_CHECK":         "DNS代理功能未启用，如需使用DNS映射/DNS64等功能，建议在链路负载配置中启用DNS代理",
    "VIRTUAL_MAC_CHECK":       "双机未启用MAC同步或集群未配置虚拟MAC，建议启用以减少故障切换时的ARP更新延迟",
    "DUAL_STATE_CHECK":        "主备状态异常，建议检查对端设备是否在线及心跳口配置是否正确",
    "POOL_PERSIST_CHECK":      "节点池未启用会话保持功能，建议在节点池配置中启用会话保持以保证同一客户端请求分发到同一节点",
    "STATIC_ROUTE_CHECK":      "静态路由未启用健康检查失败，建议为静态路由配置健康检查并验证下一跳可达性",
    "POOL_HEALTH_CHECK":       "节点池未配置健康检查或节点不在线，建议为节点池配置TCP/HTTP/ICMP等健康检查方法",
    "RS_LEVEL_CHECK":          "双机场景下未启用监视器级别检测，建议在故障切换配置中启用监视器级别检测",
    "APP_GROUP_CHECK":         "应用组关联内容配置不合理，建议检查应用组与节点池/虚拟服务的关联关系",
    "DNS_SERVER_STATE_CHECK":  "DNS服务器不在线或状态异常，建议检查DNS服务器的可达性和健康状态",
    "LINK_HEALTH_CHECK":       "链路未配置健康检查或状态异常，建议为链路配置健康检查并验证链路状态",
    "STATIC_PROXIMITY_CHECK":  "使用静态就近性调度策略但未配置静态就近性规则，建议在DNS映射或虚拟IP池中补充对应规则",
    "DNS64_CHECK":             "DNS64功能已启用，如非必要建议在DNS代理配置中关闭DNS64功能",
    "POLICY_ROUTE_CHECK":      "检测到新增智能路由选路策略，建议检查策略配置是否符合预期",
    "MANAGE_IP_CHECK":         "主备机管理口IP地址配置不当，建议确保主备机管理口IP地址不同",
    "SNMP_TRAPS_CHECK":        "SNMP Traps告警未启用，建议在系统管理-告警配置中启用SNMP Traps以便及时接收设备告警",
    "DNS_REFLECT_CHECK":       "DNS映射功能未启用或状态异常，建议检查DNS映射配置并确保规则处于启用状态",
    "DNS_SERVER_CHECK":        "全局负载DNS服务器功能未启用，如需使用全局负载功能建议在DNS配置中启用",
    "DNAT_PORT_CHECK":         "DNAT规则的端口范围为0-0或协议为ALL，建议缩小端口范围和协议范围以降低安全风险",
    "SESSION_SYNC_CHECK":      "双机/集群未启用会话同步，建议启用以保证故障切换时已有连接不中断",
    "MAIL_WARN_CHECK":         "邮件告警未启用，建议在系统管理-告警配置中配置邮件告警以便及时接收设备异常通知",
    "VIP_POOL_CHECK":          "虚拟IP池不在线或状态异常，建议检查虚拟IP池配置和关联节点状态",
    "PROXY_POLICY_CHECK":      "优先代理策略未启用，如需使用代理策略功能建议在相应配置中启用",
    "DNS_MAP_PS_CHECK":        "DNS映射未启用会话保持，建议在DNS映射配置中启用会话保持以保证请求一致性",
    "WAN_BANDWIDTH_CHECK":     "WAN属性链路带宽为默认值，建议根据实际带宽修改为准确值以避免QoS策略失效",
    "FAULT_SWITCH_CHECK":      "双机/集群未启用故障切换，建议启用以实现自动故障转移",
    "SYSLOG_CHECK":            "syslog未启用，建议在系统管理-日志配置中配置syslog服务器以便集中收集和审计日志",
    # ── 健康巡检 (25) ──────────────────────────────────────────────────
    "AUTO_UPDATE_CHECK":       "自动更新未开启或无法连接升级服务器，建议检查网络连通性",
    "CPU_CHECK":               "CPU使用率异常偏高，建议通过top/ps命令排查高CPU进程，检查是否有异常流量或配置导致的CPU负载",
    "LOG_CHECK":               "设备存在错误日志记录，建议导出黑盒日志分析错误来源",
    "DEVICE_RUN_TIME":         "运行时间数据缺失，建议检查系统状态采集服务是否正常运行",
    "DEVICE_FILE_CHECK":       "存在文件描述符泄漏风险，建议检查长期运行进程的资源释放情况，必要时重启相关服务",
    "NIC_STATE_CHECK":         "网卡存在丢包/错包/断链/降速情况，建议检查物理线缆、光模块和对端交换机端口状态，确保MTU一致",
    "CORE_PROCESS_CHECK":      "核心进程存在缺失，建议检查缺失进程对应的服务状态，必要时重启设备恢复",
    "KERNEL_LOG_CHECK":        "内核日志存在堆栈信息，建议导出系统日志排查内核异常原因，关注驱动或硬件层面的问题",
    "REMOTE_MAINTAIN_CHECK":   "WAN接口开启了远程维护功能，建议评估安全风险后关闭不必要的远程维护端口",
    "BLACK_BOX_CHECK":         "黑盒诊断功能未正常记录，建议在系统管理-调试配置中检查黑盒服务状态",
    "DMESG_DATA_CHECK":        "黑盒dmesg日志中存在硬件异常信息，建议重点排查dmesg中的error/warning项，关注内存、PCIe等硬件状态",
    "DISK_CHECK":              "磁盘使用率异常或磁盘信息采集失败，建议检查各分区使用情况，清理过期日志和临时文件，必要时扩容",
    "CRASH_LOG_CHECK":         "设备存在宕机记录，建议导出宕机日志分析宕机原因，关注宕机前的内存、CPU和进程状态",
    "MEMORY_CHECK":            "内存使用率异常偏高，建议检查是否存在内存泄漏进程，关注连接表和会话表等内存消耗大户",
    "SPEED_CARD_CHECK":        "加速卡状态异常或加速引擎未就绪，建议检查加速卡硬件状态和驱动加载情况",
    "FAN_STATE_CHECK":         "检测到风扇模块异常，建议检查风扇物理状态和转速，及时更换故障风扇，如为虚拟机请忽略",
    "POWER_STATE_CHECK":       "检测到电源模块异常，建议检查电源线缆连接和电源模块指示灯状态，如为虚拟机请忽略",
    "BIOS_VERSION_CHECK":      "BIOS固件有可用更新，建议评估更新内容后升级BIOS以消除潜在风险",
    "WARN_LOG_CHECK":          "邮件/snmptraps/syslog告警均未开启，建议至少开启一项以便在设备异常时及时收到通知",
    "MEMORY_LEAK_CHECK":       "检测到共享内存或信号量异常，建议升级到6.6R1及以上正式版本以修复已知问题",
    "DEVICE_CONNECTION_CHECK": "新建或并发连接数偏高，建议检查是否存在连接泄漏或异常流量，必要时调整连接数限制",
    "COREDUMP_INFO_CHECK":     "设备存在core dump记录，建议收集core dump文件联系深信服技术支持分析根因",
    "CONFIG_ID_CONFLICT_CHECK":"部分配置存在ID冲突，建议在系统管理中检查并修正冲突的配置ID",
    "NIC_HEALTH_CHECK":        "网卡交换芯片健康状态异常，建议检查82599/I350网卡硬件状态和驱动版本",
    "SNAT_SPORT_EXHAUSTION_CHECK": "一周内出现SNAT源端口枯竭告警，建议检查NAT配置，适当扩大端口范围或增加公网IP",
    # ── 安全巡检 (7) ───────────────────────────────────────────────────
    "SSH_API_CHECK":           "非管理员用户开启了SSH/API权限，建议在用户管理中关闭不必要的远程访问权限",
    "PATCH_INFO_CHECK":        "关键补丁未安装或不完整，建议在系统管理-补丁管理中检查并安装遗漏的安全补丁",
    "REPORT_CHECK":            "报表进程占用CPU异常，建议检查报表任务调度频率和数据量，必要时调整报表生成策略",
    "WEAK_PASSWORD_CHECK":     "存在弱密码或长期未修改密码的账号，建议修改为强密码（长度≥8位，含大小写字母+数字+特殊字符）",
    "SSL_POLICY_CHECK":        "SSL策略存在不安全算法或协议，建议禁用TLS 1.0/1.1及弱加密套件（如RC4、3DES）",
    "IP_LIMIT_CHECK":          "未设置管理员登录IP限制，建议配置仅允许信任的IP地址段访问设备管理界面",
    "OPEN_PORT_CHECK":         "设备开放了非必要端口（报表、智能DNS等），建议在防火墙策略中按需关闭非必要的默认服务端口",
}

# ---------------------------------------------------------------------------
# 67 项检查规则目录 (CHECK_RULES) — 所有可能的检查项引用目录
# ---------------------------------------------------------------------------

CHECK_RULES = {
    # ── 功能巡检 (feature) ──────────────────────────────────────────────
    "APP_VERSION_CHECK":       {"name": "推荐软件版本检测",       "desc": "检查当前版本和推荐版本的差距，并给出当前推荐的版本，推动产品升级",             "category": "feature", "fields": ["ad_appversion"]},
    "ADMIN_ROLE_CHECK":        {"name": "新增管理员账号检测",     "desc": "除管理员账号外，是否还存在多余的管理员账号，保障不能存在无用账号",               "category": "feature", "fields": ["admin"]},
    "HEARTBEAT_ERROR_CHECK":   {"name": "心跳口故障检测检查",     "desc": "检测当前场景下，设备是否启用心跳口故障检测",                                   "category": "feature", "fields": ["heartbeat_state"]},
    "DEVICE_SAFE_CHECK":       {"name": "设备安全隐患检测",       "desc": "检测设备是否存在安全隐患",                                                     "category": "feature", "fields": ["security_check_state"]},
    "DNS_DETECT_CHECK":        {"name": "DNS服务器监视域名检测",  "desc": "检测当前设备的DNS代理是否配置了监视域名；前提：DNS代理开启",                     "category": "feature", "fields": ["dns_proxy_enabled"]},
    "DNAT_CHECK":              {"name": "目的地址转换IP配置检测", "desc": "检测当前设备目的地址转换的IP地址是否配置在链路上或者配置了相应的arp代理",         "category": "feature", "fields": ["dnat_dst_ip2net_if"]},
    "HEARTBEAT_CHECK":         {"name": "心跳口检测",             "desc": "检测当前场景下，设备的备份心跳口选择是否是管理口",                               "category": "feature", "fields": ["heartbeat_state"]},
    "STATIC_IP_CHECK":         {"name": "接口静态IP检测",         "desc": "检测集群模式下集群内设备的链路是否都配置了静态IP",                               "category": "feature", "fields": ["static_ip_config"]},
    "CLUSTER_STATE_CHECK":     {"name": "集群状态检测",           "desc": "检测当前场景下，集群健康状态、本机同步状态",                                     "category": "feature", "fields": ["cluster_state"]},
    "DNS_PROXY_CHECK":         {"name": "DNS代理功能检测",       "desc": "检测当前设备是否启用DNS代理",                                                   "category": "feature", "fields": ["dns_proxy_enabled"]},
    "VIRTUAL_MAC_CHECK":       {"name": "MAC同步(虚拟MAC)检测",  "desc": "检测当前场景下，双机是否启用MAC同步或集群是否配置虚拟mac",                       "category": "feature", "fields": ["cluster_virtual_mac"]},
    "DUAL_STATE_CHECK":        {"name": "双机状态检测",           "desc": "检测当前两台组建双机的AD设备状态是否正常",                                       "category": "feature", "fields": ["ms_state"]},
    "POOL_PERSIST_CHECK":      {"name": "节点池会话保持检测",     "desc": "检测当前设备的节点池是否启用会话保持功能",                                       "category": "feature", "fields": ["node_pool_persist"]},
    "STATIC_ROUTE_CHECK":      {"name": "静态路由检测",           "desc": "检测当前设备的静态路由是否启用健康检查，以及是否在线",                           "category": "feature", "fields": ["static_route_health_check"]},
    "POOL_HEALTH_CHECK":       {"name": "节点池健康检测",         "desc": "检测当前设备的节点池是否配置了合理的健康检查，并且是否在线",                     "category": "feature", "fields": ["node_pool_health_check_detect"]},
    "RS_LEVEL_CHECK":          {"name": "监视器级别检测",         "desc": "检测双机场景下，设备是否启用监视器级别检测；前提：故障切换",                     "category": "feature", "fields": ["rs_level_check"]},
    "APP_GROUP_CHECK":         {"name": "应用组关联内容检测",     "desc": "应用组关联内容是否合理",                                                         "category": "feature", "fields": ["cluster_appgroup_unit"]},
    "DNS_SERVER_STATE_CHECK":  {"name": "DNS服务器状态检测",     "desc": "检测当前设备链路负载-DNS代理的DNS服务器是否正常在线",                           "category": "feature", "fields": ["dns_server_health"]},
    "LINK_HEALTH_CHECK":       {"name": "链路健康检测",           "desc": "检测当前设备的链路是否配置了健康检查，以及状态是否正常",                         "category": "feature", "fields": ["link_health_check"]},
    "STATIC_PROXIMITY_CHECK":  {"name": "静态就近性规则检测",     "desc": "如果DNS映射或虚拟IP池配置的调度策略为静态就近性，检测是否配置静态就近性规则",   "category": "feature", "fields": ["static_proximity_check"]},
    "DNS64_CHECK":             {"name": "DNS64检测",              "desc": "检测当前设备是否启用DNS64的相关功能，前提是DNS代理开启",                         "category": "feature", "fields": ["dns64_enabled"]},
    "POLICY_ROUTE_CHECK":      {"name": "智能路由检测",           "desc": "检测当前设备是否新增智能路由选路策略",                                           "category": "feature", "fields": ["newly_added_policy_route"]},
    "MANAGE_IP_CHECK":         {"name": "管理口IP地址检测",       "desc": "要求主备机的管理口地址不一致；前提是备份心跳口都是管理口",                       "category": "feature", "fields": ["ms_manage_ip_difference"]},
    "SNMP_TRAPS_CHECK":        {"name": "SNMP Traps告警检测",    "desc": "检测当前场景下，设备是否启用SNMP Traps告警功能",                                 "category": "feature", "fields": ["snmp_alarm_enabled"]},
    "DNS_REFLECT_CHECK":       {"name": "DNS映射功能状态检测",   "desc": "检测当前设备的DNS映射是否是启用状态",                                             "category": "feature", "fields": ["dns_pre_rule_exist"]},
    "DNS_SERVER_CHECK":        {"name": "DNS服务器检测",         "desc": "检测当前设备是否启用全局负载的DNS服务器功能",                                     "category": "feature", "fields": ["dns_server_enabled"]},
    "DNAT_PORT_CHECK":         {"name": "目的地址转换端口配置检测", "desc": "检测当前设备目的地址转换的端口是否为0到0/协议条件是否为ALL",                     "category": "feature", "fields": ["dnat_port_and_proto"]},
    "SESSION_SYNC_CHECK":      {"name": "会话同步检测",           "desc": "检测双机或集群下，设备是否启用会话同步",                                         "category": "feature", "fields": ["cluster_session_sync"]},
    "MAIL_WARN_CHECK":         {"name": "邮件告警检测",           "desc": "检测当前场景下，设备是否启用邮件告警功能",                                       "category": "feature", "fields": ["email_alarm_enabled"]},
    "VIP_POOL_CHECK":          {"name": "虚拟IP池检测",           "desc": "检测当前设备的虚拟IP池是否正常在线",                                             "category": "feature", "fields": ["virtual_ip_pool_check"]},
    "PROXY_POLICY_CHECK":      {"name": "优先代理策略检测",       "desc": "检测当前设备是否启用优先代理策略",                                               "category": "feature", "fields": ["proxy_policy_check"]},
    "DNS_MAP_PS_CHECK":        {"name": "DNS映射会话保持检测",   "desc": "检测当前设备是否启用DNS映射的会话保持",                                         "category": "feature", "fields": ["dns_map_persist_enable"]},
    "WAN_BANDWIDTH_CHECK":     {"name": "WAN属性链路带宽设置检查", "desc": "检测当前设备的WAN属性链路，上下行带宽设置是否为默认配置",                       "category": "feature", "fields": ["wan_max_bandwidth"]},
    "FAULT_SWITCH_CHECK":      {"name": "故障切换",               "desc": "检测双机或集群下，设备是否启用故障切换",                                         "category": "feature", "fields": ["cluster_fault_switch_enabled"]},
    "SYSLOG_CHECK":            {"name": "syslog设置检测",        "desc": "检测当前场景下，设备是否启用syslog设置",                                         "category": "feature", "fields": ["syslog_enabled"]},
    # ── 健康巡检 (health) ──────────────────────────────────────────────
    "AUTO_UPDATE_CHECK":       {"name": "自动更新能力检测",       "desc": "检查设备是否具备连接升级服务器的条件，同时自身已开启自动更新功能",               "category": "health", "fields": ["auto_update"]},
    "CPU_CHECK":               {"name": "CPU检测",                "desc": "过去一周cpu占用率是否异常；检查24小时内黑盒日志中CPU异常状态",                   "category": "health", "fields": ["base_cpu_usage", "base_cpu_mpstat"]},
    "LOG_CHECK":               {"name": "错误日志检测",           "desc": "检查当前设备过去一月内是否出现错误日志",                                         "category": "health", "fields": ["base_log_error_exist"]},
    "DEVICE_RUN_TIME":         {"name": "设备运行时间",           "desc": "检测当前设备持续运行时间",                                                       "category": "health", "fields": ["base_running_time"]},
    "DEVICE_FILE_CHECK":       {"name": "设备文件检查",           "desc": "是否存在文件描述符泄漏的风险",                                                   "category": "health", "fields": ["base_file_ds"]},
    "NIC_STATE_CHECK":         {"name": "网卡状态检测",           "desc": "检测当前设备网口丢包错包率是否超过10%；展示设备网卡信息",                         "category": "health", "fields": ["base_eth_abnormal", "base_eth_mtu", "base_drop_err_packet_rate", "base_eth_info"]},
    "CORE_PROCESS_CHECK":      {"name": "核心进程检测",           "desc": "核心进程及其开启状况，当前缺少的核心进程",                                       "category": "health", "fields": ["base_core_process_lack"]},
    "KERNEL_LOG_CHECK":        {"name": "设备kernel日志",         "desc": "kernel log中是否存在堆栈信息",                                                   "category": "health", "fields": ["base_kernel_log"]},
    "REMOTE_MAINTAIN_CHECK":   {"name": "远程维护检测",           "desc": "检查当前设备是否开启了WAN属性接口的远程维护",                                     "category": "health", "fields": ["remote_mt"]},
    "BLACK_BOX_CHECK":         {"name": "黑匣子检测",             "desc": "黑匣子是否正常记录",                                                             "category": "health", "fields": ["base_blackbox_state"]},
    "DMESG_DATA_CHECK":        {"name": "设备黑匣子dmesg数据",   "desc": "检测24小时内黑盒Dmesg日志中是否存在硬件异常信息",                               "category": "health", "fields": ["base_blackbox_dmesg"]},
    "DISK_CHECK":              {"name": "硬盘检测",               "desc": "检测用户磁盘各分区读写情况",                                                     "category": "health", "fields": ["disk_info", "base_disk_high_usage"]},
    "CRASH_LOG_CHECK":         {"name": "宕机日志检测",           "desc": "检测当前设备是否存在宕机情况",                                                   "category": "health", "fields": ["base_crash_time"]},
    "MEMORY_CHECK":            {"name": "内存检测",               "desc": "过去一周内存占用率是否异常；最近两天内是否内存过载",                             "category": "health", "fields": ["snmp_mem_rate"]},
    "SPEED_CARD_CHECK":        {"name": "加速卡状态检测",         "desc": "检测当前设备加速卡状态",                                                         "category": "health", "fields": ["acceleration"]},
    "FAN_STATE_CHECK":         {"name": "风扇状态检测",           "desc": "检测当前设备风扇状态",                                                           "category": "health", "fields": ["fan_state"]},
    "POWER_STATE_CHECK":       {"name": "电源状态检测",           "desc": "检测当前设备电源状态",                                                           "category": "health", "fields": ["power_state"]},
    "BIOS_VERSION_CHECK":      {"name": "BIOS固件版本检测",       "desc": "此异常需要对您当前产品的BIOS固件进行升级操作，消除风险",                         "category": "health", "fields": ["bios_update_state"]},
    "WARN_LOG_CHECK":          {"name": "开启告警日志检测",       "desc": "设备e-mail告警、snmp traps告警和syslog告警日志至少有一项开启，则正常",           "category": "health", "fields": ["alarms_enabled"]},
    "MEMORY_LEAK_CHECK":       {"name": "共享内存和信号量泄露检测", "desc": "此异常需要您升级到6.6R1及以上正式版本，消除当前产品运行中存在的风险",           "category": "health", "fields": ["shm_sem_state"]},
    "DEVICE_CONNECTION_CHECK": {"name": "设备连接数检测",         "desc": "检测当前设备新建和并发连接数",                                                   "category": "health", "fields": ["conntrack_count", "conntrack_new_count"]},
    "COREDUMP_INFO_CHECK":     {"name": "设备堆栈信息",           "desc": "检测当前设备是否core dump",                                                     "category": "health", "fields": ["base_no_core"]},
    "CONFIG_ID_CONFLICT_CHECK":{"name": "配置id冲突检测",         "desc": "检查当前设备的某些配置是否出现了id冲突",                                         "category": "health", "fields": ["id_conflict_list"]},
    "NIC_HEALTH_CHECK":        {"name": "网卡交换芯片的健康状态检测", "desc": "检测82599网卡和I350网卡交换芯片的健康状态",                                   "category": "health", "fields": ["I350_nic_state", "82599_nic_state"]},
    "SNAT_SPORT_EXHAUSTION_CHECK": {"name": "SNAT源端口枯竭告警检测", "desc": "检查当前设备在一周以内是否出现了SNAT源端口枯竭告警",                           "category": "health", "fields": ["snat_sport_exhaustion_log_num"]},
    # ── 安全巡检 (secure) ──────────────────────────────────────────────
    "SSH_API_CHECK":           {"name": "SSH与API权限检测",       "desc": "检查当前设备的用户角色是否开启了API或SSH权限",                                   "category": "secure", "fields": ["ssh_authority", "ADAPI_authority"]},
    "PATCH_INFO_CHECK":        {"name": "关键补丁修复检测",       "desc": "检测产品自身安全性加固的补丁，或部分较大影响的稳定性补丁包",                     "category": "secure", "fields": ["patch_info"]},
    "REPORT_CHECK":            {"name": "报表稳定性检测",         "desc": "检测当前设备最近一周的报表进程占用cpu是否异常",                                   "category": "secure", "fields": ["base_report_stab"]},
    "WEAK_PASSWORD_CHECK":     {"name": "管理员弱密码检测",       "desc": "管理员账号是否有长时间未修改过密码的账号，是否有弱密码的账号",                   "category": "secure", "fields": ["weak_pwd"]},
    "SSL_POLICY_CHECK":        {"name": "SSL策略检测",            "desc": "检测当前设备的SSL加密/卸载是否启用不安全的协议/不安全算法",                       "category": "secure", "fields": ["unsafe_algorithm", "unsafe_protocol"]},
    "IP_LIMIT_CHECK":          {"name": "登录IP限制检测",         "desc": "是否设置了管理员登录设备IP段，只允许接入产品的细化地址段",                       "category": "secure", "fields": ["enable_iplimit"]},
    "OPEN_PORT_CHECK":         {"name": "默认开放端口检测",       "desc": "如果检查到默认端口，会提示用户按需关闭",                                         "category": "secure", "fields": ["dangerous_port"]},
}

# ---------------------------------------------------------------------------
# 字段规则表 (FIELD_RULES) — ad.json 字段名 → 评估规则 + check_key + category
# ---------------------------------------------------------------------------

FIELD_RULES = {
    # === feature — 功能巡检字段 ==========================================
    'ad_appversion':     {'type': 'missing',      'severity': 'fail',  'name': 'AD版本',        'description': '应能正常获取 AD 软件版本号',
                          'check_key': 'APP_VERSION_CHECK', 'category': 'feature'},
    'admin':             {'type': 'str_not_equal','normal': 'true', 'severity': 'fail',  'name': '管理员账户',      'description': '管理员账户应处于正常配置状态',
                          'check_key': 'ADMIN_ROLE_CHECK', 'category': 'feature'},
    'heartbeat_state':   {'type': 'bool_false',   'severity': 'fail', 'name': '心跳口状态',     'description': '心跳口应处于正常状态',
                          'check_key': 'HEARTBEAT_CHECK', 'category': 'feature'},
    'security_check_state':{'type':'bool_false', 'severity': 'fail',  'name': '安全检查状态',    'description': '设备安全检查功能应处于开启状态',
                          'check_key': 'DEVICE_SAFE_CHECK', 'category': 'feature'},
    'dns_proxy_enabled': {'type': 'bool_true',    'severity': 'fail',  'name': 'DNS代理启用',    'description': '不应启用不必要的 DNS 代理功能',
                          'check_key': 'DNS_PROXY_CHECK', 'category': 'feature'},
    'dnat_dst_ip2net_if':{'type': 'non_empty',    'severity': 'fail',  'name': 'DNAT目标IP',    'description': '不应存在不必要的 DNAT 规则',
                          'check_key': 'DNAT_CHECK', 'category': 'feature'},
    'static_ip_config':  {'type': 'non_empty',    'severity': 'fail',  'name': '静态IP配置',     'description': '不应存在静态 IP 配置冲突',
                          'check_key': 'STATIC_IP_CHECK', 'category': 'feature'},
    'cluster_state':     {'type': 'str_not_equal','normal': 'NORMAL', 'severity': 'fail', 'name': '集群状态',       'description': '集群状态应正常',
                          'check_key': 'CLUSTER_STATE_CHECK', 'category': 'feature'},
    'cluster_brain_split_check':{'type':'non_empty','severity':'fail','name': '集群脑裂检查',    'description': '不应出现集群脑裂（主备设备通信分裂）',
                          'check_key': 'CLUSTER_STATE_CHECK', 'category': 'feature'},
    'cluster_virtual_mac':{'type': 'str_equal',   'abnormal': 'CLUSTER_UNABLE', 'severity': 'fail', 'name': '虚拟MAC', 'description': '虚拟 MAC 地址应正常配置',
                          'check_key': 'VIRTUAL_MAC_CHECK', 'category': 'feature'},
    'ms_state':          {'type': 'str_not_equal','normal': 'NORMAL', 'severity': 'fail', 'name': '双机状态', 'description': '主备状态应正常',
                          'check_key': 'DUAL_STATE_CHECK', 'category': 'feature'},
    'node_pool_persist': {'type': 'non_empty',    'severity': 'fail',  'name': '节点池会话保持',  'description': '会话保持功能应正常配置',
                          'check_key': 'POOL_PERSIST_CHECK', 'category': 'feature'},
    'static_route_health_check':{'type':'non_empty','severity':'fail', 'name': '静态路由健康检查', 'description': '静态路由应正常配置',
                          'check_key': 'STATIC_ROUTE_CHECK', 'category': 'feature'},
    'node_pool_health_check_detect':{'type':'non_empty','severity':'fail','name': '节点池健康检查', 'description': '节点池应配置合理的健康检查',
                          'check_key': 'POOL_HEALTH_CHECK', 'category': 'feature'},
    'rs_level_check':    {'type': 'bool_false',   'severity': 'fail',  'name': '监视器级别',     'description': '监视器级别检测应正常配置',
                          'check_key': 'RS_LEVEL_CHECK', 'category': 'feature'},
    'cluster_appgroup_unit':{'type': 'str_equal', 'abnormal': 'CLUSTER_UNABLE', 'severity': 'fail', 'name': '应用组关联',   'description': '应用组关联内容应配置合理',
                          'check_key': 'APP_GROUP_CHECK', 'category': 'feature'},
    'dns_server_health': {'type': 'non_empty',    'severity': 'fail',  'name': 'DNS服务器状态',   'description': 'DNS 服务器应正常在线',
                          'check_key': 'DNS_SERVER_STATE_CHECK', 'category': 'feature'},
    'link_health_check': {'type': 'non_empty',    'severity': 'fail',  'name': '链路健康检查',   'description': '链路应配置健康检查且状态正常',
                          'check_key': 'LINK_HEALTH_CHECK', 'category': 'feature'},
    'static_proximity_check':{'type':'bool_false','severity': 'fail',  'name': '静态就近性规则',  'description': '静态就近性规则应正常配置',
                          'check_key': 'STATIC_PROXIMITY_CHECK', 'category': 'feature'},
    'dns64_enabled':     {'type': 'bool_true',    'severity': 'fail',  'name': 'DNS64启用',      'description': '不应启用 DNS64 相关功能',
                          'check_key': 'DNS64_CHECK', 'category': 'feature'},
    'newly_added_policy_route':{'type':'bool_true','severity':'fail',  'name': '新增策略路由',    'description': '不应新增智能路由选路策略',
                          'check_key': 'POLICY_ROUTE_CHECK', 'category': 'feature'},
    'ms_manage_ip_difference':{'type':'str_not_equal','normal':'CLUSTER_UNABLE','severity':'fail','name': '管理IP差异', 'description': '管理口 IP 地址应正常配置',
                          'check_key': 'MANAGE_IP_CHECK', 'category': 'feature'},
    'snmp_alarm_enabled':{'type': 'bool_false',   'severity': 'fail',  'name': 'SNMP告警',       'description': 'SNMP Traps 告警应正常配置',
                          'check_key': 'SNMP_TRAPS_CHECK', 'category': 'feature'},
    'dns_pre_rule_exist':{'type': 'bool_true',    'severity': 'fail',  'name': 'DNS映射规则',    'description': 'DNS 映射功能应处于正常状态',
                          'check_key': 'DNS_REFLECT_CHECK', 'category': 'feature'},
    'dns_server_enabled':{'type': 'str_equal',    'abnormal': 'false', 'severity': 'fail', 'name': 'DNS服务器启用',  'description': 'DNS 服务器应正常配置',
                          'check_key': 'DNS_SERVER_CHECK', 'category': 'feature'},
    'dnat_port_and_proto':{'type':'non_empty',    'severity': 'fail',  'name': 'DNAT端口协议',   'description': 'DNAT 端口应正常配置',
                          'check_key': 'DNAT_PORT_CHECK', 'category': 'feature'},
    'cluster_session_sync':{'type':'str_equal',   'abnormal': 'ABNORMAL','severity':'fail', 'name': '会话同步',       'description': '会话同步应正常配置',
                          'check_key': 'SESSION_SYNC_CHECK', 'category': 'feature'},
    'email_alarm_enabled':{'type':'bool_false',   'severity': 'fail',  'name': '邮件告警',       'description': '邮件告警应正常配置',
                          'check_key': 'MAIL_WARN_CHECK', 'category': 'feature'},
    'proxy_policy_check':{'type': 'bool_false',   'severity': 'fail',  'name': '优先代理策略',    'description': '代理策略应正常配置',
                          'check_key': 'PROXY_POLICY_CHECK', 'category': 'feature'},
    'dns_map_persist_enable':{'type':'empty_dict','severity': 'fail',  'name': 'DNS映射会话保持', 'description': 'DNS 映射会话保持应正常配置',
                          'check_key': 'DNS_MAP_PS_CHECK', 'category': 'feature'},
    'wan_max_bandwidth': {'type': 'non_empty',    'severity': 'fail',  'name': 'WAN带宽设置',    'description': 'WAN 属性链路带宽应正常配置',
                          'check_key': 'WAN_BANDWIDTH_CHECK', 'category': 'feature'},
    'cluster_fault_switch_enabled':{'type':'str_equal','abnormal':'ENABLE','severity':'fail','name': '故障切换',   'description': '故障切换应正常配置',
                          'check_key': 'FAULT_SWITCH_CHECK', 'category': 'feature'},
    'syslog_enabled':    {'type': 'bool_false',   'severity': 'fail',  'name': 'syslog设置',     'description': 'syslog 应正常配置',
                          'check_key': 'SYSLOG_CHECK', 'category': 'feature'},
    # === health — 健康巡检字段 ============================================
    'auto_update':       {'type': 'str_not_equal', 'normal': 'true','severity':'fail',  'name': '自动更新',       'description': '自动更新功能应处于开启状态',
                          'check_key': 'AUTO_UPDATE_CHECK', 'category': 'health'},
    'base_cpu_usage':    {'type': 'threshold', 'abnormal': 90,  'compare': '>', 'severity': 'fail',  'warn_at': 80, 'warn_compare': '>', 'name': 'CPU使用率',      'description': '使用率应保持在 80% 以内，过高说明负载偏大',
                          'check_key': 'CPU_CHECK', 'category': 'health'},
    'base_cpu_mpstat':   {'type': 'threshold', 'abnormal': 0,   'compare': '==', 'severity': 'fail',  'name': 'CPU架构状态',    'description': 'CPU 架构数据应可正常采集',
                          'check_key': 'CPU_CHECK', 'category': 'health'},
    'base_log_error_exist':{'type': 'threshold','abnormal': 100,'compare': '>', 'severity': 'fail',  'warn_at': 0, 'warn_compare': '>', 'name': '错误日志数量',    'description': '不应存在大量错误日志',
                          'check_key': 'LOG_CHECK', 'category': 'health'},
    'base_running_time': {'type': 'missing',      'severity': 'fail',  'name': '运行时间',       'description': '应能正常记录设备运行时长',
                          'check_key': 'DEVICE_RUN_TIME', 'category': 'health'},
    'base_file_ds':      {'type': 'threshold', 'abnormal': 0,  'compare': '>',  'severity': 'fail',  'name': '文件描述符泄漏',  'description': '不应存在文件描述符泄漏',
                          'check_key': 'DEVICE_FILE_CHECK', 'category': 'health'},
    'base_eth_abnormal': {'type': 'non_empty', 'severity': 'fail',  'name': '网卡异常',       'description': '网卡不应存在异常状态',
                          'check_key': 'NIC_STATE_CHECK', 'category': 'health'},
    'base_eth_mtu':      {'type': 'non_empty', 'severity': 'fail',  'name': '网卡MTU',       'description': '网卡 MTU 应配置正常',
                          'check_key': 'NIC_STATE_CHECK', 'category': 'health'},
    'base_drop_err_packet_rate':{'type':'non_empty','severity':'fail','name': '丢包率',        'description': '网卡丢包率应保持在正常范围',
                          'check_key': 'NIC_STATE_CHECK', 'category': 'health'},
    'base_eth_info':     {'type': 'eth_parse',   'severity': 'fail',  'name': '网卡信息',       'description': '网口链路应全部连通，不应有断开或降速',
                          'check_key': 'NIC_STATE_CHECK', 'category': 'health'},
    'base_core_process_lack':{'type':'non_empty','severity':'fail', 'name': '缺失核心进程',    'description': '所有核心进程应正常运行，不应有缺失',
                          'check_key': 'CORE_PROCESS_CHECK', 'category': 'health'},
    'base_kernel_log':   {'type': 'not_zero',   'severity': 'fail',  'name': '内核日志',       'description': '不应有内核级别的异常日志',
                          'check_key': 'KERNEL_LOG_CHECK', 'category': 'health'},
    'remote_mt':         {'type': 'str_equal', 'abnormal': 'true',  'severity': 'fail',  'name': '远程维护',       'description': '远程维护功能应处于关闭状态，降低安全风险',
                          'check_key': 'REMOTE_MAINTAIN_CHECK', 'category': 'health'},
    'base_blackbox_state':{'type':'not_zero',   'severity': 'fail',  'name': '黑盒状态',       'description': '黑盒诊断功能应处于正常状态',
                          'check_key': 'BLACK_BOX_CHECK', 'category': 'health'},
    'base_blackbox_dmesg':{'type':'non_empty', 'severity':'fail',   'name': '黑盒dmesg数据',   'description': '不应有黑盒 dmesg 异常数据',
                          'check_key': 'DMESG_DATA_CHECK', 'category': 'health'},
    'disk_info':         {'type': 'empty_dict',  'severity': 'fail',  'name': '磁盘信息',       'description': '应能正常采集到磁盘使用情况',
                          'check_key': 'DISK_CHECK', 'category': 'health'},
    'base_disk_high_usage':{'type':'non_empty', 'severity':'fail',  'name': '磁盘高使用率',     'description': '各磁盘分区使用率应保持在安全范围内',
                          'check_key': 'DISK_CHECK', 'category': 'health'},
    'base_crash_time':   {'type': 'non_empty', 'severity': 'fail',  'name': '崩溃时间',       'description': '不应存在系统崩溃记录',
                          'check_key': 'CRASH_LOG_CHECK', 'category': 'health'},
    'snmp_mem_rate':     {'type': 'threshold', 'abnormal': 90,  'compare': '>', 'severity': 'fail',  'warn_at': 80, 'warn_compare': '>', 'name': '内存使用率',      'description': '使用率应保持在 80% 以内，过高可能影响性能',
                          'check_key': 'MEMORY_CHECK', 'category': 'health'},
    'acceleration':      {'type': 'threshold', 'abnormal': 0,  'compare': '==', 'severity': 'fail',  'name': '加速引擎',       'description': '加速引擎应正常启用，保证转发性能',
                          'check_key': 'SPEED_CARD_CHECK', 'category': 'health'},
    'fan_state':         {'type': 'threshold', 'abnormal': 0,  'compare': '==', 'severity': 'fail',  'warn_at': -1, 'warn_compare': '==', 'name': '风扇状态',       'description': '风扇模块应正常运转，确保设备散热',
                          'check_key': 'FAN_STATE_CHECK', 'category': 'health'},
    'power_state':       {'type': 'threshold', 'abnormal': 0,  'compare': '==', 'severity': 'fail',  'warn_at': -1, 'warn_compare': '==', 'name': '电源状态',       'description': '电源模块应正常工作，供电稳定',
                          'check_key': 'POWER_STATE_CHECK', 'category': 'health'},
    'bios_update_state': {'type': 'has_value',   'severity': 'fail',  'name': 'BIOS更新状态',   'description': 'BIOS 应处于正常版本，不应有待更新提示',
                          'check_key': 'BIOS_VERSION_CHECK', 'category': 'health'},
    'alarms_enabled':    {'type': 'zero',        'severity': 'fail',  'name': '告警启用',       'description': '告警功能应处于开启状态，以便及时发现异常',
                          'check_key': 'WARN_LOG_CHECK', 'category': 'health'},
    'shm_sem_state':     {'type': 'bool_false', 'severity': 'fail',  'name': '共享内存状态',    'description': '共享内存和信号量应处于正常可用状态',
                          'check_key': 'MEMORY_LEAK_CHECK', 'category': 'health'},
    'conntrack_count':   {'type': 'threshold', 'abnormal': 100000, 'compare': '>', 'severity': 'fail', 'name': '连接跟踪数',     'description': '连接跟踪数应保持在合理范围内',
                          'check_key': 'DEVICE_CONNECTION_CHECK', 'category': 'health'},
    'conntrack_new_count':{'type':'threshold', 'abnormal': 10000,  'compare': '>', 'severity': 'fail', 'name': '新建连接数',     'description': '新建连接数应保持在合理范围内',
                          'check_key': 'DEVICE_CONNECTION_CHECK', 'category': 'health'},
    'base_no_core':      {'type': 'threshold',  'abnormal': -1, 'compare': '>',  'severity': 'fail',  'name': '堆栈信息',       'description': '不应存在 core dump 情况',
                          'check_key': 'COREDUMP_INFO_CHECK', 'category': 'health'},
    'id_conflict_list':  {'type': 'non_empty', 'severity': 'fail',  'name': '配置ID冲突',      'description': '不应存在配置 ID 冲突',
                          'check_key': 'CONFIG_ID_CONFLICT_CHECK', 'category': 'health'},
    'I350_nic_state':    {'type': 'not_normal',  'severity': 'fail',  'name': 'I350网卡状态',   'description': 'I350 网卡应处于健康状态',
                          'check_key': 'NIC_HEALTH_CHECK', 'category': 'health'},
    '82599_nic_state':   {'type': 'not_normal',  'severity': 'fail',  'name': '82599网卡状态',  'description': '82599 网卡应处于健康状态',
                          'check_key': 'NIC_HEALTH_CHECK', 'category': 'health'},
    'snat_sport_exhaustion_log_num': {'type': 'threshold', 'abnormal': 0, 'compare': '>', 'severity': 'fail', 'name': 'SNAT端口耗尽',   'description': '不应出现 SNAT 端口耗尽的情况',
                          'check_key': 'SNAT_SPORT_EXHAUSTION_CHECK', 'category': 'health'},
    # === secure — 安全巡检字段 ============================================
    'ssh_authority':     {'type': 'bool_false', 'severity': 'fail',  'name': 'SSH授权',        'description': 'SSH 远程管理权限应正常开启',
                          'check_key': 'SSH_API_CHECK', 'category': 'secure'},
    'ADAPI_authority':   {'type': 'bool_false', 'severity': 'fail',  'name': 'ADAPI授权',      'description': 'ADAPI 远程管理权限应正常开启',
                          'check_key': 'SSH_API_CHECK', 'category': 'secure'},
    'patch_info':        {'type': 'nested_list', 'key': 'patched_list', 'severity': 'fail', 'name': '补丁信息',       'description': '应已安装系统补丁',
                          'check_key': 'PATCH_INFO_CHECK', 'category': 'secure'},
    'base_report_stab':  {'type': 'bool_false', 'severity': 'fail',  'name': '报表稳定性',      'description': '报表生成功能应稳定运行',
                          'check_key': 'REPORT_CHECK', 'category': 'secure'},
    'weak_pwd':          {'type': 'non_empty', 'severity': 'fail',  'name': '弱密码',         'description': '不应存在使用弱密码的账户',
                          'check_key': 'WEAK_PASSWORD_CHECK', 'category': 'secure'},
    'unsafe_algorithm':  {'type': 'bool_true',  'severity': 'fail',  'name': '不安全算法',      'description': '应使用安全的 SSL 加密算法，不应存在不安全的加密方式',
                          'check_key': 'SSL_POLICY_CHECK', 'category': 'secure'},
    'unsafe_protocol':   {'type': 'bool_true',  'severity': 'fail',  'name': '不安全协议',      'description': '应使用安全的 SSL 协议版本，不应存在不安全的协议',
                          'check_key': 'SSL_POLICY_CHECK', 'category': 'secure'},
    'enable_iplimit':    {'type': 'str_equal', 'abnormal': 'false', 'severity': 'fail',  'name': 'IP限制',         'description': 'IP 访问限制应已启用，防止未授权访问',
                          'check_key': 'IP_LIMIT_CHECK', 'category': 'secure'},
    'dangerous_port':    {'type': 'non_empty', 'severity': 'fail',  'name': '危险端口',       'description': '不应开放不必要的风险端口（如报表、智能DNS等非管理端口）',
                          'check_key': 'OPEN_PORT_CHECK', 'category': 'secure'},
}

# ---------------------------------------------------------------------------
# 字段评估引擎
# ---------------------------------------------------------------------------

def _evaluate_field(value, rule):
    """Type-based field rule evaluation. Returns (is_abnormal: bool, severity: str, issue: str)."""
    if value is None:
        return False, "fail", "数据不可用"
    rule_type = rule['type']
    name = rule['name']
    severity = rule.get('severity', 'fail')

    if rule_type == 'threshold':
        # Handle list values (e.g., base_cpu_usage is a list of samples)
        if isinstance(value, list):
            if not value:
                return False, "fail", f"{name}数据为空"
            try:
                v = float(max(value))
            except (ValueError, TypeError):
                return False, "fail", f"{name}值无法解析: {value}"
        else:
            try:
                v = float(value)
            except (ValueError, TypeError):
                return False, "fail", f"{name}值无法解析: {value}"
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
                return True, "fail", f"{name}异常: {value}"
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
        return False, "fail", f"未知规则类型: {rule_type}"

    return is_ab, severity if is_ab else "pass", issue


def _evaluate_vip_pool(data):
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


def analyze(data: Dict[str, Any], check_info: dict | None = None) -> Dict[str, Any]:
    """Data-driven analysis engine: evaluates ad.json fields against FIELD_RULES,
    groups by check_key, and produces structured results for render_markdown().

    Args:
        data: ad.json content
        check_info: acheck_offline_check_info.json content (preserved for future use)
    """
    _empty = {
        "device_info": {},
        "check_results": {},
        "categories": {"feature": [], "health": [], "secure": []},
        "summary": {"total": 0, "total_expected": len(CHECK_RULES), "pass": 0, "fail": 0, "score": 0},
        "health_scores": {"feature": {"pass": 0, "total": 0, "score": 0}, "health": {"pass": 0, "total": 0, "score": 0}, "secure": {"pass": 0, "total": 0, "score": 0}, "overall": 0},
        "suggestions": [],
        "uncovered": [],
    }

    if not isinstance(data, dict):
        return _empty

    # ── Phase 1: Evaluate each ad.json field against FIELD_RULES ────────
    # grouped: {check_key: [(is_abnormal, severity, issue, value, field_name), ...]}
    grouped: dict = {}

    for field_name, value in data.items():
        # ── Special handler: virtual_ip_pool_check (nested dict traversal) ──
        if field_name == 'virtual_ip_pool_check':
            status, val_str, detail = _evaluate_vip_pool(data)
            grouped.setdefault('VIP_POOL_CHECK', []).append(
                (status == "fail", status, detail, val_str, field_name))
            continue

        field_rule = FIELD_RULES.get(field_name)
        if not field_rule:
            continue  # Skip fields without evaluation rules (e.g., version, gateway_id, etc.)

        check_key = field_rule.get('check_key', field_name)

        is_ab, severity, issue = _evaluate_field(value, field_rule)
        grouped.setdefault(check_key, []).append(
            (is_ab, severity, issue, value, field_name))

    # ── Phase 2: Aggregate field results into check_results ──────────────
    check_results: dict = {}

    for check_key, field_statuses in grouped.items():
        # Resolve display name from CHECK_RULES (preferred) or first field rule
        rule_entry = CHECK_RULES.get(check_key, {})
        name = rule_entry.get('name', check_key)
        desc = rule_entry.get('desc', '')

        # Fallback description from first field rule
        if not desc:
            for _, _, _, _, fn in field_statuses:
                fr = FIELD_RULES.get(fn, {})
                if fr.get('description'):
                    desc = fr['description']
                    break

        # Aggregate: worst status wins (fail > pass)
        worst = "pass"
        worst_value = ""
        worst_detail = ""
        for is_ab, sev, issue, val, _ in field_statuses:
            if is_ab:
                worst = "fail"
                if not worst_detail:
                    worst_detail = issue
                if not worst_value:
                    worst_value = str(val)[:100]

        if worst == "pass" and field_statuses:
            worst_value = str(field_statuses[0][3])[:100]

        check_results[check_key] = {
            "status": worst,
            "name": name,
            "value": worst_value,
            "detail": worst_detail,
            "description": desc,
        }

    # ── Phase 2b: Propagate results to sibling check_keys ────────────────
    # Some CHECK_RULES entries share the same ad.json field but have different
    # check_keys (e.g., dns_proxy_enabled → DNS_DETECT_CHECK + DNS_PROXY_CHECK).
    # Clone the result from the primary mapping.
    for ck_entry, ck_info in CHECK_RULES.items():
        if ck_entry in check_results:
            continue
        ck_fields = ck_info.get('fields', [])
        for fname in ck_fields:
            fr = FIELD_RULES.get(fname)
            if fr and fr.get('check_key', '') in check_results:
                check_results[ck_entry] = dict(check_results[fr['check_key']])
                check_results[ck_entry]['name'] = ck_info.get('name', ck_entry)
                check_results[ck_entry]['description'] = ck_info.get('desc', '')
                break

    # ── 字段缺失原因映射 ──────────────────────────────────────────────────
    _FIELD_MISSING_REASONS = {
        "heartbeat_state":        "非双机/集群模式，设备不采集心跳口数据",
        "static_ip_config":       "非集群模式，不适用",
        "rs_level_check":         "非双机模式，不适用",
        "static_proximity_check": "未配置 DNS 就近性规则",
        "proxy_policy_check":     "未配置优先代理策略",
        "base_disk_high_usage":   "磁盘使用率正常，未触发高使用率告警",
    }

    # ── Phase 3: Track uncovered CHECK_RULES items ─────────────────────────
    uncovered = []  # list of {check_key, name, desc, missing_fields, reasons}
    for ck_entry, ck_info in CHECK_RULES.items():
        if ck_entry in check_results:
            continue
        missing_fields = []
        reasons = []
        for fname in ck_info.get("fields", []):
            if fname not in data:
                missing_fields.append(fname)
                reason = _FIELD_MISSING_REASONS.get(fname, "不在本次巡检范围内")
                reasons.append(reason)
        if missing_fields:
            uncovered.append({
                "check_key": ck_entry,
                "name": ck_info.get("name", ck_entry),
                "desc": ck_info.get("desc", ""),
                "missing_fields": missing_fields,
                "reasons": reasons,
            })

    # ── Phase 4: Categorize via CHECK_RULES ──────────────────────────────
    feature_keys, health_keys, secure_keys = [], [], []
    for ck in check_results:
        cat = CHECK_RULES.get(ck, {}).get('category', 'feature')
        if cat == 'health':
            health_keys.append(ck)
        elif cat == 'secure':
            secure_keys.append(ck)
        else:
            feature_keys.append(ck)

    # ── Phase 4: Summary & health scores ─────────────────────────────────
    pass_count = sum(1 for v in check_results.values() if v["status"] == "pass")
    fail_count = sum(1 for v in check_results.values() if v["status"] == "fail")
    total = len(check_results)
    score = round(pass_count / total * 100) if total else 0

    def _dimension_scores(keys):
        p = sum(1 for k in keys if k in check_results and check_results[k]["status"] == "pass")
        t = len(keys)
        s = round(p / max(t, 1) * 100)
        return {"pass": p, "total": t, "score": s}

    f_score = _dimension_scores(feature_keys)
    h_score = _dimension_scores(health_keys)
    s_score = _dimension_scores(secure_keys)
    # 综合评分：跳过 0 项的分类
    _score_parts = [s["score"] for s in [f_score, h_score, s_score] if s["total"] > 0]
    overall = round(sum(_score_parts) / len(_score_parts)) if _score_parts else 0

    # ── Phase 5: Suggestions ────────────────────────────────────────────
    _CATEGORY_ORDER = {"secure": 0, "health": 1, "feature": 2}
    suggestions = []
    for key, result in check_results.items():
        if result["status"] == "fail":
            cat = CHECK_RULES.get(key, {}).get("category", "feature")
            suggestions.append({
                "check": key,
                "category": cat,
                "suggestion": _SUGGESTION_MAP.get(
                    key,
                    f"检查项 {result.get('name', key)} 状态异常，请关注",
                ),
            })
    suggestions.sort(key=lambda s: _CATEGORY_ORDER.get(s["category"], 99))

    # ── Phase 6: Device info ────────────────────────────────────────────
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
        "summary": {"total": total, "total_expected": len(CHECK_RULES), "pass": pass_count, "fail": fail_count, "score": score},
        "health_scores": {"feature": f_score, "health": h_score, "secure": s_score, "overall": overall},
        "suggestions": suggestions,
        "uncovered": uncovered,
    }


# ---------------------------------------------------------------------------
# Markdown 报告渲染
# ---------------------------------------------------------------------------

def _strip_proto(host: str) -> str:
    """去掉 URL 协议前缀，如 https://192.168.8.30 → 192.168.8.30"""
    for prefix in ("https://", "http://"):
        if host.startswith(prefix):
            return host[len(prefix):]
    return host


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
        return {"pass": "✅", "fail": "❌"}.get(s, s)

    def status_label(s: str) -> str:
        return {"pass": "正常", "fail": "异常"}.get(s, s)

    def score_icon_for(val):
        return "🟢" if val >= 90 else ("🟡" if val >= 70 else "🔴")

    def cat_summary(keys):
        p = sum(1 for k in keys if k in results and results[k]["status"] == "pass")
        f = sum(1 for k in keys if k in results and results[k]["status"] == "fail")
        t = p + f
        rate = round(p / max(t, 1) * 100)
        return {"total": t, "pass": p, "fail": f, "rate": rate}

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
                desc = r.get('description', '') or '检查项'
                rows.append(f"| {r.get('name', k)} | {desc} | {icon(r['status'])} {status_label(r['status'])} |")
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

    # ── 排查建议 ───────────────────────────────────────────────────────
    _CATEGORY_ICON = {"secure": "🛡️ 安全巡检", "health": "❤️ 健康巡检", "feature": "⚙️ 功能巡检"}
    suggestions = analysis.get("suggestions", [])
    suggestion_rows = []
    for sug in suggestions:
        check_key = sug.get('check', '')
        check_name = results.get(check_key, {}).get('name', check_key) if check_key else '-'
        cat_icon = _CATEGORY_ICON.get(sug.get('category', ''), sug.get('category', ''))
        suggestion_rows.append(
            f"| {cat_icon} | {check_name} | {sug.get('suggestion', '')} |"
        )
    suggestions_table = "\n".join(suggestion_rows) if suggestion_rows else "| - | - | 暂无异常项 |"

    # 设备显示名：name（ip），降级到纯 IP
    device_ip = _strip_proto(meta.get("host", "?"))
    device_label = device_ip
    try:
        import json as _json
        _devices_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "devices.json")
        if os.path.isfile(_devices_path):
            with open(_devices_path, encoding="utf-8") as _f:
                _data = _json.load(_f)
            for _d in _data.get("devices", []):
                _hosts = [_d.get("host", ""), _d.get("host", "").replace("https://", "http://")]
                if meta.get("host", "") in _hosts:
                    device_label = f"{_d.get('name', device_ip)}（{device_ip}）"
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
    all_rows_text = all_check_rows()
    check_detail_section = f"""| 检查项 | 检查详情 | 状态 |
|--------|---------|------|
{all_rows_text}
"""

    # ── 未检查项渲染 ───────────────────────────────────────────────────
    uncovered = analysis.get("uncovered", [])
    uncovered_section = ""
    if uncovered:
        uc_rows = []
        for uc in uncovered:
            reasons_str = "；".join(uc.get("reasons", ["不在本次巡检范围内"]))
            uc_rows.append(f"| {uc['name']} | {uc['desc']} | {reasons_str} |")
        uncovered_table = "\n".join(uc_rows)
        uncovered_section = f"""
### ⚠️ 未检查项（{len(uncovered)} 项）

以下检查项目前未出现在本次巡检报告中，通常是因为设备未采集对应数据，不代表设备存在异常。

| 检查项 | 检查详情 | 可能原因 |
|--------|---------|---------|
{uncovered_table}

"""

    return f"""## ✅ AD 巡检分析报告

**设备**: {device_label}
**巡检时间**: {check_time}
**巡检场景**: {meta.get("scene", "?")}
**检查项**: {summary["total"]}/{summary.get("total_expected", summary["total"])} 项

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
{uncovered_section}
---

### 📈 统计汇总

| 类别 | 检查项数 | 通过 | 异常 | 通过率 |
|------|----------|------|------|--------|
| ⚙️ 功能巡检 | {f["total"]} | {f["pass"]} | {f["fail"]} | {f["rate"]}% |
| ❤️ 健康巡检 | {h["total"]} | {h["pass"]} | {h["fail"]} | {h["rate"]}% |
| 🛡️ 安全巡检 | {s["total"]} | {s["pass"]} | {s["fail"]} | {s["rate"]}% |

---

### 💡 排查建议

以下检查项在本次巡检中状态为异常，建议按指引逐一排查：

| 类别 | 检查项 | 建议 |
|------|--------|------|
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
    meta = start_check(client, scene, force=force, work_dir=work_dir, skip_history=True)
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

    # Step 1-3: Start check (multi-device, skip history)
    meta = start_check(client, scene, force=force, work_dir=work_dir, skip_history=True)

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
    p_wait.add_argument("--host", default="", help="设备地址 https://IP")
    p_wait.add_argument("--hosts", default="", help="多设备地址，逗号分隔（配合 --work-dirs 使用）")
    p_wait.add_argument("--devices", default="", help="设备清单 JSON 文件路径")
    p_wait.add_argument("--user", default="admin")
    p_wait.add_argument("--password", default="")
    p_wait.add_argument("--work-dir", default=os.path.join(tempfile.gettempdir(), "ad_check"),
                        help="单设备工作目录")
    p_wait.add_argument("--work-dirs", default="", help="多设备工作目录，逗号分隔（与 --hosts 一一对应，多设备时必需）")
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

    # merge — 多设备报告合并
    p_merge = sub.add_parser("merge", help="合并多个单设备巡检结果，输出多设备汇总报告")
    p_merge.add_argument("--work-dirs", required=True,
                        help="工作目录，逗号分隔（与步骤3返回的 work_dir 一一对应）")
    p_merge.add_argument("--hosts", default="",
                        help="设备地址，逗号分隔（可从 meta 读取时可省略）")
    p_merge.add_argument("--scene", default="",
                        help="巡检场景（可从 meta 读取时可省略）")

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

        if args.hosts:
            # ── 多设备 wait ──────────────────────────────────────────
            if args.devices:
                devices = load_devices_json(args.devices)
                # Filter to only hosts specified in --hosts
                hosts_set = set(h.strip() for h in args.hosts.split(","))
                devices = [d for d in devices if d["host"] in hosts_set]
            else:
                # Try to discover devices.json for display names
                _devices_paths = [
                    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "devices.json"),
                    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "devices.json"),
                ]
                _found = False
                for _dp in _devices_paths:
                    if os.path.isfile(_dp):
                        try:
                            all_devices = load_devices_json(_dp)
                            hosts_set = set(h.strip() for h in args.hosts.split(","))
                            devices = [d for d in all_devices if d["host"] in hosts_set]
                            if devices:
                                _found = True
                                break
                        except Exception:
                            continue
                if not _found:
                    devices = parse_hosts_arg(args.hosts, args.user, password)
            if not devices:
                print("错误: 设备列表为空", file=sys.stderr)
                sys.exit(4)

            # Resolve work_dirs
            if not args.work_dirs:
                print("错误: 多设备模式必须指定 --work-dirs（与 --hosts 一一对应，从步骤 3 的 work_dir 输出获取）", file=sys.stderr)
                sys.exit(4)
            work_dirs_list = [d.strip() for d in args.work_dirs.split(",")]

            results = {}
            for i, device in enumerate(devices):
                host = device["host"]
                wd = work_dirs_list[i] if i < len(work_dirs_list) else os.path.join(args.work_dir, f"dev{i}")
                try:
                    client = ADClient(host, args.user, password)
                    meta = wait_and_download(client, work_dir=wd, poll_interval=args.poll_interval, timeout=args.timeout)
                    with open(meta["ad_json_path"], encoding="utf-8") as f:
                        data = json.load(f)
                    analysis = analyze(data)
                    analysis["_meta"] = meta
                    results[host] = {"meta": meta, "analysis": analysis, "markdown": render_markdown(analysis, meta)}
                    print(f"[{host}] ✅ 完成", file=sys.stderr)
                except (CheckTimeoutError, CheckDownloadError, RuntimeError, ADAuthError, ADConnectionError, ADAPIError) as e:
                    results[host] = {"error": str(e)}
                    print(f"[{host}] ❌ {e}", file=sys.stderr)

            device_names = {d["host"]: d["name"] for d in devices if d.get("name")}
            print(render_multi_device_report(results, scene="标准巡检", device_names=device_names))
            sys.exit(compute_multi_exit_code(results))

        if not args.host:
            print("错误: 必须指定 --host 或 --hosts", file=sys.stderr)
            sys.exit(4)

        # ── 单设备 wait ──────────────────────────────────────────────
        client = ADClient(args.host, args.user, password)
        try:
            meta = wait_and_download(
                client,
                work_dir=args.work_dir,
                poll_interval=args.poll_interval,
                timeout=args.timeout,
            )
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

    elif args.command == "merge":
        work_dirs = [d.strip() for d in args.work_dirs.split(",") if d.strip()]
        if not work_dirs:
            print("错误: --work-dirs 为空", file=sys.stderr)
            sys.exit(4)

        hosts_list = [h.strip() for h in args.hosts.split(",") if h.strip()] if args.hosts else []
        results = {}
        for i, wd in enumerate(work_dirs):
            # 读取 meta
            meta_path = os.path.join(wd, "_meta.json")
            if not os.path.exists(meta_path):
                print(f"⚠️ {wd}: 找不到 _meta.json，跳过", file=sys.stderr)
                continue
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)

            host = hosts_list[i] if i < len(hosts_list) else meta.get("host", wd)
            if not host:
                host = wd

            # 查找 ad.json
            ad_path = os.path.join(wd, "ad.json")
            if not os.path.exists(ad_path):
                for root, _, files in os.walk(wd):
                    if "ad.json" in files:
                        ad_path = os.path.join(root, "ad.json")
                        break
            if not os.path.exists(ad_path):
                print(f"⚠️ {wd}: 找不到 ad.json，跳过", file=sys.stderr)
                results[host] = {"error": "找不到 ad.json"}
                continue

            with open(ad_path, encoding="utf-8") as f:
                data = json.load(f)
            analysis = analyze(data)
            report_md = render_markdown(analysis, meta)
            results[host] = {"meta": meta, "analysis": analysis, "markdown": report_md}

        if not results:
            print("错误: 没有有效的设备数据", file=sys.stderr)
            sys.exit(4)

        # 引入 render_multi_device_report
        try:
            scene = args.scene or next(iter(results.values()))["meta"].get("scene", "标准巡检")
        except Exception:
            scene = "标准巡检"

        print(render_multi_device_report(results, scene=scene))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
