export type RealtimeConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'polling' | 'closed' | 'error';
export type RealtimeTransportKind = 'fixture' | 'websocket' | 'polling';
export type RealtimeAlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
export type RealtimeDeviceStatus = 'online' | 'offline' | 'warning';
export type RealtimeTaskStatus = 'running' | 'failed' | 'paused' | 'completed' | 'queued';
export type RealtimeWorkerStatus = 'active' | 'stopped' | 'idle';

declare function clearInterval(handle: unknown): void;
declare function clearTimeout(handle: unknown): void;
declare function setInterval(handler: () => void, timeout?: number): unknown;
declare function setTimeout(handler: () => void, timeout?: number): unknown;

export type RealtimeConnectionSnapshot = {
  attempt: number;
  fallback?: 'polling';
  lastEventAt?: string;
  status: RealtimeConnectionStatus;
  transport: RealtimeTransportKind;
};

export type RealtimeError = {
  code: string;
  message: string;
  recoverable: boolean;
};

export type DeviceRealtimeSnapshot = {
  appVersion?: string;
  deviceId: string;
  heartbeat: string;
  risk?: string;
  status: RealtimeDeviceStatus;
  timestamp: string;
  worker: RealtimeWorkerStatus;
};

export type TaskRealtimeStep = {
  label: string;
  state: 'done' | 'running' | 'blocked' | 'waiting';
  time: string;
};

export type TaskRealtimeLogEntry = {
  level: 'info' | 'warn' | 'error';
  message: string;
  time: string;
};

export type TaskProgressSnapshot = {
  currentStep: string;
  log?: TaskRealtimeLogEntry;
  progress: {
    done: number;
    total: number;
  };
  status: RealtimeTaskStatus;
  steps?: TaskRealtimeStep[];
  taskId: string;
  timestamp: string;
};

export type RealtimeGlobalAlert = {
  createdAt: string;
  id: string;
  message: string;
  title: string;
  tone: RealtimeAlertTone;
};

export type RealtimeObserver<TEvent> = {
  onError?: (error: RealtimeError) => void;
  onEvent: (event: TEvent) => void;
  onStateChange?: (state: RealtimeConnectionSnapshot) => void;
};

export type RealtimeSubscription = {
  unsubscribe: () => void;
};

export type RealtimeClient = {
  subscribeDeviceStatus: (deviceId: string, observer: RealtimeObserver<DeviceRealtimeSnapshot>) => RealtimeSubscription;
  subscribeGlobalAlerts: (observer: RealtimeObserver<RealtimeGlobalAlert>) => RealtimeSubscription;
  subscribeTaskProgress: (taskId: string, observer: RealtimeObserver<TaskProgressSnapshot>) => RealtimeSubscription;
};

export type FixtureRealtimeClientOptions = {
  deviceStatus?: Record<string, DeviceRealtimeSnapshot>;
  globalAlerts?: RealtimeGlobalAlert[];
  taskProgress?: Record<string, TaskProgressSnapshot>;
};

export type RealtimeEnvelope =
  | {
      channel: 'device.status';
      key: string;
      payload: DeviceRealtimeSnapshot;
    }
  | {
      channel: 'task.progress';
      key: string;
      payload: TaskProgressSnapshot;
    }
  | {
      channel: 'global.alert';
      payload: RealtimeGlobalAlert;
    };

export type WebSocketLike = {
  close: () => void;
  onclose?: () => void;
  onerror?: (event: unknown) => void;
  onmessage?: (event: { data: unknown }) => void;
  onopen?: () => void;
  send: (data: string) => void;
};

export type WebSocketRealtimeClientOptions = {
  createSocket: (url: string) => WebSocketLike;
  polling?: {
    deviceStatus?: (deviceId: string) => Promise<DeviceRealtimeSnapshot | null>;
    globalAlerts?: () => Promise<RealtimeGlobalAlert[]>;
    intervalMs?: number;
    taskProgress?: (taskId: string) => Promise<TaskProgressSnapshot | null>;
  };
  reconnect?: Partial<RealtimeReconnectOptions>;
  url: string;
};

export type RealtimeReconnectOptions = {
  baseDelayMs: number;
  maxAttempts: number;
  maxDelayMs: number;
};

const defaultReconnectOptions: RealtimeReconnectOptions = {
  baseDelayMs: 500,
  maxAttempts: 4,
  maxDelayMs: 8000
};

export function createFixtureRealtimeClient(options: FixtureRealtimeClientOptions): RealtimeClient {
  return {
    subscribeDeviceStatus: (deviceId, observer) => replayFixture(observer, options.deviceStatus?.[deviceId], `Device ${deviceId} is not in the realtime fixture.`),
    subscribeGlobalAlerts: (observer) => replayFixtureList(observer, options.globalAlerts ?? []),
    subscribeTaskProgress: (taskId, observer) => replayFixture(observer, options.taskProgress?.[taskId], `Task ${taskId} is not in the realtime fixture.`)
  };
}

