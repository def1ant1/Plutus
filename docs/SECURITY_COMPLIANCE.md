# Security, Privacy, and Compliance-by-Design

## Identity & Access
OIDC (Auth0/Azure AD), RBAC/ABAC (tenant & data-scope claims), short-lived tokens, mTLS mesh, JIT support access.

### IAM Service Integration Steps
1. Deploy `services/iam-svc` with the Auth0/Azure AD issuer and API audience via `IAM_OIDC_ISSUER`/`IAM_OIDC_AUDIENCE` env vars.
2. Mount the OPA-derived decision matrix at `IAM_POLICY_BUNDLE_PATH` (defaults to `services/iam-svc/src/policies/decision-matrix.json`).
3. Point `IAM_CONFIG_SERVICE_URL` to config-svc; the security middleware enriches tokens with authoritative residency/tenant metadata.
4. Propagate the shared middleware from `@plutus/security` to additional services via Fastify/Nest `preHandler` hooks so RBAC/ABAC enforcement remains consistent.
5. Impersonation flows require `act.sub` and `impersonation_reason` claims; policy denies escalation unless the impersonator holds `iam.support` and residency clearances.

## Data Protection
PII tokenization, field-level encryption, envelope encryption (KMS), HSM-backed signing, redacted logs/traces.

## Compliance Controls
US: GLBA, FCRA/ECOA/Reg B, BSA/AML, UDAAP. EU: GDPR, AMLD5/6, EBA, PSD2.
Adverse action letters with evidence; model cards/data sheets; fairness reports; DSR workflows.

## Governance & Explainability
Policy-as-code (OPA/Rego), versioned decision DAGs, approvals/change windows.
Explainable outputs with features & model hash; decision replay endpoint.
Vendor governance: SOC2/ISO attestations, SBOMs, runtime attestation.
