# Native Contracts

最后更新：2026-06-03

## 原则

业务页面不直接调用 Android/iOS API。MobileFrame 在 `@mobile-frame/core/native-modules` 中定义 TypeScript 契约和 mock adapter，真实平台实现后续挂在同一边界后面。

Showcase 和生成 App 可以先基于 mock adapter 完成 UI、权限和状态流预览。

## 新契约

当前直接契约包括：

```ts
DeviceInfoNative
PermissionNative
InstalledAppsNative
OverlayNative
SecureStorageNative
NetworkNative
```

核心数据类型包括：

```ts
DeviceInfo
PermissionSnapshot
PermissionState
PermissionType
InstalledApp
ListAppsOptions
NetworkStatus
```

## 兼容契约

旧 `MFResult` 风格模块仍保留：

```ts
SecureVaultModule
BiometricModule
NetworkMonitorModule
HapticsModule
ClipboardModule
FileSystemModule
PermissionModule
AppLifecycleModule
LoggerModule
DeviceInfoModule
ShareModule
```

新代码优先使用直接契约；需要兼容旧调用时继续使用 `MFResult` 模块。

## Mock Adapter

使用：

```ts
import { createMockNativeModules } from '@mobile-frame/core/native-modules';

const nativeModules = createMockNativeModules();
```

mock adapter 支持：

- 设备信息；
- 权限快照和打开设置记录；
- 已安装应用列表和启动结果；
- 浮窗权限、显示和隐藏状态；
- 安全存储；
- 网络状态订阅；
- 剪贴板、文件系统、日志和分享等 legacy 模块。

## Showcase 预览

Showcase 的 Native tab 已列出新契约和 legacy 模块。预览动作通过 `apps/showcase/src/preview-actions.ts` 触发 mock adapter，确保没有真实 Native Module 时也能检查页面状态。

## 验证

相关测试位于：

```text
packages/core/src/native-modules.test.ts
```

运行：

```bash
pnpm run test
```
