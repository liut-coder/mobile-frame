import { createError, ok, redactLogValue, type MFResult } from './index';

export type DeviceInfo = {
  appVersion?: string;
  deviceName?: string;
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  platform: string;
};

export type PermissionType =
  | 'accessibility'
  | 'background'
  | 'batteryOptimization'
  | 'camera'
  | 'microphone'
  | 'notification'
  | 'overlay'
  | 'photos'
  | 'screenshot'
  | (string & {});

export type PermissionState = {
  granted: boolean;
  label: string;
  required: boolean;
  type: PermissionType;
};

export type PermissionSnapshot = {
  permissions: PermissionState[];
  updatedAt: string;
};

export type InstalledApp = {
  appName: string;
  iconUri?: string;
  installed: boolean;
  packageName: string;
  systemApp?: boolean;
  versionCode?: number;
  versionName?: string;
};

export type ListAppsOptions = {
  includeSystemApps?: boolean;
  query?: string;
};

export type NetworkStatus = {
  connected: boolean;
  isInternetReachable?: boolean;
  type: string;
};

export type DeviceInfoNative = {
  getDeviceInfo: () => Promise<DeviceInfo>;
};

export type PermissionNative = {
  getPermissionSnapshot: () => Promise<PermissionSnapshot>;
  openPermissionSettings: (type: PermissionType) => Promise<void>;
};

export type InstalledAppsNative = {
  launchApp: (packageName: string) => Promise<boolean>;
  listInstalledApps: (options?: ListAppsOptions) => Promise<InstalledApp[]>;
};

export type OverlayNative = {
  hasPermission: () => Promise<boolean>;
  hide: () => Promise<void>;
  openSettings: () => Promise<void>;
  show: () => Promise<void>;
};

