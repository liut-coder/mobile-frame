import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes('--strict');

const requiredIgnorePatterns = [
  '**/ios/Pods/',
  '**/ios/build/',
  '**/android/.gradle/',
  '**/android/.kotlin/',
  '**/android/app/.cxx/',
  '**/android/build/',
  '**/android/app/build/'
];

const checks = [
  {
    id: 'source.gitignore',
    message: '.gitignore exists',
    pass: () => isFile('.gitignore')
  },
  {
    id: 'source.native-build-ignores',
    message: '.gitignore covers nested native dependency and build outputs',
    pass: () => hasRequiredIgnorePatterns()
  },
  {
    id: 'source.git-worktree',
    message: 'current directory is inside a Git worktree',
    pass: () => isInsideGitWorktree()
  },
  {
    id: 'source.git-remote',
    message: 'Git remote is configured for push',
    pass: () => hasGitRemote()
  }
];

const results = checks.map((check) => ({
  ...check,
  passed: Boolean(check.pass())
}));
const failed = results.filter((result) => !result.passed);

if (failed.length === 0) {
  console.log('source control preflight passed');
  process.exit(0);
}

console.log(`source control preflight pending: ${failed.length}/${results.length} check(s) missing`);
for (const result of failed) {
  console.log(`- ${result.id}: ${result.message}`);
}

if (strict) {
  console.error('source control preflight strict mode failed');
  process.exit(1);
}

function hasRequiredIgnorePatterns() {
  const ignorePath = path.join(repoRoot, '.gitignore');
  if (!fs.existsSync(ignorePath)) {
    return false;
  }

  const lines = fs
    .readFileSync(ignorePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  return requiredIgnorePatterns.every((pattern) => lines.includes(pattern));
}

function isInsideGitWorktree() {
  const result = runGit(['rev-parse', '--is-inside-work-tree']);
  return result.status === 0 && result.stdout.trim() === 'true';
}

function hasGitRemote() {
  if (!isInsideGitWorktree()) {
    return false;
  }

  const result = runGit(['remote']);
  return result.status === 0 && result.stdout.trim().length > 0;
}

function runGit(gitArgs) {
  return spawnSync('git', gitArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
}

function isFile(relativePath) {
  const target = path.join(repoRoot, relativePath);
  return fs.existsSync(target) && fs.statSync(target).isFile();
}
