import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GraduationService } from './graduation.service';
import { CreateGraduationDto } from './dto/create-graduation.dto';
import { UpdateGraduationDto } from './dto/update-graduation.dto';

@Controller('graduation')
export class GraduationController {
  constructor(private readonly graduationService: GraduationService) {}

  @Post()
  create(@Body() createGraduationDto: CreateGraduationDto) {
    return this.graduationService.create(createGraduationDto);
  }

  @Get()
  findAll() {
    return this.graduationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.graduationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGraduationDto: UpdateGraduationDto) {
    return this.graduationService.update(+id, updateGraduationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.graduationService.remove(+id);
  }
}
