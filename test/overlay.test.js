const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const core = require('../lib/core');
const overlay = require('../lib/overlay');

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function write(root, rel, content = '') {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

function mkdir(root, rel) {
  const dir = path.join(root, rel);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function runGit(root, args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `git ${args.join(' ')} failed\n${result.stderr}\n${result.stdout}`);
  return result.stdout.trim();
}

function initRepo(root) {
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'ad-build-test']);
  runGit(root, ['config', 'user.email', 'ad-build-test@example.invalid']);
  runGit(root, ['checkout', '-b', 'release-test']);
  write(root, 'README.md', 'fixture\n');
  runGit(root, ['add', 'README.md']);
  runGit(root, ['commit', '-m', 'init']);
}

function makeCompiledProducer() {
  const root = tmpDir('ad-build-overlay-producer-');
  initRepo(root);

  write(root, 'obj/lib64/libadconf.so', 'lib');
  write(root, 'obj/bin/ad_build_tool', 'bin');
  write(root, 'app_bin/x86_64/app/usr/lib64/libadconf.so', 'lib');
  write(root, 'include/generated.h', '#define GENERATED 1\n');
  write(root, 'libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h', '#define MLX5DV 1\n');
  write(root, 'libs/rdma-core-2404mlnx51/build/lib/pkgconfig/libibverbs.pc', 'includedir=/root/AD/libs/rdma-core-2404mlnx51/build/include\n');
  write(root, 'apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build/meson-private/coredata.dat', 'prefix=/root/AD\n');
  write(root, 'apps/ad_appd_new/main.c', 'int main(void){return 0;}\n');
  mkdir(root, 'apps/ad_appd_new/libs/dpdk/tmp_install');

  const linkPath = path.join(root, 'libs/rdma-core-2404mlnx51/build/include/infiniband/verbs.h');
  try {
    fs.symlinkSync('/root/AD/libs/rdma-core-2404mlnx51/libibverbs/verbs.h', linkPath, 'file');
  } catch {
    // Windows without symlink privilege still exercises the file restore path.
  }

  runGit(root, ['add', 'apps/ad_appd_new/main.c']);
  runGit(root, ['commit', '-m', 'source']);
  return root;
}

function makeConsumerRepo() {
  const root = tmpDir('ad-build-overlay-consumer-');
  initRepo(root);
  return root;
}

test('overlay pack, publish, and use restore relocatable artifacts idempotently', () => {
  const producer = makeCompiledProducer();
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const packed = overlay.packOverlay({
    repoRoot: producer,
    branch: 'release-test',
    sourceRoot: '/root/AD',
    out: 'overlay-out',
    env: process.env
  });
  assert.equal(packed.status, 'packed');
  assert.ok(packed.entries_count > 0);

  const published = overlay.publishOverlay({
    repoRoot: producer,
    branch: 'release-test',
    overlay: packed.artifact_path,
    repo: artifactRepo,
    noPush: true,
    env: process.env
  });
  assert.match(published.latest_path, /latest-artifact-overlay\.json/);

  const consumer = makeConsumerRepo();
  const firstUse = overlay.useOverlay({
    repoRoot: consumer,
    branch: 'release-test',
    repo: artifactRepo,
    allowSourceDrift: true,
    env: process.env
  });
  assert.equal(firstUse.status, 'ready');

  const pcPath = path.join(consumer, 'libs/rdma-core-2404mlnx51/build/lib/pkgconfig/libibverbs.pc');
  const pcText = normalize(fs.readFileSync(pcPath, 'utf8'));
  assert.ok(pcText.includes(normalize(consumer)), pcText);
  assert.doesNotMatch(pcText, /\/root\/AD/);

  const linkPath = path.join(consumer, 'libs/rdma-core-2404mlnx51/build/include/infiniband/verbs.h');
  if (fs.existsSync(linkPath) || isSymlink(linkPath)) {
    const target = normalize(fs.readlinkSync(linkPath));
    assert.ok(target.includes(normalize(consumer)), target);
    assert.doesNotMatch(target, /\/root\/AD/);
  }

  const secondUse = overlay.useOverlay({
    repoRoot: consumer,
    branch: 'release-test',
    repo: artifactRepo,
    allowSourceDrift: true,
    env: process.env
  });
  assert.equal(secondUse.status, 'ready');
});

