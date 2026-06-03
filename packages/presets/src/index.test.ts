import { describe, expect, it } from 'vitest';

import { getPreset, listPresets } from './index';

describe('mfPresets', () => {
  it('lists the document-backed app creation presets', () => {
    expect(listPresets().map((preset) => preset.name)).toEqual(['basic', 'dashboard', 'device-agent', 'admin-mobile']);
  });

  it('defines the device-agent preset for device-side apps', () => {
    const preset = getPreset('device-agent');

    expect(preset.entryScreen).toBe('DashboardScreen');
    expect(preset.features).toEqual(expect.arrayContaining(['permission-snapshot', 'installed-apps', 'overlay', 'network', 'secure-storage']));
    expect(preset.screens).toEqual(expect.arrayContaining(['PermissionScreen', 'InstalledAppsScreen']));
    expect(preset.tabs).toEqual(expect.arrayContaining(['Status', 'Permissions', 'Apps', 'Logs', 'Settings']));
  });

  it('defines the admin-mobile preset for administrator apps', () => {
    const preset = getPreset('admin-mobile');

    expect(preset.modules).toEqual(['dashboard', 'devices', 'tasks', 'management', 'profile']);
    expect(preset.features).toEqual(
      expect.arrayContaining(['admin-auth', 'admin-permissions', 'realtime-status', 'log-viewer', 'scanner', 'clipboard', 'share', 'mobile-bff'])
    );
    expect(preset.screens).toEqual(
      expect.arrayContaining(['LoginScreen', 'DeviceDetailScreen', 'TaskDetailScreen', 'ManagementHomeScreen', 'ProfileScreen'])
    );
    expect(preset.tabs).toEqual(['Overview', 'Devices', 'Tasks', 'Management', 'Mine']);
  });

  it('keeps legacy preset names available for existing commands', () => {
    expect(getPreset('operations')).toMatchObject({
      entryScreen: 'DashboardScreen',
      name: 'operations'
    });
  });
});
