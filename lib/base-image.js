const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const core = require('./core');
const { sha256File: sha256FileWithPrefix } = require('./file-utils');
const moduleMap = require('./module-map');

const OUTPUT_DIR = '.ad-build';
const DEFAULT_CONFIG_PATH = 'tools/base-image.yaml';
const DEFAULT_ARTIFACT_ROOT = '/opt/ad-build/base';
const DEFAULT_PUBLIC_INPUTS = [
  'libs/**',
  'sinfor/**',
  'include/**',
  'linux/**',
  'app_bin/**',
  'compile.sh',
  'Makefile',
  'app.mk',
  '**/*.mk'
];
const DEFAULT_ARTIFACT_DIRS = [
  'libs',
  'sinfor',
  'include',
  'linux',
  'app_bin'
];
const DEFAULT_PUBLIC_INPUT_EXCLUDES = [
  '**/*.o',
  '**/*.so',
  '**/*.so.*',
  '**/*.a',
  '**/*.ko',
  '**/build/**',
  '**/dist/**',
  '**/.cache/**'
];

function buildImageStatusResult(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const env = options.env || process.env;
  const warnings = [];
  const config = readBaseImageConfig({ repoRoot, env, configPath: options.configPath, warnings });
  const git = collectGitMetadata(repoRoot, warnings);
  const publicInputs = collectPublicInputs({ repoRoot, patterns: config.public_inputs, excludes: config.public_input_excludes, warnings });
  const baseImageIdentity = buildBaseImageIdentity(config, env);
  const publicKey = core.digestJson({
    schema_version: 1,
    kind: 'ad-build-public-base-image',
    base_image_identity: baseImageIdentity,
    public_inputs_digest: publicInputs.digest,
    public_inputs: config.public_inputs,
    public_input_excludes: config.public_input_excludes,
    artifact_dirs: config.artifact_dirs,
    restore_dirs: config.restore_dirs
  });
  const publicKeyShort = core.safeDigestKey(publicKey).slice(0, 12);
  const imageRef = chooseImageRef({ config, publicKeyShort, branch: git.branch, env });
  const localImage = options.checkDocker === false
    ? { status: 'skipped', image_ref: imageRef }
    : inspectDockerImage(imageRef, env);
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    mode: 'public_base_image',
    config_path: config.config_path,
    config_found: config.config_found,
    repo_root: repoRoot,
    branch: git.branch,
    commit: git.commit,
    ref: git.ref,
    base_image: config.base_image,
    base_image_identity: baseImageIdentity,
    artifact_root: config.artifact_root,
    public_key: publicKey,
    public_key_short: publicKeyShort,
    image_ref: imageRef,
    public_inputs: publicInputs,
    artifact_dirs: config.artifact_dirs,
    restore_dirs: config.restore_dirs,
    local_image: localImage,
    warnings,
    errors: []
  };
  result.recommendation = buildStatusRecommendation(result);
  return result;
}

function runStatus(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const result = buildImageStatusResult({
    repoRoot,
    env: options.env || process.env,
    configPath: options.configPath,
    checkDocker: options.checkDocker
  });
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'base-image');
  core.writeJson(path.join(outDir, 'status.json'), result);
  writeText(path.join(outDir, 'status.md'), renderStatusMarkdown(result));
  return result;
}

