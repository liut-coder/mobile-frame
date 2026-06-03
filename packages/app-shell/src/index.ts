import { createContext, createElement, useContext, useEffect, type PropsWithChildren } from 'react';
import { create } from 'zustand';

import type { MFModuleDefinition } from '@mobile-frame/module-sdk';
import { createTheme, type MFTheme, type MFThemeMode } from '@mobile-frame/ui-core';

export type MFAppConfig = {
  appId: string;
  displayName: string;
  modules: MFModuleDefinition[];
  theme: MFTheme;
};

export type MFThemePreference = MFThemeMode | 'system';

export type MFToastState = {
  durationMs: number;
  id: string;
  message: string;
};

export type MFSheetState = {
  body?: string;
  id: string;
  title: string;
};

export type MFAppShellState = {
  config: MFAppConfig;
  closeSheet: () => void;
  hideToast: (id?: string) => void;
  openSheet: (sheet: Omit<MFSheetState, 'id'> & { id?: string }) => MFSheetState;
  resolvedThemeMode: MFThemeMode;
  setConfig: (config: Partial<MFAppConfig>) => void;
  setModules: (modules: MFModuleDefinition[]) => void;
  setThemeMode: (mode: MFThemePreference) => void;
  sheet: MFSheetState | null;
  showToast: (message: string, options?: Partial<Pick<MFToastState, 'durationMs' | 'id'>>) => MFToastState;
  themeMode: MFThemePreference;
  toast: MFToastState | null;
};

const defaultConfig: MFAppConfig = {
  appId: 'com.misk.mobileframe',
  displayName: 'MobileFrame',
  modules: [],
  theme: createTheme('light')
};

let feedbackId = 0;

function nextFeedbackId(prefix: string): string {
  feedbackId += 1;
  return `${prefix}-${feedbackId}`;
}

function resolveThemeMode(mode: MFThemePreference): MFThemeMode {
  return mode === 'system' ? 'light' : mode;
}

function getModuleSignature(module: MFModuleDefinition) {
  return {
    capabilities: module.capabilities,
    id: module.id,
    name: module.name,
    navigation: module.navigation,
    permissions: module.permissions,
    routes: module.routes.map((route) => route.name),
    version: module.version
  };
}

function getConfigSignature(config: MFAppConfig): string {
  return JSON.stringify({
    appId: config.appId,
    displayName: config.displayName,
    modules: config.modules.map(getModuleSignature),
    theme: config.theme
  });
}

function mergeAppConfig(current: MFAppConfig, config: Partial<MFAppConfig>): MFAppConfig {
  return {
    ...current,
    ...config,
    modules: config.modules ?? current.modules,
    theme: config.theme ?? current.theme
  };
}

export const useMFAppShellStore = create<MFAppShellState>((set) => ({
  config: defaultConfig,
  closeSheet: () => set({ sheet: null }),
  hideToast: (id) =>
    set((state) => {
      if (!id || state.toast?.id === id) {
        return { toast: null };
      }

      return state;
    }),
  openSheet: (sheet) => {
    const next = {
      ...sheet,
      id: sheet.id ?? nextFeedbackId('sheet')
    };
    set({ sheet: next });
    return next;
  },
  resolvedThemeMode: 'light',
  setConfig: (config) =>
    set((state) => {
      const nextConfig = mergeAppConfig(state.config, config);

      if (getConfigSignature(state.config) === getConfigSignature(nextConfig)) {
        return state;
      }

      if (!config.theme) {
        return { config: nextConfig };
      }

      return {
        config: nextConfig,
        resolvedThemeMode: config.theme.mode,
        themeMode: config.theme.mode
      };
    }),
  setModules: (modules) => set((state) => ({ config: { ...state.config, modules } })),
  setThemeMode: (mode) =>
    set((state) => {
      const resolvedThemeMode = resolveThemeMode(mode);
      return {
        config: { ...state.config, theme: createTheme(resolvedThemeMode) },
        resolvedThemeMode,
        themeMode: mode
      };
    }),
  sheet: null,
  showToast: (message, options = {}) => {
    const next = {
      durationMs: options.durationMs ?? 1800,
      id: options.id ?? nextFeedbackId('toast'),
      message
    };
    set({ toast: next });
    return next;
  },
  themeMode: 'light',
  toast: null
}));

const MFAppConfigContext = createContext<MFAppConfig>(defaultConfig);

export function MFAppProvider({ children, config = defaultConfig }: PropsWithChildren<{ config?: Partial<MFAppConfig> }>) {
  const storeConfig = useMFAppShellStore((state) => state.config);
  const incomingConfig = createAppConfig(config);
  const incomingSignature = getConfigSignature(incomingConfig);

  useEffect(() => {
    useMFAppShellStore.getState().setConfig(config);
  }, [incomingSignature]);

  return createElement(MFAppConfigContext.Provider, { value: storeConfig }, children);
}

export function useMFAppConfig(): MFAppConfig {
  return useContext(MFAppConfigContext);
}

export function useMFThemeMode(): MFThemePreference {
  return useMFAppShellStore((state) => state.themeMode);
}

export function useMFTheme(): MFTheme {
  return useMFAppShellStore((state) => state.config.theme);
}

export function createAppConfig(config: Partial<MFAppConfig> = {}): MFAppConfig {
  return {
    ...defaultConfig,
    ...config,
    theme: config.theme ?? defaultConfig.theme,
    modules: config.modules ?? defaultConfig.modules
  };
}
