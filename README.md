# ad-build

Deterministic AD build verification CLI for baseline checks, public-base dependency recovery, module mapping, module verification, and build reports.

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
ad-build public-base key
ad-build public-base pack --out public-base.tar
ad-build public-base restore --bundle public-base.tar
ad-build public-base status
ad-build public-base check --bundle public-base.tar
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

`public-base` is the recommended first-stage workflow. It stores only the public dependency layer needed for app-local verification: `obj/lib64/`, `include/`, `obj/bin/`, `KERNEL_VER`, and `OS_PLATFORM.file`.

Copy `templates/public-base.yaml` to `tools/public-base.yaml` only when the repository needs to override the default public-base paths.

## Public-base file workflow

First CI run or trusted AD build node:

```bash
ad-build full-build -- ./compile.sh
ad-build public-base key
ad-build public-base pack --out public-base.tar
ad-build public-base check --bundle public-base.tar
```

Developer restore flow:

```bash
ad-build public-base restore --bundle public-base.tar
ad-build public-base status
ad-build public-base check --bundle public-base.tar
ad-build map
ad-build verify <module>
```

`public-base pack` fails if any required restore path is missing. Use `--allow-partial` only for deliberate diagnostics.

`public-base restore` refuses to overwrite existing files whose content differs from the bundle. Use `--force` only in a disposable or backed-up workspace.

Do not store `public-base.tar` in the AD source repository. Store it in a separate `ad-build-public-base` repository or artifact system together with its manifest, inventory, and sha256 sidecar.

`ad-build bundle pack --profile full` remains available for diagnostics, but it is not the recommended AD public-base workflow. Full compiled trees can include large package outputs such as `mkpacket/`, `ssipacket/`, and `ad_packet/`.

## Public base image workflow

The Docker base-image commands are retained for teams that explicitly use image-based recovery:

```bash
ad-build image status
ad-build image save --push
ad-build image pull
ad-build image restore --delete
```

Use `AD_BUILD_PUBLIC_BASE_FROM`, `AD_BUILD_PUBLIC_BASE_DIGEST`, `AD_BUILD_PUBLIC_BASE_REGISTRY`, or `AD_BUILD_PUBLIC_BASE_IMAGE_REF` in CI when the platos base image or registry tag should be supplied externally.
