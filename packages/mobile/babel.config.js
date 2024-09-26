module.exports = {
  presets: ['module:@react-native/babel-preset', '@babel/preset-typescript'],
  plugins: ['react-native-reanimated/plugin'],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
