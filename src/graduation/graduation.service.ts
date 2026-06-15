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
  ) { }

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

  // FE gá»i vá»›i page=1 vÃ  per_page, tráº£ vá» { data, meta } Ä‘Ãºng format FE
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

    // Äáº¿m sá»‘ sinh viÃªn thá»±c táº¿ theo tá»«ng graduation_id trong 1 query
    const ids = data.map((g) => g.id);
    let countMap = new Map<number, number>();
    if (ids.length > 0) {
      const counts: { graduationId: string; cnt: string }[] =
        await this.graduationStudentRepository
          .createQueryBuilder('gs')
          .select('gs.graduation_id', 'graduationId')
          .addSelect('COUNT(*)', 'cnt')
          .where('gs.graduation_id IN (:...ids)', { ids })
          .groupBy('gs.graduation_id')
          .getRawMany();
      countMap = new Map(counts.map((c) => [Number(c.graduationId), Number(c.cnt)]));
    }

    // Map fields theo FE types
    const mapped = data.map((g) => ({
      id: g.id,
      name: g.name,
      school_year: String(g.schoolYear ?? ''),
      certification: g.certification,
      certification_date: g.certificationDate ? String(g.certificationDate) : null,
      faculty_id: (g as any).facultyId ?? null,
      student_count: countMap.get(Number(g.id)) ?? 0,
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
    if (!graduation) throw new NotFoundException(`KhÃ´ng tÃ¬m tháº¥y Ä‘á»£t tá»‘t nghiá»‡p #${id}`);
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
      .leftJoinAndSelect('student.major', 'major')
      .leftJoinAndSelect('major.faculty', 'faculty')
      .where('gs.graduationId = :graduationId', { graduationId });

    const total = await qb.getCount();
    const rows = await qb
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    const data = rows.map((gs) => {
      const s = gs.student;
      const major = s.major;
      const faculty = major?.faculty;

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
        training_industry_code: major?.code ?? null,
        training_industry_name: major?.name ?? null,
        faculty_id: faculty?.id ?? major?.facultyId ?? null,
        faculty_name: faculty?.name ?? null,
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


  async findStudentByFields(
    graduationId: number,
    fields: { fullName?: string; dob?: string; phone?: string; studentCode?: string },
  ): Promise<any | null> {
    const gs = await this.graduationStudentRepository.find({
      where: { graduationId } as any,
      relations: ['student', 'student.major', 'student.major.faculty'],
    });

    const normalize = (s: string) => s?.trim().toLowerCase();
    const normalizeDob = (value: string | Date | undefined) => {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value.trim());
      return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
    };

    for (const g of gs) {
      const s = g.student;
      if (!s) continue;
  // console.log('Comparing:', s.code, 'vs', fields.studentCode); 
      let matches = 0;
      if (fields.studentCode && normalize(s.code) === normalize(fields.studentCode)) matches++;
      if (fields.fullName && normalize(s.fullName) === normalize(fields.fullName)) matches++;
      if (fields.phone && s.phone === fields.phone.trim()) matches++;
      if (fields.dob && normalizeDob(s.dob) === normalizeDob(fields.dob)) matches++;

      if (matches >= 2)// map giá»‘ng getStudentsByGraduation
     {
       const major = s.major;
      const faculty = major?.faculty;

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
        training_industry_code: major?.code ?? null,
        training_industry_name: major?.name ?? null,
        faculty_id: faculty?.id ?? major?.facultyId ?? null,
        faculty_name: faculty?.name ?? null,
        school_year_end: s.schoolYearEnd,
      };
     }
    }
    return null;
  }
}
