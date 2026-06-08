#!/usr/bin/env python3
"""Release self-test for the Sangfor AD sfcli helper.

This test suite never executes sfcli. It validates command normalization,
repair, and rejection behavior against the generated local CLI model.
"""

from __future__ import annotations

import argparse
import contextlib
import importlib.util
import io
import json
import re
import sys
import tempfile
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_ROOT = SCRIPT_DIR.parent
DEFAULT_MODEL = SKILL_ROOT / "references" / "cli_model.jsonl"
SANGFOR_CLI = SCRIPT_DIR / "sangfor_cli.py"


def load_sangfor_cli() -> Any:
    spec = importlib.util.spec_from_file_location("sangfor_cli_under_test", SANGFOR_CLI)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load {SANGFOR_CLI}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_entries(model: Path) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for line in model.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            entries.append(json.loads(line))
    return entries


def command_tokens(entry: dict[str, Any]) -> list[str]:
    tokens = ["sfcli"]
    for token in str(entry.get("command") or "").split():
        if token.startswith("[") and token.endswith("]"):
            name = token.strip("[]").replace("-", "_")
            tokens.append(f"sample_{name}")
        else:
            tokens.append(token)
    return tokens


def cli_value(field: dict[str, Any], uppercase: bool = False) -> str:
    value: Any
    if isinstance(field.get("cli_enum"), list) and field["cli_enum"]:
        value = field["cli_enum"][0]
    elif isinstance(field.get("enum"), list) and field["enum"]:
        value = field["enum"][0]
    elif field.get("cli_example") not in (None, ""):
        value = field.get("cli_example")
    elif field.get("example") not in (None, ""):
        value = field.get("example")
    elif field.get("default") not in (None, ""):
        value = field.get("default")
    elif field.get("type") == "integer":
        value = 1
    elif field.get("type") == "number":
        value = 1
    elif field.get("type") == "boolean":
        value = "true"
    else:
        value = "sample_value"
    text = str(value)
    # Keep generated examples shell-token friendly; we are testing parser shape,
    # not product-side semantic validation.
    if not text or re.search(r"\s", text) or text in {"{", "}", "[", "]", "|", "..."}:
        text = "sample_value"
    return text.upper() if uppercase else text


def first_leaf_path(field: dict[str, Any]) -> list[dict[str, Any]]:
    field_type = str(field.get("type") or "")
    if field_type == "object":
        for child in field.get("properties") or []:
            if isinstance(child, dict) and child.get("name"):
                leaf = first_leaf_path(child)
                if leaf:
                    return [child, *leaf]
        return []
    if field_type == "array":
        item = field.get("items") if isinstance(field.get("items"), dict) else {}
        if item.get("type") == "object":
            for child in item.get("properties") or []:
                if isinstance(child, dict) and child.get("name"):
                    leaf = first_leaf_path(child)
                    if leaf:
                        return [field, child, *leaf]
        return [field]
    return [field]


def render_leaf(path: list[dict[str, Any]], uppercase: bool = False) -> list[str]:
    field = path[0]
    name = str(field.get("name") or "value")
    field_type = str(field.get("type") or "")
    if field_type == "object":
        return [name, "{", *render_leaf(path[1:], uppercase=uppercase), "}"]
    if field_type == "array":
        item = field.get("items") if isinstance(field.get("items"), dict) else {}
        if item.get("type") == "object":
            return [name, "add", "{", *render_leaf(path[1:], uppercase=uppercase), "}"]
        return [name, "add", cli_value(item or field, uppercase=uppercase)]
    return [name, cli_value(field, uppercase=uppercase)]


