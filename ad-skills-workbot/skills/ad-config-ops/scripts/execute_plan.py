from __future__ import annotations

import argparse
import getpass
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import (
    DEFAULT_EXECUTE_RESULT_NAME,
    DEFAULT_ROLLBACK_NAME,
    operation_count,
    resolve_file_path,
    short_summary,
    update_artifacts,
    workdir_path,
)
from compare_state import compare_expected
from device_config import DeviceConfigError, normalize_base_url, resolve_device_connection
from rollback import rollback_manifest


MUTATING_METHODS = {"POST", "PATCH", "PUT", "DELETE"}
RESTORE_METHODS = {"POST", "PATCH", "PUT"}
PATH_PARAMETER_RE = re.compile(r"{([^{}]+)}")
DEFAULT_REQUEST_TIMEOUT = (5, 30)
ALL_PROPERTIES_PARAMS = {"all_properties": "true"}


class ExecutionError(RuntimeError):
    pass


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Execute or preview an AD API operation plan.")
    parser.add_argument("--plan", type=Path, help="Operation plan JSON path. Defaults to TMP_FILE when set.")
    parser.add_argument("--devices", type=Path, help="devices.json path for selecting a named device.")
    parser.add_argument("--device", help="Device name or host selector in devices.json.")
    parser.add_argument("--host", help="AD device host, host:port, or URL. Defaults to AD_HOST when no device is selected.")
    parser.add_argument("--username", help="AD API username. Defaults to AD_USERNAME when no device is selected.")
    parser.add_argument("--password", help="AD API password. Defaults to AD_PASSWORD when no device is selected.")
    parser.add_argument("--token", help="Existing AD API token. Defaults to AD_TOKEN when no device is selected.")
    parser.add_argument("--execute", action="store_true", help="Apply the plan. Without this flag, preview only.")
    parser.add_argument("--allow-existing", action="store_true", help="Allow create operations when target exists.")
    parser.add_argument("--rollback-out", type=Path, help="Rollback manifest output path.")
    parser.add_argument("--result-out", type=Path, help="Full execution result JSON output path.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    parser.add_argument("--json", action="store_true", help="Print the full execution result JSON instead of a short summary.")
    parser.add_argument("--connect-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[0], help="Connect timeout in seconds.")
    parser.add_argument("--read-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[1], help="Read timeout in seconds.")
    return parser.parse_args(argv)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def configure_session(session: Any, auth: dict[str, Any]) -> None:
    session.verify = False
    token = auth.get("token")
    if token:
        session.headers["x-token-sangforad"] = token
        return
    username = auth.get("username")
    password = auth.get("password")
    if username and password is not None:
        session.auth = (username, password)


def full_url(base_url: str, path: str) -> str:
    return base_url.rstrip("/") + "/" + path.lstrip("/")


def response_payload(response: Any) -> Any:
    try:
        return response.json()
    except Exception:
        return None


def required_snapshot(response: Any, path: str) -> dict[str, Any]:
    try:
        payload = response.json()
    except Exception as exc:
        raise ExecutionError(f"precheck GET {path} did not return a valid JSON snapshot") from exc
    if not isinstance(payload, dict):
        raise ExecutionError(f"precheck GET {path} did not return a usable JSON snapshot")
    return payload


def request(
    session: Any,
    base_url: str,
    method: str,
    path: str,
    payload: Any = None,
    params: dict[str, str] | None = None,
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> Any:
    kwargs: dict[str, Any] = {}
    if payload is not None and method.upper() in {"POST", "PATCH", "PUT"}:
        kwargs["json"] = payload
    if params:
        kwargs["params"] = params
    kwargs["timeout"] = timeout
    return session.request(method.upper(), full_url(base_url, path), **kwargs)


def materialize_path(path: str, parameters: dict[str, Any]) -> str:
    def replace(match: re.Match[str]) -> str:
        name = match.group(1)
        if name not in parameters:
            raise ExecutionError(f"missing path parameter: {name}")
        return str(parameters[name])

    return PATH_PARAMETER_RE.sub(replace, path)


def resource_path(operation: dict[str, Any]) -> str:
    path = operation.get("resource_path") or operation.get("path")
    if not isinstance(path, str):
        raise ExecutionError("operation must include path")
    materialized = materialize_path(path, operation.get("path_parameters") or {})
    if "{" in materialized or "}" in materialized:
        raise ExecutionError(f"unresolved resource path: {materialized}")
    return materialized


def preview_plan(plan: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "id": operation.get("id"),
            "action": operation.get("action"),
            "method": operation.get("method"),
            "path": operation.get("path"),
            "precheck": "GET " + resource_path(operation),
        }
        for operation in plan.get("operations", []) or []
    ]


def rollback_delete_action(operation: dict[str, Any], target_path: str) -> dict[str, Any]:
    return {
        "operation_id": operation.get("id"),
        "reason": "delete-created-resource",
        "method": "DELETE",
        "path": target_path,
        "verify": {"path": target_path, "absent": True},
    }


def rollback_override(operation: dict[str, Any]) -> tuple[Any, Any]:
    rollback = operation.get("rollback")
    if isinstance(rollback, dict):
        return rollback.get("rollback_method") or rollback.get("method"), rollback.get("rollback_path") or rollback.get("path")
    return operation.get("rollback_method"), operation.get("rollback_path")


def rollback_restore_action(
    operation: dict[str, Any],
    target_path: str,
    snapshot: Any,
    reason: str,
    method: str,
    path: str | None = None,
) -> dict[str, Any]:
    return {
        "operation_id": operation.get("id"),
        "reason": reason,
        "method": method.upper(),
        "path": path or target_path,
        "payload": snapshot,
        "verify": {"path": target_path, "expected": snapshot, "exact": True},
    }


def validate_rollback_path(path: Any) -> str:
    if not isinstance(path, str) or not path.strip() or not path.startswith("/api/"):
        raise ExecutionError("rollback_path must be an absolute /api/ path")
    return path


def rollback_action_for_existing_resource(
    operation: dict[str, Any],
    action: str,
    target_path: str,
    snapshot: dict[str, Any],
) -> dict[str, Any]:
    override_method, override_path = rollback_override(operation)
    if action == "patch":
        method = str(override_method or "PATCH").upper()
        reason = "restore-previous-snapshot"
    elif action == "replace":
        method = str(override_method or "PUT").upper()
        reason = "restore-previous-snapshot"
    elif action == "delete":
        if not override_method:
            raise ExecutionError("delete rollback requires explicit rollback_method")
        if override_path is None:
            raise ExecutionError("delete rollback requires explicit rollback_path")
        override_path = validate_rollback_path(override_path)
        method = str(override_method).upper()
        reason = "recreate-previous-snapshot"
    else:
        method = str(override_method or "PUT").upper()
        reason = "restore-previous-snapshot"
    if method not in RESTORE_METHODS:
        raise ExecutionError("rollback_method must be one of POST, PATCH, PUT")
    if override_path is not None:
        override_path = validate_rollback_path(override_path)
    return rollback_restore_action(operation, target_path, snapshot, reason, method, override_path)


def verify_entries(plan: dict[str, Any], operation: dict[str, Any], target_path: str) -> list[dict[str, Any]]:
    operation_id = operation.get("id")
    entries = [item for item in plan.get("verify", []) or [] if item.get("operation_id") == operation_id]
    if entries:
        return entries
    if str(operation.get("action", "")).lower() == "delete":
        return [{"operation_id": operation_id, "path": target_path, "absent": True}]
    return [{"operation_id": operation_id, "path": target_path, "expected": operation.get("payload", {})}]


def verify_operation(
    plan: dict[str, Any],
    operation: dict[str, Any],
    session: Any,
    base_url: str,
    target_path: str,
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for entry in verify_entries(plan, operation, target_path):
        path = entry.get("path") or target_path
        response = request(session, base_url, "GET", path, params=ALL_PROPERTIES_PARAMS, timeout=timeout)
        if entry.get("absent") or str(operation.get("action", "")).lower() == "delete":
            ok = response.status_code == 404
            result = {"path": path, "ok": ok, "absent": True, "status": response.status_code}
        elif not response.ok:
            result = {"path": path, "ok": False, "status": response.status_code, "error": getattr(response, "text", "")}
        else:
            expected = entry.get("expected")
            if expected is None:
                expected = operation.get("payload", {})
            diffs = compare_expected(expected, response_payload(response))
            result = {"path": path, "ok": not diffs, "diffs": diffs}
        results.append(result)
        if not result.get("ok"):
            raise ExecutionError(f"verify failed for {path}: {result}")
    return results


def rollback_manifest_data(actions: list[dict[str, Any]]) -> dict[str, Any]:
    return {"version": 1, "actions": actions}


def persist_rollback_manifest(path: Path | None, manifest: dict[str, Any]) -> str | None:
    if path is None:
        return None
    try:
        write_json(path, manifest)
    except Exception as exc:
        return str(exc)
    return None


def execute_plan(
    *,
    plan: dict[str, Any],
    session: Any,
    base_url: str,
    auth: dict[str, Any],
    execute: bool = True,
    rollback_out: Path | None = None,
    allow_existing: bool = False,
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> dict[str, Any]:
    if not execute:
        return {"ok": True, "mode": "preview", "operations": preview_plan(plan)}

    configure_session(session, auth)
    rollback_actions: list[dict[str, Any]] = []
    rollback_needed = False
    rollback_persist_error: str | None = None
    executed: list[dict[str, Any]] = []
    verify_results: list[dict[str, Any]] = []

    try:
        for operation in plan.get("operations", []) or []:
            action = str(operation.get("action", "")).lower()
            method = str(operation.get("method", "")).upper()
            path = operation.get("path")
            if method not in MUTATING_METHODS or not isinstance(path, str):
                raise ExecutionError(f"invalid operation: {operation!r}")
            target_path = resource_path(operation)
            precheck = request(session, base_url, "GET", target_path, params=ALL_PROPERTIES_PARAMS, timeout=timeout)
            if action == "create":
                if precheck.ok:
                    if not allow_existing:
                        raise ExecutionError(f"create target already exists: {target_path}")
                    snapshot = required_snapshot(precheck, target_path)
                    pending_rollback_action = rollback_restore_action(
                        operation, target_path, snapshot, "restore-existing-resource", "PUT"
                    )
                elif precheck.status_code == 404:
                    pending_rollback_action = rollback_delete_action(operation, target_path)
                else:
                    raise ExecutionError(f"precheck GET {target_path} failed: {precheck.status_code}")
            elif action in {"patch", "replace", "delete"}:
                if not precheck.ok:
                    raise ExecutionError(f"precheck GET {target_path} failed: {precheck.status_code}")
                snapshot = required_snapshot(precheck, target_path)
                pending_rollback_action = rollback_action_for_existing_resource(operation, action, target_path, snapshot)
            else:
                raise ExecutionError(f"unsupported action: {action}")

            pending_manifest_actions = rollback_actions + [pending_rollback_action]
            rollback_persist_error = persist_rollback_manifest(
                rollback_out,
                rollback_manifest_data(pending_manifest_actions),
            )
            if rollback_persist_error:
                raise ExecutionError(f"rollback manifest persist failed: {rollback_persist_error}")
            rollback_actions.append(pending_rollback_action)
            rollback_needed = True
            response = request(session, base_url, method, path, operation.get("payload"), timeout=timeout)
            executed.append({"id": operation.get("id"), "method": method, "path": path, "status": response.status_code})
            if not response.ok:
                raise ExecutionError(f"{method} {path} failed: {response.status_code} {getattr(response, 'text', '')}")
            verify_results.extend(verify_operation(plan, operation, session, base_url, target_path, timeout=timeout))

        if rollback_actions:
            rollback_persist_error = persist_rollback_manifest(rollback_out, rollback_manifest_data(rollback_actions))
        return {
            "ok": True,
            "mode": "execute",
            "executed": executed,
            "verify": verify_results,
            "rollback": rollback_manifest_data(rollback_actions),
            **({"rollback_persist_error": rollback_persist_error} if rollback_persist_error else {}),
        }
    except Exception as exc:
        result: dict[str, Any] = {"ok": False, "error": str(exc), "executed": executed, "verify": verify_results}
        if rollback_persist_error:
            result["rollback_persist_error"] = rollback_persist_error
        if rollback_actions and rollback_needed:
            manifest = rollback_manifest_data(rollback_actions)
            persist_error = persist_rollback_manifest(rollback_out, manifest)
            if persist_error:
                result["rollback_persist_error"] = persist_error
            try:
                result["rollback"] = rollback_manifest(
                    manifest=manifest,
                    session=session,
                    base_url=base_url,
                    auth=auth,
                    execute=True,
                    timeout=timeout,
                )
            except Exception as rollback_exc:
                result["rollback"] = {"ok": False, "error": f"rollback raised: {rollback_exc}", "results": []}
        return result


def cli_auth(args: argparse.Namespace) -> dict[str, Any]:
    auth = resolve_device_connection(args)
    password = auth.get("password")
    if args.execute and not auth.get("token") and password is None:
        password = getpass.getpass("AD password: ")
    auth["password"] = password
    return auth


def summarize_result(
    result: dict[str, Any],
    plan: dict[str, Any],
    result_out: Path | None = None,
    rollback_out: Path | None = None,
) -> dict[str, Any]:
    verify = result.get("verify") if isinstance(result.get("verify"), list) else []
    failed_verify = [item for item in verify if not item.get("ok")]
    diff_paths = [
        diff.get("path")
        for item in failed_verify
        for diff in item.get("diffs", []) or []
        if isinstance(diff, dict)
    ]
    summary: dict[str, Any] = {
        "ok": result.get("ok"),
        "mode": result.get("mode"),
        "operation_count": operation_count(plan),
        "executed_count": len(result.get("executed") or []),
        "verify_failed_count": len(failed_verify),
        "diff_paths": diff_paths,
    }
    if result_out is not None:
        summary["result"] = str(result_out)
    if rollback_out is not None:
        summary["rollback"] = str(rollback_out)
    if result.get("error"):
        summary["error"] = result["error"]
    return summary


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        auth = cli_auth(args)
    except DeviceConfigError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    if args.execute:
        if not auth.get("host"):
            print("--device/--devices or --host/AD_HOST is required", file=sys.stderr)
            return 2
        if not auth.get("token") and not auth.get("username"):
            print("--username/AD_USERNAME or --token/AD_TOKEN is required", file=sys.stderr)
            return 2
    try:
        plan_path = resolve_file_path(args.plan, "plan JSON")
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    plan = load_json(plan_path)
    active_workdir = workdir_path(args.workdir)
    result_out = args.result_out or (active_workdir / DEFAULT_EXECUTE_RESULT_NAME if active_workdir else None)
    rollback_out = args.rollback_out or (active_workdir / DEFAULT_ROLLBACK_NAME if active_workdir else None)
    session = requests.Session()
    result = execute_plan(
        plan=plan,
        session=session,
        base_url=normalize_base_url(auth["host"]) if auth.get("host") else "https://preview.invalid",
        auth=auth,
        execute=args.execute,
        rollback_out=rollback_out,
        allow_existing=args.allow_existing,
        timeout=(args.connect_timeout, args.read_timeout),
    )
    if result_out is not None:
        write_json(result_out, result)
    artifacts = update_artifacts(active_workdir, plan=plan_path, execution_result=result_out, rollback=rollback_out)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        summary = summarize_result(result, plan, result_out, rollback_out)
        if artifacts is not None:
            summary["artifacts"] = str(artifacts)
        print(short_summary(**summary), end="")
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
