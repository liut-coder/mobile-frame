# Mobile BFF Contracts

最后更新：2026-06-03

## 定位

`@mobile-frame/mobile-bff` 定义后台管理移动端访问 `/api/v1/mobile` 的 TypeScript 契约。它只表达移动端需要的轻量字段、分页查询、状态筛选和动作回执，不复用设备执行端 `/api/v1/device`。

## 当前能力

包内已提供：

- `MobileBffClient` typed client；
- dashboard、device、task、task log 数据类型；
- 托管用户、游戏模块、视觉资产、App 发版和运行日志的第二阶段管理域数据类型；
- 列表查询参数、分页响应和 facet 统计；
- fixture client，用于没有真实后端时驱动页面；
- HTTP client，将方法映射到 `/api/v1/mobile/*` 路径；
- 设备绑定、解绑、任务停止/重试、发版暂停/恢复动作回执。

## App 接入

`game-helper-admin-mobile` 通过 `apps/game-helper-admin-mobile/src/services/mobile-bff.ts` 创建 fixture-backed client，并把 dashboard、设备列表/详情、任务列表/详情、任务日志、托管用户、游戏模块、视觉资产、App 发版、运行日志、停止、重试、扫码绑定和发版暂停/恢复动作放到同一服务边界后面。

当前管理页只展示第二阶段管理域的 `/api/v1/mobile` 预览摘要，完整的托管用户、模块、资产、发版、运行日志和审批页面仍按第二阶段计划继续拆分。

页面不直接拼接 HTTP 路径，也不直接读取全部 fixture 后自行模拟后端查询。后续接真实后端时，应优先替换服务层里的 client 创建方式，例如从 fixture client 切换到 HTTP client。

## HTTP 映射

HTTP client 会请求：

```text
GET  /api/v1/mobile/dashboard
GET  /api/v1/mobile/devices
GET  /api/v1/mobile/devices/{id}
POST /api/v1/mobile/devices/{id}/bind
POST /api/v1/mobile/devices/{id}/unbind
GET  /api/v1/mobile/tasks
GET  /api/v1/mobile/tasks/{id}
POST /api/v1/mobile/tasks/{id}/stop
POST /api/v1/mobile/tasks/{id}/retry
GET  /api/v1/mobile/tasks/{id}/logs
GET  /api/v1/mobile/users
GET  /api/v1/mobile/users/{id}
GET  /api/v1/mobile/modules
GET  /api/v1/mobile/modules/{id}
GET  /api/v1/mobile/assets
GET  /api/v1/mobile/assets/{id}
GET  /api/v1/mobile/releases
GET  /api/v1/mobile/releases/{id}
POST /api/v1/mobile/releases/{id}/pause
POST /api/v1/mobile/releases/{id}/resume
GET  /api/v1/mobile/logs
```

列表接口支持：

```text
cursor
limit
query
status
```

`status` 可以重复出现，用于多状态筛选。
