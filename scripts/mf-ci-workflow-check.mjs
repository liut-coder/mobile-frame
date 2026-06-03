import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const workflowPath = path.join(repoRoot, '.github/workflows/mobile-frame.yml');
const androidBuildScriptPath = path.join(repoRoot, 'scripts/mf-android-build.mjs');

const checks = [
  {
    id: 'ci.workflow-file',
    message: '.github/workflows/mobile-frame.yml exists',
    pass: (source) => source.length > 0
  },
  {
    id: 'ci.trigger-pr',
    message: 'workflow runs on pull_request',
    pass: (source) => hasLine(source, 'pull_request:')
  },
  {
    id: 'ci.trigger-main',
    message: 'workflow runs on pushes to main',
    pass: (source) => hasLine(source, '- main')
  },
  {
    id: 'ci.trigger-game-helper-app',
    message: 'workflow runs on pushes to game-helper-app',
    pass: (source) => hasLine(source, '- game-helper-app')
  },
  {
    id: 'ci.trigger-manual',
    message: 'workflow supports manual workflow_dispatch',
    pass: (source) => hasLine(source, 'workflow_dispatch:')
  },
  {
    id: 'ci.source-validation-job',
    message: 'source-validation job is configured',
    pass: (source) => hasLine(source, 'source-validation:')
  },
  {
    id: 'ci.source-validation-node',
    message: 'source-validation uses Node 22',
    pass: (source) => hasBlockValue(source, 'node-version: 22')
  },
  {
    id: 'ci.source-validation-pnpm',
    message: 'source-validation uses pnpm 11.5.0',
    pass: (source) => hasBlockValue(source, 'version: 11.5.0')
  },
  {
    id: 'ci.source-validation-command',
    message: 'source-validation runs mf:validate',
    pass: (source) => hasLine(source, 'run: pnpm run mf:validate')
  },
  {
    id: 'ci.android-job',
    message: 'showcase Android debug APK job is configured',
    pass: (source) => hasLine(source, 'showcase-android-debug:')
  },
  {
    id: 'ci.android-needs-source-validation',
    message: 'Android debug APK job depends on source-validation',
    pass: (source) => hasLine(source, 'needs: source-validation')
  },
  {
    id: 'ci.android-jdk',
    message: 'Android debug APK job uses JDK 17',
    pass: (source) => hasLine(source, 'java-version: 17')
  },
  {
    id: 'ci.android-sdk-action',
    message: 'Android SDK setup action is configured',
    pass: (source) => hasLine(source, 'uses: android-actions/setup-android@v3')
  },
  {
    id: 'ci.android-sdk-platform',
    message: 'Android SDK platform 36 is installed',
    pass: (source) => source.includes('"platforms;android-36"')
  },
  {
    id: 'ci.android-build-tools',
    message: 'Android build-tools 36.0.0 is installed',
    pass: (source) => source.includes('"build-tools;36.0.0"')
  },
  {
    id: 'ci.android-ndk',
    message: 'Android NDK 27.1.12297006 is installed',
    pass: (source) => source.includes('"ndk;27.1.12297006"')
  },
  {
    id: 'ci.android-build-script',
    message: 'Showcase debug APK job uses the unified Android build script',
    pass: (source) => hasLine(source, 'run: pnpm run mf:android-build:debug')
  },
  {
    id: 'ci.android-build-script-preflight',
    message: 'Android build script runs strict native build preflight before Gradle',
    pass: () => {
      if (!fs.existsSync(androidBuildScriptPath)) {
        return false;
      }
      const source = fs.readFileSync(androidBuildScriptPath, 'utf8');
      return (
        source.includes('scripts/mf-native-build-preflight.mjs') &&
        source.includes("'--platform', 'android'") &&
        source.includes("'--strict'")
      );
    }
  },
  {
    id: 'ci.runtime-evidence-report',
    message: 'Showcase Android debug APK job requires debug build evidence and writes a summary report',
    pass: (source) =>
      hasLine(
        source,
        'run: pnpm run mf:runtime-evidence -- --require android.debug-build-evidence --report data/runtime-evidence/runtime-evidence-report.json'
      )
  },
  {
    id: 'ci.android-artifact',
    message: 'debug APK and build evidence artifact upload is configured',
    pass: (source) =>
      hasLine(source, 'uses: actions/upload-artifact@v4') &&
      hasLine(source, 'name: mobile-frame-showcase-debug-apk') &&
      hasLine(source, 'apps/showcase/android/app/build/outputs/apk/debug/*.apk') &&
      hasLine(source, 'apps/showcase/android/app/build/outputs/apk/debug/output-metadata.json') &&
      hasLine(source, 'data/runtime-evidence/android/*-debug-build-evidence.json') &&
      hasLine(source, 'data/runtime-evidence/runtime-evidence-report.json') &&
      hasLine(source, 'if-no-files-found: error')
  },
  {
    id: 'ci.android-runtime-job',
    message: 'showcase Android emulator runtime job is configured',
    pass: (source) => hasLine(source, 'showcase-android-runtime:')
  },
  {
    id: 'ci.android-runtime-needs-debug',
    message: 'Android runtime job depends on the debug APK job',
    pass: (source) => hasLine(source, 'needs: showcase-android-debug')
  },
  {
    id: 'ci.android-runtime-timeout',
    message: 'Android runtime job has a timeout',
    pass: (source) => hasLine(source, 'timeout-minutes: 30')
  },
  {
    id: 'ci.android-runtime-download',
    message: 'Android runtime job downloads the debug APK artifact',
    pass: (source) =>
      hasLine(source, 'uses: actions/download-artifact@v4') &&
      hasLine(source, 'name: mobile-frame-showcase-debug-apk')
  },
  {
    id: 'ci.android-runtime-kvm',
    message: 'Android runtime job enables KVM permissions',
    pass: (source) => source.includes('99-kvm4all.rules') && source.includes('udevadm trigger --name-match=kvm')
  },
  {
    id: 'ci.android-runtime-emulator',
    message: 'Android runtime job launches an Android emulator',
    pass: (source) =>
      hasLine(source, 'uses: reactivecircus/android-emulator-runner@v2') &&
      hasLine(source, 'api-level: 35') &&
      hasLine(source, 'arch: x86_64')
  },
  {
    id: 'ci.android-runtime-command',
    message: 'Android runtime job installs and launches the debug APK',
    pass: (source) => hasLine(source, 'script: pnpm run mf:android-runtime-run')
  },
  {
    id: 'ci.android-runtime-report',
    message: 'Android runtime job requires runtime evidence and writes a summary report',
    pass: (source) =>
      hasLine(
        source,
        'run: pnpm run mf:runtime-evidence -- --require android.runtime-evidence --report data/runtime-evidence/runtime-evidence-report.json'
      )
  },
  {
    id: 'ci.android-runtime-artifact',
    message: 'Android runtime evidence artifact upload is configured',
    pass: (source) =>
      hasLine(source, 'name: mobile-frame-showcase-runtime-evidence') &&
      hasLine(source, 'data/runtime-evidence/android/*-runtime-evidence.json') &&
      hasLine(source, 'data/runtime-evidence/runtime-evidence-report.json') &&
      hasLine(source, 'if-no-files-found: error')
  }
];

if (!fs.existsSync(workflowPath)) {
  console.error('CI workflow check failed: .github/workflows/mobile-frame.yml is missing');
  process.exit(1);
}

const workflowSource = fs.readFileSync(workflowPath, 'utf8');
const results = checks.map((check) => ({
  ...check,
  passed: Boolean(check.pass(workflowSource))
}));
const failed = results.filter((result) => !result.passed);

if (failed.length === 0) {
  console.log('CI workflow check passed');
  process.exit(0);
}

console.error(`CI workflow check failed with ${failed.length} issue(s):`);
for (const result of failed) {
  console.error(`- ${result.id}: ${result.message}`);
}
process.exit(1);

function hasLine(source, expectedLine) {
  return source.split(/\r?\n/).some((line) => line.trim() === expectedLine);
}

function hasBlockValue(source, expectedLine) {
  return source.split(/\r?\n/).some((line) => line.trim() === expectedLine);
}
