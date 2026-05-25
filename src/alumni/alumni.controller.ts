import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AlumniService } from './alumni.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('alumni')
@UseGuards(JwtAuthGuard)
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Get('profiles')
  getProfiles(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('major') major?: string,
    @Query('graduationYear') graduationYear?: number,
  ) {
    return this.alumniService.getProfiles({ page: +page, limit: +limit, major, graduationYear: graduationYear ? +graduationYear : undefined });
  }

  @Get('profiles/:id')
  getProfileById(@Param('id') id: string) {
    return this.alumniService.getProfileById(id);
  }
}
