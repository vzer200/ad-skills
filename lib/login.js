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
    const result = login({ ...parsed, cwd: options.cwd, env: options.env, probeGitLabSsh: options.probeGitLabSsh });
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
      stderr.write(`ad-build login 失败: ${error.message}\n`);
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
    writeCliResult(stdout, parsed, result, renderLogoutText(result));
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
      stderr.write(`ad-build logout 失败: ${error.message}\n`);
    }
    return error.exitCode || 2;
  }
}

function login(options = {}) {
  if (options.method && options.method !== 'ssh') {
    const error = new Error('当前版本只支持 SSH 登录 overlay 产物仓库');
    error.exitCode = 2;
    throw error;
  }

  const authPath = overlay.overlayStatePath({ env: options.env }, 'auth.json');
  const previousAuth = readOptionalJson(authPath);
  const sshDir = path.join(homeDir(options.env), '.ssh');
  fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });

  let key = findSshKey(sshDir);
  if (!key && options.generateKey !== false) {
    key = generateSshKey(sshDir, options.env);
  }
  if (!key) {
    const error = new Error('没有找到 SSH key；请创建 ~/.ssh/id_ed25519，或去掉 --no-generate 让 CLI 自动生成');
    error.exitCode = 4;
    throw error;
  }

  const publicKey = readPublicKey(key.publicKeyPath);
  const probeRunner = options.probeGitLabSsh || probeGitLabSsh;
  const probe = probeRunner(key.privateKeyPath, options.env);
  const status = probe.ok ? 'authenticated' : 'pending_key_install';
  const samePendingKeyWasShown = previousAuth?.public_key === publicKey && previousAuth?.key_instruction_shown === true;
  const showPublicKey = status !== 'authenticated' && !samePendingKeyWasShown;
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
    key_instruction_shown: status === 'pending_key_install' ? true : Boolean(previousAuth?.key_instruction_shown),
    probe_command: `ssh ${buildSshProbeArgs(key.privateKeyPath).join(' ')}`,
    probe_exit_code: probe.exitCode,
    probe_message: probe.message
  };
  core.writeJson(authPath, auth);
  return {
    ...auth,
    auth_path: normalizeOutputPath(authPath),
    show_public_key: showPublicKey
  };
}

function logout(options = {}) {
  const authPath = overlay.overlayStatePath({ env: options.env }, 'auth.json');
  const removed = fs.existsSync(authPath);
  fs.rmSync(authPath, { force: true });
  if (options.removeCache) {
    const root = overlay.stateRoot({ env: options.env });
    const cache = overlay.statePath({ env: options.env }, 'cache', 'artifact-overlay-repo');
    assertInside(root, cache, 'overlay cache');
    fs.rmSync(cache, { recursive: true, force: true });
  }
  return {
    schema_version: 1,
    status: 'removed',
    removed,
    generated_at: core.nowIso(),
    auth_path: normalizeOutputPath(authPath),
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
    const error = new Error(`ssh-keygen 执行失败: ${result.error?.message || trim(result.stderr) || result.status}`);
    error.exitCode = 4;
    throw error;
  }
  return { privateKeyPath, publicKeyPath };
}

function buildSshProbeArgs(privateKeyPath) {
  return [
    '-i',
    privateKeyPath,
    '-o',
    'IdentitiesOnly=yes',
    '-o',
    'BatchMode=yes',
    '-o',
    `ConnectTimeout=${SSH_CONNECT_TIMEOUT_SECONDS}`,
    '-T',
    `${GITLAB_SSH_USER}@${GITLAB_SSH_HOST}`
  ];
}

