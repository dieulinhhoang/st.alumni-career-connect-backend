import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from 'src/database/entities/role.entity';
import { Resource } from 'src/database/entities/resources.entity';
import { RoleResource } from 'src/database/entities/role-resource.entity';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Resource) private resourceRepo: Repository<Resource>,
    @InjectRepository(RoleResource) private roleResourceRepo: Repository<RoleResource>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.roleRepo.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
    });
    return this.roleRepo.save(role);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const name = query.name?.trim();

    const qb = this.roleRepo.createQueryBuilder('role');
    if (name) qb.andWhere('role.name LIKE :name', { name: `%${name}%` });
    qb.orderBy('role.id', 'DESC').skip(page * size).take(size);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number) {
    const role = await this.roleRepo.findOneBy({ id });
    if (!role) throw new NotFoundException(`Không tìm thấy role với id ${id}`);
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id);
    return this.roleRepo.update({ id }, updateRoleDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.roleRepo.delete({ id });
  }

  async getRoleResources(roleId: number) {
    await this.findOne(roleId);

    const allResources = await this.resourceRepo.find({ order: { id: 'ASC' } });
    const granted = await this.roleResourceRepo.find({ where: { roleId } });

    const grantedMap = new Map<number, Set<string>>();
    for (const rr of granted) {
      grantedMap.set(rr.resourceId, new Set(rr.actions));
    }

    return allResources.map((res) => ({
      id: res.id,
      name: res.name,
      code: res.code,
      actions: (res.actions ?? []).map((action) => ({
        action,
        isGranted: (grantedMap.get(res.id) ?? new Set()).has(action),
      })),
    }));
  }

  async assignResources(
    roleId: number,
    assignments: { resourceId: number; actions: string[] }[],
  ) {
    await this.findOne(roleId);
    await this.roleResourceRepo.delete({ roleId });

    if (!assignments?.length) return { success: true, assigned: 0 };

    const resources = await this.resourceRepo.findBy({
      id: In(assignments.map((a) => a.resourceId)),
    });
    const resourceMap = new Map(resources.map((r) => [r.id, r]));

    const rows = assignments
      .filter((a) => resourceMap.has(a.resourceId) && a.actions?.length)
      .map((a) => {
        const validActions = a.actions.filter((act) =>
          resourceMap.get(a.resourceId)!.actions?.includes(act),
        );
        return this.roleResourceRepo.create({
          roleId,
          resourceId: a.resourceId,
          actions: validActions,
        });
      })
      .filter((row) => row.actions.length > 0);

    await this.roleResourceRepo.save(rows);
    return { success: true, assigned: rows.length };
  }

  async buildPermissionsMap(roleIds: number[]): Promise<Record<string, string[]>> {
    if (!roleIds.length) return {};

    const roleResources = await this.roleResourceRepo.find({
      where: { roleId: In(roleIds) },
      relations: ['resource'],
    });

    const map: Record<string, Set<string>> = {};
    for (const rr of roleResources) {
      const code = rr.resource?.code;
      if (!code) continue;
      if (!map[code]) map[code] = new Set();
      rr.actions.forEach((a) => map[code].add(a));
    }

    return Object.fromEntries(
      Object.entries(map).map(([code, actions]) => [code, Array.from(actions)]),
    );
  }
}