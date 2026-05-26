import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/widgets')
  getWidgets() {
    return this.dashboardService.getWidgets();
  }

  @Get('home/stats')
  getHomeStats() {
    return this.dashboardService.getHomeStats();
  }
}
