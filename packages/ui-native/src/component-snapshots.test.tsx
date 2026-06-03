import React from 'react';
import TestRenderer from 'react-test-renderer';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createTheme } from '@mobile-frame/ui-core';

beforeAll(() => {
  const reactActEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
});

vi.mock('react-native', () => {
  const createHost = (type: string) => {
    const Host = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => React.createElement(type, props, children);
    Host.displayName = type;
    return Host;
  };

  return {
    ActivityIndicator: createHost('ActivityIndicator'),
    Animated: {
      Value: class AnimatedValue {
        value: number;

        constructor(value: number) {
          this.value = value;
        }
      },
      View: createHost('Animated.View')
    },
    Modal: createHost('Modal'),
    Pressable: createHost('Pressable'),
    ScrollView: createHost('ScrollView'),
    Switch: createHost('Switch'),
    Text: createHost('Text'),
    TextInput: createHost('TextInput'),
    View: createHost('View')
  };
});

vi.mock('react-native-safe-area-context', () => {
  const SafeAreaView = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => React.createElement('SafeAreaView', props, children);
  return { SafeAreaView };
});

describe('ui-native component snapshots', () => {
  it('matches the core feedback component snapshot', async () => {
    const { MFBanner, MFButton, MFCard, MFInfoGrid, MFStack } = await import('./index');
    const theme = createTheme('light');

    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <MFStack gap={12}>
          <MFButton theme={theme} title="Primary action" />
          <MFCard theme={theme}>
            <MFBanner message="Snapshot coverage for feedback components." theme={theme} title="Feedback" />
          </MFCard>
          <MFInfoGrid
            items={[
              { label: 'Ready', tone: 'success', value: '4' },
              { label: 'Queued', tone: 'warning', value: '2' }
            ]}
            theme={theme}
          />
        </MFStack>
      );
    });

    expect(tree!.toJSON()).toMatchSnapshot();
  });

  it('matches the navigation and overlay component snapshot', async () => {
    const { MFDialog, MFFilterSheet, MFHeader, MFSheet, MFToast } = await import('./index');
    const theme = createTheme('dark');

    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <>
          <MFHeader eyebrow="Library" subtitle="Snapshot state" theme={theme} title="Components" />
          <MFToast message="Toast preview" theme={theme} />
          <MFSheet body="Sheet body" onClose={() => undefined} theme={theme} title="Sheet" visible />
          <MFDialog
            actions={[{ label: 'Cancel', variant: 'outline' }, { label: 'Confirm' }]}
            body="Dialog body"
            onClose={() => undefined}
            theme={theme}
            title="Dialog"
            visible
          />
          <MFFilterSheet
            onClose={() => undefined}
            options={[
              { count: 3, label: 'Feedback', value: 'feedback' },
              { label: 'Navigation', value: 'navigation' }
            ]}
            selectedValues={['feedback']}
            theme={theme}
            title="Filters"
            visible
          />
        </>
      );
    });

    expect(tree!.toJSON()).toMatchSnapshot();
  });
});
