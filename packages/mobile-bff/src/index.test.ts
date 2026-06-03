import { describe, expect, it } from 'vitest';

import { createFixtureMobileBffClient, createHttpMobileBffClient, listDevices, type MobileBffDevice, type MobileBffTask } from './index';

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

  it('exposes dashboard, detail, task logs, and action receipts through fixtures', async () => {
    const client = createFixtureMobileBffClient({
      dashboard: {
        alerts: [{ createdAt: '2026-06-03T20:00:00Z', id: 'alert-1', message: 'Failure spike', title: 'Alert', tone: 'danger' }],
        metrics: [{ label: 'Online devices', tone: 'success', value: '128' }]
      },
      devices,
      tasks
    });

    await expect(client.getDashboard()).resolves.toMatchObject({
      activeTasks: [tasks[0]],
      metrics: [{ label: 'Online devices', tone: 'success', value: '128' }],
      recentDevices: devices.slice(0, 2)
    });
    await expect(client.getDevice('DEV-1024')).resolves.toEqual(devices[0]);
    await expect(client.getTask('missing')).resolves.toBeNull();
    await expect(client.listTaskLogs('task-arena-219')).resolves.toMatchObject({ items: failedTask.logs, total: 1 });
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
      }
    ]);
  });
});
