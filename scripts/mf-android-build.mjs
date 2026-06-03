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

if (!['debug', 'release'].includes(variant)) {
  fail(`Unsupported Android variant "${variant}". Expected one of: debug, release`);
}

if (!fs.existsSync(androidDir)) {
  fail(`Android project directory is missing: ${relative(androidDir)}`);
}

if (!fs.existsSync(gradlePath)) {
  fail(`Gradle wrapper is missing: ${relative(gradlePath)}`);
}

if (variant === 'release' && releaseUsesDebugSigning() && !allowDebugReleaseSigning) {
  fail(
    [
      `${appPath} release build currently uses the debug signing config.`,
      'Pass --allow-debug-release-signing only for scaffold validation builds, or configure a real release signingConfig first.'
    ].join(' ')
  );
}

if (!skipPreflight) {
  runPreflight();
}

runGradleBuild();
const apkEvidence = verifyApkOutput();
writeEvidence(apkEvidence);

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

function releaseUsesDebugSigning() {
  const appBuildGradlePath = resolve(`${appPath}/android/app/build.gradle`);
  if (!fs.existsSync(appBuildGradlePath)) {
    return false;
  }

  const source = fs.readFileSync(appBuildGradlePath, 'utf8');
  const releaseBlock = source.match(/release\s*\{[\s\S]*?\n\s*\}/)?.[0] ?? '';
  return /signingConfig\s+signingConfigs\.debug/.test(releaseBlock);
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
