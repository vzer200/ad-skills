const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const core = require('../lib/core');
const { sha256File } = require('../lib/file-utils');
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
  fs.mkdirSync(path.join(repo, 'libs/rdma-core-2404mlnx51/build/include'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'apps/appd'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'libs'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'sinfor'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'mkpacket'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'obj/lib64/libshared.so'), 'shared library\n');
  fs.writeFileSync(path.join(repo, 'obj/bin/protoc'), 'tool\n');
  fs.writeFileSync(path.join(repo, 'include/shared.h'), 'header\n');
  fs.writeFileSync(path.join(repo, 'libs/rdma-core-2404mlnx51/build/include/rdma.h'), 'rdma header\n');
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

function makeSourceOnlyRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-source-only-'));
  fs.mkdirSync(path.join(repo, 'apps/appd'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'libs'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'sinfor'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'apps/appd/app.c'), 'app source\n');
  fs.writeFileSync(path.join(repo, 'libs/input.c'), 'lib input\n');
  fs.writeFileSync(path.join(repo, 'sinfor/sec.c'), 'sinfor input\n');
  fs.writeFileSync(path.join(repo, 'Makefile'), 'all:\n\ttrue\n');
  fs.writeFileSync(path.join(repo, 'app.mk'), 'APP=appd\n');
  run(repo, ['init']);
  run(repo, ['add', '.']);
  run(repo, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'initial']);
  return repo;
}

function runCli(repo, args, env = {}) {
  const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, ...env }
  });
}

function makeBareArtifactRepo() {
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-bare-'));
  runCommand('git', ['init', '--bare', bare], process.cwd());
  return bare;
}

function makeIsolatedCredentialEnv() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-cred-'));
  const credentials = path.join(home, 'git-credentials');
  const config = path.join(home, 'gitconfig');
  fs.writeFileSync(config, `[credential]\n\thelper = store --file=${credentials.replaceAll('\\', '/')}\n`);
  return {
    home,
    credentials,
    env: {
      HOME: home,
      USERPROFILE: home,
      XDG_CONFIG_HOME: home,
      GIT_CONFIG_GLOBAL: config,
      GIT_CONFIG_NOSYSTEM: '1'
    }
  };
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

test('public-base key tracks broad libs and sinfor build inputs', () => {
  const repo = makeRepo();
  const first = publicBase.runKey({ repoRoot: repo });

  fs.writeFileSync(path.join(repo, 'libs', 'CMakeLists.txt'), 'cmake config\n');
  const afterCmake = publicBase.runKey({ repoRoot: repo });
  fs.writeFileSync(path.join(repo, 'sinfor', 'configure'), '#!/bin/sh\n');
  const afterConfigure = publicBase.runKey({ repoRoot: repo });
  fs.writeFileSync(path.join(repo, 'sinfor', 'build.S'), 'asm source\n');
  const afterAsm = publicBase.runKey({ repoRoot: repo });
  fs.writeFileSync(path.join(repo, 'libs', 'config.in'), 'config template\n');
  const afterConfigTemplate = publicBase.runKey({ repoRoot: repo });

  assert.notEqual(afterCmake.public_base_key, first.public_base_key);
  assert.notEqual(afterConfigure.public_base_key, afterCmake.public_base_key);
  assert.notEqual(afterAsm.public_base_key, afterConfigure.public_base_key);
  assert.notEqual(afterConfigTemplate.public_base_key, afterAsm.public_base_key);
});

