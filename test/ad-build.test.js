const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const commands = require('../lib/commands');
const core = require('../lib/core');
const moduleMap = require('../lib/module-map');
const pkg = require('../package.json');

test('canonical JSON digest is order stable', () => {
  assert.equal(core.digestJson({ b: 2, a: 1 }), core.digestJson({ a: 1, b: 2 }));
  assert.match(core.digestJson({ a: 1 }), /^sha256:[a-f0-9]{64}$/);
});

test('package has safe npm delivery shape', () => {
  assert.equal(pkg.bin['ad-build'], 'bin/ad-build.js');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.optionalDependencies, undefined);
  assert.equal(pkg.bundledDependencies, undefined);
  assert.ok(!pkg.scripts?.preinstall);
  assert.ok(!pkg.scripts?.install);
  assert.equal(pkg.scripts?.postinstall, 'node bin/ad-build.js skill install --force');
  assert.ok(pkg.files.includes('bin'));
  assert.ok(pkg.files.includes('lib'));
  assert.ok(pkg.files.includes('templates'));
  assert.ok(pkg.files.includes('skills'));
});

test('compute ref key handles detached head', () => {
  const out = core.computeRefKey('', '0'.repeat(40));
  assert.equal(out.ref, `DETACHED:${'0'.repeat(40)}`);
  assert.match(out.refKey, /^sha256:[a-f0-9]{64}$/);
});

test('compute ref key hashes the ref string directly', () => {
  const ref = 'refs/heads/main';
  const out = core.computeRefKey(ref, '1'.repeat(40));

  assert.equal(out.ref, ref);
  assert.equal(out.refKey, core.digestJson(ref));
  assert.notEqual(out.refKey, core.digestJson({ ref }));
});

test('compute ref key requires a symbolic ref or commit', () => {
  assert.throws(
    () => core.computeRefKey('', ''),
    /symbolicRef or commit/
  );
});

test('safe digest key accepts only sha256 hex digests', () => {
  const hex = 'a'.repeat(64);

  assert.equal(core.safeDigestKey(`sha256:${hex}`), hex);
  assert.equal(core.safeDigestKey(hex), hex);
  assert.throws(() => core.safeDigestKey(`sha256:${'g'.repeat(64)}`), /invalid digest/i);
  assert.throws(() => core.safeDigestKey(`sha512:${hex}`), /invalid digest/i);
  assert.throws(() => core.safeDigestKey(hex.toUpperCase()), /invalid digest/i);
  assert.throws(() => core.safeDigestKey('a'.repeat(63)), /invalid digest/i);
});

test('baseline path partitions by repo commit and env', () => {
  const p = commands.baselinePath('/shared', `sha256:${'a'.repeat(64)}`, '0'.repeat(40), `sha256:${'b'.repeat(64)}`);

  assert.match(p.replaceAll('\\', '/'), /\/repos\/a{64}\/commits\/0{40}\/env\/b{64}\/baseline\.json$/);
});

test('baseline save rejects when publish mode is disabled', () => {
  const result = commands.validateBaselineSave({ exit_code: 0 }, { publishEnabled: false });

  assert.equal(result.ok, false);
});

test('precheck reports unconfigured baseline dir as fact status', () => {
  const result = commands.buildPrecheckResult({
    repoRoot: process.cwd(),
    baselineDir: null,
    metadata: {
      commit: '0'.repeat(40),
      repo_key: `sha256:${'a'.repeat(64)}`,
      env_key: `sha256:${'b'.repeat(64)}`
    }
  });

  assert.equal(result.schema_version, 1);
  assert.equal(result.baseline_status, 'dir_unconfigured');
  assert.equal(result.baseline_dir_configured, false);
  assert.equal(result.recommendation, undefined);
});

test('full-build writes latest result and compile log', () => {
  const repo = makeTempRepoWithModuleMap();
  const result = commands.runFullBuild({
    repoRoot: repo,
    command: [process.execPath, '-e', "console.log('ok')"],
    env: {}
  });
  const latestDir = path.join(repo, '.ad-build', 'full-build', 'latest');
  const stored = core.readJson(path.join(latestDir, 'full-build-result.json'));

  assert.equal(result.exit_code, 0);
  assert.equal(stored.status, 'passed');
  assert.deepEqual(stored.command, [process.execPath, '-e', "console.log('ok')"]);
  assert.match(fs.readFileSync(path.join(latestDir, 'compile.log'), 'utf8'), /ok/);
});

test('source digest metadata includes templates', () => {
  const repo = makeTempRepoWithModuleMap();
  const result = commands.runFullBuild({
    repoRoot: repo,
    command: [process.execPath, '-e', "console.log('ok')"],
    env: {}
  });

  assert.ok(result.ad_build_source_files.includes('templates/module-map.yaml'));
  assert.match(result.ad_build_source_digest, /^sha256:[a-f0-9]{64}$/);
});

test('full-build result includes run id and runtime metadata', () => {
  const repo = makeTempRepoWithModuleMap();
  initGitRepo(repo);
  commitAll(repo, 'initial commit');
  const result = commands.runFullBuild({
    repoRoot: repo,
    command: [process.execPath, '-e', "console.log('ok')"],
    env: {}
  });

  assert.match(result.run_id, /^[0-9]{8}T[0-9]{6}Z-[a-f0-9]{12}$/);
  assert.equal(result.node_version, process.version);
  assert.equal(result.os.platform, process.platform);
  assert.equal(result.os.arch, process.arch);
  assert.equal(result.cwd, repo);
  assert.equal(result.package_json_path.endsWith('package.json'), true);
  assert.equal(result.package_root, process.cwd());
  assert.equal(typeof result.worktree_clean, 'boolean');
});

test('baseline-save command exits 4 without publish mode', () => {
  const repo = makeTempRepoWithModuleMap();
  commands.runFullBuild({
    repoRoot: repo,
    command: [process.execPath, '-e', "console.log('ok')"],
    env: {}
  });
  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'baseline-save', '--from-run', 'latest'], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      COMSPEC: process.env.COMSPEC
    }
  });

  assert.equal(result.status, 4);
  assert.match(result.stderr, /publish mode/i);
});

test('baseline-save rejects missing or unavailable baseline directory as safety failure', () => {
  const missingDir = path.join(os.tmpdir(), `ad-build-baseline-missing-${Date.now()}`);
  const withoutDir = setupPassedFullBuildForBaselineSave({ baselineDir: null });
  const missing = commands.runBaselineSave({
    repoRoot: withoutDir.repo,
    env: withoutDir.env
  });

  assert.equal(missing.ok, false);
  assert.equal(missing.exitCode, 4);
  assert.match(missing.message, /baseline.*dir|AD_BUILD_BASELINE_DIR/i);

  const unavailable = setupPassedFullBuildForBaselineSave({ baselineDir: missingDir });
  const result = commands.runBaselineSave({
    repoRoot: unavailable.repo,
    env: unavailable.env
  });

  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 4);
  assert.match(result.message, /baseline.*directory/i);
  assert.equal(fs.existsSync(missingDir), false);
});

test('baseline-save rejects existing baseline unless replace is explicit', async () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  const first = commands.runBaselineSave({ repoRoot: repo, env });
  const second = commands.runBaselineSave({ repoRoot: repo, env });

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.exitCode, 4);
  assert.match(second.message, /already exists|replace/i);

  const writes = [];
  const exitCode = await commands.runCli(['baseline-save', '--from-run', 'latest', '--replace'], {
    cwd: repo,
    env,
    stdout: { write: (value) => writes.push(value) },
    stderr: { write: (value) => writes.push(value) }
  });

  assert.equal(exitCode, 0, writes.join(''));
});

test('baseline-save converts unsafe or missing identifiers into safety failures', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const invalidRepoKey = setupPassedFullBuildForBaselineSave({ baselineDir });
  updateLatestFullBuildResult(invalidRepoKey.repo, (result) => {
    result.repo_key = 'not-a-safe-digest';
  });

  const invalidResult = commands.runBaselineSave({
    repoRoot: invalidRepoKey.repo,
    env: invalidRepoKey.env
  });

  assert.equal(invalidResult.ok, false);
  assert.equal(invalidResult.exitCode, 4);
  assert.match(invalidResult.message, /repo_key|identifier/i);

  const missingRef = setupPassedFullBuildForBaselineSave({ baselineDir });
  updateLatestFullBuildResult(missingRef.repo, (result) => {
    result.ref_key = null;
  });

  const missingResult = commands.runBaselineSave({
    repoRoot: missingRef.repo,
    env: missingRef.env
  });

  assert.equal(missingResult.ok, false);
  assert.equal(missingResult.exitCode, 4);
  assert.match(missingResult.message, /ref_key|identifier/i);
});

test('baseline-save allow-dirty CLI option saves dirty baselines explicitly', async () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  const fullBuildResult = core.readJson(path.join(repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));
  fs.writeFileSync(path.join(repo, 'dirty.txt'), 'dirty\n');
  const writes = [];

  const exitCode = await commands.runCli(['baseline-save', '--from-run', 'latest', '--allow-dirty'], {
    cwd: repo,
    env,
    stdout: { write: (value) => writes.push(value) },
    stderr: { write: (value) => writes.push(value) }
  });

  assert.equal(exitCode, 0, writes.join(''));
  const baseline = core.readJson(commands.baselinePath(
    baselineDir,
    fullBuildResult.repo_key,
    fullBuildResult.commit,
    fullBuildResult.env_key
  ));
  assert.equal(baseline.dirty_worktree, true);
});

