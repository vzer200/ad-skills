from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path


SKILL_NAME = "ad-config-ops"


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Gated sync for the project-local ad-config-ops skill.")
    parser.add_argument("--source", required=True, type=Path, help="Project-local ad-config-ops source directory.")
    parser.add_argument("--target", required=True, type=Path, help="Target ad-config-ops skill directory.")
    parser.add_argument("--confirm", action="store_true", help="Actually replace the target directory.")
    return parser.parse_args(argv)


def validate_source(source: Path) -> None:
    if source.name != SKILL_NAME:
        raise ValueError(f"source directory must be named {SKILL_NAME}")
    if source.is_symlink():
        raise ValueError("source must not be a symlink")
    if not source.is_dir():
        raise ValueError(f"source is not a directory: {source}")
    if not (source / "SKILL.md").is_file():
        raise ValueError("missing SKILL.md in source")
    for path in source.rglob("*"):
        if path.is_symlink():
            raise ValueError(f"source must not contain symlinks: {path}")


def validate_target(target: Path) -> None:
    if target.name != SKILL_NAME:
        raise ValueError(f"target directory must be named {SKILL_NAME}")
    if target.is_symlink():
        raise ValueError("target must not be a symlink")
    if target.exists() and not target.is_dir():
        raise ValueError("target exists and is not a directory")


def paths_overlap(source: Path, target: Path) -> bool:
    return source == target or source.is_relative_to(target) or target.is_relative_to(source)


def resolve_target_path(target: Path) -> Path:
    if target.is_absolute():
        return target.resolve(strict=False)
    return (Path.cwd() / target).resolve(strict=False)


def remove_existing(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path)
    else:
        path.unlink()


def build_summary(source: Path, target: Path, confirm: bool) -> dict[str, object]:
    will_replace = target.exists()
    file_count = sum(1 for item in source.rglob("*") if item.is_file())
    return {
        "skill_name": SKILL_NAME,
        "source": str(source.resolve()),
        "target": str(target.resolve()),
        "dry_run": not confirm,
        "will_copy": True,
        "will_replace": will_replace,
        "copied": confirm,
        "replaced": confirm and will_replace,
        "file_count": file_count,
    }


def sync_skill(source: Path, target: Path, confirm: bool) -> dict[str, object]:
    validate_source(source)
    validate_target(target)
    source = source.resolve()
    target = resolve_target_path(target)
    if paths_overlap(source, target):
        raise ValueError("source and target must not overlap")

    summary = build_summary(source, target, confirm)
    if not confirm:
        return summary

    if target.exists():
        print(f"will replace existing target: {target}", file=sys.stderr)
        remove_existing(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, target)
    return summary


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        summary = sync_skill(args.source, args.target, args.confirm)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
