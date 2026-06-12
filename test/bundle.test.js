const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const bundle = require('../lib/bundle');
const core = require('../lib/core');

function run(repo, args) {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-bundle-test-'));
  fs.mkdirSync(path.join(repo, 'apps/foo'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'cfg'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'int main(void) { return 0; }\n');
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'before\n');
  fs.writeFileSync(path.join(repo, 'tools/module-map.yaml'), [
    'modules:',
    '  foo:',
    '    paths:',
    '      - apps/foo/**',
    '    cwd: .',
    '    build:',
    '      - echo build foo',
    '    timeout_seconds: 60',
    '    env: {}',
    '    log_name: foo',
    ''
  ].join('\n'));
  run(repo, ['init']);
  run(repo, ['add', '.']);
  run(repo, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'initial']);
  return repo;
}

test('bundle restore inventory suppresses restored compiled-state files and keeps later source changes', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}.tar`);
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'after full build\n');
  fs.mkdirSync(path.join(repo, 'libs'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'libs/libfoo.so'), 'compiled-lib\n');

  const packed = bundle.packBundle({ repoRoot: repo, profile: 'full', out });
  assert.equal(fs.existsSync(out), true);
  assert.equal(packed.files_count >= 2, true);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/bundle/latest/pack-summary.json')), true);

  run(repo, ['reset', '--hard']);
  run(repo, ['clean', '-fd']);
  const restored = bundle.restoreBundle({ repoRoot: repo, bundle: out });
  assert.equal(restored.commit_mismatch, false);
  assert.equal(restored.inventory_path.endsWith('.ad-build/inventory/current.json'), true);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/inventory/current.json')), true);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/bundle/restore', restored.run_id, 'restore-summary.json')), true);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/bundle/restore', restored.run_id, 'restore.log')), true);
  assert.equal(fs.existsSync(path.join(repo, 'libs/libfoo.so')), true);

  const diffAfterRestore = bundle.runSourceOnlyDiff({ repoRoot: repo });
  assert.equal(diffAfterRestore.inventory_path, '.ad-build/inventory/current.json');
  assert.deepEqual(diffAfterRestore.files.map((file) => file.path), []);
  assert.equal(diffAfterRestore.suppressed_files_count >= 2, true);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/diff-source-only.json')), true);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/diff-source-only.txt')), true);

  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'int main(void) { return 1; }\n');
  const diffAfterEdit = bundle.runSourceOnlyDiff({ repoRoot: repo });
  assert.deepEqual(diffAfterEdit.files.map((file) => file.path), ['apps/foo/foo.c']);

  const mapped = bundle.runSourceOnlyMap({ repoRoot: repo });
  assert.deepEqual(mapped.valid_verify_modules, ['foo']);
});

test('inventory status reports restored file state', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-2.tar`);
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'after full build\n');
  bundle.packBundle({ repoRoot: repo, profile: 'full', out });
  run(repo, ['reset', '--hard']);
  bundle.restoreBundle({ repoRoot: repo, bundle: out });

  const status = bundle.runInventoryStatus({ repoRoot: repo });
  assert.equal(status.inventory_found, true);
  assert.equal(status.changed, 0);
  assert.equal(status.missing, 0);
  assert.equal(status.unchanged >= 1, true);
  const stored = core.readJson(status.status_path);
  assert.equal(stored.inventory_found, true);
});

