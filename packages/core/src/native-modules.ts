import { createError, ok, redactLogValue, type MFResult } from './index';

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
  getCurrentState: () => Promise<MFResult<{ connected: boolean; type: string }>>;
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
  getInfo: () => Promise<MFResult<{ platform: string; model?: string; osVersion?: string }>>;
};

export type ShareModule = {
  shareText: (message: string) => Promise<MFResult<{ completed: boolean }>>;
};

export type MFNativeModules = {
  appLifecycle: AppLifecycleModule;
  biometric: BiometricModule;
  clipboard: ClipboardModule;
  deviceInfo: DeviceInfoModule;
  fileSystem: FileSystemModule;
  haptics: HapticsModule;
  logger: LoggerModule;
  networkMonitor: NetworkMonitorModule;
  permission: PermissionModule;
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
  logs: MFMockLogEntry[];
  permissions: Map<string, boolean>;
  vault: Map<string, string>;
};

export type MFNativeMockOptions = {
  appState?: 'active' | 'background' | 'inactive';
  biometricAvailable?: boolean;
  clipboard?: string;
  deviceInfo?: { platform: string; model?: string; osVersion?: string };
  files?: Record<string, string>;
  networkState?: { connected: boolean; type: string };
  permissions?: Record<string, boolean>;
  shareCompleted?: boolean;
  vault?: Record<string, string>;
};

export type MFMockNativeModules = MFNativeModules & {
  mock: MFNativeMockState;
};

export function createMockNativeModules(options: MFNativeMockOptions = {}): MFMockNativeModules {
  const state: MFNativeMockState = {
    clipboard: options.clipboard ?? '',
    files: new Map(Object.entries(options.files ?? {})),
    logs: [],
    permissions: new Map(Object.entries(options.permissions ?? {})),
    vault: new Map(Object.entries(options.vault ?? {}))
  };

  const networkState = options.networkState ?? { connected: true, type: 'wifi' };
  const appState = options.appState ?? 'active';
  const deviceInfo = options.deviceInfo ?? { model: 'Mock Device', osVersion: '0.0.0', platform: 'mock' };

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
    networkMonitor: {
      getCurrentState: async () => ok(networkState)
    },
    permission: {
      request: async (permission) => {
        const granted = state.permissions.get(permission) ?? true;
        state.permissions.set(permission, granted);
        return ok({ granted });
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