test('baseline-save rejects tampered safe metadata identifiers', () => {
  const repoKeyTamper = setupPassedFullBuildForBaselineSave({
    baselineDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'))
  });
  updateLatestFullBuildResult(repoKeyTamper.repo, (result) => {
    result.repo_key = `sha256:${'f'.repeat(64)}`;
  });

  const repoKeyResult = commands.runBaselineSave({
    repoRoot: repoKeyTamper.repo,
    env: repoKeyTamper.env
  });

  assert.equal(repoKeyResult.ok, false);
  assert.equal(repoKeyResult.exitCode, 4);
  assert.match(repoKeyResult.message, /repo_key|metadata/i);

  const sourceTamper = setupPassedFullBuildForBaselineSave({
    baselineDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'))
  });
  updateLatestFullBuildResult(sourceTamper.repo, (result) => {
    result.ad_build_source_digest = `sha256:${'e'.repeat(64)}`;
  });

  const sourceResult = commands.runBaselineSave({
    repoRoot: sourceTamper.repo,
    env: sourceTamper.env
  });

  assert.equal(sourceResult.ok, false);
  assert.equal(sourceResult.exitCode, 4);
  assert.match(sourceResult.message, /ad_build_source_digest|metadata/i);
});

test('baseline-save writes full build artifacts and manifest checksum', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  const save = commands.runBaselineSave({ repoRoot: repo, env });
  const baseline = core.readJson(save.baseline_path);
  const baselineRoot = path.dirname(save.baseline_path);
  const manifestPath = path.join(baselineRoot, baseline.artifacts.manifest_path);

  assert.equal(save.ok, true);
  assert.equal(baseline.full_build.run_id, baseline.run_id);
  assert.equal(baseline.full_build.result_path, 'full-build-result.json');
  assert.equal(baseline.artifacts.compile_log_path, 'compile.log');
  assert.equal(baseline.artifacts.full_build_result_path, 'full-build-result.json');
  assert.equal(baseline.artifacts.manifest_path, 'artifact-manifest.txt');
  assert.equal(fs.existsSync(path.join(baselineRoot, 'compile.log')), true);
  assert.equal(fs.existsSync(path.join(baselineRoot, 'full-build-result.json')), true);
  assert.equal(baseline.manifest_sha256, `sha256:${sha256File(manifestPath)}`);
});

test('baseline-save rejects target lock conflict without publishing partial baseline', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  const fullBuild = core.readJson(path.join(repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));
  const target = commands.baselinePath(baselineDir, fullBuild.repo_key, fullBuild.commit, fullBuild.env_key);
  fs.mkdirSync(`${path.dirname(target)}.lock`, { recursive: true });

  const result = commands.runBaselineSave({ repoRoot: repo, env });

  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 4);
  assert.match(result.message, /lock/i);
  assert.equal(fs.existsSync(target), false);
});

test('baseline-save rejects latest-success lock conflict after publishing baseline', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  const fullBuild = core.readJson(path.join(repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));
  const target = commands.baselinePath(baselineDir, fullBuild.repo_key, fullBuild.commit, fullBuild.env_key);
  const latestDir = path.join(
    baselineDir,
    'repos',
    core.safeDigestKey(fullBuild.repo_key),
    'refs',
    core.safeDigestKey(fullBuild.ref_key),
    'env',
    core.safeDigestKey(fullBuild.env_key)
  );
  fs.mkdirSync(`${latestDir}.latest.lock`, { recursive: true });

  const result = commands.runBaselineSave({ repoRoot: repo, env });

  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 4);
  assert.match(result.message, /latest.*lock/i);
  assert.equal(fs.existsSync(target), true);
});

test('baseline-save does not overwrite newer latest-success metadata', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  const first = commands.runBaselineSave({ repoRoot: repo, env });
  const latestBefore = core.readJson(first.latest_success_path);
  latestBefore.created_at = '9999-01-01T00:00:00.000Z';
  latestBefore.updated_at = '9999-01-01T00:00:00.000Z';
  latestBefore.run_id = 'newer-run';
  core.writeJson(first.latest_success_path, latestBefore);

  const second = commands.runBaselineSave({ repoRoot: repo, env, replace: true });
  const latestAfter = core.readJson(first.latest_success_path);

  assert.equal(second.ok, true);
  assert.equal(second.latest_success_path, first.latest_success_path);
  assert.equal(second.latest_success_updated, false);
  assert.equal(latestAfter.run_id, 'newer-run');
  assert.equal(latestAfter.created_at, '9999-01-01T00:00:00.000Z');
});

test('baseline-save rejects deleted required full-build metadata', () => {
  for (const field of ['ad_build_version', 'ad_build_source_digest', 'toolchain_digest']) {
    const setup = setupPassedFullBuildForBaselineSave({
      baselineDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'))
    });
    updateLatestFullBuildResult(setup.repo, (result) => {
      delete result[field];
    });

    const result = commands.runBaselineSave({
      repoRoot: setup.repo,
      env: setup.env
    });

    assert.equal(result.ok, false, `${field} should be required`);
    assert.equal(result.exitCode, 4);
    assert.match(result.message, new RegExp(field));
  }
});

test('precheck rejects sparse baseline metadata as invalid', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const metadata = makePrecheckMetadata();
  core.writeJson(commands.baselinePath(baselineDir, metadata.repo_key, metadata.commit, metadata.env_key), {
    schema_version: 1,
    producer: 'ad-build',
    dirty_worktree: false,
    commit: metadata.commit,
    repo_key: metadata.repo_key,
    env_key: metadata.env_key,
    ad_build_version: metadata.ad_build_version,
    ad_build_source_digest: metadata.ad_build_source_digest
  });

  const result = commands.buildPrecheckResult({
    repoRoot: process.cwd(),
    baselineDir,
    metadata
  });

  assert.equal(result.baseline_status, 'invalid_metadata');
  assert.ok(result.errors.some((error) => /publisher|ref|repo_id|docker_identity|build_config_digest|toolchain_digest|submodule_digest/i.test(error.message)));
  assert.equal(result.recommendation, undefined);

  const mismatchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  writeBaselineFixture(mismatchDir, {
    ...metadata,
    docker_identity: 'other-image@sha256:1234'
  });

  const mismatch = commands.buildPrecheckResult({
    repoRoot: process.cwd(),
    baselineDir: mismatchDir,
    env: { AD_BUILD_TRUSTED_PUBLISHERS: 'ci-bot' },
    metadata
  });

  assert.notEqual(mismatch.baseline_status, 'matched');
  assert.equal(mismatch.baseline_status, 'env_mismatch');
});

test('precheck enforces trusted publishers', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  commands.runBaselineSave({ repoRoot: repo, env });
  const metadata = core.readJson(path.join(repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));

  const unconfigured = commands.buildPrecheckResult({
    repoRoot: repo,
    baselineDir,
    env: {},
    metadata
  });
  assert.equal(unconfigured.baseline_status, 'invalid_metadata');
  assert.ok(unconfigured.errors.some((error) => /trusted publisher/i.test(error.message)));

  const untrusted = commands.buildPrecheckResult({
    repoRoot: repo,
    baselineDir,
    env: { AD_BUILD_TRUSTED_PUBLISHERS: 'other-bot' },
    metadata
  });
  assert.equal(untrusted.baseline_status, 'invalid_metadata');
  assert.ok(untrusted.errors.some((error) => /publisher/i.test(error.message)));

  const trusted = commands.buildPrecheckResult({
    repoRoot: repo,
    baselineDir,
    env: { AD_BUILD_TRUSTED_PUBLISHERS: 'ci-bot' },
    metadata
  });
  assert.equal(trusted.baseline_status, 'matched');
});

test('precheck rejects tampered or missing artifact manifest', () => {
  const tamperedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const tampered = setupPassedFullBuildForBaselineSave({ baselineDir: tamperedDir });
  const tamperedSave = commands.runBaselineSave({ repoRoot: tampered.repo, env: tampered.env });
  fs.appendFileSync(path.join(path.dirname(tamperedSave.baseline_path), 'artifact-manifest.txt'), 'tamper\n');
  const tamperedMetadata = core.readJson(path.join(tampered.repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));

  const tamperedResult = commands.buildPrecheckResult({
    repoRoot: tampered.repo,
    baselineDir: tamperedDir,
    env: { AD_BUILD_TRUSTED_PUBLISHERS: 'ci-bot' },
    metadata: tamperedMetadata
  });
  assert.equal(tamperedResult.baseline_status, 'invalid_metadata');
  assert.ok(tamperedResult.errors.some((error) => /manifest/i.test(error.message)));

  const missingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const missing = setupPassedFullBuildForBaselineSave({ baselineDir: missingDir });
  const missingSave = commands.runBaselineSave({ repoRoot: missing.repo, env: missing.env });
  fs.unlinkSync(path.join(path.dirname(missingSave.baseline_path), 'artifact-manifest.txt'));
  const missingMetadata = core.readJson(path.join(missing.repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));

  const missingResult = commands.buildPrecheckResult({
    repoRoot: missing.repo,
    baselineDir: missingDir,
    env: { AD_BUILD_TRUSTED_PUBLISHERS: 'ci-bot' },
    metadata: missingMetadata
  });
  assert.equal(missingResult.baseline_status, 'invalid_metadata');
  assert.ok(missingResult.errors.some((error) => /manifest/i.test(error.message)));
});

