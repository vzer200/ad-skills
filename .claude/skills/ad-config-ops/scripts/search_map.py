from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

from ad_ops_common import read_json, skill_paths, write_json


SEARCH_DIR = "search"
GENERATED_SEARCH_MAP = "generated-search-map.json"
EFFECTIVE_SEARCH_MAP = "search-map-effective.json"
OVERRIDES_SEARCH_MAP = "search-map-overrides.json"
REVIEW_SEARCH_MAP = "search-map-review.yml"
EXACT_MATCH_REVIEW = "exact-match-review.yml"


FAMILY_SPECS: dict[str, dict[str, Any]] = {
    "net.link": {
        "prefix": "net/link/",
        "documents": ["net/vlan.js", "net/bond.js"],
        "terms": ["网口", "接口", "网络接口"],
        "question": "你要配置哪种网口？",
        "children": {
            "lan": {"label": "LAN口", "terms": ["LAN口", "LAN接口"]},
            "wan": {"label": "WAN口", "terms": ["WAN口", "WAN接口"]},
            "vlan": {"label": "VLAN口", "terms": ["VLAN口", "VLAN接口", "子接口"]},
            "bond": {"label": "Bond口", "terms": ["Bond口", "聚合口", "链路聚合"]},
            "pppoe": {"label": "PPPoE口", "terms": ["PPPoE口", "PPPoE接口", "拨号口"]},
            "virtual-wire": {"label": "虚拟网线", "terms": ["虚拟网线", "虚拟网线口"]},
        },
    },
    "slb.service_monitor": {
        "prefix": "slb/service-monitor/",
        "terms": ["监视器", "健康检查", "健康监测", "服务监视器"],
        "question": "你要创建哪种监视器？",
        "child_suffix": "监视器",
    },
    "slb.pre_rule": {
        "prefix": "slb/pre-rule/",
        "terms": ["前置策略", "前置调度策略", "调度策略"],
        "question": "你要创建哪种前置策略？",
        "child_suffix": "前置策略",
    },
    "slb.persist": {
        "prefix": "slb/persist/",
        "terms": ["会话保持", "保持策略"],
        "question": "你要配置哪种会话保持？",
        "child_suffix": "会话保持",
    },
    "slb.tcp_profile": {
        "prefix": "slb/tcp-profile/",
        "terms": ["TCP profile", "TCP配置文件", "TCP参数模板", "TCP配置"],
        "question": "你要配置哪种 TCP Profile？",
        "child_suffix": "TCP Profile",
    },
}


VIRTUAL_SERVICE_OPTIONS: list[dict[str, Any]] = [
    {"value": "IP", "label": "IP虚拟服务", "terms": ["IP虚拟服务"]},
    {"value": "ANY", "label": "ANY虚拟服务", "terms": ["ANY虚拟服务", "任意协议虚拟服务"]},
    {
        "value": "TCP-FORWARD",
        "label": "TCP-FORWARD（TCP转发虚拟服务、四层虚拟服务）",
        "terms": ["TCP转发虚拟服务", "四层虚拟服务", "四层TCP虚拟服务"],
    },
    {
        "value": "TCP-PROXY",
        "label": "TCP-PROXY（七层TCP虚拟服务、TCP代理虚拟服务）",
        "terms": ["七层TCP虚拟服务", "TCP代理虚拟服务", "TCP代理"],
    },
    {"value": "UDP-FORWARD", "label": "UDP转发虚拟服务", "terms": ["UDP转发虚拟服务", "四层UDP虚拟服务"]},
    {"value": "UDP-PROXY", "label": "UDP代理虚拟服务", "terms": ["UDP代理虚拟服务", "七层UDP虚拟服务"]},
    {"value": "HTTP", "label": "HTTP虚拟服务", "terms": ["HTTP虚拟服务"]},
    {"value": "SSL-OFFLOAD", "label": "SSL卸载虚拟服务", "terms": ["SSL卸载虚拟服务"]},
    {
        "value": "SSL-OFFLOAD-HTTPS",
        "label": "HTTPS虚拟服务",
        "terms": ["HTTPS虚拟服务", "SSL卸载HTTPS虚拟服务"],
    },
    {"value": "RADIUS", "label": "RADIUS虚拟服务", "terms": ["RADIUS虚拟服务"]},
    {"value": "DNS", "label": "DNS虚拟服务", "terms": ["DNS虚拟服务"]},
    {"value": "FTP", "label": "FTP虚拟服务", "terms": ["FTP虚拟服务"]},
    {"value": "SIP-TCP", "label": "SIP-TCP虚拟服务", "terms": ["SIP-TCP虚拟服务", "SIP TCP虚拟服务"]},
    {"value": "SIP-UDP", "label": "SIP-UDP虚拟服务", "terms": ["SIP-UDP虚拟服务", "SIP UDP虚拟服务"]},
    {"value": "8583", "label": "8583虚拟服务", "terms": ["8583虚拟服务"]},
]


