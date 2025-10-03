plutus/docs/DEPENDENCIES_PACKAGES.md
# Dependencies, Packages, and Vendor Options

## Language & Runtime
- TypeScript (Node 20 LTS) for web/services; Python 3.11+ for OCR/ML; Go optional for high-throughput adapters.

## Core Frameworks
- Frontend: Next.js, React 18, TanStack Query, Zod, React Hook Form, i18next, shadcn/ui.
- Backend: NestJS (Fastify), Prisma (Postgres), kafkajs, Temporal SDK, Zod.
- ML/MLOps: PyTorch, scikit-learn, LightGBM/XGBoost, transformers, MLflow, Feast, Great Expectations, OpenLineage.
- Data/Infra: PostgreSQL (Citus/partitioning), Redis, Kafka/Redpanda, Debezium, S3 + Delta/Iceberg, OpenSearch, ClickHouse/Snowflake.
- Explainability & Fairness: SHAP, LIME (selective), Evidently/Aequitas.
- Security: Auth0/Azure AD, Vault, OPA/Gatekeeper, KMS (AWS/Azure).
- Gateway/Mesh: Kong, Istio.
- CI/CD: GitHub Actions, ArgoCD, Renovate, Trivy/Grype, Cosign/SLSA.
- Observability: OpenTelemetry, Prometheus, Grafana, Loki, Tempo, Jaeger.

## APIs (swappable behind adapters)
Open Banking (Plaid/Tink/TrueLayer), KYC/AML (Onfido/Stripe/Trulioo + Refinitiv/ComplyAdvantage), Fraud (SentiLink/Sardine), Bureaus (Experian/Equifax/TransUnion), E-Sign (DocuSign/Adobe), Core Banking (FIS/Jack Henry/Finastra/Temenos), LLM (Azure OpenAI + vLLM fallback).

## Recommended Integration Partners
See `integrations/PARTNERS.md` for category-by-category recommendations, SLAs, residency notes, and fallback strategies.
