import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from 'src/database/entities/user.entity';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Survey } from 'src/database/entities/survey.entity';
import { SurveyQuestion } from 'src/database/entities/survey-question.entity';
import { SurveyAnswer } from 'src/database/entities/survey-answer.entity';
import { SurveyResponse } from 'src/database/entities/survey-response.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';
import { Graduation } from 'src/database/entities/graduation.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Enterprise) private enterpriseRepo: Repository<Enterprise>,
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyQuestion) private questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(SurveyAnswer) private answerRepo: Repository<SurveyAnswer>,
    @InjectRepository(SurveyResponse) private responseRepo: Repository<SurveyResponse>,
    @InjectRepository(Faculty) private facultyRepo: Repository<Faculty>,
    @InjectRepository(Major) private majorRepo: Repository<Major>,
    @InjectRepository(Graduation) private graduationRepo: Repository<Graduation>,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────
  // GET /dashboard/widgets
  // ─────────────────────────────────────────────
  async getWidgets() {
    const [totalUsers, totalStudents, totalEnterprises, totalJobs, totalSurveys] = await Promise.all([
      this.userRepo.count(),
      this.studentRepo.count(),
      this.enterpriseRepo.count(),
      this.jobRepo.count(),
      this.surveyRepo.count(),
    ]);

    // Số sinh viên đã phản hồi khảo sát (response có status = submitted)
    const totalResponses = await this.responseRepo.count({ where: { status: 'submitted' } });

    return [
      {
        id: 'total_users',
        title: 'Tổng người dùng',
        type: 'stat',
        data: { value: totalUsers, icon: 'users' },
      },
      {
        id: 'total_students',
        title: 'Tổng sinh viên',
        type: 'stat',
        data: { value: totalStudents, icon: 'graduation-cap' },
      },
      {
        id: 'total_enterprises',
        title: 'Doanh nghiệp',
        type: 'stat',
        data: { value: totalEnterprises, icon: 'building' },
      },
      {
        id: 'total_jobs',
        title: 'Tin tuyển dụng',
        type: 'stat',
        data: { value: totalJobs, icon: 'briefcase' },
      },
      {
        id: 'total_surveys',
        title: 'Phiếu khảo sát',
        type: 'stat',
        data: { value: totalSurveys, icon: 'clipboard' },
      },
      {
        id: 'total_responses',
        title: 'Lượt phản hồi',
        type: 'stat',
        data: { value: totalResponses, icon: 'check-circle' },
      },
    ];
  }

  // ─────────────────────────────────────────────
  // GET /dashboard/chart-data
  // ─────────────────────────────────────────────
  async getChartData(khoa: string, nganh: string, mode: string) {
    // Lấy surveyId của survey mới nhất (active)
    const latestSurvey = await this.surveyRepo.findOne({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });

    if (!latestSurvey) {
      return { label: 'Chưa có dữ liệu', data: [] };
    }

    // Map mode -> question_key cần lấy
    const questionKeyMap: Record<string, string[]> = {
      coviec:   ['q_employment_status'],
      tinhhinh: ['q_trained_field'],
      khuvuc:   ['q_work_area'],
    };
    const targetKeys = questionKeyMap[mode] ?? questionKeyMap['coviec'];

    // Lấy question có question_key tương ứng trong survey này
    const questions = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.surveyId = :surveyId', { surveyId: latestSurvey.id })
      .andWhere('q.questionKey IN (:...keys)', { keys: targetKeys })
      .getMany();

    if (!questions.length) {
      return { label: latestSurvey.title, data: [] };
    }

    const questionIds = questions.map(q => q.id);

    // Build query để lấy câu trả lời, join với student -> major -> faculty để filter
    const qb = this.dataSource
      .createQueryBuilder()
      .select('sa.answer', 'answer')
      .addSelect('COUNT(sa.id)', 'count')
      .from(SurveyAnswer, 'sa')
      .innerJoin(SurveyResponse, 'sr', 'sr.id = sa.responseId AND sr.status = :status', { status: 'submitted' })
      .where('sa.questionId IN (:...questionIds)', { questionIds })
      .groupBy('sa.answer');

    // Filter theo khoa (qua major -> faculty)
    if (khoa && khoa !== 'all') {
      qb.innerJoin(Student, 'st', 'st.id = sr.studentId')
        .innerJoin(Major, 'm', 'm.id = st.trainingIndustryId')
        .innerJoin(Faculty, 'f', 'f.id = m.facultyId AND f.shortName = :khoa', { khoa });

      // Filter theo ngành
      if (nganh && nganh !== 'all') {
        qb.andWhere('m.shortName = :nganh', { nganh });
      }
    }

    const rows: { answer: string; count: string }[] = await qb.getRawMany();

    // Tổng hợp: một answer có thể là string hoặc array (checkbox)
    const countMap: Record<string, number> = {};
    for (const row of rows) {
      let ans: string | string[];
      try {
        ans = JSON.parse(row.answer);
      } catch {
        ans = row.answer;
      }
      const cnt = Number(row.count);
      if (Array.isArray(ans)) {
        ans.forEach(a => {
          countMap[a] = (countMap[a] ?? 0) + cnt;
        });
      } else {
        countMap[ans] = (countMap[ans] ?? 0) + cnt;
      }
    }

    const data = Object.entries(countMap).map(([name, value]) => ({ name, value }));

    return {
      label: latestSurvey.title,
      data,
    };
  }

  // ─────────────────────────────────────────────
  // GET /dashboard/statistical-questions
  // ─────────────────────────────────────────────
  async getStatisticalQuestions() {
    // Lấy survey active mới nhất
    const latestSurvey = await this.surveyRepo.findOne({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });

    if (!latestSurvey) return [];

    const questions = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.surveyId = :surveyId', { surveyId: latestSurvey.id })
      .andWhere('q.showInChart = :show', { show: 1 })
      .orderBy('q.orderIndex', 'ASC')
      .getMany();

    return questions.map(q => ({
      questionId: q.questionKey,
      label: q.reportFieldKey ?? q.questionText,
      title: q.questionText,
      questionType: q.questionType,
      chartType: q.chartType ?? 'pie',
      options: (q.options ?? []).map(o => o.label),
    }));
  }

  // ─────────────────────────────────────────────
  // GET /dashboard/statistical-questions/:questionId/chart
  // ─────────────────────────────────────────────
  async getChartByQuestionId(
    questionKey: string,
    khoa?: string,
    graduationId?: number,
  ) {
    // Lấy tất cả graduation (đợt tốt nghiệp) để tạo dotData (tối đa 3 đợt gần nhất)
    const graduations = await this.graduationRepo.find({
      order: { id: 'DESC' },
      take: 3,
    });
    graduations.reverse(); // tăng dần

    // Lấy câu hỏi theo question_key (trong bất kỳ survey nào)
    const question = await this.questionRepo.findOne({
      where: { questionKey },
    });

    if (!question) return null;

    const buildCountForSurvey = async (surveyId: number) => {
      const qb = this.dataSource
        .createQueryBuilder()
        .select('sa.answer', 'answer')
        .addSelect('COUNT(sa.id)', 'count')
        .from(SurveyAnswer, 'sa')
        .innerJoin(
          SurveyResponse, 'sr',
          'sr.id = sa.responseId AND sr.surveyId = :surveyId AND sr.status = :status',
          { surveyId, status: 'submitted' },
        )
        .where('sa.questionId = :qid', { qid: question.id })
        .groupBy('sa.answer');

      if (khoa && khoa !== 'all') {
        qb.innerJoin(Student, 'st', 'st.id = sr.studentId')
          .innerJoin(Major, 'm', 'm.id = st.trainingIndustryId')
          .innerJoin(Faculty, 'f', 'f.id = m.facultyId AND f.shortName = :khoa', { khoa });
      }

      if (graduationId) {
        qb.andWhere(qb2 => {
          const sub = qb2
            .subQuery()
            .select('gs2.studentId')
            .from('graduation_students', 'gs2')
            .where('gs2.graduationId = :gid', { gid: graduationId })
            .getQuery();
          return `sr.studentId IN ${sub}`;
        });
      }

      const rows: { answer: string; count: string }[] = await qb.getRawMany();
      const countMap: Record<string, number> = {};
      for (const row of rows) {
        let ans: string | string[];
        try { ans = JSON.parse(row.answer); } catch { ans = row.answer; }
        const cnt = Number(row.count);
        if (Array.isArray(ans)) {
          ans.forEach(a => { countMap[a] = (countMap[a] ?? 0) + cnt; });
        } else {
          countMap[ans] = (countMap[ans] ?? 0) + cnt;
        }
      }
      return Object.entries(countMap).map(([name, value]) => ({ name, value }));
    };

    // Data đợt mới nhất
    const latestSurveyId = question.surveyId;
    const latestData = await buildCountForSurvey(latestSurveyId);
    const totalResponses = latestData.reduce((s, d) => s + d.value, 0);

    // dotData: mỗi graduation -> tên label theo graduation.year
    const dotData: Record<string, { name: string; value: number }[]> = {};

    // Lấy danh sách survey được link với từng graduation (qua survey_graduation)
    for (const grad of graduations) {
      const sg = await this.dataSource
        .createQueryBuilder()
        .select('sg.surveyId', 'surveyId')
        .from('survey_graduation', 'sg')
        .where('sg.graduationId = :gid', { gid: grad.id })
        .getRawOne<{ surveyId: number }>();

      if (!sg?.surveyId) continue;

      // Lấy câu hỏi tương ứng trong survey đó
      const qInSurvey = await this.questionRepo.findOne({
        where: { surveyId: sg.surveyId, questionKey },
      });
      if (!qInSurvey) continue;

      const dotQuestion = { ...question, id: qInSurvey.id, surveyId: sg.surveyId };
      const tempRepo = this.answerRepo;
      void tempRepo; // suppress unused

      // Re-run count với questionId mới
      const qb2 = this.dataSource
        .createQueryBuilder()
        .select('sa.answer', 'answer')
        .addSelect('COUNT(sa.id)', 'count')
        .from(SurveyAnswer, 'sa')
        .innerJoin(
          SurveyResponse, 'sr',
          'sr.id = sa.responseId AND sr.surveyId = :surveyId AND sr.status = :status',
          { surveyId: sg.surveyId, status: 'submitted' },
        )
        .where('sa.questionId = :qid', { qid: dotQuestion.id })
        .groupBy('sa.answer');

      if (khoa && khoa !== 'all') {
        qb2.innerJoin(Student, 'st', 'st.id = sr.studentId')
           .innerJoin(Major, 'm', 'm.id = st.trainingIndustryId')
           .innerJoin(Faculty, 'f', 'f.id = m.facultyId AND f.shortName = :khoa', { khoa });
      }

      const rows2: { answer: string; count: string }[] = await qb2.getRawMany();
      const cm2: Record<string, number> = {};
      for (const row of rows2) {
        let ans: string | string[];
        try { ans = JSON.parse(row.answer); } catch { ans = row.answer; }
        const cnt = Number(row.count);
        if (Array.isArray(ans)) ans.forEach(a => { cm2[a] = (cm2[a] ?? 0) + cnt; });
        else cm2[ans] = (cm2[ans] ?? 0) + cnt;
      }
      const dotLabel = (grad as any).year ?? grad.id.toString();
      dotData[dotLabel] = Object.entries(cm2).map(([name, value]) => ({ name, value }));
    }

    return {
      questionId: question.questionKey,
      title: question.questionText,
      chartType: question.chartType ?? 'pie',
      totalResponses,
      data: latestData,
      dotData,
    };
  }
}
