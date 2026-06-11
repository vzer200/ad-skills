#!/usr/bin/env node

const commands = require('../lib/commands');

commands.runCli().then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error) => {
  process.stderr.write(`ad-build failed: ${error.message}\n`);
  process.exitCode = 2;
});
