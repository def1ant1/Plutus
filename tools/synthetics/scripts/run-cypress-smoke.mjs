import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const reportsDir = resolve(process.cwd(), 'dist', 'reports');
mkdirSync(reportsDir, { recursive: true });

const outputFile = resolve(reportsDir, 'cypress-smoke.json');
const result = spawnSync(
  pnpm,
  [
    'exec',
    'cypress',
    'run',
    '--config-file',
    'tools/synthetics/cypress.config.ts',
    '--spec',
    'tools/synthetics/cypress/e2e/smoke.cy.ts',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      CYPRESS_SMOKE_REPORT: process.env.CYPRESS_SMOKE_REPORT ?? outputFile,
    },
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
