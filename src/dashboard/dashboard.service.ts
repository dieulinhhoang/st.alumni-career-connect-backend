import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';

interface ChartQuery {
  khoa?: string;
  nganh?: string;
  mode?: string;
}

interface FacultyReportStatusQuery {
  surveyId?: number;
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
    private readonly dataSource: DataSource,
  ) {}

  async getSummary() {
    const totalStudents = await this.studentRepository.count();

    return {
      latestDot: 'Đợt mới nhất',
      responseRate: {
        value: 0,
        total: totalStudents,
        trend: '',
      },
      employedRateOnResponses: {
        value: 0,
        trend: '',
      },
      employedRateOnGraduates: {
        value: 0,
        trend: '',
      },
      relevantJobRate: {
        value: 0,
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
      .leftJoin('student.faculty', 'faculty')
      .leftJoin('student.major', 'major');

    if (khoa !== 'all') {
      qb.andWhere('(faculty.abbr = :khoa OR faculty.slug = :khoa OR faculty.name = :khoa)', { khoa });
    }

    if (nganh !== 'all') {
      qb.andWhere('(major.code = :nganh OR major.slug = :nganh OR major.name = :nganh)', { nganh });
    }

    return qb.getCount();
  }

  // ─── Faculty Report Status ────────────────────────────────────────────────

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
      .getRawOne();

    return result ? Number(result.surveyId) : null;
  }

  async getFacultyReportStatus(query: FacultyReportStatusQuery) {
    let { surveyId } = query;

    if (!surveyId) {
      surveyId = await this.getLatestSubmittedSurveyId();
    }

    // Tổng sinh viên theo khoa (từ major)
    const totalPerFaculty: { facultyId: number; total: string }[] =
      await this.majorRepository
        .createQueryBuilder('major')
        .select('major.faculty_id', 'facultyId')
        .addSelect('COUNT(DISTINCT student.id)', 'total')
        .leftJoin('major.students', 'student', 'student.deleted_at IS NULL')
        .groupBy('major.faculty_id')
        .getRawMany();

    // Số SV đã phản hồi theo khoa
    let respondedQb = this.dataSource
      .createQueryBuilder()
      .select('major.faculty_id', 'facultyId')
      .addSelect('COUNT(DISTINCT sr.student_id)', 'responded')
      .from('survey_responses', 'sr')
      .innerJoin('students', 'student', 'student.id = sr.student_id AND student.deleted_at IS NULL')
      .innerJoin('majors', 'major', 'major.id = student.training_industry_id')
      .where('sr.status = :status', { status: 'submitted' });

    if (surveyId) {
      respondedQb = respondedQb.andWhere('sr.survey_id = :surveyId', { surveyId });
    }

    const respondedPerFaculty: { facultyId: number; responded: string }[] =
      await respondedQb.groupBy('major.faculty_id').getRawMany();

    // Map responded by facultyId
    const respondedMap = new Map<number, number>();
    for (const row of respondedPerFaculty) {
      respondedMap.set(Number(row.facultyId), Number(row.responded));
    }

    // Lấy danh sách khoa
    const faculties = await this.facultyRepository.find();

    const FACULTY_COLORS = [
      '#4f98a3', '#6daa45', '#da7101', '#a86fdf',
      '#006494', '#d19900', '#a12c7b', '#a13544',
    ];

    const totalMap = new Map<number, number>();
    for (const row of totalPerFaculty) {
      totalMap.set(Number(row.facultyId), Number(row.total));
    }

    return faculties.map((faculty, idx) => {
      const total = totalMap.get(faculty.id) ?? 0;
      const responded = respondedMap.get(faculty.id) ?? 0;
      const status = responded > 0 ? 'submitted' : 'not_submitted';

      return {
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultyCode: faculty.code ?? faculty.abbr ?? null,
        color: FACULTY_COLORS[idx % FACULTY_COLORS.length],
        responded,
        total,
        status,
        surveyId: surveyId ?? null,
      };
    });
  }
}
