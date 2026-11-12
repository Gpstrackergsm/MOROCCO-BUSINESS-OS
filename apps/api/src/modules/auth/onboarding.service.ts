import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import {
  isValidMoroccanICE,
  isValidMoroccanIF,
  isValidMoroccanTP,
} from '@morocco-os/shared';
import {
  STANDARD_PCGE_ACCOUNTS,
  STANDARD_JOURNALS,
  SYSTEM_PERMISSIONS,
} from '@morocco-os/database';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * THE ATOMIC GENESIS PROVISIONING TRANSACTION
   * Provisons an entire enterprise tenant in one atomic transaction:
   * 1. Validates Moroccan compliance IDs
   * 2. Hashes master credentials with Argon2id
   * 3. Creates Tenant, Company, Main Branch, Primary Warehouse
   * 4. Seeds full PCGE Chart of Accounts & Standard Journals
   * 5. Seeds Roles, Permissions, Admin User, and creates Audit Log
   */
  async provisionCompany(dto: RegisterCompanyDto) {
    // 1. Strict Moroccan Compliance Pre-checks
    if (!isValidMoroccanICE(dto.ice)) {
      throw new BadRequestException(
        `Invalid Moroccan ICE: "${dto.ice}". ICE must be exactly 15 numeric digits.`
      );
    }

    if (!isValidMoroccanIF(dto.identifiantFiscal)) {
      throw new BadRequestException(
        `Invalid Moroccan IF: "${dto.identifiantFiscal}". Must be a valid numeric fiscal identifier.`
      );
    }

    if (!isValidMoroccanTP(dto.taxeProfessionnelle)) {
      throw new BadRequestException(
        `Invalid Moroccan Taxe Professionnelle: "${dto.taxeProfessionnelle}".`
      );
    }

    // 2. Uniqueness pre-checks
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });
    if (existingTenant) {
      throw new ConflictException(`Tenant slug "${dto.tenantSlug}" is already taken.`);
    }

    // 3. Hash administrator password with Argon2id
    const passwordHash = await argon2.hash(dto.adminPassword, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });

    // 4. ATOMIC DATABASE TRANSACTION
    return this.prisma.$transaction(async (tx) => {
      // 4.1 Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantSlug,
          planTier: 'BUSINESS',
          status: 'ACTIVE',
        },
      });

      // 4.2 Create Company Profile with Moroccan Identifiers
      const company = await tx.company.create({
        data: {
          tenantId: tenant.id,
          legalName: dto.legalName,
          commercialName: dto.commercialName || dto.legalName,
          legalForm: dto.legalForm,
          ice: dto.ice,
          identifiantFiscal: dto.identifiantFiscal,
          registreCommerce: dto.registreCommerce,
          taxeProfessionnelle: dto.taxeProfessionnelle,
          cnssNumber: dto.cnssNumber,
          address: dto.address,
          city: dto.city,
          country: 'MA',
          phone: dto.phone,
          email: dto.companyEmail,
          baseCurrency: 'MAD',
          defaultLanguage: 'ar',
        },
      });

      // 4.3 Create Primary Branch (Siège Social)
      const mainBranch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          companyId: company.id,
          code: 'SIEGE-01',
          name: 'المقر الرئيسي — Siège Social',
          isMainBranch: true,
          address: dto.address,
          city: dto.city,
          phone: dto.phone,
        },
      });

      // 4.4 Create Primary Warehouse (Dépôt Principal)
      const mainWarehouse = await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          branchId: mainBranch.id,
          code: 'DEPOT-01',
          name: 'المستودع الرئيسي — Dépôt Principal',
          address: dto.address,
        },
      });

      // 4.5 Seed Moroccan Chart of Accounts (PCGE Classes 1 to 8)
      for (const acc of STANDARD_PCGE_ACCOUNTS) {
        await tx.account.create({
          data: {
            tenantId: tenant.id,
            accountNumber: acc.accountNumber,
            accountClass: acc.accountClass,
            nameFr: acc.nameFr,
            nameAr: acc.nameAr,
          },
        });
      }

      // 4.6 Seed Standard Journals (VE, AC, BQ, CA, OD)
      for (const j of STANDARD_JOURNALS) {
        await tx.journal.create({
          data: {
            tenantId: tenant.id,
            code: j.code,
            nameFr: j.nameFr,
            nameAr: j.nameAr,
            journalType: j.journalType as any,
          },
        });
      }

      // 4.7 Seed Roles & Permissions
      const superAdminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'SUPER_ADMIN',
          description: 'صلاحيات كاملة لإدارة النظام والشركة',
          isSystem: true,
        },
      });

      for (const p of SYSTEM_PERMISSIONS) {
        const perm = await tx.permission.upsert({
          where: {
            resource_action: {
              resource: p.resource,
              action: p.action,
            },
          },
          create: {
            resource: p.resource,
            action: p.action,
            description: p.description,
          },
          update: {},
        });

        await tx.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        });
      }

      // 4.8 Create Super Administrator User
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail,
          passwordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          phone: dto.phone,
          isActive: true,
        },
      });

      // Link User to Role
      await tx.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      });

      // 4.9 Document Genesis in Immutable Audit Log
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: adminUser.id,
          action: 'TENANT_GENESIS_PROVISIONED',
          entity: 'Tenant',
          entityId: tenant.id,
          newValues: {
            companyName: dto.legalName,
            ice: dto.ice,
            adminEmail: dto.adminEmail,
            currency: 'MAD',
          },
        },
      });

      return {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        },
        company: {
          id: company.id,
          legalName: company.legalName,
          ice: company.ice,
          identifiantFiscal: company.identifiantFiscal,
        },
        mainBranch: {
          id: mainBranch.id,
          code: mainBranch.code,
          name: mainBranch.name,
        },
        mainWarehouse: {
          id: mainWarehouse.id,
          code: mainWarehouse.code,
          name: mainWarehouse.name,
        },
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: 'SUPER_ADMIN',
        },
      };
    });
  }
}