test('source-only diff honors base ref and source-only map refreshes stale diff', () => {
  const repo = makeRepo();
  const base = run(repo, ['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'int main(void) { return 2; }\n');
  run(repo, ['add', '.']);
  run(repo, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'source change']);

  const diffFromBase = bundle.runSourceOnlyDiff({ repoRoot: repo, baseRef: base });
  assert.deepEqual(diffFromBase.files.map((file) => file.path), ['apps/foo/foo.c']);

  fs.writeFileSync(path.join(repo, '.ad-build', 'diff-summary.json'), JSON.stringify({
    schema_version: 1,
    source_only: true,
    files: [],
    warnings: []
  }));
  const mapped = bundle.runSourceOnlyMap({ repoRoot: repo, baseRef: base });
  assert.deepEqual(mapped.valid_verify_modules, ['foo']);
});

test('restore rejects bundles with missing staged files before writing inventory', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-bad-source.tar`);
  const bad = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-bad.tar`);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-bad-bundle-'));
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'after full build\n');
  bundle.packBundle({ repoRoot: repo, profile: 'full', out });
  runCommand('tar', ['-xf', out, '-C', staging], repo);
  fs.rmSync(path.join(staging, 'files', 'cfg', 'version'));
  runCommand('tar', ['-cf', bad, '-C', staging, 'manifest.json', 'inventory.json', 'files'], repo);
  run(repo, ['reset', '--hard']);

  assert.throws(() => bundle.restoreBundle({ repoRoot: repo, bundle: bad }), /missing file in bundle|sha256/i);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/inventory/current.json')), false);
});

test('source-only diff suppresses restored deletions from inventory', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-delete.tar`);
  fs.rmSync(path.join(repo, 'cfg/version'));
  bundle.packBundle({ repoRoot: repo, profile: 'full', out });
  run(repo, ['reset', '--hard']);
  bundle.restoreBundle({ repoRoot: repo, bundle: out });

  const diff = bundle.runSourceOnlyDiff({ repoRoot: repo });
  assert.deepEqual(diff.files.map((file) => file.path), []);
  assert.equal(diff.suppressed_files.some((file) => file.path === 'cfg/version' && file.reason === 'matches-restore-inventory-deletion'), true);
});

test('source-only diff does not trust pack-time inventory as restore inventory', () => {
  const repo = makeRepo();
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'after full build\n');
  bundle.packBundle({ repoRoot: repo, profile: 'full', out: path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-pack-only.tar`) });

  const diff = bundle.runSourceOnlyDiff({ repoRoot: repo });

  assert.equal(diff.inventory_found, false);
  assert.deepEqual(diff.files.map((file) => file.path), ['cfg/version']);
});

test('source-only diff keeps restored deletion visible when commit mismatch was allowed', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-delete-mismatch.tar`);
  fs.rmSync(path.join(repo, 'cfg/version'));
  bundle.packBundle({ repoRoot: repo, profile: 'full', out });
  run(repo, ['reset', '--hard']);
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'next commit content\n');
  run(repo, ['add', '.']);
  run(repo, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'move ahead']);

  bundle.restoreBundle({ repoRoot: repo, bundle: out, allowCommitMismatch: true });
  const diff = bundle.runSourceOnlyDiff({ repoRoot: repo });

  assert.deepEqual(diff.files.map((file) => file.path), ['cfg/version']);
});

test('restore rejects manifest file entries without sha256', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-sha-source.tar`);
  const bad = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-sha-bad.tar`);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-bad-sha-bundle-'));
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'after full build\n');
  bundle.packBundle({ repoRoot: repo, profile: 'full', out });
  runCommand('tar', ['-xf', out, '-C', staging], repo);
  const manifestPath = path.join(staging, 'manifest.json');
  const manifest = core.readJson(manifestPath);
  delete manifest.files.find((file) => file.path === 'cfg/version').sha256;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  runCommand('tar', ['-cf', bad, '-C', staging, 'manifest.json', 'inventory.json', 'files'], repo);
  run(repo, ['reset', '--hard']);

  assert.throws(() => bundle.restoreBundle({ repoRoot: repo, bundle: bad }), /sha256/i);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/inventory/current.json')), false);
});

test('restore rejects bundle file content that does not match manifest sha256', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-tamper-source.tar`);
  const bad = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-tamper-bad.tar`);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-tampered-bundle-'));
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'after full build\n');
  bundle.packBundle({ repoRoot: repo, profile: 'full', out });
  runCommand('tar', ['-xf', out, '-C', staging], repo);
  fs.writeFileSync(path.join(staging, 'files', 'cfg', 'version'), 'tampered\n');
  runCommand('tar', ['-cf', bad, '-C', staging, 'manifest.json', 'inventory.json', 'files'], repo);
  run(repo, ['reset', '--hard']);

  assert.throws(() => bundle.restoreBundle({ repoRoot: repo, bundle: bad }), /sha256 mismatch/i);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/inventory/current.json')), false);
});

test('CLI restore allow-commit-mismatch exits zero after explicit override', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-mismatch.tar`);
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'after full build\n');
  bundle.packBundle({ repoRoot: repo, profile: 'full', out });
  run(repo, ['reset', '--hard']);
  fs.writeFileSync(path.join(repo, 'apps/foo/other.c'), 'int other(void) { return 0; }\n');
  run(repo, ['add', '.']);
  run(repo, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'move ahead']);

  const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');
  const rejected = spawnSync(process.execPath, [cli, 'bundle', 'restore', '--bundle', out], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(rejected.status, 4, rejected.stderr);

  const allowed = spawnSync(process.execPath, [cli, 'bundle', 'restore', '--bundle', out, '--allow-commit-mismatch'], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(allowed.status, 0, allowed.stderr);
});

