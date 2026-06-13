const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const core = require('./core');
const { sha256File } = require('./file-utils');
const moduleMap = require('./module-map');
const { parseSimpleYaml } = require('./base-image');

const OUTPUT_DIR = '.ad-build';
const DEFAULT_CONFIG_PATH = 'tools/public-base.yaml';
const CURRENT_PUBLIC_BASE_PATH = path.join(OUTPUT_DIR, 'public-base', 'current.json');
const RESTORE_INVENTORY_PATH = path.join(OUTPUT_DIR, 'inventory', 'current.json');
const GIT_MAX_BUFFER = 256 * 1024 * 1024;

const PUBLIC_BASE_DIRS = [
  'obj/lib64',
  'include',
  'obj/bin'
];

const PUBLIC_BASE_FILES = [
  'KERNEL_VER',
  'OS_PLATFORM.file'
];

const PUBLIC_INPUT_PATTERNS = [
  'compile.sh',
  'Makefile',
  'app.mk',
  '**/*.mk',
  'libs/**',
  'include/**',
  'proto/**',
  'sinfor/**'
];

const PUBLIC_EXCLUDE_PATTERNS = [
  '.git/**',
  '.ad-build/**',
  'node_modules/**',
  'apps/**',
  'mkpacket/**',
  'ssipacket/**',
  'ad_packet/**',
  'gcov_result/**',
  'gtest_result/**',
  '.pytest_cache/**',
  '**/*.ssu',
  '**/*.ssi',
  '**/*.tar',
  '**/*.tar.gz',
  '**/*.tar.zst',
  '**/*.img',
  '**/*.iso',
  '**/*.log'
];

const PUBLIC_TOOLCHAIN_ENV_KEYS = [
  'CC',
  'CXX',
  'AR',
  'LD',
  'CFLAGS',
  'CXXFLAGS',
  'LDFLAGS',
  'AD_BUILD_TOOLCHAIN',
  'AD_BUILD_TARGET',
  'AD_BUILD_PLATFORM',
  'AD_BUILD_PUBLIC_BASE_TOOLCHAIN'
];

function buildKey(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const config = readPublicBaseConfig(repoRoot, options.config || options.configPath);
  const git = gitInfo(repoRoot);
  const files = collectPublicInputFiles(repoRoot, config);
  const environment = collectEnvironment(options.env || process.env, config.toolchain_env);
  const keyPayload = {
    schema_version: 1,
    public_inputs: config.public_inputs,
    exclude_patterns: config.exclude_patterns,
    toolchain_env: environment,
    files: files.map((file) => ({
      path: file.path,
      sha256: file.sha256,
      size: file.size,
      mode: file.mode
    }))
  };
  const publicBaseKey = core.digestJson(keyPayload);
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    repo_root: repoRoot,
    branch: git.branch,
    commit: git.commit,
    public_base_key: publicBaseKey,
    public_base_key_short: core.safeDigestKey(publicBaseKey).slice(0, 12),
    input_files_count: files.length,
    missing_inputs: findMissingExactInputs(repoRoot, config.public_inputs),
    warnings: [],
    toolchain_env: environment,
    config_path: config.path ? norm(path.relative(repoRoot, config.path)) : null,
    files
  };

  if (options.write !== false) {
    const outDir = path.join(repoRoot, OUTPUT_DIR, 'public-base');
    core.writeJson(path.join(outDir, 'key.json'), result);
    writeText(path.join(outDir, 'key.md'), renderKeyMarkdown(result));
  }

  return result;
}

