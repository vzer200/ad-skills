from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import (
    DEFAULT_APPLY_SCRIPT_NAME,
    DEFAULT_BATCH_NAME,
    DEFAULT_BUNDLE_NAME,
    DEFAULT_EFFECTIVE_PLAN_NAME,
    DEFAULT_EXECUTE_RESULT_NAME,
    DEFAULT_PLAN_NAME,
    DEFAULT_POST_APPLY_NAME,
    DEFAULT_POST_ROLLBACK_NAME,
    DEFAULT_PREFLIGHT_NAME,
    DEFAULT_ROLLBACK_NAME,
    DEFAULT_ROLLBACK_COMPARE_NAME,
    DEFAULT_ROLLBACK_RESULT_NAME,
    DEFAULT_ROLLBACK_SCRIPT_NAME,
    artifacts_path,
    default_workdir_path,
    operation_count,
    read_json,
    remove_generated_artifacts,
    require_workdir,
    resolve_file_path,
    short_summary,
    skill_paths,
    tmp_file_path,
    update_artifacts,
    utc_now_iso,
    workdir_path,
    write_json,
)
from ad_http import normalize_base_url, requests
from compare_state import compare_expected
from dependency_order import load_resource_order
from execute_plan import (
    ALL_PROPERTIES_PARAMS,
    DEFAULT_REQUEST_TIMEOUT,
    configure_session,
    execute_plan,
    request,
    resource_path,
    summarize_result,
)
from plan_operations import build_bundle_plan
from render_outputs import render_batch, render_rollback_script, render_script
from resolve_schema import definition_map
from rollback import rollback_manifest, summarize_rollback
from verify_slb_resource import parse_args as parse_verify_args
from verify_slb_resource import verify_resources


def workbot_output_dir() -> Path | None:
    configured = os.environ.get("AD_OPS_OUTPUT_DIR") or os.environ.get("WORKBOT_OUTPUT_DIR")
    output_dir = Path(configured) if configured else Path("/opt/agent/data/outputs")
    if not configured and not output_dir.parent.exists():
        return None
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def mirror_user_outputs(**paths: Path | None) -> dict[str, str]:
    output_dir = workbot_output_dir()
    if output_dir is None:
        return {}
    mirrored: dict[str, str] = {}
    for key, source in paths.items():
        if source is None:
            continue
        source = Path(source)
        if not source.exists() or not source.is_file():
            continue
        target = output_dir / source.name
        shutil.copy2(source, target)
        mirrored[key] = str(target)
    return mirrored


def visible_user_deliverables(workdir: Path, user_outputs: dict[str, str] | None = None) -> dict[str, str]:
    user_outputs = user_outputs or {}
    return {
        "adops-bundle.yml": user_outputs.get("bundle") or str(workdir / DEFAULT_BUNDLE_NAME),
        "apply.py": user_outputs.get("apply_script") or str(workdir / DEFAULT_APPLY_SCRIPT_NAME),
        "rollback_apply.py": user_outputs.get("rollback_script") or str(workdir / DEFAULT_ROLLBACK_SCRIPT_NAME),
    }


