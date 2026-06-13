const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');
const core = require('./core');
const moduleMap = require('./module-map');

const DEFAULT_MODULE_MAP_PATH = 'tools/module-map.yaml';
const OUTPUT_DIR = '.ad-build';
const BASELINE_SAVE_REQUIRED_METADATA_FIELDS = [
  'commit',
  'repo_id',
  'repo_key',
  'ref_key',
  'docker_identity',
  'build_config_digest',
  'toolchain_digest',
  'submodule_digest',
  'env_key',
  'ad_build_version',
  'ad_build_source_digest'
];

async function buildDoctorResult(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const env = options.env || process.env;
  const baselineDir = options.baselineDir ?? env.AD_BUILD_BASELINE_DIR ?? null;
  const moduleMapPath = options.moduleMapPath || DEFAULT_MODULE_MAP_PATH;
  const checks = [
    checkCommand('node_available', process.execPath, ['--version'], 'node is available'),
    checkCommand('git_available', 'git', ['--version'], 'git is available'),
    checkGitRepo(repoRoot),
    checkCommand('sh_available', 'sh', ['--version'], 'sh is available'),
    checkCommand('make_available', 'make', ['--version'], 'make is available'),
    checkCommand('npm_available', 'npm', ['--version'], 'npm is available', { missingStatus: 'warning' }),
    checkModuleMapParseable(repoRoot, moduleMapPath),
    checkBaselineDirConfigured(baselineDir),
    checkBaselineDirReadable(baselineDir),
    checkBaselinePublishMode(env)
  ];
  const warnings = checks
    .filter((check) => check.status === 'warning')
    .map((check) => ({ name: check.name, message: check.message }));

  return {
    schema_version: 1,
    generated_at: core.nowIso(),
    overall_status: overallStatus(checks),
    checks,
    errors: [],
    warnings
  };
}

function buildModulesResult(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const moduleMapPath = options.moduleMapPath || DEFAULT_MODULE_MAP_PATH;
  const config = readModuleMap({ repoRoot, moduleMapPath });

  return {
    schema_version: 1,
    generated_at: core.nowIso(),
    module_map_path: normalizeOutputPath(moduleMapPath),
    modules: config.modules.map((entry) => ({
      name: entry.name,
      display_name: entry.display_name,
      paths: entry.paths,
      cwd: entry.cwd,
      build: entry.build,
      timeout_seconds: entry.timeout_seconds,
      env: entry.env,
      log_name: entry.log_name
    }))
  };
}

function buildDiffSummary(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const baseRef = options.baseRef || 'HEAD';
  const errors = [];
  const warnings = [];
  const trackedFiles = [];
  const trackedPaths = new Set();
  const diffResult = runGit(repoRoot, ['diff', '--name-status', '-z', '--find-renames=50%', '--find-copies=50%', '--find-copies-harder', baseRef, '--']);

  if (diffResult.status === 0) {
    for (const entry of parseNameStatusOutput(diffResult.stdout)) {
      trackedFiles.push({
        ...entry,
        is_untracked: false,
        is_binary: detectBinary(repoRoot, baseRef, entry.path)
      });
      trackedPaths.add(entry.path);
    }
  } else if (isMissingBaseRef(diffResult, baseRef)) {
    const cachedResult = runGit(repoRoot, ['diff', '--cached', '--name-status', '-z', '--find-renames=50%', '--find-copies=50%', '--find-copies-harder', '--']);
    if (cachedResult.status !== 0) {
      throw new Error(`git diff --cached failed: ${trim(cachedResult.stderr) || `exit ${cachedResult.status}`}`);
    }
    for (const entry of parseNameStatusOutput(cachedResult.stdout)) {
      trackedFiles.push({
        ...entry,
        is_untracked: false,
        is_binary: detectCachedBinary(repoRoot, entry.path)
      });
      trackedPaths.add(entry.path);
    }
    warnings.push({
      message: `base ref ${baseRef} could not be resolved; staged diff fallback was used`
    });
  } else {
    throw new Error(`git diff failed: ${trim(diffResult.stderr) || `exit ${diffResult.status}`}`);
  }

  const untrackedResult = runGit(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z']);
  if (untrackedResult.status !== 0) {
    throw new Error(`git ls-files failed: ${trim(untrackedResult.stderr) || `exit ${untrackedResult.status}`}`);
  }

  const untrackedFiles = nulFields(untrackedResult.stdout)
    .map(normalizeOutputPath)
    .filter((filePath) => !trackedPaths.has(filePath))
    .map((filePath) => ({
      path: filePath,
      status: 'untracked',
      old_path: null,
      is_untracked: true,
      is_binary: null
    }));

  return {
    schema_version: 1,
    generated_at: core.nowIso(),
    base_ref: baseRef,
    files: [...trackedFiles, ...untrackedFiles].sort(compareFiles),
    errors,
    warnings
  };
}

function buildMapResult(options = {}) {
  const diffSummary = options.diffSummary || { files: [] };
  const moduleMapConfig = options.moduleMapConfig;
  if (!moduleMapConfig) {
    throw new Error('buildMapResult requires moduleMapConfig');
  }

  const warnings = [];
  const errors = [];
  const changedFiles = collectChangedFileEvidence(diffSummary.files || []);
  const moduleMatches = [];
  const moduleMatchKeys = new Set();
  const matchedModuleNames = new Set();
  const mappedFiles = new Set();

  for (const filePath of changedFiles) {
    for (const moduleEntry of moduleMapConfig.modules) {
      for (const pattern of moduleEntry.paths) {
        if (!moduleMap.pathMatches(filePath, pattern)) {
          continue;
        }
        const matchKey = `${moduleEntry.name}\0${filePath}\0${pattern}`;
        if (!moduleMatchKeys.has(matchKey)) {
          moduleMatchKeys.add(matchKey);
          moduleMatches.push({
            module: moduleEntry.name,
            file: filePath,
            pattern
          });
        }
        matchedModuleNames.add(moduleEntry.name);
        mappedFiles.add(filePath);
      }
    }
  }

  const moduleMapChanged = changedFiles.includes(DEFAULT_MODULE_MAP_PATH);
  if (moduleMapChanged) {
    warnings.push({
      message: `${DEFAULT_MODULE_MAP_PATH} changed; module mapping is not trusted for narrowing verification scope`
    });
  }

  return {
    schema_version: 1,
    generated_at: core.nowIso(),
    changed_files: changedFiles,
    module_matches: moduleMatches,
    risk_matches: moduleMap.findRiskMatches(changedFiles, moduleMapConfig.riskRulesHigh),
    unmapped_files: changedFiles.filter((filePath) => !mappedFiles.has(filePath)),
    valid_verify_modules: [...matchedModuleNames].sort(),
    mapping_trusted: !moduleMapChanged,
    errors,
    warnings
  };
}

async function runDoctor(options = {}) {
  const env = options.env || process.env;
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env,
    cwd: options.cwd
  });
  const result = await buildDoctorResult({
    repoRoot,
    baselineDir: options.baselineDir,
    moduleMapPath: options.moduleMapPath,
    env
  });
  const outDir = path.join(repoRoot, OUTPUT_DIR);

  core.writeJson(path.join(outDir, 'doctor.json'), result);
  writeText(path.join(outDir, 'doctor.md'), renderDoctorMarkdown(result));
  return result;
}

function runModules(options = {}) {
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env: options.env || process.env,
    cwd: options.cwd
  });
  const result = buildModulesResult({
    repoRoot,
    moduleMapPath: options.moduleMapPath
  });
  const outDir = path.join(repoRoot, OUTPUT_DIR);

  core.writeJson(path.join(outDir, 'modules.json'), result);
  writeText(path.join(outDir, 'modules.md'), renderModulesMarkdown(result));
  return result;
}

function runDiff(options = {}) {
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env: options.env || process.env,
    cwd: options.cwd
  });
  const result = buildDiffSummary({
    repoRoot,
    baseRef: options.baseRef || 'HEAD'
  });
  const outDir = path.join(repoRoot, OUTPUT_DIR);

  core.writeJson(path.join(outDir, 'diff-summary.json'), result);
  writeText(path.join(outDir, 'diff-files.txt'), `${result.files.map((file) => file.path).join('\n')}\n`);
  return result;
}

function runMap(options = {}) {
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env: options.env || process.env,
    cwd: options.cwd
  });
  runDiff({
    repoRoot,
    env: options.env || process.env,
    cwd: options.cwd,
    baseRef: options.baseRef || 'HEAD'
  });

  const diffSummary = core.readJson(path.join(repoRoot, OUTPUT_DIR, 'diff-summary.json'));
  const moduleMapConfig = readModuleMap({
    repoRoot,
    moduleMapPath: options.moduleMapPath || DEFAULT_MODULE_MAP_PATH
  });
  const result = buildMapResult({ diffSummary, moduleMapConfig });
  const outDir = path.join(repoRoot, OUTPUT_DIR);

  core.writeJson(path.join(outDir, 'module-map-result.json'), result);
  writeText(path.join(outDir, 'module-map-result.md'), renderMapMarkdown(result));
  return result;
}

async function runVerifyModules(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const runRoot = path.resolve(options.runRoot || path.join(repoRoot, OUTPUT_DIR, 'runs'));
  const env = options.env || process.env;
  const startedAt = core.nowIso();
  const runId = options.runId || makeRunId(startedAt);
  const runDir = path.join(runRoot, runId);
  const modules = options.modules || [];
  const results = [];
  let stopped = false;

  fs.mkdirSync(runDir, { recursive: true });

  for (const moduleEntry of modules) {
    if (stopped) {
      results.push(buildNotRunModuleResult({ repoRoot, runDir, runId, moduleEntry }));
      continue;
    }

    const result = await runVerifyModule({
      repoRoot,
      runDir,
      runId,
      env,
      moduleEntry
    });
    results.push(result);
    if (result.status === 'failed' || result.status === 'timeout') {
      stopped = true;
    }
  }

  const summary = {
    schema_version: 1,
    run_id: runId,
    generated_at: core.nowIso(),
    requested_modules: modules.map((moduleEntry) => moduleEntry.name),
    results,
    overall_status: computeVerifyOverallStatus(results),
    errors: [],
    warnings: []
  };

  core.writeJson(path.join(runDir, 'verify-summary.json'), summary);
  writeText(path.join(runDir, 'verify-summary.md'), renderVerifySummaryMarkdown(summary));
  return summary;
}

