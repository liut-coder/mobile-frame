import { useEffect, useState } from 'react';

import {
  createFixtureMobileBffClient,
  createHttpMobileBffClient,
  listAssets as listFixtureAssets,
  listDevices as listFixtureDevices,
  listModules as listFixtureModules,
  listReleases as listFixtureReleases,
  listRuntimeLogs as listFixtureRuntimeLogs,
  listTaskLogs as listFixtureTaskLogs,
  listTasks as listFixtureTasks,
  listUsers as listFixtureUsers,
  type MobileBffAssetStatus,
  type MobileBffDashboard,
  type MobileBffClient,
  type MobileBffDevice,
  type MobileBffDeviceStatus,
  type MobileBffFetch,
  type MobileBffFixtureData,
  type MobileBffGameModule,
  type MobileBffHttpClientOptions,
  type MobileBffListRequest,
  type MobileBffListResponse,
  type MobileBffLogLevel,
  type MobileBffModuleStatus,
  type MobileBffRelease,
  type MobileBffReleaseStatus,
  type MobileBffRuntimeLog,
  type MobileBffTask,
  type MobileBffTaskLogEntry,
  type MobileBffTaskStatus,
  type MobileBffUser,
  type MobileBffUserStatus,
  type MobileBffVisualAsset
} from '@mobile-frame/mobile-bff';

import { dashboardAlerts, dashboardSummary, devices, findDevice, findTask, tasks } from '../store';

const fixtureDashboard = {
  alerts: dashboardAlerts.map((alert, index) => ({
    createdAt: `2026-06-03T20:${(30 + index).toString().padStart(2, '0')}:00Z`,
    id: `alert-${index + 1}`,
    message: alert.message,
    title: alert.title,
    tone: alert.tone
  })),
  metrics: dashboardSummary
} satisfies Pick<MobileBffDashboard, 'alerts' | 'metrics'>;

const users = [
  {
    deviceCount: 2,
    id: 'user-zhang-san',
    lastActiveAt: '2026-06-03 20:31',
    name: 'Zhang San',
    role: 'Daily route owner',
    status: 'active'
  },
  {
    deviceCount: 1,
    id: 'user-li-si',
    lastActiveAt: '2026-06-03 19:12',
    name: 'Li Si',
    role: 'Arena operator',
    status: 'pending'
  },
  {
    deviceCount: 0,
    id: 'user-wang-wu',
    lastActiveAt: '2026-05-28 09:44',
    name: 'Wang Wu',
    role: 'Resource owner',
    status: 'disabled'
  }
] satisfies MobileBffUser[];

const modules = [
  {
    game: 'Game Helper',
    id: 'module-daily-bear',
    name: 'Daily bear route',
    rollout: '100%',
    status: 'enabled',
    updatedAt: '2026-06-03 18:00',
    version: '2.4.1'
  },
  {
    game: 'Game Helper',
    id: 'module-arena-ladder',
    name: 'Arena ladder',
    rollout: '20%',
    status: 'draft',
    updatedAt: '2026-06-03 16:30',
    version: '1.9.0-beta.2'
  },
  {
    game: 'Legacy mode',
    id: 'module-mining-sweep',
    name: 'Resource mining sweep',
    rollout: '0%',
    status: 'disabled',
    updatedAt: '2026-05-31 10:15',
    version: '1.1.8'
  }
] satisfies MobileBffGameModule[];

const assets = [
  {
    id: 'asset-login-template',
    kind: 'template',
    name: 'Login template',
    status: 'ready',
    updatedAt: '2026-06-03 14:12',
    version: '2026.06.03'
  },
  {
    id: 'asset-arena-evidence',
    kind: 'screenshot',
    name: 'Arena evidence frame',
    status: 'review',
    updatedAt: '2026-06-03 12:22',
    version: '2026.06.02'
  },
  {
    id: 'asset-old-icon',
    kind: 'icon',
    name: 'Deprecated app icon',
    status: 'outdated',
    updatedAt: '2026-05-27 08:10',
    version: '2026.05.27'
  }
] satisfies MobileBffVisualAsset[];