def render_minimal_field(field: dict[str, Any], uppercase: bool = False) -> list[str]:
    name = str(field.get("name") or "value")
    field_type = str(field.get("type") or "")
    if field_type == "object":
        children = [child for child in field.get("properties") or [] if isinstance(child, dict) and child.get("name")]
        selected = [child for child in children if child.get("required")]
        if not selected and children:
            selected = [children[0]]
        inner: list[str] = []
        for child in selected:
            inner.extend(render_minimal_field(child, uppercase=uppercase))
        return [name, "{", *inner, "}"]
    if field_type == "array":
        item = field.get("items") if isinstance(field.get("items"), dict) else {}
        if item.get("type") == "object":
            inner = render_minimal_field(item, uppercase=uppercase)
            if inner and inner[0] == str(item.get("name") or "item"):
                inner = inner[1:]
            return [name, "add", *inner]
        return [name, "add", cli_value(item or field, uppercase=uppercase)]
    return [name, cli_value(field, uppercase=uppercase)]


def first_named_field(entry: dict[str, Any], field_type: str | None = None) -> dict[str, Any] | None:
    for field in entry.get("fields") or []:
        if not isinstance(field, dict) or not field.get("name"):
            continue
        if field_type and str(field.get("type") or "") != field_type:
            continue
        return field
    return None


def required_top_level_names(entry: dict[str, Any]) -> set[str]:
    action = str(entry.get("action") or "")
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    if action == "create":
        return {
            str(field.get("name") or "")
            for field in fields
            if isinstance(field, dict) and field.get("required") and field.get("name")
        }
    if action == "modify":
        return {
            str(field.get("name") or "")
            for field in fields
            if isinstance(field, dict) and field.get("required") and str(field.get("name") or "") == "name"
        }
    return set()


def make_field_command(entry: dict[str, Any], field: dict[str, Any], uppercase: bool = False) -> str:
    fields = entry.get("fields") if isinstance(entry.get("fields"), list) else []
    fields_by_name = {
        str(item.get("name") or ""): item
        for item in fields
        if isinstance(item, dict) and item.get("name")
    }
    placeholder_names = {
        token.strip("[]")
        for token in str(entry.get("command") or "").split()
        if token.startswith("[") and token.endswith("]")
    }
    payload: list[str] = []
    for name in sorted(required_top_level_names(entry) - placeholder_names - {str(field.get("name") or "")}):
        required_field = fields_by_name.get(name)
        if required_field:
            payload.extend(render_minimal_field(required_field, uppercase=False))
    payload.extend(render_minimal_field(field, uppercase=uppercase))
    return " ".join([*command_tokens(entry), *payload])


def run_main(module: Any, argv: list[str]) -> tuple[int, dict[str, Any]]:
    stdout = io.StringIO()
    stderr = io.StringIO()
    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        code = module.main(argv)
    text = stdout.getvalue() or stderr.getvalue()
    try:
        data = json.loads(text)
    except Exception:
        data = {"raw": text}
    return code, data


class Harness:
    def __init__(self, module: Any, model: Path, quick: bool = False) -> None:
        self.module = module
        self.model = model
        self.quick = quick
        self.count = 0
        self.failures: list[dict[str, Any]] = []

    def check(self, name: str, fn: Any) -> None:
        self.count += 1
        try:
            fn()
        except Exception as exc:  # noqa: BLE001 - test harness records exact failure.
            self.failures.append({"name": name, "error": str(exc)})

    def expect_format_ok(self, name: str, command: str, repair_expected: bool | None = None) -> None:
        def run() -> None:
            normalized, repairs = self.module.canonicalize_command(command, model=self.model)
            if not normalized.startswith("sfcli "):
                raise AssertionError(f"missing sfcli prefix: {normalized}")
            if repair_expected is True and not repairs:
                raise AssertionError("expected repair notes")
            if repair_expected is False and repairs:
                raise AssertionError(f"unexpected repairs: {repairs}")

        self.check(name, run)

    def expect_format_error(self, name: str, command: str, contains: str) -> None:
        def run() -> None:
            try:
                self.module.canonicalize_command(command, model=self.model)
            except Exception as exc:  # noqa: BLE001
                if contains.lower() not in str(exc).lower():
                    raise AssertionError(f"expected {contains!r}, got {exc}") from exc
                return
            raise AssertionError("command unexpectedly succeeded")

        self.check(name, run)

    def expect_format_rejected(self, name: str, command: str) -> None:
        def run() -> None:
            try:
                self.module.canonicalize_command(command, model=self.model)
            except Exception:
                return
            raise AssertionError("command unexpectedly succeeded")

        self.check(name, run)


