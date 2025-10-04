import { loadConfig as loadPlatformConfig, IamServiceConfig } from '@plutus/config';

/**
 * IAM-specific view of the shared platform configuration. We intentionally keep
 * the shape identical to the previous bespoke loader so bootstrap wiring inside
 * `main.ts` remains unchanged while benefitting from the residency-aware defaults
 * centralised in `@plutus/config`.
 */
export type IamConfig = IamServiceConfig;

/**
 * Resolves IAM configuration using the shared platform loader. The returned object
 * is memo-free and should be invoked during bootstrap so environment overrides and
 * `.env` updates are always honoured.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): IamConfig {
  const platformConfig = loadPlatformConfig({ env });
  return platformConfig.services.iam;
}
