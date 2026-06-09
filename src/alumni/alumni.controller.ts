import {
  Controller, Get, Post, Put, Delete, Body, Param,
  ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AlumniService } from './alumni.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('alumni')
@UseGuards(JwtAuthGuard)
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Get('batches')
  findAll() {
    return this.alumniService.findAll();
  }

  @Get('batches/:id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alumniService.findOne(id);
  }

  @Post('batches')
  create(@Body() dto: CreateBatchDto) {
    return this.alumniService.create(dto);
  }

  @Put('batches/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.alumniService.update(id, dto);
  }

  @Delete('batches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.alumniService.remove(id);
  }

  @Get('batches/:id/stats')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.alumniService.getStats(id);
  }
}