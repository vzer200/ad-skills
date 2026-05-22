from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

METHODS = ("get", "post", "put", "patch", "delete", "head", "options")
REQUIRED_DOCS = ("toc.js", "{common}.js", "token.js")
TMP_FILE_ENV = "TMP_FILE"
WORKDIR_ENV = "AD_OPS_WORKDIR"
DEFAULT_WORKDIR_NAME = "ad_ops_workdir"
GENERATED_FILE_PREFIX = "adops-"
ARTIFACTS_NAME = f"{GENERATED_FILE_PREFIX}artifacts.json"
DEFAULT_BUNDLE_NAME = f"{GENERATED_FILE_PREFIX}bundle.yml"
DEFAULT_PLAN_NAME = f"{GENERATED_FILE_PREFIX}plan.json"
DEFAULT_EFFECTIVE_PLAN_NAME = f"{GENERATED_FILE_PREFIX}effective-plan.json"
DEFAULT_BATCH_NAME = f"{GENERATED_FILE_PREFIX}batch.json"
DEFAULT_APPLY_SCRIPT_NAME = "apply.py"
DEFAULT_EXECUTE_RESULT_NAME = f"{GENERATED_FILE_PREFIX}execute-result.json"
DEFAULT_EXECUTE_PREVIEW_NAME = f"{GENERATED_FILE_PREFIX}execute-preview.json"
DEFAULT_ROLLBACK_NAME = f"{GENERATED_FILE_PREFIX}rollback.json"
DEFAULT_ROLLBACK_RESULT_NAME = f"{GENERATED_FILE_PREFIX}rollback-result.json"
DEFAULT_ROLLBACK_SCRIPT_NAME = "rollback_apply.py"
DEFAULT_PREFLIGHT_NAME = f"{GENERATED_FILE_PREFIX}preflight.json"
DEFAULT_POST_APPLY_NAME = f"{GENERATED_FILE_PREFIX}post-apply.json"
DEFAULT_POST_ROLLBACK_NAME = f"{GENERATED_FILE_PREFIX}post-rollback.json"
DEFAULT_ROLLBACK_COMPARE_NAME = f"{GENERATED_FILE_PREFIX}rollback-compare.json"
LEGACY_GENERATED_FILE_NAMES = {
    "ad-ops-env.json",
    "ad-ops-env.sh",
    "artifacts.json",
    "bundle.yml",
    "plan.json",
    "effective-plan.json",
    "batch.json",
    "apply.py",
    "execute-result.json",
    "execute-preview.json",
    "rollback.json",
    "rollback-result.json",
    "rollback_apply.py",
    "preflight.json",
    "post-apply.json",
    "post-rollback.json",
    "rollback-compare.json",
}


@dataclass(frozen=True)
class SkillPaths:
    root: Path
    references: Path
    api_docs: Path
    generated: Path
    scripts_generated: Path


def skill_paths(skill_root: Path) -> SkillPaths:
    root = skill_root.resolve()
    return SkillPaths(
        root=root,
        references=root / "references",
        api_docs=root / "references" / "api-docs",
        generated=root / "references" / "generated",
        scripts_generated=root / "scripts" / "generated",
    )


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def tmp_file_path(env_var: str = TMP_FILE_ENV) -> Path | None:
    value = os.environ.get(env_var)
    if not value:
        return None
    return Path(value).expanduser()


def resolve_file_path(path: Path | None, purpose: str, env_var: str = TMP_FILE_ENV) -> Path:
    if path is not None:
        return path
    env_path = tmp_file_path(env_var)
    if env_path is not None:
        return env_path
    raise ValueError(f"{purpose} path is required; pass an explicit path or set {env_var}")


def workdir_path(path: Path | None = None, env_var: str = WORKDIR_ENV) -> Path | None:
    if path is not None:
        return path.expanduser()
    value = os.environ.get(env_var)
    if value:
        return Path(value).expanduser()
    return None


def default_workdir_path() -> Path:
    return Path.cwd() / DEFAULT_WORKDIR_NAME


def require_workdir(path: Path | None = None, fallback: Path | None = None) -> Path:
    resolved = workdir_path(path)
    if resolved is None:
        resolved = fallback
    if resolved is None:
        resolved = default_workdir_path()
    resolved.mkdir(parents=True, exist_ok=True)
    return resolved


