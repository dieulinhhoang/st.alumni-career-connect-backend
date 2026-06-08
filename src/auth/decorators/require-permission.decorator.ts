import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Dùng @RequirePermission('alumni:read') trên controller method
 * hoặc @RequirePermission('alumni:read', 'alumni:update') cho nhiều quyền (AND)
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);