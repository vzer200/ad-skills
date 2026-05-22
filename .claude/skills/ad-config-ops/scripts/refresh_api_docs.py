from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from ad_ops_common import copy_tree_atomic, sha256_tree, skill_paths, utc_now_iso, validate_docs_root, write_json
from build_index import build_index


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh ad-config-ops bundled API documents.")
    parser.add_argument("--source", required=True, type=Path, help="Source directory containing Swagger JS docs.")
    parser.add_argument("--version", required=True, help="API document version label.")
    parser.add_argument("--skill-root", required=True, type=Path, help="ad-config-ops skill root to refresh.")
    return parser.parse_args(argv)


def refresh_api_docs(source: Path, version: str, skill_root: Path) -> dict[str, object]:
    source = source.resolve()
    files = validate_docs_root(source)
    paths = skill_paths(skill_root)

    copy_tree_atomic(source, paths.api_docs)
    paths.generated.mkdir(parents=True, exist_ok=True)
    paths.scripts_generated.mkdir(parents=True, exist_ok=True)

    metadata = {
        "version": version,
        "file_count": len(files),
        "sha256": sha256_tree(paths.api_docs),
        "refreshed_at": utc_now_iso(),
    }
    write_json(paths.references / "api-version.json", metadata)
    build_index(skill_root)
    return metadata


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        metadata = refresh_api_docs(args.source, args.version, args.skill_root)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    print(json.dumps({k: metadata[k] for k in ("version", "file_count", "sha256")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
