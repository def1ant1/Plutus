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
import { AppModule } from './app/app.module';
import { loadConfig } from './config/config';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const adapter = new FastifyAdapter({ logger: true });
  type FastifyPlugin = Parameters<typeof adapter.register>[0];
  const asPlugin = (plugin: unknown): FastifyPlugin => plugin as FastifyPlugin;

  adapter.register(asPlugin(fastifyHelmet), { global: true });
  adapter.register(asPlugin(fastifyCompress), { global: true });
  adapter.register(asPlugin(fastifyCors), { origin: true, credentials: true });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
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
  app.getLogger?.()?.log(
    `iam-svc listening on http://${config.http.host}:${config.http.port}/${config.http.globalPrefix}`,
  );
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap iam-svc', error);
  process.exit(1);
});
