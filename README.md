# mobile-frame

React Native Bare + TypeScript mobile scaffold based on the design document in this repository.

## Current Scope

- pnpm workspace monorepo
- Shared TypeScript, ESLint, and Vitest configuration
- Design tokens, UI core helpers, React Native UI components, app shell state, core utilities, module SDK, and presets
- Native capability contracts and mock adapters live in `@mobile-frame/core/native-modules`, with `@mobile-frame/ui-native/native-modules` kept as a compatibility re-export
- Showcase app with local navigation, theme switching, Toast, Sheet, forms, settings, profile, permissions, and catalog views
- Mock native capability adapters using the shared `MFResult` contract
- React Native 0.85.3 iOS and Android bare project scaffolds under `apps/showcase`
- Generators for apps, modules, screens, native components, and native modules
- Validation that runs workspace consistency checks, native readiness reporting, native build preflight reporting, typecheck, lint, unit tests, and generator smoke checks
- Generator smoke checks cover positive generation, generated workspace consistency, generated TypeScript builds, `--dry-run` no-write behavior, duplicate overwrite protection, and invalid argument failures

## Documentation

- [使用说明书](docs/usage-guide.zh-CN.md)
- [Product overview](docs/mobile-frame-product-overview.md)
- [Engineering handoff](docs/mobile-frame-handoff.md)
- [Landing implementation plan](docs/mobile-frame-landing-plan.md)
- [Prototype wireframes](mobile-frame-wireframes.md)
- [Original design proposal](mobile-frame-通用移动端原生脚手架设计方案.md)

## Setup

```bash
corepack enable
corepack prepare pnpm@11.5.0 --activate
pnpm install
pnpm mf:validate
```

If `pnpm` is not available in the current PowerShell session after Corepack activation, use `corepack pnpm install` and `corepack pnpm mf:validate`.

## Commands

```bash
pnpm mf:validate
pnpm mf:native-readiness
pnpm mf:native-readiness:strict
pnpm mf:native-build-preflight
pnpm mf:native-build-preflight:strict
pnpm mf:android-runtime-preflight
pnpm mf:android-runtime-preflight:strict
pnpm mf:source-control-preflight
pnpm mf:source-control-preflight:strict
pnpm mf:create-app terminal-app --preset operations
pnpm mf:create-module terminal
pnpm mf:create-screen terminal SessionList --type list
pnpm mf:create-native-component TerminalView
pnpm mf:create-native-module SSHSession
```

`pnpm validate` and `pnpm mf:validate` both run the same closed validation chain through `scripts/mf-validate.mjs`. The chain starts with `pnpm mf:workspace-check`, which verifies workspace package imports, dependencies, TypeScript project references, root references, and subpath aliases. It also runs `pnpm mf:native-readiness` to verify iOS/Android project files, `pnpm mf:native-build-preflight` to report local Android/iOS build-tool availability, `pnpm mf:android-runtime-preflight` to report Android APK/ADB/device readiness, and `pnpm mf:source-control-preflight` to report Git/push readiness and generated native-output ignore coverage without failing the default validation chain. Use `pnpm mf:native-readiness:strict` for native project file evidence, `pnpm mf:native-build-preflight:strict` as the local native build environment gate before running real iOS/Android builds, `pnpm mf:android-runtime-preflight:strict` before installing or launching the Android APK, and `pnpm mf:source-control-preflight:strict` before committing or pushing from a real Git repository.

## Native Build Evidence

`apps/showcase` includes RN bare iOS/Android project scaffolds adapted for the pnpm workspace. Android debug assembly has been validated locally on Windows with JDK 17, Android SDK platform 36, build-tools 36.0.0, and Gradle 9.3.1:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
cd apps\showcase\android
.\gradlew.bat :app:assembleDebug --no-daemon --stacktrace
```

The resulting debug APK is written to `apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk`. iOS native builds still require a macOS host with Xcode and CocoaPods; on Windows, `pnpm mf:native-build-preflight -- --platform ios` reports those expected environment gaps.

When an Android device or emulator is connected, verify runtime install/launch readiness with:

```powershell
corepack pnpm mf:android-runtime-preflight:strict
corepack pnpm mf:android-runtime-preflight -- --install --launch
```

## Workspace

```text
apps/showcase
packages/app-shell
packages/core
packages/design-tokens
packages/module-sdk
packages/presets
packages/ui-core
packages/ui-native
templates
tools
docs
scripts
```

Real device or simulator runs still require the corresponding local device/simulator tooling after the native build preflight passes.
