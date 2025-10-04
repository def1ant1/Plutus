import type { Config } from 'jest';
import rootConfig from '../../jest.config';

const config: Config = {
  ...rootConfig,
  displayName: 'config',
  rootDir: __dirname,
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts', '**/__tests__/**/*.ts'],
  moduleNameMapper: {
    ...(rootConfig.moduleNameMapper ?? {}),
    '^@plutus/config$': '<rootDir>/src/index.ts',
    '^@plutus/config/(.*)$': '<rootDir>/src/$1'
  },
  coverageDirectory: '../../coverage/libs/config'
};

export default config;
