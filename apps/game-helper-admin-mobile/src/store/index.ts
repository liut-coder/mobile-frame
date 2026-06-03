import { createAdminSession, type AdminPermission, type AdminTokenPayload } from '@mobile-frame/auth-admin';
import { getPreset } from '@mobile-frame/presets';

export type AdminTab = 'dashboard' | 'devices' | 'tasks' | 'management' | 'profile';
export type AdminTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
export type DeviceStatus = 'online' | 'offline' | 'warning';
export type TaskStatus = 'running' | 'failed' | 'paused' | 'completed' | 'queued';
export type LogLevel = 'info' | 'warn' | 'error';

export type DeviceRecord = {
  appVersion: string;
  battery: number;
  currentTaskId?: string;
  heartbeat: string;
  id: string;
  model: string;
  owner: string;
  risk?: string;
  status: DeviceStatus;
  worker: 'active' | 'stopped' | 'idle';
};

export type TaskLogEntry = {
  level: LogLevel;
  message: string;
  time: string;
};

export type TaskRecord = {
  currentStep: string;
  deviceId: string;
  deviceName: string;
  error?: string;
  id: string;
  name: string;
  owner: string;
  progress: {
    done: number;
    total: number;
  };
  startedAt: string;
  status: TaskStatus;
  steps: Array<{
    label: string;
    state: 'done' | 'running' | 'blocked' | 'waiting';
    time: string;
  }>;
  logs: TaskLogEntry[];
};

export const appPreset = getPreset('admin-mobile');

const tabValues: AdminTab[] = ['dashboard', 'devices', 'tasks', 'management', 'profile'];

export const appTabs = appPreset.tabs.map((label, index) => ({
  label,
  order: index + 1,
  value: tabValues[index] ?? 'dashboard'
}));

export const adminTokenPayload = {
  access_token: 'demo-admin-access-token',
  device_id: 'admin-phone-01',
  name: 'Operations Admin',
  permissions: [
    'dashboard.view',
    'user.view',
    'device.view',
    'device.bind',
    'module.view',
    'asset.view',
    'task.view',
    'task.stop',
    'task.retry',
    'app.release.view',
    'log.view'
  ],
  refresh_token: 'demo-admin-refresh-token',
  role: 'Platform administrator',
  tenant_id: 'game-helper-prod'
} satisfies AdminTokenPayload;

export const adminSession = createAdminSession(adminTokenPayload);

export const dashboardSummary = [
  { label: 'Online devices', tone: 'success' as const, value: '128' },
  { label: 'Running tasks', tone: 'info' as const, value: '37' },
  { label: 'Failed tasks', tone: 'danger' as const, value: '4' },
  { label: 'Pending approvals', tone: 'warning' as const, value: '3' }
];

export const dashboardAlerts = [
  {
    message: 'Four tasks failed in the last hour. Open task details for logs, screenshots, and retry actions.',
    title: 'Failure spike',
    tone: 'danger' as const
  },
  {
    message: 'Release 1.3.0-beta.4 is in staged rollout. Mobile can approve or pause, not build artifacts locally.',
    title: 'Release rollout',
    tone: 'warning' as const
  }
];

export const devices: DeviceRecord[] = [
  {
    appVersion: '1.2.3',
    battery: 82,
    currentTaskId: 'task-bear-042',
    heartbeat: '2 min ago',
    id: 'DEV-1024',
    model: 'Xiaomi 14',
    owner: 'Zhang San',
    status: 'online',
    worker: 'active'
  },
  {
    appVersion: '1.2.1',
    battery: 41,
    currentTaskId: 'task-arena-219',
    heartbeat: '8 min ago',
    id: 'DEV-2048',
    model: 'Redmi K70',
    owner: 'Li Si',
    risk: 'Worker recently restarted',
    status: 'warning',
    worker: 'active'
  },
  {
    appVersion: '1.1.9',
    battery: 18,
    heartbeat: '47 min ago',
    id: 'DEV-4096',
    model: 'OnePlus Ace 3',
    owner: 'Wang Wu',
    risk: 'Heartbeat timeout',
    status: 'offline',
    worker: 'stopped'
  }
];

