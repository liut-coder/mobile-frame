import type { PropsWithChildren } from 'react';
import { ScrollView, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { createTheme, type MFTheme } from '@mobile-frame/ui-core';

const defaultTheme = createTheme('light');

export type MFStackProps = PropsWithChildren<ViewProps & {
  gap?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function MFStack({ children, gap = 8, style, ...props }: MFStackProps) {
  return (
    <View {...props} style={[{ gap }, style]}>
      {children}
    </View>
  );
}

export function MFRow({ children, gap = 8, style, ...props }: MFStackProps) {
  return (
    <View {...props} style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      {children}
    </View>
  );
}

export function MFColumn(props: MFStackProps) {
  return <MFStack {...props} />;
}

export function MFSpacer({ size = 8 }: { size?: number }) {
  return <View style={{ height: size, width: size }} />;
}

export function MFDivider() {
  return <View style={{ backgroundColor: defaultTheme.colors.border, height: 1 }} />;
}

export function MFSafeArea({
  children,
  edges = ['top', 'right', 'bottom', 'left'],
  style
}: PropsWithChildren<{ edges?: Edge[]; style?: StyleProp<ViewStyle> }>) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function MFPage({
  children,
  centered = false,
  style,
  theme = defaultTheme
}: PropsWithChildren<{ centered?: boolean; style?: StyleProp<ViewStyle>; theme?: MFTheme }>) {
  return (
    <MFSafeArea
      style={[
        {
          backgroundColor: theme.colors.background,
          justifyContent: centered ? 'center' : 'flex-start',
          padding: theme.spacing.page
        },
        style
      ]}
    >
      {children}
    </MFSafeArea>
  );
}

export function MFScrollPage({
  children,
  style,
  theme = defaultTheme
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; theme?: MFTheme }>) {
  return (
    <MFSafeArea style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ padding: theme.spacing.page, paddingBottom: 112 }, style]}
      >
        {children}
      </ScrollView>
    </MFSafeArea>
  );
}

export function MFSection({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[{ marginBottom: 20 }, style]}>{children}</View>;
}