function runSave(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const env = options.env || process.env;
  const status = buildImageStatusResult({
    repoRoot,
    env,
    configPath: options.configPath,
    checkDocker: false
  });
  const imageRef = options.tag || status.image_ref;
  const artifactPaths = existingArtifactPaths(repoRoot, status.artifact_dirs);
  const missingArtifactDirs = status.artifact_dirs.filter((repoPath) => !fs.existsSync(path.join(repoRoot, repoPath)));
  const runId = makeRunId(status.generated_at);
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'base-image');
  const contextDir = path.join(outDir, `context-${runId}`);
  const tarPath = path.join(contextDir, 'ad-build-base.tar');
  const manifestPath = path.join(contextDir, 'manifest.json');
  const dockerfilePath = path.join(contextDir, 'Dockerfile');
  const artifactListPath = path.join(contextDir, 'artifact-list.txt');

  fs.mkdirSync(contextDir, { recursive: true });
  fs.writeFileSync(artifactListPath, `${artifactPaths.join('\n')}\n`);
  const tarResult = artifactPaths.length === 0
    ? { status: 0, stdout: '', stderr: '' }
    : spawnSync('tar', ['-cf', tarPath, '-T', artifactListPath], { cwd: repoRoot, encoding: 'utf8', env });
  if (tarResult.error || tarResult.status !== 0) {
    throw commandError('tar', tarResult);
  }

  const manifest = {
    schema_version: 1,
    producer: 'ad-build',
    kind: 'public_base_image',
    created_at: core.nowIso(),
    image_ref: imageRef,
    base_image: status.base_image,
    base_image_identity: status.base_image_identity,
    public_key: status.public_key,
    public_key_short: status.public_key_short,
    artifact_root: status.artifact_root,
    artifact_dirs: status.artifact_dirs,
    restore_dirs: status.restore_dirs,
    missing_artifact_dirs: missingArtifactDirs,
    public_inputs: status.public_inputs,
    branch: status.branch,
    commit: status.commit,
    ref: status.ref
  };
  core.writeJson(manifestPath, manifest);
  writeText(dockerfilePath, renderDockerfile({
    baseImage: status.base_image,
    artifactRoot: status.artifact_root,
    publicKey: status.public_key,
    publicKeyShort: status.public_key_short,
    imageRef
  }));

  const buildResult = spawnSync('docker', ['build', '-f', dockerfilePath, '-t', imageRef, contextDir], {
    cwd: repoRoot,
    env,
    encoding: 'utf8'
  });
  const pushRequested = Boolean(options.push);
  let pushResult = null;
  if (buildResult.error || buildResult.status !== 0) {
    pushResult = { status: 'skipped' };
  } else if (pushRequested) {
    const pushed = spawnSync('docker', ['push', imageRef], { cwd: repoRoot, env, encoding: 'utf8' });
    pushResult = summarizeCommand('docker push', pushed);
  }

  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    run_id: runId,
    image_ref: imageRef,
    public_key: status.public_key,
    public_key_short: status.public_key_short,
    context_dir: normalizeOutputPath(path.relative(repoRoot, contextDir)),
    manifest_path: normalizeOutputPath(path.relative(repoRoot, manifestPath)),
    dockerfile_path: normalizeOutputPath(path.relative(repoRoot, dockerfilePath)),
    artifact_tar_path: normalizeOutputPath(path.relative(repoRoot, tarPath)),
    artifact_dirs: status.artifact_dirs,
    missing_artifact_dirs: missingArtifactDirs,
    docker_build: summarizeCommand('docker build', buildResult),
    docker_push: pushRequested ? pushResult : { status: 'not_requested' },
    status: buildResult.error || buildResult.status !== 0 || (pushRequested && pushResult.status !== 'passed') ? 'failed' : 'passed',
    warnings: status.warnings,
    errors: []
  };
  core.writeJson(path.join(outDir, 'save.json'), result);
  writeText(path.join(outDir, 'save.md'), renderSaveMarkdown(result));
  return result;
}

function runPull(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const env = options.env || process.env;
  const status = buildImageStatusResult({ repoRoot, env, configPath: options.configPath, checkDocker: false });
  const imageRef = options.tag || status.image_ref;
  const pull = spawnSync('docker', ['pull', imageRef], { cwd: repoRoot, env, encoding: 'utf8' });
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    image_ref: imageRef,
    docker_pull: summarizeCommand('docker pull', pull),
    status: pull.error || pull.status !== 0 ? 'failed' : 'passed'
  };
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'base-image');
  core.writeJson(path.join(outDir, 'pull.json'), result);
  return result;
}