export const tasks: TaskRecord[] = [
  {
    currentStep: 'Waiting for combat result',
    deviceId: 'DEV-1024',
    deviceName: 'Xiaomi 14',
    id: 'task-bear-042',
    logs: [
      { level: 'info', message: 'Worker accepted job task-bear-042.', time: '03:21:12' },
      { level: 'info', message: 'Entered combat scene and captured first evidence frame.', time: '03:22:07' },
      { level: 'warn', message: 'Network latency exceeded 1200 ms, keeping current retry window.', time: '03:24:31' }
    ],
    name: 'Daily bear route',
    owner: 'Zhang San',
    progress: { done: 18, total: 42 },
    startedAt: '03:21',
    status: 'running',
    steps: [
      { label: 'Assign device', state: 'done', time: '03:20' },
      { label: 'Start worker job', state: 'done', time: '03:21' },
      { label: 'Combat loop', state: 'running', time: '03:24' },
      { label: 'Evidence upload', state: 'waiting', time: '--' }
    ]
  },
  {
    currentStep: 'Login verification failed',
    deviceId: 'DEV-2048',
    deviceName: 'Redmi K70',
    error: 'Account was displaced by another login session.',
    id: 'task-arena-219',
    logs: [
      { level: 'info', message: 'Worker accepted job task-arena-219.', time: '02:58:10' },
      { level: 'warn', message: 'Detected account displacement warning.', time: '02:59:44' },
      { level: 'error', message: 'Task stopped after login verification failure.', time: '03:00:02' }
    ],
    name: 'Arena ladder run',
    owner: 'Li Si',
    progress: { done: 6, total: 25 },
    startedAt: '02:58',
    status: 'failed',
    steps: [
      { label: 'Assign device', state: 'done', time: '02:57' },
      { label: 'Start worker job', state: 'done', time: '02:58' },
      { label: 'Login verification', state: 'blocked', time: '03:00' },
      { label: 'Retry decision', state: 'waiting', time: '--' }
    ]
  },
  {
    currentStep: 'Queued for device availability',
    deviceId: 'DEV-4096',
    deviceName: 'OnePlus Ace 3',
    id: 'task-mining-778',
    logs: [{ level: 'info', message: 'Task is queued until target device returns online.', time: '03:18:51' }],
    name: 'Resource mining sweep',
    owner: 'Wang Wu',
    progress: { done: 0, total: 16 },
    startedAt: 'queued',
    status: 'queued',
    steps: [
      { label: 'Assign device', state: 'done', time: '03:18' },
      { label: 'Wait for heartbeat', state: 'waiting', time: '--' }
    ]
  }
];

export const managementEntries = [
  {
    badge: 'Users',
    description: 'Review managed users, account ownership, and lightweight approvals.',
    permission: 'user.view',
    title: 'Managed users'
  },
  {
    badge: 'Modules',
    description: 'Inspect enabled game modules and server-side rollout status.',
    permission: 'module.view',
    title: 'Game modules'
  },
  {
    badge: 'Assets',
    description: 'Check visual asset versions and evidence galleries without running OCR locally.',
    permission: 'asset.view',
    title: 'Visual assets'
  },
  {
    badge: 'Release',
    description: 'Approve, pause, and inspect app releases. Build and upload stay on the server.',
    permission: 'app.release.view',
    title: 'App releases'
  },
  {
    badge: 'Logs',
    description: 'Open filtered runtime logs for devices, tasks, workers, and release events.',
    permission: 'log.view',
    title: 'Running logs'
  }
] satisfies Array<{
  badge: string;
  description: string;
  permission: AdminPermission;
  title: string;
}>;

export const adminBoundaries = [
  'No OCR, OpenCV, accessibility service, floating window, or local automation.',
  'No Worker polling, heartbeat reporting, screenshots, or script execution.',
  'Mobile actions call /api/v1/mobile and server-side orchestration owns execution.'
];

export const bffContracts = [
  'GET /api/v1/mobile/dashboard',
  'GET /api/v1/mobile/devices',
  'GET /api/v1/mobile/tasks',
  'POST /api/v1/mobile/tasks/{id}:stop',
  'POST /api/v1/mobile/tasks/{id}:retry'
];

export function findDevice(deviceId: string): DeviceRecord | undefined {
  return devices.find((device) => device.id === deviceId);
}

export function findTask(taskId: string): TaskRecord | undefined {
  return tasks.find((task) => task.id === taskId);
}

export function getDeviceStatusLabel(status: DeviceStatus): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    case 'warning':
      return 'Warning';
  }
}

export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'running':
      return 'Running';
    case 'failed':
      return 'Failed';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'queued':
      return 'Queued';
  }
}

export function statusTone(status: DeviceStatus | TaskStatus | LogLevel | 'done' | 'blocked' | 'waiting'): AdminTone {
  switch (status) {
    case 'online':
    case 'completed':
    case 'done':
      return 'success';
    case 'offline':
    case 'failed':
    case 'error':
    case 'blocked':
      return 'danger';
    case 'warning':
    case 'paused':
    case 'queued':
    case 'warn':
    case 'waiting':
      return 'warning';
    case 'running':
    case 'info':
    default:
      return 'info';
  }
}

export function progressValue(task: TaskRecord): number {
  if (task.progress.total <= 0) {
    return 0;
  }

  return task.progress.done / task.progress.total;
}

export function progressLabel(task: TaskRecord): string {
  return `${task.progress.done} / ${task.progress.total}`;
}
