import fs from 'node:fs/promises';
import path from 'node:path';
import { AccessDecision, AccessRequestContext } from '../types';

export interface PolicyCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'gte' | 'lte';
  value: unknown;
}

export interface PolicyRule {
  anyRole?: string[];
  allRoles?: string[];
  conditions?: PolicyCondition[];
  reasons?: string[];
  remediation?: string[];
}

export interface PolicyBundle {
  version: string;
  entrypoints: Record<string, PolicyRule[]>;
}

export interface PolicyEngineOptions {
  bundlePath: string;
  hotReload?: boolean;
}

/**
 * Lightweight ABAC/RBAC evaluator. In production this JSON is generated from
 * Rego via `opa eval` to keep the rules auditable while avoiding bundling the
 * full WASM runtime. Each evaluate() call iterates deterministic rules to
 * ensure the output is explainable.
 */
export class PolicyEngine {
  private readonly bundlePath: string;
  private cache?: PolicyBundle;

  constructor(private readonly options: PolicyEngineOptions) {
    this.bundlePath = path.resolve(options.bundlePath);
  }

  private async loadBundle(): Promise<PolicyBundle> {
    if (!this.options.hotReload && this.cache) {
      return this.cache;
    }
    const raw = await fs.readFile(this.bundlePath, 'utf-8');
    const bundle = JSON.parse(raw) as PolicyBundle;
    if (!this.options.hotReload) {
      this.cache = bundle;
    }
    return bundle;
  }

  async evaluate(context: AccessRequestContext): Promise<AccessDecision> {
    const bundle = await this.loadBundle();
    const rules = bundle.entrypoints[context.action] ?? [];
    const reasons: string[] = [];
    const remediation: string[] = [];

    const roles = new Set<string>(
      Array.isArray(context.claims.rawPayload['roles'])
        ? (context.claims.rawPayload['roles'] as string[])
        : [],
    );

    const matchesRule = (rule: PolicyRule): boolean => {
      if (rule.anyRole && !rule.anyRole.some((role) => roles.has(role))) {
        reasons.push(
          ...(rule.reasons ?? [`missing_required_role:${rule.anyRole.join(',')}`]),
        );
        remediation.push(...(rule.remediation ?? ['request role elevation']));
        return false;
      }
      if (rule.allRoles && !rule.allRoles.every((role) => roles.has(role))) {
        reasons.push(
          ...(rule.reasons ?? [`missing_all_roles:${rule.allRoles.join(',')}`]),
        );
        remediation.push(...(rule.remediation ?? ['request role elevation']));
        return false;
      }

      if (!rule.conditions) {
        return true;
      }

      const passed = rule.conditions.every((condition) => this.evaluateCondition(condition, context));
      if (!passed) {
        reasons.push(...(rule.reasons ?? ['abac_condition_failed']));
        remediation.push(...(rule.remediation ?? ['review resource attributes']));
      }
      return passed;
    };

    for (const rule of rules) {
      if (matchesRule(rule)) {
        return { allow: true };
      }
    }

    return { allow: false, reasons: reasons.length ? reasons : undefined, remediation: remediation.length ? remediation : undefined };
  }

  private evaluateCondition(condition: PolicyCondition, context: AccessRequestContext): boolean {
    const value = this.resolveField(condition.field, context);
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'nin':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'gte':
        return typeof value === 'number' && typeof condition.value === 'number' && value >= condition.value;
      case 'lte':
        return typeof value === 'number' && typeof condition.value === 'number' && value <= condition.value;
      default:
        return false;
    }
  }

  private resolveField(field: string, context: AccessRequestContext): unknown {
    const [scope, ...pathSegments] = field.split('.');
    let current: unknown;
    switch (scope) {
      case 'claims':
        current = context.claims as unknown as Record<string, unknown>;
        break;
      case 'resource':
        current = context.resource;
        break;
      case 'environment':
        current = context.environment;
        break;
      default:
        return undefined;
    }
    for (const segment of pathSegments) {
      if (
        current &&
        typeof current === 'object' &&
        segment in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }
    return current;
  }
}
