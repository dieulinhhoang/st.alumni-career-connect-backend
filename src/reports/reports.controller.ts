import { Controller, Get, Post, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // GET /reports
  @Get('reports')
  findAll() {
    return this.reportsService.findAll();
  }

  // POST /reports  — generate report
  @Post('reports')
  generate(@Body() body: any) {
    return this.reportsService.generate(body);
  }

  // GET /report-templates
  @Get('report-templates')
  getTemplates() {
    return this.reportsService.getTemplates();
  }
}
