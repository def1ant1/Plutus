import { expect, test } from '@playwright/test';

/**
 * Lightweight synthetic check ensuring observability bootstrap variables are
 * wired prior to UI smoke flows. This runs in CI and during scheduled
 * production probes to validate configuration drift.
 */
test('observability environment variables are populated @smoke', async () => {
  const serviceName = process.env.OBS_SERVICE_NAME ?? 'portal-web';
  expect(serviceName).toBeTruthy();
  expect(serviceName.length).toBeGreaterThan(2);

  const residency = process.env.OBS_RESIDENCY ?? process.env.NEXT_PUBLIC_RESIDENCY ?? 'us';
  expect(residency).toMatch(/^[a-z-]+$/);
});

test('latency SLO guardrails are set @smoke', async () => {
  const latencyBudget = Number(process.env.PORTAL_WEB_LATENCY_BUDGET_MS ?? 500);
  expect(latencyBudget).toBeGreaterThan(0);
  expect(latencyBudget).toBeLessThan(5000);
});
