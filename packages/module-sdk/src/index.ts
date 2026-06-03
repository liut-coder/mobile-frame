import type { ComponentType } from 'react';

export type MFRouteDefinition = {
  name: string;
  screen: ComponentType;
};

export type MFModuleNavigation = {
  tab?: {
    title: string;
    icon: string;
    order: number;
  };
};

export type MFModuleDefinition = {
  id: string;
  name: string;
  version: string;
  routes: MFRouteDefinition[];
  permissions: string[];
  capabilities: string[];
  navigation?: MFModuleNavigation;
};

export function defineModule<TModule extends MFModuleDefinition>(module: TModule): TModule {
  return module;
}

export function sortModulesByTabOrder(modules: MFModuleDefinition[]): MFModuleDefinition[] {
  return [...modules].sort((left, right) => {
    const leftOrder = left.navigation?.tab?.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.navigation?.tab?.order ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}
