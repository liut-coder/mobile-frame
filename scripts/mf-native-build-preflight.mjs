import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const appPath = getOption('app', 'apps/showcase');
const platform = getOption('platform', 'all');
const selectedPlatforms = getSelectedPlatforms(platform);

const checks = [
  {
    id: 'rn.cli',
    message: 'React Native Community CLI is installed',
    pass: () => isFile('node_modules/@react-native-community/cli/build/bin.js')
  },
  {
    id: 'rn.app-config',
    message: `${appPath}/react-native.config.cjs exists`,
    pass: () => isFile(`${appPath}/react-native.config.cjs`)
  },
  {
    id: 'rn.metro-config',
    message: `${appPath}/metro.config.cjs exists`,
    pass: () => isFile(`${appPath}/metro.config.cjs`)
  },
  {
    id: 'rn.babel-config',
    message: `${appPath}/babel.config.cjs exists`,
    pass: () => isFile(`${appPath}/babel.config.cjs`)
  },
  ...androidChecks(),
  ...iosChecks()
];

const results = checks.map((check) => ({
  ...check,
  passed: Boolean(check.pass())
}));
const failed = results.filter((result) => !result.passed);

if (failed.length === 0) {
  console.log(`native build preflight passed for ${appPath} (${platform})`);
  process.exit(0);
}

console.log(`native build preflight pending for ${appPath} (${platform}): ${failed.length}/${results.length} check(s) missing`);
for (const result of failed) {
  console.log(`- ${result.id}: ${result.message}`);
}

if (strict) {
  console.error('native build preflight strict mode failed');
  process.exit(1);
}

function androidChecks() {
  if (!selectedPlatforms.has('android')) {
    return [];
  }

  return [
    {
      id: 'android.java',
      message: 'java 17 or newer is available on PATH',
      pass: () => getJavaMajorVersion('java') >= 17
    },
    {
      id: 'android.java-home',
      message: 'JAVA_HOME is unset or points to JDK 17 or newer',
      pass: () => isJavaHomeCompatible()
    },
    {
      id: 'android.sdk-root',
      message: 'ANDROID_HOME or ANDROID_SDK_ROOT points to an Android SDK',
      pass: () => Boolean(getAndroidSdkRoot())
    },
    {
      id: 'android.sdk-platform',
      message: `${appPath}/android compileSdkVersion platform is installed`,
      pass: () => {
        const sdkRoot = getAndroidSdkRoot();
        const compileSdkVersion = getAndroidBuildValue('compileSdkVersion');
        return Boolean(sdkRoot && compileSdkVersion && isDirectory(path.join(sdkRoot, 'platforms', `android-${compileSdkVersion}`), true));
      }
    },
    {
      id: 'android.sdk-build-tools',
      message: `${appPath}/android buildToolsVersion is installed`,
      pass: () => {
        const sdkRoot = getAndroidSdkRoot();
        const buildToolsVersion = getAndroidBuildValue('buildToolsVersion');
        return Boolean(sdkRoot && buildToolsVersion && isDirectory(path.join(sdkRoot, 'build-tools', buildToolsVersion), true));
      }
    },
    {
      id: 'android.gradle-wrapper',
      message: `${appPath}/android Gradle wrapper files exist`,
      pass: () =>
        isFile(`${appPath}/android/gradlew.bat`) &&
        isFile(`${appPath}/android/gradle/wrapper/gradle-wrapper.jar`) &&
        isFile(`${appPath}/android/gradle/wrapper/gradle-wrapper.properties`)
    },
    {
      id: 'android.gradle-distribution',
      message: 'Gradle is available globally or the wrapper distribution is already downloaded',
      pass: () => commandAvailable('gradle', ['--version']) || hasGradleWrapperDistribution()
    },
    {
      id: 'android.rn-gradle-plugin',
      message: 'React Native Gradle plugin is installed for pnpm workspace resolution',
      pass: () => isDirectory('node_modules/.pnpm/node_modules/@react-native/gradle-plugin')
    },
    {
      id: 'android.codegen',
      message: 'React Native codegen package is installed for pnpm workspace resolution',
      pass: () => isDirectory('node_modules/.pnpm/node_modules/@react-native/codegen')
    },
    {
      id: 'android.hermes-compiler',
      message: 'Hermes compiler package is installed for release bundling',
      pass: () => isDirectory('node_modules/.pnpm/node_modules/hermes-compiler/hermesc')
    }
  ];
}

