# Changelog

## 2024-03-01 — Identity Service + Security Platform

### Added

- Provisioned `services/iam-svc` Nest service with centralized Fastify security middleware, tenant admin APIs, and configuration loader wired to Auth0/Azure AD OIDC discovery. Evidence: `services/iam-svc/src/main.ts`, `services/iam-svc/src/admin/`.
- Published reusable `@plutus/security` library exposing OIDC/JWKS validation, tenant claim enrichment, and ABAC policy evaluation consumable by all services. Evidence: `libs/security/src/*`.
- Documented deployment/runbook guidance and updated compliance notes for IAM rollout. Evidence: `docs/SECURITY_COMPLIANCE.md`, `runbooks/iam-onboarding.md`.

### Testing

- `pnpm --filter @plutus/security test`.