async function runVerify(options = {}) {
  const env = options.env || process.env;
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env,
    cwd: options.cwd
  });
  const requestedModules = options.modules || [];
  if (requestedModules.length === 0) {
    const error = new Error('verify requires at least one module name');
    error.exitCode = 2;
    throw error;
  }

  const config = readModuleMap({
    repoRoot,
    moduleMapPath: options.moduleMapPath || DEFAULT_MODULE_MAP_PATH
  });
  const unknownModules = requestedModules.filter((name) => !config.modulesByName[name]);
  if (unknownModules.length > 0) {
    const summary = writeUnknownModuleVerifySummary({
      repoRoot,
      runRoot: path.join(repoRoot, OUTPUT_DIR, 'runs'),
      requestedModules,
      config,
      unknownModules
    });
    const error = new Error(`unknown module: ${unknownModules.join(', ')}`);
    error.exitCode = 2;
    error.summary = summary;
    throw error;
  }

  return runVerifyModules({
    repoRoot,
    modules: requestedModules.map((name) => config.modulesByName[name]),
    runRoot: path.join(repoRoot, OUTPUT_DIR, 'runs'),
    env
  });
}

function runReport(options = {}) {
  const env = options.env || process.env;
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env,
    cwd: options.cwd
  });
  const runId = options.runId;
  if (!runId) {
    const error = new Error('report requires a run id');
    error.exitCode = 2;
    throw error;
  }
  if (!/^[A-Za-z0-9_.:+-]+$/.test(runId)) {
    const error = new Error(`invalid run id: ${runId}`);
    error.exitCode = 2;
    throw error;
  }

  const runDir = path.join(repoRoot, OUTPUT_DIR, 'runs', runId);
  if (!fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) {
    const error = new Error(`verify run not found: ${runId}`);
    error.exitCode = 3;
    throw error;
  }

  const summaryFile = path.join(runDir, 'verify-summary.json');
  const errors = [];
  let summary = null;
  try {
    summary = core.readJson(summaryFile);
  } catch (error) {
    errors.push(`verify-summary.json could not be read: ${error.message}`);
  }

  if (summary) {
    errors.push(...validateVerifySummaryForReport({ repoRoot, runDir, summary }));
  }

  const reportStatus = errors.length > 0 ? 'partial' : summary.overall_status;
  const report = renderVerifyReportMarkdown({
    repoRoot,
    runDir,
    runId,
    summary,
    reportStatus,
    errors
  });
  writeText(path.join(runDir, 'report.md'), report);

  return {
    run_id: runId,
    status: reportStatus,
    report_path: normalizeOutputPath(path.join(OUTPUT_DIR, 'runs', runId, 'report.md')),
    errors,
    exitCode: errors.length > 0 ? 1 : 0
  };
}

function baselinePath(baselineDir, repoKey, commit, envKey) {
  if (!/^[a-f0-9]{40}$/.test(String(commit || ''))) {
    throw new Error('invalid commit: expected full 40-character lowercase hex SHA');
  }

  return path.join(
    baselineDir,
    'repos',
    core.safeDigestKey(repoKey),
    'commits',
    commit,
    'env',
    core.safeDigestKey(envKey),
    'baseline.json'
  );
}

function latestSuccessPath(baselineDir, repoKey, refKey, envKey) {
  return path.join(
    baselineDir,
    'repos',
    core.safeDigestKey(repoKey),
    'refs',
    core.safeDigestKey(refKey),
    'env',
    core.safeDigestKey(envKey),
    'latest-success.json'
  );
}

function validateBaselineSave(fullBuildResult, options = {}) {
  if (!options.publishEnabled) {
    return {
      ok: false,
      code: 'publish_mode_disabled',
      message: 'baseline-save requires publish mode: AD_BUILD_BASELINE_PUBLISH=1'
    };
  }
  if (!trim(options.publisher)) {
    return {
      ok: false,
      code: 'publisher_required',
      message: 'baseline-save requires AD_BUILD_BASELINE_PUBLISHER'
    };
  }
  if (!fullBuildResult || typeof fullBuildResult !== 'object') {
    return {
      ok: false,
      code: 'missing_full_build_result',
      message: 'full-build result is missing or invalid'
    };
  }
  if (fullBuildResult.exit_code !== 0 || fullBuildResult.status === 'failed') {
    return {
      ok: false,
      code: 'full_build_failed',
      message: 'baseline-save requires a passed full-build result'
    };
  }

  const currentMetadata = options.currentMetadata;
  if (!currentMetadata) {
    return {
      ok: false,
      code: 'missing_metadata',
      message: 'current environment metadata is required'
    };
  }
  for (const field of BASELINE_SAVE_REQUIRED_METADATA_FIELDS) {
    if (!fullBuildResult[field]) {
      return {
        ok: false,
        code: 'missing_metadata',
        message: `full-build result is missing required metadata: ${field}`
      };
    }
    if (!currentMetadata[field]) {
      return {
        ok: false,
        code: 'missing_metadata',
        message: `current environment is missing required metadata: ${field}`
      };
    }
    if (fullBuildResult[field] !== currentMetadata[field]) {
      return {
        ok: false,
        code: 'metadata_mismatch',
        message: `full-build metadata does not match current environment: ${field}`
      };
    }
  }

  if (options.requireClean !== false && options.worktreeClean === false) {
    return {
      ok: false,
      code: 'dirty_worktree',
      message: 'baseline-save requires a clean git worktree'
    };
  }

  return { ok: true };
}

function validateBaselineIdentifiers(fullBuildResult) {
  if (!fullBuildResult || typeof fullBuildResult !== 'object') {
    return {
      ok: false,
      code: 'invalid_full_build_metadata',
      message: 'full-build result is missing or invalid'
    };
  }
  if (!/^[a-f0-9]{40}$/.test(String(fullBuildResult.commit || ''))) {
    return {
      ok: false,
      code: 'invalid_commit',
      message: 'full-build result has unsafe or missing commit identifier'
    };
  }
  for (const field of ['repo_key', 'env_key', 'ref_key']) {
    try {
      core.safeDigestKey(fullBuildResult[field]);
    } catch {
      return {
        ok: false,
        code: `invalid_${field}`,
        message: `full-build result has unsafe or missing ${field} identifier`
      };
    }
  }
  if (!fullBuildResult.ref) {
    return {
      ok: false,
      code: 'invalid_ref',
      message: 'full-build result has unsafe or missing ref identifier'
    };
  }
  return { ok: true };
}

function validateBaselineDirForSave(baselineDir) {
  try {
    const stat = fs.statSync(baselineDir);
    if (!stat.isDirectory()) {
      return {
        ok: false,
        code: 'baseline_dir_unavailable',
        message: `baseline path is not a directory: ${baselineDir}`
      };
    }
    fs.accessSync(baselineDir, fs.constants.R_OK | fs.constants.W_OK);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: 'baseline_dir_unavailable',
      message: `baseline directory is not available for saving: ${error.message}`
    };
  }
}

function buildPrecheckResult(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const env = options.env || process.env;
  const baselineDir = options.baselineDir ?? env.AD_BUILD_BASELINE_DIR ?? null;
  const metadata = options.metadata || collectMetadata({ repoRoot, env });
  const warnings = [...(metadata.warnings || [])];
  const errors = [];
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    baseline_status: 'missing',
    worktree_clean: metadata.worktree_clean ?? null,
    baseline_dir_configured: Boolean(baselineDir),
    baseline_path: null,
    nearest_baseline: null,
    errors,
    warnings,
    ...metadataFields(metadata)
  };

  if (!baselineDir) {
    result.baseline_status = 'dir_unconfigured';
    return result;
  }

  try {
    const stat = fs.statSync(baselineDir);
    if (!stat.isDirectory()) {
      result.baseline_status = 'dir_unavailable';
      errors.push({ message: `baseline path is not a directory: ${baselineDir}` });
      return result;
    }
    fs.accessSync(baselineDir, fs.constants.R_OK);
  } catch (error) {
    result.baseline_status = 'dir_unavailable';
    errors.push({ message: `baseline directory is not readable or does not exist: ${error.message}` });
    return result;
  }

  if (!metadata.commit || !metadata.repo_key || !metadata.env_key) {
    result.baseline_status = 'invalid_metadata';
    errors.push({ message: 'current commit, repo_key, or env_key is unavailable' });
    return result;
  }

  result.baseline_path = baselinePath(baselineDir, metadata.repo_key, metadata.commit, metadata.env_key);
  if (!fs.existsSync(result.baseline_path)) {
    result.baseline_status = 'missing';
    result.nearest_baseline = findNearestBaseline({ baselineDir, metadata, warnings, env });
    return result;
  }

  let baseline;
  try {
    baseline = core.readJson(result.baseline_path);
  } catch (error) {
    result.baseline_status = 'invalid_metadata';
    errors.push({ message: `baseline could not be read: ${error.message}` });
    return result;
  }

  const baselineCheck = validateBaselineForPrecheck(baseline, metadata, {
    baselinePath: result.baseline_path,
    env
  });
  result.baseline_status = baselineCheck.status;
  if (baselineCheck.message) {
    (baselineCheck.status === 'matched' ? warnings : errors).push({ message: baselineCheck.message });
  }
  return result;
}

function runFullBuild(options = {}) {
  const env = options.env || process.env;
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env,
    cwd: options.cwd
  });
  const command = options.command || [];
  if (!Array.isArray(command) || command.length === 0) {
    throw new Error('full-build requires a command after --');
  }

  const latestDir = path.join(repoRoot, OUTPUT_DIR, 'full-build', 'latest');
  const logFile = path.join(latestDir, 'compile.log');
  const resultFile = path.join(latestDir, 'full-build-result.json');
  const startedAt = core.nowIso();
  const startedMs = Date.now();
  const runId = makeRunId(startedAt);
  const run = spawnSync(command[0], command.slice(1), {
    cwd: repoRoot,
    env,
    encoding: 'utf8'
  });
  const endedAt = core.nowIso();
  const exitCode = run.error ? 127 : run.status;
  const log = `${run.stdout || ''}${run.stderr || ''}${run.error ? `${run.error.message}\n` : ''}`;
  const metadata = collectMetadata({ repoRoot, env });
  const result = {
    schema_version: 1,
    run_id: runId,
    generated_at: endedAt,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: Math.max(0, (Date.now() - startedMs) / 1000),
    command,
    exit_code: exitCode,
    status: exitCode === 0 ? 'passed' : 'failed',
    log_path: normalizeOutputPath(path.join(OUTPUT_DIR, 'full-build', 'latest', 'compile.log')),
    ...metadataFields(metadata)
  };

  writeText(logFile, log);
  core.writeJson(resultFile, result);
  return result;
}

