import { appendLine, createFile, getBooleanOption, parseCli, requireName, runCli, titleFromName, toCamelCase, writeFiles } from './mf-generator-utils.mjs';

const usage = `Usage: pnpm mf:create-preset <preset-name> [--dry-run]

Creates a typed preset extension under packages/presets/src/generated. Generated presets are exported for review before being promoted into the built-in preset registry.`;

runCli(() => {
  const { options, positional } = parseCli();

  if (options.help) {
    console.log(usage);
    return;
  }

  const presetName = requireName(positional[0], 'preset name');
  const camel = toCamelCase(presetName);
  const title = titleFromName(presetName);
  const dryRun = getBooleanOption(options, 'dryRun');
  const fileName = camel;

  writeFiles(
    [
      createFile(
        `packages/presets/src/generated/${fileName}.ts`,
        `import type { MFPresetDefinition } from '../index';

export const ${camel}Preset = {
  name: '${presetName}',
  description: '${title} generated preset. Promote this file into mfPresets when it should be selectable by create-app.',
  entryScreen: 'DashboardScreen',
  modules: ['dashboard', 'settings'],
  features: ['theme', 'routing', 'dashboard'],
  screens: ['DashboardScreen', 'SettingsScreen'],
  tabs: ['Overview', 'Settings']
} satisfies MFPresetDefinition<'${presetName}'>;`
      )
    ],
    { dryRun }
  );

  appendLine('packages/presets/src/generated/index.ts', `export * from './${fileName}';`, { create: true, dryRun });
  appendLine('packages/presets/src/index.ts', "export * from './generated';", { dryRun });
});
