import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller()
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // GET /forms
  @Get('forms')
  findAll() {
    return this.formsService.findAll();
  }

  // GET /forms/:id
  @Get('forms/:id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(+id);
  }

  // POST /forms
  @Post('forms')
  create(@Body() body: any) {
    return this.formsService.create(body);
  }

  // PATCH /forms/:id
  @Patch('forms/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.formsService.update(+id, body);
  }

  // DELETE /forms/:id
  @Delete('forms/:id')
  remove(@Param('id') id: string) {
    return this.formsService.remove(+id);
  }

  // GET /form-questions
  @Get('form-questions')
  getQuestions() {
    return this.formsService.getQuestions();
  }

  // GET /question-type-options
  @Get('question-type-options')
  getQuestionTypeOptions() {
    return [];
  }

  // GET /themes
  @Get('themes')
  getThemes() {
    return [];
  }

  // GET /fonts
  @Get('fonts')
  getFonts() {
    return [];
  }

  // GET /radius-options
  @Get('radius-options')
  getRadiusOptions() {
    return [];
  }
}
