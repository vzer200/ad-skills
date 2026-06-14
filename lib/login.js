const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const core = require('./core');
const overlay = require('./overlay');

const GITLAB_SSH_HOST = 'git.sangfor.com';
const GITLAB_SSH_USER = 'git';
const DEFAULT_KEY_NAME = 'id_ed25519';
const SSH_CONNECT_TIMEOUT_SECONDS = '10';

function runLoginCli(args = [], options = {}) {
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  let parsed = { json: args.includes('--json') };

  try {
    parsed = parseArgs(args);
    if (parsed.help) {
      stdout.write(helpText());
      return 0;
    }
    const result = login({ ...parsed, cwd: options.cwd, env: options.env });
    writeCliResult(stdout, parsed, result, renderLoginText(result));
    return result.status === 'authenticated' ? 0 : 4;
  } catch (error) {
    if (parsed.json) {
      stdout.write(`${JSON.stringify({
        schema_version: 1,
        generated_at: core.nowIso(),
        status: 'error',
        command: 'login',
        error: error.message,
        exit_code: error.exitCode || 2
      }, null, 2)}\n`);
    } else {
      stderr.write(`ad-build login failed: ${error.message}\n`);
    }
    return error.exitCode || 2;
  }
}

function runLogoutCli(args = [], options = {}) {
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  let parsed = { json: args.includes('--json') };

  try {
    parsed = parseArgs(args);
    if (parsed.help) {
      stdout.write(logoutHelpText());
      return 0;
    }
    const result = logout({ ...parsed, cwd: options.cwd, env: options.env });
    writeCliResult(stdout, parsed, result, `logged out overlay SSH auth\n`);
    return 0;
  } catch (error) {
    if (parsed.json) {
      stdout.write(`${JSON.stringify({
        schema_version: 1,
        generated_at: core.nowIso(),
        status: 'error',
        command: 'logout',
        error: error.message,
        exit_code: error.exitCode || 2
      }, null, 2)}\n`);
    } else {
      stderr.write(`ad-build logout failed: ${error.message}\n`);
    }
    return error.exitCode || 2;
  }
}

function login(options = {}) {
  if (options.method && options.method !== 'ssh') {
    const error = new Error('only SSH overlay login is supported in this CLI path; HTTPS token diagnostics are not delegated to public-base');
    error.exitCode = 2;
    throw error;
  }

  const repoRoot = resolveRepoRoot(options);
  const sshDir = path.join(homeDir(options.env), '.ssh');
  fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });

  let key = findSshKey(sshDir);
  if (!key && options.generateKey !== false) {
    key = generateSshKey(sshDir, options.env);
  }
  if (!key) {
    const error = new Error('no SSH key found; create ~/.ssh/id_ed25519 or rerun without --no-generate');
    error.exitCode = 4;
    throw error;
  }

  const publicKey = readPublicKey(key.publicKeyPath);
  const probe = probeGitLabSsh(options.env);
  const status = probe.ok ? 'authenticated' : 'pending_key_install';
  const auth = {
    schema_version: 1,
    kind: 'ad-build-overlay-auth',
    auth_method: 'ssh',
    status,
    generated_at: core.nowIso(),
    gitlab_host: GITLAB_SSH_HOST,
    ssh_user: GITLAB_SSH_USER,
    artifact_repo_ssh: overlay.DEFAULT_ARTIFACT_REPO_SSH,
    key_path: normalizeOutputPath(key.privateKeyPath),
    public_key_path: normalizeOutputPath(key.publicKeyPath),
    public_key: publicKey,
    probe_command: `ssh -T ${GITLAB_SSH_USER}@${GITLAB_SSH_HOST}`,
    probe_exit_code: probe.exitCode,
    probe_message: probe.message
  };
  core.writeJson(path.join(repoRoot, overlay.AUTH_PATH), auth);
  return {
    ...auth,
    auth_path: normalizeOutputPath(path.join(overlay.AUTH_PATH))
  };
}

function logout(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const authPath = path.join(repoRoot, overlay.AUTH_PATH);
  const removed = fs.existsSync(authPath);
  fs.rmSync(authPath, { force: true });
  if (options.removeCache) {
    const cache = path.join(repoRoot, '.ad-build', 'cache', 'artifact-overlay-repo');
    assertInside(repoRoot, cache, 'overlay cache');
    fs.rmSync(cache, { recursive: true, force: true });
  }
  return {
    schema_version: 1,
    status: 'removed',
    removed,
    generated_at: core.nowIso(),
    auth_path: normalizeOutputPath(overlay.AUTH_PATH),
    removed_cache: Boolean(options.removeCache)
  };
}

function findSshKey(sshDir) {
  for (const name of ['id_ed25519', 'id_rsa']) {
    const privateKeyPath = path.join(sshDir, name);
    const publicKeyPath = `${privateKeyPath}.pub`;
    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
      return { privateKeyPath, publicKeyPath };
    }
  }
  return null;
}

