import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('jobs')
// @UseGuards(JwtAuthGuard, PermissionGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @RequirePermission('jobs:create')
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  @RequirePermission('jobs:read')
  findAll(@Query() query: any) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('jobs:read')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission('jobs:update')
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobsService.update(+id, updateJobDto);
  }

  @Delete(':id')
  @RequirePermission('jobs:delete')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(+id);
  }

  @Post(':id/approve')
  @RequirePermission('jobs:update')
  approve(@Param('id') id: string) {
    return this.jobsService.approve(+id);
  }

  @Post(':id/reject')
  @RequirePermission('jobs:update')
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.jobsService.reject(+id, reason);
  }

  @Get(':id/unemployed-alumni')
  @RequirePermission('jobs:read')
  previewUnemployedAlumni(@Param('id') id: string, @Query('surveyId') surveyId?: string) {
    return this.jobsService.previewUnemployedAlumni(+id, surveyId);
  }

  @Get(':id/notify-email-preview')
  @RequirePermission('jobs:read')
  previewEmailContent(@Param('id') id: string) {
    return this.jobsService.previewEmailContent(+id);
  }

  @Post(':id/notify-unemployed-alumni')
  @RequirePermission('jobs:update')
  notifyUnemployedAlumni(
    @Param('id') id: string,
    @Body() body: { surveyId?: string; emails?: string[] },
  ) {
    return this.jobsService.notifyUnemployedAlumni(+id, body?.surveyId, body?.emails);
  }
}
