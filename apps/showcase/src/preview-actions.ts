import { mockNativeModules, type MFMockNativeModules } from '@mobile-frame/core/native-modules';

export type PreviewActions = {
  openSheet: (title: string, body: string) => void;
};

export type PreviewResult =
  | { ok: true; data: unknown }
  | { ok: false; error: { code: string; message: string; module: string; recoverable: boolean } };

export async function previewNativeCapability(name: string, actions: PreviewActions, nativeModules: MFMockNativeModules = mockNativeModules) {
  switch (name) {
    case 'DeviceInfoNative': {
      const result = await nativeModules.deviceInfoNative.getDeviceInfo();
      actions.openSheet(name, `device: ${formatPreviewData(result)}`);
      return;
    }
    case 'PermissionNative': {
      const result = await nativeModules.permissionNative.getPermissionSnapshot();
      actions.openSheet(name, `snapshot: ${formatPreviewData(result)}`);
      return;
    }
    case 'InstalledAppsNative': {
      const result = await nativeModules.installedApps.listInstalledApps();
      actions.openSheet(name, `apps: ${formatPreviewData(result)}`);
      return;
    }
    case 'OverlayNative': {
      const before = await nativeModules.overlay.hasPermission();
      await nativeModules.overlay.show();
      const visibleAfterShow = nativeModules.mock.overlayVisible;
      await nativeModules.overlay.hide();
      actions.openSheet(name, `hasPermission: ${formatPreviewData(before)}\nvisibleAfterShow: ${formatPreviewData(visibleAfterShow)}`);
      return;
    }
    case 'SecureStorageNative': {
      await nativeModules.secureStorage.setItem('showcase-token', 'demo-token');
      const result = await nativeModules.secureStorage.getItem('showcase-token');
      actions.openSheet(name, `value: ${formatPreviewData(result)}`);
      return;
    }
    case 'NetworkNative': {
      const statuses: unknown[] = [];
      const unsubscribe = nativeModules.network.subscribe((status) => statuses.push(status));
      unsubscribe();
      const result = await nativeModules.network.getStatus();
      actions.openSheet(name, `status: ${formatPreviewData(result)}\nsubscribed: ${formatPreviewData(statuses)}`);
      return;
    }
    case 'SecureVaultModule': {
      await nativeModules.secureVault.setItem('showcase-token', 'demo-token');
      const result = await nativeModules.secureVault.getItem('showcase-token');
      actions.openSheet(name, formatPreviewResult(result));
      return;
    }
    case 'BiometricModule': {
      const available = await nativeModules.biometric.isAvailable();
      const auth = await nativeModules.biometric.authenticate('Showcase preview');
      actions.openSheet(name, `${formatPreviewResult(available)}\n${formatPreviewResult(auth)}`);
      return;
    }
    case 'PermissionModule': {
      const result = await nativeModules.permission.request('camera');
      actions.openSheet(name, formatPreviewResult(result));
      return;
    }
    case 'NetworkMonitorModule': {
      const result = await nativeModules.networkMonitor.getCurrentState();
      actions.openSheet(name, formatPreviewResult(result));
      return;
    }
    case 'LoggerModule': {
      const result = await nativeModules.logger.info('showcase token preview', { password: 'demo-password' });
      const latestLog = nativeModules.mock.logs.at(-1);
      actions.openSheet(name, `${formatPreviewResult(result)}\nLatest log: ${JSON.stringify(latestLog)}`);
      return;
    }
    default:
      actions.openSheet(name, `${name} is documented as part of the MobileFrame first-version catalog.`);
  }
}

export async function previewPermission(name: string, actions: PreviewActions, nativeModules: MFMockNativeModules = mockNativeModules) {
  const id = permissionId(name);
  const result = await nativeModules.permission.request(id);
  actions.openSheet(name, `PermissionModule.request("${id}")\n${formatPreviewResult(result)}`);
}

export function permissionId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '.');
}

export function formatPreviewResult(result: PreviewResult): string {
  if (result.ok) {
    return `ok: ${formatPreviewData(result.data)}`;
  }

  return `error: ${result.error.module}.${result.error.code} - ${result.error.message}`;
}

function formatPreviewData(data: unknown): string {
  if (data === undefined) {
    return 'undefined';
  }

  return JSON.stringify(data);
}
