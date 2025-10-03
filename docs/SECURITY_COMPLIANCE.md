plutus/docs/SECURITY_COMPLIANCE.md
# Security, Privacy, and Compliance-by-Design

## Identity & Access
OIDC (Auth0/Azure AD), RBAC/ABAC (tenant & data-scope claims), short-lived tokens, mTLS mesh, JIT support access.

## Data Protection
PII tokenization, field-level encryption, envelope encryption (KMS), HSM-backed signing, redacted logs/traces.

## Compliance Controls
US: GLBA, FCRA/ECOA/Reg B, BSA/AML, UDAAP. EU: GDPR, AMLD5/6, EBA, PSD2.
Adverse action letters with evidence; model cards/data sheets; fairness reports; DSR workflows.

## Governance & Explainability
Policy-as-code (OPA/Rego), versioned decision DAGs, approvals/change windows.
Explainable outputs with features & model hash; decision replay endpoint.
Vendor governance: SOC2/ISO attestations, SBOMs, runtime attestation.
