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
  ): any {
    return this.dashboardService.getChartData({ khoa, nganh, mode });
  }

  @Get('employment-chart')
  getEmploymentChartData(
    @Query('khoa') khoa?: string,
    @Query('nganh') nganh?: string,
  ): any {
    return this.dashboardService.getEmploymentChartData({ khoa, nganh });
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
    // Giữ nguyên string, service sẽ xử lý cả numeric id và questionKey string
    return this.dashboardService.getStatisticalQuestionChart(questionId, { khoa, nganh });
  }
}