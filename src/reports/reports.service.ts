import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { Faculty } from '../database/entities/faculty.entity';
import { Major } from '../database/entities/major.entity';
import { Student } from '../database/entities/student.entity';
import { GraduationStudent } from '../database/entities/graduation-student.entity';
import {
  FacultyReportSubmission,
  FacultyReportStatus,
} from '../database/entities/faculty-report-submission.entity';

export type AuthUser = {
  id: number | string;
  isAdmin: boolean;
  facultyId: number | null;
  name?: string | null;
};

// 
// Helpers — đọc câu trả lời của form động qua excelColumn
// 
// Mỗi câu hỏi trong formSnapshot có thể được admin gán `excelColumn`
// (vd: 'dungNganh', 'salary', 'kvNhaNuoc'...) để map câu hỏi đó vào 1 cột
// báo cáo. `answers` của response lưu theo key = question.id (động),
// nên cần build map excelColumn -> { questionId, options } theo từng batch
// rồi mới đọc được giá trị thực.

type FieldOption = { id: string; label: string };
type FieldDef = { questionId: string; options: FieldOption[] | null };
export type FieldMap = Map<string, FieldDef>;

// Các nhãn được coi là "không/chưa" khi field là dạng boolean (radio Có/Không...)
const NEGATIVE_LABELS = new Set([
  'không', 'khong', 'no', 'false', 'chưa', 'chua', '0',
]);

// Nhiều cột báo cáo (vd 5 trạng thái việc làm: dungNganh/lienQuan/khongLienQuan/
// tiepTucHoc/chuaCoVl, hay 8 kỹ năng mềm knGiaoTiep..knKhac) thực chất là các LỰA
// CHỌN khác nhau của CÙNG MỘT câu hỏi radio/checkbox trong form động. Nhưng mỗi câu
// hỏi chỉ gán được 1 excelColumn, nên các cột "con" này không thể trỏ trực tiếp vào
// câu hỏi gốc. FIELD_SOURCE cho phép các cột con dùng chung excelColumn "gộp" của
// câu hỏi gốc (employmentStatus, jobRelevance, workSector...), sau đó FIELD_MATCH_LABELS
// xác định lựa chọn nào của câu hỏi gốc tương ứng với cột con nào.
const FIELD_SOURCE: Record<string, string> = {
  dungNganh: 'jobRelevance',
  lienQuan: 'jobRelevance',
  khongLienQuan: 'jobRelevance',
  tiepTucHoc: 'employmentStatus',
  chuaCoVl: 'employmentStatus',
  kvNhaNuoc: 'workSector',
  kvTuNhan: 'workSector',
  kvTuTao: 'workSector',
  kvYNuocNgoai: 'workSector',
  thoiGianDuoi3Thang: 'jobSearchDuration',
  thoiGian3Den6Thang: 'jobSearchDuration',
  thoiGian6Den12Thang: 'jobSearchDuration',
  thoiGian12ThangTroLen: 'jobSearchDuration',
  hocDu: 'trainingFit',
  hocMotPhan: 'trainingFit',
  khôngHocDuoc: 'trainingFit',
  knGiaoTiep: 'softSkills',
  knThuyetTrinh: 'softSkills',
  knLamViecNhom: 'softSkills',
  knVietBaoCao: 'softSkills',
  knLanhDao: 'softSkills',
  knTiengAnh: 'softSkills',
  knTinHoc: 'softSkills',
  knHoiNhap: 'softSkills',
  knKhac: 'softSkills',
};

// Nhãn lựa chọn (so khớp "includes", không phân biệt hoa thường/dấu) xác định 1
// lựa chọn của câu hỏi gộp (theo FIELD_SOURCE) ứng với cột con nào.
const FIELD_MATCH_LABELS: Record<string, string[]> = {
  dungNganh: ['đúng ngành đào tạo'],
  lienQuan: ['liên quan đến ngành đào tạo'],
  khongLienQuan: ['không liên quan đến ngành đào tạo'],
  tiepTucHoc: ['tiếp tục học'],
  chuaCoVl: ['chưa có việc làm', 'chưa đi tìm việc'],
  kvNhaNuoc: ['nhà nước'],
  kvTuNhan: ['tư nhân'],
  kvTuTao: ['tự tạo việc làm'],
  kvYNuocNgoai: ['yếu tố nước ngoài'],
  thoiGianDuoi3Thang: ['dưới 3 tháng'],
  thoiGian3Den6Thang: ['3 tháng đến dưới 6 tháng'],
  thoiGian6Den12Thang: ['6 tháng đến dưới 12 tháng'],
  thoiGian12ThangTroLen: ['12 tháng trở lên'],
  hocDu: ['đã học được'],
  hocMotPhan: ['một phần'],
  khôngHocDuoc: ['không học được'],
  knGiaoTiep: ['giao tiếp'],
  knThuyetTrinh: ['thuyết trình'],
  knLamViecNhom: ['làm việc nhóm'],
  knVietBaoCao: ['viết báo cáo'],
  knLanhDao: ['lãnh đạo'],
  knTiengAnh: ['tiếng anh'],
  knTinHoc: ['tin học'],
  knHoiNhap: ['hội nhập'],
};

// Mức quy đổi lương/thu nhập khi câu hỏi là radio chọn khoảng (vd "Từ 5 triệu đến
// dưới 10 triệu") thay vì nhập số trực tiếp — lấy giá trị đại diện (triệu đồng).
const SALARY_RANGE_VALUES: Record<string, number> = {
  'dưới 5 triệu': 5,
  'từ 5 triệu đến dưới 10 triệu': 7.5,
  'từ 10 triệu đến dưới 15 triệu': 12.5,
  'từ 15 triệu trở lên': 15,
};

