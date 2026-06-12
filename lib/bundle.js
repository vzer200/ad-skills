const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const core = require('./core');
const moduleMap = require('./module-map');

const OUTPUT_DIR = '.ad-build';
const RESTORE_INVENTORY_PATH = path.join(OUTPUT_DIR, 'bundle', 'restore-inventory.json');
const DEV_DIRS = ['apps', 'libs', 'linux', 'access_layer', 'include', 'sinfor', 'app_bin', 'obj'];
const FULL_DIRS = [...DEV_DIRS, 'shell', 'ui', 'cfg', 'mkpacket', 'ssipacket', 'ad_packet'];

function packBundle(options = {}) {
  const repoRoot = repo(options);
  const profile = options.profile || 'full';
  if (!['full', 'dev'].includes(profile)) throw new Error(`invalid profile: ${profile}`);
  const git = gitInfo(repoRoot);
  const outPath = path.resolve(repoRoot, options.out || path.join(OUTPUT_DIR, 'bundles', `compiled-${profile}-${Date.now()}.tar`));
  const outRel = rel(repoRoot, outPath);
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-pack-'));
  const filesRoot = path.join(stage, 'files');
  fs.mkdirSync(filesRoot, { recursive: true });
  const files = [];
  for (const item of collect(repoRoot, profile, outRel)) {
    const src = path.join(repoRoot, item.path);
    if (!fs.existsSync(src)) continue;
    const stat = fs.lstatSync(src);
    if (!stat.isFile()) continue;
    const dst = path.join(filesRoot, item.path);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    files.push({ path: item.path, status: item.status || null, source: item.source, sha256: sha(src), size: stat.size, mode: (stat.mode & 0o777).toString(8).padStart(4, '0') });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const manifest = { schema_version: 1, kind: 'compiled-state-bundle', created_at: core.nowIso(), profile, commit: git.commit, branch: git.branch, ref: git.ref, repo_root_hint: repoRoot, generated_dirs: profile === 'dev' ? DEV_DIRS : FULL_DIRS, files_count: files.length, files };
  const inventory = inventoryFrom(manifest, { source: 'bundle-pack' });
  core.writeJson(path.join(stage, 'manifest.json'), manifest);
  core.writeJson(path.join(stage, 'inventory.json'), inventory);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  tar(['-cf', outPath, '-C', stage, 'manifest.json', 'inventory.json', 'files']);
  const latest = path.join(repoRoot, OUTPUT_DIR, 'bundle', 'latest');
  fs.mkdirSync(latest, { recursive: true });
  core.writeJson(path.join(latest, 'manifest.json'), manifest);
  core.writeJson(path.join(latest, 'inventory.json'), inventory);
  core.writeJson(outPath.replace(/\.tar$/, '') + '.manifest.json', manifest);
  core.writeJson(outPath.replace(/\.tar$/, '') + '.inventory.json', inventory);
  return { bundle_path: norm(outPath), manifest_path: norm(path.join(latest, 'manifest.json')), inventory_path: norm(path.join(latest, 'inventory.json')), profile, files_count: files.length };
}

function restoreBundle(options = {}) {
  const repoRoot = repo(options);
  const bundle = path.resolve(repoRoot, options.bundle || required('--bundle'));
  if (!fs.existsSync(bundle)) { const e = new Error(`bundle does not exist: ${bundle}`); e.exitCode = 3; throw e; }
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-restore-'));
  tar(['-xf', bundle, '-C', stage]);
  const manifest = core.readJson(path.join(stage, 'manifest.json'));
  const current = gitInfo(repoRoot);
  const mismatch = manifest.commit && current.commit && manifest.commit !== current.commit;
  if (mismatch && !options.allowCommitMismatch) { const e = new Error(`bundle commit ${manifest.commit} does not match current commit ${current.commit}`); e.exitCode = 4; throw e; }
  let restored = 0;
  for (const f of manifest.files || []) {
    safe(f.path);
    const src = path.join(stage, 'files', f.path);
    const dst = path.join(repoRoot, f.path);
    if (!fs.existsSync(src) || !fs.lstatSync(src).isFile()) continue;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    restored++;
  }
  const inventory = inventoryFrom(manifest, { source: 'bundle-restore', bundle_path: norm(bundle), restored_at: core.nowIso(), current_commit: current.commit, commit_mismatch: Boolean(mismatch) });
  const invPath = path.join(repoRoot, RESTORE_INVENTORY_PATH);
  core.writeJson(invPath, inventory);
  return { bundle_path: norm(bundle), inventory_path: norm(invPath), restored_count: restored, commit_mismatch: Boolean(mismatch) };
}

function inspectBundle(options = {}) {
  const repoRoot = repo(options);
  const bundle = path.resolve(repoRoot, options.bundle || required('--bundle'));
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-inspect-'));
  tar(['-xf', bundle, '-C', stage, 'manifest.json']);
  const manifest = core.readJson(path.join(stage, 'manifest.json'));
  const result = { schema_version: 1, generated_at: core.nowIso(), bundle_path: norm(bundle), profile: manifest.profile, commit: manifest.commit, branch: manifest.branch, files_count: manifest.files_count, sample_files: (manifest.files || []).slice(0, 50).map((f) => f.path) };
  core.writeJson(path.join(repoRoot, OUTPUT_DIR, 'bundle', 'inspect.json'), result);
  return { inspect_path: norm(path.join(repoRoot, OUTPUT_DIR, 'bundle', 'inspect.json')), ...result };
}

function runSourceOnlyDiff(options = {}) {
  const repoRoot = repo(options);
  const raw = rawDiff(repoRoot);
  const invPath = path.join(repoRoot, RESTORE_INVENTORY_PATH);
  const inv = fs.existsSync(invPath) ? core.readJson(invPath) : null;
  const index = new Map((inv?.files || []).map((f) => [f.path, f.sha256]));
  const files = [], suppressed = [];
  for (const f of raw.files) {
    if (internal(f.path)) { suppressed.push({ path: f.path, reason: 'ad-build-internal' }); continue; }
    const current = fileSha(repoRoot, f.path);
    if (index.get(f.path) && current === index.get(f.path)) suppressed.push({ path: f.path, reason: 'matches-restore-inventory' });
    else files.push(f);
  }
  const result = { ...raw, generated_at: core.nowIso(), source_only: true, inventory_found: Boolean(inv), inventory_path: inv ? RESTORE_INVENTORY_PATH : null, files, suppressed_files_count: suppressed.length, suppressed_files: suppressed.slice(0, 200), warnings: inv ? [] : [{ message: 'restore inventory is missing' }] };
  const out = path.join(repoRoot, OUTPUT_DIR);
  core.writeJson(path.join(out, 'diff-summary.json'), result);
  text(path.join(out, 'diff-files.txt'), result.files.map((f) => f.path).join('\n') + '\n');
  return result;
}

function runSourceOnlyMap(options = {}) {
  const repoRoot = repo(options);
  const diffPath = path.join(repoRoot, OUTPUT_DIR, 'diff-summary.json');
  const diff = fs.existsSync(diffPath) ? core.readJson(diffPath) : runSourceOnlyDiff(options);
  const sourceDiff = diff.source_only ? diff : runSourceOnlyDiff(options);
  const config = moduleMap.normalizeModuleMap(moduleMap.parseModuleMapYaml(fs.readFileSync(path.join(repoRoot, options.moduleMapPath || 'tools/module-map.yaml'), 'utf8')));
  const changed = evidence(sourceDiff.files || []), mapped = new Set(), modules = new Set(), matches = [];
  for (const file of changed) for (const m of config.modules) for (const p of m.paths) if (moduleMap.pathMatches(file, p)) { matches.push({ module: m.name, file, pattern: p }); mapped.add(file); modules.add(m.name); }
  const result = { schema_version: 1, generated_at: core.nowIso(), source_only: true, changed_files: changed, module_matches: matches, risk_matches: moduleMap.findRiskMatches(changed, config.riskRulesHigh), unmapped_files: changed.filter((f) => !mapped.has(f)), valid_verify_modules: [...modules].sort(), mapping_trusted: !changed.includes('tools/module-map.yaml'), errors: [], warnings: sourceDiff.warnings || [] };
  core.writeJson(path.join(repoRoot, OUTPUT_DIR, 'module-map-result.json'), result);
  return result;
}

function runInventoryStatus(options = {}) { const repoRoot = repo(options), p = path.join(repoRoot, RESTORE_INVENTORY_PATH), inv = fs.existsSync(p) ? core.readJson(p) : null; const r = { schema_version: 1, generated_at: core.nowIso(), inventory_found: Boolean(inv), inventory_path: inv ? RESTORE_INVENTORY_PATH : null, files_total: inv?.files?.length || 0, unchanged: 0, changed: 0, missing: 0 }; for (const f of inv?.files || []) { const s = fileSha(repoRoot, f.path); if (!s) r.missing++; else if (s === f.sha256) r.unchanged++; else r.changed++; } core.writeJson(path.join(repoRoot, OUTPUT_DIR, 'inventory.json'), r); return { status_path: norm(path.join(repoRoot, OUTPUT_DIR, 'inventory.json')), ...r }; }
function runBundleCli(args = [], options = {}) { const c = args[0] || 'help', out = options.stdout || process.stdout, err = options.stderr || process.stderr; try { if (c === 'help') { out.write('ad-build bundle pack|inspect|restore\n'); return 0; } if (c === 'pack') { const r = packBundle({ ...parse(args.slice(1)), repoRoot: options.repoRoot, env: options.env }); out.write(`wrote ${r.bundle_path}\n`); return 0; } if (c === 'inspect') { const r = inspectBundle({ ...parse(args.slice(1)), repoRoot: options.repoRoot }); out.write(`wrote ${r.inspect_path}\n`); return 0; } if (c === 'restore') { const r = restoreBundle({ ...parse(args.slice(1)), repoRoot: options.repoRoot }); out.write(`restored ${r.restored_count} files from ${r.bundle_path}\n`); return r.commit_mismatch ? 3 : 0; } err.write(`unknown bundle command: ${c}\n`); return 2; } catch (e) { err.write(`ad-build bundle ${c} failed: ${e.message}\n`); return e.exitCode || 2; } }
function runInventoryCli(args = [], options = {}) { const r = runInventoryStatus({ repoRoot: options.repoRoot }); (options.stdout || process.stdout).write(`wrote ${r.status_path}\n`); return r.inventory_found ? 0 : 3; }

function collect(root, profile, outRel) { const m = new Map(); for (const e of tracked(root)) if (!skip(e.path, outRel)) m.set(e.path, { ...e, source: 'git-tracked' }); for (const u of untracked(root)) if (!skip(u, outRel) && (profile === 'full' || under(u, DEV_DIRS))) m.set(u, { path: u, status: 'untracked', source: 'git-untracked' }); for (const d of profile === 'full' ? FULL_DIRS : DEV_DIRS) walk(path.join(root, d), root, (p) => { if (!skip(p, outRel)) m.set(p, { ...(m.get(p) || { path: p, status: null }), source: m.has(p) ? m.get(p).source + '+profile-dir' : 'profile-dir' }); }); return [...m.values()].sort((a, b) => a.path.localeCompare(b.path)); }
function rawDiff(root) { return { schema_version: 1, files: tracked(root).concat(untracked(root).map((p) => ({ path: p, status: 'untracked', old_path: null }))).sort((a, b) => a.path.localeCompare(b.path)), errors: [], warnings: [] }; }
function tracked(root) { const r = git(root, ['diff', '--name-status', '-z', 'HEAD', '--']); if (r.status) throw new Error(`git diff failed: ${trim(r.stderr)}`); return parseStatus(r.stdout); }
function untracked(root) { const r = git(root, ['ls-files', '--others', '--exclude-standard', '-z']); if (r.status) throw new Error(`git ls-files failed: ${trim(r.stderr)}`); return nul(r.stdout).map(norm); }
function parseStatus(value) { const fields = nul(value), out = []; for (let i = 0; i < fields.length;) { const code = fields[i++], s = code[0] === 'M' ? 'modified' : code[0] === 'D' ? 'deleted' : code[0] === 'A' ? 'added' : 'unknown'; const p = norm(fields[i++]); if (p) out.push({ path: p, status: s, old_path: null }); } return out; }
function inventoryFrom(m, extra) { return { schema_version: 1, profile: m.profile, commit: m.commit, branch: m.branch, source: extra.source, restored_at: extra.restored_at || null, bundle_path: extra.bundle_path || null, files_count: m.files.length, files: m.files.map((f) => ({ path: f.path, sha256: f.sha256, size: f.size, status: f.status, source: f.source })) }; }
function evidence(files) { const s = new Set(), a = []; for (const f of files) for (const v of [f.path, f.old_path]) if (v && !s.has(v)) { s.add(v); a.push(v); } return a; }
function repo(o = {}) { if (o.repoRoot) return path.resolve(o.repoRoot); if (o.env?.AD_BUILD_WORK_DIR) return path.resolve(o.env.AD_BUILD_WORK_DIR); const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: o.cwd || process.cwd(), encoding: 'utf8' }); return r.status === 0 && trim(r.stdout) ? path.resolve(trim(r.stdout)) : path.resolve(o.cwd || process.cwd()); }
function gitInfo(root) { const c = git(root, ['rev-parse', 'HEAD']), b = git(root, ['branch', '--show-current']), r = git(root, ['symbolic-ref', '-q', 'HEAD']); return { commit: c.status === 0 ? trim(c.stdout) : null, branch: b.status === 0 ? trim(b.stdout) || null : null, ref: r.status === 0 ? trim(r.stdout) || null : null }; }
function parse(args) { return { profile: opt(args, '--profile') || undefined, out: opt(args, '--out') || undefined, bundle: opt(args, '--bundle') || undefined, repoRoot: opt(args, '--workdir') || undefined, allowCommitMismatch: args.includes('--allow-commit-mismatch') }; }
function opt(a, n) { const i = a.indexOf(n); if (i < 0) return null; if (!a[i + 1]) throw new Error(`${n} requires a value`); return a[i + 1]; }
function required(n) { throw new Error(`${n} is required`); }
function safe(p) { if (!p || p.startsWith('/') || p.includes('..')) throw new Error(`unsafe bundle path: ${p}`); }
function walk(dir, root, cb) { if (!fs.existsSync(dir)) return; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name), rp = norm(path.relative(root, p)); if (internal(rp)) continue; if (e.isDirectory()) walk(p, root, cb); else if (e.isFile()) cb(rp); } }
function under(p, dirs) { return dirs.some((d) => p === d || p.startsWith(`${d}/`)); }
function skip(p, out) { return internal(p) || p.startsWith('.git/') || p === '.git' || (out && p === out); }
function internal(p) { return p === OUTPUT_DIR || p.startsWith(`${OUTPUT_DIR}/`); }
function rel(root, p) { const r = norm(path.relative(root, p)); return r && !r.startsWith('..') ? r : null; }
function fileSha(root, p) { const f = path.join(root, p); return fs.existsSync(f) && fs.lstatSync(f).isFile() ? sha(f) : null; }
function sha(f) { return 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }
function tar(args) { const r = spawnSync('tar', args, { encoding: 'utf8' }); if (r.status) throw new Error(`tar failed: ${trim(r.stderr) || r.status}`); }
function git(root, args) { return spawnSync('git', args, { cwd: root, encoding: 'utf8' }); }
function nul(v) { const a = String(v || '').split('\0'); if (a[a.length - 1] === '') a.pop(); return a; }
function norm(v) { return String(v || '').replaceAll('\\', '/'); }
function trim(v) { return String(v || '').trim(); }
function text(f, v) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, v); }

module.exports = { packBundle, inspectBundle, restoreBundle, runBundleCli, runInventoryCli, runInventoryStatus, runSourceOnlyDiff, runSourceOnlyMap, RESTORE_INVENTORY_PATH, DEV_DIRS, FULL_DIRS };
