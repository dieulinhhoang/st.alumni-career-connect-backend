import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Survey } from '../database/entities/survey.entity';
import { SurveyResponse } from '../database/entities/survey-response.entity';
import { SurveyAnswer } from '../database/entities/survey-answer.entity';
import { Faculty } from '../database/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, SurveyResponse, SurveyAnswer, Faculty])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
