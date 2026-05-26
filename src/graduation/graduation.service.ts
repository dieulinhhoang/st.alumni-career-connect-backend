import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Graduation } from 'src/database/entities/graduation.entity';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';
import { Student } from 'src/database/entities/student.entity';
import { CreateGraduationDto } from './dto/create-graduation.dto';
import { UpdateGraduationDto } from './dto/update-graduation.dto';

@Injectable()
export class GraduationService {
  constructor(
    @InjectRepository(Graduation)
    private graduationRepository: Repository<Graduation>,
    @InjectRepository(GraduationStudent)
    private graduationStudentRepository: Repository<GraduationStudent>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
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

  // FE gọi với page=1 và per_page, trả về { data, meta } đúng format FE
  async findAllPaginated(page: number, perPage: number, query: any) {
    const name = query.name?.trim();
    const schoolYear = query.school_year ?? query.schoolYear;

    const qb = this.graduationRepository.createQueryBuilder('graduation');

    if (name) {
      qb.andWhere('graduation.name LIKE :name', { name: `%${name}%` });
    }
    if (schoolYear) {
      qb.andWhere('graduation.schoolYear = :schoolYear', { schoolYear });
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('graduation.id', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    // Map fields theo FE types
    const mapped = data.map((g) => ({
      id: g.id,
      name: g.name,
      school_year: String(g.schoolYear ?? ''),
      certification: g.certification,
      certification_date: g.certificationDate ? String(g.certificationDate) : null,
      faculty_id: (g as any).facultyId ?? null,
      student_count: 0,
      created_at: g.createdAt,
      updated_at: g.updatedAt,
    }));

    return {
      data: mapped,
      meta: {
        total,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      },
    };
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

  // GET /grad-students?graduation_id=X
  async getStudentsByGraduation(graduationId: number, page: number, perPage: number) {
    const qb = this.graduationStudentRepository
      .createQueryBuilder('gs')
      .innerJoinAndSelect('gs.student', 'student')
      .where('gs.graduationId = :graduationId', { graduationId });

    const total = await qb.getCount();
    const rows = await qb
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    const data = rows.map((gs) => {
      const s = gs.student;
      return {
        id: s.id,
        code: s.code,
        full_name: s.fullName,
        first_name: s.firstName,
        last_name: s.lastName,
        email: s.email,
        phone: s.phone,
        dob: s.dob,
        gender: s.gender,
        citizen_identification: s.citizenIdentification,
        training_industry_id: s.trainingIndustryId,
        school_year_end: s.schoolYearEnd,
      };
    });

    return {
      data,
      meta: {
        total,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      },
    };
  }
}