test('precheck rejects tampered artifacts listed by manifest', () => {
  for (const artifact of ['compile.log', 'full-build-result.json']) {
    const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
    const setup = setupPassedFullBuildForBaselineSave({ baselineDir });
    const save = commands.runBaselineSave({ repoRoot: setup.repo, env: setup.env });
    const metadata = core.readJson(path.join(setup.repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));
    fs.appendFileSync(path.join(path.dirname(save.baseline_path), artifact), '\ntampered\n');

    const result = commands.buildPrecheckResult({
      repoRoot: setup.repo,
      baselineDir,
      env: { AD_BUILD_TRUSTED_PUBLISHERS: 'ci-bot' },
      metadata
    });

    assert.equal(result.baseline_status, 'invalid_metadata', `${artifact} tampering should be rejected`);
    assert.ok(result.errors.some((error) => /artifact|checksum|manifest/i.test(error.message)));
  }
});

test('precheck rejects baselines without matching safe ref metadata', () => {
  const metadata = makePrecheckMetadata();

  for (const patch of [
    { ref: undefined },
    { ref_key: undefined },
    { ref_key: 'not-a-safe-digest' },
    { ref_key: `sha256:${'d'.repeat(64)}` }
  ]) {
    const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
    const baseline = {
      schema_version: 1,
      producer: 'ad-build',
      dirty_worktree: false,
      ...metadata,
      ...patch
    };
    core.writeJson(commands.baselinePath(baselineDir, metadata.repo_key, metadata.commit, metadata.env_key), baseline);

    const result = commands.buildPrecheckResult({
      repoRoot: process.cwd(),
      baselineDir,
      metadata
    });

    assert.equal(result.baseline_status, 'invalid_metadata');
    assert.equal(result.recommendation, undefined);
  }
});

test('precheck ignores nearest baseline when latest-success env mismatches', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const metadata = makePrecheckMetadata();
  const referencedBaseline = path.join(baselineDir, 'existing-baseline.json');
  const latest = path.join(
    baselineDir,
    'repos',
    'a'.repeat(64),
    'refs',
    'c'.repeat(64),
    'env',
    'b'.repeat(64),
    'latest-success.json'
  );
  core.writeJson(referencedBaseline, { schema_version: 1 });
  core.writeJson(latest, {
    schema_version: 1,
    run_id: 'latest-run',
    ref: metadata.ref,
    ref_key: metadata.ref_key,
    commit: '1'.repeat(40),
    repo_key: metadata.repo_key,
    env_key: `sha256:${'d'.repeat(64)}`,
    ad_build_source_digest: metadata.ad_build_source_digest,
    baseline_path: referencedBaseline,
    manifest_sha256: `sha256:${'9'.repeat(64)}`,
    created_at: '2026-06-11T00:00:00.000Z',
    updated_at: '2026-06-11T00:00:00.000Z'
  });

  const result = commands.buildPrecheckResult({
    repoRoot: process.cwd(),
    baselineDir,
    metadata
  });

  assert.equal(result.baseline_status, 'missing');
  assert.equal(result.nearest_baseline, null);
  assert.ok(result.warnings.some((warning) => /env_key/i.test(warning.message)));
  assert.equal(result.recommendation, undefined);
});

test('precheck ignores nearest baseline when latest-success omits repo key', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const metadata = makePrecheckMetadata();
  const referencedBaseline = path.join(baselineDir, 'existing-baseline.json');
  const latest = path.join(
    baselineDir,
    'repos',
    'a'.repeat(64),
    'refs',
    'c'.repeat(64),
    'env',
    'b'.repeat(64),
    'latest-success.json'
  );
  core.writeJson(referencedBaseline, { schema_version: 1 });
  core.writeJson(latest, {
    schema_version: 1,
    run_id: 'latest-run',
    ref: metadata.ref,
    ref_key: metadata.ref_key,
    commit: '1'.repeat(40),
    env_key: metadata.env_key,
    ad_build_source_digest: metadata.ad_build_source_digest,
    baseline_path: referencedBaseline,
    manifest_sha256: `sha256:${'9'.repeat(64)}`,
    created_at: '2026-06-11T00:00:00.000Z',
    updated_at: '2026-06-11T00:00:00.000Z'
  });

  const result = commands.buildPrecheckResult({
    repoRoot: process.cwd(),
    baselineDir,
    metadata
  });

  assert.equal(result.baseline_status, 'missing');
  assert.equal(result.nearest_baseline, null);
  assert.ok(result.warnings.some((warning) => /repo_key/i.test(warning.message)));
});

test('nearest baseline ignores invalid untrusted or tampered targets', () => {
  for (const fixture of [
    { publisher: 'other-bot' },
    { schema_version: 2 },
    { tamperManifest: true }
  ]) {
    const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
    const current = makePrecheckMetadata();
    const target = { ...current, commit: '1'.repeat(40) };
    const targetPath = writeBaselineFixture(baselineDir, target, fixture);
    const targetBaseline = core.readJson(targetPath);
    writeLatestSuccessFixture(baselineDir, current, {
      commit: target.commit,
      baseline_path: targetPath,
      manifest_sha256: targetBaseline.manifest_sha256
    });

    const result = commands.buildPrecheckResult({
      repoRoot: process.cwd(),
      baselineDir,
      env: { AD_BUILD_TRUSTED_PUBLISHERS: 'ci-bot' },
      metadata: current
    });

    assert.equal(result.baseline_status, 'missing');
    assert.equal(result.nearest_baseline, null);
    assert.ok(result.warnings.some((warning) => /baseline|publisher|manifest|schema/i.test(warning.message)));
  }
});

test('nearest baseline ignores latest-success baseline path outside baseline dir', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-outside-baseline-'));
  const current = makePrecheckMetadata();
  const target = { ...current, commit: '1'.repeat(40) };
  const targetPath = writeBaselineFixture(outsideDir, target);
  const targetBaseline = core.readJson(targetPath);
  writeLatestSuccessFixture(baselineDir, current, {
    commit: target.commit,
    baseline_path: targetPath,
    manifest_sha256: targetBaseline.manifest_sha256
  });

  const result = commands.buildPrecheckResult({
    repoRoot: process.cwd(),
    baselineDir,
    env: { AD_BUILD_TRUSTED_PUBLISHERS: 'ci-bot' },
    metadata: current
  });

  assert.equal(result.baseline_status, 'missing');
  assert.equal(result.nearest_baseline, null);
  assert.ok(result.warnings.some((warning) => /outside|baseline dir|baseline_dir|path/i.test(warning.message)));
});

test('nearest baseline rejects symlink baseline path escaping baseline dir', (t) => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-outside-baseline-'));
  const current = makePrecheckMetadata();
  const target = { ...current, commit: '1'.repeat(40) };
  const outsideBaselinePath = writeBaselineFixture(outsideDir, target);
  const targetBaseline = core.readJson(outsideBaselinePath);
  const linkDir = path.join(baselineDir, 'linked-baseline');
  try {
    fs.symlinkSync(path.dirname(outsideBaselinePath), linkDir, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    t.skip(`symlink or junction creation unavailable: ${error.message}`);
    return;
  }
  const linkedBaselinePath = path.join(linkDir, 'baseline.json');
  writeLatestSuccessFixture(baselineDir, current, {
    commit: target.commit,
    baseline_path: linkedBaselinePath,
    manifest_sha256: targetBaseline.manifest_sha256
  });

  const result = commands.buildPrecheckResult({
    repoRoot: process.cwd(),
    baselineDir,
    env: { AD_BUILD_TRUSTED_PUBLISHERS: 'ci-bot' },
    metadata: current
  });

  assert.equal(result.baseline_status, 'missing');
  assert.equal(result.nearest_baseline, null);
  assert.ok(result.warnings.some((warning) => /outside|realpath|baseline dir|baseline_dir|path/i.test(warning.message)));
});

test('baseline-save recovers stale target and latest-success locks', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  env.AD_BUILD_LOCK_STALE_MS = '1';
  const fullBuild = core.readJson(path.join(repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));
  const target = commands.baselinePath(baselineDir, fullBuild.repo_key, fullBuild.commit, fullBuild.env_key);
  const latestDir = path.join(
    baselineDir,
    'repos',
    core.safeDigestKey(fullBuild.repo_key),
    'refs',
    core.safeDigestKey(fullBuild.ref_key),
    'env',
    core.safeDigestKey(fullBuild.env_key)
  );
  const targetLock = `${path.dirname(target)}.lock`;
  const latestLock = `${latestDir}.latest.lock`;
  for (const lockDir of [targetLock, latestLock]) {
    fs.mkdirSync(lockDir, { recursive: true });
    core.writeJson(path.join(lockDir, 'lock.json'), {
      pid: 999999,
      created_at: '2000-01-01T00:00:00.000Z'
    });
  }

  const result = commands.runBaselineSave({ repoRoot: repo, env });

  assert.equal(result.ok, true);
  assert.equal(fs.existsSync(target), true);
  assert.equal(fs.existsSync(targetLock), false);
  assert.equal(fs.existsSync(latestLock), false);
});

