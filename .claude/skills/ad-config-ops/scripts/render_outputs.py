from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import (
    DEFAULT_APPLY_SCRIPT_NAME,
    DEFAULT_BATCH_NAME,
    operation_count,
    require_workdir,
    resolve_file_path,
    short_summary,
    update_artifacts,
    workdir_path,
    write_json,
    read_json,
)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render executable AD API batch and Python outputs from a plan.")
    parser.add_argument("--plan", type=Path, help="Operation plan JSON path. Defaults to TMP_FILE when set.")
    parser.add_argument("--batch-out", type=Path, help=f"Batch JSON output path. Defaults to workdir/{DEFAULT_BATCH_NAME}.")
    parser.add_argument("--script-out", type=Path, help=f"Python apply script output path. Defaults to workdir/{DEFAULT_APPLY_SCRIPT_NAME}.")
    parser.add_argument("--workdir", type=Path, help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.")
    return parser.parse_args(argv)


def operation_payload(operation: dict[str, Any]) -> str:
    payload = operation["payload"]
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def render_batch(plan: dict[str, Any]) -> list[dict[str, Any]]:
    batch: list[dict[str, Any]] = []
    for operation in plan.get("operations", []):
        method = str(operation.get("method", "")).upper()
        path = operation.get("path")
        if not method or not isinstance(path, str):
            raise ValueError("operation must include method and path")
        item: dict[str, Any] = {
            "method": method,
            "uri": path,
        }
        if "payload" in operation:
            item["payload"] = operation_payload(operation)
        if operation.get("id") is not None:
            item["id"] = operation["id"]
        batch.append(item)
    return batch


def render_script(plan: dict[str, Any]) -> str:
    embedded_plan_json = json.dumps(plan, ensure_ascii=False, indent=2)
    embedded_plan_literal = repr(embedded_plan_json)
    helper_dir_literal = repr(str(SCRIPT_DIR))
    return f'''from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
from pathlib import Path

import requests


EMBEDDED_PLAN_JSON = {embedded_plan_literal}
AD_OPS_SCRIPT_DIR = Path(os.environ.get("AD_OPS_SCRIPT_DIR", {helper_dir_literal}))
if str(AD_OPS_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(AD_OPS_SCRIPT_DIR))


def parse_args():
    parser = argparse.ArgumentParser(description="Apply a rendered AD API operation plan.")
    parser.add_argument("--host", default=os.environ.get("AD_HOST"), help="AD device host or address.")
    parser.add_argument("--username", default=os.environ.get("AD_USERNAME"), help="AD API username.")
    parser.add_argument("--token", default=os.environ.get("AD_TOKEN"), help="Existing AD API token.")
    parser.add_argument("--result-out", type=Path, help="Full execution result JSON path.")
    parser.add_argument("--execute", action="store_true", help="Apply the plan. Without this flag, only preview.")
    return parser.parse_args()


def credentials(args):
    password = os.environ.get("AD_PASSWORD")
    if password is None and not args.token:
        password = getpass.getpass("AD password: ")
    return {{
        "host": args.host,
        "username": args.username,
        "password": password,
        "token": args.token,
    }}


def execute_plan_operations(plan, auth):
    try:
        from execute_plan import execute_plan
    except ImportError as exc:
        raise RuntimeError(f"execute_plan.py is not importable from {{AD_OPS_SCRIPT_DIR}}") from exc

    session = requests.Session()
    session.verify = False
    return execute_plan(plan=plan, session=session, base_url=f"https://{{auth['host']}}", auth=auth)


def summarize_result(result, plan, result_out=None):
    verify = result.get("verify") if isinstance(result.get("verify"), list) else []
    failed = [item for item in verify if not item.get("ok")]
    summary = {{
        "ok": result.get("ok"),
        "mode": result.get("mode"),
        "operation_count": len(plan.get("operations") or []),
        "executed_count": len(result.get("executed") or []),
        "verify_failed_count": len(failed),
        "diff_paths": [diff.get("path") for item in failed for diff in item.get("diffs", [])],
    }}
    if result_out:
        summary["result"] = str(result_out)
    if result.get("rollback"):
        summary["rollback_available"] = True
    if result.get("error"):
        summary["error"] = result.get("error")
    return summary


def main():
    args = parse_args()
    plan = json.loads(EMBEDDED_PLAN_JSON)
    if not args.execute:
        print(json.dumps({{"ok": False, "error": "Refusing to apply without --execute."}}, ensure_ascii=False))
        return 1
    auth = credentials(args)
    if not auth["host"]:
        raise SystemExit("--host or AD_HOST is required")
    if not auth["token"] and not auth["username"]:
        raise SystemExit("--username/AD_USERNAME or --token/AD_TOKEN is required")
    result = execute_plan_operations(plan, auth)
    if args.result_out:
        args.result_out.parent.mkdir(parents=True, exist_ok=True)
        args.result_out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    print(json.dumps(summarize_result(result, plan, args.result_out), ensure_ascii=False))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
'''


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    plan_path = resolve_file_path(args.plan, "plan JSON")
    plan = read_json(plan_path)
    active_workdir = workdir_path(args.workdir)
    if (args.batch_out is None or args.script_out is None) and active_workdir is None:
        active_workdir = require_workdir(args.workdir)
    batch_out = args.batch_out or active_workdir / DEFAULT_BATCH_NAME
    script_out = args.script_out or active_workdir / DEFAULT_APPLY_SCRIPT_NAME
    write_json(batch_out, render_batch(plan))
    script_out.parent.mkdir(parents=True, exist_ok=True)
    script_out.write_text(render_script(plan), encoding="utf-8")
    artifacts = update_artifacts(active_workdir, plan=plan_path, batch=batch_out, apply_script=script_out)
    print(
        short_summary(
            ok=True,
            operation_count=operation_count(plan),
            batch=str(batch_out),
            apply_script=str(script_out),
            **({"artifacts": str(artifacts)} if artifacts else {}),
        ),
        end="",
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(2)
