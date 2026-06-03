import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { createAppConfig, MFAppProvider, useMFAppShellStore } from '@mobile-frame/app-shell';
import { getPreset } from '@mobile-frame/presets';
import { createTheme, type MFTheme } from '@mobile-frame/ui-core';
import {
  MFBadge,
  MFButton,
  MFCard,
  MFCaption,
  MFCheckbox,
  MFDivider,
  MFFormField,
  MFHeading,
  MFInput,
  MFKeyValue,
  MFListItem,
  MFPage,
  MFPasswordInput,
  MFProgress,
  MFRow,
  MFScrollPage,
  MFSearchBar,
  MFSegmentedControl,
  MFSheetHost,
  MFStack,
  MFStatusCard,
  MFStatCard,
  MFTabBar,
  MFText,
  MFToastHost
} from '@mobile-frame/ui-native';

type ScreenKey = 'splash' | 'login' | 'main';
type MainTab = 'dashboard' | 'devices' | 'tasks' | 'manage' | 'profile';
type RouteKey =
  | 'tabs'
  | 'managedUsers'
  | 'managedUserDetail'
  | 'managedUserForm'
  | 'bindDevice'
  | 'bindDeviceConfirm'
  | 'gameAccounts'
  | 'gameAccountForm'
  | 'userTaskHistory'
  | 'moduleGroups'
  | 'moduleGroupForm'
  | 'moduleGroupSort'
  | 'taskModules'
  | 'taskModuleDetail'
  | 'taskModuleForm'
  | 'taskModuleMove'
  | 'taskModuleDelete'
  | 'taskModuleSort'
  | 'taskCreateUser'
  | 'taskCreateAccount'
  | 'taskCreateDevice'
  | 'taskCreateGroup'
  | 'taskCreateModule'
  | 'taskCreateParams'
  | 'taskCreateConfirm'
  | 'taskExecutionDetail'
  | 'taskPauseConfirm'
  | 'taskCancelConfirm'
  | 'taskRetry'
  | 'alerts'
  | 'alertDetail'
  | 'logDetail'
  | 'releases'
  | 'releaseDetail'
  | 'releaseTargets'
  | 'opsCenter'
  | 'opsMonitoring'
  | 'auditLogs'
  | 'launchReadiness'
  | 'testPlan'
  | 'pendingDevices'
  | 'deviceDetail'
  | 'deviceActions'
  | 'deviceUnbind'
  | 'deviceAlert';
type Tone = 'info' | 'success' | 'warning' | 'danger';
type UserFormMode = 'create' | 'edit';
type ModuleFormMode = 'create' | 'edit';
type GameAccountFormMode = 'create' | 'edit';
type TaskRunStatus = 'running' | 'failed' | 'finished';

type ManagedUser = {
  accountCount: number;
  autoSchedule: boolean;
  code: string;
  currentTask: string;
  device: string;
  deviceStatus: string;
  id: string;
  name: string;
  progress: number;
  status: string;
};

type DeviceRecord = {
  adb: string;
  app: string;
  id: string;
  name: string;
  status: string;
  tone: Tone;
  user: string;
  worker: string;
};

type ModuleGroup = {
  enabled: boolean;
  id: string;
  key: string;
  moduleCount: number;
  name: string;
  order: number;
  showInApp: boolean;
};

type GameTaskModule = {
  enabled: boolean;
  groupId: string;
  id: string;
  key: string;
  name: string;
  retries: number;
  runTemplate: string;
  script: string;
  successRate: string;
  timeoutSeconds: number;
};

type GameAccount = {
  accountId: string;
  name: string;
  role: string;
  server: string;
  status: string;
  userId: string;
};

type TaskRun = {
  account: string;
  currentStep: string;
  device: string;
  group: string;
  id: string;
  logs: string[];
  moduleName: string;
  progress: number;
  similarity: string;
  status: TaskRunStatus;
  title: string;
  user: string;
  worker: string;
};

type AlertStatus = 'open' | 'processing' | 'resolved';

type AlertRecord = {
  createdAt: string;
  deviceId?: string;
  id: string;
  message: string;
  owner: string;
  source: string;
  status: AlertStatus;
  taskRunId?: string;
  title: string;
  tone: Tone;
};

type EvidenceRecord = {
  capturedAt: string;
  id: string;
  label: string;
  similarity: string;
  taskRunId: string;
};

type ReleaseRecord = {
  channel: string;
  checksum: string;
  failed: number;
  id: string;
  progress: number;
  rollout: string;
  size: string;
  status: string;
  summary: string;
  total: number;
  upgraded: number;
  version: string;
};

type ReleaseTarget = {
  deviceId: string;
  deviceName: string;
  id: string;
  progress: number;
  releaseId: string;
  status: string;
  tone: Tone;
  updatedAt: string;
};

type AuditLogRecord = {
  actor: string;
  createdAt: string;
  id: string;
  object: string;
  result: string;
  risk: Tone;
  title: string;
};

type ReadinessCheck = {
  detail: string;
  id: string;
  owner: string;
  status: string;
  title: string;
  tone: Tone;
};

type TestCaseRecord = {
  id: string;
  name: string;
  owner: string;
  result: string;
  scope: string;
  tone: Tone;
};

type RealtimeEventRecord = {
  channel: string;
  count: number;
  delay: string;
  id: string;
  status: string;
  tone: Tone;
};

const theme = createTheme('light');
const preset = getPreset('admin-mobile');

const tabs: Array<{ badge?: string; key: MainTab; label: string }> = [
  { key: 'dashboard', label: '总览' },
  { badge: '2', key: 'devices', label: '设备' },
  { badge: '6', key: 'tasks', label: '任务' },
  { key: 'manage', label: '管理' },
  { key: 'profile', label: '我的' }
];

const metrics = [
  { label: '托管用户', tab: 'manage' as const, value: '128' },
  { label: '在线设备', tab: 'devices' as const, value: '98' },
  { label: '执行中', tab: 'tasks' as const, value: '6' },
  { label: '异常', tab: 'devices' as const, value: '4' }
];

const runningTasks = [
  { device: 'Pixel 7 Pro', progress: 0.72, status: '执行中', title: '随缘打熊', user: '用户 A / 王国 01' },
  { device: 'Redmi K70', progress: 0.41, status: '等待截图', title: '联盟签到', user: '用户 D / 王国 02' },
  { device: 'Galaxy S24', progress: 0.18, status: '排队中', title: '日常采集', user: '用户 K / 王国 09' }
];

const fallbackManagedUser: ManagedUser = {
  accountCount: 2,
  autoSchedule: true,
  code: 'managed-user-10001',
  currentTask: '随缘打熊',
  device: 'Pixel 7 Pro',
  deviceStatus: '在线',
  id: 'mu-10001',
  name: '用户 A',
  progress: 0.72,
  status: '托管中'
};

const managedUsers: ManagedUser[] = [
  fallbackManagedUser,
  {
    accountCount: 1,
    autoSchedule: true,
    code: 'managed-user-10004',
    currentTask: '联盟签到',
    device: 'Redmi K70',
    deviceStatus: '异常',
    id: 'mu-10004',
    name: '用户 D',
    progress: 0.41,
    status: '需处理'
  },
  {
    accountCount: 3,
    autoSchedule: false,
    code: 'managed-user-10011',
    currentTask: '日常采集',
    device: 'Galaxy S24',
    deviceStatus: '离线',
    id: 'mu-10011',
    name: '用户 K',
    progress: 0.18,
    status: '暂停托管'
  }
];

const devices: DeviceRecord[] = [
  { adb: 'ADB 正常', app: 'v0.3.2', id: 'dev-pixel-7-pro', name: 'Pixel 7 Pro', status: '在线', tone: 'success', user: '用户 A', worker: 'Worker v0.3.2' },
  { adb: 'ADB 异常', app: 'v0.3.2', id: 'dev-redmi-k70', name: 'Redmi K70', status: '异常', tone: 'danger', user: '用户 D', worker: 'Worker v0.3.2' },
  { adb: 'Worker 离线', app: 'v0.3.1', id: 'dev-galaxy-s24', name: 'Galaxy S24', status: '离线', tone: 'warning', user: '用户 K', worker: 'Worker v0.3.1' }
];

const fallbackDevice = devices[0] ?? {
  adb: 'ADB 正常',
  app: 'v0.3.2',
  id: 'dev-placeholder',
  name: 'Pixel 7 Pro',
  status: '在线',
  tone: 'success' as const,
  user: '用户 A',
  worker: 'Worker v0.3.2'
};

const gameAccounts: GameAccount[] = [
  { accountId: 'ACCT-10001-0001', name: '王国 01', role: '战神无双', server: 'S23-荣耀之巅', status: '启用', userId: 'mu-10001' },
  { accountId: 'ACCT-10001-0002', name: '王国 02', role: '云中游侠', server: 'S24-曙光前线', status: '备用', userId: 'mu-10001' },
  { accountId: 'ACCT-10004-0001', name: '王国 07', role: '荒野领主', server: 'S31-烈焰高地', status: '启用', userId: 'mu-10004' },
  { accountId: 'ACCT-10011-0001', name: '王国 09', role: '晨星骑士', server: 'S42-群山之门', status: '暂停', userId: 'mu-10011' }
];

const fallbackGameAccount = gameAccounts[0] ?? {
  accountId: 'ACCT-PLACEHOLDER',
  name: '王国 01',
  role: '战神无双',
  server: 'S23-荣耀之巅',
  status: '启用',
  userId: fallbackManagedUser.id
};

const pendingDevices = [
  { bindingCode: '9X7Q-2M4K-8L3R', name: 'OnePlus 12', status: '等待绑定' },
  { bindingCode: '837291', name: 'Pixel 8', status: '已识别' }
];

const taskRuns: TaskRun[] = [
  {
    account: '王国 01',
    currentStep: '识别野怪并进入战斗',
    device: 'Pixel 7 Pro',
    group: '日常活动',
    id: 'run-20260603-001',
    logs: ['10:21:12 Worker claim 成功', '10:21:38 截图完成，相似度 0.86', '10:22:04 已进入战斗，等待结算'],
    moduleName: '随缘打熊',
    progress: 0.72,
    similarity: '0.86',
    status: 'running',
    title: '随缘打熊 #001',
    user: '用户 A',
    worker: 'Worker v0.3.2'
  },
  {
    account: '王国 07',
    currentStep: '领奖入口识别失败',
    device: 'OnePlus 12',
    group: '日常活动',
    id: 'run-20260603-002',
    logs: ['09:47:01 Worker claim 成功', '09:47:19 未匹配到领奖按钮', '09:47:23 TASK_EXEC_FAILED: similarity 0.42'],
    moduleName: '王国领奖',
    progress: 0.06,
    similarity: '0.42',
    status: 'failed',
    title: '王国领奖 #002',
    user: '用户 D',
    worker: 'Worker v0.3.2'
  },
  {
    account: '王国 02',
    currentStep: 'finish 已上报',
    device: 'Redmi K70',
    group: '日常活动',
    id: 'run-20260603-003',
    logs: ['08:10:05 Worker claim 成功', '08:10:24 签到按钮已点击', '08:10:31 finish 上报成功'],
    moduleName: '联盟签到',
    progress: 1,
    similarity: '0.93',
    status: 'finished',
    title: '联盟签到 #003',
    user: '用户 A',
    worker: 'Worker v0.3.2'
  }
];

const fallbackTaskRun = taskRuns[0] ?? {
  account: fallbackGameAccount.name,
  currentStep: '等待 Worker claim',
  device: fallbackDevice.name,
  group: '日常活动',
  id: 'run-placeholder',
  logs: ['任务已创建，等待设备领取。'],
  moduleName: '随缘打熊',
  progress: 0,
  similarity: '0.00',
  status: 'running' as const,
  title: '随缘打熊',
  user: fallbackManagedUser.name,
  worker: fallbackDevice.worker
};

const fallbackModuleGroup: ModuleGroup = {
  enabled: true,
  id: 'group-daily',
  key: 'daily-activity',
  moduleCount: 12,
  name: '日常活动',
  order: 10,
  showInApp: true
};

const moduleGroups: ModuleGroup[] = [
  fallbackModuleGroup,
  {
    enabled: true,
    id: 'group-queue',
    key: 'queue-related',
    moduleCount: 8,
    name: '队列相关',
    order: 20,
    showInApp: true
  },
  {
    enabled: false,
    id: 'group-basic',
    key: 'basic-settings',
    moduleCount: 5,
    name: '基础设置',
    order: 30,
    showInApp: false
  }
];

const taskModules: GameTaskModule[] = [
  {
    enabled: true,
    groupId: 'group-daily',
    id: 'task-random-bear',
    key: 'task-random-bear',
    name: '随缘打熊',
    retries: 2,
    runTemplate: 'tpl-bear-01',
    script: 'bear.js',
    successRate: '92.1%',
    timeoutSeconds: 300
  },
  {
    enabled: true,
    groupId: 'group-daily',
    id: 'task-alliance-signin',
    key: 'task-alliance-signin',
    name: '联盟签到',
    retries: 1,
    runTemplate: 'tpl-signin-01',
    script: 'alliance-signin.js',
    successRate: '96.4%',
    timeoutSeconds: 120
  },
  {
    enabled: false,
    groupId: 'group-queue',
    id: 'task-daily-gather',
    key: 'task-daily-gather',
    name: '日常采集',
    retries: 2,
    runTemplate: 'tpl-gather-02',
    script: 'daily-gather.js',
    successRate: '88.7%',
    timeoutSeconds: 240
  }
];

const fallbackTaskModule = taskModules[0] ?? {
  enabled: true,
  groupId: fallbackModuleGroup.id,
  id: 'task-placeholder',
  key: 'task-placeholder',
  name: '随缘打熊',
  retries: 2,
  runTemplate: 'tpl-bear-01',
  script: 'bear.js',
  successRate: '92.1%',
  timeoutSeconds: 300
};

const managementEntries = [
  { meta: '128 个用户，98 台在线设备', target: '托管用户列表', title: '托管用户' },
  { meta: '8 个分组，32 个具体任务模块', target: '游戏模块分组', title: '游戏模块' },
  { meta: '线上 v0.3.2，灰度 v0.3.3', target: 'APP 发版中心', title: 'APP 管理 / 发版中心' },
  { meta: '测试、监控、审计和上线检查', target: '上线运维', title: '测试 / 监控 / 上线' }
];

const profileEntries: Array<{ meta: string; title: string }> = [
  { meta: '手机号、邮箱、部门', title: '个人信息' },
  { meta: '告警、任务、发版', title: '通知设置' },
  { meta: '服务地址、缓存、主题', title: '系统设置' },
  { meta: preset.features.join(' / '), title: '权限' },
  { meta: '解绑、取消任务、回滚和发版审计', title: '操作日志' }
];

const alerts: AlertRecord[] = [
  {
    createdAt: '10:26',
    deviceId: 'dev-redmi-k70',
    id: 'alert-adb-redmi',
    message: 'Redmi K70 最近一次心跳 6 分钟前，ADB 连接异常。',
    owner: '运维值班',
    source: 'device.status.changed',
    status: 'open',
    taskRunId: 'run-20260603-002',
    title: '设备连接异常',
    tone: 'danger'
  },
  {
    createdAt: '09:47',
    deviceId: 'dev-redmi-k70',
    id: 'alert-task-failed',
    message: '王国领奖任务在领奖入口识别失败，最近相似度 0.42。',
    owner: '任务调度',
    source: 'task.progress',
    status: 'processing',
    taskRunId: 'run-20260603-002',
    title: '任务执行失败',
    tone: 'danger'
  },
  {
    createdAt: '08:35',
    id: 'alert-release-gray',
    message: 'v0.3.3 灰度覆盖 18 台设备，失败 2 台。',
    owner: '发版管理员',
    source: 'release.device.updated',
    status: 'open',
    title: '灰度升级失败',
    tone: 'warning'
  }
];

