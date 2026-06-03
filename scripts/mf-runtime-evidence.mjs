import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const appPath = getOption('app', 'apps/showcase');
const appKey = safeName(appPath);
const evidenceRoot = getOption('evidence-root', 'data/runtime-evidence');
const reportPath = getOption('report', null);
const requiredIds = getOptions('require');

const evidenceChecks = [
  {
    id: 'android.debug-build-evidence',
    message: 'Android debug APK build evidence exists and matches schema',
    path: `${evidenceRoot}/android/${appKey}-debug-build-evidence.json`,
    pass: (evidence) =>
      evidence.appPath === appPath &&
      evidence.variant === 'debug' &&
      evidence.gradleTask === ':app:assembleDebug' &&
      isNonEmptyString(evidence.applicationId) &&
      isPositiveNumber(evidence.apkSizeBytes) &&
      isSha256(evidence.apkSha256) &&
      isNonEmptyString(evidence.apkPath)
  },
  {
    id: 'android.release-build-evidence',
    message: 'Android release APK build evidence exists and matches schema',
    path: `${evidenceRoot}/android/${appKey}-release-build-evidence.json`,
    pass: (evidence) =>
      evidence.appPath === appPath &&
      evidence.variant === 'release' &&
      evidence.gradleTask === ':app:assembleRelease' &&
      isNonEmptyString(evidence.applicationId) &&
      isPositiveNumber(evidence.apkSizeBytes) &&
      isSha256(evidence.apkSha256) &&
      isNonEmptyString(evidence.apkPath)
  },
  {
    id: 'android.runtime-evidence',
    message: 'Android runtime install/launch evidence exists and matches schema',
    path: `${evidenceRoot}/android/${appKey}-runtime-evidence.json`,
    pass: (evidence) =>
      evidence.appPath === appPath &&
      isNonEmptyString(evidence.applicationId) &&
      isNonEmptyString(evidence.device) &&
      isPositiveNumber(evidence.apkSizeBytes) &&
      isSha256(evidence.apkSha256) &&
      Array.isArray(evidence.actions) &&
      hasAction(evidence.actions, 'install debug APK') &&
      hasAction(evidence.actions, 'launch debug APK') &&
      hasAction(evidence.actions, 'launch foreground verification')
  },
  {
    id: 'ios.debug-build-evidence',
    message: 'iOS Debug app bundle build evidence exists and matches schema',
    path: `${evidenceRoot}/ios/${appKey}-debug-build-evidence.json`,
    pass: (evidence) =>
      evidence.appPath === appPath &&
      evidence.configuration === 'Debug' &&
      isNonEmptyString(evidence.scheme) &&
      isPositiveNumber(evidence.appSizeBytes) &&
      isSha256(evidence.appSha256) &&
      isNonEmptyString(evidence.appBundlePath)
  },
  {
    id: 'ios.release-build-evidence',
    message: 'iOS Release archive build evidence exists and matches schema',
    path: `${evidenceRoot}/ios/${appKey}-release-build-evidence.json`,
    pass: (evidence) =>
      evidence.appPath === appPath &&
      evidence.configuration === 'Release' &&
      isNonEmptyString(evidence.scheme) &&
      isPositiveNumber(evidence.archiveSizeBytes) &&
      isSha256(evidence.archiveSha256) &&
      isNonEmptyString(evidence.archivePath) &&
      isNonEmptyString(evidence.appBundlePath)
  },
  {
    id: 'ios.export-evidence',
    message: 'iOS IPA export evidence exists and matches schema',
    path: `${evidenceRoot}/ios/${appKey}-export-evidence.json`,
    pass: (evidence) =>
      evidence.appPath === appPath &&
      isNonEmptyString(evidence.scheme) &&
      isPositiveNumber(evidence.ipaSizeBytes) &&
      isSha256(evidence.ipaSha256) &&
      isNonEmptyString(evidence.archivePath) &&
      isNonEmptyString(evidence.exportOptionsPlist) &&
      isNonEmptyString(evidence.exportPath) &&
      isNonEmptyString(evidence.ipaPath)
  }
];

const results = evidenceChecks.map((check) => {
  const absolutePath = resolve(check.path);
  const evidence = readJsonIfPresent(absolutePath);

  return {
    ...check,
    path: normalizePath(check.path),
    passed: Boolean(evidence && check.pass(evidence))
  };
});

const unknownRequiredIds = requiredIds.filter((id) => !results.some((result) => result.id === id));
if (unknownRequiredIds.length > 0) {
  console.error(`runtime evidence check failed: unknown required evidence id(s): ${unknownRequiredIds.join(', ')}`);
  console.error(`known evidence ids: ${results.map((result) => result.id).join(', ')}`);
  process.exit(1);
}

const failed = results.filter((result) => !result.passed);
const requiredFailed = results.filter((result) => requiredIds.includes(result.id) && !result.passed);
const report = {
  appPath,
  failed: failed.length,
  generatedAt: new Date().toISOString(),
  passed: failed.length === 0,
  passedCount: results.length - failed.length,
  results: results.map((result) => ({
    id: result.id,
    message: result.message,
    passed: result.passed,
    path: result.path
  })),
  required: requiredIds,
  requiredFailed: requiredFailed.length,
  requiredPassed: requiredFailed.length === 0,
  requiredTotal: requiredIds.length,
  strict,
  total: results.length
};

if (failed.length === 0) {
  console.log(`runtime evidence passed for ${appPath}`);
  for (const result of results) {
    console.log(`- ${result.id}: ${result.path}`);
  }
  writeReport(report);
  process.exit(0);
}

console.log(`runtime evidence pending for ${appPath}: ${failed.length}/${results.length} check(s) missing`);
for (const result of failed) {
  console.log(`- ${result.id}: ${result.message} (${result.path})`);
}
writeReport(report);

if (requiredFailed.length > 0) {
  console.error(`runtime evidence required check failed: ${requiredFailed.length}/${requiredIds.length} required evidence check(s) missing`);
  for (const result of requiredFailed) {
    console.error(`- ${result.id}: ${result.message} (${result.path})`);
  }
  process.exit(1);
}

if (requiredIds.length > 0) {
  console.log(`runtime evidence required checks passed: ${requiredIds.join(', ')}`);
}

if (strict) {
  console.error('runtime evidence strict mode failed');
  process.exit(1);
}

function writeReport(value) {
  if (!reportPath) {
    return;
  }

  const target = resolve(reportPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  console.log(`- runtime evidence report: ${normalizePath(reportPath)}`);
}

function readJsonIfPresent(target) {
  if (!fs.existsSync(target)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch {
    return null;
  }
}

function hasAction(actions, label) {
  return actions.some((action) => action?.label === label && action.passed === true);
}

function isSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function getOption(name, fallback) {
  const equalsPrefix = `--${name}=`;
  const equalsValue = args.find((arg) => arg.startsWith(equalsPrefix));
  if (equalsValue) {
    return equalsValue.slice(equalsPrefix.length);
  }

  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) {
    return args[index + 1];
  }

  return fallback;
}

function getOptions(name) {
  const values = [];
  const equalsPrefix = `--${name}=`;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg.startsWith(equalsPrefix)) {
      values.push(...splitOptionValues(arg.slice(equalsPrefix.length)));
      continue;
    }

    if (arg === `--${name}`) {
      const next = args[index + 1];
      if (next && !next.startsWith('--')) {
        values.push(...splitOptionValues(next));
        index += 1;
      }
    }
  }

  return [...new Set(values)];
}

function splitOptionValues(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolve(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

function safeName(value) {
  return value.replace(/\\/g, '/').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}