test('baseline-save stale lock recovery does not delete newly acquired lock during race', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  env.AD_BUILD_LOCK_STALE_MS = '1';
  const fullBuild = core.readJson(path.join(repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json'));
  const target = commands.baselinePath(baselineDir, fullBuild.repo_key, fullBuild.commit, fullBuild.env_key);
  const targetLock = `${path.dirname(target)}.lock`;
  fs.mkdirSync(targetLock, { recursive: true });
  core.writeJson(path.join(targetLock, 'lock.json'), {
    pid: 999999,
    created_at: '2000-01-01T00:00:00.000Z'
  });

  let simulatedRace = false;
  const originalRenameSync = fs.renameSync;
  fs.renameSync = function racingRenameSync(from, to) {
    const result = originalRenameSync.call(fs, from, to);
    if (from === targetLock && !simulatedRace) {
      simulatedRace = true;
      fs.mkdirSync(from);
      core.writeJson(path.join(from, 'lock.json'), {
        pid: 424242,
        created_at: core.nowIso()
      });
    }
    return result;
  };

  let result;
  try {
    result = commands.runBaselineSave({ repoRoot: repo, env });
  } finally {
    fs.renameSync = originalRenameSync;
  }

  assert.equal(simulatedRace, true);
  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 4);
  assert.match(result.message, /lock/i);
  assert.equal(fs.existsSync(path.join(targetLock, 'lock.json')), true);
  assert.equal(fs.existsSync(target), false);
});

test('baseline-save replace publishes through backup without leftovers', () => {
  const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-baselines-'));
  const { repo, env } = setupPassedFullBuildForBaselineSave({ baselineDir });
  const first = commands.runBaselineSave({ repoRoot: repo, env });
  const targetDir = path.dirname(first.baseline_path);
  updateLatestFullBuildResult(repo, (result) => {
    result.run_id = 'replacement-run';
  });

  const renames = [];
  const originalRenameSync = fs.renameSync;
  fs.renameSync = function recordingRenameSync(from, to) {
    renames.push([from, to]);
    return originalRenameSync.call(fs, from, to);
  };
  let second;
  try {
    second = commands.runBaselineSave({ repoRoot: repo, env, replace: true });
  } finally {
    fs.renameSync = originalRenameSync;
  }
  const baseline = core.readJson(first.baseline_path);
  const parentEntries = fs.readdirSync(path.dirname(path.dirname(first.baseline_path)));

  assert.equal(second.ok, true);
  assert.equal(second.baseline_path, first.baseline_path);
  assert.equal(baseline.run_id, 'replacement-run');
  assert.ok(renames.some(([from, to]) => from === targetDir && /\.backup$/.test(to)));
  assert.equal(parentEntries.some((entry) => entry.includes('.tmp') || entry.includes('.backup')), false);
});

test('write json sorts keys deterministically', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-core-'));
  const file = path.join(dir, 'out.json');

  core.writeJson(file, { z: 1, a: { y: 2, b: 3 } });

  assert.equal(
    fs.readFileSync(file, 'utf8'),
    '{\n  "a": {\n    "b": 3,\n    "y": 2\n  },\n  "z": 1\n}\n'
  );
});

test('normalize for json rejects unsupported object types', () => {
  assert.throws(() => core.normalizeForJson(new Date('2026-01-01T00:00:00.000Z')), /unsupported object/i);
  assert.throws(() => core.normalizeForJson(new Map()), /unsupported object/i);
  assert.throws(() => core.normalizeForJson(new Set()), /unsupported object/i);
  assert.throws(() => core.normalizeForJson(/abc/), /unsupported object/i);
});

test('built-in high-risk packaging and signing rules are always present', () => {
  const config = moduleMap.normalizeModuleMap({ modules: {} });
  const patterns = config.riskRulesHigh.map((rule) => rule.pattern);
  assert.ok(patterns.includes('tools/module-map.yaml'));
  assert.ok(patterns.includes('sign/**'));
  assert.ok(patterns.includes('upgrade_framework/**'));
});

test('yaml parser supports object-form risk rules in arrays', () => {
  const parsed = moduleMap.parseModuleMapYaml('modules: {}\nrisk_rules:\n  high:\n    - pattern: custom/**\n      reason: custom reason\n');
  const config = moduleMap.normalizeModuleMap(parsed);
  const rule = config.riskRulesHigh.find((entry) => entry.pattern === 'custom/**');

  assert.deepEqual(
    { pattern: rule.pattern, reason: rule.reason },
    { pattern: 'custom/**', reason: 'custom reason' }
  );
});

test('normalize module map requires modules object', () => {
  assert.throws(() => moduleMap.normalizeModuleMap({}), /modules must be an object/);
  assert.throws(() => moduleMap.normalizeModuleMap({ modules: [] }), /modules must be an object/);
});

test('normalize module map rejects invalid risk rules shape', () => {
  const parsed = moduleMap.parseModuleMapYaml('modules: {}\nrisk_rules:\n  - custom/**\n');
  assert.throws(() => moduleMap.normalizeModuleMap(parsed), /risk_rules must be an object/);

  const config = moduleMap.normalizeModuleMap({ modules: {}, risk_rules: {} });
  assert.ok(config.riskRulesHigh.some((rule) => rule.pattern === 'tools/module-map.yaml'));
});

test('normalize module map rejects non-string display names', () => {
  const makeModuleMap = (displayNameField) => ({
    modules: {
      app: {
        ...displayNameField,
        paths: ['apps/**'],
        build: ['make app']
      }
    }
  });

  assert.throws(() => moduleMap.normalizeModuleMap(makeModuleMap({ display_name: {} })), /display_name must be a string/);
  assert.throws(() => moduleMap.normalizeModuleMap(makeModuleMap({ displayName: [] })), /display_name must be a string/);
});

test('normalize module map rejects unsafe module paths and risk patterns', () => {
  const makeModuleMap = (paths) => ({
    modules: {
      app: {
        paths,
        build: ['make app']
      }
    }
  });

  assert.throws(() => moduleMap.normalizeModuleMap(makeModuleMap(['/repo/app'])), /repository-relative path/);
  assert.throws(() => moduleMap.normalizeModuleMap(makeModuleMap(['C:\\repo\\app'])), /repository-relative path/);
  assert.throws(() => moduleMap.normalizeModuleMap(makeModuleMap(['apps/../secret'])), /repository-relative path/);
  assert.throws(() => moduleMap.normalizeModuleMap({ modules: {}, risk_rules: { high: ['/repo/**'] } }), /repository-relative path/);
  assert.throws(() => moduleMap.normalizeModuleMap({ modules: {}, risk_rules: { high: ['C:\\repo\\**'] } }), /repository-relative path/);
  assert.throws(() => moduleMap.normalizeModuleMap({ modules: {}, risk_rules: { high: ['apps/../**'] } }), /repository-relative path/);
});

test('globstar and basename path matching works', () => {
  assert.equal(moduleMap.pathMatches('apps/foo/bar.mk', '**/*.mk'), true);
  assert.equal(moduleMap.pathMatches('apps/foo/Makefile.test', 'Makefile*'), true);
  assert.equal(moduleMap.pathMatches('packet/a/b.txt', 'packet/**'), true);
});

test('directory globstar matches files under directory but not directory itself', () => {
  assert.equal(moduleMap.pathMatches('packet/file.txt', 'packet/**'), true);
  assert.equal(moduleMap.pathMatches('packet/sub/file.txt', 'packet/**'), true);
  assert.equal(moduleMap.pathMatches('packet', 'packet/**'), false);
});

test('path matching rejects unsafe file paths and patterns', () => {
  assert.throws(() => moduleMap.pathMatches('C:/repo/app.c', '**/*.c'), /repository-relative path/);
  assert.throws(() => moduleMap.pathMatches('apps/../secret.c', '**/*.c'), /repository-relative path/);
  assert.throws(() => moduleMap.pathMatches('apps/app.c', 'C:/repo/**'), /repository-relative path/);
  assert.throws(() => moduleMap.pathMatches('apps/app.c', 'apps/../**'), /repository-relative path/);
});

test('risk matching uses design output contract', () => {
  const matches = moduleMap.findRiskMatches(
    ['apps/foo.c'],
    [{ level: 'high', pattern: 'apps/**', reason: 'custom reason' }]
  );

  assert.deepEqual(matches, [{
    file: 'apps/foo.c',
    risk_level: 'high',
    pattern: 'apps/**',
    reason: 'custom reason'
  }]);
});

test('strict yaml subset parses starter module map', () => {
  const parsed = moduleMap.parseModuleMapYaml('modules:\n  snmp:\n    paths:\n      - apps/snmp/**\n    build:\n      - make -C apps/snmp\n');
  assert.deepEqual(parsed.modules.snmp.paths, ['apps/snmp/**']);
});

test('strict yaml subset preserves glob patterns with asterisks', () => {
  const parsed = moduleMap.parseModuleMapYaml('modules:\n  build:\n    paths:\n      - **/*.mk\n      - apps/**\n      - *.c\n      - Makefile*\n    build:\n      - make\n');
  assert.deepEqual(parsed.modules.build.paths, ['**/*.mk', 'apps/**', '*.c', 'Makefile*']);
});

test('strict yaml subset rejects YAML aliases', () => {
  assert.throws(() => moduleMap.parseModuleMapYaml('modules: *x'), /unsupported YAML alias/);
  assert.throws(() => moduleMap.parseModuleMapYaml('modules: *x more'), /unsupported YAML alias/);
  assert.throws(() => moduleMap.parseModuleMapYaml('paths:\n  - *x'), /unsupported YAML alias/);
});

test('strict yaml subset rejects unquoted inline comments', () => {
  assert.throws(() => moduleMap.parseModuleMapYaml('paths:\n  - apps/** # comment'), /inline comments are not supported/);
});

