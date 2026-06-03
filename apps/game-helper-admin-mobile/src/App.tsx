import { useMemo } from 'react';

import { createAppConfig, MFAppProvider } from '@mobile-frame/app-shell';
import { getPreset } from '@mobile-frame/presets';
import { createTheme } from '@mobile-frame/ui-core';
import { MFBadge, MFCard, MFHeading, MFListItem, MFScrollPage, MFStack, MFText } from '@mobile-frame/ui-native';

const theme = createTheme('light');
const preset = getPreset('admin-mobile');

export function App() {
  const config = useMemo(
    () =>
      createAppConfig({
        appId: 'com.misk.gamehelperadminmobile',
        displayName: 'Game Helper Admin Mobile',
        theme
      }),
    []
  );

  return (
    <MFAppProvider config={config}>
      <MFScrollPage theme={theme}>
        <MFStack gap={18}>
          <MFBadge label={preset.name} theme={theme} />
          <MFHeading theme={theme}>Game Helper Admin Mobile</MFHeading>
          <MFText muted theme={theme}>
            {preset.description}
          </MFText>
          <MFCard padded={false} theme={theme}>
            {preset.features.map((feature) => (
              <MFListItem key={feature} meta="Enabled by the selected preset" theme={theme} title={feature} />
            ))}
          </MFCard>
        </MFStack>
      </MFScrollPage>
    </MFAppProvider>
  );
}

export default App;
