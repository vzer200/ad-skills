from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


SKILL_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = SKILL_ROOT / "references" / "cli_model.jsonl"
DEFAULT_OVERRIDES = SKILL_ROOT / "references" / "cli_overrides.json"
DEFAULT_SEMANTIC_ALIASES = SKILL_ROOT / "references" / "semantic_aliases.json"


class SangforCliError(RuntimeError):
    pass


def short_summary(**items: Any) -> str:
    return json.dumps(items, ensure_ascii=False, separators=(",", ":")) + "\n"


def load_model(path: Path = DEFAULT_MODEL) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    entries = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except Exception:
            continue
        if isinstance(item, dict):
            entries.append(item)
    return entries


def load_overrides(path: Path = DEFAULT_OVERRIDES) -> dict[str, Any]:
    if not path.exists():
        return {"value_rewrites": [], "command_suffix_rewrites": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"value_rewrites": [], "command_suffix_rewrites": []}
    if not isinstance(data, dict):
        return {"value_rewrites": [], "command_suffix_rewrites": []}
    if not isinstance(data.get("value_rewrites"), list):
        data["value_rewrites"] = []
    if not isinstance(data.get("command_suffix_rewrites"), list):
        data["command_suffix_rewrites"] = []
    return data


def save_overrides(data: dict[str, Any], path: Path = DEFAULT_OVERRIDES) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_semantic_aliases(path: Path = DEFAULT_SEMANTIC_ALIASES) -> dict[str, Any]:
    if not path.exists():
        return {"field_aliases": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"field_aliases": []}
    if not isinstance(data, dict):
        return {"field_aliases": []}
    if not isinstance(data.get("field_aliases"), list):
        data["field_aliases"] = []
    return data


def cli_enum_values(field: dict[str, Any]) -> list[str]:
    result: list[str] = []
    for key, fallback_key in (("cli_enum", "enum"), ("cli_optionalEnum", "optionalEnum")):
        values = field.get(key)
        if isinstance(values, list) and values:
            result.extend(str(item) for item in values)
            continue
        values = field.get(fallback_key)
        if isinstance(values, list) and values:
            result.extend(str(item).lower() for item in values)
    deduped = []
    seen = set()
    for value in result:
        marker = value.lower()
        if marker in seen:
            continue
        seen.add(marker)
        deduped.append(value)
    return deduped


def semantic_rule_matches(entry: dict[str, Any], field: dict[str, Any], rule: dict[str, Any]) -> bool:
    if str(rule.get("field") or "").lower() != str(field.get("name") or "").lower():
        return False
    for key in ("command", "path", "document"):
        if rule.get(key) and str(rule.get(key) or "").lower() != str(entry.get(key) or "").lower():
            return False
    path_prefix = str(rule.get("path_prefix") or "").lower()
    if path_prefix:
        entry_path = str(entry.get("path") or "").lower()
        if entry_path != path_prefix and not entry_path.startswith(path_prefix.rstrip("/") + "/"):
            return False
    documents = rule.get("documents")
    if isinstance(documents, list) and documents:
        allowed = {str(item).lower() for item in documents}
        if str(entry.get("document") or "").lower() not in allowed:
            return False
    return True


