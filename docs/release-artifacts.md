# Release Artifacts

This document is for maintainers packaging the `ad-build` CLI itself. It does not describe the AD overlay package produced by `ad-build pack`.

## Artifact Types

CLI delivery artifacts:

```text
dist/ad-build-<version>.tgz
dist/ad-build-<version>.zip
```

Repository source handoff artifact:

```text
dist/ad-build-<version>-source.zip
```

AD overlay artifact:

```text
ad-artifact-overlay.tar.gz
```

Do not confuse them. The CLI delivery artifacts contain JavaScript runtime files, README, the packaged operations guide, and the Skill. The source handoff zip contains the current repository source/documentation snapshot for AI or human handoff, generated from tracked files only. The AD overlay artifact contains generated AD build outputs from a trusted full-build workspace.

## Build Current Version

The version comes from `package.json`. The current handoff baseline is `0.5.4`; after this release, increment patch versions by `0.0.1` for each follow-up delivery unless the user explicitly asks for a different version.

PowerShell:

```powershell
$version = node -p "require('./package.json').version"
New-Item -ItemType Directory -Force dist | Out-Null
Remove-Item -Recurse -Force dist/.stage -ErrorAction SilentlyContinue
Remove-Item -Force "dist/ad-build-$version.tgz" -ErrorAction SilentlyContinue
Remove-Item -Force "dist/ad-build-$version.zip" -ErrorAction SilentlyContinue

npm pack --pack-destination dist
New-Item -ItemType Directory -Force dist/.stage | Out-Null
tar -xzf "dist/ad-build-$version.tgz" -C dist/.stage
Push-Location dist/.stage/package
Compress-Archive -Path * -DestinationPath "../../ad-build-$version.zip" -Force
Pop-Location
```

The zip intentionally contains the package files at the archive root, while the npm tarball contains a `package/` prefix.

## Build Source Handoff Zip

Generate this only when the handoff explicitly needs a repository source snapshot. It is not an npm package and does not replace the runtime delivery artifacts.

PowerShell:

```powershell
$version = node -p "require('./package.json').version"
New-Item -ItemType Directory -Force dist | Out-Null
Remove-Item -Force "dist/ad-build-$version-source.zip" -ErrorAction SilentlyContinue

# Add tracked repository files at archive root. Keep dist/, logs, and old archives out.
$entries = git ls-files | Where-Object { $_ -notmatch '^(dist|logs?)/' -and $_ -notmatch '\.(log|zip|tgz)$' }
# Use a zip writer that preserves forward-slash entry names.
```

The repository ignores `*.zip` by default. If a source handoff zip must be committed, add only that exact file with `git add -f dist/ad-build-<version>-source.zip`; do not use `git add .`.

## Verify Contents

```powershell
$version = node -p "require('./package.json').version"
npm pack --dry-run --json
tar -tzf "dist/ad-build-$version.tgz"
tar -tf "dist/ad-build-$version.zip"
tar -tf "dist/ad-build-$version-source.zip"
```

Expected runtime file set:

```text
README.md
bin/ad-build.js
docs/artifact-overlay-operations.md
lib/completion.js
lib/core.js
lib/file-utils.js
lib/login.js
lib/overlay.js
lib/skill.js
package.json
skills/ad-build/SKILL.md
```

The tarball shows these paths with a `package/` prefix. The zip shows them without that prefix.

The source handoff zip should contain repository files with POSIX-style paths, and must not contain `dist/`, logs, old zips, or npm tarballs.

## Stale Artifact Warning

Do not publish or hand off:

```text
ad-build-0.1.0.tgz
ad-skills-*.zip
dist/ad-build-overlay-mvp-*.zip
```

Those are historical local files and are ignored by Git. Always regenerate artifacts for the current `package.json` version before handoff.

When replacing a committed source handoff zip with a new version, remove the previous tracked `dist/ad-build-<old-version>-source.zip` and force-add only the newly generated `dist/ad-build-<version>-source.zip`.

## Package Boundary

The npm package is governed by `package.json.files` and tested by `test/package-shape.test.js`.

If user-facing docs are added to the shipped package, update both:

```text
package.json
test/package-shape.test.js
```

Most handoff docs, including `AGENTS.md` and the architecture docs, are repository-maintenance material and are not shipped in the npm package unless this boundary is deliberately changed.
