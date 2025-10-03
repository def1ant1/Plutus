# Telemetry Onboarding Runbook

## Purpose
Ensure every service/app integrates with the shared `@plutus/observability` library to provide consistent logs, traces, and metrics with tenant/residency tagging.

## Prerequisites
- Service/application has access to OTLP collector endpoints and Prometheus scrape network.
- Environment variables documented below are provisioned via automation (Vault, SSM, etc.).
- Engineer reviewed `docs/OBSERVABILITY_TESTING.md` for current SLO targets.

## Implementation Steps
1. **Install dependency**: `pnpm add @plutus/observability` within the package workspace.
2. **Bootstrap telemetry**:
   - NestJS: import `createLogger`, `createTelemetrySdk`, and `resolveObservabilityOptionsFromEnv` and wire inside `main.ts` exactly as `services/iam-svc` demonstrates.
   - Next.js: create an `instrumentation.ts` that calls `ensureTelemetryStarted` and expose a server logger via `getLogger()`.
3. **Environment overrides** (set in deployment manifests):
   - `OBS_SERVICE_NAME`, `OBS_SERVICE_VERSION`, `OBS_ENVIRONMENT`.
   - `OBS_TENANT_ID`, `OBS_RESIDENCY` (avoid per-user PII).
   - `OBS_OTLP_TRACES_ENDPOINT`, `OBS_OTLP_METRICS_ENDPOINT`.
   - `OBS_PROMETHEUS_PORT`, `OBS_PROMETHEUS_HOST` for scrape configuration.
4. **Redaction hardening**: If a service handles additional sensitive fields (e.g., `bankAccountNumber`), append them via `OBS_REDACT_KEYS` (comma-separated) or pass through `spanAttributes`.
5. **Validate locally**:
   - `pnpm --filter <package> build` to ensure types compile.
   - `pnpm nx run synthetics:playwright --skip-nx-cache` to confirm env variables are visible to probes.
   - `pnpm nx run chaos:validate` to ensure any new chaos plans reference the service.
6. **CI Readiness**: Confirm `.github/workflows/observability-quality.yaml` runs successfully on branch PR.

## Escalations
- Telemetry bootstrapping issues → Observability Guild (#observability Slack).
- OTLP collector availability → Platform Infra On-call.
- Prometheus scrape alignment → SRE On-call.

## Evidence to Capture
- Link to PR showing library integration.
- Synthetic test report in `dist/reports/` attached to change ticket.
- Updated dashboard JSON in `dashboards/` referencing new resource attributes.