test('public-base key ignores generated libs and sinfor build side effects', () => {
  const repo = makeRepo();
  const first = publicBase.runKey({ repoRoot: repo });
  fs.mkdirSync(path.join(repo, 'libs/example/build'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'libs/example/tmp'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'libs/example/.deps'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'sinfor/example/build'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'sinfor/example/tmp'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'libs/example/build/generated.o'), 'object\n');
  fs.writeFileSync(path.join(repo, 'libs/example/tmp/generated.so'), 'shared\n');
  fs.writeFileSync(path.join(repo, 'libs/example/.deps/file.Po'), 'po\n');
  fs.writeFileSync(path.join(repo, 'sinfor/example/build/generated.pyc'), 'pyc\n');
  fs.writeFileSync(path.join(repo, 'sinfor/example/tmp/generated.a'), 'archive\n');
  const afterGenerated = publicBase.runKey({ repoRoot: repo });
  fs.writeFileSync(path.join(repo, 'sinfor/sec.c'), 'real sinfor change\n');
  const afterSource = publicBase.runKey({ repoRoot: repo });

  assert.equal(afterGenerated.public_base_key, first.public_base_key);
  assert.notEqual(afterSource.public_base_key, first.public_base_key);
  assert.equal(afterGenerated.top_level_counts.libs > 0, true);
  assert.equal(afterGenerated.extension_counts['.o'] || 0, 0);
});

