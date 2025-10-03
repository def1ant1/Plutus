plutus/integrations/payments/README.md
# Payments / Disbursements — Adapters
**US:** ACH/RTP via Modern Treasury, Stripe Treasury, Visa Direct, Mastercard Send  
**EU/UK:** SEPA/SEPA Instant via PSPs (Adyen, Stripe), Open Banking PIS

## Patterns
- Principal via bank rails; instant payouts via push-to-card.  
- Idempotent payouts; reconciliation with GL.

## Controls & SLAs
- p95 initiation ≤ 700ms; settlement tracking; webhooks with retries.  
- NACHA/PSD2 compliance; evidence of funds flow.
