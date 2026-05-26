import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, ParseIntPipe,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { GenerateAiFormDto } from './dto/generate-ai-form.dto';

@Controller()
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get('forms')
  findAll(@Query() query: any) {
    return this.formsService.findAll(query);
  }

  @Post('forms')
  create(@Body() dto: CreateFormDto) {
    return this.formsService.create(dto);
  }

  @Post('forms/generate-ai')
  generateAi(@Body() dto: GenerateAiFormDto) {
    return this.formsService.generateAi(dto);
  }

  @Get('forms/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.formsService.findOne(id);
  }

  @Put('forms/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFormDto) {
    return this.formsService.update(id, dto);
  }

  @Delete('forms/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.formsService.remove(id);
  }

  @Post('forms/:id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number) {
    return this.formsService.duplicate(id);
  }

  @Get('form-questions')
  getQuestions(@Query() query: any) {
    return this.formsService.getQuestions(query);
  }

  @Get('question-type-options')
  getQuestionTypeOptions() {
    return [
      { value: 'text', label: 'Text' },
      { value: 'radio', label: 'Radio' },
      { value: 'checkbox', label: 'Checkbox' },
      { value: 'select', label: 'Select' },
      { value: 'textarea', label: 'Textarea' },
      { value: 'date', label: 'Date' },
      { value: 'rating', label: 'Rating' },
    ];
  }

  @Get('themes')
  getThemes() {
    return [];
  }

  @Get('fonts')
  getFonts() {
    return [];
  }

  @Get('radius-options')
  getRadiusOptions() {
    return [];
  }
}
