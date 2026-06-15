const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');

const completion = require('../lib/completion');

test('bash completion contains the overlay whitelist and no legacy commands', () => {
  const script = completion.renderBashCompletion();

  for (const expected of ['login', 'logout', 'skill', 'pack', 'publish', 'restore', 'status', 'doctor', 'repair', 'verify']) {
    assert.match(script, new RegExp(`\\b${expected}\\b`));
  }

  assert.doesNotMatch(script, /(^|\s)overlay(\s|$)/);

  for (const legacy of ['public-base', 'bundle', 'image', 'inventory', 'baseline-save', 'full-build', 'report', 'completion', '--token-stdin', '--allow-source-drift']) {
    assert.doesNotMatch(script, new RegExp(legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('zsh completion contains the overlay whitelist and no legacy commands', () => {
  const script = completion.renderZshCompletion();

  assert.doesNotMatch(script, /overlay:artifact overlay workflow/);
  assert.match(script, /\brepair\b/);
  assert.match(script, /\bdpdk\b/);
  assertNoLegacyTokens(script);
});

test('shell completion module exposes only internal install/render helpers', () => {
  assert.deepEqual(Object.keys(completion).sort(), [
    'installCompletion',
    'installCompletionBestEffort',
    'renderBashCompletion',
    'renderZshCompletion'
  ]);
});

test('best-effort completion install can be skipped and does not throw on unsupported shells', () => {
  const home = path.join(os.tmpdir(), `ad-build-completion-${Date.now()}`);
  const skipped = completion.installCompletionBestEffort({
    env: {
      HOME: home,
      SHELL: '/bin/bash',
      AD_BUILD_SKIP_COMPLETION_INSTALL: '1'
    }
  });
  assert.equal(skipped.skipped, true);

  let warning = '';
  const unsupported = completion.installCompletionBestEffort({
    env: {
      HOME: home,
      SHELL: '/bin/fish'
    },
    stderr: {
      write(value) {
        warning += value;
      }
    }
  });
  assert.equal(unsupported.ok, false);
  assert.match(warning, /警告: ad-build 补全安装已跳过/);
});

function assertNoLegacyTokens(script) {
  for (const legacy of ['public-base', 'bundle', 'image', 'inventory', 'baseline-save', 'full-build', 'report', 'completion', '--token-stdin', '--allow-source-drift']) {
    const escaped = legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = legacy.startsWith('--')
      ? new RegExp(escaped)
      : new RegExp(`(^|[^A-Za-z0-9_-])${escaped}([^A-Za-z0-9_-]|$)`);
    assert.doesNotMatch(script, pattern);
  }
}
