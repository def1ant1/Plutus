plutus/docs/SCALABILITY_ARCH.md
# Scalability, Multi-Tenancy, and Residency

## Cell-Based Architecture
- Cells per geography (US-East, EU-West) with isolated Kafka, Postgres, Redis, OTel.
- Tenants pinned to cells; Citus sharding; blast radius minimized.

## Patterns
- CQRS + Event Sourcing; outbox pattern; Debezium CDC.
- Backpressure via consumer group tuning; DLQs.
- Async external calls; idempotent retries.

## Scaling
- HPA/KEDA autoscaling; GPU pools for OCR/LLM; anti-affinity, PDBs.
- Co-locate scoring/fraud/feature cache; Redis cluster; TTL policies.

## Cross-Region
- Postgres logical replication; controlled failover.
- Kafka MirrorMaker 2 for aggregate replication only.
- Per-region KMS; Vault DR with performance standby.
