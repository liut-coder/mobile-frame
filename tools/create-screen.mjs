import {
  addPackageDependencies,
  addTsconfigReference,
  appendLine,
  assertDirectory,
  createFile,
  getBooleanOption,
  getStringOption,
  parseCli,
  requireName,
  runCli,
  titleFromName,
  toPascalCase,
  updateJson,
  writeFiles
} from './mf-generator-utils.mjs';

const screenTemplates = {
  blank: 'BlankScreen',
  dashboard: 'DashboardScreen',
  detail: 'DetailScreen',
  editor: 'DetailScreen',
  empty: 'EmptyStateScreen',
  error: 'ErrorStateScreen',
  fullscreen: 'BlankScreen',
  'installed-apps': 'InstalledAppsScreen',
  list: 'ListScreen',
  loading: 'LoadingScreen',
  permission: 'PermissionScreen',
  settings: 'SettingsScreen'
};

const allowedTypes = new Set(Object.keys(screenTemplates));

const usage = `Usage: pnpm mf:create-screen <module-name> <screen-name> [--type blank|dashboard|list|detail|settings|permission|installed-apps|empty|error|loading] [--dry-run]

Creates a screen under packages/<module-name>/src/screens. Run mf:create-module first when the module package does not exist.`;

runCli(() => {
  const { options, positional } = parseCli();

  if (options.help) {
    console.log(usage);
    return;
  }

  const moduleName = requireName(positional[0], 'module name');
  const screenInput = positional[1];
  if (!screenInput) {
    throw new Error('Missing screen name.');
  }

  const screenType = getStringOption(options, 'type', 'list');
  const dryRun = getBooleanOption(options, 'dryRun');

  if (!allowedTypes.has(screenType)) {
    throw new Error(`Unsupported screen type "${screenType}". Expected one of: ${Array.from(allowedTypes).join(', ')}`);
  }

  assertDirectory(`packages/${moduleName}`);

  const screenName = toPascalCase(screenInput);
  const componentName = `${screenName}Screen`;
  const templateName = screenTemplates[screenType];
  const title = titleFromName(screenInput);

  writeFiles(
    [
      createFile(
        `packages/${moduleName}/src/screens/${componentName}.tsx`,
        `import { ${templateName} } from '@mobile-frame/screen-templates';

export type ${componentName}Props = {
  title?: string;
};

export function ${componentName}({ title = '${title}' }: ${componentName}Props) {
  return (
    <${templateName}
      eyebrow="Generated"
      subtitle="${screenType} screen scaffold generated for ${moduleName}."
      title={title}
    />
  );
}

export default ${componentName};`
      )
    ],
    { dryRun }
  );

  appendLine(`packages/${moduleName}/src/screens/index.ts`, `export * from './${componentName}';`, { create: true, dryRun });
  appendLine(`packages/${moduleName}/src/index.ts`, "export * from './screens';", { dryRun });
  addPackageDependencies(
    `packages/${moduleName}/package.json`,
    {
      '@mobile-frame/screen-templates': 'workspace:*',
      react: '19.2.7',
      'react-native': '0.85.3'
    },
    { dryRun }
  );
  addTsconfigReference(`packages/${moduleName}/tsconfig.json`, '../screen-templates', { dryRun });
  updateJson(
    `packages/${moduleName}/tsconfig.json`,
    (config) => {
      config.compilerOptions = config.compilerOptions ?? {};
      config.compilerOptions.jsx = 'react-jsx';
      return config;
    },
    { dryRun }
  );
});
