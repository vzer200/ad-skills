#!/usr/bin/env node

const commands = require('../lib/commands');
const baseImage = require('../lib/base-image');
const bundle = require('../lib/bundle');

const argv = process.argv.slice(2);
const command = argv[0];
let runner;

if (command === 'image') {
  runner = baseImage.runCli(argv.slice(1));
} else if (command === 'bundle') {
  runner = Promise.resolve(bundle.runBundleCli(argv.slice(1)));
} else if (command === 'inventory') {
  runner = Promise.resolve(bundle.runInventoryCli(argv.slice(1)));
} else if (command === 'diff' && argv.includes('--source-only')) {
  runner = Promise.resolve(runSourceOnlyDiff(argv.slice(1)));
} else if (command === 'map' && argv.includes('--source-only')) {
  runner = Promise.resolve(runSourceOnlyMap(argv.slice(1)));
} else {
  runner = commands.runCli(argv);
}

runner.then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error) => {
  process.stderr.write(`ad-build failed: ${error.message}\n`);
  process.exitCode = 2;
});

function runSourceOnlyDiff(args) {
  const result = bundle.runSourceOnlyDiff({ baseRef: parseOption(args, '--base') || 'HEAD' });
  process.stdout.write(`wrote .ad-build/diff-summary.json with ${result.files.length} source files; suppressed ${result.suppressed_files_count} restored files\n`);
  return 0;
}

function runSourceOnlyMap(args) {
  const result = bundle.runSourceOnlyMap({ baseRef: parseOption(args, '--base') || 'HEAD' });
  process.stdout.write(`wrote .ad-build/module-map-result.json with ${result.valid_verify_modules.length} source-only modules\n`);
  return 0;
}

function parseOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  if (!args[index + 1]) throw new Error(`${name} requires a value`);
  return args[index + 1];
}
