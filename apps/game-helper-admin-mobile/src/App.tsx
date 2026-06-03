import { useMemo } from 'react';

import { createAppConfig, MFAppProvider } from '@mobile-frame/app-shell';

import { appModules } from './modules';
import { AppNavigator } from './navigation';
import { appTheme } from './theme';

const appId = 'com.misk.gamehelperadminmobile';
const displayName = 'Game Helper Admin Mobile';

export function App() {
  const config = useMemo(
    () =>
      createAppConfig({
        appId,
        displayName,
        modules: appModules,
        theme: appTheme
      }),
    []
  );

  return (
    <MFAppProvider config={config}>
      <AppNavigator />
    </MFAppProvider>
  );
}

export default App;