test('public-base pack only stores configured public dependency paths', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}.tar`);
  const packed = publicBase.packPublicBase({ repoRoot: repo, out });
  const manifest = core.readJson(out.replace(/\.tar$/, '') + '.manifest.json');
  const paths = manifest.files.map((file) => file.path).sort();

  assert.equal(packed.files_count, 6);
  assert.deepEqual(paths, [
    'KERNEL_VER',
    'OS_PLATFORM.file',
    'include/shared.h',
    'libs/rdma-core-2404mlnx51/build/include/rdma.h',
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
  assert.equal(packed.files_count, 5);
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

  const restored = publicBase.restorePublicBase({ repoRoot: target, bundle: out, force: true });
  assert.equal(restored.restored_count, 6);
  assert.equal(fs.readFileSync(path.join(target, 'obj/lib64/libshared.so'), 'utf8'), 'shared library\n');
  assert.equal(fs.existsSync(path.join(target, '.ad-build/public-base/current.json')), true);
  assert.equal(fs.existsSync(path.join(target, '.ad-build/inventory/current.json')), true);

  const status = publicBase.runStatus({ repoRoot: target });
  assert.equal(status.status, 'restored');
  assert.equal(status.unchanged, 6);

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
  assert.equal(restored.restored_count, 6);
  assert.equal(fs.readFileSync(path.join(target, 'include/shared.h'), 'utf8'), 'header\n');
});

test('public-base restore rejects deleted and staged-deleted tracked files', () => {
  const source = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-deleted-conflict.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const deleted = makeRepo();
  fs.rmSync(path.join(deleted, 'include/shared.h'));
  assert.match(run(deleted, ['status', '--porcelain', '--', 'include/shared.h']), /D/);
  assert.throws(() => publicBase.restorePublicBase({ repoRoot: deleted, bundle: out }), /overwrite 1 changed public-base files/);
  assert.equal(fs.existsSync(path.join(deleted, 'include/shared.h')), false);
  assert.equal(core.readJson(path.join(deleted, '.ad-build/public-base/restore-conflicts.json')).conflicts[0].reason, 'tracked-file-deleted');

  const stagedDeleted = makeRepo();
  fs.rmSync(path.join(stagedDeleted, 'include/shared.h'));
  run(stagedDeleted, ['add', '-u', 'include/shared.h']);
  assert.match(run(stagedDeleted, ['status', '--porcelain', '--', 'include/shared.h']), /^D/);
  assert.throws(() => publicBase.restorePublicBase({ repoRoot: stagedDeleted, bundle: out }), /overwrite 1 changed public-base files/);
  assert.equal(fs.existsSync(path.join(stagedDeleted, 'include/shared.h')), false);
  assert.equal(core.readJson(path.join(stagedDeleted, '.ad-build/public-base/restore-conflicts.json')).conflicts[0].reason, 'tracked-file-staged-deletion');
});

test('public-base restore rejects untracked and ignored untracked conflicts', () => {
  const source = makeRepo();
  fs.writeFileSync(path.join(source, 'include/generated.h'), 'generated header\n');
  fs.writeFileSync(path.join(source, 'include/ignored.h'), 'ignored generated header\n');
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-untracked-conflict.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const untracked = makeRepo();
  fs.writeFileSync(path.join(untracked, 'include/generated.h'), 'local untracked header\n');
  assert.match(run(untracked, ['status', '--porcelain', '--untracked-files=all', '--', 'include/generated.h']), /^\?\?/);
  assert.throws(() => publicBase.restorePublicBase({ repoRoot: untracked, bundle: out }), /overwrite 1 changed public-base files/);
  const untrackedReasons = core.readJson(path.join(untracked, '.ad-build/public-base/restore-conflicts.json')).conflicts.map((item) => item.reason);
  assert.deepEqual(untrackedReasons, ['untracked-file-conflict']);

  const ignored = makeRepo();
  fs.writeFileSync(path.join(ignored, '.gitignore'), 'include/ignored.h\n');
  run(ignored, ['add', '.gitignore']);
  run(ignored, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'ignore generated header']);
  fs.writeFileSync(path.join(ignored, 'include/ignored.h'), 'local ignored header\n');
  assert.match(run(ignored, ['status', '--porcelain', '--ignored', '--', 'include/ignored.h']), /^!!/);
  assert.throws(() => publicBase.restorePublicBase({ repoRoot: ignored, bundle: out }), /overwrite 1 changed public-base files/);
  const ignoredReasons = core.readJson(path.join(ignored, '.ad-build/public-base/restore-conflicts.json')).conflicts.map((item) => item.reason);
  assert.deepEqual(ignoredReasons, ['untracked-file-conflict']);
});

test('public-base restore creates missing generated files in source-only clean checkout', () => {
  const source = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-source-only.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const target = makeSourceOnlyRepo();
  const restored = publicBase.restorePublicBase({ repoRoot: target, bundle: out });

  assert.equal(restored.status, 'restored');
  assert.equal(fs.existsSync(path.join(target, 'obj/lib64/libshared.so')), true);
  assert.equal(fs.existsSync(path.join(target, 'obj/bin/protoc')), true);
  assert.equal(fs.existsSync(path.join(target, 'include/shared.h')), true);
  assert.equal(fs.existsSync(path.join(target, 'libs/rdma-core-2404mlnx51/build/include/rdma.h')), true);
  assert.equal(fs.existsSync(path.join(target, 'KERNEL_VER')), true);
  assert.equal(fs.existsSync(path.join(target, 'OS_PLATFORM.file')), true);
});

test('public-base restore rejects clean tracked public input differences', () => {
  const source = makeRepo();
  fs.writeFileSync(path.join(source, 'include/shared.h'), 'compiled public header\n');
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-public-input-conflict.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const target = makeRepo();
  assert.equal(run(target, ['status', '--porcelain']), '');
  assert.throws(() => publicBase.restorePublicBase({ repoRoot: target, bundle: out }), /overwrite 1 changed public-base files/);
  const conflicts = core.readJson(path.join(target, '.ad-build/public-base/restore-conflicts.json')).conflicts;
  assert.equal(conflicts[0].path, 'include/shared.h');
  assert.equal(conflicts[0].reason, 'public-input-differs');
  assert.equal(fs.readFileSync(path.join(target, 'include/shared.h'), 'utf8'), 'header\n');
});

test('public-base restore allows overwriting git-clean tracked files that differ', () => {
  const source = makeRepo();
  fs.writeFileSync(path.join(source, 'OS_PLATFORM.file'), 'compiled platform\n');
  run(source, ['add', 'OS_PLATFORM.file']);
  run(source, ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'compiled platform']);
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-clean-overwrite.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const target = makeRepo();
  assert.equal(run(target, ['status', '--porcelain']), '');
  const restored = publicBase.restorePublicBase({ repoRoot: target, bundle: out });

  assert.equal(restored.status, 'restored');
  assert.equal(fs.readFileSync(path.join(target, 'OS_PLATFORM.file'), 'utf8'), 'compiled platform\n');
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

test('public-base check supports integrity-only validation', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-integrity.tar`);
  publicBase.packPublicBase({ repoRoot: repo, out });
  fs.writeFileSync(path.join(repo, 'libs/input.c'), 'changed after pack\n');

  const valid = publicBase.runCheck({ repoRoot: repo, bundle: out, integrityOnly: true });
  assert.equal(valid.status, 'valid');
  assert.equal(valid.integrity_only, true);
  assert.equal(valid.current_key, undefined);

  fs.rmSync(out + '.sha256', { force: true });
  const missingSidecar = publicBase.runCheck({ repoRoot: repo, bundle: out, integrityOnly: true });
  assert.equal(missingSidecar.status, 'invalid');
  assert.equal(missingSidecar.sidecar_status, 'missing');

  fs.writeFileSync(out + '.sha256', 'sha256:0000000000000000000000000000000000000000000000000000000000000000  public-base.tar\n');
  const invalid = publicBase.runCheck({ repoRoot: repo, bundle: out, integrityOnly: true });
  assert.equal(invalid.status, 'invalid');
});

