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
仪表盘
设备管理
任务管理
告警中心
审批中心
账号管理
设置
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

未来可创建：

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
告警
我的
```

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

#### 告警

```text
离线
心跳超时
OCR 失败
截图失败
权限丢失
目标游戏卸载
版本过旧
资源包异常
```

#### 审批

```text
暂停设备
停止 Worker
强制重连
重新下发任务
触发更新
资源包回滚
```

### 10.5 与 mobile-frame 的关系

`game-helper-admin-mobile` 可以直接基于 `admin-mobile` preset 创建：

```bash
pnpm create:app game-helper-admin-mobile --preset admin-mobile
```

它只复用底座，不复用游戏助手设备端的 Kotlin 执行内核。

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
- create-native-module。

### 阶段 4：文档和 Release

- Android Debug；
- Android Release；
- iOS Debug；
- iOS Release；
- 发布说明；
- 脚手架使用文档。

---

## 12. 验收清单

### P0

- [ ] Showcase 可运行；
- [ ] Design Tokens 可统一引用；
- [ ] 组件库可独立预览；
- [ ] 页面模板可复用；
- [ ] 所有原生能力有 mock adapter；
- [ ] Android Debug / Release 可打包。

### P1

- [ ] create-app 可创建独立 RN Bare App；
- [ ] create-screen 可创建页面；
- [ ] create-native-module 可创建原生模块模板；
- [ ] `device-agent` preset 可用；
- [ ] `admin-mobile` preset 可用。

### P2

- [ ] iOS Release 流程稳定；
- [ ] 暗色主题；
- [ ] 组件快照测试；
- [ ] 文档站点；
- [ ] 示例 App 自动构建。

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
