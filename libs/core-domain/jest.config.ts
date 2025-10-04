import type { Config } from 'jest';
import rootConfig from '../../jest.config';

const config: Config = {
  ...rootConfig,
  displayName: 'core-domain',
  rootDir: __dirname,
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    ...(rootConfig.moduleNameMapper ?? {}),
    '^@plutus/core-domain$': '<rootDir>/src/index.ts',
    '^@plutus/core-domain/(.*)$': '<rootDir>/src/$1',
  },
  coverageDirectory: '../../coverage/libs/core-domain',
};

export default config;
