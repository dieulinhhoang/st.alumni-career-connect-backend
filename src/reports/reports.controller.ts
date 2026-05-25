import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { CreateReportTemplateDto } from './dto/create-report-template.dto';
import { UpdateReportTemplateDto } from './dto/update-report-template.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // --- Reports ---
  @Post()
  createReport(@Body() dto: CreateReportDto) {
    return this.reportsService.createReport(dto);
  }

  @Get()
  findAllReports(@Query() query: any) {
    return this.reportsService.findAllReports(query);
  }

  @Get(':id')
  findOneReport(@Param('id') id: string) {
    return this.reportsService.findOneReport(id);
  }

  @Patch(':id')
  updateReport(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reportsService.updateReport(id, dto);
  }

  @Delete(':id')
  removeReport(@Param('id') id: string) {
    return this.reportsService.removeReport(id);
  }

  // --- Templates ---
  @Post('templates')
  createTemplate(@Body() dto: CreateReportTemplateDto) {
    return this.reportsService.createTemplate(dto);
  }

  @Get('templates')
  findAllTemplates(@Query() query: any) {
    return this.reportsService.findAllTemplates(query);
  }

  @Get('templates/:id')
  findOneTemplate(@Param('id') id: string) {
    return this.reportsService.findOneTemplate(id);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateReportTemplateDto) {
    return this.reportsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id') id: string) {
    return this.reportsService.removeTemplate(id);
  }
}