const fallbackAlert = alerts[0] ?? {
  createdAt: '10:26',
  deviceId: fallbackDevice.id,
  id: 'alert-placeholder',
  message: 'Redmi K70 最近一次心跳 6 分钟前，ADB 连接异常。',
  owner: '运维值班',
  source: 'device.status.changed',
  status: 'open' as const,
  taskRunId: fallbackTaskRun.id,
  title: '设备连接异常',
  tone: 'danger' as const
};

const evidenceRecords: EvidenceRecord[] = [
  { capturedAt: '09:47:18', id: 'ev-run-002-before', label: '领奖入口识别截图', similarity: '0.42', taskRunId: 'run-20260603-002' },
  { capturedAt: '09:47:23', id: 'ev-run-002-failed', label: '失败现场截图', similarity: '0.39', taskRunId: 'run-20260603-002' },
  { capturedAt: '10:21:38', id: 'ev-run-001-match', label: '野怪识别截图', similarity: '0.86', taskRunId: 'run-20260603-001' }
];

const releases: ReleaseRecord[] = [
  {
    channel: '正式',
    checksum: 'sha256:9f7c...21ab',
    failed: 2,
    id: 'rel-0-3-3',
    progress: 0.875,
    rollout: '灰度 20%',
    size: '89.6 MB',
    status: '灰度中',
    summary: '优化 Worker 心跳、任务日志上报和截图证据上传。',
    total: 112,
    upgraded: 98,
    version: 'v0.3.3'
  },
  {
    channel: '正式',
    checksum: 'sha256:71aa...08df',
    failed: 0,
    id: 'rel-0-3-2',
    progress: 1,
    rollout: '全量',
    size: '87.2 MB',
    status: '线上版本',
    summary: '稳定版，支持任务调度、设备绑定和基础日志。',
    total: 112,
    upgraded: 112,
    version: 'v0.3.2'
  }
];

const fallbackRelease = releases[0] ?? {
  channel: '正式',
  checksum: 'sha256:placeholder',
  failed: 0,
  id: 'rel-placeholder',
  progress: 0,
  rollout: '测试',
  size: '0 MB',
  status: '草稿',
  summary: '待上传安装包。',
  total: 0,
  upgraded: 0,
  version: 'v0.0.0'
};

const releaseTargets: ReleaseTarget[] = [
  { deviceId: 'dev-pixel-7-pro', deviceName: 'Pixel 7 Pro', id: 'target-pixel-7-pro', progress: 1, releaseId: 'rel-0-3-3', status: '已升级', tone: 'success', updatedAt: '10:08' },
  { deviceId: 'dev-redmi-k70', deviceName: 'Redmi K70', id: 'target-redmi-k70', progress: 0.36, releaseId: 'rel-0-3-3', status: '安装失败', tone: 'danger', updatedAt: '10:18' },
  { deviceId: 'dev-galaxy-s24', deviceName: 'Galaxy S24', id: 'target-galaxy-s24', progress: 0.64, releaseId: 'rel-0-3-3', status: '下载中', tone: 'warning', updatedAt: '10:20' }
];

const realtimeEvents: RealtimeEventRecord[] = [
  { channel: 'device.status.changed', count: 286, delay: '0.8s', id: 'evt-device-status', status: '正常', tone: 'success' },
  { channel: 'task.progress', count: 1248, delay: '1.1s', id: 'evt-task-progress', status: '正常', tone: 'success' },
  { channel: 'alert.created', count: 12, delay: '0.6s', id: 'evt-alert-created', status: '正常', tone: 'success' },
  { channel: 'release.device.updated', count: 18, delay: '2.4s', id: 'evt-release-device', status: '关注', tone: 'warning' }
];

const auditLogs: AuditLogRecord[] = [
  { actor: 'Admin', createdAt: '10:28:19', id: 'audit-stop-release', object: 'rel-0-3-3', result: '已写入审计', risk: 'warning', title: '停止发布预检查' },
  { actor: '运维值班', createdAt: '10:12:44', id: 'audit-restart-worker', object: 'dev-redmi-k70', result: '指令已下发', risk: 'danger', title: '重启 Worker' },
  { actor: '任务调度', createdAt: '09:51:02', id: 'audit-cancel-task', object: 'run-20260603-002', result: '任务已取消', risk: 'danger', title: '取消任务' },
  { actor: '发版管理员', createdAt: '08:42:35', id: 'audit-expand-rollout', object: 'rel-0-3-3', result: '灰度扩大到 20%', risk: 'warning', title: '扩大灰度' }
];

const readinessChecks: ReadinessCheck[] = [
  { detail: '管理员 Token 仅进入 Keychain / Keystore，不落本地明文缓存。', id: 'ready-secure-token', owner: '安全', status: '通过', title: '安全存储', tone: 'success' },
  { detail: '解绑、取消任务、重启 Worker、停止发布和回滚都进入审计日志。', id: 'ready-audit', owner: '后端', status: '通过', title: '危险操作审计', tone: 'success' },
  { detail: 'release.device.updated 延迟 2.4 秒，发布期间需要保持监控。', id: 'ready-realtime', owner: '实时链路', status: '关注', title: '实时事件延迟', tone: 'warning' },
  { detail: 'APK 与证据截图已按短时签名 URL 设计，等待正式对象存储联调。', id: 'ready-signed-url', owner: '存储', status: '待联调', title: '签名 URL', tone: 'warning' }
];

const testCases: TestCaseRecord[] = [
  { id: 'case-login', name: '登录与 Token 刷新', owner: '移动端', result: '通过', scope: '登录、登出、会话恢复', tone: 'success' },
  { id: 'case-task-flow', name: '任务调度闭环', owner: '调度', result: '通过', scope: '新建、执行、暂停、重试、日志', tone: 'success' },
  { id: 'case-release-flow', name: 'APP 发版流程', owner: '发版', result: '关注', scope: '上传、灰度、失败重试、停止发布', tone: 'warning' },
  { id: 'case-alert-flow', name: '告警与证据', owner: '运维', result: '通过', scope: '告警详情、日志、证据截图', tone: 'success' }
];

export function App() {
  const [screen, setScreen] = useState<ScreenKey>('splash');
  const [tab, setTab] = useState<MainTab>('dashboard');
  const [rememberLogin, setRememberLogin] = useState(true);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'online' | 'alert'>('all');
  const [route, setRoute] = useState<RouteKey>('tabs');
  const [selectedDeviceId, setSelectedDeviceId] = useState(fallbackDevice.id);
  const [selectedModuleGroupId, setSelectedModuleGroupId] = useState(fallbackModuleGroup.id);
  const [selectedTaskModuleId, setSelectedTaskModuleId] = useState(fallbackTaskModule.id);
  const [selectedUserId, setSelectedUserId] = useState(fallbackManagedUser.id);
  const [selectedGameAccountId, setSelectedGameAccountId] = useState(fallbackGameAccount.accountId);
  const [selectedTaskRunId, setSelectedTaskRunId] = useState(fallbackTaskRun.id);
  const [selectedAlertId, setSelectedAlertId] = useState(fallbackAlert.id);
  const [selectedReleaseId, setSelectedReleaseId] = useState(fallbackRelease.id);
  const [logBackRoute, setLogBackRoute] = useState<RouteKey>('taskExecutionDetail');
  const [draftTaskRun, setDraftTaskRun] = useState<TaskRun | null>(null);
  const [taskFilter, setTaskFilter] = useState<'running' | 'failed' | 'finished'>('running');
  const [gameAccountFormMode, setGameAccountFormMode] = useState<GameAccountFormMode>('create');
  const [moduleFormMode, setModuleFormMode] = useState<ModuleFormMode>('create');
  const [userFormMode, setUserFormMode] = useState<UserFormMode>('create');

  const closeSheet = useMFAppShellStore((state) => state.closeSheet);
  const hideToast = useMFAppShellStore((state) => state.hideToast);
  const openShellSheet = useMFAppShellStore((state) => state.openSheet);
  const sheet = useMFAppShellStore((state) => state.sheet);
  const showShellToast = useMFAppShellStore((state) => state.showToast);
  const toast = useMFAppShellStore((state) => state.toast);

  const config = useMemo(
    () =>
      createAppConfig({
        appId: 'com.misk.gamehelperadminmobile',
        displayName: '游戏助手管理端',
        theme
      }),
    []
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => hideToast(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [hideToast, toast]);

  const availableTaskRuns = useMemo(() => (draftTaskRun ? [draftTaskRun, ...taskRuns] : taskRuns), [draftTaskRun]);

  const actions = {
    goLogin: () => setScreen('login'),
    goMain: (nextTab: MainTab = 'dashboard') => {
      setRoute('tabs');
      setTab(nextTab);
      setScreen('main');
    },
    goRoute: (nextRoute: RouteKey) => setRoute(nextRoute),
    goTabs: (nextTab?: MainTab) => {
      if (nextTab) {
        setTab(nextTab);
      }
      setRoute('tabs');
    },
    openAlert: (alertId: string) => {
      const alert = alerts.find((item) => item.id === alertId) ?? fallbackAlert;
      setSelectedAlertId(alert.id);
      if (alert.deviceId) {
        setSelectedDeviceId(alert.deviceId);
      }
      if (alert.taskRunId) {
        setSelectedTaskRunId(alert.taskRunId);
      }
      setRoute('alertDetail');
    },
    openLogDetail: (taskRunId?: string, alertId?: string, backRoute: RouteKey = 'taskExecutionDetail') => {
      if (taskRunId) {
        setSelectedTaskRunId(taskRunId);
      }
      if (alertId) {
        setSelectedAlertId(alertId);
      }
      setLogBackRoute(backRoute);
      setRoute('logDetail');
    },
    openTaskRun: (taskRunId: string) => {
      setSelectedTaskRunId(taskRunId);
      setRoute('taskExecutionDetail');
    },
    openSheet: (title: string, body: string) => openShellSheet({ body, title }),
    openDevice: (deviceId: string, nextRoute: 'deviceDetail' | 'deviceActions' | 'deviceUnbind' | 'deviceAlert' = 'deviceDetail') => {
      setSelectedDeviceId(deviceId);
      setRoute(nextRoute);
    },
    openBindDevice: (userId: string) => {
      setSelectedUserId(userId);
      setRoute('bindDevice');
    },
    openBindDeviceConfirm: (userId: string) => {
      setSelectedUserId(userId);
      setRoute('bindDeviceConfirm');
    },
    openGameAccountForm: (mode: GameAccountFormMode, accountId?: string) => {
      if (accountId) {
        setSelectedGameAccountId(accountId);
      }
      setGameAccountFormMode(mode);
      setRoute('gameAccountForm');
    },
    openManagedUser: (userId: string) => {
      setSelectedUserId(userId);
      setRoute('managedUserDetail');
    },
    openModuleGroup: (groupId: string) => {
      setSelectedModuleGroupId(groupId);
      setRoute('taskModules');
    },
    openModuleGroupForm: (mode: ModuleFormMode, groupId?: string) => {
      if (groupId) {
        setSelectedModuleGroupId(groupId);
      }
      setModuleFormMode(mode);
      setRoute('moduleGroupForm');
    },
    openRelease: (releaseId: string) => {
      setSelectedReleaseId(releaseId);
      setRoute('releaseDetail');
    },
    openTaskModule: (moduleId: string) => {
      setSelectedTaskModuleId(moduleId);
      setRoute('taskModuleDetail');
    },
    openTaskModuleForm: (mode: ModuleFormMode, moduleId?: string) => {
      if (moduleId) {
        setSelectedTaskModuleId(moduleId);
      }
      setModuleFormMode(mode);
      setRoute('taskModuleForm');
    },
    openTaskModuleMove: (moduleId: string) => {
      setSelectedTaskModuleId(moduleId);
      setRoute('taskModuleMove');
    },
    openUserForm: (mode: UserFormMode, userId?: string) => {
      if (userId) {
        setSelectedUserId(userId);
      }
      setUserFormMode(mode);
      setRoute('managedUserForm');
    },
    selectTaskAccount: (accountId: string) => {
      setSelectedGameAccountId(accountId);
      setRoute('taskCreateDevice');
    },
    selectTaskDevice: (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      setRoute('taskCreateGroup');
    },
    selectTaskGroup: (groupId: string) => {
      const firstModule = taskModules.find((taskModule) => taskModule.groupId === groupId) ?? fallbackTaskModule;
      setSelectedModuleGroupId(groupId);
      setSelectedTaskModuleId(firstModule.id);
      setRoute('taskCreateModule');
    },
    selectTaskModule: (moduleId: string) => {
      setSelectedTaskModuleId(moduleId);
      setRoute('taskCreateParams');
    },
    selectTaskUser: (userId: string) => {
      const user = managedUsers.find((managedUser) => managedUser.id === userId) ?? fallbackManagedUser;
      const account = gameAccounts.find((gameAccount) => gameAccount.userId === user.id) ?? fallbackGameAccount;
      const device = devices.find((deviceRecord) => deviceRecord.name === user.device) ?? fallbackDevice;
      setSelectedUserId(user.id);
      setSelectedGameAccountId(account.accountId);
      setSelectedDeviceId(device.id);
      setRoute('taskCreateAccount');
    },
    setDeviceFilter,
    setRememberLogin,
    setTab,
    setTaskFilter,
    showToast: (message: string) => showShellToast(message),
    startTaskCreation: () => {
      const account = gameAccounts.find((gameAccount) => gameAccount.userId === fallbackManagedUser.id) ?? fallbackGameAccount;
      const device = devices.find((deviceRecord) => deviceRecord.name === fallbackManagedUser.device) ?? fallbackDevice;
      setSelectedUserId(fallbackManagedUser.id);
      setSelectedGameAccountId(account.accountId);
      setSelectedDeviceId(device.id);
      setSelectedModuleGroupId(fallbackModuleGroup.id);
      setSelectedTaskModuleId(fallbackTaskModule.id);
      setTab('tasks');
      setRoute('taskCreateUser');
    },
    startTaskRetry: (taskRunId: string) => {
      setSelectedTaskRunId(taskRunId);
      setRoute('taskRetry');
    },
    submitTaskRun: () => {
      const account = gameAccounts.find((gameAccount) => gameAccount.accountId === selectedGameAccountId) ?? fallbackGameAccount;
      const device = devices.find((deviceRecord) => deviceRecord.id === selectedDeviceId) ?? fallbackDevice;
      const group = moduleGroups.find((moduleGroup) => moduleGroup.id === selectedModuleGroupId) ?? fallbackModuleGroup;
      const taskModule = taskModules.find((module) => module.id === selectedTaskModuleId) ?? fallbackTaskModule;
      const user = managedUsers.find((managedUser) => managedUser.id === selectedUserId) ?? fallbackManagedUser;
      const newRun: TaskRun = {
        account: account.name,
        currentStep: '等待 Worker claim',
        device: device.name,
        group: group.name,
        id: `run-draft-${Date.now()}`,
        logs: ['任务已下发，等待设备 poll / claim。'],
        moduleName: taskModule.name,
        progress: 0.02,
        similarity: '0.00',
        status: 'running',
        title: `${taskModule.name} #新建`,
        user: user.name,
        worker: device.worker
      };
      setDraftTaskRun(newRun);
      setSelectedTaskRunId(newRun.id);
      setTaskFilter('running');
      setRoute('taskExecutionDetail');
      showShellToast('任务已下发，等待设备领取');
    }
  };

  return (
    <MFAppProvider config={config}>
      <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
        {screen === 'splash' ? <SplashScreen actions={actions} theme={theme} /> : null}
        {screen === 'login' ? <LoginScreen actions={actions} rememberLogin={rememberLogin} theme={theme} /> : null}
        {screen === 'main' ? (
          <MainScreen
            actions={actions}
            activeTab={tab}
            deviceFilter={deviceFilter}
            moduleFormMode={moduleFormMode}
            logBackRoute={logBackRoute}
            route={route}
            selectedRelease={releases.find((release) => release.id === selectedReleaseId) ?? fallbackRelease}
            selectedAlert={alerts.find((alert) => alert.id === selectedAlertId) ?? fallbackAlert}
            selectedDevice={devices.find((device) => device.id === selectedDeviceId) ?? fallbackDevice}
            selectedGameAccount={gameAccounts.find((account) => account.accountId === selectedGameAccountId) ?? fallbackGameAccount}
            gameAccountFormMode={gameAccountFormMode}
            selectedModuleGroup={moduleGroups.find((group) => group.id === selectedModuleGroupId) ?? fallbackModuleGroup}
            selectedTaskModule={taskModules.find((taskModule) => taskModule.id === selectedTaskModuleId) ?? fallbackTaskModule}
            selectedTaskRun={availableTaskRuns.find((taskRun) => taskRun.id === selectedTaskRunId) ?? fallbackTaskRun}
            selectedUser={managedUsers.find((user) => user.id === selectedUserId) ?? fallbackManagedUser}
            taskFilter={taskFilter}
            taskRuns={availableTaskRuns}
            theme={theme}
            userFormMode={userFormMode}
          />
        ) : null}
        <MFToastHost toast={toast} theme={theme} />
        <MFSheetHost onClose={closeSheet} sheet={sheet} theme={theme} />
      </View>
    </MFAppProvider>
  );
}

type AdminActions = {
  goLogin: () => void;
  goMain: (nextTab?: MainTab) => void;
  goRoute: (nextRoute: RouteKey) => void;
  goTabs: (nextTab?: MainTab) => void;
  openAlert: (alertId: string) => void;
  openBindDevice: (userId: string) => void;
  openBindDeviceConfirm: (userId: string) => void;
  openDevice: (deviceId: string, nextRoute?: 'deviceDetail' | 'deviceActions' | 'deviceUnbind' | 'deviceAlert') => void;
  openGameAccountForm: (mode: GameAccountFormMode, accountId?: string) => void;
  openLogDetail: (taskRunId?: string, alertId?: string, backRoute?: RouteKey) => void;
  openManagedUser: (userId: string) => void;
  openModuleGroup: (groupId: string) => void;
  openModuleGroupForm: (mode: ModuleFormMode, groupId?: string) => void;
  openRelease: (releaseId: string) => void;
  openSheet: (title: string, body: string) => void;
  openTaskRun: (taskRunId: string) => void;
  openTaskModule: (moduleId: string) => void;
  openTaskModuleForm: (mode: ModuleFormMode, moduleId?: string) => void;
  openTaskModuleMove: (moduleId: string) => void;
  openUserForm: (mode: UserFormMode, userId?: string) => void;
  selectTaskAccount: (accountId: string) => void;
  selectTaskDevice: (deviceId: string) => void;
  selectTaskGroup: (groupId: string) => void;
  selectTaskModule: (moduleId: string) => void;
  selectTaskUser: (userId: string) => void;
  setDeviceFilter: (value: 'all' | 'online' | 'alert') => void;
  setRememberLogin: (value: boolean) => void;
  setTab: (value: MainTab) => void;
  setTaskFilter: (value: 'running' | 'failed' | 'finished') => void;
  showToast: (message: string) => void;
  startTaskCreation: () => void;
  startTaskRetry: (taskRunId: string) => void;
  submitTaskRun: () => void;
};

function SplashScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFPage centered theme={theme} style={{ backgroundColor: '#F8FAFD' }}>
      <MFStack gap={24} style={{ alignItems: 'center' }}>
        <LogoMark theme={theme} size={92} />
        <MFStack gap={8} style={{ alignItems: 'center' }}>
          <MFHeading theme={theme} style={{ textAlign: 'center' }}>
            游戏助手管理端
          </MFHeading>
          <MFText muted theme={theme}>
            正在连接服务
          </MFText>
        </MFStack>
        <MFCard theme={theme} style={{ alignSelf: 'stretch' }}>
          <MFStack gap={12}>
            <MFStatusCard message="Mobile API、Device API 与实时网关等待接入。" theme={theme} title="管理端移动化 Phase 1" tone="success" />
            <MFProgress label="应用初始化" theme={theme} value={0.68} />
            <MFCaption theme={theme}>v0.1.0</MFCaption>
          </MFStack>
        </MFCard>
        <MFButton onPress={actions.goLogin} theme={theme} title="进入管理端" />
      </MFStack>
    </MFPage>
  );
}

