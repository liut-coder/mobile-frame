# mobile-frame 改造与多 App 接入方案

> 适用范围：`mobile-frame` 通用移动端底座、后续 `game-helper-app` 接入、未来 `game-helper-admin-mobile` 接入。
>
> 文档目标：把 `mobile-frame` 从“可运行 Showcase”继续沉淀为稳定的 React Native Bare 通用移动端脚手架，并明确它与业务 App 的边界。

---

## 1. 项目定位

`mobile-frame` 不是“游戏助手 App”，也不是某个业务模块的集合。它的定位是：

```text
React Native Bare + TypeScript 通用移动端底座
```

它负责提供：

- 通用 UI 组件；
- 主题、设计变量和视觉规范；
- 页面壳层；
- 路由和导航；
- Toast、Sheet、Dialog、Loading、空状态等全局反馈；
- 原生能力契约和 mock adapter；
- App、页面、模块、Native Module 生成器；
- Android / iOS 调试与 Release 构建脚本；
- Showcase 组件预览 App。

它不应该直接包含：

- 瞭望塔业务；
- 游戏账号绑定流程；
- 游戏托管队列；
- OCR 识别业务；
- 浮窗 Worker；
- 具体服务端接口；
- `watchtower` 模块参数；
- 游戏助手管理员业务。

---

## 2. 当前基础

当前 `mobile-frame` 已经具备以下基础结构：

```text
apps/showcase
packages/design-tokens
packages/ui-core
packages/ui-native
packages/app-shell
packages/core
packages/module-sdk
packages/presets
tools
scripts
```

当前能力包括：

- RN Bare + TypeScript monorepo；
- Android / iOS 原生工程；
- Showcase 演示 App；
- 主题和全局状态；
- Toast / Sheet；
- 中英文切换；
- Mock 原生能力；
- Debug / Release 构建脚本。

接下来改造重点不是继续往 Showcase 里加业务页面，而是把底座真正稳定下来。

---

## 3. 目标架构

### 3.1 总体结构

```text
mobile-frame/
├── apps/
│   └── showcase/                  # 通用底座展示与验证 App
│
├── packages/
│   ├── design-tokens/             # 色彩、间距、圆角、字号、阴影
│   ├── ui-core/                   # 主题计算、变体、平台无关 UI 逻辑
│   ├── ui-native/                 # RN 通用组件库
│   ├── app-shell/                 # App 壳层、全局状态、Toast、Sheet、Dialog
│   ├── core/                      # 通用能力契约与 mock adapter
│   ├── module-sdk/                # 模块声明、路由、权限、Tab 元数据
│   ├── presets/                   # App 创建预设
│   └── screen-templates/          # 通用页面模板
│
├── tools/
│   ├── create-app/
│   ├── create-screen/
│   ├── create-module/
│   ├── create-native-module/
│   └── create-preset/
│
├── scripts/
│   ├── validate/
│   ├── android/
│   ├── ios/
│   └── release/
│
└── docs/
    ├── architecture.md
    ├── design-system.md
    ├── create-app.md
    ├── native-contracts.md
    ├── presets.md
    └── release.md
```

### 3.2 App 关系

后续真正业务 App 不应该改造 `showcase`，而应该通过生成器创建独立 App：

```text
mobile-frame
├── apps/showcase                 # 仅用于展示底座
├── apps/game-helper              # 可选：未来 RN 版游戏助手壳层
└── apps/game-helper-admin-mobile # 未来管理员移动端
```

短期内，`game-helper-app` 仍保持独立 Kotlin 原生项目，不强行迁入。

---

## 4. 设计系统改造

### 4.1 目标

把现有原型图中的视觉风格沉淀为可复用 Design Tokens，避免页面里散落硬编码。

### 4.2 设计变量

建议目录：

```text
packages/design-tokens/src/
├── colors.ts
├── spacing.ts
├── radius.ts
├── typography.ts
├── shadows.ts
├── sizes.ts
├── opacity.ts
└── index.ts
```

建议定义：

#### 色彩

