# mobile-frame 通用移动端原生脚手架设计方案

> React Native 业务壳 + iOS Swift 原生组件 + Android Kotlin Compose 原生组件  
> 版本：v1.0  
> 日期：2026-06-03

## 1. 项目定位

`mobile-frame` 是一套可长期复用的移动端原生脚手架。它不绑定 SSH、Codex、HMN、游戏助手或发布中心等具体业务，而是提供统一的应用壳、设计系统、原生组件、系统能力模块、页面模板、业务模块 SDK 与代码生成器。

目标是让后续 App 从“重新搭底层工程”转变为“选择 preset、生成项目、挂载业务模块”。

| 项目项 | 约定 |
| --- | --- |
| 仓库名 | `mobile-frame` |
| 演示应用名 | `MobileFrame` |
| iOS Bundle ID | `com.misk.mobileframe` |
| Android Package | `com.misk.mobileframe` |
| 核心定位 | 模板仓库 + 原生组件库 + 业务模块 SDK + 生成器 |

## 2. 技术路线

- React Native Bare Project + TypeScript
- React Native New Architecture
- pnpm workspace Monorepo
- Fabric Native Components + Turbo Native Modules + Codegen
- iOS：SwiftUI + UIKit
- Android：Kotlin + Jetpack Compose + Android View
- 状态与请求：Zustand + TanStack Query + Zod
- 本地数据：MMKV + SQLite
- 敏感信息：iOS Keychain + Android Keystore

## 3. 核心原则

1. React Native 负责路由、状态、API、数据模型、主题、错误处理、页面组合和业务模块挂载。
2. iOS 与 Android 分别实现真正的原生 UI，但共享 TypeScript 接口。
3. 普通布局继续使用 React Native；系统质感、高性能绘制、复杂输入和系统能力进入原生层。
4. 冗余组件用于扩展，但必须分层、统一命名、可测试、可替换。
5. 后续应用通过 preset 和生成器创建，禁止复制旧项目后随意修改。

## 4. 组件分层

| 层级 | 名称 | 职责 | 示例 |
| --- | --- | --- | --- |
| L0 | Design Tokens | 只存设计变量 | 颜色、圆角、间距、字体、阴影、动画 |
| L1 | Primitive | 基础积木 | `MFText`、`MFIcon`、`MFStack`、`MFRow` |
| L2 | Component | 页面通用组件 | `MFButton`、`MFInput`、`MFCard`、`MFToast` |
| L3 | Pattern | 页面组合组件 | `MFLoginForm`、`MFListPage`、`MFSettingsGroup` |
| L4 | Business Module | 具体业务组件 | `TerminalSessionCard`、`HMNApprovalCard` |

## 5. 目录结构

```text
mobile-frame/
├── apps/showcase/
├── packages/
│   ├── app-shell/
│   ├── design-tokens/
│   ├── ui-core/
│   ├── ui-native/
│   ├── core/
│   ├── module-sdk/
│   └── presets/
├── templates/
├── tools/
├── docs/
├── scripts/
├── pnpm-workspace.yaml
└── README.md
```

## 6. 必须实现的通用组件

### 布局
`MFPage`、`MFScrollPage`、`MFSafeArea`、`MFStack`、`MFRow`、`MFColumn`、`MFSpacer`、`MFSection`、`MFDivider`

### 展示
`MFText`、`MFHeading`、`MFParagraph`、`MFLabel`、`MFCaption`、`MFIcon`、`MFBadge`、`MFAvatar`

### 输入
`MFButton`、`MFIconButton`、`MFInput`、`MFPasswordInput`、`MFSearchBar`、`MFTextArea`、`MFSwitch`、`MFCheckbox`、`MFRadio`、`MFSegmentedControl`、`MFSelect`、`MFFormField`

### 数据与反馈
`MFCard`、`MFListItem`、`MFStatCard`、`MFStatusCard`、`MFTag`、`MFProgress`、`MFSkeleton`、`MFKeyValue`、`MFCodeBlock`、`MFEmptyState`、`MFToast`、`MFSnackbar`、`MFDialog`、`MFConfirmDialog`、`MFSheet`、`MFLoadingOverlay`、`MFErrorState`、`MFSuccessState`

