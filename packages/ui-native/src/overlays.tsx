import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { createTheme, type MFTheme, type MFVariant } from '@mobile-frame/ui-core';

import { MFButton, MFStatusPill, MFTextButton } from './feedback';
import { MFRow, MFStack } from './layout';
import { MFText } from './typography';

const defaultTheme = createTheme('light');

export type MFToastMessage = {
  message: string;
};

export type MFSheetContent = {
  body?: string;
  content?: ReactNode;
  title: string;
};

export type MFSheetProps = MFSheetContent & {
  actionLabel?: string;
  children?: ReactNode;
  onClose: () => void;
  theme?: MFTheme;
  visible: boolean;
};

export type MFDialogAction = {
  label: string;
  onPress?: () => void;
  variant?: MFVariant;
};

export type MFFilterOption<TValue extends string = string> = {
  count?: number;
  label: string;
  value: TValue;
};

export function MFToast({ message, theme = defaultTheme }: MFToastMessage & { theme?: MFTheme }) {
  return (
    <View
      pointerEvents="none"
      style={{
        alignSelf: 'center',
        backgroundColor: 'rgba(19,33,53,0.94)',
        borderRadius: theme.radius.md,
        bottom: 100,
        maxWidth: '86%',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        position: 'absolute',
        zIndex: 30
      }}
    >
      <MFText style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center' }}>{message}</MFText>
    </View>
  );
}

export function MFToastHost({ theme = defaultTheme, toast }: { theme?: MFTheme; toast: MFToastMessage | null }) {
  if (!toast) {
    return null;
  }

  return <MFToast message={toast.message} theme={theme} />;
}

export function MFSheet({
  actionLabel = 'Done',
  body,
  children,
  content,
  onClose,
  theme = defaultTheme,
  title,
  visible
}: MFSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.2)', flex: 1 }} />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            padding: theme.spacing.xl
          }}
        >
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                {title}
              </MFText>
              <Pressable accessibilityRole="button" onPress={onClose}>
                <MFText theme={theme} style={{ color: theme.colors.primary, fontWeight: '900' }}>
                  Close
                </MFText>
              </Pressable>
            </MFRow>
            {body ? (
              <MFText muted theme={theme}>
                {body}
              </MFText>
            ) : null}
            {content ?? children ?? null}
            <MFButton onPress={onClose} theme={theme} title={actionLabel} />
          </MFStack>
        </View>
      </View>
    </Modal>
  );
}

export function MFSheetHost({
  onClose,
  sheet,
  theme = defaultTheme
}: {
  onClose: () => void;
  sheet: MFSheetContent | null;
  theme?: MFTheme;
}) {
  return (
    <MFSheet
      body={sheet?.body}
      content={sheet?.content}
      onClose={onClose}
      theme={theme}
      title={sheet?.title ?? ''}
      visible={sheet !== null}
    />
  );
}

export function MFDialog({
  actions = [],
  body,
  children,
  onClose,
  primaryAction,
  secondaryAction,
  theme = defaultTheme,
  title,
  visible
}: {
  actions?: MFDialogAction[];
  body?: string;
  children?: ReactNode;
  onClose: () => void;
  primaryAction?: MFDialogAction;
  secondaryAction?: MFDialogAction;
  theme?: MFTheme;
  title: string;
  visible: boolean;
}) {
  const resolvedActions = actions.length > 0 ? actions : [secondaryAction, primaryAction].filter((action): action is MFDialogAction => Boolean(action));

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.28)',
          flex: 1,
          justifyContent: 'center',
          padding: theme.spacing.xl
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.xl,
            borderWidth: 1,
            padding: theme.spacing.xl,
            width: '100%'
          }}
        >
          <MFStack gap={16}>
            <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <MFText theme={theme} style={{ flex: 1, fontSize: 20, fontWeight: '900', lineHeight: 26 }}>
                {title}
              </MFText>
              <MFTextButton onPress={onClose} theme={theme} title="Close" />
            </MFRow>
            {body ? (
              <MFText muted theme={theme}>
                {body}
              </MFText>
            ) : null}
            {children}
            {resolvedActions.length > 0 ? (
              <MFStack gap={10}>
                {resolvedActions.map((action, index) => (
                  <MFButton
                    key={`${action.label}-${index}`}
                    onPress={action.onPress ?? onClose}
                    theme={theme}
                    title={action.label}
                    variant={action.variant ?? (index === resolvedActions.length - 1 ? 'primary' : 'outline')}
                  />
                ))}
              </MFStack>
            ) : null}
          </MFStack>
        </View>
      </View>
    </Modal>
  );
}

export function MFFilterSheet<TValue extends string = string>({
  applyLabel = 'Apply',
  children,
  onApply,
  onClose,
  onReset,
  onToggle,
  options = [],
  resetLabel = 'Reset',
  selectedValues = [],
  subtitle,
  theme = defaultTheme,
  title,
  visible
}: {
  applyLabel?: string;
  children?: ReactNode;
  onApply?: () => void;
  onClose: () => void;
  onReset?: () => void;
  onToggle?: (value: TValue) => void;
  options?: Array<MFFilterOption<TValue>>;
  resetLabel?: string;
  selectedValues?: TValue[];
  subtitle?: string;
  theme?: MFTheme;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.2)', flex: 1 }} />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            maxHeight: '82%',
            padding: theme.spacing.xl
          }}
        >
          <MFStack gap={16}>
            <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900', lineHeight: 24 }}>
                  {title}
                </MFText>
                {subtitle ? (
                  <MFText muted theme={theme} style={{ fontSize: 13, lineHeight: 18 }}>
                    {subtitle}
                  </MFText>
                ) : null}
              </MFStack>
              <MFTextButton onPress={onClose} theme={theme} title="Close" />
            </MFRow>
            {options.length > 0 ? (
              <MFStack gap={8}>
                {options.map((option) => {
                  const selected = selectedValues.includes(option.value);
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={option.value}
                      onPress={() => onToggle?.(option.value)}
                      style={({ pressed }) => ({
                        backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surfaceMuted,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        opacity: pressed ? 0.82 : 1,
                        padding: theme.spacing.md
                      })}
                    >
                      <MFRow style={{ justifyContent: 'space-between' }}>
                        <MFText theme={theme} style={{ flex: 1, fontWeight: '800' }}>
                          {option.label}
                        </MFText>
                        <MFRow gap={8}>
                          {typeof option.count === 'number' ? <MFStatusPill label={String(option.count)} status="neutral" theme={theme} /> : null}
                          {selected ? <MFStatusPill label="Selected" status="info" theme={theme} /> : null}
                        </MFRow>
                      </MFRow>
                    </Pressable>
                  );
                })}
              </MFStack>
            ) : null}
            {children}
            <MFRow gap={10}>
              <View style={{ flex: 1 }}>
                <MFButton onPress={onReset} theme={theme} title={resetLabel} variant="outline" />
              </View>
              <View style={{ flex: 1 }}>
                <MFButton onPress={onApply ?? onClose} theme={theme} title={applyLabel} />
              </View>
            </MFRow>
          </MFStack>
        </View>
      </View>
    </Modal>
  );
}
