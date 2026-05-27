# Sangfor AD CLI Skill Design

## Goal

Add `sangforad-cli` as the sixth AD skill. It generates pasteable Sangfor AD
CLI command scripts from the same validated operation model used by
`ad-config-ops`, without changing the existing REST/API `apply.py` workflow.

## Design Decisions

- Keep `ad-config-ops` focused on API templates, REST plans, Python apply,
  verification, and rollback.
- Create a separate `sangforad-cli` skill for explicit CLI output requests such
  as `CLI`, `sfcli`, `命令行`, and `命令行配置`.
- Reuse `ad-config-ops` validation and dependency sorting by consuming either:
  - an existing `adops-plan.json`, or
  - a filled `adops-bundle.yml` plus the `ad-config-ops` skill root.
- Generate only offline artifacts. The new skill never logs in to a device or
  executes CLI commands.
- Use `apply.sfcli` as the user-facing reusable deliverable.

## Renderer Rules

- Strip `/api/ad/vN/` from API paths.
- Map create/patch/replace/delete to create/modify/modify/delete.
- Use trailing `{name}` path parameters as positional object names.
- Skip top-level `name` in options.
- Render objects and arrays in the AD command manual style:
  - `field { child value ... }`
  - `field [ item1 item2 ]`
  - `field add [ { key value ... } ]`
- Lowercase all-caps enum-like values while preserving mixed-case strings.

## Validation

- Add unit coverage for create, patch, delete, and direct plan input.
- Include `sangforad-cli` in packaging validation.
- Extend the local smoke flow to render `apply.sfcli` from the R4 SLB fixture
  plan.