function runBaselineSave(options = {}) {
  const env = options.env || process.env;
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env,
    cwd: options.cwd
  });
  const fromRun = options.fromRun || 'latest';
  if (fromRun !== 'latest') {
    throw new Error('baseline-save currently supports only --from-run latest');
  }

  const resultFile = path.join(repoRoot, OUTPUT_DIR, 'full-build', fromRun, 'full-build-result.json');
  if (!fs.existsSync(resultFile)) {
    const error = new Error(`full-build result not found: ${resultFile}`);
    error.exitCode = 3;
    throw error;
  }

  const fullBuildResult = core.readJson(resultFile);
  const currentMetadata = collectMetadata({ repoRoot, env });
  const validation = validateBaselineSave(fullBuildResult, {
    publishEnabled: env.AD_BUILD_BASELINE_PUBLISH === '1',
    publisher: env.AD_BUILD_BASELINE_PUBLISHER,
    currentMetadata,
    worktreeClean: currentMetadata.worktree_clean,
    requireClean: options.requireClean
  });
  if (!validation.ok) {
    return safetyFailure(validation.message, validation.code);
  }

  const identifierValidation = validateBaselineIdentifiers(fullBuildResult);
  if (!identifierValidation.ok) {
    return safetyFailure(identifierValidation.message, identifierValidation.code);
  }

  const baselineDir = options.baselineDir ?? env.AD_BUILD_BASELINE_DIR;
  if (!baselineDir) {
    return safetyFailure('baseline-save requires AD_BUILD_BASELINE_DIR', 'baseline_dir_unconfigured');
  }
  const baselineDirValidation = validateBaselineDirForSave(baselineDir);
  if (!baselineDirValidation.ok) {
    return safetyFailure(baselineDirValidation.message, baselineDirValidation.code);
  }

  const target = baselinePath(baselineDir, fullBuildResult.repo_key, fullBuildResult.commit, fullBuildResult.env_key);
  const targetDir = path.dirname(target);
  const createdAt = core.nowIso();
  const sourceResultPath = path.join(repoRoot, OUTPUT_DIR, 'full-build', fromRun, 'full-build-result.json');
  const sourceLogPath = path.join(repoRoot, fullBuildResult.log_path);
  const publish = publishBaselineDirectory({
    targetDir,
    sourceLogPath,
    sourceResultPath,
    fullBuildResult,
    publisher: env.AD_BUILD_BASELINE_PUBLISHER,
    dirtyWorktree: currentMetadata.worktree_clean === false,
    createdAt,
    replace: options.replace,
    env
  });
  if (!publish.ok) {
    return safetyFailure(publish.message, publish.code);
  }

  let latestPath = null;
  let latestUpdated = false;
  if (fullBuildResult.ref_key) {
    const latest = publishLatestSuccess({
      baselineDir,
      fullBuildResult,
      baselinePath: target,
      manifestSha256: publish.manifestSha256,
      createdAt,
      env
    });
    if (!latest.ok) {
      return safetyFailure(latest.message, latest.code);
    }
    latestPath = latest.latest_success_path;
    latestUpdated = latest.updated;
  }

  return {
    ok: true,
    baseline_path: target,
    latest_success_path: latestPath,
    latest_success_updated: latestUpdated
  };
}

function safetyFailure(message, code) {
  return {
    ok: false,
    exitCode: 4,
    message,
    code
  };
}

function publishBaselineDirectory(options) {
  const targetDir = options.targetDir;
  const lockDir = `${targetDir}.lock`;
  let stagingDir = null;
  let backupDir = null;
  if (!acquireDirectoryLock(lockDir, options.env)) {
    return { ok: false, code: 'baseline_lock_unavailable', message: `baseline target lock is unavailable: ${lockDir}` };
  }

  try {
    if (fs.existsSync(targetDir) && !options.replace) {
      return { ok: false, code: 'baseline_exists', message: `baseline already exists; use --replace to overwrite: ${path.join(targetDir, 'baseline.json')}` };
    }

    stagingDir = makeStagingDir(targetDir);
    const manifestPath = path.join(stagingDir, 'artifact-manifest.txt');
    const copiedLogPath = path.join(stagingDir, 'compile.log');
    const copiedResultPath = path.join(stagingDir, 'full-build-result.json');
    copyIfExists(options.sourceLogPath, copiedLogPath);
    copyIfExists(options.sourceResultPath, copiedResultPath);
    writeText(manifestPath, buildArtifactManifest(stagingDir, [
      'compile.log',
      'full-build-result.json'
    ]));
    const manifestSha256 = `sha256:${sha256File(manifestPath)}`;
    const baseline = {
      schema_version: 1,
      producer: 'ad-build',
      publisher: options.publisher,
      created_at: options.createdAt,
      updated_at: options.createdAt,
      run_id: options.fullBuildResult.run_id,
      dirty_worktree: options.dirtyWorktree,
      manifest_sha256: manifestSha256,
      command: options.fullBuildResult.command,
      exit_code: options.fullBuildResult.exit_code,
      status: options.fullBuildResult.status,
      log_path: 'compile.log',
      full_build: {
        run_id: options.fullBuildResult.run_id,
        result_path: 'full-build-result.json',
        log_path: 'compile.log',
        result_sha256: fs.existsSync(copiedResultPath) ? `sha256:${sha256File(copiedResultPath)}` : null,
        command: options.fullBuildResult.command,
        status: options.fullBuildResult.status,
        exit_code: options.fullBuildResult.exit_code,
        started_at: options.fullBuildResult.started_at,
        ended_at: options.fullBuildResult.ended_at,
        duration_seconds: options.fullBuildResult.duration_seconds
      },
      artifacts: {
        manifest_path: 'artifact-manifest.txt',
        compile_log_path: 'compile.log',
        full_build_result_path: 'full-build-result.json'
      },
      ...metadataFields(options.fullBuildResult)
    };
    core.writeJson(path.join(stagingDir, 'baseline.json'), baseline);

    if (fs.existsSync(targetDir)) {
      if (!options.replace) {
        return { ok: false, code: 'baseline_exists', message: `baseline already exists; use --replace to overwrite: ${path.join(targetDir, 'baseline.json')}` };
      }
      backupDir = makeBackupDir(targetDir);
      fs.renameSync(targetDir, backupDir);
    }
    try {
      fs.renameSync(stagingDir, targetDir);
      stagingDir = null;
      if (backupDir) {
        fs.rmSync(backupDir, { recursive: true, force: true });
        backupDir = null;
      }
    } catch (error) {
      if (backupDir && !fs.existsSync(targetDir) && fs.existsSync(backupDir)) {
        try {
          fs.renameSync(backupDir, targetDir);
          backupDir = null;
        } catch {
          // Preserve the backup directory if restoration fails.
        }
      }
      throw error;
    }
    return { ok: true, manifestSha256 };
  } finally {
    if (stagingDir) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    releaseDirectoryLock(lockDir);
  }
}

function publishLatestSuccess(options) {
  const latestPath = latestSuccessPath(
    options.baselineDir,
    options.fullBuildResult.repo_key,
    options.fullBuildResult.ref_key,
    options.fullBuildResult.env_key
  );
  const latestDir = path.dirname(latestPath);
  const lockDir = `${latestDir}.latest.lock`;
  if (!acquireDirectoryLock(lockDir, options.env)) {
    return { ok: false, code: 'latest_success_lock_unavailable', message: `latest-success lock is unavailable: ${lockDir}` };
  }

  try {
    fs.mkdirSync(latestDir, { recursive: true });
    if (fs.existsSync(latestPath)) {
      const existing = core.readJson(latestPath);
      if (existing.created_at && existing.created_at > options.createdAt) {
        return { ok: true, latest_success_path: latestPath, updated: false };
      }
    }

    atomicWriteJson(latestPath, {
      schema_version: 1,
      run_id: options.fullBuildResult.run_id,
      ref: options.fullBuildResult.ref,
      ref_key: options.fullBuildResult.ref_key,
      commit: options.fullBuildResult.commit,
      repo_key: options.fullBuildResult.repo_key,
      env_key: options.fullBuildResult.env_key,
      ad_build_source_digest: options.fullBuildResult.ad_build_source_digest,
      baseline_path: options.baselinePath,
      manifest_sha256: options.manifestSha256,
      created_at: options.createdAt,
      updated_at: options.createdAt
    });
    return { ok: true, latest_success_path: latestPath, updated: true };
  } finally {
    releaseDirectoryLock(lockDir);
  }
}

function acquireDirectoryLock(lockDir, env = process.env) {
  try {
    fs.mkdirSync(path.dirname(lockDir), { recursive: true });
    fs.mkdirSync(lockDir, { recursive: false });
    writeLockMetadata(lockDir);
    return true;
  } catch (error) {
    if (error && error.code === 'EEXIST' && isStaleLock(lockDir, env)) {
      return recoverStaleLock(lockDir, env);
    }
    return false;
  }
}

function recoverStaleLock(lockDir, env) {
  const recoveryLockDir = `${lockDir}.reap.lock`;
  let quarantineDir = null;
  try {
    fs.mkdirSync(recoveryLockDir, { recursive: false });
    writeLockMetadata(recoveryLockDir);
  } catch {
    return false;
  }

  try {
    if (!isStaleLock(lockDir, env)) {
      return false;
    }
    quarantineDir = makeQuarantineDir(lockDir);
    try {
      fs.renameSync(lockDir, quarantineDir);
    } catch {
      return false;
    }
    try {
      fs.mkdirSync(lockDir, { recursive: false });
      writeLockMetadata(lockDir);
      return true;
    } catch {
      return false;
    }
  } finally {
    if (quarantineDir) {
      fs.rmSync(quarantineDir, { recursive: true, force: true });
    }
    releaseDirectoryLock(recoveryLockDir);
  }
}

function releaseDirectoryLock(lockDir) {
  fs.rmSync(lockDir, { recursive: true, force: true });
}

function writeLockMetadata(lockDir) {
  core.writeJson(path.join(lockDir, 'lock.json'), {
    pid: process.pid,
    created_at: core.nowIso()
  });
}

function isStaleLock(lockDir, env) {
  const staleMs = lockStaleMs(env);
  const metadataPath = path.join(lockDir, 'lock.json');
  let createdAt = null;
  if (fs.existsSync(metadataPath)) {
    try {
      createdAt = Date.parse(core.readJson(metadataPath).created_at);
    } catch {
      createdAt = null;
    }
  }
  if (!Number.isFinite(createdAt)) {
    return false;
  }
  return Date.now() - createdAt > staleMs;
}

function lockStaleMs(env) {
  const configured = Number(trim(env.AD_BUILD_LOCK_STALE_MS));
  if (Number.isFinite(configured) && configured >= 0) {
    return configured;
  }
  return 60 * 60 * 1000;
}

