plutus/integrations/PARTNERS.md
# Integration Partners — Necessary & Recommended (US/EU)
> **Goal:** Document partner options, selection criteria, regional coverage, compliance posture, and fallback strategies. Use this file to drive vendor RFPs and adapter specs.

## Selection Criteria (score 1–5)
- **Coverage:** Markets (US/EU), product types, identity types (personal/business), data breadth.  
- **Compliance:** SOC2/ISO, GLBA/GDPR alignment, data residency, DPA/BAA, audit reports.  
- **Accuracy/Recall:** Match rates, fraud catch-rates, model lift, adjudication tooling.  
- **Latency/SLA:** p95 latency, uptime ≥ 99.9%, webhook reliability, rate limits.  
- **Controls:** PII minimization, retention controls, evidence bundles, field-level encryption support.  
- **Cost:** Transparent pricing, committed discounts, egress/archival fees.  
- **Integration:** SDK/APIs, webhooks, sandbox parity, support quality.

## Recommended Partners by Category
| Category | US | EU/UK | Notes |
|---|---|---|---|
| **Open Banking (AIS/PIS)** | Plaid, Finicity (Mastercard), Yodlee | Tink (Visa), TrueLayer, Yapily | Consent-led data pulls (tx, balances); SEPA Instant/PIS for payouts in EU. |
| **KYC (Identity Verification)** | Stripe Identity, Jumio, Socure | Onfido, IDnow, iProov (liveness) | Biometric liveness, doc verification, 1st/3rd-party data fusion. |
| **KYB (Business Verification)** | Middesk, Dun & Bradstreet, Experian Biz | Dun & Bradstreet, CRIF, Creditsafe, OpenCorporates | Beneficial ownership, registrations, watchlists. |
| **Sanctions/PEP/Adverse Media** | ComplyAdvantage, Refinitiv World-Check, Dow Jones | Same | Screening + case mgmt; evidence retention. |
| **Fraud & Risk (device/behavior)** | SentiLink (synthetic), Sardine, Socure, Fingerprint.com, LexisNexis ThreatMetrix, Arkose | Signifyd/Kount (EU), ThreatMetrix, Arkose | Device fingerprint, velocity, bot defense, behavioral biometrics. |
| **Credit Bureaus** | Experian, Equifax, TransUnion; SBFE via members | Experian (UK/EU), Equifax (UK/EU), CRIF, Schufa (DE) | Commercial + personal where applicable; adverse action data. |
| **Accounting Data Aggregators** | Codat, Rutter | Codat, Tink B2B | Normalized GL/AR/AP; reduces per-ERP integrations. |
| **Accounting Systems** | QuickBooks Online, Xero, Sage Intacct, NetSuite | Xero, Sage, NetSuite | Direct adapters only if aggregator insufficient. |
| **E-Sign** | DocuSign, Adobe Sign, OneSpan | DocuSign, Adobe, OneSpan | eIDAS support in EU; evidence packages. |
| **Core Banking / Booking** | FIS IBS, Jack Henry SilverLake/Symitar, Finastra Fusion, Mambu, Temenos, Thought Machine | Temenos T24, Mambu, Finastra, Thought Machine | Mix of legacy cores and modern SaaS cores. |
| **Payments/Disbursement** | ACH/RTP via Modern Treasury, Stripe Treasury, Visa Direct, Mastercard Send | SEPA/SEPA Instant via PSPs (Adyen, Stripe), Open Banking PIS | Prefer bank rails for principal; push-to-card for instant. |
| **Lien/UCC & Filings** | Wolters Kluwer Lien Solutions, CSC Global | CSC Global | UCC/eRecording, lien perfection, reminders. |
| **Collateral Valuation** | Clear Capital (RE), Black Book/J.D. Power (auto) | Clear Capital, Eurotax | As required by product. |
| **Address/Geo** | USPS CASS, Melissa | Royal Mail PAF, Loqate | Address standardization & quality. |
| **Doc AI (optional)** | AWS Textract, Google DocAI, Veryfi | Same | Alternative/augmentation to in-house OCR/parse. |

## Adapter Strategy
- One **primary** + one **fallback** per category per region.  
- Adapters expose the **same canonical interface**; switching vendors is a config change (no business logic changes).  
- Evidence bundles (PDFs, JSON) are persisted in WORM storage with retention policies.

## RFP & Scorecards
Use `integrations/vendor_scorecards/` templates. Each scorecard must include region, SLA, pricing notes, compliance artifacts, and a signed DPA/DTA reference.
