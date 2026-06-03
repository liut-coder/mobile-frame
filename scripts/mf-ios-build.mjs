import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const appPath = getOption('app', 'apps/showcase');
const configuration = capitalize(getOption('configuration', 'Debug'));
const skipPreflight = args.includes('--skip-preflight');
const skipPodInstall = args.includes('--skip-pod-install');
const sdk = getOption('sdk', configuration === 'Release' ? 'iphoneos' : 'iphonesimulator');
const projectName = getOption('project', getProjectName());
const scheme = getOption('scheme', projectName);
const evidenceDir = resolve(getOption('evidence-dir', 'data/runtime-evidence/ios'));
const iosDir = resolve(`${appPath}/ios`);
const projectPath = path.join(iosDir, `${projectName}.xcodeproj`);
const derivedDataPath = resolve(getOption('derived-data-path', `${appPath}/ios/build/DerivedData`));
const archivePath = resolve(getOption('archive-path', `${appPath}/ios/build/archive/${scheme}.xcarchive`));

if (!['Debug', 'Release'].includes(configuration)) {
  fail(`Unsupported iOS configuration "${configuration}". Expected one of: Debug, Release`);
}

if (!fs.existsSync(iosDir)) {
  fail(`iOS project directory is missing: ${relative(iosDir)}`);
}

if (!fs.existsSync(projectPath)) {
  fail(`Xcode project is missing: ${relative(projectPath)}`);
}

if (!skipPreflight) {
  runPreflight();
}

if (!skipPodInstall) {
  runPodInstall();
}

if (configuration === 'Release') {
  runXcodebuild(['archive', '-archivePath', archivePath]);
  const evidence = verifyArchiveOutput();
  writeEvidence(evidence);
} else {
  runXcodebuild(['build', '-derivedDataPath', derivedDataPath]);
  const evidence = verifyDebugOutput();
  writeEvidence(evidence);
}

function runPreflight() {
  const result = spawnSync(process.execPath, ['scripts/mf-native-build-preflight.mjs', '--app', appPath, '--platform', 'ios', '--strict'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPodInstall() {
  const result = spawnSync('pod', ['install'], {
    cwd: iosDir,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    fail(`pod install failed for ${relative(iosDir)}`, result.status ?? 1);
  }
}

function runXcodebuild(buildArgs) {
  const xcodeArgs = [
    '-project',
    `${projectName}.xcodeproj`,
    '-scheme',
    scheme,
    '-configuration',
    configuration,
    '-sdk',
    sdk,
    ...buildArgs
  ];

  console.log(`running iOS ${configuration} build for ${appPath}: xcodebuild ${xcodeArgs.join(' ')}`);

  const result = spawnSync('xcodebuild', xcodeArgs, {
    cwd: iosDir,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    fail(`iOS ${configuration} build failed for ${appPath}`, result.status ?? 1);
  }
}

function verifyDebugOutput() {
  const appDir = path.join(derivedDataPath, 'Build', 'Products', `${configuration}-${sdk}`);
  const appBundlePath = path.join(appDir, `${scheme}.app`);

  if (!isDirectory(appBundlePath)) {
    fail(`iOS app bundle is missing: ${relative(appBundlePath)}`);
  }

  const infoPlistPath = path.join(appBundlePath, 'Info.plist');
  const appBinaryPath = path.join(appBundlePath, scheme);
  const appSizeBytes = directorySize(appBundlePath);

  if (appSizeBytes <= 0) {
    fail(`iOS app bundle is empty: ${relative(appBundlePath)}`);
  }

  const evidence = {
    appBundlePath: relative(appBundlePath),
    appPath,
    appSha256: hashDirectory(appBundlePath),
    appSizeBytes,
    binaryPath: fs.existsSync(appBinaryPath) ? relative(appBinaryPath) : null,
    configuration,
    infoPlistPath: fs.existsSync(infoPlistPath) ? relative(infoPlistPath) : null,
    platform: process.platform,
    projectName,
    scheme,
    sdk
  };

  console.log(`iOS ${configuration} app bundle verified`);
  console.log(`- app: ${evidence.appBundlePath}`);
  console.log(`- sha256: ${evidence.appSha256}`);

  return evidence;
}

function verifyArchiveOutput() {
  if (!isDirectory(archivePath)) {
    fail(`iOS archive is missing: ${relative(archivePath)}`);
  }

  const appBundlePath = path.join(archivePath, 'Products', 'Applications', `${scheme}.app`);
  if (!isDirectory(appBundlePath)) {
    fail(`iOS archived app bundle is missing: ${relative(appBundlePath)}`);
  }

  const archiveSizeBytes = directorySize(archivePath);
  if (archiveSizeBytes <= 0) {
    fail(`iOS archive is empty: ${relative(archivePath)}`);
  }

  const evidence = {
    appBundlePath: relative(appBundlePath),
    appPath,
    archivePath: relative(archivePath),
    archiveSha256: hashDirectory(archivePath),
    archiveSizeBytes,
    configuration,
    platform: process.platform,
    projectName,
    scheme,
    sdk
  };

  console.log(`iOS ${configuration} archive verified`);
  console.log(`- archive: ${evidence.archivePath}`);
  console.log(`- sha256: ${evidence.archiveSha256}`);

  return evidence;
}

function writeEvidence(buildEvidence) {
  fs.mkdirSync(evidenceDir, { recursive: true });

  const evidence = {
    ...buildEvidence,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version
  };
  const evidencePath = path.join(evidenceDir, `${safeName(appPath)}-${configuration.toLowerCase()}-build-evidence.json`);

  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(`- evidence: ${relative(evidencePath)}`);
}

function getProjectName() {
  const appJsonPath = resolve(`${appPath}/app.json`);
  if (!fs.existsSync(appJsonPath)) {
    return 'MobileFrame';
  }

  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    return appJson.name ?? 'MobileFrame';
  } catch {
    return 'MobileFrame';
  }
}

function directorySize(target) {
  let total = 0;
  for (const filePath of listFiles(target)) {
    total += fs.statSync(filePath).size;
  }
  return total;
}

function hashDirectory(target) {
  const hash = crypto.createHash('sha256');
  for (const filePath of listFiles(target)) {
    hash.update(path.relative(target, filePath).replace(/\\/g, '/'));
    hash.update('\0');
    hash.update(fs.readFileSync(filePath));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function listFiles(target) {
  const files = [];
  if (!fs.existsSync(target)) {
    return files;
  }

  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const absolutePath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files.sort();
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

function isDirectory(target) {
  return fs.existsSync(target) && fs.statSync(target).isDirectory();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
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
