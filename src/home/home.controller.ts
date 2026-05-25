import { Controller, Get, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getHomeStats() {
    return this.homeService.getHomeStats();
  }
}
