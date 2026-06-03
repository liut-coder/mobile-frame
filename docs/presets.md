# App Presets

最后更新：2026-06-03

## 包边界

`@mobile-frame/presets` 只定义 App 起步形态，不写业务逻辑。preset 会被 `create-app` 消费，也可以被业务 App 读取来生成导航、模块和首页状态。

## 当前 preset

Canonical preset：

```text
basic
dashboard
device-agent
admin-mobile
```

Legacy preset：

```text
minimal
standard
operations
```

## 数据结构

每个 preset 包含：

```ts
type MFPreset = {
  name: MFPresetName;
  description: string;
  entryScreen: string;
  modules: string[];
  features: string[];
  screens: string[];
  tabs: string[];
};
```

扩展 preset 使用可泛化名称类型：

```ts
type MFPresetDefinition<TName extends string = string> = {
  name: TName;
  description: string;
  entryScreen: string;
  modules: string[];
  features: string[];
  screens: string[];
  tabs: string[];
};
```

读取单个 preset：

```ts
import { getPreset } from '@mobile-frame/presets';

const preset = getPreset('device-agent');
```

列出 canonical preset：

```ts
import { listPresets } from '@mobile-frame/presets';

const presets = listPresets();
```

## 使用建议

`basic` 适合最小业务 App，包含首页、设置、主题、Toast 和 Sheet 基础能力。

`dashboard` 适合状态优先 App，默认使用仪表盘、列表和设置模板。

`device-agent` 适合设备端 App，预留设备状态、权限、已安装应用、日志和设置模块。

`admin-mobile` 适合管理员移动端，预留总览、设备、任务、告警、审批、账号和设置模块。

## 生成扩展 preset

使用：

```bash
pnpm run create:preset -- field-ops
```

兼容旧命令：

```bash
pnpm run mf:create-preset -- field-ops
```

生成结果：

```text
packages/presets/src/generated/fieldOps.ts
packages/presets/src/generated/index.ts
```

生成器会把扩展 preset 导出为 `MFPresetDefinition<'field-ops'>`。它不会自动加入 `mfPresets`，因此也不会自动成为 `create:app --preset` 的可选值。需要内置化时，应 review 生成文件后手动加入 `mfPresets`、`MFPresetName` 和相关测试。

## 验证

preset 测试位于：

```text
packages/presets/src/index.test.ts
```

生成器 smoke 会额外验证 `create-preset` 的正向生成、dry-run 和重复保护：

```bash
pnpm run mf:generator-smoke
```

运行：

```bash
pnpm run test
```
