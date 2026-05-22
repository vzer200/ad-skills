from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ad_ops_common import short_summary, write_json


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare AD API state against expected fields.")
    parser.add_argument("--expected", required=True, type=Path, help="Expected JSON file.")
    parser.add_argument("--actual", required=True, type=Path, help="Actual JSON file.")
    parser.add_argument("--out", type=Path, help="Optional full comparison result JSON output path.")
    parser.add_argument("--summary", action="store_true", help="Print only a short summary to stdout.")
    return parser.parse_args(argv)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def compare_expected(expected: Any, actual: Any, path: str = "") -> list[dict[str, Any]]:
    diffs: list[dict[str, Any]] = []
    if isinstance(expected, dict):
        if not isinstance(actual, dict):
            return [{"path": path or "$", "expected": expected, "actual": actual}]
        for key, expected_value in expected.items():
            child_path = f"{path}.{key}" if path else str(key)
            if key not in actual:
                diffs.append({"path": child_path, "expected": expected_value, "actual": None})
                continue
            diffs.extend(compare_expected(expected_value, actual[key], child_path))
        return diffs

    if isinstance(expected, list):
        if not isinstance(actual, list):
            return [{"path": path or "$", "expected": expected, "actual": actual}]
        if len(actual) != len(expected):
            return [{"path": path or "$", "expected": expected, "actual": actual}]
        for index, expected_item in enumerate(expected):
            actual_item = actual[index]
            if isinstance(expected_item, dict):
                diffs.extend(compare_expected(expected_item, actual_item, f"{path}[{index}]" if path else f"[{index}]"))
            elif expected_item != actual_item:
                diffs.append(
                    {
                        "path": f"{path}[{index}]" if path else f"[{index}]",
                        "expected": expected_item,
                        "actual": actual_item,
                    }
                )
        return diffs

    if expected != actual:
        diffs.append({"path": path or "$", "expected": expected, "actual": actual})
    return diffs


def compare_state(expected: Any, actual: Any) -> dict[str, Any]:
    diffs = compare_expected(expected, actual)
    return {"ok": not diffs, "diffs": diffs}


def compare_summary(result: dict[str, Any], out: Path | None = None) -> dict[str, Any]:
    diffs = result.get("diffs") if isinstance(result.get("diffs"), list) else []
    summary: dict[str, Any] = {
        "ok": result.get("ok"),
        "diff_count": len(diffs),
        "diff_paths": [diff.get("path") for diff in diffs if isinstance(diff, dict)],
    }
    if out is not None:
        summary["result"] = str(out)
    return summary


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    result = compare_state(load_json(args.expected), load_json(args.actual))
    if args.out:
        write_json(args.out, result)
    if args.summary:
        print(short_summary(**compare_summary(result, args.out)), end="")
    else:
        print(json.dumps(result, ensure_ascii=False))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
