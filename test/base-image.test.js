const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const baseImage = require('../lib/base-image');
const core = require('../lib/core');

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-image-'));
  fs.mkdirSync(path.join(repo, 'libs'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'sinfor'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'apps/foo'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'libs/liba.c'), 'lib a\n');
  fs.writeFileSync(path.join(repo, 'sinfor/sec.c'), 'sec\n');
  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'foo\n');
  fs.writeFileSync(path.join(repo, 'Makefile'), 'all:\n\ttrue\n');
  return repo;
}

test('base image status computes stable public key from configured public inputs', () => {
  const repo = makeRepo();
  fs.writeFileSync(path.join(repo, 'tools/base-image.yaml'), [
    'registry: registry.local/ad',
    'image_name: ad-build-base',
    'base_image: platos:release',
    'public_inputs:',
    '  - libs/**',
    '  - sinfor/**',
    '  - Makefile',
    'artifact_dirs:',
    '  - libs',
    '  - sinfor',
    'restore_dirs:',
    '  - libs',
    '  - sinfor',
    ''
  ].join('\n'));

  const first = baseImage.buildImageStatusResult({ repoRoot: repo, env: {}, checkDocker: false });
  fs.writeFileSync(path.join(repo, 'apps/foo/foo.c'), 'foo changed outside public inputs\n');
  const second = baseImage.buildImageStatusResult({ repoRoot: repo, env: {}, checkDocker: false });
  fs.writeFileSync(path.join(repo, 'libs/liba.c'), 'lib a changed\n');
  const third = baseImage.buildImageStatusResult({ repoRoot: repo, env: {}, checkDocker: false });

  assert.match(first.public_key, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first.public_key, second.public_key);
  assert.notEqual(first.public_key, third.public_key);
  assert.equal(first.image_ref.startsWith('registry.local/ad/ad-build-base:'), true);
  assert.equal(first.local_image.status, 'skipped');
});

test('base image YAML parser supports scalar fields and string arrays', () => {
  const parsed = baseImage.parseSimpleYaml([
    'registry: registry.local/ad',
    'image_name: ad-build-base',
    'public_inputs:',
    '  - libs/**',
    '  - sinfor/**',
    ''
  ].join('\n'));

  assert.deepEqual(parsed, {
    registry: 'registry.local/ad',
    image_name: 'ad-build-base',
    public_inputs: ['libs/**', 'sinfor/**']
  });
});

test('rendered Dockerfile stores artifacts under the configured artifact root', () => {
  const dockerfile = baseImage.renderDockerfile({
    baseImage: 'platos:release',
    artifactRoot: '/opt/ad-build/base',
    publicKey: `sha256:${'a'.repeat(64)}`,
    publicKeyShort: 'aaaaaaaaaaaa',
    imageRef: 'registry.local/ad/ad-build-base:release-public-aaaaaaaaaaaa'
  });

  assert.match(dockerfile, /^FROM platos:release/m);
  assert.match(dockerfile, /ADD ad-build-base\.tar \/opt\/ad-build\/base\//);
  assert.match(dockerfile, /ad-build\.public-key/);
});

test('image status CLI writes status artifacts without requiring docker inspect', async () => {
  const repo = makeRepo();
  const writes = [];
  const exitCode = await baseImage.runCli(['status', '--no-docker'], {
    cwd: repo,
    env: {},
    stdout: { write: (value) => writes.push(value) },
    stderr: { write: (value) => writes.push(value) }
  });
  const status = core.readJson(path.join(repo, '.ad-build/base-image/status.json'));

  assert.equal(exitCode, 0, writes.join(''));
  assert.equal(status.mode, 'public_base_image');
  assert.equal(status.local_image.status, 'skipped');
  assert.match(writes.join(''), /public_key=sha256:/);
});
