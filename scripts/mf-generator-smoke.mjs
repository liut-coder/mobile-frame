import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smokeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-generator-smoke-'));

const tool = (name) => path.join(repoRoot, 'tools', name);
const workspaceCheck = path.join(repoRoot, 'scripts', 'mf-workspace-check.mjs');
const smokePath = (relativePath) => path.join(smokeRoot, relativePath);

try {
  prepareSmokeWorkspace();

  assertDryRunCreatesNoFiles();
  assertInvalidArgumentsFail();
  runGenerator('create-app.mjs', ['smoke-app', '--preset', 'operations']);
  runGenerator('create-module.mjs', ['smoke-module']);
  runGenerator('create-screen.mjs', ['module-sdk', 'SmokeList', '--type', 'list']);
  runGenerator('create-native-component.mjs', ['SmokePanel']);
  runGenerator('create-native-module.mjs', ['SmokeBridge']);
  assertDuplicateGenerationFails();

  assertFiles([
    'apps/smoke-app/package.json',
    'apps/smoke-app/app.json',
    'apps/smoke-app/index.js',
    'apps/smoke-app/tsconfig.json',
    'apps/smoke-app/src/index.ts',
    'apps/smoke-app/src/App.tsx',
    'packages/smoke-module/package.json',
    'packages/smoke-module/tsconfig.json',
    'packages/smoke-module/src/index.ts',
    'packages/module-sdk/src/screens/SmokeListScreen.tsx',
    'packages/module-sdk/src/screens/index.ts',
    'packages/ui-native/src/native-components/NativeSmokePanel.tsx',
    'packages/ui-native/src/native-modules/SmokeBridgeModule.ts'
  ]);

  assertJson('tsconfig.json', (config) => {
    const references = config.references?.map((reference) => reference.path) ?? [];
    assert(references.includes('./apps/smoke-app'), 'root tsconfig missing smoke app reference');
    assert(references.includes('./packages/smoke-module'), 'root tsconfig missing smoke module reference');
  });

  assertJson('apps/smoke-app/package.json', (manifest) => {
    assert(manifest.main === 'index.js', 'app generator package main must point to React Native entry');
  });

  assertJson('apps/smoke-app/app.json', (metadata) => {
    assert(metadata.name === 'SmokeApp', 'app generator app.json missing registry name');
    assert(metadata.displayName === 'Smoke App', 'app generator app.json missing display name');
  });

  assertJson('packages/module-sdk/package.json', (manifest) => {
    assert(manifest.dependencies?.['@mobile-frame/ui-native'] === 'workspace:*', 'screen generator missing ui-native dependency');
    assert(manifest.dependencies?.react === '19.2.7', 'screen generator missing react dependency');
    assert(manifest.dependencies?.['react-native'] === '0.85.3', 'screen generator missing react-native dependency');
  });

  assertJson('packages/module-sdk/tsconfig.json', (config) => {
    const references = config.references?.map((reference) => reference.path) ?? [];
    assert(config.compilerOptions?.jsx === 'react-jsx', 'screen generator missing jsx compiler option');
    assert(references.includes('../ui-native'), 'screen generator missing ui-native tsconfig reference');
  });

  assertTextIncludes('packages/ui-native/src/index.ts', [
    "export * from './native-components/NativeSmokePanel';",
    "export * from './native-modules/SmokeBridgeModule';"
  ]);
  assertTextIncludes('apps/smoke-app/index.js', [
    "import { AppRegistry } from 'react-native';",
    "import { name as appName } from './app.json';",
    'AppRegistry.registerComponent(appName, () => App);'
  ]);
  assertTextIncludes('packages/module-sdk/src/index.ts', ["export * from './screens';"]);

  runWorkspaceCheck();
  runTypeScriptBuild();

  console.log('generator smoke passed');
} finally {
  fs.rmSync(smokeRoot, { force: true, recursive: true });
}

function prepareSmokeWorkspace() {
  linkNodeModules();
  copyFile('tsconfig.base.json');
  writeJson('tsconfig.json', {
    files: [],
    references: [
      { path: './packages/design-tokens' },
      { path: './packages/core' },
      { path: './packages/module-sdk' },
      { path: './packages/ui-core' },
      { path: './packages/ui-native' },
      { path: './packages/app-shell' },
      { path: './packages/presets' }
    ]
  });

  for (const packageName of ['design-tokens', 'core', 'module-sdk', 'ui-core', 'ui-native', 'app-shell', 'presets']) {
    copyWorkspacePackage(packageName);
  }
}

function copyFile(relativePath) {
  const target = smokePath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, relativePath), target);
}

function copyDirectory(relativePath) {
  const target = smokePath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(path.join(repoRoot, relativePath), target, { recursive: true });
}

function copyWorkspacePackage(packageName) {
  copyFile(`packages/${packageName}/package.json`);
  copyFile(`packages/${packageName}/tsconfig.json`);
  copyDirectory(`packages/${packageName}/src`);
}

function linkNodeModules() {
  const source = path.join(repoRoot, 'node_modules');
  const target = smokePath('node_modules');
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(source, target, type);
}

