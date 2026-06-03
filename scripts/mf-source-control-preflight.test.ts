import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-source-control-preflight.mjs');

describe('mf-source-control-preflight', () => {
  it('reports missing Git metadata without failing by default', () => {
    withWorkspace((workspaceRoot) => {
      writeGitignore(workspaceRoot, requiredNativeIgnorePatterns());

      const result = runPreflight(workspaceRoot);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('source control preflight pending');
      expect(result.stdout).toContain('source.git-worktree');
      expect(result.stdout).toContain('source.git-remote');
    });
  });

  it('fails strict mode when Git metadata is missing', () => {
    withWorkspace((workspaceRoot) => {
      writeGitignore(workspaceRoot, requiredNativeIgnorePatterns());

      const result = runPreflight(workspaceRoot, ['--strict']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('source.git-worktree');
      expect(output).toContain('source control preflight strict mode failed');
    });
  });

  it('fails strict mode when native build ignore rules are incomplete', () => {
    withWorkspace((workspaceRoot) => {
      writeGitignore(workspaceRoot, ['node_modules/', 'dist/']);

      const result = runPreflight(workspaceRoot, ['--strict']);
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('source.native-build-ignores');
      expect(output).toContain('source control preflight strict mode failed');
    });
  });
});

function withWorkspace(verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-source-control-preflight-'));

  try {
    verify(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { force: true, recursive: true });
  }
}

function runPreflight(workspaceRoot: string, args: string[] = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
}

function writeGitignore(workspaceRoot: string, lines: string[]) {
  fs.writeFileSync(path.join(workspaceRoot, '.gitignore'), `${lines.join('\n')}\n`, 'utf8');
}

function requiredNativeIgnorePatterns() {
  return [
    'node_modules/',
    'dist/',
    '**/ios/Pods/',
    '**/ios/build/',
    '**/android/.gradle/',
    '**/android/.kotlin/',
    '**/android/app/.cxx/',
    '**/android/build/',
    '**/android/app/build/'
  ];
}
