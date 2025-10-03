plutus/docs/WORKFLOWS.md
# State Machines & Orchestration

## Application State Machine
DRAFT → INTAKE_IN_PROGRESS → VERIFICATION_PENDING → FEATURES_READY → DECISION_PENDING → DECISION_READY{APPROVED|CONDITIONAL|DECLINED} → DOCS_OUT → ESIGN_PENDING → BOOKING_PENDING → FUNDED → ACTIVE

Terminal: DECLINED, WITHDRAWN, EXPIRED.
Guards: KYC=PASS, KYB=PASS, FRAUD<RISK_THRESHOLD, DATA_QUALITY=OK.
Timers: SLAs for verifications; escalations; borrower nudges.

## Temporal Workflows
- IntakeWorkflow: consent, data pulls, doc OCR, normalization.
- VerificationWorkflow: KYC/KYB/AML, fraud, bureaus.
- FeatureBuildWorkflow: feature store writes; quality checks.
- DecisionWorkflow: models→rules→pricing→explainability→adverse action.
- DocsWorkflow: pack generation, e-sign orchestration, evidence sealing.
- FundingWorkflow: disbursement rails, liens, GL postings, reconciliation.
- Notifications: borrower & partner updates; webhooks.
