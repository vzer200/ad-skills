const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
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
  runGit(root, ['remote', 'add', 'origin', 'git@git.sangfor.com:69765/AD.git']);
  write(root, 'README.md', 'fixture\n');
  write(root, 'apps/ad_appd_new/libs/dpdk/Makefile', dpdkMakefileText());
  runGit(root, ['add', 'README.md', 'apps/ad_appd_new/libs/dpdk/Makefile']);
  runGit(root, ['commit', '-m', 'init']);
}

function initArtifactGitRepo(root) {
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'ad-build-test']);
  runGit(root, ['config', 'user.email', 'ad-build-test@example.invalid']);
}

function setOrigin(root, url) {
  const existing = spawnSync('git', ['remote', 'get-url', 'origin'], {
    cwd: root,
    encoding: 'utf8'
  });
  runGit(root, existing.status === 0 ? ['remote', 'set-url', 'origin', url] : ['remote', 'add', 'origin', url]);
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

  runGit(root, ['add', 'apps/ad_appd_new/main.c', 'apps/ad_appd_new/libs/dpdk/Makefile']);
  runGit(root, ['commit', '-m', 'source']);
  return root;
}

function dpdkMakefileText() {
  return [
    '.PHONY: all',
    'all:',
    '\t@echo "$(PREFIX_SOURCE)" > prefix-source.txt',
    '\t@mkdir -p dpdk-stable-20.11.5/build tmp_install',
    ''
  ].join('\n');
}

function makeConsumerRepo() {
  const root = tmpDir('ad-build-overlay-consumer-');
  initRepo(root);
  return root;
}

function makeSourceConsumerRepo(sourceRoot) {
  const parent = tmpDir('ad-build-overlay-consumer-parent-');
  const root = path.join(parent, 'consumer');
  runGit(parent, ['clone', sourceRoot, root]);
  return root;
}

function fakeMakeEnv(env = process.env, scriptBody) {
  const fakeBin = tmpDir('ad-build-fake-bin-');
  const fakeMake = path.join(fakeBin, process.platform === 'win32' ? 'make.cmd' : 'make');
  fs.writeFileSync(fakeMake, scriptBody);
  if (process.platform !== 'win32') {
    fs.chmodSync(fakeMake, 0o755);
  }
  const currentPath = env.PATH || env.Path || process.env.PATH || process.env.Path || '';
  const nextPath = `${fakeBin}${path.delimiter}${currentPath}`;
  return {
    ...env,
    PATH: nextPath,
    Path: nextPath
  };
}

function fakeMakeSuccessEnv(env = process.env) {
  if (process.platform === 'win32') {
    return fakeMakeEnv(env, [
      '@echo off',
      'echo %PREFIX_SOURCE%>prefix-source.txt',
      'mkdir dpdk-stable-20.11.5\\build 2>nul',
      'mkdir tmp_install 2>nul',
      'exit /b 0',
      ''
    ].join('\r\n'));
  }
  return fakeMakeEnv(env, [
    '#!/bin/sh',
    'echo "$PREFIX_SOURCE" > prefix-source.txt',
    'mkdir -p dpdk-stable-20.11.5/build tmp_install',
    'exit 0',
    ''
  ].join('\n'));
}

function fakeMakeFailureEnv(env = process.env, stderrLine = 'error: generic failure') {
  if (process.platform === 'win32') {
    return fakeMakeEnv(env, `@echo off\r\necho ${stderrLine} 1>&2\r\nexit /b 2\r\n`);
  }
  return fakeMakeEnv(env, `#!/bin/sh\necho "${stderrLine}" >&2\nexit 2\n`);
}

test('overlay pack, publish, and use restore relocatable artifacts idempotently', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = fakeMakeSuccessEnv({ ...process.env, HOME: home, USERPROFILE: home });
  const packed = overlay.packOverlay({
    repoRoot: producer,
    branch: 'release-test',
    sourceRoot: '/root/AD',
    env
  });
  assert.equal(packed.status, 'packed');
  assert.ok(packed.entries_count > 0);
  assert.equal(
    packed.artifact_path.replaceAll('\\', '/'),
    path.join(home, '.ad-build/overlay/latest/ad-artifact-overlay.tar.gz').replaceAll('\\', '/')
  );
  assert.equal(fs.existsSync(path.join(producer, '.ad-build/overlay/latest/ad-artifact-overlay.tar.gz')), false);

  const published = overlay.publishOverlay({
    repoRoot: producer,
    branch: 'release-test',
    overlay: packed.artifact_path,
    repo: artifactRepo,
    noPush: true,
    env
  });
  assert.match(published.latest_path, /latest-artifact-overlay\.json/);

  const consumer = makeSourceConsumerRepo(producer);
  const firstUse = overlay.useOverlay({
    repoRoot: consumer,
    branch: 'release-test',
    repo: artifactRepo,
    env
  });
  assert.equal(firstUse.status, 'ready');
  assert.equal(typeof firstUse.duration_ms, 'number');
  assert.ok(firstUse.duration_ms >= 0);
  assert.equal(firstUse.dpdk_repair_status, 'passed');
  assert.equal(
    fs.readFileSync(path.join(consumer, 'apps/ad_appd_new/libs/dpdk/prefix-source.txt'), 'utf8').trim().replaceAll('\\', '/'),
    consumer.replaceAll('\\', '/')
  );
  const doctor = JSON.parse(fs.readFileSync(path.join(home, '.ad-build/overlay/doctor.json'), 'utf8'));
  assert.equal(
    (doctor.warnings || []).some((warning) => warning.name === 'use_summary_ready'),
    false
  );

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
    env
  });
  assert.equal(secondUse.status, 'ready');
});