test('strict yaml subset rejects nested sequence array items', () => {
  assert.throws(() => moduleMap.parseModuleMapYaml('paths:\n  - - apps/**'), /nested sequences are not supported/);
});

test('strict yaml subset rejects tabs anywhere in a non-empty line', () => {
  assert.throws(() => moduleMap.parseModuleMapYaml('modules:\t{}'), /tabs are not supported/);
  assert.throws(() => moduleMap.parseModuleMapYaml('#\tcomment\nmodules: {}'), /tabs are not supported/);
});

test('strict yaml subset rejects mismatched or unterminated quoted scalars', () => {
  assert.throws(() => moduleMap.parseModuleMapYaml('modules: "\'\n'), /quoted scalar/);
  assert.throws(() => moduleMap.parseModuleMapYaml('modules: "unterminated\n'), /quoted scalar/);
  assert.throws(() => moduleMap.parseModuleMapYaml("modules: 'unterminated\n"), /quoted scalar/);
  assert.throws(() => moduleMap.parseModuleMapYaml('modules: "a"b"'), /quoted scalar/);
  assert.throws(() => moduleMap.parseModuleMapYaml("modules: 'a'b'"), /quoted scalar/);
});

test('doctor reports node and baseline checks', async () => {
  const result = await commands.buildDoctorResult({
    repoRoot: process.cwd(),
    baselineDir: null,
    moduleMapPath: 'tools/module-map.yaml'
  });
  const checkNames = result.checks.map((check) => check.name);

  assert.equal(result.schema_version, 1);
  assert.ok(checkNames.includes('node_available'));
  assert.ok(checkNames.includes('baseline_dir_configured'));
});

test('doctor reports required Task 3 checks and status vocabulary', async () => {
  const result = await commands.buildDoctorResult({
    repoRoot: process.cwd(),
    baselineDir: null,
    moduleMapPath: 'tools/module-map.yaml',
    env: {}
  });
  const checkNames = result.checks.map((check) => check.name);
  const allowedStatuses = new Set(['passed', 'warning', 'failed', 'skipped']);

  assert.deepEqual(result.errors, []);
  assert.ok(Array.isArray(result.warnings));
  for (const name of [
    'node_available',
    'git_available',
    'git_repo',
    'sh_available',
    'make_available',
    'npm_available',
    'module_map_parseable',
    'baseline_dir_configured',
    'baseline_dir_readable',
    'baseline_publish_mode'
  ]) {
    assert.ok(checkNames.includes(name), `missing check ${name}`);
  }
  for (const check of result.checks) {
    assert.ok(allowedStatuses.has(check.status), `invalid status ${check.name}: ${check.status}`);
  }
});

test('doctor reports missing configured baseline directory as unreadable', async () => {
  const missingBaselineDir = path.join(os.tmpdir(), `ad-build-missing-${Date.now()}`);
  const result = await commands.buildDoctorResult({
    repoRoot: process.cwd(),
    baselineDir: missingBaselineDir,
    moduleMapPath: 'tools/module-map.yaml',
    env: {}
  });
  const checks = Object.fromEntries(result.checks.map((check) => [check.name, check]));

  assert.equal(checks.baseline_dir_configured.status, 'passed');
  assert.equal(checks.baseline_dir_readable.status, 'failed');
  assert.match(checks.baseline_dir_readable.message, /not readable|not found|does not exist/i);
});

test('doctor reads baseline directory from supplied environment', async () => {
  const missingBaselineDir = path.join(os.tmpdir(), `ad-build-env-missing-${Date.now()}`);
  const result = await commands.buildDoctorResult({
    repoRoot: process.cwd(),
    moduleMapPath: 'tools/module-map.yaml',
    env: {
      AD_BUILD_BASELINE_DIR: missingBaselineDir
    }
  });
  const checks = Object.fromEntries(result.checks.map((check) => [check.name, check]));

  assert.equal(checks.baseline_dir_configured.status, 'passed');
  assert.equal(checks.baseline_dir_readable.status, 'failed');
});

test('doctor reports baseline publish mode from environment', async () => {
  const result = await commands.buildDoctorResult({
    repoRoot: process.cwd(),
    baselineDir: null,
    moduleMapPath: 'tools/module-map.yaml',
    env: {
      AD_BUILD_BASELINE_PUBLISH: '1',
      AD_BUILD_BASELINE_PUBLISHER: 'ci-bot'
    }
  });
  const checks = Object.fromEntries(result.checks.map((check) => [check.name, check]));

  assert.equal(checks.baseline_publish_mode.status, 'passed');
  assert.equal(checks.baseline_publish_mode.publisher, 'ci-bot');
});

test('modules result exposes verify metadata', () => {
  const result = commands.buildModulesResult({ moduleMapPath: 'tools/module-map.yaml' });
  const snmp = result.modules.find((entry) => entry.name === 'snmp');

  assert.equal(result.schema_version, 1);
  assert.ok(snmp);
  assert.deepEqual(snmp, {
    name: 'snmp',
    display_name: 'SNMP',
    paths: ['apps/snmp/**'],
    cwd: '.',
    build: ['make -C apps/snmp'],
    timeout_seconds: 3600,
    env: {},
    log_name: 'snmp'
  });
});

test('verify records command-level not_run after failure', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-verify-'));
  const fakeSh = makeFakeShEnv();
  const module = {
    name: 'demo',
    cwd: '.',
    build: ['fail-command', 'pass-command'],
    timeout_seconds: 30,
    env: {},
    log_name: 'demo'
  };
  const summary = await commands.runVerifyModules({
    repoRoot: repo,
    modules: [module],
    runRoot: path.join(repo, '.ad-build', 'runs'),
    env: fakeSh.env
  });

  assert.equal(summary.overall_status, 'partial');
  assert.equal(summary.results[0].status, 'failed');
  assert.equal(summary.results[0].commands[1].status, 'not_run');
  assert.equal(summary.results[0].commands[1].exit_code, null);
  const invocations = readFakeShInvocations(fakeSh.marker);
  assert.deepEqual(invocations[0].args, ['-lc', 'fail-command']);
});

test('verify records later requested modules as not_run after a failed module', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-verify-'));
  const fakeSh = makeFakeShEnv();
  const summary = await commands.runVerifyModules({
    repoRoot: repo,
    modules: [
      {
        name: 'first',
        cwd: '.',
        build: ['fail-command'],
        timeout_seconds: 30,
        env: {},
        log_name: 'first'
      },
      {
        name: 'second',
        cwd: '.',
        build: ['pass-command'],
        timeout_seconds: 30,
        env: {},
        log_name: 'second'
      }
    ],
    runRoot: path.join(repo, '.ad-build', 'runs'),
    env: fakeSh.env
  });

  assert.equal(summary.overall_status, 'partial');
  assert.equal(summary.results[0].status, 'failed');
  assert.equal(summary.results[1].status, 'not_run');
  assert.equal(summary.results[1].commands[0].status, 'not_run');
  assert.equal(fs.existsSync(path.join(repo, summary.results[1].commands[0].log_path)), true);

  const report = commands.runReport({ repoRoot: repo, runId: summary.run_id });
  assert.equal(report.exitCode, 0);
  const cliReport = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'report', summary.run_id], {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(cliReport.status, 0, cliReport.stderr);
});

test('verify records command timeout status', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-verify-'));
  const fakeSh = makeFakeShEnv();
  const started = Date.now();
  const summary = await commands.runVerifyModules({
    repoRoot: repo,
    modules: [{
      name: 'slow',
      cwd: '.',
      build: ['timeout-command'],
      timeout_seconds: 0.01,
      env: {},
      log_name: 'slow'
    }],
    runRoot: path.join(repo, '.ad-build', 'runs'),
    env: fakeSh.env
  });

  assert.equal(summary.overall_status, 'failed');
  assert.equal(summary.results[0].status, 'timeout');
  assert.equal(summary.results[0].commands[0].status, 'timeout');
  assert.ok(Date.now() - started < 1500, 'timeout should return promptly');
});

test('verify records missing sh as failed command exit 127', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-verify-'));
  const emptyPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-empty-path-'));
  const summary = await commands.runVerifyModules({
    repoRoot: repo,
    modules: [{
      name: 'missing-sh',
      cwd: '.',
      build: ['pass-command'],
      timeout_seconds: 30,
      env: {},
      log_name: 'missing-sh'
    }],
    runRoot: path.join(repo, '.ad-build', 'runs'),
    env: {
      ...process.env,
      PATH: emptyPath
    }
  });

  assert.equal(summary.overall_status, 'failed');
  assert.equal(summary.results[0].status, 'failed');
  assert.equal(summary.results[0].commands[0].status, 'failed');
  assert.equal(summary.results[0].commands[0].exit_code, 127);
});

test('verify fails safely when module cwd resolves outside repo', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-verify-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-outside-cwd-'));
  const link = path.join(repo, 'linked-cwd');
  createDirectoryLink(outside, link);
  const summary = await commands.runVerifyModules({
    repoRoot: repo,
    modules: [{
      name: 'escape',
      cwd: 'linked-cwd',
      build: ['pass-command'],
      timeout_seconds: 30,
      env: {},
      log_name: 'escape'
    }],
    runRoot: path.join(repo, '.ad-build', 'runs'),
    env: makeFakeShEnv().env
  });

  assert.equal(summary.overall_status, 'failed');
  assert.equal(summary.results[0].status, 'failed');
  assert.equal(summary.results[0].commands[0].exit_code, 2);
  const log = fs.readFileSync(path.join(repo, summary.results[0].commands[0].log_path), 'utf8');
  assert.match(log, /cwd.*outside repository|escapes repository/i);
});