function packPublicBase(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const config = readPublicBaseConfig(repoRoot, options.config || options.configPath);
  const key = buildKey({ repoRoot, config: options.config || options.configPath, write: false });
  const git = gitInfo(repoRoot);
  const runId = makeRunId();
  const outPath = path.resolve(repoRoot, options.out || path.join(OUTPUT_DIR, 'public-base', `${key.public_base_key_short}-${runId}.tar`));
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-pack-'));
  const filesRoot = path.join(staging, 'files');
  fs.mkdirSync(filesRoot, { recursive: true });

  const files = collectRestoreFiles(repoRoot, config);
  const warnings = [];
  for (const dir of config.restore_dirs) {
    const full = path.join(repoRoot, dir);
    if (!fs.existsSync(full)) {
      warnings.push({ type: 'missing_restore_dir', path: dir });
    } else if (!fs.lstatSync(full).isDirectory()) {
      warnings.push({ type: 'invalid_restore_dir', path: dir });
    }
  }
  for (const file of config.restore_files) {
    const full = path.join(repoRoot, file);
    if (!fs.existsSync(full)) {
      warnings.push({ type: 'missing_restore_file', path: file });
    } else if (!fs.lstatSync(full).isFile()) {
      warnings.push({ type: 'invalid_restore_file', path: file });
    }
  }
  if (warnings.length > 0 && !options.allowPartial) {
    const error = new Error(`public-base restore paths are missing; rebuild first or pass --allow-partial: ${warnings.map((item) => item.path).join(', ')}`);
    error.exitCode = 5;
    throw error;
  }
  const fullBuild = readFullBuildProvenance(repoRoot);
  if (fullBuild.status !== 'passed') {
    warnings.push({ type: 'full_build_not_passed', status: fullBuild.status, path: fullBuild.path });
  }

  for (const entry of files) {
    const source = path.join(repoRoot, entry.path);
    const target = path.join(filesRoot, entry.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }

  const manifest = {
    schema_version: 1,
    producer: 'ad-build',
    kind: 'public-base-bundle',
    created_at: core.nowIso(),
    run_id: runId,
    commit: git.commit,
    branch: git.branch,
    ref: git.ref,
    repo_root_hint: repoRoot,
    public_base_key: key.public_base_key,
    public_base_key_short: key.public_base_key_short,
    input_files_count: key.input_files_count,
    restore_dirs: config.restore_dirs,
    restore_files: config.restore_files,
    public_inputs: config.public_inputs,
    exclude_patterns: config.exclude_patterns,
    toolchain_env: key.toolchain_env,
    full_build: fullBuild,
    files_count: files.length,
    total_size: files.reduce((sum, file) => sum + file.size, 0),
    files,
    warnings,
    runtime: {
      hostname: safeHostname(),
      platform: process.platform,
      arch: process.arch,
      node_version: process.version
    }
  };
  const inventory = buildInventory(manifest, { source: 'public-base-pack' });
  core.writeJson(path.join(staging, 'manifest.json'), manifest);
  core.writeJson(path.join(staging, 'inventory.json'), inventory);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  runTar(['-cf', outPath, '-C', staging, 'manifest.json', 'inventory.json', 'files']);

  const bundleSha256 = sha256File(outPath);
  const latest = path.join(repoRoot, OUTPUT_DIR, 'public-base', 'latest');
  const summary = buildPackSummary({ bundlePath: outPath, bundleSha256, manifest, files });
  core.writeJson(path.join(latest, 'manifest.json'), manifest);
  core.writeJson(path.join(latest, 'inventory.json'), inventory);
  core.writeJson(path.join(latest, 'pack-summary.json'), summary);
  core.writeJson(path.join(latest, 'latest.json'), buildLatestJson({ manifest, bundlePath: outPath, bundleSha256 }));
  core.writeJson(outPath.replace(/\.tar$/, '') + '.manifest.json', manifest);
  core.writeJson(outPath.replace(/\.tar$/, '') + '.inventory.json', inventory);
  writeText(outPath + '.sha256', `${bundleSha256}  ${path.basename(outPath)}\n`);

  return {
    schema_version: 1,
    bundle_path: norm(outPath),
    bundle_sha256: bundleSha256,
    manifest_path: norm(path.join(latest, 'manifest.json')),
    inventory_path: norm(path.join(latest, 'inventory.json')),
    pack_summary_path: norm(path.join(latest, 'pack-summary.json')),
    public_base_key: manifest.public_base_key,
    public_base_key_short: manifest.public_base_key_short,
    files_count: files.length,
    total_size: manifest.total_size,
    warnings
  };
}

function restorePublicBase(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const bundle = requiredBundle(options, repoRoot);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-restore-'));
  validateArchiveBeforeExtract(bundle);
  runTar(['-xf', bundle, '-C', staging]);
  const manifest = readPublicBaseManifest(path.join(staging, 'manifest.json'));
  const inventory = core.readJson(path.join(staging, 'inventory.json'));
  validateBundleFiles({ manifest, staging });
  validateInventoryForManifest(inventory, manifest);
  const conflicts = findRestoreConflicts({ repoRoot, manifest });
  if (conflicts.length > 0 && !options.force) {
    writeRestoreConflicts(repoRoot, bundle, manifest, conflicts);
    const error = new Error(`restore would overwrite ${conflicts.length} changed public-base files; inspect .ad-build/public-base/restore-conflicts.json or rerun with --force`);
    error.exitCode = 5;
    throw error;
  }

  let restoredCount = 0;
  let overwrittenCount = 0;
  for (const entry of manifest.files || []) {
    safePath(entry.path);
    const source = path.join(staging, 'files', entry.path);
    const target = path.join(repoRoot, entry.path);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) {
      continue;
    }
    ensureDestinationSafe(repoRoot, entry.path);
    if (fs.existsSync(target)) {
      overwrittenCount += 1;
    }
    copyFileAtomic(source, target, entry.mode);
    restoredCount += 1;
  }

  const restoredAt = core.nowIso();
  const restoreRunId = makeRunId(restoredAt);
  const current = {
    ...buildInventory(manifest, {
      source: 'public-base-restore',
      restored_at: restoredAt,
      bundle_path: norm(bundle),
      bundle_sha256: sha256File(bundle)
    }),
    restore_run_id: restoreRunId
  };
  const currentPath = path.join(repoRoot, CURRENT_PUBLIC_BASE_PATH);
  const inventoryPath = path.join(repoRoot, RESTORE_INVENTORY_PATH);
  core.writeJson(currentPath, current);
  core.writeJson(inventoryPath, current);

  const restoreDir = path.join(repoRoot, OUTPUT_DIR, 'public-base', 'restore', restoreRunId);
  const summary = {
    schema_version: 1,
    generated_at: core.nowIso(),
    run_id: restoreRunId,
    bundle_path: norm(bundle),
    bundle_sha256: current.bundle_sha256,
    current_path: norm(currentPath),
    inventory_path: norm(inventoryPath),
    public_base_key: manifest.public_base_key,
    public_base_key_short: manifest.public_base_key_short,
    restored_count: restoredCount,
    overwritten_count: overwrittenCount,
    files_count: manifest.files_count,
    inventory_mode: inventory.mode || null
  };
  core.writeJson(path.join(restoreDir, 'restore-summary.json'), summary);
  writeText(path.join(restoreDir, 'restore.log'), [
    `bundle=${norm(bundle)}`,
    `bundle_sha256=${current.bundle_sha256}`,
    `public_base_key=${manifest.public_base_key}`,
    `current=${norm(currentPath)}`,
    `inventory=${norm(inventoryPath)}`,
    `restored=${restoredCount}`,
    `overwritten=${overwrittenCount}`,
    ''
  ].join('\n'));
  return summary;
}

