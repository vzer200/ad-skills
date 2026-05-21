#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sangfor AD API Client
深信服应用交付 (AD) 设备 API 客户端
使用 Python 内置库，无外部依赖
"""

import argparse
import base64
import json
import os
import ssl
import sys
import urllib.request
import urllib.error
import urllib.parse
from typing import Any, Dict, Optional

# Multi-device support (deferred import in multi_device.py avoids circular dependency)
from multi_device import (
    run_multi, parse_hosts_arg, load_devices_json,
    compute_multi_exit_code, host_slug,
)


class ADError(Exception):
    """AD API error base class."""
    def __init__(self, message, original=None):
        super().__init__(message)
        self.original = original

class ADConnectionError(ADError):
    """Connection failure (URLError, timeout)."""
    pass

class ADAuthError(ADError):
    """Authentication failure (HTTP 401/403)."""
    def __init__(self, message, http_code, original=None):
        super().__init__(message, original)
        self.http_code = http_code

class ADAPIError(ADError):
    """API error (HTTP 4xx/5xx non-auth)."""
    def __init__(self, message, http_code, response_body=None, original=None):
        super().__init__(message, original)
        self.http_code = http_code
        self.response_body = response_body


class ADClient:
    """Sangfor AD API 客户端"""

    def __init__(
        self,
        host: str,
        username: str = "admin",
        password: str = "",
        timeout: int = 30,
    ):
        """
        初始化 AD 客户端

        Args:
            host: AD 设备地址 (如: https://10.74.27.42)
            username: 用户名
            password: 密码
            timeout: 请求超时时间(秒)
        """
        self.host = host.rstrip("/")
        self.username = username
        self.password = password
        self.timeout = timeout

        # 创建 SSL 上下文，忽略证书错误
        # 直接用 SSLContext 而非 create_default_context()，避免 Windows
        # 枚举证书存储时卡死（AD 设备使用自签证书，不需要验证）
        self.ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        发送 API 请求

        Args:
            method: HTTP 方法 (GET/POST/PUT/PATCH/DELETE)
            endpoint: API 端点 (如: /sys/user/)
            data: 请求数据

        Returns:
            响应 JSON 数据

        Raises:
            urllib.error.URLError: 请求失败时抛出
        """
        url = f"{self.host}/api/lb/current-version{endpoint}"
        if params:
            qs = urllib.parse.urlencode(params)
            url = f"{url}?{qs}" if '?' not in url else f"{url}&{qs}"
        # 所有请求强制带 all_properties=true（已含则跳过）
        if 'all_properties' not in url:
            url = f"{url}&all_properties=true" if '?' in url else f"{url}?all_properties=true"

        # 编码认证信息
        auth_str = f"{self.username}:{self.password}"
        auth_bytes = base64.b64encode(auth_str.encode()).decode()

        # 设置请求头
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth_bytes}",
        }

        # 处理请求数据
        body = None
        if data:
            body = json.dumps(data).encode("utf-8")

        # 创建请求
        req = urllib.request.Request(
            url,
            data=body,
            headers=headers,
            method=method,
        )

        # 发送请求
        try:
            with urllib.request.urlopen(
                req,
                context=self.ssl_context,
                timeout=self.timeout,
            ) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            if e.code in (401, 403):
                raise ADAuthError(f"HTTP {e.code}: {error_body}", http_code=e.code, original=e)
            raise ADAPIError(f"HTTP {e.code}: {error_body}", http_code=e.code, response_body=error_body, original=e)
        except urllib.error.URLError as e:
            raise ADConnectionError(f"连接失败: {e.reason}", original=e)

    def _raw_request(self, url_path):
        """Binary download. url_path must start with /cgi/ and not contain .."""
        if not url_path.startswith("/cgi/") or ".." in url_path:
            raise ValueError(f"Invalid url_path: {url_path}")
        url = f"{self.host}{url_path}"
        req = urllib.request.Request(url, method="GET")
        auth = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
        req.add_header("Authorization", f"Basic {auth}")
        try:
            with urllib.request.urlopen(req, context=self.ssl_context, timeout=self.timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace") if e.fp else ""
            if e.code in (401, 403):
                raise ADAuthError(f"HTTP {e.code}: {body}", http_code=e.code, original=e)
            raise ADAPIError(f"HTTP {e.code}: {body}", http_code=e.code, response_body=body, original=e)
        except urllib.error.URLError as e:
            raise ADConnectionError(f"连接失败: {e.reason}", original=e)

    # -------------------------------------------------------------------------
    # 用户管理
    # -------------------------------------------------------------------------
    def get_users(self) -> Dict[str, Any]:
        """获取所有用户"""
        return self._request("GET", "/sys/user/")

    def get_user(self, name: str) -> Dict[str, Any]:
        """获取指定用户"""
        return self._request("GET", f"/sys/user/{name}")

    def create_user(self, user_data: Dict) -> Dict[str, Any]:
        """创建用户"""
        return self._request("POST", "/sys/user/", user_data)

    def update_user(self, name: str, user_data: Dict) -> Dict[str, Any]:
        """更新用户"""
        return self._request("PUT", f"/sys/user/{name}", user_data)

    def delete_user(self, name: str) -> Dict[str, Any]:
        """删除用户"""
        return self._request("DELETE", f"/sys/user/{name}")

    # -------------------------------------------------------------------------
    # 虚拟服务 (SLB)
    # -------------------------------------------------------------------------
    def get_virtual_services(self) -> Dict[str, Any]:
        """获取所有虚拟服务"""
        return self._request("GET", "/slb/virtual-service/")

    def get_virtual_service(self, name: str) -> Dict[str, Any]:
        """获取指定虚拟服务"""
        return self._request("GET", f"/slb/virtual-service/{name}")

    def create_virtual_service(self, vs_data: Dict) -> Dict[str, Any]:
        """创建虚拟服务"""
        return self._request("POST", "/slb/virtual-service/", vs_data)

    def update_virtual_service(self, name: str, vs_data: Dict) -> Dict[str, Any]:
        """更新虚拟服务"""
        return self._request("PUT", f"/slb/virtual-service/{name}", vs_data)

    def delete_virtual_service(self, name: str) -> Dict[str, Any]:
        """删除虚拟服务"""
        return self._request("DELETE", f"/slb/virtual-service/{name}")

    # -------------------------------------------------------------------------
    # 节点池
    # -------------------------------------------------------------------------
    def get_pools(self) -> Dict[str, Any]:
        """获取所有节点池"""
        return self._request("GET", "/slb/pool/")

    def get_pool(self, name: str) -> Dict[str, Any]:
        """获取指定节点池"""
        return self._request("GET", f"/slb/pool/{name}")

    def create_pool(self, pool_data: Dict) -> Dict[str, Any]:
        """创建节点池"""
        return self._request("POST", "/slb/pool/", pool_data)

    def update_pool(self, name: str, pool_data: Dict) -> Dict[str, Any]:
        """更新节点池"""
        return self._request("PUT", f"/slb/pool/{name}", pool_data)

    def delete_pool(self, name: str) -> Dict[str, Any]:
        """删除节点池"""
        return self._request("DELETE", f"/slb/pool/{name}")

    # -------------------------------------------------------------------------
    # 设备系统状态
    # -------------------------------------------------------------------------
    def get_sys_system(self) -> Dict[str, Any]:
        """获取设备系统状态 (CPU/内存/磁盘/连接等)"""
        return self._request("GET", "/stat/sys/system")

    def get_system_status(self) -> Dict[str, Any]:
        """获取系统状态"""
        return self._request("GET", "/stat/system/")

    def get_cpu_status(self) -> Dict[str, Any]:
        """获取 CPU 状态"""
        return self._request("GET", "/stat/system/cpu/")

    def get_memory_status(self) -> Dict[str, Any]:
        """获取内存状态"""
        return self._request("GET", "/stat/system/mem/")

    def get_disk_status(self) -> Dict[str, Any]:
        """获取磁盘状态"""
        return self._request("GET", "/stat/system/disk/")

    def get_network_status(self) -> Dict[str, Any]:
        """获取网络接口状态"""
        return self._request("GET", "/stat/system/net/")

    # -------------------------------------------------------------------------
    # 流量状态 (Stat)
    # -------------------------------------------------------------------------
    def get_vs_stat(self) -> Dict[str, Any]:
        """获取所有 VS 瞬时状态"""
        return self._request("GET", "/stat/slb/virtual-service/")

    def get_vs_stat_by_name(self, name: str) -> Dict[str, Any]:
        """获取指定 VS 瞬时状态"""
        return self._request("GET", f"/stat/slb/virtual-service/{name}/")

    def get_vs_summary_trend(
        self,
        items: list = None,
        trend: str = "last-hour",
    ) -> Dict[str, Any]:
        """
        获取所有 VS 汇总趋势数据

        Args:
            items: 指标列表，如 ["connection-rate", "connection", "general-throughput"]
                   可选值: connection-rate, connection, upstream-throughput,
                          downstream-throughput, general-throughput, http-request-rate,
                          client-connection, server-connection, ssl-connection-rate, ssl-connection
            trend: 时间范围 (last-5m, last-30m, last-hour, last-6h, last-day)
        """
        if items is None:
            items = ["connection-rate", "connection", "general-throughput"]
        items_json = json.dumps(items)
        items_encoded = urllib.parse.quote(items_json)
        return self._request(
            "GET",
            f"/stat/slb/virtual-service-summary/combine-items?trend={trend}&items={items_encoded}&netns=default&all_properties=true"
        )

    def get_vs_trend_by_name(
        self,
        name: str,
        items: list = None,
        trend: str = "last-hour",
    ) -> Dict[str, Any]:
        """
        获取指定 VS 趋势数据

        Args:
            name: VS 名称
            items: 指标列表
            trend: 时间范围
        """
        if items is None:
            items = ["connection-rate", "connection", "general-throughput"]
        items_json = json.dumps(items)
        items_encoded = urllib.parse.quote(items_json)
        return self._request(
            "GET",
            f"/stat/slb/virtual-service/{name}/combine-items?trend={trend}&items={items_encoded}&netns=default&all_properties=true"
        )

    def get_pool_node_stat(self, pool: str) -> Dict[str, Any]:
        """获取节点池内节点状态"""
        return self._request("GET", f"/stat/slb/pool/{pool}/nodes/")

    def get_all_node_stat(self) -> Dict[str, Any]:
        """获取全部节点状态"""
        return self._request("GET", "/stat/slb/nodes/")

    # -------------------------------------------------------------------------
    # 服务日志
    # -------------------------------------------------------------------------
    def get_service_log(self, limit: int = 10) -> Dict[str, Any]:
        """
        查询服务日志

        Args:
            limit: 返回条数，默认10条（获取最新的）
        """
        result = self._request("GET", "/log/service-log")
        items = result.get("items", [])
        # 按时间倒序，取最新 limit 条
        items.sort(key=lambda x: f"{x.get('date', '')} {x.get('time', '')}", reverse=True)
        result["items"] = items[:limit]
        return result

    # -------------------------------------------------------------------------
    # SSL 证书
    # -------------------------------------------------------------------------
    def get_ssl_certificates(self) -> Dict[str, Any]:
        """
        获取所有 SSL 证书信息

        Returns:
            包含证书列表的响应，关键字段:
            - validity_not_after: 证书到期时间
            - name: 证书名称
            - issuer: 颁发者
            - subject: 使用者
        """
        return self._request("GET", "/rc/ssl-certificate/all")

    # -------------------------------------------------------------------------
    # 高可用性
    # -------------------------------------------------------------------------
    def get_ha_status(self) -> Dict[str, Any]:
        """获取 HA 状态"""
        return self._request("GET", "/ha/status/")

    def get_ha_cluster(self) -> Dict[str, Any]:
        """获取集群信息"""
        return self._request("GET", "/ha/cluster/")

    # -------------------------------------------------------------------------
    # SSH 配置管理
    # -------------------------------------------------------------------------
    def get_ssh_config(self) -> Dict[str, Any]:
        """获取 SSH 配置"""
        return self._request("GET", "/sys/ssh-setting/")

    def update_ssh_config(
        self,
        ssh_status: str = "ENABLE",
        ssh_port: int = 22,
        session_timeout: int = 600,
    ) -> Dict[str, Any]:
        """
        更新 SSH 配置

        Args:
            ssh_status: SSH 状态 (ENABLE/DISABLE)
            ssh_port: SSH 端口
            session_timeout: 会话超时时间(秒)
        """
        data = {
            "ssh_console": {
                "ssh_status": ssh_status,
                "ssh_port": ssh_port,
                "session_timeout": session_timeout,
            }
        }
        return self._request("PUT", "/sys/ssh-setting/", data)

    def enable_ssh(self, ssh_port: int = 22, session_timeout: int = 600) -> Dict[str, Any]:
        """启用 SSH"""
        return self.update_ssh_config("ENABLE", ssh_port, session_timeout)

    def disable_ssh(self, ssh_port: int = 22, session_timeout: int = 600) -> Dict[str, Any]:
        """禁用 SSH"""
        return self.update_ssh_config("DISABLE", ssh_port, session_timeout)

    # -------------------------------------------------------------------------
    # 黑盒日志
    # -------------------------------------------------------------------------
    def get_last_event(self):
        """Get last async task event (used by blackbox for task polling)."""
        return self._request("GET", "/last-event")

    def export_blackbox_log(
        self,
        from_date: str,
        to_date: str,
        password: str = "",
    ) -> Dict[str, Any]:
        """
        导出黑盒日志

        Args:
            from_date: 开始日期 (YYYY-MM-DD)
            to_date: 结束日期 (YYYY-MM-DD)
            password: 压缩密码 (明文，用于设置导出文件的解压密码)

        Returns:
            包含 token 的响应，用于下载文件
        """
        data = {
            "from": from_date,
            "to": to_date,
        }
        if password:
            data["password"] = password
        return self._request("POST", "/log/blackbox-log/export", data)

    def download_blackbox_log(self, file_token, save_path):
        data = self._raw_request(f"/cgi/file-resource?d={file_token}")
        os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
        with open(save_path, "wb") as f:
            f.write(data)
        return save_path


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="Sangfor AD API Client",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    # 全局参数
    parser.add_argument(
        "--host", "-H",
        default=os.environ.get("AD_HOST", ""),
        help="AD 设备地址 (可设置环境变量 AD_HOST)",
    )
    parser.add_argument(
        "--user", "-u",
        default=os.environ.get("AD_USER", "admin"),
        help="用户名 (默认: admin)",
    )
    parser.add_argument(
        "--password", "-p",
        default=os.environ.get("AD_PASS", ""),
        help="密码 (可设置环境变量 AD_PASS)",
    )
    parser.add_argument(
        "--json", "-j",
        action="store_true",
        help="输出原始 JSON 格式",
    )
    parser.add_argument(
        "--pretty", "-pp",
        action="store_true",
        help="美化输出 JSON",
    )

    # 子命令
    subparsers = parser.add_subparsers(dest="command", help="可用命令")

    # login 命令
    subparsers.add_parser("login", help="测试登录")

    # users 命令
    users_parser = subparsers.add_parser("users", help="用户管理")
    users_sub = users_parser.add_subparsers(dest="subcommand", help="子命令")
    users_list = users_sub.add_parser("list", help="列出所有用户")
    users_get = users_sub.add_parser("get", help="获取指定用户")
    users_get.add_argument("name", help="用户名")

    # slb 命令
    slb_parser = subparsers.add_parser("slb", help="虚拟服务管理")
    slb_sub = slb_parser.add_subparsers(dest="subcommand", help="子命令")
    slb_list = slb_sub.add_parser("list", help="列出所有虚拟服务")
    slb_get = slb_sub.add_parser("get", help="获取指定虚拟服务")
    slb_get.add_argument("name", help="虚拟服务名称")

    # pool 命令
    pool_parser = subparsers.add_parser("pool", help="节点池管理")
    pool_sub = pool_parser.add_subparsers(dest="subcommand", help="子命令")
    pool_list = pool_sub.add_parser("list", help="列出所有节点池")
    pool_get = pool_sub.add_parser("get", help="获取指定节点池")
    pool_get.add_argument("name", help="节点池名称")

    # stat 命令
    stat_parser = subparsers.add_parser("stat", help="系统状态")
    stat_sub = stat_parser.add_subparsers(dest="subcommand", help="子命令")
    stat_sub.add_parser("device", help="系统概览")
    stat_sub.add_parser("sys", help="设备系统状态 (CPU/内存/磁盘/连接)")
    stat_sub.add_parser("vs", help="所有 VS 瞬时状态")
    stat_vs_get = stat_sub.add_parser("vs-get", help="指定 VS 瞬时状态")
    stat_vs_get.add_argument("name", help="VS 名称")
    stat_trend = stat_sub.add_parser("trend", help="所有 VS 汇总趋势")
    stat_trend.add_argument("--items", default="connection-rate,connection,general-throughput", help="逗号分隔的指标列表")
    stat_trend.add_argument("--trend", default="last-hour", help="时间范围 (last-5m, last-30m, last-hour, last-6h, last-day)")
    stat_vs_trend = stat_sub.add_parser("vs-trend", help="指定 VS 趋势")
    stat_vs_trend.add_argument("name", help="VS 名称")
    stat_vs_trend.add_argument("--items", default="connection-rate,connection,general-throughput", help="逗号分隔的指标列表")
    stat_vs_trend.add_argument("--trend", default="last-hour", help="时间范围")
    stat_pool = stat_sub.add_parser("pool", help="节点池节点状态")
    stat_pool.add_argument("pool", help="节点池名称")
    stat_sub.add_parser("nodes", help="全部节点状态")
    stat_sub.add_parser("cpu", help="CPU 状态")
    stat_sub.add_parser("mem", help="内存状态")
    stat_sub.add_parser("disk", help="磁盘状态")
    stat_sub.add_parser("net", help="网络状态")

    # cert 命令
    cert_parser = subparsers.add_parser("cert", help="SSL 证书管理")
    cert_sub = cert_parser.add_subparsers(dest="subcommand", help="子命令")
    cert_sub.add_parser("list", help="列出所有 SSL 证书")

    # log 命令
    log_parser = subparsers.add_parser("log", help="日志查询")
    log_sub = log_parser.add_subparsers(dest="subcommand", help="子命令")
    log_service = log_sub.add_parser("service", help="查询服务日志")
    log_service.add_argument("--limit", type=int, default=10, help="返回条数 (默认10)")

    # ha 命令
    ha_parser = subparsers.add_parser("ha", help="高可用性")
    ha_sub = ha_parser.add_subparsers(dest="subcommand", help="子命令")
    ha_sub.add_parser("status", help="HA 状态")
    ha_sub.add_parser("cluster", help="集群信息")

    args = parser.parse_args()

    # 检查参数
    if not args.host:
        print("错误: 未指定 AD 设备地址", file=sys.stderr)
        print("使用 --host 或设置环境变量 AD_HOST", file=sys.stderr)
        sys.exit(4)

    if not args.password:
        print("错误: 未指定密码", file=sys.stderr)
        print("使用 --password 或设置环境变量 AD_PASS", file=sys.stderr)
        sys.exit(4)

    # 创建客户端
    client = ADClient(
        host=args.host,
        username=args.user,
        password=args.password,
    )

    # 输出选项
    output_options = {"indent": 2 if args.pretty else None}

    def output(data: Dict) -> None:
        """输出数据"""
        if args.json:
            print(json.dumps(data, **output_options))
        elif args.pretty:
            print(json.dumps(data, **output_options, ensure_ascii=False))
        else:
            print(json.dumps(data, **output_options))

    # 执行命令
    try:
        if args.command == "login":
            result = client.get_users()
            print("✓ 登录成功")
            output(result)

        elif args.command == "users":
            if args.subcommand == "list":
                output(client.get_users())
            elif args.subcommand == "get":
                output(client.get_user(args.name))

        elif args.command == "slb":
            if args.subcommand == "list":
                output(client.get_virtual_services())
            elif args.subcommand == "get":
                output(client.get_virtual_service(args.name))

        elif args.command == "pool":
            if args.subcommand == "list":
                output(client.get_pools())
            elif args.subcommand == "get":
                output(client.get_pool(args.name))

        elif args.command == "stat":
            if args.subcommand == "device":
                output(client.get_system_status())
            elif args.subcommand == "sys":
                output(client.get_sys_system())
            elif args.subcommand == "vs":
                output(client.get_vs_stat())
            elif args.subcommand == "vs-get":
                output(client.get_vs_stat_by_name(args.name))
            elif args.subcommand == "trend":
                items = args.items.split(",") if args.items else None
                output(client.get_vs_summary_trend(items=items, trend=args.trend))
            elif args.subcommand == "vs-trend":
                items = args.items.split(",") if args.items else None
                output(client.get_vs_trend_by_name(args.name, items=items, trend=args.trend))
            elif args.subcommand == "pool":
                output(client.get_pool_node_stat(args.pool))
            elif args.subcommand == "nodes":
                output(client.get_all_node_stat())
            elif args.subcommand == "cpu":
                output(client.get_cpu_status())
            elif args.subcommand == "mem":
                output(client.get_memory_status())
            elif args.subcommand == "disk":
                output(client.get_disk_status())
            elif args.subcommand == "net":
                output(client.get_network_status())

        elif args.command == "cert":
            if args.subcommand == "list":
                output(client.get_ssl_certificates())

        elif args.command == "log":
            if args.subcommand == "service":
                output(client.get_service_log(limit=args.limit))

        elif args.command == "ha":
            if args.subcommand == "status":
                output(client.get_ha_status())
            elif args.subcommand == "cluster":
                output(client.get_ha_cluster())

        else:
            parser.print_help()

    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()