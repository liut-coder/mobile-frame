import type { PropsWithChildren } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { createTheme, type MFTheme } from '@mobile-frame/ui-core';

const defaultTheme = createTheme('light');

export type MFTextProps = PropsWithChildren<Omit<TextProps, 'style'> & {
  muted?: boolean;
  theme?: MFTheme;
  style?: StyleProp<TextStyle>;
}>;

export function MFText({ children, muted = false, style, theme = defaultTheme, ...props }: MFTextProps) {
  return (
    <Text
      {...props}
      style={[
        {
          color: muted ? theme.colors.textMuted : theme.colors.text,
          fontSize: theme.typography.size.callout,
          lineHeight: theme.typography.lineHeight.callout
        },
        style
      ]}
    >
      {children}
    </Text>
  );
}

export function MFHeading({ children, style, ...props }: MFTextProps) {
  return (
    <MFText {...props} style={[{ fontSize: 30, fontWeight: '800', lineHeight: 38 }, style]}>
      {children}
    </MFText>
  );
}

export function MFParagraph(props: MFTextProps) {
  return <MFText {...props} />;
}

export function MFLabel({ children, style, ...props }: MFTextProps) {
  return (
    <MFText {...props} style={[{ fontSize: 13, fontWeight: '700', lineHeight: 18 }, style]}>
      {children}
    </MFText>
  );
}

export function MFCaption({ children, style, ...props }: MFTextProps) {
  return (
    <MFText muted {...props} style={[{ fontSize: 12, lineHeight: 16 }, style]}>
      {children}
    </MFText>
  );
}
