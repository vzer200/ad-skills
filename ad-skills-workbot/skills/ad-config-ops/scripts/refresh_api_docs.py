from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from ad_ops_common import copy_tree_atomic, sha256_tree, skill_paths, utc_now_iso, validate_docs_root, write_json
from build_index import build_index

DISPLAY_VERSION_RE = re.compile(r"\b(?:API|AD)\s*([0-9]+(?:\.[0-9]+)+)\b", re.IGNORECASE)
SWAGGER_VERSION_RE = re.compile(r'"version"\s*:\s*"([^"]+)"')


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh AD-OPS bundled API documents.")
    parser.add_argument("--source", required=True, type=Path, help="Source directory containing Swagger JS docs.")
    parser.add_argument("--version", required=True, help="API document version label.")
    parser.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root to refresh.")
    return parser.parse_args(argv)


def read_text_if_exists(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def candidate_web_roots(source: Path) -> list[Path]:
    roots = [source]
    if source.name == "json":
        roots.insert(0, source.parent)
    return list(dict.fromkeys(roots))


def extract_display_version(text: str) -> str | None:
    match = DISPLAY_VERSION_RE.search(text)
    return match.group(1) if match else None


def detect_web_version(source: Path) -> tuple[str | None, str | None]:
    for root in candidate_web_roots(source):
        for relative in ("index.html", "js/app.js"):
            path = root / relative
            version = extract_display_version(read_text_if_exists(path))
            if version:
                return version, relative
    return None, None


def detect_swagger_version(source: Path) -> str | None:
    common = source / "{common}.js"
    match = SWAGGER_VERSION_RE.search(read_text_if_exists(common))
    return match.group(1) if match else None


def version_metadata(source: Path, requested_version: str, file_count: int, docs_sha256: str) -> dict[str, object]:
    web_version, web_version_source = detect_web_version(source)
    swagger_version = detect_swagger_version(source)
    resolved_version = web_version or requested_version
    metadata: dict[str, object] = {
        "version": resolved_version,
        "file_count": file_count,
        "sha256": docs_sha256,
        "refreshed_at": utc_now_iso(),
        "requested_version": requested_version,
        "version_source": "web" if web_version else "argument",
    }
    if web_version:
        metadata["web_version"] = web_version
        metadata["web_version_source"] = web_version_source
    if swagger_version:
        metadata["swagger_version"] = swagger_version
    warnings: list[str] = []
    if web_version and swagger_version and web_version != swagger_version:
        warnings.append(f"web_version {web_version} differs from swagger_version {swagger_version}")
    if warnings:
        metadata["version_warnings"] = warnings
    return metadata


def refresh_api_docs(source: Path, version: str, skill_root: Path) -> dict[str, object]:
    source = source.resolve()
    files = validate_docs_root(source)
    paths = skill_paths(skill_root)

    copy_tree_atomic(source, paths.api_docs)
    paths.generated.mkdir(parents=True, exist_ok=True)
    paths.scripts_generated.mkdir(parents=True, exist_ok=True)

    metadata = version_metadata(source, version, len(files), sha256_tree(paths.api_docs))
    write_json(paths.references / "api-version.json", metadata)
    build_index(skill_root)
    from search_map import build_and_write_search_map

    build_and_write_search_map(skill_root)
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
