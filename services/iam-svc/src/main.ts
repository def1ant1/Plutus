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
import { loadConfig } from '@plutus/config';
import { AppModule } from './app/app.module';

async function bootstrap(): Promise<void> {
  const platformConfig = loadConfig();
  const iamConfig = platformConfig.services.iam;
  const telemetryOptions = resolveObservabilityOptionsFromEnv({
    serviceName: platformConfig.observability.serviceName ?? 'iam-svc',
    serviceVersion: platformConfig.observability.version,
    environment: platformConfig.env,
    defaultTenantId:
      platformConfig.observability.defaultTenant ?? platformConfig.defaults.tenantId,
    defaultResidency:
      platformConfig.observability.defaultResidency ?? platformConfig.defaults.residency,
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
  app.setGlobalPrefix(iamConfig.http.globalPrefix);

  const middleware = new AuthenticationMiddleware({
    issuer: iamConfig.oidc.issuer,
    audience: iamConfig.oidc.audience,
    configService: { baseUrl: iamConfig.configService.baseUrl },
    policyBundlePath:
      iamConfig.policy.bundlePath ?? join(__dirname, 'policies', 'decision-matrix.json'),
    defaultTenant: platformConfig.defaults.tenantId,
    defaultResidency: platformConfig.defaults.residency,
  });

  adapter.getInstance().addHook('preHandler', middleware.handler);

  await app.listen({ port: iamConfig.http.port, host: iamConfig.http.host });
  logger.info(
    {
      host: iamConfig.http.host,
      port: iamConfig.http.port,
      prefix: iamConfig.http.globalPrefix,
      tenant: platformConfig.defaults.tenantId,
      residency: platformConfig.defaults.residency,
    },
    `iam-svc listening on http://${iamConfig.http.host}:${iamConfig.http.port}/${iamConfig.http.globalPrefix}`,
  );
}

bootstrap().catch((error) => {
  const telemetryOptions = resolveObservabilityOptionsFromEnv({ serviceName: 'iam-svc' });
  const logger = createLogger(telemetryOptions);
  logger.error(error, 'Failed to bootstrap iam-svc');
  process.exit(1);
});
