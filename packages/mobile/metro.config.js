const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const config = {
  projectRoot: path.resolve(__dirname, '../../'),
  resolver: {
    resetCache: true,
  },
};

// resolveRequest = (context, moduleName, platform) => {
//   // console.log('resolving', moduleName);

//   if (moduleName === 'buffer') {
//     // when importing crypto, resolve to react-native-quick-crypto
//     return context.resolveRequest(
//       context,
//       '@craftzdog/react-native-buffer',
//       platform,
//     );
//   }

//   if (moduleName === 'stream') {
//     // when importing crypto, resolve to react-native-quick-crypto
//     return context.resolveRequest(context, 'stream-browserify', platform);
//   }

//   if (moduleName === 'crypto') {
//     // when importing crypto, resolve to react-native-quick-crypto
//     return context.resolveRequest(
//       context,
//       'react-native-quick-crypto',
//       platform,
//     );
//   }

//   // otherwise chain to the standard Metro resolver.
//   return context.resolveRequest(context, moduleName, platform);
// };

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
