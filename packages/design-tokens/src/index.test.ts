import { describe, expect, it } from 'vitest';

import { createMFTheme, mfColors, type MFThemeMode } from './index';

describe('design tokens theme modes', () => {
  it('exposes light and dark color palettes', () => {
    const modes: MFThemeMode[] = ['light', 'dark'];

    expect(Object.keys(mfColors).sort()).toEqual(modes.sort());
    expect(mfColors.light.background).not.toBe(mfColors.dark.background);
    expect(mfColors.light.text).not.toBe(mfColors.dark.text);
  });

  it('creates a dark theme with shared token scales', () => {
    const darkTheme = createMFTheme('dark');
    const lightTheme = createMFTheme('light');

    expect(darkTheme.colors.background).toBe(mfColors.dark.background);
    expect(darkTheme.colors.surface).toBe(mfColors.dark.surface);
    expect(darkTheme.spacing).toBe(lightTheme.spacing);
    expect(darkTheme.radius).toBe(lightTheme.radius);
  });
});
