# MobileFrame 使用说明书

最后更新：2026-06-03

## 1. 项目用途

MobileFrame 是一个基于 React Native Bare、TypeScript 和 pnpm workspace 的移动端原生脚手架。它用于快速搭建多个移动应用的统一基础设施，包括：

- 应用壳和本地导航示例。
- 设计令牌、UI 基础类型和 React Native UI 组件。
- 原生能力契约、Mock 适配器和后续原生模块扩展点。
- 通用页面模板。
- App、业务模块、页面、Preset、原生组件、原生模块生成器。
- TypeScript、ESLint、Vitest、工作区一致性、原生环境预检和 Android 运行预检。

## 2. 环境要求

基础环境：

- Node.js：建议使用当前 LTS 版本。
- Corepack：用于启用固定版本的 pnpm。
- pnpm：项目声明版本为 `pnpm@11.5.0`。

Android 构建环境：

- JDK 17。
- Android SDK。
- Android SDK Platform 36。
- Android Build Tools 36.0.0。
- Android Platform Tools。
- 已接受 Android SDK licenses。

iOS 构建环境：

- macOS。
- Xcode。
- CocoaPods。

Windows 可以完成 TypeScript、lint、test、Android 预检和 Android debug APK 构建；iOS 构建必须在 macOS 上完成。

## 3. 首次安装

在项目根目录执行：

```powershell
corepack enable
corepack prepare pnpm@11.5.0 --activate
pnpm install
pnpm mf:validate
```

如果当前 PowerShell 会话找不到 `pnpm`，使用 Corepack 直接调用：

```powershell
corepack pnpm install
corepack pnpm mf:validate
```

## 4. 目录结构

```text
apps/showcase                  示例应用和 React Native bare iOS/Android 工程
packages/app-shell             应用壳、模块挂载、主题、Toast、Sheet 状态
packages/core                  核心工具、原生能力契约和 Mock 适配器
packages/design-tokens         设计令牌
packages/module-sdk            模块定义辅助 API
packages/presets               应用预设
packages/screen-templates      通用页面模板
packages/ui-core               平台无关 UI 类型和行为辅助
packages/ui-native             React Native UI 组件
templates                      生成器模板
tools                          代码生成器
scripts                        校验、预检和 smoke test 脚本
docs                           产品、交接和使用文档
```

## 5. 常用命令

完整校验：

```powershell
pnpm mf:validate
```

该命令会依次执行 workspace 检查、原生项目文件检查、原生构建环境预检、TypeScript 构建、ESLint、Vitest 和生成器 smoke test。

单独执行质量检查：

```powershell
pnpm typecheck
pnpm lint
pnpm test
```

原生相关预检：

```powershell
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
```

提交或推送前检查 Git、remote 和忽略规则：

```powershell
pnpm mf:source-control-preflight:strict
```

## 6. 代码生成

生成一个应用：

```powershell
pnpm create:app terminal-app --preset device-agent
```

支持的预设包括 `basic`、`dashboard`、`device-agent`、`admin-mobile`，并兼容旧预设 `minimal`、`standard`、`operations`。生成 App 会包含 `android/`、`ios/`、`src/navigation/`、`src/screens/`、`src/modules/`、`src/store/` 和 `src/theme/`。

生成一个业务模块：

```powershell
pnpm create:module terminal
```

给模块生成页面：

```powershell
pnpm create:screen terminal SessionList --type list
```

页面类型支持 `blank`、`dashboard`、`detail`、`editor`、`empty`、`error`、`fullscreen`、`installed-apps`、`list`、`loading`、`permission`、`settings`。

生成一个 preset 扩展文件：

```powershell
pnpm create:preset field-ops
```

生成结果会写入 `packages/presets/src/generated/` 并导出，供 review 后再决定是否提升到内置 `mfPresets`。未提升前，它不会自动成为 `create:app --preset` 的可选项。

生成原生 UI 组件扩展点：

