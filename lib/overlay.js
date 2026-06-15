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
const PACK_RULES_VERSION = 2;
const GIT_MAX_BUFFER = 256 * 1024 * 1024;
const LOG_MAX_BUFFER = 512 * 1024 * 1024;
const PACK_SCAN_PROGRESS_INTERVAL = 1000;

const EXCLUDED_ROOTS = new Set(['.git', 'mkpacket', 'ssipacket', 'ad_packet']);
const EXCLUDED_PREFIXES = [
  '.git/',
  '.ad-build/cache/',
  'mkpacket/',
  'ssipacket/',
  'ad_packet/',
  'node_modules/'
];
const EXCLUDED_OVERLAY_DIRS_NOTE = 'mkpacket/, ssipacket/, ad_packet/';

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
      stdout.write(helpText(options.publicCommand));
      return 0;
    }

    if (parsed.command === 'pack') {
      const result = packOverlay(runtimeOptions(parsed, options));
      writeCliResult(stdout, parsed, result, [
        `overlay 打包${result.status === 'packed' ? '完成' : result.status}`,
        `产物: ${result.artifact_path}`,
        `manifest: ${result.manifest_path}`,
        `inventory: ${result.inventory_path}`,
        `文件数: ${result.entries_count}`,
        ''
      ].join('\n'));
      return 0;
    }

    if (parsed.command === 'publish') {
      const result = publishOverlay(runtimeOptions(parsed, options));
      writeCliResult(stdout, parsed, result, [
        `overlay 发布${result.status === 'published' || result.status === 'published_local' ? '完成' : result.status}`,
        `仓库: ${result.repo}`,
        `latest: ${result.latest_path}`,
        ''
      ].join('\n'));
      return 0;
    }

    if (parsed.command === 'use') {
      const result = useOverlay(runtimeOptions(parsed, options));
      writeCliResult(stdout, parsed, result, [
        `overlay 恢复${result.status === 'ready' ? '完成' : result.status}`,
        `current: ${result.current_path}`,
        `summary: ${result.summary_path}`,
        `总耗时: ${formatDuration(result.duration_ms)}`,
        ''
      ].join('\n'));
      return result.status === 'ready' ? 0 : 6;
    }

    if (parsed.command === 'status') {
      const result = runStatus(runtimeOptions(parsed, options));
      writeCliResult(stdout, parsed, result, renderStatusText(result));
      return result.status === 'ready' ? 0 : 3;
    }

    if (parsed.command === 'doctor') {
      const result = runDoctor(runtimeOptions(parsed, options));
      writeCliResult(stdout, parsed, result, [
        `overlay 诊断结果: ${result.overall_status}`,
        `已写入: ${result.output_path}`,
        ''
      ].join('\n'));
      return result.overall_status === 'failed' ? 6 : 0;
    }

    if (parsed.command === 'repair' && parsed.repairCommand === 'paths') {
      const result = repairPaths(runtimeOptions(parsed, options));
      writeCliResult(stdout, parsed, result, [
        `路径修复结果: ${result.status}`,
        `已更新文本文件: ${result.text_files_updated}`,
        `已更新软链接: ${result.symlinks_updated}`,
        `剩余旧路径引用: ${result.remaining_old_root_references}`,
        ''
      ].join('\n'));
      return result.status === 'repaired' || result.status === 'clean' ? 0 : 6;
    }

    if (parsed.command === 'repair' && parsed.repairCommand === 'dpdk') {
      const result = repairDpdk(runtimeOptions(parsed, options));
      writeCliResult(stdout, parsed, result, [
        `DPDK 修复结果: ${result.status}`,
        `退出码: ${result.exit_code}`,
        `日志: ${result.log_path}`,
        ''
      ].join('\n'));
      return result.exit_code || 0;
    }

    if (parsed.command === 'build') {
      const result = buildModule(runtimeOptions(parsed, options));
      writeCliResult(stdout, parsed, result, renderBuildText(result));
      return result.exit_code || 0;
    }

    throw exitError(`未知 overlay 命令: ${parsed.command}`, 2);
  } catch (error) {
    const commandName = options.publicCommand || (parsed.command ? `overlay ${parsed.command}` : 'overlay');
    if (json) {
      stdout.write(`${JSON.stringify({
        schema_version: 1,
        generated_at: core.nowIso(),
        status: 'error',
        command: commandName,
        error: error.message,
        exit_code: error.exitCode || 2
      }, null, 2)}\n`);
    } else {
      stderr.write(`ad-build ${commandName} 失败: ${error.message}\n`);
    }
    return error.exitCode || 2;
  }
}

function runtimeOptions(parsed, options = {}) {
  return {
    ...parsed,
    cwd: options.cwd,
    env: options.env,
    repoRoot: options.repoRoot,
    stdout: options.stdout,
    stderr: options.stderr,
    publicCommand: options.publicCommand,
    progress: (message) => emitProgress({ ...parsed, stderr: options.stderr }, message)
  };
}

function emitProgress(options = {}, message) {
  if (typeof options.progress === 'function') {
    options.progress(message);
    return;
  }
  const stream = options.stderr || process.stderr;
  if (!stream || typeof stream.write !== 'function') {
    return;
  }
  stream.write(`[ad-build] ${message}\n`);
}

