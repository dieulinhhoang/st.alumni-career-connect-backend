import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Graduation } from 'src/database/entities/graduation.entity';
import { GraduationStudent } from 'src/database/entities/graduation-student.entity';
import { Student } from 'src/database/entities/student.entity';
import { Major } from 'src/database/entities/major.entity';
import { CreateGraduationDto } from './dto/create-graduation.dto';
import { UpdateGraduationDto } from './dto/update-graduation.dto';
import { Faculty } from 'src/database/entities/faculty.entity';

/** Đọc giá trị text của 1 cell (chịu được rich-text/formula/number/date) */
function cellText(row: ExcelJS.Row, col: number): string {
  const value: any = row.getCell(col).value;
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text ?? '').trim();
    if ('result' in value) return String(value.result ?? '').trim();
    if ('richText' in value) return value.richText.map((t: any) => t.text).join('').trim();
  }
  return String(value).trim();
}

/** Chuyển 'dd/mm/yyyy', Date hoặc 'yyyy-mm-dd' -> 'yyyy-mm-dd'. Trả null nếu rỗng/không hợp lệ. */
function parseExcelDate(raw: string): string | null {
  const s = raw?.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

/** Tách họ tên đệm / tên */
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts[parts.length - 1], lastName: parts.slice(0, -1).join(' ') };
}

export interface ImportGraduationStudentsResult {
  totalRows: number;
  studentsCreated: number;
  studentsLinked: number;
  alreadyLinked: number;
  errors: { row: number; message: string }[];
}

@Injectable()
export class GraduationService {
  constructor(
    @InjectRepository(Graduation)
    private graduationRepository: Repository<Graduation>,
    @InjectRepository(GraduationStudent)
    private graduationStudentRepository: Repository<GraduationStudent>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Major)
    private majorRepository: Repository<Major>,
    @InjectRepository(Faculty)
        private facultyRepository: Repository<Faculty>,
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