function runStatus(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const currentPath = path.join(repoRoot, CURRENT_PUBLIC_BASE_PATH);
  const current = fs.existsSync(currentPath) ? core.readJson(currentPath) : null;
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    status: current ? 'restored' : 'missing',
    current_path: current ? norm(CURRENT_PUBLIC_BASE_PATH) : null,
    bundle_path: current?.bundle_path || null,
    bundle_sha256: current?.bundle_sha256 || null,
    bundle_key: current?.public_base_key || null,
    current_key: null,
    files_total: current?.files?.length || 0,
    unchanged: 0,
    changed: 0,
    missing: 0,
    changed_files: [],
    missing_files: []
  };

  for (const entry of current?.files || []) {
    const actual = fileSha(repoRoot, entry.path);
    if (!actual) {
      result.missing += 1;
      result.missing_files.push(entry.path);
    } else if (actual === entry.sha256) {
      result.unchanged += 1;
    } else {
      result.changed += 1;
      result.changed_files.push(entry.path);
    }
  }
  if (current) {
    result.status = result.missing > 0 ? 'partial' : result.changed > 0 ? 'changed' : 'restored';
  }

  const outDir = path.join(repoRoot, OUTPUT_DIR, 'public-base');
  core.writeJson(path.join(outDir, 'status.json'), result);
  writeText(path.join(outDir, 'status.md'), renderStatusMarkdown(result));
  return result;
}

