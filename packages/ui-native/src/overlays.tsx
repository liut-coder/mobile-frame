import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { createTheme, type MFTheme } from '@mobile-frame/ui-core';

import { MFButton } from './feedback';
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

export function MFToastHost({ theme = defaultTheme, toast }: { theme?: MFTheme; toast: MFToastMessage | null }) {
  if (!toast) {
    return null;
  }

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
      <MFText style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center' }}>{toast.message}</MFText>
    </View>
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
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={sheet !== null}>
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
                {sheet?.title ?? ''}
              </MFText>
              <Pressable accessibilityRole="button" onPress={onClose}>
                <MFText theme={theme} style={{ color: theme.colors.primary, fontWeight: '900' }}>
                  Close
                </MFText>
              </Pressable>
            </MFRow>
            {sheet?.body ? (
              <MFText muted theme={theme}>
                {sheet.body}
              </MFText>
            ) : null}
            {sheet?.content ?? null}
            <MFButton onPress={onClose} theme={theme} title="Done" />
          </MFStack>
        </View>
      </View>
    </Modal>
  );
}
