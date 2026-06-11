const path = require('node:path');

const DEFAULT_REASON = 'matched high-risk pattern';
const BUILT_IN_HIGH_RISK_PATTERNS = [
  'compile.sh',
  'app.mk',
  'Dockerfile',
  '.github/**',
  'ci/**',
  'tools/module-map.yaml',
  'package.json',
  'package-lock.json',
  'bin/**',
  'lib/**',
  '**/*.mk',
  'Makefile*',
  '**/Makefile',
  'include/common/**',
  'proto/**',
  'shell/**',
  'packet/**',
  'mkpacket*',
  'mkpacket/**',
  'ssipacket*',
  'ssipacket/**',
  'sign*',
  'sign/**',
  'release/**',
  'upgrade_framework/**'
];

function parseModuleMapYaml(source) {
  if (typeof source !== 'string') {
    throw new TypeError('module-map yaml source must be a string');
  }

  const root = {};
  const stack = [{ indent: -1, container: root, key: null }];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const lineNumber = index + 1;

    if (rawLine.includes('\t')) {
      throw yamlError(lineNumber, 'tabs are not supported');
    }

    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) {
      continue;
    }

    const indent = rawLine.match(/^ */)[0].length;
    if (indent % 2 !== 0) {
      throw yamlError(lineNumber, 'indentation must use two spaces');
    }

    const text = rawLine.slice(indent);
    if (text.startsWith('- ')) {
      const parent = resolveParent(stack, indent, lineNumber);
      if (!Array.isArray(parent.container)) {
        throw yamlError(lineNumber, 'array item found outside an array');
      }
      const itemText = text.slice(2).trim();
      if (itemText.startsWith('- ')) {
        throw yamlError(lineNumber, 'nested sequences are not supported');
      }
      const itemMatch = /^([A-Za-z0-9_.-]+):(?:\s*(.*))?$/.exec(itemText);
      if (itemMatch) {
        const item = {};
        const key = itemMatch[1];
        const rest = itemMatch[2] ?? '';
        if (rest === '') {
          item[key] = nextContainer(lines, index, indent);
        } else {
          item[key] = parseScalar(rest.trim(), lineNumber);
        }
        parent.container.push(item);
        stack.push({ indent, container: item, key: null });
      } else {
        parent.container.push(parseScalar(itemText, lineNumber));
      }
      continue;
    }

    const match = /^([A-Za-z0-9_.-]+):(?:\s*(.*))?$/.exec(text);
    if (!match) {
      throw yamlError(lineNumber, 'unsupported YAML syntax');
    }

    const key = match[1];
    const rest = match[2] ?? '';
    const parent = resolveParent(stack, indent, lineNumber);
    if (!isPlainObject(parent.container)) {
      throw yamlError(lineNumber, 'mapping entry found outside an object');
    }
    if (Object.prototype.hasOwnProperty.call(parent.container, key)) {
      throw yamlError(lineNumber, `duplicate key: ${key}`);
    }

    if (rest === '') {
      const child = nextContainer(lines, index, indent);
      parent.container[key] = child;
      stack.push({ indent, container: child, key });
    } else {
      parent.container[key] = parseScalar(rest.trim(), lineNumber);
    }
  }

  return root;
}

function resolveParent(stack, indent, lineNumber) {
  while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
    stack.pop();
  }

  const parent = stack[stack.length - 1];
  if (parent.indent === -1 && indent === 0) {
    return parent;
  }

  if (indent !== parent.indent + 2) {
    throw yamlError(lineNumber, 'invalid indentation level');
  }

  return parent;
}

function nextContainer(lines, currentIndex, indent) {
  for (let index = currentIndex + 1; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) {
      continue;
    }

    const nextIndent = rawLine.match(/^ */)[0].length;
    if (nextIndent <= indent) {
      return {};
    }

    return rawLine.slice(nextIndent).startsWith('- ') ? [] : {};
  }

  return {};
}

