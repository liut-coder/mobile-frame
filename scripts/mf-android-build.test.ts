import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-android-build.mjs');

describe('mf-android-build', () => {
  it('fails release builds that still use debug signing unless explicitly allowed', () => {
    withWorkspace((workspaceRoot) => {
      writeAndroidBuildWorkspace(workspaceRoot);

      const result = runAndroidBuild(workspaceRoot, ['--variant', 'release', '--skip-preflight']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('release build currently uses the debug signing config');
    });
  });

  it('runs a debug Gradle build and writes build evidence', () => {
    withWorkspace((workspaceRoot) => {
      writeAndroidBuildWorkspace(workspaceRoot);

      const result = runAndroidBuild(workspaceRoot, ['--variant', 'debug', '--skip-preflight']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status, output).toBe(0);
      expect(output).toContain('Android debug APK verified');
      expect(output).toContain('evidence: data/runtime-evidence/android/apps-showcase-debug-build-evidence.json');

      const evidence = readJson(workspaceRoot, 'data/runtime-evidence/android/apps-showcase-debug-build-evidence.json');
      expect(evidence.variant).toBe('debug');
      expect(evidence.applicationId).toBe('com.misk.mobileframe');
      expect(evidence.apkPath).toBe('apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk');
      expect(evidence.apkSha256).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  it('runs a scaffold release build when debug signing is explicitly allowed', () => {
    withWorkspace((workspaceRoot) => {
      writeAndroidBuildWorkspace(workspaceRoot);

      const result = runAndroidBuild(workspaceRoot, ['--variant', 'release', '--skip-preflight', '--allow-debug-release-signing']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status, output).toBe(0);
      expect(output).toContain('Android release APK verified');

      const evidence = readJson(workspaceRoot, 'data/runtime-evidence/android/apps-showcase-release-build-evidence.json');
      expect(evidence.variant).toBe('release');
      expect(evidence.gradleTask).toBe(':app:assembleRelease');
      expect(evidence.apkPath).toBe('apps/showcase/android/app/build/outputs/apk/release/app-release.apk');
    });
  });
});

function withWorkspace(verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-android-build-'));

  try {
    verify(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { force: true, recursive: true });
  }
}

function runAndroidBuild(workspaceRoot: string, args: string[] = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
}

function writeAndroidBuildWorkspace(workspaceRoot: string) {
  writeFile(workspaceRoot, 'apps/showcase/android/gradlew.bat', '@echo off\n');
  writeFile(workspaceRoot, 'apps/showcase/android/gradle/wrapper/gradle-wrapper.jar', 'jar\n');
  writeFile(
    workspaceRoot,
    'apps/showcase/android/app/build.gradle',
    [
      'android {',
      '  signingConfigs {',
      '    debug {}',
      '  }',
      '  buildTypes {',
      '    release {',
      '      signingConfig signingConfigs.debug',
      '    }',
      '  }',
      '}',
      ''
    ].join('\n')
  );

  if (process.platform === 'win32') {
    writeFile(
      workspaceRoot,
      'apps/showcase/android/gradlew.bat',
      [
        '@echo off',
        'set TASK=%1',
        'if "%TASK%"==":app:assembleDebug" call :write debug app-debug.apk',
        'if "%TASK%"==":app:assembleRelease" call :write release app-release.apk',
        'exit /b 0',
        ':write',
        'set VARIANT=%1',
        'set APK=%2',
        'mkdir app\\build\\outputs\\apk\\%VARIANT% 2>nul',
        'echo apk> app\\build\\outputs\\apk\\%VARIANT%\\%APK%',
        'echo {"artifactType":{"kind":"Directory","type":"APK"},"applicationId":"com.misk.mobileframe","variantName":"%VARIANT%","elements":[{"outputFile":"%APK%","type":"SINGLE","versionCode":1,"versionName":"1.0"}]}> app\\build\\outputs\\apk\\%VARIANT%\\output-metadata.json',
        'exit /b 0',
        ''
      ].join('\n')
    );
    return;
  }

  const gradlewPath = path.join(workspaceRoot, 'apps/showcase/android/gradlew');
  fs.mkdirSync(path.dirname(gradlewPath), { recursive: true });
  fs.writeFileSync(
    gradlewPath,
    [
      '#!/bin/sh',
      'set -eu',
      'case "$1" in',
      '  :app:assembleDebug) variant=debug; apk=app-debug.apk ;;',
      '  :app:assembleRelease) variant=release; apk=app-release.apk ;;',
      '  *) exit 1 ;;',
      'esac',
      'mkdir -p "app/build/outputs/apk/$variant"',
      'printf "apk\\n" > "app/build/outputs/apk/$variant/$apk"',
      'cat > "app/build/outputs/apk/$variant/output-metadata.json" <<EOF',
      '{"artifactType":{"kind":"Directory","type":"APK"},"applicationId":"com.misk.mobileframe","variantName":"$variant","elements":[{"outputFile":"$apk","type":"SINGLE","versionCode":1,"versionName":"1.0"}]}',
      'EOF',
      ''
    ].join('\n'),
    'utf8'
  );
  fs.chmodSync(gradlewPath, 0o755);
}

function readJson(workspaceRoot: string, relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8'));
}

function writeFile(workspaceRoot: string, relativePath: string, value: string) {
  const target = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, 'utf8');
}