/** Build map excelColumn -> định nghĩa câu hỏi từ formSnapshot của batch */
export function buildFieldMap(batch: AlumniBatch | null): FieldMap {
  const map: FieldMap = new Map();
  const snap: any = batch?.formSnapshot ?? {};
  const questions: any[] = Array.isArray(snap.questions) ? snap.questions : [];
  for (const q of questions) {
    if (q.excelColumn) {
      map.set(q.excelColumn, {
        questionId: q.id ?? q.questionKey,
        options: Array.isArray(q.options) ? q.options : null,
      });
    }
  }
  return map;
}

/** Định nghĩa câu hỏi cho 1 field: ưu tiên excelColumn riêng, nếu không có thì dùng câu hỏi gộp (FIELD_SOURCE) */
function getFieldDef(fieldMap: FieldMap, field: string): FieldDef | undefined {
  return fieldMap.get(field) ?? (FIELD_SOURCE[field] ? fieldMap.get(FIELD_SOURCE[field]) : undefined);
}

function resolveRaw(a: Record<string, any>, fieldMap: FieldMap, field: string): any {
  const def = getFieldDef(fieldMap, field);
  if (!def) return null;
  const v = a[def.questionId];
  return v === undefined || v === '' ? null : v;
}

/** Đáp án có thể là 1 giá trị hoặc mảng (checkbox), lưu option.id hoặc option.label — quy về (các) label để so sánh */
function resolveLabels(raw: any, def?: FieldDef): string[] {
  const values = Array.isArray(raw) ? raw : [raw];
  return values.map((v) => {
    if (def?.options) {
      const opt = def.options.find((o) => o.id === v || o.label === v);
      if (opt) return opt.label;
    }
    return String(v);
  });
}

export function getBool(a: Record<string, any>, fieldMap: FieldMap, field: string): boolean {
  const def = getFieldDef(fieldMap, field);
  const raw = resolveRaw(a, fieldMap, field);
  if (raw == null) return false;
  const labels = resolveLabels(raw, def).map((l) => l.trim().toLowerCase());
  const expected = FIELD_MATCH_LABELS[field];

  let result: boolean;
  if (expected) {
    result = labels.some((l) => expected.some((e) => l.includes(e)));
  } else if (typeof raw === 'boolean') {
    result = raw;
  } else if (Array.isArray(raw)) {
    result = raw.length > 0;
  } else {
    const label = labels[0] ?? '';
    result = !!label && !NEGATIVE_LABELS.has(label);
  }

  // dungNganh/lienQuan/khongLienQuan chỉ tính khi SV đã thực sự có việc làm
  if (result && (field === 'dungNganh' || field === 'lienQuan' || field === 'khongLienQuan')) {
    const empDef = getFieldDef(fieldMap, 'employmentStatus');
    if (empDef) {
      const empLabels = resolveLabels(resolveRaw(a, fieldMap, 'employmentStatus'), empDef)
        .map((l) => l.trim().toLowerCase());
      if (!empLabels.some((l) => l.includes('đã có việc làm'))) return false;
    }
  }

  return result;
}

