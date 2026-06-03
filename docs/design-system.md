# MobileFrame 设计系统

最后更新：2026-06-03

## 包边界

设计系统分三层：

```text
packages/design-tokens   L0 设计变量
packages/ui-core         主题、变体、尺寸、状态算法
packages/ui-native       React Native 组件实现
```

业务 App 不应在页面中散落主色、圆角、间距和字体常量。优先使用 `createTheme()`、`MFTheme` 和 `ui-native` 组件。

## Tokens

`@mobile-frame/design-tokens` 导出：

- `mfTokens`
- `mfColors`
- `mfSpacing`
- `mfRadius`
- `mfTypography`
- `mfGlass`
- `mfMotion`
- `mfShadow`
- `createMFTheme(mode)`

当前保留 light/dark token。Showcase 和生成 App 默认使用 light，dark 接口已经保留在 token 和 theme 层。

## UI Core

`@mobile-frame/ui-core` 提供平台无关能力：

- `createTheme(mode)`
- `MFTheme`
- `MFThemeMode`
- `MFVariant`
- `MFSize`
- `getInteractiveOpacity()`
- `getPressedScale()`
- `resolveVariantColor()`

组件变体包含：

```text
primary
secondary
outline
danger
ghost
```

## UI Native

`@mobile-frame/ui-native` 当前导出布局、文本、反馈、导航和 overlay 组件。常用组件包括：

- `MFPage`
- `MFScreen`
- `MFScrollPage`
- `MFStack`
- `MFRow`
- `MFHeader`
- `MFCard`
- `MFSectionCard`
- `MFButton`
- `MFIconButton`
- `MFTextButton`
- `MFStatusPill`
- `MFInfoRow`
- `MFInfoGrid`
- `MFListItem`
- `MFSwitch`
- `MFSegmentedControl`
- `MFTabBar`
- `MFEmptyState`
- `MFErrorState`
- `MFLoadingState`
- `MFDialog`
- `MFSheet`
- `MFBanner`
- `MFToastHost`
- `MFToast`
- `MFSheetHost`
- `MFSearchBar`
- `MFFilterSheet`

## 页面模板

`@mobile-frame/screen-templates` 将常用页面组合沉淀为可复用模板：

- `BlankScreen`
- `DashboardScreen`
- `ListScreen`
- `DetailScreen`
- `SettingsScreen`
- `PermissionScreen`
- `InstalledAppsScreen`
- `EmptyStateScreen`
- `ErrorStateScreen`
- `LoadingScreen`

生成页面时优先使用：

```bash
pnpm run create:screen -- <module-name> <screen-name> --type list
```

可用类型：

```text
blank
dashboard
detail
editor
empty
error
fullscreen
installed-apps
list
loading
permission
settings
```

## Showcase 验收

Showcase 已接入 screen templates 和 native capability mock 预览。新增组件或模板时，应同步更新 Showcase 目录页或预览入口，并跑：

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
```
