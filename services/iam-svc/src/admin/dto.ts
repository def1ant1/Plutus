import { IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export enum Residency {
  US = 'us',
  EU = 'eu',
  APAC = 'apac',
}

export enum RotationType {
  Standard = 'standard',
  Automated = 'automated',
  Breakglass = 'breakglass',
}

export class TenantOnboardingRequest {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsEnum(Residency)
  residency!: Residency;

  @IsString()
  @MinLength(3)
  externalId!: string;
}

export class ServiceAccountRequest {
  @IsString()
  workload!: string;

  @IsOptional()
  @IsUrl()
  callbackUrl?: string;

  @IsEnum(Residency)
  residency!: Residency;
}

export class KeyRotationRequest {
  @IsString()
  keyId!: string;

  @IsEnum(RotationType)
  rotationType!: RotationType;

  @IsOptional()
  breakglassTicket?: string;
}
