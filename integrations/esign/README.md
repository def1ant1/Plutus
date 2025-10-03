plutus/integrations/esign/README.md
# E-Sign — Adapters
**Primary:** DocuSign • **Fallback:** Adobe Sign (OneSpan acceptable)

## Requirements
- Template versioning & clause governance, eIDAS support for EU.  
- Sealed evidence packages with tamper detection.  
- Webhook callbacks to update application state.

## SLAs
- Envelope creation ≤ 500ms p95; callback within 5s; retries with idempotency.
