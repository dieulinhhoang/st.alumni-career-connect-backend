import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * GET /statistics/batches
   * Danh sách các đợt khảo sát đã kết thúc (status = 'ended')
   * FE dùng để hiển thị dropdown chọn đợt thống kê
   */
  @Get('statistics/batches')
  getEndedBatches() {
    return this.statisticsService.getEndedBatches();
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
   * GET /statistics?batch_id=1&question_key=employment_status
   * Tổng hợp thống kê thực tế từ AlumniBatchResponse.answers
   */
  @Get('statistics')
  getStatistics(
    @Query('batch_id', ParseIntPipe) batchId: number,
    @Query('question_key') questionKey: string,
  ) {
    return this.statisticsService.getStatisticsDetail(batchId, questionKey);
  }
}