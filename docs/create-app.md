# create-app 生成器

最后更新：2026-06-03

## 用法

```bash
pnpm run create:app -- demo-app
pnpm run create:app -- demo-app --preset dashboard
pnpm run create:app -- demo-app --preset device-agent
pnpm run create:app -- demo-app --preset admin-mobile
```

兼容旧命令：

```bash
pnpm run mf:create-app -- demo-app --preset operations
```

支持 dry-run：

```bash
pnpm run create:app -- demo-app --preset basic --dry-run
```

## 支持的 preset

当前支持：

```text
basic
dashboard
device-agent
admin-mobile
minimal
standard
operations
```

新 App 默认使用 `basic`。`minimal`、`standard`、`operations` 是兼容旧项目的 legacy preset。

## 生成结果

`create-app` 会在 `apps/<app-name>` 下创建：

```text
android/
ios/
src/
  App.tsx
  index.ts
  navigation/index.tsx
  screens/HomeScreen.tsx
  screens/index.ts
  modules/index.ts
  store/index.ts
  theme/index.ts
app.json
index.js
package.json
tsconfig.json
```

Android/iOS 目录来自 `apps/showcase`，生成时会替换：

- Android package：`com.misk.<appname>`
- Android Kotlin package path
- React Native registry name：PascalCase app name
- iOS scheme/project/app folder：PascalCase app name
- iOS display name：Title Case app name

## 生成 App 的源码结构

`src/App.tsx` 只负责创建 `MFAppProvider` 并挂载导航入口。

`src/navigation` 是生成 App 的导航入口。当前生成的轻量版本直接渲染 `HomeScreen`，后续业务 App 可以在这里接入 React Navigation 或自定义导航。

`src/screens` 存放页面。默认 `HomeScreen` 会根据 preset 选择 `SettingsScreen`、`ListScreen` 或 `DashboardScreen` 模板。

`src/modules` 将 preset module 列表转换成 `defineModule()` 元数据，供 app shell 和后续导航使用。

`src/store` 存放从 preset 派生的本地首页状态，不绑定外部状态库。

`src/theme` 统一导出 `appTheme`。

## 验证

生成器 smoke 会验证：

- dry-run 不写文件；
- 重复生成会拒绝覆盖；
- 非法参数会失败；
- 生成 App 含 Android/iOS 原生工程；
- 生成 App 的 TypeScript 可以构建；
- 生成 App 的包名、入口名、显示名替换正确。

运行：

```bash
pnpm run mf:generator-smoke
```