function runCheck(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const bundle = requiredBundle(options, repoRoot);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-check-'));
  validateArchiveBeforeExtract(bundle);
  runTar(['-xf', bundle, '-C', staging]);
  const manifest = readPublicBaseManifest(path.join(staging, 'manifest.json'));
  validateBundleFiles({ manifest, staging });
  const inventory = core.readJson(path.join(staging, 'inventory.json'));
  validateInventoryForManifest(inventory, manifest);
  const key = buildKey({ repoRoot, config: options.config || options.configPath, write: false });
  const sidecar = readSidecarStatus(bundle);
  const matched = key.public_base_key === manifest.public_base_key;
  const integrityMatched = sidecar.status !== 'mismatch';
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    status: !integrityMatched ? 'invalid' : matched ? 'matched' : 'mismatch',
    bundle_path: norm(bundle),
    bundle_sha256: sha256File(bundle),
    sidecar_status: sidecar.status,
    bundle_key: manifest.public_base_key,
    bundle_key_short: manifest.public_base_key_short,
    current_key: key.public_base_key,
    current_key_short: key.public_base_key_short,
    input_files_count: key.input_files_count,
    bundle_input_files_count: manifest.input_files_count,
    warnings: [
      ...(matched ? [] : [{ message: 'public inputs changed; rebuild public-base before trusting local app verification' }]),
      ...sidecar.warnings
    ]
  };
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'public-base');
  core.writeJson(path.join(outDir, 'check.json'), result);
  writeText(path.join(outDir, 'check.md'), renderCheckMarkdown(result));
  return result;
}