### 导航
`MFNavigationBar`、`MFTabBar`、`MFBackButton`、`MFPageHeader`、`MFFloatingAction`

## 7. 预留扩展组件

`MFDatePicker`、`MFTimePicker`、`MFOTPInput`、`MFSlider`、`MFFilePicker`、`MFImagePicker`、`MFAccordion`、`MFTimeline`、`MFStepper`、`MFTabs`、`MFGrid`、`MFFilterSheet`、`MFOfflineBanner`、`MFUpdateBanner`、`MFLogViewer`、`MFCodeViewer`、`MFDiffViewer`、`MFMetricCard`、`MFHealthIndicator`、`MFTaskProgress`、`MFApprovalCard`、`MFExecutionTimeline`、`MFRiskBadge`、`MFAuditItem`

高性能插槽：`NativeTerminalView`、`NativeLogView`、`NativeCodeEditorView`、`NativeDiffView`、`NativeFloatingWindow`

## 8. 原生能力模块

第一阶段必须实现：

- `SecureVaultModule`
- `BiometricModule`
- `NetworkMonitorModule`
- `HapticsModule`
- `ClipboardModule`
- `FileSystemModule`
- `PermissionModule`
- `AppLifecycleModule`
- `LoggerModule`
- `DeviceInfoModule`
- `ShareModule`

统一返回：

```ts
export type MFResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: MFError };

export type MFError = {
  code: string;
  message: string;
  module: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
};
```

## 9. 业务模块 SDK

```ts
export const terminalModule = defineModule({
  id: 'terminal',
  name: '终端',
  version: '1.0.0',
  routes: [{ name: 'terminal.home', screen: TerminalHomeScreen }],
  permissions: ['network.read', 'vault.read'],
  capabilities: ['terminal.session', 'terminal.history'],
  navigation: {
    tab: { title: '终端', icon: 'terminal', order: 20 },
  },
});
```

## 10. 页面模板

- `ListPage`
- `DetailPage`
- `EditorPage`
- `DashboardPage`
- `FullScreenPage`
- `SettingsPage`

## 11. Preset 与生成器

Preset：

- `minimal`
- `standard`
- `operations`

生成器：

```bash
pnpm mf:create-app terminal-app --preset operations
pnpm mf:create-module terminal
pnpm mf:create-screen terminal SessionList --type list
pnpm mf:create-native-component TerminalView
pnpm mf:create-native-module SSHSession
pnpm mf:validate
```

## 12. 安全规则

- 密码、Token、私钥和 Passphrase 只进入 Keychain / Keystore。
- 禁止将敏感数据写入 AsyncStorage、普通 MMKV、SQLite、URL 或崩溃日志。
- 日志默认脱敏。
- 页面不得直接访问平台 API。
- 业务模块先声明权限，由 `PermissionModule` 统一处理。

## 13. 第一版验收

- iOS 与 Android 模拟器和真机均可运行。
- New Architecture、Fabric、Turbo Module 链路可用。
- 浅色、深色主题可用。
- Swift 与 Compose 原生按钮可用。
- Keychain、Keystore、生物识别、网络监听、Toast、Sheet 可用。
- 统一错误和日志脱敏生效。
- 生成器可创建 App、模块、页面和原生模块。
- Showcase 页面完整。

## 14. 实施阶段

1. Phase 0：初始化工程。
2. Phase 1：设计系统。
3. Phase 2：基础组件。
4. Phase 3：原生能力。
5. Phase 4：页面模板。
6. Phase 5：模块系统。
7. Phase 6：生成器。
8. Phase 7：Showcase。
9. Phase 8：双端构建、测试和文档修复。

每个 Phase 完成后必须运行 lint、typecheck、单元测试、iOS 构建和 Android 构建，修复全部错误后再继续。