test('top-level restore text output includes total duration', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = fakeMakeSuccessEnv({ ...process.env, HOME: home, USERPROFILE: home });

  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env });

  const consumer = makeSourceConsumerRepo(producer);
  let stdout = '';
  let stderr = '';
  const exitCode = overlay.runOverlayCli(['use', '--branch', 'release-test', '--repo', artifactRepo], {
    repoRoot: consumer,
    cwd: consumer,
    env,
    stdout: { write: (chunk) => { stdout += chunk; return true; } },
    stderr: { write: (chunk) => { stderr += chunk; return true; } },
    publicCommand: 'restore'
  });
  assert.equal(exitCode, 0, stderr);
  assert.match(stdout, /总耗时: \d+(?:ms|s|m|h)/);
});

test('overlay pack includes rdma-core headers used by build include symlinks', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const targetRel = 'libs/rdma-core-2404mlnx51/providers/mlx5/mlx5dv.h';
  write(producer, targetRel, '#define MLX5DV_PROVIDER 1\n');

  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  const inventory = core.readJson(packed.inventory_path);

  assert.ok(
    inventory.entries.some((entry) => entry.path === targetRel),
    'expected rdma-core provider header target to be included in the overlay inventory'
  );
});

test('overlay pack classifies known external symlinks without putting them in inventory', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const symlinks = new Map([
    ['include/lua', '/usr/local/include/luajit-2.1/'],
    ['shell/etc/apache2/httpd.conf', '/etc/sinfor/ad/httpd.conf'],
    ['shell/etc/squid/squid.conf', '/etc/sinfor/ad/squid.conf'],
    ['test/access_layer/partition/partition/mock_S04NicFactory', '/etc/rc.d/rc2.d/S04NicFactory'],
    ['shell/arch/aarch64/app/usr/ad/bin/swcsmmgmt_key', '/app/usr/ad/bin/swcsmmgmt'],
    ['shell/arch/aarch64/app/usr/lib64/debug', 'aclog/debug-info']
  ]);

  withMockedSymlinks(producer, symlinks, () => {
    const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
    const inventory = core.readJson(packed.inventory_path);
    const manifest = core.readJson(packed.manifest_path);

    for (const rel of symlinks.keys()) {
      assert.equal(inventory.entries.some((entry) => entry.path === rel), false, `${rel} should not be restored as an overlay symlink`);
    }
    assert.deepEqual((manifest.external_dependencies || []).map((item) => item.path), ['include/lua']);
    assert.equal(manifest.external_dependencies[0].link_target, '/usr/local/include/luajit-2.1/');
    assert.equal(manifest.external_dependencies[0].check_path, '/usr/local/include/luajit-2.1/');
    assert.equal((packed.excluded_external_symlinks || []).length, 5);
    assert.ok((packed.warnings || []).some((warning) => warning.name === 'external_symlink_dependency' && warning.path === 'include/lua'));
  });
});

test('overlay pack treats normalized source-root symlink targets as internal', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const linkRel = 'libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5_user_ioctl_verbs.h';
  const targetRel = 'libs/rdma-core-2404mlnx51/kernel-headers/rdma/mlx5_user_ioctl_verbs.h';
  write(producer, targetRel, '#define MLX5_USER_IOCTL_VERBS 1\n');

  withMockedSymlinks(producer, new Map([
    [linkRel, '/root/AD/libs/rdma-core-2404mlnx51/providers/mlx5/../../kernel-headers/rdma/mlx5_user_ioctl_verbs.h']
  ]), () => {
    const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
    const inventory = core.readJson(packed.inventory_path);

    assert.ok(inventory.entries.some((entry) => entry.path === linkRel && entry.type === 'symlink'));
    assert.ok(inventory.entries.some((entry) => entry.path === targetRel && entry.type === 'file'));
    assert.equal((packed.external_dependencies || []).length, 0);
    assert.equal((packed.excluded_external_symlinks || []).length, 0);
  });
});

test('overlay pack reports all unknown external symlink violations together', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const symlinks = new Map([
    ['include/unexpected', '/opt/unexpected-headers'],
    ['shell/unknown.conf', '/srv/unknown.conf']
  ]);

  withMockedSymlinks(producer, symlinks, () => {
    assert.throws(
      () => overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env }),
      (error) => {
        assert.match(error.message, /外部 symlink|external symlink/i);
        assert.match(error.message, /include\/unexpected/);
        assert.match(error.message, /\/opt\/unexpected-headers/);
        assert.match(error.message, /shell\/unknown\.conf/);
        assert.match(error.message, /\/srv\/unknown\.conf/);
        assert.match(error.message, /resolved_path/);
        assert.match(error.message, /mkpacket\/.*ssipacket\/.*ad_packet\//s);
        return true;
      }
    );
  });
});

