import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-ios-export.mjs');

describe('mf-ios-export', () => {
  it('rejects missing ExportOptions.plist', () => {
    withWorkspace((workspaceRoot) => {
      writeIosArchiveWorkspace(workspaceRoot, { includeExportOptions: false });

      const result = runIosExport(workspaceRoot, ['--skip-preflight']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('ExportOptions.plist is missing');
    });
  });

  it('exports an IPA from an archive fixture and writes export evidence', () => {
    withWorkspace((workspaceRoot) => {
      const binPath = path.join(workspaceRoot, 'bin');
      writeIosArchiveWorkspace(workspaceRoot);
      writeXcodebuildFixture(binPath);

      const result = runIosExport(workspaceRoot, ['--skip-preflight'], {
        PATH: appendPath(binPath)
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status, output).toBe(0);
      expect(output).toContain('iOS IPA export verified');
      expect(output).toContain('evidence: data/runtime-evidence/ios/apps-showcase-export-evidence.json');

      const evidence = readJson(workspaceRoot, 'data/runtime-evidence/ios/apps-showcase-export-evidence.json');
      expect(evidence.appPath).toBe('apps/showcase');
      expect(evidence.archivePath).toBe('apps/showcase/ios/build/archive/MobileFrame.xcarchive');
      expect(evidence.exportOptionsPlist).toBe('apps/showcase/ios/ExportOptions.plist');
      expect(evidence.ipaPath).toBe('apps/showcase/ios/build/export/MobileFrame.ipa');
      expect(evidence.ipaSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(evidence.ipaSizeBytes).toBeGreaterThan(0);
    });
  });
});

function withWorkspace(verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-ios-export-'));

  try {
    verify(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { force: true, recursive: true });
  }
}

function runIosExport(workspaceRoot: string, args: string[] = [], env: Record<string, string> = {}) {
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

function writeIosArchiveWorkspace(workspaceRoot: string, options: { includeExportOptions?: boolean } = {}) {
  const includeExportOptions = options.includeExportOptions ?? true;

  writeJson(workspaceRoot, 'apps/showcase/app.json', {
    displayName: 'MobileFrame Showcase',
    name: 'MobileFrame'
  });
  writeFile(
    workspaceRoot,
    'apps/showcase/ios/build/archive/MobileFrame.xcarchive/Products/Applications/MobileFrame.app/Info.plist',
    'plist\n'
  );
  writeFile(
    workspaceRoot,
    'apps/showcase/ios/build/archive/MobileFrame.xcarchive/Products/Applications/MobileFrame.app/MobileFrame',
    'binary\n'
  );

  if (includeExportOptions) {
    writeFile(
      workspaceRoot,
      'apps/showcase/ios/ExportOptions.plist',
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<plist version="1.0">',
        '<dict>',
        '<key>method</key>',
        '<string>development</string>',
        '</dict>',
        '</plist>',
        ''
      ].join('\n')
    );
  }
}

function writeXcodebuildFixture(binPath: string) {
  fs.mkdirSync(binPath, { recursive: true });

  if (process.platform === 'win32') {
    writeFile(
      path.dirname(binPath),
      `${path.basename(binPath)}/xcodebuild.cmd`,
      [
        '@echo off',
        'set EXPORT=',
        ':loop',
        'if "%1"=="" goto done',
        'if "%1"=="-exportPath" set EXPORT=%2& shift',
        'shift',
        'goto loop',
        ':done',
        'mkdir "%EXPORT%" 2>nul',
        'echo ipa> "%EXPORT%\\MobileFrame.ipa"',
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
      'export_path=""',
      'while [ "$#" -gt 0 ]; do',
      '  if [ "$1" = "-exportPath" ]; then export_path="$2"; shift; fi',
      '  shift',
      'done',
      'mkdir -p "$export_path"',
      'printf "ipa\\n" > "$export_path/MobileFrame.ipa"',
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
