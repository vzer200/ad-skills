const fs = require('node:fs');
const path = require('node:path');
const core = require('./core');

function runBundleCli(args = [], options = {}) {
  const stdout = options.stdout || process.stdout;
  stdout.write('bundle MVP placeholder\n');
  return 0;
}

function runInventoryCli(args = [], options = {}) {
  const stdout = options.stdout || process.stdout;
  stdout.write('inventory MVP placeholder\n');
  return 0;
}

function runSourceOnlyDiff() {
  return { schema_version: 1, files: [], suppressed_files_count: 0 };
}

function runSourceOnlyMap() {
  return { schema_version: 1, valid_verify_modules: [] };
}

module.exports = { runBundleCli, runInventoryCli, runSourceOnlyDiff, runSourceOnlyMap };
