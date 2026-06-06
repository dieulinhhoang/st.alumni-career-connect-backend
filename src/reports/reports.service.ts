import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { Faculty } from '../database/entities/faculty.entity';
import { Major } from '../database/entities/major.entity';

// ────────────────────────────────────────────────────────────────
// Helpers để đọc câu trả lời từ answers JSON
// ────────────────────────────────────────────────────────────────
const KEYS = {
  // Tình trạng việc làm
  employed:     ['q_employed', 'employment_status', 'tinh_trang_viec_lam', 'q_employment_status'],
  dungNganh:    ['q_dung_nganh', 'job_relevance_exact', 'dung_nganh'],
  lienQuan:     ['q_lien_quan', 'job_relevance_related', 'lien_quan'],
  tiepTucHoc:   ['q_tiep_tuc_hoc', 'continuing_study', 'tiep_tuc_hoc'],

  // Khu vực làm việc
  kvNhaNuoc:    ['q_kv_nha_nuoc', 'sector_state', 'khu_vuc_nha_nuoc'],
  kvTuNhan:     ['q_kv_tu_nhan', 'sector_private', 'khu_vuc_tu_nhan'],
  kvTuTao:      ['q_tu_tao_vl', 'self_employed', 'tu_tao_viec_lam'],
  kvYNuocNgoai: ['q_kv_nuoc_ngoai', 'sector_foreign', 'khu_vuc_nuoc_ngoai'],

  // Nơi làm việc
  workLocation: ['q_noi_lam_viec', 'work_location', 'tinh_thanh'],

  // Lương
  salary:       ['q_luong', 'salary', 'luong_khoi_diem'],
  avgIncome:    ['q_thu_nhap', 'avg_income', 'thu_nhap_binh_quan'],

  // Thời gian tìm việc
  thoiGianDuoi3Thang:    ['q_thoi_gian_duoi_3', 'job_search_under_3m'],
  thoiGian3Den6Thang:    ['q_thoi_gian_3_6',    'job_search_3_6m'],
  thoiGian6Den12Thang:   ['q_thoi_gian_6_12',   'job_search_6_12m'],
  thoiGian12ThangTroLen: ['q_thoi_gian_tren_12', 'job_search_over_12m'],

  // Kỹ năng
  knGiaoTiep:    ['q_kn_giao_tiep',    'skill_communication'],
  knThuyetTrinh: ['q_kn_thuyet_trinh', 'skill_presentation'],
  knLamViecNhom: ['q_kn_nhom',         'skill_teamwork'],
  knVietBaoCao:  ['q_kn_bao_cao',      'skill_report_writing'],
  knLanhDao:     ['q_kn_lanh_dao',     'skill_leadership'],
  knTiengAnh:    ['q_kn_tieng_anh',    'skill_english'],
  knTinHoc:      ['q_kn_tin_hoc',      'skill_it'],
  knHoiNhap:     ['q_kn_hoi_nhap',     'skill_global'],
  knKhac:        ['q_kn_khac',         'skill_other'],

  searchMethod:  ['q_hinh_thuc_tim_viec', 'job_search_method'],
  hiringMethod:  ['q_hinh_thuc_tuyen_dung', 'hiring_method'],
  postGradCourse:['q_khoa_hoc_sau_tn',   'post_grad_course'],
  giaiPhap:      ['q_giai_phap',         'suggestion'],
};

function getVal(answers: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    if (answers[k] !== undefined && answers[k] !== null && answers[k] !== '') {
      return answers[k];
    }
  }
  return null;
}