function probeGitLabSsh(privateKeyPath, env) {
  const result = spawnSync('ssh', buildSshProbeArgs(privateKeyPath), {
    encoding: 'utf8',
    env: { ...process.env, ...(env || {}) }
  });
  const message = trim(`${result.stdout || ''}\n${result.stderr || ''}`);
  const ok = !result.error && (
    result.status === 0
    || /welcome|authenticated|successfully authenticated|server accepts key/i.test(message)
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
        throw new Error('--method 需要一个值');
      }
      parsed.method = args[index + 1];
      index += 1;
    } else if (arg === '--no-generate') {
      parsed.generateKey = false;
    } else if (arg === '--remove-cache') {
      parsed.removeCache = true;
    } else {
      throw new Error(`未知 login 参数: ${arg}`);
    }
  }
  return parsed;
}

function helpText() {
  return [
    'ad-build login',
    'Usage: ad-build login [--json] [--no-generate]',
    '',
    '默认行为:',
    '  配置并检查 artifact overlay 产物仓库的 SSH 访问。',
    '  SSH 探测会强制使用当前选择的私钥，并启用 IdentitiesOnly，避免 ssh-agent 或其他 key 干扰。',
    `  产物仓库: ${overlay.DEFAULT_ARTIFACT_REPO_SSH}`,
    '  认证状态文件: $HOME/.ad-build/overlay/auth.json',
    '',
    '如果没有 SSH key，ad-build 会生成 ~/.ssh/id_ed25519 并打印公钥。',
    '把首次打印的整行公钥添加到 GitLab -> SSH Keys 后，重新执行 ad-build login。',
    ''
  ].join('\n');
}

function logoutHelpText() {
  return [
    'ad-build logout',
    'Usage: ad-build logout [--json] [--remove-cache]',
    '',
    '删除 $HOME/.ad-build/overlay/auth.json。带 --remove-cache 时同时删除 $HOME/.ad-build/cache/artifact-overlay-repo。',
    ''
  ].join('\n');
}

function renderLoginText(result) {
  if (result.status === 'authenticated') {
    return [
      'overlay SSH 登录: 已通过',
      `认证文件: ${result.auth_path}`,
      `产物仓库: ${result.artifact_repo_ssh}`,
      'SSH 探测已通过，可以继续执行 pack/publish/restore。',
      ''
    ].join('\n');
  }

  const lines = [
    'overlay SSH 登录: 待添加密钥',
    `认证文件: ${result.auth_path}`,
    `产物仓库: ${result.artifact_repo_ssh}`,
    `公钥文件: ${result.public_key_path}`
  ];
  if (result.show_public_key) {
    lines.push('');
    lines.push('请把下面这一整行添加到 GitLab -> SSH Keys:');
    lines.push(result.public_key || '(missing)');
  } else {
    lines.push('这把公钥之前已经提示过；请确认已添加到 GitLab -> SSH Keys。');
  }
  lines.push('');
  lines.push(`SSH 探测未通过: ${result.probe_message || `exit ${result.probe_exit_code}`}`);
  lines.push('添加或修正 SSH key 后重新执行: ad-build login');
  lines.push('');
  return lines.join('\n');
}

function renderLogoutText(result) {
  return [
    'overlay SSH 登录信息已清理',
    `认证文件: ${result.auth_path}`,
    `是否删除认证文件: ${result.removed ? '是' : '否，原本不存在'}`,
    `是否删除缓存仓库: ${result.removed_cache ? '是' : '否'}`,
    ''
  ].join('\n');
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

function readOptionalJson(file) {
  try {
    return fs.existsSync(file) ? core.readJson(file) : null;
  } catch {
    return null;
  }
}

function homeDir(env = {}) {
  const home = env.HOME || env.USERPROFILE || os.homedir();
  if (!home) {
    const error = new Error('SSH 登录需要 HOME 或 USERPROFILE');
    error.exitCode = 4;
    throw error;
  }
  return home;
}

function safeHostname() {
  try {
    return os.hostname();
  } catch {
    return '未知';
  }
}

function assertInside(parent, child, label) {
  const relative = path.relative(parent, child);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    const error = new Error(`${label} 越过父目录边界: ${normalizeOutputPath(child)}`);
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
  buildSshProbeArgs,
  runLoginCli,
  runLogoutCli
};
