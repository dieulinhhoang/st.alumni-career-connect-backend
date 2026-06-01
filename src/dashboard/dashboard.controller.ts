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

  @Get('chart-data')
  getChartData(
    @Query('khoa') khoa?: string,
    @Query('nganh') nganh?: string,
    @Query('mode') mode?: string,
  ) {
    return this.dashboardService.getChartData({ khoa, nganh, mode });
  }
}