export function createWebSocketRealtimeClient(options: WebSocketRealtimeClientOptions): RealtimeClient {
  return {
    subscribeDeviceStatus: (deviceId, observer) =>
      subscribeWebSocket({
        channel: 'device.status',
        key: deviceId,
        observer,
        options,
        poll: options.polling?.deviceStatus ? () => options.polling?.deviceStatus?.(deviceId) ?? Promise.resolve(null) : undefined
      }),
    subscribeGlobalAlerts: (observer) =>
      subscribeWebSocket({
        channel: 'global.alert',
        observer,
        options,
        poll: options.polling?.globalAlerts
      }),
    subscribeTaskProgress: (taskId, observer) =>
      subscribeWebSocket({
        channel: 'task.progress',
        key: taskId,
        observer,
        options,
        poll: options.polling?.taskProgress ? () => options.polling?.taskProgress?.(taskId) ?? Promise.resolve(null) : undefined
      })
  };
}

export function getReconnectDelayMs(attempt: number, options: Partial<RealtimeReconnectOptions> = {}): number {
  const reconnect = { ...defaultReconnectOptions, ...options };
  const exponent = Math.max(0, attempt - 1);
  return Math.min(reconnect.baseDelayMs * 2 ** exponent, reconnect.maxDelayMs);
}

export function parseRealtimeEnvelope(data: unknown): RealtimeEnvelope | null {
  if (typeof data === 'string') {
    try {
      return parseRealtimeEnvelope(JSON.parse(data));
    } catch {
      return null;
    }
  }

  if (!isRecord(data) || typeof data.channel !== 'string' || !isRecord(data.payload)) {
    return null;
  }

  if (data.channel === 'global.alert' && isRealtimeGlobalAlert(data.payload)) {
    return {
      channel: 'global.alert',
      payload: data.payload
    };
  }

  if (typeof data.key !== 'string') {
    return null;
  }

  if (data.channel === 'device.status' && isDeviceRealtimeSnapshot(data.payload)) {
    return {
      channel: 'device.status',
      key: data.key,
      payload: data.payload
    };
  }

  if (data.channel === 'task.progress' && isTaskProgressSnapshot(data.payload)) {
    return {
      channel: 'task.progress',
      key: data.key,
      payload: data.payload
    };
  }

  return null;
}

function replayFixture<TEvent>(observer: RealtimeObserver<TEvent>, event: TEvent | undefined, missingMessage: string): RealtimeSubscription {
  observer.onStateChange?.({ attempt: 0, status: 'open', transport: 'fixture' });

  if (event) {
    observer.onEvent(event);
    observer.onStateChange?.({ attempt: 0, lastEventAt: timestampFromEvent(event), status: 'open', transport: 'fixture' });
  } else {
    observer.onStateChange?.({ attempt: 0, status: 'error', transport: 'fixture' });
    observer.onError?.({ code: 'fixture.missing', message: missingMessage, recoverable: true });
  }

  return { unsubscribe: () => observer.onStateChange?.({ attempt: 0, status: 'closed', transport: 'fixture' }) };
}

function replayFixtureList<TEvent>(observer: RealtimeObserver<TEvent>, events: TEvent[]): RealtimeSubscription {
  observer.onStateChange?.({ attempt: 0, status: 'open', transport: 'fixture' });

  events.forEach((event) => observer.onEvent(event));

  observer.onStateChange?.({
    attempt: 0,
    lastEventAt: events.length > 0 ? timestampFromEvent(events[events.length - 1]) : undefined,
    status: 'open',
    transport: 'fixture'
  });

  return { unsubscribe: () => observer.onStateChange?.({ attempt: 0, status: 'closed', transport: 'fixture' }) };
}

