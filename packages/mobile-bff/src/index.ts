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

export type MobileBffUserStatus = 'active' | 'disabled' | 'pending';
export type MobileBffModuleStatus = 'enabled' | 'disabled' | 'draft';
export type MobileBffAssetStatus = 'ready' | 'review' | 'outdated';
export type MobileBffReleaseStatus = 'draft' | 'staged' | 'paused' | 'published';

export type MobileBffUser = {
  deviceCount: number;
  id: string;
  lastActiveAt: string;
  name: string;
  role: string;
  status: MobileBffUserStatus;
};

export type MobileBffGameModule = {
  game: string;
  id: string;
  name: string;
  rollout: string;
  status: MobileBffModuleStatus;
  updatedAt: string;
  version: string;
};

export type MobileBffVisualAsset = {
  id: string;
  kind: 'template' | 'screenshot' | 'icon' | 'model' | (string & {});
  name: string;
  status: MobileBffAssetStatus;
  updatedAt: string;
  version: string;
};

export type MobileBffRelease = {
  channel: 'alpha' | 'beta' | 'gray' | 'production' | (string & {});
  id: string;
  notes: string;
  progress: string;
  status: MobileBffReleaseStatus;
  updatedAt: string;
  version: string;
};

export type MobileBffRuntimeLog = {
  id: string;
  level: MobileBffLogLevel;
  message: string;
  scope: 'device' | 'task' | 'release' | 'system' | (string & {});
  time: string;
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
  getAsset: (assetId: string) => Promise<MobileBffVisualAsset | null>;
  getDevice: (deviceId: string) => Promise<MobileBffDevice | null>;
  getModule: (moduleId: string) => Promise<MobileBffGameModule | null>;
  getRelease: (releaseId: string) => Promise<MobileBffRelease | null>;
  getTask: (taskId: string) => Promise<MobileBffTask | null>;
  getUser: (userId: string) => Promise<MobileBffUser | null>;
  listAssets: (request?: MobileBffListRequest<MobileBffAssetStatus>) => Promise<MobileBffListResponse<MobileBffVisualAsset, MobileBffAssetStatus>>;
  listDevices: (request?: MobileBffListRequest<MobileBffDeviceStatus>) => Promise<MobileBffListResponse<MobileBffDevice, MobileBffDeviceStatus>>;
  listLogs: (request?: MobileBffListRequest<MobileBffLogLevel>) => Promise<MobileBffListResponse<MobileBffRuntimeLog, MobileBffLogLevel>>;
  listModules: (request?: MobileBffListRequest<MobileBffModuleStatus>) => Promise<MobileBffListResponse<MobileBffGameModule, MobileBffModuleStatus>>;
  listReleases: (request?: MobileBffListRequest<MobileBffReleaseStatus>) => Promise<MobileBffListResponse<MobileBffRelease, MobileBffReleaseStatus>>;
  listTaskLogs: (taskId: string, request?: MobileBffListRequest<MobileBffLogLevel>) => Promise<MobileBffListResponse<MobileBffTaskLogEntry, MobileBffLogLevel>>;
  listTasks: (request?: MobileBffListRequest<MobileBffTaskStatus>) => Promise<MobileBffListResponse<MobileBffTask, MobileBffTaskStatus>>;
  listUsers: (request?: MobileBffListRequest<MobileBffUserStatus>) => Promise<MobileBffListResponse<MobileBffUser, MobileBffUserStatus>>;
  pauseRelease: (releaseId: string) => Promise<MobileBffActionReceipt>;
  resumeRelease: (releaseId: string) => Promise<MobileBffActionReceipt>;
  retryTask: (taskId: string) => Promise<MobileBffActionReceipt>;
  stopTask: (taskId: string) => Promise<MobileBffActionReceipt>;
  unbindDevice: (deviceId: string) => Promise<MobileBffActionReceipt>;
};

export type MobileBffFixtureData = {
  assets?: MobileBffVisualAsset[];
  dashboard: {
    alerts: MobileBffAlert[];
    metrics: MobileBffMetric[];
  };
  devices: MobileBffDevice[];
  logs?: MobileBffRuntimeLog[];
  modules?: MobileBffGameModule[];
  releases?: MobileBffRelease[];
  tasks: MobileBffTask[];
  users?: MobileBffUser[];
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
    getAsset: async (assetId) => data.assets?.find((asset) => asset.id === assetId) ?? null,
    getDashboard: async () => ({
      activeTasks: data.tasks.filter((task) => task.status === 'running').slice(0, 2),
      alerts: [...data.dashboard.alerts],
      metrics: [...data.dashboard.metrics],
      recentDevices: data.devices.slice(0, 2)
    }),
    getDevice: async (deviceId) => data.devices.find((device) => device.id === deviceId) ?? null,
    getModule: async (moduleId) => data.modules?.find((module) => module.id === moduleId) ?? null,
    getRelease: async (releaseId) => data.releases?.find((release) => release.id === releaseId) ?? null,
    getTask: async (taskId) => data.tasks.find((task) => task.id === taskId) ?? null,
    getUser: async (userId) => data.users?.find((user) => user.id === userId) ?? null,
    listAssets: async (request = {}) => listAssets(data.assets ?? [], request),
    listDevices: async (request = {}) => listDevices(data.devices, request),
    listLogs: async (request = {}) => listRuntimeLogs(data.logs ?? [], request),
    listModules: async (request = {}) => listModules(data.modules ?? [], request),
    listReleases: async (request = {}) => listReleases(data.releases ?? [], request),
    listTaskLogs: async (taskId, request = {}) => {
      const task = data.tasks.find((item) => item.id === taskId);
      return listTaskLogs(task?.logs ?? [], request);
    },
    listTasks: async (request = {}) => listTasks(data.tasks, request),
    listUsers: async (request = {}) => listUsers(data.users ?? [], request),
    pauseRelease: async (releaseId) => actionReceipt(releaseId, 'release.pause'),
    resumeRelease: async (releaseId) => actionReceipt(releaseId, 'release.resume'),
    retryTask: async (taskId) => actionReceipt(taskId, 'task.retry'),
    stopTask: async (taskId) => actionReceipt(taskId, 'task.stop'),
    unbindDevice: async (deviceId) => actionReceipt(deviceId, 'device.unbind')
  };
}

