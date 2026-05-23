from __future__ import annotations

import argparse
import json
import os
import zipfile
from pathlib import Path


DEFAULT_EXCLUDES = {
    "__pycache__",
    ".pytest_cache",
}
EXCLUDED_SUFFIXES = {".pyc", ".pyo", ".db", ".pid"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Package AD skills for WorkBot upload.")
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--out", type=Path, default=Path("dist/ad-skills-workbot.zip"))
    parser.add_argument("--manifest-out", type=Path, default=Path("dist/ad-skills-workbot.manifest.json"))
    parser.add_argument(
        "--inject-device-passwords",
        action="store_true",
        help=(
            "For upload artifacts only: replace devices.json password_from fields with "
            "runtime environment password values. Values are not written to the manifest."
        ),
    )
    return parser.parse_args()


def should_include(path: Path) -> bool:
    if any(part in DEFAULT_EXCLUDES for part in path.parts):
        return False
    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    return path.is_file()


def add_tree(zf: zipfile.ZipFile, source: Path, arc_root: Path) -> list[str]:
    names: list[str] = []
    for file in sorted(source.rglob("*")):
        if not should_include(file):
            continue
        arcname = (arc_root / file.relative_to(source)).as_posix()
        zf.write(file, arcname)
        names.append(arcname)
    return names


def render_devices_json(path: Path, inject_passwords: bool) -> tuple[str, list[str]]:
    text = path.read_text(encoding="utf-8")
    if not inject_passwords:
        return text, []

    data = json.loads(text)
    injected: list[str] = []
    for device in data.get("devices", []):
        env_name = device.get("password_from")
        if not env_name:
            continue
        password = os.environ.get(env_name)
        if not password:
            raise SystemExit(f"{env_name} is required for --inject-device-passwords")
        device["password"] = password
        device.pop("password_from", None)
        injected.append(str(device.get("name") or env_name))
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n", injected


def main() -> int:
    args = parse_args()
    repo = args.repo_root.resolve()
    skills_root = repo / ".claude" / "skills"
    if not skills_root.exists():
        raise SystemExit(f"skills root not found: {skills_root}")

    out = (repo / args.out).resolve() if not args.out.is_absolute() else args.out
    manifest_out = (repo / args.manifest_out).resolve() if not args.manifest_out.is_absolute() else args.manifest_out
    out.parent.mkdir(parents=True, exist_ok=True)

    entries: list[str] = []
    injected_devices: list[str] = []
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        entries.extend(add_tree(zf, skills_root, Path("skills")))
        for root_file in ("devices.json", "CLAUDE.md", "docs/workbot-acceptance.md"):
            path = repo / root_file
            if path.exists() and path.is_file():
                if root_file == "devices.json":
                    rendered, injected_devices = render_devices_json(path, args.inject_device_passwords)
                    zf.writestr(Path(root_file).as_posix(), rendered)
                else:
                    zf.write(path, Path(root_file).as_posix())
                entries.append(Path(root_file).as_posix())

    manifest = {
        "ok": True,
        "zip": str(out),
        "entry_count": len(entries),
        "skills": sorted(path.name for path in skills_root.iterdir() if path.is_dir()),
        "device_passwords_injected": injected_devices,
    }
    manifest_out.parent.mkdir(parents=True, exist_ok=True)
    manifest_out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
