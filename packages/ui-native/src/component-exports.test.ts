import { describe, expect, it } from 'vitest';

import type * as UiNative from './index';

type UiNativeExports = typeof UiNative;
type RequiredComponentExports = Pick<UiNativeExports, 'MFDialog' | 'MFFilterSheet' | 'MFHeader' | 'MFScreen' | 'MFSheet' | 'MFToast'>;

describe('ui-native component exports', () => {
  it('keeps documented component entry points in package exports', () => {
    const expectedExports: Array<keyof RequiredComponentExports> = ['MFDialog', 'MFFilterSheet', 'MFHeader', 'MFScreen', 'MFSheet', 'MFToast'];

    expect(expectedExports).toEqual(['MFDialog', 'MFFilterSheet', 'MFHeader', 'MFScreen', 'MFSheet', 'MFToast']);
  });
});
