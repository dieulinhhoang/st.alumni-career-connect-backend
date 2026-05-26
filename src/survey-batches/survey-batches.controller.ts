import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SurveyBatchesService } from './survey-batches.service';
import { CreateSurveyBatchDto } from './dto/create-survey-batch.dto';
import { UpdateSurveyBatchDto } from './dto/update-survey-batch.dto';

@Controller()
export class SurveyBatchesController {
  constructor(private readonly service: SurveyBatchesService) {}

  // FE gọi cả /survey-batches lẫn /batches
  @Get('survey-batches')
  @Get('batches')
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Post('survey-batches')
  create(@Body() dto: CreateSurveyBatchDto) {
    return this.service.create(dto);
  }

  @Get('survey-batches/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch('survey-batches/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSurveyBatchDto) {
    return this.service.update(+id, dto);
  }

  @Delete('survey-batches/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