function runPush(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const env = options.env || process.env;
  const status = buildImageStatusResult({ repoRoot, env, configPath: options.configPath, checkDocker: false });
  const imageRef = options.tag || status.image_ref;
  const push = spawnSync('docker', ['push', imageRef], { cwd: repoRoot, env, encoding: 'utf8' });
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    image_ref: imageRef,
    docker_push: summarizeCommand('docker push', push),
    status: push.error || push.status !== 0 ? 'failed' : 'passed'
  };
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'base-image');
  core.writeJson(path.join(outDir, 'push.json'), result);
  return result;
}

function runRestore(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const env = options.env || process.env;
  const status = buildImageStatusResult({ repoRoot, env, configPath: options.configPath, checkDocker: false });
  const imageRef = options.tag || status.image_ref;
  const artifactRoot = status.artifact_root;
  const deleted = [];
  if (options.deleteBeforeRestore) {
    for (const repoPath of status.restore_dirs) {
      const absolute = safeRepoChildPath(repoRoot, repoPath);
      if (fs.existsSync(absolute)) {
        fs.rmSync(absolute, { recursive: true, force: true });
        deleted.push(repoPath);
      }
    }
  }

  const create = spawnSync('docker', ['create', imageRef], { cwd: repoRoot, env, encoding: 'utf8' });
  const containerId = trim(create.stdout);
  let copy = null;
  let remove = null;
  if (!create.error && create.status === 0 && containerId) {
    copy = spawnSync('docker', ['cp', `${containerId}:${artifactRoot}/.`, repoRoot], { cwd: repoRoot, env, encoding: 'utf8' });
    remove = spawnSync('docker', ['rm', containerId], { cwd: repoRoot, env, encoding: 'utf8' });
  }

  const copySummary = copy ? summarizeCommand('docker cp', copy) : { status: 'skipped' };
  const result = {
    schema_version: 1,
    generated_at: core.nowIso(),
    image_ref: imageRef,
    artifact_root: artifactRoot,
    restore_dirs: status.restore_dirs,
    deleted_before_restore: deleted,
    docker_create: summarizeCommand('docker create', create),
    docker_cp: copySummary,
    docker_rm: remove ? summarizeCommand('docker rm', remove) : { status: 'skipped' },
    status: create.error || create.status !== 0 || !copy || copy.error || copy.status !== 0 ? 'failed' : 'passed',
    warnings: options.deleteBeforeRestore ? [] : [{ message: 'restore copied artifacts without deleting existing artifact directories; use --delete to reset configured restore_dirs first' }],
    errors: []
  };
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'base-image');
  core.writeJson(path.join(outDir, 'restore.json'), result);
  writeText(path.join(outDir, 'restore.md'), renderRestoreMarkdown(result));
  return result;
}

async function runCli(argv = process.argv.slice(2), options = {}) {
  const command = argv[0] || 'help';
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  const env = options.env || process.env;
  const cwd = options.cwd || process.cwd();

  try {
    if (command === 'help' || command === '--help' || command === '-h') {
      stdout.write(helpText());
      return 0;
    }
    const parsed = parseCommonArgs(argv.slice(1));
    const runOptions = { ...parsed, env, cwd, repoRoot: options.repoRoot };
    if (command === 'key' || command === 'status') {
      const result = runStatus(runOptions);
      stdout.write(`wrote .ad-build/base-image/status.json and .ad-build/base-image/status.md\nimage_ref=${result.image_ref}\npublic_key=${result.public_key}\n`);
      return 0;
    }
    if (command === 'save') {
      const result = runSave(runOptions);
      stdout.write(`wrote .ad-build/base-image/save.json\nimage_ref=${result.image_ref}\n`);
      return result.status === 'passed' ? 0 : 1;
    }
    if (command === 'pull') {
      const result = runPull(runOptions);
      stdout.write(`wrote .ad-build/base-image/pull.json\nimage_ref=${result.image_ref}\n`);
      return result.status === 'passed' ? 0 : 1;
    }
    if (command === 'push') {
      const result = runPush(runOptions);
      stdout.write(`wrote .ad-build/base-image/push.json\nimage_ref=${result.image_ref}\n`);
      return result.status === 'passed' ? 0 : 1;
    }
    if (command === 'restore') {
      const result = runRestore(runOptions);
      stdout.write(`wrote .ad-build/base-image/restore.json and .ad-build/base-image/restore.md\nimage_ref=${result.image_ref}\n`);
      return result.status === 'passed' ? 0 : 1;
    }
    stderr.write(`unknown image command: ${command}\n${helpText()}`);
    return 2;
  } catch (error) {
    stderr.write(`ad-build image ${command} failed: ${error.message}\n`);
    return error.exitCode || 2;
  }
}

