# MobileFrame UI 与交互落地方案

> 依据根目录新增资源：`mobile-frame-complete-ui-kit.zip`、`mobile-frame-wireframes.md`、`preview.html`、`docs/gemini-code-1780431805962.html`  
> 当前工程状态：Phase 0 monorepo 骨架已建立，`mf:validate` 已可跑通。

## 1. 目标

把交互原型和组件资源包落成一个可持续演进的 React Native 原生脚手架首版：

- 设计 token 成为唯一视觉源。
- UI kit 组件并入现有 `packages/ui-native`，保留 RN 可运行实现。
- 原型里的 11 个页面落成 `apps/showcase` 的首版页面。
- 页面交互、Toast、Sheet、主题切换、底部导航、表单校验形成可复用模式。
- 后续 SwiftUI / Kotlin Compose / Turbo Module 可以按同一 TS 契约补原生实现。

## 2. 资源清单与归宿

| 资源 | 内容 | 落地位置 | 处理方式 |
| --- | --- | --- | --- |
| `ui-resources/tokens/design-tokens.json` | 主色、圆角、间距、字体、玻璃、动效 | `packages/design-tokens` | 作为 L0 token 基准，替换当前临时 token |
| `component-package/src/theme/tokens.ts` | RN 组件用 token | `packages/design-tokens/src` | 转成从 JSON 派生的 TS 常量，避免双 token |
| `component-package/src/components/*` | `MFButton`、`MFCard`、`MFText`、`MFListItem`、`MFSwitch`、`MFPage`、`MFGlassPanel` 等 | `packages/ui-native/src/components` | 合并到现有组件包，统一 props 与命名 |
| `ui-resources/icons/*.svg` | Tab、设置、权限、搜索、返回等图标 | `packages/ui-native/assets/icons` | 首版保留 SVG 文件；RN 侧后续接 `react-native-svg` 或 icon adapter |
| `ui-resources/logo/mobile-frame-logo.svg` | 品牌 Logo | `packages/ui-native/assets/logo` | 用于启动页、关于页 |
| `prototype-images/*.png` | 11 张页面原型图 | `docs/prototype-images` | 作为视觉验收参考，不进入运行时代码 |
| `mobile-frame-wireframes.md` | 页面清单、交互说明、模拟数据 | `docs/mobile-frame-wireframes.md` | 作为页面实现验收文档 |
| `interactive-prototype/*.html` / `preview.html` | 可交互 HTML 原型 | `docs/prototypes` | 作为动效、页面跳转和文案参考 |

## 3. 包边界

### `packages/design-tokens`

职责：只管理 L0 设计变量。

落地内容：

- `mfTokens`：完整 token 对象。
- `mfColors`、`mfSpacing`、`mfRadius`、`mfTypography`、`mfGlass`、`mfMotion`。
- `createMFTheme(mode)`：输出 light / dark / system 所需主题对象。
- token 单元测试：主色、圆角、玻璃限制、动效时长必须稳定。

原则：业务页面和组件不得硬编码主色、圆角、间距。

### `packages/ui-core`

职责：组件类型、主题类型、状态算法、无平台逻辑。

落地内容：

- `MFVariant`、`MFSize`、`MFComponentState`。
- `getInteractiveOpacity`、`getPressedScale`、`resolveVariantColor`。
- 组件公共 props 类型，例如 `MFBaseProps`、`MFActionProps`。

原则：这里不直接 import `react-native`。

### `packages/ui-native`

职责：React Native 可运行 UI 组件。

首批组件：

- 布局：`MFPage`、`MFScrollPage`、`MFStack`、`MFRow`、`MFSection`、`MFGlassPanel`。
- 文本：`MFText`、`MFHeading`、`MFParagraph`、`MFLabel`、`MFCaption`。
- 操作：`MFButton`、`MFIconButton`、`MFSwitch`、`MFCheckbox`。
- 数据：`MFCard`、`MFStatCard`、`MFListItem`、`MFBadge`、`MFToast`、`MFSheet`。
- 导航：`MFTabBar`、`MFBackButton`、`MFPageHeader`。

原则：先用 RN 实现视觉和交互；真正的 SwiftUI / Compose 原生组件在后续通过同名 adapter 替换。

### `packages/app-shell`

职责：App 壳层、主题、导航、Toast/Sheet 全局状态、模块挂载。

落地内容：

