const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.join(__dirname, '..');

test('npm package file whitelist contains only overlay runtime files', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(pkg.files.includes('lib'), false, 'package must not ship the whole legacy lib directory');
  assert.equal(pkg.files.includes('templates'), false, 'package must not ship old template flows');

  for (const required of [
    'bin',
    'lib/core.js',
    'lib/file-utils.js',
    'lib/completion.js',
    'lib/skill.js',
    'lib/login.js',
    'lib/overlay.js',
    'skills',
    'README.md',
    'docs/artifact-overlay-operations.md'
  ]) {
    assert.ok(pkg.files.includes(required), `missing package file entry: ${required}`);
  }

  for (const legacy of [
    'lib/public-base.js',
    'lib/bundle.js',
    'lib/base-image.js',
    'lib/commands.js',
    'lib/module-map.js',
    'docs/public-base-architecture.md',
    'docs/glm5-public-base-handoff.md',
    'docs/artifact-overlay-mvp-fix-plan.md'
  ]) {
    assert.equal(pkg.files.includes(legacy), false, `legacy package entry must not be shipped: ${legacy}`);
  }
});

test('npm pack dry-run ships only the overlay MVP runtime', () => {
  const result = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'npm pack --dry-run --json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        AD_BUILD_SKIP_COMPLETION_INSTALL: '1'
      }
    })
    : spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      AD_BUILD_SKIP_COMPLETION_INSTALL: '1'
    }
  });
  assert.equal(result.status, 0, result.stderr);
  const packed = JSON.parse(result.stdout)[0];
  const files = packed.files.map((item) => item.path).sort();

  for (const expected of [
    'README.md',
    'bin/ad-build.js',
    'docs/artifact-overlay-operations.md',
    'lib/completion.js',
    'lib/core.js',
    'lib/file-utils.js',
    'lib/login.js',
    'lib/overlay.js',
    'lib/skill.js',
    'package.json',
    'skills/ad-build/SKILL.md'
  ]) {
    assert.ok(files.includes(expected), `npm package missing ${expected}`);
  }

  for (const file of files) {
    assert.doesNotMatch(file, /public-base|bundle|base-image|commands\.js|module-map|template|dist|mvp-fix-plan/i);
  }
});

test('default test script runs the overlay test matrix, not legacy suites', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.match(pkg.scripts.test, /cli-surface\.test\.js/);
  assert.match(pkg.scripts.test, /completion\.test\.js/);
  assert.match(pkg.scripts.test, /overlay\.test\.js/);
  assert.match(pkg.scripts.test, /package-shape\.test\.js/);
  assert.match(pkg.scripts.test, /skill-install\.test\.js/);
  assert.doesNotMatch(pkg.scripts.test, /public-base\.test\.js|bundle\.test\.js|base-image\.test\.js/);
});
