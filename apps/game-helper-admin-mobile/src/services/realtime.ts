import { useEffect, useMemo, useState } from 'react';

import {
  createFixtureRealtimeClient,
  type DeviceRealtimeSnapshot,
  type RealtimeConnectionSnapshot,
  type RealtimeGlobalAlert,
  type TaskProgressSnapshot
} from '@mobile-frame/realtime';

import { dashboardAlerts, devices, tasks } from '../store';

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

export const adminRealtimeClient = createFixtureRealtimeClient({
  deviceStatus,
  globalAlerts,
  taskProgress
});

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
