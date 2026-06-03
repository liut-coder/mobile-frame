# 游戏后台管理移动端：mobile-frame 适配方案

## 1. 文档说明

本文档用于指导在现有 `mobile-frame` 基础上，建设游戏后台管理移动端项目。

目标不是把 `mobile-frame` 改造成游戏业务项目，而是补齐一套可复用的“移动后台管理端能力”，然后基于该能力创建独立项目：

```text
game-helper-admin-mobile
```

后续 HMN 移动管理端、发布中心移动端、服务器管理移动端，也可以复用同一套底座能力。

---

## 2. 项目边界

建议将当前系统拆分为三个端：

| 项目 | 定位 | 是否承担脚本执行 |
|---|---|---:|
| `game-helper-web` | 桌面端完整后台 | 否 |
| `game-helper-app` | 用户端 + 本地 Worker 执行端 | 是 |
| `game-helper-admin-mobile` | 手机端轻量管理、调度、排障、发版 | 否 |

### 2.1 管理员移动端负责的内容

管理员移动端只负责：

- 查看系统总览
- 查看设备在线状态
- 查看任务运行进度
- 停止、重试任务
- 查看任务日志
- 查看设备详情
- 查看托管用户
- 查看游戏模块
- 查看视觉资产
- 查看 App 发版状态
- 处理轻量审批
- 复制、分享错误信息
- 扫码绑定设备

### 2.2 管理员移动端不负责的内容

以下能力不要放入管理员移动端：

- OCR
- OpenCV
- 无障碍服务
- 悬浮窗
- 自动点击
- 滑动操作
- 脚本执行
- Worker 拉取 Job
- Worker 心跳上报
- 设备端截图采集
- 本地自动化控制

这些能力继续保留在：

```text
game-helper-app
```

---

## 3. 总体改造思路

`mobile-frame` 需要增加一套后台管理端能力，但仍然保持通用底座定位。

推荐结构：

```text
mobile-frame
├── 普通 App 能力
│   ├── 登录
│   ├── 设置
│   ├── 通知
│   └── 基础页面
│
└── 后台管理 App 能力
    ├── admin-mobile preset
    ├── 权限控制
    ├── 状态卡片
    ├── 管理列表
    ├── 实时推送
    ├── 日志查看
    ├── 扫码绑定
    └── 发版管理组件
```

---

## 4. 增加 admin-mobile preset

### 4.1 preset 定位

在 `mobile-frame` 现有 preset 基础上增加：

```text
admin-mobile
```

创建命令建议：

```bash
pnpm create-app game-helper-admin-mobile --preset admin-mobile
```

### 4.2 默认生成目录

```text
apps/game-helper-admin-mobile
```

### 4.3 推荐目录结构

```text
apps/game-helper-admin-mobile/
├── src/
│   ├── app/
│   │   ├── navigation/
│   │   ├── providers/
│   │   └── bootstrap/
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   └── login/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── tasks/
│   │   ├── management/
│   │   ├── users/
│   │   ├── modules/
│   │   ├── assets/
│   │   ├── releases/
│   │   ├── logs/
│   │   └── profile/
│   │
│   ├── components/
│   │   ├── admin/
│   │   ├── feedback/
│   │   ├── forms/
│   │   └── list/
│   │
│   ├── services/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── realtime/
│   │   ├── scanner/
│   │   ├── clipboard/
│   │   └── share/
│   │
│   ├── stores/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   └── tasks/
│   │
│   ├── hooks/
│   ├── constants/
│   ├── types/
│   └── utils/
│
├── app.json
├── package.json
└── README.md
```

---

## 5. 后台移动端导航设计

### 5.1 底部导航

移动端底部导航建议固定为 5 个：

```text
总览
设备
任务
管理
我的
```

对应路由：

```text
/dashboard
/devices
/tasks
/management
/profile
```

### 5.2 管理入口

“管理”页作为二级入口集合，不要把所有模块直接堆到底部导航。

建议包含：

```text
托管用户
游戏模块
视觉资产
App 管理
运行日志
```

### 5.3 导航结构

```text
TabNavigator
├── DashboardStack
│   └── DashboardScreen
├── DeviceStack
│   ├── DeviceListScreen
│   └── DeviceDetailScreen
├── TaskStack
│   ├── TaskListScreen
│   └── TaskDetailScreen
├── ManagementStack
│   ├── ManagementHomeScreen
│   ├── UserListScreen
│   ├── UserDetailScreen
│   ├── ModuleListScreen
│   ├── AssetListScreen
│   ├── ReleaseListScreen
│   ├── ReleaseDetailScreen
│   └── LogListScreen
└── ProfileStack
    ├── ProfileScreen
    └── SettingsScreen
```

---

## 6. 增加 ui-admin 组件包

建议在 `mobile-frame` 内新增：

