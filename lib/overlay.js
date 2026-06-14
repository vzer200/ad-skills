const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const core = require('./core');
const { sha256File } = require('./file-utils');

const OUTPUT_DIR = '.ad-build';
const OVERLAY_STATE_SUBDIR = 'overlay';
const CACHE_REPO_SUBDIR = path.join('cache', 'artifact-overlay-repo');
const DEFAULT_ARTIFACT_REPO_SSH = 'git@git.sangfor.com:69765/ad-build-public-base.git';
const DEFAULT_SOURCE_ROOT = '/root/AD';
const PACK_RULES_VERSION = 1;
const GIT_MAX_BUFFER = 256 * 1024 * 1024;
const LOG_MAX_BUFFER = 512 * 1024 * 1024;

const EXCLUDED_ROOTS = new Set(['.git', 'mkpacket', 'ssipacket', 'ad_packet']);
const EXCLUDED_PREFIXES = [
  '.git/',
  '.ad-build/cache/',
  'mkpacket/',
  'ssipacket/',
  'ad_packet/',
  'node_modules/'
];

const SCAN_ROOTS = [
  'obj',
  'app_bin',
  'include',
  'cfg',
  'shell',
  'ui',
  'ui_new',
  'linux',
  'libs',
  'sinfor',
  'access_layer',
  'apps',
  'apps2',
  'gtest',
  'test'
];

const SCAN_FILES = [
  'KERNEL_VER',
  'OS_PLATFORM.file',
  'compile.sh',
  'version_change.sh',
  'php_encode_x86_64'
];

const TRUSTED_WHOLE_ROOTS = new Set(['obj', 'app_bin']);
const MODULES = {
  appd: {
    name: 'appd',
    dir: 'apps/ad_appd_new',
    command: ['make', 'V=1', 'VERBOSE=1']
  }
};

const APPD_REQUIRED_PATHS = [
  'libs/rdma-core-2404mlnx51/build/include',
  'libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h',
  'apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build',
  'obj/lib64',
  'obj/bin',
  'app_bin',
  'include'
];

const ERROR_PATTERNS = [
  /fatal error:/i,
  /No such file or directory/i,
  /redefinition of/i,
  /redeclaration of/i,
  /^FAILED:/i,
  /ninja: build stopped/i,
  /subcommand failed/i,
  /undefined reference/i,
  /cannot find/i,
  /\berror:/i
];

function runOverlayCli(args = [], options = {}) {
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  let parsed = { command: args[0] || 'help', json: args.includes('--json') };
  let json = parsed.json;

  try {
    parsed = parseOverlayArgs(args);
    json = parsed.json;
    if (parsed.command === 'help') {
      stdout.write(helpText());
      return 0;
    }

    if (parsed.command === 'pack') {
      const result = packOverlay({ ...parsed, cwd: options.cwd, env: options.env, repoRoot: options.repoRoot });
      writeCliResult(stdout, parsed, result, [
        `overlay pack ${result.status}`,
        `artifact: ${result.artifact_path}`,
        `manifest: ${result.manifest_path}`,
        `inventory: ${result.inventory_path}`,
        `entries: ${result.entries_count}`,
        ''
      ].join('\n'));
      return 0;
    }

    if (parsed.command === 'publish') {
      const result = publishOverlay({ ...parsed, cwd: options.cwd, env: options.env, repoRoot: options.repoRoot });
      writeCliResult(stdout, parsed, result, [
        `overlay publish ${result.status}`,
        `repo: ${result.repo}`,
        `latest: ${result.latest_path}`,
        ''
      ].join('\n'));
      return 0;
    }

    if (parsed.command === 'use') {
      const result = useOverlay({ ...parsed, cwd: options.cwd, env: options.env, repoRoot: options.repoRoot });
      writeCliResult(stdout, parsed, result, [
        `overlay use ${result.status}`,
        `current: ${result.current_path}`,
        `summary: ${result.summary_path}`,
        ''
      ].join('\n'));
      return result.status === 'ready' ? 0 : 6;
    }

    if (parsed.command === 'status') {
      const result = runStatus({ ...parsed, cwd: options.cwd, env: options.env, repoRoot: options.repoRoot });
      writeCliResult(stdout, parsed, result, renderStatusText(result));
      return result.status === 'ready' ? 0 : 3;
    }

    if (parsed.command === 'doctor') {
      const result = runDoctor({ ...parsed, cwd: options.cwd, env: options.env, repoRoot: options.repoRoot });
      writeCliResult(stdout, parsed, result, [
        `overlay doctor ${result.overall_status}`,
        `wrote ${result.output_path}`,
        ''
      ].join('\n'));
      return result.overall_status === 'failed' ? 6 : 0;
    }

    if (parsed.command === 'repair' && parsed.repairCommand === 'paths') {
      const result = repairPaths({ ...parsed, cwd: options.cwd, env: options.env, repoRoot: options.repoRoot });
      writeCliResult(stdout, parsed, result, [
        `overlay repair paths ${result.status}`,
        `text files updated: ${result.text_files_updated}`,
        `symlinks updated: ${result.symlinks_updated}`,
        `remaining old-root references: ${result.remaining_old_root_references}`,
        ''
      ].join('\n'));
      return result.status === 'repaired' || result.status === 'clean' ? 0 : 6;
    }

    if (parsed.command === 'repair' && parsed.repairCommand === 'dpdk') {
      const result = repairDpdk({ ...parsed, cwd: options.cwd, env: options.env, repoRoot: options.repoRoot });
      writeCliResult(stdout, parsed, result, [
        `overlay repair dpdk ${result.status}`,
        `exit_code: ${result.exit_code}`,
        `log: ${result.log_path}`,
        ''
      ].join('\n'));
      return result.exit_code || 0;
    }

    if (parsed.command === 'build') {
      const result = buildModule({ ...parsed, cwd: options.cwd, env: options.env, repoRoot: options.repoRoot });
      writeCliResult(stdout, parsed, result, renderBuildText(result));
      return result.exit_code || 0;
    }

    throw exitError(`unknown overlay command: ${parsed.command}`, 2);
  } catch (error) {
    if (json) {
      stdout.write(`${JSON.stringify({
        schema_version: 1,
        generated_at: core.nowIso(),
        status: 'error',
        command: parsed.command,
        error: error.message,
        exit_code: error.exitCode || 2
      }, null, 2)}\n`);
    } else {
      stderr.write(`ad-build overlay ${parsed.command} failed: ${error.message}\n`);
    }
    return error.exitCode || 2;
  }
}

function packOverlay(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const branch = requiredBranch(options, repoRoot);
  const git = gitInfo(repoRoot, options.env);
  const sourceRoot = resolveRootHint(options.sourceRoot || repoRoot, repoRoot);
  const runId = makeRunId();
  const outDir = options.out ? path.resolve(repoRoot, options.out) : overlayStatePath(options, 'latest');
  const artifactPath = path.join(outDir, 'ad-artifact-overlay.tar.gz');
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-overlay-pack-'));
  const filesRoot = path.join(staging, 'files');
  fs.mkdirSync(filesRoot, { recursive: true });

  const entries = collectPackEntries(repoRoot);
  validatePackReadiness(repoRoot, entries);
  const inventory = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-inventory',
    entries
  };
  const inventorySha = core.digestJson(inventory);
  const manifestBase = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay',
    release: branch,
    source_branch: branch,
    source_commit: git.commit,
    source_root_at_pack_time: normalizeOutputPath(sourceRoot),
    artifact_repo_ssh: DEFAULT_ARTIFACT_REPO_SSH,
    artifact_path: null,
    artifact_sha256: null,
    artifact_size_bytes: 0,
    inventory: 'inventory.json',
    inventory_sha256: inventorySha,
    pack_rules_version: PACK_RULES_VERSION,
    created_at: core.nowIso(),
    created_by_cli_version: packageVersion(),
    entries_count: entries.length
  };

  for (const entry of entries) {
    stageEntry(repoRoot, filesRoot, entry);
  }
  core.writeJson(path.join(staging, 'manifest.json'), manifestBase);
  core.writeJson(path.join(staging, 'inventory.json'), inventory);
  fs.mkdirSync(outDir, { recursive: true });
  runTar(['-czf', artifactPath, '-C', staging, 'manifest.json', 'inventory.json', 'files']);

  const artifactSha = sha256File(artifactPath);
  const artifactSize = fs.statSync(artifactPath).size;
  const manifest = {
    ...manifestBase,
    artifact_sha256: artifactSha,
    artifact_size_bytes: artifactSize
  };
  const summary = {
    schema_version: 1,
    status: 'packed',
    generated_at: core.nowIso(),
    release: branch,
    artifact_path: normalizeOutputPath(artifactPath),
    artifact_sha256: artifactSha,
    artifact_size_bytes: artifactSize,
    manifest_path: normalizeOutputPath(path.join(outDir, 'manifest.json')),
    inventory_path: normalizeOutputPath(path.join(outDir, 'inventory.json')),
    sha256_path: normalizeOutputPath(`${artifactPath}.sha256`),
    entries_count: entries.length,
    source_root_at_pack_time: manifest.source_root_at_pack_time,
    pack_rules_version: PACK_RULES_VERSION,
    warnings: entries.length === 0 ? [{ message: 'no overlay artifact entries were found' }] : []
  };

  core.writeJson(path.join(outDir, 'manifest.json'), manifest);
  core.writeJson(path.join(outDir, 'inventory.json'), inventory);
  core.writeJson(path.join(outDir, 'pack-summary.json'), summary);
  writeText(`${artifactPath}.sha256`, `${artifactSha.replace(/^sha256:/, '')}  ${path.basename(artifactPath)}\n`);
  return summary;
}

