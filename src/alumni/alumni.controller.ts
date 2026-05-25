import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AlumniService } from './alumni.service';
import { CreateAlumniDto } from './dto/create-alumni.dto';
import { UpdateAlumniDto } from './dto/update-alumni.dto';

@Controller('alumni')
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Get('profiles')
  findAll(@Query() query: any) {
    return this.alumniService.findAll(query);
  }

  @Post('profiles')
  create(@Body() dto: CreateAlumniDto) {
    return this.alumniService.create(dto);
  }

  @Get('profiles/:id')
  findOne(@Param('id') id: string) {
    return this.alumniService.findOne(id);
  }

  @Patch('profiles/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAlumniDto) {
    return this.alumniService.update(id, dto);
  }

  @Delete('profiles/:id')
  remove(@Param('id') id: string) {
    return this.alumniService.remove(id);
  }
}