test('verify CLI unknown module exits 2 and records unknown_module summary', () => {
  const repo = makeTempRepoWithModuleMap();
  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'verify', 'missing'], {
    cwd: repo,
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown module/i);
  const runId = latestRunId(repo);
  const summary = core.readJson(path.join(repo, '.ad-build', 'runs', runId, 'verify-summary.json'));
  assert.deepEqual(summary.requested_modules, ['missing']);
  assert.equal(summary.results[0].module, 'missing');
  assert.equal(summary.results[0].status, 'unknown_module');
});

test('report missing exits 3 and valid report writes Markdown', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-report-'));
  const missing = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'report', 'does-not-exist'], {
    cwd: repo,
    encoding: 'utf8'
  });

  assert.equal(missing.status, 3);

  const summary = await commands.runVerifyModules({
    repoRoot: repo,
    modules: [{
      name: 'demo',
      cwd: '.',
      build: ['pass-command'],
      timeout_seconds: 30,
      env: {},
      log_name: 'demo'
    }],
    runRoot: path.join(repo, '.ad-build', 'runs'),
    env: makeFakeShEnv().env
  });
  const valid = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'report', summary.run_id], {
    cwd: repo,
    encoding: 'utf8'
  });

  assert.equal(valid.status, 0, valid.stderr);
  const report = fs.readFileSync(path.join(repo, '.ad-build', 'runs', summary.run_id, 'report.md'), 'utf8');
  assert.match(report, /# ad-build verification report/);
  assert.match(report, /demo/);
});

test('report marks incomplete summary missing required fields as partial', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-report-'));
  const runId = 'incomplete-summary';
  const runDir = path.join(repo, '.ad-build', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'demo.log'), 'log\n');
  core.writeJson(path.join(runDir, 'verify-summary.json'), {
    schema_version: 1,
    run_id: runId,
    generated_at: '2026-06-11T00:00:00.000Z',
    requested_modules: ['demo'],
    overall_status: 'passed',
    results: [{
      module: 'demo',
      status: 'passed',
      commands: [{
        command: 'node -e "console.log(1)"',
        status: 'passed',
        cwd: '.',
        exit_code: 0,
        started_at: '2026-06-11T00:00:00.000Z',
        duration_seconds: 0.1,
        log_path: '.ad-build/runs/incomplete-summary/demo.log'
      }]
    }]
  });

  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'report', runId], {
    cwd: repo,
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(report, /Report status: partial/);
  assert.match(report, /errors must be an array/);
  assert.match(report, /warnings must be an array/);
  assert.match(report, /ended_at/);
});

test('report marks invalid summary statuses as partial', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-report-'));
  const runId = 'invalid-status-summary';
  const runDir = path.join(repo, '.ad-build', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  core.writeJson(path.join(runDir, 'verify-summary.json'), {
    schema_version: 1,
    run_id: runId,
    generated_at: '2026-06-11T00:00:00.000Z',
    requested_modules: ['demo'],
    overall_status: 'passed',
    errors: [],
    warnings: [],
    results: [{
      module: 'demo',
      status: 'weird',
      commands: [{
        command: 'node -e "console.log(1)"',
        status: 'weird',
        cwd: '.',
        exit_code: 0,
        started_at: '2026-06-11T00:00:00.000Z',
        ended_at: '2026-06-11T00:00:01.000Z',
        duration_seconds: 1,
        log_path: '.ad-build/runs/invalid-status-summary/demo.log'
      }]
    }]
  });

  const report = commands.runReport({ repoRoot: repo, runId });

  assert.equal(report.exitCode, 1);
  assert.equal(report.status, 'partial');
  assert.ok(report.errors.some((error) => /invalid module status/i.test(error)));
  assert.ok(report.errors.some((error) => /invalid command status/i.test(error)));
});

test('report marks command status unknown_module as partial', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-report-'));
  const runId = 'unknown-command-status-summary';
  const runDir = path.join(repo, '.ad-build', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'demo.log'), 'log\n');
  core.writeJson(path.join(runDir, 'verify-summary.json'), {
    schema_version: 1,
    run_id: runId,
    generated_at: '2026-06-11T00:00:00.000Z',
    requested_modules: ['demo'],
    overall_status: 'failed',
    errors: [],
    warnings: [],
    results: [{
      module: 'demo',
      status: 'failed',
      commands: [{
        command: 'pass-command',
        status: 'unknown_module',
        cwd: '.',
        exit_code: null,
        started_at: '2026-06-11T00:00:00.000Z',
        ended_at: '2026-06-11T00:00:01.000Z',
        duration_seconds: 1,
        log_path: '.ad-build/runs/unknown-command-status-summary/demo.log'
      }]
    }]
  });

  const report = commands.runReport({ repoRoot: repo, runId });

  assert.equal(report.exitCode, 1);
  assert.ok(report.errors.some((error) => /invalid command status/i.test(error)));
});

test('report marks not_run command missing nullable fields as partial', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-report-'));
  const runId = 'not-run-missing-fields';
  const runDir = path.join(repo, '.ad-build', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  core.writeJson(path.join(runDir, 'verify-summary.json'), {
    schema_version: 1,
    run_id: runId,
    generated_at: '2026-06-11T00:00:00.000Z',
    requested_modules: ['demo'],
    overall_status: 'partial',
    errors: [],
    warnings: [],
    results: [{
      module: 'demo',
      status: 'not_run',
      commands: [{
        command: 'node -e "console.log(1)"',
        status: 'not_run',
        cwd: '.',
        exit_code: null,
        log_path: '.ad-build/runs/not-run-missing-fields/demo.log'
      }]
    }]
  });

  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'report', runId], {
    cwd: repo,
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(report, /Report status: partial/);
  assert.match(report, /started_at/);
  assert.match(report, /ended_at/);
  assert.match(report, /duration_seconds/);
});

test('report marks not_run command declaring missing log as partial', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-report-'));
  const runId = 'not-run-missing-log';
  const runDir = path.join(repo, '.ad-build', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  core.writeJson(path.join(runDir, 'verify-summary.json'), {
    schema_version: 1,
    run_id: runId,
    generated_at: '2026-06-11T00:00:00.000Z',
    requested_modules: ['demo'],
    overall_status: 'partial',
    errors: [],
    warnings: [],
    results: [{
      module: 'demo',
      status: 'not_run',
      commands: [{
        command: 'pass-command',
        status: 'not_run',
        cwd: '.',
        exit_code: null,
        started_at: null,
        ended_at: null,
        duration_seconds: null,
        log_path: '.ad-build/runs/not-run-missing-log/demo.log'
      }]
    }]
  });

  const report = commands.runReport({ repoRoot: repo, runId });

  assert.equal(report.exitCode, 1);
  assert.equal(report.status, 'partial');
  assert.ok(report.errors.some((error) => /log is missing/i.test(error)));
});

test('report rejects log path that resolves outside run dir', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-report-'));
  const runId = 'escaping-log-path';
  const runDir = path.join(repo, '.ad-build', 'runs', runId);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-outside-log-'));
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(outside, 'demo.log'), 'SHOULD_NOT_LEAK_FROM_OUTSIDE_LOG\n');
  createDirectoryLink(outside, path.join(runDir, 'logs'));
  core.writeJson(path.join(runDir, 'verify-summary.json'), {
    schema_version: 1,
    run_id: runId,
    generated_at: '2026-06-11T00:00:00.000Z',
    requested_modules: ['demo'],
    overall_status: 'passed',
    errors: [],
    warnings: [],
    results: [{
      module: 'demo',
      status: 'passed',
      commands: [{
        command: 'pass-command',
        status: 'passed',
        cwd: '.',
        exit_code: 0,
        started_at: '2026-06-11T00:00:00.000Z',
        ended_at: '2026-06-11T00:00:01.000Z',
        duration_seconds: 1,
        log_path: '.ad-build/runs/escaping-log-path/logs/demo.log'
      }]
    }]
  });

  const report = commands.runReport({ repoRoot: repo, runId });

  assert.equal(report.exitCode, 1);
  assert.equal(report.status, 'partial');
  assert.ok(report.errors.some((error) => /log is missing|outside/i.test(error)));
  assert.doesNotMatch(
    fs.readFileSync(path.join(runDir, 'report.md'), 'utf8'),
    /SHOULD_NOT_LEAK_FROM_OUTSIDE_LOG/
  );
});

test('report handles non-string log path as partial without throwing', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-report-'));
  const runId = 'non-string-log-path';
  const runDir = path.join(repo, '.ad-build', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  core.writeJson(path.join(runDir, 'verify-summary.json'), {
    schema_version: 1,
    run_id: runId,
    generated_at: '2026-06-11T00:00:00.000Z',
    requested_modules: ['demo'],
    overall_status: 'passed',
    errors: [],
    warnings: [],
    results: [{
      module: 'demo',
      status: 'passed',
      commands: [{
        command: 'pass-command',
        status: 'passed',
        cwd: '.',
        exit_code: 0,
        started_at: '2026-06-11T00:00:00.000Z',
        ended_at: '2026-06-11T00:00:01.000Z',
        duration_seconds: 1,
        log_path: { path: '.ad-build/runs/non-string-log-path/demo.log' }
      }]
    }]
  });

  const report = commands.runReport({ repoRoot: repo, runId });

  assert.equal(report.exitCode, 1);
  assert.equal(report.status, 'partial');
  assert.ok(fs.existsSync(path.join(runDir, 'report.md')));
});

