const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// console.log('metro.config.js', path.resolve(__dirname, '../../node_modules'));
const config = {
  projectRoot: __dirname,
  watchFolders: [path.resolve(__dirname, '../../'), path.resolve(__dirname, '../../packages')],
  resolver: {
    extraNodeModules: {
      // 'feed-app-common': path.resolve(__dirname, '../../packages/common'),
      'homebase-id-app-common': path.resolve(__dirname, '../../packages/common'),
      '@react-native-community/netinfo': path.resolve(
        __dirname,
        '../../node_modules/@react-native-community/netinfo'
      ),
    },
    resetCache: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
