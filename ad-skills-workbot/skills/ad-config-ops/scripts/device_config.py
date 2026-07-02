from __future__ import annotations

import copy
import json
import os
import re
from argparse import Namespace
from pathlib import Path
from typing import Any


class DeviceConfigError(RuntimeError):
    pass


def normalize_base_url(host: str) -> str:
    value = str(host or "").strip().rstrip("/")
    if not value:
        raise DeviceConfigError("device host is required")
    if value.startswith(("http://", "https://")):
        return value
    return "https://" + value


def _first_present_env(names: list[str]) -> str | None:
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    return None


def _device_env_prefix(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "_", str(name or "")).strip("_").upper()


def _script_skill_root() -> Path:
    return Path(__file__).resolve().parents[1]


def default_devices_path() -> Path | None:
    env_path = _first_present_env(["AD_DEVICES", "AD_DEVICES_JSON", "DEVICES_JSON"])
    if env_path:
        return Path(env_path)

    cwd = Path.cwd()
    skill_root = _script_skill_root()
    candidates = [
        cwd / "devices.json",
        cwd / "skills" / "devices.json",
        cwd / "skills" / "ad-config-ops" / "devices.json",
        skill_root / "devices.json",
        skill_root.parent / "devices.json",
        skill_root.parent.parent / "devices.json",
    ]
    for path in candidates:
        if path.is_file():
            return path
    return None


def _device_field(device: dict[str, Any], *names: str) -> str | None:
    for name in names:
        value = device.get(name)
        if value not in (None, ""):
            return str(value)
    return None


def _secret_from_device(device: dict[str, Any], key: str) -> str | None:
    value = device.get(key)
    if value not in (None, ""):
        return str(value)
    env_name = device.get(f"{key}_from")
    if env_name:
        env_value = os.environ.get(str(env_name))
        if env_value:
            return env_value
    return None


def _apply_device_env_overrides(device: dict[str, Any]) -> dict[str, Any]:
    item = copy.deepcopy(device)
    name = _device_field(item, "name")
    if not name:
        return item
    prefix = _device_env_prefix(name)
    host = _first_present_env([f"{prefix}_HOST", f"{prefix}_PUBLIC_URL", f"{prefix}_BASE_URL"])
    user = _first_present_env([f"{prefix}_USER", f"{prefix}_USERNAME"])
    if host:
        item["host"] = host
    if user:
        item["user"] = user
    return item


def _load_devices_file(path: Path) -> list[dict[str, Any]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise DeviceConfigError(f"failed to read devices file: {path}") from exc
    if isinstance(data, list):
        raw_devices = data
    elif isinstance(data, dict):
        raw_devices = data.get("devices", [])
    else:
        raw_devices = []
    if not isinstance(raw_devices, list):
        raise DeviceConfigError(f"devices file must contain a devices list: {path}")
    return [_apply_device_env_overrides(item) for item in raw_devices if isinstance(item, dict)]


def _matches_device(device: dict[str, Any], selector: str) -> bool:
    needle = selector.strip().lower()
    if not needle:
        return True
    values = [
        _device_field(device, "name"),
        _device_field(device, "host"),
    ]
    for value in values:
        if value and value.strip().lower() == needle:
            return True
    return False


def select_device(path: Path, selector: str | None = None) -> dict[str, Any]:
    devices = _load_devices_file(path)
    selected = [item for item in devices if _matches_device(item, selector or "")]
    if selector and not selected:
        raise DeviceConfigError(f"device not found in {path}: {selector}")
    if not selected:
        raise DeviceConfigError(f"no devices found in {path}")
    if not selector and len(selected) > 1:
        names = [str(item.get("name") or item.get("host") or "?") for item in selected]
        raise DeviceConfigError("multiple devices found; pass --device. Available: " + ", ".join(names))
    return selected[0]


def _arg_value(args: Namespace, name: str) -> str | None:
    value = getattr(args, name, None)
    if value in (None, ""):
        return None
    return str(value)


def resolve_device_connection(args: Namespace) -> dict[str, Any]:
    device_name = _arg_value(args, "device")
    devices_arg = _arg_value(args, "devices")
    devices_path = Path(devices_arg) if devices_arg else None
    device: dict[str, Any] | None = None

    if device_name or devices_path:
        if devices_path is None:
            devices_path = default_devices_path()
        if devices_path is None:
            raise DeviceConfigError("--devices or a discoverable devices.json is required when --device is used")
        device = select_device(devices_path, device_name)

    if device is not None:
        host = _arg_value(args, "host") or _device_field(device, "host") or os.environ.get("AD_HOST")
        username = _arg_value(args, "username") or _device_field(device, "username", "user") or os.environ.get("AD_USERNAME")
        password = _arg_value(args, "password") or _secret_from_device(device, "password") or os.environ.get("AD_PASSWORD")
        token = _arg_value(args, "token") or _secret_from_device(device, "token") or os.environ.get("AD_TOKEN")
        return {
            "host": host,
            "username": username,
            "password": password,
            "token": token,
            "device": _device_field(device, "name") or device_name,
            "devices": str(devices_path) if devices_path else None,
        }

    return {
        "host": _arg_value(args, "host") or os.environ.get("AD_HOST"),
        "username": _arg_value(args, "username") or os.environ.get("AD_USERNAME"),
        "password": _arg_value(args, "password") or os.environ.get("AD_PASSWORD"),
        "token": _arg_value(args, "token") or os.environ.get("AD_TOKEN"),
        "device": None,
        "devices": None,
    }
