import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('reports')
  findAll(@Query() query: any) {
    return this.reportsService.findAll(query);
  }

  @Post('reports')
  generate(@Body() body: any) {
    return this.reportsService.generate(body);
  }

  @Get('report-templates')
  getTemplates() {
    return this.reportsService.getTemplates();
  }
}
