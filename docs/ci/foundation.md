# Foundation CI Playbook

This document captures the automation contract that every Plutus workspace contributor must respect. The new Nx monorepo scaffold centralises linting, testing, builds, and documentation generation.

## Pipeline Overview

| Stage      | Command                                                                         | Purpose                                                                        |
| ---------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Install    | `pnpm install --frozen-lockfile`                                                | Ensures deterministic dependency graphs for all apps, services, and libraries. |
| Lint       | `pnpm nx run-many --target=lint --all --parallel=3`                             | Enforces strict ESLint + JSDoc rules with module-boundary tagging.             |
| Unit Tests | `pnpm nx run-many --target=test --all --parallel=3`                             | Executes Jest + React Testing Library specs and Nest contract tests.           |
| Build      | `pnpm nx run-many --target=build --all --parallel=2 --configuration=production` | Produces production bundles (Next static output + Nest artefacts).             |

Nx Cloud remote caching is enabled automatically whenever the `NX_CLOUD_ACCESS_TOKEN` secret is provided. The GitHub workflow (`.github/workflows/foundation.yml`) wraps each stage with `nx-cloud start-ci-run`/`stop-ci-run` so caches are persisted across jobs and forks.

> **Air-gapped execution:** When developing inside restricted environments (e.g. Codex containers without internet access), export `NX_NO_CLOUD=true NX_CLOUD=false` and append `--runner=local --skip-nx-cache --exclude=Plutus` to the `nx run-many` invocations above. This prevents Nx from attempting to download the Nx Cloud agent and keeps build/test loops green offline.

## Local Developer Workflow

- **Bootstrap:** `pnpm install`
- **Validate everything:** `pnpm lint && pnpm test`
- **Smoke the portal:** `pnpm dev:web`
- **Run orchestrator locally:** `pnpm start`
- **Format code:** `pnpm format`

Husky hooks run `lint-staged` (Prettier + ESLint) before each commit and `commitlint` on commit messages to enforce conventional commits. The repository exposes a `pnpm commit` helper via Commitizen for authoring compliant messages.

## Target Conventions

Every project exposes the following standard targets:

- `lint` — ESLint with module-boundary enforcement (`@nx/enforce-module-boundaries`).
- `test` — Jest for unit and contract tests, using React Testing Library or Nest testing utilities.
- `build` — Production-ready artefacts (`@nx/next:build` for the portal, `@nx/nest:build` for services, `@nx/js:tsc` for libraries).
- `type-check` — Explicit TypeScript project reference verification via `nx:run-commands`.
- `e2e` — Playwright-driven browser automation (portal) and axios contract checks (services).

### TypeScript Notes

- The portal web app enforces `noPropertyAccessFromIndexSignature` across CSS modules. Favor bracket syntax (`styles['page']`) when referencing generated style tokens so Next.js production builds remain type-safe.
- `apps/portal-web/tsconfig.json` sets `skipLibCheck: true` to work around an upstream `@nx/react` schema typing issue with TypeScript 5.5. Track Nx releases so the override can be removed once the typings are patched.

## Secrets and Environment Variables

| Variable                | Source                 | Notes                                                                          |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `NX_CLOUD_ACCESS_TOKEN` | GitHub Secrets         | Enables distributed computation caching. Optional locally.                     |
| `TEMPORAL_*`            | Repository `.env` / CI | Drive orchestrator Temporal connections. Defaults documented in `libs/config`. |
| `OTEL_EXPORTER_OTLP_*`  | Secrets or env files   | Directs telemetry exporters.                                                   |

## Backwards Compatibility

- All commands are idempotent and rely on project references to avoid rebuild storms.
- Nx Cloud falls back to local caching when the token is absent.
- pnpm workspace caching is enabled through `actions/setup-node@v4` (cache=pnpm).

For runbooks, reference `docs/OBSERVABILITY_TESTING.md` and `runbooks/` for step-by-step procedures.