function publishOverlay(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const branch = requiredBranch(options, repoRoot);
  const selected = selectPackedOverlay(repoRoot, options);
  const artifactSha = sha256File(selected.artifact);
  if (selected.manifest.artifact_sha256 && selected.manifest.artifact_sha256 !== artifactSha) {
    throw exitError('packed overlay artifact sha256 does not match manifest', 5);
  }

  const artifactRepo = ensureArtifactRepo(repoRoot, options, { forPublish: true });
  const shortSha = core.safeDigestKey(artifactSha).slice(0, 12);
  const releaseDir = path.join(artifactRepo.path, branch);
  const publishDir = path.join(releaseDir, 'artifact-overlay', `sha256-${shortSha}`);
  ensurePublishPathSafe(artifactRepo.path, branch);
  fs.mkdirSync(publishDir, { recursive: true });

  const manifest = {
    ...selected.manifest,
    release: branch,
    source_branch: selected.manifest.source_branch || branch,
    artifact_repo_ssh: artifactRepo.url,
    artifact_path: normalizeOutputPath(path.posix.join(branch, 'artifact-overlay', `sha256-${shortSha}`, 'ad-artifact-overlay.tar.gz')),
    artifact_sha256: artifactSha,
    artifact_size_bytes: fs.statSync(selected.artifact).size,
    inventory: 'inventory.json'
  };
  const latest = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-latest',
    release: branch,
    manifest: normalizeOutputPath(path.posix.join('artifact-overlay', `sha256-${shortSha}`, 'manifest.json')),
    updated_at: core.nowIso()
  };

  fs.copyFileSync(selected.artifact, path.join(publishDir, 'ad-artifact-overlay.tar.gz'));
  core.writeJson(path.join(publishDir, 'manifest.json'), manifest);
  core.writeJson(path.join(publishDir, 'inventory.json'), selected.inventory);
  writeText(path.join(publishDir, 'ad-artifact-overlay.tar.gz.sha256'), `${artifactSha.replace(/^sha256:/, '')}  ad-artifact-overlay.tar.gz\n`);
  writeText(path.join(publishDir, 'README.md'), renderPublishedReadme(manifest));
  core.writeJson(path.join(releaseDir, 'latest-artifact-overlay.json'), latest);

  const summary = {
    schema_version: 1,
    status: 'published',
    generated_at: core.nowIso(),
    repo: artifactRepo.url,
    cache_path: normalizeOutputPath(artifactRepo.path),
    release: branch,
    publish_dir: normalizeOutputPath(path.relative(artifactRepo.path, publishDir)),
    latest_path: normalizeOutputPath(path.relative(artifactRepo.path, path.join(releaseDir, 'latest-artifact-overlay.json'))),
    artifact_sha256: artifactSha,
    pushed: false,
    commit: null
  };

  if (isGitRepo(artifactRepo.path)) {
    gitOk(artifactRepo.path, ['add', '--', branch], options.env);
    ensureLocalGitIdentity(artifactRepo.path, options.env);
    const status = gitOk(artifactRepo.path, ['status', '--porcelain'], options.env).stdout.trim();
    if (!status) {
      summary.status = 'no_changes';
    } else {
      gitOk(artifactRepo.path, ['commit', '-m', `publish artifact overlay for ${branch}`], options.env);
      if (!options.noPush) {
        gitOk(artifactRepo.path, ['push', '-u', 'origin', 'HEAD'], options.env);
        summary.pushed = true;
      }
      summary.commit = gitOk(artifactRepo.path, ['rev-parse', 'HEAD'], options.env).stdout.trim();
    }
  } else {
    summary.status = 'published_local';
  }

  core.writeJson(overlayStatePath(options, 'publish-summary.json'), summary);
  return summary;
}

function useOverlay(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const branch = requiredBranch(options, repoRoot);
  const auth = readAuth(repoRoot, options);
  const localRepoOverride = Boolean(options.repo || options.env?.AD_BUILD_OVERLAY_REPO_PATH);
  if (!localRepoOverride && (!auth || auth.auth_method !== 'ssh')) {
    throw exitError('overlay use requires SSH login; run: ad-build login', 4);
  }

  const artifactRepo = ensureArtifactRepo(repoRoot, options, { forUse: true });
  const releaseDir = path.join(artifactRepo.path, branch);
  const latestPath = path.join(releaseDir, 'latest-artifact-overlay.json');
  if (!fs.existsSync(latestPath)) {
    throw exitError(`latest overlay pointer not found: ${normalizeOutputPath(path.relative(artifactRepo.path, latestPath))}`, 3);
  }
  const latest = core.readJson(latestPath);
  const manifestPath = resolveRepoFile(releaseDir, latest.manifest);
  const manifest = core.readJson(manifestPath);
  const inventoryPath = resolveInventoryPath(manifestPath, manifest);
  const inventory = core.readJson(inventoryPath);
  validateInventory(inventory, manifest);

  const artifactPath = resolveArtifactPath(artifactRepo.path, releaseDir, manifest.artifact_path);
  if (!fs.existsSync(artifactPath)) {
    throw exitError(`overlay artifact not found: ${normalizeOutputPath(path.relative(artifactRepo.path, artifactPath))}`, 3);
  }
  const actualSha = sha256File(artifactPath);
  if (manifest.artifact_sha256 && actualSha !== manifest.artifact_sha256) {
    throw exitError(`overlay artifact sha256 mismatch: expected ${manifest.artifact_sha256}, got ${actualSha}`, 5);
  }

  const currentGit = gitInfo(repoRoot, options.env);
  const drift = sourceDrift(manifest, currentGit, repoRoot, options.env);
  if (drift && !options.allowSourceDrift) {
    throw exitError(`${drift}; pass --allow-source-drift only for diagnostics`, 5);
  }

  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-overlay-use-'));
  validateOverlayArchive(artifactPath, inventory);
  runTar(['-xzf', artifactPath, '-C', staging]);
  const previous = readCurrent(repoRoot, options);
  const conflicts = findRestoreConflicts({ repoRoot, inventory, staging, manifest, previous, force: options.force });
  if (conflicts.length > 0) {
    const conflictsPath = overlayStatePath(options, 'use-conflicts.json');
    core.writeJson(conflictsPath, {
      schema_version: 1,
      generated_at: core.nowIso(),
      conflicts
    });
    throw exitError(`overlay use would overwrite ${conflicts.length} local paths; inspect ${normalizeOutputPath(conflictsPath)}`, 5);
  }

  const restored = restoreInventoryEntries({ repoRoot, inventory, staging, manifest, force: options.force });
  const relocation = relocateInventoryEntries({
    repoRoot,
    entries: inventory.entries || [],
    oldRoot: manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT,
    newRoot: repoRoot
  });

  const current = {
    schema_version: 1,
    kind: 'ad-build-artifact-overlay-current',
    generated_at: core.nowIso(),
    release: branch,
    repo: artifactRepo.url,
    cache_path: normalizeOutputPath(artifactRepo.path),
    manifest,
    inventory,
    artifact_sha256: actualSha,
    source_drift: drift || null,
    restored
  };
  const currentPath = overlayStatePath(options, 'current.json');
  const summaryPath = overlayStatePath(options, 'use-summary.json');
  core.writeJson(currentPath, current);
  const doctor = buildDoctorResult({ repoRoot, env: options.env, current, stateOptions: options });
  const summary = {
    schema_version: 1,
    status: doctor.overall_status === 'failed' ? 'not_ready' : 'ready',
    generated_at: core.nowIso(),
    release: branch,
    current_path: normalizeOutputPath(currentPath),
    summary_path: normalizeOutputPath(summaryPath),
    artifact_sha256: actualSha,
    restored_count: restored.restored_count,
    text_files_relocated: relocation.text_files_updated,
    symlinks_relocated: relocation.symlinks_updated,
    doctor_status: doctor.overall_status,
    warnings: [
      ...(drift ? [{ message: drift }] : []),
      ...doctor.warnings
    ]
  };
  core.writeJson(summaryPath, summary);
  core.writeJson(overlayStatePath(options, 'doctor.json'), doctor);
  return summary;
}

