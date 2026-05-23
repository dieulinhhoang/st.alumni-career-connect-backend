import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) { }
  create(createUserDto: CreateUserDto) {

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0)
    const size = Number(query.size ?? 10)

    const [items, total] = await this.userRepository.findAndCount({
      skip: page * size,
      take: size,
      order: { id: 'DESC' },
    })

    return {
      items,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    }
  }

  findOne(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update({ id }, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete({ id });
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
