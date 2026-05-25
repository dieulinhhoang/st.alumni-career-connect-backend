import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';

interface GetProfilesOptions {
  page: number;
  limit: number;
  major?: string;
  graduationYear?: number;
}

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async getProfiles({ page, limit, major, graduationYear }: GetProfilesOptions) {
    const qb = this.studentRepo.createQueryBuilder('student');

    if (major) {
      qb.andWhere('student.major LIKE :major', { major: `%${major}%` });
    }
    if (graduationYear) {
      qb.andWhere('student.schoolYearEnd = :year', { year: String(graduationYear) });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((s) => ({
        id: s.id,
        studentCode: s.code,
        fullName: s.fullName,
        major: (s as any).trainingIndustryName ?? (s as any).major ?? '',
        graduationYear: parseInt((s as any).schoolYearEnd ?? '0') || null,
        currentPosition: (s as any).currentPosition ?? '',
        currentCompany: (s as any).currentCompany ?? '',
        email: s.email,
      })),
      total,
      page,
      limit,
    };
  }

  async getProfileById(id: string) {
    const student = await this.studentRepo.findOne({ where: { id } as any });
    if (!student) throw new NotFoundException('Alumni not found');
    return {
      id: student.id,
      studentCode: (student as any).code,
      fullName: student.fullName,
      major: (student as any).trainingIndustryName ?? '',
      graduationYear: parseInt((student as any).schoolYearEnd ?? '0') || null,
      email: student.email,
    };
  }
}
