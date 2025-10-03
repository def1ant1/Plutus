# Observability, Quality, and Release Safety

## Telemetry
- Traces with end-to-end decision path (Intake→KYC→Fraud→Scoring→Decision) published via OTLP with residency + tenant tags on every span.
- Metrics: Per-tenant p50/p95, QPS, queue depth, drift, error budgets, exported through OTLP and Prometheus scrape endpoints.
- Logs: PII-redacted structured JSON; sensitive fields hashed/salted and redaction lists centrally managed in `@plutus/observability`.

## Default Service Level Objectives
| SLO | Target | Alerting Window | Notes |
| --- | --- | --- | --- |
| Portal Web latency (p95) | ≤ 500ms | 5m rolling | Powered by synthetic Playwright + k6 probes. |
| Orchestrator workflow completion | ≥ 99.5% | 1h rolling | Derived from span counts + business metrics. |
| IAM auth success | ≥ 99.9% | 15m rolling | Alerts when tenant or residency tags trend down. |
| Error budget consumption | ≤ 25% per 30d | 30d | Combines logs + traces to enforce slow burn protection. |

## Dashboards & Automation Hooks
- `dashboards/core.json`: Grafana layout stitching traces/logs/metrics by tenant/residency.
- `dashboards/experience.json`: Web vitals, LCP, CLS, and synthetic journey timings; overlays chaos events from `chaos/experiments/*`.
- `dashboards/identity.json`: OIDC latency, token issuance rate, ABAC decision counts.
- Each dashboard expects metrics from `@plutus/observability` exporters; add new panels via PRs referencing the exporter resource attributes.

## Synthetic Health Checks & Smoke Tests
- Nx targets:
  - `pnpm nx run synthetics:playwright` → verifies telemetry env wiring before UI deploys.
  - `pnpm nx run synthetics:cypress` → validates redaction lists and edge smoke flows.
  - `pnpm nx run synthetics:k6` → asserts latency/error budgets and emits JSON evidence (requires `k6` binary or Docker with `grafana/k6:latest`).
- Reports land in `dist/reports/*.json` for compliance archives.

## Chaos Experiment Templates
- Templates live under `chaos/experiments/*.yaml` and are validated via `pnpm nx run chaos:validate`.
- Required metadata:
  - `metadata.labels.observability.plutus.dev/slo` → binds to SLO dashboards.
  - `metadata.annotations.runbook.plutus.dev/execute` → points to drill instructions.
  - `metadata.annotations.runbook.plutus.dev/rollback` → ties to automated rollback criteria.
- Current scenarios:
  - `orchestrator-pod-kill.yaml` → kills one orchestrator pod for 30s; verifies workflow resiliency.
  - `residency-latency-injection.yaml` → injects 250ms delay across residency boundary traffic.

## Rollback Criteria & Compliance Evidence
- Trigger rollback when:
  - Error budget burn rate > 2x target for two consecutive windows.
  - Synthetic smoke checks fail twice within 10 minutes.
  - Chaos drill produces sustained p95 > SLO for > 3m.
- Upload artifacts:
  - SBOM (`artifacts/sbom.spdx.json`).
  - Vulnerability reports (`artifacts/grype.json`, `artifacts/trivy.json`).
  - Synthetic + chaos reports (`dist/reports/*.json`).
- Reference runbooks in `runbooks/` for escalation trees and remediation automation.