test('diff includes untracked files with unknown binary state', () => {
  const repo = makeTempRepoWithModuleMap();
  initGitRepo(repo);
  commitAll(repo, 'initial commit');
  fs.writeFileSync(path.join(repo, 'new.txt'), 'x');

  const result = commands.buildDiffSummary({ repoRoot: repo, baseRef: 'HEAD' });
  const item = result.files.find((file) => file.path === 'new.txt');

  assert.ok(item, 'expected new.txt in diff summary');
  assert.equal(item.status, 'untracked');
  assert.equal(item.is_binary, null);
  assert.equal(item.is_untracked, true);
});

test('diff preserves utf8 untracked paths', () => {
  const repo = makeTempRepoWithModuleMap();
  const name = 'caf\u00e9-untracked.txt';
  initGitRepo(repo);
  commitAll(repo, 'initial commit');
  fs.writeFileSync(path.join(repo, name), 'x');

  const result = commands.buildDiffSummary({ repoRoot: repo, baseRef: 'HEAD' });
  const item = result.files.find((file) => file.path === name);

  assert.ok(item, `expected ${name} in diff summary`);
  assert.equal(item.status, 'untracked');
  assert.equal(item.is_untracked, true);
});

test('diff preserves utf8 staged tracked paths', () => {
  const repo = makeTempRepoWithModuleMap();
  const name = 'caf\u00e9.txt';
  initGitRepo(repo);
  fs.writeFileSync(path.join(repo, name), 'before\n');
  commitAll(repo, 'initial utf8 file');
  fs.writeFileSync(path.join(repo, name), 'after\n');
  git(repo, ['add', name]);

  const result = commands.buildDiffSummary({ repoRoot: repo, baseRef: 'HEAD' });
  const item = result.files.find((file) => file.path === name);

  assert.ok(item, `expected ${name} in diff summary`);
  assert.equal(item.status, 'modified');
  assert.equal(item.is_untracked, false);
});

test('diff includes staged files before first commit', () => {
  const repo = makeTempRepoWithModuleMap();
  initGitRepo(repo);
  fs.writeFileSync(path.join(repo, 'staged.txt'), 'x');
  git(repo, ['add', 'staged.txt']);

  const result = commands.buildDiffSummary({ repoRoot: repo, baseRef: 'HEAD' });
  const item = result.files.find((file) => file.path === 'staged.txt');

  assert.ok(item, 'expected staged.txt in diff summary');
  assert.equal(item.status, 'added');
  assert.equal(item.is_untracked, false);
});

test('diff preserves staged copy source from unchanged tracked file', () => {
  const repo = makeTempRepoWithModuleMap();
  const sourceFile = path.join(repo, 'apps', 'snmp', 'source.c');
  const copiedFile = path.join(repo, 'docs', 'source-copy.c');
  initGitRepo(repo);
  fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
  fs.writeFileSync(sourceFile, 'int source(void) { return 1; }\n');
  commitAll(repo, 'initial source');
  fs.mkdirSync(path.dirname(copiedFile), { recursive: true });
  fs.copyFileSync(sourceFile, copiedFile);
  git(repo, ['add', 'docs/source-copy.c']);

  const diffSummary = commands.buildDiffSummary({ repoRoot: repo, baseRef: 'HEAD' });
  const item = diffSummary.files.find((file) => file.path === 'docs/source-copy.c');

  assert.ok(item, 'expected copied file in diff summary');
  assert.equal(item.status, 'copied');
  assert.equal(item.old_path, 'apps/snmp/source.c');
  assert.equal(item.is_untracked, false);

  const mapResult = commands.buildMapResult({
    diffSummary,
    moduleMapConfig: moduleMap.normalizeModuleMap({
      modules: {
        snmp: {
          paths: ['apps/snmp/**'],
          build: ['make -C apps/snmp']
        }
      }
    })
  });

  assert.ok(mapResult.module_matches.some((match) => (
    match.module === 'snmp'
      && match.file === 'apps/snmp/source.c'
      && match.pattern === 'apps/snmp/**'
  )));
  assert.deepEqual(mapResult.valid_verify_modules, ['snmp']);
});

test('map marks module-map changes untrusted', () => {
  const diffSummary = {
    files: [{
      path: 'tools/module-map.yaml',
      status: 'modified',
      old_path: null,
      is_untracked: false,
      is_binary: false
    }]
  };
  const result = commands.buildMapResult({
    diffSummary,
    moduleMapConfig: moduleMap.normalizeModuleMap({ modules: {} })
  });

  assert.equal(result.mapping_trusted, false);
  assert.ok(result.risk_matches.length > 0);
  assert.ok(result.risk_matches.some((match) => match.file === 'tools/module-map.yaml' && match.risk_level === 'high'));
  assert.ok(result.warnings.length > 0);
});

test('map uses rename old_path as module and risk evidence', () => {
  const diffSummary = {
    files: [{
      path: 'docs/main.c',
      status: 'renamed',
      old_path: 'apps/snmp/main.c',
      is_untracked: false,
      is_binary: false
    }]
  };
  const result = commands.buildMapResult({
    diffSummary,
    moduleMapConfig: moduleMap.normalizeModuleMap({
      modules: {
        snmp: {
          paths: ['apps/snmp/**'],
          build: ['make -C apps/snmp']
        }
      },
      risk_rules: {
        high: [{
          pattern: 'apps/snmp/**',
          reason: 'snmp source moved'
        }]
      }
    })
  });

  assert.deepEqual(result.changed_files, ['docs/main.c', 'apps/snmp/main.c']);
  assert.deepEqual(result.module_matches, [{
    module: 'snmp',
    file: 'apps/snmp/main.c',
    pattern: 'apps/snmp/**'
  }]);
  assert.ok(result.risk_matches.some((match) => (
    match.file === 'apps/snmp/main.c'
      && match.pattern === 'apps/snmp/**'
      && match.reason === 'snmp source moved'
  )));
  assert.deepEqual(result.valid_verify_modules, ['snmp']);
});

test('map result uses module_matches contract', () => {
  const diffSummary = {
    files: [{
      path: 'apps/snmp/main.c',
      status: 'modified',
      old_path: null,
      is_untracked: false,
      is_binary: false
    }]
  };
  const result = commands.buildMapResult({
    diffSummary,
    moduleMapConfig: moduleMap.normalizeModuleMap({
      modules: {
        snmp: {
          paths: ['apps/snmp/**'],
          build: ['make -C apps/snmp']
        }
      }
    })
  });

  assert.equal(result.matched_modules, undefined);
  assert.deepEqual(result.module_matches, [{
    module: 'snmp',
    file: 'apps/snmp/main.c',
    pattern: 'apps/snmp/**'
  }]);
  assert.deepEqual(result.valid_verify_modules, ['snmp']);
});

test('doctor command writes json and markdown outputs', () => {
  const repo = makeTempRepoWithModuleMap();
  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'doctor'], {
    cwd: repo,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(core.readJson(path.join(repo, '.ad-build', 'doctor.json')).schema_version, 1);
  assert.match(fs.readFileSync(path.join(repo, '.ad-build', 'doctor.md'), 'utf8'), /# ad-build doctor/);
});

test('modules command writes json and markdown outputs', () => {
  const repo = makeTempRepoWithModuleMap();
  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'modules'], {
    cwd: repo,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(core.readJson(path.join(repo, '.ad-build', 'modules.json')).modules[0].name, 'snmp');
  assert.match(fs.readFileSync(path.join(repo, '.ad-build', 'modules.md'), 'utf8'), /SNMP/);
});

test('modules command run from a git repo subdirectory uses repository root outputs', () => {
  const repo = makeTempRepoWithModuleMap();
  const subdir = path.join(repo, 'apps', 'snmp');
  fs.mkdirSync(subdir, { recursive: true });
  initGitRepo(repo);

  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'modules'], {
    cwd: subdir,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(core.readJson(path.join(repo, '.ad-build', 'modules.json')).modules[0].name, 'snmp');
  assert.equal(fs.existsSync(path.join(subdir, '.ad-build', 'modules.json')), false);
});

test('runCli honors AD_BUILD_WORK_DIR environment override', async () => {
  const repo = makeTempRepoWithModuleMap();
  const writes = [];
  const exitCode = await commands.runCli(['modules'], {
    env: {
      AD_BUILD_WORK_DIR: repo
    },
    stdout: { write: (value) => writes.push(value) },
    stderr: { write: (value) => writes.push(value) }
  });

  assert.equal(exitCode, 0, writes.join(''));
  assert.equal(core.readJson(path.join(repo, '.ad-build', 'modules.json')).modules[0].name, 'snmp');
});

test('unknown command exits with usage error', () => {
  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/ad-build.js'), 'unknown'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown command/i);
});

function makeTempRepoWithModuleMap() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-cli-'));
  const toolsDir = path.join(repo, 'tools');
  fs.mkdirSync(toolsDir, { recursive: true });
  fs.copyFileSync(
    path.join(process.cwd(), 'tools', 'module-map.yaml'),
    path.join(toolsDir, 'module-map.yaml')
  );
  return repo;
}

function latestRunId(repo) {
  return fs.readdirSync(path.join(repo, '.ad-build', 'runs')).sort().at(-1);
}

