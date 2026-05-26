import { Controller, Get, Query } from '@nestjs/common';
import { AlumniService } from './alumni.service';

@Controller('alumni')
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Get('profiles')
  getProfiles(@Query() query: any) {
    return this.alumniService.getProfiles(query);
  }
}
