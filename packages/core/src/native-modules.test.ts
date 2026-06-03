import { describe, expect, it } from 'vitest';

import { createMockNativeModules } from './native-modules';

describe('createMockNativeModules', () => {
  it('persists secure vault values through the unified result contract', async () => {
    const nativeModules = createMockNativeModules();

    await expect(nativeModules.secureVault.setItem('session-token', 'abc123')).resolves.toEqual({ ok: true, data: undefined });
    await expect(nativeModules.secureVault.getItem('session-token')).resolves.toEqual({ ok: true, data: 'abc123' });

    await nativeModules.secureVault.removeItem('session-token');
    await expect(nativeModules.secureVault.getItem('session-token')).resolves.toEqual({ ok: true, data: null });
  });

  it('returns recoverable errors for invalid secure vault keys', async () => {
    const nativeModules = createMockNativeModules();
    const result = await nativeModules.secureVault.getItem('   ');

    expect(result).toMatchObject({
      error: {
        code: 'E_EMPTY_KEY',
        module: 'SecureVaultModule',
        recoverable: true
      },
      ok: false
    });
  });

  it('uses configured permission and network state', async () => {
    const nativeModules = createMockNativeModules({
      networkState: { connected: false, type: 'cellular' },
      permissions: { camera: false, notifications: true }
    });

    await expect(nativeModules.permission.request('camera')).resolves.toEqual({ ok: true, data: { granted: false } });
    await expect(nativeModules.permission.request('notifications')).resolves.toEqual({ ok: true, data: { granted: true } });
    await expect(nativeModules.networkMonitor.getCurrentState()).resolves.toEqual({ ok: true, data: { connected: false, type: 'cellular' } });
  });

  it('keeps clipboard and file system state in memory', async () => {
    const nativeModules = createMockNativeModules();

    await nativeModules.clipboard.setString('copied');
    await expect(nativeModules.clipboard.getString()).resolves.toEqual({ ok: true, data: 'copied' });

    await nativeModules.fileSystem.writeText('/tmp/demo.txt', 'demo');
    await expect(nativeModules.fileSystem.readText('/tmp/demo.txt')).resolves.toEqual({ ok: true, data: 'demo' });

    const missing = await nativeModules.fileSystem.readText('/tmp/missing.txt');
    expect(missing).toMatchObject({ error: { code: 'E_FILE_NOT_FOUND', recoverable: true }, ok: false });
  });

  it('supports admin scanner, clipboard, share, and browser action mocks', async () => {
    const nativeModules = createMockNativeModules({
      scannedQRCodes: [{ format: 'qr', value: 'mf-bind://device/DEV-1024' }]
    });

    await expect(nativeModules.clipboard.copy('DEV-1024')).resolves.toEqual({ ok: true, data: undefined });
    await expect(nativeModules.clipboard.getString()).resolves.toEqual({ ok: true, data: 'DEV-1024' });

    await expect(nativeModules.scanner.scanQRCode()).resolves.toEqual({
      ok: true,
      data: { format: 'qr', value: 'mf-bind://device/DEV-1024' }
    });
    await expect(nativeModules.scanner.scanQRCode()).resolves.toEqual({ ok: true, data: null });

    await expect(nativeModules.share.shareText('logs')).resolves.toEqual({ ok: true, data: { completed: true } });
    expect(nativeModules.mock.sharedTexts).toEqual(['logs']);

    await expect(nativeModules.share.shareFile('/tmp/log.txt')).resolves.toEqual({
      ok: true,
      data: { completed: true, path: '/tmp/log.txt' }
    });
    expect(nativeModules.mock.sharedFiles).toEqual(['/tmp/log.txt']);

    const emptyPath = await nativeModules.share.shareFile('   ');
    expect(emptyPath).toMatchObject({
      error: {
        code: 'E_EMPTY_PATH',
        module: 'ShareModule',
        recoverable: true
      },
      ok: false
    });

    await expect(nativeModules.browser.open('https://example.test')).resolves.toEqual({
      ok: true,
      data: { opened: true, url: 'https://example.test' }
    });
    expect(nativeModules.mock.openedUrls).toEqual(['https://example.test']);

    const invalidUrl = await nativeModules.browser.open('ftp://example.test/file.txt');
    expect(invalidUrl).toMatchObject({
      error: {
        code: 'E_INVALID_URL',
        module: 'BrowserModule',
        recoverable: true
      },
      ok: false
    });
  });

  it('redacts sensitive log messages and details recursively', async () => {
    const nativeModules = createMockNativeModules();

    await nativeModules.logger.info('password token privateKey', {
      nested: { passphrase: 'secret value' },
      token: 'raw-token'
    });

    expect(nativeModules.mock.logs).toEqual([
      {
        details: {
          nested: { '[redacted]': '[redacted] value' },
          '[redacted]': 'raw-[redacted]'
        },
        level: 'info',
        message: '[redacted] [redacted] [redacted]'
      }
    ]);
  });

  it('provides direct secure storage and device info native contracts', async () => {
    const nativeModules = createMockNativeModules({
      deviceInfo: { appVersion: '1.2.3', model: 'Pixel Test', osVersion: '15', platform: 'android' }
    });

    await nativeModules.secureStorage.setItem('session-token', 'abc123');
    await expect(nativeModules.secureStorage.getItem('session-token')).resolves.toBe('abc123');
    await nativeModules.secureStorage.removeItem('session-token');
    await expect(nativeModules.secureStorage.getItem('session-token')).resolves.toBeNull();
    await expect(nativeModules.secureStorage.getItem('   ')).rejects.toThrow('Key must not be empty.');
    await expect(nativeModules.deviceInfoNative.getDeviceInfo()).resolves.toEqual({
      appVersion: '1.2.3',
      model: 'Pixel Test',
      osVersion: '15',
      platform: 'android'
    });
  });

  it('lists, filters, and launches installed app mocks', async () => {
    const nativeModules = createMockNativeModules({
      installedApps: [
        { appName: 'Example Game', installed: true, packageName: 'com.example.game', versionName: '1.0.0' },
        { appName: 'System Settings', installed: true, packageName: 'com.android.settings', systemApp: true },
        { appName: 'Missing Game', installed: false, packageName: 'com.example.missing' }
      ]
    });

    await expect(nativeModules.installedApps.listInstalledApps()).resolves.toEqual([
      { appName: 'Example Game', installed: true, packageName: 'com.example.game', versionName: '1.0.0' },
      { appName: 'Missing Game', installed: false, packageName: 'com.example.missing' }
    ]);
    await expect(nativeModules.installedApps.listInstalledApps({ includeSystemApps: true, query: 'settings' })).resolves.toEqual([
      { appName: 'System Settings', installed: true, packageName: 'com.android.settings', systemApp: true }
    ]);
    await expect(nativeModules.installedApps.launchApp('com.example.game')).resolves.toBe(true);
    await expect(nativeModules.installedApps.launchApp('com.example.missing')).resolves.toBe(false);
  });

  it('exposes permission snapshot and overlay mocks', async () => {
    const nativeModules = createMockNativeModules({
      permissions: { overlay: false, notification: true }
    });

    await expect(nativeModules.permissionNative.getPermissionSnapshot()).resolves.toMatchObject({
      permissions: [
        { granted: false, label: 'Overlay', type: 'overlay' },
        { granted: true, label: 'Notification', type: 'notification' }
      ],
      updatedAt: 'mock'
    });

    await nativeModules.permissionNative.openPermissionSettings('overlay');
    await nativeModules.permission.openSettings('notification');
    expect(nativeModules.mock.openedPermissionSettings).toEqual(['overlay', 'notification']);

    await expect(nativeModules.overlay.hasPermission()).resolves.toBe(true);
    await nativeModules.overlay.show();
    expect(nativeModules.mock.overlayVisible).toBe(true);
    await nativeModules.overlay.hide();
    expect(nativeModules.mock.overlayVisible).toBe(false);
  });

  it('supports direct network status subscriptions', async () => {
    const nativeModules = createMockNativeModules({
      networkStatus: { connected: true, isInternetReachable: true, type: 'wifi' }
    });
    const statuses: unknown[] = [];

    const unsubscribe = nativeModules.network.subscribe((status) => statuses.push(status));

    expect(statuses).toEqual([{ connected: true, isInternetReachable: true, type: 'wifi' }]);
    expect(nativeModules.mock.networkListeners.size).toBe(1);
    unsubscribe();
    expect(nativeModules.mock.networkListeners.size).toBe(0);
    await expect(nativeModules.network.getStatus()).resolves.toEqual({ connected: true, isInternetReachable: true, type: 'wifi' });
  });
});
