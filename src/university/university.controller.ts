import { Controller, Get, UseGuards } from '@nestjs/common';
import { UniversityService } from './university.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('university')
@UseGuards(JwtAuthGuard)
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get()
  getUniversity() {
    return this.universityService.getUniversity();
  }

  @Get('calendar')
  getCalendar() {
    return this.universityService.getCalendar();
  }

  @Get('notifications')
  getNotifications() {
    return this.universityService.getNotifications();
  }
}
