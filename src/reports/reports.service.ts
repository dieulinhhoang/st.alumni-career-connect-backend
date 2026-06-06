import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { Faculty } from '../database/entities/faculty.entity';
import { Major } from '../database/entities/major.entity';
import { Student } from '../database/entities/student.entity';
import {
  FacultyReportSubmission,
  FacultyReportStatus,
} from '../database/entities/faculty-report-submission.entity';

// ─
// Helpers
// ─
const KEYS = {
  dungNganh:    ['q_dung_nganh', 'job_relevance_exact', 'dung_nganh'],
  lienQuan:     ['q_lien_quan', 'job_relevance_related', 'lien_quan'],
  tiepTucHoc:   ['q_tiep_tuc_hoc', 'continuing_study', 'tiep_tuc_hoc'],
  kvNhaNuoc:    ['q_kv_nha_nuoc', 'sector_state', 'khu_vuc_nha_nuoc'],
  kvTuNhan:     ['q_kv_tu_nhan', 'sector_private', 'khu_vuc_tu_nhan'],
  kvTuTao:      ['q_tu_tao_vl', 'self_employed', 'tu_tao_viec_lam'],
  kvYNuocNgoai: ['q_kv_nuoc_ngoai', 'sector_foreign', 'khu_vuc_nuoc_ngoai'],
  workLocation: ['q_noi_lam_viec', 'work_location', 'tinh_thanh'],
  salary:       ['q_luong', 'salary', 'luong_khoi_diem'],
  avgIncome:    ['q_thu_nhap', 'avg_income', 'thu_nhap_binh_quan'],
  thoiGianDuoi3Thang:    ['q_thoi_gian_duoi_3', 'job_search_under_3m'],
  thoiGian3Den6Thang:    ['q_thoi_gian_3_6', 'job_search_3_6m'],
  thoiGian6Den12Thang:   ['q_thoi_gian_6_12', 'job_search_6_12m'],
  thoiGian12ThangTroLen: ['q_thoi_gian_tren_12', 'job_search_over_12m'],
  knGiaoTiep:    ['q_kn_giao_tiep', 'skill_communication'],
  knThuyetTrinh: ['q_kn_thuyet_trinh', 'skill_presentation'],
  knLamViecNhom: ['q_kn_nhom', 'skill_teamwork'],
  knVietBaoCao:  ['q_kn_bao_cao', 'skill_report_writing'],
  knLanhDao:     ['q_kn_lanh_dao', 'skill_leadership'],
  knTiengAnh:    ['q_kn_tieng_anh', 'skill_english'],
  knTinHoc:      ['q_kn_tin_hoc', 'skill_it'],
  knHoiNhap:     ['q_kn_hoi_nhap', 'skill_global'],
  knKhac:        ['q_kn_khac', 'skill_other'],
  searchMethod:   ['q_hinh_thuc_tim_viec', 'job_search_method'],
  hiringMethod:   ['q_hinh_thuc_tuyen_dung', 'hiring_method'],
  postGradCourse: ['q_khoa_hoc_sau_tn', 'post_grad_course'],
  giaiPhap:       ['q_giai_phap', 'suggestion'],
};

