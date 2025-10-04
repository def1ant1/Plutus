import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'dotenv';
import {
  ConfigDiagnostics,
  ConfigError,
  HttpConfig,
  IamServiceConfig,
  LoadConfigOptions,
  ObservabilityConfig,
  PlatformConfig,
  ResidencyCode,
  SharedDefaults,
  TemporalConfig,
} from './types';

/**
 * Internal profile describing residency-aware defaults. We keep it narrow so tests
 * can verify merge semantics without depending on implementation details from other
 * packages.
 */
interface ResidencyProfile {
  readonly http: HttpConfig;
  readonly temporal: Omit<TemporalConfig, 'targetResidency'>;
  readonly observability: Omit<
    ObservabilityConfig,
    'defaultTenant' | 'defaultResidency'
  > & {
    readonly defaultTenant: string;
    readonly defaultResidency: ResidencyCode;
  };
  readonly defaults: SharedDefaults;
  readonly iam: Omit<IamServiceConfig, 'defaults'>;
}

type PartialProfile = {
  readonly [K in keyof ResidencyProfile]?: Partial<ResidencyProfile[K]>;
};

/**
 * Ordered list of environment variable keys we resolve so diagnostics can stay
 * deterministic across runs.
 */
const ORDERED_KEYS = [
  'PLUTUS_HTTP_HOST',
  'PLUTUS_HTTP_PORT',
  'PLUTUS_HTTP_PREFIX',
  'TEMPORAL_NAMESPACE',
  'TEMPORAL_TASK_QUEUE',
  'TEMPORAL_TARGET_RESIDENCY',
  'OBS_OTLP_TRACES_ENDPOINT',
  'OBS_OTLP_METRICS_ENDPOINT',
  'OBS_OTLP_LOGS_ENDPOINT',
  'OBS_SERVICE_NAME',
  'OBS_SERVICE_VERSION',
  'OBS_DEFAULT_TENANT',
  'OBS_DEFAULT_RESIDENCY',
  'PLUTUS_DEFAULT_TENANT',
  'PLUTUS_DEFAULT_RESIDENCY',
  'PLUTUS_DEFAULT_LOCALE',
  'IAM_HTTP_HOST',
  'IAM_HTTP_PORT',
  'IAM_HTTP_PREFIX',
  'IAM_OIDC_ISSUER',
  'IAM_OIDC_AUDIENCE',
  'IAM_POLICY_BUNDLE_PATH',
  'IAM_CONFIG_SERVICE_URL',
];

/**
 * Base residency defaults that get merged with residency-specific overrides. The
 * policy bundle path is resolved relative to the repository root so the IAM service
 * keeps its existing fallback behaviour.
 */
function baseProfile(cwd: string): ResidencyProfile {
  return {
    http: {
      host: '0.0.0.0',
      port: 3000,
      globalPrefix: 'api',
    },
    temporal: {
      namespace: 'plutus.orchestration',
      taskQueue: 'plutus-orchestrator',
    },
    observability: {
      otlpTracesEndpoint: 'https://otel.plutus.dev/v1/traces',
      defaultTenant: 'tenant-root',
      defaultResidency: 'us',
      serviceName: undefined,
      version: undefined,
      otlpMetricsEndpoint: undefined,
      otlpLogsEndpoint: undefined,
    },
    defaults: {
      tenantId: 'tenant-root',
      residency: 'us',
      locale: 'en-US',
    },
    iam: {
      http: {
        host: '0.0.0.0',
        port: 4000,
        globalPrefix: 'api/v1',
      },
      oidc: {
        issuer: 'https://auth.plutus.dev/',
        audience: 'api://plutus-iam',
      },
      policy: {
        bundlePath: join(cwd, 'services/iam-svc/src/policies/decision-matrix.json'),
      },
      configService: {
        baseUrl: 'https://config.plutus.dev',
      },
    },
  };
}

/**
 * Residency specific overrides. We intentionally bias to real deployment defaults
 * so staging environments mimic production infrastructure.
 */
