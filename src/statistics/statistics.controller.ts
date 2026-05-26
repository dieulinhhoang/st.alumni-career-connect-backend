import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * GET /form-questions?form_id=1
   * Trả về danh sách câu hỏi có show_in_chart = 1 của một form
   */
  @Get('form-questions')
  getFormQuestions(@Query('form_id') formId: string) {
    return this.statisticsService.getStatisticalQuestions(+formId);
  }

  /**
   * GET /statistics?form_id=1&question_id=5
   * Trả về thống kê chi tiết cho 1 câu hỏi
   */
  @Get('statistics')
  getStatistics(
    @Query('form_id') formId: string,
    @Query('question_id') questionId: string,
  ) {
    return this.statisticsService.getFormStatisticsDetail(+formId, +questionId);
  }
}
