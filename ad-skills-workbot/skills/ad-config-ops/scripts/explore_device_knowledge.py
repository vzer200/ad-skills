from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import requests

try:
    import urllib3

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except Exception:
    urllib3 = None


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_ROOT = SCRIPT_DIR.parent
DEFAULT_INDEX = SKILL_ROOT / "references" / "api-index.json"
DEFAULT_OUT_DIR = SKILL_ROOT / "references" / "product-knowledge"

SECRET_KEY_RE = re.compile(
    r"(password|passwd|secret|token|private[_-]?key|certificate|cert|credential|session|cookie|community)",
    re.IGNORECASE,
)
PATH_PARAMETER_RE = re.compile(r"{[^{}]+}")
PROBE_PREFIX = "adops_probe_"

SKIP_READ_SEGMENTS = {
    "login",
    "logout",
    "token",
    "user",
    "users",
    "role",
    "roles",
    "account",
    "accounts",
    "administrator",
    "administrators",
    "permission",
    "permissions",
}
SKIP_READ_PREFIXES = (
    "/api/ad/v3/debug/",
    "/api/ad/v3/stat/",
    "/api/ad/v3/report/",
    "/api/ad/v3/license",
    "/api/ad/v3/import",
    "/api/ad/v3/export",
    "/api/ad/v3/batch",
)
MUTATION_BLOCKED_SEGMENTS = SKIP_READ_SEGMENTS | {
    "debug",
    "stat",
    "report",
    "license",
    "import",
    "export",
    "batch",
    "sys",
    "system",
    "ha",
    "cluster",
    "net",
    "network",
    "link",
    "interface",
    "mgmt",
    "management",
    "admin",
    "auth",
}
MUTATION_BLOCKED_TERMS = (
    "管理口",
    "管理接口",
    "管理服务",
    "管理地址",
    "管理访问",
    "用户",
    "角色",
    "权限",
    "认证",
    "关机",
    "重启",
    "升级",
)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Safely explore a Sangfor AD device and generate sanitized product-knowledge notes."
    )
    parser.add_argument("--host", default=os.environ.get("AD_HOST"), help="Device address, with or without https://.")
    parser.add_argument("--username", default=os.environ.get("AD_USERNAME"), help="Basic-auth username.")
    parser.add_argument("--password", default=os.environ.get("AD_PASSWORD"), help="Basic-auth password.")
    parser.add_argument("--token", default=os.environ.get("AD_TOKEN"), help="Existing x-token-sangforad token.")
    parser.add_argument("--api-index", type=Path, default=DEFAULT_INDEX, help="Generated API index path.")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR, help="Directory for sanitized knowledge outputs.")
    parser.add_argument("--max-collections", type=int, default=260, help="Maximum no-parameter collection GETs to scan.")
    parser.add_argument("--top", type=int, default=5, help="Collection sample size for GET scans.")
    parser.add_argument("--connect-timeout", type=float, default=5.0)
    parser.add_argument("--read-timeout", type=float, default=20.0)
    parser.add_argument(
        "--crud-probes",
        action="store_true",
        help="Run bounded create/get/patch/delete probes on temporary SLB objects only.",
    )
    return parser.parse_args(argv)


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def normalize_base_url(host: str) -> str:
    host = host.strip().rstrip("/")
    if not host:
        raise ValueError("--host is required")
    if not re.match(r"^https?://", host, flags=re.I):
        host = "https://" + host
    return host


def path_segments(path: str) -> list[str]:
    return [part.lower() for part in path.split("?")[0].strip("/").split("/") if part]


def has_sensitive_segment(path: str) -> bool:
    segments = path_segments(path)
    if any(segment in SKIP_READ_SEGMENTS for segment in segments):
        return True
    # Avoid identity-provider objects while still allowing slb/service-monitor/ldap.
    if "auth" in segments or (segments[-1:] == ["ldap"] and "service-monitor" not in segments):
        return True
    return False


def should_skip_read(path: str) -> tuple[bool, str]:
    lowered = path.lower()
    if any(lowered.startswith(prefix) for prefix in SKIP_READ_PREFIXES):
        return True, "dangerous_or_noisy_module"
    if has_sensitive_segment(path):
        return True, "identity_or_auth_sensitive"
    if PATH_PARAMETER_RE.search(path):
        return True, "requires_path_parameter"
    return False, ""


