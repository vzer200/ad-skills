from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


DEFAULT_RESOURCE_ORDER = [
    "slb/user",
    "slb/service-host",
    "slb/security-node",
    "slb/security-pool",
    "slb/service-chain",
    "slb/access-control-profile",
    "slb/http-defence",
    "slb/http-profile",
    "slb/http2-profile",
    "slb/tcp-profile",
    "slb/udp-profile",
    "slb/sip-profile",
    "slb/ipro",
    "slb/http-rewrite",
    "slb/qos-profile",
    "slb/snat-pool",
    "slb/ssl-client",
    "slb/ssl-server",
    "slb/virtual-ip",
    "slb/service-monitor",
    "slb/persist",
    "slb/pool",
    "slb/node",
    "slb/pre-rule",
    "slb/virtual-service",
]

CREATE_LIKE_ACTIONS = {"create", "patch", "replace"}
DELETE_ACTIONS = {"delete"}
SCHEMA_PREFIX_MAP = {
    "config.user": "slb/user",
    "config.service_host": "slb/service-host",
    "config.security_node": "slb/security-node",
    "config.security_pool": "slb/security-pool",
    "config.service_chain": "slb/service-chain",
    "config.access_control_profile": "slb/access-control-profile",
    "config.http_defence": "slb/http-defence",
    "config.http_profile": "slb/http-profile",
    "config.http2_profile": "slb/http2-profile",
    "config.tcp_profile": "slb/tcp-profile",
    "config.udp_profile": "slb/udp-profile",
    "config.sip_profile": "slb/sip-profile",
    "config.ipro": "slb/ipro",
    "config.http_rewrite": "slb/http-rewrite",
    "config.qos_profile": "slb/qos-profile",
    "config.snat_rule": "slb/snat-pool",
    "config.ssl_client": "slb/ssl-client",
    "config.ssl_server": "slb/ssl-server",
    "config.virtual_ip": "slb/virtual-ip",
    "config.service_monitor": "slb/service-monitor",
    "config.persist": "slb/persist",
    "config.pool": "slb/pool",
    "config.node": "slb/node",
    "config.pre_rule": "slb/pre-rule",
    "config.virtual_service": "slb/virtual-service",
}
API_PREFIX_RE = re.compile(r"^/?api/ad/v\d+/")


class DependencyOrderError(ValueError):
    pass


def load_resource_order(skill_root: Path | None = None) -> list[str]:
    if skill_root is None:
        return list(DEFAULT_RESOURCE_ORDER)
    recipe_path = skill_root / "references" / "recipes" / "slb-basic.json"
    if not recipe_path.exists():
        return list(DEFAULT_RESOURCE_ORDER)
    try:
        loaded = json.loads(recipe_path.read_text(encoding="utf-8"))
    except Exception:
        return list(DEFAULT_RESOURCE_ORDER)
    resource_order = loaded.get("resource_order")
    if not isinstance(resource_order, list) or not all(isinstance(item, str) and item for item in resource_order):
        return list(DEFAULT_RESOURCE_ORDER)
    return resource_order


def _normalize_document(document: Any) -> str | None:
    if not isinstance(document, str) or not document:
        return None
    return document[:-3] if document.endswith(".js") else document


def _normalize_path(path: Any) -> str | None:
    if not isinstance(path, str) or not path:
        return None
    return API_PREFIX_RE.sub("", path.lstrip("/"))


def _schema_resource(schema: Any) -> str | None:
    if not isinstance(schema, str) or not schema:
        return None
    for prefix, resource in SCHEMA_PREFIX_MAP.items():
        if schema.startswith(prefix):
            return resource
    return None


def resource_candidates(operation: dict[str, Any]) -> list[str]:
    candidates: list[str] = []
    for value in (
        _normalize_document(operation.get("document")),
        _normalize_path(operation.get("resource_path")),
        _normalize_path(operation.get("path")),
        _schema_resource(operation.get("schema")),
    ):
        if value and value not in candidates:
            candidates.append(value)
    return candidates


def dependency_rank(operation: dict[str, Any], resource_order: list[str]) -> int | None:
    candidates = resource_candidates(operation)
    for index, prefix in enumerate(resource_order):
        for candidate in candidates:
            if candidate == prefix or candidate.startswith(prefix + "/"):
                return index
    return None


def sorted_by_dependency_order(
    operations: list[dict[str, Any]],
    resource_order: list[str] | None = None,
) -> list[dict[str, Any]]:
    if len(operations) <= 1:
        return list(operations)

    resource_order = resource_order or list(DEFAULT_RESOURCE_ORDER)
    actions = {str(operation.get("action", "")).lower() for operation in operations}
    has_delete = bool(actions & DELETE_ACTIONS)
    has_create_like = bool(actions & CREATE_LIKE_ACTIONS)
    if has_delete and has_create_like:
        raise DependencyOrderError("mixed delete and non-delete operations require separate bundles")

    ranked: list[tuple[int, int, int, dict[str, Any]]] = []
    for index, operation in enumerate(operations):
        rank = dependency_rank(operation, resource_order)
        if rank is None:
            if has_delete:
                ranked.append((1, 0, -index, operation))
            else:
                ranked.append((0, 0, index, operation))
            continue
        if has_delete:
            ranked.append((0, -rank, index, operation))
        else:
            ranked.append((1, rank, index, operation))

    return [operation for _, _, _, operation in sorted(ranked, key=lambda item: (item[0], item[1], item[2]))]
