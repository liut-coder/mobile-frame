import type { PropsWithChildren, ReactNode } from 'react';
import {
  Animated,
  Pressable,
  Switch,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle
} from 'react-native';

import { createTheme, getControlHeight, resolveVariantColor, type MFSize, type MFTheme, type MFVariant } from '@mobile-frame/ui-core';

import { MFRow, MFStack } from './layout';
import { MFCaption, MFText } from './typography';

const defaultTheme = createTheme('light');

function shadow(theme: MFTheme, level: 'sm' | 'md' | 'lg' = 'md') {
  const value = theme.shadow[level];
  return {
    elevation: value.elevation,
    shadowColor: value.color,
    shadowOffset: { width: 0, height: value.offsetY },
    shadowOpacity: value.opacity,
    shadowRadius: value.radius
  };
}

export function MFCard({
  children,
  glass = false,
  padded = true,
  style,
  theme = defaultTheme
}: PropsWithChildren<{ glass?: boolean; padded?: boolean; style?: StyleProp<ViewStyle>; theme?: MFTheme }>) {
  return (
    <View
      style={[
        {
          backgroundColor: glass ? theme.colors.surfaceGlass : theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          padding: padded ? theme.spacing.lg : 0
        },
        shadow(theme, glass ? 'md' : 'sm'),
        style
      ]}
    >
      {children}
    </View>
  );
}

export function MFButton({
  children,
  fullWidth = true,
  disabled = false,
  onPress,
  size = 'md',
  style,
  theme = defaultTheme,
  title,
  variant = 'primary'
}: PropsWithChildren<{
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  size?: MFSize;
  style?: StyleProp<ViewStyle>;
  theme?: MFTheme;
  title?: string;
  variant?: MFVariant;
}>) {
  const colors = resolveVariantColor(theme, variant);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: getControlHeight(size),
          opacity: disabled ? 0.48 : pressed ? 0.9 : 1,
          paddingHorizontal: theme.spacing.lg,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }]
        },
        style
      ]}
    >
      <MFText theme={theme} style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
        {title ?? children}
      </MFText>
    </Pressable>
  );
}

export function MFIconButton({
  children,
  disabled = false,
  onPress,
  style,
  theme = defaultTheme
}: PropsWithChildren<{ disabled?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; theme?: MFTheme }>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          backgroundColor: theme.colors.primarySoft,
          borderRadius: theme.radius.md,
          height: 40,
          justifyContent: 'center',
          opacity: disabled ? 0.48 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !disabled ? 0.96 : 1 }],
          width: 40
        },
        style
      ]}
    >
      {children}
    </Pressable>
  );
}

export function MFBadge({ label, tone = 'info', theme = defaultTheme }: { label: string; tone?: 'info' | 'success' | 'warning' | 'danger'; theme?: MFTheme }) {
  const color = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : tone === 'danger' ? theme.colors.danger : theme.colors.primary;
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
      <MFText theme={theme} style={{ color, fontSize: 12, fontWeight: '800', lineHeight: 16 }}>
        {label}
      </MFText>
    </View>
  );
}

export function MFGlassPanel({ children, style, theme = defaultTheme }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; theme?: MFTheme }>) {
  return (
    <MFCard glass theme={theme} style={[{ borderRadius: theme.radius.xl }, style]}>
      {children}
    </MFCard>
  );
}

export function MFInput({
  style,
  theme = defaultTheme,
  ...props
}: TextInputProps & { style?: StyleProp<TextStyle>; theme?: MFTheme }) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={theme.colors.textMuted}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          color: theme.colors.text,
          fontSize: 15,
          minHeight: 54,
          paddingHorizontal: theme.spacing.lg
        },
        style
      ]}
    />
  );
}

export function MFTextArea({
  style,
  theme = defaultTheme,
  ...props
}: TextInputProps & { style?: StyleProp<TextStyle>; theme?: MFTheme }) {
  return (
    <MFInput
      multiline
      textAlignVertical="top"
      {...props}
      theme={theme}
      style={[
        {
          minHeight: 112,
          paddingVertical: theme.spacing.md
        },
        style
      ]}
    />
  );
}

export function MFPasswordInput(props: TextInputProps & { style?: StyleProp<TextStyle>; theme?: MFTheme }) {
  return <MFInput autoCapitalize="none" autoCorrect={false} secureTextEntry {...props} />;
}

export function MFSearchBar({
  placeholder = 'Search',
  style,
  theme = defaultTheme,
  ...props
}: TextInputProps & { style?: StyleProp<TextStyle>; theme?: MFTheme }) {
  return (
    <MFInput
      autoCapitalize="none"
      autoCorrect={false}
      placeholder={placeholder}
      returnKeyType="search"
      {...props}
      theme={theme}
      style={[
        {
          backgroundColor: theme.colors.surfaceGlass
        },
        style
      ]}
    />
  );
}

