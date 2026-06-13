import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, Request, Res, ParseIntPipe, ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportExportService, ExportMau } from './report-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface ReportFilters {
  surveyId?: string;
  facultyId?: string;
  majorId?: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportExportService: ReportExportService,
  ) {}

  /**
   * GET /reports/export?mau=mau01|mau02|mau03|all&surveyId=&facultyId=&majorId=
   * Xuất báo cáo Excel theo template công văn (như hệ thống cũ).
   */
  @Get('export')
  async exportReport(
    @Res() res: Response,
    @Request() req: any,
    @Query('mau') mau?: string,
    @Query('surveyId') surveyId?: string,
    @Query('facultyId') facultyId?: string,
    @Query('majorId') majorId?: string,
  ) {
    const type: ExportMau = ['mau01', 'mau02', 'mau03', 'all'].includes(mau ?? '')
      ? (mau as ExportMau)
      : 'all';
    const filters = { surveyId, facultyId, majorId };
    const report = await this.reportsService.buildReport(filters, req.user);
    // Mẫu 3 cần câu hỏi động từ formSnapshot của batch + answers thô
    const dynamic = (type === 'mau03' || type === 'all')
      ? await this.reportsService.getExportSurveyData(filters)
      : undefined;
    const wb = this.reportExportService.buildWorkbook(report, type, dynamic);

    const names: Record<ExportMau, string> = {
      mau01: 'mau-bao-cao-1', mau02: 'mau-bao-cao-2',
      mau03: 'mau-bao-cao-3', all: 'bao-cao-tong-hop',
    };
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const fileName = `${names[type]}-${stamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await wb.xlsx.write(res);
    res.end();
  }

  /**
   * POST /reports
   * FE gửi { filters, userIndex } → trả báo cáo tổng hợp.
   * Nếu scope = faculty → chỉ trả data sau khi khoa đã submitted.
   * Nếu scope = school  → trả overview + facultyRows kèm status thật.
   */
  @Post()
  getReport(@Body() body: { filters: ReportFilters }, @Request() req: any) {
    return this.reportsService.buildReport(body.filters ?? {}, req.user);
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
   * Cán bộ khoa chỉ được xem trạng thái của khoa mình.
   */
  @Get('submission-status')
  getSubmissionStatus(
    @Query('batchId', ParseIntPipe) batchId: number,
    @Query('facultyId', ParseIntPipe) facultyId: number,
    @Request() req: any,
  ) {
    const effectiveFacultyId = req.user?.isAdmin ? facultyId : (req.user?.facultyId ?? facultyId);
    return this.reportsService.getSubmissionStatus(batchId, effectiveFacultyId);
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
    const userName: string = req.user?.name ?? 'Khoa';
    const facultyId = req.user?.isAdmin ? body.facultyId : (req.user?.facultyId ?? body.facultyId);
    return this.reportsService.submitReport(body.batchId, facultyId, userName);
  }

  /**
   * POST /reports/withdraw
   * Khoa thu hồi báo cáo (chỉ được khi đang submitted).
   */
  @Post('withdraw')
  withdraw(@Body() body: { batchId: number; facultyId: number }, @Request() req: any) {
    const facultyId = req.user?.isAdmin ? body.facultyId : (req.user?.facultyId ?? body.facultyId);
    return this.reportsService.withdrawReport(body.batchId, facultyId);
  }

  /**
   * POST /reports/approve
   * Trường duyệt báo cáo của khoa. Chỉ admin/trường được phép.
   */
  @Post('approve')
  approve(
    @Body() body: { batchId: number; facultyId: number },
    @Request() req: any,
  ) {
    if (!req.user?.isAdmin) {
      throw new ForbiddenException('Chỉ trường mới được duyệt báo cáo.');
    }
    const userName: string = req.user?.name ?? 'Trường';
    return this.reportsService.approveReport(body.batchId, body.facultyId, userName);
  }

  /**
   * POST /reports/return
   * Trường trả báo cáo về cho khoa bổ sung. Chỉ admin/trường được phép.
   */
  @Post('return')
  returnReport(
    @Body() body: { batchId: number; facultyId: number; feedback: string },
    @Request() req: any,
  ) {
    if (!req.user?.isAdmin) {
      throw new ForbiddenException('Chỉ trường mới được trả báo cáo.');
    }
    return this.reportsService.returnReport(body.batchId, body.facultyId, body.feedback);
  }

  /**
   * GET /reports/faculty/:facultyId?batchId=
   * Trường xem chi tiết báo cáo của 1 khoa — chỉ cho phép nếu đã submitted/approved.
   */
  @Get('faculty/:facultyId')
  getFacultyReport(
    @Param('facultyId', ParseIntPipe) facultyId: number,
    @Request() req: any,
    @Query('batchId') batchId?: string,
  ) {
    return this.reportsService.buildReport(
      { facultyId: String(facultyId), surveyId: batchId },
      req.user,
    );
  }
}