function runStatus(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const currentPath = overlayStatePath(options, 'current.json');
  const summaryPath = overlayStatePath(options, 'use-summary.json');
  const auth = readAuth(repoRoot, options);
  const current = readCurrent(repoRoot, options);
  const summary = readOptionalJson(summaryPath);
  return {
    schema_version: 1,
    generated_at: core.nowIso(),
    status: summary?.status || (current ? 'unknown' : 'not_used'),
    auth_method: auth?.auth_method || null,
    auth_status: auth?.status || null,
    release: current?.release || null,
    artifact_sha256: current?.artifact_sha256 || null,
    current_path: fs.existsSync(currentPath) ? normalizeOutputPath(currentPath) : null,
    use_summary_path: fs.existsSync(summaryPath) ? normalizeOutputPath(summaryPath) : null,
    suggested_next_command: summary?.status === 'ready' ? 'ad-build overlay build appd' : 'ad-build overlay use --branch <release>'
  };
}

function runDoctor(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const result = buildDoctorResult({ repoRoot, env: options.env, stateOptions: options });
  const outputPath = overlayStatePath(options, 'doctor.json');
  core.writeJson(outputPath, result);
  return {
    ...result,
    output_path: normalizeOutputPath(outputPath)
  };
}

function repairPaths(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const current = requireCurrent(repoRoot, options);
  const oldRoot = current.manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT;
  const relocation = relocateInventoryEntries({
    repoRoot,
    entries: current.inventory.entries || [],
    oldRoot,
    newRoot: repoRoot
  });
  const remaining = scanOldRootReferences({
    repoRoot,
    entries: current.inventory.entries || [],
    oldRoot
  });
  const dangling = findDanglingSymlinks({ repoRoot, entries: current.inventory.entries || [] });
  const result = {
    schema_version: 1,
    status: remaining.count === 0 && dangling.count === 0 ? (relocation.changed ? 'repaired' : 'clean') : 'needs_attention',
    generated_at: core.nowIso(),
    old_root: oldRoot,
    new_root: normalizeOutputPath(repoRoot),
    text_files_updated: relocation.text_files_updated,
    symlinks_updated: relocation.symlinks_updated,
    remaining_old_root_references: remaining.count,
    remaining_samples: remaining.samples,
    dangling_symlinks: dangling.count,
    dangling_samples: dangling.samples
  };
  core.writeJson(overlayStatePath(options, 'repair-paths.json'), result);
  return result;
}

function repairDpdk(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const runDir = makeRunDir(repoRoot, 'repair-dpdk', options);
  const dpdkRoot = path.join(repoRoot, 'apps/ad_appd_new/libs/dpdk');
  if (!fs.existsSync(dpdkRoot) || !fs.lstatSync(dpdkRoot).isDirectory()) {
    throw exitError('DPDK directory not found: apps/ad_appd_new/libs/dpdk', 3);
  }

  const deleted = [];
  for (const rel of [
    'apps/ad_appd_new/libs/dpdk/dpdk-stable-20.11.5/build',
    'apps/ad_appd_new/libs/dpdk/tmp_install'
  ]) {
    const target = path.join(repoRoot, rel);
    assertInside(repoRoot, target, 'repair dpdk target');
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      deleted.push(rel);
    }
  }

  const env = {
    ...process.env,
    ...(options.env || {}),
    PREFIX_SOURCE: repoRoot
  };
  const result = spawnBuildCommand('make', ['V=1', 'VERBOSE=1'], {
    cwd: dpdkRoot,
    env,
    encoding: 'utf8',
    maxBuffer: LOG_MAX_BUFFER
  });
  const logPath = path.join(runDir, 'repair-dpdk.log');
  writeText(logPath, commandLog('make V=1 VERBOSE=1', dpdkRoot, result));
  const headerPath = path.join(repoRoot, 'libs/rdma-core-2404mlnx51/build/include/infiniband/mlx5dv.h');
  const summary = {
    schema_version: 1,
    status: result.status === 0 && fs.existsSync(headerPath) ? 'passed' : 'failed',
    generated_at: core.nowIso(),
    deleted,
    cwd: normalizeOutputPath(path.relative(repoRoot, dpdkRoot)),
    prefix_source: normalizeOutputPath(repoRoot),
    pkg_config_path: env.PKG_CONFIG_PATH || null,
    rdma_header: normalizeOutputPath(path.relative(repoRoot, headerPath)),
    rdma_header_found: fs.existsSync(headerPath),
    exit_code: result.status ?? 2,
    log_path: normalizeOutputPath(logPath),
    first_real_error: extractFirstRealError([{ path: logPath, label: normalizeOutputPath(logPath) }])
  };
  core.writeJson(path.join(runDir, 'repair-dpdk-summary.json'), summary);
  return summary;
}

function buildModule(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const moduleName = options.moduleName;
  if (!moduleName) {
    throw exitError('overlay build requires a module name, for example: ad-build overlay build appd', 2);
  }
  const moduleEntry = MODULES[moduleName];
  if (!moduleEntry) {
    throw exitError(`unknown overlay module: ${moduleName}; available modules: ${Object.keys(MODULES).join(', ')}`, 2);
  }
  if (!options.allowWithoutReady) {
    const summary = readOptionalJson(overlayStatePath(options, 'use-summary.json'));
    if (!summary || summary.status !== 'ready') {
      throw exitError('overlay is not ready; run: ad-build overlay use --branch <release>', 6);
    }
  }

  const moduleDir = path.join(repoRoot, moduleEntry.dir);
  if (!fs.existsSync(moduleDir) || !fs.lstatSync(moduleDir).isDirectory()) {
    throw exitError(`module directory not found: ${moduleEntry.dir}`, 3);
  }

  const runDir = makeRunDir(repoRoot, `build-${moduleName}`, options);
  const env = {
    ...process.env,
    ...(options.env || {}),
    PREFIX_SOURCE: repoRoot
  };
  const startedAt = Date.now();
  const result = spawnBuildCommand(moduleEntry.command[0], moduleEntry.command.slice(1), {
    cwd: moduleDir,
    env,
    encoding: 'utf8',
    maxBuffer: LOG_MAX_BUFFER
  });
  const durationMs = Date.now() - startedAt;
  const logPath = path.join(runDir, 'build.log');
  writeText(logPath, commandLog(moduleEntry.command.join(' '), moduleDir, result));

  const childLogs = collectChildLogs(moduleDir, repoRoot, runDir);
  const firstRealError = extractFirstRealError([
    { path: logPath, label: normalizeOutputPath(path.relative(repoRoot, logPath)) },
    ...childLogs.map((item) => ({ path: item.copied_path, label: item.log_path }))
  ]);
  const exitCode = result.status ?? 2;
  const summary = {
    schema_version: 1,
    status: exitCode === 0 ? 'passed' : 'failed',
    generated_at: core.nowIso(),
    module: moduleName,
    module_dir: moduleEntry.dir,
    command: moduleEntry.command,
    top_make_exit_code: exitCode,
    exit_code: exitCode,
    prefix_source: normalizeOutputPath(repoRoot),
    duration_ms: durationMs,
    log_path: normalizeOutputPath(logPath),
    child_logs: childLogs.map((item) => item.log_path),
    first_real_error: firstRealError,
    first_real_error_source: firstRealError?.source_file || null,
    error_log_path: firstRealError?.source_file || normalizeOutputPath(logPath),
    suggested_next_command: exitCode === 0 ? null : suggestNextCommand(firstRealError, moduleName)
  };
  core.writeJson(path.join(runDir, 'build-summary.json'), summary);
  core.writeJson(overlayStatePath(options, 'last-build-summary.json'), summary);
  return summary;
}

