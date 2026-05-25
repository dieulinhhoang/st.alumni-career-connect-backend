import { Controller, Get, Param, Query } from '@nestjs/common';
import { AlumniService } from './alumni.service';

@Controller('alumni')
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Get('profiles')
  findAll(@Query() query: any) {
    return this.alumniService.findAll(query);
  }

  @Get('profiles/:id')
  findOne(@Param('id') id: string) {
    return this.alumniService.findOne(+id);
  }
}
