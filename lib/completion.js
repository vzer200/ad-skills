const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TOP_COMMANDS = [
  'login',
  'logout',
  'overlay',
  'skill',
  'help'
];

const SUBCOMMANDS = {
  overlay: ['pack', 'publish', 'use', 'status', 'doctor', 'repair', 'build'],
  repair: ['paths', 'dpdk'],
  skill: ['status', 'help']
};

const OPTIONS = {
  overlay: ['--branch'],
  skill: ['--skills-dir'],
  login: ['--json', '--no-generate'],
  logout: ['--json', '--remove-cache']
};

function installCompletion(options = {}) {
  const shell = options.shell || detectShell(options.env || process.env);
  if (!['bash', 'zsh'].includes(shell)) {
    const error = new Error(`unsupported completion shell: ${shell}`);
    error.exitCode = 2;
    throw error;
  }
  const home = homeDir(options.env || process.env);
  const target = options.dir
    ? path.join(path.resolve(options.dir), shell === 'zsh' ? '_ad-build' : 'ad-build')
    : shell === 'zsh'
      ? path.join(home, '.zsh', 'completions', '_ad-build')
      : path.join(home, '.bash_completion.d', 'ad-build');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, shell === 'zsh' ? renderZshCompletion() : renderBashCompletion());
  const startup = configureShellStartup(shell, home, target);
  return { shell, path: target, startup_path: startup.path };
}

function installCompletionBestEffort(options = {}) {
  const env = options.env || process.env;
  const stderr = options.stderr || process.stderr;
  if (env.AD_BUILD_SKIP_COMPLETION_INSTALL === '1') {
    return {
      ok: false,
      skipped: true,
      reason: 'AD_BUILD_SKIP_COMPLETION_INSTALL=1'
    };
  }

  try {
    const result = installCompletion({ ...options, env });
    return {
      ok: true,
      skipped: false,
      ...result
    };
  } catch (error) {
    if (stderr && typeof stderr.write === 'function') {
      stderr.write(`warning: ad-build completion install skipped: ${error.message}\n`);
    }
    return {
      ok: false,
      skipped: false,
      warning: error.message
    };
  }
}

function configureShellStartup(shell, home, target) {
  if (shell === 'zsh') {
    const rc = path.join(home, '.zshrc');
    const dir = path.dirname(target);
    writeManagedBlock(rc, 'ad-build completion', [
      `fpath=(${shellQuote(dir)} $fpath)`,
      'autoload -Uz compinit',
      'compinit'
    ].join('\n'));
    return { path: rc };
  }
  const rc = path.join(home, '.bashrc');
  writeManagedBlock(rc, 'ad-build completion', [
    `if [ -f ${shellQuote(target)} ]; then`,
    `  . ${shellQuote(target)}`,
    'fi'
  ].join('\n'));
  return { path: rc };
}

function writeManagedBlock(file, label, body) {
  const start = `# >>> ${label} >>>`;
  const end = `# <<< ${label} <<<`;
  const block = `${start}\n${body}\n${end}\n`;
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`);
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current}${current && !current.endsWith('\n') ? '\n' : ''}${block}`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next);
}

