import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/libs', '<rootDir>/services'],
  moduleNameMapper: {
    '^@plutus/config$': '<rootDir>/libs/config/src/index.ts',
    '^@plutus/config/(.*)$': '<rootDir>/libs/config/src/$1',
    '^@plutus/security$': '<rootDir>/libs/security/src/index.ts',
    '^@plutus/security/(.*)$': '<rootDir>/libs/security/src/$1',
    '^@plutus/iam$': '<rootDir>/services/iam-svc/src/index.ts',
    '^@plutus/iam/(.*)$': '<rootDir>/services/iam-svc/src/$1'
  }
};

export default config;