const releases = [
  {
    channel: 'beta',
    id: 'release-1.3.0-beta.4',
    notes: 'Staged rollout for admin mobile recovery actions.',
    progress: '35%',
    status: 'staged',
    updatedAt: '2026-06-03 20:05',
    version: '1.3.0-beta.4'
  },
  {
    channel: 'gray',
    id: 'release-1.2.9-gray.8',
    notes: 'Paused after device heartbeat regression.',
    progress: '62%',
    status: 'paused',
    updatedAt: '2026-06-03 17:48',
    version: '1.2.9-gray.8'
  },
  {
    channel: 'alpha',
    id: 'release-1.3.1-alpha.1',
    notes: 'Draft release notes for scanner adapter proof.',
    progress: '0%',
    status: 'draft',
    updatedAt: '2026-06-03 11:00',
    version: '1.3.1-alpha.1'
  }
] satisfies MobileBffRelease[];

const runtimeLogs = [
  { id: 'log-release-staged', level: 'info', message: 'Release rollout worker accepted staged deployment.', scope: 'release', time: '20:05:01' },
  { id: 'log-device-latency', level: 'warn', message: 'Device DEV-2048 reported elevated latency.', scope: 'device', time: '20:06:22' },
  { id: 'log-task-failed', level: 'error', message: 'Task task-arena-219 stopped after login verification failure.', scope: 'task', time: '20:08:03' }
] satisfies MobileBffRuntimeLog[];

const fixtureMobileBffData = {
  assets,
  dashboard: fixtureDashboard,
  devices,
  logs: runtimeLogs,
  modules,
  releases,
  tasks,
  users
} satisfies MobileBffFixtureData;

export type AdminMobileBffMode = 'fixture' | 'http';
export type AdminMobileBffClientOptions = {
  baseUrl?: string;
  fetch?: MobileBffFetch;
  getAccessToken?: MobileBffHttpClientOptions['getAccessToken'];
  headers?: MobileBffHttpClientOptions['headers'];
  mode?: AdminMobileBffMode;
};

export function createAdminMobileBffClient(options: AdminMobileBffClientOptions = {}): MobileBffClient {
  if (options.mode !== 'http') {
    return createFixtureMobileBffClient(fixtureMobileBffData);
  }

  if (!options.baseUrl || !options.fetch) {
    throw new Error('HTTP mobile BFF mode requires baseUrl and fetch.');
  }

  return createHttpMobileBffClient({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
    getAccessToken: options.getAccessToken,
    headers: options.headers
  });
}

export let adminMobileBffClient = createAdminMobileBffClient();

export function configureAdminMobileBffClient(options: AdminMobileBffClientOptions = {}): MobileBffClient {
  adminMobileBffClient = createAdminMobileBffClient(options);

  return adminMobileBffClient;
}

export function resetAdminMobileBffClient(): MobileBffClient {
  return configureAdminMobileBffClient({ mode: 'fixture' });
}

export function useMobileBffAssets(request: MobileBffListRequest<MobileBffAssetStatus>) {
  const initialValue = listFixtureAssets(assets, request);

  return useBffValue(() => adminMobileBffClient.listAssets(request), initialValue, listRequestDependencies(request));
}

export function useMobileBffDashboard() {
  return useBffValue(
    () => adminMobileBffClient.getDashboard(),
    {
      activeTasks: tasks.filter((task) => task.status === 'running').slice(0, 2),
      alerts: fixtureDashboard.alerts,
      metrics: fixtureDashboard.metrics,
      recentDevices: devices.slice(0, 2)
    },
    []
  );
}

export function useMobileBffDevice(deviceId: string) {
  return useBffValue(() => adminMobileBffClient.getDevice(deviceId), findDevice(deviceId) ?? null, [deviceId]);
}

