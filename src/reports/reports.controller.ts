import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * POST /reports
   * FE gửi { filters, userIndex } → trả về báo cáo tổng hợp
   */
  @Post()
  getReport(@Body() body: { filters: any; userIndex?: number }) {
    return this.reportsService.buildReport(body.filters, body.userIndex ?? 0);
  }
}