RESOURCE_EXACT_TERMS: dict[str, list[str]] = {
    "slb.pool": ["节点池"],
    "slb.node": ["节点"],
    "slb.security_pool": ["安全池"],
    "slb.snat_pool": ["SNAT地址池"],
    "slb.virtual_ip": ["虚拟IP"],
}


VARIANT_BACKED_RESOURCES = {"slb.virtual_service"}


def operation_key(method: str, path: str) -> str:
    return f"{method.strip().lower()} {path.strip()}"


def schema_key(document: str, schema: str) -> str:
    return f"{document}#{schema}"


def resource_id_from_document(document: str) -> str:
    without_suffix = document[:-3] if document.endswith(".js") else document
    parts = []
    for part in without_suffix.split("/"):
        normalized = re.sub(r"[^0-9A-Za-z]+", "_", part).strip("_").lower()
        parts.append(normalized or "root")
    return ".".join(parts)


def _dedupe(values: list[Any]) -> list[Any]:
    result = []
    seen = set()
    for value in values:
        key = str(value)
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


def _slug_terms(slug: str) -> list[str]:
    raw = slug.replace("_", "-")
    upper = raw.upper()
    title = raw.replace("-", " ")
    return _dedupe([raw, upper, title])


def _label_from_slug(slug: str, suffix: str = "") -> str:
    value = slug.upper() if re.fullmatch(r"[0-9a-z-]+", slug) else slug
    return f"{value}{suffix}"


def _fallback_exact_term(document: str) -> str:
    stem = document[:-3] if document.endswith(".js") else document
    return stem.rsplit("/", 1)[-1]


def _normalize_query(query: str) -> str:
    return re.sub(r"\s+", "", query).lower()


def _term_matches(query: str, term: str) -> bool:
    normalized_term = _normalize_query(term)
    return bool(normalized_term) and normalized_term in _normalize_query(query)


def _ascii_term(term: str) -> bool:
    return bool(re.fullmatch(r"[0-9A-Za-z_.-]+", term.strip()))


def _exact_term_matches(query: str, term: str) -> bool:
    term = term.strip()
    if not term:
        return False
    if _ascii_term(term):
        pattern = rf"(?<![0-9a-z_.-]){re.escape(term.lower())}(?![0-9a-z_.-])"
        return bool(re.search(pattern, query.lower()))
    return _term_matches(query, term)


def _any_term_matches(query: str, terms: list[str]) -> bool:
    return any(_term_matches(query, term) for term in terms)


def _exact_term_position(query: str, term: str) -> int | None:
    term = term.strip()
    if not term:
        return None
    if _ascii_term(term):
        pattern = rf"(?<![0-9a-z_.-]){re.escape(term.lower())}(?![0-9a-z_.-])"
        match = re.search(pattern, query.lower())
        return match.start() if match else None
    position = _normalize_query(query).find(_normalize_query(term))
    return position if position >= 0 else None


def _first_term_position(query: str, terms: list[str]) -> int | None:
    normalized = _normalize_query(query)
    positions = [
        normalized.find(_normalize_query(term))
        for term in terms
        if _normalize_query(term) and normalized.find(_normalize_query(term)) >= 0
    ]
    return min(positions) if positions else None


def _schema_names_by_document(index: dict[str, Any]) -> dict[str, list[str]]:
    schemas: dict[str, list[str]] = {}
    for definition in index.get("definitions", []) or []:
        document = definition.get("document")
        name = definition.get("name")
        if isinstance(document, str) and isinstance(name, str):
            schemas.setdefault(document, []).append(name)
    return {document: _dedupe(names) for document, names in schemas.items()}


