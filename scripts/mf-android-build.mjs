import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const appPath = getOption('app', 'apps/showcase');
const variant = getOption('variant', 'debug').toLowerCase();
const skipPreflight = args.includes('--skip-preflight');
const allowDebugReleaseSigning = args.includes('--allow-debug-release-signing');
const evidenceDir = resolve(getOption('evidence-dir', 'data/runtime-evidence/android'));
const androidDir = resolve(`${appPath}/android`);
const gradleExecutable = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradlePath = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const gradleTask = `:app:assemble${capitalize(variant)}`;
const androidReleaseSigningKeys = [
  'MF_ANDROID_RELEASE_STORE_FILE',
  'MF_ANDROID_RELEASE_STORE_PASSWORD',
  'MF_ANDROID_RELEASE_KEY_ALIAS',
  'MF_ANDROID_RELEASE_KEY_PASSWORD'
];
const releaseSigningStatus = variant === 'release' ? getReleaseSigningStatus() : null;

if (!['debug', 'release'].includes(variant)) {
  fail(`Unsupported Android variant "${variant}". Expected one of: debug, release`);
}

if (!fs.existsSync(androidDir)) {
  fail(`Android project directory is missing: ${relative(androidDir)}`);
}

if (!fs.existsSync(gradlePath)) {
  fail(`Gradle wrapper is missing: ${relative(gradlePath)}`);
}

if (variant === 'release') {
  validateReleaseSigning();
}

if (!skipPreflight) {
  runPreflight();
}

runGradleBuild();
const apkEvidence = verifyApkOutput();
writeEvidence(apkEvidence);

function validateReleaseSigning() {
  const releaseBlock = getReleaseBuildTypeBlock();
  const referencesReleaseSigning = /signingConfigs\.release/.test(releaseBlock);
  const referencesDebugSigning = /signingConfigs\.debug/.test(releaseBlock);

  if (releaseSigningStatus.partial) {
    fail(
      [
        `${appPath} release signing config is incomplete.`,
        `Missing: ${releaseSigningStatus.missing.join(', ')}.`,
        `Provide all of ${androidReleaseSigningKeys.join(', ')} or unset them before scaffold validation.`
      ].join(' ')
    );
  }

  if (releaseSigningStatus.complete) {
    if (!referencesReleaseSigning) {
      fail(`${appPath} release build does not reference signingConfigs.release; configure production release signing before building without scaffold mode.`);
    }

    if (!releaseSigningStatus.storeFileExists) {
      fail(`${appPath} release signing store file does not exist: ${relative(releaseSigningStatus.storeFilePath)}`);
    }

    return;
  }

  if (referencesDebugSigning && !allowDebugReleaseSigning) {
    fail(
      [
        `${appPath} release build currently uses the debug signing config.`,
        'Pass --allow-debug-release-signing only for scaffold validation builds, or configure real release signing first.'
      ].join(' ')
    );
  }

  if (!referencesDebugSigning) {
    fail(`${appPath} release signing config is not configured. Provide all of ${androidReleaseSigningKeys.join(', ')} before building release.`);
  }
}

