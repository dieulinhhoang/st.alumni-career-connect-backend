import { Controller, Get } from '@nestjs/common';
import { UniversityService } from './university.service';

@Controller('university')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get()
  getInfo() {
    return this.universityService.getInfo();
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
