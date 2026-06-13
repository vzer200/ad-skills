const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const core = require('../lib/core');
const publicBase = require('../lib/public-base');

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
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-'));
  fs.mkdirSync(path.join(repo, 'obj/lib64'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'obj/bin'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'include'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'apps/appd'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'libs'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'sinfor'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'mkpacket'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'obj/lib64/libshared.so'), 'shared library\n');
  fs.writeFileSync(path.join(repo, 'obj/bin/protoc'), 'tool\n');
  fs.writeFileSync(path.join(repo, 'include/shared.h'), 'header\n');
  fs.writeFileSync(path.join(repo, 'KERNEL_VER'), '5.10\n');
  fs.writeFileSync(path.join(repo, 'OS_PLATFORM.file'), 'platos\n');
  fs.writeFileSync(path.join(repo, 'apps/appd/app.c'), 'app source\n');
  fs.writeFileSync(path.join(repo, 'libs/input.c'), 'lib input\n');
  fs.writeFileSync(path.join(repo, 'sinfor/sec.c'), 'sinfor input\n');
  fs.writeFileSync(path.join(repo, 'mkpacket/package.ssu'), 'release package\n');
  fs.writeFileSync(path.join(repo, 'Makefile'), 'all:\n\ttrue\n');
  fs.writeFileSync(path.join(repo, 'app.mk'), 'APP=appd\n');
  run(repo, ['init']);
  run(repo, ['add', '.']);
  run(repo, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'initial']);
  return repo;
}

test('public-base key ignores apps changes but changes when public inputs change', () => {
  const repo = makeRepo();
  const first = publicBase.runKey({ repoRoot: repo });
  fs.writeFileSync(path.join(repo, 'apps/appd/app.c'), 'app changed\n');
  const afterApp = publicBase.runKey({ repoRoot: repo });
  fs.writeFileSync(path.join(repo, 'libs/input.c'), 'lib changed\n');
  const afterLib = publicBase.runKey({ repoRoot: repo });

  assert.match(first.public_base_key, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first.public_base_key, afterApp.public_base_key);
  assert.notEqual(first.public_base_key, afterLib.public_base_key);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/public-base/key.json')), true);
});

test('public-base pack only stores configured public dependency paths', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}.tar`);
  const packed = publicBase.packPublicBase({ repoRoot: repo, out });
  const manifest = core.readJson(out.replace(/\.tar$/, '') + '.manifest.json');
  const paths = manifest.files.map((file) => file.path).sort();

  assert.equal(packed.files_count, 5);
  assert.deepEqual(paths, [
    'KERNEL_VER',
    'OS_PLATFORM.file',
    'include/shared.h',
    'obj/bin/protoc',
    'obj/lib64/libshared.so'
  ]);
  assert.equal(paths.some((file) => file.startsWith('apps/')), false);
  assert.equal(paths.some((file) => file.startsWith('mkpacket/')), false);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/public-base/latest/pack-summary.json')), true);
});

test('public-base pack rejects missing required restore paths unless partial is explicit', () => {
  const repo = makeRepo();
  fs.rmSync(path.join(repo, 'obj/bin'), { recursive: true, force: true });
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-missing.tar`);

  assert.throws(() => publicBase.packPublicBase({ repoRoot: repo, out }), /restore paths are missing/);

  const packed = publicBase.packPublicBase({ repoRoot: repo, out, allowPartial: true });
  assert.equal(packed.files_count, 4);
  assert.equal(packed.warnings.some((warning) => warning.type === 'missing_restore_dir' && warning.path === 'obj/bin'), true);
});