function runPublicBaseCli(args = [], options = {}) {
  const command = args[0] || 'help';
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  try {
    if (command === 'help' || command === '-h' || command === '--help') {
      stdout.write(publicBaseHelp());
      return 0;
    }
    if (command === 'key') {
      const parsed = parseArgs(args.slice(1));
      const result = buildKey({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      stdout.write(`public-base key ${result.public_base_key_short}; wrote .ad-build/public-base/key.json\n`);
      return 0;
    }
    if (command === 'pack') {
      const parsed = parseArgs(args.slice(1));
      const result = packPublicBase({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      stdout.write(`wrote public-base bundle ${result.bundle_path} (${result.files_count} files)\n`);
      return 0;
    }
    if (command === 'restore') {
      const parsed = parseArgs(args.slice(1));
      const result = restorePublicBase({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      stdout.write(`restored public-base ${result.restored_count} files from ${result.bundle_path}\n`);
      return 0;
    }
    if (command === 'status') {
      const parsed = parseArgs(args.slice(1));
      const result = runStatus({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      stdout.write(`public-base status ${result.status}; wrote .ad-build/public-base/status.json\n`);
      return result.status === 'restored' ? 0 : 3;
    }
    if (command === 'check') {
      const parsed = parseArgs(args.slice(1));
      const result = runCheck({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      stdout.write(`public-base check ${result.status}; wrote .ad-build/public-base/check.json\n`);
      return result.status === 'matched' ? 0 : 1;
    }
    stderr.write(`unknown public-base command: ${command}\n${publicBaseHelp()}`);
    return 2;
  } catch (error) {
    stderr.write(`ad-build public-base ${command} failed: ${error.message}\n`);
    return error.exitCode || 2;
  }
}

function readPublicBaseConfig(repoRoot, configPath) {
  const requested = configPath || DEFAULT_CONFIG_PATH;
  const full = path.resolve(repoRoot, requested);
  const source = fs.existsSync(full) ? parseSimpleYaml(fs.readFileSync(full, 'utf8')) : {};
  return {
    path: fs.existsSync(full) ? full : null,
    restore_dirs: normalizeStringArray(source.restore_dirs, PUBLIC_BASE_DIRS, 'restore_dirs').map(norm),
    restore_files: normalizeStringArray(source.restore_files, PUBLIC_BASE_FILES, 'restore_files').map(norm),
    public_inputs: normalizeStringArray(source.public_inputs, PUBLIC_INPUT_PATTERNS, 'public_inputs').map(norm),
    exclude_patterns: normalizeStringArray(source.exclude_patterns || source.public_excludes, PUBLIC_EXCLUDE_PATTERNS, 'exclude_patterns').map(norm),
    toolchain_env: normalizeStringArray(source.toolchain_env, PUBLIC_TOOLCHAIN_ENV_KEYS, 'toolchain_env')
  };
}

function collectPublicInputFiles(repoRoot, config) {
  const paths = new Set();
  for (const pattern of config.public_inputs) {
    collectPatternMatches(repoRoot, pattern, config.exclude_patterns, paths);
  }
  return [...paths]
    .filter((file) => !isExcluded(file, config.exclude_patterns))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => fileEntry(repoRoot, file, 'public-input'))
    .filter(Boolean);
}

function collectPatternMatches(repoRoot, pattern, excludes, paths) {
  const normalized = norm(pattern);
  if (!hasGlob(normalized)) {
    addIfFile(repoRoot, normalized, excludes, paths);
    return;
  }
  if (normalized.endsWith('/**') && !hasGlob(normalized.slice(0, -3))) {
    walk(path.join(repoRoot, normalized.slice(0, -3)), repoRoot, excludes, (file) => paths.add(file));
    return;
  }
  if (normalized === '**/*.mk') {
    walk(repoRoot, repoRoot, excludes, (file) => {
      if (moduleMap.pathMatches(file, normalized)) {
        paths.add(file);
      }
    });
    return;
  }
  walk(repoRoot, repoRoot, excludes, (file) => {
    if (moduleMap.pathMatches(file, normalized)) {
      paths.add(file);
    }
  });
}

function collectRestoreFiles(repoRoot, config) {
  const paths = new Set();
  for (const file of config.restore_files) {
    addIfFile(repoRoot, file, config.exclude_patterns, paths);
  }
  for (const dir of config.restore_dirs) {
    safePath(dir);
    walk(path.join(repoRoot, dir), repoRoot, config.exclude_patterns, (file) => paths.add(file));
  }
  return [...paths]
    .filter((file) => !isExcluded(file, config.exclude_patterns))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => fileEntry(repoRoot, file, 'public-base-restore-path'))
    .filter(Boolean);
}

function addIfFile(repoRoot, file, excludes, paths) {
  const relative = norm(file);
  safePath(relative);
  if (isExcluded(relative, excludes)) {
    return;
  }
  const full = path.join(repoRoot, relative);
  if (fs.existsSync(full) && fs.lstatSync(full).isFile()) {
    paths.add(relative);
  }
}

function fileEntry(repoRoot, file, source) {
  safePath(file);
  const full = path.join(repoRoot, file);
  if (!fs.existsSync(full) || !fs.lstatSync(full).isFile()) {
    return null;
  }
  const stat = fs.lstatSync(full);
  return {
    path: norm(file),
    source,
    sha256: sha256File(full),
    size: stat.size,
    mode: (stat.mode & 0o777).toString(8).padStart(4, '0')
  };
}

function walk(root, repoRoot, excludes, visit) {
  if (!fs.existsSync(root) || !fs.lstatSync(root).isDirectory()) {
    return;
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    const rel = norm(path.relative(repoRoot, full));
    if (!rel || isExcluded(rel, excludes)) {
      continue;
    }
    if (entry.isDirectory()) {
      walk(full, repoRoot, excludes, visit);
    } else if (entry.isFile()) {
      visit(rel);
    }
  }
}

function isExcluded(file, patterns) {
  const rel = norm(file);
  return patterns.some((pattern) => {
    try {
      return moduleMap.pathMatches(rel, pattern);
    } catch {
      return false;
    }
  });
}

function findMissingExactInputs(repoRoot, patterns) {
  return patterns
    .filter((pattern) => !hasGlob(pattern))
    .filter((file) => !fs.existsSync(path.join(repoRoot, file)));
}

function collectEnvironment(env, keys) {
  const result = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(env, key)) {
      result[key] = String(env[key]);
    }
  }
  return result;
}

function readFullBuildProvenance(repoRoot) {
  const latest = path.join(repoRoot, OUTPUT_DIR, 'full-build', 'latest', 'full-build-result.json');
  if (!fs.existsSync(latest)) {
    return {
      found: false,
      status: 'missing',
      path: norm(path.relative(repoRoot, latest))
    };
  }
  try {
    const result = core.readJson(latest);
    return {
      found: true,
      status: result.status || null,
      run_id: result.run_id || null,
      started_at: result.started_at || null,
      ended_at: result.ended_at || null,
      path: norm(path.relative(repoRoot, latest))
    };
  } catch (error) {
    return {
      found: true,
      status: 'unreadable',
      error: error.message,
      path: norm(path.relative(repoRoot, latest))
    };
  }
}

function validateBundleFiles({ manifest, staging }) {
  validateManifestPathSet(manifest);
  for (const entry of manifest.files || []) {
    safePath(entry.path);
    if (!/^sha256:[a-f0-9]{64}$/.test(entry.sha256 || '')) {
      throw new Error(`missing or invalid sha256 in public-base bundle: ${entry.path}`);
    }
    const source = path.join(staging, 'files', entry.path);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) {
      throw new Error(`missing file in public-base bundle: ${entry.path}`);
    }
    const actual = sha256File(source);
    if (actual !== entry.sha256) {
      throw new Error(`sha256 mismatch in public-base bundle: ${entry.path}`);
    }
  }
}

function validateManifestPathSet(manifest) {
  const paths = [...new Set((manifest.files || []).map((file) => file.path))].sort((a, b) => a.localeCompare(b));
  if (paths.length !== (manifest.files || []).length) {
    throw new Error('public-base manifest contains duplicate file paths');
  }
  for (let index = 0; index < paths.length; index += 1) {
    const file = paths[index];
    safePath(file);
    const next = paths[index + 1];
    if (next && next.startsWith(file + '/')) {
      throw new Error(`public-base manifest contains file/child path conflict: ${file}`);
    }
  }
}

function validateInventoryForManifest(inventory, manifest) {
  if (!inventory || inventory.mode !== 'public-base-restore-inventory') {
    throw new Error('public-base inventory has invalid mode');
  }
  if (inventory.public_base_key !== manifest.public_base_key) {
    throw new Error('public-base inventory key does not match manifest');
  }
  if (!Array.isArray(inventory.files) || inventory.files.length !== manifest.files.length) {
    throw new Error('public-base inventory file count does not match manifest');
  }
  const manifestFiles = new Map((manifest.files || []).map((file) => [file.path, file.sha256]));
  const inventoryPaths = new Set();
  for (const file of inventory.files || []) {
    if (inventoryPaths.has(file.path)) {
      throw new Error(`public-base inventory duplicate file: ${file.path}`);
    }
    inventoryPaths.add(file.path);
    if (manifestFiles.get(file.path) !== file.sha256) {
      throw new Error(`public-base inventory file mismatch: ${file.path}`);
    }
  }
  for (const file of manifestFiles.keys()) {
    if (!inventoryPaths.has(file)) {
      throw new Error(`public-base inventory missing file: ${file}`);
    }
  }
}

function findRestoreConflicts({ repoRoot, manifest }) {
  const conflicts = [];
  for (const entry of manifest.files || []) {
    ensureDestinationSafe(repoRoot, entry.path);
    const actual = fileSha(repoRoot, entry.path);
    if (actual && actual !== entry.sha256) {
      conflicts.push({
        path: entry.path,
        current_sha256: actual,
        bundle_sha256: entry.sha256,
        reason: 'existing-file-differs'
      });
    }
  }
  return conflicts;
}

function writeRestoreConflicts(repoRoot, bundle, manifest, conflicts) {
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'public-base');
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    bundle_path: norm(bundle),
    public_base_key: manifest.public_base_key,
    conflicts_count: conflicts.length,
    conflicts
  };
  core.writeJson(path.join(outDir, 'restore-conflicts.json'), result);
  writeText(path.join(outDir, 'restore-conflicts.md'), [
    '# ad-build public-base restore conflicts',
    '',
    `Bundle: ${norm(bundle)}`,
    `Conflicts: ${conflicts.length}`,
    '',
    ...conflicts.slice(0, 200).map((item) => `- ${item.path}`),
    ''
  ].join('\n'));
}

function ensureDestinationSafe(repoRoot, relativePath) {
  safePath(relativePath);
  const target = path.resolve(repoRoot, relativePath);
  const rel = path.relative(repoRoot, target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`restore target escapes repository: ${relativePath}`);
  }
  const parts = norm(relativePath).split('/');
  let current = repoRoot;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current = path.join(current, parts[index]);
    if (!fs.existsSync(current)) {
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new Error(`restore target parent is a symlink: ${norm(path.relative(repoRoot, current))}`);
    }
    if (!stat.isDirectory()) {
      throw new Error(`restore target parent is not a directory: ${norm(path.relative(repoRoot, current))}`);
    }
  }
  if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) {
    throw new Error(`restore target is a symlink: ${relativePath}`);
  }
  if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
    throw new Error(`restore target is a directory: ${relativePath}`);
  }
}

