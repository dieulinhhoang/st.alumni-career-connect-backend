import {
  Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe,
} from '@nestjs/common';
import { AlumniBatchesService } from './alumni-batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Controller('alumni/batches')
export class AlumniBatchesController {
  constructor(private readonly service: AlumniBatchesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBatchDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBatchDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get(':id/stats')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.service.getStats(id);
  }

  /**
   * POST /alumni/batches/:id/responses
   * Lưu câu trả lời khảo sát của người dùng vào DB
   */
  @Post(':id/responses')
  submitResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      studentId: string;
      studentName: string;
      studentEmail: string;
      studentPhone?: string;
      answers: Record<string, any>;
    },
  ) {
    return this.service.submitResponse(id, body);
  }

  /**
   * GET /alumni/batches/:id/responses
   * Lấy danh sách các responses đã nộp của một batch
   */
  @Get(':id/responses')
  getResponses(@Param('id', ParseIntPipe) id: number) {
    return this.service.getResponses(id);
  }
}
