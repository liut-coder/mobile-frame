# MobileFrame Handoff

Last updated: 2026-06-03

## Current State

MobileFrame is a React Native bare monorepo scaffold for reusable mobile app foundations. The repository currently contains:

- `apps/showcase`: the demo application and real React Native 0.85.3 bare iOS/Android project scaffolds.
- `packages/design-tokens`: shared design tokens.
- `packages/ui-core`: platform-neutral UI types and behavior helpers.
- `packages/ui-native`: React Native UI components and native capability compatibility exports.
- `packages/ui-admin`: reusable administrator mobile components for status badges, stats, segmented tabs, filter sheets, infinite lists, empty states, entity lists, task progress, timelines, log viewing, and management entry lists.
- `packages/auth-admin`: reusable administrator token mapping, permission checks, secure-token-store contract, route guards, and action gates.
- `packages/realtime`: reusable realtime subscription contracts, fixture-backed replay, WebSocket envelope parsing, reconnect delay handling, and polling fallback support.
- `packages/app-shell`: app shell state, module mounting, theme, toast, and sheet primitives.
- `packages/core`: shared utilities and native capability contracts/mock adapters.
- `packages/module-sdk`: module definition helpers.
- `packages/presets`: app preset definitions.
- `tools`: generators for apps, modules, screens, native components, and native modules.
- `scripts`: validation, workspace checks, native readiness, native build preflight, and generator smoke checks.

The scaffold is no longer only a TypeScript package skeleton. It now has native Android/iOS folders under `apps/showcase`, React Native CLI/Metro/Babel config, native readiness checks, native build preflight checks, and Android debug build evidence.

## Verified Evidence

The following commands have passed locally on Windows:

```powershell
corepack pnpm mf:native-readiness:strict
corepack pnpm mf:native-build-preflight -- --platform android
```

Android strict native build preflight passes when the shell is pointed at JDK 17 and the local Android SDK:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
corepack pnpm mf:native-build-preflight -- --platform android --strict
```

Android debug assembly has also completed successfully:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
cd apps\showcase\android
.\gradlew.bat :app:assembleDebug --no-daemon --stacktrace
```

Build output:

```text
apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk
```

ADB runtime preflight is available for install/launch closure:

```powershell
corepack pnpm mf:android-runtime-preflight:strict
corepack pnpm mf:android-runtime-run
```

The runtime preflight checks debug APK existence, Gradle APK metadata, launcher manifest evidence, adb availability, and at least one online adb device before performing install or launch actions. The GitHub Actions workflow also contains a `showcase-android-runtime` job that downloads the debug APK artifact, starts an Android emulator, runs `mf:android-runtime-run`, and uploads runtime evidence.

The full validation chain has passed:

```powershell
corepack pnpm mf:validate
```

Default validation intentionally reports native environment gaps instead of failing:

- `android.java-home`: the machine-level `JAVA_HOME` still points to JDK 8.
- `ios.host`: the current host is Windows, not macOS.
- `ios.xcodebuild`: Xcode is not available on Windows.
- `ios.cocoapods`: CocoaPods is not available on Windows.
- `source.git-worktree`: this directory currently has no Git metadata.
- `source.git-remote`: no Git remote can be detected without a Git worktree.

## Local Environment Notes

Known working Android environment:

- JDK 17: `C:\Program Files\Java\jdk-17`
- Android SDK: `C:\Users\Lucas\AppData\Local\Android\Sdk`
- SDK platform: `platforms;android-36`
- Build tools: `build-tools;36.0.0`
- Platform tools installed
- Command-line tools installed
- Android licenses accepted
- Gradle wrapper distribution cached locally for Gradle 9.3.1

Do not rely on the existing default `JAVA_HOME` for Android builds. It currently points to:

```text
C:\Program Files\Java\jdk1.8.0_161
```

Use the temporary PowerShell environment block above before running Android strict preflight or Gradle builds, unless the user explicitly wants the global user environment changed.

## Source Control Notes

This directory currently has no Git metadata:

```text
fatal: not a git repository (or any of the parent directories): .git
```

That means `git status`, `git commit`, and `git push` cannot work from `E:\AI\DP\mobile-frame` until the project is placed inside the intended Git repository or initialized and connected to a remote.

Before committing from a real repository, verify that generated outputs remain ignored. The `.gitignore` covers nested native build outputs such as:

- `apps/showcase/android/.gradle/`
- `apps/showcase/android/.kotlin/`
- `apps/showcase/android/build/`
- `apps/showcase/android/app/build/`
- `apps/showcase/ios/Pods/`
- `apps/showcase/ios/build/`

Run this strict gate immediately before committing or pushing from a real Git repository:

```powershell
corepack pnpm mf:source-control-preflight:strict
```

## Important Implementation Details

The Android scaffold is adapted for a pnpm workspace rather than a standalone React Native app:

