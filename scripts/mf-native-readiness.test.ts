import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-native-readiness.mjs');

describe('mf-native-readiness', () => {
  it('reports missing native project evidence without failing by default', () => {
    withWorkspace((workspaceRoot) => {
      writeShowcasePackage(workspaceRoot);

      const result = runReadiness(workspaceRoot);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('native readiness pending for apps/showcase');
      expect(result.stdout).toContain('js.entry');
      expect(result.stdout).toContain('ios.directory');
      expect(result.stdout).toContain('android.directory');
    });
  });

  it('fails strict mode when native project evidence is missing', () => {
    withWorkspace((workspaceRoot) => {
      writeShowcasePackage(workspaceRoot);

      const result = runReadiness(workspaceRoot, ['--strict']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('native readiness strict mode failed');
      expect(output).toContain('android.new-architecture');
    });
  });

  it('passes strict mode for a complete native project fixture', () => {
    withWorkspace((workspaceRoot) => {
      writeShowcasePackage(workspaceRoot);
      writeNativeFixture(workspaceRoot);

      const result = runReadiness(workspaceRoot, ['--strict']);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('native readiness passed for apps/showcase');
      expect(result.stderr).toBe('');
    });
  });
});

function withWorkspace(verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-native-readiness-'));

  try {
    verify(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { force: true, recursive: true });
  }
}

function runReadiness(workspaceRoot: string, args: string[] = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
}

function writeShowcasePackage(workspaceRoot: string) {
  writeJson(workspaceRoot, 'apps/showcase/package.json', {
    dependencies: {
      react: '19.2.7',
      'react-native': '0.85.3'
    },
    main: 'index.js',
    name: '@mobile-frame/showcase',
    private: true,
    type: 'module'
  });
}

function writeNativeFixture(workspaceRoot: string) {
  writeJson(workspaceRoot, 'apps/showcase/app.json', {
    displayName: 'MobileFrame Showcase',
    name: 'MobileFrame'
  });
  writeFile(
    workspaceRoot,
    'apps/showcase/index.js',
    "import { AppRegistry } from 'react-native';\nimport App from './src';\nimport { name as appName } from './app.json';\n\nAppRegistry.registerComponent(appName, () => App);\n"
  );
  writeFile(
    workspaceRoot,
    'apps/showcase/ios/Podfile',
    "ENV['RCT_NEW_ARCH_ENABLED'] = '1'\nuse_react_native!\n"
  );
  writeFile(workspaceRoot, 'apps/showcase/ios/MobileFrame.xcodeproj/project.pbxproj', '// xcode project\n');
  writeFile(workspaceRoot, 'apps/showcase/ios/MobileFrame/AppDelegate.swift', 'final class AppDelegate {}\n');

  writeFile(workspaceRoot, 'apps/showcase/android/settings.gradle', "pluginManagement { repositories { google() } }\n");
  writeFile(workspaceRoot, 'apps/showcase/android/build.gradle', "plugins { id 'com.android.application' version '8.0.0' apply false }\n");
  writeFile(workspaceRoot, 'apps/showcase/android/app/build.gradle', "plugins { id 'com.android.application'; id 'com.facebook.react' }\n");
  writeFile(workspaceRoot, 'apps/showcase/android/gradle.properties', 'newArchEnabled=true\n');
  writeFile(
    workspaceRoot,
    'apps/showcase/android/app/src/main/java/com/misk/mobileframe/MainActivity.kt',
    'class MainActivity\n'
  );
  writeFile(
    workspaceRoot,
    'apps/showcase/android/app/src/main/java/com/misk/mobileframe/MainApplication.kt',
    'class MainApplication\n'
  );
}

function writeJson(workspaceRoot: string, relativePath: string, value: Record<string, unknown>) {
  writeFile(workspaceRoot, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(workspaceRoot: string, relativePath: string, value: string) {
  const target = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, 'utf8');
}
