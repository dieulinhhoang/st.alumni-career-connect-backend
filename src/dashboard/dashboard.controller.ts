import { Controller, Get, Query } from '@nestjs/common';
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

  /**
   * GET /dashboard/chart-data
   * Query params:
   *   - mode: 'coviec' | 'tinhhinh' | 'khuvuc'  (default: 'coviec')
   *   - questionKey: override mode → dùng key câu hỏi cụ thể
   *   - khoa: abbr/slug/name của khoa (default: 'all')
   *   - nganh: code/slug/name của ngành (default: 'all')
   *   - surveyId: giới hạn theo đợt khảo sát
   */
  @Get('chart-data')
  getChartData(
    @Query('khoa') khoa?: string,
    @Query('nganh') nganh?: string,
    @Query('mode') mode?: string,
    @Query('questionKey') questionKey?: string,
    @Query('surveyId') surveyId?: string,
  ) {
    return this.dashboardService.getChartData({
      khoa,
      nganh,
      mode,
      questionKey,
      surveyId: surveyId ? Number(surveyId) : undefined,
    });
  }
}
