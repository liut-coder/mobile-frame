export const mfTokens = {
  meta: {
    name: 'MobileFrame Design Tokens',
    version: '1.0.0'
  },
  colors: {
    brand: {
      primary: '#1677FF',
      pressed: '#0F5ECC',
      soft: '#EAF3FF'
    },
    neutral: {
      0: '#FFFFFF',
      50: '#F7F8FA',
      100: '#EEF0F3',
      200: '#DDE1E6',
      500: '#7A828E',
      700: '#3B424C',
      900: '#15181D'
    },
    semantic: {
      success: '#22A06B',
      warning: '#D97B00',
      danger: '#D93F3F',
      info: '#1677FF'
    }
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    pill: 999
  },
  typography: {
    display: 30,
    title1: 26,
    title2: 22,
    title3: 18,
    body: 16,
    callout: 15,
    caption: 13,
    micro: 11
  },
  glass: {
    opacityMin: 0.7,
    opacityMax: 0.92,
    blur: 22,
    maxLargeAreasPerScreen: 3
  },
  motion: {
    fast: 160,
    normal: 240,
    slow: 360
  }
} as const;

export const mfColors = {
  light: {
    background: '#F7F8FA',
    backgroundSoft: '#EEF5FF',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF0F3',
    surfaceGlass: 'rgba(255,255,255,0.82)',
    text: '#15181D',
    textMuted: '#7A828E',
    border: '#DDE1E6',
    primary: mfTokens.colors.brand.primary,
    primaryPressed: mfTokens.colors.brand.pressed,
    primarySoft: mfTokens.colors.brand.soft,
    primaryText: '#FFFFFF',
    success: mfTokens.colors.semantic.success,
    warning: mfTokens.colors.semantic.warning,
    danger: mfTokens.colors.semantic.danger,
    info: mfTokens.colors.semantic.info
  },
  dark: {
    background: '#0D1727',
    backgroundSoft: '#101B2E',
    surface: '#172033',
    surfaceMuted: '#21304A',
    surfaceGlass: 'rgba(24,38,59,0.82)',
    text: '#F5F8FF',
    textMuted: '#9DB0C8',
    border: 'rgba(180,205,240,0.16)',
    primary: '#6AA6FF',
    primaryPressed: '#8EBAFF',
    primarySoft: 'rgba(106,166,255,0.14)',
    primaryText: '#08111F',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#6AA6FF'
  }
} as const;

export const mfSpacing = {
  none: mfTokens.spacing[0],
  xs: mfTokens.spacing[1],
  sm: mfTokens.spacing[2],
  md: mfTokens.spacing[3],
  lg: mfTokens.spacing[4],
  xl: mfTokens.spacing[6],
  xxl: mfTokens.spacing[8],
  page: mfTokens.spacing[4],
  input: mfTokens.spacing[3]
} as const;

export const mfRadius = {
  none: 0,
  xs: mfTokens.radius.xs,
  sm: mfTokens.radius.sm,
  md: mfTokens.radius.md,
  lg: mfTokens.radius.lg,
  xl: mfTokens.radius.xl,
  pill: mfTokens.radius.pill
} as const;

export const mfTypography = {
  family: {
    base: 'System',
    mono: 'Menlo'
  },
  size: mfTokens.typography,
  lineHeight: {
    display: 38,
    title1: 34,
    title2: 30,
    title3: 24,
    body: 23,
    callout: 21,
    caption: 18,
    micro: 14
  }
} as const;

export const mfGlass = mfTokens.glass;
export const mfMotion = mfTokens.motion;

export const mfShadow = {
  sm: {
    color: 'rgba(71,112,166,0.16)',
    opacity: 0.08,
    radius: 10,
    offsetY: 4,
    elevation: 2
  },
  md: {
    color: 'rgba(71,112,166,0.18)',
    opacity: 0.12,
    radius: 20,
    offsetY: 10,
    elevation: 5
  },
  lg: {
    color: 'rgba(71,112,166,0.22)',
    opacity: 0.16,
    radius: 30,
    offsetY: 16,
    elevation: 8
  }
} as const;

export type MFThemeMode = keyof typeof mfColors;
export type MFThemeTokens = {
  colors: (typeof mfColors)[MFThemeMode];
  glass: typeof mfGlass;
  motion: typeof mfMotion;
  radius: typeof mfRadius;
  shadow: typeof mfShadow;
  spacing: typeof mfSpacing;
  typography: typeof mfTypography;
};

export function createMFTheme(mode: MFThemeMode): MFThemeTokens {
  return {
    colors: mfColors[mode],
    glass: mfGlass,
    motion: mfMotion,
    radius: mfRadius,
    shadow: mfShadow,
    spacing: mfSpacing,
    typography: mfTypography
  };
}