export function createHttpMobileBffClient(options: MobileBffHttpClientOptions): MobileBffClient {
  return {
    bindDevice: (deviceId, payload) => request(options, 'POST', `/devices/${encodePath(deviceId)}/bind`, undefined, payload ?? {}),
    getDashboard: () => request(options, 'GET', '/dashboard'),
    getAsset: (assetId) => request(options, 'GET', `/assets/${encodePath(assetId)}`),
    getDevice: (deviceId) => request(options, 'GET', `/devices/${encodePath(deviceId)}`),
    getModule: (moduleId) => request(options, 'GET', `/modules/${encodePath(moduleId)}`),
    getRelease: (releaseId) => request(options, 'GET', `/releases/${encodePath(releaseId)}`),
    getTask: (taskId) => request(options, 'GET', `/tasks/${encodePath(taskId)}`),
    getUser: (userId) => request(options, 'GET', `/users/${encodePath(userId)}`),
    listAssets: (listRequest = {}) => request(options, 'GET', '/assets', listRequest),
    listDevices: (listRequest = {}) => request(options, 'GET', '/devices', listRequest),
    listLogs: (listRequest = {}) => request(options, 'GET', '/logs', listRequest),
    listModules: (listRequest = {}) => request(options, 'GET', '/modules', listRequest),
    listReleases: (listRequest = {}) => request(options, 'GET', '/releases', listRequest),
    listTaskLogs: (taskId, listRequest = {}) => request(options, 'GET', `/tasks/${encodePath(taskId)}/logs`, listRequest),
    listTasks: (listRequest = {}) => request(options, 'GET', '/tasks', listRequest),
    listUsers: (listRequest = {}) => request(options, 'GET', '/users', listRequest),
    pauseRelease: (releaseId) => request(options, 'POST', `/releases/${encodePath(releaseId)}/pause`, undefined, {}),
    resumeRelease: (releaseId) => request(options, 'POST', `/releases/${encodePath(releaseId)}/resume`, undefined, {}),
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

export function listUsers(
  users: MobileBffUser[],
  request: MobileBffListRequest<MobileBffUserStatus> = {}
): MobileBffListResponse<MobileBffUser, MobileBffUserStatus> {
  const queryFiltered = filterByQuery(users, request.query, (user) => [user.id, user.name, user.role, user.status, user.lastActiveAt]);
  const statusFiltered = filterByStatus(queryFiltered, request.statuses, (user) => user.status);

  return {
    ...paginate(statusFiltered, request),
    facets: createFacets(queryFiltered, ['active', 'pending', 'disabled'], (user) => user.status)
  };
}

export function listModules(
  modules: MobileBffGameModule[],
  request: MobileBffListRequest<MobileBffModuleStatus> = {}
): MobileBffListResponse<MobileBffGameModule, MobileBffModuleStatus> {
  const queryFiltered = filterByQuery(modules, request.query, (module) => [
    module.game,
    module.id,
    module.name,
    module.rollout,
    module.status,
    module.updatedAt,
    module.version
  ]);
  const statusFiltered = filterByStatus(queryFiltered, request.statuses, (module) => module.status);

  return {
    ...paginate(statusFiltered, request),
    facets: createFacets(queryFiltered, ['enabled', 'draft', 'disabled'], (module) => module.status)
  };
}

export function listAssets(
  assets: MobileBffVisualAsset[],
  request: MobileBffListRequest<MobileBffAssetStatus> = {}
): MobileBffListResponse<MobileBffVisualAsset, MobileBffAssetStatus> {
  const queryFiltered = filterByQuery(assets, request.query, (asset) => [
    asset.id,
    asset.kind,
    asset.name,
    asset.status,
    asset.updatedAt,
    asset.version
  ]);
  const statusFiltered = filterByStatus(queryFiltered, request.statuses, (asset) => asset.status);

  return {
    ...paginate(statusFiltered, request),
    facets: createFacets(queryFiltered, ['ready', 'review', 'outdated'], (asset) => asset.status)
  };
}

export function listReleases(
  releases: MobileBffRelease[],
  request: MobileBffListRequest<MobileBffReleaseStatus> = {}
): MobileBffListResponse<MobileBffRelease, MobileBffReleaseStatus> {
  const queryFiltered = filterByQuery(releases, request.query, (release) => [
    release.channel,
    release.id,
    release.notes,
    release.progress,
    release.status,
    release.updatedAt,
    release.version
  ]);
  const statusFiltered = filterByStatus(queryFiltered, request.statuses, (release) => release.status);

  return {
    ...paginate(statusFiltered, request),
    facets: createFacets(queryFiltered, ['draft', 'staged', 'paused', 'published'], (release) => release.status)
  };
}

export function listRuntimeLogs(
  logs: MobileBffRuntimeLog[],
  request: MobileBffListRequest<MobileBffLogLevel> = {}
): MobileBffListResponse<MobileBffRuntimeLog, MobileBffLogLevel> {
  const queryFiltered = filterByQuery(logs, request.query, (log) => [log.id, log.level, log.message, log.scope, log.time]);
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
