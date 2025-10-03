import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import type { IncomingMessage } from 'http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { PeriodicExportingMetricReader, type MetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import type { NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor, ConsoleSpanExporter, type SpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
  defaultResource,
  resourceFromAttributes,
  type Resource,
} from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { StandardAttributeSpanProcessor } from './span-processor';
import type { ObservabilityOptions } from './types';

const GLOBAL_STATE_KEY = Symbol.for('plutus.observability.global');

interface GlobalTelemetryState {
  sdk?: NodeSDK;
  startPromise?: Promise<void>;
  options?: ObservabilityOptions;
}

function getGlobalState(): GlobalTelemetryState {
  const globalSymbols = globalThis as typeof globalThis & {
    [GLOBAL_STATE_KEY]?: GlobalTelemetryState;
  };
  if (!globalSymbols[GLOBAL_STATE_KEY]) {
    globalSymbols[GLOBAL_STATE_KEY] = {};
  }
  return globalSymbols[GLOBAL_STATE_KEY] as GlobalTelemetryState;
}

function buildResource(options: ObservabilityOptions): Resource {
  const { serviceName, serviceVersion, environment, tenantId, residency, resourceAttributes } = options;
  const attributes = Object.fromEntries(
    Object.entries({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
      'tenant.id': tenantId,
      'data.residency': residency,
      ...resourceAttributes,
    }).filter(([, value]) => value !== undefined && value !== ''),
  );

  return defaultResource().merge(resourceFromAttributes(attributes));
}

function configureDiagLogger(logLevel?: string): void {
  const level = logLevel === 'debug' ? DiagLogLevel.DEBUG : DiagLogLevel.WARN;
  diag.setLogger(new DiagConsoleLogger(), level);
}

function createSpanProcessors(options: ObservabilityOptions): SpanProcessor[] {
  const exporter = options.otlpTracesEndpoint
    ? new OTLPTraceExporter({ url: options.otlpTracesEndpoint })
    : new ConsoleSpanExporter();

  const standardProcessor = new StandardAttributeSpanProcessor(options);
  const batchProcessor = new BatchSpanProcessor(exporter, {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
  });

  return [standardProcessor, batchProcessor];
}

function createMetricReaders(options: ObservabilityOptions): MetricReader[] {
  const readers: MetricReader[] = [];

  if (options.otlpMetricsEndpoint) {
    readers.push(
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: options.otlpMetricsEndpoint }),
        exportIntervalMillis: 15000,
      }),
    );
  }

  if (options.prometheus?.enabled !== false) {
    readers.push(
      new PrometheusExporter({
        port: options.prometheus?.port ?? 9464,
        host: options.prometheus?.host,
        endpoint: options.prometheus?.endpoint ?? '/metrics',
      }),
    );
  }

  return readers;
}

function shouldIgnoreRequest(url: string | undefined, patterns?: Array<string | RegExp>): boolean {
  if (!url || !patterns?.length) {
    return false;
  }

  return patterns.some((pattern) =>
    typeof pattern === 'string' ? url.startsWith(pattern) : pattern.test(url),
  );
}

/**
 * Builds a NodeSDK instance with enterprise defaults suitable for NestJS or
 * Next.js server runtimes. Consumers are expected to call `start()` before
 * handling traffic and `shutdown()` during graceful termination.
 */
export function createTelemetrySdk(options: ObservabilityOptions): NodeSDK {
  configureDiagLogger(options.logLevel);
  const resource = buildResource(options);
  const spanProcessors = createSpanProcessors(options);
  const metricReaders = createMetricReaders(options);

  const ignoreIncomingRequestHook = options.ignoredIncomingPaths?.length
    ? (request: IncomingMessage) => shouldIgnoreRequest(request.url, options.ignoredIncomingPaths)
    : undefined;

  const instrumentations = getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-http': {
      ignoreIncomingRequestHook,
    },
    '@opentelemetry/instrumentation-fastify': {
      enabled: true,
    },
  });

  const config: Partial<NodeSDKConfiguration> = {
    resource,
    instrumentations,
    spanProcessors,
  };

  if (metricReaders.length === 1) {
    config.metricReader = metricReaders[0];
  } else if (metricReaders.length > 1) {
    config.metricReaders = metricReaders;
  }

  return new NodeSDK(config);
}

/**
 * Ensures a single telemetry SDK is started for the current process. This is
 * safe to call in Next.js' `instrumentation.ts` (runs on every reload) or in
 * NestJS bootstrap flows that might execute multiple times during testing.
 */
export async function ensureTelemetryStarted(options: ObservabilityOptions): Promise<NodeSDK> {
  const state = getGlobalState();

  if (state.sdk) {
    return state.sdk;
  }

  const sdk = createTelemetrySdk(options);
  state.sdk = sdk;
  state.options = options;
  state.startPromise = (async () => {
    try {
      sdk.start();
    } catch (error) {
      state.sdk = undefined;
      throw error;
    }
  })();
  await state.startPromise;
  return sdk;
}

/** Shuts down the globally cached telemetry SDK if one exists. */
export async function shutdownGlobalTelemetry(): Promise<void> {
  const state = getGlobalState();
  if (!state.sdk) {
    return;
  }
  await state.startPromise?.catch(() => undefined);
  await state.sdk.shutdown();
  state.sdk = undefined;
  state.options = undefined;
  state.startPromise = undefined;
}

export type TelemetrySdk = NodeSDK;
