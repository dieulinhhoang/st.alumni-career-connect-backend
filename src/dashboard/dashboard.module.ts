import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Faculty } from 'src/database/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Enterprise, Job, Faculty])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
