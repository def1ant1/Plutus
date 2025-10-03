# Helm: plutus-observability

Umbrella chart for Prometheus, Loki, Tempo, Grafana, and OpenTelemetry Collector.

Install:

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm dependency update helm/observability
helm install plutus-observability helm/observability -n observability --create-namespace
```