  // FE gọi với page=1 và per_page, trả về { data, meta } đúng format FE
  async findAllPaginated(page: number, perPage: number, query: any) {
    const name = query.name?.trim();
    const schoolYear = query.school_year ?? query.schoolYear;
    const facultyId = query.facultyId ?? query.faculty_id
      ? Number(query.facultyId ?? query.faculty_id)
      : null;

    const qb = this.graduationRepository.createQueryBuilder('graduation');

    if (name) {
      qb.andWhere('graduation.name LIKE :name', { name: `%${name}%` });
    }
    if (schoolYear) {
      qb.andWhere('graduation.schoolYear = :schoolYear', { schoolYear });
    }

    // Chế độ khoa: chỉ hiện đợt tốt nghiệp có SV thuộc khoa đó
    // (khoa suy ra qua graduation_student → student → major → faculty)
    if (facultyId) {
      const rows = await this.graduationStudentRepository
        .createQueryBuilder('gs')
        .innerJoin('gs.student', 'student')
        .innerJoin('student.major', 'major')
        .where('major.facultyId = :facultyId', { facultyId })
        .select('DISTINCT gs.graduation_id', 'gid')
        .getRawMany();
      const gids = rows.map((r) => Number(r.gid)).filter((n) => Number.isFinite(n));
      if (gids.length === 0) {
        return {
          data: [],
          meta: { total: 0, per_page: perPage, current_page: page, last_page: 0 },
        };
      }
      qb.andWhere('graduation.id IN (:...gids)', { gids });
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('graduation.id', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    // Đếm số sinh viên theo từng graduation_id. Ở chế độ khoa (facultyId): chỉ đếm SV thuộc khoa đó.
    const ids = data.map((g) => g.id);
    let countMap = new Map<number, number>();
    if (ids.length > 0) {
      const countQb = this.graduationStudentRepository
        .createQueryBuilder('gs')
        .select('gs.graduation_id', 'graduationId')
        .addSelect('COUNT(*)', 'cnt')
        .where('gs.graduation_id IN (:...ids)', { ids });
      if (facultyId) {
        countQb
          .innerJoin('gs.student', 'student')
          .innerJoin('student.major', 'major')
          .andWhere('major.facultyId = :facultyId', { facultyId });
      }
      const counts: { graduationId: string; cnt: string }[] = await countQb
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
    if (!Number.isFinite(id)) throw new BadRequestException('ID đợt tốt nghiệp không hợp lệ');
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


  // GET /graduation/:id/faculty-breakdown — đếm SV theo khoa trong 1 đợt tốt nghiệp
  async getFacultyBreakdown(graduationId: number) {
    await this.findOne(graduationId);

    const rows: { facultyId: string | null; facultyName: string | null; cnt: string }[] =
      await this.graduationStudentRepository
        .createQueryBuilder('gs')
        .innerJoin('gs.student', 'student')
        .leftJoin('student.major', 'major')
        .leftJoin('major.faculty', 'faculty')
        .select('faculty.id', 'facultyId')
        .addSelect('faculty.name', 'facultyName')
        .addSelect('COUNT(*)', 'cnt')
        .where('gs.graduationId = :graduationId', { graduationId })
        .groupBy('faculty.id')
        .addGroupBy('faculty.name')
        .getRawMany();

    const breakdown = rows.map((r) => ({
      facultyId: r.facultyId ? Number(r.facultyId) : null,
      facultyName: r.facultyName ?? 'Chưa xác định khoa',
      studentCount: Number(r.cnt),
    }));

    return {
      graduationId,
      totalStudents: breakdown.reduce((sum, b) => sum + b.studentCount, 0),
      faculties: breakdown.sort((a, b) => b.studentCount - a.studentCount),
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

      if (matches >= 2)// map giống getStudentsByGraduation
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

  /**
   * Import danh sách sinh viên tốt nghiệp từ file Excel (theo mẫu graduation_students_template.xlsx).
   * Cột: A Mã sinh viên | B Họ và tên | C Email | D Ngày sinh | E Mã ngành | F Tên ngành | G CCCD | H Số điện thoại
   * - Sinh viên đã có (theo mã SV) -> chỉ gắn vào đợt tốt nghiệp.
   * - Sinh viên chưa có -> tạo mới rồi gắn vào đợt tốt nghiệp.
   */
  async importStudentsFromExcel(
    graduationId: number,
    buffer: Buffer,
  ): Promise<ImportGraduationStudentsResult> {
    const graduation = await this.findOne(graduationId);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('File Excel không có dữ liệu');
//khởi tạo object 
    const result: ImportGraduationStudentsResult = {
      totalRows: 0,
      studentsCreated: 0,
      studentsLinked: 0,
      alreadyLinked: 0,
      errors: [],
    };
// lặp từ vòng 2 
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);

      const code = cellText(row, 1);
      const fullName = cellText(row, 2);
      const email = cellText(row, 3);
      const dob = parseExcelDate(cellText(row, 4));
      const majorCode = cellText(row, 5);
      const majorName= cellText(row,6)
      const cccd = cellText(row, 7);
      const phone = cellText(row, 8);
      const khoa= cellText(row,9)
      if (!code && !fullName) continue; // dòng trống

      result.totalRows++;

      if (!code) {
        result.errors.push({ row: rowNumber, message: 'Thiếu mã sinh viên' });
        continue;
      }
      let faculty : Faculty | null = null;
      if(khoa){
         faculty = await this.facultyRepository.findOne({ where: { name: khoa } });
        if(!faculty){
          const newFaculty = this.facultyRepository.create();
          Object.assign(newFaculty , {name:khoa});
          faculty = await this.facultyRepository.save(newFaculty);
        }
      }
      let major: Major | null = null;
      if (majorCode) {
        major = await this.majorRepository.findOne({ where: { code: majorCode } });
        if (!major) {
          // result.errors.push({ row: rowNumber, message: `Mã ngành "${majorCode}" không tồn tại trong hệ thống` });
          // continue;
          
          const newMajor = this.majorRepository.create();
          Object.assign(newMajor,{
            code : majorCode , 
             name : majorName,
             facultyId: faculty?.id,
          })
          major = await this.majorRepository.save(newMajor);
        }
      }

      let student = await this.studentRepository.findOne({ where: { code } });

      if (!student) {
        const { firstName, lastName } = splitFullName(fullName);
        const newStudent = this.studentRepository.create();
        Object.assign(newStudent, {
          code,
          fullName,
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          dob: dob ? new Date(dob) : null,
          citizenIdentification: cccd || null,
          trainingIndustryId: major?.id ?? null,
          schoolYearEnd: graduation.schoolYear ? String(graduation.schoolYear) : null,
        });
        student = await this.studentRepository.save(newStudent);
        result.studentsCreated++;
      }

      const existingLink = await this.graduationStudentRepository.findOne({
        where: { graduationId, studentId: student.id } as any,
      });

      if (existingLink) {
        result.alreadyLinked++;
        continue;
      }

      await this.graduationStudentRepository.save(
        this.graduationStudentRepository.create({ graduationId, studentId: student.id } as any),
      );
      result.studentsLinked++;
    }

    return result;
  }
}