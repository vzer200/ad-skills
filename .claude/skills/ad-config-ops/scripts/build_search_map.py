from __future__ import annotations

import argparse
import sys
from pathlib import Path

from ad_ops_common import short_summary
from search_map import build_and_write_search_map


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build AD-OPS generated and effective search maps.")
    parser.add_argument("--skill-root", required=True, type=Path, help="AD-OPS skill root.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        search_map = build_and_write_search_map(args.skill_root)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(
        short_summary(
            ok=True,
            families=len(search_map.get("families", {})),
            variant_families=len(search_map.get("variant_families", {})),
            resources=len(search_map.get("resources", {})),
            documents=len(search_map.get("documents", {})),
            operations=len(search_map.get("operations", {})),
            schemas=len(search_map.get("schemas", {})),
        ),
        end="",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