test('public-base CLI emits json and integrity-only exit codes', () => {
  const repo = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-json.tar`);
  const pack = runCli(repo, ['public-base', 'pack', '--out', out, '--json']);
  assert.equal(pack.status, 0, pack.stderr);
  assert.equal(JSON.parse(pack.stdout).status, 'packed');

  fs.writeFileSync(path.join(repo, 'libs/input.c'), 'changed after pack\n');
  const check = runCli(repo, ['public-base', 'check', '--bundle', out, '--integrity-only', '--json']);
  assert.equal(check.status, 0, check.stderr);
  assert.equal(JSON.parse(check.stdout).status, 'valid');

  const mismatch = runCli(repo, ['public-base', 'check', '--bundle', out, '--json']);
  assert.equal(mismatch.status, 6);
  assert.equal(JSON.parse(mismatch.stdout).status, 'mismatch');
});

test('public-base CLI emits json for unknown commands', () => {
  const repo = makeRepo();
  const result = runCli(repo, ['public-base', 'unknown-command', '--json']);

  assert.equal(result.status, 2);
  assert.equal(result.stderr, '');
  const body = JSON.parse(result.stdout);
  assert.equal(body.status, 'error');
  assert.equal(body.command, 'unknown-command');
});

test('public-base CLI emits json error payloads for restore conflicts', () => {
  const source = makeRepo();
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-json-conflict.tar`);
  publicBase.packPublicBase({ repoRoot: source, out });

  const target = makeRepo();
  fs.writeFileSync(path.join(target, 'include/shared.h'), 'local header change\n');
  const restore = runCli(target, ['public-base', 'restore', '--bundle', out, '--json']);

  assert.equal(restore.status, 5);
  assert.equal(restore.stderr, '');
  const body = JSON.parse(restore.stdout);
  assert.equal(body.status, 'error');
  assert.equal(body.command, 'restore');
  assert.match(body.error, /overwrite 1 changed public-base files/);
  assert.equal(fs.existsSync(path.join(target, '.ad-build/public-base/restore-conflicts.json')), true);
});

test('public-base auth login accepts token from stdin without exposing it', () => {
  const repo = makeRepo();
  const isolated = makeIsolatedCredentialEnv();

  try {
    const login = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'ad-build.js'), 'public-base', 'auth', 'login', '--token-stdin', '--json'], {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, ...isolated.env },
      input: 'secret-token\n'
    });
    assert.equal(login.status, 0, login.stderr || login.stdout);
    const body = JSON.parse(login.stdout);
    assert.equal(body.status, 'stored');
    assert.equal(JSON.stringify(body).includes('secret-token'), false);
    assert.equal(fs.readFileSync(isolated.credentials, 'utf8').includes('secret-token'), true);
  } finally {
    fs.rmSync(isolated.home, { recursive: true, force: true });
  }
});

