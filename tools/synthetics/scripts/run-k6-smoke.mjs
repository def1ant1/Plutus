import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const reportsDir = resolve(process.cwd(), 'dist', 'reports');
mkdirSync(reportsDir, { recursive: true });
const outputFile = resolve(reportsDir, 'k6-smoke.json');

function runLocalK6() {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  return spawnSync(
    pnpm,
    [
      'exec',
      'k6',
      'run',
      'tools/synthetics/k6/smoke.js',
      '--out',
      `json=${process.env.K6_SMOKE_REPORT ?? outputFile}`,
    ],
    {
      stdio: 'inherit',
    },
  );
}

function runDockerK6() {
  const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
  return spawnSync(
    docker,
    [
      'run',
      '--rm',
      '-v',
      `${process.cwd()}:/work`,
      '-w',
      '/work',
      'grafana/k6:latest',
      'run',
      'tools/synthetics/k6/smoke.js',
      '--out',
      `json=${process.env.K6_SMOKE_REPORT ?? outputFile}`,
    ],
    {
      stdio: 'inherit',
      env: process.env,
    },
  );
}

const whichResult = spawnSync('which', ['k6'], { stdio: 'ignore' });
const result = whichResult.status === 0 ? runLocalK6() : runDockerK6();

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
