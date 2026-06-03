import { describe, expect, it } from 'vitest';

import {
  configureAdminMobileBffClient,
  createAdminMobileBffClient,
  resetAdminMobileBffClient,
  type AdminMobileBffClientOptions
} from './mobile-bff';

describe('admin mobile BFF service', () => {
  it('keeps fixture-backed data as the default service client', async () => {
    const client = createAdminMobileBffClient();

    await expect(client.getDashboard()).resolves.toEqual(
      expect.objectContaining({
        activeTasks: expect.arrayContaining([expect.objectContaining({ id: 'task-bear-042' })]),
        recentDevices: expect.arrayContaining([expect.objectContaining({ id: 'DEV-1024' })])
      })
    );
    await expect(client.listUsers({ statuses: ['active'] })).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'user-zhang-san' })],
      total: 1
    });
  });

  it('maps runtime HTTP configuration into the typed mobile BFF client', async () => {
    const calls: Array<{ body?: string; headers?: Record<string, string>; method?: string; url: string }> = [];
    const client = createAdminMobileBffClient({
      baseUrl: 'https://admin.example.test/',
      fetch: async (url, init) => {
        calls.push({ body: init?.body, headers: init?.headers, method: init?.method, url });

        return {
          json: async () => ({ ok: true }),
          ok: true,
          status: 200
        };
      },
      getAccessToken: () => 'runtime-token',
      headers: { 'X-Tenant': 'game-helper-prod' },
      mode: 'http'
    });

    await client.listUsers({ limit: 5, statuses: ['pending'] });
    await client.pauseRelease('release-1.3.0-beta.4');

    expect(calls).toEqual([
      {
        headers: { Authorization: 'Bearer runtime-token', 'X-Tenant': 'game-helper-prod' },
        method: 'GET',
        url: 'https://admin.example.test/api/v1/mobile/users?limit=5&status=pending'
      },
      {
        body: '{}',
        headers: { Authorization: 'Bearer runtime-token', 'Content-Type': 'application/json', 'X-Tenant': 'game-helper-prod' },
        method: 'POST',
        url: 'https://admin.example.test/api/v1/mobile/releases/release-1.3.0-beta.4/pause'
      }
    ]);
  });

  it('requires explicit baseUrl and fetch when HTTP mode is selected', () => {
    expect(() => createAdminMobileBffClient({ mode: 'http' })).toThrow('HTTP mobile BFF mode requires baseUrl and fetch.');
  });

  it('can configure and reset the active service client', async () => {
    const options = {
      baseUrl: 'https://admin.example.test',
      fetch: async () => ({
        json: async () => ({ activeTasks: [], alerts: [], metrics: [], recentDevices: [] }),
        ok: true,
        status: 200
      }),
      mode: 'http'
    } satisfies AdminMobileBffClientOptions;

    const configured = configureAdminMobileBffClient(options);
    await expect(configured.getDashboard()).resolves.toEqual({ activeTasks: [], alerts: [], metrics: [], recentDevices: [] });

    const reset = resetAdminMobileBffClient();
    await expect(reset.getDashboard()).resolves.toEqual(
      expect.objectContaining({ recentDevices: expect.arrayContaining([expect.objectContaining({ id: 'DEV-1024' })]) })
    );
  });
});
