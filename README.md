# ad-build

Deterministic AD build verification CLI for baseline checks, public base image recovery, module mapping, module verification, and build reports.

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
ad-build image status
ad-build image save [--push]
ad-build image pull
ad-build image restore [--delete]
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
```

Copy `templates/module-map.yaml` to `tools/module-map.yaml` in the target repository and adjust module paths/build commands before using `map`, `modules`, or `verify`.

Copy `templates/base-image.yaml` to `tools/base-image.yaml`, or pass `ad-build image status --config <path>` and the same `--config` option to other image subcommands, before publishing a public base image. The base image workflow packages low-frequency public build artifacts such as `libs/`, `sinfor/`, `include/`, `linux/`, and `app_bin/` into a Docker image that can later be restored into a developer workspace.

## Public base image workflow

First CI run or trusted AD build node:

```bash
ad-build image status
ad-build full-build -- ./compile.sh
ad-build image save --push
```

Developer restore flow:

```bash
ad-build image status
ad-build image pull
ad-build image restore --delete
```

Use `AD_BUILD_PUBLIC_BASE_FROM`, `AD_BUILD_PUBLIC_BASE_DIGEST`, `AD_BUILD_PUBLIC_BASE_REGISTRY`, or `AD_BUILD_PUBLIC_BASE_IMAGE_REF` in CI when the platos base image or registry tag should be supplied externally.
