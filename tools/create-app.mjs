import {
  addTsconfigReference,
  createFilesFromDirectory,
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

const allowedPresets = new Set(['basic', 'dashboard', 'device-agent', 'admin-mobile', 'minimal', 'standard', 'operations']);
const defaultPreset = 'basic';

const usage = `Usage: pnpm mf:create-app <app-name> [--preset basic|dashboard|device-agent|admin-mobile] [--dry-run]

Creates a workspace app under apps/<app-name> and registers it in the root tsconfig.`;

runCli(() => {
  const { options, positional } = parseCli();

  if (options.help) {
    console.log(usage);
    return;
  }

  const appName = requireName(positional[0], 'app name');
  const preset = getStringOption(options, 'preset', defaultPreset);
  const dryRun = getBooleanOption(options, 'dryRun');

  if (!allowedPresets.has(preset)) {
    throw new Error(`Unsupported preset "${preset}". Expected one of: ${Array.from(allowedPresets).join(', ')}`);
  }

  const displayName = titleFromName(appName);
  const registryName = toPascalCase(appName);
  const packageName = `@mobile-frame/${appName}`;
  const appId = `com.misk.${appName.replace(/-/g, '')}`;
  const androidPackagePath = appId.replace(/\./g, '/');

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
              '@mobile-frame/module-sdk': 'workspace:*',
              '@mobile-frame/presets': 'workspace:*',
              '@mobile-frame/screen-templates': 'workspace:*',
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
              { path: '../../packages/module-sdk' },
              { path: '../../packages/presets' },
              { path: '../../packages/screen-templates' },
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

import { appModules } from './modules';
import { AppNavigator } from './navigation';
import { appTheme } from './theme';

const appId = '${appId}';
const displayName = '${displayName}';

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

export default App;`
      ),
      createFile(
        `apps/${appName}/src/navigation/index.tsx`,
        `import { HomeScreen } from '../screens';

export function AppNavigator() {
  return <HomeScreen />;
}`
      ),
      createFile(
        `apps/${appName}/src/screens/index.ts`,
        `export * from './HomeScreen';`
      ),
      createFile(
        `apps/${appName}/src/screens/HomeScreen.tsx`,
        `import { DashboardScreen, ListScreen, SettingsScreen } from '@mobile-frame/screen-templates';

import { appHomeState, appPreset, appTabs } from '../store';
import { appTheme } from '../theme';

const title = '${displayName}';

export function HomeScreen() {
  if (appPreset.name === 'basic' || appPreset.name === 'minimal' || appPreset.name === 'standard') {
    return (
      <SettingsScreen
        groups={[
          {
            rows: appHomeState.featureRows,
            title: 'Enabled features'
          }
        ]}
        subtitle={appPreset.description}
        theme={appTheme}
        title={title}
      />
    );
  }

  if (appPreset.name === 'admin-mobile') {
    return (
      <ListScreen
        eyebrow="Admin"
        items={appHomeState.moduleRows}
        subtitle={appPreset.description}
        theme={appTheme}
        title={title}
      />
    );
  }

  return (
    <DashboardScreen
      banner={{ message: appPreset.description, title: appPreset.name }}
      quickActions={appHomeState.quickActions}
      summary={appHomeState.summary}
      theme={appTheme}
      title={title}
      actions={appTabs.map((tab) => ({ label: tab.label, variant: 'ghost' }))}
    />
  );
}

export default HomeScreen;`
      ),
      createFile(
        `apps/${appName}/src/modules/index.ts`,
        `import { defineModule } from '@mobile-frame/module-sdk';

import { appPreset, appTabs } from '../store';

const GeneratedModuleScreen = () => null;

export const appModules = appPreset.modules.map((moduleName, index) => {
  const tab = appTabs[index];
  return defineModule({
    id: moduleName,
    name: toTitle(moduleName),
    version: '1.0.0',
    routes: [{ name: \`\${moduleName}.home\`, screen: GeneratedModuleScreen }],
    permissions: [],
    capabilities: [\`preset.\${appPreset.name}\`],
    navigation: {
      tab: {
        icon: moduleName,
        order: tab?.order ?? index + 1,
        title: tab?.label ?? toTitle(moduleName)
      }
    }
  });
});

function toTitle(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}`
      ),
      createFile(
        `apps/${appName}/src/store/index.ts`,
        `import { getPreset } from '@mobile-frame/presets';

type SummaryTone = 'info' | 'success' | 'warning';

export const appPreset = getPreset('${preset}');

export const appTabs = appPreset.tabs.map((label, index) => ({
  label,
  order: index + 1
}));

export const appHomeState = {
  featureRows: appPreset.features.map((feature) => ({
    description: 'Enabled by the selected preset.',
    enabled: true,
    title: feature
  })),
  moduleRows: appPreset.modules.map((moduleName) => ({
    badge: 'Module',
    meta: \`Generated from the \${appPreset.name} preset.\`,
    title: moduleName
  })),
  quickActions: appPreset.tabs.map((tab) => ({
    label: tab,
    variant: 'secondary' as const
  })),
  summary: appPreset.features.slice(0, 4).map((feature, index) => ({
    label: feature,
    tone: getSummaryTone(index),
    value: String(index + 1)
  }))
};

function getSummaryTone(index: number): SummaryTone {
  if (index === 0) {
    return 'success';
  }

  if (index === 1) {
    return 'warning';
  }

  return 'info';
}`
      ),
      createFile(
        `apps/${appName}/src/theme/index.ts`,
        `import { createTheme } from '@mobile-frame/ui-core';

export const appTheme = createTheme('light');`
      ),
      ...createFilesFromDirectory('apps/showcase/android', `apps/${appName}/android`, {
        transformPath: (relativePath) => relativePath.replace('app/src/main/java/com/misk/mobileframe', `app/src/main/java/${androidPackagePath}`),
        transformText: (text, relativePath) => {
          const appNameReplacement = relativePath.endsWith('res/values/strings.xml') ? displayName : registryName;
          return replaceAll(replaceAll(text, 'com.misk.mobileframe', appId), 'MobileFrame', appNameReplacement);
        }
      }),
      ...createFilesFromDirectory('apps/showcase/ios', `apps/${appName}/ios`, {
        transformPath: (relativePath) =>
          relativePath
            .split('/')
            .map((part) => replaceAll(part, 'MobileFrame', registryName))
            .join('/'),
        transformText: (text, relativePath) => {
          const displayNameText =
            relativePath === 'MobileFrame/Info.plist'
              ? text.replace('<key>CFBundleDisplayName</key>\n\t<string>MobileFrame</string>', `<key>CFBundleDisplayName</key>\n\t<string>${displayName}</string>`)
              : text;

          return replaceAll(replaceAll(displayNameText, 'com.misk.mobileframe', appId), 'MobileFrame', registryName);
        }
      })
    ],
    { dryRun }
  );

  addTsconfigReference('tsconfig.json', `./apps/${appName}`, { dryRun });
});

function replaceAll(value, search, replacement) {
  return value.split(search).join(replacement);
}
