export type MobileBffTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
export type MobileBffDeviceStatus = 'online' | 'offline' | 'warning';
export type MobileBffTaskStatus = 'running' | 'failed' | 'paused' | 'completed' | 'queued';
export type MobileBffWorkerStatus = 'active' | 'stopped' | 'idle';
export type MobileBffLogLevel = 'info' | 'warn' | 'error';

export type MobileBffMetric = {
  label: string;
  tone: MobileBffTone;
  value: string;
};

export type MobileBffAlert = {
  createdAt: string;
  id: string;
  message: string;
  title: string;
  tone: MobileBffTone;
};

export type MobileBffDevice = {
  appVersion: string;
  battery: number;
  currentTaskId?: string;
  heartbeat: string;
  id: string;
  model: string;
  owner: string;
  risk?: string;
  status: MobileBffDeviceStatus;
  worker: MobileBffWorkerStatus;
};

export type MobileBffTaskLogEntry = {
  level: MobileBffLogLevel;
  message: string;
  time: string;
};

export type MobileBffTask = {
  currentStep: string;
  deviceId: string;
  deviceName: string;
  error?: string;
  id: string;
  logs: MobileBffTaskLogEntry[];
  name: string;
  owner: string;
  progress: {
    done: number;
    total: number;
  };
  startedAt: string;
  status: MobileBffTaskStatus;
  steps: Array<{
    label: string;
    state: 'done' | 'running' | 'blocked' | 'waiting';
    time: string;
  }>;
};

export type MobileBffFacet<TValue extends string = string> = {
  count: number;
  label: string;
  value: TValue;
};

export type MobileBffListRequest<TStatus extends string = string> = {
  cursor?: string | null;
  limit?: number;
  query?: string;
  statuses?: TStatus[];
};

export type MobileBffListResponse<TItem, TStatus extends string = string> = {
  facets: Array<MobileBffFacet<TStatus>>;
  items: TItem[];
  nextCursor: string | null;
  total: number;
};

export type MobileBffDashboard = {
  activeTasks: MobileBffTask[];
  alerts: MobileBffAlert[];
  metrics: MobileBffMetric[];
  recentDevices: MobileBffDevice[];
};

export type MobileBffActionReceipt = {
  accepted: boolean;
  action: string;
  id: string;
};

export type MobileBffClient = {
  bindDevice: (deviceId: string, payload?: { code?: string }) => Promise<MobileBffActionReceipt>;
  getDashboard: () => Promise<MobileBffDashboard>;
  getDevice: (deviceId: string) => Promise<MobileBffDevice | null>;
  getTask: (taskId: string) => Promise<MobileBffTask | null>;
  listDevices: (request?: MobileBffListRequest<MobileBffDeviceStatus>) => Promise<MobileBffListResponse<MobileBffDevice, MobileBffDeviceStatus>>;
  listTaskLogs: (taskId: string, request?: MobileBffListRequest<MobileBffLogLevel>) => Promise<MobileBffListResponse<MobileBffTaskLogEntry, MobileBffLogLevel>>;
  listTasks: (request?: MobileBffListRequest<MobileBffTaskStatus>) => Promise<MobileBffListResponse<MobileBffTask, MobileBffTaskStatus>>;
  retryTask: (taskId: string) => Promise<MobileBffActionReceipt>;
  stopTask: (taskId: string) => Promise<MobileBffActionReceipt>;
  unbindDevice: (deviceId: string) => Promise<MobileBffActionReceipt>;
};

export type MobileBffFixtureData = {
  dashboard: {
    alerts: MobileBffAlert[];
    metrics: MobileBffMetric[];
  };
  devices: MobileBffDevice[];
  tasks: MobileBffTask[];
};

export type MobileBffFetch = (
  url: string,
  init?: {
    body?: string;
    headers?: Record<string, string>;
    method?: string;
  }
) => Promise<{
  json: () => Promise<unknown>;
  ok: boolean;
  status: number;
  text?: () => Promise<string>;
}>;

