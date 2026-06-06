import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
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
   * FE gửi { filters, userIndex } → trả báo cáo tổng hợp.
   * Nếu scope = faculty → chỉ trả data sau khi khoa đã submitted.
   * Nếu scope = school  → trả overview + facultyRows kèm status thật.
   */
  @Post()
  getReport(@Body() body: { filters: ReportFilters; userIndex?: number }) {
    return this.reportsService.buildReport(body.filters ?? {}, body.userIndex ?? 0);
  }

  /**
   * GET /reports/options
   * Danh sách đợt khảo sát cho dropdown.
   */
  @Get('options')
  getBatchOptions() {
    return this.reportsService.getBatchOptions();
  }

  /**
   * GET /reports/submission-status?batchId=&facultyId=
   * Trạng thái nộp của 1 khoa trong 1 đợt.
   */
  @Get('submission-status')
  getSubmissionStatus(
    @Query('batchId', ParseIntPipe) batchId: number,
    @Query('facultyId', ParseIntPipe) facultyId: number,
  ) {
    return this.reportsService.getSubmissionStatus(batchId, facultyId);
  }

  /**
   * POST /reports/submit
   * Khoa nộp báo cáo lên trường.
   */
  @Post('submit')
  submit(
    @Body() body: { batchId: number; facultyId: number },
    @Request() req: any,
  ) {
    const userName: string = req.user?.username ?? req.user?.email ?? 'Khoa';
    return this.reportsService.submitReport(body.batchId, body.facultyId, userName);
  }

  /**
   * POST /reports/withdraw
   * Khoa thu hồi báo cáo (chỉ được khi đang submitted).
   */
  @Post('withdraw')
  withdraw(@Body() body: { batchId: number; facultyId: number }) {
    return this.reportsService.withdrawReport(body.batchId, body.facultyId);
  }

  /**
   * POST /reports/approve
   * Trường duyệt báo cáo của khoa.
   */
  @Post('approve')
  approve(
    @Body() body: { batchId: number; facultyId: number },
    @Request() req: any,
  ) {
    const userName: string = req.user?.username ?? req.user?.email ?? 'Trường';
    return this.reportsService.approveReport(body.batchId, body.facultyId, userName);
  }

  /**
   * POST /reports/return
   * Trường trả báo cáo về cho khoa bổ sung.
   */
  @Post('return')
  returnReport(
    @Body() body: { batchId: number; facultyId: number; feedback: string },
  ) {
    return this.reportsService.returnReport(body.batchId, body.facultyId, body.feedback);
  }

  /**
   * GET /reports/faculty/:facultyId?batchId=
   * Trường xem chi tiết báo cáo của 1 khoa — chỉ cho phép nếu đã submitted/approved.
   */
  @Get('faculty/:facultyId')
  getFacultyReport(
    @Param('facultyId', ParseIntPipe) facultyId: number,
    @Query('batchId') batchId?: string,
  ) {
    return this.reportsService.buildReport(
      { facultyId: String(facultyId), surveyId: batchId },
      0,
    );
  }
}