test('overlay doctor checks manifest external dependencies', () => {
  const repoRoot = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  core.writeJson(path.join(home, '.ad-build/overlay/current.json'), {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-current',
    release: 'release-test',
    manifest: {
      source_root_at_pack_time: '/root/AD',
      external_dependencies: [
        {
          name: 'luajit_headers',
          type: 'system_header',
          path: 'include/lua',
          link_target: '/definitely/missing/luajit-2.1/',
          check_path: '/definitely/missing/luajit-2.1/'
        }
      ]
    },
    inventory: { entries: [] }
  });

  const result = overlay.runDoctor({ repoRoot, env });
  const check = result.checks.find((item) => item.name === 'external_dependency:luajit_headers');
  assert.equal(check.status, 'failed');
  assert.match(check.message, /include\/lua/);
  assert.match(check.message, /\/definitely\/missing\/luajit-2\.1\//);
});

test('overlay pack reports scan progress before compression', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const messages = [];

  for (let index = 0; index < 1100; index += 1) {
    write(producer, `obj/progress/file-${index}.o`, `obj-${index}`);
  }

  overlay.packOverlay({
    repoRoot: producer,
    branch: 'release-test',
    sourceRoot: '/root/AD',
    env,
    progress: (message) => messages.push(message)
  });

  assert.ok(
    messages.some((message) => /已扫描 \d+ 个路径，已选中 \d+ 个产物文件/.test(message)),
    messages.join('\n')
  );
});

test('overlay restore refreshes previously managed artifacts without force', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const first = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: first.artifact_path, repo: artifactRepo, noPush: true, env });

  const consumer = makeSourceConsumerRepo(producer);
  const firstUse = overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env });
  assert.equal(firstUse.status, 'ready');

  write(producer, 'obj/lib64/libadconf.so', 'changed lib v2');
  const second = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: second.artifact_path, repo: artifactRepo, noPush: true, env });

  const secondUse = overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env });
  assert.equal(secondUse.status, 'ready');
  assert.equal(fs.readFileSync(path.join(consumer, 'obj/lib64/libadconf.so'), 'utf8'), 'changed lib v2');
  assert.ok(secondUse.restored_count > 0);
});

test('overlay publish preserves AD source metadata in the published manifest', () => {
  const producer = makeCompiledProducer();
  setOrigin(producer, 'git@git.sangfor.com:69765/AD.git');
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  const published = overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env });

  const manifest = core.readJson(path.join(artifactRepo, published.publish_dir, 'manifest.json'));
  assert.equal(manifest.source_branch, 'release-test');
  assert.equal(manifest.source_commit, runGit(producer, ['rev-parse', 'HEAD']));
  assert.equal(manifest.source_repo_url, 'git@git.sangfor.com:69765/AD.git');
});

test('overlay pack requires AD source branch commit and remote metadata', () => {
  const producer = makeCompiledProducer();
  runGit(producer, ['remote', 'remove', 'origin']);

  assert.throws(
    () => overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env: process.env }),
    /源码|source|origin|remote/
  );
});

test('overlay restore rejects source drift before reading the artifact payload', () => {
  const producer = makeCompiledProducer();
  setOrigin(producer, 'git@git.sangfor.com:69765/AD.git');
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env });

  const latest = core.readJson(path.join(artifactRepo, 'release-test/latest-artifact-overlay.json'));
  const manifest = core.readJson(path.join(artifactRepo, 'release-test', latest.manifest));
  fs.appendFileSync(path.join(artifactRepo, manifest.artifact_path), 'corrupt-after-publish');

  const consumer = makeConsumerRepo();
  setOrigin(consumer, 'git@git.sangfor.com:69765/AD.git');

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env }),
    (error) => {
      assert.match(error.message, /commit|source|源码/);
      assert.match(error.message, /--force/);
      assert.match(error.message, /overlay/);
      assert.match(error.message, /当前 AD 工作区/);
      assert.doesNotMatch(error.message, /compare|git\.sangfor\.com/);
      assert.doesNotMatch(error.message, /sha256/);
      return true;
    }
  );
});

test('overlay restore rejects unverifiable current source before artifact repo fetch', () => {
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  core.writeJson(path.join(home, '.ad-build/overlay/auth.json'), {
    schema_version: 1,
    auth_method: 'ssh',
    status: 'authenticated',
    key_path: path.join(home, 'id_ed25519')
  });

  const consumer = tmpDir('ad-build-overlay-nongit-consumer-');
  const missingRepo = path.join(home, 'missing-artifact-repo.git');

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repoUrl: missingRepo, env }),
    (error) => {
      assert.match(error.message, /当前 AD 工作区无法读取源码 Git 信息|current source/i);
      assert.doesNotMatch(error.message, /获取产物仓库分支失败|fetch|checkout/);
      return true;
    }
  );
});