```text
packages/ui-admin
```

### 6.1 基础组件

| 组件 | 用途 |
|---|---|
| `AdminPageHeader` | 页面标题、返回、右侧操作 |
| `StatCard` | 总览统计卡片 |
| `StatusBadge` | 在线、离线、运行中、失败、待审批 |
| `SearchBar` | 搜索用户、设备、任务 |
| `FilterSheet` | 底部筛选面板 |
| `SegmentTabs` | 状态切换 |
| `EntityListItem` | 通用列表行 |
| `ActionSheet` | 手机端操作菜单 |
| `ConfirmDialog` | 停止任务、解绑设备等确认操作 |
| `EmptyState` | 空状态 |
| `ErrorState` | 加载失败 |
| `SkeletonList` | 骨架屏列表 |
| `PullToRefresh` | 下拉刷新 |
| `InfiniteList` | 游标分页加载 |
| `BatchActionBar` | 批量停止、批量重试 |

### 6.2 日志与任务组件

| 组件 | 用途 |
|---|---|
| `Timeline` | 任务执行步骤时间线 |
| `TaskProgressCard` | 任务执行进度 |
| `LogViewer` | 实时日志查看 |
| `EvidenceGallery` | 截图证据查看 |
| `ErrorSummaryCard` | 错误摘要 |
| `DeviceStatusCard` | 设备运行状态 |
| `WorkerHealthCard` | Worker 健康状态 |

### 6.3 发版管理组件

| 组件 | 用途 |
|---|---|
| `ReleaseCard` | 发版记录卡片 |
| `VersionBadge` | 版本号展示 |
| `ReleaseChannelBadge` | 测试版、灰度版、正式版 |
| `UploadProgress` | 上传进度 |
| `MarkdownReleaseNote` | 更新说明 |
| `UpgradePolicySelector` | 强制更新、可选更新、静默更新 |

### 6.4 Design Tokens

所有组件必须从统一 Design Tokens 获取样式：

```text
packages/design-tokens
```

禁止业务页面直接写死：

- 颜色
- 圆角
- 间距
- 字号
- 阴影
- 状态颜色

推荐 Token 分类：

```text
color.background.*
color.text.*
color.border.*
color.status.online
color.status.offline
color.status.running
color.status.failed
color.status.warning
spacing.*
radius.*
fontSize.*
shadow.*
```

---

## 7. 列表适配规范

桌面后台通常使用表格，但移动端不能直接缩小桌面表格。

### 7.1 设备列表

桌面端表格：

```text
设备 ID | 用户 | 在线状态 | 电量 | App 版本 | 最后心跳 | 操作
```

移动端建议改为卡片：

```text
┌────────────────────────────┐
│ 小米 14 · DEV-1024         │
│ 用户：张三                 │
│ ● 在线  App v1.2.3         │
│ 电量 82% · 2 分钟前心跳     │
│                     查看 > │
└────────────────────────────┘
```

### 7.2 任务列表

```text
┌────────────────────────────┐
│ 随缘打熊                   │
│ 用户：张三 · 小米 14        │
│ 运行中 · 已执行 18 / 42     │
│ 03:21 开始                 │
│                  查看详情 > │
└────────────────────────────┘
```

### 7.3 通用组件示例

```tsx
<EntityListItem
  title="随缘打熊"
  subtitle="用户：张三 · 小米 14"
  status={{ label: '运行中', type: 'running' }}
  meta="已执行 18 / 42"
  onPress={openDetail}
/>
```

---

## 8. 鉴权与权限控制

管理员移动端和普通用户端不能共用一套身份逻辑。

建议新增：

```text
packages/auth-admin
```

### 8.1 Token 数据结构

```text
access_token
refresh_token
role
permissions
tenant_id
device_id
```

### 8.2 安全存储

敏感信息只存储在：

```text
iOS Keychain
Android Keystore
```

禁止将 Token 存入：

```text
AsyncStorage
```

### 8.3 页面级权限控制

```tsx
<PermissionGate permission="task.stop">
  <StopTaskButton />
</PermissionGate>
```

### 8.4 路由级权限控制

```tsx
<ProtectedScreen permission="app.release.view">
  <ReleaseCenterScreen />
</ProtectedScreen>
```

### 8.5 权限建议

```text
dashboard.view

user.view
user.manage

device.view
device.bind
device.unbind
device.command

task.view
task.stop
task.retry

module.view
module.manage

asset.view
asset.manage

app.release.view
app.release.manage

log.view
```

---

## 9. 实时状态能力

后台管理移动端必须能够实时查看：

```text
设备在线状态
最后心跳时间
任务运行进度
失败原因
顶号状态
Worker 被停止
任务暂停结果
任务取消结果
App 版本
```

建议新增：

```text
packages/realtime
```

### 9.1 对外接口

