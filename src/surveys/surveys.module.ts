import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysController, QuestionBankController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { Survey } from '../database/entities/survey.entity';
import { SurveySection } from '../database/entities/survey-section.entity';
import { SurveyQuestion } from '../database/entities/survey-question.entity';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, SurveySection, SurveyQuestion, AlumniBatch])],
  controllers: [SurveysController, QuestionBankController],
  providers: [SurveysService],
  exports: [SurveysService],
})
export class SurveysModule {}