test('overlay restore rejects missing source metadata before reading the artifact payload', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env });

  const latest = core.readJson(path.join(artifactRepo, 'release-test/latest-artifact-overlay.json'));
  const manifestPath = path.join(artifactRepo, 'release-test', latest.manifest);
  const manifest = core.readJson(manifestPath);
  delete manifest.source_commit;
  delete manifest.source_repo_url;
  core.writeJson(manifestPath, manifest);
  fs.appendFileSync(path.join(artifactRepo, manifest.artifact_path), 'corrupt-after-publish');

  const consumer = makeSourceConsumerRepo(producer);

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env }),
    (error) => {
      assert.match(error.message, /源码|source|metadata|--force/);
      assert.doesNotMatch(error.message, /sha256/);
      return true;
    }
  );

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, force: true, env }),
    (error) => {
      assert.match(error.message, /源码|source|metadata/);
      assert.doesNotMatch(error.message, /sha256/);
      return true;
    }
  );
});

test('overlay restore rejects unverifiable current source before reading the artifact payload', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env });

  const latest = core.readJson(path.join(artifactRepo, 'release-test/latest-artifact-overlay.json'));
  const manifest = core.readJson(path.join(artifactRepo, 'release-test', latest.manifest));
  fs.appendFileSync(path.join(artifactRepo, manifest.artifact_path), 'corrupt-after-publish');

  const consumer = tmpDir('ad-build-overlay-nongit-consumer-');

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env }),
    (error) => {
      assert.match(error.message, /当前|source|Git|--force/);
      assert.doesNotMatch(error.message, /sha256/);
      return true;
    }
  );

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, force: true, env }),
    (error) => {
      assert.match(error.message, /当前|source|Git/);
      assert.doesNotMatch(error.message, /sha256/);
      return true;
    }
  );
});

test('overlay restore --force allows source drift and records it in the summary', () => {
  const producer = makeCompiledProducer();
  setOrigin(producer, 'git@git.sangfor.com:69765/AD.git');
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env });

  const consumer = makeConsumerRepo();
  setOrigin(consumer, 'git@git.sangfor.com:69765/AD.git');

  const restored = overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, force: true, env });
  assert.equal(restored.status, 'ready');
  assert.doesNotMatch((restored.warnings || []).map((warning) => warning.message).join('\n'), /compare/);
});

test('overlay restore treats source branch drift as a forceable source check', () => {
  const producer = makeCompiledProducer();
  setOrigin(producer, 'git@git.sangfor.com:69765/AD.git');
  runGit(producer, ['checkout', '-b', 'feature-test']);
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const packed = overlay.packOverlay({
    repoRoot: producer,
    branch: 'release-test',
    sourceRoot: '/root/AD',
    allowBranchMismatch: true,
    env
  });
  overlay.publishOverlay({
    repoRoot: producer,
    branch: 'release-test',
    overlay: packed.artifact_path,
    repo: artifactRepo,
    noPush: true,
    allowBranchMismatch: true,
    env
  });

  const consumer = makeConsumerRepo();
  setOrigin(consumer, 'git@git.sangfor.com:69765/AD.git');

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env }),
    (error) => {
      assert.match(error.message, /源码分支|source branch|--force/);
      assert.doesNotMatch(error.message, /compare/);
      assert.doesNotMatch(error.message, /allow-branch-mismatch/);
      return true;
    }
  );

  const restored = overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, force: true, env });
  assert.equal(restored.status, 'ready');
});

test('overlay commands reject branch mismatch unless explicitly allowed', () => {
  const producer = makeCompiledProducer();
  runGit(producer, ['checkout', '-b', 'feature-test']);

  assert.throws(
    () => overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env }),
    /分支不一致|branch/
  );

  const packed = overlay.packOverlay({
    repoRoot: producer,
    branch: 'release-test',
    sourceRoot: '/root/AD',
    out: 'overlay-out',
    allowBranchMismatch: true,
    env: process.env
  });
  const manifest = core.readJson(packed.manifest_path);
  assert.equal(manifest.source_branch, 'feature-test');

  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  assert.throws(
    () => overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env: process.env }),
    /分支不一致|branch/
  );
});

test('remote overlay commands reject pending SSH auth before git access', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  core.writeJson(path.join(home, '.ad-build/overlay/auth.json'), {
    schema_version: 1,
    auth_method: 'ssh',
    status: 'pending_key_install',
    key_path: '/root/.ssh/id_ed25519',
    public_key_path: '/root/.ssh/id_ed25519.pub'
  });

  assert.throws(
    () => overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, env }),
    /SSH|login|GitLab/
  );

  const consumer = makeConsumerRepo();
  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', env }),
    /SSH|login|GitLab/
  );
});

test('managed overlay state and cache default to HOME, not the AD repository', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env });

  const consumer = makeSourceConsumerRepo(producer);
  overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env });
  overlay.runDoctor({ repoRoot: consumer, env });

  assert.equal(fs.existsSync(path.join(home, '.ad-build/overlay/current.json')), true);
  assert.equal(fs.existsSync(path.join(home, '.ad-build/overlay/use-summary.json')), true);
  assert.equal(fs.existsSync(path.join(home, '.ad-build/overlay/doctor.json')), true);
  assert.equal(fs.existsSync(path.join(consumer, '.ad-build/overlay/current.json')), false);
  assert.equal(fs.existsSync(path.join(consumer, '.ad-build/overlay/use-summary.json')), false);
});

