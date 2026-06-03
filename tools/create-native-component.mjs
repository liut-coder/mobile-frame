import { appendLine, createFile, getBooleanOption, parseCli, requireName, runCli, toPascalCase, writeFiles } from './mf-generator-utils.mjs';

const usage = `Usage: pnpm mf:create-native-component <component-name> [--dry-run]

Creates a typed native component adapter under packages/ui-native/src/native-components.`;

runCli(() => {
  const { options, positional } = parseCli();

  if (options.help) {
    console.log(usage);
    return;
  }

  const componentInput = requireName(positional[0], 'native component name');
  const dryRun = getBooleanOption(options, 'dryRun');
  const pascal = toPascalCase(componentInput);
  const baseName = pascal.startsWith('Native') ? pascal.slice('Native'.length) : pascal;
  const componentName = `Native${baseName}`;

  writeFiles(
    [
      createFile(
        `packages/ui-native/src/native-components/${componentName}.tsx`,
        `import { requireNativeComponent, type ViewProps } from 'react-native';

export type ${componentName}Props = ViewProps & {
  disabled?: boolean;
  label?: string;
};

const MF${baseName}View = requireNativeComponent<${componentName}Props>('MF${baseName}');

export function ${componentName}(props: ${componentName}Props) {
  return <MF${baseName}View {...props} />;
}`
      )
    ],
    { dryRun }
  );

  appendLine('packages/ui-native/src/index.ts', `export * from './native-components/${componentName}';`, { dryRun });
});