export type MobileBffHttpClientOptions = {
  baseUrl: string;
  fetch: MobileBffFetch;
  getAccessToken?: () => Promise<string | null> | string | null;
  headers?: Record<string, string>;
};

export function createFixtureMobileBffClient(data: MobileBffFixtureData): MobileBffClient {
  return {
    bindDevice: async (deviceId) => actionReceipt(deviceId, 'device.bind'),
    getDashboard: async () => ({
      activeTasks: data.tasks.filter((task) => task.status === 'running').slice(0, 2),
      alerts: [...data.dashboard.alerts],
      metrics: [...data.dashboard.metrics],
      recentDevices: data.devices.slice(0, 2)
    }),
    getDevice: async (deviceId) => data.devices.find((device) => device.id === deviceId) ?? null,
    getTask: async (taskId) => data.tasks.find((task) => task.id === taskId) ?? null,
    listDevices: async (request = {}) => listDevices(data.devices, request),
    listTaskLogs: async (taskId, request = {}) => {
      const task = data.tasks.find((item) => item.id === taskId);
      return listTaskLogs(task?.logs ?? [], request);
    },
    listTasks: async (request = {}) => listTasks(data.tasks, request),
    retryTask: async (taskId) => actionReceipt(taskId, 'task.retry'),
    stopTask: async (taskId) => actionReceipt(taskId, 'task.stop'),
    unbindDevice: async (deviceId) => actionReceipt(deviceId, 'device.unbind')
  };
}

export function createHttpMobileBffClient(options: MobileBffHttpClientOptions): MobileBffClient {
  return {
    bindDevice: (deviceId, payload) => request(options, 'POST', `/devices/${encodePath(deviceId)}/bind`, undefined, payload ?? {}),
    getDashboard: () => request(options, 'GET', '/dashboard'),
    getDevice: (deviceId) => request(options, 'GET', `/devices/${encodePath(deviceId)}`),
    getTask: (taskId) => request(options, 'GET', `/tasks/${encodePath(taskId)}`),
    listDevices: (listRequest = {}) => request(options, 'GET', '/devices', listRequest),
    listTaskLogs: (taskId, listRequest = {}) => request(options, 'GET', `/tasks/${encodePath(taskId)}/logs`, listRequest),
    listTasks: (listRequest = {}) => request(options, 'GET', '/tasks', listRequest),
    retryTask: (taskId) => request(options, 'POST', `/tasks/${encodePath(taskId)}/retry`, undefined, {}),
    stopTask: (taskId) => request(options, 'POST', `/tasks/${encodePath(taskId)}/stop`, undefined, {}),
    unbindDevice: (deviceId) => request(options, 'POST', `/devices/${encodePath(deviceId)}/unbind`, undefined, {})
  };
}

export function listDevices(
  devices: MobileBffDevice[],
  request: MobileBffListRequest<MobileBffDeviceStatus> = {}
): MobileBffListResponse<MobileBffDevice, MobileBffDeviceStatus> {
  const queryFiltered = filterByQuery(devices, request.query, (device) => [
    device.appVersion,
    device.heartbeat,
    device.id,
    device.model,
    device.owner,
    device.risk ?? '',
    device.status,
    device.worker
  ]);
  const statusFiltered = filterByStatus(queryFiltered, request.statuses, (device) => device.status);

  return {
    ...paginate(statusFiltered, request),
    facets: createFacets(queryFiltered, ['online', 'warning', 'offline'], (device) => device.status)
  };
}

export function listTasks(
  tasks: MobileBffTask[],
  request: MobileBffListRequest<MobileBffTaskStatus> = {}
): MobileBffListResponse<MobileBffTask, MobileBffTaskStatus> {
  const queryFiltered = filterByQuery(tasks, request.query, (task) => [
    task.currentStep,
    task.deviceId,
    task.deviceName,
    task.error ?? '',
    task.id,
    task.name,
    task.owner,
    task.status,
    ...task.logs.map((log) => log.message)
  ]);
  const statusFiltered = filterByStatus(queryFiltered, request.statuses, (task) => task.status);

  return {
    ...paginate(statusFiltered, request),
    facets: createFacets(queryFiltered, ['running', 'failed', 'queued', 'paused', 'completed'], (task) => task.status)
  };
}

