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
printf '%s' "$TOKEN" | ad-build public-base auth login --token-stdin --json
ad-build public-base pack --out public-base.tar --json
ad-build public-base check --bundle public-base.tar --integrity-only --json
ad-build public-base publish --branch release-AD7.0.29R2 --bundle public-base.tar --push --json
ad-build public-base use --branch release-AD7.0.29R2 --json
ad-build public-base status --json
ad-build image status
ad-build image save [--push]
ad-build image pull
ad-build image restore [--delete]
ad-build diff
ad-build map
ad-build modules
ad-build verify <module...>
ad-build report <run-id>
ad-build completion install --shell bash
```

Copy `templates/module-map.yaml` to `tools/module-map.yaml` in the target repository and adjust module paths/build commands before using `map`, `modules`, or `verify`.

`public-base` is the recommended first-stage workflow. It stores only the public dependency layer needed for app-local verification: `obj/lib64/`, `include/`, `obj/bin/`, `libs/rdma-core-2404mlnx51/build/include/`, `KERNEL_VER`, and `OS_PLATFORM.file`.

Copy `templates/public-base.yaml` to `tools/public-base.yaml` only when the repository needs to override the default public-base paths.

## Public-base file workflow

First CI run or trusted AD build node:

```bash
ad-build full-build -- ./compile.sh
read -r -s -p "Git token: " TOKEN
printf '\n'
printf '%s' "$TOKEN" | ad-build public-base auth login --token-stdin --json
unset TOKEN
ad-build public-base auth status --json
ad-build public-base pack --out /root/public-base.tar --json
ad-build public-base check --bundle /root/public-base.tar --integrity-only --json
ad-build public-base publish --branch release-AD7.0.29R2 --bundle /root/public-base.tar --push --json
```

Developer restore flow:

```bash
ad-build public-base auth status --json
ad-build public-base use --branch release-AD7.0.29R2 --json
ad-build public-base status --json
ad-build map
ad-build verify <module>
```

`public-base pack` fails if any required restore path is missing. Use `--allow-partial` only for deliberate diagnostics.

The low-level restore stage may overwrite Git-clean tracked files from the trusted bundle. It refuses local modifications, untracked conflicts, symlinks, directories, and unsafe paths. Normal users should run `public-base use`, not call low-level restore directly.

If `public-base check --integrity-only` outputs `status: invalid`, do not restore and do not continue verify. Download `public-base.tar` again, or rebuild it in a trusted full-build workspace with `ad-build public-base pack`.

The default public-base artifact repository is fixed:

```text
https://git.sangfor.com/69765/ad-build-public-base.git
```

Do not manually clone this repository or manually derive latest artifact paths in normal use. Use `ad-build public-base use --branch <release-dir> --json`.

Do not store `public-base.tar` in the AD source repository. Normal shipped CLI flow must publish it only through `ad-build public-base publish --push` into the fixed `ad-build-public-base` repository together with its manifest, inventory, and sha256 sidecar.

`ad-build public-base publish --push` writes:

```text
ad-build-public-base/<branch>/latest.json
ad-build-public-base/<branch>/sha256-<key>/public-base.tar
ad-build-public-base/<branch>/sha256-<key>/manifest.json
ad-build-public-base/<branch>/sha256-<key>/inventory.json
ad-build-public-base/<branch>/sha256-<key>/public-base.tar.sha256
```

`ad-build bundle pack --profile full` remains available for diagnostics, but it is not the recommended AD public-base workflow. Full compiled trees can include large package outputs such as `mkpacket/`, `ssipacket/`, and `ad_packet/`.

## Shell completion

Install Tab completion for the current user:

```bash
ad-build completion install --shell bash
```

The installer writes the completion script and adds a managed source block to the user's shell startup file. Start a new shell, or source the startup file, before using Tab completion.

For zsh:

```bash
ad-build completion install --shell zsh
```

You can also print the script without installing it:

```bash
ad-build completion bash
ad-build completion zsh
```

## Public base image workflow

The Docker base-image commands are retained for teams that explicitly use image-based recovery:

```bash
ad-build image status
ad-build image save --push
ad-build image pull
ad-build image restore --delete
```

Use `AD_BUILD_PUBLIC_BASE_FROM`, `AD_BUILD_PUBLIC_BASE_DIGEST`, `AD_BUILD_PUBLIC_BASE_REGISTRY`, or `AD_BUILD_PUBLIC_BASE_IMAGE_REF` in CI when the platos base image or registry tag should be supplied externally.
