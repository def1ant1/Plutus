# Backlog

## 2025-01-08

- [ ] Wire Avro schemas to managed schema registry with automated signature + compat enforcement. Evidence: `tools/scripts/validate-avro.mjs`, `contracts/events/schemas/`.
- [ ] Clarify Nx workspace layout, required generators, and dependency contracts needed to scaffold `services/config-svc` with Prisma-backed residency cells before implementation proceeds. Evidence: `WBS_DEPENDENCY_ORDER.md`, `docs/SCALABILITY_ARCH.md`.
- [ ] Wire orchestrator-svc to a live Temporal cluster and replace the in-memory workflow snapshot with real client calls once infrastructure endpoints are available. Evidence: `services/orchestrator-svc/src/app/app.service.ts`.
- [ ] Expand Playwright coverage to validate portal-web against real API responses and accessibility audits. Evidence: `apps/portal-web-e2e/project.json`.
- [ ] Remove the temporary `skipLibCheck` override once Nx publishes a compatible `@nx/react` schema for TypeScript ≥5.5. Evidence: `apps/portal-web/tsconfig.json`.

## 2024-03-01

- [ ] Implement config-svc stub or contract tests to satisfy tenant residency lookups without live HTTP dependency. Evidence: `libs/security/src/claims/tenant-claims-enricher.ts`.
- [ ] Generate signed OPA bundles and replace JSON decision matrix stub with compiled WASM artifact. Evidence: `services/iam-svc/src/policies/decision-matrix.json`.
- [ ] Expose health and readiness endpoints plus audit log sinks for iam-svc to integrate with platform observability SLIs. Evidence: `services/iam-svc/src/app/app.module.ts`.
