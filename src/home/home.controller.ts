import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  // GET /home/stats
  @Get('home/stats')
  getHomeStats() {
    return this.homeService.getHomeStats();
  }

  // GET /university
  @Get('university')
  getUniversity() {
    return this.homeService.getUniversity();
  }

  // GET /university/calendar
  @Get('university/calendar')
  getCalendar() {
    return this.homeService.getCalendar();
  }

  // GET /university/notifications
  @Get('university/notifications')
  getNotifications() {
    return this.homeService.getNotifications();
  }

  // GET /alumni/profiles
  @Get('alumni/profiles')
  getAlumniProfiles() {
    return this.homeService.getAlumniProfiles();
  }
}