- `apps/showcase/android/settings.gradle` resolves the React Native Gradle plugin from `node_modules/.pnpm/node_modules/@react-native/gradle-plugin`.
- React Native autolinking calls the Community CLI from the repository root `node_modules`.
- `apps/showcase/android/app/build.gradle` points `reactNativeDir`, `codegenDir`, `cliFile`, `hermesCommand`, and `bundleConfig` back to the workspace root and showcase app config.

The validation chain is defined in `scripts/mf-validate.mjs` and currently runs:

1. `mf:workspace-check`
2. `mf:native-readiness`
3. `mf:native-build-preflight`
4. `mf:android-runtime-preflight`
5. `mf:runtime-evidence`
6. `mf:source-control-preflight`
7. `mf:docs-site:check`
8. `mf:ci-workflow-check`
9. `typecheck`
10. `lint`
11. `test`
12. `mf:generator-smoke`

`mf:native-build-preflight` is intentionally non-strict by default so that a Windows workstation can still validate source health while reporting iOS and local toolchain gaps.

## What Is Done

- pnpm workspace structure is in place.
- TypeScript project references and subpath import checks are covered by workspace validation.
- Design tokens, core UI helpers, native UI components, app shell, native capability contracts, module SDK, and presets exist.
- Showcase app includes local navigation/stateful screens for the current scaffold experience.
- Generators exist for apps, modules, screens, native components, and native modules.
- Generator smoke tests cover positive generation, dry-run behavior, duplicate protection, generated TypeScript builds, and invalid argument failures.
- Real React Native bare iOS/Android folders exist under `apps/showcase`.
- Android debug APK assembly has been proven by GitHub Actions run `26906180713`, which produced `mobile-frame-showcase-debug-apk`.
- Android Release scaffold APK assembly has been proven by GitHub Actions run `26906180713`, which produced `mobile-frame-showcase-release-apk` with `android.release-build-evidence.requiredPassed=true`.
- Android runtime install/launch has been proven by GitHub Actions run `26906180713`, which produced `mobile-frame-showcase-runtime-evidence` with install, launch, and foreground-window evidence on `emulator-5554`.
- `docs/game-helper-admin-mobile-mobile-frame-adaptation.md` has been added as the plan source for a separate `game-helper-admin-mobile` app based on the `admin-mobile` preset.
- `apps/game-helper-admin-mobile` now exists as an independent React Native bare app generated from the `admin-mobile` preset with Android/iOS scaffolds, local five-tab navigation, login, dashboard, device list/detail, task list/detail, management, and profile surfaces.
- `packages/ui-admin` is wired into `game-helper-admin-mobile` for reusable admin page headers, status badges, stat cards, segmented tabs, filter sheets, infinite lists, empty states, entity list items, task progress, timelines, log viewing, management entry lists, and execution boundary cards.
- `packages/auth-admin` is wired into `game-helper-admin-mobile` for mobile BFF token payload normalization, route-level `ProtectedScreen` checks, action-level `PermissionGate` checks, management-entry filtering, and Keychain/Keystore-only storage assertions.
- `packages/realtime` is wired into `game-helper-admin-mobile` for fixture-backed global alert, device status, and task progress subscriptions; the app now shows realtime connection state and applies snapshots to overview alerts, device heartbeats/status, task progress, timelines, and logs.
- Scanner, clipboard, share, and browser action contracts are available through the native mock adapter, and `game-helper-admin-mobile` now routes scan-bind, copy ID/error, share logs, and open-link actions through `apps/game-helper-admin-mobile/src/services/native-actions.ts`.

## Open Risks And Gaps

- iOS native build is not proven on this Windows host. It needs macOS, Xcode, and CocoaPods.
- Production Android Release signing still needs business keystore/secrets and a production evidence run; the Android template and build script now support injected `MF_ANDROID_RELEASE_*` signing values without committing secrets.
- `game-helper-admin-mobile` still uses local fixture data. It needs real WebSocket/BFF transport integration, server-backed pagination/search data flows, and real `/api/v1/mobile` BFF integration.
- Scanner, clipboard, share, and browser actions are currently contract-backed mock surfaces; real Android/iOS platform implementations still need to replace the mock adapter behind the same TypeScript boundary.
- The global `JAVA_HOME` mismatch can confuse future Android commands if the temporary JDK 17 environment is not applied.
- Generated build outputs and Gradle caches should not be committed.
- Some older Chinese planning documents in the repository appear to have encoding issues; prefer these newer UTF-8 docs for handoff and product context.

## Recommended Next Steps

1. On macOS, run iOS preflight and a real iOS simulator build.
2. Inject real Android release signing secrets with `MF_ANDROID_RELEASE_*`, run a production release build, and capture production Release evidence.
3. Continue the `game-helper-admin-mobile` adaptation by replacing fixture realtime with the real WebSocket/BFF transport, server-backed pagination/search data flows, and real `/api/v1/mobile` API clients behind the current fixture-backed screens.
4. Decide whether to update the persistent user `JAVA_HOME` to JDK 17.
5. Continue replacing mock native capability adapters with real platform implementations behind the same TypeScript contracts.
