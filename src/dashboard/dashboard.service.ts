import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';
import { SurveyQuestion } from 'src/database/entities/survey-question.entity';
import { SurveyAnswer } from 'src/database/entities/survey-answer.entity';
import { SurveyResponse } from 'src/database/entities/survey-response.entity';

interface ChartQuery {
  khoa?: string;
  nganh?: string;
  mode?: string;
  /** questionKey của câu hỏi muốn thống kê, vd: 'employment_status' */
  questionKey?: string;
  /** surveyId để giới hạn theo đợt khảo sát cụ thể */
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
    @InjectRepository(SurveyQuestion)
    private readonly questionRepository: Repository<SurveyQuestion>,
    @InjectRepository(SurveyAnswer)
    private readonly answerRepository: Repository<SurveyAnswer>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepository: Repository<SurveyResponse>,
    private readonly dataSource: DataSource,
  ) {}

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  async getSummary() {
    const totalStudents = await this.studentRepository.count();
    const totalResponses = await this.responseRepository.count({
      where: { status: 'submitted' },
    });

    const responseRate =
      totalStudents > 0
        ? Math.round((totalResponses / totalStudents) * 100)
        : 0;

    return {
      latestDot: 'Đợt mới nhất',
      responseRate: {
        value: responseRate,
        total: totalStudents,
        trend: '',
      },
      employedRateOnResponses: { value: 0, trend: '' },
      employedRateOnGraduates: { value: 0, trend: '' },
      relevantJobRate: { value: 0, trend: '' },
    };
  }

  // ---------------------------------------------------------------------------
  // Widgets
  // ---------------------------------------------------------------------------
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
            { id: 'log1', action: 'Admin updated student record', user: 'Admin', timestamp: new Date().toISOString() },
            { id: 'log2', action: 'New enterprise registered', user: 'System', timestamp: new Date().toISOString() },
            { id: 'log3', action: 'Report generated: Employment Stats', user: 'Admin', timestamp: new Date().toISOString() },
          ],
        },
      },
    ];
  }

  // ---------------------------------------------------------------------------
  // Chart data — query REAL data từ survey_answers
  // ---------------------------------------------------------------------------
  async getChartData(query: ChartQuery) {
    const mode = (query.mode || 'coviec').toLowerCase();
    const khoa = query.khoa || 'all';
    const nganh = query.nganh || 'all';

    // Map mode → questionKey tương ứng trong DB
    const modeToKey: Record<string, string> = {
      coviec: 'employment_status',
      tinhhinh: 'job_relevance',
      khuvuc: 'employment_sector',
    };

    const questionKey = query.questionKey || modeToKey[mode] || mode;

    // 1. Tìm câu hỏi theo questionKey (lấy options để biết nhãn)
    const question = await this.questionRepository.findOne({
      where: { questionKey },
      ...(query.surveyId ? { where: { questionKey, surveyId: query.surveyId } as any } : {}),
    });

    // 2. Lấy danh sách responseId phù hợp filter khoa/nganh
    const responseIds = await this.getFilteredResponseIds(khoa, nganh, query.surveyId);

    if (responseIds.length === 0) {
      // Không có response nào → trả về options với value=0
      const opts = question?.options ?? [];
      return opts.map((o) => ({ label: o.label, value: 0 }));
    }

    // 3. Query tất cả answers của câu hỏi này trong tập responses đã lọc
    const answers = await this.answerRepository
      .createQueryBuilder('a')
      .where('a.question_id = :qid', { qid: question?.id })
      .andWhere('a.response_id IN (:...ids)', { ids: responseIds })
      .getMany();

    // 4. Đếm từng option
    const countMap: Record<string, number> = {};
    for (const ans of answers) {
      const raw = ans.answer;
      const values: string[] = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
      for (const v of values) {
        countMap[v] = (countMap[v] ?? 0) + 1;
      }
    }

    // 5. Ghép với options từ question để trả về đủ nhãn (kể cả option = 0 trả lời)
    if (question?.options && question.options.length > 0) {
      return question.options.map((opt) => ({
        label: opt.label,
        value: countMap[opt.id] ?? countMap[opt.label] ?? 0,
      }));
    }

    // Fallback: không có options → trả về từ countMap
    return Object.entries(countMap).map(([label, value]) => ({ label, value }));
  }

  // ---------------------------------------------------------------------------
  // Helper: lấy danh sách responseId (submitted) có filter khoa/nganh
  // ---------------------------------------------------------------------------
  private async getFilteredResponseIds(
    khoa: string,
    nganh: string,
    surveyId?: number,
  ): Promise<number[]> {
    const qb = this.responseRepository
      .createQueryBuilder('r')
      .select('r.id', 'id')
      .where('r.status = :status', { status: 'submitted' });

    if (surveyId) {
      qb.andWhere('r.survey_id = :surveyId', { surveyId });
    }

    // Join student để filter theo khoa/nganh
    if (khoa !== 'all' || nganh !== 'all') {
      qb.innerJoin('students', 's', 's.id = r.student_id');

      if (khoa !== 'all') {
        qb.innerJoin(
          'faculties',
          'f',
          's.faculty_id = f.id AND (f.abbr = :khoa OR f.slug = :khoa OR f.name = :khoa)',
          { khoa },
        );
      }

      if (nganh !== 'all') {
        qb.innerJoin(
          'majors',
          'm',
          's.major_id = m.id AND (m.code = :nganh OR m.slug = :nganh OR m.name = :nganh)',
          { nganh },
        );
      }
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => Number(r.id));
  }
}
