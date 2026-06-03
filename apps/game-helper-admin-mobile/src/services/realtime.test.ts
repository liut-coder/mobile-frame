import { describe, expect, it, vi } from 'vitest';

import type { MobileBffClient, MobileBffDevice, MobileBffTask } from '@mobile-frame/mobile-bff';
import type { DeviceRealtimeSnapshot, RealtimeConnectionSnapshot, WebSocketLike } from '@mobile-frame/realtime';

import {
  configureAdminRealtimeClient,
  createAdminRealtimeClient,
  createAdminRealtimePolling,
  mapDeviceToRealtimeSnapshot,
  mapTaskToProgressSnapshot,
  resetAdminRealtimeClient
} from './realtime';

const device = {
  appVersion: '1.2.3',
  battery: 82,
  currentTaskId: 'task-bear-042',
  heartbeat: '2 min ago',
  id: 'DEV-1024',
  model: 'Xiaomi 14',
  owner: 'Zhang San',
  status: 'online',
  worker: 'active'
} satisfies MobileBffDevice;

const task = {
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
  steps: [{ label: 'Combat loop', state: 'running', time: '03:24' }]
} satisfies MobileBffTask;

describe('admin realtime service', () => {
  it('keeps fixture realtime as the default app transport', () => {
    const client = createAdminRealtimeClient();
    const events: DeviceRealtimeSnapshot[] = [];
    const states: RealtimeConnectionSnapshot[] = [];

    client.subscribeDeviceStatus('DEV-1024', {
      onEvent: (event) => events.push(event),
      onStateChange: (state) => states.push(state)
    });

    expect(events).toEqual([expect.objectContaining({ deviceId: 'DEV-1024', status: 'online' })]);
    expect(states.at(-1)).toMatchObject({ status: 'open', transport: 'fixture' });
  });

  it('selects websocket realtime when websocket configuration is provided', () => {
    const sent: string[] = [];
    const socket: WebSocketLike = {
      close: vi.fn(),
      send: (data) => sent.push(data)
    };
    const client = createAdminRealtimeClient({
      createSocket: () => socket,
      mode: 'websocket',
      websocketUrl: 'wss://admin.example.test/ws/mobile'
    });
    const events: DeviceRealtimeSnapshot[] = [];

    const subscription = client.subscribeDeviceStatus('DEV-1024', {
      onEvent: (event) => events.push(event)
    });

    socket.onopen?.();
    socket.onmessage?.({
      data: JSON.stringify({
        channel: 'device.status',
        key: 'DEV-1024',
        payload: mapDeviceToRealtimeSnapshot(device, '2026-06-03T20:45:00Z')
      })
    });

    expect(sent[0]).toBe(JSON.stringify({ channel: 'device.status', key: 'DEV-1024', type: 'subscribe' }));
    expect(events).toEqual([expect.objectContaining({ deviceId: 'DEV-1024', timestamp: '2026-06-03T20:45:00Z' })]);

    subscription.unsubscribe();
    expect(socket.close).toHaveBeenCalled();
  });

  it('can configure and reset the active realtime client', () => {
    const sent: string[] = [];
    const socket: WebSocketLike = {
      close: vi.fn(),
      send: (data) => sent.push(data)
    };

    const configured = configureAdminRealtimeClient({
      createSocket: () => socket,
      mode: 'websocket',
      websocketUrl: 'wss://admin.example.test/ws/mobile'
    });

    const websocketSubscription = configured.subscribeTaskProgress('task-bear-042', {
      onEvent: vi.fn()
    });
    socket.onopen?.();
    expect(sent[0]).toBe(JSON.stringify({ channel: 'task.progress', key: 'task-bear-042', type: 'subscribe' }));
    websocketSubscription.unsubscribe();

    const reset = resetAdminRealtimeClient();
    const states: RealtimeConnectionSnapshot[] = [];
    reset.subscribeDeviceStatus('DEV-1024', {
      onEvent: vi.fn(),
      onStateChange: (state) => states.push(state)
    });
    expect(states.at(-1)).toMatchObject({ status: 'open', transport: 'fixture' });
  });

  it('uses configured mobile BFF polling data for websocket fallback', async () => {
    const socketRef: { current?: WebSocketLike } = {};
    const client: Pick<MobileBffClient, 'getDashboard' | 'getDevice' | 'getTask'> = {
      getDashboard: async () => ({ activeTasks: [], alerts: [], metrics: [], recentDevices: [] }),
      getDevice: async () => device,
      getTask: async () => task
    };
    const realtime = createAdminRealtimeClient({
      createSocket: () => {
        socketRef.current = {
          close: vi.fn(),
          send: vi.fn()
        };

        return socketRef.current;
      },
      mode: 'websocket',
      now: () => '2026-06-03T21:00:00Z',
      pollingClient: client,
      pollingIntervalMs: 60_000,
      reconnect: { maxAttempts: 0 },
      websocketUrl: 'wss://admin.example.test/ws/mobile'
    });
    const events: DeviceRealtimeSnapshot[] = [];
    const states: RealtimeConnectionSnapshot[] = [];

    const subscription = realtime.subscribeDeviceStatus('DEV-1024', {
      onEvent: (event) => events.push(event),
      onStateChange: (state) => states.push(state)
    });

    socketRef.current?.onclose?.();
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    expect(events).toEqual([mapDeviceToRealtimeSnapshot(device, '2026-06-03T21:00:00Z')]);
    expect(states).toContainEqual(expect.objectContaining({ fallback: 'polling', status: 'polling', transport: 'polling' }));

    subscription.unsubscribe();
  });

  it('maps mobile BFF polling responses into realtime snapshots', async () => {
    const client: Pick<MobileBffClient, 'getDashboard' | 'getDevice' | 'getTask'> = {
      getDashboard: async () => ({
        activeTasks: [task],
        alerts: [{ createdAt: '2026-06-03T20:50:00Z', id: 'alert-1', message: 'Failure spike', title: 'Failure spike', tone: 'danger' }],
        metrics: [],
        recentDevices: [device]
      }),
      getDevice: async () => device,
      getTask: async () => task
    };
    const polling = createAdminRealtimePolling({ client, now: () => '2026-06-03T20:55:00Z' });

    await expect(polling.deviceStatus('DEV-1024')).resolves.toEqual(mapDeviceToRealtimeSnapshot(device, '2026-06-03T20:55:00Z'));
    await expect(polling.taskProgress('task-bear-042')).resolves.toEqual(mapTaskToProgressSnapshot(task, '2026-06-03T20:55:00Z'));
    await expect(polling.globalAlerts()).resolves.toEqual([
      { createdAt: '2026-06-03T20:50:00Z', id: 'alert-1', message: 'Failure spike', title: 'Failure spike', tone: 'danger' }
    ]);
  });
});