function makeStagingDir(targetDir) {
  const parent = path.dirname(targetDir);
  const name = path.basename(targetDir);
  fs.mkdirSync(parent, { recursive: true });
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = path.join(parent, `.${name}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
    try {
      fs.mkdirSync(candidate);
      return candidate;
    } catch {
      // Try a new random staging path.
    }
  }
  throw new Error(`could not create staging directory for ${targetDir}`);
}

function makeBackupDir(targetDir) {
  const parent = path.dirname(targetDir);
  const name = path.basename(targetDir);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = path.join(parent, `.${name}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.backup`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`could not reserve backup directory for ${targetDir}`);
}

function makeQuarantineDir(lockDir) {
  const parent = path.dirname(lockDir);
  const name = path.basename(lockDir);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = path.join(parent, `.${name}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.quarantine`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`could not reserve quarantine directory for ${lockDir}`);
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  core.writeJson(tmp, value);
  fs.renameSync(tmp, file);
}

function runPrecheck(options = {}) {
  const env = options.env || process.env;
  const repoRoot = resolveRepoRoot({
    repoRoot: options.repoRoot,
    env,
    cwd: options.cwd
  });
  const result = buildPrecheckResult({
    repoRoot,
    env,
    baselineDir: options.baselineDir
  });
  const outDir = path.join(repoRoot, OUTPUT_DIR);

  core.writeJson(path.join(outDir, 'precheck.json'), result);
  writeText(path.join(outDir, 'precheck.md'), renderPrecheckMarkdown(result));
  return result;
}

async function runCli(argv = process.argv.slice(2), options = {}) {
  const command = argv[0] || 'help';
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  const env = options.env || process.env;
  const cwd = options.cwd || process.cwd();
  const baseRef = parseBaseRef(argv.slice(1)) || 'HEAD';

  try {
    if (command === 'help' || command === '--help' || command === '-h') {
      stdout.write(helpText());
      return 0;
    }
    if (command === 'doctor') {
      await runDoctor({ repoRoot: options.repoRoot, env, cwd });
      stdout.write('wrote .ad-build/doctor.json and .ad-build/doctor.md\n');
      return 0;
    }
    if (command === 'modules') {
      runModules({ repoRoot: options.repoRoot, env, cwd });
      stdout.write('wrote .ad-build/modules.json and .ad-build/modules.md\n');
      return 0;
    }
    if (command === 'diff') {
      runDiff({ repoRoot: options.repoRoot, env, cwd, baseRef });
      stdout.write('wrote .ad-build/diff-files.txt and .ad-build/diff-summary.json\n');
      return 0;
    }
    if (command === 'map') {
      runMap({ repoRoot: options.repoRoot, env, cwd, baseRef });
      stdout.write('wrote .ad-build/module-map-result.json and .ad-build/module-map-result.md\n');
      return 0;
    }
    if (command === 'precheck') {
      runPrecheck({ repoRoot: options.repoRoot, env, cwd });
      stdout.write('wrote .ad-build/precheck.json and .ad-build/precheck.md\n');
      return 0;
    }
    if (command === 'verify') {
      const result = await runVerify({ repoRoot: options.repoRoot, env, cwd, modules: argv.slice(1) });
      stdout.write(`wrote .ad-build/runs/${result.run_id}/verify-summary.json and .ad-build/runs/${result.run_id}/verify-summary.md\n`);
      return result.overall_status === 'passed' ? 0 : 1;
    }
    if (command === 'report') {
      const result = runReport({ repoRoot: options.repoRoot, env, cwd, runId: argv[1] });
      stdout.write(`wrote ${result.report_path}\n`);
      return result.exitCode;
    }
    if (command === 'full-build') {
      const wrappedCommand = parseWrappedCommand(argv.slice(1));
      const result = runFullBuild({ repoRoot: options.repoRoot, env, cwd, command: wrappedCommand });
      stdout.write('wrote .ad-build/full-build/latest/full-build-result.json and .ad-build/full-build/latest/compile.log\n');
      return result.exit_code || 0;
    }
    if (command === 'baseline-save') {
      const saveOptions = parseBaselineSaveArgs(argv.slice(1));
      const result = runBaselineSave({ repoRoot: options.repoRoot, env, cwd, ...saveOptions });
      if (!result.ok) {
        stderr.write(`baseline-save safety error: ${result.message}\n`);
        return result.exitCode || 4;
      }
      stdout.write(`wrote ${result.baseline_path}\n`);
      return 0;
    }

    stderr.write(`unknown command: ${command}\n${helpText()}`);
    return 2;
  } catch (error) {
    if (error.exitCode) {
      stderr.write(`ad-build ${command} failed: ${error.message}\n`);
      return error.exitCode;
    }
    stderr.write(`ad-build ${command} failed: ${error.message}\n`);
    return 2;
  }
}

function readModuleMap({ repoRoot, moduleMapPath }) {
  const file = resolveRepoPath(repoRoot, moduleMapPath || DEFAULT_MODULE_MAP_PATH);
  const source = fs.readFileSync(file, 'utf8');
  return moduleMap.normalizeModuleMap(moduleMap.parseModuleMapYaml(source));
}

async function runVerifyModule({ repoRoot, runDir, runId, env, moduleEntry }) {
  const logFile = path.join(runDir, `${safeLogName(moduleEntry.log_name || moduleEntry.name)}.log`);
  const logPath = normalizeOutputPath(path.relative(repoRoot, logFile));
  const moduleResult = {
    module: moduleEntry.name,
    status: 'passed',
    commands: []
  };
  let stopped = false;

  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
  }

  for (const command of moduleEntry.build || []) {
    if (stopped) {
      moduleResult.commands.push(buildNotRunCommandResult({
        command,
        cwd: moduleEntry.cwd,
        logPath
      }));
      continue;
    }

    const commandResult = await runVerifyCommand({
      repoRoot,
      moduleEntry,
      command,
      env,
      logFile,
      logPath
    });
    moduleResult.commands.push(commandResult);
    if (commandResult.status === 'failed' || commandResult.status === 'timeout') {
      moduleResult.status = commandResult.status;
      stopped = true;
    }
  }

  if (moduleResult.commands.length === 0) {
    moduleResult.status = 'failed';
    moduleResult.commands.push({
      command: '',
      status: 'failed',
      cwd: moduleEntry.cwd || '.',
      exit_code: 2,
      started_at: core.nowIso(),
      ended_at: core.nowIso(),
      duration_seconds: 0,
      log_path: logPath
    });
  }

  return moduleResult;
}

async function runVerifyCommand({ repoRoot, moduleEntry, command, env, logFile, logPath }) {
  const startedAt = core.nowIso();
  const startedMs = Date.now();
  const moduleCwd = moduleEntry.cwd || '.';
  const timeoutSeconds = Number(moduleEntry.timeout_seconds || 3600);
  const timeoutMs = Math.max(1, Math.ceil(timeoutSeconds * 1000));
  const shell = shellForCommand(command);
  const commandEnv = {
    ...process.env,
    ...env,
    ...(moduleEntry.env || {})
  };
  let cwd;

  try {
    cwd = resolveModuleCwd(repoRoot, moduleCwd);
  } catch (error) {
    appendLog(logFile, [
      `$ ${command}`,
      `cwd: ${normalizeOutputPath(moduleCwd)}`,
      '',
      `[ad-build] configuration error: ${error.message}`,
      ''
    ].join('\n'));
    const endedAt = core.nowIso();
    return {
      command,
      status: 'failed',
      cwd: normalizeOutputPath(moduleCwd),
      exit_code: 2,
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: Math.max(0, (Date.now() - startedMs) / 1000),
      log_path: logPath
    };
  }

  appendLog(logFile, [
    `$ ${command}`,
    `cwd: ${normalizeOutputPath(path.relative(repoRoot, cwd) || '.')}`,
    ''
  ].join('\n'));

  const result = await spawnCommand(shell.command, shell.args, {
    cwd,
    env: commandEnv,
    timeoutMs,
    logFile
  });
  const endedAt = core.nowIso();
  const status = result.timedOut ? 'timeout' : result.exitCode === 0 ? 'passed' : 'failed';

  appendLog(logFile, `\n[ad-build] status=${status} exit_code=${result.exitCode === null ? 'null' : result.exitCode}\n\n`);

  return {
    command,
    status,
    cwd: normalizeOutputPath(moduleEntry.cwd || '.'),
    exit_code: result.exitCode,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: Math.max(0, (Date.now() - startedMs) / 1000),
    log_path: logPath
  };
}

function spawnCommand(command, args, options) {
  return new Promise((resolve) => {
    let timedOut = false;
    let settled = false;
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      windowsHide: true,
      detached: true
    });

    const finish = (exitCode) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      resolve({
        exitCode: timedOut ? null : exitCode,
        timedOut
      });
    };

    const timeout = setTimeout(() => {
      timedOut = true;
      appendLog(options.logFile, '\n[ad-build] command timed out\n');
      terminateChildTree(child, 'SIGTERM');
      setTimeout(() => {
        if (!settled) {
          terminateChildTree(child, 'SIGKILL');
        }
      }, 500).unref?.();
    }, options.timeoutMs);

    child.stdout.on('data', (chunk) => appendLog(options.logFile, chunk));
    child.stderr.on('data', (chunk) => appendLog(options.logFile, chunk));
    child.on('error', (error) => {
      appendLog(options.logFile, `\n[ad-build] command could not start: ${error.message}\n`);
      finish(127);
    });
    child.on('close', (code, signal) => {
      if (timedOut) {
        finish(null);
        return;
      }
      if (code === null) {
        appendLog(options.logFile, `\n[ad-build] command terminated by signal: ${signal}\n`);
        finish(1);
        return;
      }
      finish(code);
    });
  });
}

function terminateChildTree(child, signal) {
  if (!child || !child.pid) {
    return;
  }
  if (process.platform === 'win32') {
    try {
      spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], {
        stdio: 'ignore',
        windowsHide: true
      });
    } catch {
      // Fall through to direct child kill.
    }
    try {
      child.kill(signal);
    } catch {
      // Process may already be gone.
    }
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // Process may already be gone.
    }
  }
}

function shellForCommand(command) {
  return {
    command: 'sh',
    args: ['-lc', command]
  };
}

function resolveModuleCwd(repoRoot, moduleCwd) {
  const cwd = path.resolve(repoRoot, moduleCwd || '.');
  const relative = path.relative(repoRoot, cwd);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`module cwd escapes repository: ${moduleCwd}`);
  }
  let realRepoRoot;
  let realCwd;
  try {
    realRepoRoot = realpath(repoRoot);
  } catch (error) {
    throw new Error(`repository root cannot be resolved: ${error.message}`);
  }
  try {
    const stat = fs.statSync(cwd);
    if (!stat.isDirectory()) {
      throw new Error(`module cwd is not a directory: ${moduleCwd}`);
    }
    realCwd = realpath(cwd);
  } catch (error) {
    throw new Error(`module cwd cannot be resolved: ${moduleCwd}: ${error.message}`);
  }
  if (!isPathInside(realRepoRoot, realCwd)) {
    throw new Error(`module cwd resolves outside repository: ${moduleCwd}`);
  }
  return cwd;
}

function buildNotRunModuleResult({ repoRoot, runDir, moduleEntry }) {
  const logFile = path.join(runDir, `${safeLogName(moduleEntry.log_name || moduleEntry.name)}.log`);
  const logPath = normalizeOutputPath(path.relative(repoRoot, logFile));
  writeText(logFile, [
    `module: ${moduleEntry.name}`,
    'status: not_run',
    'reason: module was not run because an earlier requested module failed or timed out',
    ''
  ].join('\n'));
  return {
    module: moduleEntry.name,
    status: 'not_run',
    commands: (moduleEntry.build || []).map((command) => buildNotRunCommandResult({
      command,
      cwd: moduleEntry.cwd,
      logPath
    }))
  };
}

function buildNotRunCommandResult({ command, cwd, logPath }) {
  return {
    command,
    status: 'not_run',
    cwd: normalizeOutputPath(cwd || '.'),
    exit_code: null,
    started_at: null,
    ended_at: null,
    duration_seconds: null,
    log_path: logPath
  };
}

function writeUnknownModuleVerifySummary({ repoRoot, runRoot, requestedModules, config, unknownModules }) {
  const startedAt = core.nowIso();
  const runId = makeRunId(startedAt);
  const runDir = path.join(runRoot, runId);
  const unknownSet = new Set(unknownModules);
  const results = requestedModules.map((name) => {
    if (unknownSet.has(name)) {
      return {
        module: name,
        status: 'unknown_module',
        commands: []
      };
    }
    const moduleEntry = config.modulesByName[name];
    return buildNotRunModuleResult({ repoRoot, runDir, moduleEntry });
  });
  const summary = {
    schema_version: 1,
    run_id: runId,
    generated_at: core.nowIso(),
    requested_modules: requestedModules,
    results,
    overall_status: computeVerifyOverallStatus(results),
    errors: unknownModules.map((name) => ({ message: `unknown module: ${name}` })),
    warnings: []
  };

  fs.mkdirSync(runDir, { recursive: true });
  core.writeJson(path.join(runDir, 'verify-summary.json'), summary);
  writeText(path.join(runDir, 'verify-summary.md'), renderVerifySummaryMarkdown(summary));
  return summary;
}

function computeVerifyOverallStatus(results) {
  if (results.some((result) => result.status === 'not_run' || (result.commands || []).some((command) => command.status === 'not_run'))) {
    return 'partial';
  }
  if (results.some((result) => (
    result.status === 'failed'
      || result.status === 'timeout'
      || result.status === 'unknown_module'
      || (result.commands || []).some((command) => command.status === 'failed' || command.status === 'timeout')
  ))) {
    return 'failed';
  }
  return 'passed';
}

function validateVerifySummaryForReport({ repoRoot, runDir, summary }) {
  const errors = [];
  const moduleStatusValues = new Set(['passed', 'failed', 'timeout', 'not_run', 'unknown_module']);
  const commandStatusValues = new Set(['passed', 'failed', 'timeout', 'not_run']);
  const overallStatusValues = new Set(['passed', 'failed', 'partial']);
  if (!summary || typeof summary !== 'object') {
    return ['verify-summary.json is not an object'];
  }

  for (const field of ['schema_version', 'run_id', 'generated_at', 'overall_status']) {
    requirePresent(summary, field, 'verify-summary.json', errors);
  }
  if (!Array.isArray(summary.requested_modules)) {
    errors.push('verify-summary.json requested_modules must be an array');
  }
  if (!Array.isArray(summary.errors)) {
    errors.push('verify-summary.json errors must be an array');
  }
  if (!Array.isArray(summary.warnings)) {
    errors.push('verify-summary.json warnings must be an array');
  }
  if (summary.overall_status && !overallStatusValues.has(summary.overall_status)) {
    errors.push(`verify-summary.json invalid overall_status: ${summary.overall_status}`);
  }
  if (!Array.isArray(summary.results)) {
    errors.push('verify-summary.json results must be an array');
    return errors;
  }
  const computed = computeVerifyOverallStatus(summary.results);
  if (overallStatusValues.has(summary.overall_status) && summary.overall_status !== computed) {
    errors.push(`verify-summary.json overall_status ${summary.overall_status} does not match results ${computed}`);
  }
  for (const [moduleIndex, result] of summary.results.entries()) {
    const modulePath = `verify-summary.json results[${moduleIndex}]`;
    if (!result || typeof result !== 'object') {
      errors.push('verify-summary.json contains an invalid module result');
      continue;
    }
    requirePresent(result, 'module', modulePath, errors);
    requirePresent(result, 'status', modulePath, errors);
    if (result.status && !moduleStatusValues.has(result.status)) {
      errors.push(`${modulePath} invalid module status: ${result.status}`);
    }
    if (!Array.isArray(result.commands)) {
      errors.push(`${modulePath} commands must be an array`);
      continue;
    }
    for (const [commandIndex, command] of result.commands.entries()) {
      const commandPath = `${modulePath} commands[${commandIndex}]`;
      if (!command || typeof command !== 'object') {
        errors.push(`${commandPath} is not an object`);
        continue;
      }
      for (const field of ['command', 'status', 'cwd', 'log_path']) {
        requirePresent(command, field, commandPath, errors);
      }
      for (const field of ['exit_code', 'started_at', 'ended_at', 'duration_seconds']) {
        requireKey(command, field, commandPath, errors);
      }
      if (command.status && !commandStatusValues.has(command.status)) {
        errors.push(`${commandPath} invalid command status: ${command.status}`);
      }
      if (command.log_path) {
        const logValidation = validateReportLogPath({ repoRoot, runDir, logPath: command.log_path });
        if (!logValidation.ok) {
          errors.push(`module ${result.module} log is missing: ${command.log_path}`);
        }
      }
      if (command.status === 'not_run') {
        if (command.exit_code !== null) {
          errors.push(`${commandPath} exit_code must be null for not_run`);
        }
        continue;
      }
      if (!(Number.isFinite(command.exit_code) || command.exit_code === null)) {
        errors.push(`${commandPath} exit_code must be a number or null`);
      }
      for (const field of ['started_at', 'ended_at']) {
        requirePresent(command, field, commandPath, errors);
      }
      if (!Number.isFinite(command.duration_seconds)) {
        errors.push(`${commandPath} duration_seconds must be a number`);
      }
    }
  }
  return errors;
}

function requirePresent(object, field, label, errors) {
  if (!Object.prototype.hasOwnProperty.call(object, field) || object[field] === null || object[field] === undefined || object[field] === '') {
    errors.push(`${label} is missing ${field}`);
  }
}

function requireKey(object, field, label, errors) {
  if (!Object.prototype.hasOwnProperty.call(object, field)) {
    errors.push(`${label} is missing ${field}`);
  }
}

function validateReportLogPath({ repoRoot, runDir, logPath }) {
  if (!isSafeReportLogPath(repoRoot, runDir, logPath)) {
    return { ok: false, code: 'unsafe_log_path' };
  }
  const resolved = resolveRepoPath(repoRoot, logPath);
  if (!fs.existsSync(resolved)) {
    return { ok: false, code: 'missing_log_path' };
  }
  if (!isRealPathInside(runDir, resolved)) {
    return { ok: false, code: 'escaped_log_path' };
  }
  return { ok: true };
}

function isSafeReportLogPath(repoRoot, runDir, logPathValue) {
  if (typeof logPathValue !== 'string' || !logPathValue) {
    return false;
  }
  const resolved = resolveRepoPath(repoRoot, logPathValue);
  return isPathInside(runDir, resolved);
}

function safeLogName(value) {
  const safe = String(value || 'module').replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '');
  return safe || 'module';
}

function appendLog(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, value);
}

function collectMetadata(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const env = options.env || process.env;
  const warnings = [];
  const packageRoot = path.resolve(__dirname, '..');
  const packageJson = core.readJson(path.join(packageRoot, 'package.json'));
  const sourceFiles = packageSourceFiles(packageRoot);
  const gitMetadata = collectGitMetadata(repoRoot, warnings);
  const envMetadata = collectEnvMetadata(repoRoot, env, warnings);

  return {
    ad_build_version: packageJson.version,
    ad_build_source_digest: computeAdBuildSourceDigest(packageRoot, sourceFiles),
    ad_build_source_files: sourceFiles,
    node_version: process.version,
    os: {
      platform: process.platform,
      arch: process.arch,
      release: osRelease()
    },
    cwd: repoRoot,
    package_root: packageRoot,
    package_json_path: path.join(packageRoot, 'package.json'),
    ...gitMetadata,
    ...envMetadata,
    worktree_clean: computeWorktreeClean(repoRoot),
    warnings
  };
}

function collectGitMetadata(repoRoot, warnings) {
  const commitResult = runGit(repoRoot, ['rev-parse', 'HEAD']);
  const commit = commitResult.status === 0 && /^[a-f0-9]{40}$/.test(trim(commitResult.stdout))
    ? trim(commitResult.stdout)
    : null;
  const symbolicRefResult = runGit(repoRoot, ['symbolic-ref', '-q', 'HEAD']);
  const symbolicRef = symbolicRefResult.status === 0 ? trim(symbolicRefResult.stdout) : '';
  const refInfo = (symbolicRef || commit) ? core.computeRefKey(symbolicRef, commit) : { ref: null, refKey: null };
  const originResult = runGit(repoRoot, ['config', '--get', 'remote.origin.url']);
  const origin = originResult.status === 0 ? trim(originResult.stdout) : '';
  const repoId = origin ? normalizeRepoId(origin) : path.basename(repoRoot);

  if (!origin) {
    warnings.push({ message: 'remote.origin.url is unavailable; repository basename was used for repo_id' });
  }
  if (!commit) {
    warnings.push({ message: 'git commit is unavailable' });
  }

  return {
    commit,
    ref: refInfo.ref,
    ref_key: refInfo.refKey,
    branch: symbolicRef.startsWith('refs/heads/') ? symbolicRef.slice('refs/heads/'.length) : null,
    repo_id: repoId,
    repo_key: core.digestJson(repoId)
  };
}

function collectEnvMetadata(repoRoot, env, warnings) {
  const dockerIdentity = collectDockerIdentity(env, warnings);
  const buildConfigDigest = computeBuildConfigDigest(repoRoot, env);
  const toolchainDigest = computeToolchainDigest(env);
  const submoduleDigest = computeSubmoduleDigest(repoRoot);

  return {
    docker_identity: dockerIdentity,
    build_config_digest: buildConfigDigest,
    toolchain_digest: toolchainDigest,
    submodule_digest: submoduleDigest,
    env_key: core.digestJson({
      docker_identity: dockerIdentity,
      build_config_digest: buildConfigDigest,
      toolchain_digest: toolchainDigest,
      submodule_digest: submoduleDigest
    })
  };
}

function collectDockerIdentity(env, warnings) {
  const image = trim(env.AD_BUILD_DOCKER_IMAGE);
  const digest = trim(env.AD_BUILD_DOCKER_DIGEST);
  if (image && digest) {
    return `${image}@${digest}`;
  }
  if (image) {
    warnings.push({ message: 'AD_BUILD_DOCKER_IMAGE is set without AD_BUILD_DOCKER_DIGEST' });
    return image;
  }

  const osRelease = fs.existsSync('/etc/os-release') ? fs.readFileSync('/etc/os-release', 'utf8') : '';
  const archResult = spawnSync('uname', ['-m'], { encoding: 'utf8', env });
  const arch = archResult.status === 0 ? trim(archResult.stdout) : process.arch;
  warnings.push({ message: 'docker image identity is unavailable; host OS fallback was used' });
  return `unknown-image:${core.digestJson({ os_release: osRelease, arch })}`;
}

function computeBuildConfigDigest(repoRoot, env) {
  const paths = new Set(['compile.sh', 'app.mk', 'Makefile', DEFAULT_MODULE_MAP_PATH]);
  for (const entry of String(env.AD_BUILD_CONFIG_FILES || '').split(':')) {
    if (trim(entry)) {
      paths.add(normalizeOutputPath(trim(entry)));
    }
  }

  const files = [...paths].sort().map((repoPath) => {
    const file = resolveRepoPath(repoRoot, repoPath);
    return {
      path: normalizeOutputPath(repoPath),
      exists: fs.existsSync(file),
      sha256: fs.existsSync(file) && fs.statSync(file).isFile() ? sha256File(file) : null
    };
  });

  return core.digestJson({ files });
}

function computeToolchainDigest(env) {
  const tools = ['gcc', 'g++', 'make', 'ld', 'python3'].map((tool) => {
    const run = spawnSync(tool, ['--version'], {
      encoding: 'utf8',
      env,
      timeout: 5000
    });
    return {
      tool,
      missing: Boolean(run.error),
      exit_code: run.error ? null : run.status,
      stdout: run.stdout || '',
      stderr: run.stderr || ''
    };
  });

  return core.digestJson({ tools });
}

function computeSubmoduleDigest(repoRoot) {
  const run = runGit(repoRoot, ['submodule', 'status', '--recursive']);
  return core.digestJson({
    exit_code: run.error ? null : run.status,
    stdout: run.stdout || '',
    stderr: run.stderr || '',
    missing: Boolean(run.error)
  });
}

function computeAdBuildSourceDigest(packageRoot, sourceFiles = packageSourceFiles(packageRoot)) {
  const files = sourceFiles.map((repoPath) => ({
    path: normalizeOutputPath(repoPath),
    sha256: sha256File(path.join(packageRoot, repoPath))
  }));

  return core.digestJson({ files });
}

function packageSourceFiles(packageRoot) {
  const files = ['package.json'];
  for (const dir of ['bin', 'lib', 'templates', 'skills']) {
    const absoluteDir = path.join(packageRoot, dir);
    if (!fs.existsSync(absoluteDir)) {
      continue;
    }
    collectFilesRecursive(absoluteDir, dir, files);
  }
  return files.sort();
}

function collectFilesRecursive(absoluteDir, relativeDir, out) {
  for (const name of fs.readdirSync(absoluteDir).sort()) {
    const absolutePath = path.join(absoluteDir, name);
    const relativePath = normalizeOutputPath(path.join(relativeDir, name));
    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
      collectFilesRecursive(absolutePath, relativePath, out);
    } else if (stat.isFile()) {
      out.push(relativePath);
    }
  }
}

function metadataFields(metadata) {
  const out = {};
  for (const field of [
    'commit',
    'ref',
    'ref_key',
    'branch',
    'repo_id',
    'repo_key',
    'env_key',
    'docker_identity',
    'ad_build_version',
    'ad_build_source_digest',
    'ad_build_source_files',
    'build_config_digest',
    'toolchain_digest',
    'submodule_digest',
    'worktree_clean',
    'node_version',
    'os',
    'cwd',
    'package_root',
    'package_json_path'
  ]) {
    out[field] = metadata[field] ?? null;
  }
  return out;
}

function validateBaselineForPrecheck(baseline, metadata, options = {}) {
  if (baseline.schema_version !== 1) {
    return { status: 'schema_mismatch', message: 'baseline schema_version is not compatible' };
  }
  if (baseline.producer !== 'ad-build' || baseline.dirty_worktree) {
    return { status: 'invalid_metadata', message: 'baseline producer or dirty_worktree metadata is invalid' };
  }
  if (!baseline.publisher) {
    return { status: 'invalid_metadata', message: 'baseline is missing publisher' };
  }
  const trustedPublishers = trustedPublisherSet(options.env || {});
  if (!trustedPublishers || !trustedPublishers.has(baseline.publisher)) {
    return { status: 'invalid_metadata', message: `trusted publisher check failed for baseline publisher: ${baseline.publisher}` };
  }
  for (const field of [
    'commit',
    'ref',
    'ref_key',
    'repo_id',
    'repo_key',
    'env_key',
    'docker_identity',
    'ad_build_version',
    'ad_build_source_digest',
    'build_config_digest',
    'toolchain_digest',
    'submodule_digest'
  ]) {
    if (!baseline[field]) {
      return { status: 'invalid_metadata', message: `baseline is missing ${field}` };
    }
  }
  try {
    core.safeDigestKey(baseline.ref_key);
  } catch {
    return { status: 'invalid_metadata', message: 'baseline ref_key is invalid' };
  }
  if (majorVersion(baseline.ad_build_version) !== majorVersion(metadata.ad_build_version)) {
    return { status: 'invalid_metadata', message: 'baseline ad_build_version major version is incompatible' };
  }
  if (baseline.ad_build_source_digest !== metadata.ad_build_source_digest) {
    return { status: 'invalid_metadata', message: 'baseline ad_build_source_digest does not match current CLI' };
  }
  if (baseline.commit !== metadata.commit || baseline.repo_key !== metadata.repo_key) {
    if (!options.allowDifferentCommit || baseline.repo_key !== metadata.repo_key) {
      return { status: 'invalid_metadata', message: 'baseline commit or repo_key does not match current repository' };
    }
  }
  if (metadata.ref_key && baseline.ref_key !== metadata.ref_key) {
    return { status: 'invalid_metadata', message: 'baseline ref_key does not match current ref' };
  }
  if (metadata.ref && baseline.ref !== metadata.ref) {
    return { status: 'invalid_metadata', message: 'baseline ref does not match current ref' };
  }
  for (const field of ['env_key', 'docker_identity', 'build_config_digest', 'toolchain_digest', 'submodule_digest']) {
    if (baseline[field] !== metadata[field]) {
      return { status: 'env_mismatch', message: `baseline ${field} does not match current environment` };
    }
  }
  if (baseline.repo_id !== metadata.repo_id) {
    return { status: 'invalid_metadata', message: 'baseline repo_id does not match current repository' };
  }
  const manifestCheck = validateBaselineManifest(baseline, options.baselinePath);
  if (!manifestCheck.ok) {
    return { status: 'invalid_metadata', message: manifestCheck.message };
  }
  return { status: 'matched' };
}

function validateBaselineManifest(baseline, baselinePathValue) {
  if (!baselinePathValue) {
    return { ok: false, message: 'baseline path is required for manifest validation' };
  }
  if (!baseline.manifest_sha256) {
    return { ok: false, message: 'baseline is missing manifest_sha256' };
  }
  if (!baseline.artifacts || !baseline.artifacts.manifest_path) {
    return { ok: false, message: 'baseline is missing artifacts.manifest_path' };
  }

  const manifestPath = resolveBaselineArtifactPath(baselinePathValue, baseline.artifacts.manifest_path);
  if (!manifestPath) {
    return { ok: false, message: 'baseline manifest path is unsafe' };
  }
  if (!fs.existsSync(manifestPath)) {
    return { ok: false, message: 'baseline artifact manifest is missing' };
  }
  const actual = `sha256:${sha256File(manifestPath)}`;
  if (actual !== baseline.manifest_sha256) {
    return { ok: false, message: 'baseline artifact manifest checksum does not match manifest_sha256' };
  }
  const parsedManifest = parseArtifactManifest(fs.readFileSync(manifestPath, 'utf8'));
  if (!parsedManifest.ok) {
    return parsedManifest;
  }
  const requiredArtifacts = new Set(['compile.log', 'full-build-result.json']);
  for (const entry of parsedManifest.entries) {
    const artifactPath = resolveBaselineArtifactPath(baselinePathValue, entry.path);
    if (!artifactPath) {
      return { ok: false, message: `baseline artifact path is unsafe: ${entry.path}` };
    }
    if (!fs.existsSync(artifactPath)) {
      return { ok: false, message: `baseline artifact is missing: ${entry.path}` };
    }
    const artifactDigest = `sha256:${sha256File(artifactPath)}`;
    if (artifactDigest !== entry.digest) {
      return { ok: false, message: `baseline artifact checksum does not match manifest: ${entry.path}` };
    }
    requiredArtifacts.delete(entry.path);
  }
  if (requiredArtifacts.size > 0) {
    return { ok: false, message: `baseline artifact manifest is missing required artifacts: ${Array.from(requiredArtifacts).join(', ')}` };
  }
  return { ok: true };
}

function parseArtifactManifest(contents) {
  const entries = [];
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length !== 2) {
      return { ok: false, message: 'baseline artifact manifest contains an invalid line' };
    }
    const [artifactPath, digest] = parts;
    if (!/^sha256:[a-f0-9]{64}$/.test(digest)) {
      return { ok: false, message: `baseline artifact manifest contains an invalid digest for ${artifactPath}` };
    }
    entries.push({ path: artifactPath, digest });
  }
  return { ok: true, entries };
}

function resolveBaselineArtifactPath(baselinePathValue, artifactPath) {
  if (path.isAbsolute(artifactPath)) {
    return null;
  }
  const root = path.dirname(baselinePathValue);
  const resolved = path.resolve(root, artifactPath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}

function trustedPublisherSet(env) {
  const value = trim(env.AD_BUILD_TRUSTED_PUBLISHERS);
  if (!value) {
    return new Set();
  }
  return new Set(value.split(/[,\s;]+/).map(trim).filter(Boolean));
}

function findNearestBaseline({ baselineDir, metadata, warnings, env }) {
  if (!metadata.repo_key || !metadata.ref_key || !metadata.env_key) {
    return null;
  }

  const latestPath = latestSuccessPath(baselineDir, metadata.repo_key, metadata.ref_key, metadata.env_key);
  if (!fs.existsSync(latestPath)) {
    return null;
  }
  try {
    const latest = core.readJson(latestPath);
    for (const field of [
      'schema_version',
      'run_id',
      'commit',
      'baseline_path',
      'ref',
      'ref_key',
      'created_at',
      'updated_at',
      'repo_key',
      'env_key',
      'ad_build_source_digest',
      'manifest_sha256'
    ]) {
      if (!latest[field]) {
        warnings.push({ message: `latest-success.json is missing ${field}` });
        return null;
      }
    }
    if (latest.schema_version !== 1) {
      warnings.push({ message: 'latest-success.json schema_version is not compatible' });
      return null;
    }
    if (latest.env_key !== metadata.env_key) {
      warnings.push({ message: 'latest-success.json env_key does not match current environment' });
      return null;
    }
    if (latest.repo_key !== metadata.repo_key) {
      warnings.push({ message: 'latest-success.json repo_key does not match current repository' });
      return null;
    }
    if (latest.ref_key !== metadata.ref_key || latest.ref !== metadata.ref) {
      warnings.push({ message: 'latest-success.json ref metadata does not match current ref' });
      return null;
    }
    if (latest.ad_build_source_digest !== metadata.ad_build_source_digest) {
      warnings.push({ message: 'latest-success.json ad_build_source_digest does not match current CLI' });
      return null;
    }
    if (!isPathInside(baselineDir, latest.baseline_path)) {
      warnings.push({ message: 'latest-success.json baseline_path is outside AD_BUILD_BASELINE_DIR' });
      return null;
    }
    if (!fs.existsSync(latest.baseline_path)) {
      warnings.push({ message: 'latest-success.json points to a missing baseline' });
      return null;
    }
    if (!isRealPathInside(baselineDir, latest.baseline_path)) {
      warnings.push({ message: 'latest-success.json baseline_path resolves outside AD_BUILD_BASELINE_DIR' });
      return null;
    }
    const targetBaseline = core.readJson(latest.baseline_path);
    if (targetBaseline.manifest_sha256 !== latest.manifest_sha256) {
      warnings.push({ message: 'latest-success.json manifest_sha256 does not match target baseline' });
      return null;
    }
    const targetCheck = validateBaselineForPrecheck(targetBaseline, metadata, {
      baselinePath: latest.baseline_path,
      env,
      allowDifferentCommit: true
    });
    if (targetCheck.status !== 'matched') {
      warnings.push({ message: `latest-success target baseline is not valid: ${targetCheck.message || targetCheck.status}` });
      return null;
    }
    return {
      run_id: latest.run_id,
      commit: latest.commit,
      baseline_path: latest.baseline_path,
      ref: latest.ref,
      created_at: latest.created_at,
      env_key: latest.env_key,
      manifest_sha256: latest.manifest_sha256
    };
  } catch (error) {
    warnings.push({ message: `latest-success.json could not be read: ${error.message}` });
    return null;
  }
}

function isPathInside(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isRealPathInside(root, candidate) {
  try {
    const realRoot = realpath(root);
    const realCandidate = realpath(candidate);
    return isPathInside(realRoot, realCandidate);
  } catch {
    return false;
  }
}

function realpath(value) {
  const resolveRealpath = fs.realpathSync.native || fs.realpathSync;
  return resolveRealpath(value);
}

function computeWorktreeClean(repoRoot) {
  const result = runGit(repoRoot, ['status', '--porcelain', '--untracked-files=all']);
  if (result.error || result.status !== 0) {
    return null;
  }
  return trim(result.stdout) === '';
}

function normalizeRepoId(value) {
  const input = trim(value).replace(/\.git$/, '');
  const scpLike = /^(?:[^@]+@)?([^:]+):(.+)$/.exec(input);
  if (scpLike && !input.includes('://')) {
    return `${scpLike[1].toLowerCase()}/${scpLike[2].replace(/\.git$/, '')}`;
  }

  try {
    const url = new URL(input);
    url.username = '';
    url.password = '';
    url.hash = '';
    url.search = '';
    const pathname = url.pathname.replace(/\/$/, '').replace(/\.git$/, '');
    return `${url.protocol}//${url.host.toLowerCase()}${pathname}`;
  } catch {
    return input.replaceAll('\\', '/').replace(/\/$/, '');
  }
}

