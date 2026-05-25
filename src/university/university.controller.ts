import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UniversityService } from './university.service';

@Controller('university')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get()
  getInfo() {
    return this.universityService.getInfo();
  }

  // Calendar
  @Get('calendar')
  getCalendar(@Query() query: any) {
    return this.universityService.getCalendar(query);
  }

  @Post('calendar')
  createCalendarEvent(@Body() body: any) {
    return this.universityService.createCalendarEvent(body);
  }

  @Patch('calendar/:id')
  updateCalendarEvent(@Param('id') id: string, @Body() body: any) {
    return this.universityService.updateCalendarEvent(+id, body);
  }

  @Delete('calendar/:id')
  removeCalendarEvent(@Param('id') id: string) {
    return this.universityService.removeCalendarEvent(+id);
  }

  // Notifications
  @Get('notifications')
  getNotifications(@Query() query: any) {
    return this.universityService.getNotifications(query);
  }

  @Post('notifications')
  createNotification(@Body() body: any) {
    return this.universityService.createNotification(body);
  }

  @Patch('notifications/:id/read')
  markAsRead(@Param('id') id: string) {
    return this.universityService.markAsRead(+id);
  }

  @Delete('notifications/:id')
  removeNotification(@Param('id') id: string) {
    return this.universityService.removeNotification(+id);
  }
}