test('public-base auth login requires token stdin', () => {
  const repo = makeRepo();

  const login = runCli(repo, ['public-base', 'auth', 'login', '--json']);

  assert.equal(login.status, 2);
  assert.equal(login.stderr, '');
  const body = JSON.parse(login.stdout);
  assert.equal(body.status, 'error');
  assert.equal(body.command, 'auth');
  assert.match(body.error, /--token-stdin/);
});

test('public-base CLI rejects runtime artifact repo URL overrides', () => {
  const repo = makeRepo();
  const bare = makeBareArtifactRepo();
  const result = runCli(repo, ['public-base', 'auth', 'status', '--json'], {
    AD_BUILD_PUBLIC_BASE_TEST_MODE: '1',
    AD_BUILD_PUBLIC_BASE_REPO_URL: `file://${bare.replaceAll('\\', '/')}`
  });

  assert.equal(result.status, 2);
  assert.equal(result.stderr, '');
  const body = JSON.parse(result.stdout);
  assert.equal(body.status, 'error');
  assert.match(body.error, /AD_BUILD_PUBLIC_BASE_REPO_URL/);
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

  const invalid = publicBase.runCheck({ repoRoot: repo, bundle: bad });
  assert.equal(invalid.status, 'invalid');
  assert.match(invalid.error, /sha256 mismatch/);
  assert.equal(fs.existsSync(path.join(repo, '.ad-build/public-base/check.json')), true);
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

  const invalidInventory = publicBase.runCheck({ repoRoot: repo, bundle: badInventory });
  assert.equal(invalidInventory.status, 'invalid');
  assert.match(invalidInventory.error, /inventory file count/);

  fs.writeFileSync(out + '.sha256', 'sha256:0000000000000000000000000000000000000000000000000000000000000000  public-base.tar\n');
  const invalid = publicBase.runCheck({ repoRoot: repo, bundle: out });
  assert.equal(invalid.status, 'invalid');
  assert.equal(invalid.sidecar_status, 'mismatch');
});

test('public-base publish rejects missing sha256 sidecar', () => {
  const repo = makeRepo();
  const artifactRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-repo-missing-sidecar-'));
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-missing-sidecar.tar`);
  publicBase.packPublicBase({ repoRoot: repo, out });
  fs.rmSync(out + '.sha256', { force: true });

  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2',
    bundle: out
  }), /bundle sha256 sidecar is missing/);
});

test('public-base publish writes branch and key scoped artifact repository layout', () => {
  const repo = makeRepo();
  const artifactRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-repo-'));
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-publish.tar`);
  const packed = publicBase.packPublicBase({ repoRoot: repo, out });

  const published = publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2',
    bundle: out
  });

  const releaseDir = path.join(artifactRepo, 'release-AD7.0.29R2');
  const keyDir = path.join(releaseDir, `sha256-${packed.public_base_key_short}`);
  assert.equal(published.publish_dir, keyDir.replaceAll('\\', '/'));
  assert.equal(fs.existsSync(path.join(keyDir, 'public-base.tar')), true);
  assert.equal(fs.existsSync(path.join(keyDir, 'manifest.json')), true);
  assert.equal(fs.existsSync(path.join(keyDir, 'inventory.json')), true);
  assert.equal(fs.existsSync(path.join(keyDir, 'public-base.tar.sha256')), true);

  const latest = core.readJson(path.join(releaseDir, 'latest.json'));
  assert.equal(latest.public_base_key, packed.public_base_key);
  assert.equal(latest.bundle, `sha256-${packed.public_base_key_short}/public-base.tar`);
  assert.equal(latest.manifest, `sha256-${packed.public_base_key_short}/manifest.json`);
  assert.equal(latest.inventory, `sha256-${packed.public_base_key_short}/inventory.json`);
  assert.equal(latest.sha256, `sha256-${packed.public_base_key_short}/public-base.tar.sha256`);
});

