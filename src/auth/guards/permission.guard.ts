import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

/**
 * PermissionGuard — kiểm tra quyền dựa trên JWT payload.
 *
 * JWT payload có dạng:
 *   { sub, isAdmin, roles[], permissions: '*' | Record<string, string[]> }
 *
 * Ví dụ quyền cần: 'alumni:read'  →  permissions['alumni'] phải chứa 'read'
 *
 * Dùng cùng với JwtAuthGuard (JwtAuthGuard chạy trước để xác thực token).
 * Dùng RequirePermission() decorator để khai báo quyền trên route.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu route không yêu cầu quyền → cho qua
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    // Chưa xác thực (không nên xảy ra nếu JwtAuthGuard đã chạy trước)
    if (!user) throw new ForbiddenException('Chưa xác thực');

    // Admin có tất cả quyền
    if (user.isAdmin || user.permissions === '*') return true;

    const permissions: Record<string, string[]> = user.permissions ?? {};

    // Kiểm tra tất cả các quyền yêu cầu  
    for (const perm of required) {
      if (!this.hasPermission(permissions, perm)) {
        throw new ForbiddenException(`Không có quyền: ${perm}`);
      }
    }

    return true;
  }

  private hasPermission(
    permissions: Record<string, string[]>,
    required: string,
  ): boolean {
    // Wildcard toàn hệ thống
    if (permissions['*']) return true;

    const [resource, action] = required.split(':');
    if (!resource || !action) return false;

    const granted = permissions[resource];
    if (!granted) return false;

    // Wildcard trên resource: alumni:*
    if (granted.includes('*')) return true;

    return granted.includes(action);
  }
}