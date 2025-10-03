# Plutus Platform Monorepo

Plutus is an enterprise-grade, AI-first loan-origination platform that unifies borrower intake, automated decisioning, funding, and regulator-ready governance across US and EU regions.【F:docs/OVERVIEW.md†L2-L26】 It is designed from the ground up for compliance-by-design, explainability, and multi-tenant operations so financial institutions can launch new credit products with confidence.【F:docs/OVERVIEW.md†L11-L26】

## Table of Contents
- [Platform Overview](#platform-overview)
- [Architecture & Operating Model](#architecture--operating-model)
- [Domain & Workflows](#domain--workflows)
- [Repository Layout](#repository-layout)
- [Development Environment](#development-environment)
- [Build, Test & Quality Gates](#build-test--quality-gates)
- [Contracts & Policy Governance](#contracts--policy-governance)
- [Infrastructure, Observability & Ops](#infrastructure-observability--ops)
- [Security, Compliance & Governance](#security-compliance--governance)
- [Data, ML & Analytics](#data-ml--analytics)
- [Integrations & Product Assets](#integrations--product-assets)
- [Performance & Service Objectives](#performance--service-objectives)
- [Further Reading](#further-reading)

## Platform Overview
Plutus targets SMB and mid-market enterprise lending, combining AI underwriting, fraud, KYB/KYC/AML, workflow automation, borrower experience, and deep core banking integrations to accelerate origination at scale.【F:docs/OVERVIEW.md†L5-L26】 The platform’s value streams span borrower acquisition, qualification, underwriter assist, funding, and immutable governance so every decision is auditable and reproducible.【F:docs/OVERVIEW.md†L18-L26】

## Architecture & Operating Model
Plutus follows a layered model—from borrower portals and partner widgets through workflow orchestration, AI decisioning, data integration, and infrastructure services—to keep experiences, decisioning, and systems-of-record loosely coupled.【F:docs/OVERVIEW.md†L25-L38】 A cell-based architecture deploys isolated Kafka, Postgres, Redis, and observability stacks per geography, pinning tenants to cells to minimize blast radius while supporting cross-region replication and residency controls.【F:docs/SCALABILITY_ARCH.md†L4-L20】 Event-driven patterns (CQRS, outbox, Debezium) with async retries, DLQs, and autoscaling GPU pools ensure resiliency across high-throughput underwriting workloads.【F:docs/SCALABILITY_ARCH.md†L8-L16】

## Domain & Workflows
The canonical data model covers tenants, applications, applicants, financials, risk, documents, funding, and audit events, with standardized HTTP contracts and event schemas embedding residency, idempotency, and model hashes for traceability.【F:docs/DATA_MODEL.md†L4-L32】 Loan applications progress through a guarded state machine (draft → funded/active) orchestrated by Temporal workflows for intake, verification, feature building, decisioning, document packaging, funding, and notifications.【F:docs/WORKFLOWS.md†L4-L18】 The borrower portal seeds these workflows with configuration snapshots so teams can validate orchestration timelines end-to-end.【F:apps/portal-web/src/app/page.tsx†L12-L198】

## Repository Layout
- `apps/portal-web` – Next.js portal demonstrating the orchestration timeline, runtime configuration, and logging hooks that mirror backend services for rapid verification.【F:apps/portal-web/src/app/page.tsx†L12-L198】
- `services/` – Domain services including IAM and orchestrator components that integrate with shared security middleware and policy bundles to enforce residency-aware RBAC/ABAC flows.【F:docs/SECURITY_COMPLIANCE.md†L3-L15】
- `libs/observability` & `libs/security` – Shared packages for telemetry export, token validation, and policy enforcement consumed across apps and services.【F:docs/OBSERVABILITY_TESTING.md†L3-L48】【F:docs/SECURITY_COMPLIANCE.md†L3-L15】
- `contracts/` – Source of truth for OpenAPI, AsyncAPI, Avro, and OPA bundles with automation-ready validation and documentation targets.【F:contracts/http/README.md†L1-L16】【F:contracts/events/README.md†L1-L14】【F:contracts/policies/README.md†L1-L19】
- `docs/` – Architecture, scalability, security, data, workflow, dependency, observability, and performance playbooks aligning engineering and compliance teams.【F:docs/OVERVIEW.md†L2-L38】【F:docs/SCALABILITY_ARCH.md†L4-L20】【F:docs/SECURITY_COMPLIANCE.md†L3-L23】【F:docs/DATA_MODEL.md†L4-L32】【F:docs/WORKFLOWS.md†L4-L18】【F:docs/DEPENDENCIES_PACKAGES.md†L4-L22】【F:docs/OBSERVABILITY_TESTING.md†L3-L48】【F:docs/PERFORMANCE_SLOs.md†L4-L21】
- `helm/` – Deployment charts for observability tooling and gateway/mesh policy enforcement in Kubernetes clusters.【F:helm/observability/README.md†L1-L13】【F:helm/gateway-mesh/README.md†L1-L5】
- `dashboards/` – Grafana dashboards that correlate latency, identity, and workflow SLOs with chaos drill annotations for release readiness.【F:docs/OBSERVABILITY_TESTING.md†L16-L38】
- `runbooks/` – On-call, telemetry, chaos, and IAM rollout guides driving consistent operations and rollback automation.【F:runbooks/README.md†L2-L8】
- `compliance/` & `governance/` – Controls matrices, evidence maps, regulatory templates, model cards, data sheets, and fairness reports underpinning policy compliance and regulator audits.【F:compliance/controls-matrix/README.md†L1-L2】【F:compliance/evidence-map/README.md†L1-L2】【F:compliance/regulatory-artifacts/README.md†L1-L2】【F:governance/model-cards/README.md†L1-L2】【F:governance/data-sheets/README.md†L1-L2】【F:governance/fairness-reports/README.md†L1-L2】
- `product/` – Versioned decision DAG specifications plus loan product catalogs covering limits, rate curves, and eligibility data points.【F:product/decision-dags/README.md†L1-L2】【F:product/catalog/README.md†L1-L2】
- `integrations/` – Partner playbooks for open banking, KYC/AML, bureaus, fraud, e-sign, payments, collateral, accounting, and core banking adapters with SLAs and evidence requirements.【F:integrations/open-banking/README.md†L1-L20】
- `db/` – OLTP baseline schema with tenancy, encryption hints, and audit/event tables tuned for partitioning and lineage retention.【F:db/ddl.sql†L1-L79】
- `ml/` – Evidently-powered drift monitoring notebook plus curated datasets for model governance and alerting evidence.【F:ml/evidently_drift_job.ipynb†L1-L34】
- `tools/` – Nx-powered synthetic monitoring runners, chaos validation utilities, and shared scripts for contract/doc generation.【F:tools/synthetics/project.json†L1-L14】【F:tools/chaos/project.json†L1-L8】【F:Makefile†L1-L51】

## Development Environment
The monorepo standardizes on Node 20 LTS for TypeScript services and apps, Python 3.11+ for ML/OCR workloads, and optional Go adapters for extreme throughput scenarios.【F:docs/DEPENDENCIES_PACKAGES.md†L4-L12】 Install dependencies with [pnpm](https://pnpm.io) (workspace enforced via `pnpm@8.15.4`) and leverage Nx for task orchestration across packages.【F:package.json†L7-L39】【F:nx.json†L1-L19】

```bash
pnpm install
```

Use `.env` files under `envs/us` and `envs/eu` to supply cell-specific configuration before bootstrapping services; residency-aware middleware reads these settings at startup.【F:docs/SCALABILITY_ARCH.md†L4-L20】【F:docs/SECURITY_COMPLIANCE.md†L3-L15】

## Build, Test & Quality Gates
Run the full CI suite locally to mirror pipeline gates:

```bash
pnpm lint
pnpm test
pnpm contracts:validate
pnpm security:audit
pnpm security:trivy
```

These commands lint, test, validate contracts, and perform vulnerability scans before combining into the `pnpm ci` meta-script for pre-commit assurance.【F:package.json†L7-L15】 Synthetic smoke tests (Playwright, Cypress, k6) and chaos validation are exposed as Nx targets to verify observability wiring, redaction lists, latency budgets, and experiment metadata.【F:docs/OBSERVABILITY_TESTING.md†L22-L38】【F:tools/synthetics/project.json†L1-L14】【F:tools/chaos/project.json†L1-L8】 Contract documentation and PDF artifacts can be generated via the Makefile or Nx commands, ensuring OpenAPI, AsyncAPI, and Avro schemas pass Spectral, AsyncAPI, and compatibility checks before publishing.【F:Makefile†L1-L51】【F:contracts/http/README.md†L1-L16】【F:contracts/events/README.md†L1-L14】

## Contracts & Policy Governance
HTTP specs cover intake, configuration, and IAM services with residency-aware error taxonomies and OAuth2/API key security models, while AsyncAPI + Avro definitions capture the entire lifecycle event stream with FULL compatibility guarantees and automated artifact generation.【F:contracts/http/README.md†L1-L16】【F:contracts/events/README.md†L1-L14】 OPA policy bundles (ABAC and governance) are versioned alongside services, compiled to WASM, and signed as part of CI to enforce segregation of duties, residency, and decision approvals across the fleet.【F:contracts/policies/README.md†L1-L19】

## Infrastructure, Observability & Ops
Helm charts install the observability stack (Prometheus, Loki, Tempo, Grafana, OpenTelemetry Collector) and gateway/mesh policies (Kong + Istio) so each cell achieves consistent telemetry and ingress controls.【F:helm/observability/README.md†L1-L13】【F:helm/gateway-mesh/README.md†L1-L5】 Grafana dashboards stitch traces, logs, metrics, and chaos annotations to track SLOs, with automated evidence collection for compliance archives.【F:docs/OBSERVABILITY_TESTING.md†L16-L48】 Runbooks codify telemetry onboarding, alert response, chaos drills, and IAM rollout, ensuring on-call teams have deterministic recovery steps and escalation paths.【F:runbooks/README.md†L2-L8】

## Security, Compliance & Governance
Identity flows rely on OIDC (Auth0/Azure AD), short-lived tokens, mTLS mesh, and shared RBAC/ABAC middleware delivered via `@plutus/security`, with impersonation safeguards and residency enrichment sourced from the IAM service.【F:docs/SECURITY_COMPLIANCE.md†L3-L15】 Data protection controls include tokenization, field-level encryption, envelope encryption, HSM-backed signing, and redacted telemetry, satisfying US (GLBA, FCRA/ECOA, BSA/AML, UDAAP) and EU (GDPR, AMLD5/6, EBA, PSD2) obligations alongside adverse action, model documentation, and fairness reporting.【F:docs/SECURITY_COMPLIANCE.md†L13-L23】 Compliance workspaces map regulations to controls and evidence, while governance folders house model cards, dataset sheets, and fairness assessments for audit readiness.【F:compliance/controls-matrix/README.md†L1-L2】【F:compliance/evidence-map/README.md†L1-L2】【F:compliance/regulatory-artifacts/README.md†L1-L2】【F:governance/model-cards/README.md†L1-L2】【F:governance/data-sheets/README.md†L1-L2】【F:governance/fairness-reports/README.md†L1-L2】

## Data, ML & Analytics
The OLTP baseline schema provisions tenants, leads, parties, applications, bureau pulls, decisions, and audit events with encryption hints and partitioning guidance for residency-aware retention.【F:db/ddl.sql†L1-L79】 ML teams leverage the Evidently drift job notebook to generate classification or regression drift reports (HTML/JSON) from reference and current datasets, ensuring monitoring evidence meets regulatory expectations.【F:ml/evidently_drift_job.ipynb†L1-L34】

## Integrations & Product Assets
Product owners maintain loan product catalogs and decision DAG definitions to align policy DAG deployments with underwriting criteria and experiment rollouts.【F:product/catalog/README.md†L1-L2】【F:product/decision-dags/README.md†L1-L2】 Integration playbooks capture preferred vendors, fallbacks, SLAs, consent requirements, data minimization, and evidence retention for each adapter, reducing manual onboarding effort and compliance risk.【F:integrations/open-banking/README.md†L1-L20】

## Performance & Service Objectives
Borrower experience, decisioning latency, orchestration throughput, and reliability targets are defined up front—covering TTI, document ingestion, scoring latency, Kafka throughput, availability, RPO/RTO, and error budgets—to keep every service aligned with SLO guardrails.【F:docs/PERFORMANCE_SLOs.md†L4-L21】 Observability pipelines feed these metrics into dashboards and synthetic tests so regressions trigger automated rollbacks and evidence collection.【F:docs/OBSERVABILITY_TESTING.md†L3-L48】

## Further Reading
Consult `BACKLOG.md`, `CRITICAL_PATH.md`, `WBS_DEPENDENCY_ORDER.md`, and `ACCEPTANCE_GATES.md` before starting new work to align with the program plan and governance checkpoints. The documentation under `docs/` and `runbooks/` is the single source of truth for architecture, security, operations, and release management.
