import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Report templates
  @Get('report-templates')
  getTemplates() {
    return this.reportsService.getTemplates();
  }

  // Reports
  @Get('reports')
  findAll(@Query() query: any) {
    return this.reportsService.findAll(query);
  }

  @Post('reports')
  generate(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.generate(createReportDto);
  }

  @Get('reports/:id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(+id);
  }

  @Delete('reports/:id')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(+id);
  }
}
