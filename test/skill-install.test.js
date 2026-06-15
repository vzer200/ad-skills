const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');

function runSkill(args, env = {}) {
  return spawnSync(process.execPath, [cli, 'skill', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      AD_BUILD_SKIP_COMPLETION_INSTALL: '1',
      ...env
    }
  });
}

test('CLI installs bundled ad-build skill into requested skills directory', () => {
  const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-skills-'));
  const result = runSkill(['install', '--skills-dir', skillsDir]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(skillsDir, 'ad-build', 'SKILL.md')), true);
  assert.match(result.stdout, /已安装/);
});

test('CLI reports installed skill status and refuses overwrite without force', () => {
  const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-skills-'));
  const first = runSkill(['install', '--skills-dir', skillsDir]);
  assert.equal(first.status, 0, first.stderr);

  const second = runSkill(['install', '--skills-dir', skillsDir]);
  assert.equal(second.status, 4);
  assert.match(second.stderr, /已存在|--force/i);

  const status = runSkill(['status', '--skills-dir', skillsDir]);
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /已安装/);

  const forced = runSkill(['install', '--skills-dir', skillsDir, '--force']);
  assert.equal(forced.status, 0, forced.stderr);
});

test('skill help only exposes the public status command', () => {
  const result = runSkill(['help']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /status/);
  assert.doesNotMatch(result.stdout, /install \[/);
  assert.doesNotMatch(result.stdout, /uninstall/);
});

test('installing the skill best-effort installs shell completion in the user home', () => {
  const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-skills-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-home-'));
  const result = runSkill(['install', '--skills-dir', skillsDir], {
    HOME: home,
    USERPROFILE: home,
    SHELL: '/bin/bash',
    AD_BUILD_SKIP_COMPLETION_INSTALL: '0'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /已安装 ad-build bash 补全/);
  assert.equal(fs.existsSync(path.join(home, '.bash_completion.d', 'ad-build')), true);
});

test('CLI uninstalls bundled ad-build skill from requested skills directory', () => {
  const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-skills-'));
  const install = runSkill(['install', '--skills-dir', skillsDir]);
  assert.equal(install.status, 0, install.stderr);

  const uninstall = runSkill(['uninstall', '--skills-dir', skillsDir]);

  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.equal(fs.existsSync(path.join(skillsDir, 'ad-build')), false);
  assert.match(uninstall.stdout, /已删除/);
});
