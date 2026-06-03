import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mf-native-build-preflight.mjs');

describe('mf-native-build-preflight', () => {
  it('reports missing native build tools without failing by default', () => {
    withWorkspace((workspaceRoot) => {
      writeMinimalNativeBuildWorkspace(workspaceRoot);

      const result = runPreflight(workspaceRoot, ['--platform', 'android'], {
        ANDROID_HOME: '',
        ANDROID_SDK_ROOT: '',
        GRADLE_USER_HOME: path.join(workspaceRoot, 'empty-gradle-home'),
        MF_NATIVE_PREFLIGHT_DISABLE_ANDROID_SDK_AUTO_DISCOVERY: '1',
        PATH: path.join(workspaceRoot, 'empty-bin')
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('native build preflight pending for apps/showcase (android)');
      expect(result.stdout).toContain('android.java');
      expect(result.stdout).toContain('android.sdk-root');
      expect(result.stdout).toContain('android.gradle-distribution');
    });
  });

  it('fails strict mode when native build tools are missing', () => {
    withWorkspace((workspaceRoot) => {
      writeMinimalNativeBuildWorkspace(workspaceRoot);

      const result = runPreflight(workspaceRoot, ['--platform', 'android', '--strict'], {
        ANDROID_HOME: '',
        ANDROID_SDK_ROOT: '',
        GRADLE_USER_HOME: path.join(workspaceRoot, 'empty-gradle-home'),
        MF_NATIVE_PREFLIGHT_DISABLE_ANDROID_SDK_AUTO_DISCOVERY: '1',
        PATH: path.join(workspaceRoot, 'empty-bin')
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('native build preflight strict mode failed');
      expect(output).toContain('android.sdk-platform');
    });
  });

  it('passes strict Android mode when the build environment fixture is complete', () => {
    withWorkspace((workspaceRoot) => {
      const binPath = path.join(workspaceRoot, 'bin');
      const androidSdkPath = path.join(workspaceRoot, 'android-sdk');

      writeMinimalNativeBuildWorkspace(workspaceRoot);
      writeAndroidSdkFixture(androidSdkPath);
      writeGradleDistributionFixture(path.join(workspaceRoot, 'gradle-home'));
      writeCommand(binPath, 'java');
      writeCommand(binPath, 'gradle');

      const result = runPreflight(workspaceRoot, ['--platform', 'android', '--strict'], {
        ANDROID_HOME: androidSdkPath,
        ANDROID_SDK_ROOT: '',
        GRADLE_USER_HOME: path.join(workspaceRoot, 'gradle-home'),
        JAVA_HOME: '',
        PATH: appendPath(binPath)
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('native build preflight passed for apps/showcase (android)');
      expect(result.stderr).toBe('');
    });
  });

  it('fails strict Android mode when JAVA_HOME points to an incompatible JDK', () => {
    withWorkspace((workspaceRoot) => {
      const binPath = path.join(workspaceRoot, 'bin');
      const androidSdkPath = path.join(workspaceRoot, 'android-sdk');
      const incompatibleJavaHome = path.join(workspaceRoot, 'jdk-8');

      writeMinimalNativeBuildWorkspace(workspaceRoot);
      writeAndroidSdkFixture(androidSdkPath);
      writeGradleDistributionFixture(path.join(workspaceRoot, 'gradle-home'));
      writeCommand(binPath, 'java');
      writeCommand(binPath, 'gradle');
      fs.mkdirSync(path.join(incompatibleJavaHome, 'bin'), { recursive: true });

      const result = runPreflight(workspaceRoot, ['--platform', 'android', '--strict'], {
        ANDROID_HOME: androidSdkPath,
        ANDROID_SDK_ROOT: '',
        GRADLE_USER_HOME: path.join(workspaceRoot, 'gradle-home'),
        JAVA_HOME: incompatibleJavaHome,
        PATH: appendPath(binPath)
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('android.java-home');
      expect(output).toContain('native build preflight strict mode failed');
    });
  });

  it('fails strict Android mode when the configured Hermes command does not resolve from the app root', () => {
    withWorkspace((workspaceRoot) => {
      const binPath = path.join(workspaceRoot, 'bin');
      const androidSdkPath = path.join(workspaceRoot, 'android-sdk');

      writeMinimalNativeBuildWorkspace(workspaceRoot);
      writeAndroidSdkFixture(androidSdkPath);
      writeGradleDistributionFixture(path.join(workspaceRoot, 'gradle-home'));
      writeCommand(binPath, 'java');
      writeCommand(binPath, 'gradle');
      writeFile(
        workspaceRoot,
        'apps/showcase/android/app/build.gradle',
        'react { hermesCommand = "../../../../node_modules/.pnpm/node_modules/hermes-compiler/hermesc/%OS-BIN%/${hermescBinary}" }\n'
      );

      const result = runPreflight(workspaceRoot, ['--platform', 'android', '--strict'], {
        ANDROID_HOME: androidSdkPath,
        ANDROID_SDK_ROOT: '',
        GRADLE_USER_HOME: path.join(workspaceRoot, 'gradle-home'),
        JAVA_HOME: '',
        PATH: appendPath(binPath)
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).toBe(1);
      expect(output).toContain('android.hermes-compiler');
      expect(output).toContain('native build preflight strict mode failed');
    });
  });

  it('discovers the default Windows Android SDK path when SDK env vars are unset', () => {
    withWorkspace((workspaceRoot) => {
      const binPath = path.join(workspaceRoot, 'bin');
      const localAppDataPath = path.join(workspaceRoot, 'local-app-data');
      const androidSdkPath = path.join(localAppDataPath, 'Android', 'Sdk');

      writeMinimalNativeBuildWorkspace(workspaceRoot);
      writeAndroidSdkFixture(androidSdkPath);
      writeGradleDistributionFixture(path.join(workspaceRoot, 'gradle-home'));
      writeCommand(binPath, 'java');
      writeCommand(binPath, 'gradle');

      const result = runPreflight(workspaceRoot, ['--platform', 'android', '--strict'], {
        ANDROID_HOME: '',
        ANDROID_SDK_ROOT: '',
        GRADLE_USER_HOME: path.join(workspaceRoot, 'gradle-home'),
        JAVA_HOME: '',
        LOCALAPPDATA: localAppDataPath,
        PATH: appendPath(binPath)
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('native build preflight passed for apps/showcase (android)');
    });
  });
});

function withWorkspace(verify: (workspaceRoot: string) => void) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-frame-native-build-preflight-'));

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

function writeMinimalNativeBuildWorkspace(workspaceRoot: string) {
  writeFile(workspaceRoot, 'node_modules/@react-native-community/cli/build/bin.js', '#!/usr/bin/env node\n');
  writeFile(workspaceRoot, 'apps/showcase/react-native.config.cjs', 'module.exports = {};\n');
  writeFile(workspaceRoot, 'apps/showcase/metro.config.cjs', 'module.exports = {};\n');
  writeFile(workspaceRoot, 'apps/showcase/babel.config.cjs', 'module.exports = {};\n');
  writeFile(
    workspaceRoot,
    'apps/showcase/android/build.gradle',
    'buildscript { ext { buildToolsVersion = "36.0.0"; compileSdkVersion = 36 } }\n'
  );
  writeFile(workspaceRoot, 'apps/showcase/android/gradlew.bat', '@echo off\n');
  writeFile(workspaceRoot, 'apps/showcase/android/gradle/wrapper/gradle-wrapper.jar', 'jar\n');
  writeFile(
    workspaceRoot,
    'apps/showcase/android/gradle/wrapper/gradle-wrapper.properties',
    'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.3.1-bin.zip\n'
  );
  writeFile(
    workspaceRoot,
    'apps/showcase/android/app/build.gradle',
    'react { hermesCommand = "../../node_modules/.pnpm/node_modules/hermes-compiler/hermesc/%OS-BIN%/${hermescBinary}" }\n'
  );
  writeFile(workspaceRoot, 'node_modules/.pnpm/node_modules/@react-native/gradle-plugin/package.json', '{}\n');
  writeFile(workspaceRoot, 'node_modules/.pnpm/node_modules/@react-native/codegen/package.json', '{}\n');
  writeFile(workspaceRoot, 'node_modules/.pnpm/node_modules/hermes-compiler/hermesc/linux64-bin/hermesc', '\n');
  writeFile(workspaceRoot, 'node_modules/.pnpm/node_modules/hermes-compiler/hermesc/osx-bin/hermesc', '\n');
  writeFile(workspaceRoot, 'node_modules/.pnpm/node_modules/hermes-compiler/hermesc/win64-bin/hermesc', '\n');
  writeFile(workspaceRoot, 'node_modules/.pnpm/node_modules/hermes-compiler/hermesc/win64-bin/hermesc.exe', '\n');
}

function writeAndroidSdkFixture(androidSdkPath: string) {
  fs.mkdirSync(path.join(androidSdkPath, 'platforms', 'android-36'), { recursive: true });
  fs.mkdirSync(path.join(androidSdkPath, 'build-tools', '36.0.0'), { recursive: true });
}

function writeGradleDistributionFixture(gradleUserHome: string) {
  const executableName = process.platform === 'win32' ? 'gradle.bat' : 'gradle';
  const executablePath = path.join(
    gradleUserHome,
    'wrapper',
    'dists',
    'gradle-9.3.1-bin',
    'fixture',
    'gradle-9.3.1',
    'bin',
    executableName
  );

  fs.mkdirSync(path.dirname(executablePath), { recursive: true });
  fs.writeFileSync(executablePath, process.platform === 'win32' ? '@echo off\necho ok\n' : '#!/bin/sh\necho ok\n', 'utf8');
  if (process.platform !== 'win32') {
    fs.chmodSync(executablePath, 0o755);
  }
}

function writeCommand(binPath: string, name: string) {
  fs.mkdirSync(binPath, { recursive: true });

  if (process.platform === 'win32') {
    const output = name === 'java' ? 'echo java version "17.0.12" 1>&2' : 'echo ok';
    writeFile(binPath, `${name}.cmd`, `@echo off\n${output}\n`);
    return;
  }

  const target = path.join(binPath, name);
  const output = name === 'java' ? 'echo \'java version "17.0.12"\' >&2' : 'echo ok';
  fs.writeFileSync(target, `#!/bin/sh\n${output}\n`, 'utf8');
  fs.chmodSync(target, 0o755);
}

function appendPath(binPath: string) {
  const separator = process.platform === 'win32' ? ';' : ':';
  return [binPath, process.env.PATH].filter(Boolean).join(separator);
}

function writeFile(root: string, relativePath: string, value: string) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, 'utf8');
}
