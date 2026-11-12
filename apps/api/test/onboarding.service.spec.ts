import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingService } from '../src/modules/auth/onboarding.service';
import { RegisterCompanyDto } from '../src/modules/auth/dto/register-company.dto';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('OnboardingService - Atomic Genesis Provisioning Engine', () => {
  let service: OnboardingService;
  let mockPrisma: any;

  const validDto: RegisterCompanyDto = {
    tenantName: 'Atlas Trading SARL',
    tenantSlug: 'atlas-trading',
    legalName: 'Atlas Trading SARL',
    commercialName: 'Atlas Trading',
    legalForm: 'SARL',
    ice: '001523489000045', // Valid 15 digits
    identifiantFiscal: '33445566',
    registreCommerce: '12450 Casa',
    taxeProfessionnelle: '34509122',
    address: 'Boulevard Zerktouni, Casablanca',
    city: 'Casablanca',
    phone: '+212522112233',
    companyEmail: 'contact@atlastrading.ma',
    adminFirstName: 'Amine',
    adminLastName: 'El Amrani',
    adminEmail: 'amine@atlastrading.ma',
    adminPassword: 'Password@2026',
  };

  beforeEach(() => {
    mockPrisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(async (cb) => {
        const tx = {
          tenant: { create: vi.fn().mockResolvedValue({ id: 'tenant-uuid-1', slug: 'atlas-trading', name: 'Atlas Trading SARL' }) },
          company: { create: vi.fn().mockResolvedValue({ id: 'comp-uuid-1', legalName: 'Atlas Trading SARL', ice: '001523489000045', identifiantFiscal: '33445566' }) },
          branch: { create: vi.fn().mockResolvedValue({ id: 'branch-uuid-1', code: 'SIEGE-01', name: 'المقر الرئيسي' }) },
          warehouse: { create: vi.fn().mockResolvedValue({ id: 'wh-uuid-1', code: 'DEPOT-01', name: 'المستودع الرئيسي' }) },
          account: { create: vi.fn().mockResolvedValue({ id: 'acc-1' }) },
          journal: { create: vi.fn().mockResolvedValue({ id: 'jour-1' }) },
          role: { create: vi.fn().mockResolvedValue({ id: 'role-super-admin' }) },
          permission: { upsert: vi.fn().mockResolvedValue({ id: 'perm-1' }) },
          rolePermission: { create: vi.fn().mockResolvedValue({}) },
          user: { create: vi.fn().mockResolvedValue({ id: 'user-uuid-1', email: 'amine@atlastrading.ma', firstName: 'Amine', lastName: 'El Amrani' }) },
          userRole: { create: vi.fn().mockResolvedValue({}) },
          auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) },
        };
        return cb(tx);
      }),
    };
    service = new OnboardingService(mockPrisma);
  });

  it('strictly rejects company onboarding if Moroccan ICE is not exactly 15 digits', async () => {
    const invalidDto = { ...validDto, ice: '001523489' }; // Only 9 digits

    await expect(service.provisionCompany(invalidDto)).rejects.toThrow(BadRequestException);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('strictly rejects company onboarding if Moroccan IF is invalid', async () => {
    const invalidDto = { ...validDto, identifiantFiscal: 'not-an-if' };

    await expect(service.provisionCompany(invalidDto)).rejects.toThrow(BadRequestException);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects duplicate tenant slug with ConflictException', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValueOnce({ id: 'existing-id' });

    await expect(service.provisionCompany(validDto)).rejects.toThrow(ConflictException);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('provisions the complete enterprise suite atomically for valid Moroccan company', async () => {
    const result = await service.provisionCompany(validDto);

    expect(result.tenant.id).toBe('tenant-uuid-1');
    expect(result.company.ice).toBe('001523489000045');
    expect(result.mainBranch.code).toBe('SIEGE-01');
    expect(result.mainWarehouse.code).toBe('DEPOT-01');
    expect(result.adminUser.role).toBe('SUPER_ADMIN');
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