def _operations_by_document(index: dict[str, Any]) -> dict[str, list[str]]:
    operations: dict[str, list[str]] = {}
    for operation in index.get("operations", []) or []:
        document = operation.get("document")
        method = operation.get("method")
        path = operation.get("path")
        if isinstance(document, str) and isinstance(method, str) and isinstance(path, str):
            operations.setdefault(document, []).append(operation_key(method, path))
    return {document: _dedupe(keys) for document, keys in operations.items()}


def _resource_terms(document: str) -> list[str]:
    stem = document[:-3] if document.endswith(".js") else document
    leaf = stem.rsplit("/", 1)[-1]
    parts = [part for part in re.split(r"[/_.-]+", stem) if part]
    terms = [stem, leaf]
    terms.extend(_slug_terms(leaf))
    terms.extend(parts)
    return _dedupe([term for term in terms if term and term != "all"])


def _resource_exact_terms(resource: dict[str, Any]) -> list[str]:
    resource_id = str(resource.get("id") or "")
    if resource_id in VARIANT_BACKED_RESOURCES:
        return []
    if resource_id in RESOURCE_EXACT_TERMS:
        return list(RESOURCE_EXACT_TERMS[resource_id])
    label = str(resource.get("label") or "")
    if label and "/" not in label:
        return [label]
    document = str(resource.get("document") or "")
    if document:
        return [_fallback_exact_term(document)]
    return []


def _variant_option_exact_terms(option: dict[str, Any]) -> list[str]:
    terms = [str(term) for term in option.get("terms", []) or [] if str(term).strip()]
    if terms:
        return _dedupe(terms)
    label = str(option.get("label") or "")
    return [label] if label else []


def _apply_generated_exact_terms(resources: dict[str, Any], variant_families: dict[str, Any]) -> None:
    for resource in resources.values():
        exact_terms = _resource_exact_terms(resource)
        resource["generated_exact_term"] = exact_terms[0] if exact_terms else None
        resource["exact_terms"] = exact_terms
    for variant in variant_families.values():
        for option in variant.get("options", []) or []:
            exact_terms = _variant_option_exact_terms(option)
            option["generated_exact_term"] = exact_terms[0] if exact_terms else None
            option["exact_terms"] = exact_terms


def _find_documents(index: dict[str, Any], spec: dict[str, Any]) -> list[str]:
    prefix = spec["prefix"]
    explicit_documents = set(spec.get("documents", []) or [])
    rels = [
        document.get("rel")
        for document in index.get("documents", []) or []
        if isinstance(document.get("rel"), str)
        and (
            document["rel"].startswith(prefix)
            or document["rel"] in explicit_documents
        )
        and not document["rel"].endswith("/all.js")
    ]
    return sorted(_dedupe(rels))


def _apply_family_terms(resources: dict[str, Any], family_id: str, document: str, spec: dict[str, Any]) -> None:
    slug = document[:-3].rsplit("/", 1)[-1]
    child_spec = (spec.get("children") or {}).get(slug, {})
    suffix = str(spec.get("child_suffix") or "")
    label = child_spec.get("label") or _label_from_slug(slug, suffix)
    terms = list(child_spec.get("terms") or [])
    if not terms:
        terms = [label]
        terms.extend(f"{term}{suffix}" for term in _slug_terms(slug)[:2] if suffix)
    resource_id = resource_id_from_document(document)
    if resource_id in resources:
        resources[resource_id]["family"] = family_id
        resources[resource_id]["label"] = label
        resources[resource_id]["terms"] = _dedupe(resources[resource_id].get("terms", []) + terms)


def _build_families(index: dict[str, Any], resources: dict[str, Any]) -> dict[str, Any]:
    families: dict[str, Any] = {}
    for family_id, spec in FAMILY_SPECS.items():
        child_documents = _find_documents(index, spec)
        for document in child_documents:
            _apply_family_terms(resources, family_id, document, spec)
        children = [resource_id_from_document(document) for document in child_documents if resource_id_from_document(document) in resources]
        families[family_id] = {
            "id": family_id,
            "ambiguous": True,
            "terms": list(spec["terms"]),
            "question": spec["question"],
            "children": children,
        }
    return families


