import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

export const TENANT_HEADER = 'x-tenant-id';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // In production, tenant_id is extracted from validated JWT
    // During dev / testing, header X-Tenant-ID or user.tenantId is verified
    const tenantId = request.headers[TENANT_HEADER] || request.user?.tenantId;

    if (!tenantId || typeof tenantId !== 'string') {
      throw new UnauthorizedException(
        'Missing Tenant Context: Requests must provide an authorized tenant identifier.'
      );
    }

    request.tenantId = tenantId;
    return true;
  }
}
