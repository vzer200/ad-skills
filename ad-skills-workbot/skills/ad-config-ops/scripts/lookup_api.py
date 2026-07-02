from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from ad_ops_common import read_json, short_summary, skill_paths, write_json
from search_map import (
    collect_clarifications,
    exact_resource_matches,
    load_effective_search_map,
    precise_resource_matches,
)


DEFAULT_ALIASES = {
    "系统": ["sys", "system"],
    "用户": ["user"],
}

CLARIFICATION_INTENT_TERMS = (
    "创建",
    "新建",
    "新增",
    "添加",
    "配置",
    "开通",
    "修改",
    "更新",
    "编辑",
    "变更",
    "删除",
    "移除",
)

ACTION_TERMS = {
    "create": ("创建", "新建", "新增", "添加", "开通", "生成"),
    "delete": ("删除", "移除"),
    "update": ("修改", "更新", "编辑", "变更", "替换", "调整", "配置"),
    "get": ("查询", "查看", "获取", "列出", "列表", "list", "show"),
}


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Search the AD API index.")
    parser.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root.")
    parser.add_argument("--query", required=True, help="Search query.")
    parser.add_argument("--module", help="Optional document/module prefix, for example slb or sys.")
    parser.add_argument("--limit", type=int, default=10, help="Maximum matches to return.")
    parser.add_argument("--json", action="store_true", help="Print JSON output. JSON is the default format.")
    parser.add_argument("--out", type=Path, help="Optional full lookup JSON output path.")
    parser.add_argument("--summary", action="store_true", help="Print only a short summary to stdout.")
    return parser.parse_args(argv)


def load_aliases(skill_root: Path) -> dict[str, list[str]]:
    aliases = {key: list(value) for key, value in DEFAULT_ALIASES.items()}
    path = skill_paths(skill_root).references / "field-aliases.json"
    if path.exists():
        for key, value in read_json(path).items():
            if isinstance(value, list):
                aliases.setdefault(key, [])
                aliases[key].extend(str(item) for item in value)
    return aliases


def split_query(query: str) -> list[str]:
    parts = [part for part in re.split(r"[\s,，/]+", query.strip()) if part]
    return parts or [query.strip()]


def expand_terms(query: str, aliases: dict[str, list[str]]) -> list[str]:
    terms: list[str] = []
    for term in split_query(query):
        terms.append(term)
        terms.extend(aliases.get(term, []))
    for key, values in aliases.items():
        if key in query:
            terms.append(key)
            terms.extend(values)
    seen: set[str] = set()
    expanded = []
    for term in terms:
        normalized = term.strip().lower()
        if normalized and normalized not in seen:
            seen.add(normalized)
            expanded.append(normalized)
    return expanded


def normalized_query(query: str) -> str:
    return re.sub(r"\s+", "", query).lower()


def has_clarification_intent(query: str) -> bool:
    normalized = normalized_query(query)
    return any(term.lower() in normalized for term in CLARIFICATION_INTENT_TERMS)


def query_action(query: str) -> str | None:
    normalized = normalized_query(query)
    for action, terms in ACTION_TERMS.items():
        if any(term.lower() in normalized for term in terms):
            return action
    return None


def module_prefix(module: str | None) -> str | None:
    return module.strip().lower().rstrip("/") + "/" if module else None


def document_matches_module(document: Any, prefix: str | None) -> bool:
    if prefix is None:
        return True
    return text_value(document).lower().startswith(prefix)


def filter_clarification_by_module(clarification: dict[str, Any], prefix: str | None) -> dict[str, Any] | None:
    if prefix is None:
        return clarification
    document = clarification.get("document")
    if document_matches_module(document, prefix):
        return clarification
    options = clarification.get("options")
    if not isinstance(options, list):
        return None
    filtered_options = [option for option in options if document_matches_module(option.get("document"), prefix)]
    if not filtered_options:
        return None
    filtered = dict(clarification)
    filtered["options"] = filtered_options
    return filtered


def clarification_lookup_result(query: str, clarifications: list[dict[str, Any]]) -> dict[str, Any]:
    if len(clarifications) == 1:
        clarification = clarifications[0]
        return {"ok": True, "query": query, **clarification, "clarifications": clarifications, "matches": []}
    return {
        "ok": True,
        "query": query,
        "needs_clarification": True,
        "reason": "multiple_ambiguities",
        "question": "本次需求包含多个需要确认的配置类型，请一次性选择。",
        "clarifications": clarifications,
        "matches": [],
    }


