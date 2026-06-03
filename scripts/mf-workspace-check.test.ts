import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

type FixtureOptions = {
  brokenExport?: boolean;
  missingDependency?: boolean;
  missingPathAlias?: boolean;
  missingReference?: boolean;
};

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-workspace-check.mjs');

describe('mf-workspace-check', () => {
  it('passes a consistent workspace fixture', () => {
    withWorkspace({}, (workspaceRoot) => {
      const result = runWorkspaceCheck(workspaceRoot);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('workspace check passed');
      expect(result.stderr).toBe('');
    });
  });

  it('reports manifest, reference, path alias, and export drift', () => {
    withWorkspace(
      {
        brokenExport: true,
        missingDependency: true,
        missingPathAlias: true,
        missingReference: true
      },
      (workspaceRoot) => {
        const result = runWorkspaceCheck(workspaceRoot);
        const output = `${result.stdout}\n${result.stderr}`;

        expect(result.status).toBe(1);
        expect(output).toContain('workspace check failed');
        expect(output).toContain('packages/feature/package.json missing dependency for @mobile-frame/core/native-modules');
        expect(output).toContain('packages/feature/tsconfig.json missing reference to packages/core');
        expect(output).toContain('tsconfig.base.json missing path alias @mobile-frame/core/native-modules');
        expect(output).toContain('packages/core/package.json export ./broken points to missing file');
      }
    );
  });
});

function withWorkspace(options: FixtureOptions, verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-workspace-check-'));

  try {
    createWorkspaceFixture(workspaceRoot, options);
    verify(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { force: true, recursive: true });
  }
}

function createWorkspaceFixture(workspaceRoot: string, options: FixtureOptions) {
  writeJson(workspaceRoot, 'tsconfig.json', {
    files: [],
    references: [{ path: './packages/core' }, { path: './packages/feature' }]
  });
  writeJson(workspaceRoot, 'tsconfig.base.json', {
    compilerOptions: {
      paths: {
        '@mobile-frame/core': ['packages/core/src/index.ts'],
        ...(options.missingPathAlias ? {} : { '@mobile-frame/core/native-modules': ['packages/core/src/native-modules.ts'] }),
        '@mobile-frame/feature': ['packages/feature/src/index.ts']
      }
    }
  });

  writePackage(workspaceRoot, 'packages/core', {
    name: '@mobile-frame/core',
    private: true,
    type: 'module',
    exports: {
      '.': './src/index.ts',
      './native-modules': './src/native-modules.ts',
      ...(options.brokenExport ? { './broken': './src/missing.ts' } : {})
    }
  });
  writeJson(workspaceRoot, 'packages/core/tsconfig.json', {
    extends: '../../tsconfig.base.json',
    include: ['src']
  });
  writeFile(workspaceRoot, 'packages/core/src/index.ts', 'export const coreValue = 1;\n');
  writeFile(workspaceRoot, 'packages/core/src/native-modules.ts', 'export const nativeValue = 1;\n');

  writePackage(workspaceRoot, 'packages/feature', {
    name: '@mobile-frame/feature',
    private: true,
    type: 'module',
    ...(options.missingDependency ? {} : { dependencies: { '@mobile-frame/core': 'workspace:*' } })
  });
  writeJson(workspaceRoot, 'packages/feature/tsconfig.json', {
    extends: '../../tsconfig.base.json',
    include: ['src'],
    references: options.missingReference ? [] : [{ path: '../core' }]
  });
  writeFile(
    workspaceRoot,
    'packages/feature/src/index.ts',
    "import { coreValue } from '@mobile-frame/core';\nimport { nativeValue } from '@mobile-frame/core/native-modules';\n\nexport const featureValue = coreValue + nativeValue;\n"
  );
}

function runWorkspaceCheck(workspaceRoot: string) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
}

function writePackage(workspaceRoot: string, relativePath: string, manifest: Record<string, unknown>) {
  writeJson(workspaceRoot, `${relativePath}/package.json`, manifest);
}

function writeJson(workspaceRoot: string, relativePath: string, value: Record<string, unknown>) {
  writeFile(workspaceRoot, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(workspaceRoot: string, relativePath: string, value: string) {
  const target = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, 'utf8');
}