function getVal(a: Record<string, any>, keys: string[]): any {
  for (const k of keys) if (a[k] != null && a[k] !== '') return a[k];
  return null;
}
function getBool(a: Record<string, any>, keys: string[]): boolean {
  const v = getVal(a, keys);
  if (v == null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['true','1','yes','co','có'].includes(v);
  return v === 1;
}
function getNum(a: Record<string, any>, keys: string[]): number {
  const v = getVal(a, keys);
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}
function getStr(a: Record<string, any>, keys: string[]): string {
  const v = getVal(a, keys);
  return v != null ? String(v) : '';
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

// ─

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
  async buildReport(filters: any, _userIndex: number) {
    const surveyId  = filters?.surveyId  ? Number(filters.surveyId)  : null;
    const facultyId = filters?.facultyId ? Number(filters.facultyId) : null;
    const majorId   = filters?.majorId   ? Number(filters.majorId)   : null;

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

    //  Nếu scope = faculty, kiểm tra đã nộp chưa 
    // Trường chỉ được xem data của khoa nếu khoa đã submitted/approved
    if (scope === 'faculty' && facultyId && batchId) {
      const sub = await this.submissionRepo.findOne({
        where: { batchId, facultyId },
      });
      const canView = sub?.status === 'submitted' || sub?.status === 'approved';
      if (!canView) {
        // Trả về data rỗng + thông báo chưa nộp
        return this._emptyFacultyReport(batch, facultyId, sub?.status ?? 'draft');
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

    //  Filter theo faculty/major 
    const filtered = enriched.filter((e) => {
      if (majorId   && e.majorId   !== majorId)   return false;
      if (facultyId && e.facultyId !== facultyId) return false;
      return true;
    });

    //  Build rows 
    const responseRows = this._buildResponseRows(filtered);
    const majorRows    = this._buildMajorRows(filtered, allMajors, facultyMap, batch);
    const graduateRows = this._buildGraduateRows(filtered, batch);

    //  facultyRows: lấy status thật từ DB 
    const submissions = batchId
      ? await this.submissionRepo.find({ where: { batchId } })
      : [];
    const submissionByFacultyId = new Map(submissions.map((s) => [s.facultyId, s]));

    // Đếm responses theo faculty
    const responsesByFaculty = new Map<number, EnrichedResponse[]>();
    for (const e of enriched) {
      if (e.facultyId) {
        if (!responsesByFaculty.has(e.facultyId)) responsesByFaculty.set(e.facultyId, []);
        responsesByFaculty.get(e.facultyId)!.push(e);
      }
    }

    const facultyRows = allFaculties.map((f) => {
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
          return getBool(a, KEYS.dungNganh) || getBool(a, KEYS.lienQuan);
        }).length,
      };
    });

    //  Stats 
    const totalGraduates = batch?.totalStudents ?? 0;
    const submitted      = filtered.length;
    const employed       = responseRows.filter((r) => r.dungNganh || r.lienQuan).length;
    const salaries       = responseRows.map((r) => r.salary).filter((s) => s > 0);
    const avgSalary      = salaries.length
      ? (salaries.reduce((a, b) => a + b, 0) / salaries.length).toFixed(1)
      : '0';

    const facObj = facultyId ? facultyMap.get(facultyId) : null;
    const majObj = majorId   ? majorMap.get(majorId)     : null;

    return {
      currentUser: {
        id: '0',
        name: 'Admin',
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
        relevantJobRate: submitted > 0 ? Math.round((employed / submitted) * 100) : 0,
        avgSalary: `${avgSalary} triệu`,
      },
      majorRows,
      graduateRows,
      responseRows,
      facultyRows,
      reportMeta: this._buildMeta(batch),
    };
  }


  // Private helpers
  

  private _emptyFacultyReport(
    batch: AlumniBatch | null,
    facultyId: number,
    status: FacultyReportStatus,
  ) {
    return {
      currentUser: { id: '0', name: 'Admin', scope: 'faculty', facultyName: null, majorName: null },
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

  private _buildResponseRows(filtered: EnrichedResponse[]) {
    return filtered.map((e) => {
      const a = e.response.answers ?? {};
      return {
        key: String(e.response.id),
        studentCode: e.response.studentId,
        fullName: e.response.studentName ?? '',
        dob: e.student?.dob ? String(e.student.dob) : '',
        gender: (e.student?.gender ?? 'male') as 'male' | 'female',
        cccd: e.student?.citizenIdentification ?? '',
        majorCode: e.majorCode,
        majorName: e.majorName,
        facultyName: e.facultyName,
        dungNganh:      getBool(a, KEYS.dungNganh),
        lienQuan:       getBool(a, KEYS.lienQuan),
        khongLienQuan:  !getBool(a, KEYS.dungNganh) && !getBool(a, KEYS.lienQuan) && !getBool(a, KEYS.tiepTucHoc),
        tiepTucHoc:     getBool(a, KEYS.tiepTucHoc),
        chuaCoVl:       getBool(a, ['q_chua_co_vl', 'unemployed', 'chua_co_viec']),
        kvNhaNuoc:    getBool(a, KEYS.kvNhaNuoc),
        kvTuNhan:     getBool(a, KEYS.kvTuNhan),
        kvTuTao:      getBool(a, KEYS.kvTuTao),
        kvYNuocNgoai: getBool(a, KEYS.kvYNuocNgoai),
        workLocation: getStr(a, KEYS.workLocation),
        thoiGianDuoi3Thang:    getBool(a, KEYS.thoiGianDuoi3Thang),
        thoiGian3Den6Thang:    getBool(a, KEYS.thoiGian3Den6Thang),
        thoiGian6Den12Thang:   getBool(a, KEYS.thoiGian6Den12Thang),
        thoiGian12ThangTroLen: getBool(a, KEYS.thoiGian12ThangTroLen),
        hocDu:        getBool(a, ['q_hoc_du', 'skill_sufficient']),
        hocMotPhan:   getBool(a, ['q_hoc_mot_phan', 'skill_partial']),
        khôngHocDuoc: getBool(a, ['q_khong_hoc_dc', 'skill_insufficient']),
        salary:    getNum(a, KEYS.salary),
        avgIncome: getNum(a, KEYS.avgIncome),
        searchMethod:   getStr(a, KEYS.searchMethod),
        hiringMethod:   getStr(a, KEYS.hiringMethod),
        knGiaoTiep:    getBool(a, KEYS.knGiaoTiep),
        knThuyetTrinh: getBool(a, KEYS.knThuyetTrinh),
        knLamViecNhom: getBool(a, KEYS.knLamViecNhom),
        knVietBaoCao:  getBool(a, KEYS.knVietBaoCao),
        knLanhDao:     getBool(a, KEYS.knLanhDao),
        knTiengAnh:    getBool(a, KEYS.knTiengAnh),
        knTinHoc:      getBool(a, KEYS.knTinHoc),
        knHoiNhap:     getBool(a, KEYS.knHoiNhap),
        knKhac:        getBool(a, KEYS.knKhac),
        postGradCourse: getStr(a, KEYS.postGradCourse),
        giaiPhap:       getStr(a, KEYS.giaiPhap),
      };
    });
  }

  private _buildMajorRows(
    filtered: EnrichedResponse[],
    allMajors: Major[],
    facultyMap: Map<number, Faculty>,
    batch: AlumniBatch | null,
  ) {
    const grouped = new Map<string, EnrichedResponse[]>();
    for (const e of filtered) {
      const key = e.majorCode || 'CHUNG';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(e);
    }
    return [...grouped.entries()].map(([code, rows]) => {
      const majorObj = allMajors.find((m) => m.code === code);
      const rr = this._buildResponseRows(rows);
      return {
        key: code,
        majorCode: code === 'CHUNG' ? '' : code,
        majorName: majorObj?.name ?? (code === 'CHUNG' ? 'Tổng hợp' : code),
        facultyName: majorObj?.facultyId ? (facultyMap.get(majorObj.facultyId)?.name ?? '') : '',
        total: batch?.totalStudents ?? 0,
        totalNu: rr.filter((r) => r.gender === 'female').length,
        submitted: rows.length,
        submittedNu: rr.filter((r) => r.gender === 'female').length,
        coViecLam: rr.filter((r) => r.dungNganh || r.lienQuan).length,
        tiepTucHoc: rr.filter((r) => r.tiepTucHoc).length,
        chuaCoViecLam: rr.filter((r) => r.chuaCoVl).length,
        approved: rr.filter((r) => r.dungNganh || r.lienQuan).length,
        kvNhaNuoc: rr.filter((r) => r.kvNhaNuoc).length,
        kvTuNhan:  rr.filter((r) => r.kvTuNhan).length,
        kvTuTao:   rr.filter((r) => r.kvTuTao).length,
        kvYNuocNgoai: rr.filter((r) => r.kvYNuocNgoai).length,
        workLocation: '',
      };
    });
  }

  private _buildGraduateRows(filtered: EnrichedResponse[], batch: AlumniBatch | null) {
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

  private _buildMeta(batch: AlumniBatch | null) {
    const t = batch?.title ?? '';
    const y = batch?.year ?? new Date().getFullYear();
    return {
      mau01Title: `THỐNG KÊ TÌNH HÌNH VIỆC LÀM CỦA SINH VIÊN TỐT NGHIỆP - ${t}`.trim(),
      mau02Title: `DANH SÁCH SINH VIÊN TỐT NGHIỆP - ${t}`.trim(),
      mau03Title: `KẾT QUẢ KHẢO SÁT SINH VIÊN TỐT NGHIỆP - ${t}`.trim(),
      mau01Note: `Số liệu tổng hợp theo ngành đào tạo, năm ${y}`,
      mau02Note: `Danh sách sinh viên đã tốt nghiệp trong đợt ${t}`,
      mau03Note: `Chi tiết câu trả lời khảo sát ${t}`,
    };
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