test('public-base pack rejects required restore paths with the wrong file type', () => {
  const repo = makeRepo();
  fs.rmSync(path.join(repo, 'obj/bin'), { recursive: true, force: true });
  fs.writeFileSync(path.join(repo, 'obj/bin'), 'not a directory\n');

  assert.throws(() => publicBase.packPublicBase({
    repoRoot: repo,
    out: path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-invalid-dir.tar`)
  }), /obj\/bin/);
});

test('public-base restore writes current inventory and status detects restored changed and missing files', () => {
  const source = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-restore.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const target = makeRepo();
  fs.rmSync(path.join(target, 'obj'), { recursive: true, force: true });
  fs.rmSync(path.join(target, 'include'), { recursive: true, force: true });
  fs.rmSync(path.join(target, 'KERNEL_VER'), { force: true });
  fs.rmSync(path.join(target, 'OS_PLATFORM.file'), { force: true });

  const restored = publicBase.restorePublicBase({ repoRoot: target, bundle: out });
  assert.equal(restored.restored_count, 5);
  assert.equal(fs.readFileSync(path.join(target, 'obj/lib64/libshared.so'), 'utf8'), 'shared library\n');
  assert.equal(fs.existsSync(path.join(target, '.ad-build/public-base/current.json')), true);
  assert.equal(fs.existsSync(path.join(target, '.ad-build/inventory/current.json')), true);

  const status = publicBase.runStatus({ repoRoot: target });
  assert.equal(status.status, 'restored');
  assert.equal(status.unchanged, 5);

  fs.writeFileSync(path.join(target, 'include/shared.h'), 'changed header\n');
  const changed = publicBase.runStatus({ repoRoot: target });
  assert.equal(changed.status, 'changed');
  assert.equal(changed.changed, 1);

  fs.rmSync(path.join(target, 'obj/bin/protoc'));
  const partial = publicBase.runStatus({ repoRoot: target });
  assert.equal(partial.status, 'partial');
  assert.equal(partial.missing, 1);
});

test('public-base restore refuses to overwrite changed existing files unless forced', () => {
  const source = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-conflict.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const target = makeRepo();
  fs.writeFileSync(path.join(target, 'include/shared.h'), 'local header change\n');

  assert.throws(() => publicBase.restorePublicBase({ repoRoot: target, bundle: out }), /overwrite 1 changed public-base files/);
  assert.equal(fs.readFileSync(path.join(target, 'include/shared.h'), 'utf8'), 'local header change\n');
  assert.equal(fs.existsSync(path.join(target, '.ad-build/public-base/restore-conflicts.json')), true);

  const restored = publicBase.restorePublicBase({ repoRoot: target, bundle: out, force: true });
  assert.equal(restored.restored_count, 5);
  assert.equal(fs.readFileSync(path.join(target, 'include/shared.h'), 'utf8'), 'header\n');
});

test('public-base restore rejects target type conflicts before writing any files', () => {
  const source = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-target-dir.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const target = makeRepo();
  fs.rmSync(path.join(target, 'include/shared.h'), { force: true });
  fs.mkdirSync(path.join(target, 'include/shared.h'));
  fs.writeFileSync(path.join(target, 'KERNEL_VER'), 'local kernel change\n');

  assert.throws(() => publicBase.restorePublicBase({ repoRoot: target, bundle: out, force: true }), /restore target is a directory/);
  assert.equal(fs.readFileSync(path.join(target, 'KERNEL_VER'), 'utf8'), 'local kernel change\n');
  assert.equal(fs.existsSync(path.join(target, '.ad-build/public-base/current.json')), false);
});

test('public-base check compares current public input key with bundle key', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-check.tar`);
  publicBase.packPublicBase({ repoRoot: repo, out });

  const matched = publicBase.runCheck({ repoRoot: repo, bundle: out });
  assert.equal(matched.status, 'matched');

  fs.writeFileSync(path.join(repo, 'libs/input.c'), 'lib changed\n');
  const mismatch = publicBase.runCheck({ repoRoot: repo, bundle: out });
  assert.equal(mismatch.status, 'mismatch');
  assert.notEqual(mismatch.current_key, mismatch.bundle_key);
});

test('public-base check validates bundled file content before reporting matched', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-tamper-source.tar`);
  const bad = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-tamper-bad.tar`);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-tamper-'));
  publicBase.packPublicBase({ repoRoot: repo, out });
  runCommand('tar', ['-xf', out, '-C', staging], repo);
  fs.writeFileSync(path.join(staging, 'files', 'include', 'shared.h'), 'tampered header\n');
  runCommand('tar', ['-cf', bad, '-C', staging, 'manifest.json', 'inventory.json', 'files'], repo);

  assert.throws(() => publicBase.runCheck({ repoRoot: repo, bundle: bad }), /sha256 mismatch/);
});

test('public-base check rejects incomplete inventory and invalid sha256 sidecar', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-inventory-source.tar`);
  const badInventory = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-inventory-bad.tar`);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-inventory-'));
  publicBase.packPublicBase({ repoRoot: repo, out });
  runCommand('tar', ['-xf', out, '-C', staging], repo);
  const inventoryPath = path.join(staging, 'inventory.json');
  const inventory = core.readJson(inventoryPath);
  inventory.files = [];
  core.writeJson(inventoryPath, inventory);
  runCommand('tar', ['-cf', badInventory, '-C', staging, 'manifest.json', 'inventory.json', 'files'], repo);

  assert.throws(() => publicBase.runCheck({ repoRoot: repo, bundle: badInventory }), /inventory file count/);

  fs.writeFileSync(out + '.sha256', 'sha256:0000000000000000000000000000000000000000000000000000000000000000  public-base.tar\n');
  const invalid = publicBase.runCheck({ repoRoot: repo, bundle: out });
  assert.equal(invalid.status, 'invalid');
  assert.equal(invalid.sidecar_status, 'mismatch');
});

test('CLI wrapper exposes public-base commands', () => {
  const repo = makeRepo();
  const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-cli.tar`);
  const pack = spawnSync(process.execPath, [cli, 'public-base', 'pack', '--out', out], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(pack.status, 0, pack.stderr);
  assert.match(pack.stdout, /public-base/);

  const status = spawnSync(process.execPath, [cli, 'public-base', 'status'], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.notEqual(status.status, 0);

  const restore = spawnSync(process.execPath, [cli, 'public-base', 'restore', '--bundle', out], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(restore.status, 0, restore.stderr);

  const check = spawnSync(process.execPath, [cli, 'public-base', 'check', '--bundle', out], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(check.status, 0, check.stderr);
});