test('overlay pack rejects workspaces missing appd-required artifacts', () => {
  const producer = tmpDir('ad-build-overlay-incomplete-');
  initRepo(producer);

  assert.throws(
    () => overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env }),
    /appd 必需的 overlay 路径缺失或为空/
  );
});

test('overlay pack, publish, and use require an explicit branch', () => {
  const producer = makeCompiledProducer();
  assert.throws(
    () => overlay.packOverlay({ repoRoot: producer, sourceRoot: '/root/AD', out: 'overlay-out', env: process.env }),
    /branch|分支/
  );

  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env });
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  assert.throws(
    () => overlay.publishOverlay({ repoRoot: producer, overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env: process.env }),
    /branch|分支/
  );

  const consumer = makeConsumerRepo();
  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, repo: artifactRepo, env: process.env }),
    /branch|分支/
  );
});

test('overlay publish keeps only the newest overlay payload for a branch', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const first = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: first.artifact_path, repo: artifactRepo, noPush: true, env });

  write(producer, 'obj/lib64/libadconf.so', 'changed lib');
  const second = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: second.artifact_path, repo: artifactRepo, noPush: true, env });

  const overlayDir = path.join(artifactRepo, 'release-test', 'artifact-overlay');
  const payloads = fs.readdirSync(overlayDir).filter((name) => name.startsWith('sha256-'));
  assert.equal(payloads.length, 1);
  assert.equal(payloads[0], `sha256-${second.artifact_sha256.slice('sha256:'.length, 'sha256:'.length + 12)}`);
});

test('git artifact publish keeps the branch as a single snapshot commit', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-git-');
  initArtifactGitRepo(artifactRepo);
  const env = { ...process.env, HOME: home, USERPROFILE: home };

  const first = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: first.artifact_path, repo: artifactRepo, noPush: true, env });

  write(producer, 'obj/lib64/libadconf.so', 'changed lib');
  const second = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: second.artifact_path, repo: artifactRepo, noPush: true, env });

  assert.equal(runGit(artifactRepo, ['rev-list', '--count', 'refs/heads/release-test']), '1');
  const tree = runGit(artifactRepo, ['ls-tree', '-r', '--name-only', 'refs/heads/release-test']);
  assert.match(tree, new RegExp(`release-test/artifact-overlay/sha256-${second.artifact_sha256.slice('sha256:'.length, 'sha256:'.length + 12)}/ad-artifact-overlay\\.tar\\.gz`));
});

test('overlay pack and use clean temporary staging directories', () => {
  const producer = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const packTempPrefix = `ad-build-overlay-pack-${process.pid}-`;
  const beforePack = tempNames(packTempPrefix);
  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', env });
  assert.deepEqual(newTempNames(packTempPrefix, beforePack), []);

  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env });

  const consumer = makeSourceConsumerRepo(producer);
  write(consumer, 'obj/lib64/libadconf.so', 'local change');
  const useTempPrefix = `ad-build-overlay-use-${process.pid}-`;
  const beforeUse = tempNames(useTempPrefix);
  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env }),
    /覆盖|local paths/
  );
  assert.deepEqual(newTempNames(useTempPrefix, beforeUse), []);
});

test('overlay use --force safely replaces existing files with inventory symlinks', (t) => {
  const producer = makeCompiledProducer();
  const symlinkPath = path.join(producer, 'libs/rdma-core-2404mlnx51/build/include/infiniband/verbs.h');
  if (!isSymlink(symlinkPath)) {
    t.skip('symlink creation is not available on this platform');
    return;
  }

  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env: process.env });

  const consumer = makeSourceConsumerRepo(producer);
  const targetRel = 'libs/rdma-core-2404mlnx51/build/include/infiniband/verbs.h';
  write(consumer, targetRel, 'local file');
  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env: process.env }),
    /overwrite|覆盖|local paths/
  );

  const forced = overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, force: true, env: process.env });
  assert.equal(forced.status, 'ready');
  assert.equal(isSymlink(path.join(consumer, targetRel)), true);
});

test('overlay doctor default does not fail on non-required dangling symlinks', (t) => {
  const root = makeCompiledProducer();
  const home = tmpDir('ad-build-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const looseLink = path.join(root, 'apps/ad_appd_new/libs/dpdk/tmp_install/lib64/librte_fake.so');
  fs.mkdirSync(path.dirname(looseLink), { recursive: true });
  try {
    fs.symlinkSync('dpdk/pmds-21.0/librte_fake.so', looseLink, 'file');
  } catch {
    t.skip('symlink creation is not available on this platform');
    return;
  }

  core.writeJson(path.join(home, '.ad-build/overlay/current.json'), {
    schema_version: 1,
    release: 'release-test',
    source_root_at_pack_time: '/root/AD',
    inventory: {
      entries: [
        {
          path: 'apps/ad_appd_new/libs/dpdk/tmp_install/lib64/librte_fake.so',
          type: 'symlink',
          link_target: 'dpdk/pmds-21.0/librte_fake.so'
        }
      ]
    }
  });
  core.writeJson(path.join(home, '.ad-build/overlay/use-summary.json'), { status: 'ready' });

  const result = overlay.runDoctor({ repoRoot: root, env });
  assert.notEqual(result.overall_status, 'failed');
  assert.ok((result.warnings || []).some((warning) => warning.name === 'dangling_symlinks'));

  const strict = overlay.runDoctor({ repoRoot: root, strict: true, env });
  assert.equal(strict.overall_status, 'failed');
});

test('overlay use rejects local changes to managed artifacts without force', () => {
  const producer = makeCompiledProducer();
  const artifactRepo = tmpDir('ad-build-overlay-artifacts-');
  const packed = overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env });
  overlay.publishOverlay({ repoRoot: producer, branch: 'release-test', overlay: packed.artifact_path, repo: artifactRepo, noPush: true, env: process.env });

  const consumer = makeSourceConsumerRepo(producer);
  overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env: process.env });
  write(consumer, 'obj/lib64/libadconf.so', 'local change');

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env: process.env }),
    /覆盖|local paths/
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
    source_commit: runGit(consumer, ['rev-parse', 'HEAD']),
    source_repo_url: 'git@git.sangfor.com:69765/AD.git',
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
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env: process.env }),
    /unsafe overlay archive member|outside inventory/
  );
});

