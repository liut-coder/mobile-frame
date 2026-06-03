import { describe, expect, it } from 'vitest';

import {
  createFixtureMobileBffClient,
  createHttpMobileBffClient,
  listDevices,
  listUsers,
  type MobileBffDevice,
  type MobileBffGameModule,
  type MobileBffRelease,
  type MobileBffRuntimeLog,
  type MobileBffTask,
  type MobileBffUser,
  type MobileBffVisualAsset
} from './index';

const devices = [
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
] satisfies MobileBffDevice[];

const tasks = [
  {
    currentStep: 'Waiting for combat result',
    deviceId: 'DEV-1024',
    deviceName: 'Xiaomi 14',
    id: 'task-bear-042',
    logs: [{ level: 'info', message: 'Worker accepted job task-bear-042.', time: '03:21:12' }],
    name: 'Daily bear route',
    owner: 'Zhang San',
    progress: { done: 18, total: 42 },
    startedAt: '03:21',
    status: 'running',
    steps: [{ label: 'Assign device', state: 'done', time: '03:20' }]
  },
  {
    currentStep: 'Login verification failed',
    deviceId: 'DEV-2048',
    deviceName: 'Redmi K70',
    error: 'Account was displaced by another login session.',
    id: 'task-arena-219',
    logs: [{ level: 'error', message: 'Task stopped after login verification failure.', time: '03:00:02' }],
    name: 'Arena ladder run',
    owner: 'Li Si',
    progress: { done: 6, total: 25 },
    startedAt: '02:58',
    status: 'failed',
    steps: [{ label: 'Login verification', state: 'blocked', time: '03:00' }]
  }
] satisfies MobileBffTask[];
const failedTask = tasks[1] as MobileBffTask;

const users = [
  {
    deviceCount: 2,
    id: 'user-ops-001',
    lastActiveAt: '2026-06-03 20:31',
    name: 'Ops Admin',
    role: 'Platform administrator',
    status: 'active'
  },
  {
    deviceCount: 1,
    id: 'user-review-014',
    lastActiveAt: '2026-06-03 19:12',
    name: 'Review Queue',
    role: 'Release approver',
    status: 'pending'
  },
  {
    deviceCount: 0,
    id: 'user-disabled-033',
    lastActiveAt: '2026-05-28 09:44',
    name: 'Suspended Runner',
    role: 'Game account',
    status: 'disabled'
  }
] satisfies MobileBffUser[];

