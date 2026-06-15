# AGENTS.md

This file is the handoff index for AI agents working on this repository.

The project is the `ad-build` artifact overlay CLI for the current `appd` MVP. It replaces a manual full-build artifact restore procedure with deterministic CLI commands. The CLI must not call a model and must not reintroduce legacy public-base, bundle, image, baseline, diff, map, report, or manual shell repair workflows.

## Read First

- [AI operation Skill](skills/ad-build/SKILL.md): command whitelist, forbidden workflows, diagnostic rules, and final response fields for AI-assisted AD overlay work.
- [README](README.md): user-facing scope, install path, publisher/developer commands, diagnostics, and Skill delivery.
- [Artifact overlay operations](docs/artifact-overlay-operations.md): packaged operations guide for the supported appd overlay MVP.
- [Project overview](docs/project-overview.md): problem statement, supported scope, user roles, and current non-goals.
- [Code architecture](docs/code-architecture.md): module map, command dispatch, overlay lifecycle, state paths, and test structure.
- [CLI input/output contract](docs/cli-io-contract.md): stable commands, options, JSON/text outputs, exit behavior, and state files.
- [Overlay package contents](docs/overlay-package-contents.md): what the big AD overlay package includes, what it excludes, and how manifest/inventory/archive data is shaped.
- [Release artifacts](docs/release-artifacts.md): how to build and verify the CLI `.tgz` and `.zip` delivery packages without picking stale files.
- [Implementation notes and pitfalls](docs/implementation-notes.md): critical functions, safety checks, appd repair details, known traps, and maintenance rules.
- [Manual success flow reference](docs/manual-overlay-success-flow.md): historical manual appd restore path that the CLI is intended to reproduce. Treat it as reference only, not as user-facing instructions.
- [Next steps](docs/next-steps.md): current validation state and planned follow-up work.

## Development Rules

- Keep the public workflow on `login`, `logout`, `pack`, `publish`, `restore`, `status`, `doctor`, `repair`, `verify appd`, and `skill status`.
- Do not document or expose old workflows as a recommended path. Existing migration messages may mention legacy commands only to reject or translate them.
- Do not use manual `tar`, `sed`, `ln`, `make`, or `PREFIX_SOURCE` commands to replace the overlay CLI. Historical manual documents are background for implementation only.
- Keep state, cache, logs, and default overlay output under `$HOME/.ad-build/`; do not write CLI state into the AD source repository by default.
- `restore --force` is exceptional. It may continue past source drift or local overwrite conflicts only when the caller explicitly accepts that risk.
- A successful `verify appd` proves only the `appd` MVP path for the restored overlay. Do not claim all AD modules, full image packaging, or complete environment restoration.
- When changing code, update the matching document in `docs/` in the same change. If code and docs disagree, the code and tests are the source of truth until the docs are corrected.
- If old files such as `README-BUNDLE-USAGE.md` are present in a local workspace, treat them as deprecated historical material unless they have been explicitly brought back into the tracked overlay MVP documentation set.
- Do not publish from old root-level `*.tgz` or `ad-skills-*.zip` files. Release candidates should come from the current versioned `dist/ad-build-<version>.tgz` and `dist/ad-build-<version>.zip`.
- Version handoffs currently use `0.5.2` as the baseline; after this handoff, bump by `0.0.1` for each completed delivery unless the user specifies another version.

## Documentation Update Matrix

- CLI command, option, help text, JSON field, exit behavior: update `docs/cli-io-contract.md`, `README.md`, `docs/artifact-overlay-operations.md`, and `skills/ad-build/SKILL.md` when user-facing.
- Module ownership, dispatch, state paths, or test layout: update `docs/code-architecture.md`.
- Pack collection roots, inclusion/exclusion rules, manifest, inventory, archive validation, or appd required paths: update `docs/overlay-package-contents.md`.
- Restore conflict handling, source drift checks, path relocation, symlink behavior, DPDK/RDMA repair, log extraction, or safety pitfalls: update `docs/implementation-notes.md`.
- Product scope, solved pain points, non-goals, or manual-to-CLI design rationale: update `docs/project-overview.md`.
- Follow-up work, known limitations, or planned UX improvements: update `docs/next-steps.md`.
- CLI package generation or release artifact contents: update `docs/release-artifacts.md`, `package.json`, and `test/package-shape.test.js`.

## Verification Before Handoff

Run these checks before claiming a development change is complete:

```bash
npm test
git diff --check
```

For documentation-only changes, `git diff --check` is mandatory; `npm test` is still preferred because package-shape and CLI-surface tests catch accidental workflow drift.

Before publishing or handing off a release artifact, follow `docs/release-artifacts.md` and also verify:

```bash
npm pack --dry-run --json
tar -tf dist/ad-build-<version>.tgz
tar -tf dist/ad-build-<version>.zip
```

If symlink, archive safety, restore conflict, or DPDK repair behavior changed, explain whether Windows symlink skips affect the verification and whether a Linux or symlink-enabled run is still required.