test('overlay use rejects symlink inventory targets outside the AD repo', () => {
  const consumer = makeConsumerRepo();
  const artifactRepo = tmpDir('ad-build-overlay-bad-symlink-artifacts-');
  const releaseDir = path.join(artifactRepo, 'release-test');
  const publishDir = path.join(releaseDir, 'artifact-overlay', 'sha256-badsymlink');
  fs.mkdirSync(publishDir, { recursive: true });

  const inventory = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-inventory',
    entries: [
      {
        path: 'obj/lib64/evil-link',
        type: 'symlink',
        link_target: '/tmp/outside-ad'
      }
    ]
  };
  const artifact = path.join(publishDir, 'ad-artifact-overlay.tar.gz');
  writeTarGz(artifact, [
    { name: 'manifest.json', content: '{}' },
    { name: 'inventory.json', content: JSON.stringify(inventory) },
    { name: 'files/obj/lib64/evil-link', type: '2', linkname: '/tmp/outside-ad' }
  ]);

  const manifest = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay',
    release: 'release-test',
    source_branch: 'release-test',
    source_commit: runGit(consumer, ['rev-parse', 'HEAD']),
    source_repo_url: 'git@git.sangfor.com:69765/AD.git',
    source_root_at_pack_time: '/root/AD',
    artifact_path: 'release-test/artifact-overlay/sha256-badsymlink/ad-artifact-overlay.tar.gz',
    artifact_sha256: require('../lib/file-utils').sha256File(artifact),
    inventory: 'inventory.json',
    inventory_sha256: core.digestJson(inventory),
    entries_count: 1
  };
  core.writeJson(path.join(publishDir, 'manifest.json'), manifest);
  core.writeJson(path.join(publishDir, 'inventory.json'), inventory);
  core.writeJson(path.join(releaseDir, 'latest-artifact-overlay.json'), {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-latest',
    release: 'release-test',
    manifest: 'artifact-overlay/sha256-badsymlink/manifest.json'
  });

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env: process.env }),
    /symlink target|软链接目标|不安全|outside/
  );
});

test('overlay pack rejects source-root symlink targets that escape the AD repo', (t) => {
  const producer = makeCompiledProducer();
  const linkPath = path.join(producer, 'obj/lib64/escape-link');
  try {
    fs.symlinkSync('/root/AD/../../outside', linkPath, 'file');
  } catch {
    t.skip('symlink creation is not available on this platform');
    return;
  }

  assert.throws(
    () => overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env }),
    /symlink target|软链接目标|不安全|outside/
  );
});

test('overlay pack rejects normalized source-root symlink escapes with mocked symlinks', () => {
  const producer = makeCompiledProducer();

  withMockedSymlinks(producer, new Map([
    ['obj/lib64/escape-link', '/root/AD/../../outside']
  ]), () => {
    assert.throws(
      () => overlay.packOverlay({ repoRoot: producer, branch: 'release-test', sourceRoot: '/root/AD', out: 'overlay-out', env: process.env }),
      /外部 symlink|external symlink|outside/
    );
  });
});

