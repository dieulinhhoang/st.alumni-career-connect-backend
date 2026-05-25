import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { GetFormsDto } from './dto/get-forms.dto';
import { GenerateAIFormDto } from './dto/generate-ai-form.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('forms')
@UseGuards(JwtAuthGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  findAll(@Query() query: GetFormsDto) {
    return this.formsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.formsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFormDto) {
    return this.formsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormDto,
  ) {
    return this.formsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.formsService.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number) {
    return this.formsService.duplicate(id);
  }

  @Post('generate-ai')
  generateAI(@Body() dto: GenerateAIFormDto) {
    return this.formsService.generateWithAI(dto);
  }
}
