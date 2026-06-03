import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-runtime-evidence.mjs');

describe('mf-runtime-evidence', () => {
  it('reports missing evidence without failing by default', () => {
    withWorkspace((workspaceRoot) => {
      const result = runEvidenceCheck(workspaceRoot, ['--report', 'data/runtime-evidence/runtime-evidence-report.json']);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('runtime evidence pending for apps/showcase');
      expect(result.stdout).toContain('android.debug-build-evidence');
      expect(result.stdout).toContain('ios.release-build-evidence');
      expect(result.stdout).toContain('runtime evidence report: data/runtime-evidence/runtime-evidence-report.json');

      const report = readJson(workspaceRoot, 'data/runtime-evidence/runtime-evidence-report.json');
      expect(report.passed).toBe(false);
      expect(report.failed).toBe(6);
      expect(report.total).toBe(6);
    });
  });

  it('fails strict mode when evidence is missing', () => {
    withWorkspace((workspaceRoot) => {
      const result = runEvidenceCheck(workspaceRoot, ['--strict']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('runtime evidence strict mode failed');
      expect(output).toContain('android.runtime-evidence');
    });
  });

  it('fails when required evidence is missing', () => {
    withWorkspace((workspaceRoot) => {
      const result = runEvidenceCheck(workspaceRoot, ['--require', 'android.debug-build-evidence']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('runtime evidence required check failed');
      expect(output).toContain('android.debug-build-evidence');
    });
  });

  it('passes when required evidence exists even if unrelated evidence is missing', () => {
    withWorkspace((workspaceRoot) => {
      writeAndroidDebugEvidenceFixture(workspaceRoot);

      const result = runEvidenceCheck(workspaceRoot, [
        '--require',
        'android.debug-build-evidence',
        '--report',
        'data/runtime-evidence/runtime-evidence-report.json'
      ]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('runtime evidence pending for apps/showcase');
      expect(result.stdout).toContain('ios.release-build-evidence');

      const report = readJson(workspaceRoot, 'data/runtime-evidence/runtime-evidence-report.json');
      expect(report.passed).toBe(false);
      expect(report.failed).toBe(5);
      expect(report.required).toEqual(['android.debug-build-evidence']);
      expect(report.requiredFailed).toBe(0);
      expect(report.requiredPassed).toBe(true);
      expect(report.requiredTotal).toBe(1);
    });
  });

  it('rejects unknown required evidence ids', () => {
    withWorkspace((workspaceRoot) => {
      const result = runEvidenceCheck(workspaceRoot, ['--require', 'android.unknown-evidence']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('unknown required evidence id');
      expect(output).toContain('android.debug-build-evidence');
    });
  });

  it('passes when all platform evidence files match the expected schema', () => {
    withWorkspace((workspaceRoot) => {
      writeEvidenceFixture(workspaceRoot);

      const result = runEvidenceCheck(workspaceRoot, ['--strict', '--report', 'data/runtime-evidence/runtime-evidence-report.json']);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('runtime evidence passed for apps/showcase');
      expect(result.stdout).toContain('data/runtime-evidence/android/apps-showcase-debug-build-evidence.json');
      expect(result.stdout).toContain('data/runtime-evidence/ios/apps-showcase-release-build-evidence.json');

      const report = readJson(workspaceRoot, 'data/runtime-evidence/runtime-evidence-report.json');
      expect(report.passed).toBe(true);
      expect(report.failed).toBe(0);
      expect(report.passedCount).toBe(6);
    });
  });

  it('rejects malformed evidence files in strict mode', () => {
    withWorkspace((workspaceRoot) => {
      writeEvidenceFixture(workspaceRoot);
      writeJson(workspaceRoot, 'data/runtime-evidence/android/apps-showcase-runtime-evidence.json', {
        actions: [],
        appPath: 'apps/showcase'
      });

      const result = runEvidenceCheck(workspaceRoot, ['--strict']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('android.runtime-evidence');
      expect(output).toContain('runtime evidence strict mode failed');
    });
  });
});

function withWorkspace(verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-runtime-evidence-'));

  try {
    verify(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { force: true, recursive: true });
  }
}

function runEvidenceCheck(workspaceRoot: string, args: string[] = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
}

function writeEvidenceFixture(workspaceRoot: string) {
  writeAndroidDebugEvidenceFixture(workspaceRoot);

  writeJson(workspaceRoot, 'data/runtime-evidence/android/apps-showcase-release-build-evidence.json', {
    appPath: 'apps/showcase',
    applicationId: 'com.misk.mobileframe',
    apkPath: 'apps/showcase/android/app/build/outputs/apk/release/app-release.apk',
    apkSha256: sha('release'),
    apkSizeBytes: 14,
    generatedAt: '2026-06-03T00:00:00.000Z',
    gradleTask: ':app:assembleRelease',
    metadataPath: 'apps/showcase/android/app/build/outputs/apk/release/output-metadata.json',
    nodeVersion: 'v22.0.0',
    platform: 'linux',
    variant: 'release',
    versionCode: 1,
    versionName: '1.0'
  });

  writeJson(workspaceRoot, 'data/runtime-evidence/android/apps-showcase-runtime-evidence.json', {
    actions: [
      { label: 'install debug APK', passed: true, stdout: 'Success' },
      { label: 'launch debug APK', passed: true, stdout: 'Events injected: 1' },
      { label: 'launch foreground verification', passed: true, stdout: 'mCurrentFocus=com.misk.mobileframe/.MainActivity' }
    ],
    adbCommand: 'android-sdk/platform-tools/adb',
    appPath: 'apps/showcase',
    applicationId: 'com.misk.mobileframe',
    apkPath: 'apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk',
    apkSha256: sha('runtime'),
    apkSizeBytes: 12,
    device: 'fixture-device',
    generatedAt: '2026-06-03T00:00:00.000Z',
    metadataPath: 'apps/showcase/android/app/build/outputs/apk/debug/output-metadata.json',
    nodeVersion: 'v22.0.0',
    platform: 'linux'
  });

  writeJson(workspaceRoot, 'data/runtime-evidence/ios/apps-showcase-debug-build-evidence.json', {
    appBundlePath: 'apps/showcase/ios/build/DerivedData/Build/Products/Debug-iphonesimulator/MobileFrame.app',
    appPath: 'apps/showcase',
    appSha256: sha('ios-debug'),
    appSizeBytes: 22,
    binaryPath: 'apps/showcase/ios/build/DerivedData/Build/Products/Debug-iphonesimulator/MobileFrame.app/MobileFrame',
    configuration: 'Debug',
    generatedAt: '2026-06-03T00:00:00.000Z',
    infoPlistPath: 'apps/showcase/ios/build/DerivedData/Build/Products/Debug-iphonesimulator/MobileFrame.app/Info.plist',
    nodeVersion: 'v22.0.0',
    platform: 'darwin',
    projectName: 'MobileFrame',
    scheme: 'MobileFrame',
    sdk: 'iphonesimulator'
  });

  writeJson(workspaceRoot, 'data/runtime-evidence/ios/apps-showcase-release-build-evidence.json', {
    appBundlePath: 'apps/showcase/ios/build/archive/MobileFrame.xcarchive/Products/Applications/MobileFrame.app',
    appPath: 'apps/showcase',
    archivePath: 'apps/showcase/ios/build/archive/MobileFrame.xcarchive',
    archiveSha256: sha('ios-release'),
    archiveSizeBytes: 30,
    configuration: 'Release',
    generatedAt: '2026-06-03T00:00:00.000Z',
    nodeVersion: 'v22.0.0',
    platform: 'darwin',
    projectName: 'MobileFrame',
    scheme: 'MobileFrame',
    sdk: 'iphoneos'
  });

  writeJson(workspaceRoot, 'data/runtime-evidence/ios/apps-showcase-export-evidence.json', {
    appPath: 'apps/showcase',
    archivePath: 'apps/showcase/ios/build/archive/MobileFrame.xcarchive',
    exportOptionsPlist: 'apps/showcase/ios/ExportOptions.plist',
    exportPath: 'apps/showcase/ios/build/export',
    generatedAt: '2026-06-03T00:00:00.000Z',
    ipaPath: 'apps/showcase/ios/build/export/MobileFrame.ipa',
    ipaSha256: sha('ios-export'),
    ipaSizeBytes: 18,
    nodeVersion: 'v22.0.0',
    platform: 'darwin',
    projectName: 'MobileFrame',
    scheme: 'MobileFrame'
  });
}

function writeAndroidDebugEvidenceFixture(workspaceRoot: string) {
  writeJson(workspaceRoot, 'data/runtime-evidence/android/apps-showcase-debug-build-evidence.json', {
    appPath: 'apps/showcase',
    applicationId: 'com.misk.mobileframe',
    apkPath: 'apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk',
    apkSha256: sha(),
    apkSizeBytes: 12,
    generatedAt: '2026-06-03T00:00:00.000Z',
    gradleTask: ':app:assembleDebug',
    metadataPath: 'apps/showcase/android/app/build/outputs/apk/debug/output-metadata.json',
    nodeVersion: 'v22.0.0',
    platform: 'linux',
    variant: 'debug',
    versionCode: 1,
    versionName: '1.0'
  });
}

function writeJson(workspaceRoot: string, relativePath: string, value: Record<string, unknown>) {
  const target = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson(workspaceRoot: string, relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8'));
}

function sha(seed = 'debug') {
  return crypto.createHash('sha256').update(seed).digest('hex');
}
