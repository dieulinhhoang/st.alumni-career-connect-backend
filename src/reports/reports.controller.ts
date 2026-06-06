import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface ReportFilters {
  surveyId?: string;
  facultyId?: string;
  majorId?: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * POST /reports
   * FE gửi { filters: { surveyId, facultyId?, majorId? }, userIndex }
   * → trả về báo cáo tổng hợp đầy đủ
   */
  @Post()
  getReport(@Body() body: { filters: ReportFilters; userIndex?: number }) {
    return this.reportsService.buildReport(body.filters ?? {}, body.userIndex ?? 0);
  }

  /**
   * GET /reports/options
   * Danh sách đợt khảo sát (cả ended lẫn active) để FE dùng dropdown
   */
  @Get('options')
  getBatchOptions() {
    return this.reportsService.getBatchOptions();
  }
}