# Chaos Drill Runbook

## Objectives
Validate that resiliency guardrails hold under pod termination and cross-residency latency events defined in `chaos/experiments/*`.

## Preparation
- Confirm latest `main` branch with validated experiments (`pnpm nx run chaos:validate`).
- Schedule drill with Observability + Platform teams; ensure rollback approvers present.
- Export baseline metrics from dashboards (`dashboards/core.json`, `dashboards/experience.json`).

## Execution Steps
1. **Announce** start in #chaos-channel with drill ID, scope, and success criteria.
2. **Apply experiment** using preferred orchestrator (e.g., `kubectl apply -f chaos/experiments/orchestrator-pod-kill.yaml`).
3. **Monitor**:
   - Synthetic probes via `pnpm nx run synthetics:playwright` and `pnpm nx run synthetics:k6`.
   - Grafana dashboards for SLO adherence.
   - Logs/traces in observability backend to ensure tenant/residency attributes present.
4. **Record** event timestamps, metrics impacts, and any anomalies.
5. **Rollback**:
   - If SLO breach thresholds hit, execute automated rollback referenced in experiment annotation (`runbook.plutus.dev/rollback`).
   - Otherwise, remove experiment: `kubectl delete -f <experiment-file>`.

## Post-Drill Activities
- Upload resulting reports (`dist/reports/*.json`) and chaos manifests to evidence store.
- Update `docs/OBSERVABILITY_TESTING.md` if thresholds adjusted.
- File follow-up backlog items for remediation or automation gaps.

## Escalation
- Observability Guild for instrumentation issues.
- Platform SRE for Kubernetes or network anomalies.
- Product Owner for approval to adjust SLO/SLI definitions.
