import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/database/entities/user.entity'
import { Repository } from 'typeorm'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto)
    return this.userRepository.save(user)
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0)
    const size = Number(query.size ?? 10)

    const fullName = query.fullName?.trim()
    const code = query.code?.trim()
    const status = query.status?.trim()
    const type = query.type?.trim()
    const sso_id = query.sso_id?.trim()

    const qb = this.userRepository.createQueryBuilder('user')

    if (fullName) {
      qb.andWhere('user.fullName LIKE :fullName', {
        fullName: `%${fullName}%`,
      })
    }

    if (code) {
      qb.andWhere('user.code LIKE :code', {
        code: `%${code}%`,
      })
    }

    if (status) {
      qb.andWhere('user.status = :status', { status })
    }

    if (type) {
      qb.andWhere('user.type = :type', { type })
    }

    if (sso_id) {
      qb.andWhere('user.sso_id LIKE :sso_id', {
        sso_id: `%${sso_id}%`,
      })
    }

    qb.orderBy('user.id', 'DESC')
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
    return this.userRepository.findOneBy({ id })
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update({ id }, updateUserDto)
    return this.userRepository.findOneBy({ id })
  }

  remove(id: number) {
    return this.userRepository.delete({ id })
  }

  async suspend(id: number) {
    const user = await this.userRepository.findOneBy({ id })

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng')
    }

    const nextStatus = user.status === 'active' ? 'inactive' : 'active'

    await this.userRepository.update({ id }, { status: nextStatus })

    return {
      ...user,
      status: nextStatus,
    }
  }
}