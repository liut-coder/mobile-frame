# Release 与原生构建

最后更新：2026-06-03

## 当前边界

源码级验证已可在没有完整原生工具链的环境中执行。Android/iOS 真机、模拟器、Debug 和 Release 构建仍依赖本地平台工具。

默认 `pnpm run mf:validate` 会报告原生环境缺口但不因为缺少本机工具链失败。需要真正构建前使用严格模式。

## 通用验证

```bash
pnpm run mf:workspace-check
pnpm run mf:docs-site:check
pnpm run mf:ci-workflow-check
pnpm run mf:runtime-evidence
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run mf:generator-smoke
git diff --check
```

完整非严格验证：

```bash
pnpm run mf:validate
```

完整原生证据门禁：

```bash
pnpm run mf:runtime-evidence:strict
```

非严格 `mf:runtime-evidence` 只汇总缺失项，适合本地开发机；严格模式要求 Android debug/release build evidence、Android runtime evidence、iOS debug/release build evidence 和 iOS IPA export evidence 都存在且结构有效。

## GitHub Actions

仓库提供 `.github/workflows/mobile-frame.yml`，当前包含三个 job：

- `source-validation`：在 Ubuntu + Node 22 + pnpm 11.5.0 上安装依赖并运行 `pnpm run mf:validate`；
- `showcase-android-debug`：在源码验证通过后安装 JDK 17、Android SDK platform 36、build-tools 36.0.0、NDK 27.1.12297006，通过 `pnpm run mf:android-build:debug` 执行 Android strict preflight、构建 Showcase debug APK，再运行 `pnpm run mf:runtime-evidence -- --require android.debug-build-evidence --report data/runtime-evidence/runtime-evidence-report.json` 强制校验 debug build evidence 并生成证据汇总报告，然后上传 APK、APK metadata、build evidence JSON 与 runtime evidence report；
- `showcase-android-runtime`：下载 debug APK artifact，启用 KVM，启动 Android API 35 x86_64 emulator，执行 `pnpm run mf:android-runtime-run` 安装并启动 Showcase，再运行 `pnpm run mf:runtime-evidence -- --require android.runtime-evidence --report data/runtime-evidence/runtime-evidence-report.json` 强制校验 Android runtime evidence，并上传 Android runtime evidence 和汇总报告。

触发方式：

- pull request；
- push 到 `main` 或 `game-helper-app`；
- 手动 `workflow_dispatch`。

远端 GitHub Actions run `26904447920` 已在 2026-06-03 跑通 `source-validation`、`showcase-android-debug` 和 `showcase-android-runtime`。该 run 的 `mobile-frame-showcase-debug-apk` artifact 包含 debug APK、`output-metadata.json`、`apps-showcase-debug-build-evidence.json` 和 `runtime-evidence-report.json`，其中 `android.debug-build-evidence` 的 `requiredPassed` 为 `true`。`mobile-frame-showcase-runtime-evidence` artifact 包含 `apps-showcase-runtime-evidence.json` 和 `runtime-evidence-report.json`，其中 `android.runtime-evidence` 的 `requiredPassed` 为 `true`，并记录了 `emulator-5554` 上的安装、启动和前台窗口校验。Android Release、iOS Debug/Release 和 iOS IPA 导出仍需要相应平台/签名环境继续产出证据。

本地使用以下命令守住 workflow 结构：

```bash
pnpm run mf:ci-workflow-check
```

它会检查 pull request、`main`、`game-helper-app` 和手动触发配置，以及源码验证、Android SDK 安装、统一 Android 构建脚本、strict Android preflight、Showcase debug APK 构建、debug build evidence 必需门禁、runtime evidence report 生成、APK/evidence artifact 上传、emulator runtime job、KVM 配置、debug APK artifact 下载、`mf:android-runtime-run` 安装/启动校验、Android runtime evidence 必需门禁和 runtime evidence artifact 上传步骤是否仍在。

## 文档站点

文档站点是无额外依赖的静态 HTML，生成结果为 `docs-site/index.html`：

```bash
pnpm run mf:docs-site
pnpm run mf:docs-site:check
```

`mf:validate` 会运行 `mf:docs-site:check`，确保站点入口与 README、架构、设计系统、生成器、原生契约、preset、release 和主改造方案文档保持同步。

## 原生预检

检查原生工程文件：

```bash
pnpm run mf:native-readiness
pnpm run mf:native-readiness:strict
```

检查本机 Android/iOS 构建工具：

