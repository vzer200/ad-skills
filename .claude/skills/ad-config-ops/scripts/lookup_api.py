from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from ad_ops_common import read_json, short_summary, skill_paths, write_json


DEFAULT_ALIASES = {
    "系统": ["sys", "system"],
    "用户": ["user"],
}


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Search the AD API index.")
    parser.add_argument("--skill-root", required=True, type=Path, help="ad-config-ops skill root.")
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


def text_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        return " ".join(text_value(item) for item in value)
    return str(value)


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


def lookup(index: dict[str, Any], query: str, aliases: dict[str, list[str]], module: str | None, limit: int) -> dict[str, Any]:
    terms = expand_terms(query, aliases)
    module_prefix = module.strip().lower().rstrip("/") + "/" if module else None
    schemas_by_document = schema_document_map(index)
    matches = []

    for operation in index.get("operations", []) or []:
        document = text_value(operation.get("document"))
        if module_prefix and not document.lower().startswith(module_prefix):
            continue
        score = score_operation(operation, terms, schemas_by_document)
        if score <= 0:
            continue
        matches.append(
            {
                "score": score,
                "document": document,
                "path": operation.get("path"),
                "method": operation.get("method"),
                "operationId": operation.get("operationId"),
                "summary": operation.get("summary"),
                "description": operation.get("description"),
                "request_schemas": operation.get("request_schemas", []),
            }
        )

    matches.sort(key=lambda item: (-item["score"], item["document"], item["path"] or "", item["method"] or ""))
    return {"query": query, "matches": matches[: max(limit, 0)]}


def lookup_summary(result: dict[str, Any], out: Path | None = None) -> dict[str, Any]:
    matches = result.get("matches") if isinstance(result.get("matches"), list) else []
    top = [
        {
            "document": match.get("document"),
            "method": match.get("method"),
            "path": match.get("path"),
            "request_schemas": match.get("request_schemas", []),
        }
        for match in matches[:3]
    ]
    summary: dict[str, Any] = {"ok": True, "match_count": len(matches), "top_matches": top}
    if out is not None:
        summary["result"] = str(out)
    return summary


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        paths = skill_paths(args.skill_root)
        index = read_json(paths.references / "api-index.json")
        aliases = load_aliases(args.skill_root)
        result = lookup(index, args.query, aliases, args.module, args.limit)
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
