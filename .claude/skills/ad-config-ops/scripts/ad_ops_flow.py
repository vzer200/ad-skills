from __future__ import annotations

import argparse
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
    DEFAULT_ROLLBACK_APPLY_SCRIPT_NAME,
    DEFAULT_ROLLBACK_NAME,
    DEFAULT_ROLLBACK_RESULT_NAME,
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
from dependency_order import load_resource_order
from plan_operations import build_bundle_plan
from render_outputs import render_batch, render_rollback_script, render_script
from resolve_schema import definition_map


DEFAULT_REQUEST_TIMEOUT = (5, 30)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run low-token AD-OPS artifact workflows.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    plan_and_render = subparsers.add_parser(
        "plan-and-render",
        help="Read a filled bundle YAML, then write plan/batch/apply artifacts and a short stdout summary.",
    )
    plan_and_render.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root.")
    plan_and_render.add_argument("--bundle", type=Path, help="Filled bundle YAML. Defaults to TMP_FILE when set.")
    plan_and_render.add_argument(
        "--workdir",
        type=Path,
        help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.",
    )

    status = subparsers.add_parser(
        "status",
        help="Summarize current AD-OPS artifacts and workflow guardrails without reading artifact contents.",
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

    preflight = subparsers.add_parser(
        "preflight-slb-plan",
        help="Run read-only GET preflight checks for a rendered SLB plan.",
    )
    add_plan_arg(preflight)
    add_device_args(preflight)
    preflight.add_argument("--result-out", type=Path, help="Preflight result JSON path.")
    add_workdir_arg(preflight)
    add_timeout_args(preflight)

    apply = subparsers.add_parser(
        "apply-slb-plan",
        help="Apply a rendered SLB plan and write execution plus rollback artifacts.",
    )
    add_plan_arg(apply)
    add_device_args(apply)
    apply.add_argument("--allow-existing", action="store_true", help="Allow create operations whose targets already exist.")
    apply.add_argument("--result-out", type=Path, help="Execution result JSON path.")
    apply.add_argument("--rollback-out", type=Path, help="Rollback manifest JSON path.")
    add_workdir_arg(apply)
    add_timeout_args(apply)

    rollback = subparsers.add_parser(
        "rollback-and-verify",
        help="Execute rollback from the current rollback manifest and verify the result.",
    )
    rollback.add_argument("--manifest", type=Path, help="Rollback manifest JSON path. Defaults to workdir artifact.")
    add_device_args(rollback)
    rollback.add_argument("--result-out", type=Path, help="Rollback result JSON path.")
    add_workdir_arg(rollback)
    add_timeout_args(rollback)
    return parser.parse_args(argv)


def add_workdir_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--workdir",
        type=Path,
        help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.",
    )


def add_plan_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--plan", type=Path, help="Operation plan JSON path. Defaults to workdir/artifacts plan.")


def add_device_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--devices", type=Path, help="devices.json path for selecting a named device.")
    parser.add_argument("--device", help="Device name or host selector in devices.json.")
    parser.add_argument("--host", help="AD device host, host:port, or URL.")
    parser.add_argument("--username", help="AD API username.")
    parser.add_argument("--password", help="AD API password.")
    parser.add_argument("--token", help="Existing AD API token.")


def add_timeout_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--connect-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[0], help="Connect timeout in seconds.")
    parser.add_argument("--read-timeout", type=float, default=DEFAULT_REQUEST_TIMEOUT[1], help="Read timeout in seconds.")


def plan_and_render(args: argparse.Namespace) -> dict[str, object]:
    bundle_path = resolve_file_path(args.bundle, "bundle YAML")
    workdir = require_workdir(args.workdir)
    paths = skill_paths(args.skill_root)
    index = read_json(paths.references / "api-index.json")
    plan = build_bundle_plan(index, definition_map(index), bundle_path, load_resource_order(paths.root))

    plan_path = workdir / DEFAULT_PLAN_NAME
    batch_path = workdir / DEFAULT_BATCH_NAME
    script_path = workdir / DEFAULT_APPLY_SCRIPT_NAME
    rollback_script_path = workdir / DEFAULT_ROLLBACK_APPLY_SCRIPT_NAME
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
        "interface_adapter",
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


def authenticated_session(args: argparse.Namespace) -> tuple[requests.Session, str, dict[str, Any]]:
    import requests
    from device_config import normalize_base_url, resolve_device_connection
    from execute_plan import configure_session

    auth = resolve_device_connection(args)
    if not auth.get("host"):
        raise ValueError("--device/--devices or --host is required")
    if not auth.get("token") and not auth.get("username"):
        raise ValueError("--username or --token is required when devices.json is not used")
    session = requests.Session()
    configure_session(session, auth)
    return session, normalize_base_url(auth["host"]), auth