```ts
export const colors = {
  brand: {
    primary: '#4C8BFF',
    primarySoft: '#E9F1FF',
    primaryStrong: '#2F6FFF',
  },
  success: {
    main: '#22C55E',
    soft: '#E9FBEF',
  },
  warning: {
    main: '#FF9F1C',
    soft: '#FFF5E5',
  },
  danger: {
    main: '#FF4D4F',
    soft: '#FFF0F0',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFD',
    100: '#F1F5FA',
    300: '#D9E1EC',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A',
  },
};
```

#### 间距

```ts
export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
};
```

#### 圆角

```ts
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};
```

#### 字体层级

```ts
export const typography = {
  titleLarge: { fontSize: 30, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
};
```

### 4.3 字体策略

不要在资源包里捆绑字体文件，默认使用系统字体：

```text
iOS：PingFang SC / San Francisco
Android：Noto Sans CJK SC / Roboto
Web Preview：system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

---

## 5. 通用 UI 组件库

### 5.1 基础组件

建议补齐：

```text
MFScreen
MFHeader
MFCard
MFSectionCard
MFButton
MFIconButton
MFTextButton
MFStatusPill
MFInfoRow
MFInfoGrid
MFListItem
MFSwitch
MFSegmentedControl
MFTabBar
MFEmptyState
MFErrorState
MFLoadingState
MFDialog
MFSheet
MFToast
MFBanner
MFSearchBar
MFFilterSheet
```

### 5.2 组件规范

#### `MFButton`

支持：

```text
variant: primary | secondary | outline | danger | ghost
size: sm | md | lg
loading: boolean
disabled: boolean
leftIcon
rightIcon
```

#### `MFCard`

支持：

```text
padding
radius
shadow
border
background
pressable
```

#### `MFStatusPill`

支持：

```text
status: success | warning | danger | info | neutral
label
icon
```

#### `MFEmptyState`

支持：

```text
illustration
headline
description
actionLabel
onAction
```

### 5.3 验收标准

- 所有组件可在 Showcase 单独预览；
- 所有颜色、间距、字号、圆角均来自 Tokens；
- 支持亮色主题；
- 暗色主题先预留接口；
- Android / iOS 样式尽量一致；
- 所有组件支持禁用态、Loading 态和错误态。

---

## 6. 通用页面模板

新增：

```text
packages/screen-templates/
├── BlankScreen
├── DashboardScreen
├── ListScreen
├── DetailScreen
├── SettingsScreen
├── PermissionScreen
├── InstalledAppsScreen
├── EmptyStateScreen
├── ErrorStateScreen
└── LoadingScreen
```

### 6.1 `DashboardScreen`

适合：

- 设备型 App 首页；
- 管理端总览；
- 运行状态页。

组件结构：

```text
Header
Status Banner
Summary Grid
Primary Actions
Recent Status
Quick Actions
Bottom Tabs
```

### 6.2 `InstalledAppsScreen`

适合：

- 用户选择本机已安装应用；
- 保存包名；
- 调试时显示全部用户应用。

### 6.3 `PermissionScreen`

适合：

- 无障碍；
- 悬浮窗；
- 通知；
- 截图；
- 后台运行；
- 电池优化。

---

## 7. Native Contract 改造

### 7.1 原则

`mobile-frame` 只定义通用接口和 mock adapter，不承载业务逻辑。

### 7.2 通用接口

```ts
export interface DeviceInfoNative {
  getDeviceInfo(): Promise<DeviceInfo>;
}

export interface PermissionNative {
  getPermissionSnapshot(): Promise<PermissionSnapshot>;
  openPermissionSettings(type: PermissionType): Promise<void>;
}

export interface InstalledAppsNative {
  listInstalledApps(options?: ListAppsOptions): Promise<InstalledApp[]>;
  launchApp(packageName: string): Promise<boolean>;
}

export interface OverlayNative {
  hasPermission(): Promise<boolean>;
  openSettings(): Promise<void>;
  show(): Promise<void>;
  hide(): Promise<void>;
}

