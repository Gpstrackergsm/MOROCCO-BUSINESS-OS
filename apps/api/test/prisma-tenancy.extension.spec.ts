import { describe, it, expect, vi } from 'vitest';
import { createTenantPrismaExtension } from '../src/common/database/prisma-tenancy.extension';
import { tenantContext } from '../src/common/context/tenant-context';

describe('Prisma Multi-Tenant Extension - Automatic Query Scoping', () => {
  const extension = createTenantPrismaExtension();
  const interceptor = extension.query.$allModels.$allOperations;

  it('automatically injects tenantId into findMany query when tenant context is active', async () => {
    const mockQuery = vi.fn().mockImplementation(async (args) => args);

    await tenantContext.run({ tenantId: 'tenant-abc-999' }, async () => {
      const result = await interceptor({
        model: 'Product',
        operation: 'findMany',
        args: { where: { isActive: true } },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalled();
      expect(result.where).toEqual({
        isActive: true,
        tenantId: 'tenant-abc-999',
      });
    });
  });

  it('automatically injects tenantId into create mutation data', async () => {
    const mockQuery = vi.fn().mockImplementation(async (args) => args);

    await tenantContext.run({ tenantId: 'tenant-abc-999' }, async () => {
      const result = await interceptor({
        model: 'Product',
        operation: 'create',
        args: { data: { sku: 'PROD-01', nameAr: 'منتج' } },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalled();
      expect(result.data).toEqual({
        sku: 'PROD-01',
        nameAr: 'منتج',
        tenantId: 'tenant-abc-999',
      });
    });
  });

  it('leaves non-tenant-scoped models untouched', async () => {
    const mockQuery = vi.fn().mockImplementation(async (args) => args);

    await tenantContext.run({ tenantId: 'tenant-abc-999' }, async () => {
      const result = await interceptor({
        model: 'GlobalSystemConfig',
        operation: 'findMany',
        args: { where: {} },
        query: mockQuery,
      });

      expect(result.where).toEqual({});
    });
  });
});
