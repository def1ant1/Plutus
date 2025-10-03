import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

const reportsDir = resolve(process.cwd(), 'dist', 'reports');
mkdirSync(reportsDir, { recursive: true });

export default defineConfig({
  testDir: resolve(__dirname, 'tests'),
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile:
          process.env.PLAYWRIGHT_JSON_OUTPUT ?? resolve(reportsDir, 'playwright-smoke.json'),
      },
    ],
  ],
  grep: /@smoke/,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:0',
    trace: 'off',
  },
});
