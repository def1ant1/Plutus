import type { StructuredLogger } from '@plutus/observability';
import { createLogger, resolveObservabilityOptionsFromEnv } from '@plutus/observability';

const GLOBAL_LOGGER_KEY = Symbol.for('portal-web.logger');

type GlobalLoggerState = {
  logger?: StructuredLogger;
};

function getGlobalLoggerState(): GlobalLoggerState {
  const globals = globalThis as typeof globalThis & {
    [GLOBAL_LOGGER_KEY]?: GlobalLoggerState;
  };
  if (!globals[GLOBAL_LOGGER_KEY]) {
    globals[GLOBAL_LOGGER_KEY] = {};
  }
  return globals[GLOBAL_LOGGER_KEY] as GlobalLoggerState;
}

/** Returns a cached structured logger for use within Next.js server components. */
export function getLogger(): StructuredLogger {
  const state = getGlobalLoggerState();
  if (!state.logger) {
    const options = resolveObservabilityOptionsFromEnv({
      serviceName: 'portal-web',
      environment: process.env.NODE_ENV ?? 'development',
      defaultTenantId: process.env.NEXT_PUBLIC_TENANT ?? 'tenant-root',
      defaultResidency: process.env.NEXT_PUBLIC_RESIDENCY ?? 'us',
      resourceAttributes: {
        'app.tier': 'experience',
        'app.component': 'portal-web',
      },
    });
    state.logger = createLogger(options);
  }
  return state.logger;
}
