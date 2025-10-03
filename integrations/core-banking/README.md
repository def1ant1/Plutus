plutus/integrations/core-banking/README.md
# Core Banking / Booking — Adapters
**US:** FIS IBS, Jack Henry (SilverLake/Symitar), Finastra Fusion, Thought Machine, Mambu, Temenos  
**EU:** Temenos T24, Mambu, Finastra, Thought Machine

## Capabilities
- Loan booking, schedules, GL entries, status sync.  
- Idempotent outbox, replay-safe operations.

## Controls
- Strong typed mappings; reconciliation checks; retry & dead-letter queues.  
- Residency & data minimization per region.

## SLAs
- Booking pipeline end-to-end ≤ 10s p95; reconciliation drift ±$0 on test harness.