test('overlay use rejects archive members nested below archive symlinks', () => {
  const consumer = makeConsumerRepo();
  const artifactRepo = tmpDir('ad-build-overlay-symlink-artifacts-');
  const outside = tmpDir('ad-build-overlay-symlink-outside-');
  const releaseDir = path.join(artifactRepo, 'release-test');
  const publishDir = path.join(releaseDir, 'artifact-overlay', 'sha256-symlinkprefix');
  fs.mkdirSync(publishDir, { recursive: true });

  const inventory = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-inventory',
    entries: [
      {
        path: 'obj/lib64/libadconf.so',
        type: 'file',
        sha256: 'sha256:b5c1fb2efc6d6b4674c2fdcc48ce01b43a3b7c03763c0c3355de0099ee0f8c73'
      }
    ]
  };
  const artifact = path.join(publishDir, 'ad-artifact-overlay.tar.gz');
  writeTarGz(artifact, [
    { name: 'manifest.json', content: '{}' },
    { name: 'inventory.json', content: JSON.stringify(inventory) },
    { name: 'files/obj', type: '2', linkname: outside },
    { name: 'files/obj/lib64/libadconf.so', content: 'evil' }
  ]);

  const manifest = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay',
    release: 'release-test',
    source_branch: 'release-test',
    source_commit: runGit(consumer, ['rev-parse', 'HEAD']),
    source_repo_url: 'git@git.sangfor.com:69765/AD.git',
    source_root_at_pack_time: '/root/AD',
    artifact_path: 'release-test/artifact-overlay/sha256-symlinkprefix/ad-artifact-overlay.tar.gz',
    artifact_sha256: require('../lib/file-utils').sha256File(artifact),
    inventory: 'inventory.json',
    inventory_sha256: core.digestJson(inventory),
    entries_count: 1
  };
  core.writeJson(path.join(publishDir, 'manifest.json'), manifest);
  core.writeJson(path.join(publishDir, 'inventory.json'), inventory);
  core.writeJson(path.join(releaseDir, 'latest-artifact-overlay.json'), {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-latest',
    release: 'release-test',
    manifest: 'artifact-overlay/sha256-symlinkprefix/manifest.json'
  });

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env: process.env }),
    /symlink|archive|压缩包|成员/
  );
});

test('overlay use rejects non-directory archive prefixes before extraction', () => {
  const consumer = makeConsumerRepo();
  const artifactRepo = tmpDir('ad-build-overlay-file-prefix-artifacts-');
  const releaseDir = path.join(artifactRepo, 'release-test');
  const publishDir = path.join(releaseDir, 'artifact-overlay', 'sha256-fileprefix');
  fs.mkdirSync(publishDir, { recursive: true });

  const inventory = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-inventory',
    entries: [
      {
        path: 'obj/lib64/libadconf.so',
        type: 'file',
        sha256: 'sha256:b5c1fb2efc6d6b4674c2fdcc48ce01b43a3b7c03763c0c3355de0099ee0f8c73'
      }
    ]
  };
  const artifact = path.join(publishDir, 'ad-artifact-overlay.tar.gz');
  writeTarGz(artifact, [
    { name: 'manifest.json', content: '{}' },
    { name: 'inventory.json', content: JSON.stringify(inventory) },
    { name: 'files/obj', content: 'not a directory' },
    { name: 'files/obj/lib64/libadconf.so', content: 'evil' }
  ]);

  const manifest = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay',
    release: 'release-test',
    source_branch: 'release-test',
    source_commit: runGit(consumer, ['rev-parse', 'HEAD']),
    source_repo_url: 'git@git.sangfor.com:69765/AD.git',
    source_root_at_pack_time: '/root/AD',
    artifact_path: 'release-test/artifact-overlay/sha256-fileprefix/ad-artifact-overlay.tar.gz',
    artifact_sha256: require('../lib/file-utils').sha256File(artifact),
    inventory: 'inventory.json',
    inventory_sha256: core.digestJson(inventory),
    entries_count: 1
  };
  core.writeJson(path.join(publishDir, 'manifest.json'), manifest);
  core.writeJson(path.join(publishDir, 'inventory.json'), inventory);
  core.writeJson(path.join(releaseDir, 'latest-artifact-overlay.json'), {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-latest',
    release: 'release-test',
    manifest: 'artifact-overlay/sha256-fileprefix/manifest.json'
  });

  assert.throws(
    () => overlay.useOverlay({ repoRoot: consumer, branch: 'release-test', repo: artifactRepo, env: process.env }),
    /目录前缀|directory prefix|prefix/
  );
});

test('overlay build appd injects PREFIX_SOURCE and writes a build summary', () => {
  const root = makeConsumerRepo();
  const home = tmpDir('ad-build-home-');
  const env = fakeMakeSuccessEnv({ ...process.env, HOME: home, USERPROFILE: home });
  mkdir(root, 'apps/ad_appd_new');
  core.writeJson(path.join(home, '.ad-build/overlay/use-summary.json'), { status: 'ready' });

  const result = overlay.buildModule({
    repoRoot: root,
    moduleName: 'appd',
    env
  });

  assert.equal(result.status, 'passed');
  assert.equal(result.prefix_source.replaceAll('\\', '/'), root.replaceAll('\\', '/'));
  assert.equal(fs.readFileSync(path.join(root, 'apps/ad_appd_new/prefix-source.txt'), 'utf8').trim().replaceAll('\\', '/'), root.replaceAll('\\', '/'));
  assert.equal(fs.existsSync(path.join(home, '.ad-build/overlay/last-build-summary.json')), true);
  assert.equal(fs.existsSync(path.join(root, '.ad-build/overlay/last-build-summary.json')), false);
});

