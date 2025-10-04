/**
 * @packageDocumentation
 * The type contracts used by {@link loadConfig} to describe residency-aware runtime
 * configuration for Plutus services. The interfaces aim to be expressive enough for
 * all HTTP-facing services, Temporal workers, and telemetry producers without
 * leaking low-level implementation details. Every property intentionally carries
 * documentation so downstream teams can wire their bootstrap logic using IDE
 * IntelliSense instead of spelunking through environment variable lists.
 */

/**
 * Unique, human-readable code describing the data residency cell that a service is
 * executing within. We model it as a union of the primary cells we operate today and
 * fall back to a branded string so additional cells can be introduced without
 * breaking existing TypeScript consumers.
 */
export type ResidencyCode = 'us' | 'eu' | (string & { readonly __residencyBrand?: never });

/**
 * Strongly typed HTTP server configuration shared by Nest services, Next.js
 * front-ends, and background workers exposing health probes. We intentionally
 * mirror Fastify/Nest expectations so the object can be passed straight into
 * `app.listen` without translation.
 */
export interface HttpConfig {
  /** Interface address to bind; defaults to `0.0.0.0` for containerized deployments. */
  readonly host: string;
  /** TCP port number. Validation occurs inside {@link loadConfig}. */
  readonly port: number;
  /** Global prefix applied to all REST routes (for example `api/v1`). */
  readonly globalPrefix: string;
}

/**
 * Temporal worker/client wiring. Namespace + task queue align with the residency
 * profile so cross-region misconfigurations surface immediately.
 */
export interface TemporalConfig {
  /** Fully qualified Temporal namespace (e.g. `plutus.us.orchestration`). */
  readonly namespace: string;
  /** Logical task queue dedicated to the residency cell. */
  readonly taskQueue: string;
  /** Residency the Temporal endpoints belong to. Useful for telemetry/resource tags. */
  readonly targetResidency: ResidencyCode;
}

/**
 * Observability endpoints and default attributes injected into trace/span
 * exporters. The configuration values deliberately mirror OTLP concepts so
 * instrumentation helpers can accept this object as-is.
 */
export interface ObservabilityConfig {
  /** Primary OTLP traces endpoint. Must include protocol. */
  readonly otlpTracesEndpoint: string;
  /** Optional OTLP metrics endpoint for residency-specific collectors. */
  readonly otlpMetricsEndpoint?: string;
  /** Optional OTLP logs endpoint for future expansion. */
  readonly otlpLogsEndpoint?: string;
  /** Logical service name advertised to observability tooling. */
  readonly serviceName?: string;
  /** Semantic version string published alongside telemetry. */
  readonly version?: string;
  /** Default tenant identifier to tag traces/spans when caller context is missing. */
  readonly defaultTenant?: string;
  /** Default residency code attached to telemetry resources. */
  readonly defaultResidency?: ResidencyCode;
}

/**
 * Cross-cutting defaults that multiple services rely on (tenant/residency fallbacks,
 * locale hints, etc.). Values from this object should be treated as a safety net and
 * not as the canonical source of truth for request-scoped metadata.
 */
export interface SharedDefaults {
  /** Tenant to assume when upstream traffic omits explicit tenancy information. */
  readonly tenantId: string;
  /** Residency code that downstream systems should treat as the default. */
  readonly residency: ResidencyCode;
  /** Optional locale hint for localized assets/logging. */
  readonly locale?: string;
}

/**
 * IAM service-specific configuration slice extracted from the shared loader so the
 * Nest bootstrap can remain lean. We attach {@link SharedDefaults} so existing
 * IAM-specific middleware continues to function with zero changes.
 */
export interface IamServiceConfig {
  /** HTTP listener configuration for IAM endpoints. */
  readonly http: HttpConfig;
  /** OIDC issuer/audience pair used by authentication middleware. */
  readonly oidc: {
    readonly issuer: string;
    readonly audience: string;
  };
  /** File-system paths and locations of policy bundles. */
  readonly policy: {
    readonly bundlePath: string;
  };
  /** Remote configuration-service wiring (URL, credentials, etc.). */
  readonly configService: {
    readonly baseUrl: string;
  };
  /** Shared defaults duplicated for IAM convenience. */
  readonly defaults: SharedDefaults;
}

/**
 * Diagnostics payload emitted by {@link loadConfig}. It records which files were
 * parsed and the final environment values that influenced the resulting object so
 * operators can debug configuration drift in CI or production captures.
 */
export interface ConfigDiagnostics {
  /** Residency code that governed fallback defaults. */
  readonly residency: ResidencyCode;
  /** Environment/stage identifier (development, staging, production, etc.). */
  readonly environment: string;
  /** Absolute file paths that were parsed in order of increasing precedence. */
  readonly sources: readonly string[];
  /** Final resolved environment variables for traceability. */
  readonly resolvedEnv: Readonly<Record<string, string>>;
}

/**
 * Complete configuration object produced by {@link loadConfig}. Consumers can grab
 * the shared defaults or drill down into service-specific slices while relying on
 * the attached diagnostics during incident response.
 */
export interface PlatformConfig {
  /** Friendly environment/stage string. */
  readonly env: string;
  /** Residency cell powering the resolved configuration. */
  readonly residency: ResidencyCode;
  /** Primary HTTP configuration shared across services. */
  readonly http: HttpConfig;
  /** Temporal workflow configuration. */
  readonly temporal: TemporalConfig;
  /** Observability/telemetry configuration. */
  readonly observability: ObservabilityConfig;
  /** Cross-cutting defaults. */
  readonly defaults: SharedDefaults;
  /** Service-specific configuration map. Extendable for future services. */
  readonly services: {
    readonly iam: IamServiceConfig;
  };
  /** Traceability metadata for operations teams. */
  readonly diagnostics: ConfigDiagnostics;
}

/**
 * Optional knobs controlling how {@link loadConfig} discovers `.env` files and
 * overrides. Primarily used in tests or CLI tooling where the working directory
 * differs from the runtime environment.
 */
export interface LoadConfigOptions {
  /** Environment map to prefer over `process.env`. */
  readonly env?: NodeJS.ProcessEnv;
  /** Explicit residency code to evaluate (overrides environment variables). */
  readonly residency?: ResidencyCode;
  /** Explicit environment/stage string. */
  readonly environment?: string;
  /** Root directory containing residency-specific `.env` folders. */
  readonly dotenvRoot?: string;
  /** Additional dotenv files to evaluate after the standard chain. */
  readonly additionalFiles?: readonly string[];
  /** Working directory; defaults to `process.cwd()`. */
  readonly cwd?: string;
}

/**
 * Error thrown when configuration could not be resolved (for example invalid port
 * numbers or missing required entries). We expose it so callers can differentiate
 * between configuration mistakes and runtime failures.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}
