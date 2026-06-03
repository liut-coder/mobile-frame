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

const allowedTypes = new Set(['list', 'detail', 'editor', 'dashboard', 'fullscreen', 'settings']);

const usage = `Usage: pnpm mf:create-screen <module-name> <screen-name> [--type list|detail|editor|dashboard|fullscreen|settings] [--dry-run]

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
  const title = titleFromName(screenInput);

  writeFiles(
    [
      createFile(
        `packages/${moduleName}/src/screens/${componentName}.tsx`,
        `import { MFCard, MFHeading, MFListItem, MFScrollPage, MFStack, MFText } from '@mobile-frame/ui-native';

export type ${componentName}Props = {
  title?: string;
};

export function ${componentName}({ title = '${title}' }: ${componentName}Props) {
  return (
    <MFScrollPage>
      <MFStack gap={18}>
        <MFHeading>{title}</MFHeading>
        <MFText muted>${screenType} screen scaffold generated for ${moduleName}.</MFText>
        <MFCard padded={false}>
          {['Overview', 'Activity', 'Settings'].map((item) => (
            <MFListItem key={item} meta="${screenType} item" title={item} />
          ))}
        </MFCard>
      </MFStack>
    </MFScrollPage>
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
      '@mobile-frame/ui-native': 'workspace:*',
      react: '19.2.7',
      'react-native': '0.85.3'
    },
    { dryRun }
  );
  addTsconfigReference(`packages/${moduleName}/tsconfig.json`, '../ui-native', { dryRun });
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