function copyFileAtomic(source, target, mode) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = path.join(path.dirname(target), `.ad-build-restore-${process.pid}-${crypto.randomBytes(4).toString('hex')}.tmp`);
  try {
    fs.copyFileSync(source, temp);
    if (mode) {
      try { fs.chmodSync(temp, parseInt(mode, 8)); } catch { /* chmod is best effort on Windows */ }
    }
    fs.renameSync(temp, target);
  } finally {
    if (fs.existsSync(temp)) {
      fs.rmSync(temp, { force: true });
    }
  }
}

function readPublicBaseManifest(file) {
  const manifest = core.readJson(file);
  if (manifest.kind !== 'public-base-bundle') {
    throw new Error(`not a public-base bundle: ${manifest.kind || 'unknown'}`);
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(manifest.public_base_key || '')) {
    throw new Error('public-base manifest has invalid public_base_key');
  }
  if (!Array.isArray(manifest.files)) {
    throw new Error('public-base manifest files must be an array');
  }
  return manifest;
}

function validateArchiveBeforeExtract(bundle) {
  const result = spawnSync('tar', ['-tf', bundle], { encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER });
  if (result.error || result.status !== 0) {
    throw new Error(`tar list failed: ${result.error?.message || trim(result.stderr) || result.status}`);
  }
  const verbose = spawnSync('tar', ['-tvf', bundle], { encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER });
  if (verbose.error || verbose.status !== 0) {
    throw new Error(`tar verbose list failed: ${verbose.error?.message || trim(verbose.stderr) || verbose.status}`);
  }
  const entries = String(result.stdout || '').split(/\r?\n/).filter(Boolean);
  const verboseLines = String(verbose.stdout || '').split(/\r?\n/).filter(Boolean);
  if (verboseLines.length !== entries.length) {
    throw new Error('tar listing and verbose listing differ');
  }
  for (const line of verboseLines) {
    const type = line[0];
    if (type !== '-' && type !== 'd') {
      throw new Error(`unsupported archive entry type in public-base bundle: ${line}`);
    }
  }
  for (const entry of entries) {
    const normalized = norm(entry).replace(/\/$/, '');
    if (!normalized || normalized.startsWith('/') || path.win32.isAbsolute(entry) || normalized.split('/').includes('..')) {
      throw new Error(`unsafe archive entry in public-base bundle: ${entry}`);
    }
    if (normalized !== 'manifest.json' && normalized !== 'inventory.json' && normalized !== 'files' && !normalized.startsWith('files/')) {
      throw new Error(`unexpected archive entry in public-base bundle: ${entry}`);
    }
  }
}

