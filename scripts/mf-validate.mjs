import { spawnSync } from 'node:child_process';

const packageManager = process.env.npm_execpath
  ? [process.execPath, [process.env.npm_execpath]]
  : ['corepack', ['pnpm']];

const commands = [
  ['run', 'mf:workspace-check'],
  ['run', 'mf:native-readiness'],
  ['run', 'mf:native-build-preflight'],
  ['run', 'mf:android-runtime-preflight'],
  ['run', 'mf:runtime-evidence'],
  ['run', 'mf:source-control-preflight'],
  ['run', 'mf:docs-site:check'],
  ['run', 'mf:ci-workflow-check'],
  ['run', 'typecheck'],
  ['run', 'lint'],
  ['run', 'test'],
  ['run', 'mf:generator-smoke']
];

for (const args of commands) {
  const result = spawnSync(packageManager[0], [...packageManager[1], ...args], {
    stdio: 'inherit',
    shell: false
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