function hashProgress(options = {}, label) {
  return (event) => {
    if (!event || event.size <= 0) {
      return;
    }
    emitProgress(options, `${label}: ${formatBytes(event.done)} / ${formatBytes(event.size)}`);
  };
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))}KB`;
  }
  if (value < 1024 * 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)}MB`;
  }
  return `${(value / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

function formatDuration(ms) {
  const value = Math.max(0, Number(ms) || 0);
  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }
  const totalSeconds = Math.round(value / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
}

function packOverlay(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const branch = requiredBranch(options, repoRoot);
  emitProgress(options, `开始扫描全量编译产物，分支: ${branch}`);
  const git = gitInfo(repoRoot, options.env);
  requireGitSourceInfo(git, 'pack');
  assertBranchMatches('pack', branch, git, options);
  const sourceRoot = resolveRootHint(options.sourceRoot || repoRoot, repoRoot);
  const runId = makeRunId();
  const outDir = options.out ? path.resolve(repoRoot, options.out) : overlayStatePath(options, 'latest');
  const artifactPath = path.join(outDir, 'ad-artifact-overlay.tar.gz');
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), `ad-build-overlay-pack-${process.pid}-`));
  const filesRoot = path.join(staging, 'files');
  try {
    fs.mkdirSync(filesRoot, { recursive: true });

    const packDiagnostics = createPackDiagnostics();
    const entries = collectPackEntries(repoRoot, { sourceRoot, progress: options.progress, packDiagnostics });
    assertExternalSymlinkPolicy(packDiagnostics);
    if (packDiagnostics.externalDependencies.length > 0) {
      emitProgress(options, `记录 ${packDiagnostics.externalDependencies.length} 个外部系统依赖，不作为 overlay symlink 恢复`);
    }
    if (packDiagnostics.excludedExternalSymlinks.length > 0) {
      emitProgress(options, `跳过 ${packDiagnostics.excludedExternalSymlinks.length} 个非 appd MVP 外部 symlink`);
    }
    emitProgress(options, `扫描完成，准备打包 ${entries.length} 个文件`);
    validatePackReadiness(repoRoot, entries, { sourceRoot });
    const inventory = {
      schema_version: 1,
      kind: 'ad-build-artifact-overlay-inventory',
      entries
    };
    validateInventory(inventory, { source_root_at_pack_time: normalizeOutputPath(sourceRoot) }, { repoRoot, sourceRoot });
    const inventorySha = core.digestJson(inventory);
    const manifestBase = {
      schema_version: 1,
      kind: 'ad-build-artifact-overlay',
      release: branch,
      source_branch: git.branch || branch,
      source_commit: git.commit,
      source_repo_url: git.remote_url,
      source_root_at_pack_time: normalizeOutputPath(sourceRoot),
      artifact_repo_ssh: DEFAULT_ARTIFACT_REPO_SSH,
      artifact_path: null,
      artifact_sha256: null,
      artifact_size_bytes: 0,
      inventory: 'inventory.json',
      inventory_sha256: inventorySha,
      pack_rules_version: PACK_RULES_VERSION,
      external_dependencies: packDiagnostics.externalDependencies,
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
    emitProgress(options, `正在生成压缩包: ${normalizeOutputPath(artifactPath)}`);
    runTar(['-czf', artifactPath, '-C', staging, 'manifest.json', 'inventory.json', 'files'], options, '打包 overlay');

    emitProgress(options, '正在计算 sha256 并写入 manifest');
    const artifactSha = sha256File(artifactPath, { onProgress: hashProgress(options, '计算 overlay sha256') });
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
      source_branch: manifest.source_branch,
      source_commit: manifest.source_commit,
      source_repo_url: manifest.source_repo_url,
      pack_rules_version: PACK_RULES_VERSION,
      external_dependencies: packDiagnostics.externalDependencies,
      excluded_external_symlinks: packDiagnostics.excludedExternalSymlinks,
      warnings: packWarnings(entries, packDiagnostics)
    };

    core.writeJson(path.join(outDir, 'manifest.json'), manifest);
    core.writeJson(path.join(outDir, 'inventory.json'), inventory);
    core.writeJson(path.join(outDir, 'pack-summary.json'), summary);
    writeText(`${artifactPath}.sha256`, `${artifactSha.replace(/^sha256:/, '')}  ${path.basename(artifactPath)}\n`);
    return summary;
  } finally {
    cleanupTempDir(staging);
  }
}

function publishOverlay(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const branch = requiredBranch(options, repoRoot);
  emitProgress(options, `开始发布 overlay，目标分支: ${branch}`);
  requireAuthenticatedOverlayAuth(repoRoot, options, '发布 overlay');
  const selected = selectPackedOverlay(repoRoot, options);
  requireManifestSourceMetadata(selected.manifest, 'publish');
  assertManifestBranchMatches('publish', branch, selected.manifest, options);
  const artifactSha = sha256File(selected.artifact, { onProgress: hashProgress(options, '校验待发布 overlay sha256') });
  if (selected.manifest.artifact_sha256 && selected.manifest.artifact_sha256 !== artifactSha) {
    throw exitError('已打包 overlay 的 sha256 与 manifest 不一致', 5);
  }

  const artifactRepo = ensureArtifactRepo(repoRoot, options, { forPublish: true, branch });
  emitProgress(options, `产物仓库已准备: ${artifactRepo.local ? artifactRepo.path : artifactRepo.url}`);
  const shortSha = core.safeDigestKey(artifactSha).slice(0, 12);
  const releaseDir = path.join(artifactRepo.path, branch);
  const publishDir = path.join(releaseDir, 'artifact-overlay', `sha256-${shortSha}`);
  ensurePublishPathSafe(artifactRepo.path, normalizeOutputPath(path.posix.join(branch, 'artifact-overlay', `sha256-${shortSha}`)));
  fs.mkdirSync(publishDir, { recursive: true });

  const manifest = {
    ...selected.manifest,
    release: branch,
    source_branch: selected.manifest.source_branch || branch,
    source_commit: selected.manifest.source_commit,
    source_repo_url: selected.manifest.source_repo_url || gitInfo(repoRoot, options.env).remote_url,
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

  emitProgress(options, '正在复制 overlay 包并更新 latest 指针');
  fs.copyFileSync(selected.artifact, path.join(publishDir, 'ad-artifact-overlay.tar.gz'));
  core.writeJson(path.join(publishDir, 'manifest.json'), manifest);
  core.writeJson(path.join(publishDir, 'inventory.json'), selected.inventory);
  writeText(path.join(publishDir, 'ad-artifact-overlay.tar.gz.sha256'), `${artifactSha.replace(/^sha256:/, '')}  ad-artifact-overlay.tar.gz\n`);
  writeText(path.join(publishDir, 'README.md'), renderPublishedReadme(manifest));
  core.writeJson(path.join(releaseDir, 'latest-artifact-overlay.json'), latest);
  const removedOldPayloads = cleanupOldOverlayPayloads(releaseDir, `sha256-${shortSha}`);

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
    removed_old_payloads: removedOldPayloads,
    pushed: false,
    commit: null
  };

  if (isGitRepo(artifactRepo.path)) {
    const env = gitEnvWithOverlayAuth(repoRoot, options, artifactRepo);
    ensureLocalGitIdentity(artifactRepo.path, env);
    const statusBeforeSnapshot = gitOk(artifactRepo.path, ['status', '--porcelain', '--', branch], env).stdout.trim();
    if (!statusBeforeSnapshot) {
      summary.status = 'no_changes';
    } else {
      emitProgress(options, '正在生成产物分支单提交快照');
      const commit = commitBranchSnapshot(artifactRepo.path, branch, `publish artifact overlay for ${branch}`, env);
      if (!options.noPush) {
        emitProgress(options, '正在推送到 GitLab 产物仓库');
        gitOkProgress(artifactRepo.path, ['push', '--progress', '-u', 'origin', `+${commit}:refs/heads/${branch}`], env, options);
        summary.pushed = true;
      }
      summary.commit = commit;
    }
  } else {
    summary.status = 'published_local';
  }

  core.writeJson(overlayStatePath(options, 'publish-summary.json'), summary);
  return summary;
}

function useOverlay(options = {}) {
  const startedAt = Date.now();
  const repoRoot = resolveRepoRoot(options);
  const branch = requiredBranch(options, repoRoot);
  emitProgress(options, `开始恢复 overlay，目标分支: ${branch}`);

  const currentGit = gitInfo(repoRoot, options.env);
  const currentSourceIssue = currentSourceVerificationIssue(currentGit);
  if (currentSourceIssue) {
    throw exitError(currentSourceIssue.message, 5);
  }

  requireAuthenticatedOverlayAuth(repoRoot, options, '恢复 overlay');

  const metadata = readRestoreMetadata(repoRoot, branch, options);
  assertManifestReleaseMatches('restore', branch, metadata.manifest, options);

  const metadataSourceIssue = sourceVerificationIssue(metadata.manifest, currentGit);
  if (metadataSourceIssue && (!metadataSourceIssue.forceable || !options.force)) {
    const suffix = metadataSourceIssue.forceable
      ? `如确认风险可接受，请执行 ad-build restore --branch ${branch} --force`
      : '请重新发布带完整源码元数据的 overlay，或在可验证的 AD Git 工作区执行';
    throw exitError(`${metadataSourceIssue.message}; ${suffix}`, 5);
  }

  const artifactRepo = metadata.artifactRepo.local
    ? metadata.artifactRepo
    : ensureArtifactRepo(repoRoot, options, { forUse: true, branch });
  emitProgress(options, `已获取产物仓库分支: ${branch}`);
  const releaseDir = path.join(artifactRepo.path, branch);
  const latestPath = path.join(releaseDir, 'latest-artifact-overlay.json');
  if (!fs.existsSync(latestPath)) {
    throw exitError(`没有找到该分支的 latest overlay 指针: ${normalizeOutputPath(path.relative(artifactRepo.path, latestPath))}`, 3);
  }
  const latest = core.readJson(latestPath);
  const manifestPath = resolveRepoFile(releaseDir, latest.manifest);
  const manifest = core.readJson(manifestPath);
  assertManifestReleaseMatches('restore', branch, manifest, options);

  const sourceIssue = sourceVerificationIssue(manifest, currentGit);
  if (sourceIssue && (!sourceIssue.forceable || !options.force)) {
    const suffix = sourceIssue.forceable
      ? `如确认风险可接受，请执行 ad-build restore --branch ${branch} --force`
      : '请重新发布带完整源码元数据的 overlay，或在可验证的 AD Git 工作区执行';
    throw exitError(`${sourceIssue.message}; ${suffix}`, 5);
  }
  const sourceIssueMessage = sourceIssue?.message || null;

  const inventoryPath = resolveInventoryPath(manifestPath, manifest);
  const inventory = core.readJson(inventoryPath);
  validateInventory(inventory, manifest, { repoRoot, sourceRoot: manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT });

  const artifactPath = resolveArtifactPath(artifactRepo.path, releaseDir, manifest.artifact_path);
  if (!fs.existsSync(artifactPath)) {
    throw exitError(`没有找到 overlay 产物包: ${normalizeOutputPath(path.relative(artifactRepo.path, artifactPath))}`, 3);
  }
  emitProgress(options, '正在校验 overlay 包 sha256');
  const actualSha = sha256File(artifactPath, { onProgress: hashProgress(options, '校验 overlay 包 sha256') });
  if (manifest.artifact_sha256 && actualSha !== manifest.artifact_sha256) {
    throw exitError(`overlay 产物包 sha256 不一致: 期望 ${manifest.artifact_sha256}, 实际 ${actualSha}`, 5);
  }

  const staging = fs.mkdtempSync(path.join(os.tmpdir(), `ad-build-overlay-use-${process.pid}-`));
  try {
    emitProgress(options, '正在校验 tar 成员安全性');
    validateOverlayArchive(artifactPath, inventory);
    emitProgress(options, '正在解压 overlay 包');
    runTar(['-xzf', artifactPath, '-C', staging], options, '解压 overlay');
    const previous = readCurrent(repoRoot, options);
    const conflicts = findRestoreConflicts({ repoRoot, inventory, staging, manifest, previous, force: options.force });
    if (conflicts.length > 0) {
      const conflictsPath = overlayStatePath(options, 'use-conflicts.json');
      core.writeJson(conflictsPath, {
        schema_version: 1,
        generated_at: core.nowIso(),
        conflicts
      });
      throw exitError(`恢复 overlay 会覆盖 ${conflicts.length} 个本地路径，请查看 ${normalizeOutputPath(conflictsPath)}；确认覆盖时追加 --force`, 5);
    }

    emitProgress(options, `正在恢复 ${inventory.entries.length} 个文件/软链接`);
    const restored = restoreInventoryEntries({ repoRoot, inventory, staging, manifest, previous, force: options.force });
    emitProgress(options, '正在修正旧工作区路径引用');
    const relocation = relocateInventoryEntries({
      repoRoot,
      entries: inventory.entries || [],
      oldRoot: manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT,
      newRoot: repoRoot
    });
    const dpdkRepair = maybeRepairDpdkAfterRestore({ ...options, repoRoot });

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
      source_drift: sourceIssueMessage,
      restored,
      dpdk_repair: dpdkRepair
    };
    const currentPath = overlayStatePath(options, 'current.json');
    const summaryPath = overlayStatePath(options, 'use-summary.json');
    core.writeJson(currentPath, current);
    emitProgress(options, '正在执行恢复后诊断');
    const doctor = buildDoctorResult({ repoRoot, env: options.env, current, stateOptions: options, skipUseSummaryCheck: true });
    const summary = {
      schema_version: 1,
      status: doctor.overall_status === 'failed' || dpdkRepair.status === 'failed' ? 'not_ready' : 'ready',
      generated_at: core.nowIso(),
      release: branch,
      current_path: normalizeOutputPath(currentPath),
      summary_path: normalizeOutputPath(summaryPath),
      artifact_sha256: actualSha,
      restored_count: restored.restored_count,
      skipped_count: restored.skipped_count,
      text_files_relocated: relocation.text_files_updated,
      symlinks_relocated: relocation.symlinks_updated,
      dpdk_repair_status: dpdkRepair.status,
      dpdk_repair_log: dpdkRepair.log_path || null,
      doctor_status: doctor.overall_status,
      duration_ms: Date.now() - startedAt,
      warnings: [
        ...(sourceIssueMessage ? [{ message: sourceIssueMessage }] : []),
        ...(dpdkRepair.status === 'failed' ? [{ name: 'dpdk_repair', message: dpdkRepair.error || 'DPDK 修复失败' }] : []),
        ...doctor.warnings
      ]
    };
    core.writeJson(summaryPath, summary);
    const finalDoctor = buildDoctorResult({ repoRoot, env: options.env, current, stateOptions: options, useSummary: summary });
    core.writeJson(overlayStatePath(options, 'doctor.json'), finalDoctor);
    return summary;
  } finally {
    cleanupTempDir(staging);
  }
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
    suggested_next_command: summary?.status === 'ready' ? 'ad-build verify appd' : 'ad-build restore --branch <release>'
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

function maybeRepairDpdkAfterRestore(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const dpdkRoot = path.join(repoRoot, 'apps/ad_appd_new/libs/dpdk');
  if (!fs.existsSync(dpdkRoot) || !fs.lstatSync(dpdkRoot).isDirectory()) {
    return { status: 'skipped', reason: 'DPDK 目录不存在' };
  }
  if (!commandExists('make', options.env || process.env)) {
    return { status: 'skipped', reason: '未找到 make 命令' };
  }
  emitProgress(options, '正在重建 appd DPDK/RDMA 缓存（自动注入 PREFIX_SOURCE）');
  try {
    return repairDpdk(options);
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
      exit_code: error.exitCode || 2
    };
  }
}

function repairDpdk(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const runDir = makeRunDir(repoRoot, 'repair-dpdk', options);
  const dpdkRoot = path.join(repoRoot, 'apps/ad_appd_new/libs/dpdk');
  if (!fs.existsSync(dpdkRoot) || !fs.lstatSync(dpdkRoot).isDirectory()) {
    throw exitError('DPDK 目录不存在: apps/ad_appd_new/libs/dpdk', 3);
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
    throw exitError('verify 需要指定模块名，例如: ad-build verify appd', 2);
  }
  const moduleEntry = MODULES[moduleName];
  if (!moduleEntry) {
    throw exitError(`未知验证模块: ${moduleName}；当前可用模块: ${Object.keys(MODULES).join(', ')}`, 2);
  }
  if (!options.allowWithoutReady) {
    const summary = readOptionalJson(overlayStatePath(options, 'use-summary.json'));
    if (!summary || summary.status !== 'ready') {
      throw exitError('overlay 还未就绪，请先执行: ad-build restore --branch <release>', 6);
    }
  }

  const moduleDir = path.join(repoRoot, moduleEntry.dir);
  if (!fs.existsSync(moduleDir) || !fs.lstatSync(moduleDir).isDirectory()) {
    throw exitError(`模块目录不存在: ${moduleEntry.dir}`, 3);
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
  const useSummary = Object.prototype.hasOwnProperty.call(options, 'useSummary')
    ? options.useSummary
    : options.skipUseSummaryCheck
      ? null
      : readOptionalJson(overlayStatePath(stateOptions, 'use-summary.json'));
  const strict = Boolean(options.strict || stateOptions.strict);
  const checks = [];
  const warnings = [];

  checks.push(auth?.auth_method === 'ssh' && auth.status === 'authenticated'
    ? check('overlay_auth', 'passed', 'overlay SSH 登录已通过')
    : check('overlay_auth', 'warning', auth?.auth_method === 'ssh'
      ? 'overlay SSH 登录尚未通过，请重新执行: ad-build login'
      : 'overlay SSH 登录未配置，请执行: ad-build login'));

  checks.push(current
    ? check('current_overlay', 'passed', '当前 overlay manifest 已存在')
    : check('current_overlay', 'failed', '当前 overlay manifest 缺失，请执行: ad-build restore --branch <release>'));

  if (!options.skipUseSummaryCheck) {
    if (useSummary) {
      checks.push(useSummary.status === 'ready'
        ? check('use_summary_ready', 'passed', 'overlay 恢复摘要状态为 ready')
        : check('use_summary_ready', 'failed', `overlay 恢复摘要状态为 ${useSummary.status}`));
    } else if (current) {
      checks.push(check('use_summary_ready', 'warning', 'overlay 恢复摘要 use-summary.json 缺失'));
    }
  }

  if (current) {
    const oldRoot = current.manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT;
    const refs = scanOldRootReferences({ repoRoot, entries: current.inventory.entries || [], oldRoot });
    const dangling = findDanglingSymlinks({ repoRoot, entries: current.inventory.entries || [] });
    checks.push(refs.count === 0
      ? check('old_root_references', 'passed', `overlay 管理文件中已无 ${oldRoot} 旧路径引用`)
      : check('old_root_references', 'failed', `仍有 ${refs.count} 个旧路径引用`, { samples: refs.samples }));
    checks.push(dangling.count === 0
      ? check('dangling_symlinks', 'passed', '未发现阻断性的 overlay 软链接悬空')
      : check(
        'dangling_symlinks',
        strict ? 'failed' : 'warning',
        strict
          ? `发现 ${dangling.count} 个 overlay 软链接悬空`
          : `发现 ${dangling.count} 个非关键 overlay 软链接悬空；默认不阻断，严格检查请使用 --strict`,
        { samples: dangling.samples }
      ));

    for (const required of APPD_REQUIRED_PATHS) {
      const exists = fs.existsSync(path.join(repoRoot, required));
      const item = exists
        ? check(`required_path:${required}`, 'passed', `${required} 已存在`)
        : check(`required_path:${required}`, 'failed', `${required} 缺失；overlay 尚不能支撑 appd 编译`);
      checks.push(item);
    }
    for (const dependency of current.manifest.external_dependencies || []) {
      checks.push(checkExternalDependency(dependency));
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

function checkExternalDependency(dependency) {
  const name = dependency.name || dependency.path || 'unknown';
  const checkPath = dependency.check_path || dependency.resolved_path || dependency.link_target;
  const messagePrefix = `${dependency.path || name} -> ${checkPath || 'unknown'}`;
  if (checkPath && fs.existsSync(checkPath)) {
    return check(`external_dependency:${name}`, 'passed', `外部系统依赖已存在: ${messagePrefix}`);
  }
  return check(`external_dependency:${name}`, 'failed', `外部系统依赖缺失: ${messagePrefix}`);
}

function collectPackEntries(repoRoot, options = {}) {
  const status = gitStatusMap(repoRoot);
  const entryPaths = new Set();
  const entries = [];
  const progress = { scanned: 0, selected: 0 };
  const diagnostics = options.packDiagnostics || createPackDiagnostics();
  for (const start of collectScanStarts(repoRoot)) {
    walk(start.full, repoRoot, (full, rel, stat) => {
      progress.scanned += 1;
      if (entryPaths.has(rel) || shouldExclude(rel)) {
        emitPackScanProgress(options, progress);
        return;
      }
      if (stat.isSymbolicLink()) {
        const decision = classifyPackSymlink({ repoRoot, full, rel, sourceRoot: options.sourceRoot || repoRoot });
        if (decision.action === 'dependency') {
          diagnostics.externalDependencies.push(decision.item);
          emitPackScanProgress(options, progress);
          return;
        }
        if (decision.action === 'exclude') {
          diagnostics.excludedExternalSymlinks.push(decision.item);
          emitPackScanProgress(options, progress);
          return;
        }
        if (decision.action === 'violation') {
          diagnostics.externalSymlinkViolations.push(decision.item);
          emitPackScanProgress(options, progress);
          return;
        }
      }
      if (!shouldIncludePackEntry(rel, stat, status.get(rel))) {
        emitPackScanProgress(options, progress);
        return;
      }
      addPackEntry(entries, entryPaths, full, rel, stat, status.get(rel));
      progress.selected += 1;
      emitPackScanProgress(options, progress);
    });
  }
  includeInternalSymlinkTargets(repoRoot, entries, entryPaths, status, {
    ...options,
    sourceRoot: options.sourceRoot || repoRoot
  });
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return entries;
}

function emitPackScanProgress(options, progress) {
  if (progress.scanned > 0 && progress.scanned % PACK_SCAN_PROGRESS_INTERVAL === 0) {
    emitProgress(options, `已扫描 ${progress.scanned} 个路径，已选中 ${progress.selected} 个产物文件`);
  }
}

function addPackEntry(entries, entryPaths, full, rel, stat, gitStatus) {
  entryPaths.add(rel);
  entries.push(buildInventoryEntry(full, rel, stat, gitStatus));
}

function createPackDiagnostics() {
  return {
    externalDependencies: [],
    excludedExternalSymlinks: [],
    externalSymlinkViolations: []
  };
}

function packWarnings(entries, diagnostics) {
  const warnings = [];
  if (entries.length === 0) {
    warnings.push({ message: '没有找到 overlay 产物文件' });
  }
  for (const item of diagnostics.externalDependencies) {
    warnings.push({
      name: 'external_symlink_dependency',
      path: item.path,
      target: item.link_target,
      resolved_path: item.resolved_path,
      check_path: item.check_path,
      message: `外部 symlink 作为系统依赖记录，不写入 overlay inventory: ${item.path} -> ${item.link_target}`
    });
  }
  for (const item of diagnostics.excludedExternalSymlinks) {
    warnings.push({
      name: 'excluded_external_symlink',
      path: item.path,
      target: item.link_target,
      resolved_path: item.resolved_path,
      reason: item.reason,
      message: `跳过非 appd MVP 外部 symlink: ${item.path} -> ${item.link_target}`
    });
  }
  return warnings;
}

function classifyPackSymlink({ repoRoot, full, rel, sourceRoot }) {
  const linkTarget = fs.readlinkSync(full);
  const resolvedPath = resolveSymlinkDisplayPath({ linkPath: full, linkTarget });
  const policy = classifyKnownExternalSymlink(rel, linkTarget, resolvedPath);
  if (policy?.action === 'dependency') {
    return {
      action: 'dependency',
      item: {
        name: policy.name,
        type: policy.type,
        path: rel,
        link_target: linkTarget,
        resolved_path: resolvedPath,
        check_path: policy.checkPath || resolvedPath,
        required: true,
        reason: policy.reason
      }
    };
  }
  if (policy?.action === 'exclude') {
    return {
      action: 'exclude',
      item: {
        path: rel,
        link_target: linkTarget,
        resolved_path: resolvedPath,
        reason: policy.reason
      }
    };
  }

  const target = resolveInternalSymlinkTarget({
    repoRoot,
    sourceRoot,
    linkPath: full,
    linkTarget
  });
  if (target) {
    return { action: 'include' };
  }
  return {
    action: 'violation',
    item: {
      path: rel,
      link_target: linkTarget,
      resolved_path: resolvedPath
    }
  };
}

function classifyKnownExternalSymlink(rel, linkTarget) {
  const normalizedTarget = normalizeOutputPath(linkTarget);
  if (rel === 'include/lua' && normalizedTarget.startsWith('/usr/local/include/luajit-2.1')) {
    return {
      action: 'dependency',
      name: 'luajit_headers',
      type: 'system_header',
      checkPath: linkTarget,
      reason: 'system header dependency for LuaJIT'
    };
  }
  if (rel === 'shell/etc/apache2/httpd.conf' || rel === 'shell/etc/squid/squid.conf') {
    return {
      action: 'exclude',
      reason: 'deployment environment link outside appd MVP overlay'
    };
  }
  if (rel === 'test/access_layer/partition/partition/mock_S04NicFactory') {
    return {
      action: 'exclude',
      reason: 'test environment link outside appd MVP overlay'
    };
  }
  if (rel.startsWith('shell/arch/aarch64/')) {
    return {
      action: 'exclude',
      reason: 'aarch64 shell package path outside appd x86 MVP overlay'
    };
  }
  return null;
}

function assertExternalSymlinkPolicy(diagnostics) {
  const violations = diagnostics.externalSymlinkViolations;
  if (violations.length === 0) {
    return;
  }
  const details = violations
    .map((item) => `- path: ${item.path}; link_target: ${item.link_target}; resolved_path: ${item.resolved_path}`)
    .join('\n');
  throw exitError(
    [
      `pack 发现 ${violations.length} 个不在允许策略内的外部 symlink。`,
      `以下目录不参与 overlay 扫描/判定: ${EXCLUDED_OVERLAY_DIRS_NOTE}`,
      '请将确认为系统依赖的路径加入 external dependency 策略，或从 appd MVP pack scope 排除。',
      details
    ].join('\n'),
    5
  );
}

function includeInternalSymlinkTargets(repoRoot, entries, entryPaths, status, options = {}) {
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.type !== 'symlink') {
      continue;
    }
    const target = resolveInternalSymlinkTarget({
      repoRoot,
      sourceRoot: options.sourceRoot || repoRoot,
      linkPath: path.join(repoRoot, entry.path),
      linkTarget: entry.link_target
    });
    if (!target || !pathExistsOrSymlink(target)) {
      continue;
    }
    const rel = normalizeOutputPath(path.relative(repoRoot, target));
    if (!rel || entryPaths.has(rel) || shouldExclude(rel)) {
      continue;
    }
    const stat = fs.lstatSync(target);
    if (!stat.isFile() && !stat.isSymbolicLink()) {
      continue;
    }
    addPackEntry(entries, entryPaths, target, rel, stat, status.get(rel));
  }
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
  if (isManualOverlayDependencyPath(rel)) {
    return true;
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

function isManualOverlayDependencyPath(rel) {
  return rel.startsWith('libs/rdma-core-2404mlnx51/') && /\.(h|hh|hpp|hxx|inc)$/i.test(rel);
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

function restoreInventoryEntries({ repoRoot, inventory, staging, manifest, previous, force }) {
  let restoredCount = 0;
  let overwrittenCount = 0;
  let skippedCount = 0;
  let managedRefreshCount = 0;
  const previousEntries = new Map((previous?.inventory?.entries || []).map((entry) => [entry.path, entry]));
  const previousOldRoot = previous?.manifest?.source_root_at_pack_time || manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT;
  for (const entry of inventory.entries || []) {
    safePath(entry.path);
    const target = path.join(repoRoot, entry.path);
    const source = path.join(staging, 'files', entry.path);
    ensureDestinationSafe(repoRoot, entry.path);
    if (pathExistsOrSymlink(target)) {
      if (targetMatchesEntry(target, entry, { repoRoot, oldRoot: manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT })) {
        skippedCount += 1;
        continue;
      }
      const stat = fs.lstatSync(target);
      if (stat.isDirectory()) {
        throw exitError(`目标路径是目录，不能被 overlay 文件覆盖: ${entry.path}`, 5);
      }
      const previousEntry = previousEntries.get(entry.path);
      const isManagedRefresh = previousEntry && targetMatchesEntry(target, previousEntry, { repoRoot, oldRoot: previousOldRoot });
      if (!force && !isManagedRefresh) {
        throw exitError(`目标路径已存在且内容不同: ${entry.path}；确认覆盖时追加 --force`, 5);
      }
      overwrittenCount += 1;
      if (isManagedRefresh) {
        managedRefreshCount += 1;
      }
      fs.rmSync(target, { force: true });
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (entry.type === 'symlink') {
      const linkTarget = relocatePath(entry.link_target || fs.readlinkSync(source), manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT, repoRoot);
      fs.symlinkSync(linkTarget, target);
    } else {
      if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) {
        throw exitError(`overlay 产物包缺少 entry 内容: ${entry.path}`, 5);
      }
      fs.copyFileSync(source, target);
      if (entry.sha256) {
        const actual = sha256File(target);
        if (actual !== entry.sha256) {
          throw exitError(`恢复后的 entry sha256 不一致: ${entry.path}`, 5);
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
  return {
    restored_count: restoredCount,
    overwritten_count: overwrittenCount,
    managed_refresh_count: managedRefreshCount,
    skipped_count: skippedCount,
    force: Boolean(force)
  };
}

function findRestoreConflicts({ repoRoot, inventory, manifest, previous, force }) {
  const previousEntries = new Map((previous?.inventory?.entries || []).map((entry) => [entry.path, entry]));
  const status = force ? new Map() : gitStatusMap(repoRoot);
  const oldRoot = manifest?.source_root_at_pack_time || DEFAULT_SOURCE_ROOT;
  const previousOldRoot = previous?.manifest?.source_root_at_pack_time || oldRoot;
  const conflicts = [];
  for (const entry of inventory.entries || []) {
    safePath(entry.path);
    const target = path.join(repoRoot, entry.path);
    if (!pathExistsOrSymlink(target)) {
      continue;
    }
    const stat = fs.lstatSync(target);
    if (stat.isDirectory()) {
      conflicts.push({ path: entry.path, reason: 'target is a directory' });
      continue;
    }
    if (targetMatchesEntry(target, entry, { repoRoot, oldRoot })) {
      continue;
    }
    const previousEntry = previousEntries.get(entry.path);
    if (previousEntry && targetMatchesEntry(target, previousEntry, { repoRoot, oldRoot: previousOldRoot })) {
      continue;
    }
    if (force) {
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
    if (!pathExistsOrSymlink(target)) {
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
    if (!pathExistsOrSymlink(target)) {
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
    throw exitError(`没有找到已打包的 overlay 产物: ${normalizeOutputPath(artifact)}`, 3);
  }
  if (!fs.existsSync(manifestPath)) {
    throw exitError(`没有找到 overlay manifest: ${normalizeOutputPath(manifestPath)}`, 3);
  }
  if (!fs.existsSync(inventoryPath)) {
    throw exitError(`没有找到 overlay inventory: ${normalizeOutputPath(inventoryPath)}`, 3);
  }
  const manifest = core.readJson(manifestPath);
  const inventory = core.readJson(inventoryPath);
  validateInventory(inventory, manifest, { repoRoot, sourceRoot: manifest.source_root_at_pack_time || DEFAULT_SOURCE_ROOT });
  return { artifact, manifest, inventory };
}

function readRestoreMetadata(repoRoot, branch, options = {}) {
  const artifactRepo = ensureArtifactRepo(repoRoot, options, { forUse: true, branch, metadataOnly: true });
  if (artifactRepo.local) {
    const releaseDir = path.join(artifactRepo.path, branch);
    const latestPath = path.join(releaseDir, 'latest-artifact-overlay.json');
    if (!fs.existsSync(latestPath)) {
      throw exitError(`没有找到该分支的 latest overlay 指针: ${normalizeOutputPath(path.relative(artifactRepo.path, latestPath))}`, 3);
    }
    const latest = core.readJson(latestPath);
    const manifestPath = resolveRepoFile(releaseDir, latest.manifest);
    return {
      artifactRepo,
      latest,
      manifest: core.readJson(manifestPath)
    };
  }

  const env = gitEnvWithOverlayAuth(repoRoot, options, artifactRepo);
  const latestPath = normalizeOutputPath(path.posix.join(branch, 'latest-artifact-overlay.json'));
  const latest = readJsonFromGit(artifactRepo.path, 'FETCH_HEAD', latestPath, env);
  if (!latest.manifest) {
    throw exitError('latest overlay 指针缺少 manifest 路径', 5);
  }
  safePath(latest.manifest);
  const manifestPath = normalizeOutputPath(path.posix.join(branch, latest.manifest));
  return {
    artifactRepo,
    latest,
    manifest: readJsonFromGit(artifactRepo.path, 'FETCH_HEAD', manifestPath, env)
  };
}

function readJsonFromGit(repoRoot, ref, relativePath, env) {
  safePath(relativePath);
  const result = gitOk(repoRoot, ['show', `${ref}:${normalizeOutputPath(relativePath)}`], env);
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw exitError(`产物仓库 JSON 无效: ${relativePath}: ${error.message}`, 5);
  }
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
  const branch = mode.branch;
  const authEnv = gitEnvWithOverlayAuth(repoRoot, options, { local: false });
  ensureManagedCachePathSafe(root, cachePath);
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.mkdirSync(cachePath, { recursive: true });
    gitOk(cachePath, ['init'], authEnv);
    gitOk(cachePath, ['remote', 'add', 'origin', repoUrl], authEnv);
  } else if (!isGitRepo(cachePath)) {
    if (mode.forUse || mode.forPublish) {
      throw exitError(`overlay 缓存目录不是 Git 仓库: ${normalizeOutputPath(cachePath)}`, 4);
    }
  } else {
    const currentUrl = git(cachePath, ['remote', 'get-url', 'origin'], authEnv);
    if (currentUrl.status !== 0 || trim(currentUrl.stdout) !== repoUrl) {
      gitOk(cachePath, ['remote', 'remove', 'origin'], authEnv);
      gitOk(cachePath, ['remote', 'add', 'origin', repoUrl], authEnv);
    }
  }

  if (branch) {
    if (mode.forPublish) {
      emitProgress(options, `正在准备本地产物分支 ${branch}（发布端不拉取旧大包）`);
      preparePublishBranch(cachePath, branch, authEnv);
      gitOk(cachePath, ['clean', '-fdx'], authEnv);
    } else if (mode.metadataOnly) {
      emitProgress(options, `正在轻量获取产物 manifest 元数据: ${branch}`);
      fetchArtifactMetadata(cachePath, branch, authEnv, options);
    } else {
      emitProgress(options, `正在从产物仓库获取分支 ${branch}`);
      const fetch = gitProgress(cachePath, ['fetch', '--progress', '--depth=1', 'origin', branch], authEnv, options);
      if (fetch.error || fetch.status !== 0) {
        throw exitError(`获取产物仓库分支失败: ${gitFailure(fetch)}`, 4);
      }
      gitOk(cachePath, ['checkout', '-B', branch, 'FETCH_HEAD'], authEnv);
      gitOk(cachePath, ['clean', '-fdx'], authEnv);
    }
  } else if (isGitRepo(cachePath)) {
    gitOkProgress(cachePath, ['fetch', '--progress', '--depth=1', 'origin'], authEnv, options);
  } else if (mode.forUse || mode.forPublish) {
    throw exitError(`overlay 缓存目录不是 Git 仓库: ${normalizeOutputPath(cachePath)}`, 4);
  }
  return { path: cachePath, url: repoUrl, local: false };
}

function fetchArtifactMetadata(cachePath, branch, env, options = {}) {
  configurePartialCloneCache(cachePath, env);
  const filtered = git(cachePath, ['fetch', '--progress', '--depth=1', '--filter=blob:none', 'origin', branch], env);
  if (!filtered.error && filtered.status === 0) {
    if (filteredFetchIgnoredFilter(filtered)) {
      emitProgress(options, 'Git 服务器忽略 --filter=blob:none，metadata fetch 可能已下载更多对象；继续使用当前 shallow fetch 结果');
    }
    return filtered;
  }

  if (!shouldFallbackFilteredFetch(filtered)) {
    throw exitError(`获取产物 manifest 元数据失败: ${gitFailure(filtered)}`, 4);
  }

  emitProgress(options, 'Git/cache 不支持 --filter=blob:none 轻量 fetch，fallback 到普通 depth=1 fetch，可能下载更多对象');
  const fallback = gitProgress(cachePath, ['fetch', '--progress', '--depth=1', 'origin', branch], env, options);
  if (fallback.error || fallback.status !== 0) {
    throw exitError(`获取产物 manifest 元数据失败: ${gitFailure(fallback)}`, 4);
  }
  return fallback;
}

function configurePartialCloneCache(repoRoot, env) {
  gitOk(repoRoot, ['config', 'extensions.partialClone', 'origin'], env);
  gitOk(repoRoot, ['config', 'remote.origin.promisor', 'true'], env);
  gitOk(repoRoot, ['config', 'remote.origin.partialclonefilter', 'blob:none'], env);
}

function shouldFallbackFilteredFetch(result = {}) {
  const message = gitResultMessage(result);
  return /--filter|unknown option.*filter|filter=blob:none|partialClone|partial clone|partialclone|filtering not recognized|promisor/i.test(message);
}

function filteredFetchIgnoredFilter(result = {}) {
  return /filtering not recognized by server,\s*ignoring/i.test(gitResultMessage(result));
}

function gitResultMessage(result = {}) {
  return `${result.error?.message || ''}\n${result.stderr || ''}\n${result.stdout || ''}`;
}

function preparePublishBranch(repoRoot, branch, env) {
  const localBranch = git(repoRoot, ['rev-parse', '--verify', branch], env);
  if (!localBranch.error && localBranch.status === 0) {
    gitOk(repoRoot, ['checkout', branch], env);
    return;
  }
  const orphan = git(repoRoot, ['checkout', '--orphan', branch], env);
  if (orphan.error || orphan.status !== 0) {
    gitOk(repoRoot, ['checkout', '-B', branch], env);
  }
  git(repoRoot, ['rm', '-rf', '.'], env);
}

function commitBranchSnapshot(repoRoot, branch, message, env) {
  gitOk(repoRoot, ['read-tree', '--empty'], env);
  gitOk(repoRoot, ['add', '-A', '--', branch], env);
  const tree = gitOk(repoRoot, ['write-tree'], env).stdout.trim();
  const commit = gitOk(repoRoot, ['commit-tree', tree, '-m', message], env).stdout.trim();
  gitOk(repoRoot, ['update-ref', `refs/heads/${branch}`, commit], env);
  gitOk(repoRoot, ['checkout', '-f', '-B', branch, commit], env);
  gitOk(repoRoot, ['clean', '-fdx'], env);
  return commit;
}

function cleanupOldOverlayPayloads(releaseDir, keepName) {
  const overlayDir = path.join(releaseDir, 'artifact-overlay');
  if (!fs.existsSync(overlayDir)) {
    return 0;
  }
  let removed = 0;
  for (const name of fs.readdirSync(overlayDir)) {
    if (!name.startsWith('sha256-') || name === keepName) {
      continue;
    }
    const target = path.join(overlayDir, name);
    const stat = fs.lstatSync(target);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      continue;
    }
    fs.rmSync(target, { recursive: true, force: true });
    removed += 1;
  }
  return removed;
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
    strict: false,
    allowBranchMismatch: false,
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
    } else if (arg === '--strict') {
      parsed.strict = true;
    } else if (arg === '--allow-branch-mismatch') {
      parsed.allowBranchMismatch = true;
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
      throw exitError(`未知 overlay 参数: ${arg}`, 2);
    }
  }
  return parsed;
}

function helpText(publicCommand) {
  const title = publicCommand ? `ad-build ${publicCommand}` : 'ad-build overlay';
  const diagnosticOptions = [
    '  --json                 输出机器可读 JSON',
    '  --force                源码 commit 不一致或本地文件冲突时仍继续恢复'
  ];
  if (publicCommand !== 'restore') {
    diagnosticOptions.push('  --allow-branch-mismatch 允许当前 AD 分支与 --branch 不一致，仅用于诊断');
  }
  return [
    title,
    publicCommand ? '说明: 当前版本推荐使用顶层命令。' : '说明: overlay 是兼容入口，新版本推荐使用顶层命令。',
    'Usage:',
    '  ad-build pack --branch <release> [--out <dir>]',
    '  ad-build publish --branch <release> [--overlay <tar.gz>]',
    '  ad-build restore --branch <release> [--force]',
    '  ad-build status',
    '  ad-build doctor [--strict]',
    '  ad-build repair paths',
    '  ad-build repair dpdk',
    '  ad-build verify appd',
    '',
    '默认使用 SSH 产物仓库:',
    `  ${DEFAULT_ARTIFACT_REPO_SSH}`,
    '',
    '诊断选项:',
    ...diagnosticOptions,
    ''
  ].join('\n');
}

function requiredOption(args, index, name) {
  if (!args[index + 1]) {
    throw exitError(`${name} 需要一个值`, 2);
  }
  return args[index + 1];
}

function requiredBranch(options, repoRoot) {
  const branch = options.branch;
  if (!branch) {
    throw exitError('必须显式指定 --branch <分支名>，例如: --branch release-AD7.0.29R2', 2);
  }
  validateBranch(branch);
  return normalizeOutputPath(branch);
}

function assertBranchMatches(action, requestedBranch, gitInfoValue, options = {}) {
  if (options.allowBranchMismatch || !gitInfoValue?.branch || gitInfoValue.branch === requestedBranch) {
    return;
  }
  throw exitError(`${action} 分支不一致：当前 AD 工作区分支是 ${gitInfoValue.branch}，但 --branch 是 ${requestedBranch}；确认要跨分支操作时追加 --allow-branch-mismatch`, 5);
}

function assertManifestBranchMatches(action, requestedBranch, manifest, options = {}) {
  const sourceBranch = manifest?.source_branch;
  const release = manifest?.release;
  assertManifestReleaseMatches(action, requestedBranch, manifest, options);
  if (sourceBranch && sourceBranch !== requestedBranch && !options.allowBranchMismatch) {
    throw exitError(`${action} 分支不一致：overlay 来自 AD 分支 ${sourceBranch}，但 --branch 是 ${requestedBranch}；确认要跨分支操作时追加 --allow-branch-mismatch`, 5);
  }
}

function assertManifestReleaseMatches(action, requestedBranch, manifest, options = {}) {
  const release = manifest?.release;
  if (release && release !== requestedBranch && !options.allowBranchMismatch) {
    throw exitError(`${action} 分支不一致：overlay release 是 ${release}，但 --branch 是 ${requestedBranch}`, 5);
  }
}

function requireGitSourceInfo(gitInfoValue, action) {
  const missing = [];
  if (!gitInfoValue?.branch) {
    missing.push('source_branch');
  }
  if (!gitInfoValue?.commit) {
    missing.push('source_commit');
  }
  if (!gitInfoValue?.remote_url) {
    missing.push('source_repo_url');
  }
  if (missing.length > 0) {
    throw exitError(`${action} 需要可验证的 AD 源码 Git 信息，缺少 ${missing.join(', ')}；请在带 origin remote 的 AD Git 工作区执行`, 5);
  }
}

function requireManifestSourceMetadata(manifest, action) {
  const missing = missingManifestSourceMetadata(manifest);
  if (missing.length > 0) {
    throw exitError(`${action} manifest 缺少源码元数据: ${missing.join(', ')}；请重新执行 ad-build pack`, 5);
  }
}

function requireAuthenticatedOverlayAuth(repoRoot, options = {}, action = 'overlay 操作') {
  if (options.repo || options.env?.AD_BUILD_OVERLAY_REPO_PATH) {
    return null;
  }
  const auth = readAuth(repoRoot, options);
  if (auth?.auth_method === 'ssh' && auth.status === 'authenticated' && auth.key_path) {
    return auth;
  }
  if (auth?.status === 'pending_key_install') {
    throw exitError(`${action} 需要 SSH 登录已通过；当前 key 还没有通过 GitLab 校验。请确认已把 ${auth.public_key_path || '公钥'} 添加到 GitLab SSH Keys，然后重新执行: ad-build login`, 4);
  }
  throw exitError(`${action} 需要先完成 SSH 登录，请执行: ad-build login`, 4);
}

function validateBranch(branch) {
  safePath(branch);
  if (branch.startsWith('.') || branch.endsWith('.') || branch.includes('//')) {
    throw exitError(`无效的 overlay 分支名: ${branch}`, 2);
  }
  if (branch.startsWith('-') || branch.split('/').some((part) => !part || part.startsWith('.') || part.startsWith('-') || part.endsWith('.') || part.endsWith('.lock'))) {
    throw exitError(`无效的 overlay 分支名: ${branch}`, 2);
  }
  if (branch.includes('@{') || /[~^:?*[\]\s\\]/.test(branch)) {
    throw exitError(`无效的 overlay 分支名: ${branch}`, 2);
  }
  if (branch === 'HEAD' || branch.startsWith('refs/') || branch.startsWith('.git/')) {
    throw exitError(`无效的 overlay 分支名: ${branch}`, 2);
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
  const remote = git(repoRoot, ['remote', 'get-url', 'origin'], env);
  return {
    commit: commit.status === 0 ? trim(commit.stdout) || null : null,
    branch: branch.status === 0 ? trim(branch.stdout) || null : null,
    ref: ref.status === 0 ? trim(ref.stdout) || null : null,
    remote_url: remote.status === 0 ? trim(remote.stdout) || null : null
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

function gitProgress(repoRoot, args, env, options = {}) {
  return spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER,
    env: gitEnv(env),
    stdio: progressStdio(options)
  });
}

function gitOk(repoRoot, args, env) {
  const result = git(repoRoot, args, env);
  if (result.error || result.status !== 0) {
    throw exitError(`Git ${args[0]} 执行失败: ${gitFailure(result)}`, 4);
  }
  return result;
}

function gitOkProgress(repoRoot, args, env, options = {}) {
  const result = gitProgress(repoRoot, args, env, options);
  if (result.error || result.status !== 0) {
    throw exitError(`Git ${args[0]} 执行失败: ${gitFailure(result)}`, 4);
  }
  return result;
}

function gitEnvWithOverlayAuth(repoRoot, options = {}, artifactRepo = {}) {
  const env = options.env || process.env;
  if (artifactRepo.local || options.repo || env.AD_BUILD_OVERLAY_REPO_PATH) {
    return env;
  }
  const auth = readAuth(repoRoot, options);
  if (!auth?.key_path) {
    return env;
  }
  return {
    ...env,
    GIT_SSH_COMMAND: [
      'ssh',
      '-i',
      shellQuoteForEnv(auth.key_path),
      '-o',
      'IdentitiesOnly=yes',
      '-o',
      'BatchMode=yes',
      '-o',
      'ConnectTimeout=10'
    ].join(' ')
  };
}

function gitEnv(env = {}) {
  return {
    ...process.env,
    ...(env || {}),
    GIT_TERMINAL_PROMPT: '0'
  };
}

function shellQuoteForEnv(value) {
  const text = normalizeOutputPath(value);
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(text)) {
    return text;
  }
  return `'${text.replace(/'/g, "'\\''")}'`;
}

