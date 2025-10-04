# @plutus/config

Centralised configuration loader that keeps Plutus services, workers, and web
applications aligned on residency-aware defaults. The library consumes the
repository-wide `.env` chain (`envs/.env.shared`, `envs/<residency>/.env`,
`envs/<residency>/.env.<environment>`) and merges it with runtime overrides so
platform teams configure each deployment once and reuse it everywhere.

## Residency-aware defaults

The loader ships with sensible defaults for each residency cell. When a value is
omitted from the `.env` files and the runtime environment, the residency profile
fills the gap. This prevents misconfigured smoke stacks from pointing to the
wrong Temporal or telemetry endpoints.

| Residency | Default HTTP Port | Temporal Namespace             | OTLP Endpoint                            | Default Tenant    |
|-----------|------------------|--------------------------------|------------------------------------------|------------------|
| `us`      | `3000`            | `plutus.us.orchestration`      | `https://otel.us.plutus.dev/v1/traces`   | `tenant-root`    |
| `eu`      | `3100`            | `plutus.eu.orchestration`      | `https://otel.eu.plutus.dev/v1/traces`   | `tenant-eu-root` |

Environment variables always win. The ordering from lowest to highest priority
is:

1. `envs/.env.shared`
2. `envs/<residency>/.env`
3. `envs/<residency>/.env.<environment>`
4. `envs/.env.local` + `envs/<residency>/.env.local`
5. Values passed via `loadConfig({ additionalFiles })`
6. Runtime `process.env`

The resulting object exposes diagnostics describing which files were parsed and
which environment variables influenced the final output. Surface these details
in logs during incident triage to spot drift quickly.

## Environment variables

| Variable | Purpose | Notes |
|----------|---------|-------|
| `PLUTUS_HTTP_HOST` / `PLUTUS_HTTP_PORT` / `PLUTUS_HTTP_PREFIX` | Shared HTTP listener configuration. | Required. Defaults per residency if omitted. |
| `TEMPORAL_NAMESPACE` / `TEMPORAL_TASK_QUEUE` | Temporal runtime. | Required. Residency defaults provided. |
| `OBS_OTLP_TRACES_ENDPOINT` | OTLP traces endpoint. | Required. Residency defaults provided. |
| `OBS_OTLP_METRICS_ENDPOINT` / `OBS_OTLP_LOGS_ENDPOINT` | Optional OTLP collectors. | Useful for metrics/log streaming. |
| `OBS_SERVICE_NAME` / `OBS_SERVICE_VERSION` | Telemetry identity. | Auto-populates diagnostics if present. |
| `OBS_DEFAULT_TENANT` / `OBS_DEFAULT_RESIDENCY` | Telemetry fallback metadata. | Defaults to shared tenant/residency. |
| `PLUTUS_DEFAULT_TENANT` / `PLUTUS_DEFAULT_RESIDENCY` / `PLUTUS_DEFAULT_LOCALE` | Cross-cutting defaults. | Residency defaults ensure locale alignment. |
| `IAM_HTTP_*` / `IAM_OIDC_*` / `IAM_POLICY_BUNDLE_PATH` / `IAM_CONFIG_SERVICE_URL` | IAM service wiring. | Allows IAM to bootstrap without bespoke config files. |

## Usage

```ts
import { loadConfig } from '@plutus/config';

const config = loadConfig();
const iam = config.services.iam;

app.setGlobalPrefix(iam.http.globalPrefix);
await app.listen({ host: iam.http.host, port: iam.http.port });
```

When testing alternate residency setups, point the loader at fixture roots:

```ts
loadConfig({
  env: { PLUTUS_RESIDENCY: 'eu', PLUTUS_ENV: 'staging' },
  dotenvRoot: path.resolve(__dirname, '../env-fixtures'),
});
```

## Quality gates

Run the dedicated Jest suite to validate parsing, overrides, and diagnostics:

```bash
pnpm nx test config
```

The fixtures under `src/fixtures` cover cross-residency permutations so new
variables can be introduced safely. Update the README and fixture matrix whenever
an additional residency is onboarded.