function buildDoctorResult(options = {}) {
  const repoRoot = options.repoRoot;
  const stateOptions = options.stateOptions || options;
  const auth = readAuth(repoRoot, stateOptions);
  const current = options.current || readCurrent(repoRoot, stateOptions);
  const useSummary = readOptionalJson(overlayStatePath(stateOptions, 'use-summary.json'));
  const checks = [];
  const warnings = [];

  checks.push(auth?.auth_method === 'ssh'
    ? check('overlay_auth', 'passed', 'SSH overlay auth is configured')
    : check('overlay_auth', 'warning', 'SSH overlay auth is not configured; run: ad-build login'));

  checks.push(current
    ? check('current_overlay', 'passed', 'overlay current manifest is present')
    : check('current_overlay', 'failed', 'overlay current manifest is missing; run: ad-build overlay use --branch <release>'));

  if (useSummary) {
    checks.push(useSummary.status === 'ready'
      ? check('use_summary_ready', 'passed', 'overlay use-summary status is ready')
      : check('use_summary_ready', 'failed', `overlay use-summary status is ${useSummary.status}`));
  } else if (current) {
    checks.push(check('use_summary_ready', 'warning', 'overlay use-summary is missing'));
  }

  if (current) {
    const oldRoot = current.manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT;
    const refs = scanOldRootReferences({ repoRoot, entries: current.inventory.entries || [], oldRoot });
    const dangling = findDanglingSymlinks({ repoRoot, entries: current.inventory.entries || [] });
    checks.push(refs.count === 0
      ? check('old_root_references', 'passed', `no ${oldRoot} references remain in overlay-managed text or symlink entries`)
      : check('old_root_references', 'failed', `${refs.count} old-root references remain`, { samples: refs.samples }));
    checks.push(dangling.count === 0
      ? check('dangling_symlinks', 'passed', 'no dangling overlay-managed symlinks were found')
      : check('dangling_symlinks', 'failed', `${dangling.count} dangling overlay-managed symlinks were found`, { samples: dangling.samples }));

    for (const required of APPD_REQUIRED_PATHS) {
      const exists = fs.existsSync(path.join(repoRoot, required));
      const item = exists
        ? check(`required_path:${required}`, 'passed', `${required} exists`)
        : check(`required_path:${required}`, 'failed', `${required} is missing; overlay is not ready for appd`);
      checks.push(item);
    }
  }

  for (const item of checks) {
    if (item.status === 'warning') {
      warnings.push({ name: item.name, message: item.message });
    }
  }
  return {
    schema_version: 1,
    generated_at: core.nowIso(),
    overall_status: overallStatus(checks),
    repo_root: normalizeOutputPath(repoRoot),
    checks,
    warnings,
    errors: checks.filter((item) => item.status === 'failed').map((item) => ({ name: item.name, message: item.message }))
  };
}

function collectPackEntries(repoRoot) {
  const status = gitStatusMap(repoRoot);
  const seen = new Set();
  const entries = [];
  for (const start of collectScanStarts(repoRoot)) {
    walk(start.full, repoRoot, (full, rel, stat) => {
      if (seen.has(rel) || shouldExclude(rel)) {
        return;
      }
      seen.add(rel);
      if (!shouldIncludePackEntry(rel, stat, status.get(rel))) {
        return;
      }
      entries.push(buildInventoryEntry(full, rel, stat, status.get(rel)));
    });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return entries;
}

function collectScanStarts(repoRoot) {
  const starts = [];
  for (const rel of SCAN_ROOTS) {
    const full = path.join(repoRoot, rel);
    if (fs.existsSync(full)) {
      starts.push({ rel, full });
    }
  }
  for (const rel of SCAN_FILES) {
    const full = path.join(repoRoot, rel);
    if (fs.existsSync(full)) {
      starts.push({ rel, full });
    }
  }
  if (fs.existsSync(repoRoot)) {
    for (const name of fs.readdirSync(repoRoot)) {
      if (/^(Makefile.*|app.*\.mk)$/.test(name)) {
        starts.push({ rel: name, full: path.join(repoRoot, name) });
      }
    }
  }
  return starts;
}

function walk(full, repoRoot, visit) {
  const rel = normalizeOutputPath(path.relative(repoRoot, full));
  if (!rel || shouldExclude(rel)) {
    return;
  }
  const stat = fs.lstatSync(full);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(full)) {
      walk(path.join(full, entry), repoRoot, visit);
    }
    return;
  }
  if (stat.isFile() || stat.isSymbolicLink()) {
    visit(full, rel, stat);
  }
}

function shouldIncludePackEntry(rel, stat, gitStatus) {
  if (stat.isSymbolicLink()) {
    return true;
  }
  const first = rel.split('/')[0];
  if (TRUSTED_WHOLE_ROOTS.has(first)) {
    return true;
  }
  if (rel.startsWith('include/')) {
    return isHeaderOrBuildMetadata(rel);
  }
  if (isBuildOutputPath(rel) || isBuildMetadataPath(rel) || isArtifactExtension(rel)) {
    return true;
  }
  if (gitStatus && gitStatus !== '??' && !looksLikeSourceOnly(rel)) {
    return true;
  }
  if (gitStatus === '??' && (isArtifactExtension(rel) || isBuildMetadataPath(rel))) {
    return true;
  }
  return false;
}

function buildInventoryEntry(full, rel, stat, gitStatus) {
  if (stat.isSymbolicLink()) {
    return {
      path: rel,
      type: 'symlink',
      entry_type: 'symlink',
      sha256: null,
      size: null,
      mode: modeString(stat),
      link_target: fs.readlinkSync(full),
      git_status: gitStatus || null,
      relocatable: true
    };
  }
  return {
    path: rel,
    type: 'file',
    entry_type: classifyEntry(rel, gitStatus),
    sha256: sha256File(full),
    size: stat.size,
    mode: modeString(stat),
    link_target: null,
    git_status: gitStatus || null,
    relocatable: shouldRelocateTextEntry(rel, classifyEntry(rel, gitStatus))
  };
}

