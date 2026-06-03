import { appendLine, createFile, getBooleanOption, parseCli, requireName, runCli, toCamelCase, toPascalCase, writeFiles } from './mf-generator-utils.mjs';

const usage = `Usage: pnpm mf:create-native-module <module-name> [--dry-run]

Creates a typed native module adapter under packages/ui-native/src/native-modules.`;

runCli(() => {
  const { options, positional } = parseCli();

  if (options.help) {
    console.log(usage);
    return;
  }

  const moduleInput = requireName(positional[0], 'native module name');
  const dryRun = getBooleanOption(options, 'dryRun');
  const pascal = toPascalCase(moduleInput);
  const baseName = pascal.endsWith('Module') ? pascal.slice(0, -'Module'.length) : pascal;
  const camel = toCamelCase(baseName);
  const fileName = `${baseName}Module`;

  writeFiles(
    [
      createFile(
        `packages/ui-native/src/native-modules/${fileName}.ts`,
        `import { NativeModules, Platform } from 'react-native';

import { createError, ok, type MFResult } from '@mobile-frame/core';

export type ${baseName}PingResult = {
  module: string;
  platform: string;
};

export type ${fileName}Shape = {
  ping?: () => Promise<${baseName}PingResult>;
};

const nativeModule = NativeModules.MF${baseName}Module as ${fileName}Shape | undefined;

export async function ping${baseName}(): Promise<MFResult<${baseName}PingResult>> {
  if (!nativeModule?.ping) {
    return {
      ok: false,
      error: createError('${moduleInput}', 'E_NATIVE_MODULE_UNAVAILABLE', 'Native module is not linked on this platform.', {
        details: { platform: Platform.OS },
        recoverable: true
      })
    };
  }

  return ok(await nativeModule.ping());
}

export const ${camel}Module = {
  ping: ping${baseName}
};`
      )
    ],
    { dryRun }
  );

  appendLine('packages/ui-native/src/index.ts', `export * from './native-modules/${fileName}';`, { dryRun });
});
