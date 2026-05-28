import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faculty } from 'src/database/entities/faculty.entity';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { Major } from 'src/database/entities/major.entity';

@Injectable()
export class FacultyService {
  [x: string]: any;
  constructor(
    @InjectRepository(Faculty)
    private facultyRepository: Repository<Faculty>,
    @InjectRepository(Major)
    private readonly majorRepository: Repository<Major>,
  ) {}

  create(createFacultyDto: CreateFacultyDto) {
    const faculty = this.facultyRepository.create(createFacultyDto);
    return this.facultyRepository.save(faculty);
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const name = query.name?.trim();
    const status = query.status;

    const qb = this.facultyRepository.createQueryBuilder('faculty');

    if (name) {
      qb.andWhere('faculty.name LIKE :name', { name: `%${name}%` });
    }
    if (status !== undefined) {
      qb.andWhere('faculty.status = :status', { status });
    }

    qb.orderBy('faculty.id', 'DESC');
    qb.skip(page * size);
    qb.take(size);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number) {
    this.syncMajorCountByFacultyId(id);
    const faculty = await this.facultyRepository.findOneBy({ id });
    if (!faculty) throw new NotFoundException(`Không tìm thấy khoa #${id}`);
    return faculty;
  }

  async findBySlug(slug: string) {
    // this.syncMajorCountByFacultySlug(slug);
    const faculty = await this.facultyRepository.findOne({
      where: { slug },
      relations: ['majors'],
    });
    if (!faculty) throw new NotFoundException(`Không tìm thấy khoa với slug "${slug}"`);
    return faculty;
  }

  async update(id: number, updateFacultyDto: UpdateFacultyDto) {
    await this.findOne(id);
    await this.facultyRepository.update({ id }, updateFacultyDto);
    return this.facultyRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.facultyRepository.softDelete({ id });
  }
   
  async syncMajorCountByFacultyId(facultyId: string | number) {
  const facultyIdNumber = Number(facultyId);

  if (!facultyIdNumber) return 0;

  const total = await this.majorRepository.count({
    where: {
      facultyId: facultyIdNumber,
    },
  });

  await this.facultyRepository.update(facultyIdNumber, {
    majorCount: total,
  });

  return total;
}
 


}
