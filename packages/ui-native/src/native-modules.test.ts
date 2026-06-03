import { describe, expect, it } from 'vitest';

import { createMockNativeModules as createCoreMockNativeModules } from '@mobile-frame/core/native-modules';

import { createMockNativeModules } from './native-modules';

describe('native module compatibility exports', () => {
  it('re-exports the core native mock factory', async () => {
    expect(createMockNativeModules).toBe(createCoreMockNativeModules);

    const nativeModules = createMockNativeModules();
    await expect(nativeModules.permission.request('camera')).resolves.toEqual({ ok: true, data: { granted: true } });
  });
});