test('CLI wrapper covers bundle inspect inventory status and source-only map', () => {
  const repo = makeRepo();
  const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');
  const out = path.join(os.tmpdir(), `ad-build-state-${Date.now()}-${process.pid}-cli.tar`);
  fs.writeFileSync(path.join(repo, 'cfg/version'), 'after full build\n');
  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'int main(void) { return 3; }\n');
  const pack = spawnSync(process.execPath, [cli, 'bundle', 'pack', '--profile', 'full', '--out', out], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(pack.status, 0, pack.stderr);
  assert.match(pack.stdout, /wrote /);

  const inspect = spawnSync(process.execPath, [cli, 'bundle', 'inspect', '--bundle', out], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(inspect.status, 0, inspect.stderr);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/bundle/inspect.json')), true);

  run(repo, ['reset', '--hard']);
  run(repo, ['clean', '-fd']);
  const restore = spawnSync(process.execPath, [cli, 'bundle', 'restore', '--bundle', out], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(restore.status, 0, restore.stderr);

  const inventory = spawnSync(process.execPath, [cli, 'inventory', 'status'], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(inventory.status, 0, inventory.stderr);

  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'int main(void) { return 4; }\n');
  const mapped = spawnSync(process.execPath, [cli, 'map', '--source-only'], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(mapped.status, 0, mapped.stderr);
  assert.match(mapped.stdout, /module-map-result\.json/);
  const result = core.readJson(path.join(repo, '.ad-build/module-map-result.json'));
  assert.deepEqual(result.valid_verify_modules, ['foo']);
});

test('CLI source-only commands pass --base through to bundle logic', () => {
  const repo = makeRepo();
  const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');
  const base = run(repo, ['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'int main(void) { return 5; }\n');
  run(repo, ['add', '.']);
  run(repo, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'source change']);

  const diff = spawnSync(process.execPath, [cli, 'diff', '--source-only', '--base', base], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(diff.status, 0, diff.stderr);
  const diffResult = core.readJson(path.join(repo, '.ad-build/diff-source-only.json'));
  assert.deepEqual(diffResult.files.map((file) => file.path), ['apps/foo/foo.c']);

  const mapped = spawnSync(process.execPath, [cli, 'map', '--source-only', '--base', base], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(mapped.status, 0, mapped.stderr);
  const mapResult = core.readJson(path.join(repo, '.ad-build/module-map-result.json'));
  assert.deepEqual(mapResult.valid_verify_modules, ['foo']);
});

test('CLI wrapper keeps image command delegated and source-only outputs documented paths', () => {
  const repo = makeRepo();
  const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');
  const image = spawnSync(process.execPath, [cli, 'image', 'status', '--no-docker'], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(image.status, 0, image.stderr);

  const diff = spawnSync(process.execPath, [cli, 'diff', '--source-only'], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(diff.status, 0, diff.stderr);
  assert.match(diff.stdout, /diff-source-only\.json/);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/diff-source-only.json')), true);
});
