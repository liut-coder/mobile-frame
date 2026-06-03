const path = require('node:path');

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const appRoot = __dirname;
const workspaceRoot = path.resolve(appRoot, '../..');
const defaultConfig = getDefaultConfig(appRoot);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    nodeModulesPaths: [path.join(appRoot, 'node_modules'), path.join(workspaceRoot, 'node_modules')]
  },
  watchFolders: [workspaceRoot]
});
