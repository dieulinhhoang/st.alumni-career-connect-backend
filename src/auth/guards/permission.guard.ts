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
 *   { sub, isAdmin, roles[], permissions: string[] }
 *
 * Ví dụ: permissions = ["alumni:read", "alumni:write", "job:read"]
 *   - Admin: permissions = ["*"]
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
    if (user.isAdmin) return true;

    const permissions: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : [];

    // Wildcard toàn hệ thống
    if (permissions.includes('*')) return true;

    // Kiểm tra tất cả các quyền yêu cầu
    for (const perm of required) {
      if (!this.hasPermission(permissions, perm)) {
        throw new ForbiddenException(`Không có quyền: ${perm}`);
      }
    }

    return true;
  }

  private hasPermission(permissions: string[], required: string): boolean {
    // Exact match: "alumni:read"
    if (permissions.includes(required)) return true;

    // Wildcard trên resource: "alumni:*"
    const resource = required.split(':')[0];
    if (permissions.includes(`${resource}:*`)) return true;

    // Wildcard toàn hệ thống
    if (permissions.includes('*')) return true;

    return false;
  }
}