plutus/integrations/bureaus/README.md
# Credit Bureaus — Adapters
**US:** Experian, Equifax, TransUnion (personal & commercial) • SBFE via member banks  
**EU/UK:** Experian, Equifax, CRIF, Schufa (DE)

## Requirements
- Permissible purpose logging (FCRA/ECOA).  
- Dispute handling and adverse action data capture.  
- Consistent identifiers and bureau-specific parsing mappings.

## SLAs
- p95 ≤ 1.5s; retries with exponential backoff; circuit-breakers for outages.
