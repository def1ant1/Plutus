import pino, { type Logger, type LoggerOptions } from 'pino';
import type { ObservabilityOptions } from './types';

const DEFAULT_REDACT_PATHS: string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.secret',
  'user.password',
  'user.token',
  'user.ssn',
  'metadata.apiKey',
];

/** Minimal subset of NestJS' LoggerService interface used by consumers. */
export interface MinimalNestLoggerService {
  log(message: unknown, context?: string): void;
  error(message: unknown, trace?: string, context?: string): void;
  warn(message: unknown, context?: string): void;
  debug?(message: unknown, context?: string): void;
  verbose?(message: unknown, context?: string): void;
  setLogLevels?(levels: Array<'log' | 'error' | 'warn' | 'debug' | 'verbose'>): void;
}

/**
 * Creates a hardened Pino logger configured for structured JSON output, default
 * redaction, and contextual enrichment that mirrors the OpenTelemetry resource.
 * The return value can be used directly or via {@link createLoggerAdapter} to
 * plug into NestJS' LoggerService abstraction.
 */
export function createLogger(options: ObservabilityOptions): Logger {
  const {
    serviceName,
    serviceVersion,
    environment,
    tenantId,
    residency,
    logLevel = 'info',
    loggerOptions,
    redactKeys = [],
  } = options;

  const mergedRedactions = Array.from(new Set([...DEFAULT_REDACT_PATHS, ...redactKeys]));
  const base: Record<string, unknown> = {
    service: serviceName,
    version: serviceVersion,
    environment,
    tenant: tenantId,
    residency,
  };

  const config: LoggerOptions = {
    level: logLevel,
    base,
    redact: {
      paths: mergedRedactions,
      censor: '[REDACTED]',
      remove: false,
    },
    timestamp: () => `"time":"${new Date().toISOString()}"`,
    ...loggerOptions,
  };

  const logger = pino(config);
  logger.debug({ mergedRedactions }, 'Observability logger initialized with redaction list');
  return logger;
}

/**
 * Transforms a Pino logger into a NestJS compatible LoggerService implementation
 * so existing Nest code (including third-party modules) can participate in the
 * centralized structured logging pipeline.
 */
export function createLoggerAdapter(logger: Logger): MinimalNestLoggerService {
  const normalize = (message: unknown): unknown => {
    if (message instanceof Error) {
      return { message: message.message, stack: message.stack };
    }
    return message;
  };

  const adapter: MinimalNestLoggerService = {
    log(message: unknown, context?: string) {
      logger.info({ context, payload: normalize(message) });
    },
    error(message: unknown, trace?: string, context?: string) {
      logger.error({ context, trace, payload: normalize(message) });
    },
    warn(message: unknown, context?: string) {
      logger.warn({ context, payload: normalize(message) });
    },
    debug(message: unknown, context?: string) {
      logger.debug({ context, payload: normalize(message) });
    },
    verbose(message: unknown, context?: string) {
      logger.trace({ context, payload: normalize(message) });
    },
    setLogLevels(levels: Array<'log' | 'error' | 'warn' | 'debug' | 'verbose'>) {
      if (levels.includes('debug')) {
        logger.level = 'debug';
      } else if (!levels.includes('log')) {
        logger.level = 'warn';
      }
    },
  };

  return adapter;
}

export type StructuredLogger = Logger;
