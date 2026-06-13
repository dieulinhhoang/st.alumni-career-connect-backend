import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { AlumniBatchResponse } from '../database/entities/alumni-batch-response.entity';
import { Major } from '../database/entities/major.entity';
import { Student } from '../database/entities/student.entity';
import { Graduation } from '../database/entities/graduation.entity';
import { GraduationStudent } from '../database/entities/graduation-student.entity';
import { FacultyReportSubmission } from '../database/entities/faculty-report-submission.entity';
import { SurveysModule } from '../surveys/surveys.module';
import { LegacyImportController } from './legacy-import.controller';
import { LegacyImportService } from './legacy-import.service';
import { LegacyReportParserService } from './legacy-report-parser.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlumniBatch,
      AlumniBatchResponse,
      Major,
      Student,
      Graduation,
      GraduationStudent,
      FacultyReportSubmission,
    ]),
    SurveysModule,
  ],
  controllers: [LegacyImportController],
  providers: [LegacyImportService, LegacyReportParserService],
})
export class LegacyImportModule {}
