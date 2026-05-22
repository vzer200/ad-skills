from __future__ import annotations

import argparse
import json
import os
import shlex
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import (
    DEFAULT_BUNDLE_NAME,
    TMP_FILE_ENV,
    WORKDIR_ENV,
    generated_artifacts,
    remove_generated_artifacts,
    require_workdir,
    short_summary,
    tmp_file_path,
    update_artifacts,
    workdir_path,
    write_json,
)

ENV_JSON_NAME = "adops-env.json"
ENV_SH_NAME = "adops-env.sh"


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Initialize ad-config-ops runtime file environment.")
    parser.add_argument("--tmp-file", type=Path, help=f"Current interaction file. Defaults to TMP_FILE or workdir/{DEFAULT_BUNDLE_NAME}.")
    parser.add_argument(
        "--workdir",
        type=Path,
        help="Artifact work directory. Defaults to AD_OPS_WORKDIR, then ./ad_ops_workdir.",
    )
    parser.add_argument("--default-name", default=DEFAULT_BUNDLE_NAME, help="Default TMP_FILE name when none is provided.")
    parser.add_argument("--confirm-clean", action="store_true", help="Delete existing ad-config-ops generated files in workdir before initializing.")
    parser.add_argument("--print-exports", action="store_true", help="Print shell exports instead of JSON summary.")
    return parser.parse_args(argv)


def shell_exports(values: dict[str, str]) -> str:
    return "\n".join(f"export {key}={shlex.quote(value)}" for key, value in values.items()) + "\n"


def resolve_tmp_file(tmp_file: Path | None, workdir: Path, default_name: str) -> Path:
    if tmp_file is not None:
        return tmp_file.expanduser()
    env_tmp = tmp_file_path()
    if env_tmp is not None:
        return env_tmp
    return workdir / default_name


def init_env(args: argparse.Namespace) -> dict[str, str]:
    workdir = require_workdir(args.workdir)
    residuals = generated_artifacts(workdir)
    cleaned: list[Path] = []
    if residuals and not args.confirm_clean:
        names = ", ".join(path.name for path in residuals)
        raise RuntimeError(
            "ad-config-ops generated artifacts exist in workdir. Ask the user whether to delete them. "
            f"Re-run init_env.py with --confirm-clean after explicit approval. Artifacts: {names}"
        )
    if residuals:
        cleaned = remove_generated_artifacts(workdir)

    tmp_file = resolve_tmp_file(args.tmp_file, workdir, args.default_name)
    tmp_file.parent.mkdir(parents=True, exist_ok=True)

    env_json = workdir / ENV_JSON_NAME
    env_sh = workdir / ENV_SH_NAME
    values = {
        TMP_FILE_ENV: str(tmp_file),
        WORKDIR_ENV: str(workdir),
        "AD_OPS_ENV_JSON": str(env_json),
        "AD_OPS_ENV_SH": str(env_sh),
    }
    write_json(env_json, values)
    env_sh.write_text(shell_exports(values), encoding="utf-8")
    artifacts = update_artifacts(workdir, tmp_file=tmp_file, env_json=env_json, env_sh=env_sh)
    return {
        "ok": True,
        "tmp_file": str(tmp_file),
        "workdir": str(workdir),
        "env_json": str(env_json),
        "env_sh": str(env_sh),
        "artifacts": str(artifacts),
        "cleaned_count": len(cleaned),
    }


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        summary = init_env(args)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2
    if args.print_exports:
        print(
            shell_exports(
                {
                    TMP_FILE_ENV: summary["tmp_file"],
                    WORKDIR_ENV: summary["workdir"],
                    "AD_OPS_ENV_JSON": summary["env_json"],
                    "AD_OPS_ENV_SH": summary["env_sh"],
                }
            ),
            end="",
        )
        return 0
    print(short_summary(**summary), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