```ts
subscribeDeviceStatus(deviceId)
subscribeTaskProgress(taskId)
subscribeGlobalAlerts()
```

### 9.2 推荐实现

```text
WebSocket
```

网络不稳定时：

```text
WebSocket 断开
    ↓
指数退避重连
    ↓
必要时降级为轮询刷新
```

### 9.3 订阅范围

不要在移动端一次订阅全部原始日志。

推荐：

| 页面 | 订阅内容 |
|---|---|
| 总览页 | 汇总事件、告警数量、在线设备数量 |
| 设备列表 | 设备在线状态变更 |
| 设备详情 | 指定设备状态 |
| 任务列表 | 任务状态变更 |
| 任务详情 | 指定任务进度、步骤、日志 |

---

## 10. 日志查看器

后台管理移动端需要内置通用 `LogViewer`。

### 10.1 功能要求

```text
按级别筛选：info / warn / error
关键词搜索
自动滚动
暂停自动滚动
复制日志
分页加载历史记录
查看截图证据
查看步骤详情
错误高亮
```

### 10.2 任务详情页结构

```text
任务摘要
执行进度
当前步骤
异常提示
步骤时间线
实时日志
截图证据
底部操作栏
```

底部操作：

```text
停止任务
重试任务
查看设备
```

---

## 11. App 发版管理

移动端只负责查看、审批、暂停，不负责本地构建。

### 11.1 展示字段

```text
版本号：1.3.0-beta.4
构建号：20260604.12
渠道：测试版
状态：灰度发布
升级方式：可选更新
发布时间：2026-06-04 02:30
```

### 11.2 可操作项

```text
查看发版详情
查看更新说明
暂停灰度发布
恢复灰度发布
查看升级进度
查看失败设备
审批发布
```

APK、IPA、增量包的实际构建与上传，继续由服务端发布中心完成。

---

## 12. 大列表与弱网适配

后台移动端的数据量会明显大于普通用户端。

### 12.1 需要适配的数据

```text
设备列表
用户列表
任务列表
日志列表
版本列表
视觉资产列表
```

### 12.2 推荐方案

```text
FlashList
游标分页
下拉刷新
请求去重
本地缓存
骨架屏
离线提示
失败重试
```

### 12.3 缓存策略

| 数据 | 策略 |
|---|---|
| 总览统计 | 缓存 30 秒 |
| 设备状态 | 实时推送，断线后轮询 |
| 用户列表 | 缓存 1 分钟 |
| 任务详情 | 实时推送 |
| 历史日志 | 分页加载 |
| 游戏模块 | 缓存 5 分钟 |
| 发版记录 | 缓存 1 分钟 |
| 视觉资产 | 缓存 5 分钟 |

---

## 13. 扫码、复制、系统分享

管理员排障时经常需要复制和分享信息。

建议在 `mobile-frame` 统一封装：

```ts
scanner.scanQRCode()
clipboard.copy(text)
share.shareText(text)
share.shareFile(path)
browser.open(url)
```

### 13.1 常见场景

```text
扫描设备绑定码
复制设备 ID
复制任务 ID
复制错误信息
分享日志
保存截图证据
打开外部链接
```

业务层不要直接调用原生 SDK。

---

## 14. 后端接口适配

移动端不建议直接复用桌面后台全部接口。

桌面后台接口通常字段多、结构复杂，不适合手机端。

建议新增：

```text
/api/v1/mobile
```

作为移动端 BFF。

### 14.1 Dashboard

```http
GET /api/v1/mobile/dashboard
```

示例响应：

```json
{
  "device_total": 128,
  "device_online": 93,
  "task_running": 21,
  "task_failed_today": 7,
  "pending_approval": 3,
  "latest_alerts": []
}
```

### 14.2 设备接口

```http
GET  /api/v1/mobile/devices
GET  /api/v1/mobile/devices/:id
POST /api/v1/mobile/devices/:id/bind
POST /api/v1/mobile/devices/:id/unbind
```

### 14.3 任务接口

```http
GET  /api/v1/mobile/tasks
GET  /api/v1/mobile/tasks/:id
POST /api/v1/mobile/tasks/:id/stop
POST /api/v1/mobile/tasks/:id/retry
```

### 14.4 用户接口

```http
GET /api/v1/mobile/users
GET /api/v1/mobile/users/:id
```

### 14.5 游戏模块接口

```http
GET /api/v1/mobile/modules
GET /api/v1/mobile/modules/:id
```

### 14.6 视觉资产接口

```http
GET /api/v1/mobile/assets
GET /api/v1/mobile/assets/:id
```

### 14.7 发版接口

```http
GET  /api/v1/mobile/releases
GET  /api/v1/mobile/releases/:id
POST /api/v1/mobile/releases/:id/pause
POST /api/v1/mobile/releases/:id/resume
```

### 14.8 日志接口

