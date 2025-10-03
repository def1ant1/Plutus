plutus/docs/PERFORMANCE_SLOs.md
# Performance Targets, SLOs, and Capacity

## Borrower UX
- TTI ≤ 2.0s p75 desktop; ≤ 3.0s p75 mobile.
- Upload→Parse (10 pages) ≤ 12s p95 (async acceptable with progress).

## Decisioning & Models
- Sync credit score ≤ 250ms p95 (features warm).
- Fraud rules ≤120ms p95; external APIs ≤600ms p95.
- Explainability precompute ≤1.5s avg (async).

## Orchestration & Throughput
- 10k active loans/region; 100k steps/day; task latency ≤200ms p95.
- Kafka 30k msgs/sec sustained; event propagation ≤500ms p95.
- Scoring 1k RPS/region; autoscale on p95 tail latency.

## Reliability
- Availability: 99.95% platform; assistant 99.9%.
- RPO ≤ 5 min; RTO ≤ 30 min.
- Error budget 0.05% monthly for decision path.