test('public-base publish rejects malicious manifest short keys and invalid branch paths', () => {
  const repo = makeRepo();
  const artifactRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-repo-bad-'));
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-bad-short-source.tar`);
  const bad = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-bad-short.tar`);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-bad-short-'));
  publicBase.packPublicBase({ repoRoot: repo, out });
  runCommand('tar', ['-xf', out, '-C', staging], repo);
  const manifestPath = path.join(staging, 'manifest.json');
  const manifest = core.readJson(manifestPath);
  manifest.public_base_key_short = '../escape';
  core.writeJson(manifestPath, manifest);
  runCommand('tar', ['-cf', bad, '-C', staging, 'manifest.json', 'inventory.json', 'files'], repo);

  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2',
    bundle: bad
  }), /public_base_key_short/);
  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: '.git/hooks',
    bundle: out
  }), /invalid public-base branch/);
  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: '-bad-release',
    bundle: out
  }), /invalid public-base branch/);
});

test('public-base publish validates latest pack summary before default publish', () => {
  const repo = makeRepo();
  const artifactRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-repo-stale-'));
  const out = path.join(repo, 'public-base.tar');
  publicBase.packPublicBase({ repoRoot: repo, out });
  const summaryPath = path.join(repo, '.ad-build/public-base/latest/pack-summary.json');
  const summary = core.readJson(summaryPath);
  summary.bundle_sha256 = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
  core.writeJson(summaryPath, summary);

  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2'
  }), /latest public-base bundle sha256 mismatch/);

  delete summary.bundle_sha256;
  summary.public_base_key = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
  core.writeJson(summaryPath, summary);
  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2'
  }), /latest public-base pack summary missing bundle_sha256/);
});

test('public-base publish rejects unsafe existing artifact repo paths and residual directories', (t) => {
  const repo = makeRepo();
  const artifactRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-repo-unsafe-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-outside-'));
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-unsafe.tar`);
  const packed = publicBase.packPublicBase({ repoRoot: repo, out });
  const release = path.join(artifactRepo, 'release-AD7.0.29R2');
  fs.mkdirSync(release, { recursive: true });
  const keyDir = path.join(release, `sha256-${packed.public_base_key_short}`);
  fs.mkdirSync(keyDir, { recursive: true });
  fs.writeFileSync(path.join(keyDir, 'public-base.tar'), 'stale partial bundle\n');

  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2',
    bundle: out
  }), /non-empty publish target/);

  fs.rmSync(release, { recursive: true, force: true });
  try {
    fs.symlinkSync(outside, release, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    t.skip(`symlink creation unavailable: ${error.message}`);
    return;
  }
  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2',
    bundle: out
  }), /symlink|junction|not a directory/);
});

test('public-base publish rejects symlinked publish leaf files', (t) => {
  const repo = makeRepo();
  const artifactRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-repo-leaf-'));
  const outside = path.join(os.tmpdir(), `ad-build-public-base-outside-${Date.now()}-${process.pid}`);
  fs.writeFileSync(outside, 'outside\n');
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-leaf.tar`);
  const packed = publicBase.packPublicBase({ repoRoot: repo, out });
  publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2',
    bundle: out
  });
  const keyDir = path.join(artifactRepo, 'release-AD7.0.29R2', `sha256-${packed.public_base_key_short}`);
  fs.rmSync(path.join(keyDir, 'public-base.tar'));
  try {
    fs.symlinkSync(outside, path.join(keyDir, 'public-base.tar'));
  } catch (error) {
    t.skip(`symlink creation unavailable: ${error.message}`);
    return;
  }

  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2',
    bundle: out
  }), /symlink|junction/);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'outside\n');
});

test('public-base publish rejects symlinked latest file', (t) => {
  const repo = makeRepo();
  const artifactRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-repo-latest-'));
  const outside = path.join(os.tmpdir(), `ad-build-public-base-latest-outside-${Date.now()}-${process.pid}`);
  fs.writeFileSync(outside, 'outside\n');
  const out = path.join(os.tmpdir(), `public-base-${Date.now()}-${process.pid}-latest.tar`);
  publicBase.packPublicBase({ repoRoot: repo, out });
  const releaseDir = path.join(artifactRepo, 'release-AD7.0.29R2');
  fs.mkdirSync(releaseDir, { recursive: true });
  try {
    fs.symlinkSync(outside, path.join(releaseDir, 'latest.json'));
  } catch (error) {
    t.skip(`symlink creation unavailable: ${error.message}`);
    return;
  }

  assert.throws(() => publicBase.publishPublicBase({
    repoRoot: repo,
    repo: artifactRepo,
    branch: 'release-AD7.0.29R2',
    bundle: out
  }), /symlink|junction/);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'outside\n');
});