```bash
pnpm run mf:native-build-preflight
pnpm run mf:native-build-preflight:strict
pnpm run mf:native-build-preflight -- --platform android --strict
pnpm run mf:native-build-preflight -- --platform ios --strict
```

检查 Android APK、adb 和设备：

```bash
pnpm run mf:android-runtime-preflight
pnpm run mf:android-runtime-preflight:strict
```

## Android Debug

环境要求：

- JDK 17 或更高；
- Android SDK；
- compileSdk 对应平台；
- buildToolsVersion 对应版本；
- platform-tools；
- Gradle wrapper 或已缓存 wrapper distribution。

构建：

```bash
pnpm run mf:android-build:debug
```

该命令会先运行：

```bash
node scripts/mf-native-build-preflight.mjs --app apps/showcase --platform android --strict
```

然后执行 `:app:assembleDebug`，校验 `output-metadata.json`、APK 文件、`applicationId` 和 SHA-256，并写入：

```text
data/runtime-evidence/android/apps-showcase-debug-build-evidence.json
```

如需直接调用 Gradle，先确认 strict preflight 通过：

```bash
pnpm run mf:native-build-preflight -- --platform android --strict
cd apps/showcase/android
./gradlew :app:assembleDebug --no-daemon --stacktrace
```

Windows 直接调用 Gradle：

```powershell
cd apps\showcase\android
.\gradlew.bat :app:assembleDebug --no-daemon --stacktrace
```

默认 APK 输出：

```text
apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk
```

安装和启动前：

```bash
pnpm run mf:android-runtime-preflight:strict
pnpm run mf:android-runtime-run
```

`mf:android-runtime-run` 会安装 debug APK、通过 launcher intent 启动 App、检查前台窗口中包含 `applicationId`，并写入：

```text
data/runtime-evidence/android/apps-showcase-runtime-evidence.json
```

## Android Release

Release 构建需要业务 App 配置签名信息后再执行。当前底座只提供 preflight 和原生工程模板，不提交密钥。

推荐流程：

```bash
pnpm run mf:android-build -- --app apps/<app-name> --variant release
```

签名文件、密码和发布渠道配置必须通过本地环境变量、CI secret 或未提交的 Gradle 配置注入。

当前 Showcase 模板仍使用 debug signingConfig 作为 scaffold 占位。只有为了验证脚手架 release build 流程时，才允许显式运行：

```bash
pnpm run mf:android-build:release -- --allow-debug-release-signing
```

正式业务 App 不应使用该参数。

## iOS Debug

iOS 必须在 macOS 上执行，环境要求：

- Xcode；
- CocoaPods；
- 可用模拟器或真机签名配置。

流程：

```bash
pnpm run mf:ios-build:debug
```

该命令会先运行 iOS strict preflight，再执行 `pod install` 和 `xcodebuild build`，校验 `.app` bundle 并写入：

```text
data/runtime-evidence/ios/apps-showcase-debug-build-evidence.json
```

生成 App 的 iOS 工程名会随 registry name 替换，例如 `SmokeApp.xcodeproj`。

## iOS Release

iOS Release 需要 Apple Developer Team、Bundle Identifier、证书、描述文件和导出配置。当前仓库只保留工程模板、preflight 和归档/导出证据脚本，不提交证书或描述文件。

推荐在 macOS CI 上补齐：

```bash
pnpm run mf:ios-build -- --app apps/<app-name> --configuration Release
pnpm run mf:ios-export -- --app apps/<app-name> --export-options-plist <path>
```

第一条命令会执行 `xcodebuild archive`，校验 `.xcarchive` 与归档中的 `.app` bundle，并写入 build evidence JSON：

```text
data/runtime-evidence/ios/apps-showcase-release-build-evidence.json
```

第二条命令会读取已生成的 `.xcarchive` 和业务提供的 `ExportOptions.plist`，执行 `xcodebuild -exportArchive`，校验导出的 IPA，并写入：

```text
data/runtime-evidence/ios/apps-showcase-export-evidence.json
```

`ExportOptions.plist`、证书、描述文件、Apple 账号和签名 secret 应保留在本地或 CI secret 中。上传 TestFlight 或企业分发仍由业务 CI 在 IPA 导出后继续处理。

## 提交前检查

```bash
pnpm run mf:source-control-preflight:strict
git status --short
git diff --check
```

不要提交：

- `node_modules/`
- `dist/`
- Android `.gradle/`、`.kotlin/`、`build/`、`app/build/`
- iOS `Pods/`、`build/`
- signing keys、证书、描述文件和本地 secret
