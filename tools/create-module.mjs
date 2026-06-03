import {
  addTsconfigPathAlias,
  addTsconfigReference,
  createFile,
  getBooleanOption,
  parseCli,
  requireName,
  runCli,
  titleFromName,
  toCamelCase,
  toPascalCase,
  writeFiles
} from './mf-generator-utils.mjs';

const usage = `Usage: pnpm mf:create-module <module-name> [--dry-run]

Creates a business module package under packages/<module-name>.`;

runCli(() => {
  const { options, positional } = parseCli();

  if (options.help) {
    console.log(usage);
    return;
  }

  const moduleName = requireName(positional[0], 'module name');
  const pascal = toPascalCase(moduleName);
  const camel = toCamelCase(moduleName);
  const title = titleFromName(moduleName);
  const dryRun = getBooleanOption(options, 'dryRun');

  writeFiles(
    [
      createFile(
        `packages/${moduleName}/package.json`,
        JSON.stringify(
          {
            name: `@mobile-frame/${moduleName}`,
            version: '0.1.0',
            private: true,
            type: 'module',
            main: 'src/index.ts',
            types: 'src/index.ts',
            dependencies: {
              '@mobile-frame/module-sdk': 'workspace:*',
              react: '19.2.7'
            }
          },
          null,
          2
        )
      ),
      createFile(
        `packages/${moduleName}/tsconfig.json`,
        JSON.stringify(
          {
            extends: '../../tsconfig.base.json',
            compilerOptions: {
              outDir: 'dist',
              tsBuildInfoFile: 'dist/tsconfig.tsbuildinfo'
            },
            include: ['src'],
            references: [{ path: '../module-sdk' }]
          },
          null,
          2
        )
      ),
      createFile(
        `packages/${moduleName}/src/index.ts`,
        `import { defineModule } from '@mobile-frame/module-sdk';

const ${pascal}HomeScreen = () => null;

export const ${camel}Module = defineModule({
  id: '${moduleName}',
  name: '${title}',
  version: '1.0.0',
  routes: [{ name: '${moduleName}.home', screen: ${pascal}HomeScreen }],
  permissions: [],
  capabilities: [],
  navigation: {
    tab: { title: '${title}', icon: '${moduleName}', order: 100 }
  }
});

export default ${camel}Module;`
      )
    ],
    { dryRun }
  );

  addTsconfigReference('tsconfig.json', `./packages/${moduleName}`, { dryRun });
  addTsconfigPathAlias('tsconfig.base.json', `@mobile-frame/${moduleName}`, `packages/${moduleName}/src/index.ts`, { dryRun });
});