test('public-base CLI publish rejects local repo and requires push', () => {
  const repo = makeRepo();
  const artifactRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-repo-cli-'));
  const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');
  const out = path.join(repo, 'public-base.tar');
  publicBase.packPublicBase({ repoRoot: repo, out });

  const publish = spawnSync(process.execPath, [cli, 'public-base', 'publish', '--repo', artifactRepo, '--branch', 'release-AD7.0.29R2'], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(publish.status, 2);
  assert.match(publish.stderr, /requires --push|does not accept --repo/);

  const publishEnv = spawnSync(process.execPath, [cli, 'public-base', 'publish', '--branch', 'release-AD7.0.29R2', '--push'], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, AD_BUILD_PUBLIC_BASE_REPO: artifactRepo }
  });
  assert.equal(publishEnv.status, 2);
  assert.match(publishEnv.stderr, /does not accept --repo|AD_BUILD_PUBLIC_BASE_REPO/);
  assert.equal(fs.existsSync(path.join(artifactRepo, 'release-AD7.0.29R2', 'latest.json')), false);
});

test('public-base publish --push and use operate through managed cache repository', () => {
  const repo = makeRepo();
  const bare = makeBareArtifactRepo();
  const out = path.join(repo, 'public-base.tar');
  publicBase.packPublicBase({ repoRoot: repo, out });

  const publish = publicBase.publishPublicBaseWithGit({
    repoRoot: repo,
    branch: 'release-AD7.0.29R2',
    bundle: out,
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  });
  assert.match(publish.status, /published|no_changes/);
  const repeatedPublish = publicBase.publishPublicBaseWithGit({
    repoRoot: repo,
    branch: 'release-AD7.0.29R2',
    bundle: out,
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  });
  assert.equal(repeatedPublish.status, 'no_changes');

  const target = makeSourceOnlyRepo();
  const summary = publicBase.usePublicBase({
    repoRoot: target,
    branch: 'release-AD7.0.29R2',
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  });
  assert.equal(summary.status, 'ready');
  assert.equal(fs.existsSync(path.join(target, 'libs/rdma-core-2404mlnx51/build/include/rdma.h')), true);
  assert.equal(core.readJson(path.join(target, '.ad-build/public-base/use-summary.json')).status, 'ready');
});

