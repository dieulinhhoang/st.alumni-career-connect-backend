import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../database/entities/survey.entity';
import { SurveyResponse } from '../database/entities/survey-response.entity';
import { SurveyAnswer } from '../database/entities/survey-answer.entity';
import { Faculty } from '../database/entities/faculty.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyResponse)
    private responseRepo: Repository<SurveyResponse>,
    @InjectRepository(SurveyAnswer)
    private answerRepo: Repository<SurveyAnswer>,
    @InjectRepository(Faculty)
    private facultyRepo: Repository<Faculty>,
  ) {}

  async buildReport(filters: any, userIndex: number) {
    const { formId, faculty, major, year } = filters ?? {};

    // Lấy tổng số responses
    const qb = this.responseRepo.createQueryBuilder('res');
    if (formId) qb.andWhere('res.surveyId = :formId', { formId });

    const totalResponses = await qb.getCount();
    const submitted = await qb.clone()
      .andWhere('res.status = :status', { status: 'submitted' })
      .getCount();

    // Danh sách khoa để build facultyRows
    const faculties = await this.facultyRepo.find({ where: { status: 1 } });

    const facultyRows = faculties.map((f) => ({
      faculty: f.name,
      abbreviation: f.abbr ?? '',
      total: 0,
      submitted: 0,
      rate: 0,
      status: 'pending',
      submittedDate: null,
    }));

    return {
      currentUser: {
        id: userIndex,
        name: 'Admin',
        role: 'admin',
        faculty: null,
      },
      stats: {
        totalStudents: totalResponses,
        totalResponded: submitted,
        responseRate: totalResponses > 0 ? Math.round((submitted / totalResponses) * 100) : 0,
        employmentRate: 0,
        suitableJobRate: 0,
      },
      majorRows: [],
      graduateRows: [],
      responseRows: [],
      facultyRows,
      reportMeta: {
        generatedAt: new Date().toISOString(),
        filters: filters ?? {},
        formId: formId ?? null,
      },
    };
  }
}
