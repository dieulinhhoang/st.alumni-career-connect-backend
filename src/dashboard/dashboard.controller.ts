import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /dashboard/widgets
  @Get('widgets')
  getWidgets() {
    return this.dashboardService.getWidgets();
  }
}
