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
  'doctor',
  'precheck',
  'full-build',
  'baseline-save',
  'diff',
  'map',
  'modules',
  'verify',
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

  process.stderr.write(`unknown command: ${command}\n\n${helpText()}`);
  return 2;
}

function helpText() {
  return [
    'ad-build',
    'Usage: ad-build <command>',
    '',
    'Commands:',
    '  login                         Configure SSH access for artifact overlay',
    '  logout                        Remove overlay SSH auth state',
    '  overlay pack --branch <rel>    Build an artifact overlay from a compiled AD workspace',
    '  overlay publish --branch <rel> Publish the latest overlay through the SSH artifact repo',
    '  overlay use --branch <rel>     Restore an artifact overlay into this AD workspace',
    '  overlay status                 Show overlay auth/current/use state',
    '  overlay doctor                 Diagnose overlay restore readiness',
    '  overlay repair paths           Relocate old root paths and symlink targets',
    '  overlay repair dpdk            Reconfigure the appd DPDK build cache',
    '  overlay build appd             Build appd with PREFIX_SOURCE injected',
    '  skill status                   Check ad-build skill installation status',
    '  help                           Show this help',
    ''
  ].join('\n');
}

function legacyMigrationText(command, args) {
  const suffix = args.length > 0 ? ` ${args.join(' ')}` : '';
  const replacements = {
    image: [
      'The image command is no longer a public ad-build workflow.',
      'Use artifact overlay instead: ad-build overlay use --branch <release>, then ad-build overlay build appd.'
    ],
    bundle: [
      'The bundle command is no longer a public ad-build workflow.',
      'Use artifact overlay instead: ad-build overlay pack/publish on the producer side, or ad-build overlay use on the consumer side.'
    ],
    'public-base': [
      'The public-base command is no longer a public ad-build workflow.',
      'Use ad-build overlay pack, ad-build overlay publish, or ad-build overlay use instead.'
    ],
    inventory: [
      'The inventory command belonged to the old compiled-state bundle flow.',
      'Use ad-build overlay status or ad-build overlay doctor instead.'
    ],
    completion: [
      'The completion command is no longer a public setup step.',
      'Completion is managed by installation/skill tooling; use ad-build help for the supported command surface.'
    ],
    doctor: [
      'The top-level doctor command is no longer a public ad-build workflow.',
      'Use ad-build overlay doctor instead.'
    ],
    precheck: [
      'The precheck command belonged to the old baseline flow.',
      'Use ad-build overlay status or ad-build overlay doctor instead.'
    ],
    'full-build': [
      'The full-build command belonged to the old baseline flow.',
      'Use ad-build overlay pack on a trusted fully compiled AD workspace.'
    ],
    'baseline-save': [
      'The baseline-save command belonged to the old baseline flow.',
      'Use ad-build overlay publish after ad-build overlay pack.'
    ],
    diff: [
      'The diff command is no longer a public ad-build workflow.',
      'Use ad-build overlay build appd for the current module validation path and ad-build overlay doctor for restore diagnostics.'
    ],
    map: [
      'The map command is no longer a public ad-build workflow.',
      'Use ad-build overlay build appd for the current appd MVP.'
    ],
    modules: [
      'The modules command is no longer a public ad-build workflow.',
      'The current overlay MVP exposes: ad-build overlay build appd.'
    ],
    verify: [
      'The verify command has moved to the overlay build flow.',
      'Use ad-build overlay build appd instead.'
    ],
    report: [
      'The report command belonged to the old verify/report flow.',
      'Use the output from ad-build overlay build appd instead.'
    ]
  };
  const lines = replacements[command] || ['This command has moved to artifact overlay.'];
  return [
    `ad-build ${command}${suffix} has migrated to the artifact overlay CLI.`,
    ...lines,
    '',
    'Supported public flow:',
    '  ad-build login',
    '  ad-build overlay use --branch <release>',
    '  ad-build overlay build appd',
    '',
    'Producer flow:',
    '  ad-build overlay pack --branch <release>',
    '  ad-build overlay publish --branch <release>',
    ''
  ].join('\n');
}

main().then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error) => {
  process.stderr.write(`ad-build failed: ${error.message}\n`);
  process.exitCode = 2;
});
