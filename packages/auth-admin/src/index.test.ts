import { describe, expect, it } from 'vitest';

import {
  assertSecureAdminTokenStore,
  canAccess,
  createAdminSession,
  createMemoryAdminSecureTokenStore,
  getMissingPermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isSecureAdminTokenStore,
  serializeAdminSession,
  type AdminTokenPayload
} from './index';

const tokenPayload = {
  access_token: 'access-token',
  device_id: 'admin-phone-01',
  name: 'Operations Admin',
  permissions: ['dashboard.view', 'device.view', 'task.stop'],
  refresh_token: 'refresh-token',
  role: 'Platform administrator',
  tenant_id: 'game-helper-prod'
} satisfies AdminTokenPayload;

describe('auth-admin', () => {
  it('maps the mobile BFF token payload into an admin session', () => {
    const session = createAdminSession(tokenPayload);

    expect(session).toMatchObject({
      accessToken: 'access-token',
      deviceId: 'admin-phone-01',
      name: 'Operations Admin',
      refreshToken: 'refresh-token',
      role: 'Platform administrator',
      tenantId: 'game-helper-prod'
    });
    expect(serializeAdminSession(session)).toEqual(tokenPayload);
  });

  it('checks single, all, any, and missing permissions', () => {
    const session = createAdminSession(tokenPayload);

    expect(hasPermission(session, 'task.stop')).toBe(true);
    expect(hasPermission(session, 'task.retry')).toBe(false);
    expect(hasAllPermissions(session, ['dashboard.view', 'device.view'])).toBe(true);
    expect(hasAllPermissions(session, ['dashboard.view', 'task.retry'])).toBe(false);
    expect(hasAllPermissions(null, [])).toBe(true);
    expect(hasAnyPermission(session, ['task.retry', 'task.stop'])).toBe(true);
    expect(getMissingPermissions(session, ['task.retry', 'task.stop'])).toEqual(['task.retry']);
  });

  it('supports route-level access checks', () => {
    const session = createAdminSession(tokenPayload);

    expect(canAccess(session, { permission: 'dashboard.view' })).toBe(true);
    expect(canAccess(session, { mode: 'any', permissions: ['task.retry', 'task.stop'] })).toBe(true);
    expect(canAccess(session, { permissions: ['task.retry', 'task.stop'] })).toBe(false);
    expect(canAccess(null, {})).toBe(true);
    expect(canAccess(null, { permission: 'dashboard.view' })).toBe(false);
  });

  it('keeps memory token storage marked as a non-production mock', async () => {
    const store = createMemoryAdminSecureTokenStore(tokenPayload);

    await expect(store.get()).resolves.toEqual(tokenPayload);
    expect(isSecureAdminTokenStore(store)).toBe(false);
    expect(() => assertSecureAdminTokenStore(store)).toThrow('Admin tokens must be stored in iOS Keychain or Android Keystore.');
    expect(() => assertSecureAdminTokenStore({ storageKind: 'keychain' })).not.toThrow();
  });
});