export interface SecureStorageNative {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface NetworkNative {
  getStatus(): Promise<NetworkStatus>;
  subscribe(listener: (status: NetworkStatus) => void): () => void;
}
```

### 7.3 Mock Adapter

Showcase 中必须提供 mock：

```ts
const installedAppsMock = [
  {
    packageName: 'com.example.game',
    appName: '示例游戏',
    versionName: '1.0.0',
    installed: true,
  },
];
```

这样没有真实 Native Module 时也能预览完整页面。

---

## 8. Showcase 改造

当前 Showcase 不应该继续模拟一个业务 App，而应该成为“组件与能力展示中心”。

建议导航：

```text
Showcase
├── Design Tokens
├── Buttons
├── Cards
├── Forms
├── Navigation
├── Status
├── Feedback
├── Screen Templates
├── Native Capability Mock
└── Theme Preview
```

每个页面展示：

```text
组件名称
使用场景
变体
禁用态
Loading 态
错误态
代码示例
```

---

## 9. 生成器改造

### 9.1 创建 App

```bash
pnpm create:app demo-app
```

生成：

```text
apps/demo-app/
├── android/
├── ios/
├── src/
│   ├── App.tsx
│   ├── navigation/
│   ├── screens/
│   ├── modules/
│   ├── store/
│   └── theme/
├── index.js
└── package.json
```

### 9.2 Preset

支持：

```bash
pnpm create:app demo-app --preset basic
pnpm create:app demo-app --preset dashboard
pnpm create:app demo-app --preset device-agent
pnpm create:app demo-app --preset admin-mobile
```

#### `basic`

```text
启动页
首页
设置
主题
Toast
Sheet
```

#### `device-agent`

```text
设备状态
权限检查
已安装应用选择
日志
设置
```

#### `admin-mobile`

```text
总览
设备
任务
管理
我的
```

---

## 10. 为 game-helper-admin 移动端预留

### 10.1 定位

`game-helper-admin-mobile` 不应该和设备执行端混在一起。

它是：

```text
管理员移动端
```

负责：

- 查看设备在线状态；
- 查看 Worker 状态；
- 查看任务队列；
- 查看执行日志和截图证据；
- 查看游戏账号绑定；
- 查看异常告警；
- 发起或审批高风险操作；
- 快速暂停、恢复或停止托管；
- 查看资源版本和 App 版本分布。

### 10.2 推荐目录

当前已创建首期 App，后续可继续细分目录：

```text
apps/game-helper-admin-mobile/
├── src/
│   ├── screens/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── tasks/
│   │   ├── alerts/
│   │   ├── approvals/
│   │   ├── accounts/
│   │   └── settings/
│   ├── api/
│   ├── navigation/
│   ├── store/
│   └── modules/
├── android/
└── ios/
```

### 10.3 管理端底部导航

建议：

```text
总览
设备
任务
管理
我的
```

“管理”页作为二级入口集合，不把托管用户、游戏模块、视觉资产、App 管理、运行日志、审批中心全部挤到底部导航。

### 10.4 管理端页面清单

#### 总览

```text
在线设备数
运行中 Worker
异常设备
待处理告警
待审批操作
今日任务数
失败率
```

#### 设备

```text
设备列表
设备详情
在线状态
权限快照
目标游戏
账号绑定
Worker 状态
最近日志
远程操作
```

#### 任务

```text
任务列表
运行中
排队中
已完成
失败
任务详情
步骤详情
证据截图
```

#### 管理

```text
托管用户
游戏模块
视觉资产
App 管理
运行日志
审批中心
```

### 10.5 与 mobile-frame 的关系

`game-helper-admin-mobile` 可以直接基于 `admin-mobile` preset 创建：

```bash
pnpm create:app game-helper-admin-mobile --preset admin-mobile
```

它只复用底座，不复用游戏助手设备端的 Kotlin 执行内核。

### 10.6 适配计划来源

`docs/game-helper-admin-mobile-mobile-frame-adaptation.md` 已作为 `game-helper-admin-mobile` 的详细适配计划纳入当前改造范围。该文档明确：

- 管理员移动端负责总览、设备、任务、日志、托管用户、游戏模块、视觉资产、App 发版状态、轻量审批、扫码绑定、复制和分享；
- 管理员移动端不承载 OCR、OpenCV、无障碍服务、浮窗、自动点击、Worker 拉取 Job、Worker 心跳、截图采集和本地自动化控制，这些仍归 `game-helper-app`；
- 第一阶段补齐 `admin-mobile` preset、五 Tab 导航、`ui-admin` 组件包、管理员 Token/权限、分页列表、状态筛选、WebSocket 实时状态、`LogViewer`、扫码/复制/分享封装和 `/api/v1/mobile` BFF 边界；
- `game-helper-admin-mobile` 第一阶段页面包含登录、总览、设备列表、设备详情、任务列表、任务详情、管理入口和我的；第二阶段扩展托管用户、游戏模块、视觉资产、App 管理、发版详情、运行日志和审批中心。

---

## 11. 开发阶段

### 阶段 1：设计系统稳定

- 整理 Tokens；
- 完善 UI 组件；
- 统一 Showcase；
- 增加状态页。

### 阶段 2：Native Contract 稳定

- 已安装应用；
- 权限；
- 浮窗；
- 网络；
- 安全存储；
- 设备信息。

### 阶段 3：Preset 与生成器

- `basic`；
- `device-agent`；
- `admin-mobile`；
- create-app；
- create-screen；
- create-preset；
- create-native-module。

### 阶段 4：文档和 Release

- Android Debug；
- Android Release；
- iOS Debug；
- iOS Release；
- 发布说明；
- 脚手架使用文档。

### 阶段 5：game-helper-admin-mobile 适配

- 将 `game-helper-admin-mobile` 作为独立 App 纳入计划；
- 基于 `admin-mobile` preset 生成 `apps/game-helper-admin-mobile`；
- 增加 `ui-admin`、`auth-admin`、`realtime`、扫码、复制和分享等通用后台移动端能力；
- 落地总览、设备、任务、管理、我的五 Tab 导航；
- 按 `/api/v1/mobile` BFF 边界接入后台接口，不复用设备执行端 `/api/v1/device`；
- 明确 OCR、OpenCV、无障碍、浮窗、Worker 和脚本执行继续归 `game-helper-app`。

---

## 12. 验收清单

> 当前推进状态更新于 2026-06-03。源码级验证已通过 `typecheck`、`lint`、`test`、`mf:generator-smoke`、`mf:workspace-check`、`mf:docs-site:check`、`mf:ci-workflow-check`、非严格 `mf:runtime-evidence` 和非严格 `mf:validate`。GitHub Actions run `26906180713` 已证明 Android debug APK 自动构建、Android Release scaffold 自动构建和 Android emulator runtime 安装/启动闭环。生产 Android Release 签名、iOS Debug/Release 和 iOS IPA 导出仍需要具备 macOS/Xcode/CocoaPods、`ExportOptions.plist` 或相应 CI 环境继续验证。

### P0

- [x] Showcase 可在 Android emulator 运行；GitHub Actions run `26906180713` 的 `showcase-android-runtime` job 已下载 debug APK、启动 Android emulator、运行 `mf:android-runtime-run`，并上传 `apps-showcase-runtime-evidence.json`。证据记录 `emulator-5554` 上安装、启动和前台窗口校验均通过。
- [x] Design Tokens 可统一引用；`packages/design-tokens`、`ui-core` 和 `ui-native` 已接入。
- [x] 组件库可独立预览；Showcase 已覆盖组件、模板和 Native mock 能力入口。
- [x] 页面模板可复用；`packages/screen-templates` 已提供通用模板并被 `create-screen`/Showcase 使用。
- [x] 所有原生能力有 mock adapter；`@mobile-frame/core/native-modules` 已覆盖设备信息、权限、已安装应用、浮窗、安全存储、网络和 legacy mock。
- [x] Android Debug / Release scaffold 可打包；GitHub Actions run `26906180713` 的 `showcase-android-debug` job 已产出 debug APK、APK metadata 和 `apps-showcase-debug-build-evidence.json`，`showcase-android-release` job 已显式运行 `mf:android-build:release -- --allow-debug-release-signing` 并产出 Release scaffold APK、APK metadata 和 `apps-showcase-release-build-evidence.json`。两个 job 的 `mf:runtime-evidence --require ...` 报告均显示对应 required evidence 通过；正式业务 Release 签名仍需业务侧配置。

### P1

- [x] create-app 可创建独立 RN Bare App；生成结果包含 `android/`、`ios/`、`src/navigation`、`src/screens`、`src/modules`、`src/store`、`src/theme`，并通过 generator smoke TypeScript 构建。
- [x] create-screen 可创建页面；已支持 `blank`、`dashboard`、`detail`、`installed-apps`、`list`、`permission`、`settings` 等模板类型。
- [x] create-preset 可创建 preset 扩展文件；生成结果位于 `packages/presets/src/generated/`，并通过 generator smoke 覆盖正向生成、dry-run 和重复保护。
- [x] create-native-module 可创建原生模块模板；generator smoke 已覆盖生成、dry-run 和重复保护。
- [x] `device-agent` preset 可用；已加入 canonical preset 并被 `create-app` 支持。
- [x] `admin-mobile` preset 可用；已加入 canonical preset 并被 `create-app` 支持。

### P2

- [ ] iOS Release 流程稳定；已提供统一 `mf:ios-build:debug`/`mf:ios-build:release` 构建入口和 `mf:ios-export` IPA 导出入口，可执行 iOS strict preflight、`pod install`、`xcodebuild build/archive`、`.app`/`.xcarchive` 校验、`xcodebuild -exportArchive`、IPA 校验、build evidence 和 export evidence 输出。仍需 macOS/Xcode/CocoaPods、`ExportOptions.plist` 与签名配置跑出真实 Release/IPA 证据。
- [x] `game-helper-admin-mobile` 第一阶段适配；已按 `docs/game-helper-admin-mobile-mobile-frame-adaptation.md` 创建独立 App，覆盖登录、总览、设备列表/详情、任务列表/详情、管理入口和我的，并通过执行边界说明避免引入 OCR/OpenCV/Worker/脚本执行能力。
- [ ] 后台管理端通用能力；`packages/ui-admin` 已提供状态、统计、实体列表、任务进度、Timeline、`LogViewer`、管理入口和执行边界组件。管理员权限控制、分页/筛选列表、WebSocket 实时状态、扫码/复制/分享封装和真实 `/api/v1/mobile` BFF 接口仍待接入。
- [x] 暗色主题；`design-tokens`、`ui-core`、`app-shell` 和 Showcase 主题切换已接入，并有 token/ui-core/app-shell 测试覆盖。
- [x] 组件快照测试；`packages/ui-native/src/component-snapshots.test.tsx` 已通过 RN mock 覆盖核心 feedback、navigation 和 overlay 组件，并生成稳定 snapshot。
- [x] 文档站点；已提供无额外依赖的 `docs-site/index.html` 静态入口，并通过 `mf:docs-site:check` 接入 `mf:validate`。
- [x] 示例 App 自动构建；GitHub Actions run `26906180713` 已跑通 `source-validation`、`showcase-android-debug`、`showcase-android-release` 和 `showcase-android-runtime`。`mobile-frame-showcase-debug-apk` artifact 已产出 debug APK、APK metadata、debug build evidence 和 report；`mobile-frame-showcase-release-apk` artifact 已产出 Release scaffold APK、APK metadata、release build evidence 和 report；`mobile-frame-showcase-runtime-evidence` artifact 已产出 Android runtime evidence 和 report。

---

## 13. 最终交付

`mobile-frame` 完成后应交付：

```text
一个纯净通用底座
一个 Showcase APK
一套 Design Tokens
一套 RN 通用组件库
一套 Native Contract
一套 mock adapter
一套页面模板
一套 App 生成器
一套 device-agent preset
一套 admin-mobile preset
一套构建脚本
一套完整文档
```

---

## 14. 最终结论

```text
mobile-frame
= 通用移动端脚手架
= 不直接承载游戏助手业务
= 同时服务未来 game-helper-app RN 壳层与 game-helper-admin-mobile
```

短期重点：先把底座做稳定，不要提前把复杂游戏助手业务迁进去。
