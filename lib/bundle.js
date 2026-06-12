const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const core = require('./core');
const moduleMap = require('./module-map');

const OUTPUT_DIR = '.ad-build';
const RESTORE_INVENTORY_PATH = path.join(OUTPUT_DIR, 'inventory', 'current.json');
const LEGACY_RESTORE_INVENTORY_PATHS = [
  path.join(OUTPUT_DIR, 'bundle', 'restore-inventory.json'),
  path.join(OUTPUT_DIR, 'bundle', 'latest', 'inventory.json')
];
const DEFAULT_PROFILE = 'full';
const DEV_DIRS = ['apps', 'libs', 'linux', 'access_layer', 'include', 'sinfor', 'app_bin', 'obj', 'shell', 'ui', 'cfg'];
const FULL_DIRS = [...DEV_DIRS, 'mkpacket', 'ssipacket', 'ad_packet'];

function packBundle(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const profile = normalizeProfile(options.profile || DEFAULT_PROFILE);
  const git = gitInfo(repoRoot);
  const runId = core.nowIso().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') + '-' + crypto.randomBytes(4).toString('hex');
  const outPath = path.resolve(repoRoot, options.out || path.join(OUTPUT_DIR, 'bundles', `${profile}-${short(git.commit)}-${runId}.tar`));
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-bundle-pack-'));
  const filesRoot = path.join(staging, 'files');
  fs.mkdirSync(filesRoot, { recursive: true });

  const outRel = repoRelative(repoRoot, outPath);
  const files = [];
  const deleted = [];
  for (const entry of collectEntries(repoRoot, profile, outRel)) {
    if (entry.status === 'deleted') {
      deleted.push({ path: entry.path, status: entry.status });
      continue;
    }
    const source = path.join(repoRoot, entry.path);
    if (!fs.existsSync(source)) continue;
    const stat = fs.lstatSync(source);
    if (!stat.isFile()) continue;
    const target = path.join(filesRoot, entry.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    files.push({
      path: entry.path,
      status: entry.status || null,
      source: entry.source,
      sha256: sha256File(source),
      size: stat.size,
      mode: (stat.mode & 0o777).toString(8).padStart(4, '0')
    });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  deleted.sort((a, b) => a.path.localeCompare(b.path));
  const manifest = {
    schema_version: 1,
    producer: 'ad-build',
    kind: 'compiled-state-bundle',
    profile,
    created_at: core.nowIso(),
    run_id: runId,
    commit: git.commit,
    branch: git.branch,
    ref: git.ref,
    repo_root_hint: repoRoot,
    generated_dirs: profileDirs(profile),
    files_count: files.length,
    deleted_count: deleted.length,
    files,
    deleted,
    runtime: {
      hostname: safeHostname(),
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      docker_image: options.env?.AD_BUILD_DOCKER_IMAGE || null,
      docker_digest: options.env?.AD_BUILD_DOCKER_DIGEST || null
    }
  };
  const inventory = buildInventory(manifest, { source: 'bundle-pack' });
  core.writeJson(path.join(staging, 'manifest.json'), manifest);
  core.writeJson(path.join(staging, 'inventory.json'), inventory);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  runTar(['-cf', outPath, '-C', staging, 'manifest.json', 'inventory.json', 'files']);

  const latest = path.join(repoRoot, OUTPUT_DIR, 'bundle', 'latest');
  fs.mkdirSync(latest, { recursive: true });
  core.writeJson(path.join(latest, 'manifest.json'), manifest);
  core.writeJson(path.join(latest, 'inventory.json'), inventory);
  const packSummary = buildPackSummary({ bundlePath: outPath, manifest, files, deleted });
  core.writeJson(path.join(latest, 'pack-summary.json'), packSummary);
  core.writeJson(outPath.replace(/\.tar$/, '') + '.manifest.json', manifest);
  core.writeJson(outPath.replace(/\.tar$/, '') + '.inventory.json', inventory);
  return { bundle_path: norm(outPath), manifest_path: norm(path.join(latest, 'manifest.json')), inventory_path: norm(path.join(latest, 'inventory.json')), pack_summary_path: norm(path.join(latest, 'pack-summary.json')), profile, files_count: files.length };
}

function inspectBundle(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const bundle = requiredBundle(options, repoRoot);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-bundle-inspect-'));
  runTar(['-xf', bundle, '-C', staging, 'manifest.json', 'inventory.json']);
  const manifest = core.readJson(path.join(staging, 'manifest.json'));
  const result = { schema_version: 1, generated_at: core.nowIso(), bundle_path: norm(bundle), profile: manifest.profile, commit: manifest.commit, branch: manifest.branch, files_count: manifest.files_count, deleted_count: manifest.deleted_count, sample_files: (manifest.files || []).slice(0, 50).map((f) => f.path) };
  const outDir = path.join(repoRoot, OUTPUT_DIR, 'bundle');
  core.writeJson(path.join(outDir, 'inspect.json'), result);
  writeText(path.join(outDir, 'inspect.md'), `# ad-build bundle inspect\n\nFiles: ${result.files_count}\n`);
  return { inspect_path: norm(path.join(outDir, 'inspect.json')), ...result };
}

function restoreBundle(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const bundle = requiredBundle(options, repoRoot);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-bundle-restore-'));
  const current = gitInfo(repoRoot);
  runTar(['-xf', bundle, '-C', staging]);
  const manifest = core.readJson(path.join(staging, 'manifest.json'));
  const mismatch = Boolean(manifest.commit && current.commit && manifest.commit !== current.commit);
  if (mismatch && !options.allowCommitMismatch) {
    const error = new Error(`bundle commit ${manifest.commit} does not match current commit ${current.commit}; use --allow-commit-mismatch to restore anyway`);
    error.exitCode = 4;
    throw error;
  }
  validateManifestPayload({ manifest, staging });
  let count = 0;
  for (const entry of manifest.files || []) {
    safePath(entry.path);
    const source = path.join(staging, 'files', entry.path);
    const target = path.join(repoRoot, entry.path);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    if (entry.mode) {
      try { fs.chmodSync(target, parseInt(entry.mode, 8)); } catch { /* keep restored content even when chmod is unsupported */ }
    }
    count += 1;
  }
  let deletedCount = 0;
  for (const entry of manifest.deleted || []) {
    safePath(entry.path);
    const target = path.join(repoRoot, entry.path);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      deletedCount += 1;
    }
  }
  const restoredAt = core.nowIso();
  const restoreRunId = restoredAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') + '-' + crypto.randomBytes(4).toString('hex');
  const inventory = buildInventory(manifest, { source: 'bundle-restore', restored_at: restoredAt, bundle_path: norm(bundle), current_commit: current.commit, commit_mismatch: mismatch });
  const inventoryPath = path.join(repoRoot, RESTORE_INVENTORY_PATH);
  core.writeJson(inventoryPath, inventory);
  core.writeJson(path.join(repoRoot, LEGACY_RESTORE_INVENTORY_PATHS[0]), inventory);
  const restoreDir = path.join(repoRoot, OUTPUT_DIR, 'bundle', 'restore', restoreRunId);
  const summary = { schema_version: 1, generated_at: core.nowIso(), run_id: restoreRunId, bundle_path: norm(bundle), inventory_path: norm(inventoryPath), restored_count: count, deleted_count: deletedCount, commit_mismatch: mismatch, bundle_commit: manifest.commit, current_commit: current.commit };
  core.writeJson(path.join(restoreDir, 'restore-summary.json'), summary);
  writeText(path.join(restoreDir, 'restore.log'), [
    `bundle=${norm(bundle)}`,
    `inventory=${norm(inventoryPath)}`,
    `restored=${count}`,
    `deleted=${deletedCount}`,
    `commit_mismatch=${mismatch}`,
    ''
  ].join('\n'));
  return { ...summary, run_id: restoreRunId };
}

function runSourceOnlyDiff(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const raw = rawDiff(repoRoot, options.baseRef || 'HEAD');
  const inventory = readInventory(repoRoot);
  const index = new Map((inventory?.files || []).map((f) => [f.path, f]));
  const deletedIndex = new Map((inventory?.deleted || []).map((f) => [f.path, f]));
  const files = [];
  const suppressed = [];
  for (const file of raw.files) {
    if (isInternal(file.path)) {
      suppressed.push({ path: file.path, status: file.status, reason: 'ad-build-internal' });
      continue;
    }
    const restored = index.get(file.path);
    const restoredDeletion = deletedIndex.get(file.path);
    const currentSha = fileSha(repoRoot, file.path);
    if (restored && currentSha && currentSha === restored.sha256) suppressed.push({ path: file.path, status: file.status, reason: 'matches-restore-inventory' });
    else if (!inventory?.commit_mismatch && restoredDeletion && file.status === 'deleted' && !currentSha) suppressed.push({ path: file.path, status: file.status, reason: 'matches-restore-inventory-deletion' });
    else files.push(file);
  }
  const result = { ...raw, generated_at: core.nowIso(), source_only: true, inventory_found: Boolean(inventory), inventory_path: inventory ? norm(RESTORE_INVENTORY_PATH) : null, files, suppressed_files_count: suppressed.length, suppressed_files: suppressed.slice(0, 200), warnings: inventory ? raw.warnings : [...raw.warnings, { message: 'restore inventory is missing; no compiled-state files were suppressed' }] };
  const out = path.join(repoRoot, OUTPUT_DIR);
  core.writeJson(path.join(out, 'diff-source-only.json'), result);
  writeText(path.join(out, 'diff-source-only.txt'), formatFileList(result.files));
  core.writeJson(path.join(out, 'diff-summary.json'), result);
  writeText(path.join(out, 'diff-files.txt'), formatFileList(result.files));
  writeText(path.join(out, 'diff-source-only.md'), `# ad-build source-only diff\n\nSource files: ${result.files.length}\nSuppressed files: ${result.suppressed_files_count}\n`);
  return result;
}

function runSourceOnlyMap(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const sourceDiff = runSourceOnlyDiff(options);
  const config = readModuleMap(repoRoot, options.moduleMapPath || 'tools/module-map.yaml');
  const changed = collectEvidence(sourceDiff.files || []);
  const mapped = new Set();
  const modules = new Set();
  const matches = [];
  const seen = new Set();
  for (const file of changed) for (const entry of config.modules) for (const pattern of entry.paths) {
    if (!moduleMap.pathMatches(file, pattern)) continue;
    const key = `${entry.name}\0${file}\0${pattern}`;
    if (!seen.has(key)) { seen.add(key); matches.push({ module: entry.name, file, pattern }); }
    mapped.add(file); modules.add(entry.name);
  }
  const result = { schema_version: 1, generated_at: core.nowIso(), source_only: true, changed_files: changed, module_matches: matches, risk_matches: moduleMap.findRiskMatches(changed, config.riskRulesHigh), unmapped_files: changed.filter((f) => !mapped.has(f)), valid_verify_modules: [...modules].sort(), mapping_trusted: !changed.includes('tools/module-map.yaml'), errors: [], warnings: sourceDiff.warnings || [] };
  const out = path.join(repoRoot, OUTPUT_DIR);
  core.writeJson(path.join(out, 'module-map-result.json'), result);
  writeText(path.join(out, 'module-map-result.md'), `# ad-build source-only module map\n\nModules: ${result.valid_verify_modules.join(', ')}\n`);
  return result;
}

function runInventoryStatus(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const inventory = readInventory(repoRoot);
  const result = { schema_version: 1, generated_at: core.nowIso(), inventory_found: Boolean(inventory), inventory_path: inventory ? norm(RESTORE_INVENTORY_PATH) : null, commit: inventory?.commit || null, files_total: inventory?.files?.length || 0, unchanged: 0, changed: 0, missing: 0 };
  for (const f of inventory?.files || []) {
    const current = fileSha(repoRoot, f.path);
    if (!current) result.missing += 1;
    else if (current === f.sha256) result.unchanged += 1;
    else result.changed += 1;
  }
  const out = path.join(repoRoot, OUTPUT_DIR, 'inventory.json');
  core.writeJson(out, result);
  return { status_path: norm(out), ...result };
}

function runBundleCli(args = [], options = {}) {
  const command = args[0] || 'help';
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  try {
    if (command === 'help' || command === '-h' || command === '--help') { stdout.write(bundleHelp()); return 0; }
    if (command === 'pack') { const parsed = parseArgs(args.slice(1)); const r = packBundle({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env }); stdout.write(`wrote ${r.bundle_path}\n`); return 0; }
    if (command === 'inspect') { const parsed = parseArgs(args.slice(1)); const r = inspectBundle({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env }); stdout.write(`wrote ${r.inspect_path}\n`); return 0; }
    if (command === 'restore') { const parsed = parseArgs(args.slice(1)); const r = restoreBundle({ ...parsed, repoRoot: options.repoRoot || parsed.repoRoot, cwd: options.cwd, env: options.env }); stdout.write(`restored ${r.restored_count} files from ${r.bundle_path}\n`); return 0; }
    stderr.write(`unknown bundle command: ${command}\n${bundleHelp()}`); return 2;
  } catch (error) { stderr.write(`ad-build bundle ${command} failed: ${error.message}\n`); return error.exitCode || 2; }
}

function runInventoryCli(args = [], options = {}) {
  const command = args[0] || 'status';
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;
  try {
    if (command === 'status') { const r = runInventoryStatus({ repoRoot: options.repoRoot, cwd: options.cwd, env: options.env }); stdout.write(`wrote ${r.status_path}\n`); return r.inventory_found ? 0 : 3; }
    stderr.write(`unknown inventory command: ${command}\n`); return 2;
  } catch (error) { stderr.write(`ad-build inventory ${command} failed: ${error.message}\n`); return error.exitCode || 2; }
}

function collectEntries(repoRoot, profile, outRel) {
  const map = new Map();
  for (const entry of tracked(repoRoot)) if (!skip(entry.path, outRel)) map.set(entry.path, { ...entry, source: 'git-tracked' });
  for (const file of untracked(repoRoot)) if (!skip(file, outRel) && (profile === 'full' || under(file, DEV_DIRS))) map.set(file, { path: file, status: 'untracked', source: 'git-untracked' });
  for (const dir of profileDirs(profile)) walk(path.join(repoRoot, dir), repoRoot, (file) => { if (!skip(file, outRel)) map.set(file, { ...(map.get(file) || { path: file, status: null }), source: map.has(file) ? map.get(file).source + '+profile-dir' : 'profile-dir' }); });
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}
function tracked(repoRoot, baseRef = 'HEAD') { const r = git(repoRoot, ['diff', '--name-status', '-z', '--find-renames=50%', '--find-copies=50%', baseRef, '--']); if (r.status !== 0) throw new Error(`git diff failed: ${trim(r.stderr) || r.status}`); return parseNameStatus(r.stdout); }
function untracked(repoRoot) { const r = git(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z']); if (r.status !== 0) throw new Error(`git ls-files failed: ${trim(r.stderr) || r.status}`); return nul(r.stdout).map(norm); }
function rawDiff(repoRoot, baseRef) { return { schema_version: 1, base_ref: baseRef, files: tracked(repoRoot, baseRef).map((e) => ({ ...e, is_untracked: false, is_binary: null })).concat(untracked(repoRoot).map((p) => ({ path: p, status: 'untracked', old_path: null, is_untracked: true, is_binary: null }))).sort((a, b) => a.path.localeCompare(b.path)), errors: [], warnings: [] }; }
function parseNameStatus(value) { const fields = nul(value); const out = []; for (let i = 0; i < fields.length;) { const code = fields[i++]; const s = status(code); if (s === 'renamed' || s === 'copied') { const old_path = norm(fields[i++]); const p = norm(fields[i++]); if (p) out.push({ path: p, status: s, old_path }); } else { const p = norm(fields[i++]); if (p) out.push({ path: p, status: s, old_path: null }); } } return out; }
function status(code) { const c = String(code || '')[0]; return c === 'A' ? 'added' : c === 'M' ? 'modified' : c === 'D' ? 'deleted' : c === 'R' ? 'renamed' : c === 'C' ? 'copied' : c === 'T' ? 'type_changed' : 'unknown'; }
function walk(root, repoRoot, visit) { if (!fs.existsSync(root)) return; for (const entry of fs.readdirSync(root, { withFileTypes: true })) { const full = path.join(root, entry.name); const rel = norm(path.relative(repoRoot, full)); if (isInternal(rel) || rel.startsWith('.git/')) continue; if (entry.isDirectory()) walk(full, repoRoot, visit); else if (entry.isFile()) visit(rel); } }
function buildPackSummary({ bundlePath, manifest, files, deleted }) { return { schema_version: 1, generated_at: core.nowIso(), bundle_path: norm(bundlePath), profile: manifest.profile, commit: manifest.commit, branch: manifest.branch, run_id: manifest.run_id, files_count: files.length, deleted_count: deleted.length, total_size: files.reduce((sum, file) => sum + (file.size || 0), 0), status_counts: countBy(files, 'status'), source_counts: countBy(files, 'source') }; }
function buildInventory(manifest, extra = {}) { return { schema_version: 1, mode: 'bundle-restore-inventory', profile: manifest.profile, commit: manifest.commit, branch: manifest.branch, source: extra.source, restored_at: extra.restored_at || null, bundle_path: extra.bundle_path || null, current_commit: extra.current_commit || null, commit_mismatch: Boolean(extra.commit_mismatch), files_count: manifest.files.length, files: manifest.files.map((f) => ({ path: f.path, sha256: f.sha256, size: f.size, mode: f.mode, status: f.status, source: f.source })), deleted: manifest.deleted || [] }; }
function validateManifestPayload({ manifest, staging }) {
  for (const entry of manifest.files || []) {
    safePath(entry.path);
    if (!/^sha256:[a-f0-9]{64}$/.test(entry.sha256 || '')) throw new Error(`missing or invalid sha256 in bundle: ${entry.path}`);
    const source = path.join(staging, 'files', entry.path);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) throw new Error(`missing file in bundle: ${entry.path}`);
    const actual = sha256File(source);
    if (actual !== entry.sha256) throw new Error(`sha256 mismatch in bundle: ${entry.path}`);
  }
  for (const entry of manifest.deleted || []) safePath(entry.path);
}
function readInventory(repoRoot) { const p = path.join(repoRoot, RESTORE_INVENTORY_PATH); return fs.existsSync(p) ? core.readJson(p) : null; }
function readModuleMap(repoRoot, file) { return moduleMap.normalizeModuleMap(moduleMap.parseModuleMapYaml(fs.readFileSync(path.join(repoRoot, file), 'utf8'))); }
function collectEvidence(files) { const seen = new Set(); const out = []; for (const file of files) for (const value of [file.path, file.old_path]) if (value && !seen.has(value)) { seen.add(value); out.push(value); } return out; }
function profileDirs(profile) { return profile === 'dev' ? DEV_DIRS : FULL_DIRS; }
function normalizeProfile(profile) { if (profile === 'dev' || profile === 'full') return profile; throw new Error(`invalid bundle profile: ${profile}`); }
function parseArgs(args) { return { profile: option(args, '--profile') || undefined, out: option(args, '--out') || undefined, bundle: option(args, '--bundle') || undefined, repoRoot: option(args, '--workdir') || undefined, allowCommitMismatch: args.includes('--allow-commit-mismatch') }; }
function option(args, name) { const i = args.indexOf(name); if (i < 0) return null; if (!args[i + 1]) throw new Error(`${name} requires a value`); return args[i + 1]; }
function requiredBundle(options, repoRoot) { const bundle = options.bundle || options.env?.AD_BUILD_BUNDLE; if (!bundle) { const e = new Error('--bundle is required'); e.exitCode = 2; throw e; } const full = path.resolve(repoRoot, bundle); if (!fs.existsSync(full)) { const e = new Error(`bundle does not exist: ${full}`); e.exitCode = 3; throw e; } return full; }
function resolveRepoRoot(options = {}) { if (options.repoRoot) return path.resolve(options.repoRoot); if (options.env?.AD_BUILD_WORK_DIR) return path.resolve(options.env.AD_BUILD_WORK_DIR); const cwd = options.cwd || process.cwd(); const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }); return !r.error && r.status === 0 && trim(r.stdout) ? path.resolve(trim(r.stdout)) : path.resolve(cwd); }
function gitInfo(repoRoot) { const c = git(repoRoot, ['rev-parse', 'HEAD']); const b = git(repoRoot, ['branch', '--show-current']); const r = git(repoRoot, ['symbolic-ref', '-q', 'HEAD']); return { commit: c.status === 0 ? trim(c.stdout) : null, branch: b.status === 0 ? trim(b.stdout) || null : null, ref: r.status === 0 ? trim(r.stdout) || null : null }; }
function runTar(args) { const r = spawnSync('tar', args, { encoding: 'utf8' }); if (r.error || r.status !== 0) throw new Error(`tar failed: ${r.error?.message || trim(r.stderr) || r.status}`); }
function git(repoRoot, args) { return spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' }); }
function sha256File(file) { return 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function fileSha(repoRoot, file) { const full = path.join(repoRoot, file); return fs.existsSync(full) && fs.lstatSync(full).isFile() ? sha256File(full) : null; }
function safePath(file) { const p = norm(file); if (!p || p.startsWith('/') || p.split('/').includes('..') || path.win32.isAbsolute(file)) throw new Error(`unsafe path in bundle: ${file}`); }
function repoRelative(root, file) { const rel = norm(path.relative(root, file)); return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : null; }
function skip(file, outRel) { return isInternal(file) || file === '.git' || file.startsWith('.git/') || (outRel && file === outRel); }
function isInternal(file) { return file === OUTPUT_DIR || file.startsWith(OUTPUT_DIR + '/'); }
function under(file, dirs) { return dirs.some((dir) => file === dir || file.startsWith(dir + '/')); }
function nul(value) { const fields = String(value || '').split('\0'); if (fields[fields.length - 1] === '') fields.pop(); return fields; }
function norm(value) { return String(value || '').replaceAll('\\', '/'); }
function short(commit) { return commit ? commit.slice(0, 12) : 'unknown'; }
function trim(value) { return String(value || '').trim(); }
function safeHostname() { try { return os.hostname(); } catch { return null; } }
function writeText(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); }
function formatFileList(files) { return `${files.map((f) => f.path).join('\n')}${files.length > 0 ? '\n' : ''}`; }
function countBy(items, key) { const result = {}; for (const item of items) { const value = item[key] || 'unknown'; result[value] = (result[value] || 0) + 1; } return result; }
function bundleHelp() { return 'ad-build bundle\nUsage:\n  ad-build bundle pack [--profile full|dev] [--out <bundle.tar>]\n  ad-build bundle inspect --bundle <bundle.tar>\n  ad-build bundle restore --bundle <bundle.tar> [--allow-commit-mismatch]\n'; }

module.exports = { DEFAULT_PROFILE, DEV_DIRS, FULL_DIRS, RESTORE_INVENTORY_PATH, packBundle, inspectBundle, restoreBundle, runBundleCli, runInventoryCli, runInventoryStatus, runSourceOnlyDiff, runSourceOnlyMap };
