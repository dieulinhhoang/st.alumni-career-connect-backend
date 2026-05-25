import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { GetFormsQueryDto } from './dto/get-forms-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('forms')
@UseGuards(JwtAuthGuard)
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  // GET /forms?search=&page=1&pageSize=10
  @Get()
  findAll(@Query() query: GetFormsQueryDto) {
    return this.surveysService.findAll(query);
  }

  // GET /forms/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const survey = await this.surveysService.findOne(id);
    return this.surveysService.mapToForm(survey);
  }

  // POST /forms
  @Post()
  async create(@Body() dto: CreateSurveyDto) {
    return this.surveysService.mapToForm(await this.surveysService.create(dto));
  }

  // PUT /forms/:id
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSurveyDto) {
    return this.surveysService.update(id, dto);
  }

  // DELETE /forms/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.remove(id);
  }

  // POST /forms/:id/duplicate
  @Post(':id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.duplicate(id);
  }

  // POST /forms/generate-ai
  @Post('generate-ai')
  generateAI(@Body('prompt') prompt: string) {
    return this.surveysService.generateWithAI(prompt);
  }
}
