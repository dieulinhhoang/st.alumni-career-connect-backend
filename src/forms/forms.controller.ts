import { Controller, Get, Param, Query } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller()
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get('forms')
  findAll(@Query() query: any) {
    return this.formsService.findAll(query);
  }

  @Get('forms/:id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(+id);
  }

  @Get('form-questions')
  getQuestions(@Query() query: any) {
    return this.formsService.getQuestions(query);
  }

  @Get('question-type-options')
  getQuestionTypeOptions() {
    return [];
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
