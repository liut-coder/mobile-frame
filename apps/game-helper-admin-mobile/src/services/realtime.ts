import { useEffect, useMemo, useState } from 'react';

import {
  createFixtureRealtimeClient,
  createWebSocketRealtimeClient,
  type DeviceRealtimeSnapshot,
  type RealtimeClient,
  type RealtimeConnectionSnapshot,
  type RealtimeGlobalAlert,
  type RealtimeReconnectOptions,
  type TaskProgressSnapshot,
  type WebSocketLike
} from '@mobile-frame/realtime';
import type { MobileBffClient, MobileBffDevice, MobileBffTask } from '@mobile-frame/mobile-bff';

import { adminMobileBffClient } from './mobile-bff';
import { dashboardAlerts, devices, tasks } from '../store';

export type AdminRealtimeMode = 'fixture' | 'websocket';
export type AdminRealtimeClientOptions = {
  createSocket?: (url: string) => WebSocketLike;
  mode?: AdminRealtimeMode;
  now?: () => string;
  pollingClient?: Pick<MobileBffClient, 'getDashboard' | 'getDevice' | 'getTask'>;
  pollingIntervalMs?: number;
  reconnect?: Partial<RealtimeReconnectOptions>;
  websocketUrl?: string;
};

const initialConnection: RealtimeConnectionSnapshot = {
  attempt: 0,
  status: 'idle',
  transport: 'fixture'
};

const deviceStatus = Object.fromEntries(
  devices.map((device, index) => [
    device.id,
    {
      appVersion: device.appVersion,
      deviceId: device.id,
      heartbeat: device.heartbeat,
      risk: device.risk,
      status: device.status,
      timestamp: `2026-06-03T20:${(25 + index).toString().padStart(2, '0')}:00Z`,
      worker: device.worker
    } satisfies DeviceRealtimeSnapshot
  ])
);

const taskProgress = Object.fromEntries(
  tasks.map((task, index) => [
    task.id,
    {
      currentStep: task.currentStep,
      log: task.logs[task.logs.length - 1],
      progress: task.progress,
      status: task.status,
      steps: task.steps,
      taskId: task.id,
      timestamp: `2026-06-03T20:${(35 + index).toString().padStart(2, '0')}:00Z`
    } satisfies TaskProgressSnapshot
  ])
);

const globalAlerts = dashboardAlerts.map((alert, index) => ({
  createdAt: `2026-06-03T20:${(30 + index).toString().padStart(2, '0')}:00Z`,
  id: `alert-${index + 1}`,
  message: alert.message,
  title: alert.title,
  tone: alert.tone
})) satisfies RealtimeGlobalAlert[];

export const adminFixtureRealtimeClient = createFixtureRealtimeClient({
  deviceStatus,
  globalAlerts,
  taskProgress
});

export let adminRealtimeClient = createAdminRealtimeClient();

export function createAdminRealtimeClient(options: AdminRealtimeClientOptions = {}): RealtimeClient {
  if (options.mode !== 'websocket' || !options.websocketUrl || !options.createSocket) {
    return adminFixtureRealtimeClient;
  }

  return createWebSocketRealtimeClient({
    createSocket: options.createSocket,
    polling: {
      ...createAdminRealtimePolling({ client: options.pollingClient, now: options.now }),
      intervalMs: options.pollingIntervalMs
    },
    reconnect: options.reconnect,
    url: options.websocketUrl
  });
}

export function configureAdminRealtimeClient(options: AdminRealtimeClientOptions = {}): RealtimeClient {
  adminRealtimeClient = createAdminRealtimeClient(options);

  return adminRealtimeClient;
}

export function resetAdminRealtimeClient(): RealtimeClient {
  return configureAdminRealtimeClient({ mode: 'fixture' });
}

export function createAdminRealtimePolling({
  client = adminMobileBffClient,
  now = () => new Date().toISOString()
}: {
  client?: Pick<MobileBffClient, 'getDashboard' | 'getDevice' | 'getTask'>;
  now?: () => string;
} = {}) {
  return {
    deviceStatus: async (deviceId: string) => {
      const device = await client.getDevice(deviceId);

      return device ? mapDeviceToRealtimeSnapshot(device, now()) : null;
    },
    globalAlerts: async () => {
      const dashboard = await client.getDashboard();

      return dashboard.alerts;
    },
    taskProgress: async (taskId: string) => {
      const task = await client.getTask(taskId);

      return task ? mapTaskToProgressSnapshot(task, now()) : null;
    }
  };
}

export function mapDeviceToRealtimeSnapshot(device: MobileBffDevice, timestamp: string): DeviceRealtimeSnapshot {
  return {
    appVersion: device.appVersion,
    deviceId: device.id,
    heartbeat: device.heartbeat,
    risk: device.risk,
    status: device.status,
    timestamp,
    worker: device.worker
  };
}

export function mapTaskToProgressSnapshot(task: MobileBffTask, timestamp: string): TaskProgressSnapshot {
  const latestLog = task.logs[task.logs.length - 1];

  return {
    currentStep: task.currentStep,
    ...(latestLog ? { log: latestLog } : {}),
    progress: task.progress,
    status: task.status,
    steps: task.steps,
    taskId: task.id,
    timestamp
  };
}

export function useRealtimeDeviceStatus(deviceId: string) {
  const [connection, setConnection] = useState<RealtimeConnectionSnapshot>(initialConnection);
  const [snapshot, setSnapshot] = useState<DeviceRealtimeSnapshot | null>(null);

  useEffect(() => {
    const subscription = adminRealtimeClient.subscribeDeviceStatus(deviceId, {
      onEvent: setSnapshot,
      onStateChange: setConnection
    });

    return subscription.unsubscribe;
  }, [deviceId]);

  return useMemo(() => ({ connection, snapshot }), [connection, snapshot]);
}

export function useRealtimeGlobalAlerts() {
  const [connection, setConnection] = useState<RealtimeConnectionSnapshot>(initialConnection);
  const [alerts, setAlerts] = useState<RealtimeGlobalAlert[]>([]);

  useEffect(() => {
    const nextAlerts: RealtimeGlobalAlert[] = [];
    const subscription = adminRealtimeClient.subscribeGlobalAlerts({
      onEvent: (alert) => {
        nextAlerts.push(alert);
        setAlerts([...nextAlerts]);
      },
      onStateChange: setConnection
    });

    return subscription.unsubscribe;
  }, []);

  return useMemo(() => ({ alerts, connection }), [alerts, connection]);
}

export function useRealtimeTaskProgress(taskId: string) {
  const [connection, setConnection] = useState<RealtimeConnectionSnapshot>(initialConnection);
  const [snapshot, setSnapshot] = useState<TaskProgressSnapshot | null>(null);

  useEffect(() => {
    const subscription = adminRealtimeClient.subscribeTaskProgress(taskId, {
      onEvent: setSnapshot,
      onStateChange: setConnection
    });

    return subscription.unsubscribe;
  }, [taskId]);

  return useMemo(() => ({ connection, snapshot }), [connection, snapshot]);
}
