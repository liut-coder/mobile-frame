import { describe, expect, it } from 'vitest';

import { createMockNativeModules } from '@mobile-frame/core/native-modules';

import { formatPreviewResult, permissionId, previewNativeCapability, previewPermission, type PreviewActions } from './preview-actions';

type CapturedSheet = {
  body: string;
  title: string;
};

function createActions() {
  const sheets: CapturedSheet[] = [];
  const actions: PreviewActions = {
    openSheet: (title, body) => {
      sheets.push({ body, title });
    }
  };

  return { actions, sheets };
}

describe('showcase preview actions', () => {
  it('formats preview result values and permission ids consistently', () => {
    expect(permissionId('File access')).toBe('file.access');
    expect(permissionId('Push   Notifications')).toBe('push.notifications');
    expect(formatPreviewResult({ ok: true, data: undefined })).toBe('ok: undefined');
    expect(formatPreviewResult({ ok: true, data: { granted: false } })).toBe('ok: {"granted":false}');
    expect(
      formatPreviewResult({
        error: {
          code: 'E_DEMO',
          message: 'Demo error',
          module: 'DemoModule',
          recoverable: true
        },
        ok: false
      })
    ).toBe('error: DemoModule.E_DEMO - Demo error');
  });

  it('previews secure vault through a captured sheet result', async () => {
    const nativeModules = createMockNativeModules();
    const { actions, sheets } = createActions();

    await previewNativeCapability('SecureVaultModule', actions, nativeModules);

    expect(sheets).toEqual([{ body: 'ok: "demo-token"', title: 'SecureVaultModule' }]);
    await expect(nativeModules.secureVault.getItem('showcase-token')).resolves.toEqual({ data: 'demo-token', ok: true });
  });

  it('previews biometric availability and authentication together', async () => {
    const nativeModules = createMockNativeModules({ biometricAvailable: false });
    const { actions, sheets } = createActions();

    await previewNativeCapability('BiometricModule', actions, nativeModules);

    expect(sheets).toEqual([{ body: 'ok: false\nok: {"success":false}', title: 'BiometricModule' }]);
  });

  it('previews permission and network native capabilities from mock state', async () => {
    const nativeModules = createMockNativeModules({
      networkState: { connected: false, type: 'cellular' },
      permissions: { camera: false }
    });
    const { actions, sheets } = createActions();

    await previewNativeCapability('PermissionModule', actions, nativeModules);
    await previewNativeCapability('NetworkMonitorModule', actions, nativeModules);

    expect(sheets).toEqual([
      { body: 'ok: {"granted":false}', title: 'PermissionModule' },
      { body: 'ok: {"connected":false,"type":"cellular"}', title: 'NetworkMonitorModule' }
    ]);
  });

  it('previews logger output with redacted latest log details', async () => {
    const nativeModules = createMockNativeModules();
    const { actions, sheets } = createActions();

    await previewNativeCapability('LoggerModule', actions, nativeModules);

    expect(sheets).toEqual([
      {
        body:
          'ok: undefined\nLatest log: {"details":{"[redacted]":"demo-[redacted]"},"level":"info","message":"showcase [redacted] preview"}',
        title: 'LoggerModule'
      }
    ]);
  });

  it('previews permission requests with normalized permission ids', async () => {
    const nativeModules = createMockNativeModules({ permissions: { 'file.access': false } });
    const { actions, sheets } = createActions();

    await previewPermission('File access', actions, nativeModules);

    expect(sheets).toEqual([
      {
        body: 'PermissionModule.request("file.access")\nok: {"granted":false}',
        title: 'File access'
      }
    ]);
  });

  it('shows a catalog fallback for reserved native capability names', async () => {
    const nativeModules = createMockNativeModules();
    const { actions, sheets } = createActions();

    await previewNativeCapability('ReservedModule', actions, nativeModules);

    expect(sheets).toEqual([
      {
        body: 'ReservedModule is documented as part of the MobileFrame first-version catalog.',
        title: 'ReservedModule'
      }
    ]);
  });
});
