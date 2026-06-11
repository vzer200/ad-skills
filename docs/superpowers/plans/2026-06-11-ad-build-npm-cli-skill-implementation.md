# AD Build NPM CLI + Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an npm-installable `ad-build` CLI package, an AI Skill, npm tarball, and final project zip artifact.

**Architecture:** Implement the CLI in Node.js using only built-in modules. Keep all model reasoning out of the CLI. The npm package exposes `ad-build` through `bin/ad-build.js`, ships template config under `templates/`, and reads project-local `tools/module-map.yaml` at runtime.

**Tech Stack:** Node.js built-ins, `node:test`, `assert`, `child_process`, `fs`, `crypto`, `path`, `os`.

---

## File Structure

- Create: `package.json`  
  NPM metadata, `bin`, allowlisted `files`, no install lifecycle scripts, no dependencies.
- Create: `bin/ad-build.js`  
  Shebang CLI entrypoint.
- Create: `lib/core.js`  
  Shared helpers: canonical JSON, digests, git/env metadata, paths, JSON/Markdown writing.
- Create: `lib/module-map.js`  
  Strict YAML subset parser, module-map normalization, built-in high-risk rules, path matching.
- Create: `lib/commands.js`  
  Command implementations: doctor, precheck, full-build, baseline-save, diff, map, modules, verify, report.
- Create: `templates/module-map.yaml`  
  Starter project-local config template.
- Create: `tools/module-map.yaml`  
  Repo-local default config for smoke tests and local use.
- Create: `test/ad-build.test.js`  
  Node test suite.
- Create: `skills/ad-build/SKILL.md`  
  AI Skill.

## Task 1: Package Skeleton And Core Helpers

**Files:**
- Create: `package.json`
- Create: `bin/ad-build.js`
- Create: `lib/core.js`
- Create: `test/ad-build.test.js`

- [ ] **Step 1: Write failing tests**

Add tests:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../lib/core');
const pkg = require('../package.json');

test('canonical JSON digest is order stable', () => {
  assert.equal(core.digestJson({ b: 2, a: 1 }), core.digestJson({ a: 1, b: 2 }));
  assert.match(core.digestJson({ a: 1 }), /^sha256:[a-f0-9]{64}$/);
});

test('package has safe npm delivery shape', () => {
  assert.equal(pkg.bin['ad-build'], 'bin/ad-build.js');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.optionalDependencies, undefined);
  assert.equal(pkg.bundledDependencies, undefined);
  assert.ok(!pkg.scripts?.preinstall);
  assert.ok(!pkg.scripts?.install);
  assert.ok(!pkg.scripts?.postinstall);
  assert.ok(pkg.files.includes('bin'));
  assert.ok(pkg.files.includes('lib'));
});

