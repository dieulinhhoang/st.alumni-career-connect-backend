import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniProfile } from 'src/database/entities/alumni-profile.entity';
import { CreateAlumniDto } from './dto/create-alumni.dto';
import { UpdateAlumniDto } from './dto/update-alumni.dto';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(AlumniProfile)
    private alumniRepo: Repository<AlumniProfile>,
  ) {}

  async create(dto: CreateAlumniDto) {
    const exists = await this.alumniRepo.findOneBy({ studentCode: dto.studentCode });
    if (exists) throw new ConflictException(`Mã sinh viên ${dto.studentCode} đã tồn tại`);
    return this.alumniRepo.save(this.alumniRepo.create(dto));
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const qb = this.alumniRepo.createQueryBuilder('a');
    if (query.keyword) {
      qb.andWhere('(a.fullName LIKE :kw OR a.studentCode LIKE :kw)', { kw: `%${query.keyword}%` });
    }
    if (query.major) qb.andWhere('a.major = :major', { major: query.major });
    if (query.graduationYear) qb.andWhere('a.graduationYear = :year', { year: query.graduationYear });
    qb.orderBy('a.createdAt', 'DESC').skip(page * size).take(size);
    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: string) {
    const a = await this.alumniRepo.findOneBy({ id });
    if (!a) throw new NotFoundException(`Không tìm thấy alumni #${id}`);
    return a;
  }

  async update(id: string, dto: UpdateAlumniDto) {
    await this.findOne(id);
    await this.alumniRepo.update(id, dto);
    return this.alumniRepo.findOneBy({ id });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.alumniRepo.softDelete(id);
  }
}
