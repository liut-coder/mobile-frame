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
- Reusable screen templates under `@mobile-frame/screen-templates`
- Generators for apps, modules, screens, presets, native components, and native modules
- Static documentation site generated from repository markdown under `docs-site/index.html`
- Validation that runs workspace consistency checks, native readiness reporting, native build preflight reporting, docs-site checks, CI workflow checks, typecheck, lint, unit tests, and generator smoke checks
- Generator smoke checks cover positive generation, generated workspace consistency, generated TypeScript builds, `--dry-run` no-write behavior, duplicate overwrite protection, and invalid argument failures

## Documentation

- [使用说明书](docs/usage-guide.zh-CN.md)
- [Architecture](docs/architecture.md)
- [Design system](docs/design-system.md)
- [create-app generator](docs/create-app.md)
- [Native contracts](docs/native-contracts.md)
- [Presets](docs/presets.md)
- [Release and native builds](docs/release.md)
- [Static docs site](docs-site/index.html)
- [Product overview](docs/mobile-frame-product-overview.md)
- [Engineering handoff](docs/mobile-frame-handoff.md)
- [Landing implementation plan](docs/mobile-frame-landing-plan.md)
- [改造与多 App 接入方案](docs/mobile-frame-改造与多App接入方案.md)
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
pnpm mf:android-build:debug
pnpm mf:android-build:release -- --allow-debug-release-signing
pnpm mf:ios-build:debug
pnpm mf:ios-build:release
pnpm mf:ios-export -- --app apps/<app-name> --export-options-plist <path>
pnpm mf:android-runtime-preflight
pnpm mf:android-runtime-preflight:strict
pnpm mf:android-runtime-run
pnpm mf:runtime-evidence
pnpm mf:runtime-evidence:strict
pnpm mf:source-control-preflight
pnpm mf:source-control-preflight:strict
pnpm mf:docs-site
pnpm mf:docs-site:check
pnpm mf:ci-workflow-check
pnpm create:app terminal-app --preset device-agent
pnpm create:screen terminal SessionList --type list
pnpm create:preset field-ops
pnpm mf:create-app terminal-app --preset operations
pnpm mf:create-module terminal
pnpm mf:create-screen terminal SessionList --type list
pnpm mf:create-native-component TerminalView
pnpm mf:create-native-module SSHSession
pnpm mf:create-preset field-ops
```

`pnpm validate` and `pnpm mf:validate` both run the same closed validation chain through `scripts/mf-validate.mjs`. The chain starts with `pnpm mf:workspace-check`, which verifies workspace package imports, dependencies, TypeScript project references, root references, and subpath aliases. It also runs `pnpm mf:native-readiness` to verify iOS/Android project files, `pnpm mf:native-build-preflight` to report local Android/iOS build-tool availability, `pnpm mf:android-runtime-preflight` to report Android APK/ADB/device readiness, `pnpm mf:runtime-evidence` to summarize native build/runtime evidence without failing by default, `pnpm mf:source-control-preflight` to report Git/push readiness and generated native-output ignore coverage, `pnpm mf:docs-site:check` to keep `docs-site/index.html` synchronized with the markdown docs, and `pnpm mf:ci-workflow-check` to guard the GitHub Actions source-validation, Showcase Android debug APK, and Showcase Android emulator runtime jobs. Use `pnpm mf:native-readiness:strict` for native project file evidence, `pnpm mf:native-build-preflight:strict` as the local native build environment gate before running real iOS/Android builds, `pnpm mf:android-runtime-preflight:strict` before installing or launching the Android APK, `pnpm mf:runtime-evidence:strict` as the final native evidence gate, `pnpm mf:source-control-preflight:strict` before committing or pushing from a real Git repository, and `pnpm mf:docs-site` after editing documentation.

## Native Build Evidence

`apps/showcase` includes RN bare iOS/Android project scaffolds adapted for the pnpm workspace. Run Android builds through the workspace wrapper so strict preflight, Gradle execution, APK metadata verification, SHA-256 calculation, and local evidence JSON are handled consistently:

```bash
pnpm mf:android-build:debug
```

The resulting debug APK is written to `apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk`, and build evidence is written under `data/runtime-evidence/android/`.

Older direct Gradle invocation still works after strict preflight passes:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
cd apps\showcase\android
.\gradlew.bat :app:assembleDebug --no-daemon --stacktrace
```

iOS native builds still require a macOS host with Xcode and CocoaPods. On macOS, run `pnpm mf:ios-build:debug` or `pnpm mf:ios-build:release` to perform strict preflight, `pod install`, `xcodebuild`, `.app` or `.xcarchive` verification, and evidence JSON output under `data/runtime-evidence/ios/`. After a Release archive exists, run `pnpm mf:ios-export -- --app apps/<app-name> --export-options-plist <path>` to call `xcodebuild -exportArchive`, verify the exported IPA, and write export evidence under `data/runtime-evidence/ios/`. On non-macOS hosts, `pnpm mf:native-build-preflight -- --platform ios` reports those expected environment gaps.

When an Android device or emulator is connected, verify runtime install/launch readiness with:

```powershell
corepack pnpm mf:android-runtime-preflight:strict
corepack pnpm mf:android-runtime-run
```

Successful install/launch writes runtime evidence under `data/runtime-evidence/android/`, including the APK hash, `applicationId`, selected device, install result, launch result, and foreground visibility check.

Use `pnpm mf:runtime-evidence` to see which Android/iOS build, export, and runtime evidence files are present. Use `pnpm mf:runtime-evidence:strict` only when the machine or CI is expected to have completed all native build and runtime proof steps.

## Workspace

```text
apps/showcase
packages/app-shell
packages/core
packages/design-tokens
packages/module-sdk
packages/presets
packages/screen-templates
packages/ui-core
packages/ui-native
templates
tools
docs
docs-site
scripts
```

Real device or simulator runs still require the corresponding local device/simulator tooling after the native build preflight passes.