def mutation_allowed(path: str, description: str = "") -> tuple[bool, str]:
    segments = set(path_segments(path))
    blocked = sorted(segments & MUTATION_BLOCKED_SEGMENTS)
    if blocked:
        return False, "blocked_path_segments:" + ",".join(blocked)
    searchable = (path + " " + description).lower()
    for term in MUTATION_BLOCKED_TERMS:
        if term in searchable:
            return False, "blocked_term:" + term
    if not path.startswith("/api/ad/v3/slb/"):
        return False, "only_slb_business_objects_are_mutated"
    return True, ""


def configure_session(args: argparse.Namespace) -> requests.Session:
    session = requests.Session()
    session.verify = False
    session.headers.update({"Accept": "application/json"})
    if args.token:
        session.headers["x-token-sangforad"] = args.token
    elif args.username and args.password is not None:
        session.auth = (args.username, args.password)
    else:
        raise ValueError("Provide --token, or --username and --password, or AD_TOKEN/AD_USERNAME/AD_PASSWORD.")
    return session


def full_url(base_url: str, path: str) -> str:
    return base_url.rstrip("/") + "/" + path.lstrip("/")


def safe_json(response: requests.Response) -> Any:
    try:
        return response.json()
    except Exception:
        return None


def scalar_type(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int) and not isinstance(value, bool):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return type(value).__name__


def redact(value: Any, key: str = "") -> Any:
    if SECRET_KEY_RE.search(key):
        return "<redacted>"
    if isinstance(value, dict):
        return {str(k): redact(v, str(k)) for k, v in value.items()}
    if isinstance(value, list):
        return [redact(item, key) for item in value[:5]]
    if isinstance(value, str) and len(value) > 180:
        return value[:177] + "..."
    return value


def shape_of(value: Any, depth: int = 0) -> Any:
    if depth > 2:
        return scalar_type(value)
    if isinstance(value, dict):
        return {str(k): shape_of(v, depth + 1) for k, v in sorted(value.items())[:80] if not SECRET_KEY_RE.search(str(k))}
    if isinstance(value, list):
        if not value:
            return {"type": "array", "items": None}
        return {"type": "array", "items": shape_of(value[0], depth + 1), "sampled_items": min(len(value), 5)}
    return scalar_type(value)


def payload_summary(payload: Any) -> dict[str, Any]:
    summary: dict[str, Any] = {"json_type": scalar_type(payload)}
    if isinstance(payload, dict):
        summary["keys"] = sorted(str(k) for k in payload.keys() if not SECRET_KEY_RE.search(str(k)))
        items = payload.get("items")
        if isinstance(items, list):
            summary["total_items"] = payload.get("total_items", payload.get("total"))
            summary["item_count_returned"] = len(items)
            key_counter: Counter[str] = Counter()
            for item in items[:5]:
                if isinstance(item, dict):
                    key_counter.update(k for k in item.keys() if not SECRET_KEY_RE.search(str(k)))
            summary["item_keys"] = sorted(key_counter)
            summary["item_shape"] = shape_of(items[0]) if items else None
        elif "data" in payload:
            summary["data_shape"] = shape_of(payload.get("data"))
        else:
            summary["shape"] = shape_of(payload)
        message = extract_message(payload)
        if message:
            summary["message"] = message
    elif isinstance(payload, list):
        summary["item_count_returned"] = len(payload)
        summary["item_shape"] = shape_of(payload[0]) if payload else None
    return summary


def extract_message(payload: Any) -> str | None:
    if not isinstance(payload, dict):
        return None
    for key in ("message", "msg", "description", "reason", "error", "detail"):
        value = payload.get(key)
        if isinstance(value, str):
            return value[:300]
    return None


def request_json(
    session: requests.Session,
    base_url: str,
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    payload: Any = None,
    timeout: tuple[float, float],
) -> dict[str, Any]:
    start = time.monotonic()
    record: dict[str, Any] = {"method": method.upper(), "path": path}
    try:
        response = session.request(
            method.upper(),
            full_url(base_url, path),
            params=params,
            json=payload if method.upper() in {"POST", "PUT", "PATCH"} else None,
            timeout=timeout,
        )
        elapsed = round((time.monotonic() - start) * 1000)
        json_payload = safe_json(response)
        record.update(
            {
                "status": response.status_code,
                "ok": 200 <= response.status_code < 300,
                "elapsed_ms": elapsed,
                "content_type": response.headers.get("content-type", ""),
                "summary": payload_summary(json_payload),
            }
        )
        if not isinstance(json_payload, (dict, list)) and response.text:
            record["text_preview"] = response.text[:300]
        return record
    except requests.RequestException as exc:
        record.update({"status": None, "ok": False, "error": type(exc).__name__, "message": str(exc)[:300]})
        return record