function runPreflight() {
  const result = spawnSync(process.execPath, ['scripts/mf-native-build-preflight.mjs', '--app', appPath, '--platform', 'android', '--strict'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runGradleBuild() {
  console.log(`running Android ${variant} build for ${appPath}: ${gradleTask}`);

  const result = spawnSync(gradleExecutable, [gradleTask, '--no-daemon', '--stacktrace'], {
    cwd: androidDir,
    encoding: 'utf8',
    shell: needsWindowsCommandShell(gradleExecutable),
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    fail(`Android ${variant} build failed for ${appPath}`, result.status ?? 1);
  }
}

function verifyApkOutput() {
  const outputDir = resolve(`${appPath}/android/app/build/outputs/apk/${variant}`);
  const metadataPath = path.join(outputDir, 'output-metadata.json');

  if (!fs.existsSync(metadataPath)) {
    fail(`Gradle APK metadata is missing: ${relative(metadataPath)}`);
  }

  const metadata = readJson(metadataPath);
  if (metadata.artifactType?.type !== 'APK') {
    fail(`Gradle metadata does not describe an APK artifact: ${relative(metadataPath)}`);
  }

  if (metadata.variantName !== variant) {
    fail(`Gradle metadata variantName is "${metadata.variantName}", expected "${variant}"`);
  }

  if (typeof metadata.applicationId !== 'string' || metadata.applicationId.length === 0) {
    fail(`Gradle metadata is missing applicationId: ${relative(metadataPath)}`);
  }

  const apkElement = metadata.elements?.find((element) => {
    return typeof element.outputFile === 'string' && fs.existsSync(path.join(outputDir, element.outputFile));
  });

  if (!apkElement) {
    fail(`Gradle metadata does not point to an existing APK in ${relative(outputDir)}`);
  }

  const apkPath = path.join(outputDir, apkElement.outputFile);
  const apkStat = fs.statSync(apkPath);
  if (!apkStat.isFile() || apkStat.size <= 0) {
    fail(`APK output is empty or not a file: ${relative(apkPath)}`);
  }

  const evidence = {
    appPath,
    applicationId: metadata.applicationId,
    apkPath: relative(apkPath),
    apkSha256: sha256(apkPath),
    apkSizeBytes: apkStat.size,
    gradleTask,
    metadataPath: relative(metadataPath),
    platform: process.platform,
    signingMode: getSigningMode(),
    variant,
    versionCode: apkElement.versionCode ?? null,
    versionName: apkElement.versionName ?? null
  };

  console.log(`Android ${variant} APK verified`);
  console.log(`- apk: ${evidence.apkPath}`);
  console.log(`- applicationId: ${evidence.applicationId}`);
  console.log(`- sha256: ${evidence.apkSha256}`);

  return evidence;
}

function writeEvidence(apkEvidence) {
  fs.mkdirSync(evidenceDir, { recursive: true });

  const evidence = {
    ...apkEvidence,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version
  };
  const evidencePath = path.join(evidenceDir, `${safeName(appPath)}-${variant}-build-evidence.json`);

  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(`- evidence: ${relative(evidencePath)}`);
}

function getReleaseBuildTypeBlock() {
  const appBuildGradlePath = resolve(`${appPath}/android/app/build.gradle`);
  if (!fs.existsSync(appBuildGradlePath)) {
    return '';
  }

  const source = fs.readFileSync(appBuildGradlePath, 'utf8');
  const buildTypesBlock = getNamedBlock(source, 'buildTypes');
  return buildTypesBlock ? getNamedBlock(buildTypesBlock, 'release') : '';
}

function getNamedBlock(source, name) {
  const match = new RegExp(`\\b${escapeRegExp(name)}\\s*\\{`).exec(source);
  if (!match) {
    return '';
  }

  const openingBraceIndex = source.indexOf('{', match.index);
  let depth = 0;

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(match.index, index + 1);
      }
    }
  }

  return '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getReleaseSigningStatus() {
  const configured = androidReleaseSigningKeys.map((key) => ({
    key,
    value: getReleaseSigningValue(key)
  }));
  const missing = configured.filter((item) => !item.value).map((item) => item.key);
  const storeFile = configured.find((item) => item.key === 'MF_ANDROID_RELEASE_STORE_FILE')?.value ?? null;
  const storeFilePath = storeFile ? resolveReleaseStoreFilePath(storeFile) : null;

  return {
    complete: missing.length === 0,
    missing,
    partial: missing.length > 0 && missing.length < androidReleaseSigningKeys.length,
    storeFilePath,
    storeFileExists: Boolean(storeFilePath && fs.existsSync(storeFilePath) && fs.statSync(storeFilePath).isFile())
  };
}

function getReleaseSigningValue(key) {
  if (isNonEmptyString(process.env[key])) {
    return process.env[key];
  }

  for (const source of getAndroidSigningPropertySources()) {
    const value = source[key];
    if (isNonEmptyString(value)) {
      return value;
    }
  }

  return null;
}

function getAndroidSigningPropertySources() {
  return [
    readPropertiesFile(path.join(androidDir, 'local.properties')),
    readPropertiesFile(path.join(androidDir, 'gradle.properties')),
    readPropertiesFile(path.join(process.env.GRADLE_USER_HOME || path.join(process.env.HOME || process.env.USERPROFILE || '', '.gradle'), 'gradle.properties'))
  ];
}

function readPropertiesFile(target) {
  if (!target || !fs.existsSync(target)) {
    return {};
  }

  const values = {};
  for (const line of fs.readFileSync(target, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }

    const separatorIndex = trimmed.search(/[:=]/);
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

function resolveReleaseStoreFilePath(value) {
  return path.isAbsolute(value) ? value : path.resolve(androidDir, 'app', value);
}

function getSigningMode() {
  if (variant === 'debug') {
    return 'debug';
  }

  return releaseSigningStatus?.complete ? 'release' : 'debug-scaffold';
}

function readJson(target) {
  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (error) {
    fail(`Failed to read JSON from ${relative(target)}: ${error.message}`);
  }
}

function sha256(target) {
  return crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
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

function needsWindowsCommandShell(command) {
  return process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function safeName(value) {
  return value.replace(/\\/g, '/').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function resolve(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

function relative(target) {
  return path.relative(repoRoot, target).replace(/\\/g, '/');
}

function fail(message, status = 1) {
  console.error(message);
  process.exit(status);
}