test('overlay pack rejects workspaces missing appd-required artifacts', () => {
  const producer = tmpDir('ad-build-overlay-incomplete-');
  initRepo(producer);

  assert.throws(
    () => overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env }),
    /required appd overlay path is missing/
  );
});

test('overlay use rejects local changes to managed artifacts without force', () => {
  const producer = makeCompiledProducer();
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env: process.env });

  const consumer = makeConsumerRepo();
  overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, allowSourceDrift: true, env: process.env });
  write(consumer, 'obj/lib64/libadconf.so', 'local change');

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, allowSourceDrift: true, env: process.env }),
    /would overwrite|local paths/
  );
});

test('overlay use rejects unsafe archive members before extraction', () => {
  const consumer = makeConsumerRepo();
  const artifactRepo = tmpDir('ad-build-overlay-bad-artifacts-');
  const releaseDir = path.join(artifactRepo, 'release-test');
  const publishDir = path.join(releaseDir, 'artifact-overlay', 'sha256-badbadbadbad');
  fs.mkdirSync(publishDir, { recursive: true });
  const staging = tmpDir('ad-build-overlay-bad-tar-');
  write(staging, 'safe.txt', 'safe');
  const outside = path.join(path.dirname(staging), 'evil.txt');
  fs.writeFileSync(outside, 'evil');
  const artifact = path.join(publishDir, 'ad-artifact-overlay.tar.gz');
  const tar = spawnSync('tar', ['-czf', artifact, '-C', staging, 'safe.txt', '-C', path.dirname(staging), path.basename(outside), '--transform', `s#${path.basename(outside)}#../evil.txt#`], {
    encoding: 'utf8'
  });
  if (tar.status !== 0) {
    return;
  }

  const inventory = { schema_version: 1, kind: 'ad-build-artifact-overlay-inventory', entries: [] };
  const manifest = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay',
    release: 'release-test',
    source_branch: 'release-test',
    source_commit: null,
    source_root_at_pack_time: '/root/AD',
    artifact_path: 'release-test/artifact-overlay/sha256-badbadbadbad/ad-artifact-overlay.tar.gz',
    artifact_sha256: require('../lib/file-utils').sha256File(artifact),
    inventory: 'inventory.json',
    inventory_sha256: core.digestJson(inventory),
    entries_count: 0
  };
  core.writeJson(path.join(publishDir, 'manifest.json'), manifest);
  core.writeJson(path.join(publishDir, 'inventory.json'), inventory);
  core.writeJson(path.join(releaseDir, 'latest-artifact-overlay.json'), {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-latest',
    release: 'release-test',
    manifest: 'artifact-overlay/sha256-badbadbadbad/manifest.json'
  });

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, allowSourceDrift: true, env: process.env }),
    /unsafe overlay archive member|outside inventory/
  );
});

test('overlay build appd injects PREFIX_SOURCE and writes a build summary', () => {
  const root = makeConsumerRepo();
  mkdir(root, 'apps/ad_appd_new');
  core.writeJson(path.join(root, '.ad-build/overlay/use-summary.json'), { status: 'ready' });

  const fakeBin = tmpDir('ad-build-fake-bin-');
  const fakeMake = path.join(fakeBin, process.platform === 'win32' ? 'make.cmd' : 'make');
  if (process.platform === 'win32') {
    fs.writeFileSync(fakeMake, '@echo off\r\necho %PREFIX_SOURCE%>prefix-source.txt\r\nexit /b 0\r\n');
  } else {
    fs.writeFileSync(fakeMake, '#!/bin/sh\necho "$PREFIX_SOURCE" > prefix-source.txt\nexit 0\n');
    fs.chmodSync(fakeMake, 0o755);
  }

  const result = overlay.buildModule({
    repoRoot: root,
    moduleName: 'appd',
    env: {
      ...process.env,
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH || ''}`
    }
  });

  assert.equal(result.status, 'passed');
  assert.equal(result.prefix_source.replaceAll('\\', '/'), root.replaceAll('\\', '/'));
  assert.equal(fs.readFileSync(path.join(root, 'apps/ad_appd_new/prefix-source.txt'), 'utf8').trim().replaceAll('\\', '/'), root.replaceAll('\\', '/'));
  assert.equal(fs.existsSync(path.join(root, '.ad-build/overlay/last-build-summary.json')), true);
});

function isSymlink(file) {
  try {
    return fs.lstatSync(file).isSymbolicLink();
  } catch {
    return false;
  }
}

function normalize(value) {
  return String(value || '').replaceAll('\\', '/');
}
