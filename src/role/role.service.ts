import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from 'src/database/entities/role.entity';
import { Permission } from 'src/database/entities/permission.entity';
import { RolePermission } from 'src/database/entities/role-permission.entity';
import { GroupPermission } from 'src/database/entities/group-permission.entity';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(GroupPermission) private groupPermRepo: Repository<GroupPermission>,
  ) {}

  create(createRoleDto: CreateRoleDto) {
    return this.roleRepository.save(createRoleDto);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const name = query.name?.trim();

    const qb = this.roleRepository.createQueryBuilder('role');
    if (name) {
      qb.andWhere('role.name LIKE :name', { name: `%${name}%` });
    }
    qb.orderBy('role.id', 'DESC').skip(page * size).take(size);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  findOne(id: number) {
    return this.roleRepository.findOneBy({ id });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.roleRepository.update({ id }, updateRoleDto);
  }

  remove(id: number) {
    return this.roleRepository.delete({ id });
  }

  /**
   * Lấy toàn bộ groups + permissions, kèm flag isGranted cho role
   */
  async getRolePermissions(roleId: number) {
    const groups = await this.groupPermRepo.find({
      relations: ['permissions'],
      order: { orderIndex: 'ASC' } as any,
    });

    const granted = await this.rolePermRepo.find({ where: { roleId } });
    const grantedIds = new Set(granted.map((rp) => rp.permissionId));

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      code: g.code,
      permissions: g.permissions.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        isGranted: grantedIds.has(p.id),
      })),
    }));
  }

  /**
   * Gán lại toàn bộ permissions cho role (replace)
   */
  async assignPermissions(roleId: number, permissionIds: number[]) {
    await this.rolePermRepo.delete({ roleId });

    if (!permissionIds?.length) return { success: true, assigned: 0 };

    const perms = await this.permRepo.findBy({ id: In(permissionIds) });
    const newEntries = perms.map((p) =>
      this.rolePermRepo.create({ roleId, permissionId: p.id }),
    );

    await this.rolePermRepo.save(newEntries);
    return { success: true, assigned: newEntries.length };
  }
}
