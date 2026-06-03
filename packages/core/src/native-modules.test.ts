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
});
