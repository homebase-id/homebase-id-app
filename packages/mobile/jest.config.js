module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // transformIgnorePatterns: ['node_modules'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@homebase-id|@tanstack/react-query)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*.test.ts'],
};
