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
            "Deprecated compatibility only: replace legacy password_from fields with "
            "runtime environment password values before packaging."
        ),
    )
    parser.add_argument(
        "--inject-device-overrides",
        action="store_true",
        help="For upload artifacts only: apply AD1_HOST/AD1_USER style runtime device overrides to devices.json.",
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
        if file.name == "devices.json":
            continue
        arcname = (arc_root / file.relative_to(source)).as_posix()
        zf.write(file, arcname)
        names.append(arcname)
    return names


def _device_env_prefix(name: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in name).strip("_").upper()


def _first_env(names: list[str]) -> str:
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    return ""


def render_devices_json(path: Path, inject_passwords: bool, inject_overrides: bool = False) -> tuple[str, list[str], list[str]]:
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    credential_devices: list[str] = []
    injected_overrides: list[str] = []
    for device in data.get("devices", []):
        device_name = str(device.get("name") or "").strip()
        prefix = _device_env_prefix(device_name)
        if inject_passwords:
            env_name = device.get("password_from")
            if env_name:
                password = os.environ.get(env_name)
                if not password:
                    raise SystemExit(f"{env_name} is required for --inject-device-passwords")
                device["password"] = password
                device.pop("password_from", None)
        if inject_overrides and prefix:
            host = _first_env([f"{prefix}_HOST", f"{prefix}_PUBLIC_URL", f"{prefix}_BASE_URL"])
            user = _first_env([f"{prefix}_USER", f"{prefix}_USERNAME"])
            if host:
                device["host"] = host
                injected_overrides.append(f"{device_name}.host")
            if user:
                device["user"] = user
                injected_overrides.append(f"{device_name}.user")
        label = device_name or str(device.get("host") or "<unknown>")
        if device.get("password_from"):
            raise SystemExit(f"devices.json must store direct password for {label}; password_from is not allowed")
        if not device.get("user"):
            raise SystemExit(f"devices.json must store user for {label}")
        if not device.get("password"):
            raise SystemExit(f"devices.json must store password for {label}")
        credential_devices.append(label)
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n", credential_devices, injected_overrides


def devices_arc_names(skill_names: list[str]) -> list[Path]:
    names = [Path("devices.json"), Path("skills/devices.json")]
    names.extend(Path("skills") / skill_name / "devices.json" for skill_name in skill_names)
    return names


def discover_skill_paths(skills_root: Path) -> list[Path]:
    return sorted(
        (path for path in skills_root.iterdir() if path.is_dir() and (path / "SKILL.md").is_file()),
        key=lambda path: path.name,
    )


def main() -> int:
    args = parse_args()
    repo = args.repo_root.resolve()
    skills_root = repo / ".claude" / "skills"
    if not skills_root.exists():
        raise SystemExit(f"skills root not found: {skills_root}")

    out = (repo / args.out).resolve() if not args.out.is_absolute() else args.out
    manifest_out = (repo / args.manifest_out).resolve() if not args.manifest_out.is_absolute() else args.manifest_out
    out.parent.mkdir(parents=True, exist_ok=True)

    skill_paths = discover_skill_paths(skills_root)
    skill_names = [path.name for path in skill_paths]
    entries: list[str] = []
    credential_devices: list[str] = []
    injected_overrides: list[str] = []
    device_file_entries: list[str] = []
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for skill_path in skill_paths:
            entries.extend(add_tree(zf, skill_path, Path("skills") / skill_path.name))
        devices_path = repo / "devices.json"
        if devices_path.exists() and devices_path.is_file():
            rendered, credential_devices, injected_overrides = render_devices_json(
                devices_path,
                args.inject_device_passwords,
                args.inject_device_overrides,
            )
            for arcname in devices_arc_names(skill_names):
                zf.writestr(arcname.as_posix(), rendered)
                entries.append(arcname.as_posix())
                device_file_entries.append(arcname.as_posix())
        for root_file in ("CLAUDE.md", "docs/workbot-acceptance.md"):
            path = repo / root_file
            if path.exists() and path.is_file():
                zf.write(path, Path(root_file).as_posix())
                entries.append(Path(root_file).as_posix())

    manifest = {
        "ok": True,
        "zip": str(out),
        "entry_count": len(entries),
        "skills": skill_names,
        "device_passwords_embedded": credential_devices,
        "device_passwords_injected": credential_devices if args.inject_device_passwords else [],
        "device_overrides_injected": injected_overrides,
        "device_file_entries": device_file_entries,
    }
    manifest_out.parent.mkdir(parents=True, exist_ok=True)
    manifest_out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