export type SecureStorageNative = {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type NetworkNative = {
  getStatus: () => Promise<NetworkStatus>;
  subscribe: (listener: (status: NetworkStatus) => void) => () => void;
};

export type SecureVaultModule = {
  getItem: (key: string) => Promise<MFResult<string | null>>;
  removeItem: (key: string) => Promise<MFResult<void>>;
  setItem: (key: string, value: string) => Promise<MFResult<void>>;
};

export type BiometricModule = {
  authenticate: (reason: string) => Promise<MFResult<{ success: boolean }>>;
  isAvailable: () => Promise<MFResult<boolean>>;
};

export type NetworkMonitorModule = {
  getCurrentState: () => Promise<MFResult<NetworkStatus>>;
};

export type HapticsModule = {
  impact: (style: 'light' | 'medium' | 'heavy') => Promise<MFResult<void>>;
};

export type ClipboardModule = {
  getString: () => Promise<MFResult<string>>;
  setString: (value: string) => Promise<MFResult<void>>;
};

export type FileSystemModule = {
  readText: (path: string) => Promise<MFResult<string>>;
  writeText: (path: string, value: string) => Promise<MFResult<void>>;
};

export type PermissionModule = {
  getSnapshot: () => Promise<MFResult<PermissionSnapshot>>;
  openSettings: (permission: PermissionType) => Promise<MFResult<void>>;
  request: (permission: string) => Promise<MFResult<{ granted: boolean }>>;
};

export type AppLifecycleModule = {
  getState: () => Promise<MFResult<'active' | 'background' | 'inactive'>>;
};

export type LoggerModule = {
  info: (message: string, details?: Record<string, unknown>) => Promise<MFResult<void>>;
  error: (message: string, details?: Record<string, unknown>) => Promise<MFResult<void>>;
};

export type DeviceInfoModule = {
  getInfo: () => Promise<MFResult<DeviceInfo>>;
};

export type ShareModule = {
  shareText: (message: string) => Promise<MFResult<{ completed: boolean }>>;
};

export type MFNativeModules = {
  appLifecycle: AppLifecycleModule;
  biometric: BiometricModule;
  clipboard: ClipboardModule;
  deviceInfo: DeviceInfoModule;
  deviceInfoNative: DeviceInfoNative;
  fileSystem: FileSystemModule;
  haptics: HapticsModule;
  installedApps: InstalledAppsNative;
  logger: LoggerModule;
  network: NetworkNative;
  networkMonitor: NetworkMonitorModule;
  overlay: OverlayNative;
  permission: PermissionModule;
  permissionNative: PermissionNative;
  secureStorage: SecureStorageNative;
  secureVault: SecureVaultModule;
  share: ShareModule;
};

export type MFMockLogEntry = {
  details?: Record<string, unknown>;
  level: 'info' | 'error';
  message: string;
};

export type MFNativeMockState = {
  clipboard: string;
  files: Map<string, string>;
  installedApps: InstalledApp[];
  logs: MFMockLogEntry[];
  networkListeners: Set<(status: NetworkStatus) => void>;
  openedPermissionSettings: PermissionType[];
  overlayPermission: boolean;
  overlayVisible: boolean;
  permissions: Map<string, boolean>;
  vault: Map<string, string>;
};

export type MFNativeMockOptions = {
  appState?: 'active' | 'background' | 'inactive';
  biometricAvailable?: boolean;
  clipboard?: string;
  deviceInfo?: DeviceInfo;
  files?: Record<string, string>;
  installedApps?: InstalledApp[];
  networkState?: NetworkStatus;
  networkStatus?: NetworkStatus;
  overlayPermission?: boolean;
  permissionSnapshot?: PermissionSnapshot;
  permissions?: Record<string, boolean>;
  shareCompleted?: boolean;
  vault?: Record<string, string>;
};

export type MFMockNativeModules = MFNativeModules & {
  mock: MFNativeMockState;
};

const defaultInstalledApps: InstalledApp[] = [
  {
    appName: 'Example Game',
    installed: true,
    packageName: 'com.example.game',
    versionName: '1.0.0'
  },
  {
    appName: 'System Settings',
    installed: true,
    packageName: 'com.android.settings',
    systemApp: true,
    versionName: '1'
  }
];

export function createMockNativeModules(options: MFNativeMockOptions = {}): MFMockNativeModules {
  const state: MFNativeMockState = {
    clipboard: options.clipboard ?? '',
    files: new Map(Object.entries(options.files ?? {})),
    installedApps: options.installedApps ?? defaultInstalledApps,
    logs: [],
    networkListeners: new Set(),
    openedPermissionSettings: [],
    overlayPermission: options.overlayPermission ?? true,
    overlayVisible: false,
    permissions: new Map(Object.entries(options.permissions ?? {})),
    vault: new Map(Object.entries(options.vault ?? {}))
  };

  const networkState = options.networkStatus ?? options.networkState ?? { connected: true, isInternetReachable: true, type: 'wifi' };
  const appState = options.appState ?? 'active';
  const deviceInfo = options.deviceInfo ?? { appVersion: '0.1.0', model: 'Mock Device', osVersion: '0.0.0', platform: 'mock' };
  const getPermissionSnapshot = () => options.permissionSnapshot ?? createPermissionSnapshot(state.permissions);

  return {
    appLifecycle: {
      getState: async () => ok(appState)
    },
    biometric: {
      authenticate: async () => ok({ success: options.biometricAvailable ?? true }),
      isAvailable: async () => ok(options.biometricAvailable ?? true)
    },
    clipboard: {
      getString: async () => ok(state.clipboard),
      setString: async (value) => {
        state.clipboard = value;
        return ok(undefined);
      }
    },
    deviceInfo: {
      getInfo: async () => ok(deviceInfo)
    },
    deviceInfoNative: {
      getDeviceInfo: async () => deviceInfo
    },
    fileSystem: {
      readText: async (filePath) => {
        if (!state.files.has(filePath)) {
          return fail('FileSystemModule', 'E_FILE_NOT_FOUND', 'File does not exist in the mock file system.', { path: filePath });
        }

        return ok(state.files.get(filePath) ?? '');
      },
      writeText: async (filePath, value) => {
        state.files.set(filePath, value);
        return ok(undefined);
      }
    },
    haptics: {
      impact: async () => ok(undefined)
    },
    installedApps: {
      launchApp: async (packageName) => state.installedApps.some((app) => app.packageName === packageName && app.installed),
      listInstalledApps: async (listOptions = {}) => filterInstalledApps(state.installedApps, listOptions)
    },
    logger: {
      error: async (message, details) => {
        state.logs.push({ details: redactDetails(details), level: 'error', message: redactLogValue(message) });
        return ok(undefined);
      },
      info: async (message, details) => {
        state.logs.push({ details: redactDetails(details), level: 'info', message: redactLogValue(message) });
        return ok(undefined);
      }
    },
    mock: state,
    network: {
      getStatus: async () => networkState,
      subscribe: (listener) => {
        state.networkListeners.add(listener);
        listener(networkState);
        return () => {
          state.networkListeners.delete(listener);
        };
      }
    },
    networkMonitor: {
      getCurrentState: async () => ok(networkState)
    },
    overlay: {
      hasPermission: async () => state.overlayPermission,
      hide: async () => {
        state.overlayVisible = false;
      },
      openSettings: async () => {
        state.openedPermissionSettings.push('overlay');
      },
      show: async () => {
        state.overlayVisible = state.overlayPermission;
      }
    },
    permission: {
      getSnapshot: async () => ok(getPermissionSnapshot()),
      openSettings: async (permission) => {
        state.openedPermissionSettings.push(permission);
        return ok(undefined);
      },
      request: async (permission) => {
        const granted = state.permissions.get(permission) ?? true;
        state.permissions.set(permission, granted);
        return ok({ granted });
      }
    },
    permissionNative: {
      getPermissionSnapshot: async () => getPermissionSnapshot(),
      openPermissionSettings: async (type) => {
        state.openedPermissionSettings.push(type);
      }
    },
    secureStorage: {
      getItem: async (key) => {
        ensureKey(key);
        return state.vault.get(key) ?? null;
      },
      removeItem: async (key) => {
        ensureKey(key);
        state.vault.delete(key);
      },
      setItem: async (key, value) => {
        ensureKey(key);
        state.vault.set(key, value);
      }
    },
    secureVault: {
      getItem: async (key) => {
        const keyError = validateKey('SecureVaultModule', key);
        if (keyError) {
          return keyError;
        }

        return ok(state.vault.get(key) ?? null);
      },
      removeItem: async (key) => {
        const keyError = validateKey('SecureVaultModule', key);
        if (keyError) {
          return keyError;
        }

        state.vault.delete(key);
        return ok(undefined);
      },
      setItem: async (key, value) => {
        const keyError = validateKey('SecureVaultModule', key);
        if (keyError) {
          return keyError;
        }

        state.vault.set(key, value);
        return ok(undefined);
      }
    },
    share: {
      shareText: async () => ok({ completed: options.shareCompleted ?? true })
    }
  };
}

export const mockNativeModules = createMockNativeModules();

function validateKey(module: string, key: string): MFResult<never> | null {
  if (key.trim()) {
    return null;
  }

  return fail(module, 'E_EMPTY_KEY', 'Key must not be empty.', { key });
}

function ensureKey(key: string): void {
  if (!key.trim()) {
    throw new Error('Key must not be empty.');
  }
}

function createPermissionSnapshot(permissions: Map<string, boolean>): PermissionSnapshot {
  const configured = Array.from(permissions.entries()).map(([type, granted]) => ({
    granted,
    label: titleFromPermission(type),
    required: false,
    type
  }));

  return {
    permissions:
      configured.length > 0
        ? configured
        : [
            { granted: true, label: 'Notifications', required: false, type: 'notification' },
            { granted: true, label: 'Overlay', required: true, type: 'overlay' },
            { granted: true, label: 'Battery optimization', required: true, type: 'batteryOptimization' }
          ],
    updatedAt: 'mock'
  };
}

function filterInstalledApps(apps: InstalledApp[], options: ListAppsOptions): InstalledApp[] {
  const query = options.query?.trim().toLowerCase();

  return apps.filter((app) => {
    if (!options.includeSystemApps && app.systemApp) {
      return false;
    }

    if (!query) {
      return true;
    }

    return app.appName.toLowerCase().includes(query) || app.packageName.toLowerCase().includes(query);
  });
}

function titleFromPermission(permission: string): string {
  return permission
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fail(module: string, code: string, message: string, details?: Record<string, unknown>): MFResult<never> {
  return {
    ok: false,
    error: createError(module, code, message, { details, recoverable: true })
  };
}

function redactDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!details) {
    return undefined;
  }

  return redactRecord(details);
}

function redactRecord(details: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(details).map(([key, value]) => [redactLogValue(key), redactUnknown(value)]));
}

function redactUnknown(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactLogValue(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item));
  }

  if (value && typeof value === 'object') {
    return redactRecord(value as Record<string, unknown>);
  }

  return value;
}