function readSidecarStatus(bundle) {
  const sidecar = bundle + '.sha256';
  if (!fs.existsSync(sidecar)) {
    return {
      status: 'missing',
      warnings: [{ message: 'bundle sha256 sidecar is missing' }]
    };
  }
  const expected = String(fs.readFileSync(sidecar, 'utf8')).trim().split(/\s+/)[0];
  const actual = sha256File(bundle);
  if (expected === actual) {
    return { status: 'matched', warnings: [] };
  }
  return {
    status: 'mismatch',
    warnings: [{ message: 'bundle sha256 sidecar does not match bundle content' }]
  };
}

function buildInventory(manifest, extra = {}) {
  return {
    schema_version: 1,
    mode: 'public-base-restore-inventory',
    public_base_key: manifest.public_base_key,
    public_base_key_short: manifest.public_base_key_short,
    commit: manifest.commit,
    branch: manifest.branch,
    source: extra.source,
    restored_at: extra.restored_at || null,
    bundle_path: extra.bundle_path || null,
    bundle_sha256: extra.bundle_sha256 || null,
    files_count: manifest.files.length,
    files: manifest.files.map((file) => ({
      path: file.path,
      sha256: file.sha256,
      size: file.size,
      mode: file.mode,
      source: file.source
    }))
  };
}

function buildPackSummary({ bundlePath, bundleSha256, manifest, files }) {
  return {
    schema_version: 1,
    generated_at: core.nowIso(),
    bundle_path: norm(bundlePath),
    bundle_sha256: bundleSha256,
    public_base_key: manifest.public_base_key,
    public_base_key_short: manifest.public_base_key_short,
    commit: manifest.commit,
    branch: manifest.branch,
    run_id: manifest.run_id,
    files_count: files.length,
    total_size: manifest.total_size,
    warnings: manifest.warnings
  };
}

function buildLatestJson({ manifest, bundlePath, bundleSha256 }) {
  return {
    schema_version: 1,
    branch: manifest.branch,
    commit: manifest.commit,
    public_base_key: manifest.public_base_key,
    public_base_key_short: manifest.public_base_key_short,
    bundle: path.basename(bundlePath),
    bundle_sha256: bundleSha256,
    manifest: 'manifest.json',
    inventory: 'inventory.json',
    created_at: manifest.created_at
  };
}

