plutus/integrations/kyc-aml/README.md
# KYC/KYB/AML — Adapters
**KYC (US/EU):** Stripe Identity, Jumio, Onfido, IDnow, iProov (liveness)  
**KYB (US):** Middesk, D&B, Experian Biz • **EU:** D&B, CRIF, Creditsafe, OpenCorporates  
**Sanctions/PEP/Media:** ComplyAdvantage, Refinitiv World-Check, Dow Jones Risk & Compliance

## Flows
1. Identity doc capture & liveness.  
2. Sanctions/PEP screening with case management.  
3. KYB: Entity registration, beneficial owners, watchlists.

## Controls
- Store evidence bundles; redact PII in logs.  
- Configurable retention; explicit residency tags (US/EU).  
- Manual review queue with reasons and overrides.

## SLAs
- p95 inline checks ≤ 2s; complex KYB may be async.  
- Uptime ≥ 99.9%; webhook retries with idempotency keys.