def _build_virtual_service_variant() -> dict[str, Any]:
    return {
        "id": "slb.virtual_service.service",
        "resource": "slb.virtual_service",
        "document": "slb/virtual-service.js",
        "schema": "config.virtual_service",
        "field": "service",
        "ambiguous_terms": ["虚拟服务", "VIP服务", "负载均衡服务"],
        "ambiguous_groups": [
            {
                "id": "tcp_virtual_service",
                "terms": ["TCP虚拟服务"],
                "options": ["TCP-FORWARD", "TCP-PROXY"],
                "question": "你要创建哪种 TCP 虚拟服务？",
            }
        ],
        "question": "你要创建哪种虚拟服务？",
        "options": copy.deepcopy(VIRTUAL_SERVICE_OPTIONS),
    }


def build_generated_search_map(index: dict[str, Any]) -> dict[str, Any]:
    schema_names = _schema_names_by_document(index)
    operation_keys = _operations_by_document(index)
    documents: dict[str, Any] = {}
    resources: dict[str, Any] = {}
    operations: dict[str, Any] = {}
    schemas: dict[str, Any] = {}

    for document in index.get("documents", []) or []:
        rel = document.get("rel")
        if not isinstance(rel, str):
            continue
        resource_id = resource_id_from_document(rel)
        documents[rel] = {
            "document": rel,
            "resource": resource_id,
            "terms": _resource_terms(rel),
            "schemas": schema_names.get(rel, []),
            "operations": operation_keys.get(rel, []),
        }
        resources[resource_id] = {
            "id": resource_id,
            "document": rel,
            "label": rel[:-3] if rel.endswith(".js") else rel,
            "terms": list(documents[rel]["terms"]),
            "schemas": schema_names.get(rel, []),
            "operations": operation_keys.get(rel, []),
        }

    for operation in index.get("operations", []) or []:
        method = operation.get("method")
        path = operation.get("path")
        document = operation.get("document")
        if not isinstance(method, str) or not isinstance(path, str) or not isinstance(document, str):
            continue
        key = operation_key(method, path)
        operations[key] = {
            "key": key,
            "method": method.lower(),
            "path": path,
            "document": document,
            "resource": resource_id_from_document(document),
            "request_schemas": operation.get("request_schemas", []) or [],
            "summary": operation.get("summary"),
            "description": operation.get("description"),
        }

    for definition in index.get("definitions", []) or []:
        name = definition.get("name")
        document = definition.get("document")
        if not isinstance(name, str) or not isinstance(document, str):
            continue
        key = schema_key(document, name)
        schemas[key] = {
            "key": key,
            "document": document,
            "resource": resource_id_from_document(document),
            "schema": name,
            "type": definition.get("type"),
        }

    families = _build_families(index, resources)
    variant_families = {"slb.virtual_service.service": _build_virtual_service_variant()}
    _apply_generated_exact_terms(resources, variant_families)

    return {
        "version": 2,
        "families": families,
        "variant_families": variant_families,
        "resources": resources,
        "documents": documents,
        "operations": operations,
        "schemas": schemas,
        "review": {
            "needs_review": [
                {"id": family_id, "kind": "family", "reason": "generated_terms_need_product_review"}
                for family_id in sorted(families)
            ]
        },
    }


def _merge_option_list(existing: list[dict[str, Any]], overrides: dict[str, Any]) -> list[dict[str, Any]]:
    by_value = {str(option.get("value")): copy.deepcopy(option) for option in existing if isinstance(option, dict)}
    order = [str(option.get("value")) for option in existing if isinstance(option, dict)]
    for value, override in overrides.items():
        if value not in by_value:
            by_value[value] = {"value": value}
            order.append(value)
        if isinstance(override, dict):
            by_value[value] = _merge_dict(by_value[value], override)
        else:
            by_value[value] = override
    return [by_value[value] for value in order]


