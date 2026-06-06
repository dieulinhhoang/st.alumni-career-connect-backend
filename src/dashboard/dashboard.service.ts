import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';
import { SurveyBatch } from 'src/database/entities/survey-batch.entity';
import { SurveyQuestion } from 'src/database/entities/survey-question.entity';

interface ChartQuery {
  khoa?: string;
  nganh?: string;
  mode?: string;
}

interface FacultyReportStatusQuery {
  surveyId?: number;
}

interface StatChartQuery {
  khoa?: string;
  nganh?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Faculty)
    private readonly facultyRepository: Repository<Faculty>,
    @InjectRepository(Major)
    private readonly majorRepository: Repository<Major>,
    @InjectRepository(SurveyBatch)
    private readonly surveyBatchRepository: Repository<SurveyBatch>,
    @InjectRepository(SurveyQuestion)
    private readonly surveyQuestionRepository: Repository<SurveyQuestion>,
    private readonly dataSource: DataSource,
  ) {}

  async getSummary() {
    const totalStudents = await this.studentRepository.count();

    // Lấy đợt khảo sát mới nhất (survey_batch) có response đã submitted
    const latestBatchRow = await this.dataSource
      .createQueryBuilder()
      .select('sb.title', 'title')
      .from('survey_batches', 'sb')
      .innerJoin('surveys', 's', 's.survey_batch_id = sb.id')
      .innerJoin('survey_responses', 'sr', 'sr.survey_id = s.id')
      .where('sr.status = :status', { status: 'submitted' })
      .groupBy('sb.id')
      .orderBy('MAX(sr.submitted_at)', 'DESC')
      .limit(1)
      .getRawOne<{ title: string }>()
      .catch(() => null);

    // Fallback: lấy batch active mới nhất nếu chưa có response nào
    const fallbackBatch = latestBatchRow
      ? null
      : await this.surveyBatchRepository.findOne({
          where: { status: 'active' },
          order: { createdAt: 'DESC' },
        });

    const latestDot =
      latestBatchRow?.title ?? fallbackBatch?.title ?? 'Chưa có dữ liệu';

    // Đếm số lượng response đã submitted
    const totalResponsesRow = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(DISTINCT sr.student_id)', 'cnt')
      .from('survey_responses', 'sr')
      .where('sr.status = :status', { status: 'submitted' })
      .getRawOne<{ cnt: string }>()
      .catch(() => null);

    const totalResponses = Number(totalResponsesRow?.cnt ?? 0);
    const responseRateValue =
      totalStudents > 0 ? Math.round((totalResponses / totalStudents) * 100) : 0;

    // Câu hỏi có questionKey = 'q_employed' hoặc tương đương
    const employedRows = await this.dataSource.query(
      `
      SELECT
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(sa.answer, '$[0]')),
          JSON_UNQUOTE(sa.answer)
        ) AS answerVal,
        COUNT(DISTINCT sr.student_id) AS cnt
      FROM survey_answers sa
      INNER JOIN survey_questions sq ON sq.id = sa.question_id
        AND sq.question_key IN ('q_employed','employment_status','tinh_trang_viec_lam','q_employment_status')
      INNER JOIN survey_responses sr ON sr.id = sa.response_id
        AND sr.status = 'submitted'
      GROUP BY answerVal
      `,
    ).catch(() => []) as Array<{ answerVal: string; cnt: string }>;

    let employedCount = 0;
    let totalAnswered = 0;
    for (const row of employedRows) {
      const cnt = Number(row.cnt);
      totalAnswered += cnt;
      const val = (row.answerVal ?? '').toLowerCase();
      // "yes" = có việc, "no" = chưa, "studying" = học tiếp (cũng tính là không có việc)
      if (val === 'yes' || val === 'có' || val === 'co') {
        employedCount += cnt;
      }
    }

    const employedRateOnResponses =
      totalAnswered > 0 ? Math.round((employedCount / totalAnswered) * 100) : 0;
    const employedRateOnGraduates =
      totalStudents > 0 ? Math.round((employedCount / totalStudents) * 100) : 0;

    // Tỉ lệ việc làm phù hợp: đúng ngành + liên quan + học tiếp
    const relevantRows = await this.dataSource.query(
      `
      SELECT
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(sa.answer, '$[0]')),
          JSON_UNQUOTE(sa.answer)
        ) AS answerVal,
        COUNT(DISTINCT sr.student_id) AS cnt
      FROM survey_answers sa
      INNER JOIN survey_questions sq ON sq.id = sa.question_id
        AND sq.question_key IN ('q_job_match','trained_field','phu_hop_nganh','q_trained_field')
      INNER JOIN survey_responses sr ON sr.id = sa.response_id
        AND sr.status = 'submitted'
      GROUP BY answerVal
      `,
    ).catch(() => []) as Array<{ answerVal: string; cnt: string }>;

    let relevantCount = 0;
    let totalRelevantAnswered = 0;
    for (const row of relevantRows) {
      const cnt = Number(row.cnt);
      totalRelevantAnswered += cnt;
      const val = (row.answerVal ?? '').toLowerCase();
      // seed dùng id: 'yes'=đúng ngành, 'related'=liên quan
      if (
        val === 'yes' || val === 'related' ||
        val.includes('đúng') || val.includes('dung') ||
        val.includes('liên quan') || val.includes('lien quan')
      ) {
        relevantCount += cnt;
      }
    }

    const relevantJobRate =
      totalRelevantAnswered > 0
        ? Math.round((relevantCount / totalRelevantAnswered) * 100)
        : 0;

    return {
      latestDot,
      responseRate: {
        value: responseRateValue,
        total: totalStudents,
        trend: '',
      },
      employedRateOnResponses: {
        value: employedRateOnResponses,
        trend: '',
      },
      employedRateOnGraduates: {
        value: employedRateOnGraduates,
        trend: '',
      },
      relevantJobRate: {
        value: relevantJobRate,
        trend: '',
      },
    };
  }

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
      {
        id: 'activity-log',
        title: 'Hoạt động gần đây',
        type: 'list',
        data: {
          activityLog: [
            {
              id: 'log1',
              action: 'Admin updated student record',
              user: 'Admin',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'log2',
              action: 'New enterprise registered',
              user: 'System',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'log3',
              action: 'Report generated: Employment Stats',
              user: 'Admin',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      },
    ];
  }

  async getChartData(query: ChartQuery) {
    const mode = (query.mode || 'coviec').toLowerCase();
    const khoa = query.khoa || 'all';
    const nganh = query.nganh || 'all';

    if (mode === 'khuvuc') {
      return [
        { label: 'Tư nhân', value: await this.countStudents(khoa, nganh) },
        { label: 'Nhà nước', value: 0 },
        { label: 'Tự tạo việc', value: 0 },
        { label: 'Nước ngoài', value: 0 },
      ];
    }

    if (mode === 'tinhhinh') {
      const total = await this.countStudents(khoa, nganh);
      return [
        { label: 'Đúng ngành', value: total },
        { label: 'Liên quan', value: 0 },
        { label: 'Trái ngành', value: 0 },
        { label: 'Tiếp tục học', value: 0 },
        { label: 'Chưa có việc', value: 0 },
      ];
    }

    const total = await this.countStudents(khoa, nganh);
    return [
      { label: 'Có việc làm', value: total },
      { label: 'Chưa có việc', value: 0 },
    ];
  }

  private async countStudents(khoa: string, nganh: string): Promise<number> {
    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoin(Major, 'major', 'major.id = student.training_industry_id')
      .leftJoin(Faculty, 'faculty', 'faculty.id = major.faculty_id')
      .where('student.deleted_at IS NULL');

    if (khoa !== 'all') {
      qb.andWhere(
        '(faculty.abbr = :khoa OR faculty.slug = :khoa OR faculty.name = :khoa)',
        { khoa },
      );
    }

    if (nganh !== 'all') {
      qb.andWhere(
        '(major.code = :nganh OR major.slug = :nganh OR major.name = :nganh)',
        { nganh },
      );
    }

    return qb.getCount();
  }

  private async getLatestSubmittedSurveyId(): Promise<number | null> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('sr.survey_id', 'surveyId')
      .addSelect('MAX(sr.submitted_at)', 'latestSubmittedAt')
      .from('survey_responses', 'sr')
      .where('sr.status = :status', { status: 'submitted' })
      .groupBy('sr.survey_id')
      .orderBy('latestSubmittedAt', 'DESC')
      .limit(1)
      .getRawOne<{ surveyId: string }>();

    return result ? Number(result.surveyId) : null;
  }

  async getFacultyReportStatus(query: FacultyReportStatusQuery) {
    let { surveyId } = query;

    if (!surveyId || surveyId <= 0) {
      const latestSurveyId = await this.getLatestSubmittedSurveyId();
      surveyId = latestSurveyId ?? undefined;
    }

    const totalPerFaculty = await this.majorRepository
      .createQueryBuilder('major')
      .select('major.faculty_id', 'facultyId')
      .addSelect('COUNT(DISTINCT student.id)', 'total')
      .leftJoin('major.students', 'student', 'student.deleted_at IS NULL')
      .groupBy('major.faculty_id')
      .getRawMany<{ facultyId: string; total: string }>();

    let respondedQb = this.dataSource
      .createQueryBuilder()
      .select('major.faculty_id', 'facultyId')
      .addSelect('COUNT(DISTINCT sr.student_id)', 'responded')
      .from('survey_responses', 'sr')
      .innerJoin(Student, 'student', 'student.id = sr.student_id AND student.deleted_at IS NULL')
      .innerJoin(Major, 'major', 'major.id = student.training_industry_id')
      .where('sr.status = :status', { status: 'submitted' });

    if (surveyId !== undefined && surveyId > 0) {
      respondedQb = respondedQb.andWhere('sr.survey_id = :surveyId', { surveyId });
    }

    const respondedPerFaculty = await respondedQb
      .groupBy('major.faculty_id')
      .getRawMany<{ facultyId: string; responded: string }>();

    const respondedMap = new Map<number, number>();
    for (const row of respondedPerFaculty) {
      respondedMap.set(Number(row.facultyId), Number(row.responded));
    }

    const totalMap = new Map<number, number>();
    for (const row of totalPerFaculty) {
      totalMap.set(Number(row.facultyId), Number(row.total));
    }

    const faculties = await this.facultyRepository.find({
      order: { id: 'ASC' },
    });

    const FACULTY_COLORS = [
      '#4f98a3',
      '#6daa45',
      '#da7101',
      '#a86fdf',
      '#006494',
      '#d19900',
      '#a12c7b',
      '#a13544',
    ];

    return faculties.map((faculty, idx) => {
      const total = totalMap.get(faculty.id) ?? 0;
      const responded = respondedMap.get(faculty.id) ?? 0;
      const status = responded > 0 ? 'submitted' : 'not_submitted';

      return {
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultyCode: faculty.abbr ?? null,
        color: FACULTY_COLORS[idx % FACULTY_COLORS.length],
        responded,
        total,
        status,
        surveyId: surveyId ?? null,
      };
    });
  }

  /**
   * Trả về danh sách câu hỏi có show_in_chart = 1, dùng để render chart section trên dashboard.
   *
   * Format trả về khớp với StatisticalQuestion interface ở frontend:
   *   { questionId, label, title, questionType, chartType, options? }
   *
   * questionId = string(q.id) — dùng làm key trong API call chart
   * label      = text ngắn để hiển thị trong select filter (questionKey hoặc questionText cắt ngắn)
   * title      = questionText đầy đủ
   * questionType map từ DB enum → frontend type:
   *   radio/select → "single_choice"
   *   checkbox    → "multiple_choice"
   *   rating      → "rating"
   *   number      → "number_range"
   *   else        → "single_choice" (fallback)
   */
  async getStatisticalQuestions() {
    const questions = await this.surveyQuestionRepository.find({
      where: { showInChart: 1 },
      order: { orderIndex: 'ASC' },
    });

    const mapQuestionType = (
      dbType: string,
    ): 'single_choice' | 'multiple_choice' | 'rating' | 'number_range' => {
      if (dbType === 'checkbox') return 'multiple_choice';
      if (dbType === 'rating') return 'rating';
      if (dbType === 'number') return 'number_range';
      return 'single_choice'; // radio, select, text, …
    };

    return questions.map((q) => ({
      questionId: String(q.id),
      label: q.questionText.slice(0, 60),
      title: q.questionText,
      questionType: mapQuestionType(q.questionType),
      chartType: q.chartType ?? 'pie',
      options: Array.isArray(q.options)
        ? q.options.map((o) => (typeof o === 'string' ? o : o.label))
        : [],
    }));
  }

  /**
   * Trả về dữ liệu chart cho 1 câu hỏi.
   *
   * Format trả về khớp với ChartResult interface ở frontend:
   *   {
   *     questionId: string,
   *     title: string,
   *     chartType: 'pie' | 'column',
   *     totalResponses?: number,
   *     data: { name, value }[],         ← pieData đợt mới nhất
   *     dotData?: Record<string, { name, value }[]>  ← tất cả các đợt
   *   }
   *
   * NOTE: questionId có thể là numeric string (id) hoặc questionKey string.
   * Tự động resolve: thử parse số trước, nếu NaN thì tìm theo questionKey.
   */
  async getStatisticalQuestionChart(
    questionIdOrKey: string,
    filter: StatChartQuery = {},
  ) {
    const { khoa, nganh } = filter;

    // Resolve question entity: thử numeric id trước, fallback sang questionKey
    const numericId = Number(questionIdOrKey);
    let question: SurveyQuestion | null = null;
    let resolvedId: number = 0;

    if (!isNaN(numericId) && numericId > 0) {
      question = await this.surveyQuestionRepository.findOne({
        where: { id: numericId },
      });
      resolvedId = numericId;
    }

    // Fallback: tìm theo questionKey nếu không tìm được theo id
    if (!question) {
      question = await this.surveyQuestionRepository.findOne({
        where: { questionKey: questionIdOrKey } as any,
      });
      if (!question) {
        return {
          questionId: questionIdOrKey,
          title: '',
          chartType: 'pie',
          totalResponses: 0,
          data: [],
          dotData: {},
        };
      }
      resolvedId = question.id;
    }

    // Build điều kiện lọc khoa/ngành nếu có
    const facultyCondition =
      khoa && khoa !== 'all'
        ? `AND (faculty.abbr = '${khoa}' OR faculty.slug = '${khoa}' OR faculty.name = '${khoa}')`
        : '';

    const majorCondition =
      nganh && nganh !== 'all'
        ? `AND (major.code = '${nganh}' OR major.slug = '${nganh}' OR major.name = '${nganh}')`
        : '';

    // Query: group theo đợt (survey_batch) và theo giá trị answer
    // COALESCE: xử lý cả answer dạng JSON array ["yes"] lẫn plain string "yes"
    const rows = await this.dataSource.query(
      `
      SELECT
        sb.title AS dotName,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(sa.answer, '$[0]')),
          JSON_UNQUOTE(sa.answer)
        ) AS answerVal,
        COUNT(DISTINCT sr.student_id) AS cnt
      FROM survey_answers sa
      INNER JOIN survey_responses sr ON sr.id = sa.response_id
        AND sr.status = 'submitted'
      INNER JOIN surveys sv ON sv.id = sr.survey_id
      INNER JOIN survey_batches sb ON sb.id = sv.survey_batch_id
      INNER JOIN students s ON s.id = sr.student_id AND s.deleted_at IS NULL
      LEFT JOIN majors major ON major.id = s.training_industry_id
      LEFT JOIN faculties faculty ON faculty.id = major.faculty_id
      WHERE sa.question_id = ?
        ${facultyCondition}
        ${majorCondition}
      GROUP BY sb.id, sb.title, answerVal
      ORDER BY sb.id ASC
      `,
      [resolvedId],
    ) as Array<{ dotName: string; answerVal: string; cnt: string }>;

    if (!rows.length) {
      return {
        questionId: questionIdOrKey,
        title: question?.questionText ?? '',
        chartType: question?.chartType ?? 'pie',
        totalResponses: 0,
        data: [],
        dotData: {},
      };
    }

    // Build map optionId → label từ question.options để hiển thị tên đẹp
    const optionLabelMap = new Map<string, string>();
    if (Array.isArray(question.options)) {
      for (const o of question.options as any[]) {
        if (o && o.id != null && o.label) {
          optionLabelMap.set(String(o.id), o.label);
        }
      }
    }

    const resolveLabel = (raw: string) =>
      optionLabelMap.get(raw) ?? raw ?? 'Không xác định';

    // Gom theo đợt
    const dotMap = new Map<string, Map<string, number>>();
    let totalResponses = 0;

    for (const row of rows) {
      if (!dotMap.has(row.dotName)) dotMap.set(row.dotName, new Map());
      const ansMap = dotMap.get(row.dotName)!;
      const val = resolveLabel(row.answerVal);
      const cnt = Number(row.cnt);
      ansMap.set(val, (ansMap.get(val) ?? 0) + cnt);
      totalResponses += cnt;
    }

    const dotKeys = Array.from(dotMap.keys());
    const latestKey = dotKeys[dotKeys.length - 1]; // đợt cuối = mới nhất

    // data (= pieData) từ đợt mới nhất
    const latestAnswerMap = dotMap.get(latestKey)!;
    const data = Array.from(latestAnswerMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // dotData cho tất cả các đợt
    const dotData: Record<string, { name: string; value: number }[]> = {};
    for (const [dot, ansMap] of dotMap.entries()) {
      dotData[dot] = Array.from(ansMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    }

    return {
      questionId: questionIdOrKey,
      title: question?.questionText ?? '',
      chartType: question?.chartType ?? 'pie',
      totalResponses,
      data,
      dotData,
    };
  }

}