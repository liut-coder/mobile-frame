import { defineModule } from '@mobile-frame/module-sdk';

import { appPreset, appTabs } from '../store';

const GeneratedModuleScreen = () => null;

export const appModules = appPreset.modules.map((moduleName, index) => {
  const tab = appTabs[index];
  return defineModule({
    id: moduleName,
    name: toTitle(moduleName),
    version: '1.0.0',
    routes: [{ name: `${moduleName}.home`, screen: GeneratedModuleScreen }],
    permissions: [],
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
