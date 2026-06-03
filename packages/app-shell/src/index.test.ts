import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';

import { createTheme } from '@mobile-frame/ui-core';

import { createAppConfig, MFAppProvider, useMFAppConfig, useMFAppShellStore, type MFAppConfig } from './index';

const reactActEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const TestScreen = () => null;

describe('app shell state', () => {
  beforeEach(() => {
    useMFAppShellStore.setState({
      config: createAppConfig(),
      resolvedThemeMode: 'light',
      sheet: null,
      themeMode: 'light',
      toast: null
    });
  });

  it('updates the resolved theme and config theme together', () => {
    useMFAppShellStore.getState().setThemeMode('dark');

    expect(useMFAppShellStore.getState().themeMode).toBe('dark');
    expect(useMFAppShellStore.getState().resolvedThemeMode).toBe('dark');
    expect(useMFAppShellStore.getState().config.theme.mode).toBe('dark');
  });

  it('resolves system theme to a concrete theme for first-version runtime', () => {
    useMFAppShellStore.getState().setThemeMode('system');

    expect(useMFAppShellStore.getState().themeMode).toBe('system');
    expect(useMFAppShellStore.getState().resolvedThemeMode).toBe('light');
    expect(useMFAppShellStore.getState().config.theme.mode).toBe('light');
  });

  it('stores and clears toast state by id', () => {
    const toast = useMFAppShellStore.getState().showToast('Saved successfully', { durationMs: 1200 });

    expect(toast.message).toBe('Saved successfully');
    expect(useMFAppShellStore.getState().toast).toMatchObject({ durationMs: 1200, id: toast.id });

    useMFAppShellStore.getState().hideToast('stale');
    expect(useMFAppShellStore.getState().toast).not.toBeNull();

    useMFAppShellStore.getState().hideToast(toast.id);
    expect(useMFAppShellStore.getState().toast).toBeNull();
  });

  it('stores and closes sheet state', () => {
    const sheet = useMFAppShellStore.getState().openSheet({ body: 'Permission details', title: 'Camera' });

    expect(useMFAppShellStore.getState().sheet).toEqual(sheet);

    useMFAppShellStore.getState().closeSheet();
    expect(useMFAppShellStore.getState().sheet).toBeNull();
  });

  it('syncs provider config into the shell store and context', async () => {
    const observedConfigs: MFAppConfig[] = [];
    const module = {
      capabilities: ['ui.catalog'],
      id: 'catalog',
      name: 'Catalog',
      permissions: ['catalog.read'],
      routes: [{ name: 'catalog.home', screen: TestScreen }],
      version: '1.0.0'
    };
    const providerConfig = {
      appId: 'com.misk.mobileframe.test',
      displayName: 'Provider Test',
      modules: [module],
      theme: createTheme('dark')
    };
    const Consumer = () => {
      observedConfigs.push(useMFAppConfig());
      return null;
    };

    await act(async () => {
      create(createElement(MFAppProvider, { config: providerConfig }, createElement(Consumer)));
    });

    const storeConfig = useMFAppShellStore.getState().config;
    expect(storeConfig).toMatchObject({
      appId: providerConfig.appId,
      displayName: providerConfig.displayName,
      modules: providerConfig.modules
    });
    expect(storeConfig.theme.mode).toBe('dark');
    expect(useMFAppShellStore.getState().themeMode).toBe('dark');
    expect(observedConfigs.at(-1)).toMatchObject({
      appId: providerConfig.appId,
      displayName: providerConfig.displayName,
      modules: providerConfig.modules
    });
  });
});