const RESIDENCY_OVERRIDES: Record<string, PartialProfile> = {
  us: {
    http: {
      host: '0.0.0.0',
      globalPrefix: 'api',
      port: 3000,
    },
    temporal: {
      namespace: 'plutus.us.orchestration',
      taskQueue: 'plutus-orchestrator-us',
    },
    observability: {
      otlpTracesEndpoint: 'https://otel.us.plutus.dev/v1/traces',
      defaultResidency: 'us',
    },
    defaults: {
      residency: 'us',
      locale: 'en-US',
    },
    iam: {
      configService: {
        baseUrl: 'https://config.us.plutus.dev',
      },
    },
  },
  eu: {
    http: {
      host: '0.0.0.0',
      globalPrefix: 'api',
      port: 3100,
    },
    temporal: {
      namespace: 'plutus.eu.orchestration',
      taskQueue: 'plutus-orchestrator-eu',
    },
    observability: {
      otlpTracesEndpoint: 'https://otel.eu.plutus.dev/v1/traces',
      defaultResidency: 'eu',
    },
    defaults: {
      residency: 'eu',
      tenantId: 'tenant-eu-root',
      locale: 'en-GB',
    },
    iam: {
      http: {
        host: '0.0.0.0',
        globalPrefix: 'api/v1',
        port: 4100,
      },
      oidc: {
        issuer: 'https://auth.eu.plutus.dev/',
        audience: 'api://plutus-iam-eu',
      },
      configService: {
        baseUrl: 'https://config.eu.plutus.dev',
      },
    },
  },
};

/**
 * Deep merge utility tailored to {@link ResidencyProfile}. It keeps the function
 * dependency-free and easy to audit during security reviews.
 */
function mergeProfiles(base: ResidencyProfile, overrides: PartialProfile): ResidencyProfile {
  return {
    http: { ...base.http, ...(overrides.http ?? {}) },
    temporal: { ...base.temporal, ...(overrides.temporal ?? {}) },
    observability: {
      ...base.observability,
      ...(overrides.observability ?? {}),
    },
    defaults: {
      ...base.defaults,
      ...(overrides.defaults ?? {}),
    },
    iam: {
      http: { ...base.iam.http, ...(overrides.iam?.http ?? {}) },
      oidc: { ...base.iam.oidc, ...(overrides.iam?.oidc ?? {}) },
      policy: { ...base.iam.policy, ...(overrides.iam?.policy ?? {}) },
      configService: {
        ...base.iam.configService,
        ...(overrides.iam?.configService ?? {}),
      },
    },
  };
}

/**
 * Hydrates a residency profile by layering overrides on top of the shared defaults.
 */
function resolveResidencyProfile(
  residency: ResidencyCode,
  cwd: string,
): ResidencyProfile {
  const normalized = residency.toLowerCase();
  const base = baseProfile(cwd);
  const overrides = RESIDENCY_OVERRIDES[normalized] ?? {};
  const merged = mergeProfiles(base, overrides);
  return {
    ...merged,
    defaults: {
      ...merged.defaults,
      residency: residency,
    },
    observability: {
      ...merged.observability,
      defaultResidency:
        (overrides.observability?.defaultResidency ?? residency) as ResidencyCode,
      defaultTenant:
        overrides.observability?.defaultTenant ?? merged.observability.defaultTenant,
    },
  };
}

/**
 * Reads dotenv files in order and merges them into a map. Later files override
 * earlier values, mimicking how frameworks such as Next.js evaluate `.env` chains.
 */
function readDotenvChain(paths: readonly string[]): {
  readonly values: Record<string, string>;
  readonly sources: string[];
} {
  const values: Record<string, string> = {};
  const sources: string[] = [];
  const visited = new Set<string>();
  for (const candidate of paths) {
    if (!candidate || visited.has(candidate)) {
      continue;
    }
    visited.add(candidate);
    if (!existsSync(candidate)) {
      continue;
    }
    const parsed = parse(readFileSync(candidate));
    Object.assign(values, parsed);
    sources.push(candidate);
  }
  return { values, sources };
}

/**
 * Normalises the environment map and tracks which keys were ultimately used.
 */
