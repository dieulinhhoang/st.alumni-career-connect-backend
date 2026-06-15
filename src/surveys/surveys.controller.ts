import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
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

  @Post('generate-ai')
  generateAI(@Body('prompt') prompt: string) {
    return this.surveysService.generateWithAI(prompt);
  }

  @Get()
  findAll(@Query() query: GetFormsQueryDto) {
    return this.surveysService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.findOneAsForm(id);
  }

  @Post()
  async create(@Body() dto: CreateSurveyDto) {
    return this.surveysService.mapToForm(await this.surveysService.create(dto));
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSurveyDto) {
    return this.surveysService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.duplicate(id);
  }

  @Patch(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.setStatus(id, 'published');
  }

  @Patch(':id/unpublish')
  async unpublish(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.setStatus(id, 'draft');
  }
}

//  Question Bank 

@Controller('question-bank')
@UseGuards(JwtAuthGuard)
export class QuestionBankController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get()
  getAll(@Query('search') search?: string, @Query('category') category?: string) {
    return this.surveysService.getQuestionBank({ search, category });
  }

  @Post()
  create(@Body() body: { title: string; type: string; category?: string; options?: any[] }) {
    return this.surveysService.createBankQuestion(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.surveysService.removeBankQuestion(id);
  }
}