import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const appPath = getOption('app', 'apps/showcase');

const checks = [
  {
    id: 'package.react-native',
    message: `${appPath}/package.json declares react-native`,
    pass: () => hasDependency(`${appPath}/package.json`, 'react-native')
  },
  {
    id: 'package.main',
    message: `${appPath}/package.json main points to index.js`,
    pass: () => packageFieldEquals(`${appPath}/package.json`, 'main', 'index.js')
  },
  {
    id: 'app.json',
    message: `${appPath}/app.json declares app name and displayName`,
    pass: () => hasAppJson(`${appPath}/app.json`)
  },
  {
    id: 'js.entry',
    message: `${appPath}/index.js registers the React Native app`,
    pass: () => fileContains(`${appPath}/index.js`, /AppRegistry\.registerComponent/) && fileContains(`${appPath}/index.js`, /from\s+['"]\.\/app\.json['"]/)
  },
  {
    id: 'ios.directory',
    message: `${appPath}/ios directory exists`,
    pass: () => isDirectory(`${appPath}/ios`)
  },
  {
    id: 'ios.podfile',
    message: `${appPath}/ios/Podfile exists`,
    pass: () => isFile(`${appPath}/ios/Podfile`)
  },
  {
    id: 'ios.xcodeproj',
    message: `${appPath}/ios contains an Xcode project`,
    pass: () => directoryContains(`${appPath}/ios`, (entry) => entry.isDirectory() && entry.name.endsWith('.xcodeproj'))
  },
  {
    id: 'ios.app-delegate',
    message: `${appPath}/ios contains AppDelegate`,
    pass: () => findFile(`${appPath}/ios`, /AppDelegate\.(swift|m|mm)$/)
  },
  {
    id: 'ios.new-architecture',
    message: `${appPath}/ios/Podfile enables or declares New Architecture`,
    pass: () => fileContains(`${appPath}/ios/Podfile`, /RCT_NEW_ARCH_ENABLED|new_arch_enabled|fabric_enabled/i)
  },
  {
    id: 'android.directory',
    message: `${appPath}/android directory exists`,
    pass: () => isDirectory(`${appPath}/android`)
  },
  {
    id: 'android.settings',
    message: `${appPath}/android/settings.gradle exists`,
    pass: () => isFile(`${appPath}/android/settings.gradle`)
  },
  {
    id: 'android.root-build',
    message: `${appPath}/android/build.gradle exists`,
    pass: () => isFile(`${appPath}/android/build.gradle`)
  },
  {
    id: 'android.app-build',
    message: `${appPath}/android/app/build.gradle exists`,
    pass: () => isFile(`${appPath}/android/app/build.gradle`)
  },
  {
    id: 'android.main-activity',
    message: `${appPath}/android contains MainActivity`,
    pass: () => findFile(`${appPath}/android/app/src/main`, /MainActivity\.(kt|java)$/)
  },
  {
    id: 'android.main-application',
    message: `${appPath}/android contains MainApplication`,
    pass: () => findFile(`${appPath}/android/app/src/main`, /MainApplication\.(kt|java)$/)
  },
  {
    id: 'android.new-architecture',
    message: `${appPath}/android/gradle.properties enables New Architecture`,
    pass: () => fileContains(`${appPath}/android/gradle.properties`, /^\s*newArchEnabled\s*=\s*true\s*$/m)
  }
];

const results = checks.map((check) => ({
  ...check,
  passed: Boolean(check.pass())
}));
const failed = results.filter((result) => !result.passed);

if (failed.length === 0) {
  console.log(`native readiness passed for ${appPath}`);
  process.exit(0);
}

console.log(`native readiness pending for ${appPath}: ${failed.length}/${results.length} check(s) missing`);
for (const result of failed) {
  console.log(`- ${result.id}: ${result.message}`);
}

if (strict) {
  console.error('native readiness strict mode failed');
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

function hasDependency(relativePath, dependencyName) {
  const target = resolve(relativePath);
  if (!fs.existsSync(target)) {
    return false;
  }

  const manifest = JSON.parse(fs.readFileSync(target, 'utf8'));
  return Boolean(
    manifest.dependencies?.[dependencyName] ??
      manifest.devDependencies?.[dependencyName] ??
      manifest.peerDependencies?.[dependencyName] ??
      manifest.optionalDependencies?.[dependencyName]
  );
}

function packageFieldEquals(relativePath, fieldName, expectedValue) {
  const target = resolve(relativePath);
  if (!fs.existsSync(target)) {
    return false;
  }

  const manifest = JSON.parse(fs.readFileSync(target, 'utf8'));
  return manifest[fieldName] === expectedValue;
}

function hasAppJson(relativePath) {
  const target = resolve(relativePath);
  if (!fs.existsSync(target)) {
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(target, 'utf8'));
  return typeof metadata.name === 'string' && metadata.name.trim().length > 0 && typeof metadata.displayName === 'string' && metadata.displayName.trim().length > 0;
}

function isDirectory(relativePath) {
  const target = resolve(relativePath);
  return fs.existsSync(target) && fs.statSync(target).isDirectory();
}

function isFile(relativePath) {
  const target = resolve(relativePath);
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

function directoryContains(relativePath, predicate) {
  const target = resolve(relativePath);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return false;
  }

  return fs.readdirSync(target, { withFileTypes: true }).some(predicate);
}

function fileContains(relativePath, pattern) {
  const target = resolve(relativePath);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return false;
  }

  return pattern.test(fs.readFileSync(target, 'utf8'));
}

function findFile(relativePath, pattern) {
  const target = resolve(relativePath);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return false;
  }

  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const entryPath = path.join(target, entry.name);
    if (entry.isDirectory() && findFile(path.relative(repoRoot, entryPath), pattern)) {
      return true;
    }

    if (entry.isFile() && pattern.test(entry.name)) {
      return true;
    }
  }

  return false;
}

function resolve(relativePath) {
  return path.resolve(repoRoot, relativePath);
}