function readBaseImageConfig(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const env = options.env || process.env;
  const warnings = options.warnings || [];
  const selectedPath = options.configPath || trim(env.AD_BUILD_BASE_IMAGE_CONFIG) || DEFAULT_CONFIG_PATH;
  const absolutePath = path.isAbsolute(selectedPath) ? selectedPath : path.join(repoRoot, selectedPath);
  let raw = {};
  let found = false;
  if (fs.existsSync(absolutePath)) {
    found = true;
    const source = fs.readFileSync(absolutePath, 'utf8');
    raw = selectedPath.endsWith('.json') ? JSON.parse(source) : parseSimpleYaml(source);
  } else {
    warnings.push({ message: `${normalizeOutputPath(selectedPath)} not found; built-in public base image defaults were used` });
  }
  const publicInputs = normalizeStringArray(raw.public_inputs, DEFAULT_PUBLIC_INPUTS, 'public_inputs');
  const publicInputExcludes = normalizeStringArray(raw.public_input_excludes, DEFAULT_PUBLIC_INPUT_EXCLUDES, 'public_input_excludes');
  const artifactDirs = normalizeStringArray(raw.artifact_dirs, DEFAULT_ARTIFACT_DIRS, 'artifact_dirs').map(validateRepoRelativePath);
  const restoreDirs = normalizeStringArray(raw.restore_dirs, artifactDirs, 'restore_dirs').map(validateRepoRelativePath);
  return {
    config_path: normalizeOutputPath(selectedPath),
    config_found: found,
    registry: trim(env.AD_BUILD_PUBLIC_BASE_REGISTRY) || trim(raw.registry),
    image_name: trim(env.AD_BUILD_PUBLIC_BASE_IMAGE_NAME) || trim(raw.image_name) || 'ad-build-base',
    image_ref: trim(env.AD_BUILD_PUBLIC_BASE_IMAGE_REF) || trim(raw.image_ref),
    tag_prefix: trim(env.AD_BUILD_PUBLIC_BASE_TAG_PREFIX) || trim(raw.tag_prefix),
    base_image: trim(env.AD_BUILD_PUBLIC_BASE_FROM) || trim(raw.base_image) || trim(env.AD_BUILD_DOCKER_IMAGE) || 'scratch',
    base_image_digest: trim(env.AD_BUILD_PUBLIC_BASE_DIGEST) || trim(raw.base_image_digest) || trim(env.AD_BUILD_DOCKER_DIGEST),
    artifact_root: trim(raw.artifact_root) || DEFAULT_ARTIFACT_ROOT,
    public_inputs: publicInputs.map(validateRepoRelativePath),
    public_input_excludes: publicInputExcludes.map(validateRepoRelativePath),
    artifact_dirs: artifactDirs,
    restore_dirs: restoreDirs
  };
}

