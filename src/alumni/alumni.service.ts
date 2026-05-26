import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  async getProfiles(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 20);

    const qb = this.studentRepo
      .createQueryBuilder('s')
      .leftJoin('s.major', 'm')
      .leftJoin('m.faculty', 'f')
      .select([
        's.id',
        's.code',
        's.fullName',
        's.email',
        's.schoolYearEnd',
        'm.name',
        'f.name',
      ]);

    if (query.major) {
      qb.andWhere('m.name LIKE :major', { major: `%${query.major}%` });
    }
    if (query.graduationYear) {
      qb.andWhere('s.schoolYearEnd = :year', { year: query.graduationYear });
    }
    if (query.search) {
      qb.andWhere('(s.fullName LIKE :search OR s.code LIKE :search)', { search: `%${query.search}%` });
    }

    qb.orderBy('s.id', 'DESC').skip(page * size).take(size);
    const [items, total] = await qb.getManyAndCount();

    const profiles = items.map(s => ({
      id: String(s.id),
      studentCode: s.code,
      fullName: s.fullName,
      major: (s as any).major?.name ?? '',
      graduationYear: s.schoolYearEnd ? parseInt(s.schoolYearEnd) : null,
      currentPosition: '',
      currentCompany: '',
      email: s.email,
    }));

    return { items: profiles, page, size, total, totalPages: Math.ceil(total / size) };
  }
}