function gitFailure(result) {
  return result.error?.message || trim(result.stderr) || trim(result.stdout) || (result.signal ? `signal ${result.signal}` : `exit ${result.status}`);
}

function cleanupTempDir(dir) {
  try {
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {
    /* best effort cleanup */
  }
}

function sourceVerificationIssue(manifest, currentGit) {
  const missingManifest = missingManifestSourceMetadata(manifest);
  if (missingManifest.length > 0) {
    return {
      message: `overlay manifest 缺少源码元数据: ${missingManifest.join(', ')}`,
      forceable: false
    };
  }

  const currentIssue = currentSourceVerificationIssue(currentGit);
  if (currentIssue) {
    return currentIssue;
  }
  const drift = sourceDrift(manifest, currentGit);
  return drift ? { message: drift, forceable: true } : null;
}

function currentSourceVerificationIssue(currentGit) {
  const missingCurrent = [];
  if (!currentGit?.branch) {
    missingCurrent.push('branch');
  }
  if (!currentGit?.commit) {
    missingCurrent.push('commit');
  }
  if (!currentGit?.remote_url) {
    missingCurrent.push('remote');
  }
  if (missingCurrent.length === 0) {
    return null;
  }
  return {
    message: `当前 AD 工作区无法读取源码 Git 信息: ${missingCurrent.join(', ')}。请切换到正确的 AD Git 根目录后重试`,
    forceable: false
  };
}

function missingManifestSourceMetadata(manifest = {}) {
  const missing = [];
  if (!manifest.source_branch) {
    missing.push('source_branch');
  }
  if (!manifest.source_commit) {
    missing.push('source_commit');
  }
  if (!manifest.source_repo_url) {
    missing.push('source_repo_url');
  }
  return missing;
}

function sourceDrift(manifest, currentGit) {
  if (manifest.source_branch && currentGit.branch && manifest.source_branch !== currentGit.branch) {
    return `源码分支不一致: ${formatSourceSide('overlay 打包来源', manifest.source_branch, manifest.source_commit)}；${formatSourceSide('当前 AD 工作区', currentGit.branch, currentGit.commit)}`;
  }
  if (manifest.source_commit && currentGit.commit && manifest.source_commit !== currentGit.commit) {
    return `源码 commit 不一致: ${formatSourceSide('overlay 打包来源', manifest.source_branch, manifest.source_commit)}；${formatSourceSide('当前 AD 工作区', currentGit.branch, currentGit.commit)}`;
  }
  return null;
}

function formatSourceSide(label, branch, commit) {
  return `${label} branch=${branch || 'unknown'} commit=${commit || 'unknown'}`;
}

function validateInventory(inventory, manifest, context = {}) {
  if (!inventory || inventory.kind !== 'ad-build-artifact-overlay-inventory' || !Array.isArray(inventory.entries)) {
    throw exitError('overlay inventory 无效', 5);
  }
  for (const entry of inventory.entries) {
    safePath(entry.path);
    if (!['file', 'symlink'].includes(entry.type)) {
      throw exitError(`overlay inventory entry 类型无效: ${entry.path}`, 5);
    }
    if (entry.type === 'file' && entry.sha256 && !/^sha256:[a-f0-9]{64}$/.test(entry.sha256)) {
      throw exitError(`overlay entry sha256 无效: ${entry.path}`, 5);
    }
    if (entry.type === 'symlink') {
      validateInventorySymlinkTarget(entry, {
        repoRoot: context.repoRoot,
        sourceRoot: context.sourceRoot || manifest?.source_root_at_pack_time || DEFAULT_SOURCE_ROOT
      });
    }
  }
  if (manifest?.inventory_sha256) {
    const actual = core.digestJson(inventory);
    if (actual !== manifest.inventory_sha256) {
      throw exitError(`overlay inventory sha256 不一致: 期望 ${manifest.inventory_sha256}, 实际 ${actual}`, 5);
    }
  }
}

function validateInventorySymlinkTarget(entry, context = {}) {
  if (typeof entry.link_target !== 'string' || entry.link_target.length === 0) {
    throw exitError(`overlay symlink target 缺失: ${entry.path}`, 5);
  }
  if (!context.repoRoot) {
    return;
  }
  const resolved = resolveInternalSymlinkTarget({
    repoRoot: context.repoRoot,
    sourceRoot: context.sourceRoot || DEFAULT_SOURCE_ROOT,
    linkPath: path.join(context.repoRoot, entry.path),
    linkTarget: entry.link_target
  });
  if (!resolved) {
    throw exitError(`overlay symlink target 不安全或越过 AD 边界: ${entry.path} -> ${entry.link_target}`, 5);
  }
}

function validatePackReadiness(repoRoot, entries, options = {}) {
  const entryPaths = new Set(entries.map((entry) => entry.path));
  const missing = [];
  for (const required of APPD_REQUIRED_PATHS) {
    const full = path.join(repoRoot, required);
    if (!fs.existsSync(full)) {
      missing.push(required);
      continue;
    }
    if (fs.lstatSync(full).isDirectory()) {
      const prefix = `${normalizeOutputPath(required)}/`;
      if (!entries.some((entry) => entry.path.startsWith(prefix))) {
        missing.push(required);
      }
      continue;
    }
    const normalizedRequired = normalizeOutputPath(required);
    if (!entryPaths.has(normalizedRequired)) {
      missing.push(required);
      continue;
    }
    const stat = fs.lstatSync(full);
    if (!stat.isSymbolicLink()) {
      continue;
    }
    const target = resolveInternalSymlinkTarget({
      repoRoot,
      sourceRoot: options.sourceRoot || repoRoot,
      linkPath: full,
      linkTarget: fs.readlinkSync(full)
    });
    if (!target || !pathExistsOrSymlink(target)) {
      missing.push(`${required} -> target`);
      continue;
    }
    const targetRel = normalizeOutputPath(path.relative(repoRoot, target));
    if (!entryPaths.has(targetRel)) {
      missing.push(`${required} -> ${targetRel}`);
    }
  }
  if (missing.length > 0) {
    throw exitError(`appd 必需的 overlay 路径缺失或为空: ${missing.join(', ')}`, 5);
  }
}

function validateOverlayArchive(artifactPath, inventory) {
  const allowed = new Set(['manifest.json', 'inventory.json', 'files']);
  const entryTypes = new Map();
  for (const entry of inventory.entries || []) {
    safePath(entry.path);
    const entryPath = normalizeOutputPath(entry.path);
    const rel = `files/${entryPath}`;
    entryTypes.set(rel, entry.type);
    const parts = entryPath.split('/');
    for (let index = 1; index <= parts.length; index += 1) {
      allowed.add(`files/${parts.slice(0, index).join('/')}`);
    }
  }

  const list = spawnSync('tar', ['-tzf', artifactPath], {
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER
  });
  if (list.error || list.status !== 0) {
    throw exitError(`读取 tar 成员列表失败: ${list.error?.message || trim(list.stderr) || list.status}`, 4);
  }

  const members = String(list.stdout || '').split(/\r?\n/).filter(Boolean);
  const verbose = spawnSync('tar', ['-tvzf', artifactPath], {
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER
  });
  if (verbose.error || verbose.status !== 0) {
    throw exitError(`读取 tar 成员类型失败: ${verbose.error?.message || trim(verbose.stderr) || verbose.status}`, 4);
  }
  const verboseLines = String(verbose.stdout || '').split(/\r?\n/).filter(Boolean);
  if (verboseLines.length !== members.length) {
    throw exitError('overlay 压缩包成员列表与类型列表不一致', 5);
  }

  const symlinkMembers = new Set();
  const normalizedMembers = [];
  for (let index = 0; index < members.length; index += 1) {
    const raw = members[index];
    const member = normalizeOutputPath(raw).replace(/\/+$/, '');
    normalizedMembers.push(member);
    if (!member || member.startsWith('/') || member.includes('\\') || member.split('/').includes('..')) {
      throw exitError(`overlay 压缩包包含不安全成员: ${raw}`, 5);
    }
    if (!allowed.has(member)) {
      throw exitError(`overlay 压缩包成员不在 inventory 中: ${raw}`, 5);
    }
    const typeFlag = tarVerboseType(verboseLines[index]);
    const expectedType = entryTypes.get(member) || fixedArchiveMemberType(member);
    if (expectedType === 'file' && typeFlag !== 'file') {
      throw exitError(`overlay 压缩包成员类型不匹配: ${raw}`, 5);
    }
    if (expectedType === 'symlink' && typeFlag !== 'symlink') {
      throw exitError(`overlay 压缩包 symlink 成员类型不匹配: ${raw}`, 5);
    }
    if (!expectedType && typeFlag !== 'directory') {
      throw exitError(`overlay 压缩包目录前缀必须是目录: ${raw}`, 5);
    }
    if (typeFlag === 'symlink') {
      symlinkMembers.add(member);
    }
  }

  for (const member of normalizedMembers) {
    const parts = member.split('/');
    let prefix = '';
    for (const part of parts.slice(0, -1)) {
      prefix = prefix ? `${prefix}/${part}` : part;
      if (symlinkMembers.has(prefix)) {
        throw exitError(`overlay 压缩包成员位于 symlink 前缀下，已拒绝: ${member}`, 5);
      }
    }
  }
}

function fixedArchiveMemberType(member) {
  if (member === 'manifest.json' || member === 'inventory.json') {
    return 'file';
  }
  if (member === 'files') {
    return 'directory';
  }
  return null;
}

function tarVerboseType(line) {
  const type = String(line || '')[0];
  if (type === 'd') {
    return 'directory';
  }
  if (type === '-' || type === 'r') {
    return 'file';
  }
  if (type === 'l') {
    return 'symlink';
  }
  if (type === 'h') {
    return 'hardlink';
  }
  return 'other';
}

function resolveRepoFile(releaseDir, relative) {
  if (!relative) {
    throw exitError('latest overlay 指针缺少 manifest 路径', 5);
  }
  safePath(relative);
  const full = path.join(releaseDir, relative);
  assertInside(releaseDir, full, 'overlay repo file');
  if (!fs.existsSync(full)) {
    throw exitError(`产物仓库文件不存在: ${normalizeOutputPath(path.relative(releaseDir, full))}`, 3);
  }
  return full;
}

function resolveInventoryPath(manifestPath, manifest) {
  const value = manifest.inventory || 'inventory.json';
  safePath(value);
  const full = path.join(path.dirname(manifestPath), value);
  assertInside(path.dirname(manifestPath), full, 'overlay inventory file');
  if (!fs.existsSync(full)) {
    throw exitError(`overlay inventory 不存在: ${normalizeOutputPath(full)}`, 3);
  }
  return full;
}

function resolveArtifactPath(repoRoot, releaseDir, artifactPath) {
  if (!artifactPath) {
    throw exitError('overlay manifest 缺少 artifact_path', 5);
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
    throw exitError('当前 overlay 状态不存在，请执行: ad-build restore --branch <release>', 3);
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

function resolveInternalSymlinkTarget({ repoRoot, sourceRoot, linkPath, linkTarget }) {
  const raw = String(linkTarget || '');
  if (!raw) {
    return null;
  }

  const normalizedTarget = normalizeRootedSymlinkPath(raw);
  const normalizedSourceRoot = normalizeRootPathForPrefix(sourceRoot || '');
  if (normalizedSourceRoot && (normalizedTarget === normalizedSourceRoot || normalizedTarget.startsWith(`${normalizedSourceRoot}/`))) {
    const rel = normalizedTarget.slice(normalizedSourceRoot.length).replace(/^\/+/, '');
    if (!isSafeRelativePath(rel)) {
      return null;
    }
    const candidate = path.resolve(repoRoot, rel);
    return isInsidePath(repoRoot, candidate) ? candidate : null;
  }

  const candidate = path.isAbsolute(raw) || path.win32.isAbsolute(raw)
    ? path.resolve(raw)
    : path.resolve(path.dirname(linkPath), raw);
  return isInsidePath(repoRoot, candidate) ? candidate : null;
}

function normalizeRootedSymlinkPath(value) {
  const normalized = normalizeOutputPath(value);
  if (normalized.startsWith('/')) {
    return path.posix.normalize(normalized);
  }
  if (path.win32.isAbsolute(normalized)) {
    return normalizeOutputPath(path.win32.normalize(normalized));
  }
  return normalized;
}

function normalizeRootPathForPrefix(value) {
  const normalized = normalizeRootedSymlinkPath(value);
  if (normalized === '/') {
    return normalized;
  }
  return normalized.replace(/\/+$/, '');
}

function resolveSymlinkDisplayPath({ linkPath, linkTarget }) {
  const raw = String(linkTarget || '');
  if (!raw) {
    return '';
  }
  const normalizedTarget = normalizeOutputPath(raw);
  if (normalizedTarget.startsWith('/')) {
    return path.posix.normalize(normalizedTarget);
  }
  if (path.win32.isAbsolute(raw)) {
    return normalizeOutputPath(path.win32.normalize(raw));
  }
  return normalizeOutputPath(path.resolve(path.dirname(linkPath), raw));
}

function isInsidePath(parent, child) {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function safePath(file) {
  const value = normalizeOutputPath(file);
  if (!value || value.startsWith('/') || path.win32.isAbsolute(file) || value.split('/').includes('..')) {
    throw exitError(`overlay 路径不安全: ${file}`, 5);
  }
}

function isSafeRelativePath(file) {
  try {
    safePath(file);
    return true;
  } catch {
    return false;
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
      throw exitError(`overlay 恢复父路径是 symlink，已拒绝: ${normalizeOutputPath(path.relative(repoRoot, current))}`, 5);
    }
    if (!stat.isDirectory()) {
      throw exitError(`overlay 恢复父路径不是目录: ${normalizeOutputPath(path.relative(repoRoot, current))}`, 5);
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
      throw exitError(`overlay 发布路径包含 symlink，已拒绝: ${normalizeOutputPath(path.relative(root, current))}`, 5);
    }
    if (!stat.isDirectory()) {
      throw exitError(`overlay 发布路径组件不是目录: ${normalizeOutputPath(path.relative(root, current))}`, 5);
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
    throw exitError('ad-build 状态目录需要 HOME 或 USERPROFILE', 4);
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
      throw exitError(`overlay 缓存路径包含 symlink，已拒绝: ${normalizeOutputPath(path.relative(root, current))}`, 5);
    }
    if (!stat.isDirectory()) {
      throw exitError(`overlay 缓存路径组件不是目录: ${normalizeOutputPath(path.relative(root, current))}`, 5);
    }
  }
}

function assertInside(parent, child, label) {
  const relative = path.relative(parent, child);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw exitError(`${label} 越过父目录边界: ${normalizeOutputPath(child)}`, 5);
  }
}

function runTar(args, options = {}, label = 'tar') {
  const result = spawnSync('tar', tarProgressArgs(args, label), {
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER,
    stdio: progressStdio(options)
  });
  if (result.error || result.status !== 0) {
    throw exitError(`tar 执行失败: ${result.error?.message || trim(result.stderr) || result.status}`, 4);
  }
}

function progressStdio(options = {}) {
  if (options.progress === false) {
    return ['ignore', 'pipe', 'pipe'];
  }
  return ['ignore', 'pipe', 'inherit'];
}

function tarProgressArgs(args, label) {
  if (!tarSupportsCheckpoint()) {
    return args;
  }
  return [
    '--checkpoint=10000',
    `--checkpoint-action=echo=[ad-build] ${label}: 已处理 %u 个 tar 记录`,
    ...args
  ];
}

let gnuTarCheckpointSupport = null;

function tarSupportsCheckpoint() {
  if (process.platform === 'win32') {
    return false;
  }
  if (gnuTarCheckpointSupport !== null) {
    return gnuTarCheckpointSupport;
  }
  const result = spawnSync('tar', ['--version'], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  gnuTarCheckpointSupport = !result.error && result.status === 0 && /GNU tar/i.test(`${result.stdout}\n${result.stderr}`);
  return gnuTarCheckpointSupport;
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

function commandExists(command, env) {
  if (path.isAbsolute(command) && fs.existsSync(command)) {
    return true;
  }
  const suffixes = process.platform === 'win32' && !path.extname(command)
    ? ['.cmd', '.bat', '.exe', '']
    : [''];
  for (const dir of String(env.PATH || env.Path || '').split(path.delimiter).filter(Boolean)) {
    for (const suffix of suffixes) {
      const full = path.join(dir, `${command}${suffix}`);
      if (fs.existsSync(full)) {
        return true;
      }
    }
  }
  return false;
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
    `编译验证结果: ${result.status}`,
    `模块: ${result.module}`,
    `模块目录: ${result.module_dir}`,
    `退出码: ${result.exit_code}`,
    `日志: ${result.log_path}`
  ];
  if (result.first_real_error) {
    lines.push(`首个有效错误: ${result.first_real_error.message}`);
    lines.push(`错误来源: ${result.first_real_error.source_file}:${result.first_real_error.line}`);
  }
  if (result.suggested_next_command) {
    lines.push(`建议下一步: ${result.suggested_next_command}`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderStatusText(result) {
  return [
    `overlay 状态: ${result.status}`,
    `登录方式: ${result.auth_method || '缺失'}`,
    `分支: ${result.release || '无'}`,
    `建议下一步: ${result.suggested_next_command}`,
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
    `ad-build restore --branch ${manifest.release}`,
    '```',
    ''
  ].join('\n');
}

function suggestNextCommand(firstRealError, moduleName) {
  const message = `${firstRealError?.message || ''} ${firstRealError?.source_file || ''}`.toLowerCase();
  if (
    message.includes('redefinition')
    || message.includes('redeclaration')
    || message.includes('dpdk')
    || message.includes('meson')
    || message.includes('ninja')
    || message.includes('rdma_lib_path')
    || message.includes('/libs/rdma-core')
    || message.includes('libs/rdma-core')
  ) {
    return 'ad-build repair dpdk';
  }
  if (message.includes('mlx5dv.h')) {
    return 'ad-build repair paths';
  }
  if (message.includes('no such file or directory')) {
    return 'ad-build repair paths';
  }
  return 'ad-build doctor';
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

function pathExistsOrSymlink(file) {
  try {
    fs.lstatSync(file);
    return true;
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
  runOverlayCli,
  _internal: {
    filteredFetchIgnoredFilter,
    shouldFallbackFilteredFetch
  }
};