test('public-base use reports artifact repository git failures as runtime failures', () => {
  const repo = makeRepo();
  const missing = path.join(os.tmpdir(), `ad-build-public-base-missing-${Date.now()}-${process.pid}`);

  assert.throws(() => publicBase.usePublicBase({
    repoRoot: repo,
    branch: 'release-AD7.0.29R2',
    repoUrl: `file://${missing.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  }), (error) => {
    assert.equal(error.exitCode, 4);
    assert.match(error.message, /git clone failed|public-base artifact repository unavailable/);
    return true;
  });
});

test('public-base use --json preserves invalid domain status on integrity failure', () => {
  const repo = makeRepo();
  const bare = makeBareArtifactRepo();
  const out = path.join(repo, 'public-base.tar');
  publicBase.packPublicBase({ repoRoot: repo, out });
  publicBase.publishPublicBaseWithGit({
    repoRoot: repo,
    branch: 'release-AD7.0.29R2',
    bundle: out,
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  });

  const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-corrupt-clone-'));
  runCommand('git', ['clone', bare, clone], process.cwd());
  const releaseDir = path.join(clone, 'release-AD7.0.29R2');
  const latest = core.readJson(path.join(releaseDir, 'latest.json'));
  const bundlePath = path.join(releaseDir, latest.bundle);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-bad-use-'));
  runCommand('tar', ['-xf', bundlePath, '-C', staging], releaseDir);
  const inventoryPath = path.join(staging, 'inventory.json');
  const inventory = core.readJson(inventoryPath);
  inventory.files = [];
  core.writeJson(inventoryPath, inventory);
  runCommand('tar', ['-cf', bundlePath, '-C', staging, 'manifest.json', 'inventory.json', 'files'], releaseDir);
  latest.bundle_sha256 = sha256File(bundlePath);
  core.writeJson(path.join(releaseDir, 'latest.json'), latest);
  fs.writeFileSync(path.join(releaseDir, latest.sha256), `${latest.bundle_sha256}  public-base.tar\n`);
  runCommand('git', ['add', 'latest.json', latest.bundle, latest.sha256], releaseDir);
  runCommand('git', ['-c', 'user.email=a@b.c', '-c', 'user.name=test', 'commit', '-m', 'corrupt bundle'], releaseDir);
  runCommand('git', ['push'], releaseDir);

  let stdout = '';
  let stderr = '';
  const target = makeSourceOnlyRepo();
  const code = publicBase.runPublicBaseCli(['use', '--branch', 'release-AD7.0.29R2', '--json'], {
    repoRoot: target,
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true,
    stdout: { write: (value) => { stdout += value; } },
    stderr: { write: (value) => { stderr += value; } }
  });

  assert.equal(code, 5);
  assert.equal(stderr, '');
  const body = JSON.parse(stdout);
  assert.equal(body.status, 'invalid');
  assert.equal(body.command, 'use');
  assert.equal(body.exit_code, 5);
  assert.match(body.error, /integrity validation/);
  assert.equal(core.readJson(path.join(target, '.ad-build/public-base/use-summary.json')).status, 'invalid');
});

test('public-base use overwrites stale ready summary on later failure', () => {
  const repo = makeRepo();
  const bare = makeBareArtifactRepo();
  const out = path.join(repo, 'public-base.tar');
  publicBase.packPublicBase({ repoRoot: repo, out });
  publicBase.publishPublicBaseWithGit({
    repoRoot: repo,
    branch: 'release-AD7.0.29R2',
    bundle: out,
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  });

  const target = makeSourceOnlyRepo();
  publicBase.usePublicBase({
    repoRoot: target,
    branch: 'release-AD7.0.29R2',
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  });
  const summaryPath = path.join(target, '.ad-build/public-base/use-summary.json');
  assert.equal(core.readJson(summaryPath).status, 'ready');

  fs.rmSync(bare, { recursive: true, force: true });
  assert.throws(() => publicBase.usePublicBase({
    repoRoot: target,
    branch: 'release-AD7.0.29R2',
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  }), /git fetch failed|git/);

  const failed = core.readJson(summaryPath);
  assert.equal(failed.status, 'error');
  assert.equal(failed.branch, 'release-AD7.0.29R2');
  assert.equal(failed.stage, 'cache');
  assert.match(failed.error, /git fetch failed|git/);
});

test('public-base managed cache rejects symlinked cache paths', (t) => {
  const repo = makeRepo();
  const bare = makeBareArtifactRepo();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-cache-outside-'));
  const cacheDir = path.join(repo, '.ad-build', 'cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  try {
    fs.symlinkSync(outside, path.join(cacheDir, 'public-base-repo'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    t.skip(`symlink creation unavailable: ${error.message}`);
    return;
  }
  const out = path.join(repo, 'public-base.tar');
  publicBase.packPublicBase({ repoRoot: repo, out });

  assert.throws(() => publicBase.publishPublicBaseWithGit({
    repoRoot: repo,
    branch: 'release-AD7.0.29R2',
    bundle: out,
    repoUrl: `file://${bare.replaceAll('\\', '/')}`,
    allowRepoOverride: true
  }), /symlink|junction|real path/);
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
