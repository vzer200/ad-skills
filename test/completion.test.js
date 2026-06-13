const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.join(__dirname, '..', 'bin', 'ad-build.js');

test('completion bash prints ad-build completion script', () => {
  const result = spawnSync(process.execPath, [cli, 'completion', 'bash'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /_ad_build_completion/);
  assert.match(result.stdout, /public-base/);
  assert.match(result.stdout, /auth pack check use publish status/);
  assert.match(result.stdout, /inventory\) COMPREPLY=\( \$\(compgen -W "status"/);
  assert.match(result.stdout, /image\) COMPREPLY=\( \$\(compgen -W "status save pull restore"/);
  assert.match(result.stdout, /skill\) COMPREPLY=\( \$\(compgen -W "install status uninstall"/);
  assert.doesNotMatch(result.stdout, /key pack check/);
  assert.doesNotMatch(result.stdout, /status restore/);
  assert.match(result.stdout, /--integrity-only/);
  assert.match(result.stdout, /--allow-unproven/);
  assert.doesNotMatch(result.stdout, /public-base\) COMPREPLY=.*--force/);
  assert.match(result.stdout, /complete -F _ad_build_completion ad-build/);
});

test('completion zsh prints ad-build completion script', () => {
  const result = spawnSync(process.execPath, [cli, 'completion', 'zsh'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /#compdef ad-build/);
  assert.match(result.stdout, /public-base/);
  assert.match(result.stdout, /_arguments/);
  assert.match(result.stdout, /commands=\('doctor:check environment'/);
  assert.match(result.stdout, /public_base=\(auth pack check use publish status\)/);
  assert.match(result.stdout, /inventory=\(status\)/);
  assert.match(result.stdout, /image=\(status save pull restore\)/);
  assert.match(result.stdout, /skill=\(install status uninstall\)/);
  assert.match(result.stdout, /auth_commands=\(login status logout\)/);
  assert.match(result.stdout, /--integrity-only/);
  assert.match(result.stdout, /--allow-unproven/);
  assert.doesNotMatch(result.stdout, /public_base_opts=.*--force/);
  assert.doesNotMatch(result.stdout, /public_base=\(.*restore/);
  assert.doesNotMatch(result.stdout, /commands=\(doctor:check environment/);
});

test('completion install writes shell completion into requested home directory', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-completion-home-'));
  const result = spawnSync(process.execPath, [cli, 'completion', 'install', '--shell', 'bash'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, HOME: home, USERPROFILE: home }
  });

  const target = path.join(home, '.bash_completion.d', 'ad-build');
  const bashrc = path.join(home, '.bashrc');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(target), true);
  assert.match(fs.readFileSync(target, 'utf8'), /_ad_build_completion/);
  assert.match(fs.readFileSync(bashrc, 'utf8'), /ad-build completion/);
  assert.match(fs.readFileSync(bashrc, 'utf8'), /bash_completion\.d\/ad-build/);
  assert.match(result.stdout, /installed ad-build bash completion/);
});

test('completion install writes zsh fpath configuration', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-completion-zsh-home-'));
  const result = spawnSync(process.execPath, [cli, 'completion', 'install', '--shell', 'zsh'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, HOME: home, USERPROFILE: home }
  });

  const target = path.join(home, '.zsh', 'completions', '_ad-build');
  const zshrc = path.join(home, '.zshrc');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(target), true);
  assert.match(fs.readFileSync(target, 'utf8'), /#compdef ad-build/);
  assert.match(fs.readFileSync(zshrc, 'utf8'), /fpath=/);
  assert.match(fs.readFileSync(zshrc, 'utf8'), /compinit/);
});

test('completion bash script completes public-base commands when bash is available', (t) => {
  const bashVersion = spawnSync('bash', ['--version'], { encoding: 'utf8' });
  if (bashVersion.status !== 0) {
    t.skip('bash is not available');
    return;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-completion-bash-'));
  const script = path.join(dir, 'ad-build');
  fs.writeFileSync(script, spawnSync(process.execPath, [cli, 'completion', 'bash'], { encoding: 'utf8' }).stdout);
  const quoted = script.replaceAll('\\', '/').replace(/'/g, "'\\''");
  const result = spawnSync('bash', ['-lc', `source '${quoted}'; COMP_WORDS=(ad-build public-base ""); COMP_CWORD=2; _ad_build_completion; printf '%s\\n' "\${COMPREPLY[@]}"`], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /check/);
  assert.match(result.stdout, /use/);
  assert.doesNotMatch(result.stdout, /restore/);
});
