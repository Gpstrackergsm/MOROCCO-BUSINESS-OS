import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from '../context/tenant-context';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    permissions: string[];
    branchId?: string;
  };
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;
    const userTenantId = req.user?.tenantId;

    const activeTenantId = userTenantId || tenantIdHeader;

    if (activeTenantId) {
      req.tenantId = activeTenantId;
      tenantContext.run(
        {
          tenantId: activeTenantId,
          userId: req.user?.userId,
          userRole: req.user?.role,
          permissions: req.user?.permissions,
          branchId: req.user?.branchId,
        },
        () => next()
      );
    } else {
      next();
    }
  }
}
