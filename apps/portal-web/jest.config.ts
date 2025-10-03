import nextJest from 'next/jest.js';

/**
 * Configure Jest for the portal web application leveraging Next.js aware defaults
 * while still allowing project-level overrides. The async factory returned by
 * `nextJest` is exported directly to preserve proper typings during Next's
 * production build phase while keeping the emitted type surface minimal for
 * downstream consumers.
 */
const createJestConfig = nextJest({
  dir: __dirname,
});

const config = {
  displayName: 'portal-web',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/portal-web',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
};

const jestConfig: unknown = createJestConfig(config);

export default jestConfig;
