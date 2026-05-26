from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
from pathlib import Path
from typing import Any

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import (
    DEFAULT_ROLLBACK_RESULT_NAME,
    resolve_file_path,
    short_summary,
    update_artifacts,
    workdir_path,
    write_json,
)
from compare_state import compare_expected


MUTATING_METHODS = {"POST", "PATCH", "PUT", "DELETE"}
DEFAULT_REQUEST_TIMEOUT = (5, 30)
ALL_PROPERTIES_PARAMS = {"all_properties": "true"}


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rollback AD API operations from a manifest.")
    parser.add_argument("--manifest", type=Path, help="Rollback manifest JSON path. Defaults to TMP_FILE when set.")
    parser.add_argument("--host", default=os.environ.get("AD_HOST"), help="AD device host or address.")
    parser.add_argument("--username", default=os.environ.get("AD_USERNAME"), help="AD API username.")
    parser.add_argument("--password", default=os.environ.get("AD_PASSWORD"), help="AD API password.")
    parser.add_argument("--token", default=os.environ.get("AD_TOKEN"), help="Existing AD API token.")
    parser.add_argument("--execute", action="store_true", help="Execute rollback. Without this flag, preview only.")
    parser.add_argument("--result-out", type=Path, help="Full rollback result JSON output path.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    parser.add_argument("--json", action="store_true", help="Print the full rollback result JSON instead of a short summary.")
    parser.add_argument("--connect-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[0], help="Connect timeout in seconds.")
    parser.add_argument("--read-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[1], help="Read timeout in seconds.")
    return parser.parse_args(argv)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


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


def exact_diff(expected: Any, actual: Any, path: str) -> list[dict[str, Any]]:
    if expected != actual:
        return [{"path": path, "expected": expected, "actual": actual}]
    return []


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


def verify_action(
    session: Any,
    base_url: str,
    action: dict[str, Any],
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> dict[str, Any]:
    verify = action.get("verify") or {}
    path = verify.get("path") or action.get("path")
    if not isinstance(path, str):
        return {"ok": True, "skipped": True}
    try:
        response = request(session, base_url, "GET", path, params=ALL_PROPERTIES_PARAMS, timeout=timeout)
    except Exception as exc:
        return {"ok": False, "path": path, "error": str(exc)}
    if verify.get("absent"):
        ok = response.status_code == 404
        return {"ok": ok, "path": path, "absent": True, "status": response.status_code}
    if not response.ok:
        return {"ok": False, "path": path, "status": response.status_code, "error": getattr(response, "text", "")}
    expected = verify.get("expected")
    if expected is None:
        expected = action.get("payload", {})
    actual = response_payload(response)
    if verify.get("exact"):
        diffs = exact_diff(expected, actual, path)
    else:
        diffs = compare_expected(expected, actual)
    return {"ok": not diffs, "path": path, "diffs": diffs}


def preview_actions(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "operation_id": action.get("operation_id"),
            "method": action.get("method"),
            "path": action.get("path"),
        }
        for action in reversed(manifest.get("actions", []) or [])
    ]


def rollback_manifest(
    *,
    manifest: dict[str, Any],
    session: Any,
    base_url: str,
    auth: dict[str, Any],
    execute: bool = False,
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> dict[str, Any]:
    if not execute:
        return {"ok": True, "mode": "preview", "actions": preview_actions(manifest)}

    configure_session(session, auth)
    results: list[dict[str, Any]] = []
    for action in reversed(manifest.get("actions", []) or []):
        method = str(action.get("method", "")).upper()
        path = action.get("path")
        if method not in MUTATING_METHODS or not isinstance(path, str):
            return {"ok": False, "error": f"invalid rollback action: {action!r}", "results": results}
        result = {
            "operation_id": action.get("operation_id"),
            "method": method,
            "path": path,
        }
        try:
            response = request(session, base_url, method, path, action.get("payload"), timeout=timeout)
        except Exception as exc:
            result["error"] = str(exc)
            results.append(result)
            return {"ok": False, "error": f"rollback {method} {path} raised: {exc}", "results": results}
        result["status"] = response.status_code
        absent_delete = method == "DELETE" and response.status_code == 404 and (action.get("verify") or {}).get("absent")
        if not response.ok and not absent_delete:
            result["error"] = getattr(response, "text", "")
            results.append(result)
            return {"ok": False, "error": f"rollback {method} {path} failed", "results": results}
        verify = verify_action(session, base_url, action, timeout=timeout)
        result["verify"] = verify
        results.append(result)
        if not verify.get("ok"):
            return {"ok": False, "error": f"rollback verify failed for {path}", "results": results}
    return {"ok": True, "mode": "execute", "results": results}


def cli_auth(args: argparse.Namespace) -> dict[str, Any]:
    password = args.password
    if args.execute and not args.token and password is None:
        password = getpass.getpass("AD password: ")
    return {"host": args.host, "username": args.username, "password": password, "token": args.token}


def summarize_rollback(result: dict[str, Any], manifest: dict[str, Any], result_out: Path | None = None) -> dict[str, Any]:
    results = result.get("results") if isinstance(result.get("results"), list) else []
    failed = [item for item in results if not (item.get("verify") or {}).get("ok", result.get("ok"))]
    summary: dict[str, Any] = {
        "ok": result.get("ok"),
        "mode": result.get("mode"),
        "action_count": len(manifest.get("actions") or []),
        "executed_count": len(results),
        "verify_failed_count": len(failed),
    }
    if result_out is not None:
        summary["result"] = str(result_out)
    if result.get("error"):
        summary["error"] = result["error"]
    return summary


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    auth = cli_auth(args)
    if args.execute:
        if not auth.get("host"):
            print("--host or AD_HOST is required", file=sys.stderr)
            return 2
        if not auth.get("token") and not auth.get("username"):
            print("--username/AD_USERNAME or --token/AD_TOKEN is required", file=sys.stderr)
            return 2
    try:
        manifest_path = resolve_file_path(args.manifest, "rollback manifest JSON")
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    manifest = load_json(manifest_path)
    active_workdir = workdir_path(args.workdir)
    result_out = args.result_out or (active_workdir / DEFAULT_ROLLBACK_RESULT_NAME if active_workdir else None)
    session = requests.Session()
    result = rollback_manifest(
        manifest=manifest,
        session=session,
        base_url=f"https://{auth.get('host')}" if auth.get("host") else "https://preview.invalid",
        auth=auth,
        execute=args.execute,
        timeout=(args.connect_timeout, args.read_timeout),
    )
    if result_out is not None:
        write_json(result_out, result)
    artifacts = update_artifacts(active_workdir, rollback=manifest_path, rollback_result=result_out)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        summary = summarize_rollback(result, manifest, result_out)
        if artifacts is not None:
            summary["artifacts"] = str(artifacts)
        print(short_summary(**summary), end="")
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
