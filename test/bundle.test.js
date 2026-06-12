const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const bundle = require('../lib/bundle');
const core = require('../lib/core');

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-bundle-'));
  run('git', ['init'], repo);
  run('git', ['config', 'user.email', 'ad-build@example.invalid'], repo);
  run('git', ['config', 'user.name', 'ad-build'], repo);
  fs.mkdirSync(path.join(repo, 'apps/foo'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'ad_packet'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'source\n');
  fs.writeFileSync(path.join(repo, 'tracked.txt'), 'before\n');
  run('git', ['add', '.'], repo);
  run('git', ['commit', '-m', 'initial'], repo);
  return repo;
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed: ${result.stderr}`);
  return result;
}

test('dev bundle records tracked modified files and excludes full package dirs', () => {
  const repo = makeRepo();
  fs.writeFileSync(path.join(repo, 'tracked.txt'), 'compiled side effect\n');
  fs.writeFileSync(path.join(repo, 'apps/foo/foo.o'), 'object\n');
  fs.writeFileSync(path.join(repo, 'ad_packet/rootfs.bin'), 'large package data\n');

  bundle.packBundle({ repoRoot: repo, profile: 'dev', out: 'dev-state.tar' });
  const manifest = core.readJson(path.join(repo, '.ad-build', 'bundle', 'latest', 'manifest.json'));
  const paths = manifest.files.map((entry) => entry.path);

  assert.ok(paths.includes('tracked.txt'));
  assert.ok(paths.includes('apps/foo/foo.o'));
  assert.ok(!paths.includes('ad_packet/rootfs.bin'));
  assert.equal(manifest.profile, 'dev');
});

test('full bundle includes full packaging directories', () => {
  const repo = makeRepo();
  fs.writeFileSync(path.join(repo, 'ad_packet/rootfs.bin'), 'large package data\n');

  bundle.packBundle({ repoRoot: repo, profile: 'full', out: 'full-state.tar' });
  const manifest = core.readJson(path.join(repo, '.ad-build', 'bundle', 'latest', 'manifest.json'));
  const paths = manifest.files.map((entry) => entry.path);

  assert.ok(paths.includes('ad_packet/rootfs.bin'));
  assert.equal(manifest.profile, 'full');
});

test('restore inventory lets source-only diff filter restored build side effects', () => {
  const sourceRepo = makeRepo();
  fs.writeFileSync(path.join(sourceRepo, 'tracked.txt'), 'compiled side effect\n');
  fs.writeFileSync(path.join(sourceRepo, 'apps/foo/foo.o'), 'object\n');
  const bundlePath = path.join(sourceRepo, 'compiled-state.tar');
  const pack = bundle.packBundle({ repoRoot: sourceRepo, profile: 'dev', out: bundlePath });

  const restoreRepo = makeRepo();
  const restore = bundle.restoreBundle({ repoRoot: restoreRepo, bundle: bundlePath });
  const cleanSourceDiff = bundle.runSourceOnlyDiff({ repoRoot: restoreRepo });
  fs.writeFileSync(path.join(restoreRepo, 'apps/foo/foo.c'), 'developer change\n');
  const changedSourceDiff = bundle.runSourceOnlyDiff({ repoRoot: restoreRepo });

  assert.equal(pack.files_count >= 2, true);
  assert.equal(restore.restored_count >= 2, true);
  assert.deepEqual(cleanSourceDiff.files.map((entry) => entry.path), []);
  assert.deepEqual(changedSourceDiff.files.map((entry) => entry.path), ['apps/foo/foo.c']);
});
