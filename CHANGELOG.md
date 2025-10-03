# Changelog

## 2025-02-14 — Observability Platform Hardening

### Added

- Shipped `@plutus/observability` library wrapping OpenTelemetry, Prometheus, and pino with residency-aware span processors, logger adapters, and env config helpers for NestJS/Next.js. Evidence: `libs/observability/*`.
- Wired iam-svc, orchestrator-svc, and portal-web to standardized telemetry bootstrap with tenant/residency tagging and reusable loggers. Evidence: `services/iam-svc/src/main.ts`, `services/orchestrator-svc/src/main.ts`, `apps/portal-web/src/instrumentation.ts`, `apps/portal-web/src/app/lib/telemetry.server.ts`.
- Authored synthetic/chaos automation targets (Playwright, Cypress, k6) and chaos templates with Nx registration plus dashboards + docs. Evidence: `tools/synthetics/**`, `tools/chaos/**`, `chaos/experiments/*.yaml`, `docs/OBSERVABILITY_TESTING.md`, `dashboards/*.json`.
- Established observability GitHub workflow for SBOM, Trivy/Grype scans, synthetic probes, and artifact archival. Evidence: `.github/workflows/observability-quality.yaml`.
- Published runbooks covering telemetry onboarding, alert response, and chaos drills. Evidence: `runbooks/telemetry-onboarding.md`, `runbooks/alert-response.md`, `runbooks/chaos-drills.md`.

### Testing

- `pnpm install`
- `pnpm --filter @plutus/observability build`
- `pnpm nx run chaos:validate`
- `pnpm nx run synthetics:playwright --skip-nx-cache`

## 2025-01-08 — Contract Governance Automation

### Added

- Authored intake, config, and IAM OpenAPI 3.1 contracts with exhaustive residency-aware schemas and error taxonomies. Evidence: `contracts/http/*.openapi.yaml`.
- Published AsyncAPI 2.6 + Avro schemas for lifecycle events with tenant/residency metadata. Evidence: `contracts/events/lifecycle.asyncapi.yaml`, `contracts/events/schemas/*.avsc`.
- Seeded ABAC and governance Rego bundles with inline documentation and README matrix for automation consumers. Evidence: `contracts/policies/*.rego`, `contracts/policies/README.md`.
- Introduced Make/Nx validation and artifact generation targets (Spectral, AsyncAPI, Avro, Redocly) and wired them into CI workflows. Evidence: `Makefile`, `contracts/project.json`, `nx.json`, `package.json`, `.github/workflows/contracts-ci.yaml`.
- Generated contract artifact automation with HTML/PDF renderers plus documentation references. Evidence: `tools/scripts/html-to-pdf.mjs`, `tools/scripts/validate-avro.mjs`, `docs/DATA_MODEL.md`.

### Fixed

- Stabilized AsyncAPI HTML rendering by importing the generator's default export and vendoring the HTML template to avoid flaky on-demand installs. Evidence: `tools/scripts/render-asyncapi-html.mjs`, `package.json`, `pnpm-lock.yaml`.

### Testing

- `pnpm install`
- `pnpm contracts:validate`
- `pnpm contracts:docs`

## 2024-03-01 — Identity Service + Security Platform

### Added

- Provisioned `services/iam-svc` Nest service with centralized Fastify security middleware, tenant admin APIs, and configuration loader wired to Auth0/Azure AD OIDC discovery. Evidence: `services/iam-svc/src/main.ts`, `services/iam-svc/src/admin/`.
- Published reusable `@plutus/security` library exposing OIDC/JWKS validation, tenant claim enrichment, and ABAC policy evaluation consumable by all services. Evidence: `libs/security/src/*`.
- Documented deployment/runbook guidance and updated compliance notes for IAM rollout. Evidence: `docs/SECURITY_COMPLIANCE.md`, `runbooks/iam-onboarding.md`.

### Testing

- `pnpm --filter @plutus/security test`.