function stageEntry(repoRoot, filesRoot, entry) {
  const source = path.join(repoRoot, entry.path);
  const target = path.join(filesRoot, entry.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (entry.type === 'symlink') {
    fs.symlinkSync(entry.link_target || fs.readlinkSync(source), target);
    return;
  }
  fs.copyFileSync(source, target);
  if (entry.mode) {
    try {
      fs.chmodSync(target, parseInt(entry.mode, 8));
    } catch {
      /* chmod is best-effort on Windows and some mounted filesystems. */
    }
  }
}

function restoreInventoryEntries({ repoRoot, inventory, staging, manifest, force }) {
  let restoredCount = 0;
  let overwrittenCount = 0;
  for (const entry of inventory.entries || []) {
    safePath(entry.path);
    const target = path.join(repoRoot, entry.path);
    const source = path.join(staging, 'files', entry.path);
    ensureDestinationSafe(repoRoot, entry.path);
    if (fs.existsSync(target)) {
      overwrittenCount += 1;
      fs.rmSync(target, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (entry.type === 'symlink') {
      const linkTarget = relocatePath(entry.link_target || fs.readlinkSync(source), manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT, repoRoot);
      fs.symlinkSync(linkTarget, target);
    } else {
      if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) {
        throw exitError(`overlay artifact is missing entry payload: ${entry.path}`, 5);
      }
      fs.copyFileSync(source, target);
      if (entry.sha256) {
        const actual = sha256File(target);
        if (actual !== entry.sha256) {
          throw exitError(`restored entry sha256 mismatch: ${entry.path}`, 5);
        }
      }
      if (entry.mode) {
        try {
          fs.chmodSync(target, parseInt(entry.mode, 8));
        } catch {
          /* best effort */
        }
      }
    }
    restoredCount += 1;
  }
  return { restored_count: restoredCount, overwritten_count: overwrittenCount, force: Boolean(force) };
}

function findRestoreConflicts({ repoRoot, inventory, manifest, previous, force }) {
  if (force) {
    return [];
  }
  const previousEntries = new Map((previous?.inventory?.entries || []).map((entry) => [entry.path, entry]));
  const status = gitStatusMap(repoRoot);
  const oldRoot = manifest?.source_root_at_pack_time || DEFAULT_SOURCE_ROOT;
  const previousOldRoot = previous?.manifest?.source_root_at_pack_time || oldRoot;
  const conflicts = [];
  for (const entry of inventory.entries || []) {
    safePath(entry.path);
    const target = path.join(repoRoot, entry.path);
    if (!fs.existsSync(target)) {
      continue;
    }
    if (targetMatchesEntry(target, entry, { repoRoot, oldRoot })) {
      continue;
    }
    const previousEntry = previousEntries.get(entry.path);
    if (previousEntry && targetMatchesEntry(target, previousEntry, { repoRoot, oldRoot: previousOldRoot })) {
      continue;
    }
    const gitStatus = status.get(entry.path);
    if (gitStatus) {
      conflicts.push({ path: entry.path, reason: `git status ${gitStatus}` });
      continue;
    }
    conflicts.push({ path: entry.path, reason: 'existing path is not managed by the current overlay' });
  }
  return conflicts;
}

function targetMatchesEntry(target, entry, context = {}) {
  try {
    const stat = fs.lstatSync(target);
    if (entry.type === 'symlink') {
      if (!stat.isSymbolicLink()) {
        return false;
      }
      const current = fs.readlinkSync(target);
      const original = entry.link_target || '';
      const relocated = context.oldRoot && context.repoRoot
        ? relocatePath(original, context.oldRoot, context.repoRoot)
        : original;
      return current === original || current === relocated;
    }
    if (!stat.isFile() || !entry.sha256) {
      return false;
    }
    if (sha256File(target) === entry.sha256) {
      return true;
    }
    if (!entry.relocatable || !context.oldRoot || !context.repoRoot || !isProbablyTextFile(target)) {
      return false;
    }
    const currentText = fs.readFileSync(target, 'utf8');
    const originalRootText = currentText.split(normalizeOutputPath(context.repoRoot)).join(context.oldRoot);
    const originalRootDigest = `sha256:${crypto.createHash('sha256').update(originalRootText).digest('hex')}`;
    return originalRootDigest === entry.sha256;
  } catch {
    return false;
  }
}

function relocateInventoryEntries({ repoRoot, entries, oldRoot, newRoot }) {
  let textFilesUpdated = 0;
  let symlinksUpdated = 0;
  for (const entry of entries) {
    const target = path.join(repoRoot, entry.path);
    if (!fs.existsSync(target)) {
      continue;
    }
    if (entry.type === 'symlink') {
      const current = fs.readlinkSync(target);
      const relocated = relocatePath(current, oldRoot, newRoot);
      if (current !== relocated) {
        fs.rmSync(target, { force: true });
        fs.symlinkSync(relocated, target);
        symlinksUpdated += 1;
      }
      continue;
    }
    if (!shouldRelocateTextEntry(entry.path, entry.entry_type) || !isProbablyTextFile(target)) {
      continue;
    }
    const text = fs.readFileSync(target, 'utf8');
    if (!text.includes(oldRoot)) {
      continue;
    }
    fs.writeFileSync(target, text.split(oldRoot).join(normalizeOutputPath(newRoot)));
    textFilesUpdated += 1;
  }
  return {
    changed: textFilesUpdated > 0 || symlinksUpdated > 0,
    text_files_updated: textFilesUpdated,
    symlinks_updated: symlinksUpdated
  };
}

function scanOldRootReferences({ repoRoot, entries, oldRoot }) {
  const samples = [];
  let count = 0;
  for (const entry of entries) {
    const target = path.join(repoRoot, entry.path);
    if (!fs.existsSync(target)) {
      continue;
    }
    if (entry.type === 'symlink') {
      const linkTarget = fs.readlinkSync(target);
      if (linkTarget.includes(oldRoot)) {
        count += 1;
        if (samples.length < 20) {
          samples.push({ path: entry.path, type: 'symlink', value: linkTarget });
        }
      }
      continue;
    }
    if (!shouldRelocateTextEntry(entry.path, entry.entry_type) || !isProbablyTextFile(target)) {
      continue;
    }
    const text = fs.readFileSync(target, 'utf8');
    const index = text.indexOf(oldRoot);
    if (index !== -1) {
      count += 1;
      if (samples.length < 20) {
        samples.push({ path: entry.path, type: 'text', offset: index });
      }
    }
  }
  return { count, samples };
}

function findDanglingSymlinks({ repoRoot, entries }) {
  const samples = [];
  let count = 0;
  for (const entry of entries) {
    if (entry.type !== 'symlink') {
      continue;
    }
    const linkPath = path.join(repoRoot, entry.path);
    if (!fs.existsSync(linkPath) && !isSymlink(linkPath)) {
      continue;
    }
    let target;
    try {
      target = fs.readlinkSync(linkPath);
    } catch {
      continue;
    }
    const resolved = path.isAbsolute(target) ? target : path.resolve(path.dirname(linkPath), target);
    if (!fs.existsSync(resolved)) {
      count += 1;
      if (samples.length < 20) {
        samples.push({ path: entry.path, target });
      }
    }
  }
  return { count, samples };
}

function collectChildLogs(moduleDir, repoRoot, runDir) {
  const found = [];
  walkLogs(moduleDir, repoRoot, found, 0);
  return found.slice(0, 100).map((log) => {
    const digest = crypto.createHash('sha1').update(log.full).digest('hex').slice(0, 12);
    const copied = path.join(runDir, `child-${digest}-${path.basename(log.full)}`);
    fs.copyFileSync(log.full, copied);
    return {
      log_path: normalizeOutputPath(log.rel),
      copied_path: copied
    };
  });
}

function walkLogs(full, repoRoot, found, depth) {
  if (depth > 8 || found.length > 200 || !fs.existsSync(full)) {
    return;
  }
  const entries = fs.readdirSync(full, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }
    const child = path.join(full, entry.name);
    if (entry.isDirectory()) {
      walkLogs(child, repoRoot, found, depth + 1);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const rel = normalizeOutputPath(path.relative(repoRoot, child));
    if (entry.name === 'log3party.log' || entry.name === 'meson-log.txt' || entry.name === '.ninja_log' || /\.log$/i.test(entry.name)) {
      found.push({ full: child, rel });
    }
  }
}

function extractFirstRealError(logs) {
  for (const log of logs) {
    if (!fs.existsSync(log.path) || !isProbablyTextFile(log.path)) {
      continue;
    }
    const lines = fs.readFileSync(log.path, 'utf8').split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const pattern = ERROR_PATTERNS.find((item) => item.test(line));
      if (!pattern) {
        continue;
      }
      return {
        source_file: log.label,
        line: index + 1,
        matched_pattern: pattern.source,
        message: line,
        context_before: lines.slice(Math.max(0, index - 5), index),
        context_after: lines.slice(index + 1, index + 6)
      };
    }
  }
  return null;
}

function selectPackedOverlay(repoRoot, options) {
  const artifact = options.overlay
    ? path.resolve(repoRoot, options.overlay)
    : overlayStatePath(options, 'latest', 'ad-artifact-overlay.tar.gz');
  const manifestPath = path.resolve(repoRoot, options.manifest || path.join(path.dirname(artifact), 'manifest.json'));
  const inventoryPath = path.resolve(repoRoot, options.inventory || path.join(path.dirname(artifact), 'inventory.json'));
  if (!fs.existsSync(artifact)) {
    throw exitError(`packed overlay artifact not found: ${normalizeOutputPath(artifact)}`, 3);
  }
  if (!fs.existsSync(manifestPath)) {
    throw exitError(`overlay manifest not found: ${normalizeOutputPath(manifestPath)}`, 3);
  }
  if (!fs.existsSync(inventoryPath)) {
    throw exitError(`overlay inventory not found: ${normalizeOutputPath(inventoryPath)}`, 3);
  }
  const manifest = core.readJson(manifestPath);
  const inventory = core.readJson(inventoryPath);
  validateInventory(inventory, manifest);
  return { artifact, manifest, inventory };
}

function ensureArtifactRepo(repoRoot, options = {}, mode = {}) {
  const env = options.env || process.env;
  const localRepo = options.repo || env.AD_BUILD_OVERLAY_REPO_PATH;
  if (localRepo) {
    const full = path.resolve(repoRoot, localRepo);
    fs.mkdirSync(full, { recursive: true });
    return { path: full, url: normalizeOutputPath(full), local: true };
  }

  const repoUrl = options.repoUrl || env.AD_BUILD_OVERLAY_REPO_SSH || DEFAULT_ARTIFACT_REPO_SSH;
  const cachePath = statePath(options, CACHE_REPO_SUBDIR);
  const root = stateRoot(options);
  ensureManagedCachePathSafe(root, cachePath);
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    const clone = spawnSync('git', ['clone', repoUrl, cachePath], {
      cwd: repoRoot,
      env: gitEnv(env),
      encoding: 'utf8',
      maxBuffer: GIT_MAX_BUFFER
    });
    if (clone.error || clone.status !== 0) {
      throw exitError(`git clone artifact overlay repo failed: ${gitFailure(clone)}`, 4);
    }
  } else if (isGitRepo(cachePath)) {
    gitOk(cachePath, ['pull', '--ff-only'], env);
  } else if (mode.forUse || mode.forPublish) {
    throw exitError(`artifact overlay cache is not a git repository: ${normalizeOutputPath(cachePath)}`, 4);
  }
  return { path: cachePath, url: repoUrl, local: false };
}