export function MFFormField({
  children,
  errorText,
  helperText,
  label,
  required = false,
  theme = defaultTheme
}: PropsWithChildren<{
  errorText?: string;
  helperText?: string;
  label: string;
  required?: boolean;
  theme?: MFTheme;
}>) {
  return (
    <MFStack gap={6}>
      <MFRow gap={4}>
        <MFText theme={theme} style={{ fontSize: 13, fontWeight: '800', lineHeight: 18 }}>
          {label}
        </MFText>
        {required ? (
          <MFText theme={theme} style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '900', lineHeight: 18 }}>
            *
          </MFText>
        ) : null}
      </MFRow>
      {children}
      {errorText ? (
        <MFCaption theme={theme} style={{ color: theme.colors.danger }}>
          {errorText}
        </MFCaption>
      ) : helperText ? (
        <MFCaption theme={theme}>{helperText}</MFCaption>
      ) : null}
    </MFStack>
  );
}

export function MFCheckbox({
  disabled = false,
  label,
  onValueChange,
  theme = defaultTheme,
  value
}: {
  disabled?: boolean;
  label: string;
  onValueChange?: (value: boolean) => void;
  theme?: MFTheme;
  value: boolean;
}) {
  return (
    <Pressable disabled={disabled} onPress={() => onValueChange?.(!value)} style={({ pressed }) => ({ opacity: disabled ? 0.48 : pressed ? 0.82 : 1 })}>
      <MFRow gap={10}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: value ? theme.colors.primary : 'transparent',
            borderColor: value ? theme.colors.primary : theme.colors.border,
            borderRadius: 6,
            borderWidth: 1,
            height: 22,
            justifyContent: 'center',
            width: 22
          }}
        >
          <MFText style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900', lineHeight: 16 }}>{value ? 'x' : ''}</MFText>
        </View>
        <MFText muted theme={theme} style={{ flex: 1 }}>
          {label}
        </MFText>
      </MFRow>
    </Pressable>
  );
}

export function MFRadio({
  disabled = false,
  label,
  onPress,
  selected,
  theme = defaultTheme
}: {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  selected: boolean;
  theme?: MFTheme;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => ({ opacity: disabled ? 0.48 : pressed ? 0.82 : 1 })}>
      <MFRow gap={10}>
        <View
          style={{
            alignItems: 'center',
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            borderRadius: 11,
            borderWidth: 2,
            height: 22,
            justifyContent: 'center',
            width: 22
          }}
        >
          {selected ? <View style={{ backgroundColor: theme.colors.primary, borderRadius: 5, height: 10, width: 10 }} /> : null}
        </View>
        <MFText muted={!selected} theme={theme} style={{ flex: 1, fontWeight: selected ? '800' : '400' }}>
          {label}
        </MFText>
      </MFRow>
    </Pressable>
  );
}

export function MFListItem({
  children,
  icon,
  meta,
  onPress,
  right,
  style,
  theme = defaultTheme,
  title
}: PropsWithChildren<{
  icon?: string;
  meta?: string;
  onPress?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  theme?: MFTheme;
  title?: string;
}>) {
  const content = (
    <MFRow gap={12} style={[{ minHeight: 56, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }, style]}>
      {icon ? (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.colors.primarySoft,
            borderRadius: theme.radius.sm,
            height: 36,
            justifyContent: 'center',
            width: 36
          }}
        >
          <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 18, fontWeight: '800' }}>
            {icon}
          </MFText>
        </View>
      ) : null}
      <MFStack gap={2} style={{ flex: 1 }}>
        <MFText theme={theme} style={{ fontWeight: '800' }}>
          {title ?? children}
        </MFText>
        {meta ? (
          <MFText muted theme={theme} style={{ fontSize: 13, lineHeight: 18 }}>
            {meta}
          </MFText>
        ) : null}
      </MFStack>
      {right ?? (
        <MFText muted theme={theme} style={{ fontSize: 24, lineHeight: 28 }}>
          {'>'}
        </MFText>
      )}
    </MFRow>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
      {content}
    </Pressable>
  );
}

export function MFSwitch({ onValueChange, theme = defaultTheme, value }: { onValueChange?: (value: boolean) => void; theme?: MFTheme; value: boolean }) {
  return <Switch onValueChange={onValueChange} thumbColor="#FFFFFF" trackColor={{ false: theme.colors.border, true: theme.colors.primary }} value={value} />;
}

