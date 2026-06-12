#!/usr/bin/env node

const commands = require('../lib/commands');
const baseImage = require('../lib/base-image');

const argv = process.argv.slice(2);
const runner = argv[0] === 'image'
  ? baseImage.runCli(argv.slice(1))
  : commands.runCli(argv);

runner.then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error) => {
  process.stderr.write(`ad-build failed: ${error.message}\n`);
  process.exitCode = 2;
});
