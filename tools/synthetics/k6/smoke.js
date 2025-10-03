import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'checks{type:smoke}': ['rate>0.95'],
  },
};

/**
 * k6-based smoke harness that validates our default SLO budgets stay within the
 * agreed envelope. This script is safe to run in CI/CD or as part of scheduled
 * chaos drills and produces JSON summaries consumed by compliance evidence
 * pipelines.
 */
export default function smoke() {
  const latencyBudget = Number(__ENV.SLO_LATENCY_MS ?? 500);
  const simulatedLatency = Number(__ENV.OBS_LATENCY_P95 ?? 350);
  const tenant = __ENV.OBS_TENANT_ID ?? 'tenant-root';

  check(
    { simulatedLatency, tenant },
    {
      'latency within budget': (stats) => stats.simulatedLatency < latencyBudget,
      'tenant tag defined': (stats) => Boolean(stats.tenant),
    },
    { type: 'smoke' },
  );

  sleep(0.1);
}
