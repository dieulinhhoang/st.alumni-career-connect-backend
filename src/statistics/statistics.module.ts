import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { SurveyQuestion } from '../database/entities/survey-question.entity';
import { SurveyAnswer } from '../database/entities/survey-answer.entity';
import { SurveyResponse } from '../database/entities/survey-response.entity';
import { Survey } from '../database/entities/survey.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyQuestion, SurveyAnswer, SurveyResponse, Survey])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