function parseArgs(args) {
  return {
    out: option(args, '--out') || undefined,
    bundle: option(args, '--bundle') || undefined,
    repoRoot: option(args, '--workdir') || undefined,
    config: option(args, '--config') || undefined,
    force: args.includes('--force'),
    allowPartial: args.includes('--allow-partial')
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

function requiredBundle(options, repoRoot) {
  const bundle = options.bundle || options.env?.AD_BUILD_PUBLIC_BASE_BUNDLE;
  if (!bundle) {
    const error = new Error('--bundle is required');
    error.exitCode = 2;
    throw error;
  }
  const full = path.resolve(repoRoot, bundle);
  if (!fs.existsSync(full)) {
    const error = new Error(`bundle does not exist: ${full}`);
    error.exitCode = 3;
    throw error;
  }
  return full;
}

function resolveRepoRoot(options = {}) {
  if (options.repoRoot) {
    return path.resolve(options.repoRoot);
  }
  if (options.env?.AD_BUILD_WORK_DIR) {
    return path.resolve(options.env.AD_BUILD_WORK_DIR);
  }
  const cwd = options.cwd || process.cwd();
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER });
  return !result.error && result.status === 0 && trim(result.stdout) ? path.resolve(trim(result.stdout)) : path.resolve(cwd);
}

function gitInfo(repoRoot) {
  const commit = git(repoRoot, ['rev-parse', 'HEAD']);
  const branch = git(repoRoot, ['branch', '--show-current']);
  const ref = git(repoRoot, ['symbolic-ref', '-q', 'HEAD']);
  return {
    commit: commit.status === 0 ? trim(commit.stdout) : null,
    branch: branch.status === 0 ? trim(branch.stdout) || null : null,
    ref: ref.status === 0 ? trim(ref.stdout) || null : null
  };
}

function git(repoRoot, args) {
  return spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER });
}

function runTar(args) {
  const result = spawnSync('tar', args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(`tar failed: ${result.error?.message || trim(result.stderr) || result.status}`);
  }
}

function fileSha(repoRoot, file) {
  const full = path.join(repoRoot, file);
  return fs.existsSync(full) && fs.lstatSync(full).isFile() ? sha256File(full) : null;
}

function normalizeStringArray(value, fallback, label) {
  const selected = value === undefined || value === null || value === '' ? fallback : value;
  if (!Array.isArray(selected) || selected.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new Error(`${label} must be a string array`);
  }
  return [...selected];
}

function safePath(file) {
  const value = norm(file);
  if (!value || value.startsWith('/') || path.win32.isAbsolute(file) || value.split('/').includes('..')) {
    throw new Error(`unsafe public-base path: ${file}`);
  }
}

function hasGlob(value) {
  return /[*?\[]/.test(value);
}

function makeRunId(startedAt = core.nowIso()) {
  return `${String(startedAt).replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}-${crypto.randomBytes(4).toString('hex')}`;
}

function renderKeyMarkdown(result) {
  return [
    '# ad-build public-base key',
    '',
    `Key: ${result.public_base_key}`,
    `Short: ${result.public_base_key_short}`,
    `Inputs: ${result.input_files_count}`,
    `Commit: ${result.commit || 'unknown'}`,
    ''
  ].join('\n');
}

function renderStatusMarkdown(result) {
  return [
    '# ad-build public-base status',
    '',
    `Status: ${result.status}`,
    `Files: ${result.files_total}`,
    `Unchanged: ${result.unchanged}`,
    `Changed: ${result.changed}`,
    `Missing: ${result.missing}`,
    ''
  ].join('\n');
}

function renderCheckMarkdown(result) {
  return [
    '# ad-build public-base check',
    '',
    `Status: ${result.status}`,
    `Bundle key: ${result.bundle_key}`,
    `Current key: ${result.current_key}`,
    ''
  ].join('\n');
}

function publicBaseHelp() {
  return [
    'ad-build public-base',
    'Usage:',
    '  ad-build public-base key [--config <tools/public-base.yaml>]',
    '  ad-build public-base pack [--out <public-base.tar>] [--config <tools/public-base.yaml>] [--allow-partial]',
    '  ad-build public-base restore --bundle <public-base.tar> [--force]',
    '  ad-build public-base status',
    '  ad-build public-base check --bundle <public-base.tar> [--config <tools/public-base.yaml>]',
    ''
  ].join('\n');
}

function trim(value) {
  return String(value || '').trim();
}

function norm(value) {
  return String(value || '').replaceAll('\\', '/');
}

function safeHostname() {
  try { return os.hostname(); } catch { return null; }
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

module.exports = {
  PUBLIC_BASE_DIRS,
  PUBLIC_BASE_FILES,
  PUBLIC_INPUT_PATTERNS,
  PUBLIC_EXCLUDE_PATTERNS,
  CURRENT_PUBLIC_BASE_PATH,
  RESTORE_INVENTORY_PATH,
  buildKey,
  packPublicBase,
  restorePublicBase,
  runCheck,
  runKey: buildKey,
  runPublicBaseCli,
  runStatus
};
