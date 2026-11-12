import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsIn,
} from 'class-validator';
import { MOROCCAN_LEGAL_FORMS } from '@morocco-os/shared';

export class RegisterCompanyDto {
  // Tenant Information
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and hyphens',
  })
  tenantSlug!: string;

  // Moroccan Company Legal Information
  @IsString()
  @IsNotEmpty()
  legalName!: string;

  @IsString()
  @IsOptional()
  commercialName?: string;

  @IsString()
  @IsIn(MOROCCAN_LEGAL_FORMS as readonly string[])
  legalForm!: string;

  // Moroccan Mandatory Fiscal Identifiers
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{15}$/, {
    message: 'Moroccan ICE must be a strictly valid 15-digit numeric string',
  })
  ice!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{7,10}$/, {
    message: 'Moroccan Identifiant Fiscal (IF) must be a 7 to 10-digit numeric string',
  })
  identifiantFiscal!: string;

  @IsString()
  @IsNotEmpty()
  registreCommerce!: string; // RC Number + Tribunal (e.g. "12450 Casa")

  @IsString()
  @IsNotEmpty()
  taxeProfessionnelle!: string; // TP 8 digits

  @IsString()
  @IsOptional()
  cnssNumber?: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  companyEmail!: string;

  // Super Administrator User Account
  @IsString()
  @IsNotEmpty()
  adminFirstName!: string;

  @IsString()
  @IsNotEmpty()
  adminLastName!: string;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'Password must contain uppercase, lowercase, numbers, and a special character',
  })
  adminPassword!: string;
}
