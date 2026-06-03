# MobileFrame 架构说明

最后更新：2026-06-03

## 定位

MobileFrame 是 React Native Bare + TypeScript 通用移动端底座。它提供通用 App 壳层、设计系统、页面模板、原生能力契约、生成器和验证脚本，不承载具体游戏助手业务。

业务 App 应通过 `tools/create-app.mjs` 生成独立 `apps/<name>`，再按需要接入业务模块。`apps/showcase` 只用于展示和验证底座能力。

## 工作区边界

```text
apps/showcase                  Showcase 预览 App 和原生模板来源
packages/design-tokens         色彩、间距、圆角、字体、阴影、动效
packages/ui-core               平台无关主题和组件状态类型
packages/ui-native             React Native 通用 UI 组件
packages/ui-admin              后台管理移动端通用组件、筛选和分页列表
packages/auth-admin            后台管理移动端鉴权、Token 映射和权限门禁
packages/realtime              后台管理移动端实时订阅、WebSocket 传输和轮询降级契约
packages/app-shell             App Provider、主题、Toast、Sheet、模块挂载状态
packages/core                  通用工具、Native Contract、mock adapter
packages/module-sdk            模块声明、路由、权限和 Tab 元数据
packages/presets               App 创建预设
packages/screen-templates      可复用页面模板
tools                          App、模块、页面、Native 扩展点生成器
scripts                        工作区、原生、生成器和发布前验证脚本
docs                           架构、生成器、发布和使用文档
```

## App 关系

```text
mobile-frame
├── apps/showcase                  # 底座能力展示和原生模板来源
├── apps/game-helper-admin-mobile  # admin-mobile preset 的首个管理端适配 App
├── apps/<generated-app>           # create-app 生成的独立 RN Bare App
└── packages/*                     # 所有 App 复用的底座能力
```

`create-app` 会复制 `apps/showcase/android` 与 `apps/showcase/ios`，并替换包名、registry name 和显示名。生成结果包含：

```text
apps/<name>/
├── android/
├── ios/
├── src/
│   ├── App.tsx
│   ├── navigation/
│   ├── screens/
│   ├── modules/
│   ├── store/
│   └── theme/
├── app.json
├── index.js
├── package.json
└── tsconfig.json
```

## 运行时分层

```text
App
└── MFAppProvider
    ├── AppNavigator
    ├── AdminAuthProvider
    ├── Realtime subscriptions
    ├── Screen Templates
    ├── UI Native Components
    ├── UI Core Theme
    ├── Module SDK metadata
    └── Core Native Contracts
```

页面应优先使用 `@mobile-frame/screen-templates` 和 `@mobile-frame/ui-native`。后台管理端页面可在此基础上使用 `@mobile-frame/ui-admin`，通过 `@mobile-frame/auth-admin` 统一处理管理员 Token 映射、权限判断、路由级 `ProtectedScreen` 和动作级 `PermissionGate`，并通过 `@mobile-frame/realtime` 统一处理设备状态、任务进度和全局告警订阅。平台能力应通过 `@mobile-frame/core/native-modules` 或 `@mobile-frame/ui-native/native-modules` 访问；`game-helper-admin-mobile` 进一步用 `src/services/native-actions.ts` 封装扫码、复制、分享和打开链接动作，避免业务页面直接调用系统 API。

## 验证边界

当前源码级闭环由以下命令覆盖：

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run mf:generator-smoke
node scripts/mf-workspace-check.mjs
```

原生构建环境由 preflight 报告：

```bash
pnpm run mf:native-readiness
pnpm run mf:native-build-preflight
pnpm run mf:android-runtime-preflight
pnpm run mf:source-control-preflight
```

Android/iOS 真机、模拟器和 release 构建需要本机工具链满足后再执行严格模式。
