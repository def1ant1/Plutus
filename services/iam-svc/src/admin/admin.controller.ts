import { randomUUID } from 'node:crypto';
import { Body, Controller, Param, Post } from '@nestjs/common';
import { AdminAuditService, KeyRotationService, ServiceAccountAutomationService, TenantOnboardingService } from './admin.services';
import { KeyRotationRequest, Residency, ServiceAccountRequest, TenantOnboardingRequest } from './dto';

@Controller({ path: 'admin/tenants', version: '1' })
export class AdminController {
  constructor(
    private readonly tenants: TenantOnboardingService,
    private readonly serviceAccounts: ServiceAccountAutomationService,
    private readonly keys: KeyRotationService,
    private readonly audit: AdminAuditService,
  ) {}

  @Post()
  async onboardTenant(@Body() request: TenantOnboardingRequest) {
    const tenantId = `tenant-${randomUUID()}`;
    const record = this.tenants.onboard(tenantId, request);
    this.audit.log('admin.tenants.onboard', { tenantId: record.id, residency: record.residency });
    return record;
  }

  @Post(':tenantId/service-accounts')
  async createServiceAccount(
    @Param('tenantId') tenantId: string,
    @Body() request: ServiceAccountRequest,
  ) {
    const record = this.serviceAccounts.provision(tenantId, request);
    this.audit.log('admin.serviceAccounts.create', { tenantId, residency: record.residency });
    return record;
  }

  @Post(':tenantId/keys/rotate')
  async rotateKey(@Param('tenantId') tenantId: string, @Body() request: KeyRotationRequest) {
    const decisionContext = {
      rotationType: request.rotationType,
      residency: Residency.US,
    };
    this.audit.log('admin.keys.evaluate', decisionContext);
    const record = this.keys.rotate(tenantId, request);
    return record;
  }
}