test('compute ref key handles detached head', () => {
  const out = core.computeRefKey('', '0'.repeat(40));
  assert.equal(out.ref, `DETACHED:${'0'.repeat(40)}`);
  assert.match(out.refKey, /^sha256:[a-f0-9]{64}$/);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test test/ad-build.test.js
```

Expected: fail because files do not exist.

- [ ] **Step 3: Implement package skeleton and helpers**

Implement:

```js
canonicalJson(value)
digestJson(value)
safeDigestKey(digest)
nowIso()
computeRefKey(symbolicRef, commit)
writeJson(file, value)
readJson(file)
```

`bin/ad-build.js` must start with:

```js
#!/usr/bin/env node
```

For now it may print help and exit 0.

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
node --test test/ad-build.test.js
```

Expected: all Task 1 tests pass.

## Task 2: Module Map Parser And Risk Rules

**Files:**
- Create: `lib/module-map.js`
- Create: `templates/module-map.yaml`
- Create: `tools/module-map.yaml`
- Modify: `test/ad-build.test.js`

- [ ] **Step 1: Write failing tests**

Add tests:

```js
const moduleMap = require('../lib/module-map');

test('built-in high-risk packaging and signing rules are always present', () => {
  const config = moduleMap.normalizeModuleMap({ modules: {} });
  const patterns = config.riskRulesHigh.map((rule) => rule.pattern);
  assert.ok(patterns.includes('tools/module-map.yaml'));
  assert.ok(patterns.includes('sign/**'));
  assert.ok(patterns.includes('upgrade_framework/**'));
});

test('globstar and basename path matching works', () => {
  assert.equal(moduleMap.pathMatches('apps/foo/bar.mk', '**/*.mk'), true);
  assert.equal(moduleMap.pathMatches('apps/foo/Makefile.test', 'Makefile*'), true);
  assert.equal(moduleMap.pathMatches('packet/a/b.txt', 'packet/**'), true);
});

test('strict yaml subset parses starter module map', () => {
  const parsed = moduleMap.parseModuleMapYaml('modules:\\n  snmp:\\n    paths:\\n      - apps/snmp/**\\n    build:\\n      - make -C apps/snmp\\n');
  assert.deepEqual(parsed.modules.snmp.paths, ['apps/snmp/**']);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test test/ad-build.test.js
```

- [ ] **Step 3: Implement parser, normalizer, matchers**

Implement strict YAML subset only: nested objects by two-space indentation, `- item` arrays, string scalars, `{}` empty object. Reject unsupported syntax with a clear error.

Ensure `risk_rules.high` only appends to built-in rules and duplicate risk matches are deduplicated.

- [ ] **Step 4: Add template and project-local module maps**

Create both `templates/module-map.yaml` and `tools/module-map.yaml` with starter `snmp` config.

- [ ] **Step 5: Run test to verify pass**

Run:

```bash
node --test test/ad-build.test.js
```

## Task 3: Doctor And Modules Commands

**Files:**
- Create: `lib/commands.js`
- Modify: `bin/ad-build.js`
- Modify: `test/ad-build.test.js`

- [ ] **Step 1: Write failing tests**

Add tests:

```js
const commands = require('../lib/commands');

test('doctor reports node and baseline checks', async () => {
  const result = await commands.buildDoctorResult({ repoRoot: process.cwd(), baselineDir: null, moduleMapPath: 'tools/module-map.yaml' });
  assert.equal(result.schema_version, 1);
  assert.ok(result.checks.some((check) => check.name === 'node_available'));
  assert.ok(result.checks.some((check) => check.name === 'baseline_dir_configured'));
});

test('modules result exposes verify metadata', () => {
  const result = commands.buildModulesResult({ moduleMapPath: 'tools/module-map.yaml' });
  assert.ok(result.modules.some((module) => module.name === 'snmp'));
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test test/ad-build.test.js
```

- [ ] **Step 3: Implement doctor/modules and CLI dispatch**

`node bin/ad-build.js doctor` writes `.ad-build/doctor.json` and `.ad-build/doctor.md`.  
`node bin/ad-build.js modules` writes `.ad-build/modules.json` and `.ad-build/modules.md`.

- [ ] **Step 4: Run tests and smoke commands**

Run:

```bash
node --test test/ad-build.test.js
node bin/ad-build.js doctor
node bin/ad-build.js modules
```

Expected: tests pass and outputs exist.

## Task 4: Diff And Map Commands

**Files:**
- Modify: `lib/commands.js`
- Modify: `test/ad-build.test.js`

- [ ] **Step 1: Write failing tests**

Add tests using a temporary git repo:

```js
test('diff includes untracked files with unknown binary state', async () => {
  const repo = await createTempGitRepo();
  fs.writeFileSync(path.join(repo, 'new.txt'), 'x');
  const result = commands.buildDiffSummary({ repoRoot: repo, baseRef: 'HEAD' });
  const item = result.files.find((file) => file.path === 'new.txt');
  assert.equal(item.status, 'untracked');
  assert.equal(item.is_binary, null);
});

test('map marks module-map changes untrusted', () => {
  const diff = { files: [{ path: 'tools/module-map.yaml', status: 'modified', old_path: null, is_untracked: false, is_binary: false }] };
  const result = commands.buildMapResult({ diffSummary: diff, moduleMapConfig: moduleMap.normalizeModuleMap({ modules: {} }) });
  assert.equal(result.mapping_trusted, false);
  assert.ok(result.risk_matches.length > 0);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test test/ad-build.test.js
```

- [ ] **Step 3: Implement diff/map**

Use `git diff --name-status --find-renames=50% --find-copies=50%`, `git ls-files --others --exclude-standard`, and `git diff --numstat` per the spec. `map` regenerates diff by default.

- [ ] **Step 4: Run tests and smoke commands**

Run:

```bash
node --test test/ad-build.test.js
node bin/ad-build.js diff
node bin/ad-build.js map
```

## Task 5: Metadata, Full Build, Baseline Save, Precheck

**Files:**
- Modify: `lib/core.js`
- Modify: `lib/commands.js`
- Modify: `test/ad-build.test.js`

- [ ] **Step 1: Write failing tests**

Add tests:

```js
test('baseline path partitions by repo commit and env', () => {
  const p = commands.baselinePath('/shared', 'sha256:' + 'a'.repeat(64), '0'.repeat(40), 'sha256:' + 'b'.repeat(64));
  assert.match(p.replaceAll('\\\\', '/'), /\\/repos\\/a{64}\\/commits\\/0{40}\\/env\\/b{64}\\/baseline\\.json$/);
});

test('baseline save rejects when publish mode is disabled', () => {
  const result = commands.validateBaselineSave({ exit_code: 0 }, { publishEnabled: false });
  assert.equal(result.ok, false);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test test/ad-build.test.js
```

- [ ] **Step 3: Implement metadata/full-build/baseline/precheck**

Record `ad_build_version`, `ad_build_source_digest`, full commit SHA, ref/ref_key, repo_key, env_key. `baseline-save` must require publish env vars and reject mismatched metadata.

- [ ] **Step 4: Run tests and smoke commands**

Run:

```bash
node --test test/ad-build.test.js
node bin/ad-build.js full-build -- node -e "console.log('ok')"
node bin/ad-build.js baseline-save --from-run latest
node bin/ad-build.js precheck
```

Expected: tests pass. Without `AD_BUILD_BASELINE_PUBLISH=1`, `baseline-save` exits 4 with a safety error.

## Task 6: Verify And Report

**Files:**
- Modify: `lib/commands.js`
- Modify: `test/ad-build.test.js`

- [ ] **Step 1: Write failing tests**

Add:

```js
test('verify records command-level not_run after failure', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-verify-'));
  const module = {
    name: 'demo',
    cwd: '.',
    build: ['node -e "process.exit(1)"', 'node -e "console.log(1)"'],
    timeout_seconds: 30,
    env: {},
    log_name: 'demo'
  };
  const summary = await commands.runVerifyModules({ repoRoot: repo, modules: [module], runRoot: path.join(repo, '.ad-build', 'runs') });
  assert.equal(summary.overall_status, 'partial');
  assert.equal(summary.results[0].status, 'failed');
  assert.equal(summary.results[0].commands[1].status, 'not_run');
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test test/ad-build.test.js
```

- [ ] **Step 3: Implement verify/report**

Implement sequential verify, command-level status, logs, report markdown, and partial summary handling.

- [ ] **Step 4: Run tests and smoke commands**

Run:

```bash
node --test test/ad-build.test.js
node bin/ad-build.js verify snmp
RUN_ID=$(node -e "const fs=require('fs'); const r=fs.readdirSync('.ad-build/runs').sort(); console.log(r.at(-1));")
node bin/ad-build.js report "$RUN_ID"
```

## Task 7: AI Skill

**Files:**
- Create: `skills/ad-build/SKILL.md`

- [ ] **Step 1: Create Skill file**

Create valid frontmatter:

```yaml
---
name: ad-build
description: Use when Codex needs to decide whether AD project changes need pre-change full build verification, inspect ad-build CLI outputs, select module verification, or explain ad-build verify/report logs. The CLI is deterministic and never calls a model; this skill teaches AI agents how to use it safely.
---
```

- [ ] **Step 2: Write Skill content**

Include workflow and safety rules from the design, using installed command `ad-build ...` and fallback local command `node bin/ad-build.js ...`.

- [ ] **Step 3: Validate frontmatter manually**

Confirm `SKILL.md` frontmatter contains only `name` and `description`.

## Task 8: NPM Packaging And Zip

**Files:**
- Create generated artifacts under `dist/`

- [ ] **Step 1: Run full verification**

Run:

```bash
node --test test/ad-build.test.js
node bin/ad-build.js doctor
node bin/ad-build.js modules
node bin/ad-build.js diff
node bin/ad-build.js map
npm pack --dry-run
```

- [ ] **Step 2: Build npm tarball**

Run:

```bash
npm pack --pack-destination dist
```

- [ ] **Step 3: Verify tarball install**

Run:

```bash
npm install -g "$(Get-ChildItem dist\\*.tgz | Select-Object -First 1)"
ad-build doctor
```

On non-Windows shells, use equivalent `npm install -g dist/*.tgz`.

- [ ] **Step 4: Create project zip and manifest**

Create `dist/artifact-manifest.json` with git branch, commit, npm tarball path, npm tarball sha256, zip path, generated_at, and included file list. Create a zip excluding `.git/`, `.ad-build/`, `node_modules/`, unrelated transient files, and old zips.

- [ ] **Step 5: Final status**

Run:

```bash
git status --short
```

Confirm intended source files and generated `dist/` artifacts are present.
