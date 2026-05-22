from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import (
    DEFAULT_APPLY_SCRIPT_NAME,
    DEFAULT_BATCH_NAME,
    DEFAULT_EXECUTE_RESULT_NAME,
    DEFAULT_PLAN_NAME,
    DEFAULT_ROLLBACK_NAME,
    DEFAULT_ROLLBACK_SCRIPT_NAME,
    artifacts_path,
    default_workdir_path,
    operation_count,
    read_json,
    require_workdir,
    resolve_file_path,
    short_summary,
    skill_paths,
    tmp_file_path,
    update_artifacts,
    workdir_path,
    write_json,
)
from ad_http import normalize_base_url, requests
from dependency_order import load_resource_order
from execute_plan import execute_plan, summarize_result
from plan_operations import build_bundle_plan
from render_outputs import render_batch, render_rollback_script, render_script
from resolve_schema import definition_map
from verify_slb_resource import parse_args as parse_verify_args
from verify_slb_resource import verify_resources


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run low-token ad-config-ops artifact workflows.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    plan_and_render = subparsers.add_parser(
        "plan-and-render",
        help="Read a filled bundle YAML, then write plan/batch/apply artifacts and a short stdout summary.",
    )
    plan_and_render.add_argument("--skill-root", required=True, type=Path, help="ad-config-ops skill root.")
    plan_and_render.add_argument("--bundle", type=Path, help="Filled bundle YAML. Defaults to TMP_FILE when set.")
    plan_and_render.add_argument(
        "--workdir",
        type=Path,
        help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.",
    )

    status = subparsers.add_parser(
        "status",
        help="Summarize current ad-config-ops artifacts and workflow guardrails without reading artifact contents.",
    )
    status.add_argument(
        "--workdir",
        type=Path,
        help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.",
    )

    summarize_plan = subparsers.add_parser(
        "summarize-plan",
        help="Summarize an operation plan without exposing payload content.",
    )
    summarize_plan.add_argument("--plan", type=Path, help="Operation plan JSON path. Defaults to workdir/artifacts plan.")
    summarize_plan.add_argument(
        "--workdir",
        type=Path,
        help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.",
    )

    apply_slb = subparsers.add_parser(
        "apply-slb-plan",
        help="Apply a rendered SLB plan, write execution/rollback artifacts, and verify resources on the AD device.",
    )
    apply_slb.add_argument("--plan", type=Path, help="Operation plan JSON path. Defaults to workdir/artifacts plan.")
    apply_slb.add_argument("--host", required=True, help="AD device host or base URL.")
    apply_slb.add_argument("--username", required=True, help="AD API username.")
    apply_slb.add_argument("--password", default=os.environ.get("AD_PASSWORD"), help="AD API password. Defaults to AD_PASSWORD.")
    apply_slb.add_argument("--allow-existing", action="store_true", help="Allow create operations when target exists.")
    apply_slb.add_argument("--vs-name", help="Virtual service name to verify after apply.")
    apply_slb.add_argument("--pool-name", help="Pool name to verify after apply.")
    apply_slb.add_argument("--node-ip", action="append", default=[], help="Backend node IP to verify after apply.")
    apply_slb.add_argument("--http-profile", help="HTTP profile name to verify after apply.")
    apply_slb.add_argument("--pre-rule", help="HTTP pre-rule name to verify after apply.")
    apply_slb.add_argument(
        "--workdir",
        type=Path,
        help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.",
    )
    return parser.parse_args(argv)


def plan_and_render(args: argparse.Namespace) -> dict[str, object]:
    bundle_path = resolve_file_path(args.bundle, "bundle YAML")
    workdir = require_workdir(args.workdir)
    paths = skill_paths(args.skill_root)
    index = read_json(paths.references / "api-index.json")
    plan = build_bundle_plan(index, definition_map(index), bundle_path, load_resource_order(paths.root))

    plan_path = workdir / DEFAULT_PLAN_NAME
    batch_path = workdir / DEFAULT_BATCH_NAME
    script_path = workdir / DEFAULT_APPLY_SCRIPT_NAME
    rollback_script_path = workdir / DEFAULT_ROLLBACK_SCRIPT_NAME
    write_json(plan_path, plan)
    write_json(batch_path, render_batch(plan))
    script_path.write_text(render_script(plan), encoding="utf-8")
    rollback_script_path.write_text(render_rollback_script(), encoding="utf-8")
    artifacts = update_artifacts(
        workdir,
        bundle=bundle_path,
        plan=plan_path,
        batch=batch_path,
        apply_script=script_path,
        rollback_script=rollback_script_path,
    )
    return {
        "ok": True,
        "operation_count": operation_count(plan),
        "bundle": str(bundle_path),
        "plan": str(plan_path),
        "batch": str(batch_path),
        "apply_script": str(script_path),
        "rollback_script": str(rollback_script_path),
        "artifacts": str(artifacts),
        "workflow_contract": "scripts_only",
        "must_not_parse_artifacts": True,
        "next_command": f"python3 skills/ad-config-ops/scripts/ad_ops_flow.py summarize-plan --plan {plan_path} --workdir {workdir}",
    }


def selected_workdir(path: Path | None) -> Path:
    return workdir_path(path) or default_workdir_path()


def load_artifacts(workdir: Path) -> dict[str, Any]:
    path = artifacts_path(workdir)
    if not path.exists():
        return {}
    loaded = read_json(path)
    return loaded if isinstance(loaded, dict) else {}


