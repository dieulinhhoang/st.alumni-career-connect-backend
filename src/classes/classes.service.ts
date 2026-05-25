import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from 'src/database/entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private classRepo: Repository<ClassEntity>,
  ) {}

  create(dto: CreateClassDto) {
    return this.classRepo.save(this.classRepo.create(dto));
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const qb = this.classRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.major', 'major');
    if (query.keyword) qb.andWhere('c.name LIKE :kw', { kw: `%${query.keyword}%` });
    if (query.khoa) qb.andWhere('c.khoa = :khoa', { khoa: query.khoa });
    if (query.majorId) qb.andWhere('c.majorId = :majorId', { majorId: query.majorId });
    qb.orderBy('c.khoa', 'DESC').addOrderBy('c.name', 'ASC').skip(page * size).take(size);
    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number) {
    const c = await this.classRepo.findOne({ where: { id }, relations: ['major'] });
    if (!c) throw new NotFoundException(`Không tìm thấy lớp #${id}`);
    return c;
  }

  async update(id: number, dto: UpdateClassDto) {
    await this.findOne(id);
    await this.classRepo.update(id, dto);
    return this.classRepo.findOne({ where: { id }, relations: ['major'] });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.classRepo.softDelete(id);
  }
}
