const fs = require('node:fs');
const path = require('node:path');
const { installCompletionBestEffort } = require('./completion');

const SKILL_NAME = 'ad-build';

function runSkillCli(args = [], options = {}) {
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  const env = options.env || process.env;
  const cwd = options.cwd || process.cwd();

  try {
    const parsed = parseArgs(args, { cwd, env });
    if (parsed.command === 'help') {
      stdout.write(helpText());
      return 0;
    }

    if (parsed.command === 'install') {
      const result = installSkill(parsed);
      stdout.write(`installed ${SKILL_NAME} skill: ${result.target_dir}\n`);
      const completionResult = installCompletionBestEffort({ env, stderr });
      if (completionResult.ok) {
        stdout.write(`installed ${SKILL_NAME} ${completionResult.shell} completion: ${completionResult.path}\n`);
      }
      return 0;
    }

    if (parsed.command === 'status') {
      const result = skillStatus(parsed);
      if (result.installed) {
        stdout.write(`installed ${SKILL_NAME} skill: ${result.target_dir}\n`);
        return 0;
      }
      stdout.write(`not installed ${SKILL_NAME} skill: ${result.target_dir}\n`);
      return 1;
    }

    if (parsed.command === 'uninstall') {
      const result = uninstallSkill(parsed);
      stdout.write(`${result.removed ? 'removed' : 'not installed'} ${SKILL_NAME} skill: ${result.target_dir}\n`);
      return 0;
    }

    stderr.write(`unknown skill command: ${parsed.command}\n${helpText()}`);
    return 2;
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return error.exitCode || 2;
  }
}

function installSkill(options) {
  const sourceDir = bundledSkillDir();
  const targetDir = targetSkillDir(options.skillsDir);

  if (!fs.existsSync(path.join(sourceDir, 'SKILL.md'))) {
    const error = new Error(`bundled skill not found: ${sourceDir}`);
    error.exitCode = 4;
    throw error;
  }

  if (fs.existsSync(targetDir)) {
    if (!options.force) {
      const error = new Error(`skill already exists: ${targetDir}; use --force to replace it`);
      error.exitCode = 4;
      throw error;
    }
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  return { target_dir: targetDir };
}

function skillStatus(options) {
  const targetDir = targetSkillDir(options.skillsDir);
  return {
    installed: fs.existsSync(path.join(targetDir, 'SKILL.md')),
    target_dir: targetDir
  };
}

function uninstallSkill(options) {
  const targetDir = targetSkillDir(options.skillsDir);
  const removed = fs.existsSync(targetDir);
  fs.rmSync(targetDir, { recursive: true, force: true });
  return { removed, target_dir: targetDir };
}

function parseArgs(args, context) {
  const command = args[0] || 'help';
  const parsed = {
    command,
    force: false,
    skillsDir: defaultSkillsDir(context.env)
  };

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--force') {
      parsed.force = true;
      continue;
    }
    if (arg === '--skills-dir') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--skills-dir requires a directory');
      }
      parsed.skillsDir = resolveDir(value, context.cwd);
      index += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      parsed.command = 'help';
      continue;
    }
    throw new Error(`unknown option: ${arg}`);
  }

  parsed.skillsDir = resolveDir(parsed.skillsDir, context.cwd);
  return parsed;
}

function defaultSkillsDir(env) {
  if (env.CLAUDE_SKILLS_DIR) {
    return env.CLAUDE_SKILLS_DIR;
  }
  const home = env.HOME || env.USERPROFILE;
  if (!home) {
    const error = new Error('HOME or USERPROFILE is required; pass --skills-dir explicitly');
    error.exitCode = 4;
    throw error;
  }
  return path.join(home, '.claude', 'skills');
}

function resolveDir(value, cwd) {
  return path.resolve(cwd, value);
}

function targetSkillDir(skillsDir) {
  return path.join(skillsDir, SKILL_NAME);
}

function bundledSkillDir() {
  return path.join(__dirname, '..', 'skills', SKILL_NAME);
}

function helpText() {
  return [
    'ad-build skill',
    'Usage: ad-build skill <command>',
    '',
    'Commands:',
    '  status [--skills-dir DIR]             Check installed skill status',
    '',
    'Installation is managed by npm postinstall. Hidden maintenance commands remain for package scripts.',
    '',
    'Environment:',
    '  CLAUDE_SKILLS_DIR overrides the default target directory',
    ''
  ].join('\n');
}

module.exports = {
  runSkillCli,
  installSkill,
  skillStatus,
  uninstallSkill,
  defaultSkillsDir
};
