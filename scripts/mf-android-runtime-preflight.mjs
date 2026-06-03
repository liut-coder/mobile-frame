import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const shouldInstall = args.includes('--install');
const shouldLaunch = args.includes('--launch');
const appPath = getOption('app', 'apps/showcase');
const explicitDevice = getOption('device', null);
const apkPath = resolve(getOption('apk', `${appPath}/android/app/build/outputs/apk/debug/app-debug.apk`));
const metadataPath = resolve(`${appPath}/android/app/build/outputs/apk/debug/output-metadata.json`);
const manifestPath = resolve(`${appPath}/android/app/src/main/AndroidManifest.xml`);

const adbCommand = getAdbCommand();
const metadata = readMetadata();
const devices = adbCommand ? getOnlineDevices(adbCommand) : [];
const selectedDevice = explicitDevice ?? devices[0]?.serial ?? null;

const checks = [
  {
    id: 'android.runtime-apk',
    message: `${relative(apkPath)} debug APK exists`,
    pass: () => isFile(apkPath)
  },
  {
    id: 'android.runtime-metadata',
    message: `${relative(metadataPath)} declares a debug APK and applicationId`,
    pass: () => hasDebugApkMetadata(metadata)
  },
  {
    id: 'android.runtime-launcher-manifest',
    message: `${relative(manifestPath)} declares a launcher activity`,
    pass: () => hasLauncherManifest()
  },
  {
    id: 'android.adb',
    message: 'adb is available from PATH, ANDROID_HOME, ANDROID_SDK_ROOT, or the default SDK path',
    pass: () => Boolean(adbCommand)
  },
  {
    id: 'android.device-online',
    message: 'at least one adb device is online',
    pass: () => Boolean(selectedDevice)
  }
];

const results = checks.map((check) => ({
  ...check,
  passed: Boolean(check.pass())
}));
const failed = results.filter((result) => !result.passed);

if (failed.length === 0) {
  console.log(`android runtime preflight passed for ${appPath}`);
  console.log(`- apk: ${relative(apkPath)}`);
  console.log(`- applicationId: ${metadata.applicationId}`);
  console.log(`- device: ${selectedDevice}`);
} else {
  console.log(`android runtime preflight pending for ${appPath}: ${failed.length}/${results.length} check(s) missing`);
  for (const result of failed) {
    console.log(`- ${result.id}: ${result.message}`);
  }
}

if (failed.length > 0) {
  if (strict || shouldInstall || shouldLaunch) {
    console.error('android runtime preflight strict mode failed');
    process.exit(1);
  }

  process.exit(0);
}

if (shouldInstall) {
  runAdbAction('install debug APK', ['install', '-r', '-d', apkPath]);
}

if (shouldLaunch) {
  runAdbAction('launch debug APK', ['shell', 'monkey', '-p', metadata.applicationId, '-c', 'android.intent.category.LAUNCHER', '1']);
  verifyForegroundPackage();
}

function runAdbAction(label, adbArgs) {
  const result = runAdb(adbArgs);
  if (result.status !== 0) {
    console.error(`${label} failed`);
    if (result.stdout.trim()) {
      console.error(result.stdout.trim());
    }
    if (result.stderr.trim()) {
      console.error(result.stderr.trim());
    }
    process.exit(result.status ?? 1);
  }

  console.log(`${label} passed`);
  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
}

function verifyForegroundPackage() {
  const result = runAdb(['shell', 'dumpsys', 'window']);
  const output = `${result.stdout}\n${result.stderr}`;

  if (result.status !== 0 || !output.includes(metadata.applicationId)) {
    console.error(`launch verification failed: ${metadata.applicationId} is not visible in dumpsys window output`);
    process.exit(result.status || 1);
  }

  console.log(`launch verification passed: ${metadata.applicationId} is foreground-visible`);
}

function runAdb(adbArgs) {
  return spawnSync(adbCommand, selectedDevice ? ['-s', selectedDevice, ...adbArgs] : adbArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: needsWindowsCommandShell(adbCommand),
    stdio: 'pipe'
  });
}

function readMetadata() {
  if (!fs.existsSync(metadataPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch {
    return {};
  }
}

function hasDebugApkMetadata(value) {
  return (
    value &&
    value.artifactType?.type === 'APK' &&
    value.variantName === 'debug' &&
    typeof value.applicationId === 'string' &&
    value.applicationId.length > 0 &&
    Array.isArray(value.elements) &&
    value.elements.some((element) => element.outputFile === path.basename(apkPath))
  );
}

function hasLauncherManifest() {
  if (!fs.existsSync(manifestPath)) {
    return false;
  }

  const source = fs.readFileSync(manifestPath, 'utf8');
  return (
    source.includes('android.intent.action.MAIN') &&
    source.includes('android.intent.category.LAUNCHER') &&
    source.includes('android:name=".MainActivity"')
  );
}

function getOnlineDevices(command) {
  const result = spawnSync(command, ['devices', '-l'], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: needsWindowsCommandShell(command),
    stdio: 'pipe'
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('List of devices'))
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    })
    .filter((device) => device.serial && device.state === 'device');
}

function getAdbCommand() {
  const executableName = process.platform === 'win32' ? 'adb.exe' : 'adb';

  if (process.env.ADB && commandAvailable(process.env.ADB)) {
    return process.env.ADB;
  }

  for (const sdkRoot of getAndroidSdkCandidates()) {
    const candidate = path.join(sdkRoot, 'platform-tools', executableName);
    if (isFile(candidate) && commandAvailable(candidate)) {
      return candidate;
    }
  }

  if (commandAvailable('adb')) {
    return 'adb';
  }

  return null;
}

function getAndroidSdkCandidates() {
  const candidates = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(Boolean);

  if (process.env.MF_ANDROID_RUNTIME_DISABLE_SDK_AUTO_DISCOVERY === '1') {
    return [...new Set(candidates)];
  }

  if (process.platform === 'win32') {
    if (process.env.LOCALAPPDATA) {
      candidates.push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
    }
    if (process.env.USERPROFILE) {
      candidates.push(path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk'));
    }
  } else if (process.env.HOME) {
    candidates.push(path.join(process.env.HOME, 'Library', 'Android', 'sdk'));
    candidates.push(path.join(process.env.HOME, 'Android', 'Sdk'));
  }

  return [...new Set(candidates)];
}

function commandAvailable(command) {
  const result = spawnSync(command, ['version'], {
    encoding: 'utf8',
    shell: needsWindowsCommandShell(command),
    stdio: 'pipe'
  });

  return result.status === 0;
}

function needsWindowsCommandShell(command) {
  return process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
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

function isFile(target) {
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

function resolve(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

function relative(target) {
  return path.relative(repoRoot, target).replace(/\\/g, '/');
}
