declare module '@plutus/config' {
  export interface HttpConfig {
    host: string;
    port: number;
    globalPrefix: string;
  }

  export interface OrchestratorConfig {
    env: string;
    http: HttpConfig;
    temporal: {
      namespace: string;
      taskQueue: string;
    };
    defaults?: {
      tenantId?: string;
      residency?: string;
    };
    observability: {
      otlpTracesEndpoint: string;
      serviceName?: string;
      version?: string;
      defaultTenant?: string;
      defaultResidency?: string;
    };
  }

  export function loadConfig(env?: NodeJS.ProcessEnv): OrchestratorConfig;
}
