import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { loadConfig } from '@plutus/config';
import {
  createLogger,
  createLoggerAdapter,
  createTelemetrySdk,
  resolveObservabilityOptionsFromEnv,
} from '@plutus/observability';
import { AppModule } from './app/app.module';

/**
 * Boots the Fastify-powered Nest application with hardened security middleware, shared
 * logger/telemetry instrumentation, and graceful shutdown hooks suitable for production.
 * Mirrors the configuration served to the portal so platform teams see identical data
 * across channels during pre-production shakeouts.
 */
async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const adapter = new FastifyAdapter({ logger: false });
  /** Type alias describing the Fastify plugin signature expected by the adapter. */
  type FastifyPlugin = Parameters<typeof adapter.register>[0];
  /**
   * Coerces community Fastify middleware into the stricter Nest adapter signature without
   * losing type safety elsewhere in the bootstrap sequence.
   */
  const asPlugin = (plugin: unknown): FastifyPlugin => plugin as FastifyPlugin;

  adapter.register(asPlugin(fastifyHelmet), { global: true });
  adapter.register(asPlugin(fastifyCompress), { global: true });
  adapter.register(asPlugin(fastifyCors), { origin: true, credentials: true });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    {
      bufferLogs: true,
    },
  );

  const telemetryOptions = resolveObservabilityOptionsFromEnv({
    serviceName: config.observability?.serviceName ?? 'orchestrator-svc',
    serviceVersion: config.observability?.version,
    environment: config.env,
    defaultTenantId:
      config.observability?.defaultTenant ?? config.defaults?.tenantId ?? 'tenant-root',
    defaultResidency:
      config.observability?.defaultResidency ?? config.defaults?.residency ?? 'us',
    resourceAttributes: {
      'app.tier': 'orchestration',
      'app.component': 'workflow-engine',
    },
  });

  const logger = createLogger(telemetryOptions);
  app.useLogger(createLoggerAdapter(logger));

  const telemetrySdk = createTelemetrySdk(telemetryOptions);
  await telemetrySdk.start();

  app.enableShutdownHooks();
  adapter.getInstance().addHook('onClose', async () => {
    await telemetrySdk.shutdown();
  });

  app.setGlobalPrefix(config.http.globalPrefix);
  await app.listen({ port: config.http.port, host: config.http.host });

  logger.info(
    {
      host: config.http.host,
      port: config.http.port,
      prefix: config.http.globalPrefix,
      env: config.env,
    },
    '🚀 orchestrator-svc ready',
  );
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap orchestrator-svc', error);
  process.exit(1);
});
