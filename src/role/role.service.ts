import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    @InjectRepository(RoleResource)
    private roleResourceRepo: Repository<RoleResource>,
  ) {}

  //  CRUD 

  async create(dto: CreateRoleDto) {
    // Kiểm tra trùng code
    if (dto.code) {
      const exists = await this.roleRepo.findOneBy({ code: dto.code });
      if (exists)
        throw new BadRequestException(`Code "${dto.code}" đã tồn tại`);
    }

    const role = this.roleRepo.create({
      name: dto.name,
      code: dto.code?.trim() || null,
      description: dto.description,
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
    if (!role) throw new NotFoundException(`Không tìm thấy role #${id}`);
    return role;
  }

  async update(id: number, dto: UpdateRoleDto) {
    await this.findOne(id);

    if (dto.code) {
      const conflict = await this.roleRepo
        .createQueryBuilder('r')
        .where('r.code = :code AND r.id != :id', { code: dto.code, id })
        .getOne();
      if (conflict)
        throw new BadRequestException(`Code "${dto.code}" đã tồn tại`);
    }

    await this.roleRepo.update({ id }, {
      name: dto.name,
      code: dto.code ?? undefined,
      description: dto.description,
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.roleRepo.delete({ id });
    return { success: true };
  }

  //  Phân quyền resources 

  /**
   * Trả về danh sách TẤT CẢ resources, kèm các action đã được cấp cho role.
   * Frontend dùng để render checkbox matrix.
   */
  async getRoleResources(roleId: number) {
    await this.findOne(roleId);

    const allResources = await this.resourceRepo.find({ order: { id: 'ASC' } });
    const granted = await this.roleResourceRepo.find({ where: { roleId } });

    const grantedMap = new Map<number, Set<string>>();
    for (const rr of granted) {
      grantedMap.set(Number(rr.resourceId), new Set(rr.actions));
    }

    return allResources.map((res) => ({
      id: res.id,
      name: res.name,
      code: res.code,
      actions: (res.actions ?? []).map((action) => ({
        action,
        isGranted: (grantedMap.get(Number(res.id)) ?? new Set()).has(action),
      })),
    }));
  }

  /**
   * Gán (thay thế) resource + actions cho role.
   * assignments không có action nào → resource đó được bỏ quyền.
   */
  async assignResources(
    roleId: number,
    assignments: { resourceId: number; actions: string[] }[],
  ) {
    await this.findOne(roleId);

    // Xoá toàn bộ phân quyền cũ của role này
    await this.roleResourceRepo.delete({ roleId });

    if (!assignments?.length) return { success: true, assigned: 0 };

    const resources = await this.resourceRepo.findBy({
      id: In(assignments.map((a) => a.resourceId)),
    });
    const resourceMap = new Map(resources.map((r) => [Number(r.id), r]));

    const rows = assignments
      .filter((a) => resourceMap.has(Number(a.resourceId)) && a.actions?.length)
      .map((a) => {
        const res = resourceMap.get(Number(a.resourceId))!;
        const availableActions = res.actions ?? [];
        const validActions = a.actions.filter((act) =>
          availableActions.includes(act),
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

  //  Dùng nội bộ (AuthService) 

  /**
   * Tổng hợp permissions từ nhiều roles thành map { resourceCode: [actions] }.
   * Dùng khi build JWT payload.
   */
  async buildPermissionsMap(
    roleIds: number[],
  ): Promise<Record<string, string[]>> {
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