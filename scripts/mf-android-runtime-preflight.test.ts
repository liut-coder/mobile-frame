import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-android-runtime-preflight.mjs');

describe('mf-android-runtime-preflight', () => {
  it('reports missing runtime evidence without failing by default', () => {
    withWorkspace((workspaceRoot) => {
      const result = runPreflight(workspaceRoot, [], {
        ANDROID_HOME: '',
        ANDROID_SDK_ROOT: '',
        MF_ANDROID_RUNTIME_DISABLE_SDK_AUTO_DISCOVERY: '1',
        PATH: path.join(workspaceRoot, 'empty-bin')
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('android runtime preflight pending for apps/showcase');
      expect(result.stdout).toContain('android.runtime-apk');
      expect(result.stdout).toContain('android.adb');
      expect(result.stdout).toContain('android.device-online');
    });
  });

  it('fails strict mode when runtime evidence is missing', () => {
    withWorkspace((workspaceRoot) => {
      const result = runPreflight(workspaceRoot, ['--strict'], {
        ANDROID_HOME: '',
        ANDROID_SDK_ROOT: '',
        MF_ANDROID_RUNTIME_DISABLE_SDK_AUTO_DISCOVERY: '1',
        PATH: path.join(workspaceRoot, 'empty-bin')
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('android.runtime-apk');
      expect(output).toContain('android runtime preflight strict mode failed');
    });
  });

  it('passes strict mode when APK metadata, adb, and device evidence exist', () => {
    withWorkspace((workspaceRoot) => {
      const androidSdkPath = path.join(workspaceRoot, 'android-sdk');

      writeRuntimeFixture(workspaceRoot);
      const adbPath = writeAdbFixture(androidSdkPath);

      const result = runPreflight(workspaceRoot, ['--strict'], {
        ADB: adbPath,
        ANDROID_HOME: androidSdkPath,
        ANDROID_SDK_ROOT: '',
        MF_ANDROID_RUNTIME_DISABLE_SDK_AUTO_DISCOVERY: '1',
        PATH: path.join(workspaceRoot, 'empty-bin')
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('android runtime preflight passed for apps/showcase');
      expect(result.stdout).toContain('applicationId: com.misk.mobileframe');
      expect(result.stdout).toContain('device: fixture-device');
    });
  });

  it('can install and launch with a fixture adb command', () => {
    withWorkspace((workspaceRoot) => {
      const androidSdkPath = path.join(workspaceRoot, 'android-sdk');

      writeRuntimeFixture(workspaceRoot);
      const adbPath = writeAdbFixture(androidSdkPath);

      const result = runPreflight(workspaceRoot, ['--install', '--launch'], {
        ADB: adbPath,
        ANDROID_HOME: androidSdkPath,
        ANDROID_SDK_ROOT: '',
        MF_ANDROID_RUNTIME_DISABLE_SDK_AUTO_DISCOVERY: '1',
        PATH: path.join(workspaceRoot, 'empty-bin')
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('install debug APK passed');
      expect(result.stdout).toContain('launch debug APK passed');
      expect(result.stdout).toContain('launch verification passed: com.misk.mobileframe is foreground-visible');
    });
  });
});

function withWorkspace(verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-android-runtime-preflight-'));

  try {
    verify(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { force: true, recursive: true });
  }
}

function runPreflight(workspaceRoot: string, args: string[] = [], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env
    },
    stdio: 'pipe'
  });
}

function writeRuntimeFixture(workspaceRoot: string) {
  writeFile(workspaceRoot, 'apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk', 'apk\n');
  writeJson(workspaceRoot, 'apps/showcase/android/app/build/outputs/apk/debug/output-metadata.json', {
    artifactType: { kind: 'Directory', type: 'APK' },
    applicationId: 'com.misk.mobileframe',
    elements: [{ outputFile: 'app-debug.apk', type: 'SINGLE' }],
    variantName: 'debug',
    version: 3
  });
  writeFile(
    workspaceRoot,
    'apps/showcase/android/app/src/main/AndroidManifest.xml',
    '<manifest><application><activity android:name=".MainActivity"><intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter></activity></application></manifest>\n'
  );
}

function writeAdbFixture(androidSdkPath: string) {
  const adbPath = path.join(androidSdkPath, 'platform-tools', process.platform === 'win32' ? 'adb.cmd' : 'adb');
  fs.mkdirSync(path.dirname(adbPath), { recursive: true });

  if (process.platform === 'win32') {
    fs.writeFileSync(
      adbPath,
      [
        '@echo off',
        'if "%1"=="version" echo Android Debug Bridge version 1.0.41& exit /b 0',
        'if "%1"=="devices" echo List of devices attached& echo fixture-device device product:test model:test device:test transport_id:1& exit /b 0',
        'if "%1"=="-s" if "%3"=="install" echo Success& exit /b 0',
        'if "%1"=="install" echo Success& exit /b 0',
        'if "%1"=="-s" if "%3"=="shell" if "%4"=="monkey" echo Events injected: 1& exit /b 0',
        'if "%1"=="shell" if "%2"=="monkey" echo Events injected: 1& exit /b 0',
        'if "%1"=="-s" if "%3"=="shell" if "%4"=="dumpsys" echo mCurrentFocus=Window{u0 com.misk.mobileframe/.MainActivity}& exit /b 0',
        'if "%1"=="shell" if "%2"=="dumpsys" echo mCurrentFocus=Window{u0 com.misk.mobileframe/.MainActivity}& exit /b 0',
        'exit /b 1',
        ''
      ].join('\n'),
      'utf8'
    );
    return adbPath;
  }

  fs.writeFileSync(
    adbPath,
    [
      '#!/bin/sh',
      'if [ "$1" = "version" ]; then echo "Android Debug Bridge version 1.0.41"; exit 0; fi',
      'if [ "$1" = "devices" ]; then printf "List of devices attached\\nfixture-device device product:test model:test device:test transport_id:1\\n"; exit 0; fi',
      'if [ "$1" = "-s" ] && [ "$3" = "install" ]; then echo "Success"; exit 0; fi',
      'if [ "$1" = "install" ]; then echo "Success"; exit 0; fi',
      'if [ "$1" = "-s" ] && [ "$3" = "shell" ] && [ "$4" = "monkey" ]; then echo "Events injected: 1"; exit 0; fi',
      'if [ "$1" = "shell" ] && [ "$2" = "monkey" ]; then echo "Events injected: 1"; exit 0; fi',
      'if [ "$1" = "-s" ] && [ "$3" = "shell" ] && [ "$4" = "dumpsys" ]; then echo "mCurrentFocus=Window{u0 com.misk.mobileframe/.MainActivity}"; exit 0; fi',
      'if [ "$1" = "shell" ] && [ "$2" = "dumpsys" ]; then echo "mCurrentFocus=Window{u0 com.misk.mobileframe/.MainActivity}"; exit 0; fi',
      'exit 1',
      ''
    ].join('\n'),
    'utf8'
  );
  fs.chmodSync(adbPath, 0o755);
  return adbPath;
}

function writeJson(workspaceRoot: string, relativePath: string, value: Record<string, unknown>) {
  writeFile(workspaceRoot, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(workspaceRoot: string, relativePath: string, value: string) {
  const target = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, 'utf8');
}
