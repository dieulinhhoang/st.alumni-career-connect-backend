import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from 'src/database/entities/alumni-batch-response.entity';
import { FacultyReportSubmission } from 'src/database/entities/faculty-report-submission.entity';
import { AuthUser, ReportsService, buildFieldMap, getBool } from 'src/reports/reports.service';

// 
// Internal helpers
// 

interface SnapshotQuestion {
  id: string | number;
  questionKey: string;
  questionText: string;
  questionType: string;
  showInChart?: number | boolean;
  chartType?: 'pie' | 'column' | null;
  options?: { id: string; label: string }[] | null;
}

interface StatChartQuery {
  khoa?: string;
  nganh?: string;
}

interface DotEntry {
  coViec: number;
  chuaCoViec: number;
  dungNganh: number;
  lienQuan: number;
  traiNganh: number;
  tiepTucHoc: number;
  tuNhan: number;
  nhaNuoc: number;
  tuTaoViec: number;
  nuocNgoai: number;
}

// 

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Faculty)
    private readonly facultyRepo: Repository<Faculty>,
    @InjectRepository(Major)
    private readonly majorRepo: Repository<Major>,
    @InjectRepository(AlumniBatch)
    private readonly batchRepo: Repository<AlumniBatch>,
    @InjectRepository(AlumniBatchResponse)
    private readonly responseRepo: Repository<AlumniBatchResponse>,
    @InjectRepository(FacultyReportSubmission)
    private readonly reportSubmissionRepo: Repository<FacultyReportSubmission>,
    private readonly dataSource: DataSource,
    private readonly reportsService: ReportsService,
  ) {}

  // PRIVATE HELPERS

  /** Trích xuất mảng questions từ formSnapshot của batch, normalize về shape chuẩn */
  private _extractQuestions(batch: AlumniBatch): SnapshotQuestion[] {
    const snap = batch.formSnapshot;
    if (!snap) return [];

    /**
     * Frontend Question dùng: id, title, type, showInChart (boolean), chartType, options[]
     * Backend SurveyQuestion dùng: questionKey, questionText, questionType, showInChart (0/1)
     * → normalize cả hai về SnapshotQuestion
     */
    const normalize = (q: any): SnapshotQuestion => ({
      id:           q.id          ?? q.questionKey ?? '',
      questionKey:  q.questionKey ?? q.id          ?? q.name ?? '',
      questionText: q.questionText ?? q.title      ?? q.text ?? '',
      questionType: q.questionType ?? q.type       ?? 'text',
      showInChart:  q.showInChart,
      chartType:    q.chartType ?? null,
      options: Array.isArray(q.options)
        ? q.options.map((o: any) =>
            typeof o === 'string'
              ? { id: o, label: o }
              : { id: String(o.id ?? o.value ?? ''), label: String(o.label ?? o.text ?? o.value ?? o) }
          )
        : Array.isArray(q.choices)
          ? (q.choices as any[]).map((c: any) => ({
              id: String(c.value ?? c),
              label: String(c.text ?? c.value ?? c),
            }))
          : null,
    });

    // Custom format từ frontend: { questions: [...] }
    if (Array.isArray(snap['questions'])) {
      return (snap['questions'] as any[]).map(normalize);
    }

    // Direct array
    if (Array.isArray(snap)) {
      return (snap as any[]).map(normalize);
    }

    // SurveyJS format: { pages: [{ elements: [...] }] }
    if (Array.isArray(snap['pages'])) {
      return (snap['pages'] as any[]).flatMap((page: any) =>
        (page['elements'] ?? []).map(normalize),
      );
    }

    return [];
  }

  /** Lấy batch mới nhất có ít nhất 1 response submitted */
  private async _getLatestActiveBatch(): Promise<AlumniBatch | null> {
    // Ưu tiên: batch có response submitted nhiều nhất / mới nhất
    /**Khởi tạo một QueryBuilder trên repository responseRepo (đại diện cho bảng chứa dữ liệu phản hồi/câu trả lời) và đặt bí danh (alias) 
     * cho bảng này là 'r'. await được dùng vì đây là một thao tác bất đồng bộ (async). */
    // const row = await this.responseRepo
    //   .createQueryBuilder('r')
    //   .select('r.batchId', 'batchId')
    //   .addSelect('MAX(r.submittedAt)', 'latest')
    //   .where('r.status = :s', { s: 'submitted' })
    //   .groupBy('r.batchId')
    //   .orderBy('latest', 'DESC')
    //   .limit(1)
    //   .getRawOne<{ batchId: string }>();

    // if (row) {
    //   return this.batchRepo.findOne({ where: { id: Number(row.batchId) } });
    // }

    // Fallback: batch active mới nhất
    // fix : 
    return this.batchRepo.findOne({
      where: { status: 'active', deletedAt: IsNull() },
      order: { endDate: 'DESC' },
    });
  }

  /** Đọc toàn bộ responses submitted của 1 batch */
  private async _getSubmittedResponses(batchId: number): Promise<AlumniBatchResponse[]> {
    return this.responseRepo.find({
      where: { batchId, status: 'submitted' },
      select: ['id', 'answers'],
    });
  }

  /**
   * Đọc responses submitted của TẤT CẢ batches.
   * Trả về mảng { batchId, batchTitle, answers }.
   */
  private async _getAllSubmittedWithBatch(): Promise<
    { batchId: number; batchTitle: string; studentId: string; answers: Record<string, any> }[]
  > {
    const batches = await this.batchRepo.find({
      order: { id: 'ASC' },
    });
    const batchMap = new Map(batches.map((b) => [b.id, b.title]));

    const responses = await this.responseRepo.find({
      where: { status: 'submitted' },
      select: ['id', 'batchId', 'studentId', 'answers'],
    });

    return responses.map((r) => ({
      batchId: r.batchId,
      batchTitle: batchMap.get(r.batchId) ?? String(r.batchId),
      studentId: r.studentId ?? '',
      answers: r.answers ?? {},
    }));
  }

  /**
   * Resolve label của 1 answer value từ optionLabelMap.
   * answers lưu opt.id hoặc opt.label — thử cả hai.
   */
  private _resolveLabel(raw: string, optMap: Map<string, string>): string {
    return optMap.get(raw) ?? raw ?? 'Không xác định';
  }

  // GET /dashboard/summary

  // async getSummary() {
  //   const latestBatch = await this._getLatestActiveBatch();
  //   const latestDot = latestBatch?.title ?? 'Chưa có dữ liệu';

  //   // Tổng SV của đợt tốt nghiệp gắn với batch hiện tại (không phải tổng toàn hệ thống)
  //   const totalStudents = latestBatch?.totalStudents ?? 0;

  //   // Tổng số response submitted (unique student_id trong batch mới nhất)
  //   let totalResponses = 0;
  //   if (latestBatch) {
  //     totalResponses = await this.responseRepo.count({
  //       where: { batchId: latestBatch.id, status: 'submitted' },
  //     });
  //   }

  //   const responseRateValue =
  //     totalStudents > 0 ? Math.round((totalResponses / totalStudents) * 100) : 0;

  //   // Lấy responses của batch mới nhất để tính employment
  //   let employedCount = 0;
  //   let totalAnswered = 0;
  //   let relevantCount = 0;
  //   let totalRelevantAnswered = 0;

  //   if (latestBatch) {
  //     const questions = this._extractQuestions(latestBatch);

  //     // Tìm questionKey cho "có việc làm" và "đúng ngành"
  //     const employedKey = questions.find((q) =>
  //       ['q_employed', 'employment_status', 'tinh_trang_viec_lam', 'q_employment_status'].includes(q.questionKey),
  //     )?.questionKey;

  //     const matchKey = questions.find((q) =>
  //       ['q_job_match', 'trained_field', 'phu_hop_nganh', 'q_trained_field', 'job_match'].includes(q.questionKey),
  //     )?.questionKey;

  //     // Options cho employed question
  //     const employedQ = questions.find((q) => q.questionKey === employedKey);
  //     const employedOptMap = new Map<string, string>();
  //     if (employedQ?.options) {
  //       for (const o of employedQ.options) {
  //         employedOptMap.set(o.id, o.label);
  //       }
  //     }

  //     const responses = await this._getSubmittedResponses(latestBatch.id);

  //     for (const r of responses) {
  //       if (!r.answers) continue;

  //       if (employedKey) {
  //         const raw = r.answers[employedKey];
  //         if (raw !== undefined && raw !== null && raw !== '') {
  //           totalAnswered++;
  //           const vals: string[] = Array.isArray(raw) ? raw.map(String) : [String(raw)];
  //           for (const v of vals) {
  //             const label = this._resolveLabel(v, employedOptMap).toLowerCase();
  //             if (label.includes('có') || label.includes('co') || v === 'yes') {
  //               employedCount++;
  //             }
  //           }
  //         }
  //       }

  //       if (matchKey) {
  //         const raw2 = r.answers[matchKey];
  //         if (raw2 !== undefined && raw2 !== null && raw2 !== '') {
  //           totalRelevantAnswered++;
  //           const vals2: string[] = Array.isArray(raw2) ? raw2.map(String) : [String(raw2)];
  //           for (const v of vals2) {
  //             const lower = v.toLowerCase();
  //             if (
  //               lower === 'yes' || lower === 'related' ||
  //               lower.includes('đúng') || lower.includes('dung') ||
  //               lower.includes('liên quan') || lower.includes('lien quan')
  //             ) {
  //               relevantCount++;
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }

  //   const employedRateOnResponses =
  //     totalAnswered > 0 ? Math.round((employedCount / totalAnswered) * 100) : 0;
  //   const employedRateOnGraduates =
  //     totalStudents > 0 ? Math.round((employedCount / totalStudents) * 100) : 0;
  //   const relevantJobRate =
  //     totalRelevantAnswered > 0 ? Math.round((relevantCount / totalRelevantAnswered) * 100) : 0;

  //   return {
  //     latestDot,
  //     responseRate: { value: responseRateValue, count: totalResponses, total: totalStudents, trend: '' },
  //     employedRateOnResponses: { value: employedRateOnResponses, trend: '' },
  //     employedRateOnGraduates: { value: employedRateOnGraduates, trend: '' },
  //     relevantJobRate: { value: relevantJobRate, trend: '' },
  //   };
  // }

  async getSummary(currentUser?: AuthUser) {
  const report = await this.reportsService.buildReport({}, currentUser);
  const { stats, reportMeta } = report;

  return {
    latestDot: reportMeta?.batchTitle || 'Chưa có dữ liệu',
    responseRate: {
      value: stats.submissionRate,
      count: stats.submitted,
      total: stats.totalGraduates,
      trend: '',
    },
    employedRateOnResponses: { value: stats.employmentRate, trend: '' },
    employedRateOnGraduates: {
      value: stats.totalGraduates > 0
        ? Math.round((stats.employed / stats.totalGraduates) * 100)
        : 0,
      trend: '',
    },
    relevantJobRate: { value: stats.relevantJobRate, trend: '' },
  };
}
  // GET /dashboard/widgets  (static, không đổi)

  getWidgets() {
    return [
      {
        id: 'quick-actions',
        title: 'Thao tác nhanh',
        type: 'list',
        data: {
          quickActions: [
            { id: 'qa1', label: 'Quản lý người dùng', icon: 'users', link: '/admin/users' },
            { id: 'qa2', label: 'Quản lý khoa', icon: 'building', link: '/admin/faculties' },
            { id: 'qa3', label: 'Doanh nghiệp', icon: 'briefcase', link: '/admin/enterprises' },
            { id: 'qa4', label: 'Báo cáo & Thống kê', icon: 'chart', link: '/reports' },
            { id: 'qa5', label: 'Hội trang', icon: 'globe', link: '/home' },
            { id: 'qa6', label: 'Cấu hình', icon: 'settings', link: '/settings' },
          ],
        },
      },
    ];
  }

  // GET /dashboard/chart-data  (legacy — giữ cho tương thích)

  async getChartData(query: { khoa?: string; nganh?: string; mode?: string }) {
    return [];
  }

  // GET /dashboard/employment-chart
  // Tổng hợp theo từng đợt khảo sát (batch), tái dùng logic getBool/buildFieldMap
  // của ReportsService để đảm bảo số liệu khớp với báo cáo.

  async getEmploymentChartData(
    filter: StatChartQuery = {},
  ): Promise<{ dotData: Record<string, DotEntry>; latestKey: string }> {
    const { khoa, nganh } = filter;
    const batches = await this.batchRepo.find({ order: { id: 'ASC' } });
    if (!batches.length) return { dotData: {}, latestKey: '' };

    // Batch load toàn bộ responses trong 1 query thay vì N queries
    const batchIds = batches.map((b) => b.id);
    const allResponses = await this.responseRepo.find({
      where: { batchId: In(batchIds), status: 'submitted' },
      select: ['batchId', 'studentId', 'answers'],
    });

    const responsesByBatch = new Map<number, typeof allResponses>();
    for (const r of allResponses) {
      const list = responsesByBatch.get(r.batchId) ?? [];
      list.push(r);
      responsesByBatch.set(r.batchId, list);
    }

    const dotData: Record<string, DotEntry> = {};

    for (const batch of batches) {
      const responses = responsesByBatch.get(batch.id) ?? [];
      if (!responses.length) continue;

      let rows = responses.map((r) => ({
        batchId: batch.id,
        batchTitle: batch.title,
        studentId: r.studentId,
        answers: r.answers ?? {},
      }));

      if ((khoa && khoa !== 'all') || (nganh && nganh !== 'all')) {
        rows = await this._filterResponsesByFaculty(rows, khoa, nganh);
      }
      if (!rows.length) continue;

      const fieldMap = buildFieldMap(batch);
      const entry: DotEntry = {
        coViec: 0, chuaCoViec: 0, dungNganh: 0, lienQuan: 0, traiNganh: 0,
        tiepTucHoc: 0, tuNhan: 0, nhaNuoc: 0, tuTaoViec: 0, nuocNgoai: 0,
      };

      for (const r of rows) {
        const a = r.answers;
        const dungNganh = getBool(a, fieldMap, 'dungNganh');
        const lienQuan = getBool(a, fieldMap, 'lienQuan');
        const traiNganh = getBool(a, fieldMap, 'khongLienQuan');

        if (dungNganh || lienQuan || traiNganh) entry.coViec++;
        if (dungNganh) entry.dungNganh++;
        if (lienQuan) entry.lienQuan++;
        if (traiNganh) entry.traiNganh++;
        if (getBool(a, fieldMap, 'tiepTucHoc')) entry.tiepTucHoc++;
        if (getBool(a, fieldMap, 'chuaCoVl')) entry.chuaCoViec++;
        if (getBool(a, fieldMap, 'kvTuNhan')) entry.tuNhan++;
        if (getBool(a, fieldMap, 'kvNhaNuoc')) entry.nhaNuoc++;
        if (getBool(a, fieldMap, 'kvTuTao')) entry.tuTaoViec++;
        if (getBool(a, fieldMap, 'kvYNuocNgoai')) entry.nuocNgoai++;
      }

      dotData[batch.title] = entry;
    }

    const keys = Object.keys(dotData);
    return { dotData, latestKey: keys[keys.length - 1] ?? '' };
  }

  // GET /dashboard/faculty-report-status

  async getFacultyReportStatus(query: { surveyId?: number }) {
    const latestBatch = await this._getLatestActiveBatch();

    // Tổng SV/khoa của đợt tốt nghiệp gắn với batch (không phải tổng toàn hệ thống)
    const totalMap = new Map<number, number>();
    if (latestBatch?.graduationId) {
      const rows = await this.dataSource.query(
        `
        SELECT m.faculty_id AS facultyId, COUNT(*) AS total
        FROM graduation_student gs
        INNER JOIN student s ON s.id = gs.student_id AND s.deleted_at IS NULL
        INNER JOIN major m ON m.id = s.training_industry_id
        WHERE gs.graduation_id = ?
        GROUP BY m.faculty_id
        `,
        [latestBatch.graduationId],
      ) as Array<{ facultyId: string; total: string }>;

      for (const row of rows) {
        totalMap.set(Number(row.facultyId), Number(row.total));
      }
    }

    // Count submitted responses per faculty via student.training_industry_id
    let respondedMap = new Map<number, number>();
    if (latestBatch) {
      const rows = await this.dataSource.query(
        `
        SELECT m.faculty_id AS facultyId, COUNT(DISTINCT r.student_id) AS responded
        FROM alumni_batch_responses r
        INNER JOIN student s ON s.code = r.student_id AND s.deleted_at IS NULL
        INNER JOIN major m ON m.id = s.training_industry_id
        WHERE r.status = 'submitted' AND r.batch_id = ?
        GROUP BY m.faculty_id
        `,
        [latestBatch.id],
      ) as Array<{ facultyId: string; responded: string }>;

      for (const row of rows) {
        respondedMap.set(Number(row.facultyId), Number(row.responded));
      }
    }

    // Trạng thái nộp báo cáo thực tế của từng khoa (faculty_report_submissions)
    const submissionMap = new Map<number, FacultyReportSubmission>();
    if (latestBatch) {
      const submissions = await this.reportSubmissionRepo.find({
        where: { batchId: latestBatch.id },
      });
      for (const s of submissions) {
        submissionMap.set(Number(s.facultyId), s);
      }
    }

    const faculties = await this.facultyRepo.find({ order: { id: 'ASC' } });

    const FACULTY_COLORS = [
      '#4f98a3', '#6daa45', '#da7101', '#a86fdf',
      '#006494', '#d19900', '#a12c7b', '#a13544',
    ];

    return faculties.map((faculty, idx) => {
      // faculty.id là bigint unsigned → driver trả về string, còn các map key bằng Number()
      const facultyId = Number(faculty.id);
      const total = totalMap.get(facultyId) ?? 0;
      const responded = respondedMap.get(facultyId) ?? 0;
      const submission = submissionMap.get(facultyId);
      const status = submission?.status ?? 'draft';
      return {
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultyCode: faculty.abbr ?? null,
        color: FACULTY_COLORS[idx % FACULTY_COLORS.length],
        responded,
        total,
        status,
        daNop: status === 'submitted' || status === 'approved',
        surveyId: latestBatch?.id ?? null,
      };
    });
  }

  // GET /dashboard/statistical-questions
  // Đọc từ batch mới nhất (formSnapshot), trả format StatisticalQuestion

  async getStatisticalQuestions() {
    // Lấy batch mới nhất trước
    const latestBatch = await this._getLatestActiveBatch();

    // Extract questions có showInChart từ batch mới nhất
    const fromLatest = latestBatch
      ? this._extractQuestions(latestBatch).filter(
          (q) => q.showInChart === true || Number(q.showInChart) === 1,
        )
      : [];

    // Nếu batch mới nhất đã có questions showInChart → dùng luôn
    if (fromLatest.length > 0) {
      return fromLatest.map((q) => this._mapToQuestionDto(q));
    }

    // Fallback: quét tất cả batches (batch nào cũng có thể có showInChart)
    const allBatches = await this.batchRepo.find({ order: { id: 'DESC' } });
    for (const batch of allBatches) {
      const qs = this._extractQuestions(batch).filter(
        (q) => q.showInChart === true || Number(q.showInChart) === 1,
      );
      if (qs.length > 0) {
        return qs.map((q) => this._mapToQuestionDto(q));
      }
    }

    return [];
  }

  private _mapToQuestionDto(q: SnapshotQuestion) {
    return {
      questionId: q.questionKey,
      label: (q.questionText ?? '').slice(0, 60),
      title: q.questionText ?? '',
      questionType: this._mapQuestionType(q.questionType),
      chartType: q.chartType ?? 'pie',
      options: Array.isArray(q.options)
        ? q.options.map((o) => (typeof o === 'string' ? o : o.label))
        : [],
    };
  }

  private _mapQuestionType(
    t: string,
  ): 'single_choice' | 'multiple_choice' | 'rating' | 'number_range' {
    if (t === 'checkbox') return 'multiple_choice';
    if (t === 'rating') return 'rating';
    if (t === 'number') return 'number_range';
    return 'single_choice';
  }

  // GET /dashboard/statistical-questions/:questionId/chart
  // questionId = questionKey string (e.g. "q_employed")

  async getStatisticalQuestionChart(
    questionKey: string,
    filter: StatChartQuery = {},
  ) {
    const { khoa, nganh } = filter;

    // Lấy tất cả batches + questions từ snapshot
    const batches = await this.batchRepo.find({ order: { id: 'ASC' } });
    if (!batches.length) return this._emptyChart(questionKey);

    // Tìm question definition từ batch đầu tiên có key này
    let questionDef: SnapshotQuestion | null = null;
    for (const b of batches) {
      const qs = this._extractQuestions(b);
      const found = qs.find((q) => q.questionKey === questionKey);
      if (found) { questionDef = found; break; }
    }

    // Build optionLabelMap từ question definition
    const optMap = new Map<string, string>();
    if (questionDef?.options) {
      for (const o of questionDef.options) {
        optMap.set(o.id, o.label);
        optMap.set(o.label, o.label); // cũng map label → label
      }
    }

    // Lấy tất cả responses submitted, nhóm theo batch
    const allResponses = await this._getAllSubmittedWithBatch();

    // Apply filter khoa/nganh nếu có (join Student theo studentId → major → faculty)
    // Đây là expensive — chỉ filter nếu thực sự yêu cầu
    let filteredResponses: typeof allResponses = allResponses;
    if ((khoa && khoa !== 'all') || (nganh && nganh !== 'all')) {
      filteredResponses = await this._filterResponsesByFaculty(allResponses, khoa, nganh);
    }

    // Gom count theo batch → answer
    const dotMap = new Map<string, Map<string, number>>();
    // Track batch ordering
    const batchOrder: string[] = [];

    for (const r of filteredResponses) {
      const raw = r.answers[questionKey];
      if (raw === undefined || raw === null || raw === '') continue;

      const title = r.batchTitle;
      if (!dotMap.has(title)) {
        dotMap.set(title, new Map());
        batchOrder.push(title);
      }
      const ansMap = dotMap.get(title)!;

      const vals: string[] = Array.isArray(raw) ? raw.map(String) : [String(raw)];
      for (const v of vals) {
        const label = this._resolveLabel(v, optMap);
        ansMap.set(label, (ansMap.get(label) ?? 0) + 1);
      }
    }

    if (!dotMap.size) return this._emptyChart(questionKey, questionDef);

    // Sắp xếp theo thứ tự batch (id ASC đã sort ở trên)
    // dotMap keys giữ insertion order — OK nếu allResponses được sort theo batchId

    const dotKeys = Array.from(dotMap.keys());
    const latestKey = dotKeys[dotKeys.length - 1];

    const latestAnswerMap = dotMap.get(latestKey)!;
    const data = Array.from(latestAnswerMap.entries()).map(([name, value]) => ({ name, value }));

    const dotData: Record<string, { name: string; value: number }[]> = {};
    for (const [dot, ansMap] of dotMap.entries()) {
      dotData[dot] = Array.from(ansMap.entries()).map(([name, value]) => ({ name, value }));
    }

    const totalResponses = Array.from(dotMap.values()).reduce(
      (sum, m) => sum + Array.from(m.values()).reduce((s, v) => s + v, 0),
      0,
    );

    return {
      questionId: questionKey,
      title: questionDef?.questionText ?? '',
      chartType: questionDef?.chartType ?? 'pie',
      totalResponses,
      data,
      dotData,
    };
  }

  private _emptyChart(questionKey: string, q?: SnapshotQuestion | null) {
    return {
      questionId: questionKey,
      title: q?.questionText ?? '',
      chartType: (q?.chartType ?? 'pie') as 'pie' | 'column',
      totalResponses: 0,
      data: [],
      dotData: {},
    };
  }

  /**
   * Filter responses theo khoa/nganh bằng cách join Student entity.
   * studentId trong AlumniBatchResponse là student_code (varchar).
   */
  private async _filterResponsesByFaculty(
    responses: { batchId: number; batchTitle: string; studentId: string; answers: Record<string, any> }[],
    khoa?: string,
    nganh?: string,
  ) {
    // Build tập studentId cần lấy dựa trên khoa/nganh
    const qb = this.studentRepo
      .createQueryBuilder('student')
      .select('student.code', 'code')
      .leftJoin(Major, 'major', 'major.id = student.training_industry_id')
      .leftJoin(Faculty, 'faculty', 'faculty.id = major.faculty_id')
      .where('student.deleted_at IS NULL');

    if (khoa && khoa !== 'all') {
      qb.andWhere(
        '(faculty.abbr = :khoa OR faculty.slug = :khoa OR faculty.name = :khoa)',
        { khoa },
      );
    }
    if (nganh && nganh !== 'all') {
      qb.andWhere(
        '(major.code = :nganh OR major.slug = :nganh OR major.name = :nganh)',
        { nganh },
      );
    }

    const rows = await qb.getRawMany<{ code: string }>();
    const allowedCodes = new Set(rows.map((r) => r.code));

    // AlumniBatchResponse.studentId = student_code
    if (!allowedCodes.size) return [];
    return responses.filter((r) => allowedCodes.has(r.studentId));
  }
}