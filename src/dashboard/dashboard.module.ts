import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Student } from 'src/database/entities/student.entity';
import { Faculty } from 'src/database/entities/faculty.entity';
import { Major } from 'src/database/entities/major.entity';
import { AlumniBatch } from 'src/database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from 'src/database/entities/alumni-batch-response.entity';
import { FacultyReportSubmission } from 'src/database/entities/faculty-report-submission.entity';
import { ReportsService } from 'src/reports/reports.service';
import { ReportsModule } from 'src/reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Faculty,
      Major,
      AlumniBatch,
      AlumniBatchResponse,
      FacultyReportSubmission,
    ]),
    ReportsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}