function resolveRepoRoot(options = {}) {
  if (options.repoRoot) {
    return path.resolve(options.repoRoot);
  }

  const env = options.env || process.env;
  if (env.AD_BUILD_WORK_DIR) {
    return path.resolve(env.AD_BUILD_WORK_DIR);
  }

  const cwd = options.cwd || process.cwd();
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd,
    encoding: 'utf8'
  });
  if (!result.error && result.status === 0 && trim(result.stdout)) {
    return path.resolve(trim(result.stdout));
  }

  return path.resolve(cwd);
}

function checkCommand(name, command, args, successMessage, options = {}) {
  const missingStatus = options.missingStatus || 'failed';
  const result = spawnSync(command, args, { cwd: options.cwd, encoding: 'utf8' });
  if (result.error) {
    return {
      name,
      status: missingStatus,
      message: `${command} could not be executed: ${result.error.message}`
    };
  }
  if (result.status !== 0) {
    return {
      name,
      status: 'failed',
      message: `${command} exited with status ${result.status}`,
      stderr: trim(result.stderr)
    };
  }
  return {
    name,
    status: 'passed',
    message: successMessage,
    version: trim(result.stdout || result.stderr)
  };
}

function checkGitRepo(repoRoot) {
  const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: repoRoot, encoding: 'utf8' });
  if (result.error) {
    return {
      name: 'git_repo',
      status: 'failed',
      message: `git repository check could not run: ${result.error.message}`
    };
  }
  if (result.status !== 0 || trim(result.stdout) !== 'true') {
    return {
      name: 'git_repo',
      status: 'failed',
      message: 'current directory is not inside a git work tree',
      stderr: trim(result.stderr)
    };
  }
  return {
    name: 'git_repo',
    status: 'passed',
    message: 'current directory is inside a git work tree'
  };
}