function shellQuote(value) {
  return `'${String(value).replaceAll('\\', '/').replace(/'/g, "'\\''")}'`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderBashCompletion() {
  const top = TOP_COMMANDS.join(' ');
  const overlay = SUBCOMMANDS.overlay.join(' ');
  const repair = SUBCOMMANDS.repair.join(' ');
  const skill = SUBCOMMANDS.skill.join(' ');
  const overlayOptions = OPTIONS.overlay.join(' ');
  const loginOptions = OPTIONS.login.join(' ');
  const logoutOptions = OPTIONS.logout.join(' ');
  const skillOptions = OPTIONS.skill.join(' ');
  return `# bash tab support for ad-build
_ad_build_complete() {
  local cur prev command sub
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  command="\${COMP_WORDS[1]}"
  sub="\${COMP_WORDS[2]}"

  if [[ "$cur" == --* ]]; then
    case "$command" in
      overlay) COMPREPLY=( $(compgen -W "${overlayOptions}" -- "$cur") ) ;;
      login) COMPREPLY=( $(compgen -W "${loginOptions}" -- "$cur") ) ;;
      logout) COMPREPLY=( $(compgen -W "${logoutOptions}" -- "$cur") ) ;;
      skill) COMPREPLY=( $(compgen -W "${skillOptions}" -- "$cur") ) ;;
      *) COMPREPLY=( $(compgen -W "--help" -- "$cur") ) ;;
    esac
    return 0
  fi

  case "$COMP_CWORD" in
    1) COMPREPLY=( $(compgen -W "${top}" -- "$cur") ) ;;
    2)
      case "$command" in
        overlay) COMPREPLY=( $(compgen -W "${overlay}" -- "$cur") ) ;;
        skill) COMPREPLY=( $(compgen -W "${skill}" -- "$cur") ) ;;
        *) COMPREPLY=() ;;
      esac
      ;;
    3)
      if [[ "$command" == "overlay" && "$sub" == "repair" ]]; then
        COMPREPLY=( $(compgen -W "${repair}" -- "$cur") )
      fi
      ;;
  esac
}
complete -F _ad_build_complete ad-build
`;
}

function renderZshCompletion() {
  const top = TOP_COMMANDS.map((item) => zshQuote(`${item}:${describeTopCommand(item)}`)).join(' ');
  const overlay = SUBCOMMANDS.overlay.join(' ');
  const repair = SUBCOMMANDS.repair.join(' ');
  const skill = SUBCOMMANDS.skill.join(' ');
  const overlayOptions = OPTIONS.overlay.join(' ');
  const loginOptions = OPTIONS.login.join(' ');
  const logoutOptions = OPTIONS.logout.join(' ');
  const skillOptions = OPTIONS.skill.join(' ');
  return `#compdef ad-build
_ad_build() {
  local -a commands overlay repair_commands skill overlay_opts login_opts logout_opts skill_opts default_opts
  commands=(${top})
  overlay=(${overlay})
  repair_commands=(${repair})
  skill=(${skill})
  overlay_opts=(${overlayOptions})
  login_opts=(${loginOptions})
  logout_opts=(${logoutOptions})
  skill_opts=(${skillOptions})
  default_opts=(--help)

  _arguments -C \\
    '1:command:->command' \\
    '2:subcommand:->subcommand' \\
    '3:repair command:->repair_command' \\
    '*::arg:->args'

  case "$state" in
    command)
      _describe 'ad-build command' commands
      ;;
    subcommand)
      case "$words[2]" in
        overlay) _values 'overlay command' $overlay ;;
        skill) _values 'skill command' $skill ;;
      esac
      ;;
    repair_command)
      if [[ "$words[2]" == "overlay" && "$words[3]" == "repair" ]]; then
        _values 'overlay repair command' $repair_commands
      fi
      ;;
    args)
      case "$words[2]" in
        overlay) _values 'options' $overlay_opts ;;
        login) _values 'options' $login_opts ;;
        logout) _values 'options' $logout_opts ;;
        skill) _values 'options' $skill_opts ;;
        *) _values 'options' $default_opts ;;
      esac
      ;;
  esac
}
_ad_build "$@"
`;
}

function describeTopCommand(command) {
  const descriptions = {
    login: 'log in to artifact overlay',
    logout: 'log out from artifact overlay',
    overlay: 'artifact overlay workflow',
    skill: 'manage bundled skill',
    help: 'show help'
  };
  return descriptions[command] || command;
}

function zshQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function parseArgs(args) {
  return {
    shell: option(args, '--shell') || undefined,
    dir: option(args, '--dir') || undefined
  };
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0) {
    return null;
  }
  if (!args[index + 1]) {
    throw new Error(`${name} requires a value`);
  }
  return args[index + 1];
}

function detectShell(env = process.env) {
  const shell = String(env.SHELL || '').toLowerCase();
  if (shell.includes('zsh')) {
    return 'zsh';
  }
  if (shell && !shell.includes('bash')) {
    return path.basename(shell);
  }
  return 'bash';
}

function homeDir(env = process.env) {
  return env.HOME || env.USERPROFILE || os.homedir();
}

module.exports = {
  installCompletion,
  installCompletionBestEffort,
  renderBashCompletion,
  renderZshCompletion
};
