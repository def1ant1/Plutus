import { waitForPortOpen } from '@nx/node/utils';

declare global {
  // eslint-disable-next-line no-var
  var __TEARDOWN_MESSAGE__: string | undefined;
}

/**
 * Jest global setup hook that waits for the orchestrator service to expose its port
 * before the contract/e2e harness exercises HTTP flows.
 */
const globalSetup = async (): Promise<void> => {
  console.log('\nSetting up...\n');

  const host = process.env['HOST'] ?? 'localhost';
  const port = process.env['PORT'] ? Number(process.env['PORT']) : 3000;
  try {
    await waitForPortOpen(port, { host, retries: 5, retryDelay: 500 });
  } catch {
    console.warn(
      `Skipping port wait after retries failed for ${host}:${port} - assuming mocked service context.`,
    );
  }

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};

export default globalSetup;
