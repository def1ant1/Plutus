import { resolve } from 'node:path';
import { loadConfig, ConfigError } from '../index';

describe('loadConfig', () => {
  const fixturesRoot = resolve(__dirname, '../fixtures/envs');

  it('merges shared/us staging dotenv chain with runtime overrides', () => {
    const config = loadConfig({
      env: {
        PLUTUS_ENV: 'staging',
        PLUTUS_RESIDENCY: 'us',
      },
      dotenvRoot: fixturesRoot,
    });

    expect(config.env).toBe('staging');
    expect(config.residency).toBe('us');
    expect(config.http).toEqual({
      host: '127.0.0.1',
      port: 4300,
      globalPrefix: 'api/v1',
    });
    expect(config.temporal.namespace).toBe('temporal-us');
    expect(config.temporal.taskQueue).toBe('temporal-queue-us');
    expect(config.observability.otlpTracesEndpoint).toBe('https://otel.us.custom/v1/traces');
    expect(config.observability.serviceName).toBe('portal-web');
    expect(config.observability.version).toBe('2024.10.01');
    expect(config.defaults.tenantId).toBe('tenant-shared');
    expect(config.services.iam.policy.bundlePath).toBe('/fixtures/shared/bundle.json');
    expect(config.diagnostics.sources.length).toBeGreaterThanOrEqual(2);
  });

  it('prefers explicit environment variables over dotenv files', () => {
    const config = loadConfig({
      env: {
        PLUTUS_ENV: 'staging',
        PLUTUS_RESIDENCY: 'us',
        PLUTUS_HTTP_PORT: '9999',
        OBS_OTLP_TRACES_ENDPOINT: 'https://override/v1/traces',
      },
      dotenvRoot: fixturesRoot,
    });

    expect(config.http.port).toBe(9999);
    expect(config.observability.otlpTracesEndpoint).toBe('https://override/v1/traces');
    expect(config.diagnostics.resolvedEnv.PLUTUS_HTTP_PORT).toBe('9999');
  });

  it('applies EU residency defaults when dotenv files omit values', () => {
    const config = loadConfig({
      env: {
        PLUTUS_ENV: 'production',
        PLUTUS_RESIDENCY: 'eu',
      },
      dotenvRoot: fixturesRoot,
    });

    expect(config.residency).toBe('eu');
    expect(config.http.port).toBe(5200);
    expect(config.temporal.namespace).toBe('temporal-eu');
    expect(config.defaults.residency).toBe('eu');
    expect(config.defaults.tenantId).toBe('tenant-eu-fixture');
    expect(config.defaults.locale).toBe('en-GB');
    expect(config.observability.serviceName).toBe('orchestrator-svc');
    expect(config.services.iam.oidc.issuer).toBe('https://auth.eu.fixture/');
    expect(config.services.iam.http.port).toBe(4100);
  });

  it('supports appending bespoke dotenv files for smoke-test scenarios', () => {
    const additional = resolve(__dirname, '../fixtures/custom/.env.override');
    const config = loadConfig({
      env: {
        PLUTUS_ENV: 'staging',
        PLUTUS_RESIDENCY: 'us',
      },
      dotenvRoot: fixturesRoot,
      additionalFiles: [additional],
    });

    expect(config.observability.serviceName).toBe('custom-override');
    expect(config.diagnostics.sources.some((source) => source.endsWith('.env.override'))).toBe(true);
  });

  it('throws a ConfigError when numeric env vars are invalid', () => {
    expect(() =>
      loadConfig({
        env: {
          PLUTUS_ENV: 'staging',
          PLUTUS_RESIDENCY: 'us',
          PLUTUS_HTTP_PORT: 'not-a-number',
        },
        dotenvRoot: fixturesRoot,
      }),
    ).toThrow(ConfigError);
  });
});
