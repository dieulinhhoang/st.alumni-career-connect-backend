import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * GET /statistics/batches?facultyId=1
   * Danh sách các đợt khảo sát đã kết thúc (status = 'ended')
   * FE dùng để hiển thị dropdown chọn đợt thống kê.
   * facultyId tùy chọn — cán bộ khoa truyền vào để chỉ thấy đợt có dữ liệu khoa mình.
   */
  @Get('statistics/batches')
  getEndedBatches(@Query('facultyId') facultyId?: string) {
    return this.statisticsService.getEndedBatches(facultyId ? Number(facultyId) : undefined);
  }

  /**
   * GET /statistics/questions?batch_id=1
   * Danh sách câu hỏi có show_in_chart = 1 trong formSnapshot của batch
   */
  @Get('statistics/questions')
  getFormQuestions(@Query('batch_id', ParseIntPipe) batchId: number) {
    return this.statisticsService.getStatisticalQuestions(batchId);
  }

  /**
   * GET /statistics?batch_id=1&question_key=employment_status&facultyId=2
   * Tổng hợp thống kê thực tế từ AlumniBatchResponse.answers.
   * facultyId tùy chọn — cán bộ khoa truyền vào để chỉ xem thống kê khoa mình.
   */
  @Get('statistics')
  getStatistics(
    @Query('batch_id', ParseIntPipe) batchId: number,
    @Query('question_key') questionKey: string,
    @Query('facultyId') facultyId?: string,
  ) {
    return this.statisticsService.getStatisticsDetail(
      batchId,
      questionKey,
      facultyId ? Number(facultyId) : undefined,
    );
  }
}