function getBool(answers: Record<string, any>, keys: string[]): boolean {
  const v = getVal(answers, keys);
  if (v === null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true' || v === '1' || v === 'yes' || v === 'co' || v === 'có';
  if (typeof v === 'number') return v === 1;
  return false;
}

function getNum(answers: Record<string, any>, keys: string[]): number {
  const v = getVal(answers, keys);
  if (v === null) return 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function getStr(answers: Record<string, any>, keys: string[]): string {
  const v = getVal(answers, keys);
  return v !== null ? String(v) : '';
}

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
  ) {}

  async buildReport(filters: any, userIndex: number) {
    const surveyId = filters?.surveyId ? Number(filters.surveyId) : null;
    const facultyId = filters?.facultyId ? Number(filters.facultyId) : null;
    const majorId = filters?.majorId ? Number(filters.majorId) : null;

    // ── Xác định scope dựa trên userIndex và filters ────────────────
    const scope: 'school' | 'faculty' | 'major' =
      majorId ? 'major' : facultyId ? 'faculty' : 'school';

    let facultyName: string | null = null;
    let majorName: string | null = null;

    if (facultyId) {
      const fac = await this.facultyRepo.findOne({ where: { id: facultyId } });
      facultyName = fac?.name ?? null;
    }
    if (majorId) {
      const maj = await this.majorRepo.findOne({ where: { id: majorId } });
      majorName = maj?.name ?? null;
    }

    // ── Lấy batch info ──────────────────────────────────────────────
    let batch: AlumniBatch | null = null;
    if (surveyId) {
      batch = await this.batchRepo.findOne({ where: { id: surveyId } });
    } else {
      // Lấy batch mới nhất không phải draft
      batch = await this.batchRepo.findOne({
        where: [{ status: 'ended' }, { status: 'active' }],
        order: { endDate: 'DESC', createdAt: 'DESC' },
      });
    }

    const batchId = batch?.id ?? null;
    const totalGraduates = batch?.totalStudents ?? 0;

    // ── Lấy tất cả responses đã submitted ──────────────────────────
    let responsesQuery = this.responseRepo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'submitted' });

    if (batchId) {
      responsesQuery = responsesQuery.andWhere('r.batch_id = :batchId', { batchId });
    }

    const allResponses = await responsesQuery.getMany();

    // ── Build responseRows (Mẫu 3) ─────────────────────────────────
    const responseRows = allResponses.map((r, i) => {
      const a = r.answers ?? {};
      return {
        key: String(r.id),
        studentCode: r.studentId,
        fullName: r.studentName ?? '',
        dob: '',
        gender: 'male' as const,
        cccd: '',
        majorCode: '',

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

    // ── Tính stats tổng hợp ─────────────────────────────────────────
    const submitted = allResponses.length;
    const employed = responseRows.filter((r) => r.dungNganh || r.lienQuan).length;
    const relevant = responseRows.filter((r) => r.dungNganh || r.lienQuan).length;
    const salaries = responseRows.map((r) => r.salary).filter((s) => s > 0);
    const avgSalary =
      salaries.length > 0
        ? (salaries.reduce((a, b) => a + b, 0) / salaries.length).toFixed(1)
        : '0';

    const submissionRate =
      totalGraduates > 0 ? Math.round((submitted / totalGraduates) * 100) : 0;
    const employmentRate =
      submitted > 0 ? Math.round((employed / submitted) * 100) : 0;
    const relevantJobRate =
      submitted > 0 ? Math.round((relevant / submitted) * 100) : 0;

    // ── Build majorRows (Mẫu 1) ────────────────────────────────────
    // Nhóm responses theo majorCode (nếu có), hoặc 1 nhóm chung
    const majorMap: Record<string, typeof responseRows> = {};
    for (const r of responseRows) {
      const key = r.majorCode || 'CHUNG';
      if (!majorMap[key]) majorMap[key] = [];
      majorMap[key].push(r);
    }

    const majorRows = Object.entries(majorMap).map(([code, rows], i) => {
      const app = rows.filter((r) => r.dungNganh || r.lienQuan).length;
      return {
        key: code,
        majorCode: code === 'CHUNG' ? '' : code,
        majorName: code === 'CHUNG' ? 'Tổng hợp' : code,
        total: totalGraduates,
        totalNu: 0,
        submitted: rows.length,
        submittedNu: 0,
        coViecLam: app,
        tiepTucHoc: rows.filter((r) => r.tiepTucHoc).length,
        chuaCoViecLam: rows.filter((r) => r.chuaCoVl).length,
        approved: app,
        kvNhaNuoc: rows.filter((r) => r.kvNhaNuoc).length,
        kvTuNhan: rows.filter((r) => r.kvTuNhan).length,
        kvTuTao: rows.filter((r) => r.kvTuTao).length,
        kvYNuocNgoai: rows.filter((r) => r.kvYNuocNgoai).length,
        workLocation: '',
      };
    });

    // ── Build graduateRows (Mẫu 2) ─────────────────────────────────
    const graduateRows = allResponses.map((r) => ({
      key: String(r.id),
      studentCode: r.studentId,
      fullName: r.studentName ?? '',
      gender: 'male' as const,
      certification: '',
      cccd: '',
      majorCode: '',
      decision: '',
      certDate: '',
      phone: r.studentPhone ?? '',
      email: r.studentEmail ?? '',
      surveyMethod: 'Online',
      status: 'submitted' as const,
      note: '',
      majorName: '',
      cohort: batch?.graduationPeriod ?? '',
    }));

    // ── Faculty rows (tiến độ nộp báo cáo) ────────────────────────
    const faculties = await this.facultyRepo.find({ where: { status: 1 } });
    const facultyRows = faculties.map((f) => ({
      key: String(f.id),
      facultyCode: f.abbr ?? String(f.id),
      facultyName: f.name,
      status: 'draft' as const,
      submittedBy: null,
      submittedAt: null,
      deadline: batch?.endDate ?? null,
      feedback: null,
    }));

    // ── Report meta ────────────────────────────────────────────────
    const batchTitle = batch?.title ?? '';
    const batchYear = batch?.year ?? new Date().getFullYear();
    const reportMeta = {
      mau01Title: `THỐNG KÊ TÌNH HÌNH VIỆC LÀM CỦA SINH VIÊN TỐT NGHIỆP - ${batchTitle}`.trim(),
      mau02Title: `DANH SÁCH SINH VIÊN TỐT NGHIỆP - ${batchTitle}`.trim(),
      mau03Title: `KẾT QUẢ KHẢO SÁT SINH VIÊN TỐT NGHIỆP - ${batchTitle}`.trim(),
      mau01Note: `Số liệu tổng hợp theo ngành đào tạo, năm ${batchYear}`,
      mau02Note: `Danh sách sinh viên đã tốt nghiệp trong đợt khảo sát ${batchTitle}`,
      mau03Note: `Chi tiết câu trả lời từ sinh viên đã phản hồi khảo sát ${batchTitle}`,
    };

    return {
      currentUser: {
        id: String(userIndex),
        name: 'Admin',
        scope,
        facultyName,
        majorName,
      },
      stats: {
        totalGraduates,
        submitted,
        submissionRate,
        employed,
        employmentRate,
        relevantJobRate,
        avgSalary: `${avgSalary} triệu`,
      },
      majorRows,
      graduateRows,
      responseRows,
      facultyRows,
      reportMeta,
    };
  }

  // Danh sách đợt khảo sát cho dropdown
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