```http
GET /api/v1/mobile/logs
GET /api/v1/mobile/tasks/:id/logs
```

### 14.9 WebSocket

```text
/ws/mobile
```

推荐事件：

```text
device.status.changed
task.status.changed
task.progress.changed
task.log.appended
release.status.changed
alert.created
```

### 14.10 接口边界

设备执行端继续使用：

```text
/api/v1/device
```

后台管理移动端使用：

```text
/api/v1/mobile
```

两套接口不要混在一起。

---

## 15. 第一阶段页面范围

第一阶段只做最小可用版本。

### 15.1 页面列表

```text
登录页
总览页
设备列表
设备详情
任务列表
任务详情
管理入口
我的
```

### 15.2 页面说明

| 页面 | 核心内容 |
|---|---|
| 登录页 | 管理员账号登录、Token 刷新、错误提示 |
| 总览页 | 在线设备、运行任务、失败任务、待审批、告警 |
| 设备列表 | 搜索、筛选、状态、最后心跳 |
| 设备详情 | 用户、版本、Worker 状态、当前任务、日志入口 |
| 任务列表 | 搜索、状态筛选、运行进度 |
| 任务详情 | 步骤时间线、日志、截图证据、停止与重试 |
| 管理入口 | 用户、模块、视觉资产、App 管理、运行日志 |
| 我的 | 管理员信息、退出登录、设置 |

---

## 16. 第二阶段页面范围

```text
托管用户列表
托管用户详情
游戏模块列表
游戏模块详情
视觉资产列表
视觉资产详情
App 管理
发版详情
运行日志
审批中心
```

---

## 17. 第一阶段改造清单

`mobile-frame` 第一阶段只补以下内容：

```text
1. admin-mobile preset
2. 底部 5 个导航
3. ui-admin 组件包
4. 管理员 Token 和权限控制
5. InfiniteList + FilterSheet + StatusBadge
6. WebSocket 实时状态
7. LogViewer
8. 扫码、复制、分享封装
9. /api/v1/mobile BFF
```

不要第一阶段就加入：

```text
复杂审批流
完整视觉资产编辑器
本地脚本执行
OCR
OpenCV
Worker 能力
高级 BI 报表
桌面端全部功能
```

---

## 18. 建议仓库结构

如果 `mobile-frame` 使用 Monorepo，推荐：

```text
mobile-frame/
├── apps/
│   ├── demo-app/
│   └── game-helper-admin-mobile/
│
├── packages/
│   ├── ui-core/
│   ├── ui-admin/
│   ├── design-tokens/
│   ├── auth-core/
│   ├── auth-admin/
│   ├── realtime/
│   ├── scanner/
│   ├── clipboard/
│   ├── share/
│   └── app-bootstrap/
│
├── presets/
│   ├── minimal/
│   ├── standard/
│   ├── operations/
│   └── admin-mobile/
│
└── docs/
    └── game-helper-admin-mobile-adaptation.md
```

---

## 19. 实施顺序

### 阶段一：底座能力

```text
admin-mobile preset
导航骨架
权限控制
后台管理组件
分页列表
状态筛选
```

### 阶段二：核心业务页面

```text
登录
总览
设备列表
设备详情
任务列表
任务详情
管理入口
我的
```

### 阶段三：实时能力

```text
WebSocket
断线重连
状态降级轮询
实时日志
任务进度
设备在线状态
```

### 阶段四：管理模块

```text
托管用户
游戏模块
视觉资产
App 管理
运行日志
审批中心
```

### 阶段五：通用化

```text
把游戏业务组件与通用组件拆开
补齐文档
补齐示例
补齐 preset 生成器
供 HMN、发布中心复用
```

---

## 20. 验收标准

### 20.1 mobile-frame 验收

```text
可以通过 preset 创建后台管理移动端项目
可以复用后台管理组件
可以接入管理员权限
可以接入 WebSocket
可以分页加载列表
可以查看实时日志
可以扫码、复制、分享
```

### 20.2 game-helper-admin-mobile 验收

```text
管理员可以登录
可以查看总览
可以查看在线设备
可以查看设备详情
可以查看任务列表
可以查看任务详情
可以停止任务
可以重试任务
可以查看日志
可以查看截图证据
可以查看 App 发版记录
```

---

## 21. 最终结论

`mobile-frame` 需要做适配，但适配方向不是加入游戏脚本能力，而是新增一套后台管理移动端通用能力。

推荐最终形态：

```text
mobile-frame
├── 普通 App 底座
└── admin-mobile 后台管理端底座

game-helper-admin-mobile
└── 基于 admin-mobile preset 创建

game-helper-app
└── 继续承担 Worker、脚本执行、OCR、浮窗、无障碍能力
```

这样既能快速建设游戏后台管理移动端，也不会污染 `mobile-frame` 的通用性。
