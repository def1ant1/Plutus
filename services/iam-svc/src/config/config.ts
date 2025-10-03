export interface IamConfig {
  http: {
    host: string;
    port: number;
    globalPrefix: string;
  };
  oidc: {
    issuer: string;
    audience: string;
  };
  policy: {
    bundlePath: string;
  };
  configService: {
    baseUrl: string;
  };
  defaults: {
    tenantId: string;
    residency: string;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): IamConfig {
  return {
    http: {
      host: env.IAM_HTTP_HOST ?? '0.0.0.0',
      port: Number(env.IAM_HTTP_PORT ?? 4000),
      globalPrefix: env.IAM_HTTP_PREFIX ?? 'api/v1',
    },
    oidc: {
      issuer: env.IAM_OIDC_ISSUER ?? 'https://example-issuer/',
      audience: env.IAM_OIDC_AUDIENCE ?? 'api://plutus-iam',
    },
    policy: {
      bundlePath:
        env.IAM_POLICY_BUNDLE_PATH ?? `${process.cwd()}/services/iam-svc/src/policies/decision-matrix.json`,
    },
    configService: {
      baseUrl: env.IAM_CONFIG_SERVICE_URL ?? 'https://config-svc.local',
    },
    defaults: {
      tenantId: env.IAM_DEFAULT_TENANT ?? 'tenant-root',
      residency: env.IAM_DEFAULT_RESIDENCY ?? 'us',
    },
  };
}
