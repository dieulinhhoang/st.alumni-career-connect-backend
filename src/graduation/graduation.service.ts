import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { User } from 'src/database/entities/user.entity';
import { StudentApiService } from './student-api.service';

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
  private readonly logger = new Logger(GraduationService.name);

  /** Chặn 2 tiến trình đồng bộ chạy chồng nhau (cron trùng lịch, hoặc admin bấm nút giữa chừng). */
  private syncing = false;

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
    @InjectRepository(User)
        private userRepository: Repository<User>,
    private readonly studentApi: StudentApiService,
  ) { }

  // ─── ĐỒNG BỘ TỪ HỆ THỐNG ST STUDENT ─────────────────────────────────────────
  // Tương đương GraduationController bên Laravel: gọi API /api/v1/external/... rồi
  // lưu vào bảng graduation / student / graduation_student.

  /** Chuẩn hoá giới tính về đúng enum của cột student.gender. */
  private normalizeGender(value: any): 'male' | 'female' | 'other' | null {
    const v = String(value ?? '').trim().toLowerCase();
    if (v === 'male' || v === 'nam' || v === '1') return 'male';
    if (v === 'female' || v === 'nu' || v === 'nữ' || v === '0' || v === '2') return 'female';
    if (['male', 'female', 'other'].includes(v)) return v as any;
    return null;
  }

  // Khoa mặc định cho đợt đồng bộ từ ST Student = CNTT (FITA). Cache sau lần resolve đầu.
  // undefined = chưa resolve; null = không tìm thấy khoa CNTT trong DB.
  private defaultSyncFacultyId: number | null | undefined;

  /** Lấy id khoa CNTT (FITA) — đợt đồng bộ mặc định thuộc khoa này khi API không trả faculty_id. */
  private async getDefaultSyncFacultyId(): Promise<number | null> {
    if (this.defaultSyncFacultyId !== undefined) return this.defaultSyncFacultyId;
    const faculty = await this.facultyRepository.findOne({
      where: [{ abbr: 'FITA' }, { name: 'Công nghệ Thông tin' }] as any,
    });
    this.defaultSyncFacultyId = faculty?.id ?? null;
    return this.defaultSyncFacultyId;
  }

  /** Upsert 1 đợt tốt nghiệp theo id ngoài (giữ nguyên id để đồng bộ được nhiều lần). */
  private async upsertGraduation(item: any): Promise<Graduation> {
    const id = Number(item.id);
    // API chỉ phục vụ khoa CNTT → đợt đồng bộ mặc định là CNTT khi thiếu faculty_id.
    const apiFacultyId = item.faculty_id != null ? Number(item.faculty_id) : null;
    const payload = {
      name: item.name ?? null,
      schoolYear: item.school_year != null ? Number(item.school_year) : null,
      certification: item.certification ?? null,
      certificationDate: item.certification_date ? new Date(item.certification_date) : null,
      facultyId: apiFacultyId ?? (await this.getDefaultSyncFacultyId()),
    };

    const existing = await this.graduationRepository.findOne({ where: { id } });
    if (existing) {
      await this.graduationRepository.update({ id }, payload as any);
      return { ...existing, ...payload } as Graduation;
    }
    return this.graduationRepository.save(
      this.graduationRepository.create({ id, ...payload } as any) as any,
    ) as Promise<Graduation>;
  }

  /**
   * Ghép ngành cho SV và trả về major.id (KLTN) để gán trainingIndustryId. Hỗ trợ 2 dạng dữ liệu:
   *  - endpoint /students: có `industry_code`/`industry_name` -> map thẳng theo mã.
   *  - students LỒNG trong /graduation-ceremonies: chỉ có `training_industry_id` -> tra qua industryMap.
   * Chưa có Major theo mã thì tạo mới; gán faculty_id (chỉ khi khoa tồn tại bên KLTN, tránh lỗi khoá ngoại).
   * Khoa của SV suy ra qua major → faculty, không lưu trực tiếp trên bảng student.
   */
  private async resolveMajorId(
    item: any,
    industryMap?: Map<number, { code: string; name: string; facultyId: number | null }>,
  ): Promise<number | null> {
    let code = String(item.industry_code ?? '').trim();
    let name: string | null = item.industry_name ?? null;
    let apiFacultyId = item.faculty_id != null ? Number(item.faculty_id) : null;

    // Dạng students lồng: suy ra code/name/faculty từ training_industry_id qua bản đồ ngành
    if (!code && item.training_industry_id != null && industryMap) {
      const ti = industryMap.get(Number(item.training_industry_id));
      if (ti && ti.code) {
        code = ti.code;
        name = ti.name || name;
        apiFacultyId = ti.facultyId ?? apiFacultyId;
      }
    }

    if (!code) return null; // không đủ dữ liệu để xác định ngành

    const major = await this.majorRepository.findOne({ where: { code } });
    if (major) return major.id;

    let facultyId: number | null = null;
    if (apiFacultyId != null) {
      const faculty = await this.facultyRepository.findOne({ where: { id: apiFacultyId } });
      facultyId = faculty ? apiFacultyId : null;
    }

    const created = (await this.majorRepository.save(
      this.majorRepository.create({ code, name: name ?? code, facultyId } as any) as any,
    )) as Major;
    return created.id;
  }

  /** Upsert 1 sinh viên theo mã SV (code là cột unique). Trả về cờ created để đếm. */
  private async upsertStudent(
    item: any,
    industryMap?: Map<number, { code: string; name: string; facultyId: number | null }>,
  ): Promise<{ student: Student; created: boolean }> {
    const code = String(item.code ?? '').trim();
    const trainingIndustryId = await this.resolveMajorId(item, industryMap);
    const payload = {
      fullName: item.full_name ?? null,
      firstName: item.first_name ?? null,
      lastName: item.last_name ?? null,
      email: item.email ?? null,
      phone: item.phone ?? null,
      dob: item.dob ? new Date(item.dob) : null,
      gender: this.normalizeGender(item.gender),
      citizenIdentification: item.citizen_identification ?? null,
      trainingIndustryId,
      schoolYearEnd: item.school_year_end != null ? String(item.school_year_end) : null,
      // Các trường bổ sung ST Student trả về
      schoolYearStart: item.school_year_start != null ? String(item.school_year_start) : null,
      emailEdu: item.email_edu ?? null,
      className: item.class ?? null,
      status: item.status ?? null,
      trainingType: item.training_type ?? null,
      address: item.address ?? null,
      permanentResidence: item.permanent_residence ?? null,
      countryside: item.countryside ?? null,
      pob: item.pob ?? null,
      ethnic: item.ethnic ?? null,
      religion: item.religion ?? null,
      nationality: item.nationality ?? null,
      socialPolicyObject: item.social_policy_object ?? null,
    };

    const existing = await this.studentRepository.findOne({ where: { code } });
    if (existing) {
      // Chỉ cập nhật field mà API thực sự có dữ liệu. API trả null (vd đợt cũ thiếu ngành,
      // thiếu địa chỉ) thì GIỮ NGUYÊN giá trị đang có — tránh xoá trắng dữ liệu (vd từ import Excel).
      const patch: Record<string, any> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value !== null && value !== undefined) patch[key] = value;
      }
      if (Object.keys(patch).length > 0) {
        await this.studentRepository.update({ id: existing.id }, patch as any);
      }
      return { student: { ...existing, ...patch } as Student, created: false };
    }
    const student = await this.studentRepository.save(
      this.studentRepository.create({ code, ...payload } as any),
    );
    return { student: student as unknown as Student, created: true };
  }

  /**
   * Đồng bộ danh sách ĐỢT TỐT NGHIỆP từ ST Student (duyệt hết các trang).
   * Endpoint: GET /api/v1/external/graduation-ceremonies?page=N
   */
  async syncGraduations(studentToken: string): Promise<{ pages: number; upserted: number; ids: number[] }> {
    const ids: number[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const res: any = await this.studentApi.get('/api/v1/external/graduation-ceremonies', { page }, studentToken);
      const list: any[] = res?.data ?? [];
      lastPage = Number(res?.meta?.last_page ?? 1);

      for (const item of list) {
        const grad = await this.upsertGraduation(item);
        ids.push(Number(grad.id));
      }
      page++;
    } while (page <= lastPage);

    return { pages: page - 1, upserted: ids.length, ids };
  }

  /**
   * Đồng bộ SINH VIÊN của 1 đợt tốt nghiệp + gắn liên kết graduation_student.
   * Endpoint: GET /api/v1/external/graduation-ceremonies/:id/students?page=N
   */
  async syncGraduationStudents(graduationId: number, studentToken: string): Promise<{
    graduationId: number;
    studentsCreated: number;
    studentsUpdated: number;
    linksCreated: number;
    alreadyLinked: number;
  }> {
    const result = {
      graduationId,
      studentsCreated: 0,
      studentsUpdated: 0,
      linksCreated: 0,
      alreadyLinked: 0,
    };

    let page = 1;
    let lastPage = 1;

    do {
      const res: any = await this.studentApi.get(
        `/api/v1/external/graduation-ceremonies/${graduationId}/students`,
        { page },
        studentToken,
      );
      const list: any[] = res?.data ?? [];
      lastPage = Number(res?.meta?.last_page ?? 1);

      for (const item of list) {
        if (!item?.code) continue;
        const { student, created } = await this.upsertStudent(item);
        created ? result.studentsCreated++ : result.studentsUpdated++;

        const link = await this.graduationStudentRepository.findOne({
          where: { graduationId, studentId: student.id } as any,
        });
        if (link) {
          result.alreadyLinked++;
        } else {
          await this.graduationStudentRepository.save(
            this.graduationStudentRepository.create({ graduationId, studentId: student.id } as any),
          );
          result.linksCreated++;
        }
      }
      page++;
    } while (page <= lastPage);

    return result;
  }

  /**
   * Đổi SSO token của cán bộ (đang đăng nhập) lấy student token dùng cho API external.
   * Ném UnauthorizedException nếu user chưa có phiên SSO hoặc token hết hạn.
   */
  private async resolveStudentToken(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.accessToken) {
      throw new UnauthorizedException(
        'Tài khoản chưa có phiên đăng nhập ST Student. Hãy đăng nhập lại bằng SSO rồi thử đồng bộ.',
      );
    }
    return this.studentApi.verify(user.accessToken);
  }

  /** Chỉ đồng bộ danh sách đợt tốt nghiệp (dùng token của cán bộ userId). */
  async syncGraduationsForUser(userId: number) {
    const studentToken = await this.resolveStudentToken(userId);
    return this.syncGraduations(studentToken);
  }

  /** Chỉ đồng bộ sinh viên của 1 đợt (dùng token của cán bộ userId). */
  async syncGraduationStudentsForUser(graduationId: number, userId: number) {
    const studentToken = await this.resolveStudentToken(userId);
    return this.syncGraduationStudents(graduationId, studentToken);
  }

  /**
   * Đồng bộ tất cả: đợt tốt nghiệp trước, rồi sinh viên của từng đợt.
   * Dùng SSO token của cán bộ (userId) đang bấm nút để xác thực với ST Student.
   */
  async syncAllFromStudentSystem(userId: number) {
    if (this.syncing) {
      throw new ConflictException('Đang có một tiến trình đồng bộ chạy, vui lòng thử lại sau');
    }
    this.syncing = true;

    try {
      const studentToken = await this.resolveStudentToken(userId);

      // Phạm vi: token của cán bộ khoa CNTT -> API chỉ trả đợt/SV khoa đó.
      // Dùng đường /:id/students vì SV trả về có sẵn industry_code -> map được ngành/khoa
      // NGAY (không phụ thuộc /training-industries đang lỗi). Không cần luồng toàn trường.
      const grads = await this.syncGraduations(studentToken);

      let totalStudentsCreated = 0;
      let totalStudentsUpdated = 0;
      let totalLinksCreated = 0;
      let alreadyLinked = 0;

      for (const id of grads.ids) {
        const r = await this.syncGraduationStudents(id, studentToken);
        totalStudentsCreated += r.studentsCreated;
        totalStudentsUpdated += r.studentsUpdated;
        totalLinksCreated += r.linksCreated;
        alreadyLinked += r.alreadyLinked;
      }

      this.logger.log(
        `Đồng bộ tốt nghiệp (user #${userId}): ${grads.upserted} đợt, ` +
        `${totalStudentsCreated} SV mới / ${totalStudentsUpdated} cập nhật, ${totalLinksCreated} liên kết mới`,
      );

      return {
        graduationsUpserted: grads.upserted,
        totalStudentsCreated,
        totalStudentsUpdated,
        totalLinksCreated,
        alreadyLinked,
      };
    } finally {
      this.syncing = false;
    }
  }

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