import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { KeyRotationRequest, Residency, ServiceAccountRequest, TenantOnboardingRequest } from './dto';

export interface TenantRecord {
  id: string;
  name: string;
  residency: Residency;
  externalId: string;
  onboardedAt: string;
}

export interface ServiceAccountRecord {
  id: string;
  tenantId: string;
  workload: string;
  residency: Residency;
  clientId: string;
  clientSecret: string;
  createdAt: string;
}

export interface KeyRotationRecord {
  keyId: string;
  rotationType: string;
  rotatedAt: string;
  ticket?: string;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  log(event: string, payload: Record<string, unknown>): void {
    this.logger.log(JSON.stringify({ event, ...payload }));
  }
}

@Injectable()
export class TenantOnboardingService {
  private readonly tenants = new Map<string, TenantRecord>();

  constructor(private readonly audit: AdminAuditService) {}

  onboard(tenantId: string, request: TenantOnboardingRequest): TenantRecord {
    const record: TenantRecord = {
      id: tenantId,
      name: request.name,
      residency: request.residency,
      externalId: request.externalId,
      onboardedAt: new Date().toISOString(),
    };
    this.tenants.set(record.id, record);
    this.audit.log('tenant.onboarded', record as unknown as Record<string, unknown>);
    return record;
  }
}

@Injectable()
export class ServiceAccountAutomationService {
  private counter = 0;

  constructor(private readonly audit: AdminAuditService) {}

  provision(tenantId: string, request: ServiceAccountRequest): ServiceAccountRecord {
    const record: ServiceAccountRecord = {
      id: `svc-${++this.counter}`,
      tenantId,
      workload: request.workload,
      residency: request.residency,
      clientId: `client-${randomUUID()}`,
      clientSecret: randomUUID().replace(/-/g, ''),
      createdAt: new Date().toISOString(),
    };
    this.audit.log('serviceAccount.provisioned', record as unknown as Record<string, unknown>);
    return record;
  }
}

@Injectable()
export class KeyRotationService {
  constructor(private readonly audit: AdminAuditService) {}

  rotate(tenantId: string, request: KeyRotationRequest): KeyRotationRecord {
    const record: KeyRotationRecord = {
      keyId: request.keyId,
      rotationType: request.rotationType,
      rotatedAt: new Date().toISOString(),
      ticket: request.breakglassTicket,
    };
    this.audit.log('key.rotated', { ...record, tenantId });
    return record;
  }
}
