import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyQuestion } from '../database/entities/survey-question.entity';
import { SurveyAnswer } from '../database/entities/survey-answer.entity';
import { SurveyResponse } from '../database/entities/survey-response.entity';
import { Survey } from '../database/entities/survey.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(SurveyQuestion)
    private questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(SurveyAnswer)
    private answerRepo: Repository<SurveyAnswer>,
    @InjectRepository(SurveyResponse)
    private responseRepo: Repository<SurveyResponse>,
    @InjectRepository(Survey)
    private surveyRepo: Repository<Survey>,
  ) {}

  /**
   * GET /form-questions?form_id=1
   * Trả về các câu hỏi showInChart = 1 (có thể vẽ biểu đồ)
   */
  async getStatisticalQuestions(formId: number) {
    const questions = await this.questionRepo.find({
      where: { surveyId: formId, showInChart: 1 },
      order: { orderIndex: 'ASC' },
    });

    return questions.map((q) => ({
      id: String(q.id),
      title: q.questionText,
      chartType: q.chartType ?? 'pie',
    }));
  }

  /**
   * GET /statistics?form_id=1&question_id=5
   * Tính thống kê các đáp án cho 1 câu hỏi
   */
  async getFormStatisticsDetail(formId: number, questionId: number) {
    const survey = await this.surveyRepo.findOneBy({ id: formId });
    const question = await this.questionRepo.findOneBy({ id: questionId, surveyId: formId });
    if (!question) return null;

    // Đếm tổng submissions của form
    const totalResponses = await this.responseRepo.count({
      where: { surveyId: formId, status: 'submitted' },
    });

    // Lấy tất cả answers cho question này
    const answers = await this.answerRepo
      .createQueryBuilder('a')
      .innerJoin('a.response', 'res', 'res.surveyId = :formId AND res.status = :status', {
        formId,
        status: 'submitted',
      })
      .where('a.questionId = :questionId', { questionId })
      .getMany();

    // Đếm số responses duy nhất đã trả lời câu hỏi này
    const answeredResponses = new Set(answers.map((a) => a.responseId)).size;
    const completionRate =
      totalResponses > 0 ? Math.round((answeredResponses / totalResponses) * 100) : 0;

    // Đếm tần suất mỗi option (dựa trên responseId để tránh đếm trùng)
    const countMap: Record<string, number> = {};
    for (const a of answers) {
      const vals = Array.isArray(a.answer) ? a.answer : [a.answer];
      for (const v of vals) {
        if (!v) continue;
        countMap[v] = (countMap[v] ?? 0) + 1;
      }
    }

    // Map options → ChartDatum
    let data: { label: string; value: number; percent: number }[] = [];
    if (question.options && question.options.length > 0) {
      data = question.options.map((opt) => {
        const value = countMap[opt.id] ?? countMap[opt.label] ?? 0;
        return {
          label: opt.label,
          value,
          percent: answeredResponses > 0 ? Math.round((value / answeredResponses) * 100) : 0,
        };
      });
    } else {
      // text field — trả raw
      data = Object.entries(countMap).map(([label, value]) => ({
        label,
        value,
        percent: answeredResponses > 0 ? Math.round((value / answeredResponses) * 100) : 0,
      }));
    }

    return {
      totalResponses,
      completionRate,
      formName: survey?.title ?? '',
      questionTitle: question.questionText,
      chartType: question.chartType ?? 'pie',
      data,
    };
  }
}
