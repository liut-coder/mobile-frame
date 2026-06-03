import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-ios-build.mjs');

describe('mf-ios-build', () => {
  it('runs a Debug xcodebuild fixture and writes app bundle evidence', () => {
    withWorkspace((workspaceRoot) => {
      const binPath = path.join(workspaceRoot, 'bin');
      writeIosWorkspace(workspaceRoot);
      writeXcodebuildFixture(binPath);

      const result = runIosBuild(workspaceRoot, ['--configuration', 'Debug', '--skip-preflight', '--skip-pod-install'], {
        PATH: appendPath(binPath)
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status, output).toBe(0);
      expect(output).toContain('iOS Debug app bundle verified');
      expect(output).toContain('evidence: data/runtime-evidence/ios/apps-showcase-debug-build-evidence.json');

      const evidence = readJson(workspaceRoot, 'data/runtime-evidence/ios/apps-showcase-debug-build-evidence.json');
      expect(evidence.configuration).toBe('Debug');
      expect(evidence.scheme).toBe('MobileFrame');
      expect(evidence.appBundlePath).toBe('apps/showcase/ios/build/DerivedData/Build/Products/Debug-iphonesimulator/MobileFrame.app');
      expect(evidence.appSha256).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  it('runs a Release archive fixture and writes archive evidence', () => {
    withWorkspace((workspaceRoot) => {
      const binPath = path.join(workspaceRoot, 'bin');
      writeIosWorkspace(workspaceRoot);
      writeXcodebuildFixture(binPath);

      const result = runIosBuild(workspaceRoot, ['--configuration', 'Release', '--skip-preflight', '--skip-pod-install'], {
        PATH: appendPath(binPath)
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status, output).toBe(0);
      expect(output).toContain('iOS Release archive verified');

      const evidence = readJson(workspaceRoot, 'data/runtime-evidence/ios/apps-showcase-release-build-evidence.json');
      expect(evidence.configuration).toBe('Release');
      expect(evidence.archivePath).toBe('apps/showcase/ios/build/archive/MobileFrame.xcarchive');
      expect(evidence.archiveSha256).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  it('rejects unsupported configurations', () => {
    withWorkspace((workspaceRoot) => {
      writeIosWorkspace(workspaceRoot);

      const result = runIosBuild(workspaceRoot, ['--configuration', 'AdHoc', '--skip-preflight', '--skip-pod-install']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('Unsupported iOS configuration "Adhoc"');
    });
  });
});

function withWorkspace(verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-ios-build-'));

  try {
    verify(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { force: true, recursive: true });
  }
}

function runIosBuild(workspaceRoot: string, args: string[] = [], env: Record<string, string> = {}) {
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

function writeIosWorkspace(workspaceRoot: string) {
  writeJson(workspaceRoot, 'apps/showcase/app.json', {
    displayName: 'MobileFrame Showcase',
    name: 'MobileFrame'
  });
  writeFile(workspaceRoot, 'apps/showcase/ios/Podfile', "target 'MobileFrame' do\nend\n");
  writeFile(workspaceRoot, 'apps/showcase/ios/MobileFrame.xcodeproj/project.pbxproj', '// fixture project\n');
}

function writeXcodebuildFixture(binPath: string) {
  fs.mkdirSync(binPath, { recursive: true });

  if (process.platform === 'win32') {
    writeFile(
      path.dirname(binPath),
      `${path.basename(binPath)}/xcodebuild.cmd`,
      [
        '@echo off',
        'setlocal enabledelayedexpansion',
        'set MODE=build',
        'set CONFIG=Debug',
        'set SDK=iphonesimulator',
        'set SCHEME=MobileFrame',
        'set DERIVED=',
        'set ARCHIVE=',
        ':loop',
        'if "%1"=="" goto done',
        'if "%1"=="archive" set MODE=archive',
        'if "%1"=="-configuration" set CONFIG=%2& shift',
        'if "%1"=="-sdk" set SDK=%2& shift',
        'if "%1"=="-scheme" set SCHEME=%2& shift',
        'if "%1"=="-derivedDataPath" set DERIVED=%2& shift',
        'if "%1"=="-archivePath" set ARCHIVE=%2& shift',
        'shift',
        'goto loop',
        ':done',
        'if "%MODE%"=="archive" goto archive',
        'mkdir "%DERIVED%\\Build\\Products\\%CONFIG%-%SDK%\\%SCHEME%.app" 2>nul',
        'echo plist> "%DERIVED%\\Build\\Products\\%CONFIG%-%SDK%\\%SCHEME%.app\\Info.plist"',
        'echo binary> "%DERIVED%\\Build\\Products\\%CONFIG%-%SDK%\\%SCHEME%.app\\%SCHEME%"',
        'exit /b 0',
        ':archive',
        'mkdir "%ARCHIVE%\\Products\\Applications\\%SCHEME%.app" 2>nul',
        'echo plist> "%ARCHIVE%\\Products\\Applications\\%SCHEME%.app\\Info.plist"',
        'echo binary> "%ARCHIVE%\\Products\\Applications\\%SCHEME%.app\\%SCHEME%"',
        'exit /b 0',
        ''
      ].join('\n')
    );
    return;
  }

  const xcodebuildPath = path.join(binPath, 'xcodebuild');
  fs.writeFileSync(
    xcodebuildPath,
    [
      '#!/bin/sh',
      'set -eu',
      'mode=build',
      'configuration=Debug',
      'sdk=iphonesimulator',
      'scheme=MobileFrame',
      'derived=""',
      'archive=""',
      'while [ "$#" -gt 0 ]; do',
      '  case "$1" in',
      '    archive) mode=archive ;;',
      '    -configuration) configuration="$2"; shift ;;',
      '    -sdk) sdk="$2"; shift ;;',
      '    -scheme) scheme="$2"; shift ;;',
      '    -derivedDataPath) derived="$2"; shift ;;',
      '    -archivePath) archive="$2"; shift ;;',
      '  esac',
      '  shift',
      'done',
      'if [ "$mode" = "archive" ]; then',
      '  app="$archive/Products/Applications/$scheme.app"',
      'else',
      '  app="$derived/Build/Products/$configuration-$sdk/$scheme.app"',
      'fi',
      'mkdir -p "$app"',
      'printf "plist\\n" > "$app/Info.plist"',
      'printf "binary\\n" > "$app/$scheme"',
      ''
    ].join('\n'),
    'utf8'
  );
  fs.chmodSync(xcodebuildPath, 0o755);
}

function readJson(workspaceRoot: string, relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8'));
}

function appendPath(binPath: string) {
  const separator = process.platform === 'win32' ? ';' : ':';
  return [binPath, process.env.PATH].filter(Boolean).join(separator);
}

function writeJson(workspaceRoot: string, relativePath: string, value: Record<string, unknown>) {
  writeFile(workspaceRoot, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(root: string, relativePath: string, value: string) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, 'utf8');
}
