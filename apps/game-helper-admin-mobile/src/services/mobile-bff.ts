import { useEffect, useState } from 'react';

import {
  createFixtureMobileBffClient,
  listDevices as listFixtureDevices,
  listTaskLogs as listFixtureTaskLogs,
  listTasks as listFixtureTasks,
  type MobileBffDashboard,
  type MobileBffDevice,
  type MobileBffDeviceStatus,
  type MobileBffListRequest,
  type MobileBffListResponse,
  type MobileBffLogLevel,
  type MobileBffTask,
  type MobileBffTaskLogEntry,
  type MobileBffTaskStatus
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

export const adminMobileBffClient = createFixtureMobileBffClient({
  dashboard: fixtureDashboard,
  devices,
  tasks
});

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

  return useBffValue(() => adminMobileBffClient.listDevices(request), initialValue, [
    request.cursor ?? '',
    request.limit ?? 0,
    request.query ?? '',
    (request.statuses ?? []).join('|')
  ]);
}

export function useMobileBffTask(taskId: string | null | undefined) {
  return useBffValue(() => (taskId ? adminMobileBffClient.getTask(taskId) : Promise.resolve(null)), taskId ? findTask(taskId) ?? null : null, [taskId ?? '']);
}

export function useMobileBffTasks(request: MobileBffListRequest<MobileBffTaskStatus>) {
  const initialValue = listFixtureTasks(tasks, request);

  return useBffValue(() => adminMobileBffClient.listTasks(request), initialValue, [
    request.cursor ?? '',
    request.limit ?? 0,
    request.query ?? '',
    (request.statuses ?? []).join('|')
  ]);
}

export function useMobileBffTaskLogs(taskId: string) {
  const initialLogs = findTask(taskId)?.logs ?? [];
  const initialValue = listFixtureTaskLogs(initialLogs, {});

  return useBffValue(() => adminMobileBffClient.listTaskLogs(taskId), initialValue, [taskId]);
}

function useBffValue<TValue>(load: () => Promise<TValue>, initialValue: TValue, dependencies: unknown[]): TValue {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    let cancelled = false;
    setValue(initialValue);
    load().then((nextValue) => {
      if (!cancelled) {
        setValue(nextValue);
      }
    });

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return value;
}

export type AdminMobileBffDeviceList = MobileBffListResponse<MobileBffDevice, MobileBffDeviceStatus>;
export type AdminMobileBffTaskList = MobileBffListResponse<MobileBffTask, MobileBffTaskStatus>;
export type AdminMobileBffTaskLogList = MobileBffListResponse<MobileBffTaskLogEntry, MobileBffLogLevel>;