def load_index(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def operation_inventory(index: dict[str, Any]) -> dict[str, Any]:
    by_method: Counter[str] = Counter()
    by_module: dict[str, Counter[str]] = defaultdict(Counter)
    for op in index.get("operations", []) or []:
        method = str(op.get("method", "")).upper()
        document = str(op.get("document") or "")
        module = document.split("/", 1)[0] if "/" in document else document.rsplit(".", 1)[0]
        by_method[method] += 1
        by_module[module or "root"][method] += 1
    return {
        "operation_count": sum(by_method.values()),
        "by_method": dict(sorted(by_method.items())),
        "by_module": {module: dict(counter) for module, counter in sorted(by_module.items())},
        "definition_count": len(index.get("definitions", []) or []),
        "document_count": len(index.get("documents", []) or []),
    }


def collection_operations(index: dict[str, Any], max_count: int) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for op in index.get("operations", []) or []:
        path = str(op.get("path") or "")
        if str(op.get("method", "")).lower() != "get":
            continue
        if not path.endswith("/"):
            continue
        skip, reason = should_skip_read(path)
        if skip:
            continue
        candidates.append(op)
    candidates.sort(key=lambda item: (str(item.get("document") or ""), str(item.get("path") or "")))
    return candidates[:max_count]


def scan_versions(session: requests.Session, base_url: str, timeout: tuple[float, float]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for version in ("v3", "v4"):
        for suffix in ("version", "scenario"):
            records.append(request_json(session, base_url, "GET", f"/api/ad/{version}/{suffix}", timeout=timeout))
    return records


def scan_collections(
    session: requests.Session,
    base_url: str,
    operations: list[dict[str, Any]],
    top: int,
    timeout: tuple[float, float],
) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for op in operations:
        path = str(op.get("path") or "")
        params = {"all_properties": "true", "$top": str(top)}
        result = request_json(session, base_url, "GET", path, params=params, timeout=timeout)
        if result.get("status") in {400, 404, 405}:
            fallback = request_json(session, base_url, "GET", path, params={"$top": str(top)}, timeout=timeout)
            if fallback.get("ok") or not result.get("ok"):
                fallback["fallback_without_all_properties"] = True
                result = fallback
        result.update(
            {
                "document": op.get("document"),
                "operationId": op.get("operationId"),
                "api_summary": op.get("summary"),
                "api_description": op.get("description"),
            }
        )
        results.append(result)
    return results


def cleanup_request(
    session: requests.Session,
    base_url: str,
    path: str,
    timeout: tuple[float, float],
    records: list[dict[str, Any]],
) -> None:
    allowed, reason = mutation_allowed(path, "temporary cleanup")
    if not allowed:
        records.append({"method": "DELETE", "path": path, "ok": False, "blocked": reason})
        return
    records.append(request_json(session, base_url, "DELETE", path, timeout=timeout))


def mutate(
    session: requests.Session,
    base_url: str,
    method: str,
    path: str,
    payload: Any,
    timeout: tuple[float, float],
    records: list[dict[str, Any]],
    description: str,
) -> bool:
    allowed, reason = mutation_allowed(path, description)
    if not allowed:
        records.append({"method": method.upper(), "path": path, "ok": False, "blocked": reason})
        return False
    record = request_json(session, base_url, method, path, payload=payload, timeout=timeout)
    record["payload_shape"] = shape_of(payload)
    records.append(record)
    return bool(record.get("ok"))


def run_crud_probes(session: requests.Session, base_url: str, timeout: tuple[float, float]) -> dict[str, Any]:
    stamp = dt.datetime.now().strftime("%Y%m%d%H%M%S")
    monitor = PROBE_PREFIX + "icmp_" + stamp
    pool = PROBE_PREFIX + "pool_" + stamp
    node = PROBE_PREFIX + "node_" + stamp
    records: list[dict[str, Any]] = []
    cleanup_stack: list[str] = []

    monitor_path = f"/api/ad/v3/slb/service-monitor/icmp/{monitor}"
    pool_path = f"/api/ad/v3/slb/pool/{pool}"
    node_path = f"/api/ad/v3/slb/pool/{pool}/nodes/{node}"

    try:
        monitor_payload = {
            "name": monitor,
            "description": "Temporary AD-OPS product-knowledge probe; delete immediately.",
            "type": "ICMP",
            "timeout": 2,
            "interval": 10,
            "err_interval": 2,
            "err_interval_state": "DISABLE",
            "host": "*",
            "debug_mode": "DISABLE",
            "gateway_detect": "DISABLE",
        }
        if mutate(
            session,
            base_url,
            "POST",
            "/api/ad/v3/slb/service-monitor/icmp/",
            monitor_payload,
            timeout,
            records,
            "create temporary ICMP monitor",
        ):
            cleanup_stack.append(monitor_path)
            records.append(request_json(session, base_url, "GET", monitor_path, params={"all_properties": "true"}, timeout=timeout))
            mutate(
                session,
                base_url,
                "PATCH",
                monitor_path,
                {"description": "Temporary AD-OPS probe patched; delete immediately."},
                timeout,
                records,
                "patch temporary ICMP monitor",
            )

        pool_payload = {
            "name": pool,
            "description": "Temporary AD-OPS product-knowledge probe; delete immediately.",
            "method": "ROUND-ROBIN",
            "service_monitors": [monitor] if monitor_path in cleanup_stack else [],
        }
        if mutate(
            session,
            base_url,
            "POST",
            "/api/ad/v3/slb/pool/",
            pool_payload,
            timeout,
            records,
            "create temporary SLB pool",
        ):
            cleanup_stack.append(pool_path)
            records.append(request_json(session, base_url, "GET", pool_path, params={"all_properties": "true"}, timeout=timeout))
            mutate(
                session,
                base_url,
                "PATCH",
                pool_path,
                {"description": "Temporary AD-OPS probe patched; delete immediately."},
                timeout,
                records,
                "patch temporary SLB pool",
            )

            node_payload = {
                "name": node,
                "description": "Temporary AD-OPS product-knowledge probe; delete immediately.",
                "type": "ADDRESS",
                "address": "198.18.0.10",
                "port": 8080,
                "state": "OFFLINE",
                "weight": 1,
                "priority_level": 1,
                "inherit_pool_monitor": "ENABLE",
            }
            if mutate(
                session,
                base_url,
                "POST",
                f"/api/ad/v3/slb/pool/{pool}/nodes/",
                node_payload,
                timeout,
                records,
                "create temporary disabled node in temporary pool",
            ):
                cleanup_stack.append(node_path)
                records.append(
                    request_json(session, base_url, "GET", node_path, params={"all_properties": "true"}, timeout=timeout)
                )
                mutate(
                    session,
                    base_url,
                    "PATCH",
                    node_path,
                    {"description": "Temporary AD-OPS probe patched; delete immediately.", "state": "OFFLINE"},
                    timeout,
                    records,
                    "patch temporary disabled node",
                )
    finally:
        for path in reversed(cleanup_stack):
            cleanup_request(session, base_url, path, timeout, records)
        for path in (node_path, pool_path, monitor_path):
            records.append(request_json(session, base_url, "GET", path, params={"all_properties": "true"}, timeout=timeout))

    return {
        "probe_prefix": PROBE_PREFIX,
        "created_names": {"monitor": monitor, "pool": pool, "node": node},
        "records": records,
        "residual_ok": all(
            record.get("method") != "GET" or record.get("status") in {404, 400}
            for record in records[-3:]
        ),
    }


def summarize_collection_results(results: list[dict[str, Any]]) -> dict[str, Any]:
    status_counter: Counter[str] = Counter()
    module_counter: dict[str, Counter[str]] = defaultdict(Counter)
    success_by_module: dict[str, int] = Counter()
    for item in results:
        status_counter[str(item.get("status"))] += 1
        document = str(item.get("document") or "")
        module = document.split("/", 1)[0] if "/" in document else document.rsplit(".", 1)[0]
        module_counter[module or "root"][str(item.get("status"))] += 1
        if item.get("ok"):
            success_by_module[module or "root"] += 1
    interesting = []
    for item in results:
        if item.get("ok"):
            total = item.get("summary", {}).get("total_items")
            if isinstance(total, int) and total > 0:
                interesting.append(
                    {
                        "path": item.get("path"),
                        "document": item.get("document"),
                        "total_items": total,
                        "item_keys": item.get("summary", {}).get("item_keys", []),
                    }
                )
    return {
        "scanned": len(results),
        "status_counts": dict(status_counter),
        "status_by_module": {module: dict(counter) for module, counter in sorted(module_counter.items())},
        "successful_non_empty_collections": interesting[:80],
        "success_count_by_module": dict(sorted(success_by_module.items())),
    }


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_markdown(out_dir: Path, report: dict[str, Any]) -> Path:
    md = out_dir / "README.md"
    inventory = report["api_inventory"]
    collections = report["collection_summary"]
    crud = report.get("crud_probes")
    lines = [
        "# AD 设备探索知识库",
        "",
        "本目录由 `skills/ad-config-ops/scripts/explore_device_knowledge.py` 生成，内容是脱敏后的设备 API 行为摘要，不包含设备密码、令牌、证书或完整客户配置。",
        "",
        "## 安全边界",
        "",
        "- 禁止修改管理口、管理接口、管理服务、管理访问控制、系统网络、HA/集群、关机、重启、升级、导入导出、调试动作。",
        "- 禁止修改用户、角色、权限、管理员账号、认证相关配置。",
        "- 写探测只允许 `adops_probe_` 前缀的临时 SLB 业务对象，创建后立即 GET、PATCH、DELETE，并在结尾回查确认不存在。",
        "",
        "## 本次设备事实",
        "",
        f"- 探索时间：`{report['generated_at']}`",
        f"- API 索引操作数：`{inventory['operation_count']}`，定义数：`{inventory['definition_count']}`，文档数：`{inventory['document_count']}`",
        f"- 集合 GET 扫描数量：`{collections['scanned']}`",
        f"- 集合 GET 状态分布：`{collections['status_counts']}`",
        "",
        "## 版本与场景",
        "",
    ]
    for item in report.get("version_probe", []):
        summary = item.get("summary", {})
        lines.append(f"- `{item.get('path')}` -> `{item.get('status')}`；结构：`{summary.get('keys') or summary.get('json_type')}`")
    lines.extend(["", "## 模块覆盖", ""])
    for module, counter in collections.get("status_by_module", {}).items():
        lines.append(f"- `{module}`：{counter}")
    lines.extend(["", "## 非空配置集合", ""])
    interesting = collections.get("successful_non_empty_collections", [])
    if interesting:
        for item in interesting[:40]:
            keys = ", ".join(item.get("item_keys") or [])
            lines.append(f"- `{item['path']}`：`total_items={item['total_items']}`；字段：{keys}")
    else:
        lines.append("- 本次扫描未发现非空集合，或场景未启用。")
    lines.extend(["", "## 写探测结果", ""])
    if crud:
        residual = "无残留" if crud.get("residual_ok") else "需要人工复核"
        lines.append(f"- 临时对象前缀：`{crud.get('probe_prefix')}`")
        lines.append(f"- 清理校验：{residual}")
        for record in crud.get("records", []):
            method = record.get("method")
            path = record.get("path")
            status = record.get("status")
            blocked = record.get("blocked")
            suffix = f"，blocked={blocked}" if blocked else ""
            lines.append(f"- `{method} {path}` -> `{status}`{suffix}")
    else:
        lines.append("- 本次未启用 `--crud-probes`，没有执行写探测。")
    lines.extend(
        [
            "",
            "## 产物",
            "",
            "- `device-exploration-summary.json`：本次探索总览。",
            "- `collection-scan.json`：集合 GET 的脱敏结构摘要。",
            "- `crud-probes.json`：临时对象写探测记录，仅在启用 `--crud-probes` 时生成。",
            "- `api-inventory.json`：本地 API 索引的模块和方法统计。",
        ]
    )
    md.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return md


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    base_url = normalize_base_url(args.host)
    timeout = (args.connect_timeout, args.read_timeout)
    session = configure_session(args)
    index = load_index(args.api_index)
    args.out_dir.mkdir(parents=True, exist_ok=True)

    inventory = operation_inventory(index)
    write_json(args.out_dir / "api-inventory.json", inventory)

    version_probe = scan_versions(session, base_url, timeout)
    ops = collection_operations(index, args.max_collections)
    collection_scan = scan_collections(session, base_url, ops, args.top, timeout)
    write_json(args.out_dir / "collection-scan.json", collection_scan)

    crud_probe = None
    if args.crud_probes:
        crud_probe = run_crud_probes(session, base_url, timeout)
        write_json(args.out_dir / "crud-probes.json", crud_probe)

    report = {
        "generated_at": utc_now(),
        "host": "<redacted>",
        "api_inventory": inventory,
        "version_probe": version_probe,
        "collection_summary": summarize_collection_results(collection_scan),
        "crud_probes": crud_probe,
        "safety_policy": {
            "mutation_blocked_segments": sorted(MUTATION_BLOCKED_SEGMENTS),
            "mutation_blocked_terms": list(MUTATION_BLOCKED_TERMS),
            "probe_prefix": PROBE_PREFIX,
        },
    }
    write_json(args.out_dir / "device-exploration-summary.json", report)
    md = write_markdown(args.out_dir, report)
    print(
        json.dumps(
            {
                "ok": True,
                "out_dir": str(args.out_dir),
                "summary": str(args.out_dir / "device-exploration-summary.json"),
                "markdown": str(md),
                "crud_probes": bool(args.crud_probes),
                "residual_ok": None if not crud_probe else crud_probe.get("residual_ok"),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
