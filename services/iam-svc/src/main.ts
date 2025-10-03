import 'reflect-metadata';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { AuthenticationMiddleware } from '@plutus/security';
import {
  createLogger,
  createLoggerAdapter,
  createTelemetrySdk,
  resolveObservabilityOptionsFromEnv,
} from '@plutus/observability';
import { AppModule } from './app/app.module';
import { loadConfig } from './config/config';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const telemetryOptions = resolveObservabilityOptionsFromEnv({
    serviceName: 'iam-svc',
    environment: process.env.NODE_ENV ?? 'development',
    defaultTenantId: config.defaults.tenantId,
    defaultResidency: config.defaults.residency,
    resourceAttributes: {
      'app.tier': 'identity',
      'app.component': 'iam-core',
    },
  });

  const logger = createLogger(telemetryOptions);
  const telemetrySdk = createTelemetrySdk(telemetryOptions);

  const adapter = new FastifyAdapter({ logger: false });
  type FastifyPlugin = Parameters<typeof adapter.register>[0];
  const asPlugin = (plugin: unknown): FastifyPlugin => plugin as FastifyPlugin;

  adapter.register(asPlugin(fastifyHelmet), { global: true });
  adapter.register(asPlugin(fastifyCompress), { global: true });
  adapter.register(asPlugin(fastifyCors), { origin: true, credentials: true });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  app.useLogger(createLoggerAdapter(logger));

  await telemetrySdk.start();
  app.enableShutdownHooks();
  adapter.getInstance().addHook('onClose', async () => {
    await telemetrySdk.shutdown();
  });

  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix(config.http.globalPrefix);

  const middleware = new AuthenticationMiddleware({
    issuer: config.oidc.issuer,
    audience: config.oidc.audience,
    configService: { baseUrl: config.configService.baseUrl },
    policyBundlePath: config.policy.bundlePath ?? join(__dirname, 'policies', 'decision-matrix.json'),
    defaultTenant: config.defaults.tenantId,
    defaultResidency: config.defaults.residency,
  });

  adapter.getInstance().addHook('preHandler', middleware.handler);

  await app.listen({ port: config.http.port, host: config.http.host });
  logger.info(
    {
      host: config.http.host,
      port: config.http.port,
      prefix: config.http.globalPrefix,
      tenant: config.defaults.tenantId,
      residency: config.defaults.residency,
    },
    `iam-svc listening on http://${config.http.host}:${config.http.port}/${config.http.globalPrefix}`,
  );
}

bootstrap().catch((error) => {
  const telemetryOptions = resolveObservabilityOptionsFromEnv({ serviceName: 'iam-svc' });
  const logger = createLogger(telemetryOptions);
  logger.error(error, 'Failed to bootstrap iam-svc');
  process.exit(1);
});
