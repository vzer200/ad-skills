#!/usr/bin/env node

const commands = require('../lib/commands');
const baseImage = require('../lib/base-image');
const bundle = require('../lib/bundle');

async function main(argv = process.argv.slice(2)) {
  const command = argv[0] || 'help';

  if (command === 'image') {
    return baseImage.runCli(argv.slice(1));
  }

  if (command === 'bundle') {
    return bundle.runBundleCli(argv.slice(1), {
      cwd: process.cwd(),
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  if (command === 'inventory') {
    return bundle.runInventoryCli(argv.slice(1), {
      cwd: process.cwd(),
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr
    });
  }

  if (command === 'diff' && argv.includes('--source-only')) {
    const result = bundle.runSourceOnlyDiff({
      cwd: process.cwd(),
      env: process.env,
      baseRef: parseBaseRef(argv.slice(1)) || 'HEAD'
    });
    process.stdout.write(`wrote .ad-build/diff-source-only.json and .ad-build/diff-source-only.txt (${result.files.length} source files)\n`);
    return 0;
  }

  if (command === 'map' && argv.includes('--source-only')) {
    const result = bundle.runSourceOnlyMap({
      cwd: process.cwd(),
      env: process.env,
      baseRef: parseBaseRef(argv.slice(1)) || 'HEAD'
    });
    process.stdout.write(`wrote .ad-build/module-map-result.json and .ad-build/module-map-result.md (${result.valid_verify_modules.length} modules)\n`);
    return 0;
  }

  return commands.runCli(argv);
}

function parseBaseRef(args) {
  const index = args.indexOf('--base');
  if (index === -1) {
    return null;
  }
  if (!args[index + 1]) {
    throw new Error('--base requires a ref');
  }
  return args[index + 1];
}

main().then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error) => {
  process.stderr.write(`ad-build failed: ${error.message}\n`);
  process.exitCode = 2;
});
