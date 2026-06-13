import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportExportService } from './report-export.service';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { Faculty } from '../database/entities/faculty.entity';
import { Major } from '../database/entities/major.entity';
import { Student } from '../database/entities/student.entity';
import { FacultyReportSubmission } from '../database/entities/faculty-report-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlumniBatch,
      AlumniBatchResponse,
      Faculty,
      Major,
      Student,
      FacultyReportSubmission,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportExportService],
})
export class ReportsModule {}