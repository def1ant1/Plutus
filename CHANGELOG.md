# Changelog

## 2025-01-08 — Nx Foundation Scaffold

### Added

- Bootstrapped an Nx + pnpm monorepo with strict TypeScript references, ESLint/JSDoc rules, Husky, lint-staged, and Commitizen tooling for repeatable automation. Evidence: `package.json`, `nx.json`, `.husky/`.
- Introduced shared domain libraries for workflow orchestration, configuration loading, and observability helpers with comprehensive Jest coverage. Evidence: `libs/core-domain/`, `libs/config/`, `libs/observability/`.
- Delivered enterprise-ready portal timeline view powered by core-domain models and enriched tests using React Testing Library. Evidence: `apps/portal-web/src/app/page.tsx`, `apps/portal-web/specs/index.spec.tsx`.
- Implemented orchestrator service skeleton with Fastify, structured configuration injection, observability wiring, and contract-focused tests. Evidence: `services/orchestrator-svc/src/main.ts`, `services/orchestrator-svc/src/app/app.controller.ts`, `services/orchestrator-svc-e2e/`.

### CI/CD

- Added Docker-ready multi-stage builds, pnpm caching, and an Nx Cloud-enabled GitHub Actions workflow covering install → lint → test → build. Evidence: `.github/workflows/foundation.yml`, `docs/ci/foundation.md`.

## 2025-01-08 — Build Stabilisation & Portal Hardening

### Fixed

- Unblocked production builds by exporting the Next.js-aware Jest factory as `unknown`, aligning CSS module usage with index-signature safe bracket notation, and tolerating upstream Nx schema typing issues via `skipLibCheck` in `apps/portal-web/tsconfig.json`. Evidence: `apps/portal-web/jest.config.ts`, `apps/portal-web/src/app/page.tsx`, `apps/portal-web/tsconfig.json`.
- Documented offline build execution guardrails and strict TypeScript expectations for CSS modules. Evidence: `docs/ci/foundation.md`.

### Validation

- `pnpm nx run-many --target=build --all --parallel=2 --configuration=production --output-style=stream --runner=local --skip-nx-cache --exclude=Plutus`.