function checkModuleMapParseable(repoRoot, moduleMapPath) {
  try {
    const config = readModuleMap({ repoRoot, moduleMapPath });
    return {
      name: 'module_map_parseable',
      status: 'passed',
      message: `${normalizeOutputPath(moduleMapPath)} is parseable`,
      module_count: config.modules.length
    };
  } catch (error) {
    return {
      name: 'module_map_parseable',
      status: 'failed',
      message: `${normalizeOutputPath(moduleMapPath)} is not parseable: ${error.message}`
    };
  }
}

function checkBaselineDirConfigured(baselineDir) {
  if (!baselineDir) {
    return {
      name: 'baseline_dir_configured',
      status: 'failed',
      message: 'AD_BUILD_BASELINE_DIR is not set'
    };
  }
  return {
    name: 'baseline_dir_configured',
    status: 'passed',
    message: 'AD_BUILD_BASELINE_DIR is set',
    path: baselineDir
  };
}

function checkBaselineDirReadable(baselineDir) {
  if (!baselineDir) {
    return {
      name: 'baseline_dir_readable',
      status: 'skipped',
      message: 'AD_BUILD_BASELINE_DIR is not set'
    };
  }
  try {
    const stat = fs.statSync(baselineDir);
    if (!stat.isDirectory()) {
      return {
        name: 'baseline_dir_readable',
        status: 'failed',
        message: `baseline directory is not a directory: ${baselineDir}`,
        path: baselineDir
      };
    }
    fs.accessSync(baselineDir, fs.constants.R_OK);
    return {
      name: 'baseline_dir_readable',
      status: 'passed',
      message: 'baseline directory is readable',
      path: baselineDir
    };
  } catch (error) {
    return {
      name: 'baseline_dir_readable',
      status: 'failed',
      message: `baseline directory is not readable or does not exist: ${error.message}`,
      path: baselineDir
    };
  }
}

