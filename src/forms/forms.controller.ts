import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { Form, FormPayloadDto } from './dto/form.dto';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  findAll(): Form[] {
    return this.formsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Form {
    return this.formsService.findOne(id);
  }

  @Post()
  create(@Body() payload: FormPayloadDto): Form {
    return this.formsService.create(payload);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() payload: FormPayloadDto): Form {
    return this.formsService.replace(id, payload);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: Partial<FormPayloadDto>,
  ): Form {
    return this.formsService.update(id, payload);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.formsService.remove(id);
  }
}
