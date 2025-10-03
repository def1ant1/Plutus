# Backlog

## 2025-01-08

- [ ] Clarify Nx workspace layout, required generators, and dependency contracts needed to scaffold `services/config-svc` with Prisma-backed residency cells before implementation proceeds. Evidence: `WBS_DEPENDENCY_ORDER.md`, `docs/SCALABILITY_ARCH.md`.
- [ ] Wire orchestrator-svc to a live Temporal cluster and replace the in-memory workflow snapshot with real client calls once infrastructure endpoints are available. Evidence: `services/orchestrator-svc/src/app/app.service.ts`.
- [ ] Expand Playwright coverage to validate portal-web against real API responses and accessibility audits. Evidence: `apps/portal-web-e2e/project.json`.
- [ ] Remove the temporary `skipLibCheck` override once Nx publishes a compatible `@nx/react` schema for TypeScript ≥5.5. Evidence: `apps/portal-web/tsconfig.json`.
