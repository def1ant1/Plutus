plutus/AGENTS.md
# AGENTS — Codex Operations & Quality Playbook

> **Scope:** This document defines how a Codex-style autonomous coding agent operates inside the Plutus repo. It prescribes **rigorous build/test/doc steps**, how to **select the top incomplete epic**, how to **generate tasks**, and how to **maintain the the changelog/backlog** during every iteration.  
> **Read this first** before running any automation.

## 0) Canonical Inputs & Sources of Truth
- Planning & Dependencies: `WBS_DEPENDENCY_ORDER.md`, `CRITICAL_PATH.md`, `PARALLELIZATION_PLAN.md`, `ACCEPTANCE_GATES.md`, `docs/RELEASE_PLAN.md`
- Architecture & Constraints: `docs/OVERVIEW.md`, `docs/SCALABILITY_ARCH.md`, `docs/SECURITY_COMPLIANCE.md`, `docs/DATA_MODEL.md`, `docs/WORKFLOWS.md`, `docs/DEPENDENCIES_PACKAGES.md`, `docs/PERFORMANCE_SLOs.md`, `docs/OBSERVABILITY_TESTING.md`
- Governance: `governance/model-cards/`, `governance/data-sheets/`, `governance/fairness-reports/`, `compliance/`
- Integrations: `integrations/*/README.md`, `product/decision-dags/`, `product/catalog/`
- Contracts: `contracts/http/`, `contracts/events/`, `contracts/policies/`

> The agent **must not** invent scope. If ambiguity exists, create a clarification task in **BACKLOG.md** and stop.

## 1) Agent Roles
1. Planner → selects top incomplete epic, resolves dependencies, expands into tasks.  
2. Implementer → writes/updates specs/contracts/configs (no secrets).  
3. Tester → defines and runs quality gates (lint, typecheck, contract, unit, e2e, security).  
4. Documenter → updates CHANGELOG/BACKLOG and relevant docs.  
5. Reviewer → policy/gov checks; blocks merge if gates fail.

## 2) Selection Policy — “Top Incomplete Epic”
- Parse `WBS_DEPENDENCY_ORDER.md` in order, ensure prereqs per `ACCEPTANCE_GATES.md`, cross-check `CRITICAL_PATH.md`.  
- Choose the **first** epic whose dependencies are met and whose acceptance criteria are not yet satisfied.

## 3) Task Output Schema (`tasks.yaml`)
```yaml
iteration: "<YYYY-MM-DD>-<hhmm>-<agent-id>"
epic_id: "WI-800"
objective: "Implement Decision DAG Runner & Policy Builder"
assumptions: ["Contracts frozen", "Kafka per cell is available"]
deliverables: ["contracts/events/*.avsc", "docs/decisioning/runner-spec.md"]
tasks:
  - id: "T-1"
    title: "Specify DAG runner execution model"
    artifacts: ["docs/decisioning/runner-spec.md"]
    acceptance: ["Spec reviewed by Risk & Platform owners"]
test_plan:
  contract_tests: ["OpenAPI/AsyncAPI/Avro compile and validate"]
  unit_tests: ["Runner spec scenario matrix documented"]
  e2e_tests: ["Golden decision replay scenarios documented"]
security_scans: ["SBOM/Vuln scans planned"]
documentation: ["CHANGELOG.md", "BACKLOG.md"]
done_definition: ["All acceptance criteria met", "All gates green", "Docs updated"]
```

## 4) Iteration Workflow (A–J)
A. Sync & Sanity → B. Epic Selection → C. Contract Freezing → D. Spec Authoring → E. Quality Harness → F. Implementation Plan → G. CI/CD Spec → H. Docs & Runbooks → I. Review & Sign-off → J. Close Iteration.

## 5) Build/Test/Security Gates
- Contracts compile/lint; schema compatibility = BACKWARD/FULL.  
- Policy bundles validate and are signed.  
- Contract/unit/e2e test plans documented; performance targets referenced.  
- SBOM and vuln posture declared; **Critical=block**.  
- No secrets; PII flows documented; residency constraints mapped.

## 6) Documentation Templates
See templates in this file for **CHANGELOG.md** and **BACKLOG.md** entries; include evidence pointers (file paths + anchors).

## 7) Prompt Template for Codex
Use the prompt in this file to produce `tasks.yaml`, update docs, and enforce gates. Return only `tasks.yaml` and changed file list.

## 8) Governance
Policy-as-code versions in `contracts/policies/`; any change requires approval notes in review docs. Residency ramifications must be documented.

## 9) Definition of Done
All tasks done with evidence; contracts/specs/docs validated; CHANGELOG/BACKLOG updated; no unresolved Critical security/compliance issues.
