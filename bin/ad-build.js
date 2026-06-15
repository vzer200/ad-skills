#!/usr/bin/env node

const overlay = require('../lib/overlay');
const login = require('../lib/login');
const skill = require('../lib/skill');

const LEGACY_COMMANDS = new Set([
  'image',
  'bundle',
  'public-base',
  'inventory',
  'completion',
  'precheck',
  'full-build',
  'baseline-save',
  'diff',
  'map',
  'modules',
  'report'
]);

async function main(argv = process.argv.slice(2)) {
  const command = argv[0] || 'help';

  if (command === 'help' || command === '-h' || command === '--help') {
    process.stdout.write(helpText());
    return 0;
  }

  if (command === 'overlay') {
    return overlay.runOverlayCli(argv.slice(1), {
      cwd: process.cwd(),
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  const overlayAliases = {
    pack: ['pack'],
    publish: ['publish'],
    restore: ['use'],
    status: ['status'],
    doctor: ['doctor'],
    repair: ['repair'],
    verify: ['build']
  };
  if (overlayAliases[command]) {
    return overlay.runOverlayCli([...overlayAliases[command], ...argv.slice(1)], {
      cwd: process.cwd(),
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr,
      publicCommand: command
    });
  }

  if (command === 'login') {
    return login.runLoginCli(argv.slice(1), {
      cwd: process.cwd(),
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  if (command === 'logout') {
    return login.runLogoutCli(argv.slice(1), {
      cwd: process.cwd(),
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  if (command === 'skill') {
    return skill.runSkillCli(argv.slice(1), {
      cwd: process.cwd(),
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  if (LEGACY_COMMANDS.has(command)) {
    process.stderr.write(legacyMigrationText(command, argv.slice(1)));
    return 2;
  }

  process.stderr.write(`未知命令: ${command}\n\n${helpText()}`);
  return 2;
}

function helpText() {
  return [
    'ad-build',
    'Usage: ad-build <command>',
    '',
    'Commands:',
    '  ad-build login                          配置或检查产物仓库 SSH 登录状态',
    '  ad-build logout                         清理 overlay SSH 登录状态',
    '  ad-build pack --branch <rel>             在全量编译工作区打包 overlay',
    '  ad-build publish --branch <rel>          发布当前 overlay 到同名 Git 分支',
    '  ad-build restore --branch <rel>          在干净 AD 工作区恢复 overlay',
    '  ad-build status                          查看 overlay 当前状态',
    '  ad-build doctor [--strict]               诊断恢复后的可用性',
    '  ad-build repair paths                    修正旧工作区路径和软链接',
    '  ad-build repair dpdk                     重建 appd DPDK 缓存',
    '  ad-build verify appd                     使用当前环境验证 appd 编译',
    '  ad-build skill status                    检查 ad-build skill 安装状态',
    '  ad-build help                            显示帮助',
    ''
  ].join('\n');
}

function legacyMigrationText(command, args) {
  const suffix = args.length > 0 ? ` ${args.join(' ')}` : '';
  const replacements = {
    image: [
      'image 属于旧镜像方案，当前主路径已经迁移到 overlay。',
      '请使用: ad-build restore --branch <release>，然后 ad-build verify appd。'
    ],
    bundle: [
      'bundle 属于旧 compiled-state 大包方案，当前主路径已经迁移到 overlay。',
      '生产端使用 ad-build pack/publish，消费端使用 ad-build restore。'
    ],
    'public-base': [
      'public-base 属于旧公共基础包方案。',
      '请改用 ad-build pack、ad-build publish、ad-build restore。'
    ],
    inventory: [
      'inventory 属于旧 compiled-state bundle 流程。',
      '请使用 ad-build status 或 ad-build doctor。'
    ],
    completion: [
      'completion 不再作为公开 setup 命令。',
      '补全脚本由安装/skill 机制自动处理。'
    ],
    precheck: [
      'precheck 属于旧 baseline 流程。',
      '请使用 ad-build status 或 ad-build doctor。'
    ],
    'full-build': [
      'full-build 属于旧 baseline 流程。',
      '请在可信全量编译工作区执行 ad-build pack。'
    ],
    'baseline-save': [
      'baseline-save 属于旧 baseline 流程。',
      '请在 ad-build pack 后执行 ad-build publish。'
    ],
    diff: [
      'diff 不再作为当前公开工作流。',
      '请使用 ad-build doctor 和 ad-build verify appd。'
    ],
    map: [
      'map 不再作为当前公开工作流。',
      '请使用 ad-build verify appd。'
    ],
    modules: [
      'modules 不再作为当前公开工作流。',
      '当前 MVP 使用: ad-build verify appd。'
    ],
    report: [
      'report 属于旧 verify/report 流程。',
      '请查看 ad-build verify appd 的输出。'
    ]
  };
  const lines = replacements[command] || ['This command has moved to artifact overlay.'];
  return [
    `ad-build ${command}${suffix} 已迁移到 overlay 工作流。`,
    ...lines,
    '',
    '当前支持的消费端流程:',
    '  ad-build login',
    '  ad-build restore --branch <release>',
    '  ad-build verify appd',
    '',
    '生产端流程:',
    '  ad-build pack --branch <release>',
    '  ad-build publish --branch <release>',
    ''
  ].join('\n');
}

main().then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error) => {
  process.stderr.write(`ad-build 执行失败: ${error.message}\n`);
  process.exitCode = 2;
});
