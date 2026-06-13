const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TOP_COMMANDS = [
  'doctor',
  'precheck',
  'full-build',
  'baseline-save',
  'bundle',
  'inventory',
  'public-base',
  'image',
  'diff',
  'map',
  'modules',
  'verify',
  'report',
  'skill',
  'completion',
  'help'
];

const SUBCOMMANDS = {
  bundle: ['pack', 'inspect', 'restore'],
  inventory: ['status'],
  image: ['status', 'save', 'pull', 'restore'],
  skill: ['install', 'status', 'uninstall'],
  completion: ['bash', 'zsh', 'install'],
  'public-base': ['auth', 'pack', 'check', 'use', 'publish', 'status'],
  auth: ['login', 'status', 'logout']
};

const OPTIONS = {
  'public-base': ['--json', '--branch', '--bundle', '--out', '--config', '--allow-partial', '--integrity-only', '--push', '--token-stdin', '--remove-cache'],
  bundle: ['--profile', '--out', '--bundle', '--allow-commit-mismatch'],
  completion: ['--shell', '--dir'],
  inventory: [],
  skill: ['--skills-dir', '--force'],
  image: ['--push', '--delete'],
  diff: ['--base', '--source-only'],
  map: ['--base', '--source-only'],
  'baseline-save': ['--from-run', '--replace', '--allow-dirty']
};

function runCompletionCli(args = [], options = {}) {
  const command = args[0] || 'help';
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  try {
    if (command === 'help' || command === '--help' || command === '-h') {
      stdout.write(helpText());
      return 0;
    }
    if (command === 'bash') {
      stdout.write(renderBashCompletion());
      return 0;
    }
    if (command === 'zsh') {
      stdout.write(renderZshCompletion());
      return 0;
    }
    if (command === 'install') {
      const parsed = parseArgs(args.slice(1));
      const result = installCompletion({ ...parsed, env: options.env || process.env });
      stdout.write(`installed ad-build ${result.shell} completion: ${result.path}\n`);
      stdout.write(`configured shell startup: ${result.startup_path}\n`);
      return 0;
    }
    stderr.write(`unknown completion command: ${command}\n${helpText()}`);
    return 2;
  } catch (error) {
    stderr.write(`ad-build completion ${command} failed: ${error.message}\n`);
    return error.exitCode || 2;
  }
}

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
  const publicBase = SUBCOMMANDS['public-base'].join(' ');
  const bundle = SUBCOMMANDS.bundle.join(' ');
  const completion = SUBCOMMANDS.completion.join(' ');
  const inventory = SUBCOMMANDS.inventory.join(' ');
  const image = SUBCOMMANDS.image.join(' ');
  const skill = SUBCOMMANDS.skill.join(' ');
  const publicBaseOptions = OPTIONS['public-base'].join(' ');
  const bundleOptions = OPTIONS.bundle.join(' ');
  const completionOptions = OPTIONS.completion.join(' ');
  const imageOptions = OPTIONS.image.join(' ');
  const skillOptions = OPTIONS.skill.join(' ');
  return `# bash completion for ad-build
_ad_build_completion() {
  local cur prev command sub
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  command="\${COMP_WORDS[1]}"
  sub="\${COMP_WORDS[2]}"

  if [[ "$cur" == --* ]]; then
    case "$command" in
      public-base) COMPREPLY=( $(compgen -W "${publicBaseOptions}" -- "$cur") ) ;;
      bundle) COMPREPLY=( $(compgen -W "${bundleOptions}" -- "$cur") ) ;;
      completion) COMPREPLY=( $(compgen -W "${completionOptions}" -- "$cur") ) ;;
      image) COMPREPLY=( $(compgen -W "${imageOptions}" -- "$cur") ) ;;
      skill) COMPREPLY=( $(compgen -W "${skillOptions}" -- "$cur") ) ;;
      *) COMPREPLY=( $(compgen -W "--help --json" -- "$cur") ) ;;
    esac
    return 0
  fi

  case "$COMP_CWORD" in
    1) COMPREPLY=( $(compgen -W "${top}" -- "$cur") ) ;;
    2)
      case "$command" in
        public-base) COMPREPLY=( $(compgen -W "${publicBase}" -- "$cur") ) ;;
        bundle) COMPREPLY=( $(compgen -W "${bundle}" -- "$cur") ) ;;
        completion) COMPREPLY=( $(compgen -W "${completion}" -- "$cur") ) ;;
        inventory) COMPREPLY=( $(compgen -W "${inventory}" -- "$cur") ) ;;
        image) COMPREPLY=( $(compgen -W "${image}" -- "$cur") ) ;;
        skill) COMPREPLY=( $(compgen -W "${skill}" -- "$cur") ) ;;
        *) COMPREPLY=() ;;
      esac
      ;;
    3)
      if [[ "$command" == "public-base" && "$sub" == "auth" ]]; then
        COMPREPLY=( $(compgen -W "${SUBCOMMANDS.auth.join(' ')}" -- "$cur") )
      fi
      ;;
  esac
}
complete -F _ad_build_completion ad-build
`;
}

