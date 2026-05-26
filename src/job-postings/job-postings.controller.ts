import { Controller, Get, Query } from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';

@Controller('job-postings')
export class JobPostingsController {
  constructor(private readonly service: JobPostingsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }
}
