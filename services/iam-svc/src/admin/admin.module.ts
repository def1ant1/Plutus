import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import {
  AdminAuditService,
  KeyRotationService,
  ServiceAccountAutomationService,
  TenantOnboardingService,
} from './admin.services';

@Module({
  controllers: [AdminController],
  providers: [AdminAuditService, TenantOnboardingService, ServiceAccountAutomationService, KeyRotationService],
})
export class AdminModule {}