test('overlay build suggests a single allowed command on generic failure', () => {
  const root = makeConsumerRepo();
  const home = tmpDir('ad-build-home-');
  const env = fakeMakeFailureEnv({ ...process.env, HOME: home, USERPROFILE: home });
  mkdir(root, 'apps/ad_appd_new');
  core.writeJson(path.join(home, '.ad-build/overlay/use-summary.json'), { status: 'ready' });

  const result = overlay.buildModule({
    repoRoot: root,
    moduleName: 'appd',
    env
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.suggested_next_command, 'ad-build doctor');
});

test('overlay build reads appd child logs and suggests DPDK repair for rdma cache failures', () => {
  const root = makeConsumerRepo();
  const home = tmpDir('ad-build-home-');
  const env = fakeMakeFailureEnv({ ...process.env, HOME: home, USERPROFILE: home }, 'make: *** [all] Error 2');
  mkdir(root, 'apps/ad_appd_new/libs/dpdk');
  write(root, 'apps/ad_appd_new/libs/dpdk/log3party.log', 'rdma_lib_path=/libs/rdma-core-2404mlnx51/build\nfatal error: /libs/rdma-core-2404mlnx51/build/include: No such file or directory\n');
  core.writeJson(path.join(home, '.ad-build/overlay/use-summary.json'), { status: 'ready' });

  const result = overlay.buildModule({
    repoRoot: root,
    moduleName: 'appd',
    env
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.suggested_next_command, 'ad-build repair dpdk');
  assert.match(result.first_real_error_source, /log3party\.log/);
  assert.match(result.first_real_error.message, /rdma-core|No such file/);
});

test('overlay build suggests DPDK repair for mlx5dv duplicate definitions', () => {
  const root = makeConsumerRepo();
  const home = tmpDir('ad-build-home-');
  const env = fakeMakeFailureEnv({ ...process.env, HOME: home, USERPROFILE: home }, 'error: redefinition of mlx5dv_context in infiniband/mlx5dv.h');
  mkdir(root, 'apps/ad_appd_new');
  core.writeJson(path.join(home, '.ad-build/overlay/use-summary.json'), { status: 'ready' });

  const result = overlay.buildModule({
    repoRoot: root,
    moduleName: 'appd',
    env
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.suggested_next_command, 'ad-build repair dpdk');
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

function tempNames(prefix) {
  return new Set(fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith(prefix)));
}

function newTempNames(prefix, before) {
  return fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith(prefix) && !before.has(name));
}

function withMockedSymlinks(root, symlinks, fn) {
  const originalLstatSync = fs.lstatSync;
  const originalReadlinkSync = fs.readlinkSync;
  const originalSymlinkSync = fs.symlinkSync;
  const targets = new Map();
  for (const [rel, target] of symlinks) {
    const full = write(root, rel, 'placeholder');
    targets.set(path.resolve(full), target);
  }

  fs.lstatSync = function patchedLstatSync(file, ...args) {
    const target = targets.get(path.resolve(file));
    if (target) {
      const stat = originalLstatSync.call(fs, file, ...args);
      return {
        mode: stat.mode,
        isDirectory: () => false,
        isFile: () => false,
        isSymbolicLink: () => true
      };
    }
    return originalLstatSync.call(fs, file, ...args);
  };
  fs.readlinkSync = function patchedReadlinkSync(file, ...args) {
    const target = targets.get(path.resolve(file));
    if (target) {
      return target;
    }
    return originalReadlinkSync.call(fs, file, ...args);
  };
  fs.symlinkSync = function patchedSymlinkSync(target, file, ...args) {
    try {
      return originalSymlinkSync.call(fs, target, file, ...args);
    } catch (error) {
      if (error?.code !== 'EPERM') {
        throw error;
      }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `mock symlink -> ${target}`);
      targets.set(path.resolve(file), target);
      return undefined;
    }
  };

  try {
    return fn();
  } finally {
    fs.lstatSync = originalLstatSync;
    fs.readlinkSync = originalReadlinkSync;
    fs.symlinkSync = originalSymlinkSync;
  }
}

function writeTarGz(file, entries) {
  const chunks = [];
  for (const entry of entries) {
    const content = Buffer.from(entry.content || '');
    chunks.push(tarHeader(entry, content.length));
    if (entry.type !== '2') {
      chunks.push(content);
      const padding = (512 - (content.length % 512)) % 512;
      if (padding > 0) {
        chunks.push(Buffer.alloc(padding));
      }
    }
  }
  chunks.push(Buffer.alloc(1024));
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat(chunks)));
}

function tarHeader(entry, size) {
  const header = Buffer.alloc(512);
  writeTarField(header, 0, 100, entry.name);
  writeTarField(header, 100, 8, '0000777\0');
  writeTarField(header, 108, 8, '0000000\0');
  writeTarField(header, 116, 8, '0000000\0');
  writeTarField(header, 124, 12, `${size.toString(8).padStart(11, '0')}\0`);
  writeTarField(header, 136, 12, '00000000000\0');
  header.fill(0x20, 148, 156);
  writeTarField(header, 156, 1, entry.type || '0');
  writeTarField(header, 157, 100, entry.linkname || '');
  writeTarField(header, 257, 6, 'ustar\0');
  writeTarField(header, 263, 2, '00');
  let checksum = 0;
  for (const byte of header) {
    checksum += byte;
  }
  writeTarField(header, 148, 8, `${checksum.toString(8).padStart(6, '0')}\0 `);
  return header;
}

function writeTarField(header, offset, length, value) {
  Buffer.from(String(value)).copy(header, offset, 0, Math.min(length, Buffer.byteLength(String(value))));
}
