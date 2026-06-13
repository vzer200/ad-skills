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
const PUBLIC_BASE_CACHE_PATH = path.join(OUTPUT_DIR, 'cache', 'public-base-repo');
const FIXED_PUBLIC_BASE_REPO_URL = 'https://git.sangfor.com/69765/ad-build-public-base.git';
const GIT_MAX_BUFFER = 256 * 1024 * 1024;
const DEFAULT_PUBLIC_INPUT_MODE = 'git-head';

const PUBLIC_BASE_DIRS = [
  'obj/lib64',
  'include',
  'obj/bin',
  'libs/rdma-core-2404mlnx51/build/include'
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
  'include/**',
  'proto/**',
  'libs/**',
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
  '**/build/**',
  '**/dist/**',
  '**/tmp/**',
  '**/.deps/**',
  '**/.libs/**',
  '**/*.egg-info/**',
  '**/*.o',
  '**/*.lo',
  '**/*.so',
  '**/*.so.*',
  '**/*.ko',
  '**/*.a',
  '**/*.Po',
  '**/*.pyc',
  '**/*.pyo',
  '**/*.md5',
  '**/*.map',
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
    public_input_mode: config.public_input_mode,
    public_inputs: config.public_inputs,
    public_input_excludes: config.public_input_excludes,
    toolchain_env: environment,
    files: files.map((file) => ({
      path: file.path,
      source: file.source,
      git_blob: file.git_blob || null,
      git_mode: file.git_mode || null,
      git_type: file.git_type || null,
      sha256: file.sha256 || null,
      size: file.size ?? null,
      mode: file.mode || null
    }))
  };
  const publicBaseKey = core.digestJson(keyPayload);
  const result = {
    schema_version: 1,
    status: 'computed',
    generated_at: core.nowIso(),
    repo_root: repoRoot,
    branch: git.branch,
    commit: git.commit,
    public_base_key: publicBaseKey,
    public_base_key_short: core.safeDigestKey(publicBaseKey).slice(0, 12),
    public_input_mode: config.public_input_mode,
    input_files_count: files.length,
    missing_inputs: findMissingExactInputs(repoRoot, config.public_inputs),
    warnings: [],
    toolchain_env: environment,
    config_path: config.path ? norm(path.relative(repoRoot, config.path)) : null,
    top_level_counts: countTopLevel(files),
    extension_counts: countExtensions(files),
    output_path: norm(path.join(OUTPUT_DIR, 'public-base', 'key.json')),
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
  const dirtyPublicInputs = collectDirtyPublicInputsDetailed(repoRoot, config);
  if (dirtyPublicInputs.tracked_dirty.length > 0) {
    warnings.push({
      type: 'tracked_dirty_public_inputs_after_full_build',
      count: dirtyPublicInputs.tracked_dirty.length,
      sample: dirtyPublicInputs.tracked_dirty.slice(0, 200)
    });
  }
  if (dirtyPublicInputs.untracked_generated.length > 0) {
    warnings.push({
      type: 'generated_public_inputs_after_full_build',
      count: dirtyPublicInputs.untracked_generated.length,
      sample: dirtyPublicInputs.untracked_generated.slice(0, 200)
    });
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
    public_input_mode: key.public_input_mode,
    input_files_count: key.input_files_count,
    restore_dirs: config.restore_dirs,
    restore_files: config.restore_files,
    public_inputs: config.public_inputs,
    public_input_excludes: config.public_input_excludes,
    toolchain_env: key.toolchain_env,
    full_build: fullBuild,
    tracked_dirty_public_inputs_count: dirtyPublicInputs.tracked_dirty.length,
    tracked_dirty_public_inputs_after_full_build: dirtyPublicInputs.tracked_dirty.slice(0, 200),
    generated_public_inputs_count: dirtyPublicInputs.untracked_generated.length,
    generated_public_inputs_after_full_build: dirtyPublicInputs.untracked_generated.slice(0, 200),
    dirty_public_inputs_count: dirtyPublicInputs.tracked_dirty.length,
    dirty_public_inputs_after_full_build: dirtyPublicInputs.tracked_dirty.slice(0, 200),
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
    status: 'packed',
    bundle_path: norm(outPath),
    bundle_sha256: bundleSha256,
    manifest_path: norm(path.join(latest, 'manifest.json')),
    inventory_path: norm(path.join(latest, 'inventory.json')),
    pack_summary_path: norm(path.join(latest, 'pack-summary.json')),
    latest_path: norm(path.join(latest, 'latest.json')),
    public_base_key: manifest.public_base_key,
    public_base_key_short: manifest.public_base_key_short,
    files_count: files.length,
    total_size: manifest.total_size,
    tracked_dirty_public_inputs_count: manifest.tracked_dirty_public_inputs_count,
    generated_public_inputs_count: manifest.generated_public_inputs_count,
    dirty_public_inputs_count: manifest.dirty_public_inputs_count,
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
  const config = readPublicBaseConfig(repoRoot, options.config || options.configPath);
  const conflicts = findRestoreConflicts({ repoRoot, manifest, config, force: options.force });
  if (conflicts.length > 0 && !options.force) {
    writeRestoreConflicts(repoRoot, bundle, manifest, conflicts);
    const error = new Error(`restore would overwrite ${conflicts.length} changed public-base files; inspect .ad-build/public-base/restore-conflicts.json and resolve or back up local changes before retrying`);
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
    status: 'restored',
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

function publishPublicBase(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const artifactRepo = requiredPublishRepo(options);
  const branch = requiredPublishBranch(options);
  const selected = publishBundleSelection(options, repoRoot);
  const bundle = selected.bundle;
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-public-base-publish-'));
  validateArchiveBeforeExtract(bundle);
  runTar(['-xf', bundle, '-C', staging]);
  const manifest = readPublicBaseManifest(path.join(staging, 'manifest.json'));
  validateBundleFiles({ manifest, staging });
  const inventory = core.readJson(path.join(staging, 'inventory.json'));
  validateInventoryForManifest(inventory, manifest);
  const sidecar = readSidecarStatus(bundle);
  if (sidecar.status !== 'matched') {
    const error = new Error(sidecar.warnings[0]?.message || 'bundle sha256 sidecar is invalid');
    error.exitCode = 5;
    throw error;
  }
  validateLatestPackSummary(selected.summary, manifest, bundle);
  requireTrustedFullBuild(manifest, options);

  const keyShort = publicBaseKeyShort(manifest.public_base_key);
  const keyDirName = `sha256-${keyShort}`;
  const releaseDir = path.join(artifactRepo, branch);
  const publishDir = path.join(releaseDir, keyDirName);
  const latestPath = path.join(releaseDir, 'latest.json');
  const bundleSha = sha256File(bundle);
  assertInside(releaseDir, publishDir, 'publish directory');
  ensurePublishPathSafe(artifactRepo, norm(path.posix.join(branch, keyDirName)));
  fs.mkdirSync(publishDir, { recursive: true });
  if (fs.existsSync(latestPath)) {
    ensureExistingRegularFile(releaseDir, latestPath, 'publish latest file');
  }
  validateExistingPublishDir(publishDir, manifest.public_base_key, bundleSha);
  ensurePublishFileTargetsSafe(publishDir);

  const bundleName = 'public-base.tar';
  const bundleTarget = path.join(publishDir, bundleName);
  const manifestTarget = path.join(publishDir, 'manifest.json');
  const inventoryTarget = path.join(publishDir, 'inventory.json');
  const shaTarget = path.join(publishDir, `${bundleName}.sha256`);
  const summaryTarget = path.join(publishDir, 'publish-summary.json');
  const existingLatest = readMatchingLatest(latestPath, branch, releaseDir, manifest.public_base_key, bundleSha);
  if (existingLatest && fs.existsSync(summaryTarget)) {
    ensureExistingRegularFile(publishDir, summaryTarget, 'publish target file');
    const existingSummary = normalizePublishSummary(core.readJson(summaryTarget), { manifest, allowUnproven: options.allowUnproven });
    core.writeJson(summaryTarget, existingSummary);
    return existingSummary;
  }
  fs.copyFileSync(bundle, bundleTarget);
  fs.copyFileSync(path.join(staging, 'manifest.json'), manifestTarget);
  fs.copyFileSync(path.join(staging, 'inventory.json'), inventoryTarget);
  writeText(shaTarget, `${bundleSha}  ${bundleName}\n`);

  const latest = {
    schema_version: 1,
    branch,
    commit: manifest.commit,
    public_base_key: manifest.public_base_key,
    public_base_key_short: keyShort,
    bundle: norm(path.posix.join(keyDirName, bundleName)),
    bundle_sha256: bundleSha,
    manifest: norm(path.posix.join(keyDirName, 'manifest.json')),
    inventory: norm(path.posix.join(keyDirName, 'inventory.json')),
    sha256: norm(path.posix.join(keyDirName, `${bundleName}.sha256`)),
    created_at: manifest.created_at,
    published_at: core.nowIso()
  };
  core.writeJson(latestPath, latest);
  const summary = {
    schema_version: 1,
    generated_at: core.nowIso(),
    repo: norm(artifactRepo),
    branch,
    publish_dir: norm(publishDir),
    latest_path: norm(latestPath),
    public_base_key: manifest.public_base_key,
    public_base_key_short: keyShort,
    bundle_sha256: latest.bundle_sha256,
    bundle: latest.bundle,
    manifest: latest.manifest,
    inventory: latest.inventory,
    sha256: latest.sha256,
    full_build_status: manifest.full_build?.status || 'missing',
    full_build_run_id: manifest.full_build?.run_id || null,
    tracked_dirty_public_inputs_count: manifest.tracked_dirty_public_inputs_count || 0,
    generated_public_inputs_count: manifest.generated_public_inputs_count || 0,
    allow_unproven: Boolean(options.allowUnproven)
  };
  core.writeJson(summaryTarget, summary);
  return summary;
}

function normalizePublishSummary(summary, { manifest, allowUnproven }) {
  return {
    ...summary,
    full_build_status: summary.full_build_status || manifest.full_build?.status || 'missing',
    full_build_run_id: summary.full_build_run_id || manifest.full_build?.run_id || null,
    tracked_dirty_public_inputs_count: summary.tracked_dirty_public_inputs_count ?? manifest.tracked_dirty_public_inputs_count ?? 0,
    generated_public_inputs_count: summary.generated_public_inputs_count ?? manifest.generated_public_inputs_count ?? 0,
    allow_unproven: Boolean(summary.allow_unproven || allowUnproven)
  };
}

function publishPublicBaseWithGit(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const cache = ensureManagedArtifactRepo(repoRoot, options);
  const published = publishPublicBase({ ...options, repoRoot, repo: cache.path });
  const branchPath = requiredPublishBranch(options);
  const gitOptions = { exitCode: 4, env: options.env };
  gitOk(cache.path, ['add', '--', branchPath], gitOptions);
  ensureLocalGitIdentity(cache.path, gitOptions);
  const status = gitOk(cache.path, ['status', '--porcelain'], gitOptions).stdout.trim();
  if (!status) {
    const result = {
      ...published,
      status: 'no_changes',
      repo: cache.url,
      pushed: false,
      cache_path: norm(path.relative(repoRoot, cache.path))
    };
    core.writeJson(path.join(repoRoot, OUTPUT_DIR, 'public-base', 'publish-summary.json'), result);
    return result;
  }
  gitOk(cache.path, ['commit', '-m', `publish public-base for ${branchPath}`], gitOptions);
  gitOk(cache.path, ['push', '-u', 'origin', 'HEAD'], gitOptions);
  const commit = gitOk(cache.path, ['rev-parse', 'HEAD'], gitOptions).stdout.trim();
  const result = {
    ...published,
    status: 'published',
    repo: cache.url,
    pushed: true,
    commit,
    cache_path: norm(path.relative(repoRoot, cache.path))
  };
  core.writeJson(path.join(repoRoot, OUTPUT_DIR, 'public-base', 'publish-summary.json'), result);
  return result;
}

function usePublicBase(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const branch = requiredPublishBranch(options);
  let stage = 'cache';
  let repo = null;
  let bundle = null;
  try {
    const cache = ensureManagedArtifactRepo(repoRoot, options);
    repo = cache.url;
    stage = 'latest';
    const releaseDir = path.join(cache.path, branch);
    const latestPath = path.join(releaseDir, 'latest.json');
    if (!fs.existsSync(latestPath)) {
      const error = new Error(`public-base latest.json does not exist: ${latestPath}`);
      error.exitCode = 3;
      throw error;
    }
    const latest = validateLatestJson(core.readJson(latestPath), branch, releaseDir);
    bundle = path.join(releaseDir, latest.bundle);
    stage = 'integrity';
    const integrity = runCheck({ repoRoot, bundle, integrityOnly: true });
    if (integrity.status !== 'valid') {
      const result = writeUseSummary(repoRoot, {
        status: 'invalid',
        branch,
        repo,
        stage,
        bundle_path: norm(path.relative(repoRoot, bundle)),
        integrity_status: integrity.status
      });
      const error = new Error('public-base bundle failed integrity validation');
      error.exitCode = 5;
      error.result = result;
      throw error;
    }
    stage = 'restore';
    const restored = restorePublicBase({ repoRoot, bundle });
    stage = 'status';
    const status = runStatus({ repoRoot });
    stage = 'check';
    const check = runCheck({ repoRoot, bundle });
    const ready = status.status === 'restored' && check.status === 'matched';
    const result = writeUseSummary(repoRoot, {
      status: ready ? 'ready' : 'not_ready',
      branch,
      repo,
      bundle_path: norm(path.relative(repoRoot, bundle)),
      integrity_status: integrity.status,
      restore_status: restored.status,
      status_status: status.status,
      check_status: check.status
    });
    if (!ready) {
      const error = new Error(`public-base use did not reach ready state: status=${status.status}, check=${check.status}`);
      error.exitCode = 6;
      error.result = result;
      throw error;
    }
    return result;
  } catch (error) {
    if (!error.result) {
      error.result = writeUseSummary(repoRoot, {
        status: 'error',
        branch,
        repo,
        stage,
        bundle_path: bundle ? norm(path.relative(repoRoot, bundle)) : null,
        error: error.message
      });
    }
    throw error;
  }
}

function writeUseSummary(repoRoot, result) {
  const summary = {
    schema_version: 1,
    generated_at: core.nowIso(),
    summary_path: norm(path.join(OUTPUT_DIR, 'public-base', 'use-summary.json')),
    ...result
  };
  core.writeJson(path.join(repoRoot, OUTPUT_DIR, 'public-base', 'use-summary.json'), summary);
  return summary;
}

function ensureManagedArtifactRepo(repoRoot, options = {}) {
  const url = publicBaseRepoUrl(options);
  const cachePath = path.join(repoRoot, PUBLIC_BASE_CACHE_PATH);
  assertInside(repoRoot, cachePath, 'public-base cache');
  ensureManagedCachePathSafe(repoRoot, cachePath);
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  ensureManagedCachePathSafe(repoRoot, cachePath);
  if (!fs.existsSync(path.join(cachePath, '.git'))) {
    if (fs.existsSync(cachePath)) {
      const entries = fs.readdirSync(cachePath);
      if (entries.length > 0) {
        throw new Error(`public-base cache exists and is not a git repository: ${cachePath}`);
      }
    }
    gitOk(repoRoot, ['clone', url, cachePath], { exitCode: 4, env: options.env });
    ensureManagedCachePathSafe(repoRoot, cachePath);
  } else {
    const remote = gitOk(cachePath, ['remote', 'get-url', 'origin'], { exitCode: 4, env: options.env }).stdout.trim();
    validateRepoUrl(remote, { allowOverride: Boolean(options.allowRepoOverride) });
    if (remote !== url) {
      throw new Error(`public-base cache remote is not the expected URL: ${sanitize(remote)}`);
    }
    const branch = gitOk(cachePath, ['branch', '--show-current'], { exitCode: 4, env: options.env }).stdout.trim();
    const fetch = git(cachePath, ['fetch', 'origin'], { env: options.env });
    if (fetch.status !== 0) {
      const error = new Error(`git fetch failed: ${normalizeAuthError(fetch.stderr || fetch.stdout || fetch.error?.message || fetch.status)}`);
      error.exitCode = 4;
      throw error;
    }
    if (branch) {
      const reset = git(cachePath, ['reset', '--hard', `origin/${branch}`], { env: options.env });
      if (reset.status === 0) {
        gitOk(cachePath, ['clean', '-fdx'], { exitCode: 4, env: options.env });
      } else {
        const error = new Error(`git reset failed: ${normalizeAuthError(reset.stderr || reset.stdout || reset.error?.message || reset.status)}`);
        error.exitCode = 4;
        throw error;
      }
    }
  }
  return { path: cachePath, url };
}

function publicBaseRepoUrl(options = {}) {
  const env = options.env || process.env;
  if (env.AD_BUILD_PUBLIC_BASE_REPO_URL) {
    throw new Error('AD_BUILD_PUBLIC_BASE_REPO_URL is not accepted by the shipped CLI; use the fixed public-base repository');
  }
  if (options.repoUrl) {
    if (!options.allowRepoOverride) {
      throw new Error('public-base repo override is only available to tests and explicit internal callers');
    }
    validateRepoUrl(options.repoUrl, { allowOverride: true });
    return options.repoUrl;
  }
  return FIXED_PUBLIC_BASE_REPO_URL;
}

function validateRepoUrl(value, { allowOverride = false } = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`invalid public-base repo URL: ${sanitize(value)}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error('public-base repo URL must not contain credentials');
  }
  if (!allowOverride && value !== FIXED_PUBLIC_BASE_REPO_URL) {
    throw new Error(`unexpected public-base repo URL: ${sanitize(value)}`);
  }
  const allowedProtocols = allowOverride ? ['https:', 'http:', 'file:'] : ['https:', 'file:'];
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(`unsupported public-base repo URL protocol: ${parsed.protocol}`);
  }
}

function readMatchingLatest(latestPath, branch, releaseDir, publicBaseKey, bundleSha) {
  if (!fs.existsSync(latestPath)) {
    return null;
  }
  const latest = validateLatestJson(core.readJson(latestPath), branch, releaseDir);
  if (latest.public_base_key !== publicBaseKey || latest.bundle_sha256 !== bundleSha) {
    return null;
  }
  for (const field of ['bundle', 'manifest', 'inventory', 'sha256']) {
    ensureExistingRegularFile(releaseDir, path.resolve(releaseDir, latest[field]), `latest ${field}`);
  }
  if (sha256File(path.join(releaseDir, latest.bundle)) !== bundleSha) {
    return null;
  }
  if (readSha256SidecarFile(path.join(releaseDir, latest.sha256)) !== bundleSha) {
    return null;
  }
  return latest;
}

function validateLatestJson(latest, branch, releaseDir) {
  const required = ['schema_version', 'branch', 'public_base_key', 'public_base_key_short', 'bundle', 'bundle_sha256', 'manifest', 'inventory', 'sha256'];
  for (const field of required) {
    if (!latest[field]) {
      throw new Error(`public-base latest.json missing ${field}`);
    }
  }
  if (latest.branch !== branch) {
    throw new Error('public-base latest.json branch does not match requested release directory');
  }
  if (latest.public_base_key_short !== publicBaseKeyShort(latest.public_base_key)) {
    throw new Error('public-base latest.json short key does not match public_base_key');
  }
  for (const field of ['bundle', 'manifest', 'inventory', 'sha256']) {
    safePath(latest[field]);
    const target = path.resolve(releaseDir, latest[field]);
    assertInside(releaseDir, target, `latest ${field}`);
  }
  return latest;
}

function ensureLocalGitIdentity(repo, gitOptions = {}) {
  const name = git(repo, ['config', 'user.name']);
  if (name.status !== 0 || !trim(name.stdout)) {
    gitOk(repo, ['config', 'user.name', 'ad-build'], gitOptions);
  }
  const email = git(repo, ['config', 'user.email']);
  if (email.status !== 0 || !trim(email.stdout)) {
    gitOk(repo, ['config', 'user.email', 'ad-build@local'], gitOptions);
  }
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
    missing_files: [],
    output_path: norm(path.join(OUTPUT_DIR, 'public-base', 'status.json'))
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
  let result;
  try {
    validateArchiveBeforeExtract(bundle);
    runTar(['-xf', bundle, '-C', staging]);
    const manifest = readPublicBaseManifest(path.join(staging, 'manifest.json'));
    validateBundleFiles({ manifest, staging });
    const inventory = core.readJson(path.join(staging, 'inventory.json'));
    validateInventoryForManifest(inventory, manifest);
    const sidecar = readSidecarStatus(bundle);
    const integrityMatched = sidecar.status === 'matched';
    if (options.integrityOnly) {
      result = {
        schema_version: 1,
        generated_at: core.nowIso(),
        status: integrityMatched ? 'valid' : 'invalid',
        integrity_only: true,
        bundle_path: norm(bundle),
        bundle_sha256: sha256File(bundle),
        sidecar_status: sidecar.status,
        manifest_status: 'valid',
        inventory_status: 'valid',
        warnings: sidecar.warnings,
        output_path: norm(path.join(OUTPUT_DIR, 'public-base', 'check.json'))
      };
    } else {
      const key = buildKey({ repoRoot, config: options.config || options.configPath, write: false });
      const config = readPublicBaseConfig(repoRoot, options.config || options.configPath);
      const bundleSha256 = sha256File(bundle);
      const dirtyPublicInputs = collectDirtyPublicInputsDetailed(repoRoot, config, {
        ignoreRestoredPublicBase: true,
        restoredPublicBase: {
          publicBaseKey: manifest.public_base_key,
          bundleSha256
        }
      });
      const matched = key.public_base_key === manifest.public_base_key;
      const trackedDirtyCount = dirtyPublicInputs.tracked_dirty.length;
      const generatedCount = dirtyPublicInputs.untracked_generated.length;
      const cleanTrackedPublicInputs = trackedDirtyCount === 0;
      const dirtyInputsBlockReuse = config.public_input_mode !== 'worktree' && !cleanTrackedPublicInputs;
      result = {
        schema_version: 1,
        generated_at: core.nowIso(),
        status: !integrityMatched ? 'invalid' : matched && !dirtyInputsBlockReuse ? 'matched' : 'mismatch',
        integrity_only: false,
        bundle_path: norm(bundle),
        bundle_sha256: bundleSha256,
        sidecar_status: sidecar.status,
        bundle_key: manifest.public_base_key,
        bundle_key_short: publicBaseKeyShort(manifest.public_base_key),
        current_key: key.public_base_key,
        current_key_short: key.public_base_key_short,
        public_input_mode: key.public_input_mode,
        bundle_public_input_mode: manifest.public_input_mode || null,
        input_files_count: key.input_files_count,
        bundle_input_files_count: manifest.input_files_count,
        tracked_dirty_public_inputs_count: trackedDirtyCount,
        tracked_dirty_public_inputs_sample: dirtyPublicInputs.tracked_dirty.slice(0, 200),
        generated_public_inputs_count: generatedCount,
        generated_public_inputs_sample: dirtyPublicInputs.untracked_generated.slice(0, 200),
        dirty_public_inputs_count: trackedDirtyCount,
        dirty_public_inputs_sample: dirtyPublicInputs.tracked_dirty.slice(0, 200),
        top_level_counts: key.top_level_counts,
        extension_counts: key.extension_counts,
        output_path: norm(path.join(OUTPUT_DIR, 'public-base', 'check.json')),
        warnings: [
          ...(matched ? [] : [{ message: 'public inputs changed; rebuild public-base before trusting local app verification' }]),
          ...(cleanTrackedPublicInputs ? [] : [{
            message: config.public_input_mode === 'worktree'
              ? 'tracked public inputs are included because public_input_mode is worktree; use git-head for trusted publish baselines'
              : 'tracked public inputs changed; rebuild public-base or commit/revert public inputs before trusting local app verification'
          }]),
          ...(generatedCount === 0 ? [] : [{ message: 'generated public inputs exist in worktree; they do not block reuse in git-head mode' }]),
          ...sidecar.warnings
        ]
      };
    }
  } catch (error) {
    result = {
      schema_version: 1,
      generated_at: core.nowIso(),
      status: 'invalid',
      integrity_only: Boolean(options.integrityOnly),
      bundle_path: norm(bundle),
      bundle_sha256: fs.existsSync(bundle) ? sha256File(bundle) : null,
      sidecar_status: 'unknown',
      bundle_key: null,
      bundle_key_short: null,
      current_key: null,
      current_key_short: null,
      input_files_count: null,
      bundle_input_files_count: null,
      output_path: norm(path.join(OUTPUT_DIR, 'public-base', 'check.json')),
      error: error.message,
      warnings: [{ message: 'public-base bundle failed integrity validation' }]
    };
  }
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'public-base');
  core.writeJson(path.join(outDir, 'check.json'), result);
  writeText(path.join(outDir, 'check.md'), renderCheckMarkdown(result));
  return result;
}

function runPublicBaseCli(args = [], options = {}) {
  const command = args[0] || 'help';
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  const wantsJson = args.includes('--json');
  try {
    if (command === 'help' || command === '-h' || command === '--help') {
      stdout.write(publicBaseHelp());
      return 0;
    }
    if (command === 'key') {
      const parsed = parseArgs(args.slice(1));
      const result = buildKey({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      writeCliResult(stdout, parsed, result, `public-base key ${result.public_base_key_short}; wrote .ad-build/public-base/key.json\n`);
      return 0;
    }
    if (command === 'pack') {
      const parsed = parseArgs(args.slice(1));
      const result = packPublicBase({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      writeCliResult(stdout, parsed, result, `wrote public-base bundle ${result.bundle_path} (${result.files_count} files)\n`);
      return 0;
    }
    if (command === 'restore') {
      const parsed = parseArgs(args.slice(1));
      const result = restorePublicBase({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      writeCliResult(stdout, parsed, result, `restored public-base ${result.restored_count} files from ${result.bundle_path}\n`);
      return 0;
    }
    if (command === 'publish') {
      const parsed = parseArgs(args.slice(1));
      if (!parsed.push) {
        const error = new Error('public-base publish requires --push and the fixed artifact repository');
        error.exitCode = 2;
        throw error;
      }
      if (parsed.repo || parsed.env?.AD_BUILD_PUBLIC_BASE_REPO || options.env?.AD_BUILD_PUBLIC_BASE_REPO) {
        const error = new Error('public-base publish does not accept --repo or AD_BUILD_PUBLIC_BASE_REPO in the shipped CLI');
        error.exitCode = 2;
        throw error;
      }
      const result = publishPublicBaseWithGit({
        ...parsed,
        repoRoot: options.repoRoot || parsed.repoRoot,
        cwd: options.cwd,
        env: options.env,
        repoUrl: options.repoUrl,
        allowRepoOverride: options.allowRepoOverride
      });
      writeCliResult(stdout, parsed, result, [
        `published public-base ${result.public_base_key_short} to ${result.publish_dir}`,
        `latest: ${result.latest_path}`,
        `bundle: ${result.bundle}`,
        ''
      ].join('\n'));
      return 0;
    }
    if (command === 'status') {
      const parsed = parseArgs(args.slice(1));
      const result = runStatus({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      writeCliResult(stdout, parsed, result, `public-base status ${result.status}; wrote .ad-build/public-base/status.json\n`);
      return result.status === 'restored' ? 0 : 6;
    }
    if (command === 'check') {
      const parsed = parseArgs(args.slice(1));
      const result = runCheck({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env });
      writeCliResult(stdout, parsed, result, `public-base check ${result.status}; wrote .ad-build/public-base/check.json\n`);
      if (result.status === 'matched' || result.status === 'valid') {
        return 0;
      }
      return result.status === 'mismatch' ? 6 : 5;
    }
    if (command === 'use') {
      const parsed = parseArgs(args.slice(1));
      const result = usePublicBase({
        ...parsed,
        repoRoot: options.repoRoot || parsed.repoRoot,
        cwd: options.cwd,
        env: options.env,
        repoUrl: options.repoUrl,
        allowRepoOverride: options.allowRepoOverride
      });
      writeCliResult(stdout, parsed, result, `public-base use ${result.status} ${result.branch}; wrote .ad-build/public-base/use-summary.json\n`);
      return result.status === 'ready' ? 0 : 6;
    }
    if (command === 'auth') {
      const subcommand = args[1] || 'status';
      const parsed = parseArgs(args.slice(2));
      const result = runAuthCommand(subcommand, {
        ...parsed,
        repoRoot: options.repoRoot || parsed.repoRoot,
        cwd: options.cwd,
        env: options.env,
        stdin: options.stdin || process.stdin,
        stdout,
        repoUrl: options.repoUrl,
        allowRepoOverride: options.allowRepoOverride
      });
      const cliResult = options.displayCommand ? { ...result, command: options.displayCommand } : result;
      writeCliResult(stdout, parsed, cliResult, authHumanMessage(subcommand, result, options));
      return ['stored', 'authenticated', 'removed'].includes(result.status) ? 0 : 4;
    }
    if (wantsJson) {
      stdout.write(`${JSON.stringify({
        schema_version: 1,
        generated_at: core.nowIso(),
        status: 'error',
        command,
        exit_code: 2,
        error: `unknown public-base command: ${command}`
      }, null, 2)}\n`);
      return 2;
    }
    stderr.write(`unknown public-base command: ${command}\n${publicBaseHelp()}`);
    return 2;
  } catch (error) {
    if (wantsJson) {
      const result = {
        schema_version: 1,
        generated_at: core.nowIso(),
        ...(error.result || {}),
        status: error.result?.status || 'error',
        command: options.displayCommand || command,
        exit_code: error.exitCode || 2,
        error: error.message
      };
      stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      stderr.write(`ad-build public-base ${command} failed: ${error.message}\n`);
    }
    return error.exitCode || 2;
  }
}

function writeCliResult(stdout, parsed, result, human) {
  if (parsed.json) {
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    stdout.write(human);
  }
}

function readPublicBaseConfig(repoRoot, configPath) {
  const requested = configPath || DEFAULT_CONFIG_PATH;
  const full = path.resolve(repoRoot, requested);
  const source = fs.existsSync(full) ? parseSimpleYaml(fs.readFileSync(full, 'utf8')) : {};
  return {
    path: fs.existsSync(full) ? full : null,
    public_input_mode: normalizePublicInputMode(source.public_input_mode),
    restore_dirs: normalizeStringArray(source.restore_dirs, PUBLIC_BASE_DIRS, 'restore_dirs').map(norm),
    restore_files: normalizeStringArray(source.restore_files, PUBLIC_BASE_FILES, 'restore_files').map(norm),
    public_inputs: normalizeStringArray(source.public_inputs, PUBLIC_INPUT_PATTERNS, 'public_inputs').map(norm),
    public_input_excludes: normalizeStringArray(
      source.public_input_excludes || source.exclude_patterns || source.public_excludes,
      PUBLIC_EXCLUDE_PATTERNS,
      'public_input_excludes'
    ).map(norm),
    toolchain_env: normalizeStringArray(source.toolchain_env, PUBLIC_TOOLCHAIN_ENV_KEYS, 'toolchain_env')
  };
}

function collectPublicInputFiles(repoRoot, config) {
  if (config.public_input_mode === 'git-head') {
    return collectGitHeadPublicInputFiles(repoRoot, config);
  }
  return collectWorktreePublicInputFiles(repoRoot, config);
}

function collectGitHeadPublicInputFiles(repoRoot, config) {
  return gitHeadEntries(repoRoot)
    .filter((entry) => isPublicInputPath(entry.path, config))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => ({
      path: entry.path,
      source: 'public-input-git-head',
      git_blob: entry.object,
      git_mode: entry.mode,
      git_type: entry.type,
      mode: entry.mode
    }));
}

function gitHeadEntries(repoRoot) {
  const result = gitOk(repoRoot, ['ls-tree', '-r', '-z', 'HEAD', '--']);
  return nul(result.stdout)
    .map(parseGitLsTreeRecord)
    .filter(Boolean);
}

function parseGitLsTreeRecord(record) {
  const match = String(record).match(/^(\d+)\s+(\S+)\s+([0-9a-f]+)\t(.+)$/);
  if (!match || match[2] !== 'blob') {
    return null;
  }
  return {
    mode: match[1],
    type: match[2],
    object: match[3],
    path: norm(match[4])
  };
}

function collectWorktreePublicInputFiles(repoRoot, config) {
  const paths = new Set();
  for (const pattern of config.public_inputs) {
    collectPatternMatches(repoRoot, pattern, config.public_input_excludes, paths);
  }
  return [...paths]
    .filter((file) => !isExcluded(file, config.public_input_excludes))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => fileEntry(repoRoot, file, 'public-input-worktree'))
    .filter(Boolean);
}

function collectDirtyPublicInputs(repoRoot, config, options = {}) {
  return collectDirtyPublicInputsDetailed(repoRoot, config, options).tracked_dirty;
}

function collectDirtyPublicInputsDetailed(repoRoot, config, options = {}) {
  const trackedDirty = new Set();
  const untrackedGenerated = new Set();
  const restoredClean = options.ignoreRestoredPublicBase ? restoredCleanFileSet(repoRoot, options.restoredPublicBase) : new Set();
  const changed = gitOk(repoRoot, ['diff', '--name-only', '-z', 'HEAD', '--']).stdout;
  for (const file of nul(changed)) {
    const rel = norm(file);
    if (isPublicInputPath(rel, config) && !restoredClean.has(rel)) {
      trackedDirty.add(rel);
    }
  }
  const untracked = gitOk(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z']).stdout;
  for (const file of nul(untracked)) {
    const rel = norm(file);
    if (isPublicInputPath(rel, config) && !restoredClean.has(rel)) {
      untrackedGenerated.add(rel);
    }
  }
  return {
    tracked_dirty: [...trackedDirty].sort((a, b) => a.localeCompare(b)),
    untracked_generated: [...untrackedGenerated].sort((a, b) => a.localeCompare(b))
  };
}

function restoredCleanFileSet(repoRoot, expected = {}) {
  const currentPath = path.join(repoRoot, CURRENT_PUBLIC_BASE_PATH);
  if (!fs.existsSync(currentPath)) {
    return new Set();
  }
  try {
    const current = core.readJson(currentPath);
    if (expected?.publicBaseKey && current.public_base_key !== expected.publicBaseKey) {
      return new Set();
    }
    if (expected?.bundleSha256 && current.bundle_sha256 !== expected.bundleSha256) {
      return new Set();
    }
    const result = new Set();
    for (const entry of current.files || []) {
      if (entry?.path && entry?.sha256 && fileSha(repoRoot, entry.path) === entry.sha256) {
        result.add(norm(entry.path));
      }
    }
    return result;
  } catch {
    return new Set();
  }
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
    addIfFile(repoRoot, file, [], paths);
  }
  for (const dir of config.restore_dirs) {
    safePath(dir);
    walk(path.join(repoRoot, dir), repoRoot, [], (file) => paths.add(file));
  }
  return [...paths]
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

function isPublicInputPath(file, config) {
  const rel = norm(file);
  if (isExcluded(rel, config.public_input_excludes)) {
    return false;
  }
  return config.public_inputs.some((pattern) => {
    const normalized = norm(pattern);
    if (!hasGlob(normalized)) {
      return rel === normalized;
    }
    if (normalized.endsWith('/**') && !hasGlob(normalized.slice(0, -3))) {
      const prefix = normalized.slice(0, -3);
      return rel === prefix || rel.startsWith(`${prefix}/`);
    }
    try {
      return moduleMap.pathMatches(rel, normalized);
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

function countTopLevel(files) {
  const counts = {};
  for (const file of files || []) {
    const top = norm(file.path || '').split('/')[0] || '<root>';
    counts[top] = (counts[top] || 0) + 1;
  }
  return sortObject(counts);
}

function countExtensions(files) {
  const counts = {};
  for (const file of files || []) {
    const base = path.posix.basename(norm(file.path || ''));
    const index = base.lastIndexOf('.');
    const ext = index > 0 ? base.slice(index) : '<noext>';
    counts[ext] = (counts[ext] || 0) + 1;
  }
  return sortObject(counts);
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort((a, b) => a[0].localeCompare(b[0])));
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

function findRestoreConflicts({ repoRoot, manifest, config, force = false }) {
  const conflicts = [];
  const worktree = git(repoRoot, ['rev-parse', '--is-inside-work-tree']);
  const insideWorktree = worktree.status === 0 && trim(worktree.stdout) === 'true';
  const statusMap = insideWorktree ? gitStatusMap(repoRoot) : new Map();
  for (const entry of manifest.files || []) {
    ensureDestinationSafe(repoRoot, entry.path);
    const actual = fileSha(repoRoot, entry.path);
    const state = insideWorktree ? gitFileState(repoRoot, entry.path, statusMap) : { reason: 'not-a-git-worktree' };
    if (!actual && state.reason) {
      if (force || state.reason === 'untracked-file-conflict' || state.reason === 'not-a-git-worktree') {
        continue;
      }
      conflicts.push({
        path: entry.path,
        current_sha256: null,
        bundle_sha256: entry.sha256,
        reason: state.reason
      });
      continue;
    }
    if (actual && actual !== entry.sha256) {
      if (force) {
        continue;
      }
      if (state.reason) {
        conflicts.push({
          path: entry.path,
          current_sha256: actual,
          bundle_sha256: entry.sha256,
          reason: state.reason
        });
      } else if (config && isPublicInputPath(entry.path, config)) {
        conflicts.push({
          path: entry.path,
          current_sha256: actual,
          bundle_sha256: entry.sha256,
          reason: 'public-input-differs'
        });
      }
    }
  }
  return conflicts;
}

function gitStatusMap(repoRoot) {
  const result = git(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored']);
  const map = new Map();
  if (result.status !== 0) {
    return map;
  }
  const parts = String(result.stdout || '').split('\0').filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    const record = parts[index];
    const code = record.slice(0, 2);
    let file = norm(record.slice(3));
    if (code.startsWith('R') || code.startsWith('C')) {
      index += 1;
    }
    map.set(file, code);
  }
  return map;
}

function gitFileState(repoRoot, file, statusMap) {
  const code = statusMap.get(norm(file));
  if (code) {
    if (code === '??' || code === '!!') {
      return { reason: 'untracked-file-conflict' };
    }
    if (code[0] === 'D') {
      return { reason: 'tracked-file-staged-deletion' };
    }
    if (code[1] === 'D') {
      return { reason: 'tracked-file-deleted' };
    }
    if (code[0] !== ' ') {
      return { reason: 'tracked-file-staged' };
    }
    if (code[1] !== ' ') {
      return { reason: 'tracked-file-modified' };
    }
  }
  const tracked = git(repoRoot, ['ls-files', '--error-unmatch', '--', file]);
  return tracked.status === 0 ? { reason: null } : { reason: 'untracked-file-conflict' };
}

function writeRestoreConflicts(repoRoot, bundle, manifest, conflicts) {
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'public-base');
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    bundle_path: norm(bundle),
    public_base_key: manifest.public_base_key,
    status: 'conflict',
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
  const expectedShort = publicBaseKeyShort(manifest.public_base_key);
  if (manifest.public_base_key_short !== expectedShort) {
    throw new Error('public-base manifest public_base_key_short does not match public_base_key');
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

function readSha256SidecarFile(sidecar) {
  const value = String(fs.readFileSync(sidecar, 'utf8')).trim().split(/\s+/)[0];
  if (!/^sha256:[a-f0-9]{64}$/.test(value)) {
    throw new Error('bundle sha256 sidecar is invalid');
  }
  return value;
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
    public_input_mode: manifest.public_input_mode || null,
    commit: manifest.commit,
    branch: manifest.branch,
    run_id: manifest.run_id,
    full_build_status: manifest.full_build?.status || 'missing',
    full_build_run_id: manifest.full_build?.run_id || null,
    tracked_dirty_public_inputs_count: manifest.tracked_dirty_public_inputs_count || 0,
    generated_public_inputs_count: manifest.generated_public_inputs_count || 0,
    dirty_public_inputs_count: manifest.dirty_public_inputs_count || 0,
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
    repo: option(args, '--repo') || undefined,
    branch: option(args, '--branch') || undefined,
    repoRoot: option(args, '--workdir') || undefined,
    config: option(args, '--config') || undefined,
    force: args.includes('--force'),
    allowPartial: args.includes('--allow-partial'),
    integrityOnly: args.includes('--integrity-only'),
    json: args.includes('--json'),
    push: args.includes('--push'),
    tokenStdin: args.includes('--token-stdin'),
    removeCache: args.includes('--remove-cache'),
    allowUnproven: args.includes('--allow-unproven')
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

function publishBundleSelection(options, repoRoot) {
  if (options.bundle || options.env?.AD_BUILD_PUBLIC_BASE_BUNDLE) {
    return { bundle: requiredBundle(options, repoRoot), summary: null };
  }
  const summaryPath = path.join(repoRoot, OUTPUT_DIR, 'public-base', 'latest', 'pack-summary.json');
  if (!fs.existsSync(summaryPath)) {
    const error = new Error('--bundle is required when .ad-build/public-base/latest/pack-summary.json is missing');
    error.exitCode = 2;
    throw error;
  }
  const summary = core.readJson(summaryPath);
  if (!summary.bundle_path) {
    const error = new Error(`latest public-base pack summary does not contain bundle_path: ${summaryPath}`);
    error.exitCode = 3;
    throw error;
  }
  const full = path.resolve(repoRoot, summary.bundle_path);
  if (!fs.existsSync(full)) {
    const error = new Error(`latest public-base bundle does not exist: ${full}`);
    error.exitCode = 3;
    throw error;
  }
  return { bundle: full, summary };
}

function validateLatestPackSummary(summary, manifest, bundle) {
  if (!summary) {
    return;
  }
  for (const field of ['bundle_sha256', 'public_base_key', 'public_base_key_short']) {
    if (!summary[field]) {
      throw new Error(`latest public-base pack summary missing ${field}`);
    }
  }
  const actualSha = sha256File(bundle);
  if (summary.bundle_sha256 !== actualSha) {
    throw new Error('latest public-base bundle sha256 mismatch');
  }
  if (summary.public_base_key !== manifest.public_base_key) {
    throw new Error('latest public-base key does not match bundle manifest');
  }
  if (summary.public_base_key_short !== publicBaseKeyShort(manifest.public_base_key)) {
    throw new Error('latest public-base short key does not match bundle manifest');
  }
}

function requireTrustedFullBuild(manifest, options = {}) {
  if (options.allowUnproven) {
    return;
  }
  if (!manifest.full_build || manifest.full_build.status !== 'passed') {
    const error = new Error('public-base publish requires a passed full-build; rerun ad-build full-build -- <command> or use --allow-unproven for diagnostics');
    error.exitCode = 5;
    throw error;
  }
  const trackedDirtyCount = manifest.tracked_dirty_public_inputs_count ?? manifest.dirty_public_inputs_count ?? 0;
  if (trackedDirtyCount > 0) {
    const error = new Error('public-base publish requires clean tracked public inputs; commit/revert tracked public input changes or use --allow-unproven for diagnostics');
    error.exitCode = 5;
    throw error;
  }
}

function validateExistingPublishDir(publishDir, publicBaseKey, bundleSha256) {
  const manifestPath = path.join(publishDir, 'manifest.json');
  const summaryPath = path.join(publishDir, 'publish-summary.json');
  const shaPath = path.join(publishDir, 'public-base.tar.sha256');
  const entries = fs.existsSync(publishDir) ? fs.readdirSync(publishDir) : [];
  if (!fs.existsSync(manifestPath) && !fs.existsSync(summaryPath) && !fs.existsSync(shaPath)) {
    if (entries.length > 0) {
      throw new Error(`non-empty publish target lacks validation metadata: ${publishDir}`);
    }
    return;
  }
  const allowed = new Set(['public-base.tar', 'manifest.json', 'inventory.json', 'public-base.tar.sha256', 'publish-summary.json']);
  for (const entry of entries) {
    if (!allowed.has(entry)) {
      throw new Error(`publish target contains unexpected file: ${path.join(publishDir, entry)}`);
    }
    ensureExistingRegularFile(publishDir, path.join(publishDir, entry), 'publish target file');
  }
  const existingManifest = fs.existsSync(manifestPath) ? core.readJson(manifestPath) : null;
  const existingSummary = fs.existsSync(summaryPath) ? core.readJson(summaryPath) : null;
  if (existingManifest?.public_base_key && existingManifest.public_base_key !== publicBaseKey) {
    throw new Error(`publish target already contains a different public_base_key: ${publishDir}`);
  }
  if (existingSummary?.bundle_sha256 && existingSummary.bundle_sha256 !== bundleSha256) {
    throw new Error(`publish target already contains a different bundle_sha256: ${publishDir}`);
  }
  if (fs.existsSync(shaPath)) {
    const existingSha = String(fs.readFileSync(shaPath, 'utf8')).trim().split(/\s+/)[0];
    if (existingSha && existingSha !== bundleSha256) {
      throw new Error(`publish target already contains a different bundle sha256 sidecar: ${publishDir}`);
    }
  }
}

function ensurePublishPathSafe(root, relativePath) {
  safePath(relativePath);
  let current = root;
  for (const part of norm(relativePath).split('/')) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) {
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new Error(`publish target path contains a symlink or junction: ${norm(path.relative(root, current))}`);
    }
    if (!stat.isDirectory()) {
      throw new Error(`publish target path component is not a directory: ${norm(path.relative(root, current))}`);
    }
  }
}

function ensurePublishFileTargetsSafe(publishDir) {
  for (const name of ['public-base.tar', 'manifest.json', 'inventory.json', 'public-base.tar.sha256', 'publish-summary.json']) {
    const target = path.join(publishDir, name);
    if (fs.existsSync(target)) {
      ensureExistingRegularFile(publishDir, target, 'publish target file');
    }
  }
}

function ensureExistingRegularFile(root, target, label) {
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink()) {
    throw new Error(`${label} is a symlink or junction: ${norm(path.relative(root, target))}`);
  }
  if (!stat.isFile()) {
    throw new Error(`${label} is not a regular file: ${norm(path.relative(root, target))}`);
  }
}

function ensureManagedCachePathSafe(repoRoot, cachePath) {
  const realRoot = fs.existsSync(repoRoot) ? fs.realpathSync(repoRoot) : repoRoot;
  const relative = path.relative(repoRoot, cachePath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`public-base cache path escapes repository: ${cachePath}`);
  }
  let current = repoRoot;
  for (const part of norm(relative).split('/')) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) {
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new Error(`public-base cache path contains a symlink or junction: ${norm(path.relative(repoRoot, current))}`);
    }
    if (!stat.isDirectory()) {
      throw new Error(`public-base cache path component is not a directory: ${norm(path.relative(repoRoot, current))}`);
    }
    const real = fs.realpathSync(current);
    const realRel = path.relative(realRoot, real);
    if (!realRel && current !== repoRoot) {
      continue;
    }
    if (realRel.startsWith('..') || path.isAbsolute(realRel)) {
      throw new Error(`public-base cache real path escapes repository: ${norm(path.relative(repoRoot, current))}`);
    }
  }
}

function requiredPublishRepo(options) {
  const value = options.repo || options.env?.AD_BUILD_PUBLIC_BASE_REPO;
  if (!value) {
    const error = new Error('--repo is required');
    error.exitCode = 2;
    throw error;
  }
  const repo = path.resolve(value);
  fs.mkdirSync(repo, { recursive: true });
  if (!fs.lstatSync(repo).isDirectory()) {
    const error = new Error(`public-base repo is not a directory: ${repo}`);
    error.exitCode = 3;
    throw error;
  }
  return repo;
}

function requiredPublishBranch(options) {
  const branch = options.branch || options.env?.AD_BUILD_PUBLIC_BASE_BRANCH;
  if (!branch) {
    const error = new Error('--branch is required');
    error.exitCode = 2;
    throw error;
  }
  const normalized = norm(branch);
  validatePublishBranch(normalized);
  return normalized;
}

function validatePublishBranch(branch) {
  safePath(branch);
  if (branch.startsWith('.') || branch.endsWith('.') || branch.includes('//')) {
    throw new Error(`invalid public-base branch: ${branch}`);
  }
  if (branch.startsWith('-') || branch.split('/').some((part) => !part || part.startsWith('.') || part.startsWith('-') || part.endsWith('.') || part.endsWith('.lock'))) {
    throw new Error(`invalid public-base branch: ${branch}`);
  }
  if (branch.includes('@{') || /[~^:?*[\]\s\\]/.test(branch)) {
    throw new Error(`invalid public-base branch: ${branch}`);
  }
  if (branch === 'HEAD' || branch.startsWith('refs/') || branch.startsWith('.git/')) {
    throw new Error(`invalid public-base branch: ${branch}`);
  }
}

function resolveRepoRoot(options = {}) {
  if (options.repoRoot) {
    return path.resolve(options.repoRoot);
  }
  if (options.env?.AD_BUILD_WORK_DIR) {
    return path.resolve(options.env.AD_BUILD_WORK_DIR);
  }
  const cwd = options.cwd || process.cwd();
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER,
    env: gitEnv(options.env)
  });
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

function git(repoRoot, args, options = {}) {
  return spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER,
    env: gitEnv(options.env)
  });
}

function gitOk(repoRoot, args, options = {}) {
  const result = git(repoRoot, args, options);
  if (result.error || result.status !== 0) {
    const error = new Error(`git ${args[0]} failed: ${normalizeAuthError(result.error?.message || result.stderr || result.stdout || result.status)}`);
    if (options.exitCode) {
      error.exitCode = options.exitCode;
    }
    throw error;
  }
  return result;
}

function gitEnv(env = {}) {
  return {
    ...process.env,
    ...env,
    GIT_TERMINAL_PROMPT: '0'
  };
}

function runAuthCommand(command, options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const env = options.env || process.env;
  const repo = publicBaseRepoUrl({ ...options, env });
  if (command === 'login') {
    const token = readLoginToken(options);
    if (!token) {
      const error = new Error('empty token');
      error.exitCode = 2;
      throw error;
    }
    approveCredential(repo, token, { env });
    const result = git(repoRoot, ['ls-remote', repo, 'HEAD'], { env });
    if (result.error || result.status !== 0) {
      rejectCredential(repo, { env });
      const error = new Error('login failed: token is invalid or lacks public-base repository permission');
      error.exitCode = 4;
      error.result = {
        status: 'unauthenticated',
        repo,
        error: normalizeAuthError(result.stderr || result.stdout || result.error?.message || 'git ls-remote failed')
      };
      throw error;
    }
    return {
      status: 'authenticated',
      repo,
      message: 'login succeeded; public-base repository credential saved',
      credential_helper: gitCredentialHelper(repoRoot)
    };
  }
  if (command === 'status') {
    const result = git(repoRoot, ['ls-remote', repo, 'HEAD'], { env });
    return {
      status: result.status === 0 ? 'authenticated' : 'unauthenticated',
      repo,
      error: result.status === 0 ? null : normalizeAuthError(result.stderr || result.stdout || result.error?.message || 'git ls-remote failed')
    };
  }
  if (command === 'logout') {
    rejectCredential(repo, { env });
    if (options.removeCache) {
      const cachePath = path.join(repoRoot, PUBLIC_BASE_CACHE_PATH);
      assertInside(repoRoot, cachePath, 'public-base cache');
      fs.rmSync(cachePath, { recursive: true, force: true });
    }
    return {
      status: 'removed',
      repo
    };
  }
  const error = new Error(`unknown public-base auth command: ${command}`);
  error.exitCode = 2;
  throw error;
}

function readLoginToken(options = {}) {
  if (options.tokenStdin) {
    return readTokenFromStdin(options.stdin).replace(/\r?\n$/, '');
  }

  const stdin = options.stdin || process.stdin;
  const stdout = options.stdout || process.stdout;
  if (!stdin.isTTY || !stdout.isTTY) {
    const error = new Error('non-interactive environment; use: ad-build login --token-stdin');
    error.exitCode = 2;
    throw error;
  }

  return readSecretFromTty('Git Personal Access Token: ');
}

function readTokenFromStdin(stdin) {
  if (stdin && stdin !== process.stdin && typeof stdin.read === 'function') {
    const chunks = [];
    let chunk = stdin.read();
    while (chunk !== null) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
      chunk = stdin.read();
    }
    if (chunks.length > 0) {
      return chunks.join('');
    }
  }
  return fs.readFileSync(0, 'utf8');
}

function readSecretFromTty(prompt) {
  const script = [
    'restore_tty() { stty echo < /dev/tty 2>/dev/null || true; }',
    'trap restore_tty EXIT INT TERM',
    'stty -echo < /dev/tty',
    'printf %s "$1" > /dev/tty',
    'IFS= read -r token < /dev/tty',
    'restore_tty',
    'trap - EXIT INT TERM',
    'printf "\\n" > /dev/tty',
    'printf %s "$token"'
  ].join('\n');
  const result = spawnSync('sh', ['-c', script, 'sh', prompt], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: GIT_MAX_BUFFER
  });
  if (result.error || result.status !== 0) {
    const error = new Error('failed to read token from interactive terminal; use: ad-build login --token-stdin');
    error.exitCode = 2;
    throw error;
  }
  return result.stdout.replace(/\r?\n$/, '');
}

function approveCredential(repo, token, options = {}) {
  const parsed = new URL(repo);
  if (parsed.protocol === 'file:') {
    return;
  }
  const input = [
    `protocol=${parsed.protocol.replace(':', '')}`,
    `host=${parsed.host}`,
    'username=oauth2',
    `password=${token}`,
    ''
  ].join('\n');
  const result = spawnSync('git', ['credential', 'approve'], {
    input,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER,
    env: gitEnv(options.env)
  });
  if (result.error || result.status !== 0) {
    throw new Error(`git credential approve failed: ${normalizeAuthError(result.error?.message || result.stderr || result.stdout || result.status)}`);
  }
}

function rejectCredential(repo, options = {}) {
  const parsed = new URL(repo);
  if (parsed.protocol === 'file:') {
    return;
  }
  const input = [
    `protocol=${parsed.protocol.replace(':', '')}`,
    `host=${parsed.host}`,
    'username=oauth2',
    ''
  ].join('\n');
  spawnSync('git', ['credential', 'reject'], {
    input,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER,
    env: gitEnv(options.env)
  });
}

function gitCredentialHelper(repoRoot) {
  const result = git(repoRoot, ['config', '--get', 'credential.helper']);
  return result.status === 0 && trim(result.stdout) ? trim(result.stdout) : 'default';
}

function authHumanMessage(subcommand, result, options = {}) {
  if (options.friendlyAuthCommand === 'login') {
    return result.status === 'authenticated'
      ? `login succeeded; public-base repository credential saved\nrepo: ${result.repo}\n`
      : `login ${result.status}\n`;
  }
  if (options.friendlyAuthCommand === 'logout') {
    return 'logged out; public-base credential and local cache cleared\n';
  }
  return `public-base auth ${subcommand} ${result.status}\n`;
}

function normalizeAuthError(value) {
  const sanitized = sanitize(value);
  if (/Authentication failed|HTTP Basic|could not read Username|terminal prompts disabled|authentication required|Authentication required|401 Unauthorized/i.test(sanitized)) {
    return 'not logged in to public-base repository; run: ad-build login';
  }
  return sanitized;
}

function sanitize(value) {
  return String(value || '')
    .replace(/https?:\/\/([^:@/\s]+):([^@/\s]+)@/g, 'https://***:***@')
    .replace(/https?:\/\/([^@/\s]+)@/g, 'https://***@');
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

function publicBaseKeyShort(publicBaseKey) {
  return core.safeDigestKey(publicBaseKey).slice(0, 12);
}

function assertInside(parent, child, label) {
  const relative = path.relative(parent, child);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes parent directory: ${child}`);
  }
}

function normalizeStringArray(value, fallback, label) {
  const selected = value === undefined || value === null || value === '' ? fallback : value;
  if (!Array.isArray(selected) || selected.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new Error(`${label} must be a string array`);
  }
  return [...selected];
}

function normalizePublicInputMode(value) {
  const mode = value === undefined || value === null || value === '' ? DEFAULT_PUBLIC_INPUT_MODE : String(value);
  if (!['git-head', 'worktree'].includes(mode)) {
    throw new Error('public_input_mode must be git-head or worktree');
  }
  return mode;
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
    '  ad-build login [--token-stdin] [--json]',
    '  ad-build logout [--json]',
    '  ad-build public-base auth login --token-stdin [--json]',
    '  ad-build public-base auth status [--json]',
    '  ad-build public-base auth logout [--remove-cache] [--json]',
    '  ad-build public-base pack [--out <public-base.tar>] [--config <tools/public-base.yaml>] [--allow-partial] [--json]',
    '  ad-build public-base check --bundle <public-base.tar> [--integrity-only] [--json]',
    '  ad-build public-base use --branch <release-dir> [--json]',
    '  ad-build public-base publish --branch <release-dir> --bundle <public-base.tar> --push [--allow-unproven] [--json]',
    '  ad-build public-base status [--json]',
    '',
    'Normal users authenticate with top-level login/logout. public-base auth is retained for CI and diagnostics.',
    'Normal developer restore uses use. Normal publishing uses pack, check --integrity-only, then publish --push.',
    `Fixed artifact repository: ${FIXED_PUBLIC_BASE_REPO_URL}`,
    'Internal diagnostics and legacy local publishing are intentionally hidden from normal help.',
    ''
  ].join('\n');
}

function trim(value) {
  return String(value || '').trim();
}

function norm(value) {
  return String(value || '').replaceAll('\\', '/');
}

function nul(value) {
  return String(value || '').split('\0').filter(Boolean);
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
  publishPublicBase,
  publishPublicBaseWithGit,
  restorePublicBase,
  normalizeAuthError,
  runCheck,
  runKey: buildKey,
  runPublicBaseCli,
  runStatus,
  usePublicBase
};
