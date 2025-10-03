plutus/integrations/open-banking/README.md
# Open Banking (AIS/PIS) — Adapters
**Primary (US):** Plaid • **Fallback (US):** Finicity (Mastercard)  
**Primary (EU/UK):** Tink (Visa) • **Fallback (EU/UK):** TrueLayer (or Yapily)

## Capabilities
- AIS: Accounts, balances, transactions (categorization, merchant, geos).  
- PIS: Payment initiation (EU), SEPA Instant support, standing orders (where enabled).

## Requirements
- Consent ledger with scopes and expiry.  
- Data minimization & field whitelisting.  
- Webhook handling (data updated, consent revoked).

## SLAs & Performance
- Target p95 ≤ 600ms for snapshot calls; webhooks ≤ 5s.  
- Sandbox parity required; rate-limit backoff strategies.

## Evidence
- Store raw payloads + normalized extracts; link to Application ID; WORM retention ≥ 7 years.
