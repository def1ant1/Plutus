plutus/docs/FUNCTIONS.md
# Functional Decomposition (Service Catalog)

## Borrower Experience
- **portal-web**: Next.js app; dynamic forms; localized; file uploads with PII redaction.
- **assistant-svc**: LLM chat for intake/explanations; RAG with product/policy docs.
- **docs-svc**: OCR + classification; parse bank statements, tax returns, financials to canonical JSON.

## Orchestration & Workflow
- **orchestrator**: Temporal long-running workflows (intake→verifications→decision→funding).
- **decisions-svc**: Policy DAG runner (rules+ML), explainability (SHAP), bias checks, adverse action.
- **kyc-aml-svc**: Identity, sanctions/PEP, KYB; risk scoring & evidence storage.
- **fraud-svc**: Device/browser intel, velocity, synthetic ID heuristics, consortium signals.
- **pricing-svc**: Risk-based pricing, covenants, collateral haircuts, portfolio constraints.
- **docs-gen-svc**: Term sheets, disclosures, e-sign packets; clause governance.
- **funding-svc**: Disbursement orchestration, lien filings, GL postings, reconciliation.

## Data & ML
- **feature-store**: Feast online/offline; time-travel; data contracts.
- **model-registry**: MLflow lifecycle, signatures, governance metadata, model cards.
- **scoring-svc**: Low-latency model serving (Ray/BentoML), p95 SLAs.
- **etl-svc**: CDC from OLTP → lakehouse; Great Expectations; OpenLineage.

## Integrations & Core
- **open-banking-adapters**: Plaid/Tink/TrueLayer; consent ledger.
- **bureau-adapters**: Experian/Equifax/TransUnion & SMB bureaus.
- **core-adapters**: FIS/Jack Henry/Finastra/Temenos; outbox pattern.
- **esign-adapters**: DocuSign/Adobe Sign; sealed evidence packages.

## Platform
- **api-gw**: Kong/Envoy Gateway; mTLS; rate-limit; WAF; OIDC.
- **iam-svc**: OIDC (Auth0/AAD), RBAC/ABAC; tenant scoping.
- **config-svc**: Product catalog, policy versions, feature flags.
- **observability**: OTel, Prometheus, Grafana, Loki/Tempo; audit lake.
- **billing-svc**: Usage metering, partner rev-share, cost showback.
