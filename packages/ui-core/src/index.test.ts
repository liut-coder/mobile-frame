import { describe, expect, it } from 'vitest';

import { createTheme, resolveVariantColor } from './index';

describe('ui-core theme helpers', () => {
  it('creates a dark runtime theme', () => {
    const theme = createTheme('dark');

    expect(theme.mode).toBe('dark');
    expect(theme.colors.background).toBe('#0D1727');
    expect(theme.colors.text).toBe('#F5F8FF');
  });

  it('resolves variant colors from the active theme', () => {
    const darkTheme = createTheme('dark');
    const primary = resolveVariantColor(darkTheme, 'primary');
    const outline = resolveVariantColor(darkTheme, 'outline');

    expect(primary.background).toBe(darkTheme.colors.primary);
    expect(primary.text).toBe(darkTheme.colors.primaryText);
    expect(outline.border).toBe(darkTheme.colors.border);
  });
});
