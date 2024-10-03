module.exports = {
  presets: ['module:@react-native/babel-preset', '@babel/preset-env'],
  plugins: ['react-native-reanimated/plugin'],
  env: {
    production: {
      plugins: [
        'transform-remove-console',
        ['@babel/plugin-transform-private-methods', { loose: true }],
      ],
    },
  },
};
