import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { createTheme, type MFTheme } from '@mobile-frame/ui-core';

import { MFBadge } from './feedback';
import { MFRow, MFStack } from './layout';
import { MFCaption, MFHeading, MFText } from './typography';

const defaultTheme = createTheme('light');

export type MFTabBarItem<TValue extends string> = {
  badge?: string;
  icon?: ReactNode;
  label: string;
  value: TValue;
};

export type MFHeaderProps = {
  backLabel?: string;
  eyebrow?: string;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
  theme?: MFTheme;
  title: string;
};

export function MFBackButton({
  label = 'Back',
  onPress,
  theme = defaultTheme
}: {
  label?: string;
  onPress: () => void;
  theme?: MFTheme;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <MFRow gap={8}>
        <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 20, fontWeight: '900', lineHeight: 24 }}>
          {'<'}
        </MFText>
        <MFText theme={theme} style={{ color: theme.colors.primary, fontWeight: '800' }}>
          {label}
        </MFText>
      </MFRow>
    </Pressable>
  );
}

export function MFPageHeader({
  backLabel,
  eyebrow,
  onBack,
  right,
  subtitle,
  theme = defaultTheme,
  title
}: MFHeaderProps) {
  return (
    <MFStack gap={10}>
      {onBack ? <MFBackButton label={backLabel} onPress={onBack} theme={theme} /> : null}
      <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <MFStack gap={6} style={{ flex: 1 }}>
          {eyebrow ? <MFBadge label={eyebrow} theme={theme} /> : null}
          <MFHeading theme={theme}>{title}</MFHeading>
          {subtitle ? <MFCaption theme={theme}>{subtitle}</MFCaption> : null}
        </MFStack>
        {right ? <View style={{ marginLeft: theme.spacing.md }}>{right}</View> : null}
      </MFRow>
    </MFStack>
  );
}

export function MFHeader(props: MFHeaderProps) {
  return <MFPageHeader {...props} />;
}

export function MFTabBar<TValue extends string>({
  items,
  onChange,
  style,
  theme = defaultTheme,
  value
}: {
  items: Array<MFTabBarItem<TValue>>;
  onChange: (value: TValue) => void;
  style?: StyleProp<ViewStyle>;
  theme?: MFTheme;
  value: TValue;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surfaceGlass,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 4,
          padding: 6
        },
        style
      ]}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            key={item.value}
            onPress={() => onChange(item.value)}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: selected ? theme.colors.primarySoft : 'transparent',
              borderRadius: theme.radius.lg,
              flex: 1,
              justifyContent: 'center',
              minHeight: 48,
              opacity: pressed ? 0.82 : 1,
              paddingHorizontal: 4
            })}
          >
            {item.icon ? <View style={{ marginBottom: 2 }}>{item.icon}</View> : null}
            <MFText
              theme={theme}
              style={{
                color: selected ? theme.colors.primary : theme.colors.textMuted,
                fontSize: 11,
                fontWeight: '900',
                lineHeight: 14,
                textAlign: 'center'
              }}
            >
              {item.label}
            </MFText>
            {item.badge ? (
              <View style={{ marginTop: 2 }}>
                <MFBadge label={item.badge} theme={theme} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
