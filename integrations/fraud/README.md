plutus/integrations/fraud/README.md
# Fraud & Risk Intelligence — Adapters
**Options:** SentiLink (synthetic ID), Socure, Sardine, Fingerprint.com (device), LexisNexis ThreatMetrix, Arkose Labs/Kount/Signifyd

## Signals
- Device/browser fingerprint, IP reputation, velocity, behavioral biometrics, cross-tenant patterns.  
- Account takeover, bot mitigation, synthetic identity scores.

## Integration
- Inline scoring for high-signal rules; async enrichment for heavy checks.  
- Case management hooks; feedback loops to models.

## SLAs
- Inline path ≤ 120ms p95; async ≤ 1s p95.  
- Evidence bundle persisted; decision reason codes standardized.
