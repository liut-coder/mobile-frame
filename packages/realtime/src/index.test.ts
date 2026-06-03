import { describe, expect, it, vi } from 'vitest';

import {
  createFixtureRealtimeClient,
  createWebSocketRealtimeClient,
  getReconnectDelayMs,
  parseRealtimeEnvelope,
  type DeviceRealtimeSnapshot,
  type RealtimeConnectionSnapshot,
  type WebSocketLike
} from './index';

const deviceSnapshot = {
  appVersion: '1.2.3',
  deviceId: 'DEV-1024',
  heartbeat: 'just now',
  status: 'online',
  timestamp: '2026-06-03T20:00:00Z',
  worker: 'active'
} satisfies DeviceRealtimeSnapshot;

describe('realtime', () => {
  it('replays fixture device status snapshots', () => {
    const client = createFixtureRealtimeClient({ deviceStatus: { 'DEV-1024': deviceSnapshot } });
    const events: DeviceRealtimeSnapshot[] = [];
    const states: RealtimeConnectionSnapshot[] = [];

    const subscription = client.subscribeDeviceStatus('DEV-1024', {
      onEvent: (event) => events.push(event),
      onStateChange: (state) => states.push(state)
    });

    expect(events).toEqual([deviceSnapshot]);
    expect(states.at(-1)).toMatchObject({ lastEventAt: '2026-06-03T20:00:00Z', status: 'open', transport: 'fixture' });

    subscription.unsubscribe();
    expect(states.at(-1)).toMatchObject({ status: 'closed', transport: 'fixture' });
  });

  it('parses websocket envelopes for typed channels', () => {
    expect(
      parseRealtimeEnvelope(
        JSON.stringify({
          channel: 'device.status',
          key: 'DEV-1024',
          payload: deviceSnapshot
        })
      )
    ).toEqual({ channel: 'device.status', key: 'DEV-1024', payload: deviceSnapshot });

    expect(parseRealtimeEnvelope('{bad json')).toBeNull();
  });

  it('subscribes and unsubscribes through a websocket transport', () => {
    const sent: string[] = [];
    const socket: WebSocketLike = {
      close: vi.fn(),
      send: (data) => sent.push(data)
    };
    const client = createWebSocketRealtimeClient({
      createSocket: () => socket,
      url: 'wss://mobile.example.test/ws'
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
        payload: deviceSnapshot
      })
    });

    expect(sent[0]).toBe(JSON.stringify({ channel: 'device.status', key: 'DEV-1024', type: 'subscribe' }));
    expect(events).toEqual([deviceSnapshot]);

    subscription.unsubscribe();
    expect(sent.at(-1)).toBe(JSON.stringify({ channel: 'device.status', key: 'DEV-1024', type: 'unsubscribe' }));
    expect(socket.close).toHaveBeenCalled();
  });

  it('calculates capped exponential reconnect delays', () => {
    expect(getReconnectDelayMs(1, { baseDelayMs: 250, maxDelayMs: 1000 })).toBe(250);
    expect(getReconnectDelayMs(3, { baseDelayMs: 250, maxDelayMs: 1000 })).toBe(1000);
    expect(getReconnectDelayMs(8, { baseDelayMs: 250, maxDelayMs: 1000 })).toBe(1000);
  });
});