def preflight_plan(args: argparse.Namespace) -> dict[str, object]:
    from execute_plan import ALL_PROPERTIES_PARAMS, request, resource_path, response_payload

    workdir = selected_workdir(args.workdir)
    plan_path = plan_path_from_args(args)
    plan = read_json(plan_path)
    session, base_url, auth = authenticated_session(args)
    timeout = (args.connect_timeout, args.read_timeout)
    results: list[dict[str, object]] = []
    for operation in plan.get("operations", []) or []:
        if not isinstance(operation, dict):
            continue
        action = str(operation.get("action", "")).lower()
        target_path = resource_path(operation)
        response = request(session, base_url, "GET", target_path, params=ALL_PROPERTIES_PARAMS, timeout=timeout)
        result: dict[str, object] = {
            "id": operation.get("id"),
            "action": action,
            "path": target_path,
            "status": response.status_code,
        }
        if action == "create":
            result["ok"] = response.ok or response.status_code == 404
            result["state"] = "exists_reuse" if response.ok else ("missing_create" if response.status_code == 404 else "error")
        elif action in {"patch", "replace", "delete"}:
            result["ok"] = response.ok
            result["state"] = "exists_required" if response.ok else "missing_or_error"
        else:
            result["ok"] = False
            result["state"] = "unsupported_action"
        if response.ok:
            result["snapshot"] = response_payload(response)
        results.append(result)
    failed = [item for item in results if not item.get("ok")]
    existing = [item for item in results if item.get("state") in {"exists_reuse", "exists_required"}]
    missing_create = [item for item in results if item.get("state") == "missing_create"]
    result_out = args.result_out or (workdir / "adops-preflight.json")
    write_json(result_out, {"ok": not failed, "plan": str(plan_path), "device": auth.get("name") or auth.get("host"), "results": results})
    artifacts = update_artifacts(workdir, plan=plan_path, preflight=result_out)
    return {
        "ok": not failed,
        "command": "preflight-slb-plan",
        "plan": str(plan_path),
        "result": str(result_out),
        "operation_count": len(results),
        "existing_count": len(existing),
        "missing_create_count": len(missing_create),
        "failed_count": len(failed),
        "artifacts": str(artifacts) if artifacts else "",
        "workflow_contract": "scripts_only",
        "must_not_parse_artifacts": True,
    }


def apply_slb_plan(args: argparse.Namespace) -> dict[str, object]:
    from execute_plan import execute_plan

    workdir = selected_workdir(args.workdir)
    plan_path = plan_path_from_args(args)
    plan = read_json(plan_path)
    session, base_url, auth = authenticated_session(args)
    result_out = args.result_out or (workdir / DEFAULT_EXECUTE_RESULT_NAME)
    rollback_out = args.rollback_out or (workdir / DEFAULT_ROLLBACK_NAME)
    result = execute_plan(
        plan=plan,
        session=session,
        base_url=base_url,
        auth=auth,
        execute=True,
        rollback_out=rollback_out,
        allow_existing=args.allow_existing,
        timeout=(args.connect_timeout, args.read_timeout),
    )
    write_json(result_out, result)
    artifacts = update_artifacts(workdir, plan=plan_path, execution_result=result_out, rollback=rollback_out)
    verify = result.get("verify") if isinstance(result.get("verify"), list) else []
    failed_verify = [item for item in verify if not item.get("ok")]
    return {
        "ok": result.get("ok"),
        "command": "apply-slb-plan",
        "mode": result.get("mode"),
        "operation_count": operation_count(plan),
        "executed_count": len(result.get("executed") or []),
        "verify_failed_count": len(failed_verify),
        "result": str(result_out),
        "rollback": str(rollback_out),
        "artifacts": str(artifacts) if artifacts else "",
        **({"error": result["error"]} if result.get("error") else {}),
    }


def rollback_path_from_args(args: argparse.Namespace) -> Path:
    if args.manifest is not None:
        return args.manifest.expanduser()
    workdir = selected_workdir(args.workdir)
    artifacts = load_artifacts(workdir)
    rollback = artifacts.get("rollback")
    if isinstance(rollback, str):
        return Path(rollback).expanduser()
    return workdir / DEFAULT_ROLLBACK_NAME


def rollback_and_verify(args: argparse.Namespace) -> dict[str, object]:
    from rollback import rollback_manifest

    workdir = selected_workdir(args.workdir)
    manifest_path = rollback_path_from_args(args)
    manifest = read_json(manifest_path)
    session, base_url, auth = authenticated_session(args)
    result_out = args.result_out or (workdir / DEFAULT_ROLLBACK_RESULT_NAME)
    result = rollback_manifest(
        manifest=manifest,
        session=session,
        base_url=base_url,
        auth=auth,
        execute=True,
        timeout=(args.connect_timeout, args.read_timeout),
    )
    write_json(result_out, result)
    artifacts = update_artifacts(workdir, rollback=manifest_path, rollback_result=result_out)
    results = result.get("results") if isinstance(result.get("results"), list) else []
    failed = [item for item in results if not (item.get("verify") or {}).get("ok", result.get("ok"))]
    return {
        "ok": result.get("ok"),
        "command": "rollback-and-verify",
        "action_count": len(manifest.get("actions") or []),
        "executed_count": len(results),
        "verify_failed_count": len(failed),
        "result": str(result_out),
        "artifacts": str(artifacts) if artifacts else "",
        **({"error": result["error"]} if result.get("error") else {}),
    }


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        if args.command == "plan-and-render":
            summary = plan_and_render(args)
        elif args.command == "status":
            summary = status_summary(args)
        elif args.command == "summarize-plan":
            summary = summarize_plan(args)
        elif args.command == "preflight-slb-plan":
            summary = preflight_plan(args)
        elif args.command == "apply-slb-plan":
            summary = apply_slb_plan(args)
        elif args.command == "rollback-and-verify":
            summary = rollback_and_verify(args)
        else:
            raise ValueError(f"unsupported command: {args.command}")
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(short_summary(**summary), end="")
    return 0 if summary.get("ok", True) else 1


if __name__ == "__main__":
    raise SystemExit(main())