def semantic_alias_rules_for_field(
    entry: dict[str, Any],
    field: dict[str, Any],
    aliases: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    aliases = aliases if aliases is not None else load_semantic_aliases()
    return [
        rule
        for rule in aliases.get("field_aliases") or []
        if isinstance(rule, dict) and semantic_rule_matches(entry, field, rule)
    ]


def semantic_alias_rewrite(
    entry: dict[str, Any],
    field: dict[str, Any],
    value: str,
    aliases: dict[str, Any] | None = None,
) -> tuple[str | None, dict[str, Any] | None]:
    value_lower = value.lower()
    cli_values = {item.lower(): item for item in cli_enum_values(field)}
    for rule in semantic_alias_rules_for_field(entry, field, aliases):
        alias_map = rule.get("aliases")
        if not isinstance(alias_map, dict) and isinstance(rule.get("values"), dict):
            alias_map = {
                target: details.get("aliases")
                for target, details in rule["values"].items()
                if isinstance(details, dict)
            }
        if not isinstance(alias_map, dict):
            continue
        for target, alias_values in alias_map.items():
            target_text = str(target)
            target_cli = cli_values.get(target_text.lower(), target_text)
            if value_lower == target_cli.lower():
                continue
            candidates = [target_text, target_cli]
            if isinstance(alias_values, list):
                candidates.extend(str(item) for item in alias_values)
            if any(value_lower == str(candidate).lower() for candidate in candidates):
                return target_cli, {
                    "command": entry.get("command"),
                    "path": entry.get("path"),
                    "document": entry.get("document"),
                    "field": field.get("name"),
                    "from": value,
                    "to": target_cli,
                    "reason": "semantic_alias",
                }
    return None, None


def semantic_alias_value(
    entry: dict[str, Any],
    field: dict[str, Any],
    value: str,
    aliases: dict[str, Any] | None = None,
) -> str | None:
    replacement, _note = semantic_alias_rewrite(entry, field, value, aliases)
    return replacement


def enum_explanations(field: dict[str, Any]) -> dict[str, str]:
    description = str(field.get("description") or "")
    if not description:
        return {}
    result: dict[str, str] = {}
    values = cli_enum_values(field)
    if not values and isinstance(field.get("enum"), list):
        values = [str(item).lower() for item in field["enum"]]
    for value in values:
        pattern = rf"(?:^|[;；。,\s]){re.escape(value)}\s*[:：]\s*([^;；。,\n]+)"
        match = re.search(pattern, description, flags=re.IGNORECASE)
        if match:
            result[value] = match.group(1).strip()
    return result


def semantic_alias_summary(
    entry: dict[str, Any],
    field: dict[str, Any],
    aliases: dict[str, Any] | None = None,
) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for rule in semantic_alias_rules_for_field(entry, field, aliases):
        alias_map = rule.get("aliases")
        if not isinstance(alias_map, dict):
            if isinstance(rule.get("values"), dict):
                alias_map = {
                    target: details.get("aliases")
                    for target, details in rule["values"].items()
                    if isinstance(details, dict)
                }
        if not isinstance(alias_map, dict):
            continue
        for target, alias_values in alias_map.items():
            values = [str(item) for item in alias_values] if isinstance(alias_values, list) else []
            if values:
                result.setdefault(str(target), [])
                for item in values:
                    if item not in result[str(target)]:
                        result[str(target)].append(item)
    return result


def semantic_note_for_field(
    entry: dict[str, Any],
    field: dict[str, Any],
    aliases: dict[str, Any] | None = None,
) -> str | None:
    parts = []
    explanations = enum_explanations(field)
    alias_map = semantic_alias_summary(entry, field, aliases)
    values = cli_enum_values(field)
    for value in values:
        labels = []
        if value in explanations:
            labels.append(explanations[value])
        if value in alias_map:
            labels.extend(alias_map[value][:4])
        if labels:
            deduped = []
            for label in labels:
                if label not in deduped:
                    deduped.append(label)
            parts.append(f"{value}={'/'.join(deduped)}")
    if not parts:
        return None
    return f"{field.get('name')}: " + "; ".join(parts)


def semantic_notes_for_fields(
    entry: dict[str, Any],
    fields: list[dict[str, Any]],
    aliases: dict[str, Any] | None = None,
) -> list[str]:
    notes = []
    for field in fields:
        if not isinstance(field, dict):
            continue
        note = semantic_note_for_field(entry, field, aliases)
        if note and note not in notes:
            notes.append(note)
    return notes


def attach_semantic_field_info(
    entry: dict[str, Any],
    field: dict[str, Any],
    aliases: dict[str, Any] | None = None,
) -> dict[str, Any]:
    result = enrich_field_for_cli(field)
    explanations = enum_explanations(result)
    if explanations:
        result["enum_help"] = explanations
    summary = semantic_alias_summary(entry, result, aliases)
    if summary:
        result["semantic_aliases"] = summary
    return result


def enrich_field_for_cli(field: dict[str, Any]) -> dict[str, Any]:
    result = dict(field)
    properties = result.get("properties")
    if isinstance(properties, list):
        result["properties"] = [
            enrich_field_for_cli(item) if isinstance(item, dict) else item
            for item in properties
        ]
    if isinstance(result.get("items"), dict):
        result["items"] = enrich_field_for_cli(result["items"])
    cli_enum = cli_enum_values(result)
    if cli_enum:
        result["cli_enum"] = cli_enum
    enum_values = result.get("enum")
    optional_values = result.get("optionalEnum")
    if isinstance(optional_values, list) and optional_values:
        result["cli_optionalEnum"] = [str(item).lower() for item in optional_values]
    all_api_values = []
    if isinstance(enum_values, list):
        all_api_values.extend(enum_values)
    if isinstance(optional_values, list):
        all_api_values.extend(optional_values)
    for source_key, target_key in (("default", "cli_default"), ("example", "cli_example")):
        value = result.get(source_key)
        if isinstance(value, str) and value in all_api_values:
            result[target_key] = value.lower()
    return result


def enrich_entry_for_cli(entry: dict[str, Any]) -> dict[str, Any]:
    result = dict(entry)
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    result["fields"] = [enrich_field_for_cli(field) if isinstance(field, dict) else field for field in fields]
    return result


def tokenize(query: str) -> list[str]:
    terms = [item.lower() for item in re.split(r"\s+", query.strip()) if item.strip()]
    compact = query.strip().lower()
    if compact and compact not in terms:
        terms.append(compact)
    for prefix in ("创建", "新建", "修改", "编辑", "删除", "查看", "查询", "获取", "执行", "运行"):
        if compact.startswith(prefix.lower()) and len(compact) > len(prefix):
            target = compact[len(prefix):].strip()
            if target and target not in terms:
                terms.append(target)
            for filler in ("一个", "指定的", "当前已有的", "当前", "已有的"):
                if target.startswith(filler) and len(target) > len(filler):
                    stripped = target[len(filler):].strip()
                    if stripped and stripped not in terms:
                        terms.append(stripped)
    synonym_map = {
        "创建": ["create", "新建"],
        "新建": ["create", "创建"],
        "修改": ["modify", "编辑"],
        "编辑": ["modify", "修改"],
        "删除": ["delete"],
        "查看": ["list", "show", "查询"],
        "查询": ["list", "show", "查看"],
        "虚拟服务": ["virtual-service", "slb/virtual-service"],
        "优化策略": ["profile", "tcp_profile", "http_profile", "http-profile"],
        "调度方式": ["http_sched_mode"],
        "首个请求": ["http_sched_mode", "connection"],
        "每个请求": ["http_sched_mode", "request"],
        "节点池": ["pool", "slb/pool"],
        "前置策略": ["pre-rule", "slb/pre-rule"],
        "双机": ["ha", "active-standby", "cluster"],
        "心跳口": ["ha", "active-standby", "alternate_ha"],
        "双机心跳口": ["ha", "active-standby", "alternate_ha"],
        "管理口": ["management", "sys/management"],
        "维护密码": ["maintenance-passwd", "debug/sys/maintenance-passwd", "ssh_password", "run"],
        "后台维护密码": ["maintenance-passwd", "debug/sys/maintenance-passwd", "ssh_password", "run"],
        "安全设备": ["security-node", "slb/security-node"],
        "安全节点": ["security-node", "slb/security-node", "安全设备"],
        "a记录": ["dns-records/a", "a_records"],
        "aaaa记录": ["dns-records/aaaa", "aaaa_records"],
        "cname记录": ["dns-records/cname", "cname_records"],
        "mx记录": ["dns-records/mx", "mx_records"],
        "txt记录": ["dns-records/txt", "txt_records"],
        "网口": ["interface", "link"],
        "网口模式": ["interface-mode", "net/interface-mode"],
        "工作模式": ["interface-mode", "net/interface-mode"],
        "链路": ["link"],
        "抓包": ["tcpdump"],
    }
    query_lower = query.lower()
    for key, values in synonym_map.items():
        if key.lower() in query_lower:
            terms.extend(values)
    return terms


def semantic_query_alias_matches(entry: dict[str, Any], query: str, aliases: dict[str, Any]) -> list[dict[str, str]]:
    query_lower = query.lower()
    matches: list[dict[str, str]] = []
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    for field in fields:
        if not isinstance(field, dict):
            continue
        for rule in semantic_alias_rules_for_field(entry, field, aliases):
            alias_map = rule.get("aliases")
            if not isinstance(alias_map, dict) and isinstance(rule.get("values"), dict):
                alias_map = {
                    target: details.get("aliases")
                    for target, details in rule["values"].items()
                    if isinstance(details, dict)
                }
            if not isinstance(alias_map, dict):
                continue
            for target, alias_values in alias_map.items():
                candidates = [str(target)]
                if isinstance(alias_values, list):
                    candidates.extend(str(item) for item in alias_values)
                for candidate in candidates:
                    if candidate and candidate.lower() in query_lower:
                        matches.append(
                            {
                                "field": str(field.get("name") or ""),
                                "alias": candidate,
                                "value": str(target),
                            }
                        )
    return matches


def score_entry(entry: dict[str, Any], terms: list[str], query: str = "", aliases: dict[str, Any] | None = None) -> int:
    haystack = json.dumps(entry, ensure_ascii=False).lower()
    query_text = " ".join(terms)
    exact_query = query.strip().lower()
    action = str(entry.get("action", "")).lower()
    path = str(entry.get("path", "")).lower()
    command = str(entry.get("command", "")).lower()
    description = str(entry.get("description", "")).lower()
    summary = str(entry.get("summary", "")).lower()
    score = 0
    if exact_query:
        if exact_query == description or exact_query == summary:
            score += 260
        elif exact_query in description or exact_query in summary:
            score += 180
        if exact_query == command or exact_query == path:
            score += 220
        elif exact_query in command or exact_query in path:
            score += 120
    action_boosts = {
        "create": ["创建", "新建", "create"],
        "modify": ["修改", "编辑", "modify"],
        "delete": ["删除", "delete"],
        "list": ["查看", "查询", "list"],
        "show": ["查看", "查询", "show"],
        "run": ["执行", "调试", "run"],
    }
    if any(word.lower() in query_text for word in action_boosts.get(action, [])):
        score += 40
    if ("virtual-service" in query_text or "虚拟服务" in query_text) and path.startswith("slb/virtual-service"):
        score += 30
        if action in {"create", "modify", "list"} and any(
            word in query_text for word in ["profile", "tcp_profile", "http_profile", "http_sched_mode", "优化策略", "调度方式", "首个请求", "每个请求"]
        ):
            score += 180
    if path.startswith("stat/") and any(
        word in query_text for word in ["profile", "tcp_profile", "http_profile", "http_sched_mode", "优化策略", "调度方式", "首个请求", "每个请求"]
    ):
        score -= 120
    if ("pre-rule" in query_text or "前置策略" in query_text) and path.startswith("slb/pre-rule"):
        score += 30
    if ("pool" in query_text or "节点池" in query_text) and path.startswith("slb/pool"):
        score += 30
    if ("management" in query_text or "管理口" in query_text) and path.startswith("sys/management"):
        score += 30
    if ("maintenance-passwd" in query_text or "维护密码" in query_text) and path == "debug/sys/maintenance-passwd":
        score += 100
    if ("interface-mode" in query_text or "网口模式" in query_text or "工作模式" in query_text) and path == "net/interface-mode":
        score += 120
    if ("active-standby" in query_text or "双机" in query_text or "心跳口" in query_text) and path.startswith("ha/active-standby"):
        score += 90
    if ("dns-records/a" in query_text or "a_records" in query_text or "a记录" in query_text) and path.startswith("dns/zone/") and "/dns-records/a" in path:
        score += 120
    if "debug/" in path and not any(word in query_text for word in ["debug", "调试", "run", "执行"]):
        score -= 8
    semantic_hits = semantic_query_alias_matches(entry, query, aliases or load_semantic_aliases()) if query else []
    if semantic_hits:
        score += 260 + min(len(semantic_hits), 3) * 40
        if path.startswith("slb/virtual-service"):
            score += 160
        if action in {"create", "modify", "list"}:
            score += 60
        if path.startswith("debug/"):
            score -= 220
    for term in terms:
        if not term:
            continue
        if term in command:
            score += 20
        if term in description:
            score += 55 if len(term) >= 3 else 10
        if term in summary:
            score += 35 if len(term) >= 3 else 6
        if term in path:
            score += 35 if len(term) >= 3 else 8
        if term in haystack:
            score += 1
    return score


def command_search(query: str, limit: int, model: Path) -> dict[str, Any]:
    terms = tokenize(query)
    aliases = load_semantic_aliases()
    matches = []
    for entry in load_model(model):
        score = score_entry(entry, terms, query, aliases)
        if score > 0:
            slim = {
                key: entry.get(key)
                for key in ("command", "action", "path", "description", "document", "operationId", "method")
            }
            slim["score"] = score
            fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
            slim["fields"] = [
                attach_semantic_field_info(entry, field, aliases)
                for field in fields[:12]
                if isinstance(field, dict)
            ]
            notes = command_notes(entry)
            if notes:
                slim["notes"] = notes
            matches.append(slim)
    matches.sort(key=lambda item: item["score"], reverse=True)
    return {"ok": True, "query": query, "count": len(matches), "matches": matches[:limit]}


def field_placeholder(field: dict[str, Any]) -> str:
    name = str(field.get("name") or "value")
    field_type = str(field.get("type") or "")
    cli_enum = cli_enum_values(field)
    if field_type == "string" and cli_enum:
        return f"{name} [ {' | '.join(cli_enum)} ]"
    if field_type == "array":
        item = field.get("items") if isinstance(field.get("items"), dict) else {}
        if item:
            item_type = str(item.get("type") or "")
            item_enum = cli_enum_values(item)
            if item_type == "object":
                child_fields = item.get("properties") if isinstance(item.get("properties"), list) else []
                child_placeholders = [
                    field_placeholder(child)
                    for child in child_fields[:5]
                    if isinstance(child, dict) and child.get("name")
                ]
                suffix = " ..." if len(child_fields) > len(child_placeholders) else ""
                body = f"{{ {' '.join(child_placeholders)}{suffix} }}" if child_placeholders else "{ ... }"
                return f"{name} add {body}"
            if item_enum:
                return f"{name} add <{'|'.join(item_enum)}>"
            return f"{name} add <item>"
        return f"{name} add <item>"
    if field_type == "object":
        child_fields = field.get("properties") if isinstance(field.get("properties"), list) else []
        child_placeholders = [
            field_placeholder(child)
            for child in child_fields[:5]
            if isinstance(child, dict) and child.get("name")
        ]
        if child_placeholders:
            suffix = " ..." if len(child_fields) > len(child_placeholders) else ""
            return f"{name} {{ {' '.join(child_placeholders)}{suffix} }}"
        return f"{name} {{ ... }}"
    return f"{name} <{name}>"


def has_complex_placeholder(template: str) -> bool:
    return "{ ... }" in template or "[ <" in template


def complex_field_names(match: dict[str, Any], selected: list[dict[str, Any]]) -> list[str]:
    result = []
    for field in selected:
        field_type = str(field.get("type") or "")
        if field_type in {"array", "object"}:
            result.append(str(field.get("name") or ""))
    return [name for name in result if name]


def has_required_hint(text: str) -> bool:
    return any(word in text for word in ("必选", "必填", "必需", "不能为空", "不可为空", "至少"))


def fields_with_required_hints(fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    hinted = []
    for field in fields:
        description = str(field.get("description") or "")
        if has_required_hint(description):
            hinted.append(field)
    return hinted


def create_name_hints(match: dict[str, Any], fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    command = str(match.get("command") or "")
    if str(match.get("action") or "") != "create" or "[name]" in command:
        return []
    result = []
    for field in fields:
        if str(field.get("name") or "") != "name":
            continue
        description = str(field.get("description") or "")
        if "名称" in description or "唯一" in description:
            result.append(field)
    return result


def choice_group_notes(fields: list[dict[str, Any]]) -> list[str]:
    notes = []
    for field in fields:
        description = str(field.get("description") or "")
        if "二者必选其一" in description or "二选一" in description:
            notes.append(f"{field.get('name')}: {description}")
    return notes


def command_notes(entry: dict[str, Any]) -> list[str]:
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    notes = []
    if str(entry.get("path") or "") == "debug/sys/maintenance-passwd":
        notes.extend(
            [
            "Use space-separated field/value pairs; sfcli does not accept key=value here.",
            "username and password/pk_password are used to verify the current administrator identity.",
            "ssh_password or pk_ssh_password is the maintenance SSH password value to set.",
            "If the device returns authentication failure, verify the current administrator username/password first.",
            ]
        )
    hinted = [str(field.get("name")) for field in fields_with_required_hints(fields)]
    if hinted:
        notes.append("Fields marked required by description: " + ", ".join(hinted))
    notes.extend(choice_group_notes(fields))
    return notes


def select_template_fields(match: dict[str, Any], fields: list[dict[str, Any]], all_fields: bool) -> list[dict[str, Any]]:
    if all_fields:
        return fields
    required = [field for field in fields if field.get("required")]
    hinted = fields_with_required_hints(fields)
    if required:
        selected = []
        seen = set()
        for field in [*create_name_hints(match, fields), *required, *hinted]:
            name = str(field.get("name") or "")
            if name and name not in seen:
                seen.add(name)
                selected.append(field)
        return selected
    if str(match.get("path") or "") == "debug/sys/maintenance-passwd":
        wanted = {"username", "password", "ssh_password"}
        return [field for field in fields if str(field.get("name") or "") in wanted]
    if hinted:
        return hinted
    create_names = create_name_hints(match, fields)
    if create_names:
        return create_names
    if str(match.get("action") or "") == "run" or str(match.get("path") or "").startswith("debug/"):
        return fields[:8]
    if str(match.get("action") or "") in {"create", "modify"}:
        return fields[:8]
    return []


def find_command_entry(
    command: str,
    model: Path,
    path: str | None = None,
    document: str | None = None,
) -> dict[str, Any] | None:
    command = command.strip().lower()
    path = path.strip().lower() if path else None
    document = document.strip().lower() if document else None
    matches = []
    for entry in load_model(model):
        if str(entry.get("command") or "").lower() != command:
            continue
        if path and str(entry.get("path") or "").lower() != path:
            continue
        if document and str(entry.get("document") or "").lower() != document:
            continue
        matches.append(entry)

    if not matches:
        return None
    if len(matches) > 1:
        if len({str(item.get("command") or "") for item in matches}) == 1 and len(
            {str(item.get("path") or "") for item in matches}
        ) == 1 and len({str(item.get("document") or "") for item in matches}) == 1:
            matches = [merge_entries(matches)]
        else:
            candidates = [
                {
                    "command": item.get("command"),
                    "path": item.get("path"),
                    "document": item.get("document"),
                    "description": item.get("description"),
                }
                for item in matches[:20]
            ]
            raise SangforCliError(
                "ambiguous command; rerun template with --path and --document. candidates="
                + json.dumps(candidates, ensure_ascii=False, separators=(",", ":"))
            )

    entry = enrich_entry_for_cli(matches[0])
    aliases = load_semantic_aliases()
    slim = {
        key: entry.get(key)
        for key in ("command", "action", "path", "description", "document", "operationId", "method")
    }
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    slim["fields"] = [
        attach_semantic_field_info(entry, field, aliases)
        for field in fields
        if isinstance(field, dict)
    ]
    notes = command_notes(entry)
    if notes:
        slim["notes"] = notes
    return slim


def merge_entries(entries: list[dict[str, Any]]) -> dict[str, Any]:
    merged = dict(entries[0])
    fields: list[dict[str, Any]] = []
    by_name: dict[str, dict[str, Any]] = {}
    for entry in entries:
        for field in entry.get("fields") or []:
            if not isinstance(field, dict):
                continue
            name = str(field.get("name") or "")
            if name in by_name:
                merged_field = merge_field(by_name[name], field)
                by_name[name].clear()
                by_name[name].update(merged_field)
                continue
            by_name[name] = dict(field)
            fields.append(by_name[name])
    merged["fields"] = fields
    merged["merged_methods"] = sorted({str(entry.get("method") or "") for entry in entries if entry.get("method")})
    merged["merged_operationIds"] = [
        entry.get("operationId") for entry in entries if entry.get("operationId")
    ]
    return merged


def merge_field(existing: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    result = dict(existing)
    result["required"] = bool(existing.get("required")) or bool(incoming.get("required"))
    for key in ("enum", "optionalEnum", "cli_enum", "cli_optionalEnum"):
        values = []
        for source in (existing, incoming):
            source_values = source.get(key)
            if isinstance(source_values, list):
                values.extend(source_values)
        if values:
            deduped = []
            seen = set()
            for value in values:
                marker = str(value).lower()
                if marker in seen:
                    continue
                seen.add(marker)
                deduped.append(value)
            result[key] = deduped
    for key in ("description", "type", "default", "example", "cli_default", "cli_example"):
        if not result.get(key) and incoming.get(key):
            result[key] = incoming.get(key)
    existing_props = existing.get("properties") if isinstance(existing.get("properties"), list) else []
    incoming_props = incoming.get("properties") if isinstance(incoming.get("properties"), list) else []
    if existing_props or incoming_props:
        merged_props: list[dict[str, Any]] = []
        by_name: dict[str, dict[str, Any]] = {}
        for prop in [*existing_props, *incoming_props]:
            if not isinstance(prop, dict):
                continue
            name = str(prop.get("name") or "")
            if not name:
                continue
            if name in by_name:
                merged_prop = merge_field(by_name[name], prop)
                by_name[name].clear()
                by_name[name].update(merged_prop)
                continue
            by_name[name] = dict(prop)
            merged_props.append(by_name[name])
        result["properties"] = merged_props
    existing_item = existing.get("items") if isinstance(existing.get("items"), dict) else None
    incoming_item = incoming.get("items") if isinstance(incoming.get("items"), dict) else None
    if existing_item and incoming_item:
        result["items"] = merge_field(existing_item, incoming_item)
    elif existing_item:
        result["items"] = existing_item
    elif incoming_item:
        result["items"] = incoming_item
    return enrich_field_for_cli(result)


def command_template(
    query: str,
    model: Path,
    all_fields: bool = False,
    exact_command: str | None = None,
    exact_path: str | None = None,
    exact_document: str | None = None,
) -> dict[str, Any]:
    if exact_command:
        match = find_command_entry(exact_command, model, exact_path, exact_document)
        if not match:
            return {
                "ok": False,
                "query": query,
                "command": exact_command,
                "path": exact_path,
                "document": exact_document,
                "error": "command not found",
            }
    else:
        matches = command_search(query, 10, model).get("matches") or []
        if not matches:
            return {"ok": False, "query": query, "error": "no command matched"}
        top = matches[0]
        same_visible = [
            item
            for item in matches
            if str(item.get("command") or "") == str(top.get("command") or "")
            and (
                str(item.get("path") or "") != str(top.get("path") or "")
                or str(item.get("document") or "") != str(top.get("document") or "")
            )
        ]
        query_lower = query.lower()
        domain_ambiguous = False
        if "虚拟服务" in query_lower or "virtual-service" in query_lower:
            domain_ambiguous = not str(top.get("path") or "").startswith("slb/virtual-service") and any(
                str(item.get("path") or "").startswith("slb/virtual-service")
                for item in matches
            )
        if same_visible or domain_ambiguous:
            candidates = [
                {
                    "command": item.get("command"),
                    "path": item.get("path"),
                    "document": item.get("document"),
                    "description": item.get("description"),
                    "score": item.get("score"),
                }
                for item in matches[:10]
            ]
            return {
                "ok": False,
                "query": query,
                "error": "natural-language template is ambiguous; use search first, then template --command with --path and --document",
                "candidates": candidates,
            }
        match = find_command_entry(
            str(top.get("command") or ""),
            model,
            str(top.get("path") or ""),
            str(top.get("document") or ""),
        ) or top
    command = str(match.get("command") or "")
    fields = match.get("fields") if isinstance(match.get("fields"), list) else []
    aliases = load_semantic_aliases()
    rendered_fields = []
    selected_fields = select_template_fields(match, fields, all_fields)
    for field in selected_fields:
        if not isinstance(field, dict):
            continue
        name = str(field.get("name") or "")
        if name and f"[{name}]" in command:
            continue
        rendered_fields.append(field_placeholder(field))
    template = " ".join([command, *rendered_fields]).strip()
    if template and not template.lower().startswith("sfcli "):
        template = f"sfcli {template}"
    if not template.endswith(";"):
        template += ";"
    result = {"ok": True, "query": query, "match": match, "template": template}
    semantic_notes = semantic_notes_for_fields(match, fields if all_fields else selected_fields, aliases)
    if semantic_notes:
        result["semantic_notes"] = semantic_notes
    complex_fields = complex_field_names(match, selected_fields)
    path_placeholders = sorted(command_placeholder_names(match))
    result["execution_ready"] = not complex_fields and not path_placeholders
    if path_placeholders:
        result["path_placeholders"] = path_placeholders
        result["template_notice"] = (
            "Template contains command path placeholders. Replace them with real AD resource values before format/run."
        )
    if complex_fields:
        result["complex_fields"] = complex_fields
        notices = [result["template_notice"]] if result.get("template_notice") else []
        notices.append(
            "Template contains array/object placeholders. Replace them with valid sfcli syntax "
            "or use live `sfcli help` before execution."
        )
        result["template_notice"] = " ".join(notices)
    if not exact_command:
        result["resolution"] = "natural_language"
        result["warning"] = (
            "Natural-language template output is not execution-ready by itself. For execution, use "
            "search -> template --command <command> --path <path> --document <document>."
        )
    else:
        result["resolution"] = "exact_command"
    notes = command_notes(match)
    if notes:
        result["notes"] = notes
    return result


def strip_sfcli_prefix(line: str) -> str:
    lowered = line.lower()
    if lowered == "sfcli":
        return ""
    if lowered.startswith("sfcli "):
        return line[6:].strip()
    return line


def render_remainder(args: list[str]) -> str:
    if len(args) == 1:
        return args[0].strip()
    return shlex.join(args).strip()


def ensure_sfcli_command(line: str, append_semicolon: bool = True) -> str:
    body = strip_sfcli_prefix(line.strip())
    if not body:
        return ""
    if append_semicolon and not body.lower().startswith(("help ", "quit", "history")):
        body = to_shell_command(body) + ";"
    return f"sfcli {body}"


def normalize_commands(commands: list[str], append_semicolon: bool = True) -> list[str]:
    lines, _repairs = normalize_commands_detailed(commands, append_semicolon=append_semicolon)
    return lines


def to_shell_command(command: str) -> str:
    command = command.strip()
    while command.endswith(";"):
        command = command[:-1].rstrip()
    return command


def to_shell_safe_command(command: str) -> str:
    command = to_shell_command(command)
    if not command:
        return ""
    try:
        parts = shlex.split(command, posix=True)
    except ValueError as exc:
        raise SangforCliError(f"invalid shell quoting in command: {exc}") from exc
    return shlex.join(parts)


def join_cli_tokens(tokens: list[str]) -> str:
    rendered = []
    for token in tokens:
        if token in {"{", "}", "[", "]"}:
            rendered.append(token)
        else:
            rendered.append(shlex.quote(token))
    return " ".join(rendered)


FIELD_DOT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z_][A-Za-z0-9_-]*)+$")
BRACKET_PLACEHOLDER_RE = re.compile(r"^\[[A-Za-z_][A-Za-z0-9_-]*\]$")
ANGLE_PLACEHOLDER_RE = re.compile(r"^<[^<>]+>$")


def object_field_roots(model: Path = DEFAULT_MODEL) -> set[str]:
    roots: set[str] = set()
    for entry in load_model(model):
        for field in entry.get("fields") or []:
            if isinstance(field, dict) and field.get("type") == "object" and field.get("name"):
                roots.add(str(field["name"]).lower())
    return roots


def dotted_object_token(token: str, object_roots: set[str]) -> bool:
    if not FIELD_DOT_RE.match(token):
        return False
    root = token.split(".", 1)[0].lower()
    return root in object_roots


def to_shell_commands(commands: list[str]) -> list[str]:
    return [item for item in (to_shell_command(command) for command in commands) if item]


def to_shell_safe_commands(commands: list[str]) -> list[str]:
    return [item for item in (to_shell_safe_command(command) for command in commands) if item]


def to_sfcli_batch_file_command(command: str) -> str:
    body = to_shell_command(strip_sfcli_prefix(command))
    if not body:
        return ""
    try:
        parts = shlex.split(body, posix=True)
    except ValueError as exc:
        raise SangforCliError(f"invalid shell quoting in batch command: {exc}") from exc
    return join_cli_tokens(parts)


def to_sfcli_batch_file_text(commands: list[str]) -> str:
    lines = [item for item in (to_sfcli_batch_file_command(command) for command in commands) if item]
    return "\n".join(lines) + ("\n" if lines else "")


def sfcli_batch_remote_text(commands: list[str]) -> str:
    body = to_sfcli_batch_file_text(commands)
    return (
        'tmp=$(mktemp /tmp/sangfor-cli-batch.XXXXXX.sfcli)\n'
        'cat > "$tmp" <<\'EOF\'\n'
        f"{body}"
        "EOF\n"
        'sfcli -f "$tmp"\n'
        "rc=$?\n"
        'rm -f "$tmp"\n'
        "exit $rc\n"
    )


def command_parts(command: str) -> list[str]:
    try:
        return shlex.split(to_shell_command(strip_sfcli_prefix(command)), posix=True)
    except ValueError as exc:
        raise SangforCliError(f"invalid shell quoting in command: {exc}") from exc


def unresolved_template_tokens(tokens: list[str]) -> list[str]:
    result = []
    for token in tokens:
        if BRACKET_PLACEHOLDER_RE.match(token) or ANGLE_PLACEHOLDER_RE.match(token) or token in {"...", "|"}:
            result.append(token)
    return result


def entry_pattern(entry: dict[str, Any]) -> list[str]:
    return str(entry.get("command") or "").split()


def command_placeholder_names(entry: dict[str, Any]) -> set[str]:
    result = set()
    for token in entry_pattern(entry):
        if token.startswith("[") and token.endswith("]"):
            result.add(token.strip("[]").lower())
    return result


def required_identity_fields(entry: dict[str, Any]) -> set[str]:
    if str(entry.get("action") or "") not in {"create", "modify"}:
        return set()
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    return {
        str(field.get("name") or "").lower()
        for field in fields
        if isinstance(field, dict)
        and field.get("required")
        and str(field.get("name") or "").lower() in {"name"}
    }


def required_top_level_fields_for_format(entry: dict[str, Any]) -> set[str]:
    action = str(entry.get("action") or "")
    if action == "create":
        fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
        return {
            str(field.get("name") or "").lower()
            for field in fields
            if isinstance(field, dict) and field.get("required") and field.get("name")
        }
    if action == "modify":
        return required_identity_fields(entry)
    return set()


def entry_matches_rule(entry: dict[str, Any], rule: dict[str, Any]) -> bool:
    for key in ("command", "path", "document"):
        if rule.get(key) and str(rule.get(key) or "").lower() != str(entry.get(key) or "").lower():
            return False
    return True


def command_suffix_rules_for_entry(
    entry: dict[str, Any],
    overrides: dict[str, Any],
    include_builtin: bool = False,
) -> list[dict[str, Any]]:
    rules = [
        rule
        for rule in overrides.get("command_suffix_rewrites") or []
        if isinstance(rule, dict) and entry_matches_rule(entry, rule)
    ]
    if include_builtin and str(entry.get("action") or "") in {"create", "modify", "delete"}:
        rules.append(
            {
                "command": entry.get("command"),
                "path": entry.get("path"),
                "document": entry.get("document"),
                "append": ["force"],
                "when_error_contains": ["强制提交"],
                "source": "builtin-force-submit-guard",
            }
        )
    return rules


def allowed_command_flag(entry: dict[str, Any], token: str, index: int, tokens: list[str], overrides: dict[str, Any]) -> bool:
    if index != len(tokens) - 1:
        return False
    token_lower = token.lower()
    for rule in command_suffix_rules_for_entry(entry, overrides, include_builtin=False):
        append = [str(item).lower() for item in rule.get("append") or []]
        if append == [token_lower]:
            return True
    return False


def pattern_match_length(pattern: list[str], tokens: list[str]) -> int:
    if len(pattern) > len(tokens):
        return -1
    for expected, actual in zip(pattern, tokens):
        if expected.startswith("[") and expected.endswith("]"):
            continue
        if expected.lower() != actual.lower():
            return -1
    return len(pattern)


def token_starts_field(entry: dict[str, Any], token: str) -> bool:
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    fields_by_name = {
        str(field.get("name") or "").lower(): field
        for field in fields
        if isinstance(field, dict) and field.get("name")
    }
    token_lower = token.lower()
    if token_lower in fields_by_name:
        return True
    if "." not in token:
        return False
    root = token.split(".", 1)[0].lower()
    field = fields_by_name.get(root)
    return bool(field and field.get("type") == "object")


def top_level_field(entry: dict[str, Any], token: str) -> dict[str, Any] | None:
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    token_lower = token.lower()
    for field in fields:
        if isinstance(field, dict) and str(field.get("name") or "").lower() == token_lower:
            return field
    return None


def find_entry_for_tokens(tokens: list[str], model: Path = DEFAULT_MODEL) -> tuple[dict[str, Any] | None, int]:
    matches, length = find_entries_for_tokens(tokens, model)
    if not matches:
        return None, length
    return merge_entries(matches), length


def find_entries_for_tokens(
    tokens: list[str],
    model: Path = DEFAULT_MODEL,
    path: str | None = None,
    document: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    best_len = -1
    matches: list[dict[str, Any]] = []
    path = path.lower() if path else None
    document = document.lower() if document else None
    candidates: list[tuple[int, int, dict[str, Any], list[str]]] = []
    for entry in load_model(model):
        if path and str(entry.get("path") or "").lower() != path:
            continue
        if document and str(entry.get("document") or "").lower() != document:
            continue
        length = pattern_match_length(entry_pattern(entry), tokens)
        if length < 0:
            continue
        enriched = enrich_entry_for_cli(entry)
        if length == len(tokens):
            field_score = 2
        else:
            field_score = 1 if token_starts_field(enriched, tokens[length]) else 0
        candidates.append((field_score, length, enriched, entry_pattern(entry)))
    if not candidates:
        return matches, best_len

    ranked: list[tuple[tuple[int, int], int, dict[str, Any]]] = []
    for field_score, length, entry, pattern in candidates:
        consumed_field_as_placeholder = False
        if pattern and pattern[-1].startswith("[") and pattern[-1].endswith("]") and length > 0:
            consumed = tokens[length - 1]
            consumed_field_as_placeholder = any(
                other_length == length - 1
                and other_length < len(tokens)
                and tokens[other_length].lower() == consumed.lower()
                and token_starts_field(other_entry, tokens[other_length])
                for _other_score, other_length, other_entry, _other_pattern in candidates
            )
        consumed_array_op_as_placeholder = False
        if pattern and pattern[-1].startswith("[") and pattern[-1].endswith("]") and length > 1:
            consumed = normalize_brace_token(tokens[length - 1]).lower()
            if consumed in {"{", "add", "delete"}:
                previous_index = length - 2
                consumed_array_op_as_placeholder = any(
                    other_length == previous_index
                    and previous_index < len(tokens)
                    and (
                        (field := top_level_field(other_entry, tokens[previous_index])) is not None
                        and str(field.get("type") or "") == "array"
                    )
                    for _other_score, other_length, other_entry, _other_pattern in candidates
                )
        effective_score = field_score
        if consumed_field_as_placeholder:
            effective_score -= 2
        if consumed_array_op_as_placeholder:
            effective_score -= 3
        ranked.append(((effective_score, length), length, entry))

    best_score = max(score for score, _length, _entry in ranked)
    best_len = best_score[1]
    matches = [entry for score, _length, entry in ranked if score == best_score]
    return matches, best_len


def visible_command_prefix(tokens: list[str], length: int) -> str:
    return " ".join(tokens[:length])


def possible_field_entries(tokens: list[str], prefix_len: int, model: Path = DEFAULT_MODEL) -> list[dict[str, Any]]:
    result = []
    for entry in load_model(model):
        pattern = entry_pattern(entry)
        length = pattern_match_length(pattern, tokens)
        if length == prefix_len and prefix_len < len(tokens):
            enriched = enrich_entry_for_cli(entry)
            if token_starts_field(enriched, tokens[prefix_len]):
                result.append(enriched)
    return result


def command_word_prefixes(model: Path = DEFAULT_MODEL) -> set[str]:
    prefixes: set[str] = set()
    for entry in load_model(model):
        pattern = entry_pattern(entry)
        for index in range(1, len(pattern) + 1):
            if all(not part.startswith("[") for part in pattern[:index]):
                prefixes.add(" ".join(pattern[:index]).lower())
    return prefixes


def known_field_names(model: Path = DEFAULT_MODEL) -> set[str]:
    names: set[str] = set()

    def collect(fields: list[dict[str, Any]]) -> None:
        for field in fields:
            if not isinstance(field, dict):
                continue
            name = str(field.get("name") or "")
            if name:
                names.add(name.lower())
            if isinstance(field.get("properties"), list):
                collect(field["properties"])
            item = field.get("items") if isinstance(field.get("items"), dict) else None
            if item:
                collect([item])

    for entry in load_model(model):
        collect(entry.get("fields") or [])
    return names


def override_value(
    command: str,
    path: str,
    document: str,
    field: str,
    value: str,
    overrides: dict[str, Any],
) -> str | None:
    for item in overrides.get("value_rewrites") or []:
        if not isinstance(item, dict):
            continue
        if str(item.get("field") or "").lower() != field.lower():
            continue
        if item.get("command") and str(item.get("command")).lower() != command.lower():
            continue
        if item.get("path") and str(item.get("path")).lower() != path.lower():
            continue
        if item.get("document") and str(item.get("document")).lower() != document.lower():
            continue
        if str(item.get("from") or "").lower() == value.lower():
            return str(item.get("to"))
    return None


def symbolic_cli_example_rewrite(field: dict[str, Any], value: str) -> str | None:
    examples = []
    for key in ("example", "default"):
        item = field.get(key)
        if isinstance(item, list):
            examples.extend(str(part) for part in item)
        elif item not in (None, ""):
            examples.append(str(item))
    for example in examples:
        if example.lower() != value.lower():
            continue
        if value == value.upper() or "-" in value or "_" in value:
            lowered = value.lower()
            if lowered != value:
                return lowered
    return None


def canonical_field_value(
    entry: dict[str, Any],
    field: dict[str, Any],
    value: str,
    overrides: dict[str, Any],
) -> str | None:
    command = str(entry.get("command") or "")
    path = str(entry.get("path") or "")
    document = str(entry.get("document") or "")
    field_name = str(field.get("name") or "")
    override = override_value(command, path, document, field_name, value, overrides)
    if override is not None and override != value:
        return override
    semantic = semantic_alias_value(entry, field, value)
    if semantic is not None and semantic != value:
        return semantic

    enum_values = []
    if isinstance(field.get("enum"), list):
        enum_values.extend(field.get("enum"))
    if isinstance(field.get("optionalEnum"), list):
        enum_values.extend(field.get("optionalEnum"))
    cli_values = cli_enum_values(field)
    mapping: dict[str, str] = {}
    if cli_values:
        for index, cli_value in enumerate(cli_values):
            mapping[str(cli_value).lower()] = str(cli_value)
            if index < len(enum_values):
                mapping[str(enum_values[index]).lower()] = str(cli_value)
    replacement = mapping.get(value.lower())
    if replacement is not None and replacement != value:
        return replacement
    example_rewrite = symbolic_cli_example_rewrite(field, value)
    if example_rewrite is not None:
        return example_rewrite
    return None


def child_fields_by_name(field: dict[str, Any]) -> dict[str, dict[str, Any]]:
    properties = field.get("properties") if isinstance(field.get("properties"), list) else []
    return {
        str(child.get("name") or "").lower(): child
        for child in properties
        if isinstance(child, dict) and child.get("name")
    }


def normalize_brace_token(token: str) -> str:
    if token in {"[", "("}:
        return "{"
    if token in {"]", ")"}:
        return "}"
    return token


def repair_object_child_tokens(
    entry: dict[str, Any],
    field: dict[str, Any],
    tokens: list[str],
    index: int,
    overrides: dict[str, Any],
) -> tuple[list[str] | None, int, list[dict[str, Any]]]:
    field_name = str(field.get("name") or tokens[index])
    children = child_fields_by_name(field)
    if not children:
        return None, index, []

    repairs: list[dict[str, Any]] = []

    def repair_child_value(child_name: str, old_value: str) -> str:
        child = children.get(child_name.lower())
        if not child:
            return old_value
        new_value = canonical_field_value(entry, child, old_value, overrides)
        if new_value is not None:
            repairs.append(
                {
                    "command": entry.get("command"),
                    "path": entry.get("path"),
                    "document": entry.get("document"),
                    "field": f"{field_name}.{child.get('name')}",
                    "from": old_value,
                    "to": new_value,
                    "reason": "object_child_cli_enum_or_override",
                }
            )
            return new_value
        return old_value

    def repair_child_at(cursor: int) -> tuple[list[str] | None, int, list[dict[str, Any]], bool]:
        if cursor >= len(tokens):
            return None, cursor, [], False
        child_name = normalize_brace_token(tokens[cursor])
        child = children.get(child_name.lower())
        if not child:
            return None, cursor, [], False
        if str(child.get("type") or "") == "object":
            nested_tokens, nested_next, nested_repairs = repair_object_child_tokens(
                entry, child, tokens, cursor, overrides
            )
            if nested_tokens is not None:
                return nested_tokens, nested_next, nested_repairs, True
        if str(child.get("type") or "") == "array":
            array_tokens, array_next, array_repairs = repair_array_tokens(
                entry,
                child,
                tokens,
                cursor,
                children,
                overrides,
            )
            if array_tokens is not None:
                return array_tokens, array_next, array_repairs, bool(array_repairs)
        if cursor + 1 >= len(tokens):
            return [child_name], cursor + 1, [], False
        old_value = tokens[cursor + 1]
        new_value = repair_child_value(child_name, old_value)
        return [child_name, new_value], cursor + 2, [], new_value != old_value

    if index + 1 < len(tokens) and normalize_brace_token(tokens[index + 1]) == "{":
        cursor = index + 2
        inner: list[str] = []
        changed = tokens[index + 1] != "{"
        closed = False
        if changed:
            repairs.append(
                {
                    "command": entry.get("command"),
                    "path": entry.get("path"),
                    "document": entry.get("document"),
                    "field": field_name,
                    "from": tokens[index + 1],
                    "to": "{",
                    "reason": "object_bracket_to_brace",
                }
            )
        while cursor < len(tokens):
            token = normalize_brace_token(tokens[cursor])
            if token == "}":
                changed = changed or tokens[cursor] != "}"
                closed = True
                if tokens[cursor] != "}":
                    repairs.append(
                        {
                            "command": entry.get("command"),
                            "path": entry.get("path"),
                            "document": entry.get("document"),
                            "field": field_name,
                            "from": tokens[cursor],
                            "to": "}",
                            "reason": "object_bracket_to_brace",
                        }
                    )
                cursor += 1
                break
            if token.lower() in children:
                child_tokens, child_next, child_repairs, child_changed = repair_child_at(cursor)
                if child_tokens is not None:
                    inner.extend(child_tokens)
                    repairs.extend(child_repairs)
                    changed = changed or child_changed
                    cursor = child_next
                    continue
            if token.lower() in children and cursor + 1 < len(tokens):
                value = tokens[cursor + 1]
                new_value = repair_child_value(token, value)
                inner.extend([token, new_value])
                changed = changed or new_value != value
                cursor += 2
                continue
            inner.append(tokens[cursor])
            cursor += 1
        if not closed:
            return None, index, []
        return [field_name, "{", *inner, "}"], cursor, repairs

    if index + 1 < len(tokens) and tokens[index + 1].lower() in children:
        cursor = index + 1
        inner: list[str] = []
        while cursor < len(tokens) and tokens[cursor].lower() in children:
            child_tokens, child_next, child_repairs, _child_changed = repair_child_at(cursor)
            if child_tokens is None or child_next == cursor:
                break
            inner.extend(child_tokens)
            repairs.extend(child_repairs)
            cursor = child_next
        repairs.append(
            {
                "command": entry.get("command"),
                "path": entry.get("path"),
                "document": entry.get("document"),
                "field": field_name,
                "from": " ".join(tokens[index:cursor]),
                "to": f"{field_name} {{ {' '.join(inner)} }}",
                "reason": "object_child_wrapped_in_braces",
            }
        )
        return [field_name, "{", *inner, "}"], cursor, repairs

    return None, index, []


def consume_balanced_value(tokens: list[str], index: int) -> tuple[int, str | None]:
    opener = normalize_brace_token(tokens[index])
    if opener != "{":
        return index + 1, None
    depth = 0
    cursor = index
    while cursor < len(tokens):
        token = normalize_brace_token(tokens[cursor])
        if token == "{":
            depth += 1
        elif token == "}":
            depth -= 1
            if depth == 0:
                return cursor + 1, None
            if depth < 0:
                return cursor, "unexpected closing brace in object child value"
        cursor += 1
    return cursor, "missing closing brace in object child value"


def validate_object_value(field: dict[str, Any], tokens: list[str], index: int) -> tuple[int, str | None]:
    field_name = str(field.get("name") or "object")
    if index >= len(tokens) or normalize_brace_token(tokens[index]) != "{":
        return index, f"object field {field_name} requires brace syntax"

    children = child_fields_by_name(field)
    if not children:
        return consume_balanced_value(tokens, index)

    cursor = index + 1
    seen_children: set[str] = set()
    while cursor < len(tokens):
        token = normalize_brace_token(tokens[cursor])
        if token == "}":
            missing = [
                str(child.get("name") or "")
                for child in children.values()
                if child.get("required") and str(child.get("name") or "").lower() not in seen_children
            ]
            if missing:
                return cursor, f"missing required child field(s) for object field {field_name}: {', '.join(missing)}"
            return cursor + 1, None
        if token == "{":
            return cursor, f"unexpected nested brace before an object child in {field_name}"

        child_name = tokens[cursor]
        child = children.get(child_name.lower())
        if not child:
            return cursor, f"unknown child {child_name!r} for object field {field_name}"
        seen_children.add(child_name.lower())
        cursor += 1

        if str(child.get("type") or "") == "object":
            cursor, error = validate_object_value(child, tokens, cursor)
            if error:
                return cursor, error
            continue

        if str(child.get("type") or "") == "array":
            cursor, error = validate_array_value(child, tokens, cursor, children)
            if error:
                return cursor, error
            continue

        if cursor >= len(tokens):
            return cursor, f"missing value for object child {field_name}.{child_name}"
        value_token = normalize_brace_token(tokens[cursor])
        if value_token == "}":
            return cursor, f"missing value for object child {field_name}.{child_name}"
        if value_token == "{":
            cursor, error = consume_balanced_value(tokens, cursor)
            if error:
                return cursor, error
            continue
        cursor += 1

    return cursor, f"missing closing brace for object field {field_name}"


def validate_array_value(
    field: dict[str, Any],
    tokens: list[str],
    index: int,
    sibling_fields: dict[str, dict[str, Any]] | None = None,
) -> tuple[int, str | None]:
    field_name = str(field.get("name") or "array")
    item = field.get("items") if isinstance(field.get("items"), dict) else {}
    cursor = index
    if cursor < len(tokens) and tokens[cursor].lower() in {"add", "delete"}:
        cursor += 1
    if cursor >= len(tokens):
        return cursor, f"missing value for array field {field_name}"

    item_type = str(item.get("type") or "")
    if item_type == "object":
        if normalize_brace_token(tokens[cursor]) != "{":
            return cursor, f"array object field {field_name} requires item braces"
        return validate_object_value(item, tokens, cursor)

    if normalize_brace_token(tokens[cursor]) == "{":
        return consume_balanced_value(tokens, cursor)

    sibling_fields = sibling_fields or {}
    while cursor < len(tokens):
        token = normalize_brace_token(tokens[cursor])
        if token == "}":
            return cursor, None
        if token == "{":
            return consume_balanced_value(tokens, cursor)
        if tokens[cursor].lower() in sibling_fields:
            return cursor, None
        cursor += 1
    return cursor, None


def object_field_error(field: dict[str, Any], tokens: list[str], index: int) -> str | None:
    field_name = str(field.get("name") or tokens[index])
    children = child_fields_by_name(field)
    if not children:
        return None
    if index + 1 >= len(tokens):
        return f"object field {field_name} requires brace syntax with one of: {', '.join(children)}"
    next_token = normalize_brace_token(tokens[index + 1])
    if next_token != "{":
        return f"object field {field_name} requires brace syntax; unknown or unrepairable child {tokens[index + 1]!r}"
    _next_index, error = validate_object_value(field, tokens, index + 1)
    return error


def repair_array_tokens(
    entry: dict[str, Any],
    field: dict[str, Any],
    tokens: list[str],
    index: int,
    fields_by_name: dict[str, dict[str, Any]],
    overrides: dict[str, Any],
) -> tuple[list[str] | None, int, list[dict[str, Any]]]:
    field_name = str(field.get("name") or tokens[index])
    item = field.get("items") if isinstance(field.get("items"), dict) else {}
    if not item or index + 1 >= len(tokens):
        return None, index, []

    cursor = index + 1
    repaired = [field_name]
    repairs: list[dict[str, Any]] = []
    if tokens[cursor].lower() in {"add", "delete"}:
        repaired.append(tokens[cursor].lower())
        cursor += 1
    if cursor >= len(tokens):
        return repaired, cursor, repairs

    item_type = str(item.get("type") or "")
    if item_type == "object":
        wrapped_object_item = (
            cursor + 1 < len(tokens)
            and normalize_brace_token(tokens[cursor]) == "{"
            and normalize_brace_token(tokens[cursor + 1]) == "{"
        )
        if wrapped_object_item:
            repairs.append(
                {
                    "command": entry.get("command"),
                    "path": entry.get("path"),
                    "document": entry.get("document"),
                    "field": field_name,
                    "from": tokens[cursor],
                    "to": "",
                    "reason": "array_object_outer_bracket_removed",
                }
            )
            cursor += 1
        synthetic = [str(item.get("name") or "item"), *tokens[cursor:]]
        item_tokens, item_next, item_repairs = repair_object_child_tokens(
            entry,
            item,
            synthetic,
            0,
            overrides,
        )
        if item_tokens is None:
            error = object_field_error(item, synthetic, 0)
            if error:
                raise SangforCliError(
                    "invalid array object item syntax for "
                    + field_name
                    + ": "
                    + error
                )
            return None, index, []
        _validated_next, object_error = validate_object_value(item, item_tokens, 1)
        if object_error:
            raise SangforCliError(
                "invalid array object item syntax for "
                + field_name
                + ": "
                + object_error
            )
        repaired.extend(item_tokens[1:])
        repairs.extend(item_repairs)
        next_index = cursor + item_next - 1
        if wrapped_object_item and next_index < len(tokens) and normalize_brace_token(tokens[next_index]) == "}":
            next_index += 1
        return repaired, next_index, repairs

    if normalize_brace_token(tokens[cursor]) == "{":
        repaired.append("[")
        cursor += 1
        depth = 1
        closed = False
        while cursor < len(tokens):
            token = tokens[cursor]
            normalized = normalize_brace_token(token)
            if normalized == "{":
                depth += 1
                repaired.append(token)
                cursor += 1
                continue
            if normalized == "}":
                depth -= 1
                cursor += 1
                if depth == 0:
                    closed = True
                    break
                repaired.append(token)
                continue
            new_value = canonical_field_value(entry, item, token, overrides)
            if new_value is None:
                new_value = symbolic_cli_example_rewrite(field, token)
            if new_value is not None:
                repaired.append(new_value)
                repairs.append(
                    {
                        "command": entry.get("command"),
                        "path": entry.get("path"),
                        "document": entry.get("document"),
                        "field": f"{field_name}[]",
                        "from": token,
                        "to": new_value,
                        "reason": "array_item_cli_enum_or_override",
                    }
                )
            else:
                repaired.append(token)
            cursor += 1
        if not closed:
            raise SangforCliError(f"invalid array field syntax for {field_name}: missing closing bracket")
        repaired.append("]")
        return repaired, cursor, repairs

    while cursor < len(tokens):
        token = tokens[cursor]
        if normalize_brace_token(token) == "}":
            break
        if token.lower() in fields_by_name:
            break
        new_value = canonical_field_value(entry, item, token, overrides)
        if new_value is None:
            new_value = symbolic_cli_example_rewrite(field, token)
        if new_value is not None:
            repaired.append(new_value)
            repairs.append(
                {
                    "command": entry.get("command"),
                    "path": entry.get("path"),
                    "document": entry.get("document"),
                    "field": f"{field_name}[]",
                    "from": token,
                    "to": new_value,
                    "reason": "array_item_cli_enum_or_override",
                }
            )
        else:
            repaired.append(token)
        cursor += 1
    return repaired, cursor, repairs


def repair_dotted_object_field(
    entry: dict[str, Any],
    fields_by_name: dict[str, dict[str, Any]],
    tokens: list[str],
    index: int,
    overrides: dict[str, Any],
) -> tuple[list[str] | None, int, list[dict[str, Any]]]:
    token = tokens[index]
    if "." not in token or index + 1 >= len(tokens):
        return None, index, []
    parts = token.split(".")
    object_name = parts[0]
    field = fields_by_name.get(object_name.lower())
    if not field:
        return None, index, []
    current = field
    for child_name in parts[1:]:
        children = child_fields_by_name(current)
        child = children.get(child_name.lower())
        if not child:
            return None, index, []
        current = child
    if str(current.get("type") or "") == "object":
        return None, index, []
    old_value = tokens[index + 1]
    new_value = canonical_field_value(entry, current, old_value, overrides) or old_value

    nested: list[str] = [parts[-1], new_value]
    for part in reversed(parts[1:-1]):
        nested = [part, "{", *nested, "}"]
    repaired_tokens = [object_name, "{", *nested, "}"]
    repairs = [
        {
            "command": entry.get("command"),
            "path": entry.get("path"),
            "document": entry.get("document"),
            "field": ".".join(parts),
            "from": f"{token} {old_value}",
            "to": " ".join(repaired_tokens),
            "reason": "dotted_object_child_wrapped_in_braces",
        }
    ]
    if new_value != old_value:
        repairs.append(
            {
                "command": entry.get("command"),
                "path": entry.get("path"),
                "document": entry.get("document"),
                "field": ".".join(parts),
                "from": old_value,
                "to": new_value,
                "reason": "object_child_cli_enum_or_override",
            }
        )
    return repaired_tokens, index + 2, repairs


def canonicalize_command(line: str, model: Path = DEFAULT_MODEL, overrides_path: Path = DEFAULT_OVERRIDES) -> tuple[str, list[dict[str, Any]]]:
    tokens = command_parts(line)
    if not tokens:
        return "", []
    placeholders = unresolved_template_tokens(tokens)
    if placeholders:
        raise SangforCliError(
            "unresolved template placeholder token(s) in sfcli command: "
            + ", ".join(placeholders)
            + ". Replace template placeholders such as [name] or <value> with real AD values before format/run."
        )
    entry, prefix_len = find_entry_for_tokens(tokens, model)
    if not entry or prefix_len < 0:
        roots = object_field_roots(model)
        dotted = [token for token in tokens if dotted_object_token(token, roots)]
        if dotted:
            raise SangforCliError(
                "dotted object syntax is not valid sfcli and the command could not be repaired from the model: "
                + ", ".join(dotted)
            )
        if tokens and tokens[0].lower() in {"create", "modify", "delete", "list", "show", "run"}:
            prefixes = command_word_prefixes(model)
            field_names = known_field_names(model)
            for index in range(len(tokens), 0, -1):
                prefix = visible_command_prefix(tokens, index).lower()
                if prefix in prefixes and index < len(tokens) and tokens[index].lower() in field_names:
                    raise SangforCliError(
                        "recognized an AD sfcli command prefix but could not resolve the full command; "
                        "the token after the prefix looks like a field name. "
                        "Select an exact command/path/document with template/search, and include required path arguments before fields: "
                        + visible_command_prefix(tokens, index)
                    )
            raise SangforCliError(
                "sfcli command is not in the local AD CLI model, so it will not be formatted or executed: "
                + visible_command_prefix(tokens, len(tokens))
            )
        if tokens and tokens[0].lower() in {"help", "quit", "history"}:
            return ensure_sfcli_command(join_cli_tokens(tokens), append_semicolon=False), []
        raise SangforCliError(
            "sfcli command is not in the local AD CLI model, so it will not be formatted or executed: "
            + visible_command_prefix(tokens, len(tokens))
        )

    alternatives = possible_field_entries(tokens, prefix_len, model)
    if alternatives and not token_starts_field(entry, tokens[prefix_len] if prefix_len < len(tokens) else ""):
        candidates = [
            {
                "command": item.get("command"),
                "path": item.get("path"),
                "document": item.get("document"),
            }
            for item in alternatives[:5]
        ]
        raise SangforCliError(
            "ambiguous or incomplete sfcli command: a path placeholder appears to consume a field name. "
            "Include the required path argument before fields, or choose an exact command/path/document. Candidates: "
            + json.dumps(candidates, ensure_ascii=False, separators=(",", ":"))
        )

    overrides = load_overrides(overrides_path)
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    fields_by_name = {str(field.get("name") or "").lower(): field for field in fields if isinstance(field, dict)}
    repaired: list[str] = list(tokens[:prefix_len])
    repairs: list[dict[str, Any]] = []
    seen_fields = set(command_placeholder_names(entry))
    index = prefix_len
    while index < len(tokens):
        dotted_tokens, dotted_next, dotted_repairs = repair_dotted_object_field(
            entry, fields_by_name, tokens, index, overrides
        )
        if dotted_tokens is not None:
            root_field = fields_by_name.get(dotted_tokens[0].lower())
            if root_field and str(root_field.get("type") or "") == "object":
                _validated_next, object_error = validate_object_value(root_field, dotted_tokens, 1)
                if object_error:
                    raise SangforCliError(
                        "invalid object field syntax after dotted repair: "
                        + object_error
                    )
            repaired.extend(dotted_tokens)
            repairs.extend(dotted_repairs)
            seen_fields.add(dotted_tokens[0].lower())
            index = dotted_next
            continue

        field_name = tokens[index]
        field = fields_by_name.get(field_name.lower())
        if not field:
            if allowed_command_flag(entry, field_name, index, tokens, overrides):
                repaired.append(field_name.lower())
                index += 1
                continue
            if "." in field_name and dotted_object_token(field_name, set(fields_by_name)):
                raise SangforCliError(
                    "dotted object syntax is not valid sfcli and the object child is not in the model: "
                    + field_name
                )
            if tokens[0].lower() in {"create", "modify", "delete", "list", "show", "run"}:
                raise SangforCliError(
                    "unknown field or unexpected token for matched AD sfcli command "
                    + str(entry.get("command") or "")
                    + ": "
                    + field_name
                    + ". Use search/template to select the exact command and include required path arguments before fields."
                )
            repaired.append(tokens[index])
            index += 1
            continue

        if str(field.get("type") or "") == "object":
            object_tokens, object_next, object_repairs = repair_object_child_tokens(
                entry, field, tokens, index, overrides
            )
            if object_tokens is not None:
                _validated_next, object_error = validate_object_value(field, object_tokens, 1)
                if object_error:
                    raise SangforCliError(
                        "invalid object field syntax after repair: "
                        + object_error
                    )
                repaired.extend(object_tokens)
                repairs.extend(object_repairs)
                seen_fields.add(str(field.get("name") or "").lower())
                index = object_next
                continue
            object_error = object_field_error(field, tokens, index)
            if object_error:
                raise SangforCliError(
                    "invalid object field syntax: "
                    + object_error
                    + ". Use sfcli object braces, for example: "
                    + f"{field.get('name')} {{ <child> <value> }}"
                )

        if str(field.get("type") or "") == "array":
            array_tokens, array_next, array_repairs = repair_array_tokens(
                entry, field, tokens, index, fields_by_name, overrides
            )
            if array_tokens is not None:
                repaired.extend(array_tokens)
                repairs.extend(array_repairs)
                seen_fields.add(str(field.get("name") or "").lower())
                index = array_next
                continue

        if index + 1 >= len(tokens):
            repaired.append(tokens[index])
            index += 1
            continue

        old_value = tokens[index + 1]
        alias_value, alias_note = semantic_alias_rewrite(entry, field, old_value)
        new_value = alias_value if alias_value is not None else canonical_field_value(entry, field, old_value, overrides)
        if new_value is not None:
            repaired.extend([field_name, new_value])
            if alias_note is not None:
                repairs.append(alias_note)
            else:
                repairs.append(
                    {
                        "command": entry.get("command"),
                        "path": entry.get("path"),
                        "document": entry.get("document"),
                        "field": field.get("name"),
                        "from": old_value,
                        "to": new_value,
                        "reason": "cli_enum_or_override",
                    }
                )
        else:
            repaired.extend([field_name, old_value])
        seen_fields.add(str(field.get("name") or field_name).lower())
        index += 2

    missing_required = sorted(required_top_level_fields_for_format(entry) - seen_fields)
    if missing_required:
        raise SangforCliError(
            "missing required field(s) for matched AD sfcli command "
            + str(entry.get("command") or "")
            + ": "
            + ", ".join(missing_required)
            + ". Provide real values for required fields before format/run."
        )

    body = join_cli_tokens(repaired)
    return ensure_sfcli_command(body), repairs


def normalize_commands_detailed(
    commands: list[str],
    append_semicolon: bool = True,
    model: Path = DEFAULT_MODEL,
    overrides_path: Path = DEFAULT_OVERRIDES,
) -> tuple[list[str], list[dict[str, Any]]]:
    lines = []
    repairs: list[dict[str, Any]] = []
    for command in commands:
        for line in str(command).splitlines():
            line = line.strip().lstrip("\ufeff")
            if not line or line.startswith("#"):
                continue
            normalized, line_repairs = canonicalize_command(line, model=model, overrides_path=overrides_path)
            if not append_semicolon:
                normalized = ensure_sfcli_command(to_shell_command(normalized), append_semicolon=False)
            if normalized:
                lines.append(normalized)
                repairs.extend(line_repairs)
    return lines, repairs


def require_non_empty_commands(commands: list[str], source: str) -> None:
    if not commands:
        raise SangforCliError(f"no sfcli commands found in {source}")


def illegal_argument(error_text: str) -> str | None:
    patterns = [
        r"非法参数[\"“]?([^\"”\s]+)",
        r"invalid argument[\"']?([^\"'\s]+)",
        r"illegal argument[\"']?([^\"'\s]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, error_text, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def error_matches_terms(error_text: str, terms: list[str]) -> bool:
    if not terms:
        return False
    lowered = error_text.lower()
    return all(str(term).lower() in lowered for term in terms if str(term))


def force_submit_required(error_text: str) -> bool:
    lowered = error_text.lower()
    return "强制提交" in error_text or "force submit" in lowered or "force commit" in lowered


def append_suffix_to_command(command: str, suffix: list[str]) -> str:
    tokens = command_parts(command)
    suffix_lower = [str(item).lower() for item in suffix]
    if suffix_lower and [token.lower() for token in tokens[-len(suffix_lower):]] == suffix_lower:
        return ensure_sfcli_command(join_cli_tokens(tokens))
    return ensure_sfcli_command(join_cli_tokens([*tokens, *[str(item) for item in suffix]]))


def same_command_text(left: str, right: str) -> bool:
    return [token.lower() for token in command_parts(left)] == [token.lower() for token in command_parts(right)]


def force_suffix_value_candidates(
    commands: list[str],
    error_text: str,
    model: Path,
) -> tuple[list[str], list[dict[str, Any]]]:
    bad_token = illegal_argument(error_text)
    bad_lower = bad_token.lower() if bad_token else ""
    force_value_tokens = {"true", "false", "enable", "disable", "1", "0", "yes", "no"}
    candidates: list[str] = []
    notes: list[dict[str, Any]] = []
    for command in commands:
        tokens = command_parts(command)
        if len(tokens) < 2 or tokens[-2].lower() != "force" or tokens[-1].lower() not in force_value_tokens:
            continue
        if not force_submit_required(error_text) and bad_lower != tokens[-1].lower():
            continue
        entry, prefix_len = find_entry_for_tokens(tokens[:-1], model)
        if not entry or prefix_len < 0:
            continue
        candidate = ensure_sfcli_command(join_cli_tokens(tokens[:-1]))
        if candidate not in candidates:
            candidates.append(candidate)
            notes.append(
                {
                    "command": entry.get("command"),
                    "path": entry.get("path"),
                    "document": entry.get("document"),
                    "from": " ".join(tokens[-2:]),
                    "to": "force",
                    "reason": "force_is_bare_command_suffix",
                }
            )
    return candidates, notes


def command_suffix_candidates(
    commands: list[str],
    error_text: str,
    model: Path,
    overrides_path: Path,
) -> tuple[list[str], list[dict[str, Any]]]:
    if not error_text:
        return [], []
    overrides = load_overrides(overrides_path)
    candidates: list[str] = []
    notes: list[dict[str, Any]] = []
    for command in commands:
        tokens = command_parts(command)
        entry, prefix_len = find_entry_for_tokens(tokens, model)
        if not entry or prefix_len < 0:
            continue
        for rule in command_suffix_rules_for_entry(entry, overrides, include_builtin=True):
            append = [str(item) for item in rule.get("append") or [] if str(item)]
            if not append:
                continue
            terms = [str(item) for item in rule.get("when_error_contains") or [] if str(item)]
            if terms:
                matched = error_matches_terms(error_text, terms)
            else:
                matched = False
            if not matched and append == ["force"] and force_submit_required(error_text):
                matched = True
            if not matched:
                continue
            candidate = append_suffix_to_command(command, append)
            if same_command_text(candidate, command):
                continue
            if candidate not in candidates:
                candidates.append(candidate)
                notes.append(
                    {
                        "command": entry.get("command"),
                        "path": entry.get("path"),
                        "document": entry.get("document"),
                        "append": append,
                        "reason": "server_error_requires_command_suffix",
                        "source": rule.get("source") or "override",
                    }
                )
    return candidates, notes


def repair_candidates_for_commands(
    commands: list[str],
    error_text: str = "",
    model: Path = DEFAULT_MODEL,
    overrides_path: Path = DEFAULT_OVERRIDES,
) -> tuple[list[str], list[dict[str, Any]]]:
    force_value_candidates, force_value_notes = force_suffix_value_candidates(commands, error_text, model)
    if force_value_candidates:
        return force_value_candidates, force_value_notes
    suffix_candidates, suffix_notes = command_suffix_candidates(commands, error_text, model, overrides_path)
    if suffix_candidates:
        return suffix_candidates, suffix_notes
    try:
        candidates, repairs = normalize_commands_detailed(commands, model=model, overrides_path=overrides_path)
        if candidates != commands and repairs:
            return candidates, repairs
    except Exception:
        pass
    bad_token = illegal_argument(error_text)
    if not bad_token:
        return [], []
    lowered = bad_token.lower()
    if lowered == bad_token:
        return [], []
    fixed = []
    token_repairs = []
    for command in commands:
        tokens = command_parts(command)
        changed = False
        for index, token in enumerate(tokens):
            if token == bad_token:
                tokens[index] = lowered
                changed = True
        if changed:
            fixed_command = ensure_sfcli_command(join_cli_tokens(tokens))
            fixed.append(fixed_command)
            token_repairs.append({"from": bad_token, "to": lowered, "reason": "illegal_argument_case"})
        else:
            fixed.append(command)
    return fixed, token_repairs


def learn_from_commands(
    bad_command: str,
    good_command: str,
    source: str = "manual",
    model: Path = DEFAULT_MODEL,
    overrides_path: Path = DEFAULT_OVERRIDES,
    path: str | None = None,
    document: str | None = None,
    error_text: str = "",
) -> dict[str, Any]:
    bad_tokens = command_parts(bad_command)
    good_tokens = command_parts(good_command)
    matches, prefix_len = find_entries_for_tokens(bad_tokens, model, path=path, document=document)
    if not matches or prefix_len < 0:
        raise SangforCliError("learn could not match the command in the local model")
    distinct = {(str(item.get("path") or ""), str(item.get("document") or "")) for item in matches}
    if len(distinct) > 1 and (not path or not document):
        candidates = [
            {"command": item.get("command"), "path": item.get("path"), "document": item.get("document")}
            for item in matches[:20]
        ]
        raise SangforCliError(
            "learn command is ambiguous; rerun with --path and --document. candidates="
            + json.dumps(candidates, ensure_ascii=False, separators=(",", ":"))
        )
    entry = matches[0]
    if len(good_tokens) != len(bad_tokens):
        if len(good_tokens) <= len(bad_tokens) or good_tokens[: len(bad_tokens)] != bad_tokens:
            raise SangforCliError(
                "learn supports value rewrites with the same token count, or command suffix learning where good starts with bad"
            )
        suffix = good_tokens[len(bad_tokens):]
        if [str(part).lower() for part in suffix] != ["force"]:
            raise SangforCliError("command suffix learning currently only accepts the bare force suffix")
        if not force_submit_required(error_text):
            raise SangforCliError("command suffix learning requires --error text that contains a force-submit prompt")
        data = load_overrides(overrides_path)
        suffix_rules = data.setdefault("command_suffix_rewrites", [])
        trigger_terms = ["强制提交"]
        item = {
            "command": entry.get("command"),
            "path": entry.get("path"),
            "document": entry.get("document"),
            "append": suffix,
            "when_error_contains": trigger_terms,
            "source": source,
        }
        duplicate = any(
            isinstance(existing, dict)
            and str(existing.get("command") or "") == str(item["command"])
            and str(existing.get("path") or "") == str(item["path"])
            and str(existing.get("document") or "") == str(item["document"])
            and [str(part).lower() for part in existing.get("append") or []] == [str(part).lower() for part in suffix]
            and [str(part).lower() for part in existing.get("when_error_contains") or []]
            == [str(part).lower() for part in trigger_terms]
            for existing in suffix_rules
        )
        if not duplicate:
            suffix_rules.append(item)
            save_overrides(data, overrides_path)
        return {
            "ok": True,
            "learned_count": 1,
            "learned": [item],
            "overrides": str(overrides_path),
            "message": "learned command suffix rewrite",
        }
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    field_names = {str(field.get("name") or "").lower() for field in fields if isinstance(field, dict)}
    data = load_overrides(overrides_path)
    rewrites = data.setdefault("value_rewrites", [])
    learned = []
    for index in range(prefix_len, len(bad_tokens)):
        if bad_tokens[index] == good_tokens[index]:
            continue
        field_name = bad_tokens[index - 1] if index > prefix_len else ""
        if field_name.lower() not in field_names:
            continue
        item = {
            "command": entry.get("command"),
            "path": entry.get("path"),
            "document": entry.get("document"),
            "field": field_name,
            "from": bad_tokens[index],
            "to": good_tokens[index],
            "source": source,
        }
        duplicate = any(
            isinstance(existing, dict)
            and str(existing.get("command") or "") == str(item["command"])
            and str(existing.get("path") or "") == str(item["path"])
            and str(existing.get("document") or "") == str(item["document"])
            and str(existing.get("field") or "") == str(item["field"])
            and str(existing.get("from") or "").lower() == str(item["from"]).lower()
            for existing in rewrites
        )
        if not duplicate:
            rewrites.append(item)
        learned.append(item)
    if learned:
        save_overrides(data, overrides_path)
        return {"ok": True, "learned_count": len(learned), "learned": learned, "overrides": str(overrides_path)}
    return {
        "ok": False,
        "learned_count": 0,
        "learned": [],
        "overrides": str(overrides_path),
        "warning": "no field/value correction was learned; only simple field value differences can be recorded",
    }


def probe_ad_environment(timeout: int = 5) -> dict[str, Any]:
    try:
        completed = subprocess.run(
            "cat /app/appversion && command -v sfcli",
            shell=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
        )
    except Exception as exc:
        return {"ok": False, "is_ad": False, "error": str(exc), "command": "cat /app/appversion && command -v sfcli"}

    stdout = completed.stdout.strip()
    stderr = completed.stderr.strip()
    return {
        "ok": completed.returncode == 0,
        "is_ad": completed.returncode == 0 and bool(stdout),
        "command": "cat /app/appversion && command -v sfcli",
        "exit_code": completed.returncode,
        "stdout": stdout,
        "stderr": stderr,
    }


def run_local_commands(commands: list[str], timeout: int) -> dict[str, Any]:
    command_text = "\n".join(commands)
    try:
        completed = subprocess.run(
            command_text,
            shell=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        return {
            "ok": False,
            "exit_code": None,
            "stdout": subprocess_timeout_text(exc.stdout),
            "stderr": subprocess_timeout_text(exc.stderr),
            "error": f"sfcli command timed out after {timeout}s",
            "timed_out": True,
        }
    return {
        "ok": completed.returncode == 0,
        "exit_code": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
    }


def subprocess_timeout_text(value: str | bytes | None) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)


def run_local_batch_file(commands: list[str], timeout: int) -> dict[str, Any]:
    batch_text = to_sfcli_batch_file_text(commands)
    tmp_name = ""
    try:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            prefix="sangfor-cli-batch-",
            suffix=".sfcli",
            dir="/tmp",
            delete=False,
        ) as handle:
            handle.write(batch_text)
            tmp_name = handle.name
        try:
            completed = subprocess.run(
                ["sfcli", "-f", tmp_name],
                text=True,
                encoding="utf-8",
                errors="replace",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired as exc:
            return {
                "ok": False,
                "exit_code": None,
                "stdout": subprocess_timeout_text(exc.stdout),
                "stderr": subprocess_timeout_text(exc.stderr),
                "error": f"sfcli -f timed out after {timeout}s",
                "timed_out": True,
                "batch_file": tmp_name,
                "batch_file_text": batch_text,
            }
        return {
            "ok": completed.returncode == 0,
            "exit_code": completed.returncode,
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "batch_file": tmp_name,
            "batch_file_text": batch_text,
        }
    finally:
        if tmp_name:
            try:
                Path(tmp_name).unlink(missing_ok=True)
            except Exception:
                pass


def command_run(
    commands: list[str],
    probe_timeout: int,
    timeout: int,
    auto_repair: bool = False,
    confirm_auto_repair: bool = False,
    use_batch_file: bool = False,
) -> dict[str, Any]:
    shell_safe_commands = to_shell_safe_commands(commands)
    shell_safe_text = "\n".join(shell_safe_commands) + ("\n" if shell_safe_commands else "")
    sfcli_text = "\n".join(commands) + ("\n" if commands else "")
    use_sfcli_f = use_batch_file or len(commands) > 1
    batch_file_text = to_sfcli_batch_file_text(commands) if use_sfcli_f else ""
    batch_remote_text = sfcli_batch_remote_text(commands) if use_sfcli_f else ""
    probe = probe_ad_environment(probe_timeout)
    if not probe.get("is_ad"):
        execution_text = batch_remote_text if use_sfcli_f else shell_safe_text
        execution_commands = [batch_remote_text.strip()] if use_sfcli_f and batch_remote_text.strip() else shell_safe_commands
        return {
            "ok": True,
            "executed": False,
            "need_remote": True,
            "reason": "current_environment_is_not_ad_device",
            "probe": probe,
            "remote_commands": execution_commands,
            "remote_text": execution_text,
            "shell_commands": execution_commands,
            "shell_text": execution_text,
            "sfcli_commands": commands,
            "sfcli_text": sfcli_text,
            "uses_sfcli_file": use_sfcli_f,
            "batch_file_text": batch_file_text if use_sfcli_f else None,
            "batch_remote_text": batch_remote_text if use_sfcli_f else None,
        }

    result = run_local_batch_file(commands, timeout) if use_sfcli_f else run_local_commands(shell_safe_commands, timeout)
    response = {
        "ok": result.get("ok"),
        "executed": True,
        "need_remote": False,
        "probe": probe,
        "commands": shell_safe_commands,
        "shell_commands": shell_safe_commands,
        "shell_text": shell_safe_text,
        "sfcli_commands": commands,
        "uses_sfcli_file": use_sfcli_f,
        "batch_file_text_preview": (batch_file_text or "")[-4000:] if use_sfcli_f else None,
        "exit_code": result.get("exit_code"),
        "stdout_preview": (result.get("stdout") or "")[-4000:],
        "stderr_preview": (result.get("stderr") or "")[-4000:],
    }
    if result.get("error"):
        response["error"] = result.get("error")
    if result.get("timed_out"):
        response["timed_out"] = True
    if use_sfcli_f and result.get("batch_file_text"):
        response["batch_file_text_preview"] = (result.get("batch_file_text") or "")[-4000:]
    if result.get("ok"):
        return response

    error_text = "\n".join(
        [str(result.get("stdout") or ""), str(result.get("stderr") or ""), str(result.get("error") or "")]
    )
    repair_candidates, repair_notes = repair_candidates_for_commands(commands, error_text)
    if repair_candidates:
        response["repair_candidates"] = repair_candidates
        response["repair_notes"] = repair_notes
        response["repair_message"] = (
            "A likely CLI repair was found. Review the repaired command before execution. "
            "Use --auto-repair --confirm-auto-repair only after the operator approves the repaired candidate."
        )
    if auto_repair and repair_candidates and not confirm_auto_repair:
        response["requires_auto_repair_confirmation"] = True
        response["auto_repair_review_text"] = "\n".join(to_shell_safe_commands(repair_candidates)) + "\n"
        return response
    if auto_repair and confirm_auto_repair and repair_candidates:
        repaired_shell_safe_commands = to_shell_safe_commands(repair_candidates)
        retry = run_local_batch_file(repair_candidates, timeout) if use_sfcli_f else run_local_commands(repaired_shell_safe_commands, timeout)
        response["auto_repair_attempted"] = True
        response["auto_repair_commands"] = repaired_shell_safe_commands
        response["auto_repair_uses_sfcli_file"] = use_sfcli_f
        if use_sfcli_f:
            response["auto_repair_batch_file_text_preview"] = (retry.get("batch_file_text") or "")[-4000:]
        response["auto_repair_exit_code"] = retry.get("exit_code")
        response["auto_repair_stdout_preview"] = (retry.get("stdout") or "")[-4000:]
        response["auto_repair_stderr_preview"] = (retry.get("stderr") or "")[-4000:]
        if retry.get("error"):
            response["auto_repair_error"] = retry.get("error")
        if retry.get("timed_out"):
            response["auto_repair_timed_out"] = True
        if retry.get("ok"):
            for bad, good in zip(commands, repair_candidates):
                if bad != good:
                    try:
                        learned = learn_from_commands(bad, good, source="auto-repair", error_text=error_text)
                    except Exception as exc:
                        learned = {"ok": False, "warning": str(exc)}
                    if not learned.get("ok"):
                        response.setdefault("learn_warnings", []).append(learned)
            response["ok"] = True
            response["auto_repaired"] = True
    return response


def confirmation_required(commands: list[str]) -> dict[str, Any]:
    shell_safe_commands = to_shell_safe_commands(commands)
    sfcli_text = "\n".join(commands) + ("\n" if commands else "")
    shell_safe_text = "\n".join(shell_safe_commands) + ("\n" if shell_safe_commands else "")
    return {
        "ok": True,
        "executed": False,
        "requires_human_confirmation": True,
        "message": "Review the final sfcli command with a human operator, then rerun with --confirm-reviewed.",
        "sfcli_commands": commands,
        "sfcli_text": sfcli_text,
        "review_commands": shell_safe_commands,
        "review_text": shell_safe_text,
        "shell_commands": shell_safe_commands,
        "shell_text": shell_safe_text,
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sangfor AD sfcli command helper.")
    sub = parser.add_subparsers(dest="command_name", required=True)

    search = sub.add_parser("search", help="Search the local CLI command model.")
    search.add_argument("query")
    search.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    search.add_argument("--limit", type=int, default=10)

    template = sub.add_parser("template", help="Render a command skeleton from the local CLI command model.")
    template.add_argument("query", nargs="?", default="")
    template.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    template.add_argument("--all-fields", action="store_true")
    template.add_argument("--command", help="Exact command from a search result, for example: run debug sys maintenance-passwd.")
    template.add_argument("--path", help="Optional exact model path to disambiguate duplicate commands.")
    template.add_argument("--document", help="Optional exact model document from a search result, for example: slb/virtual-service/http.js.")

    help_cmd = sub.add_parser("help", help="Render an sfcli help command.")
    help_cmd.add_argument("topic", nargs="*", help="Help topic, for example: slb virtual-service.")

    format_cmd = sub.add_parser("format", help="Normalize one product CLI command to the sfcli-prefixed form.")
    format_cmd.add_argument("sfcli_command", nargs=argparse.REMAINDER)
    format_cmd.add_argument("--no-semicolon", action="store_true")
    format_cmd.add_argument("--model", type=Path, default=DEFAULT_MODEL)

    run_cmd = sub.add_parser("run", help="Execute locally on an AD device, or return commands for SSH skill/MCP execution.")
    run_cmd.add_argument("sfcli_command", nargs=argparse.REMAINDER)
    run_cmd.add_argument("--file", type=Path, help="Optional local sfcli batch file to execute.")
    run_cmd.add_argument("--no-semicolon", action="store_true")
    run_cmd.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    run_cmd.add_argument("--probe-timeout", type=int, default=5, help="Seconds for `cat /app/appversion` probe.")
    run_cmd.add_argument("--timeout", type=int, default=60, help="Seconds for local command execution.")
    run_cmd.add_argument("--auto-repair", action="store_true", help="Retry one likely repaired command after a failed local AD execution.")
    run_cmd.add_argument(
        "--confirm-auto-repair",
        action="store_true",
        help="Required with --auto-repair before a repaired candidate is retried after failure.",
    )
    run_cmd.add_argument(
        "--confirm-reviewed",
        action="store_true",
        help="Required after human review before executing locally or returning SSH/MCP remote_text.",
    )

    batch = sub.add_parser("batch", help="Normalize a local sfcli batch file for remote execution by another SSH tool.")
    batch.add_argument("--file", required=True, type=Path)
    batch.add_argument("--out", type=Path, help="Optional output file for normalized commands.")
    batch.add_argument("--no-semicolon", action="store_true")
    batch.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    batch.add_argument(
        "--confirm-reviewed",
        action="store_true",
        help="Include remote_text only after human review. Prefer run --file --confirm-reviewed for execution.",
    )

    repair = sub.add_parser("repair", help="Suggest a repaired command after an sfcli syntax error.")
    repair.add_argument("--failed-command", required=True)
    repair.add_argument("--error", default="")
    repair.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    repair.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES, help=argparse.SUPPRESS)

    learn = sub.add_parser("learn", help="Record a confirmed bad->good command correction in local overrides.")
    learn.add_argument("--bad", required=True)
    learn.add_argument("--good", required=True)
    learn.add_argument("--source", default="manual")
    learn.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    learn.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES, help=argparse.SUPPRESS)
    learn.add_argument("--path", help="Exact model path when the visible command is ambiguous.")
    learn.add_argument("--document", help="Exact model document when the visible command is ambiguous.")
    learn.add_argument("--error", default="", help="Optional server error text that triggered the confirmed correction.")

    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        if args.command_name == "search":
            print(short_summary(**command_search(args.query, args.limit, args.model)), end="")
            return 0
        if args.command_name == "template":
            if not args.query and not args.command:
                raise SangforCliError("template requires a query or --command")
            result = command_template(args.query, args.model, args.all_fields, args.command, args.path, args.document)
            print(short_summary(**result), end="")
            return 0 if result.get("ok") else 1

        if args.command_name == "help":
            topic = " ".join(args.topic).strip()
            commands = normalize_commands([f"help {topic}".strip()], append_semicolon=False)
            print(short_summary(ok=True, commands=commands, text="\n".join(commands) + ("\n" if commands else "")), end="")
            return 0
        if args.command_name == "format":
            raw = render_remainder(args.sfcli_command)
            if not raw:
                raise SangforCliError("sfcli command is required")
            commands, repairs = normalize_commands_detailed([raw], append_semicolon=not args.no_semicolon, model=args.model)
            shell_safe_commands = to_shell_safe_commands(commands)
            shell_text = "\n".join(shell_safe_commands) + ("\n" if shell_safe_commands else "")
            print(
                short_summary(
                    ok=True,
                    commands=commands,
                    text="\n".join(commands) + ("\n" if commands else ""),
                    shell_commands=shell_safe_commands,
                    shell_text=shell_text,
                    repairs=repairs,
                ),
                end="",
            )
            return 0
        if args.command_name == "batch":
            commands, repairs = normalize_commands_detailed(
                args.file.read_text(encoding="utf-8").splitlines(),
                append_semicolon=not args.no_semicolon,
                model=args.model,
            )
            require_non_empty_commands(commands, str(args.file))
            text = "\n".join(commands) + ("\n" if commands else "")
            shell_safe_commands = to_shell_safe_commands(commands)
            shell_safe_text = "\n".join(shell_safe_commands) + ("\n" if shell_safe_commands else "")
            if args.out:
                args.out.parent.mkdir(parents=True, exist_ok=True)
                args.out.write_text(text, encoding="utf-8")
            batch_remote_text = sfcli_batch_remote_text(commands)
            result = {
                "ok": True,
                "commands": commands,
                "text": text,
                "shell_commands": shell_safe_commands,
                "shell_text": shell_safe_text,
                "batch_file_text": to_sfcli_batch_file_text(commands),
                "out_format": "normalized sfcli commands for review; run --file converts them to sfcli -f input",
                "repairs": repairs,
                "out": str(args.out) if args.out else None,
            }
            if args.confirm_reviewed:
                result["remote_commands"] = [batch_remote_text.strip()]
                result["remote_text"] = batch_remote_text
                result["shell_commands"] = [batch_remote_text.strip()]
                result["shell_text"] = batch_remote_text
                result["uses_sfcli_file"] = True
            else:
                result["requires_human_confirmation"] = True
                result["message"] = "Batch normalized. Review with a human operator before using remote_text; rerun batch with --confirm-reviewed or use run --file --confirm-reviewed."
            print(short_summary(**result), end="")
            return 0
        if args.command_name == "run":
            if args.file and args.sfcli_command:
                raise SangforCliError("use either --file or a command, not both")
            if args.file:
                raw_commands = args.file.read_text(encoding="utf-8").splitlines()
            else:
                raw = render_remainder(args.sfcli_command)
                if not raw:
                    raise SangforCliError("sfcli command or --file is required")
                raw_commands = [raw]
            commands, repairs = normalize_commands_detailed(raw_commands, append_semicolon=not args.no_semicolon, model=args.model)
            require_non_empty_commands(commands, str(args.file) if args.file else "command input")
            if not args.confirm_reviewed:
                result = confirmation_required(commands)
                result["repairs"] = repairs
                print(short_summary(**result), end="")
                return 0
            result = command_run(
                commands,
                args.probe_timeout,
                args.timeout,
                auto_repair=args.auto_repair,
                confirm_auto_repair=args.confirm_auto_repair,
                use_batch_file=bool(args.file),
            )
            result["repairs"] = repairs
            print(short_summary(**result), end="")
            return 0 if result.get("ok") else 1
        if args.command_name == "repair":
            commands, repairs = repair_candidates_for_commands(
                [args.failed_command],
                args.error,
                model=args.model,
                overrides_path=args.overrides,
            )
            print(
                short_summary(
                    ok=bool(commands),
                    failed_command=args.failed_command,
                    error=args.error,
                    candidates=commands,
                    repairs=repairs,
                    message=(
                    "Review and execute a candidate. If it succeeds, run `learn --bad ... --good ...` "
                    "so future normalization or repair workflows can reuse the correction."
                    )
                    if commands
                    else "no repair candidate found",
                ),
                end="",
            )
            return 0 if commands else 1
        if args.command_name == "learn":
            result = learn_from_commands(
                args.bad,
                args.good,
                source=args.source,
                model=args.model,
                overrides_path=args.overrides,
                path=args.path,
                document=args.document,
                error_text=args.error,
            )
            print(short_summary(**result), end="")
            return 0 if result.get("ok") else 1
        raise SangforCliError(f"unsupported command: {args.command_name}")
    except Exception as exc:
        print(short_summary(ok=False, error=str(exc)), end="", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
