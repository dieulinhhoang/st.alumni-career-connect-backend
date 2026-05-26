import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AlumniService } from './alumni.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Controller('alumni')
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Get('batches')
  getBatches() {
    return this.alumniService.getBatches();
  }

  @Get('batches/:id')
  getBatchById(@Param('id', ParseIntPipe) id: number) {
    return this.alumniService.getBatchById(id);
  }

  @Post('batches')
  createBatch(@Body() dto: CreateBatchDto) {
    return this.alumniService.createBatch(dto);
  }

  @Put('batches/:id')
  updateBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.alumniService.updateBatch(id, dto);
  }

  @Delete('batches/:id')
  deleteBatch(@Param('id', ParseIntPipe) id: number) {
    return this.alumniService.deleteBatch(id);
  }

  @Get('batches/:id/stats')
  getBatchStats(@Param('id', ParseIntPipe) id: number) {
    return this.alumniService.getBatchStats(id);
  }
}
