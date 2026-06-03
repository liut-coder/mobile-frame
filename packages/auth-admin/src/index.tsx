import { createContext, useContext, type PropsWithChildren, type ReactNode } from 'react';

export type AdminPermission =
  | 'dashboard.view'
  | 'user.view'
  | 'user.manage'
  | 'device.view'
  | 'device.bind'
  | 'device.unbind'
  | 'device.command'
  | 'task.view'
  | 'task.stop'
  | 'task.retry'
  | 'module.view'
  | 'module.manage'
  | 'asset.view'
  | 'asset.manage'
  | 'app.release.view'
  | 'app.release.manage'
  | 'log.view'
  | (string & {});

export type AdminTokenPayload = {
  access_token: string;
  device_id: string;
  name?: string;
  permissions: AdminPermission[];
  refresh_token: string;
  role: string;
  tenant_id: string;
};

export type AdminSession = {
  accessToken: string;
  deviceId: string;
  name?: string;
  permissions: AdminPermission[];
  refreshToken: string;
  role: string;
  tenantId: string;
};

export type AdminAuthContextValue = {
  session: AdminSession | null;
};

export type PermissionMode = 'all' | 'any';

export type PermissionCheck = {
  mode?: PermissionMode;
  permission?: AdminPermission;
  permissions?: AdminPermission[];
};

export type AdminSecureTokenStore = {
  clear: () => Promise<void>;
  get: () => Promise<AdminTokenPayload | null>;
  set: (payload: AdminTokenPayload) => Promise<void>;
  storageKind: 'keychain' | 'keystore' | 'memory-mock';
};

const AdminAuthContext = createContext<AdminAuthContextValue>({ session: null });

export function AdminAuthProvider({ children, session }: PropsWithChildren<{ session: AdminSession | null }>) {
  return <AdminAuthContext.Provider value={{ session }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminSession(): AdminSession | null {
  return useContext(AdminAuthContext).session;
}

export function useAdminPermissions(): AdminPermission[] {
  return useAdminSession()?.permissions ?? [];
}

export function createAdminSession(payload: AdminTokenPayload): AdminSession {
  return {
    accessToken: payload.access_token,
    deviceId: payload.device_id,
    name: payload.name,
    permissions: [...payload.permissions],
    refreshToken: payload.refresh_token,
    role: payload.role,
    tenantId: payload.tenant_id
  };
}

export function serializeAdminSession(session: AdminSession): AdminTokenPayload {
  return {
    access_token: session.accessToken,
    device_id: session.deviceId,
    name: session.name,
    permissions: [...session.permissions],
    refresh_token: session.refreshToken,
    role: session.role,
    tenant_id: session.tenantId
  };
}

export function hasPermission(session: AdminSession | null | undefined, permission: AdminPermission): boolean {
  return Boolean(session?.permissions.includes(permission));
}

export function hasAllPermissions(session: AdminSession | null | undefined, permissions: AdminPermission[]): boolean {
  if (permissions.length === 0) {
    return true;
  }

  return permissions.every((permission) => hasPermission(session, permission));
}

export function hasAnyPermission(session: AdminSession | null | undefined, permissions: AdminPermission[]): boolean {
  if (permissions.length === 0) {
    return true;
  }

  return permissions.some((permission) => hasPermission(session, permission));
}

export function getMissingPermissions(session: AdminSession | null | undefined, permissions: AdminPermission[]): AdminPermission[] {
  return permissions.filter((permission) => !hasPermission(session, permission));
}

export function canAccess(session: AdminSession | null | undefined, check: PermissionCheck): boolean {
  const required = getRequiredPermissions(check);

  if (required.length === 0) {
    return true;
  }

  return check.mode === 'any' ? hasAnyPermission(session, required) : hasAllPermissions(session, required);
}

export function PermissionGate({
  children,
  fallback = null,
  mode,
  permission,
  permissions,
  session
}: PropsWithChildren<
  PermissionCheck & {
    fallback?: ReactNode;
    session?: AdminSession | null;
  }
>) {
  const contextSession = useAdminSession();
  const activeSession = session ?? contextSession;

  return canAccess(activeSession, { mode, permission, permissions }) ? <>{children}</> : <>{fallback}</>;
}

export function ProtectedScreen({
  children,
  fallback = null,
  mode,
  permission,
  permissions,
  session
}: PropsWithChildren<
  PermissionCheck & {
    fallback?: ReactNode;
    session?: AdminSession | null;
  }
>) {
  return (
    <PermissionGate fallback={fallback} mode={mode} permission={permission} permissions={permissions} session={session}>
      {children}
    </PermissionGate>
  );
}

export function createMemoryAdminSecureTokenStore(initialPayload: AdminTokenPayload | null = null): AdminSecureTokenStore {
  let value = initialPayload;

  return {
    clear: async () => {
      value = null;
    },
    get: async () => value,
    set: async (payload) => {
      value = payload;
    },
    storageKind: 'memory-mock'
  };
}

export function isSecureAdminTokenStore(store: Pick<AdminSecureTokenStore, 'storageKind'>): boolean {
  return store.storageKind === 'keychain' || store.storageKind === 'keystore';
}

export function assertSecureAdminTokenStore(store: Pick<AdminSecureTokenStore, 'storageKind'>): void {
  if (!isSecureAdminTokenStore(store)) {
    throw new Error('Admin tokens must be stored in iOS Keychain or Android Keystore.');
  }
}

function getRequiredPermissions(check: PermissionCheck): AdminPermission[] {
  return [...(check.permission ? [check.permission] : []), ...(check.permissions ?? [])];
}
