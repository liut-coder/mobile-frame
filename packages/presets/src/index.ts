export type MFPresetName = 'minimal' | 'standard' | 'operations' | 'admin-mobile';

export type MFPreset = {
  name: MFPresetName;
  description: string;
  modules: string[];
  features: string[];
};

export const mfPresets: Record<MFPresetName, MFPreset> = {
  minimal: {
    name: 'minimal',
    description: 'Small app shell with theme and navigation contracts.',
    modules: [],
    features: ['theme', 'routing']
  },
  standard: {
    name: 'standard',
    description: 'Default business app starter with storage, network status, and settings patterns.',
    modules: ['settings'],
    features: ['theme', 'routing', 'storage', 'network-monitor']
  },
  operations: {
    name: 'operations',
    description: 'Operational app starter with logs, task status, and approval-oriented patterns.',
    modules: ['settings', 'logs', 'tasks'],
    features: ['theme', 'routing', 'storage', 'network-monitor', 'audit-log', 'task-progress']
  },
  'admin-mobile': {
    name: 'admin-mobile',
    description: 'Administrator mobile console starter for managed users, devices, task dispatch, alerts, and releases.',
    modules: ['auth', 'dashboard', 'managed-users', 'devices', 'tasks', 'game-modules', 'alerts', 'releases', 'settings'],
    features: [
      'theme',
      'routing',
      'secure-vault',
      'query-cache',
      'network-monitor',
      'audit-log',
      'task-progress',
      'release-rollout',
      'device-binding'
    ]
  }
};

export function getPreset(name: MFPresetName): MFPreset {
  return mfPresets[name];
}