export function MFSegmentedControl<TValue extends string>({
  options,
  onChange,
  theme = defaultTheme,
  value
}: {
  onChange: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  theme?: MFTheme;
  value: TValue;
}) {
  return (
    <MFRow gap={6} style={{ backgroundColor: theme.colors.surfaceGlass, borderRadius: theme.radius.md, padding: 6 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: selected ? theme.colors.primarySoft : 'transparent',
              borderRadius: theme.radius.sm,
              flex: 1,
              minHeight: 42,
              justifyContent: 'center',
              opacity: pressed ? 0.82 : 1,
              paddingHorizontal: theme.spacing.sm
            })}
          >
            <MFText theme={theme} style={{ color: selected ? theme.colors.primary : theme.colors.textMuted, fontWeight: '800' }}>
              {option.label}
            </MFText>
          </Pressable>
        );
      })}
    </MFRow>
  );
}

export function MFStatCard({
  label,
  onPress,
  theme = defaultTheme,
  value
}: {
  label: string;
  onPress?: () => void;
  theme?: MFTheme;
  value: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.86 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <MFCard glass theme={theme} style={{ minHeight: 118 }}>
        <MFText theme={theme} style={{ fontWeight: '800' }}>
          {label}
        </MFText>
        <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 32, fontWeight: '900', lineHeight: 40, marginTop: 8 }}>
          {value}
        </MFText>
        <MFText muted theme={theme} style={{ fontSize: 12 }}>
          {label}
        </MFText>
      </MFCard>
    </Pressable>
  );
}

export function MFStatusCard({
  message,
  onPress,
  theme = defaultTheme,
  title,
  tone = 'info'
}: {
  message: string;
  onPress?: () => void;
  theme?: MFTheme;
  title: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
}) {
  const color = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : tone === 'danger' ? theme.colors.danger : theme.colors.info;
  const content = (
    <MFCard glass theme={theme}>
      <MFRow gap={12} style={{ alignItems: 'flex-start' }}>
        <View style={{ backgroundColor: color, borderRadius: 5, height: 10, marginTop: 7, width: 10 }} />
        <MFStack gap={4} style={{ flex: 1 }}>
          <MFText theme={theme} style={{ fontWeight: '900' }}>
            {title}
          </MFText>
          <MFText muted theme={theme} style={{ fontSize: 13, lineHeight: 18 }}>
            {message}
          </MFText>
        </MFStack>
      </MFRow>
    </MFCard>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      {content}
    </Pressable>
  );
}

export function MFKeyValue({
  label,
  theme = defaultTheme,
  value
}: {
  label: string;
  theme?: MFTheme;
  value: ReactNode;
}) {
  return (
    <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <MFCaption theme={theme} style={{ flex: 1 }}>
        {label}
      </MFCaption>
      {typeof value === 'string' || typeof value === 'number' ? (
        <MFText theme={theme} style={{ flex: 1, fontWeight: '800', textAlign: 'right' }}>
          {value}
        </MFText>
      ) : (
        value
      )}
    </MFRow>
  );
}

export function MFProgress({
  label,
  theme = defaultTheme,
  value
}: {
  label?: string;
  theme?: MFTheme;
  value: number;
}) {
  const progress = Math.max(0, Math.min(1, value));

  return (
    <MFStack gap={6}>
      {label ? (
        <MFRow style={{ justifyContent: 'space-between' }}>
          <MFCaption theme={theme}>{label}</MFCaption>
          <MFCaption theme={theme}>{Math.round(progress * 100)}%</MFCaption>
        </MFRow>
      ) : null}
      <View style={{ backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.pill, height: 8, overflow: 'hidden' }}>
        <View style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill, height: 8, width: `${progress * 100}%` }} />
      </View>
    </MFStack>
  );
}

export function MFEmptyState({
  actionLabel,
  message,
  onAction,
  theme = defaultTheme,
  title
}: {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  theme?: MFTheme;
  title: string;
}) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={10} style={{ alignItems: 'center' }}>
        <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
          {title}
        </MFText>
        <MFText muted theme={theme} style={{ textAlign: 'center' }}>
          {message}
        </MFText>
        {actionLabel && onAction ? <MFButton fullWidth={false} onPress={onAction} theme={theme} title={actionLabel} variant="secondary" /> : null}
      </MFStack>
    </MFCard>
  );
}

export function MFToastView({ message, opacity, theme = defaultTheme }: { message: string; opacity: Animated.Value; theme?: MFTheme }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        alignSelf: 'center',
        backgroundColor: 'rgba(19,33,53,0.92)',
        borderRadius: theme.radius.md,
        bottom: 96,
        opacity,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        position: 'absolute',
        zIndex: 20
      }}
    >
      <MFText style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{message}</MFText>
    </Animated.View>
  );
}
