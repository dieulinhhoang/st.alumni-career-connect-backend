import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from 'src/database/entities/role-permission.entity';
import { UserRole } from 'src/database/entities/user-role.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(RolePermission)
    private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Không có thông tin người dùng');

    const userRoles = await this.userRoleRepo.find({ where: { userId: user.id } });
    if (!userRoles.length) throw new ForbiddenException('Người dùng chưa có role');

    const roleIds = userRoles.map((ur) => ur.roleId);

    const rolePerms = await this.rolePermRepo
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'perm')
      .where('rp.roleId IN (:...roleIds)', { roleIds })
      .getMany();

    const userPermCodes = new Set(
      rolePerms.map((rp) => rp.permission?.code).filter(Boolean),
    );

    const hasAll = required.every((p) => userPermCodes.has(p));
    if (!hasAll) throw new ForbiddenException('Không đủ quyền thực hiện hành động này');

    return true;
  }
}
