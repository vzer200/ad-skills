const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const login = require('../lib/login');

test('SSH probe forces the selected key and disables unrelated identities', () => {
  const args = login.buildSshProbeArgs('/root/.ssh/id_ed25519');

  assert.deepEqual(args.slice(0, 6), [
    '-i',
    '/root/.ssh/id_ed25519',
    '-o',
    'IdentitiesOnly=yes',
    '-o',
    'BatchMode=yes'
  ]);
  assert.equal(args.at(-1), 'git@git.sangfor.com');
});

test('authenticated login reports concise Chinese status without reprinting the public key', () => {
  const home = tmpDir('ad-build-login-home-');
  writeKeyPair(home, 'ssh-ed25519 AAAATEST ad-build-overlay@test');
  const fakeBin = fakeSshBin({ ok: true });
  let stdout = '';
  let stderr = '';

  const code = login.runLoginCli([], {
    env: {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH || ''}`,
      Path: `${fakeBin}${path.delimiter}${process.env.Path || process.env.PATH || ''}`
    },
    probeGitLabSsh: () => ({ ok: true, exitCode: 0, message: 'Welcome to GitLab' }),
    stdout: { write(value) { stdout += value; } },
    stderr: { write(value) { stderr += value; } }
  });

  assert.equal(code, 0, stderr);
  assert.match(stdout, /已通过|登录成功/);
  assert.doesNotMatch(stdout, /ssh-ed25519 AAAATEST/);
  assert.equal(stderr, '');
});

test('pending login prints the public key only once for the same generated key', () => {
  const home = tmpDir('ad-build-login-home-');
  writeKeyPair(home, 'ssh-ed25519 AAAAPENDING ad-build-overlay@test');
  const fakeBin = fakeSshBin({ ok: false });
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    PATH: `${fakeBin}${path.delimiter}${process.env.PATH || ''}`,
    Path: `${fakeBin}${path.delimiter}${process.env.Path || process.env.PATH || ''}`
  };

  let first = '';
  let second = '';
  const probeGitLabSsh = () => ({ ok: false, exitCode: 255, message: 'Permission denied (publickey,password).' });
  login.runLoginCli([], { env, probeGitLabSsh, stdout: { write(value) { first += value; } }, stderr: { write() {} } });
  login.runLoginCli([], { env, probeGitLabSsh, stdout: { write(value) { second += value; } }, stderr: { write() {} } });

  assert.match(first, /ssh-ed25519 AAAAPENDING/);
  assert.match(first, /GitLab.*SSH Keys|SSH Keys/);
  assert.doesNotMatch(second, /ssh-ed25519 AAAAPENDING/);
  assert.match(second, /待添加密钥|未通过/);
});

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeKeyPair(home, publicKey) {
  const sshDir = path.join(home, '.ssh');
  fs.mkdirSync(sshDir, { recursive: true });
  fs.writeFileSync(path.join(sshDir, 'id_ed25519'), 'PRIVATE\n');
  fs.writeFileSync(path.join(sshDir, 'id_ed25519.pub'), `${publicKey}\n`);
}

function fakeSshBin({ ok }) {
  const bin = tmpDir('ad-build-fake-ssh-');
  const file = path.join(bin, process.platform === 'win32' ? 'ssh.cmd' : 'ssh');
  if (process.platform === 'win32') {
    const body = ok
      ? '@echo off\r\necho Welcome to GitLab\r\nexit /b 0\r\n'
      : '@echo off\r\necho Permission denied (publickey,password). 1>&2\r\nexit /b 255\r\n';
    fs.writeFileSync(file, body);
  } else {
    const body = ok
      ? '#!/bin/sh\necho "Welcome to GitLab"\nexit 0\n'
      : '#!/bin/sh\necho "Permission denied (publickey,password)." >&2\nexit 255\n';
    fs.writeFileSync(file, body);
    fs.chmodSync(file, 0o755);
  }
  return bin;
}