- `MFAppProvider`：主题、模块、用户状态、系统状态。
- `useMFToast()`：全局 Toast。
- `useMFSheet()`：全局 Sheet。
- `useMFThemeMode()`：浅色 / 深色 / 跟随系统。
- `createAppConfig()`：业务 app 配置入口。

### `apps/showcase`

职责：实现原型 11 个页面和组件展示。

首版页面：

- P0：启动页、引导页、登录页、注册页、首页、个人中心、设置页。
- P1：权限管理、个人信息、通用设置、关于页。

首版用本地模拟状态，不接真实后端。

## 4. 页面落地顺序

### P0-1：导航与壳层

交付：

- `RootNavigator`：启动页 -> 引导页 -> 登录页 / 注册页 -> 主 Tab。
- `MainTabs`：首页、组件、原生能力、模板、我的。
- `SettingsStack`：设置、权限管理、通用设置、关于。
- 页面跳转符合 `mobile-frame-wireframes.md`。

验收：

- 所有 P0 页面可以通过按钮或 Tab 进入。
- 未实现页面不空白，显示预留状态。

### P0-2：全局反馈

交付：

- `MFToastHost`：1500ms 自动淡出。
- `MFSheetHost`：底部弹出，20% 黑色遮罩。
- 登录、注册、保存、复制、权限、更新检查等 Toast 文案落地。

验收：

- `登录成功` 后进入首页。
- `注册成功` 后进入首页。
- `检查更新` 显示 `当前已是最新版本`。
- 权限项点击打开说明 Sheet。

### P0-3：基础表单

交付：

- 登录页：账号输入、密码输入、忘记密码、第三方登录占位。
- 注册页：手机号、验证码、倒计时、密码、确认密码、协议勾选。
- 通用校验：空值、协议未勾选、密码不一致。

验收：

- 协议未勾选时不能注册。
- 验证码按钮进入 60 秒倒计时。
- 登录成功后进入首页。

### P0-4：首页与个人中心

交付：

- 首页统计卡：组件 32、原生能力 28、页面模板 16、模块 12。
- 快捷操作：新建页面、组件、模块、导入项目，以 Sheet 或 Toast 占位。
- 个人中心：用户卡、数据卡、菜单列表。

验收：

- 首页卡片、快捷操作和项目状态与交互文档一致。
- 个人中心菜单能进入个人信息、通用设置、关于页。

### P0-5：设置页

交付：

- 外观 segmented control：浅色、深色、跟随系统。
- 系统菜单：权限管理、安全与隐私、网络状态、生物识别。
- 系统状态卡：Wi-Fi、存储、内存。

验收：

- 主题切换影响全局页面颜色。
- 权限管理和关于页面可进入。
- 预留项显示明确 Toast。

## 5. P1 页面落地

### 权限管理

交付：

- 已授权：相机、相册、麦克风、通知、生物识别。
- 需手动开启：剪贴板、文件访问。
- 隐私建议 Banner。

后续对接：

- `PermissionModule.request(permission)`。
- 系统设置跳转 adapter。

### 个人信息

交付：

- 用户卡、手机号、邮箱、部门、职位、地区、个性签名。
- 微信、Apple ID、邮箱状态。
- 保存按钮触发 `保存成功`。

### 通用设置

交付：

- 语言与地区、字体大小、默认首页。
- 缓存管理、自动更新、跟随系统、动画、声音触感。
- 数据同步、存储空间清理确认 Sheet。

### 关于页

交付：

- Logo、版本、构建号。
- 官方网站、开源协议、隐私政策、用户协议、更新日志、联系我们。
- 检查更新 Toast。

## 6. 技术实施阶段

### Stage 1：资产与 token 固化

工作：

- 解压资源包到临时目录，不直接污染源码。
- 复制 `design-tokens.json` 到 `packages/design-tokens/src/tokens.json`。
- 生成或手写 `tokens.ts` 导出强类型 token。
- 复制图标和 Logo 到 `packages/ui-native/assets`。
- 移动原型图和交互 HTML 到 `docs`。

校验：

- `pnpm mf:validate`。
- token 测试通过。

### Stage 2：组件包合并

工作：

- 将 zip 里的组件迁移到 `packages/ui-native/src/components`。
- 保留当前已有 `layout.tsx`、`typography.tsx`、`feedback.tsx`，但拆分为组件目录。
- 统一 props：
  - `children` 优先，`title` 兼容但不作为唯一入口。
  - `style` 使用 `StyleProp`。
  - `variant` 使用 `primary | secondary | danger | ghost`。
  - `size` 使用 `sm | md | lg`。
