import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from 'src/database/entities/survey.entity';
import { SurveyQuestion } from 'src/database/entities/survey-question.entity';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private questionRepo: Repository<SurveyQuestion>,
  ) {}

  async findAll(query: any) {
    const surveys = await this.surveyRepo.find({ order: { id: 'DESC' } });
    return surveys.map(s => ({ id: s.id, name: s.title }));
  }

  async findOne(id: number) {
    const survey = await this.surveyRepo.findOneBy({ id });
    if (!survey) throw new NotFoundException(`Kh\u00f4ng t\u00ecm th\u1ea5y form #${id}`);
    return { id: survey.id, name: survey.title };
  }

  async getQuestions(query: any) {
    const qb = this.questionRepo.createQueryBuilder('q');
    if (query.formId || query.surveyId) {
      const sid = query.formId ?? query.surveyId;
      qb.innerJoin('q.section', 'sec').andWhere('sec.surveyId = :sid', { sid });
    }
    const questions = await qb.orderBy('q.order', 'ASC').getMany();
     return questions.map((q) => ({
    id: String(q.id),
    title: q.questionText,
    chartType:
      q.questionType === 'radio' ||
      q.questionType === 'checkbox' ||
      q.questionType === 'select'
        ? 'pie'
        : 'bar',
  }));
  }
}
