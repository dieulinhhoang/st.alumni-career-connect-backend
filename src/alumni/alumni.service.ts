import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);

    const fullName = query.fullName?.trim();
    const code = query.code?.trim();
    const majorId = query.majorId ? Number(query.majorId) : undefined;
    const facultyId = query.facultyId ? Number(query.facultyId) : undefined;
    const graduationYear = query.graduationYear?.trim();

    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.major', 'major')
      .leftJoinAndSelect('major.faculty', 'faculty')
      .leftJoinAndSelect('student.graduationStudents', 'gs')
      .leftJoinAndSelect('gs.graduation', 'graduation');

    if (fullName) {
      qb.andWhere('student.fullName LIKE :fullName', { fullName: `%${fullName}%` });
    }

    if (code) {
      qb.andWhere('student.code LIKE :code', { code: `%${code}%` });
    }

    if (majorId) {
      qb.andWhere('student.trainingIndustryId = :majorId', { majorId });
    }

    if (facultyId) {
      qb.andWhere('major.facultyId = :facultyId', { facultyId });
    }

    if (graduationYear) {
      qb.andWhere('graduation.year = :graduationYear', { graduationYear });
    }

    qb.orderBy('student.id', 'DESC');
    qb.skip(page * size);
    qb.take(size);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((s) => ({
        id: s.id,
        code: s.code,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        dob: s.dob,
        major: s.major ? { id: s.major.id, name: s.major.name } : null,
        faculty: s.major?.faculty ? { id: s.major.faculty.id, name: s.major.faculty.name } : null,
        graduations: s.graduationStudents?.map((gs) => ({
          id: gs.graduation?.id,
          name: gs.graduation?.name,
          year: gs.graduation?.year,
        })) ?? [],
        schoolYearEnd: s.schoolYearEnd,
      })),
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const student = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.major', 'major')
      .leftJoinAndSelect('major.faculty', 'faculty')
      .leftJoinAndSelect('student.graduationStudents', 'gs')
      .leftJoinAndSelect('gs.graduation', 'graduation')
      .leftJoinAndSelect('student.surveyResponses', 'surveyResponse')
      .where('student.id = :id', { id })
      .getOne();

    if (!student) {
      throw new NotFoundException('Không tìm thấy sinh viên');
    }

    return {
      id: student.id,
      code: student.code,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      gender: student.gender,
      dob: student.dob,
      citizenIdentification: student.citizenIdentification,
      major: student.major ? { id: student.major.id, name: student.major.name } : null,
      faculty: student.major?.faculty
        ? { id: student.major.faculty.id, name: student.major.faculty.name }
        : null,
      graduations: student.graduationStudents?.map((gs) => ({
        id: gs.graduation?.id,
        name: gs.graduation?.name,
        year: gs.graduation?.year,
      })) ?? [],
      schoolYearEnd: student.schoolYearEnd,
      createdAt: student.createdAt,
    };
  }
}