function parseOverlayArgs(args) {
  let command = args[0] || 'help';
  if (command === '-h' || command === '--help') {
    command = 'help';
  }
  const parsed = {
    command,
    repairCommand: null,
    moduleName: null,
    branch: null,
    sourceRoot: null,
    adRoot: null,
    out: null,
    overlay: null,
    manifest: null,
    inventory: null,
    repo: null,
    repoUrl: null,
    json: false,
    force: false,
    allowSourceDrift: false,
    allowWithoutReady: false,
    noPush: false
  };

  let rest = args.slice(1);
  if (command === 'repair') {
    parsed.repairCommand = rest[0] || 'help';
    rest = rest.slice(1);
    if (parsed.repairCommand === 'help' || parsed.repairCommand === '-h' || parsed.repairCommand === '--help') {
      parsed.command = 'help';
      return parsed;
    }
  }
  if (command === 'build') {
    parsed.moduleName = rest[0];
    rest = rest.slice(1);
  }

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--force') {
      parsed.force = true;
    } else if (arg === '--allow-source-drift') {
      parsed.allowSourceDrift = true;
    } else if (arg === '--no-push') {
      parsed.noPush = true;
    } else if (arg === '--branch') {
      parsed.branch = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '--source-root') {
      parsed.sourceRoot = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '--ad-root' || arg === '--workdir') {
      parsed.adRoot = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '--out') {
      parsed.out = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '--overlay') {
      parsed.overlay = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '--manifest') {
      parsed.manifest = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '--inventory') {
      parsed.inventory = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '--repo') {
      parsed.repo = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '--repo-url') {
      parsed.repoUrl = requiredOption(rest, index, arg);
      index += 1;
    } else if (arg === '-h' || arg === '--help') {
      parsed.command = 'help';
    } else {
      throw exitError(`unknown overlay option: ${arg}`, 2);
    }
  }
  return parsed;
}

function helpText() {
  return [
    'ad-build overlay',
    'Usage:',
    '  ad-build overlay pack --branch <release> [--out <dir>]',
    '  ad-build overlay publish --branch <release> [--overlay <tar.gz>]',
    '  ad-build overlay use --branch <release>',
    '  ad-build overlay status',
    '  ad-build overlay doctor',
    '  ad-build overlay repair paths',
    '  ad-build overlay repair dpdk',
    '  ad-build overlay build appd',
    '',
    'The overlay flow uses the SSH artifact repository by default:',
    `  ${DEFAULT_ARTIFACT_REPO_SSH}`,
    '',
    'Diagnostic options:',
    '  --json                 Print machine-readable output',
    '  --allow-source-drift   Allow use across source commits for diagnostics',
    ''
  ].join('\n');
}

function requiredOption(args, index, name) {
  if (!args[index + 1]) {
    throw exitError(`${name} requires a value`, 2);
  }
  return args[index + 1];
}

function requiredBranch(options, repoRoot) {
  const branch = options.branch || options.env?.AD_BUILD_OVERLAY_BRANCH || gitInfo(repoRoot, options.env).branch;
  if (!branch) {
    throw exitError('--branch is required when the current git branch cannot be detected', 2);
  }
  validateBranch(branch);
  return normalizeOutputPath(branch);
}

function validateBranch(branch) {
  safePath(branch);
  if (branch.startsWith('.') || branch.endsWith('.') || branch.includes('//')) {
    throw exitError(`invalid overlay branch: ${branch}`, 2);
  }
  if (branch.startsWith('-') || branch.split('/').some((part) => !part || part.startsWith('.') || part.startsWith('-') || part.endsWith('.') || part.endsWith('.lock'))) {
    throw exitError(`invalid overlay branch: ${branch}`, 2);
  }
  if (branch.includes('@{') || /[~^:?*[\]\s\\]/.test(branch)) {
    throw exitError(`invalid overlay branch: ${branch}`, 2);
  }
  if (branch === 'HEAD' || branch.startsWith('refs/') || branch.startsWith('.git/')) {
    throw exitError(`invalid overlay branch: ${branch}`, 2);
  }
}

function resolveRepoRoot(options = {}) {
  if (options.adRoot) {
    return path.resolve(options.cwd || process.cwd(), options.adRoot);
  }
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

function gitInfo(repoRoot, env) {
  const commit = git(repoRoot, ['rev-parse', 'HEAD'], env);
  const branch = git(repoRoot, ['branch', '--show-current'], env);
  const ref = git(repoRoot, ['symbolic-ref', '-q', 'HEAD'], env);
  return {
    commit: commit.status === 0 ? trim(commit.stdout) || null : null,
    branch: branch.status === 0 ? trim(branch.stdout) || null : null,
    ref: ref.status === 0 ? trim(ref.stdout) || null : null
  };
}

function gitStatusMap(repoRoot) {
  const result = git(repoRoot, ['status', '--porcelain', '-z', '--untracked-files=all']);
  const map = new Map();
  if (result.error || result.status !== 0) {
    return map;
  }
  const fields = String(result.stdout || '').split('\0').filter(Boolean);
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const code = field.slice(0, 2);
    const file = normalizeOutputPath(field.slice(3));
    if (!file) {
      continue;
    }
    map.set(file, code.trim() || code);
    if (code[0] === 'R' || code[0] === 'C') {
      index += 1;
    }
  }
  return map;
}

function git(repoRoot, args, env) {
  return spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER,
    env: gitEnv(env)
  });
}

function gitOk(repoRoot, args, env) {
  const result = git(repoRoot, args, env);
  if (result.error || result.status !== 0) {
    throw exitError(`git ${args[0]} failed: ${gitFailure(result)}`, 4);
  }
  return result;
}

function gitEnv(env = {}) {
  return {
    ...process.env,
    ...(env || {}),
    GIT_TERMINAL_PROMPT: '0'
  };
}

function gitFailure(result) {
  return result.error?.message || trim(result.stderr) || trim(result.stdout) || (result.signal ? `signal ${result.signal}` : `exit ${result.status}`);
}

function sourceDrift(manifest, currentGit, repoRoot, env) {
  if (manifest.source_branch && currentGit.branch && manifest.source_branch !== currentGit.branch) {
    return `source branch mismatch: overlay ${manifest.source_branch}, current ${currentGit.branch}`;
  }
  if (manifest.source_commit && currentGit.commit && manifest.source_commit !== currentGit.commit) {
    const ancestor = git(repoRoot, ['merge-base', '--is-ancestor', manifest.source_commit, currentGit.commit], env);
    if (!ancestor.error && ancestor.status === 0) {
      return null;
    }
    return `source commit mismatch: overlay ${manifest.source_commit}, current ${currentGit.commit}`;
  }
  return null;
}

