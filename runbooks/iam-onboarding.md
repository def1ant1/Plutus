# IAM Service Onboarding Runbook

## Purpose
Guide platform teams through deploying `iam-svc`, wiring centralized authentication middleware, and validating RBAC/ABAC decisions prior to enabling tenant access.

## Prerequisites
- Auth0 or Azure AD tenant with API registered for `api://plutus-iam`.
- Config service endpoint exposing `/tenants/:id` residency metadata.
- Decision matrix JSON generated from OPA bundle signed by security engineering.

## Steps
1. **Provision secrets**
   - Store `IAM_OIDC_ISSUER`, `IAM_OIDC_AUDIENCE`, and config-svc credentials in Vault under `kv/plutus/iam`.
   - Upload the latest `decision-matrix.json` artifact to the deployment bucket.
2. **Deploy service**
   - `pnpm --filter @plutus/iam-svc build`
   - Build container image including `services/iam-svc/src/policies/decision-matrix.json`.
   - Apply Kubernetes manifest with readiness probes hitting `/api/v1/healthz` (todo once endpoint exists).
3. **Configure middleware consumers**
   - Import `AuthenticationMiddleware` from `@plutus/security` inside each service bootstrap.
   - Pass identical issuer/audience/config-svc settings to maintain deterministic decisions.
4. **Validate**
   - Execute `pnpm --filter @plutus/security test` to confirm token + policy regression suite.
   - Run smoke call: `curl -H "Authorization: Bearer <token>" https://iam.internal/api/v1/admin/tenants` expecting 401/403 for unauthorized contexts.
   - Verify audit logs in Log Analytics contain impersonator details when `act.sub` is present.
5. **Operationalize**
   - Schedule Trivy + npm audit via CI `pnpm ci` pipeline (see `package.json`).
   - Document delegated admin approvals in Access Reviews.

## Rollback
1. Scale deployment to zero replicas.
2. Revoke issued service-account secrets in Auth0/Azure AD.
3. Remove temporary impersonation breakglass grants from Access Reviews.
