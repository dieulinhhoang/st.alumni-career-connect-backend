import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobApplication } from 'src/database/entities/job-application.entity';
import { Job } from 'src/database/entities/job.entity';
import { JobApplicationsController } from './job-applications.controller';
import { JobApplicationsService } from './job-applications.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobApplication, Job])],
  controllers: [JobApplicationsController],
  providers: [JobApplicationsService],
  exports: [JobApplicationsService],
})
export class JobApplicationsModule {}