function validateInventory(inventory, manifest) {
  if (!inventory || inventory.kind !== 'ad-build-artifact-overlay-inventory' || !Array.isArray(inventory.entries)) {
    throw exitError('invalid overlay inventory', 5);
  }
  for (const entry of inventory.entries) {
    safePath(entry.path);
    if (!['file', 'symlink'].includes(entry.type)) {
      throw exitError(`invalid overlay inventory entry type for ${entry.path}`, 5);
    }
    if (entry.type === 'file' && entry.sha256 && !/^sha256:[a-f0-9]{64}$/.test(entry.sha256)) {
      throw exitError(`invalid sha256 for overlay entry: ${entry.path}`, 5);
    }
  }
  if (manifest?.inventory_sha256) {
    const actual = core.digestJson(inventory);
    if (actual !== manifest.inventory_sha256) {
      throw exitError(`overlay inventory sha256 mismatch: expected ${manifest.inventory_sha256}, got ${actual}`, 5);
    }
  }
}

function validatePackReadiness(repoRoot, entries) {
  const entryPaths = new Set(entries.map((entry) => entry.path));
  const missing = APPD_REQUIRED_PATHS.filter((required) => {
    const full = path.join(repoRoot, required);
    if (!fs.existsSync(full)) {
      return true;
    }
    if (fs.lstatSync(full).isDirectory()) {
      const prefix = `${normalizeOutputPath(required)}/`;
      return !entries.some((entry) => entry.path.startsWith(prefix));
    }
    return !entryPaths.has(normalizeOutputPath(required));
  });
  if (missing.length > 0) {
    throw exitError(`required appd overlay path is missing or empty: ${missing.join(', ')}`, 5);
  }
}

function validateOverlayArchive(artifactPath, inventory) {
  const allowed = new Set(['manifest.json', 'inventory.json', 'files']);
  for (const entry of inventory.entries || []) {
    safePath(entry.path);
    const parts = normalizeOutputPath(entry.path).split('/');
    for (let index = 1; index <= parts.length; index += 1) {
      allowed.add(`files/${parts.slice(0, index).join('/')}`);
    }
  }

  const list = spawnSync('tar', ['-tzf', artifactPath], {
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER
  });
  if (list.error || list.status !== 0) {
    throw exitError(`tar list failed: ${list.error?.message || trim(list.stderr) || list.status}`, 4);
  }
  for (const raw of String(list.stdout || '').split(/\r?\n/).filter(Boolean)) {
    const member = normalizeOutputPath(raw).replace(/\/+$/, '');
    if (!member || member.startsWith('/') || member.includes('\\') || member.split('/').includes('..')) {
      throw exitError(`unsafe overlay archive member: ${raw}`, 5);
    }
    if (!allowed.has(member)) {
      throw exitError(`overlay archive member is outside inventory: ${raw}`, 5);
    }
  }
}

function resolveRepoFile(releaseDir, relative) {
  if (!relative) {
    throw exitError('latest overlay pointer is missing manifest path', 5);
  }
  safePath(relative);
  const full = path.join(releaseDir, relative);
  assertInside(releaseDir, full, 'overlay repo file');
  if (!fs.existsSync(full)) {
    throw exitError(`overlay repo file not found: ${normalizeOutputPath(path.relative(releaseDir, full))}`, 3);
  }
  return full;
}

function resolveInventoryPath(manifestPath, manifest) {
  const value = manifest.inventory || 'inventory.json';
  safePath(value);
  const full = path.join(path.dirname(manifestPath), value);
  assertInside(path.dirname(manifestPath), full, 'overlay inventory file');
  if (!fs.existsSync(full)) {
    throw exitError(`overlay inventory not found: ${normalizeOutputPath(full)}`, 3);
  }
  return full;
}

function resolveArtifactPath(repoRoot, releaseDir, artifactPath) {
  if (!artifactPath) {
    throw exitError('overlay manifest is missing artifact_path', 5);
  }
  safePath(artifactPath);
  const withRepoRoot = path.join(repoRoot, artifactPath);
  if (fs.existsSync(withRepoRoot)) {
    return withRepoRoot;
  }
  const withReleaseDir = path.join(releaseDir, artifactPath);
  if (fs.existsSync(withReleaseDir)) {
    return withReleaseDir;
  }
  return withRepoRoot;
}

function readAuth(repoRoot, options = {}) {
  return readOptionalJson(overlayStatePath(options, 'auth.json'));
}

function readCurrent(repoRoot, options = {}) {
  return readOptionalJson(overlayStatePath(options, 'current.json'));
}

function requireCurrent(repoRoot, options = {}) {
  const current = readCurrent(repoRoot, options);
  if (!current) {
    throw exitError('overlay current state is missing; run: ad-build overlay use --branch <release>', 3);
  }
  return current;
}

function readOptionalJson(file) {
  try {
    return fs.existsSync(file) ? core.readJson(file) : null;
  } catch {
    return null;
  }
}

function shouldExclude(rel) {
  const normalized = normalizeOutputPath(rel);
  if (EXCLUDED_ROOTS.has(normalized)) {
    return true;
  }
  return EXCLUDED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function isBuildOutputPath(rel) {
  return /(^|\/)(build|tmp_install|meson-private|meson-logs|CMakeFiles|\.deps|\.libs)(\/|$)/.test(rel);
}

function isBuildMetadataPath(rel) {
  const base = path.posix.basename(rel);
  return [
    'CMakeCache.txt',
    'build.ninja',
    'compile_commands.json',
    'install_manifest.txt',
    'meson-info.json',
    'meson-log.txt',
    '.ninja_log'
  ].includes(base) || /\.(pc|cmake|ninja|deps|mk|mak|d|cmd|json)$/i.test(base);
}

function isHeaderOrBuildMetadata(rel) {
  return /\.(h|hpp|hh|inc)$/i.test(rel) || isBuildMetadataPath(rel);
}

function isArtifactExtension(rel) {
  return /\.(o|lo|a|so|so\.[0-9A-Za-z_.-]+|ko|mod|mod\.c|symvers|order|map|bin|elf|img|dat)$/i.test(rel);
}

function looksLikeSourceOnly(rel) {
  return /\.(c|cc|cpp|cxx|py|pl|pm|java|go|rs|ts|tsx|js|jsx|vue|md|rst)$/i.test(rel);
}

function classifyEntry(rel, gitStatus) {
  if (rel.startsWith('obj/') || rel.startsWith('app_bin/') || isArtifactExtension(rel)) {
    return 'generated_artifact';
  }
  if (isHeaderOrBuildMetadata(rel) && /\.(h|hpp|hh|inc)$/i.test(rel)) {
    return 'generated_header';
  }
  if (isBuildMetadataPath(rel) || isBuildOutputPath(rel)) {
    return 'build_metadata';
  }
  if (gitStatus && gitStatus !== '??') {
    return 'tracked_build_side_effect';
  }
  return 'unknown_artifact';
}

function shouldRelocateTextEntry(rel, entryType) {
  return ['build_metadata', 'tracked_build_side_effect', 'unknown_artifact'].includes(entryType)
    || /\.(pc|cmake|ninja|json|txt|mk|mak|sh|env|d|cmd)$/i.test(rel)
    || /(^|\/)(CMakeCache\.txt|compile_commands\.json|build\.ninja)$/.test(rel);
}

function isProbablyTextFile(file) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > 50 * 1024 * 1024) {
      return false;
    }
    const fd = fs.openSync(file, 'r');
    const length = Math.min(4096, stat.size);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, 0);
    fs.closeSync(fd);
    return !buffer.includes(0);
  } catch {
    return false;
  }
}

function relocatePath(value, oldRoot, newRoot) {
  return String(value || '').split(oldRoot).join(normalizeOutputPath(newRoot));
}

function safePath(file) {
  const value = normalizeOutputPath(file);
  if (!value || value.startsWith('/') || path.win32.isAbsolute(file) || value.split('/').includes('..')) {
    throw exitError(`unsafe overlay path: ${file}`, 5);
  }
}

function ensureDestinationSafe(repoRoot, relativePath) {
  safePath(relativePath);
  const target = path.join(repoRoot, relativePath);
  assertInside(repoRoot, target, 'overlay restore target');
  let current = repoRoot;
  const parts = normalizeOutputPath(path.dirname(relativePath)).split('/').filter(Boolean);
  for (const part of parts) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) {
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw exitError(`overlay restore parent path is a symlink: ${normalizeOutputPath(path.relative(repoRoot, current))}`, 5);
    }
    if (!stat.isDirectory()) {
      throw exitError(`overlay restore parent path is not a directory: ${normalizeOutputPath(path.relative(repoRoot, current))}`, 5);
    }
  }
}

