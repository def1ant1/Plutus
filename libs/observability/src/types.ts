import type { LoggerOptions as PinoLoggerOptions } from 'pino';

/**
 * Shared options for configuring observability across NestJS services and Next.js apps.
 * These mirror OpenTelemetry's Resource semantic conventions so downstream
 * automation (dashboards, alerts, compliance exports) can be generated without
 * manual per-service tweaks.
 */
export interface ObservabilityOptions {
  /** Logical service identifier; surfaced in traces, logs, and metrics. */
  serviceName: string;
  /** Optional version identifier (git SHA, semver, etc.). */
  serviceVersion?: string;
  /** Deployment environment such as `development`, `staging`, or `prod`. */
  environment?: string;
  /**
   * Default tenant identifier to stamp onto root spans and log entries. This is
   * intentionally coarse grained to avoid leaking per-user PII while still
   * enabling multi-tenant analytics.
   */
  tenantId?: string;
  /** Residency/cell identifier (e.g. `us`, `eu`, `apac`). */
  residency?: string;
  /** Explicit redaction list merged with the hardened defaults. */
  redactKeys?: string[];
  /** Pino logger options override. */
  loggerOptions?: PinoLoggerOptions;
  /** Minimum log level (`info` by default). */
  logLevel?: string;
  /** Optional OTLP/HTTP traces collector endpoint. */
  otlpTracesEndpoint?: string;
  /** Optional OTLP/HTTP metrics collector endpoint. */
  otlpMetricsEndpoint?: string;
  /**
   * Prometheus exporter configuration. Set `enabled` to `false` to disable the
   * built-in HTTP endpoint when an external collector handles scrape routing.
   */
  prometheus?: {
    enabled?: boolean;
    host?: string;
    port?: number;
    endpoint?: string;
  };
  /** Additional resource attributes merged into the OpenTelemetry resource. */
  resourceAttributes?: Record<string, string>;
  /**
   * Additional span attributes to force onto every span at start time. Reserved
   * attributes (tenant/residency/environment) are automatically merged.
   */
  spanAttributes?: Record<string, string>;
  /**
   * Incoming HTTP path regular expressions ignored by the tracer. Health checks
   * and metrics endpoints are excluded by default so signals stay noise-free.
   */
  ignoredIncomingPaths?: Array<string | RegExp>;
}

/**
 * Partial options sourced from environment variables. Automation scripts can
 * pass only the defaults they know and rely on environment overrides for the
 * rest.
 */
export interface ObservabilityEnvInput {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  defaultTenantId?: string;
  defaultResidency?: string;
  defaultRedactKeys?: string[];
  resourceAttributes?: Record<string, string>;
  spanAttributes?: Record<string, string>;
}
