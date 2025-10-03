plutus/README.md
# Plutus — AI Loan Origination Platform (US & EU)

> **Enterprise-grade, AI-first origination** for SMB & mid-market enterprise lending.  
> **Tenets:** Compliance-by-design • Explainable-by-default • Event-driven • Multi-tenant & multi-region • API-first • Observable • Cost-aware.

## What Plutus Delivers
- High-conversion intake: dynamic forms, AI assistant, Open Banking & accounting data pulls, doc OCR (100+ types).  
- AI decisioning: credit risk (PD/LGD), fraud, KYC/KYB/AML, risk-based pricing, explainability (reason codes/SHAP), adverse action.  
- Exception-only underwriting: AI loan memos, policy sandboxing/A-B, portfolio guards.  
- Docs→Funding: jurisdiction-aware doc packs, e-sign, disbursement & GL booking via core adapters.  
- Governance: immutable audit, decision replay, fairness/drift monitoring, residency enforcement (US/EU).

## Architecture (High Level)
```mermaid
flowchart TD
  A[Borrower Portal / Partner Widgets] --> B[Workflow Orchestrator]
  B --> C[Decisioning: Credit / Fraud / KYC-AML / Pricing]
  C --> D[Explainability & Policy Governance]
  C --> E[Lender Dashboard (Exceptions)]
  B --> F[Docs & E-Sign] --> G[Funding & Core Booking]
  B --> H[Audit & Observability]
  H --> I[Data Lake + Feature Store]
```

## Repository Layout (Docs-First Scaffold)
See the `plutus/` tree; key docs in `docs/` and `contracts/`. Automation playbook in `AGENTS.md`. Integration partners in `integrations/PARTNERS.md`.

## Getting Started
1. Read `docs/OVERVIEW.md`, `docs/SCALABILITY_ARCH.md`, `docs/WORKFLOWS.md`, `docs/SECURITY_COMPLIANCE.md`.  
2. Select the top incomplete epic via `WBS_DEPENDENCY_ORDER.md` and follow `AGENTS.md`.  
3. Author/validate APIs & events in `contracts/`.  
4. Define CI/CD spec for your epic in `docs/ci/`.  
5. Update `CHANGELOG.md` and `BACKLOG.md` each iteration.  
6. Pass phase gates in `ACCEPTANCE_GATES.md`.

## Quality, Security & Compliance
Quality gates (contracts/tests/performance), SBOM & vuln posture, OIDC/ABAC, mTLS, FLE, KMS/Vault, GLBA/FCRA/ECOA/BSA/AML (US), GDPR/AMLD/PSD2 (EU), fairness/drift, WORM audit.

## License
© Plutus Platform. All rights reserved. Licensing TBD.