const modules = [
  {
    game: 'Game Helper',
    id: 'module-bear-route',
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
  { id: 'log-1', level: 'info', message: 'Release rollout worker accepted staged deployment.', scope: 'release', time: '20:05:01' },
  { id: 'log-2', level: 'warn', message: 'Device DEV-2048 reported elevated latency.', scope: 'device', time: '20:06:22' },
  { id: 'log-3', level: 'error', message: 'Task task-arena-219 stopped after login verification failure.', scope: 'task', time: '20:08:03' }
] satisfies MobileBffRuntimeLog[];

describe('mobile BFF client', () => {
  it('filters, facets, and paginates fixture-backed device lists', () => {
    expect(listDevices(devices, { limit: 1, query: 'dev', statuses: ['warning'] })).toEqual({
      facets: [
        { count: 1, label: 'Online', value: 'online' },
        { count: 1, label: 'Warning', value: 'warning' },
        { count: 1, label: 'Offline', value: 'offline' }
      ],
      items: [devices[1]],
      nextCursor: null,
      total: 1
    });

    expect(listDevices(devices, { cursor: '1', limit: 1 })).toMatchObject({
      items: [devices[1]],
      nextCursor: '2',
      total: 3
    });
  });

  it('filters fixture-backed second-stage admin lists', () => {
    expect(listUsers(users, { query: 'ops', statuses: ['active'] })).toEqual({
      facets: [
        { count: 1, label: 'Active', value: 'active' },
        { count: 0, label: 'Pending', value: 'pending' },
        { count: 0, label: 'Disabled', value: 'disabled' }
      ],
      items: [users[0]],
      nextCursor: null,
      total: 1
    });

    expect(listUsers(users, { cursor: '1', limit: 1 })).toMatchObject({
      items: [users[1]],
      nextCursor: '2',
      total: 3
    });
  });

  it('exposes dashboard, detail, task logs, management lists, and action receipts through fixtures', async () => {
    const client = createFixtureMobileBffClient({
      assets,
      dashboard: {
        alerts: [{ createdAt: '2026-06-03T20:00:00Z', id: 'alert-1', message: 'Failure spike', title: 'Alert', tone: 'danger' }],
        metrics: [{ label: 'Online devices', tone: 'success', value: '128' }]
      },
      devices,
      logs: runtimeLogs,
      modules,
      releases,
      tasks,
      users
    });

    await expect(client.getDashboard()).resolves.toMatchObject({
      activeTasks: [tasks[0]],
      metrics: [{ label: 'Online devices', tone: 'success', value: '128' }],
      recentDevices: devices.slice(0, 2)
    });
    await expect(client.getDevice('DEV-1024')).resolves.toEqual(devices[0]);
    await expect(client.getTask('missing')).resolves.toBeNull();
    await expect(client.listTaskLogs('task-arena-219')).resolves.toMatchObject({ items: failedTask.logs, total: 1 });
    await expect(client.listUsers({ statuses: ['active'] })).resolves.toMatchObject({ items: [users[0]], total: 1 });
    await expect(client.getUser('user-review-014')).resolves.toEqual(users[1]);
    await expect(client.listModules({ query: 'arena' })).resolves.toMatchObject({ items: [modules[1]], total: 1 });
    await expect(client.getModule('module-bear-route')).resolves.toEqual(modules[0]);
    await expect(client.listAssets({ statuses: ['review'] })).resolves.toMatchObject({ items: [assets[1]], total: 1 });
    await expect(client.getAsset('asset-login-template')).resolves.toEqual(assets[0]);
    await expect(client.listReleases({ statuses: ['paused'] })).resolves.toMatchObject({ items: [releases[1]], total: 1 });
    await expect(client.getRelease('release-1.3.0-beta.4')).resolves.toEqual(releases[0]);
    await expect(client.listLogs({ statuses: ['error'] })).resolves.toMatchObject({ items: [runtimeLogs[2]], total: 1 });
    await expect(client.pauseRelease('release-1.3.0-beta.4')).resolves.toEqual({ accepted: true, action: 'release.pause', id: 'release-1.3.0-beta.4' });
    await expect(client.resumeRelease('release-1.2.9-gray.8')).resolves.toEqual({ accepted: true, action: 'release.resume', id: 'release-1.2.9-gray.8' });
    await expect(client.stopTask('task-bear-042')).resolves.toEqual({ accepted: true, action: 'task.stop', id: 'task-bear-042' });
  });

  it('maps the typed client onto /api/v1/mobile HTTP endpoints', async () => {
    const calls: Array<{ body?: string; headers?: Record<string, string>; method?: string; url: string }> = [];
    const client = createHttpMobileBffClient({
      baseUrl: 'https://admin.example.test/',
      fetch: async (url, init) => {
        calls.push({ body: init?.body, headers: init?.headers, method: init?.method, url });
        return {
          json: async () => ({ ok: true }),
          ok: true,
          status: 200
        };
      },
      getAccessToken: () => 'access-token'
    });

    await client.listTasks({ limit: 20, query: 'arena', statuses: ['failed', 'queued'] });
    await client.retryTask('task-arena-219');
    await client.listUsers({ limit: 10, statuses: ['active'] });
    await client.getUser('user-ops-001');
    await client.listModules({ query: 'route' });
    await client.getModule('module-bear-route');
    await client.listAssets({ statuses: ['review'] });
    await client.getAsset('asset-login-template');
    await client.listReleases({ statuses: ['staged'] });
    await client.getRelease('release-1.3.0-beta.4');
    await client.pauseRelease('release-1.3.0-beta.4');
    await client.resumeRelease('release-1.2.9-gray.8');
    await client.listLogs({ limit: 50, statuses: ['error'] });

    expect(calls).toEqual([
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/tasks?limit=20&query=arena&status=failed&status=queued'
      },
      {
        body: '{}',
        headers: { Authorization: 'Bearer access-token', 'Content-Type': 'application/json' },
        method: 'POST',
        url: 'https://admin.example.test/api/v1/mobile/tasks/task-arena-219/retry'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/users?limit=10&status=active'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/users/user-ops-001'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/modules?query=route'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/modules/module-bear-route'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/assets?status=review'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/assets/asset-login-template'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/releases?status=staged'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/releases/release-1.3.0-beta.4'
      },
      {
        body: '{}',
        headers: { Authorization: 'Bearer access-token', 'Content-Type': 'application/json' },
        method: 'POST',
        url: 'https://admin.example.test/api/v1/mobile/releases/release-1.3.0-beta.4/pause'
      },
      {
        body: '{}',
        headers: { Authorization: 'Bearer access-token', 'Content-Type': 'application/json' },
        method: 'POST',
        url: 'https://admin.example.test/api/v1/mobile/releases/release-1.2.9-gray.8/resume'
      },
      {
        headers: { Authorization: 'Bearer access-token' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/logs?limit=50&status=error'
      }
    ]);
  });
});
