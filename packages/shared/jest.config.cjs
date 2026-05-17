/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@wayra/types$': '<rootDir>/../types/src/index.ts',
    '^@wayra/types/(.*)$': '<rootDir>/../types/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
};
