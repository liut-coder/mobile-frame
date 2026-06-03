import { createMFTheme, type MFThemeMode, type MFThemeTokens } from '@mobile-frame/design-tokens';

export type { MFThemeMode };

export type MFTheme = MFThemeTokens & {
  mode: MFThemeMode;
};

export function createTheme(mode: MFThemeMode = 'light'): MFTheme {
  return {
    mode,
    ...createMFTheme(mode)
  };
}

export type MFVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type MFSize = 'sm' | 'md' | 'lg';

export type MFComponentState = {
  disabled?: boolean;
  focused?: boolean;
  pressed?: boolean;
  selected?: boolean;
};

export function getInteractiveOpacity(state: MFComponentState): number {
  if (state.disabled) {
    return 0.48;
  }

  if (state.pressed) {
    return 0.82;
  }

  return 1;
}

export function getPressedScale(state: MFComponentState): number {
  if (state.disabled) {
    return 1;
  }

  return state.pressed ? 0.985 : 1;
}

export function getControlHeight(size: MFSize): number {
  switch (size) {
    case 'sm':
      return 40;
    case 'lg':
      return 56;
    case 'md':
    default:
      return 52;
  }
}

export function resolveVariantColor(theme: MFTheme, variant: MFVariant): { background: string; text: string; border: string } {
  switch (variant) {
    case 'secondary':
      return {
        background: theme.colors.primarySoft,
        border: theme.colors.primarySoft,
        text: theme.colors.primary
      };
    case 'danger':
      return {
        background: theme.colors.danger,
        border: theme.colors.danger,
        text: '#FFFFFF'
      };
    case 'ghost':
      return {
        background: 'transparent',
        border: 'transparent',
        text: theme.colors.primary
      };
    case 'primary':
    default:
      return {
        background: theme.colors.primary,
        border: theme.colors.primary,
        text: theme.colors.primaryText
      };
  }
}