- 加入 `StyleSheet.create`，减少内联样式扩散。

校验：

- 组件导出完整。
- 每个组件至少有基础渲染测试或类型测试。

### Stage 3：App 壳层与导航

工作：

- 增加 `@react-navigation/native` 与 native stack / bottom tabs。
- `apps/showcase` 接入 `RootNavigator`。
- 加入 `MFAppProvider`、`MFToastHost`、`MFSheetHost`。

校验：

- 所有 P0 页面可达。
- Tab 状态正确。

### Stage 4：P0 页面实现

工作：

- 实现启动页、引导页、登录页、注册页、首页、个人中心、设置页。
- 文案、模拟数据和交互严格对齐 wireframes。
- 预留功能用 Toast 或 Sheet 表达，不留空按钮。

校验：

- 页面视觉接近 `preview.html`：白色简约、浅蓝主色、毛玻璃、低饱和阴影。
- Android / iOS RN runtime 不报红屏。

### Stage 5：P1 页面实现

工作：

- 实现权限管理、个人信息、通用设置、关于页。
- 接入模拟权限状态、模拟用户资料、模拟系统状态。

校验：

- 交互文档 11 个页面全部可达。
- Toast 文案完整。

### Stage 6：原生能力契约对接

工作：

- 在 `packages/ui-native/src/native-modules.ts` 基础上拆出 `packages/core/src/native`。
- 为 `SecureVaultModule`、`BiometricModule`、`NetworkMonitorModule`、`ClipboardModule`、`PermissionModule` 建 mock adapter。
- Showcase 使用 mock adapter，不直接访问平台 API。

验收：

- 权限页、生物识别、网络状态、剪贴板可通过 adapter 调用。
- 日志脱敏仍生效。

### Stage 7：真机与原生工程

工作：

- 在 `apps/showcase` 创建 RN Bare iOS / Android 工程。
- 开启 New Architecture。
- SwiftUI / UIKit 实现首个原生按钮或玻璃面板。
- Kotlin Compose 实现同名原生组件。

验收：

- iOS / Android 模拟器可运行。
- Turbo Module / Fabric 链路至少跑通一个示例。

## 7. 关键设计决策

1. `component-package` 不作为独立新包引入，避免和现有 `ui-core` 命名冲突。它的 RN 组件实现并入 `ui-native`。
2. `ui-core` 保持无平台逻辑，不直接放 React Native 组件。
3. `design-tokens.json` 是视觉单一源，当前临时 token 需要迁移到资源包 token。
4. 原型图只做视觉参考，不进入运行时代码。
5. `preview.html` 的交互行为可以复刻，但 CSS/Tailwind 代码不直接迁移到 RN。
6. 毛玻璃区域首版用半透明背景和阴影近似；真机阶段再按平台能力增强 blur。
7. 所有系统能力必须通过 module adapter，不允许页面直接访问平台 API。

## 8. 首版验收清单

### 视觉

- 主色为 `#1677FF`。
- 页面横向边距为 `16`。
- 主按钮高度 `52` 左右。
- 输入框高度 `52-60`。
- 卡片圆角 `16-20`，大卡片可到 `24`。
- 单屏不超过 3 个大面积玻璃区域。

### 交互

- 启动页点击进入引导页。
- 引导页最后一步进入登录页。
- 登录成功进入首页。
- 注册成功进入首页。
- Tab 能切换主页面。
- 设置页可切换主题。
- 权限项打开 Sheet。
- 保存资料显示 Toast。
- 检查更新显示 Toast。

### 工程

- `corepack pnpm mf:validate` 通过。
- 不新增未声明依赖。
- 不把生成的 `dist` 产物作为源码提交。
- 不把敏感信息写入普通存储。

## 9. 建议执行顺序

1. 先做 Stage 1 和 Stage 2：固化 token 与组件包。
2. 再做 Stage 3：导航和全局反馈。
3. 接着做 Stage 4：P0 页面完整可走通。
4. 然后做 Stage 5：补齐 11 个页面。
5. 最后做 Stage 6 / Stage 7：原生能力和双端工程。

这样可以先快速得到一个可运行、可验收、和原型一致的 showcase，再逐步把原生能力替换进去。