function iosChecks() {
  if (!selectedPlatforms.has('ios')) {
    return [];
  }

  return [
    {
      id: 'ios.host',
      message: 'host platform is macOS for iOS builds',
      pass: () => process.platform === 'darwin'
    },
    {
      id: 'ios.xcodebuild',
      message: 'xcodebuild is available on PATH',
      pass: () => commandAvailable('xcodebuild', ['-version'])
    },
    {
      id: 'ios.cocoapods',
      message: 'CocoaPods pod command is available on PATH',
      pass: () => commandAvailable('pod', ['--version'])
    }
  ];
}

function getSelectedPlatforms(value) {
  if (value === 'all') {
    return new Set(['android', 'ios']);
  }

  if (value === 'android' || value === 'ios') {
    return new Set([value]);
  }

  console.error(`Unsupported platform "${value}". Expected one of: all, android, ios`);
  process.exit(1);
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

function commandAvailable(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  return result.status === 0;
}

function isJavaHomeCompatible() {
  if (!process.env.JAVA_HOME) {
    return true;
  }

  const executableName = process.platform === 'win32' ? 'java.exe' : 'java';
  const javaPath = path.join(process.env.JAVA_HOME, 'bin', executableName);
  return isFile(javaPath, true) && getJavaMajorVersion(javaPath) >= 17;
}

function getJavaMajorVersion(command) {
  const result = spawnSync(command, ['-version'], {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status !== 0) {
    return 0;
  }

  return parseJavaMajorVersion(`${result.stdout}\n${result.stderr}`);
}

function parseJavaMajorVersion(output) {
  const version = output.match(/version\s+"([^"]+)"/)?.[1];
  if (!version) {
    return 0;
  }

  const legacy = version.match(/^1\.(\d+)/);
  if (legacy) {
    return Number(legacy[1]);
  }

  return Number(version.split('.')[0]) || 0;
}

function getAndroidSdkRoot() {
  for (const candidate of [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT]) {
    if (candidate && isDirectory(candidate, true)) {
      return candidate;
    }
  }

  if (process.env.MF_NATIVE_PREFLIGHT_DISABLE_ANDROID_SDK_AUTO_DISCOVERY === '1') {
    return null;
  }

  for (const candidate of getDefaultAndroidSdkCandidates()) {
    if (isDirectory(candidate, true)) {
      return candidate;
    }
  }

  return null;
}

function getDefaultAndroidSdkCandidates() {
  const candidates = [];

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

function getAndroidBuildValue(name) {
  const target = resolve(`${appPath}/android/build.gradle`);
  if (!fs.existsSync(target)) {
    return null;
  }

  const source = fs.readFileSync(target, 'utf8');
  const quoted = source.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`));
  if (quoted) {
    return quoted[1];
  }

  const numeric = source.match(new RegExp(`${name}\\s*=\\s*(\\d+)`));
  return numeric?.[1] ?? null;
}

function hasGradleWrapperDistribution() {
  const propertiesPath = resolve(`${appPath}/android/gradle/wrapper/gradle-wrapper.properties`);
  if (!fs.existsSync(propertiesPath)) {
    return false;
  }

  const source = fs.readFileSync(propertiesPath, 'utf8');
  const distributionUrl = source.match(/^distributionUrl=(.+)$/m)?.[1];
  if (!distributionUrl) {
    return false;
  }

  const archiveName = path.basename(distributionUrl.replace(/\\:/g, ':'));
  const distributionName = archiveName.replace(/\.zip$/, '');
  const extractedName = distributionName.replace(/-bin$/, '');
  const gradleUserHome = process.env.GRADLE_USER_HOME || path.join(process.env.USERPROFILE || process.env.HOME || '', '.gradle');
  const distributionRoot = path.join(gradleUserHome, 'wrapper', 'dists', distributionName);

  return findGradleExecutable(distributionRoot, extractedName, 0);
}

function findGradleExecutable(directory, extractedName, depth) {
  if (depth > 5 || !fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    return false;
  }

  const gradleBin = path.join(directory, extractedName, 'bin', process.platform === 'win32' ? 'gradle.bat' : 'gradle');
  if (fs.existsSync(gradleBin)) {
    return true;
  }

  return fs.readdirSync(directory, { withFileTypes: true }).some((entry) => entry.isDirectory() && findGradleExecutable(path.join(directory, entry.name), extractedName, depth + 1));
}

function isDirectory(relativePath, absolute = false) {
  const target = absolute ? relativePath : resolve(relativePath);
  return fs.existsSync(target) && fs.statSync(target).isDirectory();
}

function isFile(relativePath, absolute = false) {
  const target = absolute ? relativePath : resolve(relativePath);
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

function resolve(relativePath) {
  return path.resolve(repoRoot, relativePath);
}