export function useMobileBffDevices(request: MobileBffListRequest<MobileBffDeviceStatus>) {
  const initialValue = listFixtureDevices(devices, request);

  return useBffValue(() => adminMobileBffClient.listDevices(request), initialValue, listRequestDependencies(request));
}

export function useMobileBffModules(request: MobileBffListRequest<MobileBffModuleStatus>) {
  const initialValue = listFixtureModules(modules, request);

  return useBffValue(() => adminMobileBffClient.listModules(request), initialValue, listRequestDependencies(request));
}

export function useMobileBffReleases(request: MobileBffListRequest<MobileBffReleaseStatus>) {
  const initialValue = listFixtureReleases(releases, request);

  return useBffValue(() => adminMobileBffClient.listReleases(request), initialValue, listRequestDependencies(request));
}

export function useMobileBffRuntimeLogs(request: MobileBffListRequest<MobileBffLogLevel>) {
  const initialValue = listFixtureRuntimeLogs(runtimeLogs, request);

  return useBffValue(() => adminMobileBffClient.listLogs(request), initialValue, listRequestDependencies(request));
}

export function useMobileBffTask(taskId: string | null | undefined) {
  return useBffValue(() => (taskId ? adminMobileBffClient.getTask(taskId) : Promise.resolve(null)), taskId ? findTask(taskId) ?? null : null, [taskId ?? '']);
}

export function useMobileBffTasks(request: MobileBffListRequest<MobileBffTaskStatus>) {
  const initialValue = listFixtureTasks(tasks, request);

  return useBffValue(() => adminMobileBffClient.listTasks(request), initialValue, listRequestDependencies(request));
}

export function useMobileBffTaskLogs(taskId: string) {
  const initialLogs = findTask(taskId)?.logs ?? [];
  const initialValue = listFixtureTaskLogs(initialLogs, {});

  return useBffValue(() => adminMobileBffClient.listTaskLogs(taskId), initialValue, [taskId]);
}

export function useMobileBffUsers(request: MobileBffListRequest<MobileBffUserStatus>) {
  const initialValue = listFixtureUsers(users, request);

  return useBffValue(() => adminMobileBffClient.listUsers(request), initialValue, listRequestDependencies(request));
}

function useBffValue<TValue>(load: () => Promise<TValue>, initialValue: TValue, dependencies: unknown[]): TValue {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    let cancelled = false;
    setValue(initialValue);
    load()
      .then((nextValue) => {
        if (!cancelled) {
          setValue(nextValue);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValue(initialValue);
        }
      });

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return value;
}

function listRequestDependencies<TStatus extends string>(request: MobileBffListRequest<TStatus>): unknown[] {
  return [request.cursor ?? '', request.limit ?? 0, request.query ?? '', (request.statuses ?? []).join('|')];
}

export type AdminMobileBffAssetList = MobileBffListResponse<MobileBffVisualAsset, MobileBffAssetStatus>;
export type AdminMobileBffDeviceList = MobileBffListResponse<MobileBffDevice, MobileBffDeviceStatus>;
export type AdminMobileBffModuleList = MobileBffListResponse<MobileBffGameModule, MobileBffModuleStatus>;
export type AdminMobileBffReleaseList = MobileBffListResponse<MobileBffRelease, MobileBffReleaseStatus>;
export type AdminMobileBffRuntimeLogList = MobileBffListResponse<MobileBffRuntimeLog, MobileBffLogLevel>;
export type AdminMobileBffTaskList = MobileBffListResponse<MobileBffTask, MobileBffTaskStatus>;
export type AdminMobileBffTaskLogList = MobileBffListResponse<MobileBffTaskLogEntry, MobileBffLogLevel>;
export type AdminMobileBffUserList = MobileBffListResponse<MobileBffUser, MobileBffUserStatus>;
