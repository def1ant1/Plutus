import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'cypress';

const reportsDir = resolve(process.cwd(), 'dist', 'reports');
mkdirSync(reportsDir, { recursive: true });

export default defineConfig({
  e2e: {
    specPattern: 'tools/synthetics/cypress/e2e/**/*.cy.ts',
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://127.0.0.1:0',
    supportFile: false,
    video: false,
  },
  reporter: 'json',
  reporterOptions: {
    output: process.env.CYPRESS_SMOKE_REPORT ?? resolve(reportsDir, 'cypress-smoke.json'),
  },
  env: {
    OBS_SERVICE_NAME: process.env.OBS_SERVICE_NAME ?? 'portal-web',
  },
});
