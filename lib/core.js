const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function canonicalJson(value) {
  return JSON.stringify(normalizeForJson(value));
}

function normalizeForJson(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeForJson);
  }

  if (value && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw new TypeError(`unsupported object type for JSON normalization: ${value.constructor?.name || 'Object'}`);
    }

    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = normalizeForJson(value[key]);
    }
    return out;
  }

  return value;
}

function digestJson(value) {
  const digest = crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
  return `sha256:${digest}`;
}

function safeDigestKey(digest) {
  if (typeof digest !== 'string') {
    throw new TypeError('invalid digest: expected sha256 digest string');
  }

  const match = /^(?:sha256:)?([a-f0-9]{64})$/.exec(digest);
  if (!match) {
    throw new Error('invalid digest: expected sha256:[a-f0-9]{64} or [a-f0-9]{64}');
  }

  return match[1];
}

function nowIso() {
  return new Date().toISOString();
}

function computeRefKey(symbolicRef, commit) {
  if (!symbolicRef && !commit) {
    throw new Error('computeRefKey requires symbolicRef or commit');
  }

  const ref = symbolicRef || `DETACHED:${commit}`;
  return {
    ref,
    refKey: digestJson(ref)
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(normalizeForJson(value), null, 2)}\n`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = {
  canonicalJson,
  normalizeForJson,
  digestJson,
  safeDigestKey,
  nowIso,
  computeRefKey,
  writeJson,
  readJson
};