function checkBaselinePublishMode(env) {
  const publish = env.AD_BUILD_BASELINE_PUBLISH === '1';
  const publisher = trim(env.AD_BUILD_BASELINE_PUBLISHER);
  if (publish && publisher) {
    return {
      name: 'baseline_publish_mode',
      status: 'passed',
      message: 'baseline publish mode is enabled',
      publisher
    };
  }
  if (publish) {
    return {
      name: 'baseline_publish_mode',
      status: 'warning',
      message: 'AD_BUILD_BASELINE_PUBLISH is set but AD_BUILD_BASELINE_PUBLISHER is empty'
    };
  }
  return {
    name: 'baseline_publish_mode',
    status: 'warning',
    message: 'baseline publish mode is not enabled'
  };
}

function overallStatus(checks) {
  if (checks.some((check) => check.status === 'failed')) {
    return 'failed';
  }
  if (checks.some((check) => check.status === 'warning')) {
    return 'warning';
  }
  return 'passed';
}

function renderDoctorMarkdown(result) {
  const lines = [
    '# ad-build doctor',
    '',
    `Generated: ${result.generated_at}`,
    `Overall status: ${result.overall_status}`,
    '',
    '| Check | Status | Message |',
    '| --- | --- | --- |'
  ];
  for (const check of result.checks) {
    lines.push(`| ${escapeMarkdown(check.name)} | ${escapeMarkdown(check.status)} | ${escapeMarkdown(check.message)} |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function renderModulesMarkdown(result) {
  const lines = [
    '# ad-build modules',
    '',
    `Generated: ${result.generated_at}`,
    '',
    '| Module | Display name | CWD | Build | Timeout | Log |',
    '| --- | --- | --- | --- | --- | --- |'
  ];
  for (const entry of result.modules) {
    lines.push([
      `| ${escapeMarkdown(entry.name)}`,
      escapeMarkdown(entry.display_name),
      escapeMarkdown(entry.cwd),
      escapeMarkdown(entry.build.join('; ')),
      String(entry.timeout_seconds),
      `${escapeMarkdown(entry.log_name)} |`
    ].join(' | '));
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function renderMapMarkdown(result) {
  const lines = [
    '# ad-build module map',
    '',
    `Generated: ${result.generated_at}`,
    `Mapping trusted: ${result.mapping_trusted}`,
    '',
    '| Module | File | Pattern |',
    '| --- | --- | --- |'
  ];
  for (const match of result.module_matches) {
    lines.push(`| ${escapeMarkdown(match.module)} | ${escapeMarkdown(match.file)} | ${escapeMarkdown(match.pattern)} |`);
  }
  lines.push('', '## Risk matches', '', '| Risk | File | Pattern | Reason |', '| --- | --- | --- | --- |');
  for (const match of result.risk_matches) {
    lines.push(`| ${escapeMarkdown(match.risk_level)} | ${escapeMarkdown(match.file)} | ${escapeMarkdown(match.pattern)} | ${escapeMarkdown(match.reason)} |`);
  }
  if (result.warnings.length > 0) {
    lines.push('', '## Warnings', '');
    for (const warning of result.warnings) {
      lines.push(`- ${escapeMarkdown(warning.message)}`);
    }
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function renderPrecheckMarkdown(result) {
  const lines = [
    '# ad-build precheck',
    '',
    `Generated: ${result.generated_at}`,
    `Baseline status: ${result.baseline_status}`,
    `Worktree clean: ${result.worktree_clean}`,
    `Baseline path: ${result.baseline_path || ''}`,
    ''
  ];
  if (result.errors.length > 0) {
    lines.push('## Errors', '');
    for (const error of result.errors) {
      lines.push(`- ${escapeMarkdown(error.message)}`);
    }
    lines.push('');
  }
  if (result.warnings.length > 0) {
    lines.push('## Warnings', '');
    for (const warning of result.warnings) {
      lines.push(`- ${escapeMarkdown(warning.message)}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function renderVerifySummaryMarkdown(summary) {
  const lines = [
    '# ad-build verify summary',
    '',
    `Run: ${summary.run_id}`,
    `Generated: ${summary.generated_at}`,
    `Overall status: ${summary.overall_status}`,
    `Requested modules: ${summary.requested_modules.join(', ')}`,
    '',
    '| Module | Status | Commands |',
    '| --- | --- | --- |'
  ];
  for (const result of summary.results) {
    lines.push(`| ${escapeMarkdown(result.module)} | ${escapeMarkdown(result.status)} | ${String((result.commands || []).length)} |`);
  }
  lines.push('', '## Commands', '');
  for (const result of summary.results) {
    lines.push(`### ${escapeMarkdown(result.module)}`, '');
    if (!result.commands || result.commands.length === 0) {
      lines.push(`Status: ${escapeMarkdown(result.status)}`, '');
      continue;
    }
    lines.push('| Status | Exit | CWD | Command | Log |', '| --- | --- | --- | --- | --- |');
    for (const command of result.commands) {
      lines.push([
        `| ${escapeMarkdown(command.status)}`,
        command.exit_code === null ? '' : String(command.exit_code),
        escapeMarkdown(command.cwd),
        escapeMarkdown(command.command),
        `${escapeMarkdown(command.log_path || '')} |`
      ].join(' | '));
    }
    lines.push('');
  }
  if (summary.errors.length > 0) {
    lines.push('## Errors', '');
    for (const error of summary.errors) {
      lines.push(`- ${escapeMarkdown(error.message)}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function renderVerifyReportMarkdown({ repoRoot, runDir, runId, summary, reportStatus, errors }) {
  const lines = [
    '# ad-build verification report',
    '',
    `Run: ${runId}`,
    `Report status: ${reportStatus}`,
    ''
  ];
  if (!summary) {
    lines.push('Summary: unavailable', '');
  } else {
    lines.push(
      `Generated: ${summary.generated_at || ''}`,
      `Verify status: ${summary.overall_status || ''}`,
      `Requested modules: ${Array.isArray(summary.requested_modules) ? summary.requested_modules.join(', ') : ''}`,
      '',
      '| Module | Status | Failed/Timeout | Not Run |',
      '| --- | --- | --- | --- |'
    );
    for (const result of summary.results || []) {
      const commands = result.commands || [];
      const failed = commands.filter((command) => command.status === 'failed' || command.status === 'timeout').length;
      const notRun = commands.filter((command) => command.status === 'not_run').length;
      lines.push(`| ${escapeMarkdown(result.module || '')} | ${escapeMarkdown(result.status || '')} | ${failed} | ${notRun} |`);
    }
    lines.push('');
  }

  if (errors.length > 0) {
    lines.push('## Partial Report Issues', '');
    for (const error of errors) {
      lines.push(`- ${escapeMarkdown(error)}`);
    }
    lines.push('');
  }

  if (summary && Array.isArray(summary.results)) {
    lines.push('## Logs', '');
    const seenLogs = new Set();
    for (const result of summary.results) {
      for (const command of result.commands || []) {
        if (!command.log_path || seenLogs.has(command.log_path)) {
          continue;
        }
        seenLogs.add(command.log_path);
        lines.push(`### ${escapeMarkdown(command.log_path)}`, '');
        if (validateReportLogPath({ repoRoot, runDir, logPath: command.log_path }).ok) {
          const logPath = resolveRepoPath(repoRoot, command.log_path);
          lines.push('```text');
          lines.push(...tailLines(fs.readFileSync(logPath, 'utf8'), 80));
          lines.push('```', '');
        } else {
          lines.push('Log missing.', '');
        }
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

function helpText() {
  return [
    'ad-build',
    'Usage: ad-build <command>',
    '',
    'Commands:',
    '  doctor   Check local tool configuration and write .ad-build/doctor.*',
    '  diff     Write changed file summary to .ad-build/diff-*',
    '  full-build -- <command...>  Run and record a full build',
    '  map      Map changed files to modules and risk rules',
    '  modules  List configured verify modules and write .ad-build/modules.*',
    '  baseline-save --from-run latest  Publish a passed full-build baseline',
    '  bundle   Pack, inspect, or restore compiled-state bundles',
    '  public-base  Pack, publish, restore, and validate public-base dependency bundles',
    '  inventory status  Check restored compiled-state inventory',
    '  precheck Check whether a matching baseline exists',
    '  skill    Install or manage the bundled Claude skill',
    '  verify <module...>  Run configured module verification commands',
    '  report <run-id>     Write a Markdown report for a verify run',
    '  help     Show this help',
    ''
  ].join('\n');
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

function makeRunId(startedAt) {
  const compactTime = String(startedAt).replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return `${compactTime}-${crypto.randomBytes(6).toString('hex')}`;
}

function buildArtifactManifest(root, relativePaths) {
  return relativePaths
    .filter((relativePath) => fs.existsSync(path.join(root, relativePath)))
    .sort()
    .map((relativePath) => `${normalizeOutputPath(relativePath)} sha256:${sha256File(path.join(root, relativePath))}`)
    .join('\n') + '\n';
}

function osRelease() {
  try {
    return os.release();
  } catch {
    return null;
  }
}

function resolveRepoPath(repoRoot, repoPath) {
  return path.isAbsolute(repoPath) ? repoPath : path.join(repoRoot, repoPath);
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

function parseWrappedCommand(args) {
  const separator = args.indexOf('--');
  if (separator === -1 || separator === args.length - 1) {
    throw new Error('full-build requires -- followed by a command');
  }
  return args.slice(separator + 1);
}

function parseBaselineSaveArgs(args) {
  const index = args.indexOf('--from-run');
  if (index === -1) {
    throw new Error('baseline-save requires --from-run latest');
  }
  if (args[index + 1] !== 'latest') {
    throw new Error('baseline-save currently supports only --from-run latest');
  }
  return {
    fromRun: 'latest',
    replace: args.includes('--replace'),
    requireClean: args.includes('--allow-dirty') ? false : undefined
  };
}

function runGit(repoRoot, args) {
  return spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });
}

function parseNameStatusOutput(value) {
  const fields = nulFields(value);
  const entries = [];
  for (let index = 0; index < fields.length;) {
    const code = fields[index++];
    const status = statusFromGitCode(code);
    if (status === 'renamed' || status === 'copied') {
      const oldPath = fields[index++];
      const newPath = fields[index++];
      if (!oldPath || !newPath) {
        continue;
      }
      entries.push({
        path: normalizeOutputPath(newPath),
        status,
        old_path: normalizeOutputPath(oldPath)
      });
      continue;
    }

    const filePath = fields[index++];
    if (!filePath) {
      continue;
    }
    entries.push({
      path: normalizeOutputPath(filePath),
      status,
      old_path: null
    });
  }
  return entries;
}

function statusFromGitCode(code) {
  const status = code[0];
  if (status === 'A') {
    return 'added';
  }
  if (status === 'M') {
    return 'modified';
  }
  if (status === 'D') {
    return 'deleted';
  }
  if (status === 'R') {
    return 'renamed';
  }
  if (status === 'C') {
    return 'copied';
  }
  if (status === 'T') {
    return 'type_changed';
  }
  return 'unknown';
}

function detectBinary(repoRoot, baseRef, filePath) {
  const result = runGit(repoRoot, ['diff', '--numstat', baseRef, '--', filePath]);
  if (result.status !== 0) {
    return null;
  }
  return binaryFromNumstat(result.stdout);
}

function detectCachedBinary(repoRoot, filePath) {
  const result = runGit(repoRoot, ['diff', '--cached', '--numstat', '--', filePath]);
  if (result.status !== 0) {
    return null;
  }
  return binaryFromNumstat(result.stdout);
}

function binaryFromNumstat(stdout) {
  const line = outputLines(stdout)[0];
  if (!line) {
    return null;
  }
  const [added, deleted] = line.split('\t');
  if (added === '-' && deleted === '-') {
    return true;
  }
  return false;
}

function collectChangedFileEvidence(files) {
  const changedFiles = [];
  const seen = new Set();
  for (const file of files) {
    for (const value of [file.path, file.old_path]) {
      if (!value) {
        continue;
      }
      const filePath = normalizeOutputPath(value);
      if (!seen.has(filePath)) {
        seen.add(filePath);
        changedFiles.push(filePath);
      }
    }
  }
  return changedFiles;
}

function outputLines(value) {
  return String(value || '').split(/\r?\n/).filter((line) => line.length > 0);
}

function tailLines(value, count) {
  const lines = String(value || '').split(/\r?\n/);
  return lines.slice(Math.max(0, lines.length - count));
}

function nulFields(value) {
  const fields = String(value || '').split('\0');
  if (fields[fields.length - 1] === '') {
    fields.pop();
  }
  return fields;
}

function isMissingBaseRef(result, baseRef) {
  const stderr = trim(result.stderr).toLowerCase();
  return result.status !== 0
    && baseRef === 'HEAD'
    && (stderr.includes('ambiguous argument') || stderr.includes('needed a single revision') || stderr.includes('bad revision'));
}

function compareFiles(a, b) {
  return a.path.localeCompare(b.path) || a.status.localeCompare(b.status);
}

function normalizeOutputPath(value) {
  return value.replaceAll('\\', '/');
}

function trim(value) {
  return String(value || '').trim();
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) {
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function majorVersion(value) {
  return String(value || '').split('.')[0];
}

function escapeMarkdown(value) {
  return String(value).replaceAll('|', '\\|').replace(/\r?\n/g, ' ');
}

module.exports = {
  baselinePath,
  buildDiffSummary,
  buildDoctorResult,
  buildMapResult,
  buildModulesResult,
  buildPrecheckResult,
  resolveRepoRoot,
  runBaselineSave,
  runDiff,
  runDoctor,
  runFullBuild,
  runMap,
  runModules,
  runPrecheck,
  runReport,
  runCli,
  runVerify,
  runVerifyModules,
  validateBaselineSave,
  helpText
};