function parseScalar(value, lineNumber) {
  if (value === '{}') {
    return {};
  }
  if (value === '' || value === '[]' || value.includes('\t')) {
    throw yamlError(lineNumber, 'unsupported YAML scalar');
  }
  if (/^\*[A-Za-z0-9_-]/.test(value)) {
    throw yamlError(lineNumber, 'unsupported YAML alias');
  }
  if (value.startsWith('"') || value.startsWith("'")) {
    const quote = value[0];
    if (value.length < 2 || !value.endsWith(quote)) {
      throw yamlError(lineNumber, 'mismatched or unterminated quoted scalar');
    }
    const inner = value.slice(1, -1);
    if (inner.includes(quote)) {
      throw yamlError(lineNumber, 'mismatched or unterminated quoted scalar');
    }
    return inner;
  }
  if (value.endsWith('"') || value.endsWith("'")) {
    throw yamlError(lineNumber, 'mismatched or unterminated quoted scalar');
  }
  if (value.includes('#')) {
    throw yamlError(lineNumber, 'inline comments are not supported');
  }
  if (/[[\]{}&!|>@`]/.test(value)) {
    throw yamlError(lineNumber, 'unsupported YAML scalar');
  }
  return value;
}

function yamlError(lineNumber, message) {
  return new Error(`invalid module-map YAML at line ${lineNumber}: ${message}`);
}

function normalizeModuleMap(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('module map must be an object');
  }

  const rawModules = input.modules;
  if (!isPlainObject(rawModules)) {
    throw new TypeError('modules must be an object');
  }

  const modules = Object.keys(rawModules).sort().map((name) => normalizeModule(name, rawModules[name]));
  const riskRulesHigh = normalizeRiskRules(getRiskRulesHigh(input));

  return {
    modules,
    modulesByName: Object.fromEntries(modules.map((module) => [module.name, module])),
    riskRulesHigh
  };
}

function normalizeModule(name, rawModule) {
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) {
    throw new Error(`invalid module name: ${name}`);
  }
  if (!isPlainObject(rawModule)) {
    throw new TypeError(`module ${name} must be an object`);
  }

  const paths = normalizeStringArray(rawModule.paths, `module ${name} paths`)
    .map((value) => validateRepoRelativePath(value, `module ${name} paths`));
  const build = normalizeStringArray(rawModule.build, `module ${name} build`);
  const cwd = rawModule.cwd ?? '.';
  const timeoutSeconds = rawModule.timeout_seconds ?? rawModule.timeoutSeconds ?? 3600;
  const env = rawModule.env ?? {};
  const logName = rawModule.log_name ?? rawModule.logName ?? name;
  const hasDisplayName = Object.prototype.hasOwnProperty.call(rawModule, 'display_name');
  const hasDisplayNameAlias = Object.prototype.hasOwnProperty.call(rawModule, 'displayName');
  const displayName = hasDisplayName ? rawModule.display_name : hasDisplayNameAlias ? rawModule.displayName : name;

  if (!isRepoRelativePath(cwd)) {
    throw new Error(`module ${name} cwd must be a repository-relative path`);
  }
  if (!Number.isInteger(Number(timeoutSeconds)) || Number(timeoutSeconds) <= 0) {
    throw new Error(`module ${name} timeout_seconds must be greater than 0`);
  }
  if (!isPlainObject(env) || Object.values(env).some((value) => typeof value !== 'string')) {
    throw new TypeError(`module ${name} env values must be strings`);
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(logName)) {
    throw new Error(`module ${name} log_name must be safe for a log filename`);
  }
  if (typeof displayName !== 'string') {
    throw new TypeError(`module ${name} display_name must be a string`);
  }

  return {
    name,
    display_name: displayName,
    paths,
    cwd,
    build,
    timeout_seconds: Number(timeoutSeconds),
    env,
    log_name: logName
  };
}

function getRiskRulesHigh(input) {
  const hasRiskRules = Object.prototype.hasOwnProperty.call(input, 'risk_rules');
  const hasRiskRulesAlias = Object.prototype.hasOwnProperty.call(input, 'riskRules');
  if (!hasRiskRules && !hasRiskRulesAlias) {
    return [];
  }

  const riskRules = hasRiskRules ? input.risk_rules : input.riskRules;
  if (!isPlainObject(riskRules)) {
    throw new TypeError('risk_rules must be an object when provided');
  }

  return riskRules.high ?? [];
}

function normalizeRiskRules(configuredRules) {
  if (!Array.isArray(configuredRules)) {
    throw new TypeError('risk_rules.high must be an array when provided');
  }

  const rules = BUILT_IN_HIGH_RISK_PATTERNS.map((pattern) => ({
    level: 'high',
    pattern,
    reason: `built-in high-risk rule: ${pattern}`,
    source: 'built-in'
  }));

  for (const rule of configuredRules) {
    if (typeof rule === 'string') {
      rules.push({ level: 'high', pattern: validateRepoRelativePath(rule, 'risk_rules.high pattern'), reason: DEFAULT_REASON, source: 'module-map' });
    } else if (isPlainObject(rule) && typeof rule.pattern === 'string' && typeof rule.reason === 'string') {
      rules.push({ level: 'high', pattern: validateRepoRelativePath(rule.pattern, 'risk_rules.high pattern'), reason: rule.reason, source: 'module-map' });
    } else {
      throw new TypeError('risk_rules.high entries must be strings or { pattern, reason } objects');
    }
  }

  return dedupeRules(rules);
}

function dedupeRules(rules) {
  const seen = new Set();
  const out = [];
  for (const rule of rules) {
    const key = `${rule.level}\0${rule.pattern}\0${rule.reason}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(rule);
    }
  }
  return out;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new TypeError(`${fieldName} must be a non-empty string array`);
  }
  return [...value];
}