def run_selftest(model: Path, quick: bool = False) -> dict[str, Any]:
    module = load_sangfor_cli()
    entries = load_entries(model)
    harness = Harness(module, model, quick)

    # Fixed regressions from real usage.
    harness.expect_format_ok(
        "valid object brace syntax without repair",
        "sfcli modify sys passwd-policy login_protect { state enable }",
        repair_expected=False,
    )
    harness.expect_format_ok(
        "object child enum repair",
        "sfcli modify sys passwd-policy login_protect { state ENABLE }",
        repair_expected=True,
    )
    harness.expect_format_error(
        "missing object closing brace rejected",
        "sfcli modify sys passwd-policy login_protect { state enable",
        "missing closing brace",
    )
    harness.expect_format_error(
        "unknown object child rejected",
        "sfcli modify sys passwd-policy login_protect { __unknown_child__ enable }",
        "unknown child",
    )
    harness.expect_format_error(
        "unresolved path placeholder rejected",
        "sfcli modify ha application-group [name] member { member_structure member-sequence }",
        "unresolved template placeholder",
    )
    harness.expect_format_ok(
        "path placeholder replaced with real value",
        "sfcli modify ha application-group sample_app member { member_structure member-sequence }",
        repair_expected=False,
    )
    harness.expect_format_ok(
        "dotted object syntax repaired",
        "sfcli modify net snat name snat1 snat_process.translated_address.type IP-ADDRESS",
        repair_expected=True,
    )
    harness.expect_format_ok(
        "object array item enum repair",
        "sfcli create slb ssl-client sample_name signature_algorithms { signature_algorithms_list add SHA256RSA }",
        repair_expected=True,
    )
    harness.expect_format_ok(
        "array example enum repair",
        "sfcli modify dns config-synchronization module DNS-TOPOLOGY",
        repair_expected=True,
    )
    harness.expect_format_ok(
        "scalar array bracket syntax without repair",
        "sfcli create rc custom-address-group name web_whitelist addresses [ 10.0.0.0/8 ]",
        repair_expected=False,
    )
    harness.expect_format_ok(
        "scalar array bracket enum repair",
        "sfcli modify dns config-synchronization module [ DNS-TOPOLOGY ]",
        repair_expected=True,
    )
    harness.expect_format_error(
        "scalar array missing closing bracket rejected",
        "sfcli create rc custom-address-group name web_whitelist addresses [ 10.0.0.0/8",
        "missing closing bracket",
    )
    harness.expect_format_ok(
        "array object outer template bracket repair",
        "sfcli modify slb pool pool1 nodes add [ { name node1 address 192.168.1.101 state ENABLE } ]",
        repair_expected=True,
    )
    harness.expect_format_error(
        "dotted object missing required child rejected",
        "sfcli modify ha active-standby ha.interface.type VLAN",
        "missing required child",
    )
    harness.expect_format_error(
        "unknown command not passed through",
        "sfcli list sys management; echo PWNED",
        "not in the local AD CLI model",
    )
    harness.expect_format_error(
        "unknown non model command rejected",
        "sfcli bogus command text",
        "not in the local AD CLI model",
    )
    harness.expect_format_ok(
        "semantic alias first request to connection",
        "sfcli modify slb virtual-service VS_0 http_sched_mode 首个请求",
        repair_expected=True,
    )
    harness.expect_format_ok(
        "semantic alias every request to request",
        "sfcli modify slb virtual-service VS_0 http_sched_mode 每个请求",
        repair_expected=True,
    )
    harness.expect_format_ok(
        "existing http sched mode enum still normalizes",
        "sfcli modify slb virtual-service VS_0 http_sched_mode REQUEST",
        repair_expected=True,
    )
    harness.expect_format_ok(
        "existing http sched mode cli value has no repair",
        "sfcli modify slb virtual-service VS_0 http_sched_mode connection",
        repair_expected=False,
    )

    def semantic_alias_output() -> None:
        normalized, repairs = module.canonicalize_command(
            "sfcli modify slb virtual-service VS_0 http_sched_mode 首个请求",
            model=model,
        )
        if "http_sched_mode connection" not in normalized:
            raise AssertionError(normalized)
        if not any(note.get("reason") == "semantic_alias" for note in repairs if isinstance(note, dict)):
            raise AssertionError(repairs)

    harness.check("semantic alias repair note", semantic_alias_output)

    def semantic_alias_visible_in_template() -> None:
        code, data = run_main(
            module,
            [
                "template",
                "--command",
                "modify slb virtual-service [name]",
                "--path",
                "slb/virtual-service/{name}",
                "--document",
                "slb/virtual-service/http.js",
                "--all-fields",
            ],
        )
        notes = data.get("semantic_notes") or []
        if code != 0 or not any("http_sched_mode" in note and "首个请求" in note for note in notes):
            raise AssertionError(data)

    harness.check("semantic alias visible in template", semantic_alias_visible_in_template)

    def semantic_alias_visible_in_search() -> None:
        code, data = run_main(module, ["search", "修改 HTTP虚拟服务 http_sched_mode"])
        matches = data.get("matches") or []
        found = False
        for match in matches:
            for field in match.get("fields") or []:
                if field.get("name") == "http_sched_mode" and "semantic_aliases" in field:
                    found = True
        if code != 0 or not found:
            raise AssertionError(data)

    harness.check("semantic alias visible in search", semantic_alias_visible_in_search)

    def semantic_alias_search_does_not_prefer_debug() -> None:
        code, data = run_main(module, ["search", "首个请求"])
        matches = data.get("matches") or []
        top = matches[0] if matches else {}
        if code != 0 or not str(top.get("path") or "").startswith("slb/virtual-service"):
            raise AssertionError(data)

    harness.check("semantic alias search does not prefer debug", semantic_alias_search_does_not_prefer_debug)

    def virtual_service_profile_search_prefers_config() -> None:
        code, data = run_main(module, ["search", "修改 虚拟服务 优化策略"])
        matches = data.get("matches") or []
        top = matches[0] if matches else {}
        if (
            code != 0
            or top.get("action") != "modify"
            or not str(top.get("path") or "").startswith("slb/virtual-service")
        ):
            raise AssertionError(data)

    harness.check("virtual service optimize search prefers config", virtual_service_profile_search_prefers_config)

    def run_file_uses_sfcli_f_remote_text() -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            batch_file = Path(temp_dir) / "commands.sfcli"
            batch_file.write_text(
                "\n".join(
                    [
                        "sfcli modify slb virtual-service VS_1 tcp_profile test",
                        "sfcli modify slb virtual-service VS_2 http_sched_mode 首个请求",
                    ]
                )
                + "\n",
                encoding="utf-8",
            )
            code, review = run_main(module, ["run", "--file", str(batch_file)])
            if code != 0 or not review.get("requires_human_confirmation") or review.get("remote_text"):
                raise AssertionError(review)
            code, data = run_main(module, ["run", "--file", str(batch_file), "--confirm-reviewed"])
            remote_text = str(data.get("remote_text") or "")
            batch_text = str(data.get("batch_file_text") or "")
            if code != 0 or not data.get("need_remote") or "sfcli -f" not in remote_text:
                raise AssertionError(data)
            remote_commands = data.get("remote_commands") or []
            if any(str(command).startswith("sfcli modify ") for command in remote_commands):
                raise AssertionError(data)
            if "sfcli modify" in batch_text or ";" in batch_text:
                raise AssertionError(batch_text)
            if "http_sched_mode connection" not in batch_text:
                raise AssertionError(batch_text)

    harness.check("run file uses sfcli -f remote text", run_file_uses_sfcli_f_remote_text)

    def batch_confirm_uses_sfcli_f_remote_text() -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            batch_file = Path(temp_dir) / "commands.sfcli"
            batch_file.write_text("sfcli modify slb virtual-service VS_1 tcp_profile test\n", encoding="utf-8")
            code, data = run_main(module, ["batch", "--file", str(batch_file), "--confirm-reviewed"])
            remote_text = str(data.get("remote_text") or "")
            batch_text = str(data.get("batch_file_text") or "")
            if code != 0 or "sfcli -f" not in remote_text or "modify slb virtual-service" not in batch_text:
                raise AssertionError(data)
            remote_commands = data.get("remote_commands") or []
            if any(str(command).startswith("sfcli modify ") for command in remote_commands):
                raise AssertionError(data)
            if "sfcli modify" in batch_text or ";" in batch_text:
                raise AssertionError(batch_text)

    harness.check("batch confirm uses sfcli -f remote text", batch_confirm_uses_sfcli_f_remote_text)

    def empty_run_file_rejected() -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            batch_file = Path(temp_dir) / "empty.sfcli"
            batch_file.write_text("# empty on purpose\n\n", encoding="utf-8")
            code, data = run_main(module, ["run", "--file", str(batch_file), "--confirm-reviewed"])
            if code == 0 or "no sfcli commands found" not in str(data.get("error") or ""):
                raise AssertionError(data)

    harness.check("empty run file rejected", empty_run_file_rejected)

    def empty_batch_file_rejected() -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            batch_file = Path(temp_dir) / "empty.sfcli"
            batch_file.write_text("# empty on purpose\n\n", encoding="utf-8")
            code, data = run_main(module, ["batch", "--file", str(batch_file), "--confirm-reviewed"])
            if code == 0 or "no sfcli commands found" not in str(data.get("error") or ""):
                raise AssertionError(data)

    harness.check("empty batch file rejected", empty_batch_file_rejected)

    def batch_auto_repair_retries_with_sfcli_file() -> None:
        calls: list[list[str]] = []
        old_probe = module.probe_ad_environment
        old_run_batch = module.run_local_batch_file
        old_run_commands = module.run_local_commands
        old_repair = module.repair_candidates_for_commands
        try:
            module.probe_ad_environment = lambda timeout=5: {"ok": True, "is_ad": True}

            def fake_run_batch(commands: list[str], timeout: int) -> dict[str, Any]:
                calls.append(list(commands))
                if len(calls) == 1:
                    return {"ok": False, "exit_code": 1, "stdout": "Syntax error", "stderr": ""}
                return {
                    "ok": True,
                    "exit_code": 0,
                    "stdout": "",
                    "stderr": "",
                    "batch_file_text": module.to_sfcli_batch_file_text(commands),
                }

            def forbidden_run_commands(commands: list[str], timeout: int) -> dict[str, Any]:
                raise AssertionError("batch auto-repair must retry through sfcli -f")

            module.run_local_batch_file = fake_run_batch
            module.run_local_commands = forbidden_run_commands
            module.repair_candidates_for_commands = lambda commands, error_text, **kwargs: (
                ["sfcli modify sys web-service multi_login enable;"],
                [{"reason": "test"}],
            )
            data = module.command_run(
                ["sfcli modify sys web-service multi_login ENABLE;"],
                probe_timeout=1,
                timeout=1,
                auto_repair=True,
                confirm_auto_repair=True,
                use_batch_file=True,
            )
            if not data.get("ok") or not data.get("auto_repaired") or not data.get("auto_repair_uses_sfcli_file"):
                raise AssertionError(data)
            if len(calls) != 2 or "enable" not in calls[-1][0]:
                raise AssertionError(calls)
        finally:
            module.probe_ad_environment = old_probe
            module.run_local_batch_file = old_run_batch
            module.run_local_commands = old_run_commands
            module.repair_candidates_for_commands = old_repair

    harness.check("batch auto-repair retries with sfcli file", batch_auto_repair_retries_with_sfcli_file)

    def batch_timeout_returns_structured_error() -> None:
        old_probe = module.probe_ad_environment
        old_run_batch = module.run_local_batch_file
        try:
            module.probe_ad_environment = lambda timeout=5: {"ok": True, "is_ad": True}
            module.run_local_batch_file = lambda commands, timeout: {
                "ok": False,
                "exit_code": None,
                "stdout": "",
                "stderr": "",
                "error": "sfcli -f timed out after 1s",
                "timed_out": True,
                "batch_file_text": module.to_sfcli_batch_file_text(commands),
            }
            data = module.command_run(
                ["sfcli modify sys web-service multi_login enable;"],
                probe_timeout=1,
                timeout=1,
                use_batch_file=True,
            )
            if data.get("ok") or not data.get("timed_out") or "sfcli -f timed out" not in str(data.get("error") or ""):
                raise AssertionError(data)
        finally:
            module.probe_ad_environment = old_probe
            module.run_local_batch_file = old_run_batch

    harness.check("batch timeout returns structured error", batch_timeout_returns_structured_error)

    def single_command_timeout_returns_structured_error() -> None:
        old_probe = module.probe_ad_environment
        old_run_commands = module.run_local_commands
        try:
            module.probe_ad_environment = lambda timeout=5: {"ok": True, "is_ad": True}
            module.run_local_commands = lambda commands, timeout: {
                "ok": False,
                "exit_code": None,
                "stdout": "",
                "stderr": "",
                "error": "sfcli command timed out after 1s",
                "timed_out": True,
            }
            data = module.command_run(
                ["sfcli modify sys web-service multi_login enable;"],
                probe_timeout=1,
                timeout=1,
            )
            if data.get("ok") or not data.get("timed_out") or "timed out" not in str(data.get("error") or ""):
                raise AssertionError(data)
        finally:
            module.probe_ad_environment = old_probe
            module.run_local_commands = old_run_commands

    harness.check("single command timeout returns structured error", single_command_timeout_returns_structured_error)

    force_error = "Server error: 管理口配置-Web控制台引用了白名单或者用户地址集，客户端源IP[10.32.33.75]不在其中，请确认是否强制提交"
    force_bad = "sfcli modify sys whitelist web_console { whitelist_address { type global-whitelist } }"
    harness.expect_format_ok(
        "force suffix accepted after business validation",
        force_bad + " force",
        repair_expected=False,
    )
    harness.expect_format_error(
        "force suffix not accepted for unrelated command",
        "sfcli modify sys web-service multi_login enable force",
        "unknown field",
    )

    def repair_force_submit_error() -> None:
        code, data = run_main(
            module,
            ["repair", "--failed-command", force_bad, "--error", force_error],
        )
        candidates = data.get("candidates") or data.get("repair_candidates") or []
        if code != 0 or not any(str(candidate).endswith(" force;") for candidate in candidates):
            raise AssertionError(data)
        notes = data.get("repairs") or []
        if not any(note.get("reason") == "server_error_requires_command_suffix" for note in notes if isinstance(note, dict)):
            raise AssertionError(data)

    harness.check("repair force submit business error", repair_force_submit_error)

    def repair_does_not_force_without_prompt() -> None:
        code, data = run_main(
            module,
            ["repair", "--failed-command", force_bad, "--error", "Server error: other validation failed"],
        )
        candidates = data.get("candidates") or data.get("repair_candidates") or []
        if code == 0 or candidates:
            raise AssertionError(data)

    harness.check("repair does not force without prompt", repair_does_not_force_without_prompt)

    def repair_force_boolean_value_to_bare_suffix() -> None:
        code, data = run_main(
            module,
            [
                "repair",
                "--failed-command",
                force_bad + " force true",
                "--error",
                'Syntax error: 非法参数"true"',
            ],
        )
        candidates = data.get("candidates") or data.get("repair_candidates") or []
        if code != 0 or force_bad + " force;" not in candidates:
            raise AssertionError(data)

    harness.check("repair force true to bare force", repair_force_boolean_value_to_bare_suffix)

    def learn_force_submit_suffix() -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            overrides = Path(temp_dir) / "cli_overrides.json"
            overrides.write_text('{"value_rewrites":[],"command_suffix_rewrites":[]}', encoding="utf-8")
            result = module.learn_from_commands(
                force_bad,
                force_bad + " force",
                source="selftest",
                model=model,
                overrides_path=overrides,
                path="sys/whitelist",
                document="sys/whitelist.js",
                error_text=force_error,
            )
            if not result.get("ok"):
                raise AssertionError(result)
            data = json.loads(overrides.read_text(encoding="utf-8"))
            rules = data.get("command_suffix_rewrites") or []
            if not rules or rules[0].get("append") != ["force"] or rules[0].get("when_error_contains") != ["强制提交"]:
                raise AssertionError(data)
            candidates, notes = module.repair_candidates_for_commands(
                [force_bad],
                force_error,
                model=model,
                overrides_path=overrides,
            )
            if not any(str(candidate).endswith(" force;") for candidate in candidates):
                raise AssertionError({"candidates": candidates, "notes": notes})

    harness.check("learn force submit command suffix", learn_force_submit_suffix)

    def cli_learn_force_submit_suffix() -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            overrides = Path(temp_dir) / "cli_overrides.json"
            overrides.write_text('{"value_rewrites":[],"command_suffix_rewrites":[]}', encoding="utf-8")
            code, data = run_main(
                module,
                [
                    "learn",
                    "--bad",
                    force_bad,
                    "--good",
                    force_bad + " force",
                    "--error",
                    force_error,
                    "--path",
                    "sys/whitelist",
                    "--document",
                    "sys/whitelist.js",
                    "--overrides",
                    str(overrides),
                ],
            )
            learned = json.loads(overrides.read_text(encoding="utf-8"))
            rules = learned.get("command_suffix_rewrites") or []
            if code != 0 or not data.get("ok") or not rules or rules[0].get("append") != ["force"]:
                raise AssertionError({"result": data, "overrides": learned})

    harness.check("cli learn force submit command suffix", cli_learn_force_submit_suffix)

    def learn_rejects_unsafe_suffix() -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            overrides = Path(temp_dir) / "cli_overrides.json"
            overrides.write_text('{"value_rewrites":[],"command_suffix_rewrites":[]}', encoding="utf-8")
            try:
                module.learn_from_commands(
                    force_bad,
                    force_bad + " force true",
                    source="selftest",
                    model=model,
                    overrides_path=overrides,
                    path="sys/whitelist",
                    document="sys/whitelist.js",
                    error_text=force_error,
                )
            except Exception as exc:  # noqa: BLE001
                if "bare force" not in str(exc):
                    raise AssertionError(exc) from exc
                return
            raise AssertionError("unsafe suffix unexpectedly learned")

    harness.check("learn rejects unsafe command suffix", learn_rejects_unsafe_suffix)

    def learn_rejects_suffix_without_error() -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            overrides = Path(temp_dir) / "cli_overrides.json"
            overrides.write_text('{"value_rewrites":[],"command_suffix_rewrites":[]}', encoding="utf-8")
            try:
                module.learn_from_commands(
                    force_bad,
                    force_bad + " force",
                    source="selftest",
                    model=model,
                    overrides_path=overrides,
                    path="sys/whitelist",
                    document="sys/whitelist.js",
                )
            except Exception as exc:  # noqa: BLE001
                if "requires --error" not in str(exc):
                    raise AssertionError(exc) from exc
                return
            raise AssertionError("suffix without force-submit error unexpectedly learned")

    harness.check("learn rejects suffix without force error", learn_rejects_suffix_without_error)

    def run_requires_review() -> None:
        code, data = run_main(
            module,
            ["run", "sfcli modify sys passwd-policy login_protect { state enable }"],
        )
        if code != 0 or not data.get("requires_human_confirmation") or data.get("executed"):
            raise AssertionError(data)

    harness.check("run requires human confirmation", run_requires_review)

    def run_rejects_unknown_before_review() -> None:
        code, data = run_main(
            module,
            ["run", "sfcli list sys management; echo PWNED"],
        )
        if code == 0 or "not in the local AD CLI model" not in str(data.get("error")):
            raise AssertionError(data)

    harness.check("run rejects unknown command before review", run_rejects_unknown_before_review)

    def template_path_placeholder_not_execution_ready() -> None:
        code, data = run_main(
            module,
            [
                "template",
                "--command",
                "modify slb pool [name]",
                "--path",
                "slb/pool/{name}",
                "--document",
                "slb/pool.js",
            ],
        )
        if code != 0 or data.get("execution_ready") is not False or data.get("path_placeholders") != ["name"]:
            raise AssertionError(data)

    harness.check("template path placeholder not execution ready", template_path_placeholder_not_execution_ready)

    # Model-derived coverage.
    entry_limit = 160 if quick else len(entries)
    object_limit = 80 if quick else None
    array_limit = 80 if quick else None
    scalar_limit = 120 if quick else None

    for index, entry in enumerate(entries[:entry_limit]):
        command = " ".join(command_tokens(entry))
        if module.required_top_level_fields_for_format(module.enrich_entry_for_cli(entry)) - module.command_placeholder_names(entry):
            harness.expect_format_error(f"command shape missing required {index}", command, "missing required field")
        else:
            harness.expect_format_ok(f"command shape {index}", command)
        field = first_named_field(entry)
        if field:
            harness.expect_format_rejected(
                f"unknown top field {index}",
                f"{command} __unknown_field__ sample_value",
            )

    scalar_seen = 0
    object_seen = 0
    array_seen = 0
    placeholder_seen = 0
    for index, entry in enumerate(entries):
        pattern = str(entry.get("command") or "")
        if "[" in pattern and "]" in pattern and (not quick or placeholder_seen < 80):
            placeholder_seen += 1
            harness.expect_format_error(
                f"template placeholder rejection {index}",
                "sfcli " + pattern,
                "unresolved template placeholder",
            )

        scalar = first_named_field(entry)
        if scalar and str(scalar.get("type") or "") not in {"object", "array"}:
            if scalar_limit is None or scalar_seen < scalar_limit:
                scalar_seen += 1
                harness.expect_format_ok(
                    f"scalar field format {index}",
                    make_field_command(entry, scalar, uppercase=True),
                )

        obj = first_named_field(entry, "object")
        if obj and (object_limit is None or object_seen < object_limit):
            object_seen += 1
            harness.expect_format_ok(
                f"object field format {index}",
                make_field_command(entry, obj, uppercase=False),
            )
            harness.expect_format_ok(
                f"object field repair {index}",
                make_field_command(entry, obj, uppercase=True),
            )
            bad = " ".join([*command_tokens(entry), str(obj["name"]), "{", "__unknown_child__", "sample_value", "}"])
            harness.expect_format_error(f"object unknown child {index}", bad, "unknown child")
            missing_payload = render_minimal_field(obj)
            if missing_payload and missing_payload[-1] == "}":
                missing_payload = missing_payload[:-1]
            missing = " ".join([*command_tokens(entry), *missing_payload])
            harness.expect_format_error(f"object missing brace {index}", missing, "missing closing brace")

        arr = first_named_field(entry, "array")
        if arr and (array_limit is None or array_seen < array_limit):
            array_seen += 1
            harness.expect_format_ok(
                f"array field format {index}",
                make_field_command(entry, arr, uppercase=True),
            )

    return {
        "ok": not harness.failures,
        "checks": harness.count,
        "failures": harness.failures[:25],
        "failure_count": len(harness.failures),
        "model_entries": len(entries),
        "quick": quick,
        "coverage": {
            "scalar_fields": scalar_seen,
            "object_fields": object_seen,
            "array_fields": array_seen,
            "placeholder_commands": placeholder_seen,
        },
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run release self-tests for sangfor-cli.")
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--quick", action="store_true")
    args = parser.parse_args(argv)
    result = run_selftest(args.model, args.quick)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
