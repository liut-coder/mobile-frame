import type { AdminPermission } from '@mobile-frame/auth-admin';
import { defineModule } from '@mobile-frame/module-sdk';

import { appPreset, appTabs } from '../store';

const GeneratedModuleScreen = () => null;

const modulePermissions: Record<string, AdminPermission[]> = {
  dashboard: ['dashboard.view'],
  devices: ['device.view'],
  management: ['user.view', 'module.view', 'asset.view', 'app.release.view', 'log.view'],
  profile: [],
  tasks: ['task.view']
};

export const appModules = appPreset.modules.map((moduleName, index) => {
  const tab = appTabs[index];
  return defineModule({
    id: moduleName,
    name: toTitle(moduleName),
    version: '1.0.0',
    routes: [{ name: `${moduleName}.home`, screen: GeneratedModuleScreen }],
    permissions: modulePermissions[moduleName] ?? [],
    capabilities: [`preset.${appPreset.name}`],
    navigation: {
      tab: {
        icon: moduleName,
        order: tab?.order ?? index + 1,
        title: tab?.label ?? toTitle(moduleName)
      }
    }
  });
});

function toTitle(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
