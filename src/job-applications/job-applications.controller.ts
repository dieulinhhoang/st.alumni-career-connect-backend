import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JobApplicationsService } from './job-applications.service';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';

@Controller('job-applications')
export class JobApplicationsController {
  constructor(private readonly service: JobApplicationsService) {}

  // Public — ứng viên gửi hồ sơ, không cần auth
  @Post()
  create(@Body() dto: CreateJobApplicationDto) {
    return this.service.create(dto);
  }

  // Lấy ứng viên theo job (dùng cho enterprise portal)
  @Get('by-job/:jobId')
  findByJob(@Param('jobId') jobId: string, @Query() query: any) {
    return this.service.findByJob(+jobId, query);
  }

  // Lấy tất cả ứng viên của 1 doanh nghiệp
  @Get('by-enterprise/:enterpriseId')
  findByEnterprise(@Param('enterpriseId') enterpriseId: string, @Query() query: any) {
    return this.service.findByEnterprise(+enterpriseId, query);
  }
}
