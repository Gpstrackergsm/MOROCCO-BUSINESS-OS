import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
  userId?: string;
  userRole?: string;
  permissions?: string[];
  branchId?: string;
}

class TenantContextManager {
  private static instance: TenantContextManager;
  private asyncLocalStorage: AsyncLocalStorage<TenantContextData>;

  private constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage<TenantContextData>();
  }

  public static getInstance(): TenantContextManager {
    if (!TenantContextManager.instance) {
      TenantContextManager.instance = new TenantContextManager();
    }
    return TenantContextManager.instance;
  }

  public run(context: TenantContextData, callback: () => Promise<any> | any) {
    return this.asyncLocalStorage.run(context, callback);
  }

  public getContext(): TenantContextData | undefined {
    return this.asyncLocalStorage.getStore();
  }

  public getTenantId(): string {
    const store = this.asyncLocalStorage.getStore();
    if (!store?.tenantId) {
      throw new Error(
        'CRITICAL SECURITY ERROR: Attempted to access database operation outside of an authenticated TenantContext.'
      );
    }
    return store.tenantId;
  }
}

export const tenantContext = TenantContextManager.getInstance();