function parseSimpleYaml(source) {
  const out = {};
  let currentArrayKey = null;
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const raw = stripYamlComment(lines[lineNumber]);
    if (!raw.trim()) {
      continue;
    }
    const indent = raw.match(/^ */)[0].length;
    const text = raw.slice(indent).trim();
    if (indent === 0) {
      const match = /^([A-Za-z0-9_.-]+):(?:\s*(.*))?$/.exec(text);
      if (!match) {
        throw new Error(`invalid base-image YAML at line ${lineNumber + 1}`);
      }
      const key = match[1];
      const value = match[2] ?? '';
      if (value === '') {
        out[key] = [];
        currentArrayKey = key;
      } else {
        out[key] = unquoteScalar(value, lineNumber + 1);
        currentArrayKey = null;
      }
      continue;
    }
    if (indent === 2 && text.startsWith('- ')) {
      if (!currentArrayKey || !Array.isArray(out[currentArrayKey])) {
        throw new Error(`array item found outside an array at line ${lineNumber + 1}`);
      }
      out[currentArrayKey].push(unquoteScalar(text.slice(2).trim(), lineNumber + 1));
      continue;
    }
    throw new Error(`unsupported base-image YAML indentation at line ${lineNumber + 1}`);
  }
  return out;
}

function stripYamlComment(line) {
  let quote = '';
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? '' : char;
    }
    if (char === '#' && !quote) {
      return line.slice(0, index);
    }
  }
  return line;
}

function unquoteScalar(value, lineNumber) {
  if (!value) {
    throw new Error(`empty scalar is not supported at line ${lineNumber}`);
  }
  if (value === '[]') {
    return [];
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value.startsWith('"') || value.startsWith("'") || value.endsWith('"') || value.endsWith("'")) {
    throw new Error(`unterminated quoted scalar at line ${lineNumber}`);
  }
  return value;
}

function normalizeStringArray(value, fallback, label) {
  const selected = value === undefined || value === null || value === '' ? fallback : value;
  if (!Array.isArray(selected) || selected.length === 0 || selected.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new TypeError(`${label} must be a non-empty string array`);
  }
  return [...selected];
}

function collectGitMetadata(repoRoot, warnings) {
  const commitResult = runGit(repoRoot, ['rev-parse', 'HEAD']);
  const commit = commitResult.status === 0 && /^[a-f0-9]{40}$/.test(trim(commitResult.stdout)) ? trim(commitResult.stdout) : null;
  const branchResult = runGit(repoRoot, ['symbolic-ref', '-q', '--short', 'HEAD']);
  const branch = branchResult.status === 0 ? trim(branchResult.stdout) : null;
  const symbolicRefResult = runGit(repoRoot, ['symbolic-ref', '-q', 'HEAD']);
  const symbolicRef = symbolicRefResult.status === 0 ? trim(symbolicRefResult.stdout) : '';
  if (!commit) {
    warnings.push({ message: 'git commit is unavailable; public base key will be based on input files only' });
  }
  return {
    commit,
    branch,
    ref: symbolicRef || (commit ? `DETACHED:${commit}` : null)
  };
}

function collectPublicInputs({ repoRoot, patterns, excludes = [], warnings }) {
  const allRepoFiles = collectRepoFiles(repoRoot);
  const filesByPath = new Map();
  const missingPatterns = [];
  for (const pattern of patterns) {
    const matches = matchPatternOrPath(repoRoot, allRepoFiles, pattern)
      .filter((repoPath) => !excludes.some((excludePattern) => safePathMatches(repoPath, excludePattern)));
    if (matches.length === 0) {
      missingPatterns.push(pattern);
      continue;
    }
    for (const repoPath of matches) {
      filesByPath.set(repoPath, repoPath);
    }
  }
  const files = [...filesByPath.keys()].sort().map((repoPath) => {
    const absolute = path.join(repoRoot, repoPath);
    const stat = fs.statSync(absolute);
    return {
      path: repoPath,
      size: stat.size,
      sha256: sha256File(absolute)
    };
  });
  if (missingPatterns.length > 0) {
    warnings.push({ message: `public input patterns had no matches: ${missingPatterns.join(', ')}` });
  }
  return {
    patterns,
    excludes,
    file_count: files.length,
    digest: core.digestJson({ patterns, excludes, files, missing_patterns: missingPatterns }),
    missing_patterns: missingPatterns,
    files
  };
}

