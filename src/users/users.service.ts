import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { UserRole } from 'src/database/entities/user-role.entity';
import { Role } from 'src/database/entities/role.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);

    const fullName = query.fullName?.trim();
    const code = query.code?.trim();
    const status = query.status?.trim();
    const type = query.type?.trim();
    const sso_id = query.sso_id?.trim();
    const facultyId = query.facultyId;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.faculty', 'faculty');

    if (fullName)
      qb.andWhere('user.fullName LIKE :fullName', { fullName: `%${fullName}%` });
    if (code)
      qb.andWhere('user.code LIKE :code', { code: `%${code}%` });
    if (status)
      qb.andWhere('user.status = :status', { status });
    if (type)
      qb.andWhere('user.type = :type', { type });
    if (sso_id)
      qb.andWhere('user.sso_id LIKE :sso_id', { sso_id: `%${sso_id}%` });
    if (facultyId)
      qb.andWhere('user.facultyId = :facultyId', { facultyId });

    qb.orderBy('user.id', 'DESC').skip(page * size).take(size);

    const [items, total] = await qb.getManyAndCount();

    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  findOne(id: number) {
    return this.userRepository.findOne({ where: { id }, relations: ['faculty'] });
  }

  findMeWithRoles(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role', 'faculty'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update({ id }, updateUserDto);
    return this.userRepository.findOneBy({ id });
  }

  remove(id: number) {
    return this.userRepository.delete({ id });
  }

  async suspend(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    await this.userRepository.update({ id }, { status: nextStatus });
    return { ...user, status: nextStatus };
  }

  //  Roles 

  /**
   * Trả về danh sách role đang được gán cho user (kèm toàn bộ roles).
   * Response: { assignedRoleIds: number[], roles: Role[] }
   */
  async getUserRoles(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const [allRoles, userRoles] = await Promise.all([
      this.roleRepository.find({ order: { id: 'ASC' } }),
      this.userRoleRepository.find({ where: { userId } }),
    ]);

    const assignedRoleIds = userRoles.map((ur) => Number(ur.roleId));

    return {
      assignedRoleIds,
      roles: allRoles,
    };
  }

  /**
   * Gán (thay thế toàn bộ) roles cho user.
   */
  async assignRoles(userId: number, roleIds: number[]) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Xoá toàn bộ role cũ
    await this.userRoleRepository.delete({ userId });

    if (!roleIds?.length) return { success: true, assigned: 0 };

    // Validate roles tồn tại
    const roles = await this.roleRepository.findBy({ id: In(roleIds) });
    const validIds = roles.map((r) => Number(r.id));

    const rows = validIds.map((roleId) =>
      this.userRoleRepository.create({ userId, roleId }),
    );
    await this.userRoleRepository.save(rows);

    return { success: true, assigned: rows.length };
  }
}