const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');

test('CLI installs bundled ad-build skill into requested skills directory', () => {
  const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-skills-'));
  const result = spawnSync(process.execPath, [cli, 'skill', 'install', '--skills-dir', skillsDir], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(skillsDir, 'ad-build', 'SKILL.md')), true);
  assert.match(result.stdout, /installed/i);
});

test('CLI reports installed skill status and refuses overwrite without force', () => {
  const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-skills-'));
  const first = spawnSync(process.execPath, [cli, 'skill', 'install', '--skills-dir', skillsDir], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(first.status, 0, first.stderr);

  const second = spawnSync(process.execPath, [cli, 'skill', 'install', '--skills-dir', skillsDir], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(second.status, 4);
  assert.match(second.stderr, /already exists|--force/i);

  const status = spawnSync(process.execPath, [cli, 'skill', 'status', '--skills-dir', skillsDir], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /installed/i);

  const forced = spawnSync(process.execPath, [cli, 'skill', 'install', '--skills-dir', skillsDir, '--force'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(forced.status, 0, forced.stderr);
});

test('CLI uninstalls bundled ad-build skill from requested skills directory', () => {
  const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-skills-'));
  const install = spawnSync(process.execPath, [cli, 'skill', 'install', '--skills-dir', skillsDir], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(install.status, 0, install.stderr);

  const uninstall = spawnSync(process.execPath, [cli, 'skill', 'uninstall', '--skills-dir', skillsDir], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.equal(fs.existsSync(path.join(skillsDir, 'ad-build')), false);
  assert.match(uninstall.stdout, /removed/i);
});
