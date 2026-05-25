import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/widgets
   * Trả về các thống kê tổng quan: tổng users, students, enterprises, jobs, surveys
   */
  @Get('widgets')
  getWidgets() {
    return this.dashboardService.getWidgets();
  }

  /**
   * GET /dashboard/chart-data
   * Trả về dữ liệu biểu đồ việc làm theo khoa/ngành và mode
   * @query khoa  - viet_tat của khoa (hoặc "all")
   * @query nganh - viet_tat của ngành (hoặc "all")
   * @query mode  - "coviec" | "tinhhinh" | "khuvuc"
   */
  @Get('chart-data')
  getChartData(
    @Query('khoa') khoa = 'all',
    @Query('nganh') nganh = 'all',
    @Query('mode') mode = 'coviec',
  ) {
    return this.dashboardService.getChartData(khoa, nganh, mode);
  }

  /**
   * GET /dashboard/statistical-questions
   * Trả về danh sách câu hỏi có show_in_chart = true cùng metadata
   */
  @Get('statistical-questions')
  getStatisticalQuestions() {
    return this.dashboardService.getStatisticalQuestions();
  }

  /**
   * GET /dashboard/statistical-questions/:questionId/chart
   * Trả về dữ liệu biểu đồ của một câu hỏi theo questionKey
   * @query questionId - question_key của câu hỏi
   * @query khoa       - lọc theo khoa (optional)
   * @query graduationId - lọc theo đợt tốt nghiệp (optional)
   */
  @Get('statistical-questions/:questionId/chart')
  getChartByQuestionId(
    @Query('questionId') questionId: string,
    @Query('khoa') khoa?: string,
    @Query('graduationId') graduationId?: string,
  ) {
    return this.dashboardService.getChartByQuestionId(questionId, khoa, graduationId ? +graduationId : undefined);
  }
}