```powershell
pnpm create:native-component TerminalView
```

生成原生能力模块扩展点：

```powershell
pnpm create:native-module SSHSession
```

生成器默认会阻止覆盖已有同名目标。需要先检查生成结果时，优先使用生成器支持的 dry-run 行为。`mf:create-*` 命令仍保留为兼容别名。

## 7. 开发流程

推荐日常流程：

1. 基于 preset 生成应用或直接修改 `apps/showcase`。
2. 在 `packages/*` 中补充共享能力，例如 UI、app shell、module SDK 或 native contract。
3. 使用生成器创建模块、页面、原生组件或原生模块扩展点。
4. 在 showcase 中接入并验证交互。
5. 执行 `pnpm mf:validate`。
6. 在具备 Android 或 iOS 工具链的机器上执行原生构建和真机/模拟器验证。
7. 推送前执行 `pnpm mf:source-control-preflight:strict`。

## 8. Android 构建与运行

在 Windows 上建议先临时设置 JDK 17 和 Android SDK 环境变量：

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
```

构建 debug APK。该命令会先执行 Android strict preflight，再运行 Gradle，最后校验 APK metadata 并写入 build evidence：

```powershell
corepack pnpm mf:android-build:debug
```

如需验证 scaffold Release 构建流程，需要显式允许当前模板使用 debug signingConfig：

```powershell
corepack pnpm mf:android-build:release -- --allow-debug-release-signing
```

正式业务 App 不应使用该参数，应先配置真实 release signing。构建脚本要求以下四项全部存在，来源可以是环境变量、CI secret、`apps/<app-name>/android/local.properties`、`apps/<app-name>/android/gradle.properties` 或 `$GRADLE_USER_HOME/gradle.properties`：

```powershell
$env:MF_ANDROID_RELEASE_STORE_FILE="C:\secure\release.keystore"
$env:MF_ANDROID_RELEASE_STORE_PASSWORD="..."
$env:MF_ANDROID_RELEASE_KEY_ALIAS="..."
$env:MF_ANDROID_RELEASE_KEY_PASSWORD="..."
corepack pnpm mf:android-build -- --app apps\<app-name> --variant release
```

`android/local.properties` 已加入 Git 忽略规则。keystore 文件建议放在仓库外，或由 CI secret 在构建前写入临时路径。

如需直接调用 Gradle，先执行 Android 构建环境严格预检：

```powershell
corepack pnpm mf:native-build-preflight -- --platform android --strict
cd apps\showcase\android
.\gradlew.bat :app:assembleDebug --no-daemon --stacktrace
```

APK 输出路径：

```text
apps/showcase/android/app/build/outputs/apk/debug/app-debug.apk
data/runtime-evidence/android/apps-showcase-debug-build-evidence.json
```

连接 Android 设备或启动模拟器后，回到项目根目录执行：

```powershell
corepack pnpm mf:android-runtime-preflight:strict
corepack pnpm mf:android-runtime-run
```

运行成功后会写入 runtime evidence：

```text
data/runtime-evidence/android/apps-showcase-runtime-evidence.json
```

汇总检查 Android/iOS 构建和运行证据：

```powershell
corepack pnpm mf:runtime-evidence
corepack pnpm mf:runtime-evidence:strict
```

非严格模式只报告缺失项；严格模式用于最终原生验收门禁。CI 中也可以使用 `--require <evidence-id>` 只强制当前 job 应产出的证据，例如 `android.debug-build-evidence`、`android.release-build-evidence` 或 `android.runtime-evidence`。

## 9. iOS 构建与运行

iOS 构建必须在 macOS 上执行。推荐流程：

```bash
corepack enable
corepack prepare pnpm@11.5.0 --activate
pnpm install
pnpm mf:ios-build:debug
pnpm mf:ios-build:release
pnpm mf:ios-export -- --app apps/<app-name> --export-options-plist <path>
```

`mf:ios-build:debug` 会执行 iOS strict preflight、`pod install`、`xcodebuild build`，并校验 `.app` bundle。`mf:ios-build:release` 会执行 `xcodebuild archive` 并校验 `.xcarchive`。Release 归档完成后，`mf:ios-export` 会使用业务提供的 `ExportOptions.plist` 执行 `xcodebuild -exportArchive`、校验 IPA 并写入 export evidence。证书、描述文件、`ExportOptions.plist`、Apple 账号和签名 secret 应保留在本地或 CI secret 中，TestFlight/企业分发由业务 CI 继续配置。

默认 evidence 输出：

```text
data/runtime-evidence/ios/apps-showcase-debug-build-evidence.json
data/runtime-evidence/ios/apps-showcase-release-build-evidence.json
data/runtime-evidence/ios/apps-showcase-export-evidence.json
```

## 10. 原生能力使用原则

业务页面不要直接调用平台 API。应优先通过 `@mobile-frame/core/native-modules` 中的 TypeScript 契约访问权限、剪贴板、网络、生物识别、安全存储、生命周期、日志、设备信息等能力。

这样可以保证：

- UI 和业务逻辑可以先使用 Mock 适配器开发。
- 后续替换成真实 iOS/Android 实现时，页面代码无需大规模改动。
- 平台差异集中在能力边界处理。
- 权限和安全策略可以统一收口。

兼容旧导入路径时，可以通过 `@mobile-frame/ui-native/native-modules` 使用 re-export，但新代码优先使用 core 包。

## 11. 文档入口

架构、设计系统、生成器、原生契约、预设和发布说明已拆成独立文档：

```text
docs/architecture.md
docs/design-system.md
docs/create-app.md
docs/native-contracts.md
docs/presets.md
docs/release.md
docs/mobile-frame-改造与多App接入方案.md
docs-site/index.html
```

## 12. 提交与推送

当前项目的 `.gitignore` 已忽略常见依赖和原生构建产物，包括：

- `node_modules/`
- `dist/`
- `**/ios/Pods/`
- `**/ios/build/`
- `**/android/.gradle/`
- `**/android/.kotlin/`
- `**/android/build/`
- `**/android/app/build/`
- `data/runtime-evidence/`

推送前执行：

```powershell
pnpm mf:source-control-preflight:strict
git status
git add README.md docs/usage-guide.zh-CN.md
git commit -m "docs: add usage guide"
git push
```

推送到 `main` 或 `game-helper-app` 后，GitHub Actions 会运行源码验证、Showcase debug APK 构建、Showcase release APK scaffold 构建和 Android emulator runtime 校验。远端成功时应能看到 `mobile-frame-showcase-debug-apk`、`mobile-frame-showcase-release-apk` 和包含 `data/runtime-evidence/android/apps-showcase-runtime-evidence.json` 的 `mobile-frame-showcase-runtime-evidence` artifacts。

如果 `mf:source-control-preflight:strict` 报告没有 Git worktree 或 remote，需要先把项目放入正确仓库，或执行 `git init` 后添加远端：

```powershell
git remote add origin <remote-url>
git push -u origin main
```

## 13. 常见问题

`pnpm` 命令不可用：

```powershell
corepack pnpm install
corepack pnpm mf:validate
```

Android 构建使用了错误 JDK：

- 检查 `JAVA_HOME`。
- Android 构建使用 JDK 17，不要使用 JDK 8。
- 在当前 PowerShell 会话中按第 8 节临时设置环境变量。

iOS 预检在 Windows 上失败：

- 这是预期结果。
- iOS 构建需要 macOS、Xcode 和 CocoaPods。

`git push` 失败：

- 先运行 `git rev-parse --is-inside-work-tree` 确认当前目录是 Git 仓库。
- 再运行 `git remote -v` 确认 remote 已配置。
- 最后运行 `pnpm mf:source-control-preflight:strict` 检查忽略规则和推送前条件。