function matchPatternOrPath(repoRoot, allRepoFiles, pattern) {
  const normalized = normalizeOutputPath(pattern);
  const absolute = path.join(repoRoot, normalized);
  if (!containsGlob(normalized) && fs.existsSync(absolute)) {
    const stat = fs.statSync(absolute);
    if (stat.isFile()) {
      return [normalized];
    }
    if (stat.isDirectory()) {
      return allRepoFiles.filter((repoPath) => repoPath === normalized || repoPath.startsWith(`${normalized}/`));
    }
  }
  return allRepoFiles.filter((repoPath) => safePathMatches(repoPath, normalized));
}

function collectRepoFiles(repoRoot) {
  const out = [];
  collectFilesRecursive(repoRoot, '', out);
  return out.sort();
}

function collectFilesRecursive(absoluteDir, relativeDir, out) {
  for (const name of fs.readdirSync(absoluteDir).sort()) {
    if (relativeDir === '' && ['.git', '.ad-build', 'node_modules'].includes(name)) {
      continue;
    }
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

function safePathMatches(repoPath, pattern) {
  try {
    return moduleMap.pathMatches(repoPath, pattern);
  } catch {
    return false;
  }
}

function containsGlob(value) {
  return /[*?]/.test(value);
}

function buildBaseImageIdentity(config, env) {
  const digest = config.base_image_digest;
  if (digest) {
    return `${config.base_image}@${digest}`;
  }
  return config.base_image;
}

function chooseImageRef({ config, publicKeyShort, branch, env }) {
  if (config.image_ref) {
    return config.image_ref;
  }
  const repository = config.registry ? `${config.registry.replace(/\/+$/, '')}/${config.image_name}` : config.image_name;
  const prefix = sanitizeDockerTag(config.tag_prefix || branch || 'workspace');
  return `${repository}:${prefix}-public-${publicKeyShort}`;
}

function sanitizeDockerTag(value) {
  let tag = String(value || 'workspace').replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!tag) {
    tag = 'workspace';
  }
  if (!/^[A-Za-z0-9_]/.test(tag)) {
    tag = `x${tag}`;
  }
  return tag.slice(0, 100);
}

function inspectDockerImage(imageRef, env) {
  const result = spawnSync('docker', ['image', 'inspect', imageRef], { encoding: 'utf8', env });
  if (result.error) {
    return { status: 'docker_unavailable', image_ref: imageRef, message: result.error.message };
  }
  if (result.status !== 0) {
    return { status: 'missing', image_ref: imageRef, stderr: trim(result.stderr) };
  }
  try {
    const parsed = JSON.parse(result.stdout);
    return {
      status: 'present',
      image_ref: imageRef,
      image_id: parsed[0]?.Id || null,
      created: parsed[0]?.Created || null
    };
  } catch (error) {
    return { status: 'inspect_parse_failed', image_ref: imageRef, message: error.message };
  }
}

function existingArtifactPaths(repoRoot, artifactDirs) {
  return artifactDirs
    .map((repoPath) => validateRepoRelativePath(repoPath))
    .filter((repoPath) => fs.existsSync(path.join(repoRoot, repoPath)));
}

function renderDockerfile({ baseImage, artifactRoot, publicKey, publicKeyShort, imageRef }) {
  if (!isSafeDockerImageRef(baseImage)) {
    throw new Error(`unsafe base image reference: ${baseImage}`);
  }
  if (!artifactRoot.startsWith('/')) {
    throw new Error(`artifact_root must be absolute inside the image: ${artifactRoot}`);
  }
  const escapedArtifactRoot = artifactRoot.replace(/\/+$/, '') || '/opt/ad-build/base';
  return [
    `FROM ${baseImage}`,
    'LABEL org.opencontainers.image.title="ad-build public base image"',
    `LABEL ad-build.public-key="${publicKey}"`,
    `LABEL ad-build.public-key-short="${publicKeyShort}"`,
    `LABEL ad-build.image-ref="${imageRef}"`,
    `LABEL ad-build.artifact-root="${escapedArtifactRoot}"`,
    'COPY manifest.json /opt/ad-build/base-image-manifest.json',
    `ADD ad-build-base.tar ${escapedArtifactRoot}/`,
    ''
  ].join('\n');
}

function isSafeDockerImageRef(value) {
  return typeof value === 'string' && value.length > 0 && !/[\s`$\\]/.test(value);
}

function buildStatusRecommendation(result) {
  if (result.local_image.status === 'present') {
    return 'public base image is present locally; restore can run without pulling';
  }
  if (result.local_image.status === 'missing') {
    return 'public base image is not present locally; run ad-build image pull or build/push it in CI';
  }
  if (result.local_image.status === 'docker_unavailable') {
    return 'docker is unavailable; status still produced the deterministic public key and image reference';
  }
  return 'inspect status output before restoring public artifacts';
}

function renderStatusMarkdown(result) {
  const lines = [
    '# ad-build public base image status',
    '',
    `Generated: ${result.generated_at}`,
    `Image: ${result.image_ref}`,
    `Public key: ${result.public_key}`,
    `Base image: ${result.base_image_identity}`,
    `Local image status: ${result.local_image.status}`,
    `Public input files: ${result.public_inputs.file_count}`,
    '',
    '## Artifact directories',
    ''
  ];
  for (const repoPath of result.artifact_dirs) {
    lines.push(`- ${repoPath}`);
  }
  if (result.warnings.length > 0) {
    lines.push('', '## Warnings', '');
    for (const warning of result.warnings) {
      lines.push(`- ${escapeMarkdown(warning.message)}`);
    }
  }
  lines.push('', `Recommendation: ${result.recommendation}`, '');
  return `${lines.join('\n')}\n`;
}

function renderSaveMarkdown(result) {
  const lines = [
    '# ad-build public base image save',
    '',
    `Generated: ${result.generated_at}`,
    `Status: ${result.status}`,
    `Image: ${result.image_ref}`,
    `Public key: ${result.public_key}`,
    `Docker build: ${result.docker_build.status}`,
    `Docker push: ${result.docker_push.status}`,
    ''
  ];
  if (result.missing_artifact_dirs.length > 0) {
    lines.push('## Missing artifact directories', '');
    for (const repoPath of result.missing_artifact_dirs) {
      lines.push(`- ${repoPath}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function renderRestoreMarkdown(result) {
  const lines = [
    '# ad-build public base image restore',
    '',
    `Generated: ${result.generated_at}`,
    `Status: ${result.status}`,
    `Image: ${result.image_ref}`,
    `Artifact root: ${result.artifact_root}`,
    '',
    '| Step | Status |',
    '| --- | --- |',
    `| docker create | ${result.docker_create.status} |`,
    `| docker cp | ${result.docker_cp.status} |`,
    `| docker rm | ${result.docker_rm.status} |`,
    ''
  ];
  if (result.deleted_before_restore.length > 0) {
    lines.push('## Deleted before restore', '');
    for (const repoPath of result.deleted_before_restore) {
      lines.push(`- ${repoPath}`);
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

function parseCommonArgs(args) {
  const out = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--config') {
      out.configPath = requireValue(args, index, '--config');
      index += 1;
    } else if (arg === '--tag' || arg === '--image') {
      out.tag = requireValue(args, index, arg);
      index += 1;
    } else if (arg === '--push') {
      out.push = true;
    } else if (arg === '--delete') {
      out.deleteBeforeRestore = true;
    } else if (arg === '--no-docker') {
      out.checkDocker = false;
    } else {
      const error = new Error(`unknown option: ${arg}`);
      error.exitCode = 2;
      throw error;
    }
  }
  return out;
}

function requireValue(args, index, flag) {
  if (!args[index + 1]) {
    const error = new Error(`${flag} requires a value`);
    error.exitCode = 2;
    throw error;
  }
  return args[index + 1];
}

function summarizeCommand(command, result) {
  if (!result) {
    return { command, status: 'skipped' };
  }
  if (result.error) {
    return { command, status: 'failed', exit_code: null, message: result.error.message, stdout: result.stdout || '', stderr: result.stderr || '' };
  }
  return {
    command,
    status: result.status === 0 ? 'passed' : 'failed',
    exit_code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function commandError(command, result) {
  const error = new Error(`${command} failed: ${result.error ? result.error.message : trim(result.stderr) || `exit ${result.status}`}`);
  error.exitCode = 1;
  return error;
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
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' });
  if (!result.error && result.status === 0 && trim(result.stdout)) {
    return path.resolve(trim(result.stdout));
  }
  return path.resolve(cwd);
}

function runGit(repoRoot, args) {
  return spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function validateRepoRelativePath(value) {
  const normalized = normalizeOutputPath(String(value || ''));
  if (!normalized || path.posix.isAbsolute(normalized) || path.win32.isAbsolute(value) || normalized.split('/').includes('..')) {
    throw new Error(`path must be repository-relative: ${value}`);
  }
  return normalized;
}

function safeRepoChildPath(repoRoot, repoPath) {
  const normalized = validateRepoRelativePath(repoPath);
  if (normalized === '.' || normalized === '') {
    throw new Error('refusing to delete repository root');
  }
  const absolute = path.resolve(repoRoot, normalized);
  const relative = path.relative(repoRoot, absolute);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`path escapes repository: ${repoPath}`);
  }
  return absolute;
}

function makeRunId(startedAt) {
  const compactTime = String(startedAt || core.nowIso()).replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return `${compactTime}-${crypto.randomBytes(6).toString('hex')}`;
}

function sha256File(file) {
  return sha256FileWithPrefix(file).slice('sha256:'.length);
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

function normalizeOutputPath(value) {
  return String(value).replaceAll('\\', '/');
}

function trim(value) {
  return String(value || '').trim();
}

function escapeMarkdown(value) {
  return String(value).replaceAll('|', '\\|').replace(/\r?\n/g, ' ');
}

function helpText() {
  return [
    'ad-build image',
    'Usage: ad-build image <command> [options]',
    '',
    'Commands:',
    '  status|key        Compute public base image key and local image status',
    '  save              Build a public base image from configured artifact dirs',
    '  pull              Pull the computed or specified public base image',
    '  push              Push the computed or specified public base image',
    '  restore           Restore artifacts from the public base image into the repo',
    '  help              Show this help',
    '',
    'Options:',
    '  --config <path>   Config path, default tools/base-image.yaml',
    '  --tag <image>     Override computed image reference',
    '  --push            Push after save',
    '  --delete          Delete restore_dirs before restore',
    '  --no-docker       Skip docker image inspect for status/key',
    ''
  ].join('\n');
}

module.exports = {
  DEFAULT_ARTIFACT_DIRS,
  DEFAULT_PUBLIC_INPUTS,
  DEFAULT_PUBLIC_INPUT_EXCLUDES,
  buildImageStatusResult,
  chooseImageRef,
  collectPublicInputs,
  helpText,
  parseSimpleYaml,
  readBaseImageConfig,
  renderDockerfile,
  runCli,
  runPull,
  runPush,
  runRestore,
  runSave,
  runStatus,
  sanitizeDockerTag
};