def deliverable_guidance(workdir: Path, user_outputs: dict[str, str] | None = None) -> dict[str, object]:
    return {
        "visible_deliverables": visible_user_deliverables(workdir, user_outputs),
        "deliverable_purposes": {
            "adops-bundle.yml": "本次配置编排的 YAML 源文件，用于复核需求或重新生成脚本。",
            "apply.py": "正向下发脚本，用于把本次 YAML 对应的配置写入目标 AD 设备。",
            "rollback_apply.py": "回滚脚本，用于撤销本次正向下发产生的配置变更。",
        },
        "script_usage": [
            "确认要写入设备时，使用 apply.py；脚本默认不会下发，必须显式进入执行模式后才会修改设备。",
            "下发后不符合预期或需要撤销时，使用 rollback_apply.py 回滚本次变更。",
            "两类脚本都应使用同一台目标设备和本次生成的产出物，不要混用旧 workdir 或旧 YAML。",
        ],
    }


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

    preflight_slb = subparsers.add_parser(
        "preflight-slb-plan",
        help="GET target resources from a rendered SLB plan, reuse same-name existing resources, and render effective scripts.",
    )
    preflight_slb.add_argument("--plan", type=Path, help="Operation plan JSON path. Defaults to workdir/artifacts plan.")
    preflight_slb.add_argument("--host", required=True, help="AD device host or base URL.")
    preflight_slb.add_argument("--username", required=True, help="AD API username.")
    preflight_slb.add_argument("--password", default=os.environ.get("AD_PASSWORD"), help="AD API password. Defaults to AD_PASSWORD.")
    preflight_slb.add_argument(
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

    rollback_verify = subparsers.add_parser(
        "rollback-and-verify",
        help="Execute rollback, GET target resources again, and compare with the pre-apply baseline.",
    )
    rollback_verify.add_argument("--manifest", type=Path, help="Rollback manifest JSON path. Defaults to workdir/artifacts rollback.")
    rollback_verify.add_argument("--baseline", type=Path, help="Preflight baseline JSON path. Defaults to workdir/artifacts preflight.")
    rollback_verify.add_argument("--host", required=True, help="AD device host or base URL.")
    rollback_verify.add_argument("--username", required=True, help="AD API username.")
    rollback_verify.add_argument("--password", default=os.environ.get("AD_PASSWORD"), help="AD API password. Defaults to AD_PASSWORD.")
    rollback_verify.add_argument(
        "--workdir",
        type=Path,
        help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.",
    )
    return parser.parse_args(argv)


def plan_and_render(args: argparse.Namespace) -> dict[str, object]:
    bundle_path = resolve_file_path(args.bundle, "bundle YAML")
    workdir = require_workdir(args.workdir)
    cleaned = remove_generated_artifacts(workdir, keep={bundle_path})
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
    user_outputs = mirror_user_outputs(
        bundle=bundle_path,
        apply_script=script_path,
        rollback_script=rollback_script_path,
    )
    guidance = deliverable_guidance(workdir, user_outputs)
    return {
        "ok": True,
        "cleaned_count": len(cleaned),
        "operation_count": operation_count(plan),
        "bundle": str(bundle_path),
        "plan": str(plan_path),
        "batch": str(batch_path),
        "apply_script": str(script_path),
        "rollback_script": str(rollback_script_path),
        "artifacts": str(artifacts),
        "user_outputs": user_outputs,
        **guidance,
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
        "effective_plan",
        "batch",
        "apply_script",
        "rollback_script",
        "preflight",
        "post_apply",
        "post_rollback",
        "rollback_compare",
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


def manifest_path_from_args(args: argparse.Namespace) -> Path:
    if args.manifest is not None:
        return args.manifest.expanduser()
    workdir = selected_workdir(args.workdir)
    artifacts = load_artifacts(workdir)
    rollback = artifacts.get("rollback")
    if isinstance(rollback, str):
        return Path(rollback).expanduser()
    return workdir / DEFAULT_ROLLBACK_NAME


def baseline_path_from_args(args: argparse.Namespace) -> Path:
    if args.baseline is not None:
        return args.baseline.expanduser()
    workdir = selected_workdir(args.workdir)
    artifacts = load_artifacts(workdir)
    preflight = artifacts.get("preflight")
    if isinstance(preflight, str):
        return Path(preflight).expanduser()
    return workdir / DEFAULT_PREFLIGHT_NAME


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


def response_payload(response: Any) -> Any:
    try:
        return response.json()
    except Exception:
        return None


def json_digest(value: Any) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def workflow_source(
    *,
    base_url: str,
    username: str | None,
    plan: dict[str, Any] | None = None,
    effective_plan: dict[str, Any] | None = None,
) -> dict[str, Any]:
    source: dict[str, Any] = {
        "base_url": normalize_base_url(base_url),
        "username": username,
        "created_at": utc_now_iso(),
    }
    if plan is not None:
        source["plan_sha256"] = json_digest(plan)
    if effective_plan is not None:
        source["effective_plan_sha256"] = json_digest(effective_plan)
    return source


def validate_workflow_source(name: str, source: Any, *, base_url: str, plan_sha256: str | None = None) -> None:
    if not isinstance(source, dict):
        return
    source_base_url = source.get("base_url")
    if source_base_url and normalize_base_url(str(source_base_url)) != normalize_base_url(base_url):
        raise ValueError(f"{name} belongs to {source_base_url}, not {base_url}")
    source_plan_sha256 = source.get("plan_sha256")
    if plan_sha256 and source_plan_sha256 and source_plan_sha256 != plan_sha256:
        raise ValueError(f"{name} does not match the preflight baseline plan")


def annotate_rollback_manifest(path: Path, *, source: dict[str, Any], baseline_path: Path, effective_plan_path: Path) -> None:
    if not path.exists():
        return
    manifest = read_json(path)
    if not isinstance(manifest, dict):
        return
    manifest["source"] = {
        **source,
        "baseline": str(baseline_path),
        "effective_plan": str(effective_plan_path),
    }
    write_json(path, manifest)


def auth_from_args(args: argparse.Namespace) -> dict[str, Any]:
    password = getattr(args, "password", None)
    if password is None:
        raise ValueError("--password or AD_PASSWORD is required")
    return {"host": args.host, "username": args.username, "password": password, "token": None}


REFERENCE_RESOURCE_PATHS = {
    "pool": "/api/ad/v3/slb/pool/{name}",
    "http_profile": "/api/ad/v3/slb/http-profile/{name}",
    "pre_rule_http": "/api/ad/v3/slb/pre-rule/http/{name}",
}


def _reference_operation(kind: str, name: Any, source_operation: dict[str, Any]) -> dict[str, Any] | None:
    if not isinstance(name, str) or not name.strip():
        return None
    resource_template = REFERENCE_RESOURCE_PATHS.get(kind)
    if not resource_template:
        return None
    clean_name = name.strip()
    return {
        "id": f"reference-{kind}-{clean_name}",
        "action": "reference",
        "method": "GET",
        "resource_path": resource_template,
        "path_parameters": {"name": clean_name},
        "name": clean_name,
        "reference_kind": kind,
        "reference_from": source_operation.get("id"),
        "payload": {"name": clean_name},
    }


def referenced_operations(plan: dict[str, Any]) -> list[dict[str, Any]]:
    """Return referenced SLB resources that are not explicit operation targets."""
    target_paths = {resource_path(operation) for operation in unique_operations(plan)}
    seen: set[str] = set(target_paths)
    refs: list[dict[str, Any]] = []

    def add(kind: str, name: Any, source_operation: dict[str, Any]) -> None:
        ref = _reference_operation(kind, name, source_operation)
        if ref is None:
            return
        target_path = resource_path(ref)
        if target_path in seen:
            return
        seen.add(target_path)
        refs.append(ref)

    for operation in plan.get("operations", []) or []:
        if not isinstance(operation, dict):
            continue
        payload = operation.get("payload")
        if not isinstance(payload, dict):
            continue
        add("pool", payload.get("pool"), operation)
        add("http_profile", payload.get("http_profile"), operation)
        pre_rules = payload.get("pre_rules")
        if isinstance(pre_rules, list):
            for name in pre_rules:
                add("pre_rule_http", name, operation)
        add("pool", payload.get("sched_pool"), operation)

    return refs


def unique_operations(plan: dict[str, Any]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for operation in plan.get("operations", []) or []:
        if not isinstance(operation, dict):
            continue
        target_path = resource_path(operation)
        if target_path in seen:
            continue
        seen.add(target_path)
        unique.append(operation)
    return unique


def capture_target_state(
    plan: dict[str, Any],
    session: Any,
    base_url: str,
    *,
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    for operation in unique_operations(plan) + referenced_operations(plan):
        target_path = resource_path(operation)
        response = request(
            session,
            base_url,
            "GET",
            target_path,
            params=ALL_PROPERTIES_PARAMS,
            timeout=timeout,
        )
        found = bool(getattr(response, "ok", False))
        check: dict[str, Any] = {
            "operation_id": operation.get("id"),
            "action": operation.get("action"),
            "method": "GET",
            "target_path": target_path,
            "status": getattr(response, "status_code", None),
            "found": found,
        }
        if found:
            check["payload"] = response_payload(response)
        elif getattr(response, "text", ""):
            check["error"] = response.text
        action = str(operation.get("action", "")).lower()
        is_reference = str(operation.get("action", "")).lower() == "reference"
        if is_reference:
            check["reference_required"] = True
            check["reference_kind"] = operation.get("reference_kind")
            check["reference_from"] = operation.get("reference_from")
        requires_existing = action in {"patch", "replace", "delete"}
        missing_existing_target = requires_existing and not found and getattr(response, "status_code", None) == 404
        if (
            (is_reference and not found)
            or missing_existing_target
            or (requires_existing and not found)
            or (not found and getattr(response, "status_code", None) != 404)
        ):
            errors.append(
                {
                    "operation_id": operation.get("id"),
                    "target_path": target_path,
                    "status": getattr(response, "status_code", None),
                    "error": (
                        f"{action} target resource not found"
                        if missing_existing_target
                        else check.get("error") or ("referenced resource not found" if is_reference else None)
                    ),
                }
            )
        if action == "create" and found:
            check["reuse_existing"] = True
            check["reuse_policy"] = "same-name"
            diffs = compare_expected(operation.get("payload") or {}, check.get("payload"))
            check["compatibility_ok"] = not diffs
            check["compatibility_diff_count"] = len(diffs)
            if diffs:
                check["compatibility_diffs"] = diffs[:20]
        checks.append(check)
    return {
        "ok": not errors,
        "check_count": len(checks),
        "reused_count": sum(1 for item in checks if item.get("reuse_existing")),
        "error_count": len(errors),
        "errors": errors,
        "checks": checks,
    }


def capture_paths_state(
    baseline: dict[str, Any],
    session: Any,
    base_url: str,
    *,
    timeout: tuple[float, float] = DEFAULT_REQUEST_TIMEOUT,
) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    for item in baseline.get("checks", []) or []:
        if not isinstance(item, dict) or not isinstance(item.get("target_path"), str):
            continue
        target_path = item["target_path"]
        response = request(
            session,
            base_url,
            "GET",
            target_path,
            params=ALL_PROPERTIES_PARAMS,
            timeout=timeout,
        )
        found = bool(getattr(response, "ok", False))
        check: dict[str, Any] = {
            "operation_id": item.get("operation_id"),
            "target_path": target_path,
            "method": "GET",
            "status": getattr(response, "status_code", None),
            "found": found,
        }
        if found:
            check["payload"] = response_payload(response)
        elif getattr(response, "text", ""):
            check["error"] = response.text
        if not found and getattr(response, "status_code", None) != 404:
            errors.append(
                {
                    "operation_id": item.get("operation_id"),
                    "target_path": target_path,
                    "status": getattr(response, "status_code", None),
                    "error": check.get("error"),
                }
            )
        checks.append(check)
    return {"ok": not errors, "check_count": len(checks), "error_count": len(errors), "errors": errors, "checks": checks}


def compare_get_states(baseline: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    baseline_by_path = {
        item.get("target_path"): item
        for item in baseline.get("checks", []) or []
        if isinstance(item, dict) and isinstance(item.get("target_path"), str)
    }
    after_by_path = {
        item.get("target_path"): item
        for item in after.get("checks", []) or []
        if isinstance(item, dict) and isinstance(item.get("target_path"), str)
    }
    diffs: list[dict[str, Any]] = []
    for target_path, before in baseline_by_path.items():
        current = after_by_path.get(target_path)
        if current is None:
            diffs.append({"target_path": target_path, "diff": "missing-post-rollback-check"})
            continue
        if before.get("found") != current.get("found"):
            diffs.append(
                {
                    "target_path": target_path,
                    "diff": "found-state",
                    "baseline_found": before.get("found"),
                    "post_rollback_found": current.get("found"),
                    "baseline_status": before.get("status"),
                    "post_rollback_status": current.get("status"),
                }
            )
            continue
        if before.get("status") != current.get("status"):
            diffs.append(
                {
                    "target_path": target_path,
                    "diff": "status",
                    "baseline_status": before.get("status"),
                    "post_rollback_status": current.get("status"),
                }
            )
            continue
        if before.get("found") and before.get("payload") != current.get("payload"):
            diffs.append({"target_path": target_path, "diff": "payload"})
    return {
        "ok": not diffs,
        "checked_count": len(baseline_by_path),
        "diff_count": len(diffs),
        "diffs": diffs,
    }


def effective_plan_from_preflight(plan: dict[str, Any], preflight: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    reuse_checks = {
        item.get("target_path"): item
        for item in preflight.get("checks", []) or []
        if item.get("reuse_existing") and isinstance(item.get("target_path"), str)
    }
    effective = copy.deepcopy(plan)
    operations: list[dict[str, Any]] = []
    reused: list[dict[str, Any]] = []
    for operation in plan.get("operations", []) or []:
        if not isinstance(operation, dict):
            continue
        target_path = resource_path(operation)
        if target_path in reuse_checks and str(operation.get("action", "")).lower() == "create":
            reuse_check = reuse_checks[target_path]
            reused.append(
                {
                    "operation_id": operation.get("id"),
                    "action": operation.get("action"),
                    "target_path": target_path,
                    "reuse_policy": "same-name",
                    "compatibility_ok": reuse_check.get("compatibility_ok"),
                    "compatibility_diff_count": reuse_check.get("compatibility_diff_count", 0),
                }
            )
            continue
        operations.append(copy.deepcopy(operation))
    effective["operations"] = operations
    if isinstance(effective.get("verify"), list):
        skipped_ids = {item.get("operation_id") for item in reused}
        effective["verify"] = [
            item
            for item in effective["verify"]
            if not isinstance(item, dict) or item.get("operation_id") not in skipped_ids
        ]
    effective["reused_existing"] = reused
    return effective, reused


def render_effective_artifacts(workdir: Path, plan: dict[str, Any]) -> dict[str, Path]:
    plan_path = workdir / DEFAULT_EFFECTIVE_PLAN_NAME
    batch_path = workdir / DEFAULT_BATCH_NAME
    script_path = workdir / DEFAULT_APPLY_SCRIPT_NAME
    rollback_script_path = workdir / DEFAULT_ROLLBACK_SCRIPT_NAME
    write_json(plan_path, plan)
    write_json(batch_path, render_batch(plan))
    script_path.write_text(render_script(plan), encoding="utf-8")
    rollback_script_path.write_text(render_rollback_script(), encoding="utf-8")
    return {
        "effective_plan": plan_path,
        "batch": batch_path,
        "apply_script": script_path,
        "rollback_script": rollback_script_path,
    }


def run_preflight(
    *,
    plan: dict[str, Any],
    session: Any,
    base_url: str,
    auth: dict[str, Any],
    workdir: Path,
) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    configure_session(session, auth)
    preflight = capture_target_state(plan, session, base_url)
    preflight["source"] = workflow_source(base_url=base_url, username=auth.get("username"), plan=plan)
    preflight_path = workdir / DEFAULT_PREFLIGHT_NAME
    write_json(preflight_path, preflight)
    if not preflight.get("ok"):
        update_artifacts(workdir, preflight=preflight_path)
        raise ValueError(f"preflight GET failed for {preflight.get('error_count', 0)} target(s); see {preflight_path}")
    effective, reused = effective_plan_from_preflight(plan, preflight)
    artifact_paths = render_effective_artifacts(workdir, effective)
    artifact_paths["preflight"] = preflight_path
    update_artifacts(workdir, **artifact_paths)
    artifact_paths["user_outputs"] = mirror_user_outputs(
        bundle=workdir / "adops-bundle.yml",
        apply_script=artifact_paths["apply_script"],
        rollback_script=artifact_paths["rollback_script"],
    )
    return preflight, effective, reused, artifact_paths


def preflight_slb_plan(args: argparse.Namespace) -> dict[str, object]:
    plan_path = plan_path_from_args(args)
    plan = read_json(plan_path)
    workdir = require_workdir(args.workdir)
    cleaned = remove_generated_artifacts(workdir, keep={plan_path, workdir / DEFAULT_BUNDLE_NAME})
    auth = auth_from_args(args)
    preflight, effective, reused, artifact_paths = run_preflight(
        plan=plan,
        session=requests.Session(),
        base_url=normalize_base_url(args.host),
        auth=auth,
        workdir=workdir,
    )
    guidance = deliverable_guidance(workdir, artifact_paths.get("user_outputs", {}))
    return {
        "ok": True,
        "cleaned_count": len(cleaned),
        "plan": str(plan_path),
        "preflight": str(artifact_paths["preflight"]),
        "effective_plan": str(artifact_paths["effective_plan"]),
        "batch": str(artifact_paths["batch"]),
        "apply_script": str(artifact_paths["apply_script"]),
        "rollback_script": str(artifact_paths["rollback_script"]),
        "user_outputs": artifact_paths.get("user_outputs", {}),
        **guidance,
        "original_operation_count": operation_count(plan),
        "effective_operation_count": operation_count(effective),
        "reused_existing": reused,
        "reused_count": len(reused),
        "reuse_compatibility_warning_count": sum(1 for item in reused if item.get("compatibility_ok") is False),
        "reuse_policy": "same-name resource is reused and not overwritten; review compatibility warnings manually",
        "workflow_contract": "scripts_only",
        "next_user_prompt": "请选择：仅产出脚本结束，或下发到设备并在验证后暂停等待人工检查。",
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
    cleaned = remove_generated_artifacts(workdir, keep={plan_path, workdir / DEFAULT_BUNDLE_NAME})
    auth = auth_from_args(args)
    result_path = workdir / DEFAULT_EXECUTE_RESULT_NAME
    rollback_path = workdir / DEFAULT_ROLLBACK_NAME
    post_apply_path = workdir / DEFAULT_POST_APPLY_NAME
    session = requests.Session()
    preflight, effective_plan, reused, artifact_paths = run_preflight(
        plan=plan,
        session=session,
        base_url=normalize_base_url(args.host),
        auth=auth,
        workdir=workdir,
    )
    result = execute_plan(
        plan=effective_plan,
        session=session,
        base_url=normalize_base_url(args.host),
        auth=auth,
        execute=True,
        rollback_out=rollback_path,
        allow_existing=args.allow_existing,
    )
    annotate_rollback_manifest(
        rollback_path,
        source=workflow_source(
            base_url=normalize_base_url(args.host),
            username=args.username,
            plan=plan,
            effective_plan=effective_plan,
        ),
        baseline_path=artifact_paths["preflight"],
        effective_plan_path=artifact_paths["effective_plan"],
    )
    write_json(result_path, result)
    post_apply = capture_target_state(plan, session, normalize_base_url(args.host))
    write_json(post_apply_path, post_apply)
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
        effective_plan=artifact_paths["effective_plan"],
        batch=artifact_paths["batch"],
        apply_script=artifact_paths["apply_script"],
        rollback_script=artifact_paths["rollback_script"],
        preflight=artifact_paths["preflight"],
        post_apply=post_apply_path,
        execution_result=result_path,
        rollback=rollback_path,
    )
    summary = summarize_result(result, effective_plan, result_path, rollback_path)
    guidance = deliverable_guidance(workdir, artifact_paths.get("user_outputs", {}))
    summary.update(
        {
            "cleaned_count": len(cleaned),
            "preflight": str(artifact_paths["preflight"]),
            "post_apply": str(post_apply_path),
            "effective_plan": str(artifact_paths["effective_plan"]),
            "original_operation_count": operation_count(plan),
            "effective_operation_count": operation_count(effective_plan),
            "reused_existing": reused,
            "reuse_compatibility_warning_count": sum(1 for item in reused if item.get("compatibility_ok") is False),
            "reuse_policy": "same-name resource is reused and not overwritten; review compatibility warnings manually",
            "verify_result": verify_result,
            "verify_error": verify_error,
            "verify_script": "verify_slb_resource.py" if verify_result is not None else None,
            "apply_script": str(artifact_paths["apply_script"]),
            "rollback_script": str(artifact_paths["rollback_script"]),
            "user_outputs": artifact_paths.get("user_outputs", {}),
            "required_visible_deliverables": visible_user_deliverables(
                workdir,
                artifact_paths.get("user_outputs", {}),
            ),
            **guidance,
            "artifacts": str(artifacts),
            "workflow_contract": "deliver_then_pause",
            "rollback_generated": rollback_path.exists(),
            "hold_for_manual_check": True,
            "next_user_prompt": "请人工检查设备配置；检查完成并确认要回滚后，再运行 rollback-and-verify。",
        }
    )
    if verify_result is not None and not verify_result.get("ok"):
        summary["ok"] = False
    if verify_error:
        summary["ok"] = False
    return summary


def rollback_and_verify(args: argparse.Namespace) -> dict[str, object]:
    workdir = require_workdir(args.workdir)
    auth = auth_from_args(args)
    manifest_path = manifest_path_from_args(args)
    baseline_path = baseline_path_from_args(args)
    manifest = read_json(manifest_path)
    baseline = read_json(baseline_path)
    if int(baseline.get("check_count") or 0) <= 0:
        raise ValueError("baseline contains no GET checks; refusing rollback-and-verify")
    result_path = workdir / DEFAULT_ROLLBACK_RESULT_NAME
    post_rollback_path = workdir / DEFAULT_POST_ROLLBACK_NAME
    compare_path = workdir / DEFAULT_ROLLBACK_COMPARE_NAME
    session = requests.Session()
    base_url = normalize_base_url(args.host)
    baseline_source = baseline.get("source")
    validate_workflow_source("baseline", baseline_source, base_url=base_url)
    baseline_plan_sha256 = baseline_source.get("plan_sha256") if isinstance(baseline_source, dict) else None
    validate_workflow_source("rollback manifest", manifest.get("source"), base_url=base_url, plan_sha256=baseline_plan_sha256)
    result = rollback_manifest(
        manifest=manifest,
        session=session,
        base_url=base_url,
        auth=auth,
        execute=True,
    )
    write_json(result_path, result)
    configure_session(session, auth)
    post_rollback = capture_paths_state(baseline, session, base_url)
    compare = compare_get_states(baseline, post_rollback)
    write_json(post_rollback_path, post_rollback)
    write_json(compare_path, compare)
    artifacts = update_artifacts(
        workdir,
        rollback=manifest_path,
        rollback_result=result_path,
        post_rollback=post_rollback_path,
        rollback_compare=compare_path,
    )
    user_outputs = mirror_user_outputs(
        bundle=workdir / DEFAULT_BUNDLE_NAME,
        apply_script=workdir / DEFAULT_APPLY_SCRIPT_NAME,
        rollback_script=workdir / DEFAULT_ROLLBACK_SCRIPT_NAME,
    )
    summary = summarize_rollback(result, manifest, result_path)
    summary.update(
        {
            "baseline": str(baseline_path),
            "post_rollback": str(post_rollback_path),
            "rollback_compare": str(compare_path),
            "rollback_gets_match_preflight": compare.get("ok"),
            "rollback_compare_diff_count": compare.get("diff_count"),
            "user_outputs": user_outputs,
            "required_visible_deliverables": visible_user_deliverables(workdir, user_outputs),
            **deliverable_guidance(workdir, user_outputs),
            "artifacts": str(artifacts),
            "workflow_contract": "rollback_verify",
        }
    )
    if not post_rollback.get("ok"):
        summary["ok"] = False
        summary["error"] = "post-rollback GET verification had non-404 failures"
    if not compare.get("ok"):
        summary["ok"] = False
        summary["error"] = "post-rollback GET state does not match pre-apply baseline"
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
        elif args.command == "preflight-slb-plan":
            summary = preflight_slb_plan(args)
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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
