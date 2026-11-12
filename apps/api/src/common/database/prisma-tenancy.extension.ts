import { PrismaClient } from '@prisma/client';
import { tenantContext } from '../context/tenant-context';

// Models that are strictly scoped to a tenant
export const TENANT_SCOPED_MODELS = [
  'company',
  'branch',
  'user',
  'role',
  'productCategory',
  'unitOfMeasure',
  'product',
  'warehouse',
  'stockBalance',
  'stockMovement',
  'stockMovementLine',
  'account',
  'journal',
  'journalEntry',
  'journalEntryLine',
  'customer',
  'salesInvoice',
  'salesInvoiceLine',
  'auditLog',
] as const;

export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

export function createTenantPrismaExtension() {
  return {
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: { model?: string; operation: string; args: any; query: (args: any) => Promise<any> }) {
          if (!model) return query(args);

          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          const isScoped = TENANT_SCOPED_MODELS.includes(modelLower as TenantScopedModel);

          if (!isScoped) {
            return query(args);
          }

          // Fetch current tenant context if available
          const ctx = tenantContext.getContext();
          const tenantId = ctx?.tenantId;

          // If tenant context is active, inject automatic tenant isolation
          if (tenantId) {
            args = args || {};

            // Intercept read & delete queries to enforce WHERE tenantId = currentTenant
            if (['findFirst', 'findMany', 'findUnique', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              args.where = {
                ...args.where,
                tenantId,
              };
            }

            // Intercept create mutations to automatically attach current tenant
            if (['create'].includes(operation) && args.data) {
              args.data = {
                ...args.data,
                tenantId,
              };
            }

            if (['createMany'].includes(operation) && Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({
                ...item,
                tenantId,
              }));
            }
          }

          return query(args);
        },
      },
    },
  };
}

export function createExtendedPrismaClient(basePrisma: PrismaClient) {
  return basePrisma.$extends(createTenantPrismaExtension());
}