function normaliseEnv(
  fromFiles: Record<string, string>,
  runtimeEnv: NodeJS.ProcessEnv,
): Record<string, string> {
  const resolved: Record<string, string> = { ...fromFiles };
  for (const [key, value] of Object.entries(runtimeEnv)) {
    if (typeof value === 'string') {
      resolved[key] = value;
    }
  }
  return resolved;
}

/**
 * Picks a string value from the merged environment and records the diagnostic entry.
 */
function pickString(
  key: string,
  resolved: Record<string, string>,
  diagnostics: Record<string, string>,
  fallback?: string,
  required = false,
): string {
  const raw = resolved[key];
  if (typeof raw === 'string' && raw.trim() !== '') {
    diagnostics[key] = raw;
    return raw.trim();
  }
  if (fallback !== undefined) {
    diagnostics[key] = fallback;
    return fallback;
  }
  if (required) {
    throw new ConfigError(`Missing required configuration value for ${key}`);
  }
  return '';
}

/**
 * Picks a numeric value, validating that the string is a finite number.
 */
function pickNumber(
  key: string,
  resolved: Record<string, string>,
  diagnostics: Record<string, string>,
  fallback?: number,
): number {
  const raw = resolved[key];
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      throw new ConfigError(`Configuration value for ${key} must be numeric. Received "${raw}".`);
    }
    diagnostics[key] = raw;
    return parsed;
  }
  if (fallback !== undefined) {
    diagnostics[key] = String(fallback);
    return fallback;
  }
  throw new ConfigError(`Missing required numeric configuration value for ${key}`);
}

/**
 * Public entry point that resolves residency-aware configuration for services.
 * See {@link LoadConfigOptions} for override semantics.
 */