def term_in_query(term: Any, query: str) -> bool:
    normalized_term = normalized_query(text_value(term))
    return bool(normalized_term) and normalized_term in normalized_query(query)


def family_scoped_resources(search_map: dict[str, Any] | None, query: str) -> set[str]:
    if not search_map:
        return set()
    scoped: set[str] = set()
    for family in (search_map.get("families") or {}).values():
        if any(term_in_query(term, query) for term in family.get("terms", []) or []):
            scoped.update(str(child) for child in family.get("children", []) or [])
    return scoped


def text_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        return " ".join(text_value(item) for item in value)
    return str(value)


def action_method_bonus(operation: dict[str, Any], action: str | None) -> int:
    if action is None:
        return 0
    method = text_value(operation.get("method")).lower()
    path = text_value(operation.get("path"))
    is_resource_path = "{" in path
    if action == "create" and method == "post":
        return 1000 if not is_resource_path else 850
    if action == "delete" and method == "delete":
        return 1000
    if action == "update":
        if method == "patch":
            return 1000
        if method == "put":
            return 900
        if method == "post" and is_resource_path:
            return 650
    if action == "get" and method == "get":
        return 1000
    return 0


def best_precise_matches_by_document(
    search_map: dict[str, Any] | None,
    query: str,
    prefix: str | None,
) -> dict[str, dict[str, Any]]:
    if not search_map:
        return {}
    scoped_resources = family_scoped_resources(search_map, query)
    by_document: dict[str, dict[str, Any]] = {}
    for match in precise_resource_matches(search_map, query):
        if scoped_resources and match.get("resource") not in scoped_resources:
            continue
        document = text_value(match.get("document"))
        if not document_matches_module(document, prefix):
            continue
        current = by_document.get(document)
        if current is None or int(match.get("score") or 0) > int(current.get("score") or 0):
            by_document[document] = match
    return by_document


def precise_operation_bonus(operation: dict[str, Any], precise_match: dict[str, Any] | None, action: str | None) -> int:
    if not precise_match:
        return 0
    score = 10000 + int(precise_match.get("score") or 0) * 20
    schema = precise_match.get("schema")
    if schema and schema in (operation.get("request_schemas") or []):
        score += 500
    return score + action_method_bonus(operation, action)


def enrich_with_precise_match(match: dict[str, Any], precise_match: dict[str, Any] | None) -> dict[str, Any]:
    if not precise_match:
        return match
    for key in ("resource", "matched_terms", "preset_fields", "match_source"):
        value = precise_match.get(key)
        if value:
            match[key] = value
    return match


def exact_operation_matches(
    index: dict[str, Any],
    exact_matches: list[dict[str, Any]],
    prefix: str | None,
    action: str | None,
    limit: int,
) -> list[dict[str, Any]]:
    by_document: dict[str, dict[str, Any]] = {}
    for exact_match in exact_matches:
        document = text_value(exact_match.get("document"))
        if not document_matches_module(document, prefix):
            continue
        current = by_document.get(document)
        if current is None or int(exact_match.get("position") or 0) < int(current.get("position") or 0):
            by_document[document] = exact_match
    matches: list[dict[str, Any]] = []
    for operation in index.get("operations", []) or []:
        document = text_value(operation.get("document"))
        exact_match = by_document.get(document)
        if not exact_match:
            continue
        score = 1_000_000
        score -= int(exact_match.get("position") or 0) * 1_000
        score += int(exact_match.get("score") or 0) * 20
        score += action_method_bonus(operation, action)
        schema = exact_match.get("schema")
        if schema and schema in (operation.get("request_schemas") or []):
            score += 500
        matches.append(
            enrich_with_precise_match(
                {
                    "score": score,
                    "document": document,
                    "path": operation.get("path"),
                    "method": operation.get("method"),
                    "operationId": operation.get("operationId"),
                    "summary": operation.get("summary"),
                    "description": operation.get("description"),
                    "request_schemas": operation.get("request_schemas", []),
                },
                exact_match,
            )
        )
    matches.sort(key=lambda item: (-int(item["score"]), item["document"], item["path"] or "", item["method"] or ""))
    return matches[: max(limit, 0)]


def schema_document_map(index: dict[str, Any]) -> dict[str, set[str]]:
    mapping: dict[str, set[str]] = {}
    for definition in index.get("definitions", []) or []:
        name = definition.get("name")
        document = definition.get("document")
        if isinstance(name, str) and isinstance(document, str):
            mapping.setdefault(document, set()).add(name)
    return mapping