function ensurePublishPathSafe(root, relativePath) {
  safePath(relativePath);
  let current = root;
  for (const part of normalizeOutputPath(relativePath).split('/')) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) {
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw exitError(`overlay publish path contains symlink: ${normalizeOutputPath(path.relative(root, current))}`, 5);
    }
    if (!stat.isDirectory()) {
      throw exitError(`overlay publish path component is not a directory: ${normalizeOutputPath(path.relative(root, current))}`, 5);
    }
  }
}

function stateRoot(options = {}) {
  const env = options.env || process.env;
  const configured = options.stateRoot || env.AD_BUILD_STATE_DIR;
  const root = configured || path.join(homeDir(env), OUTPUT_DIR);
  return path.resolve(root);
}

function statePath(options = {}, ...parts) {
  return path.join(stateRoot(options), ...parts);
}

function overlayStatePath(options = {}, ...parts) {
  return statePath(options, OVERLAY_STATE_SUBDIR, ...parts);
}

function homeDir(env = {}) {
  const home = env.HOME || env.USERPROFILE || os.homedir();
  if (!home) {
    throw exitError('HOME or USERPROFILE is required for ad-build state paths', 4);
  }
  return home;
}

function ensureManagedCachePathSafe(root, cachePath) {
  assertInside(root, cachePath, 'overlay cache path');
  let current = root;
  for (const part of normalizeOutputPath(path.relative(root, cachePath)).split('/')) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) {
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw exitError(`overlay cache path contains symlink: ${normalizeOutputPath(path.relative(root, current))}`, 5);
    }
    if (!stat.isDirectory()) {
      throw exitError(`overlay cache path component is not a directory: ${normalizeOutputPath(path.relative(root, current))}`, 5);
    }
  }
}

function assertInside(parent, child, label) {
  const relative = path.relative(parent, child);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw exitError(`${label} escapes parent directory: ${normalizeOutputPath(child)}`, 5);
  }
}

function runTar(args) {
  const result = spawnSync('tar', args, { encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER });
  if (result.error || result.status !== 0) {
    throw exitError(`tar failed: ${result.error?.message || trim(result.stderr) || result.status}`, 4);
  }
}

function isGitRepo(dir) {
  const result = git(dir, ['rev-parse', '--is-inside-work-tree']);
  return !result.error && result.status === 0 && trim(result.stdout) === 'true';
}

function ensureLocalGitIdentity(repoRoot, env) {
  const name = git(repoRoot, ['config', 'user.name'], env);
  if (name.status !== 0 || !trim(name.stdout)) {
    gitOk(repoRoot, ['config', 'user.name', 'ad-build overlay publisher'], env);
  }
  const email = git(repoRoot, ['config', 'user.email'], env);
  if (email.status !== 0 || !trim(email.stdout)) {
    gitOk(repoRoot, ['config', 'user.email', 'ad-build-overlay@example.invalid'], env);
  }
}

function makeRunDir(repoRoot, prefix, options = {}) {
  const dir = overlayStatePath(options, 'runs', `${prefix}-${makeRunId()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeRunId(startedAt = core.nowIso()) {
  return `${String(startedAt).replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}-${crypto.randomBytes(4).toString('hex')}`;
}

function commandLog(command, cwd, result) {
  return [
    `$ ${command}`,
    `cwd=${normalizeOutputPath(cwd)}`,
    `exit_code=${result.status ?? 2}`,
    '',
    '--- stdout ---',
    result.stdout || '',
    '',
    '--- stderr ---',
    result.stderr || '',
    ''
  ].join('\n');
}

function spawnBuildCommand(command, args, options) {
  const attempts = commandCandidates(command, options?.env || process.env);

  let lastResult = null;
  for (const candidate of attempts) {
    const result = spawnCommandCandidate(candidate, args, options);
    lastResult = result;
    if (!result.error || result.error.code !== 'ENOENT') {
      return result;
    }
  }
  return lastResult;
}

function commandCandidates(command, env) {
  const candidates = [];
  if (process.platform === 'win32' && !path.extname(command)) {
    const suffixes = ['.cmd', '.bat', '.exe'];
    for (const dir of String(env.PATH || env.Path || '').split(path.delimiter).filter(Boolean)) {
      for (const suffix of suffixes) {
        const full = path.join(dir, `${command}${suffix}`);
        if (fs.existsSync(full)) {
          candidates.push(full);
        }
      }
    }
    for (const suffix of suffixes) {
      candidates.push(`${command}${suffix}`);
    }
  }
  candidates.push(command);
  return Array.from(new Set(candidates));
}

function spawnCommandCandidate(candidate, args, options) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(candidate)) {
    const commandLine = [windowsCmdQuote(candidate), ...args.map(windowsCmdQuote)].join(' ');
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', commandLine], options);
  }
  return spawnSync(candidate, args, options);
}

function windowsCmdQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./\\:=+~-]+$/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function renderBuildText(result) {
  const lines = [
    `overlay build ${result.status}`,
    `module: ${result.module}`,
    `module_dir: ${result.module_dir}`,
    `exit_code: ${result.exit_code}`,
    `log: ${result.log_path}`
  ];
  if (result.first_real_error) {
    lines.push(`first_real_error: ${result.first_real_error.message}`);
    lines.push(`first_real_error_source: ${result.first_real_error.source_file}:${result.first_real_error.line}`);
  }
  if (result.suggested_next_command) {
    lines.push(`suggested_next_command: ${result.suggested_next_command}`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderStatusText(result) {
  return [
    `overlay status ${result.status}`,
    `auth_method: ${result.auth_method || 'missing'}`,
    `release: ${result.release || 'none'}`,
    `suggested_next_command: ${result.suggested_next_command}`,
    ''
  ].join('\n');
}

function renderPublishedReadme(manifest) {
  return [
    '# ad-build artifact overlay',
    '',
    `Release: ${manifest.release}`,
    `Source commit: ${manifest.source_commit || 'unknown'}`,
    `Artifact sha256: ${manifest.artifact_sha256}`,
    '',
    'Use through the CLI:',
    '',
    '```text',
    `ad-build overlay use --branch ${manifest.release}`,
    '```',
    ''
  ].join('\n');
}

function suggestNextCommand(firstRealError, moduleName) {
  const message = `${firstRealError?.message || ''} ${firstRealError?.source_file || ''}`.toLowerCase();
  if (message.includes('mlx5dv.h') || message.includes('no such file or directory')) {
    return 'ad-build overlay repair paths';
  }
  if (message.includes('redefinition') || message.includes('redeclaration') || message.includes('dpdk') || message.includes('meson') || message.includes('ninja')) {
    return 'ad-build overlay repair dpdk';
  }
  return `ad-build overlay doctor && ad-build overlay build ${moduleName}`;
}

function check(name, status, message, extra = {}) {
  return { name, status, message, ...extra };
}

function overallStatus(checks) {
  if (checks.some((item) => item.status === 'failed')) {
    return 'failed';
  }
  if (checks.some((item) => item.status === 'warning')) {
    return 'warning';
  }
  return 'passed';
}

function writeCliResult(stdout, parsed, result, text) {
  if (parsed.json) {
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  stdout.write(text);
}

function modeString(stat) {
  return (stat.mode & 0o777).toString(8).padStart(4, '0');
}

function packageVersion() {
  try {
    return core.readJson(path.join(__dirname, '..', 'package.json')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

function trim(value) {
  return String(value || '').trim();
}

function normalizeOutputPath(value) {
  return String(value || '').replaceAll('\\', '/');
}

function resolveRootHint(value, repoRoot) {
  const input = String(value || '');
  if (input.startsWith('/')) {
    return input;
  }
  return path.resolve(repoRoot, input);
}

function isSymlink(file) {
  try {
    return fs.lstatSync(file).isSymbolicLink();
  } catch {
    return false;
  }
}

function exitError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

module.exports = {
  DEFAULT_ARTIFACT_REPO_SSH,
  stateRoot,
  statePath,
  overlayStatePath,
  helpText,
  packOverlay,
  publishOverlay,
  useOverlay,
  runStatus,
  runDoctor,
  repairPaths,
  repairDpdk,
  buildModule,
  runOverlayCli
};