export function loadConfig(options: LoadConfigOptions = {}): PlatformConfig {
  const envFromProcess = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const environment =
    options.environment ?? envFromProcess.PLUTUS_ENV ?? envFromProcess.NODE_ENV ?? 'development';
  const residency = (options.residency ?? envFromProcess.PLUTUS_RESIDENCY ?? 'us') as ResidencyCode;
  const normalizedResidency = residency.toLowerCase() as ResidencyCode;

  const configRoot = options.dotenvRoot
    ? resolve(cwd, options.dotenvRoot)
    : envFromProcess.PLUTUS_CONFIG_ROOT
      ? resolve(cwd, envFromProcess.PLUTUS_CONFIG_ROOT)
      : resolve(cwd, 'envs');

  const candidateFiles = [
    join(configRoot, '.env.shared'),
    join(configRoot, `${normalizedResidency}`, '.env'),
    join(configRoot, `${normalizedResidency}`, `.env.${environment}`),
    join(configRoot, '.env.local'),
    join(configRoot, `${normalizedResidency}`, '.env.local'),
    ...(options.additionalFiles?.map((file) => resolve(file)) ?? []),
  ];

  const chain = readDotenvChain(candidateFiles);
  const resolvedEnv = normaliseEnv(chain.values, envFromProcess);
  const diagnosticsMap: Record<string, string> = {};
  const profile = resolveResidencyProfile(normalizedResidency, cwd);

  const http: HttpConfig = {
    host: pickString('PLUTUS_HTTP_HOST', resolvedEnv, diagnosticsMap, profile.http.host, true),
    port: pickNumber('PLUTUS_HTTP_PORT', resolvedEnv, diagnosticsMap, profile.http.port),
    globalPrefix: pickString(
      'PLUTUS_HTTP_PREFIX',
      resolvedEnv,
      diagnosticsMap,
      profile.http.globalPrefix,
      true,
    ),
  };

  const temporal: TemporalConfig = {
    namespace: pickString(
      'TEMPORAL_NAMESPACE',
      resolvedEnv,
      diagnosticsMap,
      profile.temporal.namespace,
      true,
    ),
    taskQueue: pickString(
      'TEMPORAL_TASK_QUEUE',
      resolvedEnv,
      diagnosticsMap,
      profile.temporal.taskQueue,
      true,
    ),
    targetResidency: (resolvedEnv['TEMPORAL_TARGET_RESIDENCY'] ?? normalizedResidency) as ResidencyCode,
  };
  diagnosticsMap['TEMPORAL_TARGET_RESIDENCY'] = temporal.targetResidency;

  const defaults: SharedDefaults = {
    tenantId: pickString(
      'PLUTUS_DEFAULT_TENANT',
      resolvedEnv,
      diagnosticsMap,
      profile.defaults.tenantId,
      true,
    ),
    residency: (resolvedEnv['PLUTUS_DEFAULT_RESIDENCY'] ?? profile.defaults.residency) as ResidencyCode,
    locale: pickString('PLUTUS_DEFAULT_LOCALE', resolvedEnv, diagnosticsMap, profile.defaults.locale),
  };

  const resolvedDefaultResidency = (
    resolvedEnv['OBS_DEFAULT_RESIDENCY'] ?? profile.observability.defaultResidency
  ) as ResidencyCode;

  const observability: ObservabilityConfig = {
    otlpTracesEndpoint: pickString(
      'OBS_OTLP_TRACES_ENDPOINT',
      resolvedEnv,
      diagnosticsMap,
      profile.observability.otlpTracesEndpoint,
      true,
    ),
    otlpMetricsEndpoint: pickString(
      'OBS_OTLP_METRICS_ENDPOINT',
      resolvedEnv,
      diagnosticsMap,
      profile.observability.otlpMetricsEndpoint,
    ) || undefined,
    otlpLogsEndpoint:
      pickString('OBS_OTLP_LOGS_ENDPOINT', resolvedEnv, diagnosticsMap, profile.observability.otlpLogsEndpoint) ||
      undefined,
    serviceName:
      pickString('OBS_SERVICE_NAME', resolvedEnv, diagnosticsMap, profile.observability.serviceName) ||
      undefined,
    version:
      pickString('OBS_SERVICE_VERSION', resolvedEnv, diagnosticsMap, profile.observability.version) || undefined,
    defaultTenant:
      pickString('OBS_DEFAULT_TENANT', resolvedEnv, diagnosticsMap, defaults.tenantId) || undefined,
    defaultResidency: resolvedDefaultResidency,
  };

  diagnosticsMap['OBS_DEFAULT_RESIDENCY'] = resolvedDefaultResidency;
  diagnosticsMap['PLUTUS_DEFAULT_RESIDENCY'] = defaults.residency;

  const iamHttp: HttpConfig = {
    host: pickString('IAM_HTTP_HOST', resolvedEnv, diagnosticsMap, profile.iam.http.host, true),
    port: pickNumber('IAM_HTTP_PORT', resolvedEnv, diagnosticsMap, profile.iam.http.port),
    globalPrefix: pickString(
      'IAM_HTTP_PREFIX',
      resolvedEnv,
      diagnosticsMap,
      profile.iam.http.globalPrefix,
      true,
    ),
  };

  const iam: IamServiceConfig = {
    http: iamHttp,
    oidc: {
      issuer: pickString(
        'IAM_OIDC_ISSUER',
        resolvedEnv,
        diagnosticsMap,
        profile.iam.oidc.issuer,
        true,
      ),
      audience: pickString(
        'IAM_OIDC_AUDIENCE',
        resolvedEnv,
        diagnosticsMap,
        profile.iam.oidc.audience,
        true,
      ),
    },
    policy: {
      bundlePath: pickString(
        'IAM_POLICY_BUNDLE_PATH',
        resolvedEnv,
        diagnosticsMap,
        profile.iam.policy.bundlePath,
        true,
      ),
    },
    configService: {
      baseUrl: pickString(
        'IAM_CONFIG_SERVICE_URL',
        resolvedEnv,
        diagnosticsMap,
        profile.iam.configService.baseUrl,
        true,
      ),
    },
    defaults,
  };

  const diagnostics: ConfigDiagnostics = {
    residency: normalizedResidency,
    environment,
    sources: chain.sources,
    resolvedEnv: Object.fromEntries(
      ORDERED_KEYS.filter((key) => diagnosticsMap[key] !== undefined).map((key) => [
        key,
        diagnosticsMap[key]!,
      ]),
    ),
  };

  return {
    env: environment,
    residency: normalizedResidency,
    http,
    temporal,
    observability,
    defaults,
    services: { iam },
    diagnostics,
  };
}
