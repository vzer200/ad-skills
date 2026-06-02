#!/usr/bin/env python3
"""Package the standalone sangfor-cli skill with release gates."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_ROOT = SCRIPT_DIR.parent
WORKSPACE_ROOT = SKILL_ROOT.parents[1] if len(SKILL_ROOT.parents) > 1 else Path.cwd()
DEFAULT_OUT = WORKSPACE_ROOT / "sangfor-cli.zip"


def run_step(name: str, args: list[str], timeout: int) -> dict[str, object]:
    completed = subprocess.run(
        args,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
    )
    result = {
        "name": name,
        "exit_code": completed.returncode,
        "stdout_tail": completed.stdout[-4000:],
        "stderr_tail": completed.stderr[-4000:],
    }
    if completed.returncode != 0:
        raise RuntimeError(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def write_zip(out: Path) -> list[str]:
    if out.exists():
        out.unlink()
    out.parent.mkdir(parents=True, exist_ok=True)
    names: list[str] = []
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(SKILL_ROOT.rglob("*")):
            if path.is_dir():
                continue
            if "__pycache__" in path.parts or ".pytest_cache" in path.parts:
                continue
            arcname = (Path("sangfor-cli") / path.relative_to(SKILL_ROOT)).as_posix()
            archive.write(path, arcname)
            names.append(arcname)
    return names


def smoke_zip(out: Path, quick_selftest: bool) -> dict[str, object]:
    extract_dir = Path(tempfile.mkdtemp(prefix="sangfor-cli-zip-smoke-"))
    try:
        with zipfile.ZipFile(out) as archive:
            names = archive.namelist()
            bad_separators = [name for name in names if "\\" in name]
            archive.extractall(extract_dir)
        script = extract_dir / "sangfor-cli" / "scripts" / "sangfor_cli.py"
        selftest = extract_dir / "sangfor-cli" / "scripts" / "selftest_sangfor_cli.py"
        overrides = extract_dir / "sangfor-cli" / "references" / "cli_overrides.json"
        semantic_aliases = extract_dir / "sangfor-cli" / "references" / "semantic_aliases.json"
        skill_doc = extract_dir / "sangfor-cli" / "SKILL.md"
        overrides_text = overrides.read_text(encoding="utf-8") if overrides.exists() else ""
        aliases_text = semantic_aliases.read_text(encoding="utf-8") if semantic_aliases.exists() else ""
        skill_text = skill_doc.read_text(encoding="utf-8") if skill_doc.exists() else ""
        valid = subprocess.run(
            [
                sys.executable,
                str(script),
                "format",
                "sfcli modify sys passwd-policy login_protect { state enable }",
            ],
            text=True,
            capture_output=True,
        )
        rejected = subprocess.run(
            [sys.executable, str(script), "format", "sfcli list sys management; echo PWNED"],
            text=True,
            capture_output=True,
        )
        semantic = subprocess.run(
            [
                sys.executable,
                str(script),
                "format",
                "sfcli modify slb virtual-service VS_0 http_sched_mode 首个请求",
            ],
            text=True,
            capture_output=True,
        )
        batch_file = extract_dir / "commands.sfcli"
        batch_file.write_text(
            "sfcli modify slb virtual-service VS_1 tcp_profile test\n"
            "sfcli modify slb virtual-service VS_2 http_sched_mode 首个请求\n",
            encoding="utf-8",
        )
        batch_run = subprocess.run(
            [sys.executable, str(script), "run", "--file", str(batch_file), "--confirm-reviewed"],
            text=True,
            capture_output=True,
        )
        selftest_args = [sys.executable, str(selftest)]
        if quick_selftest:
            selftest_args.append("--quick")
        test = subprocess.run(selftest_args, text=True, capture_output=True, timeout=900)
        return {
            "entries": len(names),
            "bad_separators": bad_separators,
            "has_selftest": "sangfor-cli/scripts/selftest_sangfor_cli.py" in names,
            "valid_object_exit": valid.returncode,
            "injection_rejected": rejected.returncode != 0,
            "semantic_alias_present": all(
                text in aliases_text for text in ("http_sched_mode", "首个请求", "connection")
            ),
            "semantic_alias_exit": semantic.returncode,
            "semantic_alias_output": semantic.stdout[-500:],
            "batch_sfcli_f_exit": batch_run.returncode,
            "batch_sfcli_f_output": batch_run.stdout[-800:],
            "force_override_present": all(
                text in overrides_text for text in ("command_suffix_rewrites", "force", "强制提交")
            ),
            "force_doc_present": all(text in skill_text for text in ("强制提交", "force", "learn --bad")),
            "zip_selftest_exit": test.returncode,
            "zip_selftest_tail": test.stdout[-1000:],
        }
    finally:
        shutil.rmtree(extract_dir, ignore_errors=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run gates and package standalone sangfor-cli.zip.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--quick", action="store_true", help="Run quick selftest instead of the full release selftest.")
    parser.add_argument("--skip-validate", action="store_true")
    args = parser.parse_args(argv)

    scripts = [
        SCRIPT_DIR / "sangfor_cli.py",
        SCRIPT_DIR / "build_cli_model.py",
        SCRIPT_DIR / "validate_cli_model.py",
        SCRIPT_DIR / "selftest_sangfor_cli.py",
        SCRIPT_DIR / "package_sangfor_cli.py",
    ]
    steps = [
        run_step("py_compile", [sys.executable, "-m", "py_compile", *[str(path) for path in scripts]], 120)
    ]
    api_index = WORKSPACE_ROOT / ".claude" / "skills" / "ad-config-ops" / "references" / "api-index.json"
    if not args.skip_validate and api_index.exists():
        steps.append(
            run_step(
                "validate_cli_model",
                [
                    sys.executable,
                    str(SCRIPT_DIR / "validate_cli_model.py"),
                    "--model",
                    str(SKILL_ROOT / "references" / "cli_model.jsonl"),
                    "--api-index",
                    str(api_index),
                ],
                600,
            )
        )
    selftest_args = [sys.executable, str(SCRIPT_DIR / "selftest_sangfor_cli.py")]
    if args.quick:
        selftest_args.append("--quick")
    steps.append(run_step("selftest", selftest_args, 900))
    names = write_zip(args.out)
    smoke = smoke_zip(args.out, quick_selftest=True)
    ok = (
        not smoke["bad_separators"]
        and smoke["has_selftest"]
        and smoke["valid_object_exit"] == 0
        and smoke["injection_rejected"]
        and smoke["semantic_alias_present"]
        and smoke["semantic_alias_exit"] == 0
        and "http_sched_mode connection" in str(smoke["semantic_alias_output"])
        and smoke["batch_sfcli_f_exit"] == 0
        and "sfcli -f" in str(smoke["batch_sfcli_f_output"])
        and smoke["force_override_present"]
        and smoke["force_doc_present"]
        and smoke["zip_selftest_exit"] == 0
    )
    result = {
        "ok": ok,
        "zip": str(args.out.resolve()),
        "size": args.out.stat().st_size,
        "entries": len(names),
        "steps": steps,
        "smoke": smoke,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
