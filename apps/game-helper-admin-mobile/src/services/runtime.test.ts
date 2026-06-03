import { describe, expect, it, vi } from 'vitest';

import type { MobileBffDevice } from '@mobile-frame/mobile-bff';
import type { DeviceRealtimeSnapshot, RealtimeConnectionSnapshot, WebSocketLike } from '@mobile-frame/realtime';

import { mapDeviceToRealtimeSnapshot } from './realtime';
import { configureAdminMobileHttpRuntime, configureAdminMobileRuntime, resetAdminMobileRuntime } from './runtime';

const httpDevice = {
  appVersion: '1.3.0',
  battery: 77,
  heartbeat: 'just now',
  id: 'DEV-9000',
  model: 'Pixel 9',
  owner: 'Runtime Operator',
  status: 'online',
  worker: 'active'
} satisfies MobileBffDevice;

describe('admin mobile runtime service', () => {
  it('keeps fixture BFF and fixture realtime when no runtime configuration is provided', async () => {
    const runtime = configureAdminMobileRuntime();
    const states: RealtimeConnectionSnapshot[] = [];

    await expect(runtime.bff.getDevice('DEV-1024')).resolves.toMatchObject({ id: 'DEV-1024' });
    runtime.realtime.subscribeDeviceStatus('DEV-1024', {
      onEvent: vi.fn(),
      onStateChange: (state) => states.push(state)
    });

    expect(states.at(-1)).toMatchObject({ status: 'open', transport: 'fixture' });
  });

  it('configures HTTP BFF and uses it for websocket polling fallback', async () => {
    const calls: string[] = [];
    const socketRef: { current?: WebSocketLike } = {};
    const runtime = configureAdminMobileHttpRuntime({
      baseUrl: 'https://admin.example.test',
      createSocket: () => {
        socketRef.current = {
          close: vi.fn(),
          send: vi.fn()
        };

        return socketRef.current;
      },
      fetch: async (url) => {
        calls.push(url);

        return {
          json: async () => httpDevice,
          ok: true,
          status: 200
        };
      },
      getAccessToken: () => 'runtime-token',
      pollingIntervalMs: 60_000,
      reconnect: { maxAttempts: 0 },
      websocketUrl: 'wss://admin.example.test/ws/mobile'
    });
    const events: DeviceRealtimeSnapshot[] = [];
    const states: RealtimeConnectionSnapshot[] = [];

    const subscription = runtime.realtime.subscribeDeviceStatus('DEV-9000', {
      onEvent: (event) => events.push(event),
      onStateChange: (state) => states.push(state)
    });

    socketRef.current?.onclose?.();
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    expect(calls).toContain('https://admin.example.test/api/v1/mobile/devices/DEV-9000');
    expect(events).toEqual([expect.objectContaining({ ...mapDeviceToRealtimeSnapshot(httpDevice, events[0]?.timestamp ?? ''), timestamp: expect.any(String) })]);
    expect(states).toContainEqual(expect.objectContaining({ fallback: 'polling', status: 'polling', transport: 'polling' }));

    subscription.unsubscribe();
  });

  it('resets both runtime clients back to fixtures', async () => {
    const runtime = resetAdminMobileRuntime();
    const states: RealtimeConnectionSnapshot[] = [];

    await expect(runtime.bff.getDevice('DEV-1024')).resolves.toMatchObject({ id: 'DEV-1024' });
    runtime.realtime.subscribeDeviceStatus('DEV-1024', {
      onEvent: vi.fn(),
      onStateChange: (state) => states.push(state)
    });
    expect(states.at(-1)).toMatchObject({ status: 'open', transport: 'fixture' });
  });
});
