import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const reportsDir = resolve(process.cwd(), 'dist', 'reports');
mkdirSync(reportsDir, { recursive: true });

const outputFile = resolve(reportsDir, 'playwright-smoke.json');
const result = spawnSync(
  pnpm,
  [
    'exec',
    'playwright',
    'test',
    '--config',
    'tools/synthetics/playwright.config.ts',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT: process.env.PLAYWRIGHT_JSON_OUTPUT ?? outputFile,
    },
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