function subscribeWebSocket<TEvent>({
  channel,
  key,
  observer,
  options,
  poll
}: {
  channel: RealtimeEnvelope['channel'];
  key?: string;
  observer: RealtimeObserver<TEvent>;
  options: WebSocketRealtimeClientOptions;
  poll?: () => Promise<TEvent | TEvent[] | null>;
}): RealtimeSubscription {
  const reconnect = { ...defaultReconnectOptions, ...options.reconnect };
  let attempt = 0;
  let closed = false;
  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let socket: WebSocketLike | null = null;

  const notifyState = (state: Omit<RealtimeConnectionSnapshot, 'attempt' | 'transport'> & { attempt?: number; transport?: RealtimeTransportKind }) => {
    observer.onStateChange?.({
      attempt,
      transport: 'websocket',
      ...state
    });
  };

  const connect = () => {
    if (closed) {
      return;
    }

    notifyState({ status: attempt === 0 ? 'connecting' : 'reconnecting' });
    socket = options.createSocket(options.url);

    socket.onopen = () => {
      attempt = 0;
      notifyState({ status: 'open' });
      socket?.send(JSON.stringify({ channel, key, type: 'subscribe' }));
    };

    socket.onmessage = (event) => {
      const envelope = parseRealtimeEnvelope(event.data);

      if (!envelopeMatches(envelope, channel, key)) {
        return;
      }

      observer.onEvent(envelope.payload as TEvent);
      notifyState({ lastEventAt: timestampFromEvent(envelope.payload), status: 'open' });
    };

    socket.onerror = () => {
      observer.onError?.({ code: 'websocket.error', message: `Realtime ${channel} websocket error.`, recoverable: true });
    };

    socket.onclose = () => {
      if (closed) {
        notifyState({ status: 'closed' });
        return;
      }

      attempt += 1;

      if (attempt > reconnect.maxAttempts) {
        if (poll) {
          startPolling();
          return;
        }

        notifyState({ status: 'error' });
        observer.onError?.({ code: 'websocket.reconnect-exhausted', message: `Realtime ${channel} reconnect attempts were exhausted.`, recoverable: true });
        return;
      }

      notifyState({ status: 'reconnecting' });
      reconnectTimer = setTimeout(connect, getReconnectDelayMs(attempt, reconnect));
    };
  };

  const startPolling = () => {
    notifyState({ fallback: 'polling', status: 'polling', transport: 'polling' });

    const runPoll = async () => {
      if (closed || !poll) {
        return;
      }

      try {
        const next = await poll();
        const events = Array.isArray(next) ? next : next ? [next] : [];
        events.forEach((event) => observer.onEvent(event));
        notifyState({
          fallback: 'polling',
          lastEventAt: events.length > 0 ? timestampFromEvent(events[events.length - 1]) : undefined,
          status: 'polling',
          transport: 'polling'
        });
      } catch {
        observer.onError?.({ code: 'polling.error', message: `Realtime ${channel} polling fallback failed.`, recoverable: true });
      }
    };

    void runPoll();
    pollingInterval = setInterval(() => {
      void runPoll();
    }, options.polling?.intervalMs ?? 5000);
  };

  connect();

  return {
    unsubscribe: () => {
      closed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (pollingInterval) {
        clearInterval(pollingInterval);
      }

      socket?.send(JSON.stringify({ channel, key, type: 'unsubscribe' }));
      socket?.close();
      notifyState({ status: 'closed' });
    }
  };
}

function envelopeMatches<TChannel extends RealtimeEnvelope['channel']>(
  envelope: RealtimeEnvelope | null,
  channel: TChannel,
  key?: string
): envelope is Extract<RealtimeEnvelope, { channel: TChannel }> {
  if (!envelope || envelope.channel !== channel) {
    return false;
  }

  if (channel === 'global.alert') {
    return true;
  }

  return 'key' in envelope && envelope.key === key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDeviceRealtimeSnapshot(value: Record<string, unknown>): value is DeviceRealtimeSnapshot {
  return (
    typeof value.deviceId === 'string' &&
    typeof value.heartbeat === 'string' &&
    isDeviceStatus(value.status) &&
    typeof value.timestamp === 'string' &&
    isWorkerStatus(value.worker)
  );
}

function isTaskProgressSnapshot(value: Record<string, unknown>): value is TaskProgressSnapshot {
  return (
    typeof value.currentStep === 'string' &&
    isRecord(value.progress) &&
    typeof value.progress.done === 'number' &&
    typeof value.progress.total === 'number' &&
    isTaskStatus(value.status) &&
    typeof value.taskId === 'string' &&
    typeof value.timestamp === 'string'
  );
}

function isRealtimeGlobalAlert(value: Record<string, unknown>): value is RealtimeGlobalAlert {
  return (
    typeof value.createdAt === 'string' &&
    typeof value.id === 'string' &&
    typeof value.message === 'string' &&
    typeof value.title === 'string' &&
    isAlertTone(value.tone)
  );
}

function isDeviceStatus(value: unknown): value is RealtimeDeviceStatus {
  return value === 'online' || value === 'offline' || value === 'warning';
}

function isTaskStatus(value: unknown): value is RealtimeTaskStatus {
  return value === 'running' || value === 'failed' || value === 'paused' || value === 'completed' || value === 'queued';
}

function isWorkerStatus(value: unknown): value is RealtimeWorkerStatus {
  return value === 'active' || value === 'stopped' || value === 'idle';
}

function isAlertTone(value: unknown): value is RealtimeAlertTone {
  return value === 'info' || value === 'success' || value === 'warning' || value === 'danger' || value === 'neutral';
}

function timestampFromEvent(event: unknown): string | undefined {
  if (isRecord(event) && typeof event.timestamp === 'string') {
    return event.timestamp;
  }

  if (isRecord(event) && typeof event.createdAt === 'string') {
    return event.createdAt;
  }

  return undefined;
}
