import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Major } from 'src/database/entities/major.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';

@Injectable()
export class MajorService {
  constructor(
    @InjectRepository(Major)
    private majorRepository: Repository<Major>,
    @InjectRepository(Faculty)
    private facultyRepository: Repository<Faculty>,
  ) {}

  /**
   * Đồng bộ lại cột major_count của một khoa dựa trên số ngành hiện có (chưa bị xoá).
   */
  private async syncFacultyMajorCount(facultyId?: number | null) {
    if (!facultyId) return;
    const count = await this.majorRepository.count({ where: { facultyId } });
    await this.facultyRepository.update(facultyId, { majorCount: count });
  }

  async create(createMajorDto: CreateMajorDto) {
    const major = this.majorRepository.create(createMajorDto);
    const saved = await this.majorRepository.save(major);
    await this.syncFacultyMajorCount(saved.facultyId);
    return saved;
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const name = query.name?.trim();
    const code = query.code?.trim();
    const status = query.status;
    const facultyId = query.facultyId;

    const qb = this.majorRepository
      .createQueryBuilder('major')
      .leftJoinAndSelect('major.faculty', 'faculty');

    if (name) {
      qb.andWhere('major.name LIKE :name', { name: `%${name}%` });
    }
    if (code) {
      qb.andWhere('major.code LIKE :code', { code: `%${code}%` });
    }
    if (status !== undefined) {
      qb.andWhere('major.status = :status', { status });
    }
    if (facultyId !== undefined) {
      qb.andWhere('major.facultyId = :facultyId', { facultyId });
    }

    qb.orderBy('major.id', 'DESC');
    qb.skip(page * size);
    qb.take(size);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number) {
    const major = await this.majorRepository.findOne({
      where: { id },
      relations: ['faculty'],
    });
    if (!major) throw new NotFoundException(`Không tìm thấy chuyên ngành #${id}`);
    return major;
  }

  async findBySlug(slug: string) {
    const major = await this.majorRepository.findOne({
      where: { slug },
      relations: ['faculty', 'students'],
    });
    if (!major) throw new NotFoundException(`Không tìm thấy chuyên ngành với slug "${slug}"`);
    return major;
  }

  async update(id: number, updateMajorDto: UpdateMajorDto) {
    const existing = await this.findOne(id);
    const oldFacultyId = existing.facultyId;

    await this.majorRepository.update({ id }, updateMajorDto);

    const newFacultyId = updateMajorDto.facultyId ?? oldFacultyId;
    await this.syncFacultyMajorCount(oldFacultyId);
    if (newFacultyId !== oldFacultyId) {
      await this.syncFacultyMajorCount(newFacultyId);
    }

    return this.majorRepository.findOne({ where: { id }, relations: ['faculty'] });
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    const result = await this.majorRepository.softDelete({ id });
    await this.syncFacultyMajorCount(existing.facultyId);
    return result;
  }
}
