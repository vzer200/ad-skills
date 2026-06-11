# ad-build

Deterministic AD build verification CLI for baseline checks, module mapping, module verification, and build reports.

The CLI never calls a model. AI agents should use the bundled `skills/ad-build/SKILL.md` to interpret CLI outputs safely.

## Install

```bash
npm install -g ad-build
```

Local development fallback:

```bash
node bin/ad-build.js <command>
```

## Commands

```bash
ad-build doctor
ad-build precheck
ad-build full-build -- <command...>
ad-build baseline-save --from-run latest
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
```

Copy `templates/module-map.yaml` to `tools/module-map.yaml` in the target repository and adjust module paths/build commands before using `map`, `modules`, or `verify`.
