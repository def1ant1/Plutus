plutus/docs/INTERACTIONS.md
# End-to-End Interactions

## Borrower Journey (Direct)
1. Discover & Pre-Qual → consented data pulls (Open Banking, accounting) → instant eligibility band.
2. Smart Intake → dynamic forms (LLM) request only missing/high-information-gain items → document upload & OCR/parse.
3. Offer Preview → personalized terms with explainability “why/why-not” and sensitivity sliders.
4. Finalize → e-sign, collateral uploads, payout configuration → compliance checklist.

## Underwriter Flow (Exception-Only)
1. Exception Alert → queue receives only edge cases/anomalies.
2. AI Loan Memo → entity graph, cashflow, seasonality, stress scenarios, cohort stats, KYC/fraud verdicts.
3. Action → adjust terms, request more data, or override with rationale.
4. Approve & Book → doc pack, covenants, funding, core booking, GL; borrower notified.

## Compliance/Risk
- Policy Builder (decision DAGs: rules+models), canary & A/B rollout.
- Monitoring (fair lending, model/feature drift, approvals by protected-class cohorts).
- Audit (immutable event & feature lineage, decision replay).

## Embedded Partner/Broker
- Partner API (pre-qual, status webhooks), hosted widgets, attribution, revenue share reporting.
