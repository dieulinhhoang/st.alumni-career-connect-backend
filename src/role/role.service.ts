import { Injectable, Query } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from 'src/database/entities/role.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
  ) { }
  create(createRoleDto: CreateRoleDto) {
    return this.roleRepository.save(createRoleDto);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0)
    const size = Number(query.size ?? 10)
    const name = query.name?.trim()

    const qb = this.roleRepository.createQueryBuilder('role')

    if (name) {
      qb.andWhere('role.name LIKE :name', {
        name: `%${name}%`,
      })
    }

    qb.orderBy('role.id', 'DESC')
    qb.skip(page * size)
    qb.take(size)

    const [items, total] = await qb.getManyAndCount()

    return {
      items,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    }
  }
  findOne(id: number) {
    const role = this.roleRepository.findOneBy({ id })
    return role;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.roleRepository.update({ id }, updateRoleDto);
  }

  remove(id: number) {
    return this.roleRepository.delete({ id });
  }
}