def term_score(term: str, weighted_text: list[tuple[str, int]]) -> int:
    score = 0
    for text, weight in weighted_text:
        if not text:
            continue
        segments = [part for part in re.split(r"[/_.\s{}]+", text) if part]
        if term == text:
            score += weight * 3
        elif term in segments:
            score += weight * 2
        elif term in text:
            score += weight
    return score


def score_operation(operation: dict[str, Any], terms: list[str], schemas_by_document: dict[str, set[str]]) -> int:
    document = text_value(operation.get("document")).lower()
    schema_names = set(text_value(name).lower() for name in operation.get("request_schemas", []) or [])
    schema_names.update(text_value(name).lower() for response in operation.get("response_schemas", []) or [] for name in response.get("refs", []) or [])
    schema_names.update(text_value(name).lower() for name in schemas_by_document.get(operation.get("document"), set()))
    weighted_text = [
        (document, 45),
        (text_value(operation.get("path")).lower(), 40),
        (text_value(operation.get("operationId")).lower(), 35),
        (text_value(operation.get("summary")).lower(), 25),
        (text_value(operation.get("description")).lower(), 25),
        (text_value(operation.get("path_description")).lower(), 20),
        (" ".join(schema_names), 15),
    ]
    score = sum(term_score(term, weighted_text) for term in terms)
    if operation.get("request_schemas"):
        score += 30
    return score


def lookup(
    index: dict[str, Any],
    query: str,
    aliases: dict[str, list[str]],
    module: str | None,
    limit: int,
    search_map: dict[str, Any] | None = None,
) -> dict[str, Any]:
    terms = expand_terms(query, aliases)
    prefix = module_prefix(module)
    action = query_action(query)
    if search_map:
        exact_matches = exact_resource_matches(search_map, query)
        clarifications = [
            clarification
            for clarification in (
                filter_clarification_by_module(clarification, prefix)
                for clarification in collect_clarifications(search_map, query)
            )
            if clarification
        ]
        if clarifications:
            result = clarification_lookup_result(query, clarifications)
            result["matches"] = exact_operation_matches(index, exact_matches, prefix, action, limit)
            return result
        if exact_matches:
            return {"query": query, "matches": exact_operation_matches(index, exact_matches, prefix, action, limit)}
    schemas_by_document = schema_document_map(index)
    precise_by_document = best_precise_matches_by_document(search_map, query, prefix)
    matches = []

    for operation in index.get("operations", []) or []:
        document = text_value(operation.get("document"))
        if not document_matches_module(document, prefix):
            continue
        score = score_operation(operation, terms, schemas_by_document)
        precise_match = precise_by_document.get(document)
        score += precise_operation_bonus(operation, precise_match, action)
        if score <= 0:
            continue
        matches.append(
            enrich_with_precise_match(
                {
                    "score": score,
                    "document": document,
                    "path": operation.get("path"),
                    "method": operation.get("method"),
                    "operationId": operation.get("operationId"),
                    "summary": operation.get("summary"),
                    "description": operation.get("description"),
                    "request_schemas": operation.get("request_schemas", []),
                },
                precise_match,
            )
        )

    matches.sort(key=lambda item: (-item["score"], item["document"], item["path"] or "", item["method"] or ""))
    return {"query": query, "matches": matches[: max(limit, 0)]}


def lookup_summary(result: dict[str, Any], out: Path | None = None) -> dict[str, Any]:
    matches = result.get("matches") if isinstance(result.get("matches"), list) else []
    top = []
    for match in matches[:3]:
        item = {
            "document": match.get("document"),
            "method": match.get("method"),
            "path": match.get("path"),
            "request_schemas": match.get("request_schemas", []),
        }
        for key in ("resource", "matched_terms", "preset_fields", "match_source"):
            if key in match:
                item[key] = match[key]
        top.append(item)
    summary: dict[str, Any] = {"ok": True, "match_count": len(matches), "top_matches": top}
    for key in ("needs_clarification", "reason", "family", "question", "options", "clarifications"):
        if key in result:
            summary[key] = result[key]
    if out is not None:
        summary["result"] = str(out)
    return summary


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        paths = skill_paths(args.skill_root)
        index = read_json(paths.references / "api-index.json")
        aliases = load_aliases(args.skill_root)
        try:
            search_map = load_effective_search_map(args.skill_root)
        except Exception:
            search_map = None
        result = lookup(index, args.query, aliases, args.module, args.limit, search_map)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    if args.out:
        write_json(args.out, result)
    if args.summary:
        print(short_summary(**lookup_summary(result, args.out)), end="")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