function makeFakeShEnv() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-fake-sh-'));
  const marker = path.join(dir, 'marker.jsonl');
  const script = path.join(dir, 'fake-sh.js');
  const fakeShJs = [
    "const fs = require('node:fs');",
    "const { spawn } = require('node:child_process');",
    "const args = process.argv.slice(2);",
    "const marker = process.env.AD_BUILD_FAKE_SH_MARKER;",
    "if (marker) fs.appendFileSync(marker, JSON.stringify({ args }) + '\\n');",
    "if (args[0] !== '-lc' || args.length < 2) {",
    "  console.error('fake sh expected -lc <command>');",
    "  process.exit(64);",
    "}",
    "const command = args.slice(1).join(' ');",
    "if (command === 'pass-command') { console.log('fake sh pass'); process.exit(0); }",
    "if (command === 'fail-command') { console.error('fake sh fail'); process.exit(1); }",
    "if (command === 'timeout-command') { setInterval(() => {}, 1000); }",
    "const child = spawn(command, { shell: true, stdio: 'inherit' });",
    "child.on('exit', (code, signal) => {",
    "  if (signal) process.kill(process.pid, signal);",
    "  process.exit(code ?? 1);",
    "});",
    "child.on('error', (error) => { console.error(error.message); process.exit(127); });",
    ""
  ].join('\n');
  fs.writeFileSync(script, fakeShJs);
  if (process.platform === 'win32') {
    fs.copyFileSync(ensureFakeShExe(), path.join(dir, 'sh.exe'));
  } else {
    fs.writeFileSync(path.join(dir, 'sh'), `#!/usr/bin/env node\n${fakeShJs}`);
    try {
      fs.chmodSync(path.join(dir, 'sh'), 0o755);
    } catch {
      // chmod is not available on all filesystems.
    }
  }
  return {
    marker,
    env: {
      ...process.env,
      AD_BUILD_FAKE_SH_MARKER: marker,
      PATH: `${dir}${path.delimiter}${process.env.PATH || ''}`
    }
  };
}

let cachedFakeShExe = null;

function ensureFakeShExe() {
  if (cachedFakeShExe && fs.existsSync(cachedFakeShExe)) {
    return cachedFakeShExe;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-build-fake-sh-exe-'));
  const source = path.join(dir, 'FakeSh.cs');
  const exe = path.join(dir, 'sh.exe');
  fs.writeFileSync(source, String.raw`
using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

class FakeSh {
  static int Main(string[] args) {
    string marker = Environment.GetEnvironmentVariable("AD_BUILD_FAKE_SH_MARKER");
    if (!String.IsNullOrEmpty(marker)) {
      File.AppendAllText(marker, "{\"args\":" + JsonArray(args) + "}" + Environment.NewLine);
    }
    if (args.Length < 2 || args[0] != "-lc") {
      Console.Error.WriteLine("fake sh expected -lc <command>");
      return 64;
    }
    string command = String.Join(" ", Subarray(args, 1));
    if (command == "pass-command") {
      Console.WriteLine("fake sh pass");
      return 0;
    }
    if (command == "fail-command") {
      Console.Error.WriteLine("fake sh fail");
      return 1;
    }
    if (command == "timeout-command") {
      Thread.Sleep(Timeout.Infinite);
      return 0;
    }
    Console.Error.WriteLine("unknown fake sh command: " + command);
    return 127;
  }

  static string[] Subarray(string[] values, int start) {
    string[] result = new string[Math.Max(0, values.Length - start)];
    Array.Copy(values, start, result, 0, result.Length);
    return result;
  }

  static string JsonArray(string[] values) {
    string[] escaped = new string[values.Length];
    for (int i = 0; i < values.Length; i++) {
      escaped[i] = "\"" + JsonEscape(values[i]) + "\"";
    }
    return "[" + String.Join(",", escaped) + "]";
  }

  static string JsonEscape(string value) {
    return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
  }
}
`);
  const compile = spawnSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `Add-Type -TypeDefinition (Get-Content -LiteralPath '${source.replaceAll("'", "''")}' -Raw) -OutputAssembly '${exe.replaceAll("'", "''")}' -OutputType ConsoleApplication`
  ], {
    encoding: 'utf8'
  });
  assert.equal(compile.status, 0, compile.stderr || compile.stdout);
  cachedFakeShExe = exe;
  return cachedFakeShExe;
}

function readFakeShInvocations(marker) {
  return fs.readFileSync(marker, 'utf8')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function createDirectoryLink(target, linkPath) {
  try {
    fs.symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    assert.fail(`could not create directory link for test: ${error.message}`);
  }
}

function setupPassedFullBuildForBaselineSave(options = {}) {
  const repo = makeTempRepoWithModuleMap();
  initGitRepo(repo);
  commitAll(repo, 'initial commit');
  fs.appendFileSync(path.join(repo, '.git', 'info', 'exclude'), '\n.ad-build/\n');

  const env = {
    ...process.env,
    AD_BUILD_BASELINE_PUBLISH: '1',
    AD_BUILD_BASELINE_PUBLISHER: 'ci-bot'
  };
  if (options.baselineDir) {
    env.AD_BUILD_BASELINE_DIR = options.baselineDir;
  } else {
    delete env.AD_BUILD_BASELINE_DIR;
  }

  commands.runFullBuild({
    repoRoot: repo,
    command: [process.execPath, '-e', "console.log('ok')"],
    env
  });

  return { repo, env };
}

function updateLatestFullBuildResult(repo, mutate) {
  const file = path.join(repo, '.ad-build', 'full-build', 'latest', 'full-build-result.json');
  const result = core.readJson(file);
  mutate(result);
  core.writeJson(file, result);
}

function makePrecheckMetadata() {
  return {
    commit: '0'.repeat(40),
    ref: 'refs/heads/main',
    ref_key: `sha256:${'c'.repeat(64)}`,
    branch: 'main',
    repo_id: 'example/repo',
    repo_key: `sha256:${'a'.repeat(64)}`,
    env_key: `sha256:${'b'.repeat(64)}`,
    docker_identity: 'example-image@sha256:1234',
    ad_build_version: '0.1.0',
    ad_build_source_digest: `sha256:${'e'.repeat(64)}`,
    build_config_digest: `sha256:${'1'.repeat(64)}`,
    toolchain_digest: `sha256:${'2'.repeat(64)}`,
    submodule_digest: `sha256:${'3'.repeat(64)}`,
    worktree_clean: true
  };
}

function writeBaselineFixture(baselineDir, metadata, options = {}) {
  const baselinePath = commands.baselinePath(baselineDir, metadata.repo_key, metadata.commit, metadata.env_key);
  const baselineRoot = path.dirname(baselinePath);
  fs.mkdirSync(baselineRoot, { recursive: true });
  fs.writeFileSync(path.join(baselineRoot, 'compile.log'), 'ok\n');
  core.writeJson(path.join(baselineRoot, 'full-build-result.json'), {
    schema_version: 1,
    run_id: 'fixture-run',
    status: 'passed',
    ...metadata
  });
  const manifest = [
    `compile.log sha256:${sha256File(path.join(baselineRoot, 'compile.log'))}`,
    `full-build-result.json sha256:${sha256File(path.join(baselineRoot, 'full-build-result.json'))}`
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(baselineRoot, 'artifact-manifest.txt'), manifest);
  const baseline = {
    schema_version: options.schema_version || 1,
    producer: 'ad-build',
    publisher: options.publisher || 'ci-bot',
    created_at: '2026-06-11T00:00:00.000Z',
    updated_at: '2026-06-11T00:00:00.000Z',
    run_id: 'fixture-run',
    dirty_worktree: false,
    manifest_sha256: `sha256:${sha256File(path.join(baselineRoot, 'artifact-manifest.txt'))}`,
    full_build: {
      run_id: 'fixture-run',
      result_path: 'full-build-result.json'
    },
    artifacts: {
      manifest_path: 'artifact-manifest.txt',
      compile_log_path: 'compile.log',
      full_build_result_path: 'full-build-result.json'
    },
    ...metadata
  };
  core.writeJson(baselinePath, baseline);
  if (options.tamperManifest) {
    fs.appendFileSync(path.join(baselineRoot, 'artifact-manifest.txt'), 'tamper\n');
  }
  return baselinePath;
}

function writeLatestSuccessFixture(baselineDir, metadata, overrides = {}) {
  const latestPath = path.join(
    baselineDir,
    'repos',
    core.safeDigestKey(metadata.repo_key),
    'refs',
    core.safeDigestKey(metadata.ref_key),
    'env',
    core.safeDigestKey(metadata.env_key),
    'latest-success.json'
  );
  core.writeJson(latestPath, {
    schema_version: 1,
    run_id: 'fixture-run',
    commit: metadata.commit,
    ref: metadata.ref,
    ref_key: metadata.ref_key,
    repo_key: metadata.repo_key,
    env_key: metadata.env_key,
    ad_build_source_digest: metadata.ad_build_source_digest,
    baseline_path: overrides.baseline_path,
    manifest_sha256: overrides.manifest_sha256,
    created_at: '2026-06-11T00:00:00.000Z',
    updated_at: '2026-06-11T00:00:00.000Z',
    ...overrides
  });
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function initGitRepo(repo) {
  git(repo, ['init']);
}

function commitAll(repo, message) {
  git(repo, ['config', 'user.email', 'ad-build-test@example.invalid']);
  git(repo, ['config', 'user.name', 'ad-build test']);
  git(repo, ['add', '.']);
  git(repo, ['commit', '-m', message]);
}

function git(repo, args) {
  const result = spawnSync('git', args, {
    cwd: repo,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  return result;
}
