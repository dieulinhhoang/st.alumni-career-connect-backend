import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Graduation } from 'src/database/entities/graduation.entity';
import { CreateGraduationDto } from './dto/create-graduation.dto';
import { UpdateGraduationDto } from './dto/update-graduation.dto';

@Injectable()
export class GraduationService {
  constructor(
    @InjectRepository(Graduation)
    private graduationRepository: Repository<Graduation>,
  ) {}

  create(createGraduationDto: CreateGraduationDto) {
    const graduation = this.graduationRepository.create(createGraduationDto);
    return this.graduationRepository.save(graduation);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const name = query.name?.trim();
    const schoolYear = query.schoolYear;

    const qb = this.graduationRepository.createQueryBuilder('graduation');

    if (name) {
      qb.andWhere('graduation.name LIKE :name', { name: `%${name}%` });
    }
    if (schoolYear) {
      qb.andWhere('graduation.schoolYear = :schoolYear', { schoolYear });
    }

    qb.orderBy('graduation.id', 'DESC');
    qb.skip(page * size);
    qb.take(size);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number) {
    const graduation = await this.graduationRepository.findOneBy({ id });
    if (!graduation) throw new NotFoundException(`Không tìm thấy đợt tốt nghiệp #${id}`);
    return graduation;
  }

  async update(id: number, updateGraduationDto: UpdateGraduationDto) {
    await this.findOne(id);
    await this.graduationRepository.update({ id }, updateGraduationDto);
    return this.graduationRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.graduationRepository.softDelete({ id });
  }
}
