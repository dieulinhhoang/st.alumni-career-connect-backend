import { Controller, Get, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('widgets')
  getWidgets() {
    return this.dashboardService.getWidgets();
  }

  @Get('chart-data')
  getChartData(
    @Query('khoa') khoa?: string,
    @Query('nganh') nganh?: string,
    @Query('mode') mode?: string,
  ) {
    return this.dashboardService.getChartData({ khoa, nganh, mode });
  }

  @Get('faculty-report-status')
  getFacultyReportStatus(@Query('surveyId') surveyId?: string) {
    return this.dashboardService.getFacultyReportStatus({
      surveyId: surveyId ? Number(surveyId) : undefined,
    });
  }

  @Get('statistical-questions')
  getStatisticalQuestions() {
    return this.dashboardService.getStatisticalQuestions();
  }

  @Get('statistical-questions/:questionId/chart')
  getStatisticalQuestionChart(
    @Param('questionId') questionId: string,
    @Query('khoa') khoa?: string,
    @Query('nganh') nganh?: string,
  ) {
    return this.dashboardService.getStatisticalQuestionChart(Number(questionId), { khoa, nganh });
  }
}