export function listTaskLogs(
  logs: MobileBffTaskLogEntry[],
  request: MobileBffListRequest<MobileBffLogLevel> = {}
): MobileBffListResponse<MobileBffTaskLogEntry, MobileBffLogLevel> {
  const queryFiltered = filterByQuery(logs, request.query, (log) => [log.level, log.message, log.time]);
  const statusFiltered = filterByStatus(queryFiltered, request.statuses, (log) => log.level);

  return {
    ...paginate(statusFiltered, request),
    facets: createFacets(queryFiltered, ['info', 'warn', 'error'], (log) => log.level)
  };
}

function actionReceipt(id: string, action: string): MobileBffActionReceipt {
  return { accepted: true, action, id };
}

async function request<TResponse>(
  options: MobileBffHttpClientOptions,
  method: string,
  path: string,
  query?: MobileBffListRequest<string>,
  body?: unknown
): Promise<TResponse> {
  const token = await options.getAccessToken?.();
  const headers = {
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
  };
  const response = await options.fetch(composeMobileBffUrl(options.baseUrl, path, query), {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method
  });

  if (!response.ok) {
    const message = response.text ? await response.text() : '';
    throw new Error(`Mobile BFF ${method} ${path} failed with ${response.status}${message ? `: ${message}` : ''}`);
  }

  return (await response.json()) as TResponse;
}

function composeMobileBffUrl(baseUrl: string, path: string, query?: MobileBffListRequest<string>): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = composeQueryString(query);

  return `${normalizedBase}/api/v1/mobile${normalizedPath}${queryString ? `?${queryString}` : ''}`;
}

function composeQueryString(query: MobileBffListRequest<string> | undefined): string {
  if (!query) {
    return '';
  }

  const pairs: string[] = [];
  addQueryPair(pairs, 'cursor', query.cursor ?? undefined);
  addQueryPair(pairs, 'limit', query.limit?.toString());
  addQueryPair(pairs, 'query', query.query);
  for (const status of query.statuses ?? []) {
    addQueryPair(pairs, 'status', status);
  }

  return pairs.join('&');
}

function addQueryPair(pairs: string[], key: string, value: string | undefined): void {
  if (value === undefined || value === '') {
    return;
  }

  pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
}

function encodePath(value: string): string {
  return encodeURIComponent(value);
}

function paginate<TItem>(items: TItem[], request: MobileBffListRequest<string>): Pick<MobileBffListResponse<TItem>, 'items' | 'nextCursor' | 'total'> {
  const start = Number.parseInt(request.cursor ?? '0', 10);
  const safeStart = Number.isFinite(start) && start > 0 ? start : 0;
  const safeLimit = request.limit && request.limit > 0 ? request.limit : items.length;
  const end = Math.min(safeStart + safeLimit, items.length);

  return {
    items: items.slice(safeStart, end),
    nextCursor: end < items.length ? end.toString() : null,
    total: items.length
  };
}

function filterByQuery<TItem>(items: TItem[], query: string | undefined, fieldsForItem: (item: TItem) => string[]): TItem[] {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => fieldsForItem(item).some((field) => field.toLowerCase().includes(normalizedQuery)));
}

function filterByStatus<TItem, TStatus extends string>(
  items: TItem[],
  statuses: TStatus[] | undefined,
  statusForItem: (item: TItem) => TStatus
): TItem[] {
  if (!statuses || statuses.length === 0) {
    return items;
  }

  return items.filter((item) => statuses.includes(statusForItem(item)));
}

function createFacets<TItem, TStatus extends string>(
  items: TItem[],
  statuses: TStatus[],
  statusForItem: (item: TItem) => TStatus
): Array<MobileBffFacet<TStatus>> {
  return statuses.map((status) => ({
    count: items.filter((item) => statusForItem(item) === status).length,
    label: titleFromValue(status),
    value: status
  }));
}

function titleFromValue(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
