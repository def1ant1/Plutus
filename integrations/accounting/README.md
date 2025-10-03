plutus/integrations/accounting/README.md
# Accounting Data — Adapters
**Aggregators:** Codat (primary), Rutter (fallback)  
**Systems:** QuickBooks Online, Xero, Sage Intacct, NetSuite

## Scope
- Normalized GL/AR/AP, cashflow metrics, aging, inventory (optional).  
- Backfill & periodic refresh; diff-based updates.

## SLAs
- Snapshot ≤ 5s p95 in sandbox; async backfills; webhook-driven updates.
