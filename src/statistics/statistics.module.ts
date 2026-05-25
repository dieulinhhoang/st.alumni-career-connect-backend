import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Student } from '../students/entities/student.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { Job } from '../jobs/entities/job.entity';
import { Faculty } from '../faculty/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Enterprise, Job, Faculty])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
