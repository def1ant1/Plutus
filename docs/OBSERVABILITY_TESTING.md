plutus/docs/OBSERVABILITY_TESTING.md
# Observability, Quality, and Release Safety

## Telemetry
- Traces with end-to-end decision path (Intake→KYC→Fraud→Scoring→Decision).
- Metrics: Per-tenant p50/p95, QPS, queue depth, drift, error budgets.
- Logs: PII-redacted structured JSON; sensitive fields hashed/salted.

## Quality Gates
- Consumer-driven contract tests; schema evolution tests.
- Decision replay golden cases; fairness snapshots.
- Chaos/resilience: fault injection, partition tests, latency drills.

## Release Strategy
- Feature flags; per-tenant rollouts; kill switches.
- Canary cells; auto-rollback on SLO breach.
- Model governance: stage→shadow→A/B; KS, AUC, stability, fairness thresholds.