def status_summary(args: argparse.Namespace) -> dict[str, object]:
    workdir = selected_workdir(args.workdir)
    artifacts = load_artifacts(workdir)
    tmp_file = tmp_file_path()
    opaque_keys = {
        "bundle",
        "edit_template",
        "plan",
        "batch",
        "apply_script",
        "rollback_script",
        "execution_result",
        "rollback",
        "rollback_result",
    }
    opaque_artifacts = [
        str(value)
        for key, value in artifacts.items()
        if key in opaque_keys and isinstance(value, str)
    ]
    return {
        "ok": True,
        "workflow_contract": "scripts_only",
        "workdir": str(workdir),
        **({"tmp_file": str(tmp_file)} if tmp_file else {}),
        "artifacts": sorted(key for key in artifacts if key != "updated_at"),
        "opaque_artifacts": sorted(opaque_artifacts),
        "must_not_parse_artifacts": True,
        "required_behavior": [
            "Use script summaries as the source of truth.",
            "Do not open generated artifact files for model-side analysis.",
            "Run plan-and-render after the customer finishes the bundle.",
            "Run summarize-plan before asking for real-device validation.",
        ],
    }


def plan_path_from_args(args: argparse.Namespace) -> Path:
    if args.plan is not None:
        return args.plan.expanduser()
    workdir = selected_workdir(args.workdir)
    artifacts = load_artifacts(workdir)
    plan = artifacts.get("plan")
    if isinstance(plan, str):
        return Path(plan).expanduser()
    return workdir / DEFAULT_PLAN_NAME


def summarize_operation(operation: dict[str, Any]) -> dict[str, object]:
    summary: dict[str, object] = {}
    for key in ("id", "action"):
        value = operation.get(key)
        if value is not None:
            summary[key] = value
    method = operation.get("method")
    if isinstance(method, str):
        summary["method"] = method.upper()
    for key in ("path", "resource_path"):
        value = operation.get(key)
        if isinstance(value, str):
            summary[key] = value
    return summary


def summarize_plan(args: argparse.Namespace) -> dict[str, object]:
    plan_path = plan_path_from_args(args)
    plan = read_json(plan_path)
    operations = plan.get("operations")
    if not isinstance(operations, list):
        operations = []
    verify = plan.get("verify")
    if not isinstance(verify, list):
        verify = []
    return {
        "ok": True,
        "plan": str(plan_path),
        "operation_count": len(operations),
        "operations": [
            summarize_operation(operation)
            for operation in operations
            if isinstance(operation, dict)
        ],
        "verify_count": len(verify),
        "workflow_contract": "scripts_only",
        "must_not_parse_artifacts": True,
        "next_user_prompt": "Ask the user whether to enter real-device validation.",
    }


def verify_args_for_apply(args: argparse.Namespace) -> list[str]:
    values = [
        "--base-url",
        args.host,
        "--username",
        args.username,
        "--password",
        args.password,
        "--expect",
        "present",
    ]
    if args.vs_name:
        values += ["--vs-name", args.vs_name]
    if args.pool_name:
        values += ["--pool-name", args.pool_name]
    for node_ip in args.node_ip or []:
        values += ["--node-ip", node_ip]
    if args.http_profile:
        values += ["--http-profile", args.http_profile]
    if args.pre_rule:
        values += ["--pre-rule", args.pre_rule]
    return values


def apply_slb_plan(args: argparse.Namespace) -> dict[str, object]:
    plan_path = plan_path_from_args(args)
    plan = read_json(plan_path)
    workdir = require_workdir(args.workdir)
    if args.password is None:
        raise ValueError("--password or AD_PASSWORD is required")
    result_path = workdir / DEFAULT_EXECUTE_RESULT_NAME
    rollback_path = workdir / DEFAULT_ROLLBACK_NAME
    auth = {"host": args.host, "username": args.username, "password": args.password, "token": None}
    result = execute_plan(
        plan=plan,
        session=requests.Session(),
        base_url=normalize_base_url(args.host),
        auth=auth,
        execute=True,
        rollback_out=rollback_path,
        allow_existing=args.allow_existing,
    )
    write_json(result_path, result)
    verify_result: dict[str, Any] | None = None
    verify_error: str | None = None
    if args.vs_name or args.pool_name or args.node_ip or args.http_profile or args.pre_rule:
        try:
            verify_result = verify_resources(parse_verify_args(verify_args_for_apply(args)))
        except Exception as exc:
            verify_error = str(exc)
    artifacts = update_artifacts(
        workdir,
        plan=plan_path,
        apply_script=workdir / DEFAULT_APPLY_SCRIPT_NAME,
        rollback_script=workdir / DEFAULT_ROLLBACK_SCRIPT_NAME,
        execution_result=result_path,
        rollback=rollback_path,
    )
    summary = summarize_result(result, plan, result_path, rollback_path)
    summary.update(
        {
            "verify_result": verify_result,
            "verify_error": verify_error,
            "verify_script": "verify_slb_resource.py" if verify_result is not None else None,
            "apply_script": str(workdir / DEFAULT_APPLY_SCRIPT_NAME),
            "rollback_script": str(workdir / DEFAULT_ROLLBACK_SCRIPT_NAME),
            "artifacts": str(artifacts),
            "workflow_contract": "scripts_only",
            "rollback_generated": rollback_path.exists(),
        }
    )
    if verify_result is not None and not verify_result.get("ok"):
        summary["ok"] = False
    if verify_error:
        summary["ok"] = False
    return summary


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        if args.command == "plan-and-render":
            summary = plan_and_render(args)
        elif args.command == "status":
            summary = status_summary(args)
        elif args.command == "summarize-plan":
            summary = summarize_plan(args)
        elif args.command == "apply-slb-plan":
            summary = apply_slb_plan(args)
        else:
            raise ValueError(f"unsupported command: {args.command}")
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(short_summary(**summary), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