function generateSshKey(sshDir, env) {
  const privateKeyPath = path.join(sshDir, DEFAULT_KEY_NAME);
  const publicKeyPath = `${privateKeyPath}.pub`;
  if (fs.existsSync(privateKeyPath) || fs.existsSync(publicKeyPath)) {
    return null;
  }
  const result = spawnSync('ssh-keygen', [
    '-t',
    'ed25519',
    '-f',
    privateKeyPath,
    '-N',
    '',
    '-C',
    `ad-build-overlay@${safeHostname()}`
  ], {
    encoding: 'utf8',
    env: { ...process.env, ...(env || {}) }
  });
  if (result.error || result.status !== 0) {
    const error = new Error(`ssh-keygen failed: ${result.error?.message || trim(result.stderr) || result.status}`);
    error.exitCode = 4;
    throw error;
  }
  return { privateKeyPath, publicKeyPath };
}

function probeGitLabSsh(env) {
  const result = spawnSync('ssh', [
    '-o',
    'BatchMode=yes',
    '-o',
    `ConnectTimeout=${SSH_CONNECT_TIMEOUT_SECONDS}`,
    '-T',
    `${GITLAB_SSH_USER}@${GITLAB_SSH_HOST}`
  ], {
    encoding: 'utf8',
    env: { ...process.env, ...(env || {}) }
  });
  const message = trim(`${result.stdout || ''}\n${result.stderr || ''}`);
  const ok = !result.error && (
    result.status === 0
    || /welcome to gitlab|authenticated|successfully authenticated/i.test(message)
  );
  return {
    ok,
    exitCode: result.status ?? 2,
    message: result.error?.message || message
  };
}

function parseArgs(args) {
  const parsed = {
    help: false,
    json: false,
    method: 'ssh',
    generateKey: true,
    removeCache: false
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-h' || arg === '--help' || arg === 'help') {
      parsed.help = true;
    } else if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--method') {
      if (!args[index + 1]) {
        throw new Error('--method requires a value');
      }
      parsed.method = args[index + 1];
      index += 1;
    } else if (arg === '--no-generate') {
      parsed.generateKey = false;
    } else if (arg === '--remove-cache') {
      parsed.removeCache = true;
    } else {
      throw new Error(`unknown login option: ${arg}`);
    }
  }
  return parsed;
}

function helpText() {
  return [
    'ad-build login',
    'Usage: ad-build login [--json] [--no-generate]',
    '',
    'Default behavior:',
    '  configure SSH access for the artifact overlay repository',
    `  verify with: ssh -T ${GITLAB_SSH_USER}@${GITLAB_SSH_HOST}`,
    `  artifact repo: ${overlay.DEFAULT_ARTIFACT_REPO_SSH}`,
    '',
    'If no SSH key exists, ad-build generates ~/.ssh/id_ed25519 and prints the public key.',
    'Add the printed public key to GitLab SSH Keys, then rerun ad-build login.',
    ''
  ].join('\n');
}

function logoutHelpText() {
  return [
    'ad-build logout',
    'Usage: ad-build logout [--json] [--remove-cache]',
    '',
    'Removes .ad-build/overlay/auth.json. With --remove-cache, also removes the managed overlay artifact repo cache.',
    ''
  ].join('\n');
}

function renderLoginText(result) {
  const lines = [
    `overlay SSH login ${result.status}`,
    `auth: ${result.auth_path}`,
    `artifact_repo_ssh: ${result.artifact_repo_ssh}`,
    `public_key_path: ${result.public_key_path}`,
    '',
    'Public key:',
    result.public_key || '(missing)',
    ''
  ];
  if (result.status !== 'authenticated') {
    lines.push(`SSH probe did not authenticate yet: ${result.probe_message || `exit ${result.probe_exit_code}`}`);
    lines.push('Add the public key above to GitLab SSH Keys, then rerun: ad-build login');
    lines.push('');
  }
  return lines.join('\n');
}

function writeCliResult(stdout, parsed, result, text) {
  if (parsed.json) {
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  stdout.write(text);
}

function readPublicKey(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : null;
}

function resolveRepoRoot(options = {}) {
  if (options.repoRoot) {
    return path.resolve(options.repoRoot);
  }
  if (options.env?.AD_BUILD_WORK_DIR) {
    return path.resolve(options.env.AD_BUILD_WORK_DIR);
  }
  const cwd = options.cwd || process.cwd();
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env || {}) }
  });
  return !result.error && result.status === 0 && trim(result.stdout) ? path.resolve(trim(result.stdout)) : path.resolve(cwd);
}

function homeDir(env = {}) {
  const home = env.HOME || env.USERPROFILE || os.homedir();
  if (!home) {
    const error = new Error('HOME or USERPROFILE is required for SSH login');
    error.exitCode = 4;
    throw error;
  }
  return home;
}

function safeHostname() {
  try {
    return os.hostname();
  } catch {
    return 'unknown';
  }
}

function assertInside(parent, child, label) {
  const relative = path.relative(parent, child);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    const error = new Error(`${label} escapes parent directory: ${normalizeOutputPath(child)}`);
    error.exitCode = 5;
    throw error;
  }
}

function normalizeOutputPath(value) {
  return String(value || '').replaceAll('\\', '/');
}

function trim(value) {
  return String(value || '').trim();
}

module.exports = {
  helpText,
  login,
  logout,
  runLoginCli,
  runLogoutCli
};