function writeJson(relativePath, value) {
  const target = smokePath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runGenerator(scriptName, args) {
  const result = spawnSync(process.execPath, [tool(scriptName), ...args], {
    cwd: smokeRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${scriptName} failed in smoke workspace`);
  }

  return result;
}

function runGeneratorExpectFailure(scriptName, args, expectedMessage) {
  const result = spawnSync(process.execPath, [tool(scriptName), ...args], {
    cwd: smokeRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status === 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${scriptName} unexpectedly succeeded in smoke workspace`);
  }

  const output = `${result.stdout}\n${result.stderr}`;
  assert(output.includes(expectedMessage), `${scriptName} failure output missing: ${expectedMessage}`);
  return result;
}

function runTypeScriptBuild() {
  const tscBin = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
  const result = spawnSync(process.execPath, [tscBin, '-b'], {
    cwd: smokeRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error('generated smoke workspace failed TypeScript build');
  }
}

function runWorkspaceCheck() {
  const result = spawnSync(process.execPath, [workspaceCheck], {
    cwd: smokeRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error('generated smoke workspace failed workspace check');
  }
}

function assertFiles(relativePaths) {
  for (const relativePath of relativePaths) {
    assert(fs.existsSync(smokePath(relativePath)), `missing generated file: ${relativePath}`);
  }
}

function assertMissingFiles(relativePaths) {
  for (const relativePath of relativePaths) {
    assert(!fs.existsSync(smokePath(relativePath)), `dry-run wrote unexpected file: ${relativePath}`);
  }
}

function assertDryRunCreatesNoFiles() {
  runGenerator('create-app.mjs', ['dry-run-app', '--preset', 'minimal', '--dry-run']);
  runGenerator('create-module.mjs', ['dry-run-module', '--dry-run']);
  runGenerator('create-screen.mjs', ['module-sdk', 'DryRunList', '--type', 'list', '--dry-run']);
  runGenerator('create-native-component.mjs', ['DryRunPanel', '--dry-run']);
  runGenerator('create-native-module.mjs', ['DryRunBridge', '--dry-run']);

  assertMissingFiles([
    'apps/dry-run-app',
    'packages/dry-run-module',
    'packages/module-sdk/src/screens/DryRunListScreen.tsx',
    'packages/module-sdk/src/screens/index.ts',
    'packages/ui-native/src/native-components/NativeDryRunPanel.tsx',
    'packages/ui-native/src/native-modules/DryRunBridgeModule.ts'
  ]);

  assertJson('tsconfig.json', (config) => {
    const references = config.references?.map((reference) => reference.path) ?? [];
    assert(!references.includes('./apps/dry-run-app'), 'dry-run app updated root tsconfig');
    assert(!references.includes('./packages/dry-run-module'), 'dry-run module updated root tsconfig');
  });

  assertJson('tsconfig.base.json', (config) => {
    const paths = config.compilerOptions?.paths ?? {};
    assert(!paths['@mobile-frame/dry-run-module'], 'dry-run module updated tsconfig base path alias');
  });

  assertJson('packages/module-sdk/package.json', (manifest) => {
    assert(!manifest.dependencies?.['@mobile-frame/ui-native'], 'dry-run screen updated module-sdk dependencies');
    assert(!manifest.dependencies?.react, 'dry-run screen updated module-sdk react dependency');
    assert(!manifest.dependencies?.['react-native'], 'dry-run screen updated module-sdk react-native dependency');
  });

  assertJson('packages/module-sdk/tsconfig.json', (config) => {
    const references = config.references?.map((reference) => reference.path) ?? [];
    assert(config.compilerOptions?.jsx !== 'react-jsx', 'dry-run screen updated module-sdk jsx compiler option');
    assert(!references.includes('../ui-native'), 'dry-run screen updated module-sdk tsconfig reference');
  });

  assertTextExcludes('packages/module-sdk/src/index.ts', ["export * from './screens';"]);

  assertTextExcludes('packages/ui-native/src/index.ts', [
    "export * from './native-components/NativeDryRunPanel';",
    "export * from './native-modules/DryRunBridgeModule';"
  ]);
}

function assertInvalidArgumentsFail() {
  runGeneratorExpectFailure('create-app.mjs', ['bad-app', '--preset', 'enterprise'], 'Unsupported preset "enterprise"');
  runGeneratorExpectFailure('create-screen.mjs', ['module-sdk', 'BadScreen', '--type', 'wizard'], 'Unsupported screen type "wizard"');
  runGeneratorExpectFailure('create-screen.mjs', ['missing-module', 'BadScreen'], 'Missing directory: packages/missing-module');
}

function assertDuplicateGenerationFails() {
  runGeneratorExpectFailure('create-app.mjs', ['smoke-app'], 'Refusing to overwrite existing file(s): apps/smoke-app/package.json');
  runGeneratorExpectFailure('create-module.mjs', ['smoke-module'], 'Refusing to overwrite existing file(s): packages/smoke-module/package.json');
  runGeneratorExpectFailure('create-screen.mjs', ['module-sdk', 'SmokeList'], 'Refusing to overwrite existing file(s): packages/module-sdk/src/screens/SmokeListScreen.tsx');
  runGeneratorExpectFailure('create-native-component.mjs', ['SmokePanel'], 'Refusing to overwrite existing file(s): packages/ui-native/src/native-components/NativeSmokePanel.tsx');
  runGeneratorExpectFailure('create-native-module.mjs', ['SmokeBridge'], 'Refusing to overwrite existing file(s): packages/ui-native/src/native-modules/SmokeBridgeModule.ts');
}

function assertJson(relativePath, verifier) {
  verifier(JSON.parse(fs.readFileSync(smokePath(relativePath), 'utf8')));
}

function assertTextIncludes(relativePath, expectedLines) {
  const text = fs.readFileSync(smokePath(relativePath), 'utf8');
  for (const line of expectedLines) {
    assert(text.includes(line), `${relativePath} missing line: ${line}`);
  }
}

function assertTextExcludes(relativePath, unexpectedLines) {
  const text = fs.readFileSync(smokePath(relativePath), 'utf8');
  for (const line of unexpectedLines) {
    assert(!text.includes(line), `${relativePath} contains dry-run line: ${line}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