function LoginScreen({
  actions,
  rememberLogin,
  theme
}: {
  actions: AdminActions;
  rememberLogin: boolean;
  theme: MFTheme;
}) {
  return (
    <MFScrollPage theme={theme} style={{ paddingTop: 44 }}>
      <MFStack gap={18}>
        <MFStack gap={12} style={{ alignItems: 'center' }}>
          <LogoMark theme={theme} size={76} />
          <MFHeading theme={theme} style={{ textAlign: 'center' }}>
            管理员登录
          </MFHeading>
          <MFCaption theme={theme}>管理员账号用于调度、排障、审计和发版。</MFCaption>
        </MFStack>
        <MFCard theme={theme}>
          <MFStack gap={14}>
            <MFFormField label="账号" required theme={theme}>
              <MFInput autoCapitalize="none" defaultValue="admin@example.com" placeholder="请输入管理员账号" theme={theme} />
            </MFFormField>
            <MFFormField label="密码" required theme={theme}>
              <MFPasswordInput defaultValue="admin-password" placeholder="请输入密码" theme={theme} />
            </MFFormField>
            <MFCheckbox label="记住登录状态" onValueChange={actions.setRememberLogin} theme={theme} value={rememberLogin} />
            <MFButton onPress={() => actions.goMain('dashboard')} theme={theme} title="登录" />
          </MFStack>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          <MFListItem
            meta="/api/v1/mobile · /ws/admin"
            onPress={() => actions.openSheet('服务地址', '当前原型使用 api.example.com。正式接入时登录页会打开服务地址配置抽屉。')}
            theme={theme}
            title="api.example.com"
          />
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function MainScreen({
  actions,
  activeTab,
  deviceFilter,
  gameAccountFormMode,
  logBackRoute,
  moduleFormMode,
  route,
  selectedAlert,
  selectedDevice,
  selectedGameAccount,
  selectedModuleGroup,
  selectedRelease,
  selectedTaskModule,
  selectedTaskRun,
  selectedUser,
  taskFilter,
  taskRuns,
  theme,
  userFormMode
}: {
  actions: AdminActions;
  activeTab: MainTab;
  deviceFilter: 'all' | 'online' | 'alert';
  gameAccountFormMode: GameAccountFormMode;
  logBackRoute: RouteKey;
  moduleFormMode: ModuleFormMode;
  route: RouteKey;
  selectedAlert: AlertRecord;
  selectedDevice: DeviceRecord;
  selectedGameAccount: GameAccount;
  selectedModuleGroup: ModuleGroup;
  selectedRelease: ReleaseRecord;
  selectedTaskModule: GameTaskModule;
  selectedTaskRun: TaskRun;
  selectedUser: ManagedUser;
  taskFilter: 'running' | 'failed' | 'finished';
  taskRuns: TaskRun[];
  theme: MFTheme;
  userFormMode: UserFormMode;
}) {
  if (route === 'managedUsers') {
    return <ManagedUsersScreen actions={actions} theme={theme} />;
  }

  if (route === 'managedUserDetail') {
    return <ManagedUserDetailScreen actions={actions} theme={theme} user={selectedUser} />;
  }

  if (route === 'managedUserForm') {
    return <ManagedUserFormScreen actions={actions} mode={userFormMode} theme={theme} user={selectedUser} />;
  }

  if (route === 'bindDevice') {
    return <BindDeviceScreen actions={actions} theme={theme} user={selectedUser} />;
  }

  if (route === 'bindDeviceConfirm') {
    return <BindDeviceConfirmScreen actions={actions} theme={theme} user={selectedUser} />;
  }

  if (route === 'gameAccounts') {
    return <GameAccountsScreen actions={actions} theme={theme} user={selectedUser} />;
  }

  if (route === 'gameAccountForm') {
    return <GameAccountFormScreen account={selectedGameAccount} actions={actions} mode={gameAccountFormMode} theme={theme} user={selectedUser} />;
  }

  if (route === 'userTaskHistory') {
    return <UserTaskHistoryScreen actions={actions} taskRuns={taskRuns} theme={theme} user={selectedUser} />;
  }

  if (route === 'moduleGroups') {
    return <ModuleGroupsScreen actions={actions} theme={theme} />;
  }

  if (route === 'moduleGroupForm') {
    return <ModuleGroupFormScreen actions={actions} group={selectedModuleGroup} mode={moduleFormMode} theme={theme} />;
  }

  if (route === 'moduleGroupSort') {
    return <ModuleGroupSortScreen actions={actions} theme={theme} />;
  }

  if (route === 'taskModules') {
    return <TaskModulesScreen actions={actions} group={selectedModuleGroup} theme={theme} />;
  }

  if (route === 'taskModuleDetail') {
    return <TaskModuleDetailScreen actions={actions} module={selectedTaskModule} theme={theme} />;
  }

  if (route === 'taskModuleForm') {
    return <TaskModuleFormScreen actions={actions} group={selectedModuleGroup} mode={moduleFormMode} module={selectedTaskModule} theme={theme} />;
  }

  if (route === 'taskModuleMove') {
    return <TaskModuleMoveScreen actions={actions} module={selectedTaskModule} theme={theme} />;
  }

  if (route === 'taskModuleDelete') {
    return <TaskModuleDeleteScreen actions={actions} module={selectedTaskModule} theme={theme} />;
  }

  if (route === 'taskModuleSort') {
    return <TaskModuleSortScreen actions={actions} group={selectedModuleGroup} theme={theme} />;
  }

  if (route === 'taskCreateUser') {
    return <TaskCreateUserScreen actions={actions} selectedUser={selectedUser} theme={theme} />;
  }

  if (route === 'taskCreateAccount') {
    return <TaskCreateAccountScreen actions={actions} selectedAccount={selectedGameAccount} selectedUser={selectedUser} theme={theme} />;
  }

  if (route === 'taskCreateDevice') {
    return <TaskCreateDeviceScreen actions={actions} selectedDevice={selectedDevice} selectedUser={selectedUser} theme={theme} />;
  }

  if (route === 'taskCreateGroup') {
    return <TaskCreateGroupScreen actions={actions} selectedAccount={selectedGameAccount} selectedDevice={selectedDevice} selectedUser={selectedUser} theme={theme} />;
  }

  if (route === 'taskCreateModule') {
    return <TaskCreateModuleScreen actions={actions} group={selectedModuleGroup} selectedModule={selectedTaskModule} theme={theme} />;
  }

  if (route === 'taskCreateParams') {
    return <TaskCreateParamsScreen actions={actions} module={selectedTaskModule} theme={theme} />;
  }

  if (route === 'taskCreateConfirm') {
    return (
      <TaskCreateConfirmScreen
        account={selectedGameAccount}
        actions={actions}
        device={selectedDevice}
        group={selectedModuleGroup}
        module={selectedTaskModule}
        theme={theme}
        user={selectedUser}
      />
    );
  }

  if (route === 'taskExecutionDetail') {
    return <TaskExecutionDetailScreen actions={actions} taskRun={selectedTaskRun} theme={theme} />;
  }

  if (route === 'taskPauseConfirm') {
    return <TaskPauseConfirmScreen actions={actions} taskRun={selectedTaskRun} theme={theme} />;
  }

  if (route === 'taskCancelConfirm') {
    return <TaskCancelConfirmScreen actions={actions} taskRun={selectedTaskRun} theme={theme} />;
  }

  if (route === 'taskRetry') {
    return <TaskRetryScreen actions={actions} device={selectedDevice} taskRun={selectedTaskRun} theme={theme} />;
  }

  if (route === 'alerts') {
    return <AlertsScreen actions={actions} theme={theme} />;
  }

  if (route === 'alertDetail') {
    return <AlertDetailScreen actions={actions} alert={selectedAlert} device={selectedDevice} taskRun={selectedTaskRun} theme={theme} />;
  }

  if (route === 'logDetail') {
    return <LogDetailScreen actions={actions} alert={selectedAlert} backRoute={logBackRoute} taskRun={selectedTaskRun} theme={theme} />;
  }

  if (route === 'releases') {
    return <ReleasesScreen actions={actions} theme={theme} />;
  }

  if (route === 'releaseDetail') {
    return <ReleaseDetailScreen actions={actions} release={selectedRelease} theme={theme} />;
  }

  if (route === 'releaseTargets') {
    return <ReleaseTargetsScreen actions={actions} release={selectedRelease} theme={theme} />;
  }

  if (route === 'opsCenter') {
    return <OpsCenterScreen actions={actions} theme={theme} />;
  }

  if (route === 'opsMonitoring') {
    return <OpsMonitoringScreen actions={actions} theme={theme} />;
  }

  if (route === 'auditLogs') {
    return <AuditLogsScreen actions={actions} theme={theme} />;
  }

  if (route === 'launchReadiness') {
    return <LaunchReadinessScreen actions={actions} theme={theme} />;
  }

  if (route === 'testPlan') {
    return <TestPlanScreen actions={actions} theme={theme} />;
  }

  if (route === 'pendingDevices') {
    return <PendingDevicesScreen actions={actions} theme={theme} />;
  }

  if (route === 'deviceDetail') {
    return <DeviceDetailScreen actions={actions} device={selectedDevice} theme={theme} />;
  }

  if (route === 'deviceActions') {
    return <DeviceActionsScreen actions={actions} device={selectedDevice} theme={theme} />;
  }

  if (route === 'deviceUnbind') {
    return <DeviceUnbindScreen actions={actions} device={selectedDevice} theme={theme} />;
  }

  if (route === 'deviceAlert') {
    return <DeviceAlertScreen actions={actions} device={selectedDevice} theme={theme} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'dashboard' ? <DashboardScreen actions={actions} theme={theme} /> : null}
      {activeTab === 'devices' ? <DevicesScreen actions={actions} filter={deviceFilter} theme={theme} /> : null}
      {activeTab === 'tasks' ? <TasksScreen actions={actions} filter={taskFilter} taskRuns={taskRuns} theme={theme} /> : null}
      {activeTab === 'manage' ? <ManageScreen actions={actions} theme={theme} /> : null}
      {activeTab === 'profile' ? <ProfileScreen actions={actions} theme={theme} /> : null}
      <MainTabBar actions={actions} activeTab={activeTab} theme={theme} />
    </View>
  );
}

function DashboardScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <Header title="总览" subtitle="系统状态、设备、任务、异常和发版状态" theme={theme} rightLabel="告警" onRightPress={() => actions.goRoute('alerts')} />
        <MFCard glass theme={theme}>
          <MFStack gap={14}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  今日运行稳定
                </MFText>
                <MFCaption theme={theme}>98 台设备在线，6 个任务执行中，4 个异常待处理。</MFCaption>
              </MFStack>
              <MFBadge label="实时" tone="success" theme={theme} />
            </MFRow>
            <MFProgress label="任务完成率" theme={theme} value={0.859} />
          </MFStack>
        </MFCard>
        <MFRow gap={12}>
          {metrics.slice(0, 2).map((metric) => (
            <MFStatCard key={metric.label} label={metric.label} onPress={() => actions.setTab(metric.tab)} theme={theme} value={metric.value} />
          ))}
        </MFRow>
        <MFRow gap={12}>
          {metrics.slice(2).map((metric) => (
            <MFStatCard key={metric.label} label={metric.label} onPress={() => actions.setTab(metric.tab)} theme={theme} value={metric.value} />
          ))}
        </MFRow>
        <SectionTitle action="查看发版" onAction={() => actions.goRoute('releases')} theme={theme} title="发版状态" />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  v0.3.3 灰度中
                </MFText>
                <MFCaption theme={theme}>已升级 98 / 112，失败 2 台</MFCaption>
              </MFStack>
              <MFBadge label="87.5%" tone="warning" theme={theme} />
            </MFRow>
            <MFProgress theme={theme} value={0.875} />
            <MFButton fullWidth={false} onPress={() => actions.openRelease(fallbackRelease.id)} theme={theme} title="版本详情" variant="secondary" />
          </MFStack>
        </MFCard>
        <SectionTitle action="全部任务" onAction={() => actions.setTab('tasks')} theme={theme} title="执行中任务" />
        {runningTasks.map((task) => (
          <TaskSummaryCard key={`${task.title}-${task.device}`} task={task} theme={theme} />
        ))}
        <SectionTitle action="全部" onAction={() => actions.goRoute('alerts')} theme={theme} title="最近异常" />
        {alerts.map((alert) => (
          <MFStatusCard key={alert.id} message={`${alert.createdAt} · ${alert.message}`} onPress={() => actions.openAlert(alert.id)} theme={theme} title={alert.title} tone={alert.tone} />
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function DevicesScreen({ actions, filter, theme }: { actions: AdminActions; filter: 'all' | 'online' | 'alert'; theme: MFTheme }) {
  const visibleDevices = devices.filter((device) => {
    if (filter === 'online') {
      return device.status === '在线';
    }
    if (filter === 'alert') {
      return device.status !== '在线';
    }
    return true;
  });

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <Header title="设备" subtitle="设备在线状态、绑定和 Worker 管理" theme={theme} rightLabel="待绑定" onRightPress={() => actions.goRoute('pendingDevices')} />
        <MFSearchBar placeholder="搜索设备、托管用户或绑定码" theme={theme} />
        <MFSegmentedControl
          onChange={actions.setDeviceFilter}
          options={[
            { label: '全部', value: 'all' },
            { label: '在线', value: 'online' },
            { label: '异常', value: 'alert' }
          ]}
          theme={theme}
          value={filter}
        />
        <MFRow gap={12}>
          <MFStatCard label="在线" theme={theme} value="98" />
          <MFStatCard label="离线" theme={theme} value="14" />
          <MFStatCard label="异常" theme={theme} value="2" />
        </MFRow>
        {visibleDevices.map((device) => (
          <MFCard key={device.name} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {device.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {device.user} · Worker {device.app}
                  </MFCaption>
                </MFStack>
                <MFBadge label={device.status} tone={device.tone} theme={theme} />
              </MFRow>
              <MFKeyValue label="运行状态" theme={theme} value={device.adb} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openDevice(device.id)} theme={theme} title="详情" variant="secondary" />
                <MFButton fullWidth={false} onPress={() => actions.openDevice(device.id, 'deviceAlert')} theme={theme} title="异常" variant="ghost" />
                <MFButton fullWidth={false} onPress={() => actions.openDevice(device.id, 'deviceActions')} theme={theme} title="更多" variant="ghost" />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function TasksScreen({
  actions,
  filter,
  taskRuns,
  theme
}: {
  actions: AdminActions;
  filter: 'running' | 'failed' | 'finished';
  taskRuns: TaskRun[];
  theme: MFTheme;
}) {
  const visibleTasks = taskRuns.filter((task) => task.status === filter);

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <Header title="任务" subtitle="新建任务、执行进度、暂停、取消和重试" theme={theme} rightLabel="新建" onRightPress={actions.startTaskCreation} />
        <MFSegmentedControl
          onChange={actions.setTaskFilter}
          options={[
            { label: '执行中', value: 'running' },
            { label: '失败', value: 'failed' },
            { label: '已完成', value: 'finished' }
          ]}
          theme={theme}
          value={filter}
        />
        {visibleTasks.map((task) => (
          <MFCard key={task.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {task.title}
                  </MFText>
                  <MFCaption theme={theme}>
                    {task.user} · {task.worker}
                  </MFCaption>
                </MFStack>
                <TaskBadge status={task.status} theme={theme} />
              </MFRow>
              <MFProgress label="执行进度" theme={theme} value={task.progress} />
              <MFKeyValue label="当前步骤" theme={theme} value={task.currentStep} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openTaskRun(task.id)} theme={theme} title="详情" variant="secondary" />
                <MFButton
                  fullWidth={false}
                  onPress={() => {
                    if (task.status === 'failed') {
                      actions.startTaskRetry(task.id);
                      return;
                    }

                    actions.openLogDetail(task.id, undefined, 'taskExecutionDetail');
                  }}
                  theme={theme}
                  title={task.status === 'failed' ? '重试' : '日志'}
                  variant="ghost"
                />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
        {visibleTasks.length === 0 ? <MFStatusCard message="当前筛选没有任务记录。" theme={theme} title="暂无任务" tone="info" /> : null}
      </MFStack>
    </MFScrollPage>
  );
}

function ManageScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <Header title="管理" subtitle="托管用户、游戏模块和 APP 发版中心" theme={theme} rightLabel="新增" onRightPress={() => actions.openUserForm('create')} />
        <MFCard padded={false} theme={theme}>
          {managementEntries.map((entry, index) => (
            <View key={entry.title}>
              <MFListItem
                meta={entry.meta}
                onPress={() => {
                  if (entry.title === '托管用户') {
                    actions.goRoute('managedUsers');
                    return;
                  }

                  if (entry.title === '游戏模块') {
                    actions.goRoute('moduleGroups');
                    return;
                  }

                  if (entry.title === 'APP 管理 / 发版中心') {
                    actions.goRoute('releases');
                    return;
                  }

                  if (entry.title === '测试 / 监控 / 上线') {
                    actions.goRoute('opsCenter');
                    return;
                  }

                  actions.openSheet(entry.target, `${entry.target} 页面将按原型继续拆分列表、详情、编辑、排序和确认弹窗。`);
                }}
                theme={theme}
                title={entry.title}
              />
              {index < managementEntries.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <SectionTitle theme={theme} title="今日概览" />
        <MFRow gap={12}>
          <MFStatCard label="新增用户" theme={theme} value="7" />
          <MFStatCard label="模块变更" theme={theme} value="3" />
          <MFStatCard label="审计记录" theme={theme} value="26" />
        </MFRow>
        <MFStatusCard message="模块分组、具体任务模块、脚本、运行模板和视觉资产将在 Phase 3 接入 CRUD 与排序。" theme={theme} title="模块管理计划" tone="info" />
      </MFStack>
    </MFScrollPage>
  );
}

function ModuleGroupsScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="manage" subtitle="模块分组、排序、启用状态和 APP 展示" theme={theme} title="游戏模块分组" />
        <MFSearchBar placeholder="搜索分组名称或标识" theme={theme} />
        <MFSegmentedControl
          onChange={() => actions.showToast('分组筛选将在接口接入后生效')}
          options={[
            { label: '全部', value: 'all' },
            { label: '启用', value: 'enabled' },
            { label: '停用', value: 'disabled' }
          ]}
          theme={theme}
          value="all"
        />
        {moduleGroups.map((group) => (
          <MFCard key={group.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {group.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {group.key} · 排序 {group.order}
                  </MFCaption>
                </MFStack>
                <MFBadge label={group.enabled ? '启用' : '停用'} tone={group.enabled ? 'success' : 'warning'} theme={theme} />
              </MFRow>
              <MFKeyValue label="具体任务" theme={theme} value={`${group.moduleCount} 个`} />
              <MFKeyValue label="APP 展示" theme={theme} value={group.showInApp ? '展示' : '隐藏'} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openModuleGroup(group.id)} theme={theme} title="任务" variant="secondary" />
                <MFButton fullWidth={false} onPress={() => actions.openModuleGroupForm('edit', group.id)} theme={theme} title="编辑" variant="ghost" />
                <MFButton fullWidth={false} onPress={() => actions.goRoute('moduleGroupSort')} theme={theme} title="排序" variant="ghost" />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
        <MFButton onPress={() => actions.openModuleGroupForm('create')} theme={theme} title="新建模块分组" />
      </MFStack>
    </MFScrollPage>
  );
}

function ModuleGroupFormScreen({ actions, group, mode, theme }: { actions: AdminActions; group: ModuleGroup; mode: ModuleFormMode; theme: MFTheme }) {
  const isEdit = mode === 'edit';

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="moduleGroups" subtitle="名称、标识、排序、启用和 APP 展示" theme={theme} title={isEdit ? '编辑模块分组' : '新建模块分组'} />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFFormField label="分组名称" required theme={theme}>
              <MFInput defaultValue={isEdit ? group.name : ''} placeholder="例如：日常活动" theme={theme} />
            </MFFormField>
            <MFFormField label="分组标识" required theme={theme}>
              <MFInput autoCapitalize="none" defaultValue={isEdit ? group.key : ''} placeholder="daily-activity" theme={theme} />
            </MFFormField>
            <MFFormField label="排序" theme={theme}>
              <MFInput defaultValue={isEdit ? String(group.order) : '10'} keyboardType="number-pad" placeholder="10" theme={theme} />
            </MFFormField>
            <MFCheckbox label="启用分组" onValueChange={() => actions.showToast('分组启用状态已切换')} theme={theme} value={isEdit ? group.enabled : true} />
            <MFCheckbox label="在 APP 展示" onValueChange={() => actions.showToast('APP 展示状态已切换')} theme={theme} value={isEdit ? group.showInApp : true} />
          </MFStack>
        </MFCard>
        <MFButton
          onPress={() => {
            actions.showToast(isEdit ? '模块分组已保存' : '模块分组已创建');
            actions.goRoute('moduleGroups');
          }}
          theme={theme}
          title="保存"
        />
      </MFStack>
    </MFScrollPage>
  );
}

function ModuleGroupSortScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="moduleGroups" subtitle="长按拖拽排序，保存后同步 APP 展示顺序" theme={theme} title="分组排序" />
        {moduleGroups.map((group, index) => (
          <MFCard key={group.id} theme={theme}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  {index + 1}. {group.name}
                </MFText>
                <MFCaption theme={theme}>{group.key}</MFCaption>
              </MFStack>
              <MFBadge label={`排序 ${group.order}`} tone="info" theme={theme} />
            </MFRow>
          </MFCard>
        ))}
        <MFButton onPress={() => actions.showToast('分组排序已保存')} theme={theme} title="保存排序" />
      </MFStack>
    </MFScrollPage>
  );
}

function TaskModulesScreen({ actions, group, theme }: { actions: AdminActions; group: ModuleGroup; theme: MFTheme }) {
  const modules = taskModules.filter((taskModule) => taskModule.groupId === group.id);

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="moduleGroups" subtitle={`${group.key} · ${modules.length} 个具体任务`} theme={theme} title={group.name} />
        <MFSearchBar placeholder="搜索任务名称、脚本或模板" theme={theme} />
        {modules.map((taskModule) => (
          <MFCard key={taskModule.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {taskModule.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {taskModule.key} · {taskModule.script}
                  </MFCaption>
                </MFStack>
                <MFBadge label={taskModule.enabled ? '启用' : '停用'} tone={taskModule.enabled ? 'success' : 'warning'} theme={theme} />
              </MFRow>
              <MFKeyValue label="运行模板" theme={theme} value={taskModule.runTemplate} />
              <MFKeyValue label="成功率" theme={theme} value={taskModule.successRate} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openTaskModule(taskModule.id)} theme={theme} title="详情" variant="secondary" />
                <MFButton fullWidth={false} onPress={() => actions.openTaskModuleForm('edit', taskModule.id)} theme={theme} title="编辑" variant="ghost" />
                <MFButton fullWidth={false} onPress={() => actions.goRoute('taskModuleSort')} theme={theme} title="排序" variant="ghost" />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
        <MFButton onPress={() => actions.openTaskModuleForm('create')} theme={theme} title="新建具体任务模块" />
      </MFStack>
    </MFScrollPage>
  );
}

function TaskModuleDetailScreen({ actions, module, theme }: { actions: AdminActions; module: GameTaskModule; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskModules" subtitle={`${module.key} · ${module.successRate}`} theme={theme} title={module.name} />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  {module.script}
                </MFText>
                <MFCaption theme={theme}>{module.runTemplate}</MFCaption>
              </MFStack>
              <MFBadge label={module.enabled ? '启用' : '停用'} tone={module.enabled ? 'success' : 'warning'} theme={theme} />
            </MFRow>
            <MFProgress label="今日成功率" theme={theme} value={Number.parseFloat(module.successRate) / 100} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="执行配置" />
            <MFKeyValue label="脚本" theme={theme} value={module.script} />
            <MFKeyValue label="运行模板" theme={theme} value={module.runTemplate} />
            <MFKeyValue label="超时" theme={theme} value={`${module.timeoutSeconds} 秒`} />
            <MFKeyValue label="最大重试" theme={theme} value={`${module.retries} 次`} />
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.openTaskModuleForm('edit', module.id)} theme={theme} title="编辑任务" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.openTaskModuleMove(module.id)} theme={theme} title="移动" variant="ghost" />
          <MFButton fullWidth={false} onPress={() => actions.goRoute('taskModuleDelete')} theme={theme} title="删除" variant="danger" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function TaskModuleFormScreen({
  actions,
  group,
  mode,
  module,
  theme
}: {
  actions: AdminActions;
  group: ModuleGroup;
  mode: ModuleFormMode;
  module: GameTaskModule;
  theme: MFTheme;
}) {
  const isEdit = mode === 'edit';

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute={isEdit ? 'taskModuleDetail' : 'taskModules'} subtitle={`${group.name} · 基础信息、执行配置和运行策略`} theme={theme} title={isEdit ? '编辑具体任务模块' : '新建具体任务模块'} />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFFormField label="任务名称" required theme={theme}>
              <MFInput defaultValue={isEdit ? module.name : ''} placeholder="例如：随缘打熊" theme={theme} />
            </MFFormField>
            <MFFormField label="任务标识" required theme={theme}>
              <MFInput autoCapitalize="none" defaultValue={isEdit ? module.key : ''} placeholder="task-random-bear" theme={theme} />
            </MFFormField>
            <MFFormField label="脚本文件" required theme={theme}>
              <MFInput defaultValue={isEdit ? module.script : 'bear.js'} placeholder="bear.js" theme={theme} />
            </MFFormField>
            <MFFormField label="运行模板" theme={theme}>
              <MFInput defaultValue={isEdit ? module.runTemplate : 'tpl-bear-01'} placeholder="tpl-bear-01" theme={theme} />
            </MFFormField>
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <SectionTitle theme={theme} title="运行策略" />
            <MFFormField label="超时秒数" theme={theme}>
              <MFInput defaultValue={isEdit ? String(module.timeoutSeconds) : '120'} keyboardType="number-pad" placeholder="120" theme={theme} />
            </MFFormField>
            <MFFormField label="最大重试" theme={theme}>
              <MFInput defaultValue={isEdit ? String(module.retries) : '2'} keyboardType="number-pad" placeholder="2" theme={theme} />
            </MFFormField>
            <MFCheckbox label="启用任务模块" onValueChange={() => actions.showToast('任务模块状态已切换')} theme={theme} value={isEdit ? module.enabled : true} />
          </MFStack>
        </MFCard>
        <MFButton
          onPress={() => {
            actions.showToast(isEdit ? '具体任务模块已保存' : '具体任务模块已创建');
            actions.goRoute(isEdit ? 'taskModuleDetail' : 'taskModules');
          }}
          theme={theme}
          title="保存"
        />
      </MFStack>
    </MFScrollPage>
  );
}

function TaskModuleMoveScreen({ actions, module, theme }: { actions: AdminActions; module: GameTaskModule; theme: MFTheme }) {
  const targetGroups = moduleGroups.filter((group) => group.id !== module.groupId);
  const currentGroup = moduleGroups.find((group) => group.id === module.groupId) ?? fallbackModuleGroup;
  const targetGroup = targetGroups[0] ?? fallbackModuleGroup;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskModuleDetail" subtitle="选择目标分组后更新 groupId 和展示排序" theme={theme} title="移动任务模块" />
        <MFStatusCard message={`${module.name} 将从 ${currentGroup.name} 移动到 ${targetGroup.name}，移动后 APP 展示顺序需要重新确认。`} theme={theme} title="移动确认" tone="warning" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="当前任务" />
            <MFKeyValue label="任务" theme={theme} value={module.name} />
            <MFKeyValue label="当前分组" theme={theme} value={currentGroup.name} />
            <MFKeyValue label="目标分组" theme={theme} value={targetGroup.name} />
          </MFStack>
        </MFCard>
        {targetGroups.map((group) => (
          <MFCard key={group.id} theme={theme}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  {group.name}
                </MFText>
                <MFCaption theme={theme}>
                  {group.key} · {group.moduleCount} 个模块
                </MFCaption>
              </MFStack>
              <MFBadge label={group.id === targetGroup.id ? '目标' : '可选'} tone={group.id === targetGroup.id ? 'info' : 'success'} theme={theme} />
            </MFRow>
          </MFCard>
        ))}
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.goRoute('taskModuleDetail')} theme={theme} title="取消" variant="ghost" />
          <MFButton
            fullWidth={false}
            onPress={() => {
              actions.showToast('任务模块已移动');
              actions.goRoute('taskModules');
            }}
            theme={theme}
            title="确认移动"
            variant="secondary"
          />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function TaskModuleDeleteScreen({ actions, module, theme }: { actions: AdminActions; module: GameTaskModule; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskModuleDetail" subtitle="删除前会校验执行中任务和历史引用" theme={theme} title="删除模块确认" />
        <MFStatusCard message="删除后不可恢复。若模块存在执行中任务，后端会拒绝删除并返回阻断原因。" theme={theme} title="高风险操作" tone="danger" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="模块摘要" />
            <MFKeyValue label="任务名称" theme={theme} value={module.name} />
            <MFKeyValue label="任务标识" theme={theme} value={module.key} />
            <MFKeyValue label="脚本" theme={theme} value={module.script} />
            <MFKeyValue label="今日成功率" theme={theme} value={module.successRate} />
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.goRoute('taskModuleDetail')} theme={theme} title="返回" variant="ghost" />
          <MFButton
            fullWidth={false}
            onPress={() => {
              actions.showToast('删除请求已提交，等待后端校验');
              actions.goRoute('taskModules');
            }}
            theme={theme}
            title="确认删除"
            variant="danger"
          />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function TaskModuleSortScreen({ actions, group, theme }: { actions: AdminActions; group: ModuleGroup; theme: MFTheme }) {
  const modules = taskModules.filter((taskModule) => taskModule.groupId === group.id);

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskModules" subtitle={`${group.name} · 长按拖拽排序`} theme={theme} title="具体任务排序" />
        {modules.map((taskModule, index) => (
          <MFCard key={taskModule.id} theme={theme}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  {index + 1}. {taskModule.name}
                </MFText>
                <MFCaption theme={theme}>{taskModule.key}</MFCaption>
              </MFStack>
              <MFBadge label={taskModule.enabled ? '启用' : '停用'} tone={taskModule.enabled ? 'success' : 'warning'} theme={theme} />
            </MFRow>
          </MFCard>
        ))}
        <MFButton onPress={() => actions.showToast('具体任务排序已保存')} theme={theme} title="保存排序" />
      </MFStack>
    </MFScrollPage>
  );
}

function ManagedUsersScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="manage" subtitle="托管用户、绑定设备、游戏账号和当前任务" theme={theme} title="托管用户" />
        <MFSearchBar placeholder="搜索用户名称、编号、设备或任务" theme={theme} />
        <MFSegmentedControl
          onChange={() => actions.showToast('筛选条件将在接口接入后生效')}
          options={[
            { label: '全部', value: 'all' },
            { label: '托管中', value: 'active' },
            { label: '异常', value: 'alert' }
          ]}
          theme={theme}
          value="all"
        />
        {managedUsers.map((user) => (
          <MFCard key={user.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {user.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {user.code} · {user.device}
                  </MFCaption>
                </MFStack>
                <MFBadge label={user.status} tone={user.deviceStatus === '在线' ? 'success' : 'warning'} theme={theme} />
              </MFRow>
              <MFProgress label={user.currentTask} theme={theme} value={user.progress} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openManagedUser(user.id)} theme={theme} title="详情" variant="secondary" />
                <MFButton fullWidth={false} onPress={() => actions.openBindDevice(user.id)} theme={theme} title="更换设备" variant="ghost" />
                <MFButton fullWidth={false} onPress={() => actions.openUserForm('edit', user.id)} theme={theme} title="编辑" variant="ghost" />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
        <MFButton onPress={() => actions.openUserForm('create')} theme={theme} title="新建托管用户" />
      </MFStack>
    </MFScrollPage>
  );
}

function ManagedUserDetailScreen({ actions, theme, user }: { actions: AdminActions; theme: MFTheme; user: ManagedUser }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="managedUsers" subtitle={`${user.code} · ${user.status}`} theme={theme} title={user.name} />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  {user.currentTask}
                </MFText>
                <MFCaption theme={theme}>当前托管任务</MFCaption>
              </MFStack>
              <MFBadge label={`${Math.round(user.progress * 100)}%`} tone="info" theme={theme} />
            </MFRow>
            <MFProgress theme={theme} value={user.progress} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="基本信息" />
            <MFKeyValue label="用户编号" theme={theme} value={user.code} />
            <MFKeyValue label="托管状态" theme={theme} value={user.status} />
            <MFKeyValue label="自动调度" theme={theme} value={user.autoSchedule ? '允许' : '暂停'} />
          </MFStack>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          <MFListItem meta={`${user.deviceStatus} · ${user.device}`} onPress={() => actions.openBindDevice(user.id)} theme={theme} title="绑定设备" />
          <MFDivider />
          <MFListItem meta={`${user.accountCount} 个游戏账号`} onPress={() => actions.goRoute('gameAccounts')} theme={theme} title="游戏账号" />
          <MFDivider />
          <MFListItem meta="总数 128 · 成功率 85.9%" onPress={() => actions.goRoute('userTaskHistory')} theme={theme} title="任务记录" />
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.openUserForm('edit', user.id)} theme={theme} title="编辑" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.showToast(`${user.name} 已暂停托管`)} theme={theme} title="暂停托管" variant="danger" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function ManagedUserFormScreen({ actions, mode, theme, user }: { actions: AdminActions; mode: UserFormMode; theme: MFTheme; user: ManagedUser }) {
  const isEdit = mode === 'edit';

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute={isEdit ? 'managedUserDetail' : 'managedUsers'} subtitle="基本信息、托管设置和状态" theme={theme} title={isEdit ? '编辑托管用户' : '新建托管用户'} />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFFormField label="用户名称" required theme={theme}>
              <MFInput defaultValue={isEdit ? user.name : ''} placeholder="例如：用户 A" theme={theme} />
            </MFFormField>
            <MFFormField helperText="留空时由服务端自动生成。" label="用户编号" theme={theme}>
              <MFInput defaultValue={isEdit ? user.code : ''} placeholder="managed-user-10001" theme={theme} />
            </MFFormField>
            <MFCheckbox label="允许自动调度" onValueChange={() => actions.showToast('托管设置已切换')} theme={theme} value={isEdit ? user.autoSchedule : true} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="状态" />
            <MFBadge label={isEdit ? user.status : '托管中'} tone="success" theme={theme} />
            <MFCaption theme={theme}>保存后会写入审计日志，并同步移动端 BFF 缓存。</MFCaption>
          </MFStack>
        </MFCard>
        <MFButton
          onPress={() => {
            actions.showToast(isEdit ? '托管用户已保存' : '托管用户已创建');
            actions.goRoute(isEdit ? 'managedUserDetail' : 'managedUsers');
          }}
          theme={theme}
          title="保存"
        />
      </MFStack>
    </MFScrollPage>
  );
}

function BindDeviceScreen({ actions, theme, user }: { actions: AdminActions; theme: MFTheme; user: ManagedUser }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="managedUserDetail" subtitle="输入绑定码或选择待绑定设备" theme={theme} title="绑定设备" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title={user.name} />
            <MFKeyValue label="当前设备" theme={theme} value={user.device} />
            <MFKeyValue label="绑定状态" theme={theme} value={user.deviceStatus} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFFormField label="绑定码" required theme={theme}>
              <MFInput defaultValue="837291" keyboardType="number-pad" placeholder="请输入设备绑定码" theme={theme} />
            </MFFormField>
            <MFButton onPress={() => actions.showToast('已识别 Pixel 8，等待确认绑定')} theme={theme} title="查询设备" variant="secondary" />
          </MFStack>
        </MFCard>
        {pendingDevices.map((device) => (
          <MFCard key={device.bindingCode} theme={theme}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  {device.name}
                </MFText>
                <MFCaption theme={theme}>{device.bindingCode}</MFCaption>
              </MFStack>
              <MFBadge label={device.status} tone="info" theme={theme} />
            </MFRow>
          </MFCard>
        ))}
        <MFButton
          onPress={() => actions.openBindDeviceConfirm(user.id)}
          theme={theme}
          title="确认绑定"
        />
      </MFStack>
    </MFScrollPage>
  );
}

function BindDeviceConfirmScreen({ actions, theme, user }: { actions: AdminActions; theme: MFTheme; user: ManagedUser }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="bindDevice" subtitle="确认替换设备后会撤销旧设备 Token" theme={theme} title="更换绑定设备确认" />
        <MFStatusCard message="新设备会领取后续任务，旧设备将不再 poll / claim。确认操作会写入管理员审计日志。" theme={theme} title="绑定风险" tone="warning" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title={user.name} />
            <MFKeyValue label="当前设备" theme={theme} value={user.device} />
            <MFKeyValue label="新设备" theme={theme} value="Pixel 8 · 837291" />
            <MFKeyValue label="Token 策略" theme={theme} value="撤销旧 Token，下发新 device_token" />
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.goRoute('bindDevice')} theme={theme} title="返回修改" variant="ghost" />
          <MFButton
            fullWidth={false}
            onPress={() => {
              actions.showToast('设备 Token 已下发，绑定完成');
              actions.goRoute('managedUserDetail');
            }}
            theme={theme}
            title="确认更换"
            variant="secondary"
          />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function GameAccountsScreen({ actions, theme, user }: { actions: AdminActions; theme: MFTheme; user: ManagedUser }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="managedUserDetail" subtitle={`${user.name} · ${user.accountCount} 个账号`} theme={theme} title="游戏账号" />
        {gameAccounts.map((account) => (
          <MFCard key={account.accountId} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {account.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {account.server} · {account.role}
                  </MFCaption>
                </MFStack>
                <MFBadge label={account.status} tone="success" theme={theme} />
              </MFRow>
              <MFKeyValue label="账号 ID" theme={theme} value={account.accountId} />
              <MFButton fullWidth={false} onPress={() => actions.openGameAccountForm('edit', account.accountId)} theme={theme} title="编辑" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
        <MFButton onPress={() => actions.openGameAccountForm('create')} theme={theme} title="新建游戏账号" />
      </MFStack>
    </MFScrollPage>
  );
}

function GameAccountFormScreen({
  account,
  actions,
  mode,
  theme,
  user
}: {
  account: GameAccount;
  actions: AdminActions;
  mode: GameAccountFormMode;
  theme: MFTheme;
  user: ManagedUser;
}) {
  const isEdit = mode === 'edit';

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="gameAccounts" subtitle={`${user.name} · 账号名称、区服、角色和状态`} theme={theme} title={isEdit ? '编辑游戏账号' : '新建游戏账号'} />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFFormField label="账号名称" required theme={theme}>
              <MFInput defaultValue={isEdit ? account.name : ''} placeholder="例如：王国 01" theme={theme} />
            </MFFormField>
            <MFFormField label="区服" required theme={theme}>
              <MFInput defaultValue={isEdit ? account.server : ''} placeholder="S23-荣耀之巅" theme={theme} />
            </MFFormField>
            <MFFormField label="角色名" required theme={theme}>
              <MFInput defaultValue={isEdit ? account.role : ''} placeholder="战神无双" theme={theme} />
            </MFFormField>
            <MFFormField label="备注" theme={theme}>
              <MFInput placeholder="任务偏好、账号说明或风险提示" theme={theme} />
            </MFFormField>
            <MFCheckbox label="启用账号" onValueChange={() => actions.showToast('账号状态已切换')} theme={theme} value={isEdit ? account.status !== '暂停' : true} />
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          {isEdit ? (
            <MFButton fullWidth={false} onPress={() => actions.openSheet('删除游戏账号', `${account.accountId} 删除前会校验是否存在执行中任务，并写入审计日志。`)} theme={theme} title="删除" variant="danger" />
          ) : null}
          <MFButton
            fullWidth={false}
            onPress={() => {
              actions.showToast(isEdit ? '游戏账号已保存' : '游戏账号已创建');
              actions.goRoute('gameAccounts');
            }}
            theme={theme}
            title="保存"
            variant="secondary"
          />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function UserTaskHistoryScreen({ actions, taskRuns, theme, user }: { actions: AdminActions; taskRuns: TaskRun[]; theme: MFTheme; user: ManagedUser }) {
  const userRuns = taskRuns.filter((task) => task.user === user.name);
  const visibleRuns = userRuns.length > 0 ? userRuns : taskRuns;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="managedUserDetail" subtitle={`${user.name} · 总数 128 · 成功率 85.9%`} theme={theme} title="任务记录" />
        {visibleRuns.map((task) => (
          <MFCard key={`${user.id}-${task.id}`} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {task.title}
                  </MFText>
                  <MFCaption theme={theme}>
                    {task.account} · {task.device}
                  </MFCaption>
                </MFStack>
                <TaskBadge status={task.status} theme={theme} />
              </MFRow>
              <MFProgress label="执行进度" theme={theme} value={task.progress} />
              <MFButton fullWidth={false} onPress={() => actions.openTaskRun(task.id)} theme={theme} title="查看详情" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function TaskCreateUserScreen({ actions, selectedUser, theme }: { actions: AdminActions; selectedUser: ManagedUser; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="tasks" subtitle="选择托管用户后进入游戏账号选择" theme={theme} title="新建任务" />
        <TaskCreateProgress step={1} theme={theme} />
        <MFSearchBar placeholder="搜索用户名称、编号或设备" theme={theme} />
        {managedUsers.map((user) => (
          <MFCard key={user.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {user.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {user.code} · {user.device}
                  </MFCaption>
                </MFStack>
                <MFBadge label={selectedUser.id === user.id ? '已选' : user.status} tone={selectedUser.id === user.id ? 'success' : 'info'} theme={theme} />
              </MFRow>
              <MFProgress label={user.currentTask} theme={theme} value={user.progress} />
              <MFButton fullWidth={false} onPress={() => actions.selectTaskUser(user.id)} theme={theme} title="选择并继续" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function TaskCreateAccountScreen({
  actions,
  selectedAccount,
  selectedUser,
  theme
}: {
  actions: AdminActions;
  selectedAccount: GameAccount;
  selectedUser: ManagedUser;
  theme: MFTheme;
}) {
  const accounts = gameAccounts.filter((account) => account.userId === selectedUser.id);
  const visibleAccounts = accounts.length > 0 ? accounts : [selectedAccount];

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskCreateUser" subtitle={`${selectedUser.name} · 选择要执行的游戏账号`} theme={theme} title="选择游戏账号" />
        <TaskCreateProgress step={2} theme={theme} />
        <TaskDraftSummary items={[`用户：${selectedUser.name}`, `绑定设备：${selectedUser.device}`]} theme={theme} />
        {visibleAccounts.map((account) => (
          <MFCard key={account.accountId} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {account.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {account.server} · {account.role}
                  </MFCaption>
                </MFStack>
                <MFBadge label={selectedAccount.accountId === account.accountId ? '已选' : account.status} tone="success" theme={theme} />
              </MFRow>
              <MFKeyValue label="账号 ID" theme={theme} value={account.accountId} />
              <MFButton fullWidth={false} onPress={() => actions.selectTaskAccount(account.accountId)} theme={theme} title="选择并继续" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function TaskCreateDeviceScreen({
  actions,
  selectedDevice,
  selectedUser,
  theme
}: {
  actions: AdminActions;
  selectedDevice: DeviceRecord;
  selectedUser: ManagedUser;
  theme: MFTheme;
}) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskCreateAccount" subtitle="确认执行设备和 ADB / Worker 状态" theme={theme} title="确认设备" />
        <TaskCreateProgress step={3} theme={theme} />
        <TaskDraftSummary items={[`用户：${selectedUser.name}`, `推荐设备：${selectedUser.device}`]} theme={theme} />
        {devices.map((device) => {
          const blocked = device.status !== '在线';
          return (
            <MFCard key={device.id} theme={theme}>
              <MFStack gap={10}>
                <MFRow style={{ justifyContent: 'space-between' }}>
                  <MFStack gap={4}>
                    <MFText theme={theme} style={{ fontWeight: '900' }}>
                      {device.name}
                    </MFText>
                    <MFCaption theme={theme}>
                      {device.user} · {device.worker}
                    </MFCaption>
                  </MFStack>
                  <MFBadge label={selectedDevice.id === device.id ? '已选' : device.status} tone={blocked ? 'warning' : 'success'} theme={theme} />
                </MFRow>
                <MFKeyValue label="ADB 状态" theme={theme} value={device.adb} />
                <MFButton
                  disabled={blocked}
                  fullWidth={false}
                  onPress={() => actions.selectTaskDevice(device.id)}
                  theme={theme}
                  title={blocked ? '设备不可执行' : '选择并继续'}
                  variant="secondary"
                />
              </MFStack>
            </MFCard>
          );
        })}
      </MFStack>
    </MFScrollPage>
  );
}

function TaskCreateGroupScreen({
  actions,
  selectedAccount,
  selectedDevice,
  selectedUser,
  theme
}: {
  actions: AdminActions;
  selectedAccount: GameAccount;
  selectedDevice: DeviceRecord;
  selectedUser: ManagedUser;
  theme: MFTheme;
}) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskCreateDevice" subtitle="选择模块分组后进入具体任务" theme={theme} title="选择模块分组" />
        <TaskCreateProgress step={4} theme={theme} />
        <TaskDraftSummary items={[`用户：${selectedUser.name}`, `账号：${selectedAccount.name}`, `设备：${selectedDevice.name}`]} theme={theme} />
        {moduleGroups.map((group) => (
          <MFCard key={group.id} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {group.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {group.key} · {group.moduleCount} 个任务
                  </MFCaption>
                </MFStack>
                <MFBadge label={group.enabled ? '启用' : '停用'} tone={group.enabled ? 'success' : 'warning'} theme={theme} />
              </MFRow>
              <MFButton disabled={!group.enabled} fullWidth={false} onPress={() => actions.selectTaskGroup(group.id)} theme={theme} title={group.enabled ? '选择分组' : '不可选择'} variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function TaskCreateModuleScreen({
  actions,
  group,
  selectedModule,
  theme
}: {
  actions: AdminActions;
  group: ModuleGroup;
  selectedModule: GameTaskModule;
  theme: MFTheme;
}) {
  const modules = taskModules.filter((taskModule) => taskModule.groupId === group.id);
  const visibleModules = modules.length > 0 ? modules : [selectedModule];

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskCreateGroup" subtitle={`${group.name} · 选择具体任务`} theme={theme} title="选择具体任务" />
        <TaskCreateProgress step={5} theme={theme} />
        {visibleModules.map((taskModule) => (
          <MFCard key={taskModule.id} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {taskModule.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {taskModule.script} · {taskModule.runTemplate}
                  </MFCaption>
                </MFStack>
                <MFBadge label={selectedModule.id === taskModule.id ? '已选' : taskModule.successRate} tone="info" theme={theme} />
              </MFRow>
              <MFKeyValue label="超时" theme={theme} value={`${taskModule.timeoutSeconds} 秒`} />
              <MFKeyValue label="最大重试" theme={theme} value={`${taskModule.retries} 次`} />
              <MFButton disabled={!taskModule.enabled} fullWidth={false} onPress={() => actions.selectTaskModule(taskModule.id)} theme={theme} title={taskModule.enabled ? '选择并配置' : '任务已停用'} variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function TaskCreateParamsScreen({ actions, module, theme }: { actions: AdminActions; module: GameTaskModule; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskCreateModule" subtitle={`${module.name} · 次数、间隔、重试和超时`} theme={theme} title="配置运行参数" />
        <TaskCreateProgress step={6} theme={theme} />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFFormField label="执行次数" required theme={theme}>
              <MFInput defaultValue="3" keyboardType="number-pad" placeholder="3" theme={theme} />
            </MFFormField>
            <MFFormField label="执行间隔秒数" theme={theme}>
              <MFInput defaultValue="30" keyboardType="number-pad" placeholder="30" theme={theme} />
            </MFFormField>
            <MFFormField label="超时秒数" theme={theme}>
              <MFInput defaultValue={String(module.timeoutSeconds)} keyboardType="number-pad" placeholder="300" theme={theme} />
            </MFFormField>
            <MFCheckbox label="失败时自动重试" onValueChange={() => actions.showToast('自动重试设置已切换')} theme={theme} value />
            <MFCheckbox label="保留关键截图证据" onValueChange={() => actions.showToast('截图证据设置已切换')} theme={theme} value />
          </MFStack>
        </MFCard>
        <MFButton onPress={() => actions.goRoute('taskCreateConfirm')} theme={theme} title="下一步" />
      </MFStack>
    </MFScrollPage>
  );
}

function TaskCreateConfirmScreen({
  account,
  actions,
  device,
  group,
  module,
  theme,
  user
}: {
  account: GameAccount;
  actions: AdminActions;
  device: DeviceRecord;
  group: ModuleGroup;
  module: GameTaskModule;
  theme: MFTheme;
  user: ManagedUser;
}) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskCreateParams" subtitle="确认后写入任务队列并等待设备领取" theme={theme} title="确认下发" />
        <TaskCreateProgress step={7} theme={theme} />
        <MFCard glass theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title={module.name} />
            <MFKeyValue label="托管用户" theme={theme} value={user.name} />
            <MFKeyValue label="游戏账号" theme={theme} value={`${account.name} · ${account.server}`} />
            <MFKeyValue label="执行设备" theme={theme} value={`${device.name} · ${device.adb}`} />
            <MFKeyValue label="模块分组" theme={theme} value={group.name} />
            <MFKeyValue label="运行参数" theme={theme} value="3 次 · 间隔 30 秒 · 保留截图" />
          </MFStack>
        </MFCard>
        <MFButton onPress={actions.submitTaskRun} theme={theme} title="确认下发" />
      </MFStack>
    </MFScrollPage>
  );
}

function TaskExecutionDetailScreen({ actions, taskRun, theme }: { actions: AdminActions; taskRun: TaskRun; theme: MFTheme }) {
  const evidences = evidenceRecords.filter((evidence) => evidence.taskRunId === taskRun.id);

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="tasks" subtitle={`${taskRun.id} · ${taskRun.worker}`} theme={theme} title="任务执行详情" />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  {taskRun.title}
                </MFText>
                <MFCaption theme={theme}>
                  {taskRun.user} · {taskRun.account} · {taskRun.device}
                </MFCaption>
              </MFStack>
              <TaskBadge status={taskRun.status} theme={theme} />
            </MFRow>
            <MFProgress label={taskRun.currentStep} theme={theme} value={taskRun.progress} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="关联对象" />
            <MFKeyValue label="分组" theme={theme} value={taskRun.group} />
            <MFKeyValue label="具体任务" theme={theme} value={taskRun.moduleName} />
            <MFKeyValue label="相似度" theme={theme} value={taskRun.similarity} />
            <MFKeyValue label="Worker" theme={theme} value={taskRun.worker} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={8}>
            <SectionTitle theme={theme} title="执行链路" />
            {['create', 'poll', 'claim', 'report', taskRun.status === 'finished' ? 'finish' : 'waiting'].map((step, index) => (
              <MFKeyValue key={`${taskRun.id}-${step}`} label={`${index + 1}`} theme={theme} value={step} />
            ))}
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={8}>
            <SectionTitle action="全部日志" onAction={() => actions.openLogDetail(taskRun.id, undefined, 'taskExecutionDetail')} theme={theme} title="实时日志" />
            {taskRun.logs.map((line) => (
              <MFCaption key={line} theme={theme}>
                {line}
              </MFCaption>
            ))}
          </MFStack>
        </MFCard>
        {evidences.length > 0 ? <EvidenceSection evidences={evidences} theme={theme} /> : null}
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.goRoute('taskPauseConfirm')} theme={theme} title="暂停" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.startTaskRetry(taskRun.id)} theme={theme} title="重试" variant="ghost" />
          <MFButton fullWidth={false} onPress={() => actions.goRoute('taskCancelConfirm')} theme={theme} title="取消" variant="danger" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function TaskPauseConfirmScreen({ actions, taskRun, theme }: { actions: AdminActions; taskRun: TaskRun; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskExecutionDetail" subtitle={`${taskRun.id} · 已完成 ${Math.round(taskRun.progress * 100)}%`} theme={theme} title="暂停任务确认" />
        <MFStatusCard message="确认暂停后当前进度会保留，设备释放执行锁前会先上报最新 report，并写入管理员审计日志。" theme={theme} title="暂停说明" tone="warning" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title={taskRun.title} />
            <MFKeyValue label="托管用户" theme={theme} value={taskRun.user} />
            <MFKeyValue label="执行设备" theme={theme} value={taskRun.device} />
            <MFKeyValue label="当前步骤" theme={theme} value={taskRun.currentStep} />
            <MFKeyValue label="保留进度" theme={theme} value={`${Math.round(taskRun.progress * 100)}%`} />
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.goRoute('taskExecutionDetail')} theme={theme} title="返回" variant="ghost" />
          <MFButton
            fullWidth={false}
            onPress={() => {
              actions.showToast('任务暂停指令已下发');
              actions.goRoute('taskExecutionDetail');
            }}
            theme={theme}
            title="确认暂停"
            variant="secondary"
          />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function TaskCancelConfirmScreen({ actions, taskRun, theme }: { actions: AdminActions; taskRun: TaskRun; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskExecutionDetail" subtitle={`${taskRun.id} · ${taskRun.worker}`} theme={theme} title="取消任务确认" />
        <MFStatusCard message="取消后本次任务不会继续调度，设备会释放当前执行锁；如解除本次任务，还会清理待领取队列。" theme={theme} title="高风险操作" tone="danger" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title={taskRun.title} />
            <MFKeyValue label="账号" theme={theme} value={taskRun.account} />
            <MFKeyValue label="设备" theme={theme} value={taskRun.device} />
            <MFKeyValue label="当前步骤" theme={theme} value={taskRun.currentStep} />
            <MFCheckbox label="解除本次任务并释放设备执行锁" onValueChange={() => actions.showToast('取消范围已切换')} theme={theme} value />
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.goRoute('taskExecutionDetail')} theme={theme} title="返回" variant="ghost" />
          <MFButton
            fullWidth={false}
            onPress={() => {
              actions.showToast('任务取消请求已提交');
              actions.goTabs('tasks');
            }}
            theme={theme}
            title="确认取消"
            variant="danger"
          />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function AlertsScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="dashboard" subtitle="告警状态、关联任务、日志和证据截图" theme={theme} title="告警列表" />
        <MFSearchBar placeholder="搜索告警、设备、任务或事件源" theme={theme} />
        <MFSegmentedControl
          onChange={() => actions.showToast('告警筛选将在接口接入后生效')}
          options={[
            { label: '未处理', value: 'open' },
            { label: '处理中', value: 'processing' },
            { label: '已恢复', value: 'resolved' }
          ]}
          theme={theme}
          value="open"
        />
        <MFRow gap={12}>
          <MFStatCard label="未处理" theme={theme} value="12" />
          <MFStatCard label="处理中" theme={theme} value="3" />
          <MFStatCard label="已恢复" theme={theme} value="28" />
        </MFRow>
        {alerts.map((alert) => (
          <MFCard key={alert.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {alert.title}
                  </MFText>
                  <MFCaption theme={theme}>
                    {alert.createdAt} · {alert.source}
                  </MFCaption>
                </MFStack>
                <AlertStatusBadge status={alert.status} theme={theme} />
              </MFRow>
              <MFCaption theme={theme}>{alert.message}</MFCaption>
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openAlert(alert.id)} theme={theme} title="详情" variant="secondary" />
                <MFButton
                  disabled={!alert.taskRunId}
                  fullWidth={false}
                  onPress={() => actions.openLogDetail(alert.taskRunId, alert.id, 'alertDetail')}
                  theme={theme}
                  title={alert.taskRunId ? '日志' : '无日志'}
                  variant="ghost"
                />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function AlertDetailScreen({
  actions,
  alert,
  device,
  taskRun,
  theme
}: {
  actions: AdminActions;
  alert: AlertRecord;
  device: DeviceRecord;
  taskRun: TaskRun;
  theme: MFTheme;
}) {
  const hasTask = Boolean(alert.taskRunId);
  const hasDevice = Boolean(alert.deviceId);

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="alerts" subtitle={`${alert.createdAt} · ${alert.source}`} theme={theme} title={alert.title} />
        <MFStatusCard message={alert.message} theme={theme} title={alert.status === 'open' ? '待处理告警' : '处理中告警'} tone={alert.tone} />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="告警信息" />
            <MFKeyValue label="状态" theme={theme} value={alert.status === 'open' ? '未处理' : alert.status === 'processing' ? '处理中' : '已恢复'} />
            <MFKeyValue label="负责人" theme={theme} value={alert.owner} />
            <MFKeyValue label="事件源" theme={theme} value={alert.source} />
            <MFKeyValue label="关联设备" theme={theme} value={hasDevice ? device.name : '无关联设备'} />
            <MFKeyValue label="关联任务" theme={theme} value={hasTask ? taskRun.title : '无关联任务'} />
          </MFStack>
        </MFCard>
        {hasTask ? <EvidenceSection evidences={evidenceRecords.filter((evidence) => evidence.taskRunId === taskRun.id)} theme={theme} /> : null}
        <MFRow gap={10}>
          {hasTask ? <MFButton fullWidth={false} onPress={() => actions.openTaskRun(taskRun.id)} theme={theme} title="任务详情" variant="secondary" /> : null}
          <MFButton
            disabled={!hasTask}
            fullWidth={false}
            onPress={() => actions.openLogDetail(alert.taskRunId, alert.id, 'alertDetail')}
            theme={theme}
            title={hasTask ? '日志详情' : '无日志'}
            variant="ghost"
          />
          <MFButton fullWidth={false} onPress={() => actions.showToast('告警已标记为处理中')} theme={theme} title="处理" variant="ghost" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function LogDetailScreen({
  actions,
  alert,
  backRoute,
  taskRun,
  theme
}: {
  actions: AdminActions;
  alert: AlertRecord;
  backRoute: RouteKey;
  taskRun: TaskRun;
  theme: MFTheme;
}) {
  const evidences = evidenceRecords.filter((evidence) => evidence.taskRunId === taskRun.id);
  const hasAlert = alerts.some((item) => item.id === alert.id);

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute={backRoute} subtitle={`${taskRun.id} · ${taskRun.worker}`} theme={theme} title="日志详情" />
        <MFStatusCard
          message={taskRun.status === 'failed' ? `${taskRun.currentStep}，最近相似度 ${taskRun.similarity}。` : `${taskRun.currentStep}，日志持续追加中。`}
          theme={theme}
          title={taskRun.status === 'failed' ? 'TASK_EXEC_FAILED' : 'TASK_PROGRESS'}
          tone={taskRun.status === 'failed' ? 'danger' : 'info'}
        />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="基础信息" />
            <MFKeyValue label="任务" theme={theme} value={taskRun.title} />
            <MFKeyValue label="设备" theme={theme} value={taskRun.device} />
            <MFKeyValue label="账号" theme={theme} value={taskRun.account} />
            <MFKeyValue label="关联告警" theme={theme} value={hasAlert ? alert.title : '无关联告警'} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={8}>
            <SectionTitle action="复制" onAction={() => actions.showToast('日志已复制')} theme={theme} title="日志" />
            {taskRun.logs.map((line, index) => (
              <MFCaption key={`${taskRun.id}-log-${index}`} theme={theme}>
                {line}
              </MFCaption>
            ))}
          </MFStack>
        </MFCard>
        <EvidenceSection evidences={evidences} theme={theme} />
        {hasAlert ? <MFButton onPress={() => actions.openAlert(alert.id)} theme={theme} title="查看关联告警" variant="secondary" /> : null}
      </MFStack>
    </MFScrollPage>
  );
}

function TaskRetryScreen({ actions, device, taskRun, theme }: { actions: AdminActions; device: DeviceRecord; taskRun: TaskRun; theme: MFTheme }) {
  const [retryMode, setRetryMode] = useState<'same' | 'reset'>('same');

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="taskExecutionDetail" subtitle={`${taskRun.title} · 选择重试方式`} theme={theme} title="重试任务" />
        <MFStatusCard message={`${taskRun.currentStep}，最近相似度 ${taskRun.similarity}。`} theme={theme} title={taskRun.status === 'failed' ? '上次执行失败' : '创建重试任务'} tone={taskRun.status === 'failed' ? 'danger' : 'info'} />
        <MFSegmentedControl
          onChange={setRetryMode}
          options={[
            { label: '原参数', value: 'same' },
            { label: '重置次数', value: 'reset' }
          ]}
          theme={theme}
          value={retryMode}
        />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="重试配置" />
            <MFKeyValue label="任务" theme={theme} value={taskRun.moduleName} />
            <MFKeyValue label="设备" theme={theme} value={`${device.name} · ${device.adb}`} />
            <MFKeyValue label="参数" theme={theme} value={retryMode === 'same' ? '沿用原参数' : '次数重置为 1，保留截图'} />
            <MFCheckbox label="重试前重启 Worker" onValueChange={() => actions.showToast('重启 Worker 设置已切换')} theme={theme} value />
          </MFStack>
        </MFCard>
        <MFButton
          onPress={() => {
            actions.showToast('重试任务已创建');
            actions.goRoute('taskExecutionDetail');
          }}
          theme={theme}
          title="开始重试"
        />
      </MFStack>
    </MFScrollPage>
  );
}

function ReleasesScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  const onlineRelease = releases.find((release) => release.status === '线上版本') ?? releases[0] ?? fallbackRelease;
  const activeRelease = releases.find((release) => release.status !== '线上版本') ?? fallbackRelease;
  const failedTargets = releaseTargets.filter((target) => target.tone === 'danger');

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="manage" subtitle="安装包、灰度发布、升级状态和失败设备" theme={theme} title="APP 发版中心" />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  当前线上 {onlineRelease.version}
                </MFText>
                <MFCaption theme={theme}>
                  {onlineRelease.channel} · {onlineRelease.size} · {onlineRelease.checksum}
                </MFCaption>
              </MFStack>
              <MFBadge label={onlineRelease.status} tone="success" theme={theme} />
            </MFRow>
            <MFStatusCard message={onlineRelease.summary} theme={theme} title="稳定版本" tone="success" />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                  {activeRelease.version} {activeRelease.status}
                </MFText>
                <MFCaption theme={theme}>
                  {activeRelease.rollout} · 已升级 {activeRelease.upgraded} / {activeRelease.total} · 失败 {activeRelease.failed}
                </MFCaption>
              </MFStack>
              <MFBadge label={`${Math.round(activeRelease.progress * 100)}%`} tone={activeRelease.failed > 0 ? 'warning' : 'info'} theme={theme} />
            </MFRow>
            <MFProgress label="灰度进度" theme={theme} value={activeRelease.progress} />
            <MFRow gap={10}>
              <MFButton fullWidth={false} onPress={() => actions.openRelease(activeRelease.id)} theme={theme} title="版本详情" variant="secondary" />
              <MFButton fullWidth={false} onPress={() => actions.goRoute('releaseTargets')} theme={theme} title="设备状态" variant="ghost" />
            </MFRow>
          </MFStack>
        </MFCard>
        <MFRow gap={12}>
          <MFStatCard label="安装包" theme={theme} value={String(releases.length)} />
          <MFStatCard label="失败设备" onPress={() => actions.goRoute('releaseTargets')} theme={theme} value={String(failedTargets.length)} />
          <MFStatCard label="灰度覆盖" theme={theme} value={activeRelease.rollout} />
        </MFRow>
        <MFCard padded={false} theme={theme}>
          <MFListItem meta="上传 APK、校验 checksum、填写版本说明" onPress={() => actions.openSheet('上传安装包', '正式接入后会选择 APK 文件、自动计算 checksum，并生成待发布草稿。')} theme={theme} title="上传 APK" />
          <MFDivider />
          <MFListItem meta="选择目标、灰度比例、强制升级策略" onPress={() => actions.openSheet('新建发布', '发布前需要确认渠道、版本号、灰度范围和回滚策略。')} theme={theme} title="新建发布" />
          <MFDivider />
          <MFListItem meta="查看发布审计和版本变更记录" onPress={() => actions.showToast('发布记录将在接口接入后同步')} theme={theme} title="发布记录" />
        </MFCard>
        <SectionTitle theme={theme} title="版本列表" />
        {releases.map((release) => (
          <MFCard key={release.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {release.version}
                  </MFText>
                  <MFCaption theme={theme}>
                    {release.channel} · {release.rollout} · {release.size}
                  </MFCaption>
                </MFStack>
                <ReleaseStatusBadge status={release.status} theme={theme} />
              </MFRow>
              <MFCaption theme={theme}>{release.summary}</MFCaption>
              <MFProgress label="升级进度" theme={theme} value={release.progress} />
              <MFButton fullWidth={false} onPress={() => actions.openRelease(release.id)} theme={theme} title="查看详情" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function ReleaseDetailScreen({ actions, release, theme }: { actions: AdminActions; release: ReleaseRecord; theme: MFTheme }) {
  const relatedTargets = releaseTargets.filter((target) => target.releaseId === release.id);
  const failedCount = relatedTargets.filter((target) => target.tone === 'danger').length || release.failed;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="releases" subtitle={`${release.channel} · ${release.rollout} · ${release.size}`} theme={theme} title={release.version} />
        <MFStatusCard message={release.summary} theme={theme} title={release.status} tone={release.failed > 0 ? 'warning' : release.progress >= 1 ? 'success' : 'info'} />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <SectionTitle theme={theme} title="发布进度" />
            <MFProgress label={`已升级 ${release.upgraded} / ${release.total}`} theme={theme} value={release.progress} />
            <MFRow gap={12}>
              <MFStatCard label="成功" theme={theme} value={String(release.upgraded)} />
              <MFStatCard label="失败" theme={theme} value={String(failedCount)} />
              <MFStatCard label="进度" theme={theme} value={`${Math.round(release.progress * 100)}%`} />
            </MFRow>
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="安装包信息" />
            <MFKeyValue label="版本号" theme={theme} value={release.version} />
            <MFKeyValue label="渠道" theme={theme} value={release.channel} />
            <MFKeyValue label="包大小" theme={theme} value={release.size} />
            <MFKeyValue label="校验值" theme={theme} value={release.checksum} />
            <MFKeyValue label="发布范围" theme={theme} value={release.rollout} />
          </MFStack>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          <MFListItem meta={`${relatedTargets.length || release.total} 台设备升级状态`} onPress={() => actions.goRoute('releaseTargets')} theme={theme} title="设备状态" />
          <MFDivider />
          <MFListItem meta="按当前灰度策略增加目标设备" onPress={() => actions.openSheet('扩大灰度', '扩大灰度前会重新计算目标设备并提示风险，确认后写入发布审计。')} theme={theme} title="扩大灰度" />
          <MFDivider />
          <MFListItem meta="停止当前发布并保留已升级设备" onPress={() => actions.openSheet('停止发布', '确认停止后不再下发该版本，失败设备可在设备状态页单独重试。')} theme={theme} title="停止发布" />
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function ReleaseTargetsScreen({ actions, release, theme }: { actions: AdminActions; release: ReleaseRecord; theme: MFTheme }) {
  const targets = releaseTargets.filter((target) => target.releaseId === release.id);
  const failedTargets = targets.filter((target) => target.tone === 'danger');
  const upgradedTargets = targets.filter((target) => target.tone === 'success');

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="releaseDetail" subtitle={`${release.version} · ${release.rollout}`} theme={theme} title="设备升级状态" />
        <MFSearchBar placeholder="搜索设备名称、升级状态或设备 ID" theme={theme} />
        <MFSegmentedControl
          onChange={() => actions.showToast('设备状态筛选将在接口接入后生效')}
          options={[
            { label: '全部', value: 'all' },
            { label: '失败', value: 'failed' },
            { label: '升级中', value: 'running' }
          ]}
          theme={theme}
          value="all"
        />
        <MFRow gap={12}>
          <MFStatCard label="目标" theme={theme} value={String(targets.length || release.total)} />
          <MFStatCard label="成功" theme={theme} value={String(upgradedTargets.length || release.upgraded)} />
          <MFStatCard label="失败" theme={theme} value={String(failedTargets.length || release.failed)} />
        </MFRow>
        {targets.map((target) => (
          <MFCard key={target.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {target.deviceName}
                  </MFText>
                  <MFCaption theme={theme}>
                    {target.deviceId} · {target.updatedAt}
                  </MFCaption>
                </MFStack>
                <MFBadge label={target.status} tone={target.tone} theme={theme} />
              </MFRow>
              <MFProgress label="升级进度" theme={theme} value={target.progress} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openDevice(target.deviceId)} theme={theme} title="设备详情" variant="secondary" />
                <MFButton fullWidth={false} onPress={() => actions.showToast(`${target.deviceName} 升级任务已重新下发`)} theme={theme} title="重试" variant="ghost" />
                <MFButton fullWidth={false} onPress={() => actions.showToast('升级日志将在接口接入后打开')} theme={theme} title="日志" variant="ghost" />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
        {targets.length === 0 ? <MFStatusCard message="当前版本暂无设备升级明细，接入发布接口后会展示目标设备、下载、安装和上报状态。" theme={theme} title="暂无设备状态" tone="info" /> : null}
      </MFStack>
    </MFScrollPage>
  );
}

function OpsCenterScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  const readyCount = readinessChecks.filter((check) => check.tone === 'success').length;
  const passedCases = testCases.filter((testCase) => testCase.tone === 'success').length;
  const riskyAudits = auditLogs.filter((log) => log.risk === 'danger').length;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="manage" subtitle="测试、监控、审计与上线前检查" theme={theme} title="上线运维" />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  上线准备 {readyCount} / {readinessChecks.length}
                </MFText>
                <MFCaption theme={theme}>测试用例 {passedCases} / {testCases.length} 通过，实时事件整体稳定。</MFCaption>
              </MFStack>
              <MFBadge label={readyCount === readinessChecks.length ? '可上线' : '待确认'} tone={readyCount === readinessChecks.length ? 'success' : 'warning'} theme={theme} />
            </MFRow>
            <MFProgress label="上线检查" theme={theme} value={readyCount / readinessChecks.length} />
          </MFStack>
        </MFCard>
        <MFRow gap={12}>
          <MFStatCard label="测试通过" onPress={() => actions.goRoute('testPlan')} theme={theme} value={`${passedCases}/${testCases.length}`} />
          <MFStatCard label="实时事件" onPress={() => actions.goRoute('opsMonitoring')} theme={theme} value="4" />
          <MFStatCard label="高危审计" onPress={() => actions.goRoute('auditLogs')} theme={theme} value={String(riskyAudits)} />
        </MFRow>
        <MFCard padded={false} theme={theme}>
          <MFListItem meta="接口、任务、告警、发版主流程验收" onPress={() => actions.goRoute('testPlan')} theme={theme} title="测试用例" />
          <MFDivider />
          <MFListItem meta="实时事件、设备心跳、任务进度和发版上报" onPress={() => actions.goRoute('opsMonitoring')} theme={theme} title="监控看板" />
          <MFDivider />
          <MFListItem meta="危险操作、发布变更和管理员行为" onPress={() => actions.goRoute('auditLogs')} theme={theme} title="审计日志" />
          <MFDivider />
          <MFListItem meta="Token、安全、签名 URL、回滚和上线确认" onPress={() => actions.goRoute('launchReadiness')} theme={theme} title="上线检查" />
        </MFCard>
        <SectionTitle theme={theme} title="关键风险" />
        {readinessChecks
          .filter((check) => check.tone !== 'success')
          .map((check) => (
            <MFStatusCard key={check.id} message={`${check.owner} · ${check.detail}`} onPress={() => actions.goRoute('launchReadiness')} theme={theme} title={check.title} tone={check.tone} />
          ))}
      </MFStack>
    </MFScrollPage>
  );
}

function OpsMonitoringScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  const totalEventCount = realtimeEvents.reduce((sum, event) => sum + event.count, 0);

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="opsCenter" subtitle="实时事件、设备心跳、任务进度和发版上报" theme={theme} title="监控看板" />
        <MFRow gap={12}>
          <MFStatCard label="事件量" theme={theme} value={String(totalEventCount)} />
          <MFStatCard label="在线设备" onPress={() => actions.goTabs('devices')} theme={theme} value="98" />
          <MFStatCard label="未处理告警" onPress={() => actions.goRoute('alerts')} theme={theme} value="12" />
        </MFRow>
        <MFStatusCard message="release.device.updated 当前延迟 2.4 秒，灰度期间建议保留人工观察窗口。" theme={theme} title="发布链路关注" tone="warning" />
        <SectionTitle theme={theme} title="实时事件" />
        {realtimeEvents.map((event) => (
          <MFCard key={event.id} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {event.channel}
                  </MFText>
                  <MFCaption theme={theme}>
                    今日 {event.count} 条 · 平均延迟 {event.delay}
                  </MFCaption>
                </MFStack>
                <MFBadge label={event.status} tone={event.tone} theme={theme} />
              </MFRow>
              <MFProgress label="链路健康度" theme={theme} value={event.tone === 'success' ? 0.96 : 0.72} />
            </MFStack>
          </MFCard>
        ))}
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.showToast('监控指标已刷新')} theme={theme} title="刷新" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.goRoute('auditLogs')} theme={theme} title="审计" variant="ghost" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function AuditLogsScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="opsCenter" subtitle="危险操作、发布变更和管理员行为追踪" theme={theme} title="审计日志" />
        <MFSearchBar placeholder="搜索管理员、对象 ID 或操作类型" theme={theme} />
        <MFSegmentedControl
          onChange={() => actions.showToast('审计筛选将在接口接入后生效')}
          options={[
            { label: '全部', value: 'all' },
            { label: '高危', value: 'danger' },
            { label: '发版', value: 'release' }
          ]}
          theme={theme}
          value="all"
        />
        {auditLogs.map((log) => (
          <MFCard key={log.id} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {log.title}
                  </MFText>
                  <MFCaption theme={theme}>
                    {log.createdAt} · {log.actor}
                  </MFCaption>
                </MFStack>
                <MFBadge label={log.result} tone={log.risk} theme={theme} />
              </MFRow>
              <MFKeyValue label="对象" theme={theme} value={log.object} />
              <MFButton fullWidth={false} onPress={() => actions.openSheet(log.title, `${log.actor} 在 ${log.createdAt} 操作 ${log.object}，结果：${log.result}。`)} theme={theme} title="详情" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function LaunchReadinessScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  const readyCount = readinessChecks.filter((check) => check.tone === 'success').length;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="opsCenter" subtitle="安全规则、实时链路、发版风险和上线确认" theme={theme} title="上线检查" />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  检查项 {readyCount} / {readinessChecks.length}
                </MFText>
                <MFCaption theme={theme}>仍有签名 URL 联调和发布实时延迟需要确认。</MFCaption>
              </MFStack>
              <MFBadge label="Phase 7" tone="info" theme={theme} />
            </MFRow>
            <MFProgress label="上线准备度" theme={theme} value={readyCount / readinessChecks.length} />
          </MFStack>
        </MFCard>
        {readinessChecks.map((check) => (
          <MFCard key={check.id} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {check.title}
                  </MFText>
                  <MFCaption theme={theme}>{check.owner}</MFCaption>
                </MFStack>
                <MFBadge label={check.status} tone={check.tone} theme={theme} />
              </MFRow>
              <MFCaption theme={theme}>{check.detail}</MFCaption>
            </MFStack>
          </MFCard>
        ))}
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.showToast('上线检查报告已生成')} theme={theme} title="生成报告" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.goRoute('auditLogs')} theme={theme} title="查看审计" variant="ghost" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function TestPlanScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  const passedCases = testCases.filter((testCase) => testCase.tone === 'success').length;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="opsCenter" subtitle="登录、调度、发版、告警和证据链路验收" theme={theme} title="测试用例" />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                  回归进度
                </MFText>
                <MFCaption theme={theme}>
                  {passedCases} / {testCases.length} 通过，发版流程保留人工确认。
                </MFCaption>
              </MFStack>
              <MFBadge label="验收" tone="info" theme={theme} />
            </MFRow>
            <MFProgress label="测试通过率" theme={theme} value={passedCases / testCases.length} />
          </MFStack>
        </MFCard>
        {testCases.map((testCase) => (
          <MFCard key={testCase.id} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {testCase.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {testCase.scope} · {testCase.owner}
                  </MFCaption>
                </MFStack>
                <MFBadge label={testCase.result} tone={testCase.tone} theme={theme} />
              </MFRow>
              <MFButton fullWidth={false} onPress={() => actions.openSheet(testCase.name, `${testCase.scope} 已纳入 Phase 7 验收记录，正式接入后同步自动化结果。`)} theme={theme} title="记录" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function PendingDevicesScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="devices" subtitle="自动注册但尚未绑定托管用户的设备" theme={theme} title="待绑定设备" />
        <MFSearchBar placeholder="搜索绑定码或设备名称" theme={theme} />
        {pendingDevices.map((device) => (
          <MFCard key={device.bindingCode} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {device.name}
                  </MFText>
                  <MFCaption theme={theme}>{device.bindingCode}</MFCaption>
                </MFStack>
                <MFBadge label={device.status} tone="warning" theme={theme} />
              </MFRow>
              <MFButton fullWidth={false} onPress={() => actions.openBindDevice(fallbackManagedUser.id)} theme={theme} title="立即绑定" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function DeviceDetailScreen({ actions, device, theme }: { actions: AdminActions; device: DeviceRecord; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="devices" subtitle={`${device.id} · ${device.status}`} theme={theme} title={device.name} />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  {device.worker}
                </MFText>
                <MFCaption theme={theme}>{device.user} · APP {device.app}</MFCaption>
              </MFStack>
              <MFBadge label={device.status} tone={device.tone} theme={theme} />
            </MFRow>
            <MFKeyValue label="ADB 状态" theme={theme} value={device.adb} />
            <MFKeyValue label="当前任务" theme={theme} value="随缘打熊 72%" />
          </MFStack>
        </MFCard>
        <MFStatusCard message="最近 10 分钟心跳正常，任务 claim/report/finish 链路等待后端实时事件接入。" theme={theme} title="最近运行" tone={device.tone === 'danger' ? 'danger' : 'success'} />
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.showToast(`${device.name} 测试连接已下发`)} theme={theme} title="测试连接" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.openDevice(device.id, 'deviceAlert')} theme={theme} title="异常详情" variant="ghost" />
          <MFButton fullWidth={false} onPress={() => actions.openDevice(device.id, 'deviceActions')} theme={theme} title="更多" variant="ghost" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function DeviceActionsScreen({ actions, device, theme }: { actions: AdminActions; device: DeviceRecord; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="deviceDetail" subtitle={`${device.id} · ${device.worker}`} theme={theme} title="设备操作" />
        <MFCard glass theme={theme}>
          <MFStack gap={10}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  {device.name}
                </MFText>
                <MFCaption theme={theme}>
                  {device.user} · APP {device.app}
                </MFCaption>
              </MFStack>
              <MFBadge label={device.status} tone={device.tone} theme={theme} />
            </MFRow>
            <MFKeyValue label="ADB 状态" theme={theme} value={device.adb} />
          </MFStack>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          <MFListItem meta="下发一次连接探测并刷新心跳" onPress={() => actions.showToast(`${device.name} 测试连接已下发`)} theme={theme} title="测试连接" />
          <MFDivider />
          <MFListItem meta="重启 Worker 会写入审计日志" onPress={() => actions.showToast(`${device.name} 重启 Worker 指令已下发`)} theme={theme} title="重启 Worker" />
          <MFDivider />
          <MFListItem meta={device.id} onPress={() => actions.showToast('设备 ID 已复制')} theme={theme} title="复制设备 ID" />
          <MFDivider />
          <MFListItem meta="查看设备异常、任务日志和恢复建议" onPress={() => actions.openDevice(device.id, 'deviceAlert')} theme={theme} title="日志与异常" />
          <MFDivider />
          <MFListItem meta="撤销 device_token 并解除托管用户绑定" onPress={() => actions.openDevice(device.id, 'deviceUnbind')} theme={theme} title="解绑设备" />
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function DeviceUnbindScreen({ actions, device, theme }: { actions: AdminActions; device: DeviceRecord; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="deviceActions" subtitle={`${device.name} · ${device.user}`} theme={theme} title="设备解绑确认" />
        <MFStatusCard message="解绑后设备将不再拉取任务，服务端会撤销 device_token，相关任务需要重新分配设备。" theme={theme} title="高风险操作" tone="danger" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="设备摘要" />
            <MFKeyValue label="设备" theme={theme} value={device.name} />
            <MFKeyValue label="托管用户" theme={theme} value={device.user} />
            <MFKeyValue label="APP 版本" theme={theme} value={device.app} />
            <MFKeyValue label="Worker" theme={theme} value={device.worker} />
            <MFCheckbox label="确认撤销设备 Token 并写入审计日志" onValueChange={() => actions.showToast('解绑确认状态已切换')} theme={theme} value />
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.goRoute('deviceActions')} theme={theme} title="返回" variant="ghost" />
          <MFButton
            fullWidth={false}
            onPress={() => {
              actions.showToast('设备解绑请求已提交');
              actions.goTabs('devices');
            }}
            theme={theme}
            title="确认解绑"
            variant="danger"
          />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function DeviceAlertScreen({ actions, device, theme }: { actions: AdminActions; device: DeviceRecord; theme: MFTheme }) {
  const relatedAlert = alerts.find((alert) => alert.deviceId === device.id) ?? fallbackAlert;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="deviceDetail" subtitle={`${device.name} · ${device.adb}`} theme={theme} title="设备异常详情" />
        <MFStatusCard message="ADB 连接异常，Worker 最近一次 report 未完成。建议先尝试恢复连接，再决定是否重启 Worker。" theme={theme} title="ADB 连接异常" tone="danger" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="异常信息" />
            <MFKeyValue label="设备" theme={theme} value={device.name} />
            <MFKeyValue label="托管用户" theme={theme} value={device.user} />
            <MFKeyValue label="APP 版本" theme={theme} value={device.app} />
            <MFKeyValue label="恢复状态" theme={theme} value="未恢复" />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={8}>
            <SectionTitle theme={theme} title="处理建议" />
            {['检查无障碍权限和悬浮窗权限', '重启 Worker 后重新 claim 当前任务', '必要时解绑并重新生成 device_token'].map((item) => (
              <MFCaption key={item} theme={theme}>
                {item}
              </MFCaption>
            ))}
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.showToast('恢复连接指令已下发')} theme={theme} title="尝试恢复" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.openAlert(relatedAlert.id)} theme={theme} title="关联告警" variant="ghost" />
          <MFButton fullWidth={false} onPress={() => actions.openLogDetail(relatedAlert.taskRunId, relatedAlert.id, 'deviceAlert')} theme={theme} title="日志" variant="ghost" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function ProfileScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <Header title="我的" subtitle="管理员资料、系统设置、权限和操作日志" theme={theme} />
        <MFCard glass theme={theme}>
          <MFRow gap={14}>
            <View style={{ alignItems: 'center', backgroundColor: theme.colors.primarySoft, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 }}>
              <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 24, fontWeight: '900' }}>
                A
              </MFText>
            </View>
            <MFStack gap={4} style={{ flex: 1 }}>
              <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                Admin
              </MFText>
              <MFCaption theme={theme}>超级管理员 · 全局权限</MFCaption>
            </MFStack>
            <MFBadge label="在线" tone="success" theme={theme} />
          </MFRow>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          {profileEntries.map((entry, index, rows) => (
            <View key={entry.title}>
              <MFListItem
                meta={entry.meta}
                onPress={() => {
                  if (entry.title === '操作日志') {
                    actions.goRoute('auditLogs');
                    return;
                  }

                  actions.openSheet(entry.title, `${entry.title} 后续会接入独立子页面。`);
                }}
                theme={theme}
                title={entry.title}
              />
              {index < rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <MFButton onPress={() => actions.goLogin()} theme={theme} title="退出登录" variant="danger" />
      </MFStack>
    </MFScrollPage>
  );
}

function Header({
  onRightPress,
  rightLabel,
  subtitle,
  theme,
  title
}: {
  onRightPress?: () => void;
  rightLabel?: string;
  subtitle: string;
  theme: MFTheme;
  title: string;
}) {
  return (
    <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <MFStack gap={4} style={{ flex: 1 }}>
        <MFHeading theme={theme}>{title}</MFHeading>
        <MFCaption theme={theme}>{subtitle}</MFCaption>
      </MFStack>
      {rightLabel && onRightPress ? <MFButton fullWidth={false} onPress={onRightPress} theme={theme} title={rightLabel} variant="secondary" /> : null}
    </MFRow>
  );
}

function BackHeader({
  actions,
  backRoute,
  backTab,
  subtitle,
  theme,
  title
}: {
  actions: AdminActions;
  backRoute?: RouteKey;
  backTab?: MainTab;
  subtitle: string;
  theme: MFTheme;
  title: string;
}) {
  return (
    <MFStack gap={10}>
      <MFButton
        fullWidth={false}
        onPress={() => {
          if (backRoute) {
            actions.goRoute(backRoute);
            return;
          }

          actions.goTabs(backTab);
        }}
        theme={theme}
        title="返回"
        variant="ghost"
      />
      <Header subtitle={subtitle} theme={theme} title={title} />
    </MFStack>
  );
}

function SectionTitle({
  action,
  onAction,
  theme,
  title
}: {
  action?: string;
  onAction?: () => void;
  theme: MFTheme;
  title: string;
}) {
  return (
    <MFRow style={{ justifyContent: 'space-between' }}>
      <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
        {title}
      </MFText>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <MFText theme={theme} style={{ color: theme.colors.primary, fontWeight: '800' }}>
            {action}
          </MFText>
        </Pressable>
      ) : null}
    </MFRow>
  );
}

function TaskCreateProgress({ step, theme }: { step: number; theme: MFTheme }) {
  const labels = ['选用户', '选账号', '确认设备', '选分组', '选任务', '配参数', '确认'];
  const label = labels[step - 1] ?? '新建任务';

  return (
    <MFCard theme={theme}>
      <MFStack gap={10}>
        <MFRow style={{ justifyContent: 'space-between' }}>
          <MFText theme={theme} style={{ fontWeight: '900' }}>
            {label}
          </MFText>
          <MFBadge label={`${step}/7`} tone="info" theme={theme} />
        </MFRow>
        <MFProgress label="新建进度" theme={theme} value={step / 7} />
      </MFStack>
    </MFCard>
  );
}

function TaskDraftSummary({ items, theme }: { items: string[]; theme: MFTheme }) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={8}>
        <SectionTitle theme={theme} title="已选摘要" />
        {items.map((item) => (
          <MFCaption key={item} theme={theme}>
            {item}
          </MFCaption>
        ))}
      </MFStack>
    </MFCard>
  );
}

function AlertStatusBadge({ status, theme }: { status: AlertStatus; theme: MFTheme }) {
  const mapping: Record<AlertStatus, { label: string; tone: Tone }> = {
    open: { label: '未处理', tone: 'danger' },
    processing: { label: '处理中', tone: 'warning' },
    resolved: { label: '已恢复', tone: 'success' }
  };
  const badge = mapping[status];
  return <MFBadge label={badge.label} tone={badge.tone} theme={theme} />;
}

function ReleaseStatusBadge({ status, theme }: { status: string; theme: MFTheme }) {
  const tone: Tone = status === '线上版本' ? 'success' : status === '灰度中' ? 'warning' : status === '草稿' ? 'info' : 'danger';
  return <MFBadge label={status} tone={tone} theme={theme} />;
}

function EvidenceSection({ evidences, theme }: { evidences: EvidenceRecord[]; theme: MFTheme }) {
  if (evidences.length === 0) {
    return <MFStatusCard message="当前任务还没有可查看的证据截图。" theme={theme} title="证据截图" tone="info" />;
  }

  return (
    <MFCard theme={theme}>
      <MFStack gap={10}>
        <SectionTitle theme={theme} title="证据截图" />
        {evidences.map((evidence) => (
          <View
            key={evidence.id}
            style={{
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              padding: theme.spacing.md
            }}
          >
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  {evidence.label}
                </MFText>
                <MFCaption theme={theme}>
                  {evidence.capturedAt} · similarity {evidence.similarity}
                </MFCaption>
              </MFStack>
              <MFBadge label="短链" tone="info" theme={theme} />
            </MFRow>
          </View>
        ))}
      </MFStack>
    </MFCard>
  );
}

function TaskSummaryCard({
  task,
  theme
}: {
  task: {
    device: string;
    progress: number;
    status: string;
    title: string;
    user: string;
  };
  theme: MFTheme;
}) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={10}>
        <MFRow style={{ justifyContent: 'space-between' }}>
          <MFStack gap={3} style={{ flex: 1 }}>
            <MFText theme={theme} style={{ fontWeight: '900' }}>
              {task.title}
            </MFText>
            <MFCaption theme={theme}>
              {task.user} · {task.device}
            </MFCaption>
          </MFStack>
          <MFBadge label={task.status} tone="info" theme={theme} />
        </MFRow>
        <MFProgress label="当前进度" theme={theme} value={task.progress} />
      </MFStack>
    </MFCard>
  );
}

function TaskBadge({ status, theme }: { status: string; theme: MFTheme }) {
  const mapping: Record<string, { label: string; tone: Tone }> = {
    failed: { label: '失败', tone: 'danger' },
    finished: { label: '完成', tone: 'success' },
    running: { label: '执行中', tone: 'info' }
  };
  const badge = mapping[status] ?? { label: '执行中', tone: 'info' as const };
  return <MFBadge label={badge.label} tone={badge.tone} theme={theme} />;
}

function LogoMark({ size, theme }: { size: number; theme: MFTheme }) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: Math.round(size / 3.6),
        height: size,
        justifyContent: 'center',
        width: size
      }}
    >
      <MFText theme={theme} style={{ color: '#FFFFFF', fontSize: Math.round(size * 0.42), fontWeight: '900', lineHeight: Math.round(size * 0.48) }}>
        GH
      </MFText>
    </View>
  );
}

function MainTabBar({ actions, activeTab, theme }: { actions: AdminActions; activeTab: MainTab; theme: MFTheme }) {
  return (
    <MFTabBar
      items={tabs.map((item) => ({ badge: item.badge, label: item.label, value: item.key }))}
      onChange={actions.setTab}
      style={{ bottom: 12, left: 12, position: 'absolute', right: 12 }}
      theme={theme}
      value={activeTab}
    />
  );
}

export default App;
