const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');

function run(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd || path.join(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      AD_BUILD_SKIP_COMPLETION_INSTALL: '1',
      ...(options.env || {})
    }
  });
}

test('top-level help exposes only the overlay public workflow', () => {
  const result = run(['help']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ad-build pack --branch <rel>/);
  assert.match(result.stdout, /ad-build publish --branch <rel>/);
  assert.match(result.stdout, /ad-build restore --branch <rel>/);
  assert.match(result.stdout, /ad-build verify appd/);
  assert.doesNotMatch(result.stdout, /\bpublic-base\b/);
  assert.doesNotMatch(result.stdout, /\bbundle\b/);
  assert.doesNotMatch(result.stdout, /\bimage\b/);
  assert.doesNotMatch(result.stdout, /\bcompletion\b/);
  assert.doesNotMatch(result.stdout, /overlay build <module>/);
});

test('legacy public commands fail with an overlay migration message', () => {
  for (const command of ['public-base', 'bundle', 'image', 'completion', 'full-build', 'baseline-save', 'inventory']) {
    const result = run([command, '--help']);
    assert.notEqual(result.status, 0, `${command} unexpectedly succeeded`);
    assert.match(result.stderr, /artifact overlay|overlay/i, `${command} did not explain overlay migration`);
    assert.doesNotMatch(result.stderr, /overlay build <module>/);
  }
});

test('login help documents SSH and not token setup', () => {
  const result = run(['login', '--help']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /IdentitiesOnly/);
  assert.match(result.stdout, /\$HOME\/\.ad-build\/overlay\/auth\.json/);
  assert.match(result.stdout, /git@git\.sangfor\.com:69765\/ad-build-public-base\.git/);
  assert.doesNotMatch(result.stdout, /token-stdin|personal access token|HTTPS token/i);
});

test('top-level restore help keeps the public command name', () => {
  const result = run(['restore', '--help']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^ad-build restore/m);
  assert.match(result.stdout, /--force/);
  assert.doesNotMatch(result.stdout, /allow-source-drift/);
  assert.doesNotMatch(result.stdout, /allow-branch-mismatch/);
  assert.doesNotMatch(result.stdout, /^ad-build overlay/m);
});

test('malformed json requests return structured json errors', () => {
  for (const args of [
    ['login', '--json', '--bad-option'],
    ['overlay', 'use', '--json', '--bad-option']
  ]) {
    const result = run(args);
    assert.notEqual(result.status, 0);
    assert.equal(result.stderr, '');
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, 'error');
    assert.equal(typeof payload.error, 'string');
  }
});

test('restore without --branch returns a structured Chinese error', () => {
  const result = run(['restore', '--json']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, '');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, 'error');
  assert.match(payload.error, /分支|--branch/);
});
