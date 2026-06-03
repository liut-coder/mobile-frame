import {
  addTsconfigReference,
  createFile,
  getBooleanOption,
  getStringOption,
  parseCli,
  requireName,
  runCli,
  toPascalCase,
  titleFromName,
  writeFiles
} from './mf-generator-utils.mjs';

const allowedPresets = new Set(['minimal', 'standard', 'operations']);

const usage = `Usage: pnpm mf:create-app <app-name> [--preset minimal|standard|operations] [--dry-run]

Creates a workspace app under apps/<app-name> and registers it in the root tsconfig.`;

runCli(() => {
  const { options, positional } = parseCli();

  if (options.help) {
    console.log(usage);
    return;
  }

  const appName = requireName(positional[0], 'app name');
  const preset = getStringOption(options, 'preset', 'standard');
  const dryRun = getBooleanOption(options, 'dryRun');

  if (!allowedPresets.has(preset)) {
    throw new Error(`Unsupported preset "${preset}". Expected one of: ${Array.from(allowedPresets).join(', ')}`);
  }

  const displayName = titleFromName(appName);
  const registryName = toPascalCase(appName);
  const packageName = `@mobile-frame/${appName}`;
  const appId = `com.misk.${appName.replace(/-/g, '')}`;

  writeFiles(
    [
      createFile(
        `apps/${appName}/package.json`,
        JSON.stringify(
          {
            name: packageName,
            version: '0.1.0',
            private: true,
            type: 'module',
            main: 'index.js',
            dependencies: {
              '@mobile-frame/app-shell': 'workspace:*',
              '@mobile-frame/presets': 'workspace:*',
              '@mobile-frame/ui-core': 'workspace:*',
              '@mobile-frame/ui-native': 'workspace:*',
              react: '19.2.7',
              'react-native': '0.85.3'
            }
          },
          null,
          2
        )
      ),
      createFile(
        `apps/${appName}/app.json`,
        JSON.stringify(
          {
            name: registryName,
            displayName
          },
          null,
          2
        )
      ),
      createFile(
        `apps/${appName}/index.js`,
        `import { AppRegistry } from 'react-native';

import App from './src';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);`
      ),
      createFile(
        `apps/${appName}/tsconfig.json`,
        JSON.stringify(
          {
            extends: '../../tsconfig.base.json',
            compilerOptions: {
              jsx: 'react-jsx',
              outDir: 'dist',
              tsBuildInfoFile: 'dist/tsconfig.tsbuildinfo'
            },
            include: ['src'],
            references: [
              { path: '../../packages/app-shell' },
              { path: '../../packages/presets' },
              { path: '../../packages/ui-core' },
              { path: '../../packages/ui-native' }
            ]
          },
          null,
          2
        )
      ),
      createFile(`apps/${appName}/src/index.ts`, "export { App as default } from './App';"),
      createFile(
        `apps/${appName}/src/App.tsx`,
        `import { useMemo } from 'react';

import { createAppConfig, MFAppProvider } from '@mobile-frame/app-shell';
import { getPreset } from '@mobile-frame/presets';
import { createTheme } from '@mobile-frame/ui-core';
import { MFBadge, MFCard, MFHeading, MFListItem, MFScrollPage, MFStack, MFText } from '@mobile-frame/ui-native';

const theme = createTheme('light');
const preset = getPreset('${preset}');

export function App() {
  const config = useMemo(
    () =>
      createAppConfig({
        appId: '${appId}',
        displayName: '${displayName}',
        theme
      }),
    []
  );

  return (
    <MFAppProvider config={config}>
      <MFScrollPage theme={theme}>
        <MFStack gap={18}>
          <MFBadge label={preset.name} theme={theme} />
          <MFHeading theme={theme}>${displayName}</MFHeading>
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

export default App;`
      )
    ],
    { dryRun }
  );

  addTsconfigReference('tsconfig.json', `./apps/${appName}`, { dryRun });
});