function getNum(a: Record<string, any>, fieldMap: FieldMap, field: string): number {
  const def = getFieldDef(fieldMap, field);
  const raw = resolveRaw(a, fieldMap, field);
  if (raw == null) return 0;
  const label = resolveLabels(raw, def)[0]?.trim().toLowerCase() ?? '';
  if (SALARY_RANGE_VALUES[label] !== undefined) return SALARY_RANGE_VALUES[label];
  const n = parseFloat(String(raw).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

/**
 * Câu hỏi địa chỉ ('address' / 'address-province') lưu answer dạng object { address, city }.
 * - `address` = địa chỉ đầy đủ (số nhà, đường, phường/xã...).
 * - `city`    = tỉnh/thành (Google Places tự tách, hoặc người dùng chọn từ Select 34 tỉnh).
 */
function isAddressObj(raw: any): boolean {
  return raw && typeof raw === 'object' && !Array.isArray(raw) &&
    ('city' in raw || 'address' in raw);
}

/** Địa chỉ ĐẦY ĐỦ — dùng cho báo cáo chi tiết (Mẫu 03). Ghép address + city, tránh lặp tỉnh. */
function addressFull(raw: any): string {
  const city = (raw.city ?? '').toString().trim();
  const address = (raw.address ?? '').toString().trim();
  if (city && address && address.includes(city)) return address; // address đã chứa tỉnh
  return [address, city].filter(Boolean).join(', ');
}

/** Chỉ TỈNH/THÀNH — dùng cho báo cáo gộp (Mẫu 01). */
function addressProvince(raw: any): string {
  const city = (raw.city ?? '').toString().trim();
  const address = (raw.address ?? '').toString().trim();
  return city || address || '';
}

/** getStr trả về địa chỉ đầy đủ cho câu hỏi địa chỉ (báo cáo chi tiết cần "đủ"). */
export function getStr(a: Record<string, any>, fieldMap: FieldMap, field: string): string {
  const def = getFieldDef(fieldMap, field);
  const raw = resolveRaw(a, fieldMap, field);
  if (raw == null) return '';
  if (isAddressObj(raw)) return addressFull(raw);
  return resolveLabels(raw, def).join(', ');
}

/** getProvince trả về chỉ tỉnh/thành cho câu hỏi địa chỉ (báo cáo gộp cần "Tỉnh/TP"). */
export function getProvince(a: Record<string, any>, fieldMap: FieldMap, field: string): string {
  const raw = resolveRaw(a, fieldMap, field);
  if (raw == null) return '';
  if (isAddressObj(raw)) return addressProvince(raw);
  // Câu hỏi text thường: trả về nguyên văn (fallback)
  return getStr(a, fieldMap, field);
}

type EnrichedResponse = {
  response: AlumniBatchResponse;
  student: Student | null;
  majorId: number | null;
  majorCode: string;
  majorName: string;
  facultyId: number | null;
  facultyName: string;
};

// 

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(AlumniBatch)
    private batchRepo: Repository<AlumniBatch>,

    @InjectRepository(AlumniBatchResponse)
    private responseRepo: Repository<AlumniBatchResponse>,

    @InjectRepository(Faculty)
    private facultyRepo: Repository<Faculty>,

    @InjectRepository(Major)
    private majorRepo: Repository<Major>,

    @InjectRepository(Student)
    private studentRepo: Repository<Student>,

    @InjectRepository(GraduationStudent)
    private graduationStudentRepo: Repository<GraduationStudent>,

    @InjectRepository(FacultyReportSubmission)
    private submissionRepo: Repository<FacultyReportSubmission>,
  ) {}

  // 
  // Submission CRUD
  // 

  /** Lấy (hoặc tạo mới) bản ghi submission của 1 khoa / 1 đợt */
  private async findOrCreateSubmission(
    batchId: number,
    facultyId: number,
  ): Promise<FacultyReportSubmission> {
    let sub = await this.submissionRepo.findOne({
      where: { batchId, facultyId },
    });
    if (!sub) {
      sub = this.submissionRepo.create({ batchId, facultyId, status: 'draft' });
      await this.submissionRepo.save(sub);
    }
    return sub;
  }

  async getSubmissionStatus(batchId: number, facultyId: number) {
    const sub = await this.submissionRepo.findOne({ where: { batchId, facultyId } });
    return {
      status: (sub?.status ?? 'draft') as FacultyReportStatus,
      submittedBy: sub?.submittedBy ?? null,
      submittedAt: sub?.submittedAt ?? null,
      feedback: sub?.feedback ?? null,
      reviewedBy: sub?.reviewedBy ?? null,
      reviewedAt: sub?.reviewedAt ?? null,
    };
  }

  async submitReport(batchId: number, facultyId: number, submittedBy: string) {
    const sub = await this.findOrCreateSubmission(batchId, facultyId);
    if (sub.status === 'approved') {
      throw new BadRequestException('Báo cáo đã được duyệt, không thể nộp lại.');
    }
    sub.status = 'submitted';
    sub.submittedBy = submittedBy;
    sub.submittedAt = new Date();
    sub.feedback = null;
    return this.submissionRepo.save(sub);
  }

  async withdrawReport(batchId: number, facultyId: number) {
    const sub = await this.findOrCreateSubmission(batchId, facultyId);
    if (sub.status !== 'submitted') {
      throw new BadRequestException('Chỉ có thể thu hồi khi đang ở trạng thái "Đã nộp".');
    }
    sub.status = 'draft';
    sub.submittedBy = null;
    sub.submittedAt = null;
    return this.submissionRepo.save(sub);
  }

  async approveReport(batchId: number, facultyId: number, reviewedBy: string) {
    const sub = await this.findOrCreateSubmission(batchId, facultyId);
    if (sub.status !== 'submitted') {
      throw new BadRequestException('Chỉ có thể duyệt khi khoa đã nộp báo cáo.');
    }
    sub.status = 'approved';
    sub.reviewedBy = reviewedBy;
    sub.reviewedAt = new Date();
    return this.submissionRepo.save(sub);
  }

  async returnReport(batchId: number, facultyId: number, feedback: string) {
    const sub = await this.findOrCreateSubmission(batchId, facultyId);
    if (sub.status !== 'submitted') {
      throw new BadRequestException('Chỉ có thể trả khi khoa đã nộp báo cáo.');
    }
    sub.status = 'returned';
    sub.feedback = feedback;
    return this.submissionRepo.save(sub);
  }

  // 
  // buildReport
  // 
  async buildReport(filters: any, currentUser?: AuthUser) {
    const surveyId  = filters?.surveyId ? Number(filters.surveyId) : null;

    const isAdmin = !!currentUser?.isAdmin;
    const ownFacultyId = currentUser?.facultyId ?? null;

    // Cán bộ khoa: luôn chỉ xem báo cáo của khoa mình, bỏ qua filter facultyId/majorId từ FE
    const facultyId = isAdmin
      ? (filters?.facultyId ? Number(filters.facultyId) : null)
      : ownFacultyId;
    const majorId = isAdmin && filters?.majorId ? Number(filters.majorId) : null;

    const scope: 'school' | 'faculty' | 'major' =
      majorId ? 'major' : facultyId ? 'faculty' : 'school';

    //  Batch
    let batch: AlumniBatch | null = null;
    if (surveyId) {
      batch = await this.batchRepo.findOne({ where: { id: surveyId } });
    } else {
      batch = await this.batchRepo.findOne({
        where: [{ status: 'ended' }, { status: 'active' }],
        order: { endDate: 'DESC', createdAt: 'DESC' },
      });
    }
    const batchId = batch?.id ?? null;

    //  Map excelColumn -> câu hỏi thực tế của form động (theo batch)
    const fieldMap = buildFieldMap(batch);

    //  Nếu scope = faculty, kiểm tra đã nộp chưa
    // Trường chỉ được xem data của khoa nếu khoa đã submitted/approved.
    // Khoa luôn được xem báo cáo của chính mình (kể cả khi chưa nộp) để rà soát trước khi nộp.
    const isOwnFaculty = !isAdmin && facultyId === ownFacultyId;
    if (scope === 'faculty' && facultyId && batchId && !isOwnFaculty) {
      const sub = await this.submissionRepo.findOne({
        where: { batchId, facultyId },
      });
      const canView = sub?.status === 'submitted' || sub?.status === 'approved';
      if (!canView) {
        // Trả về data rỗng + thông báo chưa nộp
        return this._emptyFacultyReport(batch, currentUser, sub?.status ?? 'draft', facultyId);
      }
    }

    //  Load faculties & majors 
    const [allFaculties, allMajors] = await Promise.all([
      this.facultyRepo.find({ where: { status: 1 } }),
      this.majorRepo.find({ where: { status: 1 } }),
    ]);
    const facultyMap = new Map(allFaculties.map((f) => [f.id, f]));
    const majorMap   = new Map(allMajors.map((m) => [m.id, m]));

    //  Lấy responses 
    let qb = this.responseRepo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'submitted' });
    if (batchId) qb = qb.andWhere('r.batch_id = :batchId', { batchId });
    const rawResponses = await qb.getMany();

    //  Enrich responses với major/faculty qua student.code 
    const codes = [...new Set(rawResponses.map((r) => r.studentId))];
    const students = codes.length
      ? await this.studentRepo.createQueryBuilder('s')
          .where('s.code IN (:...codes)', { codes })
          .getMany()
      : [];
    const studentByCode = new Map(students.map((s) => [s.code, s]));

    const enriched: EnrichedResponse[] = rawResponses.map((r) => {
      const student = studentByCode.get(r.studentId) ?? null;
      const major   = student?.trainingIndustryId ? majorMap.get(student.trainingIndustryId) ?? null : null;
      const faculty = major?.facultyId ? facultyMap.get(major.facultyId) ?? null : null;
      return {
        response: r,
        student,
        majorId:     major?.id    ?? null,
        majorCode:   major?.code  ?? '',
        majorName:   major?.name  ?? '',
        facultyId:   faculty?.id  ?? null,
        facultyName: faculty?.name ?? '',
      };
    });

    //  Lấy trạng thái nộp của các khoa (để biết khoa nào đã nộp/được duyệt)
    const submissions = batchId
      ? await this.submissionRepo.find({ where: { batchId } })
      : [];
    const submissionByFacultyId = new Map(submissions.map((s) => [s.facultyId, s]));
    const submittedFacultyIds = new Set(
      submissions
        .filter((s) => s.status === 'submitted' || s.status === 'approved')
        .map((s) => s.facultyId),
    );

    //  Filter theo faculty/major
    const filtered = enriched.filter((e) => {
      if (majorId   && String(e.majorId)   !== String(majorId))   return false;
      if (facultyId && String(e.facultyId) !== String(facultyId)) return false;
      // Trường (xem tổng hợp toàn trường) chỉ thấy data của các khoa đã nộp/được duyệt
      if (isAdmin && scope === 'school') {
        if (!e.facultyId || !submittedFacultyIds.has(e.facultyId)) return false;
      }
      return true;
    });

    //  Tổng SV tốt nghiệp theo từng ngành (từ danh sách SV của đợt tốt nghiệp gắn với batch)
    const majorTotals = await this._buildMajorTotals(batch, allMajors);

    //  Build rows
    const responseRows = this._buildResponseRows(filtered, fieldMap);
    const majorRows    = this._buildMajorRows(filtered, allMajors, facultyMap, batch, fieldMap, majorTotals);
    const graduateRows = await this._buildGraduateRows(
      filtered,
      enriched,
      batch,
      allMajors,
      facultyMap,
      facultyId,
      majorId,
      isAdmin,
      scope,
      submittedFacultyIds,
    );

    // Đếm responses theo faculty
    const responsesByFaculty = new Map<number, EnrichedResponse[]>();
    for (const e of enriched) {
      if (e.facultyId) {
        if (!responsesByFaculty.has(e.facultyId)) responsesByFaculty.set(e.facultyId, []);
        responsesByFaculty.get(e.facultyId)!.push(e);
      }
    }

    // Đợt khảo sát chỉ liên quan tới các khoa thực sự có SV trong đợt tốt nghiệp
    // gắn với batch (1 đợt tốt nghiệp có thể gồm SV của nhiều khoa khác nhau) ->
    // bảng tình trạng nộp báo cáo không nên liệt kê khoa không có SV trong đợt này.
    const facultyIdsInBatch = new Set(
      allMajors
        .filter((m) => (majorTotals.get(Number(m.id))?.total ?? 0) > 0)
        .map((m) => m.facultyId)
        .filter((id): id is number => id != null),
    );
    const facultiesForRows = batch?.graduationId
      ? allFaculties.filter((f) => facultyIdsInBatch.has(f.id))
      : allFaculties;

    const facultyRows = facultiesForRows.map((f) => {
      const sub = submissionByFacultyId.get(f.id);
      const facResps = responsesByFaculty.get(f.id) ?? [];
      return {
        key: String(f.id),
        facultyCode: f.abbr ?? String(f.id),
        facultyName: f.name,
        status: (sub?.status ?? 'draft') as FacultyReportStatus,
        submittedBy: sub?.submittedBy ?? null,
        submittedAt: sub?.submittedAt
          ? new Date(sub.submittedAt).toLocaleString('vi-VN')
          : null,
        deadline: batch?.endDate ?? null,
        feedback: sub?.feedback ?? null,
        // Thống kê phản hồi (chỉ hiện với school view)
        responseCount: facResps.length,
        employedCount: facResps.filter((e) => {
          const a = e.response.answers ?? {};
          return (
            getBool(a, fieldMap, 'dungNganh') ||
            getBool(a, fieldMap, 'lienQuan') ||
            getBool(a, fieldMap, 'khongLienQuan')
          );
        }).length,
      };
    });

    //  Stats
    // Khi xem theo khoa (facultyId có giá trị): tổng SV tốt nghiệp chỉ tính các ngành thuộc khoa đó,
    // không lấy batch.totalStudents (đó là tổng toàn trường, gây sai số liệu cho cán bộ khoa).
    const totalGraduates = facultyId
      ? allMajors
          .filter((m) => String(m.facultyId) === String(facultyId))
          .reduce((sum, m) => sum + (majorTotals.get(Number(m.id))?.total ?? 0), 0)
      : (batch?.totalStudents ?? 0);
    const submitted      = filtered.length;
    // "Có việc làm": đúng ngành, liên quan ngành, hoặc không liên quan ngành (vẫn có việc)
    const employed        = responseRows.filter((r) => r.dungNganh || r.lienQuan || r.khongLienQuan).length;
    // "Đúng/liên quan ngành": chỉ tính 2 nhóm phù hợp với chuyên ngành đào tạo
    const relevantEmployed = responseRows.filter(
  (r) => r.dungNganh || r.lienQuan || r.tiepTucHoc,
).length;
// console.log(relevantEmployed, )
    const salaries       = responseRows.map((r) => r.salary).filter((s) => s > 0);
    const avgSalary      = salaries.length
      ? (salaries.reduce((a, b) => a + b, 0) / salaries.length).toFixed(1)
      : '0';

    const facObj = facultyId ? facultyMap.get(facultyId) : null;
    const majObj = majorId   ? majorMap.get(majorId)     : null;

    return {
      currentUser: {
        id: String(currentUser?.id ?? '0'),
        name: currentUser?.name || (isAdmin ? 'Trường' : 'Khoa'),
        isAdmin,
        facultyId: ownFacultyId != null ? String(ownFacultyId) : null,
        scope,
        facultyName: facObj?.name ?? null,
        majorName:   majObj?.name ?? null,
      },
      stats: {
        totalGraduates,
        submitted,
        submissionRate: totalGraduates > 0 ? Math.round((submitted / totalGraduates) * 100) : 0,
        employed,
        employmentRate: submitted > 0 ? Math.round((employed / submitted) * 100) : 0,
        relevantJobRate: submitted > 0 ? Math.round((relevantEmployed / submitted) * 100) : 0,
        avgSalary: `${avgSalary} triệu`,
      },
      majorRows,
      graduateRows,
      responseRows,
      // Tiến độ nộp của các khoa khác chỉ dành cho trường (admin) theo dõi
      facultyRows: isAdmin ? facultyRows : [],
      reportMeta: this._buildMeta(batch),
    };
  }


  // Private helpers
  

  private async _emptyFacultyReport(
    batch: AlumniBatch | null,
    currentUser: AuthUser | undefined,
    status: FacultyReportStatus,
    facultyId: number | null,
  ) {
    const isAdmin = !!currentUser?.isAdmin;
    const ownFacultyId = currentUser?.facultyId ?? null;
    const facObj = facultyId ? await this.facultyRepo.findOneBy({ id: facultyId }) : null;
    return {
      currentUser: {
        id: String(currentUser?.id ?? '0'),
        name: currentUser?.name || (isAdmin ? 'Trường' : 'Khoa'),
        isAdmin,
        facultyId: ownFacultyId != null ? String(ownFacultyId) : null,
        scope: 'faculty' as const,
        facultyName: facObj?.name ?? null,
        majorName: null,
      },
      stats: { totalGraduates: 0, submitted: 0, submissionRate: 0, employed: 0, employmentRate: 0, relevantJobRate: 0, avgSalary: '0 triệu' },
      majorRows: [],
      graduateRows: [],
      responseRows: [],
      facultyRows: [],
      reportMeta: this._buildMeta(batch),
      // Signal cho FE biết khoa chưa nộp
      submissionStatus: status,
      notSubmitted: true,
    };
  }

  private _buildResponseRows(filtered: EnrichedResponse[], fieldMap: FieldMap) {
    return filtered.map((e) => {
      const a = e.response.answers ?? {};
      return {
        key: String(e.response.id),
        studentCode: e.response.studentId,
        fullName: e.response.studentName ?? '',
        dob: e.student?.dob ? String(e.student.dob) : '',
        gender: (e.student?.gender ?? 'male') as 'male' | 'female',
        cccd: e.student?.citizenIdentification ?? '',
        phone: e.response.studentPhone ?? e.student?.phone ?? '',
        email: e.response.studentEmail ?? e.student?.email ?? '',
        majorCode: e.majorCode,
        majorName: e.majorName,
        facultyId: e.facultyId,
        facultyName: e.facultyName,
        dungNganh:      getBool(a, fieldMap, 'dungNganh'),
        lienQuan:       getBool(a, fieldMap, 'lienQuan'),
        khongLienQuan:  getBool(a, fieldMap, 'khongLienQuan'),
        tiepTucHoc:     getBool(a, fieldMap, 'tiepTucHoc'),
        chuaCoVl:       getBool(a, fieldMap, 'chuaCoVl'),
        kvNhaNuoc:    getBool(a, fieldMap, 'kvNhaNuoc'),
        kvTuNhan:     getBool(a, fieldMap, 'kvTuNhan'),
        kvTuTao:      getBool(a, fieldMap, 'kvTuTao'),
        kvYNuocNgoai: getBool(a, fieldMap, 'kvYNuocNgoai'),
        workLocation: getStr(a, fieldMap, 'workLocation'),       // đầy đủ — Mẫu 03 (chi tiết)
        workProvince: getProvince(a, fieldMap, 'workLocation'),  // chỉ Tỉnh/TP — Mẫu 01 (gộp)
        hiringDate:   getStr(a, fieldMap, 'hiringDate'),
        thoiGianDuoi3Thang:    getBool(a, fieldMap, 'thoiGianDuoi3Thang'),
        thoiGian3Den6Thang:    getBool(a, fieldMap, 'thoiGian3Den6Thang'),
        thoiGian6Den12Thang:   getBool(a, fieldMap, 'thoiGian6Den12Thang'),
        thoiGian12ThangTroLen: getBool(a, fieldMap, 'thoiGian12ThangTroLen'),
        hocDu:        getBool(a, fieldMap, 'hocDu'),
        hocMotPhan:   getBool(a, fieldMap, 'hocMotPhan'),
        khôngHocDuoc: getBool(a, fieldMap, 'khôngHocDuoc'),
        salary:    getNum(a, fieldMap, 'salary'),
        avgIncome: getNum(a, fieldMap, 'avgIncome'),
        searchMethod:   getStr(a, fieldMap, 'searchMethod'),
        hiringMethod:   getStr(a, fieldMap, 'hiringMethod'),
        knGiaoTiep:    getBool(a, fieldMap, 'knGiaoTiep'),
        knThuyetTrinh: getBool(a, fieldMap, 'knThuyetTrinh'),
        knLamViecNhom: getBool(a, fieldMap, 'knLamViecNhom'),
        knVietBaoCao:  getBool(a, fieldMap, 'knVietBaoCao'),
        knLanhDao:     getBool(a, fieldMap, 'knLanhDao'),
        knTiengAnh:    getBool(a, fieldMap, 'knTiengAnh'),
        knTinHoc:      getBool(a, fieldMap, 'knTinHoc'),
        knHoiNhap:     getBool(a, fieldMap, 'knHoiNhap'),
        knKhac:        getBool(a, fieldMap, 'knKhac'),
        postGradCourse: getStr(a, fieldMap, 'postGradCourse'),
        giaiPhap:       getStr(a, fieldMap, 'giaiPhap'),
      };
    });
  }

  /** Tổng SV / Tổng SV nữ tốt nghiệp theo từng ngành, dựa trên danh sách SV của đợt tốt nghiệp gắn với batch */
  private async _buildMajorTotals(
    batch: AlumniBatch | null,
    allMajors: Major[],
  ): Promise<Map<number, { total: number; totalNu: number }>> {
    const result = new Map<number, { total: number; totalNu: number }>();
    const graduationId = batch?.graduationId;
    if (!graduationId) return result;

    const rows = await this.graduationStudentRepo
      .createQueryBuilder('gs')
      .innerJoin('gs.student', 's')
      .select('s.training_industry_id', 'majorId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN s.gender = 'female' THEN 1 ELSE 0 END)`, 'totalNu')
      .where('gs.graduation_id = :graduationId', { graduationId })
      .groupBy('s.training_industry_id')
      .getRawMany();

    for (const r of rows) {
      const majorId = r.majorId != null ? Number(r.majorId) : null;
      if (majorId == null) continue;
      result.set(majorId, { total: Number(r.total), totalNu: Number(r.totalNu) });
    }
    return result;
  }

  private _buildMajorRows(
    filtered: EnrichedResponse[],
    allMajors: Major[],
    facultyMap: Map<number, Faculty>,
    batch: AlumniBatch | null,
    fieldMap: FieldMap,
    majorTotals: Map<number, { total: number; totalNu: number }>,
  ) {
    const grouped = new Map<string, EnrichedResponse[]>();
    for (const e of filtered) {
      const key = e.majorCode || 'CHUNG';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(e);
    }
    return [...grouped.entries()].map(([code, rows]) => {
      const majorObj = allMajors.find((m) => m.code === code);
      const rr = this._buildResponseRows(rows, fieldMap);
      const totals = majorObj?.id ? majorTotals.get(Number(majorObj.id)) : undefined;
      return {
        key: code,
        majorCode: code === 'CHUNG' ? '' : code,
        majorName: majorObj?.name ?? (code === 'CHUNG' ? 'Tổng hợp' : code),
        facultyName: majorObj?.facultyId ? (facultyMap.get(majorObj.facultyId)?.name ?? '') : '',
        total: totals?.total ?? (batch?.totalStudents ?? 0),
        totalNu: totals?.totalNu ?? rr.filter((r) => r.gender === 'female').length,
        submitted: rows.length,
        submittedNu: rr.filter((r) => r.gender === 'female').length,
        coViecLam: rr.filter((r) => r.dungNganh || r.lienQuan || r.khongLienQuan).length,
        tiepTucHoc: rr.filter((r) => r.tiepTucHoc).length,
        chuaCoViecLam: rr.filter((r) => r.chuaCoVl).length,
        approved: rr.filter((r) => r.dungNganh || r.lienQuan).length,
        kvNhaNuoc: rr.filter((r) => r.kvNhaNuoc).length,
        kvTuNhan:  rr.filter((r) => r.kvTuNhan).length,
        kvTuTao:   rr.filter((r) => r.kvTuTao).length,
        kvYNuocNgoai: rr.filter((r) => r.kvYNuocNgoai).length,
        workLocation: [...new Set(rr.map((r) => r.workProvince).filter(Boolean))].join('\n'),
      };
    });
  }

  /**
   * Mẫu 2 = danh sách TOÀN BỘ sinh viên của đợt tốt nghiệp gắn với batch
   * (không chỉ những SV đã phản hồi khảo sát), cột "Có phản hồi" đánh X
   * cho SV có response submitted. Nếu batch không gắn graduationId, fallback
   * về danh sách SV đã phản hồi (filtered) như cũ.
   */
  private async _buildGraduateRows(
    filtered: EnrichedResponse[],
    enriched: EnrichedResponse[],
    batch: AlumniBatch | null,
    allMajors: Major[],
    facultyMap: Map<number, Faculty>,
    facultyId: number | null,
    majorId: number | null,
    isAdmin: boolean,
    scope: 'school' | 'faculty' | 'major',
    submittedFacultyIds: Set<number>,
  ) {
    const graduationId = batch?.graduationId;
    if (!graduationId) {
      return filtered.map((e) => ({
        key: String(e.response.id),
        studentCode: e.response.studentId,
        fullName: e.response.studentName ?? '',
        gender: (e.student?.gender ?? 'male') as 'male' | 'female',
        certification: '',
        cccd: e.student?.citizenIdentification ?? '',
        majorCode: e.majorCode,
        majorName: e.majorName,
        facultyName: e.facultyName,
        decision: '',
        certDate: '',
        phone: e.response.studentPhone ?? '',
        email: e.response.studentEmail ?? '',
        surveyMethod: 'Online',
        status: 'submitted' as const,
        note: '',
        cohort: batch?.graduationPeriod ?? '',
      }));
    }

    const majorMap = new Map(allMajors.map((m) => [String(m.id), m]));
    const responseByCode = new Map(enriched.map((e) => [e.response.studentId, e]));

    const gradStudents = await this.graduationStudentRepo.find({
      where: { graduationId } as any,
      relations: ['student'],
    });

    return gradStudents
      .map((gs) => {
        const student = gs.student;
        const major = student?.trainingIndustryId
          ? majorMap.get(String(student.trainingIndustryId)) ?? null
          : null;
        const facId = major?.facultyId ?? null;
        return { student, major, facId };
      })
      .filter(({ major, facId }) => {
        if (majorId != null && String(major?.id) !== String(majorId)) return false;
        if (facultyId != null && String(facId) !== String(facultyId)) return false;
        if (isAdmin && scope === 'school') {
          if (!facId || !submittedFacultyIds.has(facId)) return false;
        }
        return true;
      })
      .map(({ student, major, facId }) => {
        const e = student ? responseByCode.get(student.code) : undefined;
        return {
          key: e ? String(e.response.id) : `gs-${student?.id}`,
          studentCode: student?.code ?? '',
          fullName: e?.response.studentName ?? student?.fullName ?? '',
          gender: (student?.gender ?? 'male') as 'male' | 'female',
          certification: '',
          cccd: student?.citizenIdentification ?? '',
          majorCode: major?.code ?? '',
          majorName: major?.name ?? '',
          facultyName: facId ? (facultyMap.get(facId)?.name ?? '') : '',
          decision: '',
          certDate: '',
          phone: e?.response.studentPhone ?? student?.phone ?? '',
          email: e?.response.studentEmail ?? student?.email ?? '',
          surveyMethod: 'Online',
          status: (e ? 'submitted' : 'draft') as 'submitted' | 'draft',
          note: '',
          cohort: batch?.graduationPeriod ?? '',
        };
      });
  }

  private _buildMeta(batch: AlumniBatch | null) {
    const t = batch?.title ?? '';
    const y = batch?.year ?? new Date().getFullYear();
    return {
      batchTitle: t,
      year: y,
      mau01Title: `THỐNG KÊ TÌNH HÌNH VIỆC LÀM CỦA SINH VIÊN TỐT NGHIỆP - ${t}`.trim(),
      mau02Title: `DANH SÁCH SINH VIÊN TỐT NGHIỆP - ${t}`.trim(),
      mau03Title: `KẾT QUẢ KHẢO SÁT SINH VIÊN TỐT NGHIỆP - ${t}`.trim(),
      mau01Note: `Số liệu tổng hợp theo ngành đào tạo, năm ${y}`,
      mau02Note: `Danh sách sinh viên đã tốt nghiệp trong đợt ${t}`,
      mau03Note: `Chi tiết câu trả lời khảo sát ${t}`,
    };
  }


  // Export: dữ liệu form động cho mẫu báo cáo 3
  // Trả về câu hỏi từ formSnapshot của batch + answers thô của từng phản hồi

  async getExportSurveyData(filters: any) {
    const surveyId  = filters?.surveyId  ? Number(filters.surveyId)  : null;
    const facultyId = filters?.facultyId ? Number(filters.facultyId) : null;
    const majorId   = filters?.majorId   ? Number(filters.majorId)   : null;

    let batch: AlumniBatch | null = null;
    if (surveyId) {
      batch = await this.batchRepo.findOne({ where: { id: surveyId } });
    } else {
      batch = await this.batchRepo.findOne({
        where: [{ status: 'ended' }, { status: 'active' }],
        order: { endDate: 'DESC', createdAt: 'DESC' },
      });
    }

    const [allFaculties, allMajors] = await Promise.all([
      this.facultyRepo.find({ where: { status: 1 } }),
      this.majorRepo.find({ where: { status: 1 } }),
    ]);
    const majorMap   = new Map(allMajors.map((m) => [m.id, m]));
    const facultyMap = new Map(allFaculties.map((f) => [f.id, f]));

    let qb = this.responseRepo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'submitted' });
    if (batch?.id) qb = qb.andWhere('r.batch_id = :batchId', { batchId: batch.id });
    const rawResponses = await qb.getMany();

    const codes = [...new Set(rawResponses.map((r) => r.studentId))];
    const students = codes.length
      ? await this.studentRepo.createQueryBuilder('s')
          .where('s.code IN (:...codes)', { codes })
          .getMany()
      : [];
    const studentByCode = new Map(students.map((s) => [s.code, s]));

    const rows = rawResponses
      .map((r) => {
        const student = studentByCode.get(r.studentId) ?? null;
        const major   = student?.trainingIndustryId ? majorMap.get(student.trainingIndustryId) ?? null : null;
        const faculty = major?.facultyId ? facultyMap.get(major.facultyId) ?? null : null;
        return {
          studentCode: r.studentId,
          fullName: r.studentName ?? '',
          dob: student?.dob ? String(student.dob) : '',
          gender: student?.gender ?? 'male',
          cccd: student?.citizenIdentification ?? '',
          majorCode: major?.code ?? '',
          phone: r.studentPhone ?? '',
          email: r.studentEmail ?? '',
          facultyId: faculty?.id ?? null,
          majorId: major?.id ?? null,
          answers: r.answers ?? {},
        };
      })
      .filter((row) => {
        if (majorId   && row.majorId   !== majorId)   return false;
        if (facultyId && row.facultyId !== facultyId) return false;
        return true;
      });

    // Câu hỏi từ formSnapshot, sắp theo order toàn cục của builder
    const snapshot: any = batch?.formSnapshot ?? {};
    const questions: any[] = Array.isArray(snapshot.questions)
      ? [...snapshot.questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : [];

    return { batch, questions, rows };
  }


  //
  // Danh sách cựu SV "Chưa có việc làm" (đã khảo sát) — dùng để gửi email thông báo tuyển dụng
  //

  /**
   * Lấy danh sách cựu SV trả lời "Chưa có việc làm"/"Chưa đi tìm việc" trong đợt khảo sát
   * (mặc định đợt mới nhất). Có thể lọc theo facultyIds (vd: khoa mà tin tuyển dụng nhắm tới).
   *
   * Query trực tiếp từ alumni_batch_responses (như getExportSurveyData) — KHÔNG dùng buildReport(),
   * vì buildReport() áp thêm gate "khoa đã nộp báo cáo lên trường" cho scope=school, là quy trình
   * nội bộ của báo cáo, không liên quan đến việc cựu SV đã trả lời khảo sát hay chưa.
   */
  async getUnemployedAlumni(filters: {
    surveyId?: string;
    facultyIds?: number[];
  }) {
    const surveyId = filters?.surveyId ? Number(filters.surveyId) : null;

    let batch: AlumniBatch | null = null;
    if (surveyId) {
      batch = await this.batchRepo.findOne({ where: { id: surveyId } });
    } else {
      batch = await this.batchRepo.findOne({
        where: [{ status: 'ended' }, { status: 'active' }],
        order: { endDate: 'DESC', createdAt: 'DESC' },
      });
    }
    const fieldMap = buildFieldMap(batch);

    let qb = this.responseRepo.createQueryBuilder('r').where('r.status = :status', { status: 'submitted' });
    if (batch?.id) qb = qb.andWhere('r.batch_id = :batchId', { batchId: batch.id });
    const rawResponses = await qb.getMany();

    const codes = [...new Set(rawResponses.map((r) => r.studentId))];
    const students = codes.length
      ? await this.studentRepo.createQueryBuilder('s').where('s.code IN (:...codes)', { codes }).getMany()
      : [];
    const studentByCode = new Map(students.map((s) => [s.code, s]));
    const allMajors = await this.majorRepo.find({ where: { status: 1 } });
    const majorMap = new Map(allMajors.map((m) => [m.id, m]));

    const facultyIds = filters.facultyIds?.length ? new Set(filters.facultyIds.map(String)) : null;
    const seen = new Set<string>();
    const alumni: Array<{ studentCode: string; fullName: string; email: string; majorName?: string; facultyName?: string }> = [];

    for (const r of rawResponses) {
      const a = r.answers ?? {};
      if (!getBool(a, fieldMap, 'chuaCoVl')) continue;

      const student = studentByCode.get(r.studentId) ?? null;
      const major = student?.trainingIndustryId ? majorMap.get(student.trainingIndustryId) ?? null : null;
      const facultyId = major?.facultyId ?? null;
      if (facultyIds && !facultyIds.has(String(facultyId))) continue;

      const email = r.studentEmail ?? student?.email ?? '';
      if (!email) continue;
      const key = email.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      alumni.push({
        studentCode: r.studentId,
        fullName: r.studentName ?? student?.fullName ?? '',
        email,
        majorName: major?.name ?? '',
      });
    }

    return { batchTitle: batch?.title ?? '', alumni };
  }

  // Batch options

  async getBatchOptions() {
    const batches = await this.batchRepo.find({
      where: [{ status: 'ended' }, { status: 'active' }],
      order: { endDate: 'DESC', createdAt: 'DESC' },
      select: ['id', 'title', 'year', 'graduationPeriod', 'endDate', 'status'],
    });
    return batches.map((b) => ({
      value: String(b.id),
      label: b.graduationPeriod
        ? `${b.title} (${b.graduationPeriod})`
        : b.year
        ? `${b.title} (${b.year})`
        : b.title,
      deadline: b.endDate ?? null,
      status: b.status,
    }));
  }
}