import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { SurveyBatchesService } from './survey-batches.service';

@Controller()
export class SurveyBatchesController {
  constructor(private readonly surveyBatchesService: SurveyBatchesService) {}

  // GET /survey-batches  (alias /batches)
  @Get('survey-batches')
  findAll() {
    return this.surveyBatchesService.findAll();
  }

  @Get('batches')
  findAllAlias() {
    return this.surveyBatchesService.findAll();
  }

  // GET /survey-batches/:id
  @Get('survey-batches/:id')
  findOne(@Param('id') id: string) {
    return this.surveyBatchesService.findOne(+id);
  }

  // POST /survey-batches
  @Post('survey-batches')
  create(@Body() body: any) {
    return this.surveyBatchesService.create(body);
  }

  // PATCH /survey-batches/:id
  @Patch('survey-batches/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.surveyBatchesService.update(+id, body);
  }

  // DELETE /survey-batches/:id
  @Delete('survey-batches/:id')
  remove(@Param('id') id: string) {
    return this.surveyBatchesService.remove(+id);
  }
}