function pathMatches(filePath, pattern) {
  const normalizedPath = normalizeRepoPath(validateRepoRelativePath(filePath, 'path'));
  const normalizedPattern = normalizeRepoPath(validateRepoRelativePath(pattern, 'pattern'));
  const pathSegments = normalizedPath.split('/').filter(Boolean);
  const patternSegments = normalizedPattern.split('/').filter(Boolean);

  if (!normalizedPattern.includes('/')) {
    return matchSegment(path.basename(normalizedPath), normalizedPattern);
  }

  return matchSegments(pathSegments, patternSegments);
}

function matchSegments(pathSegments, patternSegments) {
  if (patternSegments.length === 0) {
    return pathSegments.length === 0;
  }

  const [patternHead, ...patternRest] = patternSegments;
  if (patternHead === '**') {
    if (patternRest.length === 0) {
      return pathSegments.length > 0;
    }
    if (matchSegments(pathSegments, patternRest)) {
      return true;
    }
    return pathSegments.length > 0 && matchSegments(pathSegments.slice(1), patternSegments);
  }

  return pathSegments.length > 0
    && matchSegment(pathSegments[0], patternHead)
    && matchSegments(pathSegments.slice(1), patternRest);
}

function matchSegment(segment, pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[^/]*');
  return new RegExp(`^${escaped}$`).test(segment);
}

function findRiskMatches(filePaths, riskRulesHigh) {
  const matches = [];
  const seen = new Set();
  for (const filePath of filePaths) {
    const normalizedFilePath = normalizeRepoPath(filePath);
    for (const rule of riskRulesHigh) {
      if (!pathMatches(filePath, rule.pattern)) {
        continue;
      }

      const key = `${normalizedFilePath}\0${rule.level}\0${rule.pattern}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          file: normalizedFilePath,
          risk_level: rule.level,
          pattern: rule.pattern,
          reason: rule.reason
        });
      }
    }
  }
  return matches;
}

function normalizeRepoPath(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError('path and pattern values must be non-empty strings');
  }
  if (value.startsWith('/')) {
    throw new Error(`repository paths must be relative: ${value}`);
  }
  return value.replaceAll('\\', '/').replace(/\/+/g, '/');
}

function isRepoRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  const normalized = value.replaceAll('\\', '/');
  return !path.posix.isAbsolute(normalized)
    && !path.win32.isAbsolute(value)
    && !normalized.split('/').includes('..');
}

function validateRepoRelativePath(value, fieldName) {
  if (!isRepoRelativePath(value)) {
    throw new Error(`${fieldName} must be a repository-relative path`);
  }
  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

module.exports = {
  BUILT_IN_HIGH_RISK_PATTERNS,
  parseModuleMapYaml,
  normalizeModuleMap,
  pathMatches,
  findRiskMatches
};
