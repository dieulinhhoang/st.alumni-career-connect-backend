import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  listReports() {
    return this.reportsService.listReports();
  }

  @Post()
  generateReport(@Body() body: any) {
    return this.reportsService.generateReport(body);
  }

  @Get('templates')
  getTemplates() {
    return this.reportsService.getTemplates();
  }
}
