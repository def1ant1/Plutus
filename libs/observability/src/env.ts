import { resolve } from 'node:path';
import type { ObservabilityEnvInput, ObservabilityOptions } from './types';

const DEFAULT_IGNORED_PATHS = [/^\/health(z|check)$/i, /^\/metrics$/i, /^\/readiness$/i];

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }
  return !['0', 'false', 'no'].includes(value.toLowerCase());
}

function sanitizeList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Resolves observability options from environment variables, layering any
 * automation-provided defaults on top. This keeps bootstrap scripts deterministic
 * while still letting engineers override fields locally when debugging.
 */
export function resolveObservabilityOptionsFromEnv(
  input: ObservabilityEnvInput,
  env: NodeJS.ProcessEnv = process.env,
): ObservabilityOptions {
  const serviceName = env.OBS_SERVICE_NAME ?? input.serviceName;
  const serviceVersion = env.OBS_SERVICE_VERSION ?? input.serviceVersion;
  const environment = env.OBS_ENVIRONMENT ?? env.NODE_ENV ?? input.environment;
  const tenantId = env.OBS_TENANT_ID ?? input.defaultTenantId;
  const residency = env.OBS_RESIDENCY ?? input.defaultResidency;
  const redactKeys = [...(input.defaultRedactKeys ?? []), ...sanitizeList(env.OBS_REDACT_KEYS)];
  const logLevel = env.OBS_LOG_LEVEL ?? env.LOG_LEVEL ?? undefined;

  const promEnabled = parseBoolean(env.OBS_PROMETHEUS_ENABLED, true);
  const prometheus = {
    enabled: promEnabled,
    host: env.OBS_PROMETHEUS_HOST,
    port: env.OBS_PROMETHEUS_PORT ? Number(env.OBS_PROMETHEUS_PORT) : undefined,
    endpoint: env.OBS_PROMETHEUS_ENDPOINT,
  } as ObservabilityOptions['prometheus'];

  const resourceAttributes = {
    'service.instance.id': env.HOSTNAME,
    'deployment.environment': environment,
    ...input.resourceAttributes,
  } as Record<string, string>;

  const spanAttributes = {
    'tenant.id': tenantId,
    'data.residency': residency,
    ...input.spanAttributes,
  } as Record<string, string>;

  const ignoredIncomingPaths = [
    ...DEFAULT_IGNORED_PATHS,
    ...sanitizeList(env.OBS_IGNORED_PATHS).map((pattern) => new RegExp(pattern, 'i')),
  ];

  const otlpTracesEndpoint = env.OBS_OTLP_TRACES_ENDPOINT ?? env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  const otlpMetricsEndpoint = env.OBS_OTLP_METRICS_ENDPOINT ?? env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;

  const options: ObservabilityOptions = {
    serviceName,
    serviceVersion,
    environment,
    tenantId,
    residency,
    logLevel,
    redactKeys,
    otlpTracesEndpoint,
    otlpMetricsEndpoint,
    prometheus,
    resourceAttributes,
    spanAttributes,
    ignoredIncomingPaths,
  };

  if (promEnabled && prometheus?.host && prometheus.host.startsWith('.')) {
    prometheus.host = resolve(prometheus.host);
  }

  return options;
}
