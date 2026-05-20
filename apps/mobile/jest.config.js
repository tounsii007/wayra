/** @type {import('jest').Config} */
module.exports = {
  // Run the store / pure-logic tests in plain Node with ts-jest.  We avoid
  // the full jest-expo / RN preset because (a) we don't need RN for these
  // tests and (b) the RN Flow-syntax breaks Jest without extra Babel config.
  // Anything that genuinely needs the RN runtime should go through Detox /
  // Maestro E2E rather than Jest.
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  moduleNameMapper: {
    // Mock the AsyncStorage-backed storage adapter so the Zustand persist
    // middleware works without pulling in React Native.
    '^.+/storage$': '<rootDir>/src/__tests__/__mocks__/storage.ts',
    // Workspace packages
    '^@wayra/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@wayra/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
    '^@wayra/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};
