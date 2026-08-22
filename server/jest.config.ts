import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // ts-jest transform config — inherit tsconfig but relax strict for test files
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { strict: false } }],
  },
  // Each test file gets a fresh module registry so Map state doesn't bleed
  resetModules: true,
  clearMocks: true,
};

export default config;
