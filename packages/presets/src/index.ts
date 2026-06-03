export type MFCanonicalPresetName = 'basic' | 'dashboard' | 'device-agent' | 'admin-mobile';
export type MFLegacyPresetName = 'minimal' | 'standard' | 'operations';
export type MFPresetName = MFCanonicalPresetName | MFLegacyPresetName;

export type MFPresetDefinition<TName extends string = string> = {
  name: TName;
  description: string;
  entryScreen: string;
  modules: string[];
  features: string[];
  screens: string[];
  tabs: string[];
};

export type MFPreset = MFPresetDefinition<MFPresetName>;

const canonicalPresetNames: MFCanonicalPresetName[] = ['basic', 'dashboard', 'device-agent', 'admin-mobile'];

export const mfPresets: Record<MFPresetName, MFPreset> = {
  basic: {
    name: 'basic',
    description: 'Basic mobile app starter with startup, home, settings, theme, Toast, and Sheet flows.',
    entryScreen: 'HomeScreen',
    modules: ['settings'],
    features: ['theme', 'routing', 'toast', 'sheet', 'settings'],
    screens: ['SplashScreen', 'HomeScreen', 'SettingsScreen'],
    tabs: ['Home', 'Settings']
  },
  dashboard: {
    name: 'dashboard',
    description: 'Dashboard starter for status-first apps that need summary cards, recent activity, and quick actions.',
    entryScreen: 'DashboardScreen',
    modules: ['dashboard', 'settings'],
    features: ['theme', 'routing', 'dashboard', 'status-banner', 'summary-grid'],
    screens: ['DashboardScreen', 'ListScreen', 'SettingsScreen'],
    tabs: ['Overview', 'Activity', 'Settings']
  },
  'device-agent': {
    name: 'device-agent',
    description: 'Device-side starter with status, permissions, installed app selection, logs, and settings.',
    entryScreen: 'DashboardScreen',
    modules: ['device-status', 'permissions', 'installed-apps', 'logs', 'settings'],
    features: ['device-info', 'permission-snapshot', 'installed-apps', 'overlay', 'network', 'secure-storage'],
    screens: ['DashboardScreen', 'PermissionScreen', 'InstalledAppsScreen', 'SettingsScreen'],
    tabs: ['Status', 'Permissions', 'Apps', 'Logs', 'Settings']
  },
  'admin-mobile': {
    name: 'admin-mobile',
    description: 'Administrator mobile starter for dashboards, devices, tasks, management entry points, profile, and mobile BFF boundaries.',
    entryScreen: 'DashboardScreen',
    modules: ['dashboard', 'devices', 'tasks', 'management', 'profile'],
    features: [
      'admin-dashboard',
      'admin-auth',
      'admin-permissions',
      'device-management',
      'task-management',
      'realtime-status',
      'log-viewer',
      'scanner',
      'clipboard',
      'share',
      'mobile-bff'
    ],
    screens: [
      'LoginScreen',
      'DashboardScreen',
      'DeviceListScreen',
      'DeviceDetailScreen',
      'TaskListScreen',
      'TaskDetailScreen',
      'ManagementHomeScreen',
      'ProfileScreen'
    ],
    tabs: ['Overview', 'Devices', 'Tasks', 'Management', 'Mine']
  },
  minimal: {
    name: 'minimal',
    description: 'Small app shell with theme and navigation contracts.',
    entryScreen: 'HomeScreen',
    modules: [],
    features: ['theme', 'routing'],
    screens: ['HomeScreen'],
    tabs: ['Home']
  },
  standard: {
    name: 'standard',
    description: 'Default business app starter with storage, network status, and settings patterns.',
    entryScreen: 'HomeScreen',
    modules: ['settings'],
    features: ['theme', 'routing', 'storage', 'network-monitor'],
    screens: ['HomeScreen', 'SettingsScreen'],
    tabs: ['Home', 'Settings']
  },
  operations: {
    name: 'operations',
    description: 'Operational app starter with logs, task status, and approval-oriented patterns.',
    entryScreen: 'DashboardScreen',
    modules: ['settings', 'logs', 'tasks'],
    features: ['theme', 'routing', 'storage', 'network-monitor', 'audit-log', 'task-progress'],
    screens: ['DashboardScreen', 'ListScreen', 'SettingsScreen'],
    tabs: ['Overview', 'Tasks', 'Logs', 'Settings']
  }
};

export function getPreset(name: MFPresetName): MFPreset {
  return mfPresets[name];
}

export function listPresets(): MFPreset[] {
  return canonicalPresetNames.map((name) => mfPresets[name]);
}
