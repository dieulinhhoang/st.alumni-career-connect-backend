import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { CreateFormQuestionDto } from './dto/create-form-question.dto';

@Controller()
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // Themes
  @Get('themes')
  getThemes() { return this.formsService.getThemes(); }

  // Fonts
  @Get('fonts')
  getFonts() { return this.formsService.getFonts(); }

  // Radius options
  @Get('radius-options')
  getRadiusOptions() { return this.formsService.getRadiusOptions(); }

  // Forms CRUD
  @Get('forms')
  findAllForms(@Query() query: any) { return this.formsService.findAllForms(query); }

  @Post('forms')
  createForm(@Body() dto: CreateFormDto) { return this.formsService.createForm(dto); }

  @Get('forms/:id')
  findOneForm(@Param('id') id: string) { return this.formsService.findOneForm(+id); }

  @Patch('forms/:id')
  updateForm(@Param('id') id: string, @Body() dto: UpdateFormDto) {
    return this.formsService.updateForm(+id, dto);
  }

  @Delete('forms/:id')
  removeForm(@Param('id') id: string) { return this.formsService.removeForm(+id); }

  // Form questions
  @Get('form-questions')
  findAllQuestions(@Query() query: any) { return this.formsService.findAllQuestions(query); }

  @Post('form-questions')
  createQuestion(@Body() dto: CreateFormQuestionDto) { return this.formsService.createQuestion(dto); }

  @Get('form-questions/:id')
  findOneQuestion(@Param('id') id: string) { return this.formsService.findOneQuestion(+id); }

  @Patch('form-questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: Partial<CreateFormQuestionDto>) {
    return this.formsService.updateQuestion(+id, dto);
  }

  @Delete('form-questions/:id')
  removeQuestion(@Param('id') id: string) { return this.formsService.removeQuestion(+id); }

  // Question type options
  @Get('question-type-options')
  getQuestionTypeOptions() { return this.formsService.getQuestionTypeOptions(); }
}