def artifacts_path(workdir: Path) -> Path:
    return workdir / ARTIFACTS_NAME


def is_generated_artifact(path: Path) -> bool:
    name = path.name
    return path.is_file() and (name.startswith(GENERATED_FILE_PREFIX) or name in LEGACY_GENERATED_FILE_NAMES)


def generated_artifacts(workdir: Path) -> list[Path]:
    if not workdir.exists():
        return []
    return sorted(path for path in workdir.iterdir() if is_generated_artifact(path))


def remove_generated_artifacts(workdir: Path) -> list[Path]:
    removed = generated_artifacts(workdir)
    for path in removed:
        path.unlink()
    return removed


def update_artifacts(workdir: Path | None, **items: Path | str | None) -> Path | None:
    if workdir is None:
        return None
    workdir.mkdir(parents=True, exist_ok=True)
    path = artifacts_path(workdir)
    current: dict[str, Any] = {}
    if path.exists():
        try:
            loaded = read_json(path)
            if isinstance(loaded, dict):
                current = loaded
        except Exception:
            current = {}
    for key, value in items.items():
        if value is None:
            continue
        current[key] = str(value)
    current["updated_at"] = utc_now_iso()
    write_json(path, current)
    return path


def operation_count(plan: dict[str, Any]) -> int:
    operations = plan.get("operations")
    return len(operations) if isinstance(operations, list) else 0


def short_summary(**items: Any) -> str:
    return json.dumps(items, ensure_ascii=False, separators=(",", ":")) + "\n"


def sha256_tree(root: Path) -> str:
    digest = hashlib.sha256()
    for file in sorted(p for p in root.rglob("*") if p.is_file()):
        digest.update(str(file.relative_to(root)).replace("\\", "/").encode("utf-8"))
        digest.update(file.read_bytes())
    return digest.hexdigest()


def validate_docs_root(docs_root: Path) -> list[Path]:
    missing = [name for name in REQUIRED_DOCS if not (docs_root / name).exists()]
    if missing:
        raise ValueError("missing required API docs: " + ", ".join(missing))
    files = sorted(p for p in docs_root.rglob("*.js") if p.is_file())
    if len(files) < 20:
        raise ValueError(f"expected many Swagger JS docs, found {len(files)}")
    return files


def copy_tree_atomic(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp_parent = target.parent
    with tempfile.TemporaryDirectory(prefix=f".{target.name}.", dir=tmp_parent) as tmp:
        tmp_path = Path(tmp) / target.name
        shutil.copytree(source, tmp_path)
        backup = None
        moved_existing = False
        try:
            if target.exists():
                backup = Path(tmp) / f"{target.name}.old"
                target.rename(backup)
                moved_existing = True
            tmp_path.rename(target)
            if backup and backup.exists():
                shutil.rmtree(backup)
        except Exception:
            if moved_existing and backup and backup.exists():
                if target.exists():
                    if target.is_dir():
                        shutil.rmtree(target)
                    else:
                        target.unlink()
                backup.rename(target)
            raise


def load_swagger_docs_with_node(docs_root: Path) -> list[dict[str, Any]]:
    script = f'''
const fs = require("fs");
const path = require("path");
const root = {json.dumps(str(docs_root))};
function walk(dir) {{
  const out = [];
  for (const entry of fs.readdirSync(dir, {{ withFileTypes: true }})) {{
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith(".js")) out.push(full);
  }}
  return out;
}}
const docs = walk(root).sort().map((file) => {{
  const rel = path.relative(root, file).replaceAll(path.sep, "/");
  delete require.cache[require.resolve(file)];
  return {{ rel, doc: require(file) }};
}});
process.stdout.write(JSON.stringify(docs));
'''
    result = subprocess.run(["node", "-e", script], text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr)
    return json.loads(result.stdout)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def prune_unfilled(value: Any) -> Any:
    if isinstance(value, dict):
        cleaned = {k: prune_unfilled(v) for k, v in value.items()}
        cleaned = {k: v for k, v in cleaned.items() if v is not None}
        return cleaned or None
    if isinstance(value, list):
        cleaned = [v for v in (prune_unfilled(item) for item in value) if v is not None]
        return cleaned or None
    if value is None or value == "":
        return None
    return value
