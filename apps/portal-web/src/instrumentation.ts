import { ensureTelemetryStarted, resolveObservabilityOptionsFromEnv } from '@plutus/observability';

/**
 * Next.js instrumentation entry point. Runs once per server start (and again on
 * hot reload in dev) to ensure the global telemetry SDK is bootstrapped with
 * consistent tenant/residency metadata.
 */
export async function register(): Promise<void> {
  const telemetryOptions = resolveObservabilityOptionsFromEnv({
    serviceName: 'portal-web',
    environment: process.env.NODE_ENV ?? 'development',
    serviceVersion: process.env.NEXT_PUBLIC_RELEASE,
    defaultTenantId: process.env.NEXT_PUBLIC_TENANT ?? 'tenant-root',
    defaultResidency: process.env.NEXT_PUBLIC_RESIDENCY ?? 'us',
    resourceAttributes: {
      'app.tier': 'experience',
      'app.component': 'portal-web',
    },
  });

  await ensureTelemetryStarted(telemetryOptions);
}

export const config = {
  unstable_includeFiles: ['libs/observability/dist/**/*'],
};