function renderZshCompletion() {
  const top = TOP_COMMANDS.map((item) => zshQuote(`${item}:${describeTopCommand(item)}`)).join(' ');
  const publicBase = SUBCOMMANDS['public-base'].join(' ');
  const bundle = SUBCOMMANDS.bundle.join(' ');
  const completion = SUBCOMMANDS.completion.join(' ');
  const inventory = SUBCOMMANDS.inventory.join(' ');
  const image = SUBCOMMANDS.image.join(' ');
  const skill = SUBCOMMANDS.skill.join(' ');
  const auth = SUBCOMMANDS.auth.join(' ');
  const publicBaseOptions = OPTIONS['public-base'].join(' ');
  const bundleOptions = OPTIONS.bundle.join(' ');
  const completionOptions = OPTIONS.completion.join(' ');
  const inventoryOptions = OPTIONS.inventory.join(' ');
  const imageOptions = OPTIONS.image.join(' ');
  const skillOptions = OPTIONS.skill.join(' ');
  return `#compdef ad-build
_ad_build() {
  local -a commands public_base bundle completion inventory image skill auth_commands public_base_opts bundle_opts completion_opts inventory_opts image_opts skill_opts default_opts
  commands=(${top})
  public_base=(${publicBase})
  bundle=(${bundle})
  completion=(${completion})
  inventory=(${inventory})
  image=(${image})
  skill=(${skill})
  auth_commands=(${auth})
  public_base_opts=(${publicBaseOptions})
  bundle_opts=(${bundleOptions})
  completion_opts=(${completionOptions})
  inventory_opts=(${inventoryOptions})
  image_opts=(${imageOptions})
  skill_opts=(${skillOptions})
  default_opts=(--help --json)

  _arguments -C \\
    '1:command:->command' \\
    '2:subcommand:->subcommand' \\
    '3:auth command:->auth_command' \\
    '*::arg:->args'

  case "$state" in
    command)
      _describe 'ad-build command' commands
      ;;
    subcommand)
      case "$words[2]" in
        public-base) _values 'public-base command' $public_base ;;
        bundle) _values 'bundle command' $bundle ;;
        completion) _values 'completion command' $completion ;;
        inventory) _values 'inventory command' $inventory ;;
        image) _values 'image command' $image ;;
        skill) _values 'skill command' $skill ;;
      esac
      ;;
    auth_command)
      if [[ "$words[2]" == "public-base" && "$words[3]" == "auth" ]]; then
        _values 'public-base auth command' $auth_commands
      fi
      ;;
    args)
      case "$words[2]" in
        public-base) _values 'options' $public_base_opts ;;
        bundle) _values 'options' $bundle_opts ;;
        completion) _values 'options' $completion_opts ;;
        inventory) _values 'options' $inventory_opts ;;
        image) _values 'options' $image_opts ;;
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
    doctor: 'check environment',
    precheck: 'check baseline reuse',
    'full-build': 'record full build',
    'baseline-save': 'publish baseline',
    bundle: 'compiled-state bundle',
    inventory: 'restore inventory status',
    'public-base': 'public dependency bundle',
    image: 'base image workflow',
    diff: 'write changed files',
    map: 'map files to modules',
    modules: 'list modules',
    verify: 'run module verification',
    report: 'write verify report',
    skill: 'install bundled skill',
    completion: 'install shell completion',
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
  return 'bash';
}

function homeDir(env = process.env) {
  return env.HOME || env.USERPROFILE || os.homedir();
}

function helpText() {
  return [
    'ad-build completion',
    'Usage:',
    '  ad-build completion bash',
    '  ad-build completion zsh',
    '  ad-build completion install [--shell bash|zsh] [--dir <dir>]',
    ''
  ].join('\n');
}

module.exports = {
  installCompletion,
  renderBashCompletion,
  renderZshCompletion,
  runCompletionCli
};