def _merge_dict(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(base)
    for key, value in override.items():
        if key.endswith("_add") and isinstance(value, list):
            target = key[: -len("_add")]
            current = result.get(target, [])
            if not isinstance(current, list):
                current = []
            result[target] = _dedupe(current + copy.deepcopy(value))
            continue
        if key.endswith("_remove") and isinstance(value, list):
            target = key[: -len("_remove")]
            current = result.get(target, [])
            if isinstance(current, list):
                remove = {str(item) for item in value}
                result[target] = [item for item in current if str(item) not in remove]
            continue
        if key == "options" and isinstance(result.get(key), list) and isinstance(value, dict):
            result[key] = _merge_option_list(result[key], value)
            continue
        if isinstance(result.get(key), dict) and isinstance(value, dict):
            result[key] = _merge_dict(result[key], value)
            continue
        result[key] = copy.deepcopy(value)
    return result


def merge_search_map(generated: dict[str, Any], overrides: dict[str, Any] | None) -> dict[str, Any]:
    merged = copy.deepcopy(generated)
    if overrides:
        merged = _merge_dict(merged, overrides)
    validate_search_map(merged)
    return merged


def validate_search_map(search_map: dict[str, Any]) -> None:
    resources = search_map.get("resources") or {}
    documents = search_map.get("documents") or {}
    schemas = search_map.get("schemas") or {}

    for family_id, family in (search_map.get("families") or {}).items():
        for child in family.get("children", []) or []:
            if child not in resources:
                raise ValueError(f"family {family_id} references missing child resource {child}")

    for resource_id, resource in resources.items():
        exact_terms = resource.get("exact_terms", [])
        if exact_terms is None:
            exact_terms = []
        if not isinstance(exact_terms, list):
            raise ValueError(f"resource {resource_id} exact_terms must be a list")
        if len(exact_terms) != len({str(term) for term in exact_terms}):
            raise ValueError(f"resource {resource_id} has duplicate exact_terms")

    for variant_id, variant in (search_map.get("variant_families") or {}).items():
        resource = variant.get("resource")
        document = variant.get("document")
        schema = variant.get("schema")
        if resource not in resources:
            raise ValueError(f"variant {variant_id} references missing resource {resource}")
        if document not in documents:
            raise ValueError(f"variant {variant_id} references missing document {document}")
        if schema_key(str(document), str(schema)) not in schemas:
            raise ValueError(f"variant {variant_id} references missing schema {document}#{schema}")
        values = [option.get("value") for option in variant.get("options", []) or [] if isinstance(option, dict)]
        if len(values) != len(set(values)):
            raise ValueError(f"variant {variant_id} has duplicate option values")
        if not values:
            raise ValueError(f"variant {variant_id} has no options")
        for group in variant.get("ambiguous_groups", []) or []:
            for value in group.get("options", []) or []:
                if value not in values:
                    raise ValueError(f"variant {variant_id} group references missing option {value}")
        for option in variant.get("options", []) or []:
            exact_terms = option.get("exact_terms", [])
            if not isinstance(exact_terms, list):
                raise ValueError(f"variant {variant_id} option {option.get('value')} exact_terms must be a list")
            if len(exact_terms) != len({str(term) for term in exact_terms}):
                raise ValueError(f"variant {variant_id} option {option.get('value')} has duplicate exact_terms")


def _search_dir(skill_root: Path) -> Path:
    return skill_paths(skill_root).references / SEARCH_DIR


def _review_yaml(search_map: dict[str, Any]) -> str:
    needs_review = search_map.get("review", {}).get("needs_review", []) or []
    lines = [
        "ok: true",
        f"families: {len(search_map.get('families', {}))}",
        f"variant_families: {len(search_map.get('variant_families', {}))}",
        f"resources: {len(search_map.get('resources', {}))}",
        f"documents: {len(search_map.get('documents', {}))}",
        f"operations: {len(search_map.get('operations', {}))}",
        f"schemas: {len(search_map.get('schemas', {}))}",
        "needs_review:",
    ]
    if not needs_review:
        lines.append("  []")
    else:
        for item in needs_review:
            lines.append(f"  - id: {item.get('id')}")
            lines.append(f"    kind: {item.get('kind')}")
            lines.append(f"    reason: {item.get('reason')}")
    return "\n".join(lines) + "\n"


def _yaml_scalar(value: Any) -> str:
    if value is None:
        return "null"
    return json.dumps(value, ensure_ascii=False)


def _yaml_list(values: list[Any], indent: str) -> list[str]:
    if not values:
        return [f"{indent}[]"]
    return [f"{indent}- {_yaml_scalar(value)}" for value in values]


def _exact_match_review_yaml(search_map: dict[str, Any]) -> str:
    lines = [
        "# AD-OPS 全量精确匹配词审核文件。",
        "# generated_exact_term 是脚本自动生成的首选精确匹配词。",
        "# exact_terms 是当前生效的精确匹配词；命中后 lookup 会短路，不再走评分召回。",
        "# 请不要直接依赖本文件作为人工覆盖源；需要增删词时修改 search-map-overrides.json。",
        "resources:",
    ]
    for resource_id in sorted((search_map.get("resources") or {})):
        resource = search_map["resources"][resource_id]
        lines.append(f"  {resource_id}:")
        lines.append(f"    document: {_yaml_scalar(resource.get('document'))}")
        lines.append(f"    schema: {_yaml_scalar(_primary_schema(resource))}")
        lines.append(f"    generated_exact_term: {_yaml_scalar(resource.get('generated_exact_term'))}")
        lines.append("    exact_terms:")
        lines.extend(_yaml_list(resource.get("exact_terms", []) or [], "      "))
    lines.append("variant_options:")
    for variant_id in sorted((search_map.get("variant_families") or {})):
        variant = search_map["variant_families"][variant_id]
        for option in variant.get("options", []) or []:
            value = option.get("value")
            key = f"{variant_id}.{value}"
            lines.append(f"  {key}:")
            lines.append(f"    document: {_yaml_scalar(variant.get('document'))}")
            lines.append(f"    schema: {_yaml_scalar(variant.get('schema'))}")
            lines.append(f"    field: {_yaml_scalar(variant.get('field'))}")
            lines.append("    preset_fields:")
            lines.append(f"      {variant.get('field')}: {_yaml_scalar(value)}")
            lines.append(f"    generated_exact_term: {_yaml_scalar(option.get('generated_exact_term'))}")
            lines.append("    exact_terms:")
            lines.extend(_yaml_list(option.get("exact_terms", []) or [], "      "))
    return "\n".join(lines) + "\n"


def build_and_write_search_map(skill_root: Path) -> dict[str, Any]:
    paths = skill_paths(skill_root)
    index = read_json(paths.references / "api-index.json")
    generated = build_generated_search_map(index)
    search_dir = _search_dir(skill_root)
    overrides_path = search_dir / OVERRIDES_SEARCH_MAP
    overrides = read_json(overrides_path) if overrides_path.exists() else {}
    effective = merge_search_map(generated, overrides)

    write_json(search_dir / GENERATED_SEARCH_MAP, generated)
    write_json(search_dir / EFFECTIVE_SEARCH_MAP, effective)
    search_dir.mkdir(parents=True, exist_ok=True)
    (search_dir / REVIEW_SEARCH_MAP).write_text(_review_yaml(effective), encoding="utf-8")
    (search_dir / EXACT_MATCH_REVIEW).write_text(_exact_match_review_yaml(effective), encoding="utf-8")
    return effective


def load_effective_search_map(skill_root: Path) -> dict[str, Any]:
    path = _search_dir(skill_root) / EFFECTIVE_SEARCH_MAP
    if not path.exists():
        return build_and_write_search_map(skill_root)
    search_map = read_json(path)
    if int(search_map.get("version") or 0) < 2:
        return build_and_write_search_map(skill_root)
    validate_search_map(search_map)
    return search_map


def _resource_option(search_map: dict[str, Any], resource_id: str) -> dict[str, Any]:
    resource = search_map["resources"][resource_id]
    return {
        "id": resource_id,
        "label": resource.get("label") or resource_id,
        "document": resource.get("document"),
        "schemas": resource.get("schemas", []),
    }


def _family_has_precise_child_match(search_map: dict[str, Any], family: dict[str, Any], query: str) -> bool:
    for child in family.get("children", []) or []:
        resource = (search_map.get("resources") or {}).get(child)
        if resource and _any_term_matches(query, resource.get("terms", []) or []):
            return True
    return False


def family_clarification(search_map: dict[str, Any], query: str) -> dict[str, Any] | None:
    clarifications = family_clarifications(search_map, query)
    return clarifications[0] if clarifications else None


def family_clarifications(search_map: dict[str, Any], query: str) -> list[dict[str, Any]]:
    results: list[tuple[int, str, dict[str, Any]]] = []
    for family_id, family in (search_map.get("families") or {}).items():
        if not _any_term_matches(query, family.get("terms", []) or []):
            continue
        if _family_has_precise_child_match(search_map, family, query):
            continue
        position = _first_term_position(query, family.get("terms", []) or [])
        if position is None:
            continue
        results.append(
            (
                position,
                family_id,
                {
                    "needs_clarification": True,
                    "reason": "ambiguous_resource_family",
                    "family": family_id,
                    "question": family.get("question"),
                    "options": [_resource_option(search_map, child) for child in family.get("children", []) or []],
                },
            )
        )
    results.sort(key=lambda item: (item[0], item[1]))
    return [item[2] for item in results]


def _variant_option_matches(query: str, option: dict[str, Any]) -> bool:
    return _any_term_matches(query, option.get("terms", []) or [])


def _variant_options_by_value(variant: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(option.get("value")): option for option in variant.get("options", []) or [] if isinstance(option, dict)}


def _variant_option_payload(variant: dict[str, Any], option: dict[str, Any]) -> dict[str, Any]:
    return {
        "value": option.get("value"),
        "label": option.get("label") or option.get("value"),
        "resource": variant.get("resource"),
        "document": variant.get("document"),
        "schema": variant.get("schema"),
        "field": variant.get("field"),
        "preset_fields": {variant.get("field"): option.get("value")},
    }


def _shadowed_exact_terms(matched_terms: list[str]) -> set[str]:
    shadowed: set[str] = set()
    normalized = {term: _normalize_query(term) for term in matched_terms}
    for term, normalized_term in normalized.items():
        for other, normalized_other in normalized.items():
            if term == other:
                continue
            if len(normalized_other) > len(normalized_term) and normalized_term in normalized_other:
                shadowed.add(term)
                break
    return shadowed


def _drop_shadowed_exact_matches(matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
    all_terms = [term for match in matches for term in match.get("matched_terms", []) or []]
    shadowed = _shadowed_exact_terms(all_terms)
    if not shadowed:
        return matches
    filtered = []
    for match in matches:
        terms = [term for term in match.get("matched_terms", []) or [] if term not in shadowed]
        if not terms:
            continue
        updated = dict(match)
        updated["matched_terms"] = terms
        updated["score"] = max(len(term) for term in terms)
        filtered.append(updated)
    return filtered


def variant_clarification(search_map: dict[str, Any], query: str) -> dict[str, Any] | None:
    clarifications = variant_clarifications(search_map, query)
    return clarifications[0] if clarifications else None


def variant_clarifications(search_map: dict[str, Any], query: str) -> list[dict[str, Any]]:
    results: list[tuple[int, str, dict[str, Any]]] = []
    for variant_id, variant in (search_map.get("variant_families") or {}).items():
        if any(_variant_option_matches(query, option) for option in variant.get("options", []) or []):
            continue
        options_by_value = _variant_options_by_value(variant)
        matched_group = False
        for group in variant.get("ambiguous_groups", []) or []:
            if not _any_term_matches(query, group.get("terms", []) or []):
                continue
            position = _first_term_position(query, group.get("terms", []) or [])
            if position is not None:
                results.append(
                    (
                        position,
                        variant_id,
                        {
                            "needs_clarification": True,
                            "reason": "ambiguous_variant_family",
                            "family": variant_id,
                            "question": group.get("question") or variant.get("question"),
                            "options": [
                                _variant_option_payload(variant, options_by_value[value])
                                for value in group.get("options", []) or []
                                if value in options_by_value
                            ],
                        },
                    )
                )
            matched_group = True
            break
        if matched_group:
            continue
        if not _any_term_matches(query, variant.get("ambiguous_terms", []) or []):
            continue
        position = _first_term_position(query, variant.get("ambiguous_terms", []) or [])
        if position is None:
            continue
        results.append(
            (
                position,
                variant_id,
                {
                    "needs_clarification": True,
                    "reason": "ambiguous_variant_family",
                    "family": variant_id,
                    "question": variant.get("question"),
                    "options": [_variant_option_payload(variant, option) for option in variant.get("options", []) or []],
                },
            )
        )
    results.sort(key=lambda item: (item[0], item[1]))
    return [item[2] for item in results]


def collect_clarifications(search_map: dict[str, Any], query: str) -> list[dict[str, Any]]:
    results: list[tuple[int, str, dict[str, Any]]] = []
    for clarification in family_clarifications(search_map, query) + variant_clarifications(search_map, query):
        family_id = str(clarification.get("family") or "")
        terms: list[str] = []
        family = (search_map.get("families") or {}).get(family_id)
        if family:
            terms = family.get("terms", []) or []
        variant = (search_map.get("variant_families") or {}).get(family_id)
        if variant:
            terms = list(variant.get("ambiguous_terms", []) or [])
            for group in variant.get("ambiguous_groups", []) or []:
                if _any_term_matches(query, group.get("terms", []) or []):
                    terms = group.get("terms", []) or []
                    break
        position = _first_term_position(query, terms)
        if position is None:
            continue
        results.append((position, family_id, clarification))
    results.sort(key=lambda item: (item[0], item[1]))
    return [item[2] for item in results]


def _primary_schema(resource: dict[str, Any]) -> str | None:
    for schema in resource.get("schemas", []) or []:
        if not str(schema).endswith("_list"):
            return schema
    schemas = resource.get("schemas", []) or []
    return schemas[0] if schemas else None


def exact_resource_matches(search_map: dict[str, Any], query: str) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    for variant in (search_map.get("variant_families") or {}).values():
        for option in variant.get("options", []) or []:
            terms = option.get("exact_terms", []) or []
            matched_terms = [str(term) for term in terms if _exact_term_matches(query, str(term))]
            if not matched_terms:
                continue
            positions = [_exact_term_position(query, term) for term in matched_terms]
            position = min(pos for pos in positions if pos is not None)
            matches.append(
                {
                    "kind": "variant_option",
                    "match_source": "exact",
                    "score": max(len(term) for term in matched_terms),
                    "position": position,
                    "resource": variant.get("resource"),
                    "document": variant.get("document"),
                    "schema": variant.get("schema"),
                    "preset_fields": {variant.get("field"): option.get("value")},
                    "option": option.get("value"),
                    "matched_terms": matched_terms,
                }
            )
    for resource in (search_map.get("resources") or {}).values():
        terms = resource.get("exact_terms", []) or []
        matched_terms = [str(term) for term in terms if _exact_term_matches(query, str(term))]
        if not matched_terms:
            continue
        positions = [_exact_term_position(query, term) for term in matched_terms]
        position = min(pos for pos in positions if pos is not None)
        matches.append(
            {
                "kind": "resource",
                "match_source": "exact",
                "score": max(len(term) for term in matched_terms),
                "position": position,
                "resource": resource.get("id"),
                "document": resource.get("document"),
                "schema": _primary_schema(resource),
                "preset_fields": {},
                "matched_terms": matched_terms,
            }
        )
    matches = _drop_shadowed_exact_matches(matches)
    matches.sort(key=lambda item: (int(item["position"]), -int(item["score"]), str(item["document"]), str(item.get("option") or "")))
    return matches


def precise_resource_matches(search_map: dict[str, Any], query: str) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    for variant in (search_map.get("variant_families") or {}).values():
        for option in variant.get("options", []) or []:
            terms = option.get("terms", []) or []
            matched_terms = [term for term in terms if _term_matches(query, term)]
            if not matched_terms:
                continue
            matches.append(
                {
                    "kind": "variant_option",
                    "score": max(len(term) for term in matched_terms),
                    "resource": variant.get("resource"),
                    "document": variant.get("document"),
                    "schema": variant.get("schema"),
                    "preset_fields": {variant.get("field"): option.get("value")},
                    "option": option.get("value"),
                    "matched_terms": matched_terms,
                }
            )
    for resource in (search_map.get("resources") or {}).values():
        terms = resource.get("terms", []) or []
        matched_terms = [term for term in terms if _term_matches(query, term)]
        if not matched_terms:
            continue
        matches.append(
            {
                "kind": "resource",
                "score": max(len(term) for term in matched_terms),
                "resource": resource.get("id"),
                "document": resource.get("document"),
                "schema": _primary_schema(resource),
                "preset_fields": {},
                "matched_terms": matched_terms,
            }
        )
    matches.sort(key=lambda item: (-int(item["score"]), str(item["document"]), str(item.get("option") or "")))
    return matches
